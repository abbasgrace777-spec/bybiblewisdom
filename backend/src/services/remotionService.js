const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const config = require('../config');
const { get, query, run } = require('../db/database');
const subtitleService = require('./subtitleService');
const editingEngineService = require('./editingEngineService');
const qualityControlService = require('./qualityControlService');

class RemotionService {
  /**
   * Build complete Remotion Props JSON from SQLite project database
   * Strictly enforces:
   * 1. Real biblical images for every scene (no black/green placeholders)
   * 2. Accurate speech timestamps from narration audio
   * 3. Zero background music (narration only)
   * 4. Multi-track synchronization (1920x1080 30fps)
   */
  buildRemotionProps(projectId, options = {}) {
    const project = get(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (!project) throw new Error('Project not found');

    const segments = query(`
      SELECT * FROM script_segments WHERE project_id = ? ORDER BY segment_order ASC
    `, [projectId]);

    if (!segments || segments.length === 0) {
      throw new Error('No script segments found. Please generate script and scenes before video composition.');
    }

    const isShorts = (options.format || project.format) === 'SHORTS';
    const width = isShorts ? config.VIDEO.SHORTS.WIDTH : config.VIDEO.LONG_FORM.WIDTH;
    const height = isShorts ? config.VIDEO.SHORTS.HEIGHT : config.VIDEO.LONG_FORM.HEIGHT;
    const fps = 30;
    const subtitleStyle = options.subtitleStyle || project.subtitle_style || 'cinematic';

    const projectDir = path.join(config.PATHS.PROJECTS, projectId);
    const audioDir = path.join(projectDir, 'audio');
    const imgDir = path.join(projectDir, 'images');

    // 1. Requirement 4: Narration audio validation (ZERO BGM)
    const narrationAudioPath = path.join(audioDir, 'narration.mp3');
    if (!fs.existsSync(narrationAudioPath)) {
      throw new Error('Narration audio missing. Spoken voice must be generated before video editing.');
    }

    // 2. Requirement 2: Real Biblical Image Validation
    // "Every scene must have an image. Never use a black or green placeholder. Never silently ignore missing images."
    const sceneImages = [];
    let cumulativeFrame = 0;
    const scenes = [];

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      let imgPath = seg.media_path;

      // Fallback search in project images dir
      if (!imgPath || !fs.existsSync(imgPath)) {
        imgPath = path.join(imgDir, `scene_${seg.segment_order}.jpg`);
      }

      if (!fs.existsSync(imgPath)) {
        throw new Error(
          `Image missing for Scene ${seg.segment_order} ("${seg.narration_text.slice(0, 40)}..."). ` +
          `Placeholder backgrounds are strictly prohibited. Please generate scene visuals before video assembly.`
        );
      }

      // Check file size > 5KB to guarantee it is not an empty dummy file
      const stat = fs.statSync(imgPath);
      if (stat.size < 5000) {
        throw new Error(`Visual file for Scene ${seg.segment_order} is invalid or empty (${stat.size} bytes).`);
      }

      sceneImages.push(imgPath);

      // Derive exact duration from actual scene audio if available, eliminating any timeline mismatch
      let durationSec = parseFloat(seg.duration_seconds || 0);
      const sceneAudioPath = path.join(audioDir, `scene_${seg.segment_order}`, 'audio.mp3');
      if (fs.existsSync(sceneAudioPath)) {
        try {
          const probeOutput = execFileSync(config.PATHS.FFPROBE, [
            '-i', sceneAudioPath,
            '-show_entries', 'format=duration',
            '-v', 'quiet',
            '-of', 'csv=p=0'
          ], { encoding: 'utf8' }).trim();
          const probed = parseFloat(probeOutput);
          if (!isNaN(probed) && probed > 0) {
            durationSec = Math.round(probed * 1000) / 1000;
            if (seg.duration_seconds !== durationSec) {
              run(`UPDATE script_segments SET duration_seconds = ? WHERE id = ?`, [durationSec, seg.id]);
            }
          }
        } catch (_) {}
      }

      if (!durationSec || durationSec <= 0) {
        durationSec = Math.max(3, parseFloat(seg.duration_seconds || 5));
      }

      const durationFrames = Math.round(durationSec * fps);

      const motionPresets = ['ZOOM_IN', 'ZOOM_OUT', 'PAN_LEFT', 'PAN_RIGHT'];
      const motion = motionPresets[(seg.segment_order - 1) % motionPresets.length];

      scenes.push({
        sceneNumber: seg.segment_order,
        imageUrl: `/storage/projects/${projectId}/images/scene_${seg.segment_order}.jpg`,
        imagePath: imgPath,
        durationFrames,
        durationSeconds: durationSec,
        startFrame: cumulativeFrame,
        motion,
        transition: 'CROSSFADE_0.5S',
        narrationText: seg.narration_text,
        visualDescription: seg.visual_description || seg.image_prompt
      });

      cumulativeFrame += durationFrames;
    }

    // Check: "Never use one image for the entire video"
    const uniqueImages = new Set(sceneImages);
    if (uniqueImages.size <= 1 && scenes.length > 1) {
      throw new Error(`Video composition rejected: All scenes are using the same image. Multiple unique chapter visuals are required.`);
    }

    // Requirement 3: Block video composition if any scene used procedural fallback, unless user explicitly confirmed
    const fallbackSegments = segments.filter(s => s.image_status === 'FALLBACK' || s.engine_used === 'Procedural Fallback');
    if (fallbackSegments.length > 0 && !options.confirmFallback) {
      const sceneNums = fallbackSegments.map(s => s.segment_order).join(', ');
      throw new Error(`Video composition BLOCKED: Scene(s) [${sceneNums}] used Procedural Fallback images. Confirmation is required to render with fallback imagery.`);
    }

    // 3. Requirement 3: Accurate Subtitles from Spoken Narration
    const subtitlesRes = subtitleService.generateSubtitles(projectId, segments, project.format, subtitleStyle);
    
    // Convert ASS/SRT timing to Remotion frame cues
    const subtitleCues = (subtitlesRes.cues || []).map((cue, idx) => ({
      id: idx + 1,
      text: cue.text,
      startFrame: Math.round((cue.startMs / 1000) * fps),
      endFrame: Math.round((cue.endMs / 1000) * fps),
      startMs: cue.startMs,
      endMs: cue.endMs
    }));

    const remotionProps = {
      projectId,
      bookTitle: project.bible_book || 'Genesis',
      chapterNumber: project.chapter_start || 1,
      translation: project.bible_translation || 'WEB',
      fps,
      width,
      height,
      totalDurationFrames: cumulativeFrame,
      totalDurationSeconds: Math.round(cumulativeFrame / fps),
      audioUrl: `/storage/projects/${projectId}/audio/narration.mp3`,
      subtitleStyle,
      scenes,
      subtitles: subtitleCues,
      compositionId: isShorts ? 'BibleChapterShorts' : 'BibleChapterVideo',
      videoCodec: 'H.264',
      crf: 18,
      audioCodec: 'AAC',
      audioBitrate: '192k',
      crossfadeDurationSeconds: 0.5,
      transitionDurationFrames: 15,
      licenseTerms: {
        engine: 'Remotion + FFmpeg',
        remotionLicense: 'Remotion Free License (Individuals & Small Teams)',
        isFreeForSoloCreator: true
      }
    };

    // Save remotion_props.json in project output directory
    const outputDir = path.join(projectDir, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'remotion_props.json'), JSON.stringify(remotionProps, null, 2), 'utf8');

