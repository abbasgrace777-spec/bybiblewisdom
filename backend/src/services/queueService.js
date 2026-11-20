const { db, get, query, run } = require('../db/database');
const pipelineService = require('./pipelineService');
const projectService = require('./projectService');

class QueueService {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.activeTaskId = null;
  }

  /**
   * Enqueue any topic or custom video across all 12 categories
   */
  async enqueueCategoryTopic(topicData) {
    const { title, topic, category, format = 'LONG_FORM', scriptureReferences, targetDurationSeconds } = topicData;

    const project = projectService.createProject({
      title,
      topic: topic || title,
      category: category || 'CHRISTIAN_DOCUMENTARIES',
      format,
      verses_referenced: scriptureReferences,
      bibleTranslation: 'WEB',
      targetDurationSeconds: targetDurationSeconds || (format === 'SHORTS' ? 60 : 900)
    });

    const res = run(`
      INSERT INTO production_queue (
        project_id, book_name, chapter, format, status, current_step, step_name, progress_percent
      ) VALUES (?, ?, 1, ?, 'QUEUED', 0, 'Waiting in Production Queue', 0)
    `, [project.id, title, format]);

    if (!this.isRunning && !this.isPaused) {
      this.processNextInQueue();
    }

    return {
      id: res.lastInsertRowid,
      projectId: project.id,
      title,
      category,
      format,
      status: 'QUEUED'
    };
  }

  /**
   * Enqueue an existing project ID directly
   */
  async enqueueProject(projectId) {
    const project = projectService.getProjectById(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const existing = get(`SELECT id FROM production_queue WHERE project_id = ? AND status IN ('QUEUED', 'PROCESSING')`, [projectId]);
    if (existing) return existing;

    const res = run(`
      INSERT INTO production_queue (
        project_id, book_name, chapter, format, status, current_step, step_name, progress_percent
      ) VALUES (?, ?, ?, ?, 'QUEUED', 0, 'Waiting in Production Queue', 0)
    `, [projectId, project.title, project.chapter_start || 1, project.format]);

    if (!this.isRunning && !this.isPaused) {
      this.processNextInQueue();
    }

    return { id: res.lastInsertRowid, projectId, status: 'QUEUED' };
  }

  /**
   * Retry a failed task
   */
  retryTask(queueId) {
    run(`
      UPDATE production_queue 
      SET status = 'QUEUED', error_message = NULL, current_step = 0, step_name = 'Retrying...', progress_percent = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [queueId]);

    if (!this.isRunning && !this.isPaused) {
      this.processNextInQueue();
    }

    return get(`SELECT * FROM production_queue WHERE id = ?`, [queueId]);
  }

  /**
   * Enqueue a chapter, a range of chapters, or an entire Bible book.
   * Guarantees: One Chapter = One Separate Video & Package
   */
  async enqueueChapters(bookName, startChapter = 1, endChapter = 1, format = 'LONG_FORM') {
    const start = Math.max(1, parseInt(startChapter, 10) || 1);
    const end = Math.max(start, parseInt(endChapter, 10) || start);

    const queuedItems = [];

    for (let ch = start; ch <= end; ch++) {
      // 1. Check if already queued or processing
      const existing = get(`
        SELECT id, status, project_id FROM production_queue
        WHERE LOWER(book_name) = LOWER(?) AND chapter = ? AND status IN ('QUEUED', 'PROCESSING')
      `, [bookName, ch]);

      if (existing) {
        queuedItems.push(existing);
        continue;
      }

      // 2. Create dedicated Project record for this specific chapter
      const title = `${bookName} Chapter ${ch}: Complete Verse-by-Verse Explanation`;
      const topic = `Exposition of ${bookName} Chapter ${ch}`;

      const project = projectService.createProject({
        title,
        topic,
        category: 'BIBLE_BOOK',
        format,
        bibleBook: bookName,
        chapterStart: ch,
        chapterEnd: ch,
        bibleTranslation: 'WEB',
        targetDurationSeconds: format === 'SHORTS' ? 55 : 1440
      });

      // 3. Insert into production_queue table
      const res = run(`
        INSERT INTO production_queue (
          project_id, book_name, chapter, format, status, current_step, step_name, progress_percent
        ) VALUES (?, ?, ?, ?, 'QUEUED', 0, 'Waiting in Sequential Queue', 0)
      `, [project.id, bookName, ch, format]);

      queuedItems.push({
        id: res.lastInsertRowid,
        projectId: project.id,
        bookName,
        chapter: ch,
        status: 'QUEUED'
      });
    }

    console.log(`[QueueService] Enqueued ${queuedItems.length} chapter(s) for ${bookName} (${start} to ${end}).`);

    // Auto-trigger worker if not already running
    if (!this.isRunning && !this.isPaused) {
      this.processNextInQueue();
    }

    return queuedItems;
  }

  /**
   * Main Sequential Queue Runner
   */
  async processNextInQueue() {
    if (this.isPaused) {
      console.log('[QueueService] Queue is currently PAUSED.');
      return;
    }

    // Get next queued item in FIFO order
    const nextItem = get(`
      SELECT * FROM production_queue
      WHERE status = 'QUEUED'
      ORDER BY id ASC LIMIT 1
    `);

    if (!nextItem) {
      this.isRunning = false;
      console.log('[QueueService] All queued chapters completed!');
      return;
    }

    this.isRunning = true;
    this.activeTaskId = nextItem.id;

    // Mark as PROCESSING
    run(`
      UPDATE production_queue
      SET status = 'PROCESSING', current_step = 1, step_name = 'Starting Chapter Production',
          progress_percent = 5, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [nextItem.id]);

    console.log(`[QueueService] >>> Processing ${nextItem.book_name} Chapter ${nextItem.chapter} (Queue ID: ${nextItem.id})...`);

    try {
      const result = await pipelineService.runFullProductionPipeline(
        nextItem.project_id,
        {},
        (p) => {
          run(`
            UPDATE production_queue
            SET current_step = ?, step_name = ?, progress_percent = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [p.step, p.stepName, p.percent, nextItem.id]);
        }
      );

      // Mark COMPLETED
      run(`
        UPDATE production_queue
        SET status = 'COMPLETED', current_step = 10, step_name = 'Production Package Ready',
            progress_percent = 100, output_package_path = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [result.package ? result.package.packageDir : null, nextItem.id]);

      console.log(`[QueueService] ✓ COMPLETED ${nextItem.book_name} Chapter ${nextItem.chapter}`);
    } catch (err) {
      console.error(`[QueueService] ✗ FAILED ${nextItem.book_name} Chapter ${nextItem.chapter}:`, err.message);
      run(`
        UPDATE production_queue
        SET status = 'FAILED', error_message = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [err.message, nextItem.id]);
    } finally {
      this.activeTaskId = null;
      // Immediately proceed to the next chapter in the queue (never stop the queue on a single failure)
      setTimeout(() => this.processNextInQueue(), 1000);
    }
  }

  /**
   * Pause production queue
   */
  pauseQueue() {
    this.isPaused = true;
    console.log('[QueueService] Production queue paused by user.');
    return { success: true, isPaused: true };
  }

  /**
   * Resume production queue
   */
  resumeQueue() {
    this.isPaused = false;
    console.log('[QueueService] Production queue resumed.');
    if (!this.isRunning) {
      this.processNextInQueue();
    }
    return { success: true, isPaused: false };
  }

  /**
   * Retry a failed queue item
   */
  retryQueueItem(queueId) {
    run(`
      UPDATE production_queue
      SET status = 'QUEUED', error_message = NULL, current_step = 0,
          step_name = 'Retrying Production', progress_percent = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [queueId]);

    if (!this.isRunning && !this.isPaused) {
      this.processNextInQueue();
    }
    return { success: true, queueId };
  }

  /**
   * List all queued and completed items
   */
  getQueueStatus() {
    const items = query(`
      SELECT q.*, p.title as project_title, p.output_video_path, p.thumbnail_path
      FROM production_queue q
      LEFT JOIN projects p ON q.project_id = p.id
      ORDER BY q.id ASC
    `);

    const summary = {
      totalQueued: items.filter(i => i.status === 'QUEUED').length,
      totalProcessing: items.filter(i => i.status === 'PROCESSING').length,
      totalCompleted: items.filter(i => i.status === 'COMPLETED').length,
      totalFailed: items.filter(i => i.status === 'FAILED').length,
      isPaused: this.isPaused,
      isRunning: this.isRunning,
      activeTaskId: this.activeTaskId,
      items
    };

    return summary;
  }
}

module.exports = new QueueService();
