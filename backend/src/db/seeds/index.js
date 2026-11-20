const { seedBibleBooks } = require('./bibleBooks');
const { seedHistoricalStories } = require('./historicalStories');
const { seedSampleScriptures } = require('./sampleScriptures');
const { db } = require('../database');

function runAllSeeds() {
  console.log('[Seed Runner] Seeding Bible database...');
  seedBibleBooks();
  seedHistoricalStories();
  seedSampleScriptures();

  const booksCount = db.prepare('SELECT COUNT(*) as total FROM bible_books').get();
  const storiesCount = db.prepare('SELECT COUNT(*) as total FROM historical_stories').get();
  const versesCount = db.prepare('SELECT COUNT(*) as total FROM scripture_verses').get();
  console.log(`[Seed Runner] Verification complete: ${booksCount.total} Bible books, ${storiesCount.total} Historical Stories, ${versesCount.total} Scripture verses in database.`);
}

if (require.main === module) {
  runAllSeeds();
}

module.exports = { runAllSeeds };
