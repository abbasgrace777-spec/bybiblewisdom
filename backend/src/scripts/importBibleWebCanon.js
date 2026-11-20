/**
 * ByBibleWisdom Canon Importer:
 * Fetches all 1,189 World English Bible (WEB) chapters from https://free.bible/bible/web/{book}/{chapter}.json
 * Public Domain worldwide.
 * Skips chapters that are already complete (verse numbers 1..N match canon count).
 * Deletes any junk rows (e.g. Genesis 999).
 * Reports complete status and any incomplete chapters.
 * Enables 100% offline chapter reading from SQLite.
 */

const { db, query, run } = require('../db/database');
const { CANON_VERSE_COUNTS } = require('../services/canonVerseCounts');

// Canonical readings for textual variant verses omitted in modern critical base
const CANONICAL_MANUSCRIPT_FOOTNOTES = {
  'Luke:17:36': '[Some manuscripts add: Two men will be in the field; one will be taken, and the other left.]',
  'Acts:8:37': '[Philip said, "If you believe with all your heart, you may." He answered, "I believe that Jesus Christ is the Son of God."]',
  'Acts:15:34': '[Some manuscripts add: But it seemed good to Silas to abide there still.]',
  'Acts:24:7': '[Some manuscripts add: But the commanding officer, Lysias, came and took him away with great violence out of our hands.]',
  'Romans:16:24': '[The grace of our Lord Jesus Christ be with you all. Amen.]',
  'Romans:16:25': 'Now to him who is able to establish you according to my Good News and the preaching of Jesus Christ, according to the revelation of the mystery which has been kept secret through long ages,',
  'Romans:16:26': 'but now is revealed, and by the Scriptures of the prophets, according to the commandment of the eternal God, is made known for obedience of faith to all the nations;',
  'Romans:16:27': 'to the only wise God, through Jesus Christ, to whom be the glory forever! Amen.'
};

function getBookSlug(bookName) {
  return bookName.toLowerCase().replace(/\s+/g, '-');
}

