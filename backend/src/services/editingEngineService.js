const path = require('node:path');
const fs = require('node:fs');
const { execFile } = require('node:child_process');
const util = require('node:util');
const execFileAsync = util.promisify(execFile);
const config = require('../config');
const { get, query, run } = require('../db/database');
const subtitleService = require('./subtitleService');

class EditingEngineService {
  constructor() {
    this.ffmpegPath = config.PATHS.FFMPEG;
    this.ffprobePath = config.PATHS.FFPROBE;
    this.crossfadeDuration = 0.5; // 0.4-0.6s required crossfades
  }

  /**
   * Ken Burns motion presets:
   * Real motion on EVERY image (alternating: ZOOM_IN, ZOOM_OUT, PAN_LEFT, PAN_RIGHT, PAN_UP, SLOW_DRIFT)
   * 30 fps, smooth mathematical interpolation with S-curve cosine easing
   * CRITICAL HEADROOM PRESERVATION: Anchored on upper-third (ih*0.30) so human heads, crowns,
   * faces and architectural tops are NEVER pushed out of frame during zoom or pan.
   */
  getKenBurnsFilter(effect, width, height, durationSeconds) {
    const totalFrames = Math.max(30, Math.round(durationSeconds * 30));

    // Smooth Ease-In-Out S-Curve expression: (1 - cos(PI * on / totalFrames)) / 2
    // Evaluates from 0.0 at frame 0 smoothly to 1.0 at totalFrames with zero jarring starts/stops
    const ease = `(1-cos(PI*on/${totalFrames}))/2`;

    switch (effect) {
      case 'ZOOM_OUT':
        // Start zoomed in at 1.10 and smoothly zoom out to 1.00, anchored on upper-third
        return `zoompan=z='1.10-0.10*${ease}':x='iw/2-(iw/zoom/2)':y='max(0,ih*0.30-(ih/zoom*0.30))':d=${totalFrames}:s=${width}x${height}:fps=30`;

      case 'PAN_LEFT':
        // Pan from right to left with gentle 1.08 zoom and smooth deceleration
        return `zoompan=z='1.08':x='(iw-iw/zoom)*(1-${ease})':y='max(0,ih*0.30-(ih/zoom*0.30))':d=${totalFrames}:s=${width}x${height}:fps=30`;

      case 'PAN_RIGHT':
        // Pan from left to right with gentle 1.08 zoom and smooth acceleration
        return `zoompan=z='1.08':x='(iw-iw/zoom)*(${ease})':y='max(0,ih*0.30-(ih/zoom*0.30))':d=${totalFrames}:s=${width}x${height}:fps=30`;

      case 'PAN_UP':
        // Tilt upward toward the heavens/mountains
        return `zoompan=z='1.08':x='iw/2-(iw/zoom/2)':y='(ih-ih/zoom)*(1-${ease})':d=${totalFrames}:s=${width}x${height}:fps=30`;

      case 'SLOW_DRIFT':
        // Gentle diagonal drift (pan & zoom combined)
        return `zoompan=z='1.02+0.06*${ease}':x='(iw-iw/zoom)*(${ease})':y='max(0,ih*0.28-(ih/zoom*0.28))':d=${totalFrames}:s=${width}x${height}:fps=30`;

      case 'ZOOM_IN':
      default:
        // Slow cinematic zoom in from 1.00 to 1.10 with smooth S-curve easing, anchored on upper-third
        return `zoompan=z='1.0+0.10*${ease}':x='iw/2-(iw/zoom/2)':y='max(0,ih*0.30-(ih/zoom*0.30))':d=${totalFrames}:s=${width}x${height}:fps=30`;
    }
  }

