const { db, get, query } = require('../db/database');

class AnalyticsService {
  /**
   * Get complete channel performance and curriculum progression
   */
  getChannelOverview() {
    // 1. Overall stats
    const totalProjects = get(`SELECT COUNT(*) as c FROM projects`).c;
    const shortsCount = get(`SELECT COUNT(*) as c FROM projects WHERE format = 'SHORTS'`).c;
    const longFormCount = get(`SELECT COUNT(*) as c FROM projects WHERE format = 'LONG_FORM'`).c;
    const uploadedCount = get(`SELECT COUNT(*) as c FROM projects WHERE status = 'UPLOADED'`).c;

    // 2. 66 Books of the Bible Curriculum Tracker
    const books = query(`
      SELECT b.id, b.book_order, b.name, b.testament, b.category, b.total_chapters,
             COUNT(p.id) as produced_count,
             MAX(p.status) as latest_status
      FROM bible_books b
      LEFT JOIN projects p ON LOWER(b.name) = LOWER(p.bible_book)
      GROUP BY b.id
      ORDER BY b.book_order ASC
    `);

    const coveredBooksCount = books.filter(b => b.produced_count > 0).length;
    const progressPercent = Math.round((coveredBooksCount / 66) * 100);

    // 3. Category Breakdown
    const categoryStats = query(`
      SELECT category, COUNT(*) as count
      FROM projects
      GROUP BY category
    `);

    // 4. Content Recommendation for Next Video
    // Finds the next unproduced book in biblical order
    const nextBookToProduce = books.find(b => b.produced_count === 0) || books[0];

    return {
      channel: '@ByBibleWisdom',
      totalProjects,
      shortsCount,
      longFormCount,
      uploadedCount,
      curriculum: {
        totalBooks: 66,
        coveredBooks: coveredBooksCount,
        progressPercent,
        nextRecommendedBook: nextBookToProduce ? {
          order: nextBookToProduce.book_order,
          name: nextBookToProduce.name,
          category: nextBookToProduce.category,
          theme: nextBookToProduce.central_theme || 'Canonical Scripture'
        } : null
      },
      categoryBreakdown: categoryStats,
      booksProgress: books
    };
  }
}

module.exports = new AnalyticsService();