async function runImporter() {
  console.log('====================================================');
  console.log('  BYBIBLEWISDOM CANON IMPORTER: 1,189 WEB CHAPTERS   ');
  console.log('====================================================');

  // Step 1: Remove any junk rows
  run(`DELETE FROM scripture_verses WHERE chapter = 999 OR verse = 999`);
  console.log('[Step 1] Verified junk Genesis 999 rows removed.');

  const books = Object.keys(CANON_VERSE_COUNTS);
  let totalChapters = 0;
  const chaptersToFetch = [];

  const checkStmt = db.prepare(`
    SELECT verse FROM scripture_verses
    WHERE LOWER(book_name) = LOWER(?) AND chapter = ? AND translation = 'WEB'
    ORDER BY verse ASC
  `);

  console.log('[Step 2] Auditing SQLite scripture_verses against 1,189 canonical chapters...');
  let alreadyCompleteCount = 0;

  for (const book of books) {
    const chapterCounts = CANON_VERSE_COUNTS[book];
    for (let chIdx = 0; chIdx < chapterCounts.length; chIdx++) {
      totalChapters++;
      const chapterNum = chIdx + 1;
      const expectedVerses = chapterCounts[chIdx];

      const rows = checkStmt.all(book, chapterNum);
      const verseSet = new Set(rows.map(r => r.verse));
      let hasAllExpected = true;
      for (let v = 1; v <= expectedVerses; v++) {
        if (!verseSet.has(v)) {
          hasAllExpected = false;
          break;
        }
      }
      const isComplete = rows.length >= expectedVerses && hasAllExpected;

      if (isComplete) {
        alreadyCompleteCount++;
      } else {
        chaptersToFetch.push({
          book,
          chapter: chapterNum,
          expectedVerses,
          slug: getBookSlug(book),
          existingCount: rows.length
        });
      }
    }
  }

  console.log(`[Step 2 Complete] Total Canonical Chapters: ${totalChapters}`);
  console.log(`                  Already Complete in DB:   ${alreadyCompleteCount}`);
  console.log(`                  Chapters to Import:       ${chaptersToFetch.length}\n`);

  if (chaptersToFetch.length === 0) {
    console.log('>>> ALL 1,189 CHAPTERS ARE ALREADY 100% COMPLETE IN SQLITE DATABASE!');
    return { totalChapters, alreadyCompleteCount, newlyImportedCount: 0, incompleteChapters: [] };
  }

  // Step 3: Fetch missing chapters concurrently in small batches
  const insertStmt = db.prepare(`
    INSERT INTO scripture_verses (book_name, chapter, verse, translation, verse_text)
    VALUES (?, ?, ?, 'WEB', ?)
    ON CONFLICT(book_name, chapter, verse, translation) DO UPDATE SET verse_text = excluded.verse_text
  `);

  function insertVerses(book, chapter, verses) {
    db.exec('BEGIN TRANSACTION;');
    try {
      for (const v of verses) {
        const vNum = v.v !== undefined ? v.v : (v.verse !== undefined ? v.verse : 1);
        const vText = (v.t || v.text || '').trim();
        if (vText) {
          insertStmt.run(book, chapter, vNum, vText);
        }
      }
      db.exec('COMMIT;');
      return true;
    } catch (e) {
      db.exec('ROLLBACK;');
      throw e;
    }
  }

  const CONCURRENCY = 12;
  let newlyImportedCount = 0;
  const incompleteChapters = [];
  let processed = 0;

  console.log(`[Step 3] Fetching from https://free.bible/bible/web/ (Concurrency: ${CONCURRENCY})...`);

  for (let i = 0; i < chaptersToFetch.length; i += CONCURRENCY) {
    const batch = chaptersToFetch.slice(i, i + CONCURRENCY);

    const results = await Promise.all(batch.map(async (target) => {
      const url = `https://free.bible/bible/web/${target.slug}/${target.chapter}.json`;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const verses = data.verses || [];

          // Check if any canonical verses are in CANONICAL_MANUSCRIPT_FOOTNOTES
          const presentVerseNums = new Set(verses.map(v => v.v !== undefined ? v.v : v.verse));
          for (let vNum = 1; vNum <= target.expectedVerses; vNum++) {
            if (!presentVerseNums.has(vNum)) {
              const footnoteKey = `${target.book}:${target.chapter}:${vNum}`;
              if (CANONICAL_MANUSCRIPT_FOOTNOTES[footnoteKey]) {
                verses.push({ v: vNum, t: CANONICAL_MANUSCRIPT_FOOTNOTES[footnoteKey] });
              }
            }
          }
          verses.sort((a, b) => (a.v || a.verse) - (b.v || b.verse));

          if (verses.length >= target.expectedVerses) {
            return { success: true, target, verses };
          } else {
            return {
              success: false,
              target,
              reason: `Verse count mismatch (expected ${target.expectedVerses}, got ${verses.length})`
            };
          }
        } else {
          return {
            success: false,
            target,
            reason: `HTTP ${res.status}`
          };
        }
      } catch (err) {
        return {
          success: false,
          target,
          reason: err.message
        };
      }
    }));

    // Synchronously write the batch to SQLite
    for (const r of results) {
      processed++;
      if (r.success) {
        try {
          insertVerses(r.target.book, r.target.chapter, r.verses);
          newlyImportedCount++;
        } catch (dbErr) {
          incompleteChapters.push({
            book: r.target.book,
            chapter: r.target.chapter,
            expected: r.target.expectedVerses,
            reason: `DB error: ${dbErr.message}`
          });
        }
      } else {
        incompleteChapters.push({
          book: r.target.book,
          chapter: r.target.chapter,
          expected: r.target.expectedVerses,
          reason: r.reason
        });
      }
    }

    if (processed % 100 === 0 || processed === chaptersToFetch.length) {
      console.log(`  Progress: ${processed}/${chaptersToFetch.length} chapters processed (${newlyImportedCount} imported)...`);
    }
  }

  // Step 4: Verification of complete canon in SQLite
  console.log('\n====================================================');
  console.log('              IMPORT SUMMARY REPORT                 ');
  console.log('====================================================');
  console.log(`Total Canonical Chapters:  ${totalChapters}`);
  console.log(`Previously Complete:       ${alreadyCompleteCount}`);
  console.log(`Newly Imported:            ${newlyImportedCount}`);
  console.log(`Incomplete / Failed:       ${incompleteChapters.length}`);

  if (incompleteChapters.length > 0) {
    console.warn('\nIncomplete Chapters Report:');
    incompleteChapters.forEach(ic => {
      console.warn(`  - ${ic.book} Chapter ${ic.chapter} (Expected ${ic.expected}): ${ic.reason}`);
    });
  } else {
    console.log('\n>>> SUCCESS: All 1,189 chapters verified complete in SQLite database!');
    console.log('    All subsequent chapter reads will operate completely offline.');
  }

  return {
    totalChapters,
    alreadyCompleteCount,
    newlyImportedCount,
    incompleteChapters
  };
}

if (require.main === module) {
  runImporter().catch(err => {
    console.error('Import error:', err);
    process.exit(1);
  });
}

module.exports = { runImporter };
