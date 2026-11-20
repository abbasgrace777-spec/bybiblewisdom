const { get, query, run } = require('../db/database');

const SEED_SOURCES = [
  {
    source_name: 'The Tel Dan Stele',
    category: 'BIBLICAL_ARCHAEOLOGY',
    period_or_century: '9th Century BC (c. 840 BC)',
    primary_location: 'Tel Dan, Northern Israel (Israel Museum, Jerusalem)',
    archaeological_artifact: 'Basalt Stele Fragment inscribed in Old Aramaic',
    biblical_correlation: '1 Samuel 16; 2 Samuel 7; 1 Kings 12 (House of David)',
    evidence_type: 'HISTORICAL_EVIDENCE',
    summary: 'Contains the phrase "House of David" (Beit David), providing definitive contemporary archaeological confirmation of the historic Davidic dynasty reigning from Jerusalem.',
    academic_citation: 'Biran, A. & Naveh, J. (1993). An Aramaic Stele Fragment from Tel Dan. Israel Exploration Journal, 43(2/3), 81-98.'
  },
  {
    source_name: 'The Cyrus Cylinder',
    category: 'ANCIENT_CIVILIZATIONS',
    period_or_century: '6th Century BC (539 BC)',
    primary_location: 'Babylon, Mesopotamia (British Museum BM 90920)',
    archaeological_artifact: 'Baked clay cylinder inscribed in Babylonian cuneiform',
    biblical_correlation: '2 Chronicles 36:22-23; Ezra 1:1-4; Isaiah 44:28; 45:1',
    evidence_type: 'HISTORICAL_EVIDENCE',
    summary: 'Records Cyrus the Great’s decree permitting exiled peoples to return to their ancestral lands and rebuild their holy sanctuaries, corroborating Ezra’s account verbatim.',
    academic_citation: 'Finkel, I. (Ed.). (2013). The Cyrus Cylinder: The Great Persian Edict from Babylon. British Museum Press.'
  },
  {
    source_name: 'The Dead Sea Scrolls (1QIsa / Great Isaiah Scroll)',
    category: 'BIBLE_STUDY',
    period_or_century: '2nd Century BC (c. 125 BC)',
    primary_location: 'Qumran Cave 1, Judaean Desert (Shrine of the Book, Jerusalem)',
    archaeological_artifact: 'Complete 24-foot leather parchment scroll containing all 66 chapters of Isaiah',
    biblical_correlation: 'Book of Isaiah (all 66 chapters, especially Isaiah 53)',
    evidence_type: 'SCRIPTURE',
    summary: 'Predates the earliest previously known Hebrew manuscripts by over 1,000 years, demonstrating miraculous textual fidelity and confirming that modern Bible translations are virtually identical to the ancient texts.',
    academic_citation: 'Burrows, M., Trever, J. C., & Brownlee, W. H. (1950). The Dead Sea Scrolls of St. Mark’s Monastery. Vol. I.'
  },
  {
    source_name: 'The Merneptah Stele (Israel Stele)',
    category: 'BIBLICAL_ARCHAEOLOGY',
    period_or_century: '13th Century BC (c. 1208 BC)',
    primary_location: 'Thebes, Ancient Egypt (Egyptian Museum, Cairo JE 31408)',
    archaeological_artifact: 'Carved black granite slab of Pharaoh Merneptah',
    biblical_correlation: 'Exodus, Book of Joshua, Judges',
    evidence_type: 'HISTORICAL_EVIDENCE',
    summary: 'The earliest known extra-biblical inscription mentioning "Israel" by name in Canaan, confirming the presence of the Israelite people in the Promised Land during the late Bronze Age.',
    academic_citation: 'Petrie, W. M. F. (1897). Six Temples at Thebes. Quaritch, London.'
  },
  {
    source_name: 'The Taylor Prism & Sennacherib Annals',
    category: 'ANCIENT_CIVILIZATIONS',
    period_or_century: '7th Century BC (c. 691 BC)',
    primary_location: 'Nineveh (British Museum BM 91032)',
    archaeological_artifact: 'Hexagonal clay prism inscribed in Neo-Assyrian cuneiform',
    biblical_correlation: '2 Kings 18-19; 2 Chronicles 32; Isaiah 36-37',
    evidence_type: 'HISTORICAL_EVIDENCE',
    summary: 'Records Sennacherib’s siege of Jerusalem: "As for Hezekiah the Judahite, I shut him up like a caged bird inside Jerusalem." Notably, Sennacherib never claims to have captured Jerusalem, aligning with the biblical account of miraculous deliverance.',
    academic_citation: 'Luckenbill, D. D. (1924). The Annals of Sennacherib. University of Chicago Press.'
  },
  {
    source_name: 'Ketef Hinnom Silver Amulets (Oldest Extant Bible Text)',
    category: 'BIBLE_STUDY',
    period_or_century: 'Late 7th Century BC (c. 600 BC)',
    primary_location: 'Hinnom Valley, Jerusalem (Israel Museum 80.1/1-2)',
    archaeological_artifact: 'Two tiny rolled silver scrolls worn as phylacteries/amulets',
    biblical_correlation: 'Numbers 6:24-26 (The Priestly Blessing)',
    evidence_type: 'SCRIPTURE',
    summary: 'Inscribed in ancient paleo-Hebrew script with the divine name YHWH and the exact Priestly Blessing: "The LORD bless you and keep you; the LORD make his face shine upon you." Proves the Torah was written and read before the Babylonian exile.',
    academic_citation: 'Barkay, G. et al. (2004). The Amulets from Ketef Hinnom: A New Edition and Evaluation. Bulletin of the ASOR, 334, 41-71.'
  },
  {
    source_name: 'Flavius Josephus (Testimonium Flavianum)',
    category: 'JESUS_TEACHINGS',
    period_or_century: '1st Century AD (c. 93 AD)',
    primary_location: 'Rome / Judea (Antiquities of the Jews, XVIII.3.3)',
    archaeological_artifact: 'Historical manuscript tradition in Greek and Arabic recensions',
    biblical_correlation: 'Matthew 27; Luke 24; Acts 1; Acts 12 (James the Just)',
    evidence_type: 'HISTORICAL_EVIDENCE',
    summary: 'Non-Christian Jewish historian Josephus confirms Jesus was a wise teacher, performed startling deeds, was condemned to the cross by Pontius Pilate, and that the Christian movement continued to grow in Rome and Judea.',
    academic_citation: 'Feldman, L. H. (1965). Josephus: Jewish Antiquities, Books XVIII-XX. Harvard University Press.'
  },
  {
    source_name: 'The Pool of Siloam Monumental Steps',
    category: 'JESUS_TEACHINGS',
    period_or_century: '1st Century BC - 1st Century AD',
    primary_location: 'City of David, Southern Jerusalem',
    archaeological_artifact: 'Monumental limestone stepped pool fed by Gihon Spring',
    biblical_correlation: 'John 9:1-11; Isaiah 8:6; Nehemiah 3:15',
    evidence_type: 'HISTORICAL_EVIDENCE',
    summary: 'Excavated in 2004, uncovering the exact stepped mikveh pool where Jewish pilgrims cleansed before entering the Temple Mount and where Jesus sent the blind man to wash and receive sight.',
    academic_citation: 'Reich, R., & Shukron, E. (2011). The Excavations in the City of David, Jerusalem. Israel Antiquities Authority.'
  }
];