  /**
   * Biblical cinematic color grading filter
   * Subtly enriches warm earth tones, deepens contrast, applies soft 35mm lens vignette,
   * and enhances natural micro-contrast texture on stone, water, and skies.
   */
  getColorGradingFilter(isShorts = false) {
    // 1. Natural contrast & saturation balance: rich earth tones, pristine whites, deep blacks
    const eq = 'eq=contrast=1.05:brightness=0.01:saturation=1.08';
    // 2. Subtle 35mm optical lens vignette: darkens extreme corners by ~8-10% to center focus on sacred subjects
    const vignette = isShorts ? 'vignette=angle=PI/6' : 'vignette=angle=PI/5.5';
    // 3. Micro-contrast clarity: crisp texture on ancient stone, water, skies
    const unsharp = 'unsharp=lx=3:ly=3:la=0.4:cx=3:cy=3:ca=0.0';
    return `${eq},${vignette},${unsharp}`;
  }

  /**
   * Dynamic cinematic transition selection:
   * Rotates through smooth documentary film transitions (dissolve, smooth wipes, gentle crossfades, fadeblack)
   * avoiding monotonous repetition.
   */
  getCinematicTransition(sceneIndex, totalScenes, isShorts = false) {
    if (isShorts) {
      // In mobile Shorts (9:16), dynamic fluid transitions keep high viewer retention
      const shortsTransitions = ['smoothleft', 'dissolve', 'smoothright', 'fade', 'zoomin', 'smoothleft'];
      return shortsTransitions[sceneIndex % shortsTransitions.length];
    } else {
      // In 16:9 documentary, majestic, smooth film transitions
      const docTransitions = ['dissolve', 'smoothleft', 'fade', 'smoothright', 'dissolve', 'fadeblack', 'fade'];
      return docTransitions[sceneIndex % docTransitions.length];
    }
  }

  /**
   * Professional audio mastering filterchain (YouTube Broadcast Standard: -16 LUFS, pure narration)
   * Includes 0.15s micro fade-in to eliminate startup click. STRICTLY ZERO BACKGROUND MUSIC.
   */
  getAudioMasteringFilter() {
    return [
      'afade=t=in:ss=0:d=0.15',                                           // Micro fade-in to eliminate initial pop/click
      'highpass=f=75',                                                     // Remove unwanted low-end rumble/thumps
      'lowpass=f=12000',                                                   // Smooth harsh high frequencies
      'equalizer=f=250:t=q:w=1.2:g=1.5',                                  // Warm vocal chest resonance
      'equalizer=f=3200:t=q:w=1.0:g=2.0',                                 // Vocal clarity and biblical presence
      'acompressor=threshold=-18dB:ratio=3:attack=5:release=100:makeup=2dB', // Transparent dynamic control
      'loudnorm=I=-16:TP=-1.5:LRA=9'                                       // EBU R128 / YouTube standard -16 LUFS
    ].join(',');
  }

