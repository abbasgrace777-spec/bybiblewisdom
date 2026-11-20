const { get, query, run } = require('../db/database');

const CHRISTIAN_CATEGORIES = [
  {
    id: 'BIBLE_STUDY',
    name: 'Complete Bible Study',
    shortName: 'Bible Study',
    description: 'Chapter-by-chapter verse breakdown covering all 66 books and 1,189 chapters. One chapter per video.',
    icon: 'BookOpen',
    color: '#F59E0B',
    accentClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    defaultFormat: 'LONG_FORM',
    targetMinutes: 20,
    scope: '66 Books • 1,189 Chapters'
  },
  {
    id: 'BIBLICAL_ARCHAEOLOGY',
    name: 'Biblical History & Archaeology',
    shortName: 'Archaeology',
    description: 'Groundbreaking excavations, ancient inscriptions, steles, and artifacts confirming biblical accounts.',
    icon: 'Compass',
    color: '#10B981',
    accentClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    defaultFormat: 'LONG_FORM',
    targetMinutes: 18,
    scope: 'Excavations • Inscriptions • Relics'
  },
  {
    id: 'ANCIENT_CIVILIZATIONS',
    name: 'Ancient Biblical Kingdoms & Places',
    shortName: 'Ancient Kingdoms',
    description: 'Immersive exploration of Babylon, Egypt, Assyria, Persia, Jerusalem, and Rome in biblical perspective.',
    icon: 'Landmark',
    color: '#8B5CF6',
    accentClass: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    defaultFormat: 'LONG_FORM',
    targetMinutes: 22,
    scope: 'Babylon • Egypt • Persia • Rome'
  },
  {
    id: 'JESUS_TEACHINGS',
    name: "Jesus Christ's Life, Miracles & Parables",
    shortName: "Jesus' Teachings",
    description: 'The transformative teachings, signs, parables, and sacred gospel ministry of Jesus Christ.',
    icon: 'Sun',
    color: '#EAB308',
    accentClass: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    defaultFormat: 'LONG_FORM',
    targetMinutes: 15,
    scope: 'Gospels • Parables • Miracles'
  },
  {
    id: 'BIBLICAL_CHARACTERS',
    name: 'Prophets, Apostles & Biblical Figures',
    shortName: 'Biblical Characters',
    description: 'Biographical deep dives into Moses, Elijah, David, Paul, Peter, Isaiah, and biblical angels.',
    icon: 'UserCheck',
    color: '#3B82F6',
    accentClass: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    defaultFormat: 'LONG_FORM',
    targetMinutes: 16,
    scope: 'Prophets • Apostles • Patriarchs'
  },
  {
    id: 'HISTORICAL_STORIES',
    name: 'Lesser-Known Biblical Stories',
    shortName: 'Lesser-Known Stories',
    description: 'Fascinating, untold narratives, overlooked battles, and dramatic historical events in Scripture.',
    icon: 'Scroll',
    color: '#EC4899',
    accentClass: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
    defaultFormat: 'SHORTS',
    targetMinutes: 1,
    scope: 'Overlooked Accounts • Hidden Lore'
  },
  {
    id: 'CHRISTIAN_MOTIVATION',
    name: 'Christian Motivation & Spiritual Growth',
    shortName: 'Spiritual Motivation',
    description: 'Biblically anchored encouragement, overcoming spiritual warfare, peace in adversity, and enduring faith.',
    icon: 'Sparkles',
    color: '#06B6D4',
    accentClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    defaultFormat: 'SHORTS',
    targetMinutes: 1,
    scope: 'Faith • Overcoming • Inner Peace'
  },
  {
    id: 'PRAYERS_DEVOTIONALS',
    name: 'Prayers & Scripture Devotionals',
    shortName: 'Daily Devotionals',
    description: 'Peaceful guided prayers, Psalms of divine protection, morning affirmations, and evening rest in Christ.',
    icon: 'HeartHandshake',
    color: '#14B8A6',
    accentClass: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    defaultFormat: 'LONG_FORM',
    targetMinutes: 15,
    scope: 'Morning Prayers • Psalms • Midnight Peace'
  },
  {
    id: 'BIBLE_QA',
    name: 'Bible Questions & Theological Answers',
    shortName: 'Bible Q&A',
    description: 'Clear, Scripture-grounded explanations addressing hard biblical questions and apparent paradoxes.',
    icon: 'HelpCircle',
    color: '#F97316',
    accentClass: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    defaultFormat: 'LONG_FORM',
    targetMinutes: 14,
    scope: 'Theology • Answers • Hard Verses'
  },
  {
    id: 'CHRISTIAN_DOCUMENTARIES',
    name: 'Christian Educational Documentaries',
    shortName: 'Documentaries',
    description: 'High-production cinematic deep dives tracing Church history, the canonization of Scripture, and sacred geography.',
    icon: 'Film',
    color: '#6366F1',
    accentClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    defaultFormat: 'LONG_FORM',
    targetMinutes: 25,
    scope: 'Cinematic Epics • Church History'
  },
  {
    id: 'BIBLE_PROPHECY',
    name: 'Bible Prophecy & End-Times Context',
    shortName: 'Biblical Prophecy',
    description: 'Sober, responsible, Scripture-first examination of Daniel, Ezekiel, and Revelation with historic context.',
    icon: 'Eye',
    color: '#EF4444',
    accentClass: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    defaultFormat: 'LONG_FORM',
    targetMinutes: 20,
    scope: 'Daniel • Revelation • Olivet Discourse'
  },
  {
    id: 'CHRISTIAN_HOLIDAYS',
    name: 'Christian Holidays & Sacred Feasts',
    shortName: 'Holy Days & Feasts',
    description: 'The profound biblical origins and spiritual meaning of Christmas, Passion Week, Easter, and Pentecost.',
    icon: 'Calendar',
    color: '#A855F7',
    accentClass: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30',
    defaultFormat: 'LONG_FORM',
    targetMinutes: 16,
    scope: 'Christmas • Easter • Passover • Pentecost'
  }
];

