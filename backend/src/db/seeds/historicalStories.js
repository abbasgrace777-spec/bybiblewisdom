const { db } = require('../database');

const HISTORICAL_STORIES_DATA = [
  {
    title: 'The Cyrus Cylinder and the Decree of Cyrus',
    category: 'Archaeology & Ancient Empire',
    civilization: 'Persia',
    biblical_era: 'Post-Exilic (c. 539 BC)',
    scripture_references: 'Ezra 1:1-4; 2 Chronicles 36:22-23; Isaiah 44:28; Isaiah 45:1',
    established_facts: 'Discovered in 1879 in Babylon ruins by Hormuzd Rassam (now in British Museum). Written in Akkadian cuneiform on baked clay. Confirms Cyrus the Great conquered Babylon in 539 BC without a protracted siege and decreed that deported captive peoples be repatriated to rebuild their native sanctuaries.',
    historical_sources: 'British Museum Registration BM 90920; Xenophon’s Cyropaedia; Herodotus Histories Book 1.',
    theories_and_traditions: 'While Cyrus honored his Persian and Babylonian deities (Marduk) in public propaganda, biblical historians recognize God’s sovereign hand moving Cyrus as prophesied by Isaiah over 150 years earlier.',
    educational_summary: 'Remarkable archaeological validation of Ezra 1, demonstrating that the biblical account of the Jewish return from Babylonian captivity was an authentic historical event facilitated by Cyrus’ imperial policy.'
  },
  {
    title: 'The Tel Dan Stele: First Physical Inscription of the "House of David"',
    category: 'Archaeology',
    civilization: 'Israel / Aram',
    biblical_era: 'Divided Kingdom (c. 840 BC)',
    scripture_references: '1 Kings 15; 2 Kings 8:28-29; 2 Kings 9',
    established_facts: 'Discovered in 1993–1994 at Tel Dan in northern Israel by archaeologist Avraham Biran. Inscribed in Old Aramaic by King Hazael of Damascus. Line 9 explicitly contains the phrase "BYTDWD" (House of David), commemorating victory over King Jehoram of Israel and King Ahaziah of Judah.',
    historical_sources: 'Israel Museum, Jerusalem; Israel Exploration Journal (Biran & Naveh, 1993, 1995).',
    theories_and_traditions: 'Prior to 1993, secular minimalist critics claimed King David was merely a fictional myth. The Tel Dan Stele decisively refuted this, confirming King David as the historical dynastic founder of Judah.',
    educational_summary: 'The earliest non-biblical extra-scriptural reference to the historical dynasty of King David, inscribed within a century of Solomon’s reign.'
  },
  {
    title: 'Hezekiah’s Tunnel and the Siloam Inscription',
    category: 'Archaeology & City of David',
    civilization: 'Israel / Assyria',
    biblical_era: 'Late 8th Century BC (c. 701 BC)',
    scripture_references: '2 Kings 20:20; 2 Chronicles 32:2-4, 30; Isaiah 22:9-11',
    established_facts: 'A 533-meter (1,750-foot) subterranean water aqueduct carved through solid bedrock beneath the City of David in Jerusalem. Carved from both ends simultaneously by miners who met in the center. An inscription carved in Paleo-Hebrew near the pool of Siloam describes the emotional moment the picks broke through.',
    historical_sources: 'Istanbul Archaeology Museum (Siloam Inscription); City of David National Park archaeological surveys.',
    theories_and_traditions: 'Engineered as an urgent civil defense preparation against Sennacherib’s impending Assyrian siege of Jerusalem in 701 BC, redirecting the Gihon Spring into the city walls.',
    educational_summary: 'An incredible engineering marvel directly mentioned in 2 Kings and 2 Chronicles, preserved and walkable today in Jerusalem.'
  },
  {
    title: 'The Dead Sea Scrolls at Qumran: Preserving God’s Word Across Millennia',
    category: 'Manuscripts & Archaeology',
    civilization: 'Israel / Second Temple',
    biblical_era: '3rd Century BC – 1st Century AD',
    scripture_references: 'Isaiah 40:8 ("The grass withers, the flower fades; but the word of our God will stand forever.")',
    established_facts: 'Discovered between 1947 and 1956 in 11 caves near Khirbet Qumran on the northwestern shore of the Dead Sea by Bedouin goat herders. Contains over 980 manuscripts, including fragments of every Old Testament book except Esther, notably the complete Great Isaiah Scroll (1QIsaa) dating to c. 125 BC.',
    historical_sources: 'The Israel Antiquities Authority; Shrine of the Book (Israel Museum); Oxford University Press DJD Series.',
    theories_and_traditions: 'Mainstream consensus attributes the library to the Essene community, who hid the scrolls in pottery jars to protect them from Roman legions during the First Jewish Revolt (AD 66–73).',
    educational_summary: 'Proven textual stability: The Great Isaiah Scroll was 1,000 years older than the earliest previously known Hebrew manuscripts (Aleppo and Leningrad Codices), showing virtually 99% word-for-word consistency and validating the reliability of biblical transmission.'
  },
  {
    title: 'The Pilate Stone: Roman Evidence of Pontius Pilate in Caesarea',
    category: 'Archaeology & Roman World',
    civilization: 'Rome',
    biblical_era: 'Reign of Tiberius Caesar (c. AD 26–36)',
    scripture_references: 'Matthew 27:2; Luke 3:1; John 18:28-40; Acts 4:27',
    established_facts: 'Found in 1961 by Italian archaeologist Antonio Frova in the Roman theater of Caesarea Maritima. A limestone block inscribed in Latin reading: "[DIS AUGUSTI]S TIBERIEUM ... [PON]TIUS PILATUS ... [PRAEF]ECTUS IUDA[EA]E" (Pontius Pilate, Prefect of Judea).',
    historical_sources: 'Israel Museum, Jerusalem (Item AE 1963 no. 104); Tacitus Annals 15.44; Josephus Antiquities 18.',
    theories_and_traditions: 'Skeptics long doubted whether Pilate was an actual governor or invented folklore. The inscription confirmed both his exact name and his Roman administrative title ("Praefectus").',
    educational_summary: 'Definitive epigraphic confirmation of the Roman official who presided over the trial and crucifixion of Jesus Christ.'
  },
  {
    title: 'Bezalel: The First Spirit-Filled Craftsman in Scripture',
    category: 'Lesser-Known Biblical People',
    civilization: 'Israel',
    biblical_era: 'Wilderness Wanderings (c. 1446 BC)',
    scripture_references: 'Exodus 31:1-11; Exodus 35:30-35; Exodus 36-38; 1 Chronicles 2:20',
    established_facts: 'Son of Uri, son of Hur, of the tribe of Judah. The first individual in the entire Bible recorded as being explicitly "filled with the Spirit of God" — not a king, prophet, or general, but an artist, artisan, and goldsmith endowed with supernatural wisdom and craftsmanship to construct the Ark of the Covenant and Tabernacle.',
    historical_sources: 'Biblical text (Torah / Tanakh); Josephus Antiquities of the Jews Book 3.',
    theories_and_traditions: 'Often overlooked in sermons, Bezalel’s story is a foundational theological anchor for Christian creativity, proving God values technical artistry, aesthetic beauty, and blue-collar diligence as sacred worship.',
    educational_summary: 'An inspiring biblical model for creators, showing that God anoints artistic craft, design, and media production with His Holy Spirit.'
  },
  {
    title: 'The Ketef Hinnom Silver Amulets: Earliest Known Surviving Biblical Text',
    category: 'Archaeology',
    civilization: 'Israel',
    biblical_era: 'First Temple Period (c. late 7th / early 6th Century BC)',
    scripture_references: 'Numbers 6:24-26 (The Priestly Priestly Blessing: "Yahweh bless you, and keep you...")',
    established_facts: 'Found in 1979 by Gabriel Barkay in a burial cave at Ketef Hinnom southwest of the Old City of Jerusalem. Two tiny rolled silver scrolls (plaques) worn as neck amulets. High-resolution photographic imaging in 2004 deciphered Paleo-Hebrew characters bearing the Priestly Blessing from Numbers 6:24-26 and the sacred Tetragrammaton (YHWH).',
    historical_sources: 'Israel Museum; Bulletin of the American Schools of Oriental Research (BASOR 334, Barkay et al., 2004).',
    theories_and_traditions: 'Predates the Babylonian destruction of Jerusalem in 586 BC, proving the text of the Pentateuch existed in written form prior to the Babylonian exile.',
    educational_summary: 'The oldest surviving fragments of biblical scripture ever discovered on earth, dated to more than 2,600 years ago.'
  }
];

function seedHistoricalStories() {
  const existing = db.prepare('SELECT COUNT(*) as count FROM historical_stories').get();
  if (existing.count >= HISTORICAL_STORIES_DATA.length) {
    console.log('[Seeds] Historical stories already seeded.');
    return;
  }

  const insert = db.prepare(`
    INSERT INTO historical_stories (
      title, category, civilization, biblical_era,
      scripture_references, established_facts, historical_sources,
      theories_and_traditions, educational_summary
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  db.exec('BEGIN TRANSACTION');
  try {
    for (const s of HISTORICAL_STORIES_DATA) {
      insert.run(
        s.title, s.category, s.civilization, s.biblical_era,
        s.scripture_references, s.established_facts, s.historical_sources,
        s.theories_and_traditions, s.educational_summary
      );
    }
    db.exec('COMMIT');
    console.log(`[Seeds] Successfully seeded ${HISTORICAL_STORIES_DATA.length} historical stories and archaeological discoveries.`);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('[Seeds] Error seeding historical stories:', err);
    throw err;
  }
}

module.exports = {
  HISTORICAL_STORIES_DATA,
  seedHistoricalStories
};
