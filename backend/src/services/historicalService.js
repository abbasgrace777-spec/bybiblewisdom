const { query, get } = require('../db/database');

class HistoricalService {
  /**
   * Get all historical and archaeological records
   */
  getAllStories() {
    return query(`
      SELECT id, title, category, civilization, biblical_era, scripture_references,
             theories_and_traditions, educational_summary
      FROM historical_stories
      ORDER BY id ASC
    `);
  }

  /**
   * Get full details of a historical story
   */
  getStoryById(id) {
    return get(`
      SELECT * FROM historical_stories WHERE id = ?
    `, [id]);
  }

  /**
   * Filter stories by civilization
   */
  getByCivilization(civilization) {
    return query(`
      SELECT * FROM historical_stories WHERE LOWER(civilization) = LOWER(?)
    `, [civilization]);
  }
}

module.exports = new HistoricalService();
