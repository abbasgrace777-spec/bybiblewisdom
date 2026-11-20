const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { get, query, run } = require('../db/database');
const config = require('../config');
const editingEngineService = require('./editingEngineService');

class VideoService {
  /**
   * Render complete video for a project using the Professional Multi-Track Editing Engine:
   * Track 1: Ken Burns slow camera moves (Zoom In, Zoom Out, Pan Left, Pan Right, Static) + Biblical color grading
   * Track 2: Cinematic opening/closing fades and transitions
   * Track 3: Mastered broadcast audio (-16 LUFS, pure narration, STRICTLY ZERO BGM)
   * Track 4: Advanced Subtitles (4 selectable styles with ASS/SRT export and burned captions)
   * Track 5: Chapter titles and visual references
   */
  async renderProjectVideo(projectId, options = {}, onProgress = null) {
    const project = get(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (!project) throw new Error('Project not found');

    const result = await editingEngineService.renderCompleteTimeline(projectId, options, onProgress);

    // Register asset in SQLite
    run(`
      INSERT INTO assets (
        project_id, asset_type, title, file_path, source_url,
        license_type, commercial_use_allowed, attribution_required, model_name
      ) VALUES (?, 'IMAGE', 'Final Rendered Video with Burned Captions', ?, 'FFmpeg Multi-Track Studio Engine', 'Commercial Permitted', 1, 0, 'FFmpeg 9.0')
    `, [projectId, result.videoPath]);

    return {
      projectId,
      videoPath: result.videoPath,
      relativeUrl: result.relativeUrl,
      subtitlesAss: `/storage/projects/${projectId}/output/subtitles.ass`,
      subtitlesSrt: `/storage/projects/${projectId}/output/subtitles.srt`,
      durationSeconds: result.durationSeconds,
      subtitleStyle: result.subtitleStyle,
      status: 'RENDERED'
    };
  }
}

module.exports = new VideoService();