const CURATED_TOPICS = {
  BIBLE_STUDY: [
    {
      title: 'Genesis Chapter 1: The Cosmic Architecture of Creation',
      hook: 'Before the stars existed, before light touched the void, one Voice commanded reality into being.',
      verses: 'Genesis 1:1-31',
      sources: 'Masoretic Hebrew Text, Dead Sea Scroll 1QGen, Septuagint',
      evidenceType: 'SCRIPTURE',
      format: 'LONG_FORM',
      duration: 1200
    },
    {
      title: 'Exodus Chapter 3: The Burning Bush & The Ineffable Name',
      hook: 'In the barren desert of Sinai, an ordinary bush burned without being consumed—and changed world history.',
      verses: 'Exodus 3:1-22',
      sources: 'Dead Sea Scrolls 4QExod, Samaritan Pentateuch, Josephus Antiquities II',
      evidenceType: 'SCRIPTURE',
      format: 'LONG_FORM',
      duration: 1200
    },
    {
      title: 'Job Chapter 38: The Voice from the Whirlwind',
      hook: 'When mortal suffering questioned divine justice, the Creator spoke out of the storm with unanswerable majesty.',
      verses: 'Job 38:1-41',
      sources: 'Masoretic Text, Targum of Job (11Q10)',
      evidenceType: 'SCRIPTURE',
      format: 'LONG_FORM',
      duration: 1200
    }
  ],
  BIBLICAL_ARCHAEOLOGY: [
    {
      title: 'The Tel Dan Stele: The Inscription That Proved King David',
      hook: 'For decades, skeptics claimed King David was pure mythology—until a basalt stone from the 9th Century BC shattered their claims.',
      verses: '1 Samuel 16:1-13; 2 Samuel 7:12-16',
      sources: 'Tel Dan Excavations (Biran & Naveh, 1993), Israel Antiquities Authority',
      evidenceType: 'HISTORICAL_EVIDENCE',
      format: 'LONG_FORM',
      duration: 1100
    },
    {
      title: 'The Cyrus Cylinder: How Archaeology Confirmed Ezra and Isaiah',
      hook: 'A 2,500-year-old clay barrel in Babylon proved the exact decree that allowed the Jewish exiles to rebuild Jerusalem.',
      verses: 'Isaiah 44:28; 45:1; Ezra 1:1-4',
      sources: 'British Museum (BM 90920), Rassam Excavations 1879',
      evidenceType: 'HISTORICAL_EVIDENCE',
      format: 'LONG_FORM',
      duration: 1200
    },
    {
      title: 'The Pool of Siloam Uncovered: Where Jesus Healed the Blind Man',
      hook: 'Hidden beneath centuries of Jerusalem silt, the monumental stone steps where Jesus commanded a blind man to wash were uncovered.',
      verses: 'John 9:1-11; Nehemiah 3:15',
      sources: 'City of David Excavations (Reich & Shukron, 2004)',
      evidenceType: 'HISTORICAL_EVIDENCE',
      format: 'LONG_FORM',
      duration: 950
    }
  ],
  ANCIENT_CIVILIZATIONS: [
    {
      title: 'Babylon the Great: The Rise and Fall of Nebuchadnezzar’s Empire',
      hook: 'With walls four chariots wide and hanging gardens among the world’s wonders, Babylon seemed eternal—until a prophecy was fulfilled in a single night.',
      verses: 'Daniel 4:29-30; 5:1-31; Jeremiah 50:1-46',
      sources: 'Nabonidus Chronicle, Ishtar Gate Inscriptions, Herodotus Histories Book I',
      evidenceType: 'HISTORICAL_EVIDENCE',
      format: 'LONG_FORM',
      duration: 1300
    },
    {
      title: 'Nineveh: The Bloodstained Capital of the Assyrian Empire',
      hook: 'Known as the bloody city, Nineveh terrorized the ancient world with bronze flaying knives—until an unexpected prophet arrived.',
      verses: 'Jonah 1-4; Nahum 1:1-3:19; 2 Kings 19:35-37',
      sources: 'Kouyunjik Mound Excavations, Library of Ashurbanipal, Sennacherib Prism',
      evidenceType: 'HISTORICAL_EVIDENCE',
      format: 'LONG_FORM',
      duration: 1200
    }
  ],
  JESUS_TEACHINGS: [
    {
      title: 'The Sermon on the Mount: The Constitution of the Kingdom of God',
      hook: 'On a grassy hill overlooking the Sea of Galilee, a carpenter’s words inverted every earthly value of power, pride, and vengeance.',
      verses: 'Matthew 5:1-7:29; Luke 6:20-49',
      sources: 'Gospel of Matthew (Codex Sinaiticus, P45), Early Patristic Commentaries',
      evidenceType: 'SCRIPTURE',
      format: 'LONG_FORM',
      duration: 1100
    },
    {
      title: 'The Parable of the Prodigal Son: The Heart of the Father',
      hook: 'In the ancient Near East, asking for an inheritance early was wishing your father dead. The father’s reaction shocked ancient society.',
      verses: 'Luke 15:11-32',
      sources: 'Gospel of Luke (Papyrus 75), Kenneth Bailey Middle Eastern Cultural Studies',
      evidenceType: 'SCRIPTURE',
      format: 'LONG_FORM',
      duration: 900
    }
  ],
  BIBLICAL_CHARACTERS: [
    {
      title: 'Elijah the Tishbite: The Prophet Who Commanded Fire and Rain',
      hook: 'Standing alone against four hundred and fifty pagan prophets on Mount Carmel, one man proved whose God answers by fire.',
      verses: '1 Kings 17:1-19:21; 2 Kings 2:1-12',
      sources: 'Hebrew Scripture, Mount Carmel Archaeological Surveys',
      evidenceType: 'SCRIPTURE',
      format: 'LONG_FORM',
      duration: 1150
    },
    {
      title: 'The Apostle Paul: From Violent Persecutor to Apostle of the Nations',
      hook: 'Armed with arrest warrants to eradicate Christians in Damascus, the greatest persecutor of the Church was blinded by a glory he could not deny.',
      verses: 'Acts 9:1-22; Galatians 1:11-24; 2 Corinthians 11:23-30',
      sources: 'New Testament Epistles, Clement of Rome, Archaeology of Tarsus & Antioch',
      evidenceType: 'SCRIPTURE',
      format: 'LONG_FORM',
      duration: 1250
    }
  ],
  HISTORICAL_STORIES: [
    {
      title: 'The Midnight Deliverance: Hezekiah and the 185,000 Assyrian Army',
      hook: 'Sennacherib boasted that Jerusalem was trapped like a bird in a cage. But in the morning, 185,000 soldiers lay dead without an arrow fired.',
      verses: '2 Kings 19:14-37; 2 Chronicles 32:1-23; Isaiah 37:1-38',
      sources: 'Taylor Prism (British Museum), Broad Wall of Jerusalem, Herodotus II.141',
      evidenceType: 'HISTORICAL_EVIDENCE',
      format: 'SHORTS',
      duration: 60
    },
    {
      title: 'The Left-Handed Deliverer: Ehud and the Secret Message to Eglon',
      hook: 'Concealing a double-edged dagger beneath his garments, Ehud brought a message from God to the king of Moab.',
      verses: 'Judges 3:12-30',
      sources: 'Book of Judges, Archaeological Topography of Gilgal and Jericho',
      evidenceType: 'SCRIPTURE',
      format: 'SHORTS',
      duration: 60
    }
  ],
  CHRISTIAN_MOTIVATION: [
    {
      title: 'When Anxiety Overwhelms You: God’s Battle Plan for Your Mind',
      hook: 'You were not created to live under the paralyzing weight of fear. Scripture provides a weapon that silence every panic.',
      verses: 'Philippians 4:6-7; Isaiah 41:10; 2 Timothy 1:7; Psalm 94:19',
      sources: 'Biblical Psychology & Scriptural Meditation Principles',
      evidenceType: 'SCRIPTURE',
      format: 'SHORTS',
      duration: 60
    },
    {
      title: 'Wait on the LORD: Why God’s Delays Are Not His Denials',
      hook: 'If you feel forgotten in the waiting season, remember that God forms the deepest roots before the greatest harvest.',
      verses: 'Isaiah 40:29-31; Psalm 27:14; Lamentations 3:25-26',
      sources: 'Hebrew Lexicon on "Qavah" (Eager Expectation)',
      evidenceType: 'SCRIPTURE',
      format: 'SHORTS',
      duration: 60
    }
  ],
  PRAYERS_DEVOTIONALS: [
    {
      title: 'Psalm 91: The Psalm of Supernatural Protection Over Your Home',
      hook: 'He who dwells in the secret place of the Most High shall abide under the shadow of the Almighty. A 15-minute sanctuary of peace.',
      verses: 'Psalm 91:1-16; Psalm 23:1-6',
      sources: 'Hebrew Psalter, Ancient Levitical Chants',
      evidenceType: 'SCRIPTURE',
      format: 'LONG_FORM',
      duration: 900
    },
    {
      title: 'Morning Prayer for Strength, Clarity and Divine Favor',
      hook: 'Before checking your phone, before greeting the world, dedicate your first breath to the Sovereign God who directs your steps.',
      verses: 'Psalm 5:3; Psalm 143:8; Lamentations 3:22-23',
      sources: 'Christian Devotional Classics, The Didache Morning Prayers',
      evidenceType: 'SCRIPTURE',
      format: 'LONG_FORM',
      duration: 800
    }
  ],
  BIBLE_QA: [
    {
      title: 'Why Did God Allow Job to Suffer? The Mystery of Divine Sovereignty',
      hook: 'Was Job’s tragedy a divine wager, or does Scripture reveal an eternal courtroom reality that comforts every hurting soul?',
      verses: 'Job 1:6-12; 2:1-7; Romans 8:18-28',
      sources: 'Historical Theodicy, Early Church Fathers on Divine Providence',
      evidenceType: 'THEOLOGICAL_THEORY',
      format: 'LONG_FORM',
      duration: 1100
    },
    {
      title: 'Who Was Melchizedek? King of Salem and Priest of the Most High',
      hook: 'He appears with no genealogy, no birth, and no death. Abraham paid him tithes. Who was this mysterious figure?',
      verses: 'Genesis 14:18-20; Psalm 110:4; Hebrews 7:1-17',
      sources: 'Dead Sea Scroll 11Q13 (Melchizedek Document), Philo of Alexandria',
      evidenceType: 'TRADITIONAL_BELIEF',
      format: 'LONG_FORM',
      duration: 1000
    }
  ],
  CHRISTIAN_DOCUMENTARIES: [
    {
      title: 'How We Got the Bible: The Miraculous Survival of Sacred Scripture',
      hook: 'Through Roman persecution, imperial book-burning, and centuries of hand-copying, how did 66 books survive intact?',
      verses: '2 Timothy 3:16-17; 1 Peter 1:24-25; Psalm 119:89',
      sources: 'Codex Vaticanus, Codex Sinaiticus, Dead Sea Scrolls at Qumran (1947)',
      evidenceType: 'HISTORICAL_EVIDENCE',
      format: 'LONG_FORM',
      duration: 1500
    }
  ],
  BIBLE_PROPHECY: [
    {
      title: 'Daniel’s 70 Weeks Explained: The Exact Timeline to the Messiah',
      hook: 'Five hundred years before Christ was born, an angel revealed the precise century, year, and week the Messiah would be cut off.',
      verses: 'Daniel 9:24-27; Nehemiah 2:1-8; Luke 19:41-44',
      sources: 'Chronology of Artaxerxes I, Sir Robert Anderson The Coming Prince, Josephus',
      evidenceType: 'THEOLOGICAL_THEORY',
      format: 'LONG_FORM',
      duration: 1350
    }
  ],
  CHRISTIAN_HOLIDAYS: [
    {
      title: 'The Passover Connection: How Christ Fulfilled Every Shadow of the Exodus Lamb',
      hook: 'Every cup, every bitter herb, and the unbroken bones of the Passover lamb pointed directly to the hill of Golgotha.',
      verses: 'Exodus 12:1-28; 1 Corinthians 5:7; John 19:31-37',
      sources: 'Mishnah Pesachim, Second Temple Passover Liturgies',
      evidenceType: 'SCRIPTURE',
      format: 'LONG_FORM',
      duration: 1100
    }
  ]
};

