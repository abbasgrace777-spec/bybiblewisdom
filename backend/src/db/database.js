const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');

// Ensure data directory exists
if (!fs.existsSync(config.PATHS.DATA)) {
  fs.mkdirSync(config.PATHS.DATA, { recursive: true });
}

// Initialize SQLite database instance
const db = new DatabaseSync(config.PATHS.DB_FILE);

// Enable WAL mode and foreign keys for high performance and integrity
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Initialize database schema from schema.sql
 */
function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql);
    console.log('[Database] Schema verified and initialized at:', config.PATHS.DB_FILE);
  }

  // Automatic column migrations for existing databases
  try {
    const cols = db.prepare('PRAGMA table_info(assets)').all().map(c => c.name);
    const needed = [
      { name: 'creator_name', sql: 'ALTER TABLE assets ADD COLUMN creator_name TEXT;' },
      { name: 'source_website', sql: 'ALTER TABLE assets ADD COLUMN source_website TEXT;' },
      { name: 'license_url', sql: 'ALTER TABLE assets ADD COLUMN license_url TEXT;' },
      { name: 'local_filename', sql: 'ALTER TABLE assets ADD COLUMN local_filename TEXT;' },
      { name: 'verification_status', sql: "ALTER TABLE assets ADD COLUMN verification_status TEXT DEFAULT 'VERIFIED_COMMERCIAL';" },
      { name: 'verification_notes', sql: 'ALTER TABLE assets ADD COLUMN verification_notes TEXT;' },
      { name: 'download_date', sql: 'ALTER TABLE assets ADD COLUMN download_date DATETIME;' }
    ];
    for (const n of needed) {
      if (!cols.includes(n.name)) {
        db.exec(n.sql);
      }
    }

    // Scripts table migrations
    const scriptCols = db.prepare('PRAGMA table_info(scripts)').all().map(c => c.name);
    const scriptNeeded = [
      { name: 'is_approved', sql: 'ALTER TABLE scripts ADD COLUMN is_approved BOOLEAN DEFAULT 0;' },
      { name: 'model_used', sql: 'ALTER TABLE scripts ADD COLUMN model_used TEXT;' },
      { name: 'generation_metrics', sql: 'ALTER TABLE scripts ADD COLUMN generation_metrics TEXT;' },
      { name: 'scene_descriptions', sql: 'ALTER TABLE scripts ADD COLUMN scene_descriptions TEXT;' }
    ];
    for (const sn of scriptNeeded) {
      if (!scriptCols.includes(sn.name)) {
        db.exec(sn.sql);
      }
    }

    // Ideogram thumbnails table migrations
    const thumbCols = db.prepare('PRAGMA table_info(ideogram_thumbnails)').all().map(c => c.name);
    const thumbNeeded = [
      { name: 'png_path', sql: 'ALTER TABLE ideogram_thumbnails ADD COLUMN png_path TEXT;' },
      { name: 'file_size_bytes', sql: 'ALTER TABLE ideogram_thumbnails ADD COLUMN file_size_bytes INTEGER DEFAULT 0;' },
      { name: 'provider', sql: "ALTER TABLE ideogram_thumbnails ADD COLUMN provider TEXT DEFAULT 'IDEOGRAM';" },
      { name: 'license_type', sql: "ALTER TABLE ideogram_thumbnails ADD COLUMN license_type TEXT DEFAULT 'Ideogram Commercial Terms';" },
      { name: 'prompt_variations', sql: 'ALTER TABLE ideogram_thumbnails ADD COLUMN prompt_variations TEXT;' }
    ];
    for (const tn of thumbNeeded) {
      if (!thumbCols.includes(tn.name)) {
        db.exec(tn.sql);
      }
    }

    // Projects table migrations (error tracking and live stage persistence)
    const projectCols = db.prepare('PRAGMA table_info(projects)').all().map(c => c.name);
    const projectNeeded = [
      { name: 'error_message', sql: 'ALTER TABLE projects ADD COLUMN error_message TEXT;' },
      { name: 'current_step', sql: 'ALTER TABLE projects ADD COLUMN current_step INTEGER DEFAULT 1;' },
      { name: 'current_step_name', sql: 'ALTER TABLE projects ADD COLUMN current_step_name TEXT;' },
      { name: 'progress_percent', sql: 'ALTER TABLE projects ADD COLUMN progress_percent INTEGER DEFAULT 0;' }
    ];
    for (const pn of projectNeeded) {
      if (!projectCols.includes(pn.name)) {
        db.exec(pn.sql);
      }
    }
  } catch (migErr) {
    console.warn('[Database] Migration notice:', migErr.message);
  }
}

// Run schema setup automatically on module load
initializeDatabase();

module.exports = {
  db,
  
  // Helper wrappers for clean query execution
  query(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  get(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.get(...params);
  },

  run(sql, params = []) {
    const stmt = db.prepare(sql);
    return stmt.run(...params);
  },

  exec(sql) {
    return db.exec(sql);
  }
};
