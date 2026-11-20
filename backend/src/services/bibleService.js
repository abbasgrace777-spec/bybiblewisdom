const { query, get } = require('../db/database');
const config = require('../config');

class BibleService {
  /**
   * Get all 66 books of the Bible categorized
   */
  getAllBooks() {
    return query(`
      SELECT id, book_order, name, testament, category, total_chapters,
             author_tradition, approximate_date, central_theme,
             key_verse_reference, key_verse_text
      FROM bible_books
      ORDER BY book_order ASC
    `);
  }

  /**
   * Get detailed profile for a specific book
   */
  getBookByName(bookName) {
    return get(`
      SELECT * FROM bible_books WHERE LOWER(name) = LOWER(?)
    `, [bookName]);
  }

  /**
   * Get verses for a specific chapter
   */
  getChapterVerses(bookName, chapter, translation = 'WEB') {
    return query(`
      SELECT verse, verse_text, translation
      FROM scripture_verses
      WHERE LOWER(book_name) = LOWER(?) AND chapter = ? AND translation = ?
      ORDER BY verse ASC
    `, [bookName, chapter, translation]);
  }

  /**
   * Verify scripture reference and translation legality
   */
  verifyReferenceLegality(translationCode) {
    const translation = config.COMPLIANCE.ALLOWED_BIBLE_TRANSLATIONS.find(
      t => t.code.toUpperCase() === (translationCode || 'WEB').toUpperCase()
    );

    if (!translation) {
      return {
        allowed: false,
        warning: `Translation '${translationCode}' is not in the approved public-domain / permissive license registry. Risk of copyright claim on YouTube!`,
        recommendation: 'Use WEB (World English Bible) or KJV (King James Version) for guaranteed public domain safety.'
      };
    }

    return {
      allowed: true,
      code: translation.code,
      name: translation.name,
      status: translation.status,
      notes: translation.notes
    };
  }
}

module.exports = new BibleService();