class CategoryService {
  /**
   * Get all 12 Christian Content Categories with real production counts
   */
  getAllCategories() {
    return CHRISTIAN_CATEGORIES.map(cat => {
      const dbStats = get(`
        SELECT 
          COUNT(*) as totalProjects,
          SUM(CASE WHEN status = 'RENDERED' OR output_video_path IS NOT NULL THEN 1 ELSE 0 END) as completedVideos
        FROM projects
        WHERE category = ? OR (category = 'BIBLE_BOOK' AND ? = 'BIBLE_STUDY')
      `, [cat.id, cat.id]);

      const curated = CURATED_TOPICS[cat.id] || [];

      return {
        ...cat,
        totalProjects: dbStats?.totalProjects || 0,
        completedVideos: dbStats?.completedVideos || 0,
        curatedTopicCount: curated.length
      };
    });
  }

  /**
   * Get curated and database topics for a specific category
   */
  getCategoryTopics(categoryId) {
    const cat = CHRISTIAN_CATEGORIES.find(c => c.id === categoryId);
    if (!cat) throw new Error(`Category ${categoryId} not found`);

    const curated = CURATED_TOPICS[categoryId] || [];
    const dbProjects = query(`
      SELECT id, title, topic, format, status, target_duration_seconds, created_at
      FROM projects
      WHERE category = ? OR (category = 'BIBLE_BOOK' AND ? = 'BIBLE_STUDY')
      ORDER BY created_at DESC
    `, [categoryId, categoryId]);

    return {
      category: cat,
      curatedTopics: curated,
      existingProjects: dbProjects
    };
  }