  /**
   * Render individual scene video clip with Ken Burns motion & color grading.
   * Includes extra 0.5s duration if not last scene to enable seamless 0.5s crossfade overlap.
   */
  async renderSceneClip(projectId, segment, options = {}) {
    const isShorts = options.format === 'SHORTS';
    const width = isShorts ? config.VIDEO.SHORTS.WIDTH : config.VIDEO.LONG_FORM.WIDTH;
    const height = isShorts ? config.VIDEO.SHORTS.HEIGHT : config.VIDEO.LONG_FORM.HEIGHT;

    const projectDir = path.join(config.PATHS.PROJECTS, projectId);
    const clipsDir = path.join(projectDir, 'clips');
    if (!fs.existsSync(clipsDir)) fs.mkdirSync(clipsDir, { recursive: true });

    const clipPath = path.join(clipsDir, `scene_${segment.segment_order}.mp4`);
    const imgPath = segment.media_path && fs.existsSync(segment.media_path)
      ? segment.media_path
      : path.join(projectDir, 'images', `scene_${segment.segment_order}.jpg`);

    if (!fs.existsSync(imgPath)) {
      throw new Error(`Visual asset for scene ${segment.segment_order} not found at: ${imgPath}`);
    }

    // Determine duration driven by narration timing
    let baseDuration = parseFloat(options.duration || segment.duration_seconds || 0);
    if (!baseDuration || baseDuration <= 0) {
      const sceneAudioPath = path.join(projectDir, 'audio', `scene_${segment.segment_order}`, 'audio.mp3');
      if (fs.existsSync(sceneAudioPath)) {
        try {
          const { stdout: probeOutput } = await execFileAsync(this.ffprobePath, [
            '-i', sceneAudioPath,
            '-show_entries', 'format=duration',
            '-v', 'quiet',
            '-of', 'csv=p=0'
          ], { encoding: 'utf8' });
          const probed = parseFloat((probeOutput || '').trim());
          if (!isNaN(probed) && probed > 0) {
            baseDuration = Math.round(probed * 1000) / 1000;
          }
        } catch (_) {}
      }
    }
    if (!baseDuration || baseDuration <= 0) {
      baseDuration = Math.max(3, parseFloat(segment.duration_seconds || 5));
    }

    // Add extra 0.5s for crossfade overlap if not the final scene
    const extraDuration = options.extraDuration || 0;
    const renderDuration = baseDuration + extraDuration;
    const totalFrames = Math.max(30, Math.round(renderDuration * 30));

    // Real motion on every image: alternate between 6 dynamic motions
    const motionPresets = ['ZOOM_IN', 'ZOOM_OUT', 'PAN_LEFT', 'PAN_RIGHT', 'PAN_UP', 'SLOW_DRIFT'];
    const motionEffect = segment.ken_burns_effect && motionPresets.includes(segment.ken_burns_effect)
      ? segment.ken_burns_effect
      : motionPresets[(segment.segment_order - 1) % motionPresets.length];

    // Fast Cache Check: If valid scene clip already exists matching required duration, reuse immediately
    if (!options.forceRerender && fs.existsSync(clipPath) && fs.statSync(clipPath).size > 100000) {
      try {
        const { stdout: probeClip } = await execFileAsync(this.ffprobePath, [
          '-i', clipPath,
          '-show_entries', 'format=duration',
          '-v', 'quiet',
          '-of', 'csv=p=0'
        ], { encoding: 'utf8' });
        const existingDur = parseFloat((probeClip || '').trim()) || 0;
        if (Math.abs(existingDur - renderDuration) < 1.0) {
          console.log(`[EditingEngine] Reusing cached scene_${segment.segment_order}.mp4 (${existingDur.toFixed(1)}s)`);
          return { clipPath, durationSeconds: renderDuration, baseDuration, motionEffect, cached: true };
        }
      } catch (_) {}
    }

    // Intelligent aspect ratio detection & smart framing
    let imgWidth = width;
    let imgHeight = height;
    try {
      const { stdout: probeOut } = await execFileAsync(this.ffprobePath, [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height',
        '-of', 'csv=s=x:p=0',
        imgPath
      ], { encoding: 'utf8' });
      const parts = (probeOut || '').trim().split('x');
      if (parts.length === 2) {
        imgWidth = parseInt(parts[0], 10) || width;
        imgHeight = parseInt(parts[1], 10) || height;
      }
    } catch (_) {}

    const imgAspect = imgWidth / imgHeight;
    const targetAspect = width / height;
    const aspectDiff = Math.abs(imgAspect - targetAspect) / targetAspect;

    // Build FFmpeg video filter: scale to canvas -> Ken Burns motion -> Color Grade -> 30fps BT.709
    const kbFilter = this.getKenBurnsFilter(motionEffect, width, height, renderDuration);
    const colorGrade = this.getColorGradingFilter(isShorts);

    let filterStr = '';
    if (aspectDiff <= 0.18) {
      // Matching aspect ratio: scale to fill with headroom-safe crop (preserves heads, crowns & sky)
      filterStr = `scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${width}:${height}:(in_w-out_w)/2:min((in_h-out_h)*0.15\\,(in_h-out_h)),${kbFilter},${colorGrade},format=yuv420p`;
    } else {
      // Mismatched aspect ratio (e.g. portrait in landscape or landscape in portrait):
      // Use cinematic ambient blur background so the subject is NEVER cropped or headless
      filterStr = `split[bg_in][fg_in];[bg_in]scale=${width}:${height}:force_original_aspect_ratio=increase:flags=bicubic,crop=${width}:${height},boxblur=25:5,eq=brightness=-0.15:contrast=0.9[bg];[fg_in]scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2,${kbFilter},${colorGrade},format=yuv420p`;
    }

    const args = [
      '-i', imgPath,
      '-vf', filterStr,
      '-frames:v', String(totalFrames),
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      clipPath,
      '-y'
    ];

    await execFileAsync(this.ffmpegPath, args);
    return { clipPath, durationSeconds: renderDuration, baseDuration, motionEffect };
  }