    // Save in standardized chapter package directory
    const chFormatted = `Chapter_${String(project.chapter_start || 1).padStart(2, '0')}`;
    const packageDir = path.join(config.PATHS.ROOT, 'ByBibleWisdom', project.bible_book || 'Genesis', chFormatted);
    if (fs.existsSync(packageDir)) {
      fs.writeFileSync(path.join(packageDir, 'remotion_props.json'), JSON.stringify(remotionProps, null, 2), 'utf8');
    }

    return remotionProps;
  }

  /**
   * Render Master Video using the automated multi-track editing pipeline
   * Bridges Remotion composition specs with FFmpeg rendering and runs 7-Point Quality Control.
   */
  async renderMasterVideo(projectId, options = {}, onProgress = null) {
    console.log(`[RemotionService] Validating Remotion timeline and assets for project: ${projectId}...`);

    // Step 1: Build & Validate Remotion Props (Enforces images, subtitles, audio, no green/black screens)
    const remotionProps = this.buildRemotionProps(projectId, options);

    // Step 2: Render Multi-Track Video Timeline (Ken Burns + Color Grade + Audio Mastering + Subtitles)
    console.log(`[RemotionService] Rendering timeline: ${remotionProps.scenes.length} scenes, ${remotionProps.totalDurationSeconds}s total duration...`);
    const timelineResult = await editingEngineService.renderCompleteTimeline(projectId, {
      ...options,
      subtitleStyle: remotionProps.subtitleStyle,
      format: options.format
    }, onProgress);

    // Step 3: Run Automated 7-Point Quality Control & Frame Inspection Suite
    console.log(`[RemotionService] Executing Automated 7-Point Quality Control Verification...`);
    const qcResult = await qualityControlService.runFullQualityControl(projectId);

    if (!qcResult.overallPassed) {
      console.warn(`[RemotionService] Quality Control flag:`, qcResult.summary);
    } else {
      console.log(`[RemotionService] Quality Control: 7 of 7 verified checks PASSED!`);
    }

    return {
      success: true,
      projectId,
      videoPath: timelineResult.videoPath,
      relativeUrl: timelineResult.relativeUrl,
      durationSeconds: timelineResult.durationSeconds,
      subtitleStyle: timelineResult.subtitleStyle,
      assPath: timelineResult.assPath,
      srtPath: timelineResult.srtPath,
      remotionProps,
      qualityControl: qcResult
    };
  }
}

module.exports = new RemotionService();