  /**
   * Procedural / AI-assisted Topic Generator for any category
   */
  generateTopicForCategory(categoryId, customFocus = '') {
    const cat = CHRISTIAN_CATEGORIES.find(c => c.id === categoryId);
    if (!cat) throw new Error(`Category ${categoryId} not found`);

    const focusClean = (customFocus || '').trim();
    const curated = CURATED_TOPICS[categoryId] || [];

    if (focusClean) {
      return {
        title: `${cat.shortName}: ${focusClean} Explained | ByBibleWisdom`,
        hook: `In the sacred chronicles of Scripture, few truths resonate deeper than ${focusClean}.`,
        category: categoryId,
        format: cat.defaultFormat,
        duration: cat.defaultFormat === 'SHORTS' ? 60 : cat.targetMinutes * 60,
        scriptureReferences: 'Scripture Reference to be validated',
        historicalSources: 'Reputable historical documentation and archaeological correlation',
        evidenceType: categoryId.includes('ARCHAEOLOGY') || categoryId.includes('ANCIENT') ? 'HISTORICAL_EVIDENCE' : 'SCRIPTURE'
      };
    }

    // Pick random curated or generate variation
    const pick = curated[Math.floor(Math.random() * curated.length)] || {
      title: `${cat.name} Deep Dive`,
      hook: `Discover the profound spiritual and historical truth of ${cat.name}.`,
      verses: 'Scripture Reference',
      sources: 'Academic & Theological Sources',
      evidenceType: 'SCRIPTURE',
      format: cat.defaultFormat,
      duration: cat.targetMinutes * 60
    };

    return {
      ...pick,
      category: categoryId
    };
  }
}

module.exports = new CategoryService();
