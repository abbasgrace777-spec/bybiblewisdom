const { db } = require('../database');

const SCRIPTURES_DATA = [
  // Genesis 1 (Creation)
  { book: 'Genesis', ch: 1, v: 1, tr: 'WEB', text: 'In the beginning, God created the heavens and the earth.' },
  { book: 'Genesis', ch: 1, v: 2, tr: 'WEB', text: 'The earth was formless and empty. Darkness was on the surface of the deep and God’s Spirit was hovering over the surface of the waters.' },
  { book: 'Genesis', ch: 1, v: 3, tr: 'WEB', text: 'God said, "Let there be light," and there was light.' },
  { book: 'Genesis', ch: 1, v: 26, tr: 'WEB', text: 'God said, "Let’s make man in our image, after our likeness. Let them have dominion over the fish of the sea, and over the birds of the sky, and over the livestock, and over all the earth, and over every creeping thing that creeps on the earth."' },
  { book: 'Genesis', ch: 1, v: 27, tr: 'WEB', text: 'God created man in his own image. In God’s image he created him; male and female he created them.' },
  { book: 'Genesis', ch: 1, v: 31, tr: 'WEB', text: 'God saw everything that he had made, and, behold, it was very good. There was evening and there was morning, a sixth day.' },

  // Psalm 23 (The Good Shepherd)
  { book: 'Psalms', ch: 23, v: 1, tr: 'WEB', text: 'Yahweh is my shepherd: I shall lack nothing.' },
  { book: 'Psalms', ch: 23, v: 2, tr: 'WEB', text: 'He makes me lie down in green pastures. He leads me beside still waters.' },
  { book: 'Psalms', ch: 23, v: 3, tr: 'WEB', text: 'He restores my soul. He guides me in the paths of righteousness for his name’s sake.' },
  { book: 'Psalms', ch: 23, v: 4, tr: 'WEB', text: 'Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me. Your rod and your staff, they comfort me.' },
  { book: 'Psalms', ch: 23, v: 5, tr: 'WEB', text: 'You prepare a table before me in the presence of my enemies. You have anointed my head with oil. My cup runs over.' },
  { book: 'Psalms', ch: 23, v: 6, tr: 'WEB', text: 'Surely goodness and loving kindness shall follow me all the days of my life, and I will dwell in Yahweh’s house forever.' },

  // John 1 (The Logos & Incarnation)
  { book: 'John', ch: 1, v: 1, tr: 'WEB', text: 'In the beginning was the Word, and the Word was with God, and the Word was God.' },
  { book: 'John', ch: 1, v: 2, tr: 'WEB', text: 'The same was in the beginning with God.' },
  { book: 'John', ch: 1, v: 3, tr: 'WEB', text: 'All things were made through him. Without him was not anything made that has been made.' },
  { book: 'John', ch: 1, v: 4, tr: 'WEB', text: 'In him was life, and the life was the light of men.' },
  { book: 'John', ch: 1, v: 5, tr: 'WEB', text: 'The light shines in the darkness, and the darkness hasn’t overcome it.' },
  { book: 'John', ch: 1, v: 14, tr: 'WEB', text: 'The Word became flesh, and lived among us. We saw his glory, such glory as of the one and only Son of the Father, full of grace and truth.' },

  // Romans 8 (Life in the Spirit & Unbreakable Love)
  { book: 'Romans', ch: 8, v: 1, tr: 'WEB', text: 'There is therefore now no condemnation to those who are in Christ Jesus, who don’t walk according to the flesh, but according to the Spirit.' },
  { book: 'Romans', ch: 8, v: 28, tr: 'WEB', text: 'We know that all things work together for good for those who love God, to those who are called according to his purpose.' },
  { book: 'Romans', ch: 8, v: 31, tr: 'WEB', text: 'What then shall we say about these things? If God is for us, who can be against us?' },
  { book: 'Romans', ch: 8, v: 38, tr: 'WEB', text: 'For I am persuaded that neither death, nor life, nor angels, nor principalities, nor things present, nor things to come, nor powers,' },
  { book: 'Romans', ch: 8, v: 39, tr: 'WEB', text: 'nor height, nor depth, nor any other created thing, will be able to separate us from God’s love, which is in Christ Jesus our Lord.' },

  // Matthew 5 (The Beatitudes)
  { book: 'Matthew', ch: 5, v: 3, tr: 'WEB', text: 'Blessed are the poor in spirit, for theirs is the Kingdom of Heaven.' },
  { book: 'Matthew', ch: 5, v: 4, tr: 'WEB', text: 'Blessed are those who mourn, for they shall be comforted.' },
  { book: 'Matthew', ch: 5, v: 5, tr: 'WEB', text: 'Blessed are the gentle, for they shall inherit the earth.' },
  { book: 'Matthew', ch: 5, v: 6, tr: 'WEB', text: 'Blessed are those who hunger and thirst for righteousness, for they shall be filled.' },
  { book: 'Matthew', ch: 5, v: 7, tr: 'WEB', text: 'Blessed are the merciful, for they shall obtain mercy.' },
  { book: 'Matthew', ch: 5, v: 8, tr: 'WEB', text: 'Blessed are the pure in heart, for they shall see God.' },
  { book: 'Matthew', ch: 5, v: 9, tr: 'WEB', text: 'Blessed are the peacemakers, for they shall be called children of God.' },
  { book: 'Matthew', ch: 5, v: 14, tr: 'WEB', text: 'You are the light of the world. A city located on a hill can’t be hidden.' },
  { book: 'Matthew', ch: 5, v: 16, tr: 'WEB', text: 'Even so, let your light shine before men; that they may see your good works, and glorify your Father who is in heaven.' },

  // King James Version (KJV) key comparison verses
  { book: 'Genesis', ch: 1, v: 1, tr: 'KJV', text: 'In the beginning God created the heaven and the earth.' },
  { book: 'Psalms', ch: 23, v: 1, tr: 'KJV', text: 'The LORD is my shepherd; I shall not want.' },
  { book: 'John', ch: 1, v: 1, tr: 'KJV', text: 'In the beginning was the Word, and the Word was with God, and the Word was God.' },
  { book: 'John', ch: 3, v: 16, tr: 'KJV', text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.' }
];

function seedSampleScriptures() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO scripture_verses (book_name, chapter, verse, translation, verse_text)
    VALUES (?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN TRANSACTION');
  try {
    for (const s of SCRIPTURES_DATA) {
      insert.run(s.book, s.ch, s.v, s.tr, s.text);
    }
    db.exec('COMMIT');
    console.log(`[Seeds] Seeded sample scriptures successfully.`);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('[Seeds] Error seeding scriptures:', err);
  }
}

module.exports = { seedSampleScriptures };
