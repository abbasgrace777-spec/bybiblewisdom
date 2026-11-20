const { db, get } = require('../database');

function runCategoryMigration() {
  const currentSql = get("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'projects'")?.sql || '';
  if (!currentSql.includes("CHECK(category IN ('BIBLE_BOOK'")) {
    console.log('[Migration] projects table category constraint already relaxed or updated.');
    return;
  }

  const beforeCount = get('SELECT COUNT(*) as cnt FROM projects').cnt;
  console.log(`[Migration] Migrating projects table (${beforeCount} existing records)...`);

  db.exec('PRAGMA foreign_keys = OFF;');
  db.exec('BEGIN TRANSACTION;');
  
  db.exec(`
    CREATE TABLE projects_new (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      topic TEXT NOT NULL,
      category TEXT NOT NULL,
      format TEXT CHECK(format IN ('SHORTS', 'LONG_FORM')) NOT NULL DEFAULT 'SHORTS',
      status TEXT NOT NULL DEFAULT 'DRAFT',
      bible_book TEXT,
      chapter_start INTEGER,
      chapter_end INTEGER,
      verses_referenced TEXT,
      bible_translation TEXT DEFAULT 'WEB',
      target_duration_seconds INTEGER DEFAULT 60,
      actual_duration_seconds INTEGER,
      output_video_path TEXT,
      thumbnail_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec('INSERT INTO projects_new SELECT * FROM projects;');
  db.exec('DROP TABLE projects;');
  db.exec('ALTER TABLE projects_new RENAME TO projects;');
  db.exec('COMMIT;');
  db.exec('PRAGMA foreign_keys = ON;');

  const afterCount = get('SELECT COUNT(*) as cnt FROM projects').cnt;
  console.log(`[Migration] projects table successfully migrated. Count: ${afterCount}/${beforeCount}`);
}

module.exports = { runCategoryMigration };

if (require.main === module) {
  runCategoryMigration();
}
