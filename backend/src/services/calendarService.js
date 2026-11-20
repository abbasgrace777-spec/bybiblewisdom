const { get, query, run } = require('../db/database');

class CalendarService {
  /**
   * Get all scheduled calendar items, optionally filtered by month or category
   */
  getCalendarItems(filters = {}) {
    let sql = `
      SELECT 
        c.id, c.title, c.category, c.format, c.target_date, c.scheduled_time,
        c.project_id, c.status, c.notes, c.created_at,
        p.status as project_status, p.output_video_path, p.thumbnail_path
      FROM content_calendar c
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.month) {
      // format YYYY-MM
      sql += ` AND strftime('%Y-%m', c.target_date) = ?`;
      params.push(filters.month);
    }

    if (filters.category) {
      sql += ` AND c.category = ?`;
      params.push(filters.category);
    }

    sql += ` ORDER BY c.target_date ASC, c.scheduled_time ASC`;

    return query(sql, params);
  }

  /**
   * Add a new scheduled entry
   */
  scheduleItem(data) {
    if (!data.title || !data.category || !data.target_date) {
      throw new Error('Title, category, and target_date are required');
    }

    const format = data.format || 'LONG_FORM';
    const scheduledTime = data.scheduled_time || '14:00';
    const status = data.status || 'PLANNED';
    const projectId = data.project_id || null;
    const notes = data.notes || '';

    const res = run(`
      INSERT INTO content_calendar 
      (title, category, format, target_date, scheduled_time, project_id, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [data.title, data.category, format, data.target_date, scheduledTime, projectId, status, notes]);

    return {
      id: res.lastInsertRowid,
      ...data,
      format,
      scheduledTime,
      status
    };
  }

  /**
   * Update calendar item date, time, or status
   */
  updateCalendarItem(id, updates) {
    const item = get(`SELECT * FROM content_calendar WHERE id = ?`, [id]);
    if (!item) throw new Error(`Calendar item #${id} not found`);

    run(`
      UPDATE content_calendar
      SET title = COALESCE(?, title),
          category = COALESCE(?, category),
          format = COALESCE(?, format),
          target_date = COALESCE(?, target_date),
          scheduled_time = COALESCE(?, scheduled_time),
          project_id = COALESCE(?, project_id),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      updates.title !== undefined ? updates.title : null,
      updates.category !== undefined ? updates.category : null,
      updates.format !== undefined ? updates.format : null,
      updates.target_date !== undefined ? updates.target_date : null,
      updates.scheduled_time !== undefined ? updates.scheduled_time : null,
      updates.project_id !== undefined ? updates.project_id : null,
      updates.status !== undefined ? updates.status : null,
      updates.notes !== undefined ? updates.notes : null,
      id
    ]);

    return get(`SELECT * FROM content_calendar WHERE id = ?`, [id]);
  }

  /**
   * Delete calendar entry
   */
  deleteCalendarItem(id) {
    run(`DELETE FROM content_calendar WHERE id = ?`, [id]);
    return { success: true, deletedId: id };
  }

  /**
   * Auto-generate a balanced 14-day production schedule across all categories
   */
  generateCadenceSchedule(startDateStr) {
    const start = startDateStr ? new Date(startDateStr) : new Date();
    const schedulePlan = [
      { dayOffset: 0, category: 'BIBLE_STUDY', title: 'Genesis Chapter 1: The Cosmic Architecture', format: 'LONG_FORM' },
      { dayOffset: 1, category: 'CHRISTIAN_MOTIVATION', title: 'Overcoming Fear with Isaiah 41:10 #Shorts', format: 'SHORTS' },
      { dayOffset: 2, category: 'BIBLICAL_ARCHAEOLOGY', title: 'The Tel Dan Stele: King David Inscription', format: 'LONG_FORM' },
      { dayOffset: 3, category: 'HISTORICAL_STORIES', title: 'The 185,000 Assyrian Army Overthrown #Shorts', format: 'SHORTS' },
      { dayOffset: 4, category: 'JESUS_TEACHINGS', title: 'The Parable of the Prodigal Son Explained', format: 'LONG_FORM' },
      { dayOffset: 5, category: 'PRAYERS_DEVOTIONALS', title: 'Psalm 91: 15-Minute Sanctuary of Peace', format: 'LONG_FORM' },
      { dayOffset: 6, category: 'BIBLE_QA', title: 'Why Did God Allow Job to Suffer?', format: 'LONG_FORM' },
      { dayOffset: 7, category: 'BIBLE_STUDY', title: 'Genesis Chapter 2: The Breath of Life in Eden', format: 'LONG_FORM' },
      { dayOffset: 8, category: 'CHRISTIAN_MOTIVATION', title: 'Why God’s Delays Are Not His Denials #Shorts', format: 'SHORTS' },
      { dayOffset: 9, category: 'ANCIENT_CIVILIZATIONS', title: 'Babylon the Great: Nebuchadnezzar’s Empire', format: 'LONG_FORM' },
      { dayOffset: 10, category: 'BIBLICAL_CHARACTERS', title: 'Elijah on Mount Carmel: The God Who Answers by Fire', format: 'LONG_FORM' },
      { dayOffset: 11, category: 'BIBLE_PROPHECY', title: 'Daniel’s 70 Weeks Prophecy Explained', format: 'LONG_FORM' },
      { dayOffset: 12, category: 'CHRISTIAN_DOCUMENTARIES', title: 'How We Got the Bible: The Dead Sea Scrolls', format: 'LONG_FORM' },
      { dayOffset: 13, category: 'CHRISTIAN_HOLIDAYS', title: 'The Passover Connection: Christ the Lamb', format: 'LONG_FORM' }
    ];

    const scheduled = [];
    for (const item of schedulePlan) {
      const d = new Date(start);
      d.setDate(d.getDate() + item.dayOffset);
      const dateStr = d.toISOString().split('T')[0];

      // Check if already scheduled
      const existing = get(`SELECT id FROM content_calendar WHERE target_date = ? AND title = ?`, [dateStr, item.title]);
      if (!existing) {
        const added = this.scheduleItem({
          title: item.title,
          category: item.category,
          format: item.format,
          target_date: dateStr,
          scheduled_time: item.format === 'SHORTS' ? '18:00' : '14:00',
          status: 'PLANNED',
          notes: 'Auto-balanced cadence slot'
        });
        scheduled.push(added);
      }
    }

    return scheduled;
  }
}

module.exports = new CalendarService();
