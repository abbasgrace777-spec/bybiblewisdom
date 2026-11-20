const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { query, get, run } = require('../db/database');
const config = require('../config');

class ProjectService {
  /**
   * List all projects with summaries
   */
  getAllProjects() {
    return query(`
      SELECT p.*, 
             c.manual_approval_granted, c.script_originality_passed, c.bible_accuracy_passed,
             y.privacy_status as yt_privacy, y.youtube_video_id, y.upload_status as yt_status
      FROM projects p
      LEFT JOIN compliance_audits c ON p.id = c.project_id
      LEFT JOIN youtube_uploads y ON p.id = y.project_id
      ORDER BY p.created_at DESC
    `);
  }

  /**
   * Get project statistics for the Studio Dashboard
   */
  getDashboardStats() {
    const totalProjects = get(`SELECT COUNT(*) as count FROM projects`).count;
    const shortsCount = get(`SELECT COUNT(*) as count FROM projects WHERE format = 'SHORTS'`).count;
    const longFormCount = get(`SELECT COUNT(*) as count FROM projects WHERE format = 'LONG_FORM'`).count;
    const awaitingApproval = get(`
      SELECT COUNT(*) as count FROM projects p
      JOIN compliance_audits c ON p.id = c.project_id
      WHERE p.status = 'RENDERED' AND c.manual_approval_granted = 0
    `).count;
    const publishedCount = get(`
      SELECT COUNT(*) as count FROM projects WHERE status = 'UPLOADED'
    `).count;
    const failedCount = get(`
      SELECT COUNT(*) as count FROM projects WHERE status = 'FAILED'
    `).count;

    const calendarSlotsCount = get(`SELECT COUNT(*) as count FROM content_calendar`)?.count || 0;
    const categoryBreakdown = query(`
      SELECT category, COUNT(*) as count,
             SUM(CASE WHEN format = 'SHORTS' THEN 1 ELSE 0 END) as shorts,
             SUM(CASE WHEN format = 'LONG_FORM' THEN 1 ELSE 0 END) as longForm
      FROM projects
      GROUP BY category
    `);

    const recentActivity = query(`
      SELECT id, title, category, format, status, created_at, updated_at
      FROM projects
      ORDER BY updated_at DESC
      LIMIT 8
    `);

    return {
      totalProjects,
      shortsCount,
      longFormCount,
      awaitingApproval,
      publishedCount,
      failedCount,
      calendarSlotsCount,
      totalCategories: 12,
      categoryBreakdown,
      recentActivity
    };
  }

  /**
   * Create a new video project and isolate storage
   */
  createProject(data) {
    const id = 'proj_' + Date.now().toString(36) + '_' + crypto.randomBytes(3).toString('hex');
    const projectDir = path.join(config.PATHS.PROJECTS, id);
    
    // Create dedicated project folders for clean isolation
    fs.mkdirSync(projectDir, { recursive: true });
    fs.mkdirSync(path.join(projectDir, 'audio'), { recursive: true });
    fs.mkdirSync(path.join(projectDir, 'images'), { recursive: true });
    fs.mkdirSync(path.join(projectDir, 'output'), { recursive: true });

    run(`
      INSERT INTO projects (
        id, title, topic, category, format, status,
        bible_book, chapter_start, chapter_end, verses_referenced,
        bible_translation, target_duration_seconds
      ) VALUES (?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.title || 'Untitled Project',
      data.topic || '',
      data.category || 'BIBLE_BOOK',
      data.format || 'SHORTS',
      data.bible_book || data.bibleBook || null,
      data.chapter_start || data.chapterStart || 1,
      data.chapter_end || data.chapterEnd || data.chapter_start || data.chapterStart || 1,
      data.verses_referenced || data.versesReferenced || '',
      data.bible_translation || data.bibleTranslation || 'WEB',
      data.format === 'SHORTS' ? 60 : (data.target_duration_seconds || data.targetDurationSeconds || 600)
    ]);

    // Initialize compliance audit record
    run(`
      INSERT INTO compliance_audits (
        project_id, script_originality_passed, bible_accuracy_passed,
        translation_licensed_passed, historical_evidence_verified,
        visual_licenses_passed, audio_licenses_passed, synthetic_disclosure_flag,
        manual_approval_granted
      ) VALUES (?, 0, 0, 1, 0, 0, 0, 1, 0)
    `, [id]);

    return this.getProjectById(id);
  }

  /**
   * Batch create 20 to 25 chapter projects at once
   */
  createBatchProjects({ book = 'Genesis', startChapter = 1, endChapter = 25, format = 'LONG_FORM' }) {
    const created = [];
    const isShorts = format === 'SHORTS';
    const start = parseInt(startChapter, 10) || 1;
    const end = parseInt(endChapter, 10) || 25;

    for (let ch = start; ch <= end; ch++) {
      const title = isShorts
        ? `${book} ${ch} in 60 Seconds`
        : `${book} Chapter ${ch}: The Complete 20-Minute Deep Dive`;

      const proj = this.createProject({
        title,
        topic: `${book} Chapter ${ch} verse-by-verse documentary breakdown`,
        category: 'BIBLE_BOOK',
        format,
        bible_book: book,
        chapter_start: ch,
        chapter_end: ch,
        bible_translation: 'WEB',
        target_duration_seconds: isShorts ? 60 : 1440 // 24 minutes
      });
      created.push(proj);
    }
    return created;
  }

  /**
   * Get complete project record
   */
  getProjectById(id) {
    const project = get(`SELECT * FROM projects WHERE id = ?`, [id]);
    if (!project) return null;

    const script = get(`
      SELECT * FROM scripts WHERE project_id = ? ORDER BY version DESC LIMIT 1
    `, [id]);

    const segments = query(`
      SELECT * FROM script_segments WHERE project_id = ? ORDER BY segment_order ASC
    `, [id]);

    const compliance = get(`
      SELECT * FROM compliance_audits WHERE project_id = ?
    `, [id]);

    const assets = query(`
      SELECT * FROM assets WHERE project_id = ? ORDER BY created_at ASC
    `, [id]);

    const upload = get(`
      SELECT * FROM youtube_uploads WHERE project_id = ?
    `, [id]);

    return {
      ...project,
      script,
      segments,
      compliance,
      assets,
      upload
    };
  }

  /**
   * Update project status
   */
  updateStatus(id, status) {
    run(`UPDATE projects SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [status, id]);
    return this.getProjectById(id);
  }

  /**
   * Batch create 20 to 25 chapter projects at once
   */
  createBatchProjects({ book = 'Genesis', startChapter = 1, endChapter = 25, format = 'LONG_FORM' }) {
    const created = [];
    const isShorts = format === 'SHORTS';
    const start = parseInt(startChapter, 10) || 1;
    const end = parseInt(endChapter, 10) || 25;

    for (let ch = start; ch <= end; ch++) {
      const title = isShorts
        ? `${book} ${ch} in 60 Seconds`
        : `${book} Chapter ${ch}: The Complete 20-Minute Deep Dive`;

      const proj = this.createProject({
        title,
        topic: `${book} Chapter ${ch} verse-by-verse documentary breakdown`,
        category: 'BIBLE_BOOK',
        format,
        bible_book: book,
        chapter_start: ch,
        chapter_end: ch,
        bible_translation: 'WEB',
        target_duration_seconds: isShorts ? 60 : 1440 // 24 minutes
      });
      created.push(proj);
    }
    return created;
  }
}

module.exports = new ProjectService();