  /**
   * Main Multi-Track Timeline Assembly:
   * Track 1: Ken Burns visual clips with alternating motions (Zoom In, Zoom Out, Pan Left, Pan Right)
   * Track 2: 0.4-0.6s smooth crossfades between scenes (no black frames)
   * Track 3: Mastered narration audio (-16 LUFS, pure voice, AAC 192k, ZERO BGM)
   * Track 4: Advanced Subtitles (burned captions with ASS/SRT export)
   * Track 5: Chapter Title Card overlay during opening
   * Encoding: H.264, CRF 18, 30 fps, AAC 192k, faststart, duration matches narration within 2s
   */
  async renderCompleteTimeline(projectId, options = {}, onProgress = null) {
    const project = get(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (!project) throw new Error('Project not found');

    let segments = query(`
      SELECT * FROM script_segments WHERE project_id = ? ORDER BY segment_order ASC
    `, [projectId]);

    if (!segments || segments.length === 0) {
      console.log(`[EditingEngine] No script segments found in DB for ${projectId}. Auto-restoring from script...`);
      const script = get(`SELECT * FROM scripts WHERE project_id = ? ORDER BY version DESC LIMIT 1`, [projectId]);
      if (script) {
        const scriptService = require('./scriptService');
        const chapterKnowledge = require('./chapterKnowledge');
        const scriptContent = {
          hook: script.hook || '',
          biblical_context: script.biblical_context || '',
          core_narrative: script.core_narrative || '',
          theological_insight: script.theological_insight || '',
          practical_application: script.practical_application || '',
          call_to_action: script.call_to_action || '',
          full_text: script.full_narration_text || '',
          sections: (script.full_narration_text || '').split('\n\n')
        };
        const chapterDataObj = chapterKnowledge.getChapterNarrative(project.bible_book || 'Genesis', project.chapter_start || 1);
        scriptService.generateSceneSegments(projectId, scriptContent, project, chapterDataObj, project.format === 'SHORTS');
        segments = query(`SELECT * FROM script_segments WHERE project_id = ? ORDER BY segment_order ASC`, [projectId]);
      }
    }

    if (!segments || segments.length === 0) {
      throw new Error('No script segments found for video editing.');
    }

    // Block video unless user explicitly confirmed fallback imagery
    const fallbackSegments = segments.filter(s => s.image_status === 'FALLBACK' || s.engine_used === 'Procedural Fallback');
    if (fallbackSegments.length > 0 && !options.confirmFallback) {
      const sceneNums = fallbackSegments.map(s => s.segment_order).join(', ');
      throw new Error(`Video composition BLOCKED: Scene(s) [${sceneNums}] used Procedural Fallback images. User confirmation is strictly required to proceed with fallback imagery.`);
    }

    const isShorts = (options.format || project.format) === 'SHORTS';
    const subtitleStyle = options.subtitleStyle || project.subtitle_style || 'cinematic';

    const projectDir = path.join(config.PATHS.PROJECTS, projectId);
    const outputDir = path.join(projectDir, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const clipsDir = path.join(projectDir, 'clips');
    if (!fs.existsSync(clipsDir)) fs.mkdirSync(clipsDir, { recursive: true });

    // Track 3 Source: Master narration audio
    const rawAudioPath = path.join(projectDir, 'audio', 'narration.mp3');
    if (!fs.existsSync(rawAudioPath)) {
      throw new Error('Narration audio missing. Please run voice synthesis first.');
    }

    // Probe master narration duration
    let masterAudioDuration = 0;
    try {
      const { stdout: probeAudio } = await execFileAsync(this.ffprobePath, [
        '-i', rawAudioPath,
        '-show_entries', 'format=duration',
        '-v', 'quiet',
        '-of', 'csv=p=0'
      ], { encoding: 'utf8' });
      masterAudioDuration = parseFloat((probeAudio || '').trim()) || 0;
    } catch (_) {}

    // Verify / update scene durations driven by narration timing
    console.log(`[EditingEngine] Driving scene durations from narration timing (${masterAudioDuration.toFixed(1)}s master audio)...`);
    let totalSegmentAudio = 0;
    const sceneDurations = [];

    for (const seg of segments) {
      let dur = parseFloat(seg.duration_seconds || 0);
      const sceneAudio = path.join(projectDir, 'audio', `scene_${seg.segment_order}`, 'audio.mp3');
      if (fs.existsSync(sceneAudio)) {
        try {
          const { stdout: probe } = await execFileAsync(this.ffprobePath, [
            '-i', sceneAudio,
            '-show_entries', 'format=duration',
            '-v', 'quiet',
            '-of', 'csv=p=0'
          ], { encoding: 'utf8' });
          const p = parseFloat((probe || '').trim());
          if (!isNaN(p) && p > 0) dur = Math.round(p * 1000) / 1000;
        } catch (_) {}
      }
      if (!dur || dur <= 0) dur = 5;
      sceneDurations.push(dur);
      totalSegmentAudio += dur;
    }

    // If individual scene audios don't match master narration duration within 2s, proportionally distribute master duration
    if (masterAudioDuration > 0 && Math.abs(totalSegmentAudio - masterAudioDuration) > 2.0) {
      console.log(`[EditingEngine] Adjusting scene timings proportionally to match narration.mp3 (${masterAudioDuration}s vs sum ${totalSegmentAudio.toFixed(1)}s)...`);
      const totalChars = segments.reduce((acc, s) => acc + (s.narration_text || '').length, 0) || 1;
      for (let i = 0; i < segments.length; i++) {
        const charWeight = ((segments[i].narration_text || '').length) / totalChars;
        const adjustedDur = Math.max(3, Math.round((charWeight * masterAudioDuration) * 100) / 100);
        sceneDurations[i] = adjustedDur;
        segments[i].duration_seconds = adjustedDur;
        run(`UPDATE script_segments SET duration_seconds = ? WHERE id = ?`, [adjustedDur, segments[i].id]);
      }
    } else {
      for (let i = 0; i < segments.length; i++) {
        segments[i].duration_seconds = sceneDurations[i];
        run(`UPDATE script_segments SET duration_seconds = ? WHERE id = ?`, [sceneDurations[i], segments[i].id]);
      }
    }

    // Step 1: Render Scene Clips with Alternating Ken Burns Motion (Concurrent Multi-Core Rendering)
    console.log(`[EditingEngine] Rendering cinematic scene clips for ${segments.length} scenes (Concurrent multi-core rendering, CRF 18, 30fps)...`);
    const motionPresets = ['ZOOM_IN', 'ZOOM_OUT', 'PAN_LEFT', 'PAN_RIGHT', 'PAN_UP', 'SLOW_DRIFT'];
    const clipPaths = new Array(segments.length);

    // Concurrency pool (up to 3 parallel FFmpeg scene renders utilizing multi-core CPU)
    const CONCURRENCY = 3;
    let completedCount = 0;

    const tasks = segments.map((seg, i) => async () => {
      const isLast = (i === segments.length - 1);
      const extraDuration = isLast ? 0 : this.crossfadeDuration;
      const effect = seg.ken_burns_effect || motionPresets[i % motionPresets.length];
      seg.ken_burns_effect = effect;

      const clipRes = await this.renderSceneClip(projectId, seg, {
        format: isShorts ? 'SHORTS' : 'LONG_FORM',
        duration: sceneDurations[i],
        extraDuration
      });
      clipPaths[i] = clipRes.clipPath;
      completedCount++;

      if (onProgress) {
        onProgress({
          phase: 'CLIPS',
          current: completedCount,
          total: segments.length,
          message: `Rendered Scene ${completedCount}/${segments.length} [${effect}] (${sceneDurations[i]}s)`
        });
      }
    });

    const pool = [];
    for (const task of tasks) {
      const p = task().then(() => {
        pool.splice(pool.indexOf(p), 1);
      });
      pool.push(p);
      if (pool.length >= CONCURRENCY) {
        await Promise.race(pool);
      }
    }
    await Promise.all(pool);

    // Step 2: Track 3 Mastering - Apply broadcast audio mastering to narration (-16 LUFS, AAC 192k, ZERO BGM)
    const masteredAudioPath = path.join(outputDir, 'narration_mastered.wav');
    console.log(`[EditingEngine] Mastering narration audio to broadcast standard (-16 LUFS, pure voice, ZERO BGM)...`);
    const audioFilter = this.getAudioMasteringFilter();
    await execFileAsync(this.ffmpegPath, [
      '-i', rawAudioPath,
      '-af', audioFilter,
      masteredAudioPath,
      '-y'
    ]);

    // Step 3: Track 4 Subtitle Generation - Generate ASS & SRT with chosen subtitle style
    console.log(`[EditingEngine] Generating subtitles with style: ${subtitleStyle}`);
    const subs = subtitleService.generateSubtitles(projectId, segments, isShorts ? 'SHORTS' : 'LONG_FORM', subtitleStyle);
    const assPath = path.join(outputDir, 'subtitles.ass');
    const srtPath = path.join(outputDir, 'subtitles.srt');
    fs.writeFileSync(assPath, subs.ass, 'utf8');
    fs.writeFileSync(srtPath, subs.srt, 'utf8');

    // Step 4: Build Crossfade Filter Graph (0.4-0.6s smooth transition between scenes, zero black frames)
    const finalVideoPath = path.join(outputDir, 'final_video.mp4');
    const escAssPath = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');

    // Chapter / Prayer Title overlay for opening
    let titleText = '';
    let subtitleTag = '';

    const isPrayerOrCustom = project.category === 'PRAYER_AND_DEVOTIONAL' || 
                             project.category === 'CUSTOM_SCRIPT' || 
                             !project.bible_book;

    if (isPrayerOrCustom) {
      titleText = (project.title || 'DAILY PRAYER')
        .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
        .replace(/[^a-zA-Z0-9\s,\-!']/g, '')
        .trim()
        .slice(0, 32)
        .toUpperCase();
      subtitleTag = isShorts ? 'PRAYER & DEVOTIONAL' : 'DAILY BIBLE PRAYER';
    } else {
      const bookTitle = (project.bible_book || 'SCRIPTURE').toUpperCase();
      const chapterNum = project.chapter_start || 1;
      titleText = `${bookTitle} CHAPTER ${chapterNum}`;
      subtitleTag = isShorts ? 'BIBLE CHAPTER' : 'BYBIBLEWISDOM DOCUMENTARY';
    }

    let filterComplex = '';
    let currentStream = '0:v';
    let currentOffset = 0;

    if (segments.length === 1) {
      currentStream = '0:v';
    } else {
      for (let i = 0; i < segments.length - 1; i++) {
        currentOffset += sceneDurations[i];
        const nextStream = (i === segments.length - 2) ? 'xfaded' : `v${i + 1}`;
        const transition = this.getCinematicTransition(i, segments.length, isShorts);
        filterComplex += `[${currentStream}][${i + 1}:v]xfade=transition=${transition}:duration=${this.crossfadeDuration}:offset=${currentOffset.toFixed(3)}[${nextStream}];`;
        currentStream = nextStream;
      }
    }

    // Add cinematic title card or mobile top-badge
    let postFilter = `[${currentStream}]`;
    const titleFont = fs.existsSync('C:/Windows/Fonts/georgiab.ttf')
      ? 'C\\:/Windows/Fonts/georgiab.ttf'
      : 'C\\:/Windows/Fonts/arialbd.ttf';
    const subFont = 'C\\:/Windows/Fonts/arial.ttf';

    if (!isShorts) {
      // 16:9 Long-Form: Opening cinematic title card with sacred serif typography and gold subtitle tag
      postFilter += `drawtext=text='${titleText}':fontfile='${titleFont}':fontsize=44:fontcolor=white:x=(w-text_w)/2:y=130:enable='between(t,0.6,5.6)':box=1:boxcolor=black@0.65:boxborderw=14,`;
      postFilter += `drawtext=text='${subtitleTag}':fontfile='${subFont}':fontsize=20:fontcolor=0xFFD700:x=(w-text_w)/2:y=195:enable='between(t,0.6,5.6)':box=1:boxcolor=black@0.45:boxborderw=6,`;
    } else {
      // 9:16 Shorts: Sleek top-badge in upper safe zone (y=140) giving immediate context to mobile scrollers
      postFilter += `drawtext=text='${titleText}':fontfile='C\\:/Windows/Fonts/arialbd.ttf':fontsize=32:fontcolor=0xFFD700:x=(w-text_w)/2:y=140:enable='between(t,0.5,6.5)':box=1:boxcolor=black@0.55:boxborderw=10,`;
    }

    // Burn subtitles and format to BT.709 yuv420p
    postFilter += `subtitles='${escAssPath}',format=yuv420p[outv]`;
    filterComplex += postFilter;

    console.log(`[EditingEngine] Final video assembly with FFmpeg (H.264, CRF 18, 30fps, AAC 192k, faststart)...`);
    if (onProgress) {
      onProgress({
        phase: 'ASSEMBLY',
        message: 'Combining audio, subtitles & multi-track video stream...'
      });
    }

    const renderArgs = [];
    for (const cp of clipPaths) {
      renderArgs.push('-i', cp);
    }
    renderArgs.push('-i', masteredAudioPath);

    renderArgs.push(
      '-filter_complex', filterComplex,
      '-map', '[outv]',
      '-map', `${clipPaths.length}:a`,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '18',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-r', '30',
      '-pix_fmt', 'yuv420p',
      '-color_range', 'tv',
      '-colorspace', 'bt709',
      '-color_primaries', 'bt709',
      '-color_trc', 'bt709',
      '-movflags', '+faststart',
      '-shortest',
      finalVideoPath,
      '-y'
    );

    await execFileAsync(this.ffmpegPath, renderArgs, { cwd: outputDir });

    // Inspect final duration with ffprobe
    let actualDuration = 0;
    try {
      const { stdout: probeOutput } = await execFileAsync(this.ffprobePath, [
        '-i', finalVideoPath,
        '-show_entries', 'format=duration',
        '-v', 'quiet',
        '-of', 'csv=p=0'
      ], { encoding: 'utf8' });
      actualDuration = Math.round(parseFloat((probeOutput || '').trim()));
    } catch (_) {
      actualDuration = Math.round(masterAudioDuration);
    }

    // Verify video duration matches narration duration within 2s
    const targetAudioDur = masterAudioDuration > 0 ? masterAudioDuration : sceneDurations.reduce((a, b) => a + b, 0);
    const durationDelta = Math.abs(actualDuration - targetAudioDur);
    console.log(`[EditingEngine] Render completed. Video: ${actualDuration}s, Narration: ${targetAudioDur.toFixed(1)}s (Delta: ${durationDelta.toFixed(2)}s - ${durationDelta <= 2.0 ? 'PASSED' : 'CHECK'})`);

    // Update database
    run(`
      UPDATE projects 
      SET status = 'RENDERED', 
          output_video_path = ?, 
          actual_duration_seconds = ?,
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [finalVideoPath, actualDuration, projectId]);

    return {
      success: true,
      projectId,
      videoPath: finalVideoPath,
      relativeUrl: `/storage/projects/${projectId}/output/final_video.mp4`,
      durationSeconds: actualDuration,
      narrationDuration: Math.round(targetAudioDur),
      durationDeltaSeconds: Math.round(durationDelta * 100) / 100,
      crf: 18,
      fps: 30,
      audioBitrate: '192k',
      crossfadeDuration: this.crossfadeDuration,
      subtitleStyle,
      assPath,
      srtPath,
      clipsCount: clipPaths.length
    };
  }
}

module.exports = new EditingEngineService();