class ResearchSourcesService {
  constructor() {
    this.ensureSeeded();
  }

  ensureSeeded() {
    try {
      const count = get('SELECT COUNT(*) as cnt FROM research_sources')?.cnt || 0;
      if (count === 0) {
        for (const s of SEED_SOURCES) {
          run(`
            INSERT INTO research_sources 
            (source_name, category, period_or_century, primary_location, archaeological_artifact, biblical_correlation, evidence_type, summary, academic_citation)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            s.source_name, s.category, s.period_or_century, s.primary_location,
            s.archaeological_artifact, s.biblical_correlation, s.evidence_type,
            s.summary, s.academic_citation
          ]);
        }
        console.log(`[ResearchSources] Seeded ${SEED_SOURCES.length} reputable historical & biblical sources.`);
      }
    } catch (e) {
      console.warn('[ResearchSources] Seed check notice:', e.message);
    }
  }

  getAllSources(filters = {}) {
    let sql = 'SELECT * FROM research_sources WHERE 1=1';
    const params = [];

    if (filters.category) {
      sql += ' AND category = ?';
      params.push(filters.category);
    }

    if (filters.evidenceType) {
      sql += ' AND evidence_type = ?';
      params.push(filters.evidenceType);
    }

    sql += ' ORDER BY id ASC';
    return query(sql, params);
  }

  getSourceById(id) {
    return get('SELECT * FROM research_sources WHERE id = ?', [id]);
  }

  addSource(data) {
    const res = run(`
      INSERT INTO research_sources
      (source_name, category, period_or_century, primary_location, archaeological_artifact, biblical_correlation, evidence_type, summary, academic_citation)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.source_name, data.category, data.period_or_century, data.primary_location,
      data.archaeological_artifact, data.biblical_correlation, data.evidence_type,
      data.summary, data.academic_citation
    ]);
    return get('SELECT * FROM research_sources WHERE id = ?', [res.lastInsertRowid]);
  }
}

module.exports = new ResearchSourcesService();
