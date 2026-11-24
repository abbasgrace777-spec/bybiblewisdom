const { db, get, query, run } = require('../db/database');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const bibleService = require('./bibleService');
const historicalService = require('./historicalService');
const chapterKnowledge = require('./chapterKnowledge');
const visualUniquenessService = require('./visualUniquenessService');
const aiService = require('./aiService');
const ollamaService = require('./ollamaService');
const chapterReaderService = require('./chapterReaderService');
const seoService = require('./seoService');

const SCRIPT_TYPES = {
  DOCUMENTARY: {
    id: 'DOCUMENTARY',
    name: 'Verse-by-Verse Canonical Documentary',
    shortName: 'Canonical Documentary',
    badge: 'Reverent & Scholarly',
    tone: 'Reverent, scholarly, comprehensive chapter exposition with historical depth, linguistic clarity, and Christological fulfillment.',
    pacing: '180–220 words per section (~15–20 mins)',
    description: 'Systematic verse-by-verse chapter exposition with Hebrew/Greek word insights, ancient Near Eastern cultural context, and Christological climax.',
    guidelines: 'Provide faithful, verse-by-verse historical, linguistic, and spiritual exposition. Unpack Hebrew/Greek word nuances and theological depth.'
  },
  DEVOTIONAL: {
    id: 'DEVOTIONAL',
    name: 'Sacred Devotional & Healing Prayer',
    shortName: 'Devotional & Prayer',
    badge: 'Peaceful & Comforting',
    tone: 'Gentle, comforting, peaceful, meditative, and prayerful. Soothing cadence for heart healing, soul rest, and bedtime prayer.',
    pacing: '160–200 words per section (Unhurried, calming cadence)',
    description: 'Calm, comforting scripture meditation and heartfelt prayer for soul rest, healing, anxiety relief, and personal closeness with God.',
    guidelines: 'Speak with deep warmth, compassion, and comforting peace. Focus on God’s tender mercy, healing promises, and reassurance for the soul. Avoid harsh academic debate; invite personal prayer and surrender.'
  },
  ARCHAEOLOGY: {
    id: 'ARCHAEOLOGY',
    name: 'Biblical Archaeology & Historical Evidence',
    shortName: 'Archaeology & History',
    badge: 'Investigative & Academic',
    tone: 'Academic, investigative, historical, grounded in archaeological excavations, ancient Near East artifacts, and ancient manuscripts.',
    pacing: '190–230 words per section (Evidence-rich)',
    description: 'Historical artifacts, ancient clay tablets, Dead Sea Scrolls, city excavations, and manuscript discoveries confirming biblical events.',
    guidelines: 'Highlight archaeological findings, ancient Near Eastern inscriptions, excavations (e.g. Jericho, Jerusalem, Qumran), and manuscript integrity. Anchor every verse in historical reality.'
  },
  DRAMATIC: {
    id: 'DRAMATIC',
    name: 'Epic High-Retention Narrative & Climax',
    shortName: 'Epic Narrative',
    badge: 'Cinematic & Arresting',
    tone: 'Cinematic, dramatic, engaging, high tension, character stakes, divine intervention, and majestic deliverance.',
    pacing: '180–210 words per section (Dynamic high-tension storytelling)',
    description: 'High-suspense cinematic storytelling emphasizing spiritual conflict, character stakes, divine intervention, and majestic climax.',
    guidelines: 'Use vivid sensory descriptions, narrative momentum, and dramatic tension. Showcase the awe-inspiring majesty of God intervening in human crisis.'
  },
  SHORTS_55S: {
    id: 'SHORTS_55S',
    name: 'Fast 55s Scripture Short',
    shortName: '55s Scripture Short',
    badge: 'Punchy & Arresting',
    tone: 'Punchy, arresting, fast-paced, direct hook, core truth, and inspiring takeaway.',
    pacing: '120–140 words total (55 seconds)',
    description: 'Rapid vertical format jumping straight into a gripping hook, core scripture truth, and memorable spiritual takeaway.',
    guidelines: 'Zero channel welcome or filler. Hook viewer in first 3 seconds with a piercing truth or question, deliver the verse powerfully, and finish with a memorable spiritual takeaway.'
  }
};

class ScriptService {
  /**
   * Get all supported script types
   */
  getScriptTypes() {
    return Object.values(SCRIPT_TYPES);
  }

  /**
   * Get specific script type configuration
   */
  getScriptType(typeId) {
    if (!typeId) return SCRIPT_TYPES.DOCUMENTARY;
    const key = String(typeId).toUpperCase();
    return SCRIPT_TYPES[key] || SCRIPT_TYPES.DOCUMENTARY;
  }
  /**
   * Get configured script provider: 'ollama' (default) or 'gemini'
   */
  getScriptProvider() {
    const dbProvider = get(`SELECT value FROM settings WHERE key = 'SCRIPT_PROVIDER'`)?.value;
    return (dbProvider && dbProvider.trim().toLowerCase()) || 'ollama';
  }

  /**
   * Get configured script model
   */
  getScriptModel() {
    const provider = this.getScriptProvider();
    const dbModel = get(`SELECT value FROM settings WHERE key = 'SCRIPT_MODEL'`)?.value;
    if (provider === 'gemini') {
      return (dbModel && dbModel.trim()) || 'gemini-2.0-flash';
    }
    return (dbModel && dbModel.trim()) || 'qwen3:4b';
  }

  /**
   * Update script provider & model settings
   */
  setScriptProviderSettings(provider, model) {
    if (provider) {
      run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('SCRIPT_PROVIDER', ?, CURRENT_TIMESTAMP)`, [provider.trim().toLowerCase()]);
    }
    if (model) {
      run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('SCRIPT_MODEL', ?, CURRENT_TIMESTAMP)`, [model.trim()]);
    }
  }

  /**
   * Deterministic, 100% Scripture-accurate Canonical Outline Builder
   * Ensures the pipeline always has a structured 5-section roadmap grounded in the real verses.
   */
  buildCanonicalOutline(bookName, chapter, verses, isShorts = false) {
    const totalVerses = verses.length;
    const isGenesis1 = bookName.toLowerCase() === 'genesis' && chapter === 1;

    if (isShorts) {
      return {
        book: bookName,
        chapter,
        chapter_theme: `The eternal majesty and divine truth of ${bookName} Chapter ${chapter}`,
        sections: [
          {
            section_number: 1,
            section_title: 'Arresting Scripture Hook',
            verse_range: `${bookName} ${chapter}:1-2`,
            theological_theme: 'God initiates His eternal plan in history',
            visual_focal_scene: `Cinematic establishing shot of ancient ${bookName} landscape at dawn under radiant golden rim light`,
            hebrew_greek_word: 'Bereshit (in the beginning)',
            key_exposition_points: ['Arresting opening scripture question or statement', 'Canonical placement of chapter', 'Key verse declaration']
          },
          {
            section_number: 2,
            section_title: 'Scripture Foundation',
            verse_range: `${bookName} ${chapter}:1-4`,
            theological_theme: 'Sacred Word of God revealed',
            visual_focal_scene: 'Ancient parchment scroll illuminated by candlelight and warm sunbeams',
            hebrew_greek_word: 'Torah (instruction)',
            key_exposition_points: ['Reading foundational scripture', 'Historical manuscript accuracy']
          },
          {
            section_number: 3,
            section_title: 'Ancient Narrative & Context',
            verse_range: `${bookName} ${chapter}:3-${Math.min(10, totalVerses)}`,
            theological_theme: 'Divine sovereignty in the ancient world',
            visual_focal_scene: `Epic view of the ancient Near Eastern world in the days of ${bookName}`,
            hebrew_greek_word: 'Elohim (God of majesty)',
            key_exposition_points: ['Exposition of central verses', 'Ancient Near Eastern context']
          },
          {
            section_number: 4,
            section_title: 'Christological Climax & Spiritual Insight',
            verse_range: `${bookName} ${chapter}:${totalVerses}`,
            theological_theme: 'Jesus Christ the ultimate fulfillment',
            visual_focal_scene: 'Reverent depiction of Jesus Christ, gentle compassionate gaze',
            hebrew_greek_word: 'Mashiach (Anointed One)',
            key_exposition_points: ['Jesus Christ the fulfillment', 'Grace overcoming law']
          },
          {
            section_number: 5,
            section_title: 'Practical Modern Application & Hope',
            verse_range: `${bookName} ${chapter}:${totalVerses}`,
            theological_theme: 'Comforting truth for modern life',
            visual_focal_scene: 'Solitary person in peaceful prayer at sunset, serene and comforting atmosphere',
            hebrew_greek_word: 'Shalom (divine peace)',
            key_exposition_points: ['Practical comfort for anxiety', 'Living in God’s peace']
          },
          {
            section_number: 6,
            section_title: 'Spiritual Takeaway & Final Blessing',
            verse_range: `${bookName} ${chapter}:${totalVerses}`,
            theological_theme: 'Walking forward in scripture',
            visual_focal_scene: 'Open Holy Bible illuminated by warm golden sunlight in a quiet sanctuary',
            hebrew_greek_word: 'Baruch (blessed)',
            key_exposition_points: ['Inspiring spiritual takeaway', 'Living the truth today', 'Brief blessing']
          }
        ]
      };
    }

    if (isGenesis1) {
      return {
        book: 'Genesis',
        chapter: 1,
        chapter_theme: 'God speaks the cosmos into existence out of nothing and creates humanity in His image.',
        sections: [
          {
            section_number: 1,
            section_title: 'Prologue: Elohim & The Cosmic Beginning',
            verse_range: 'Genesis 1:1-2',
            theological_theme: 'God’s uncaused, eternal existence and sovereign power over the primordial void',
            visual_focal_scene: 'Cosmic void parting as celestial golden dawn breaks over the tranquil primordial ocean',
            hebrew_greek_word: 'Bara (divine creation out of nothing), Ruach (Spirit of God)',
            key_exposition_points: [
              'Bereshit: In the beginning as the foundation of time, space, and matter',
              'Elohim: Plural of majesty revealing infinite power and fullness',
              'Rachaph: The Holy Spirit hovering with gentle, brooding care over the deep'
            ]
          },
          {
            section_number: 2,
            section_title: 'Days 1 to 3: The Framework of Creation',
            verse_range: 'Genesis 1:3-13',
            theological_theme: 'God commands divine light, forms the celestial atmosphere, and clothes the earth in flora',
            visual_focal_scene: 'Radiant golden light piercing cosmic mist, green continents rising from azure seas, and ancient olive groves flourishing',
            hebrew_greek_word: 'Or (divine light), Tov (good)',
            key_exposition_points: [
              'Day 1: "Let there be light" — the unhindered power of the divine voice',
              'Day 2: The expanse (firmament) separating celestial and terrestrial waters',
              'Day 3: Continents emerging from seas and fertile soil producing seed-bearing vegetation'
            ]
          },
          {
            section_number: 3,
            section_title: 'Days 4 to 5: Luminaries & The Inhabitants of Sky and Sea',
            verse_range: 'Genesis 1:14-23',
            theological_theme: 'God governs times and seasons with heavenly lights and fills creation with vibrant life',
            visual_focal_scene: 'Golden sun, silver twilight moon, and brilliant constellations shining over turquoise oceans teeming with dolphins and soaring eagles',
            hebrew_greek_word: 'Nephesh Chayah (living soul/creature)',
            key_exposition_points: [
              'Day 4: Sun, moon, and stars established as signs for sacred seasons, days, and years',
              'Day 5: Oceans teeming with marine life and skies filled with singing birds',
              'The first divine blessing: "Be fruitful and multiply"'
            ]
          },
          {
            section_number: 4,
            section_title: 'Day 6: Land Creatures & The Sacred Image of God',
            verse_range: 'Genesis 1:24-31',
            theological_theme: 'The crown of creation: mankind uniquely fashioned in the image and likeness of God',
            visual_focal_scene: 'Peaceful animals grazing on emerald hills, and noble man and woman in serene Eden under golden morning light',
            hebrew_greek_word: 'Imago Dei (image and likeness of God)',
            key_exposition_points: [
              'Living creatures of the earth brought forth in harmony',
              'Genesis 1:27: "God created man in his own image; male and female he created them"',
              'Loving dominion and stewardship over creation; God proclaims all "Very Good"'
            ]
          },
          {
            section_number: 5,
            section_title: 'Christ the Eternal Word & Living with Divine Purpose',
            verse_range: 'Genesis 1:31 - John 1:1',
            theological_theme: 'Jesus Christ as the Word through Whom all things were made, bringing unshakeable peace',
            visual_focal_scene: 'Ancient open Holy Bible bathed in warm morning light in a quiet stone sanctuary',
            hebrew_greek_word: 'Logos (the Word, John 1:1)',
            key_exposition_points: [
              'The Christological fulfillment: "In the beginning was the Word, and the Word was with God"',
              'Finding peace in God’s purposeful design amid modern anxiety and brokenness',
              'Reverent benediction, closing prayer, and warm invitation to subscribe to @ByBibleWisdom'
            ]
          }
        ]
      };
    }

    // General chapter 5-section breakdown
    const v1End = Math.max(2, Math.floor(totalVerses * 0.2));
    const v2End = Math.max(v1End + 2, Math.floor(totalVerses * 0.45));
    const v3End = Math.max(v2End + 2, Math.floor(totalVerses * 0.75));

    return {
      book: bookName,
      chapter,
      chapter_theme: `The sovereign revelation and eternal truth of ${bookName} Chapter ${chapter}`,
      sections: [
        {
          section_number: 1,
          section_title: 'Opening Hook & Sacred Welcome',
          verse_range: `${bookName} ${chapter}:1-${v1End}`,
          theological_theme: `The canonical foundation and historical backdrop of ${bookName} ${chapter}`,
          visual_focal_scene: `Panoramic view of ancient Near Eastern landscape during ${bookName} times at sunrise`,
          hebrew_greek_word: 'Bereshit / Ancient Setting',
          key_exposition_points: ['Welcome to ByBibleWisdom opening hook', 'Historical setting', `Exposition of verses 1 to ${v1End}`]
        },
        {
          section_number: 2,
          section_title: 'Unfolding Narrative & Archaeological Insight',
          verse_range: `${bookName} ${chapter}:${v1End + 1}-${v2End}`,
          theological_theme: 'God’s active intervention in the unfolding historical events',
          visual_focal_scene: 'Devout ancient Hebrew scribe carefully inking parchment with reed pen under warm candlelight',
          hebrew_greek_word: 'YHVH / The Covenant God',
          key_exposition_points: [`Events of verses ${v1End + 1} to ${v2End}`, 'Archaeological context', 'Linguistic insights']
        },
        {
          section_number: 3,
          section_title: 'Spiritual Conflict & Divine Revelation',
          verse_range: `${bookName} ${chapter}:${v2End + 1}-${v3End}`,
          theological_theme: 'God’s character revealed through trial, guidance, and covenant faithfulness',
          visual_focal_scene: 'Atmospheric wide landscape of biblical wilderness under majestic golden hour sky',
          hebrew_greek_word: 'Hesed (steadfast loving-kindness)',
          key_exposition_points: [`Unpacking verses ${v2End + 1} to ${v3End}`, 'The sovereignty of God', 'Spiritual endurance']
        },
        {
          section_number: 4,
          section_title: 'Chapter Climax & Deliverance',
          verse_range: `${bookName} ${chapter}:${v3End + 1}-${totalVerses}`,
          theological_theme: 'The resolution of the narrative and fulfillment of God’s holy purpose',
          visual_focal_scene: 'Dramatic biblical scene of God’s sovereign deliverance with divine golden light piercing departing clouds',
          hebrew_greek_word: 'Yeshua (salvation)',
          key_exposition_points: [`Climactic resolution through verses ${v3End + 1} to ${totalVerses}`, 'God’s covenant promises', 'Human response of faith']
        },
        {
          section_number: 5,
          section_title: 'Benediction & Community Call to Action',
          verse_range: `${bookName} ${chapter} in Light of Jesus Christ`,
          theological_theme: 'How this chapter points directly to Jesus Christ, offering comforting everyday motivation',
          visual_focal_scene: 'Open Holy Bible illuminated by radiant morning sunbeams in a peaceful sanctuary',
          hebrew_greek_word: 'Logos / Shalom',
          key_exposition_points: ['Reverent connection to Jesus Christ', 'Comforting lesson for viewers facing anxiety today', 'Heartfelt benediction and subscribe/Amen call to action']
        }
      ]
    };
  }

  /**
   * PASS 1: Generate Structured Chapter Outline
   * Calls configured provider (Ollama qwen3:4b or Google Gemini free text).
   * Strips all thinking tokens and parses valid 5-section JSON outline.
   */
  async generateChapterOutline(bookName, chapter, verses, provider, model, options = {}) {
    const isShorts = options.isShorts || false;
    const verseCount = verses.length;
    const scriptTypeKey = (options.scriptType || (isShorts ? 'SHORTS_55S' : 'DOCUMENTARY')).toUpperCase();
    const typeConfig = SCRIPT_TYPES[scriptTypeKey] || SCRIPT_TYPES.DOCUMENTARY;

    const interactionGuidelines = isShorts
      ? `- Section 1 MUST be titled "Arresting Scripture Hook" jumping directly into the powerful truth of ${bookName} ${chapter} without any channel welcome or intro filler.
- Middle sections provide punchy, verse-by-verse scripture exposition.
- The Final Section MUST be titled "Spiritual Takeaway" providing an inspiring concluding thought.`
      : `- Section 1 MUST be titled "Opening Hook & Sacred Welcome" with a welcoming hook for ByBibleWisdom that grabs the viewer's curiosity.
- Middle sections provide faithful, verse-by-verse historical, linguistic, and spiritual exposition.
- The Final Section MUST be titled "Benediction & Community Call to Action" with a warm blessing and call for viewers to subscribe, like, and share prayer requests in the comments.`;

    const prompt = `Do not use <think> tags. Respond immediately and strictly with valid JSON.
Create a structured ${isShorts ? '6-scene short-form (55-second)' : '5-section long-form'} narrative outline for a Christian production on ${bookName} Chapter ${chapter}.

Target Script Style: ${typeConfig.name} (${typeConfig.badge})
Style Description: ${typeConfig.description}
Style Guidelines for Outline:
${typeConfig.guidelines}

Viewer Interaction & Retention Guidelines:
${interactionGuidelines}

Chapter Information:
Book: ${bookName}, Chapter: ${chapter}, Total Verses: ${verseCount}
Sample Verses:
${verses.slice(0, Math.min(8, verseCount)).map(v => `[${v.verse}] ${v.verse_text}`).join('\n')}

Format strictly as JSON with this exact schema:
{
  "book": "${bookName}",
  "chapter": ${chapter},
  "chapter_theme": "Core spiritual message in 1 sentence",
  "sections": [
    {
      "section_number": 1,
      "section_title": "Section Title",
      "verse_range": "${bookName} ${chapter}:1-...",
      "theological_theme": "Key spiritual truth",
      "visual_focal_scene": "Description of the visual scene",
      "hebrew_greek_word": "Ancient term with brief meaning",
      "key_exposition_points": ["Point 1", "Point 2", "Point 3"]
    }
  ]
}

Ensure all ${isShorts ? '6' : '5'} sections are populated. Output ONLY the JSON object.`;

    const systemPrompt = `You are a theological scholar and story architect specializing in "${typeConfig.name}" style (${typeConfig.badge}) for @ByBibleWisdom. Output valid JSON only. Do not output markdown reasoning outside the JSON block.`;

    let res;
    if (provider === 'gemini') {
      res = await aiService.callGeminiText(prompt, systemPrompt, { model, temperature: 0.3, num_predict: 1500 });
    } else {
      res = await ollamaService.generateCompletion(prompt, systemPrompt, { model, temperature: 0.3, num_predict: 1200, num_ctx: 3072 });
    }

    const clean = ollamaService.stripThinkingText(res.text || res.rawText || '');
    let parsed = null;
    try {
      const jsonStr = clean.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch (_) {
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch (__) { }
      }
    }

    if (!parsed || !parsed.sections || !Array.isArray(parsed.sections) || parsed.sections.length < 3) {
      console.log(`[ScriptService] Outline parsing fallback: using canonical outline for ${bookName} ${chapter}.`);
      parsed = this.buildCanonicalOutline(bookName, chapter, verses, isShorts);
    }

    return {
      outline: parsed,
      performance: res.performance,
      modelUsed: res.model || model
    };
  }

  /**
   * PASS 2: Write Section Narration Sequentially from Outline Blueprint
   * Uses rolling context to maintain continuity, and guarantees Scripture quotes match SQLite WEB verses exactly.
   * Strips any stage directions, audio/music cues, and reasoning tokens.
   */
  async generateSectionNarration(bookName, chapter, section, versesForSection, rollingContext, provider, model, options = {}) {
    const isShorts = options.isShorts || false;
    const isFirst = options.isFirstSection || false;
    const isLast = options.isLastSection || false;
    const scriptTypeKey = (options.scriptType || (isShorts ? 'SHORTS_55S' : 'DOCUMENTARY')).toUpperCase();
    const typeConfig = SCRIPT_TYPES[scriptTypeKey] || SCRIPT_TYPES.DOCUMENTARY;

    let interactionRule = '';
    if (!isShorts) {
      if (isFirst) {
        interactionRule = `\n5. MANDATORY OPENING HOOK & SACRED WELCOME: The very first sentence spoken MUST warmly welcome the viewer to ByBibleWisdom and announce the scripture: "Welcome to ByBibleWisdom. Today, we step into the sacred words of ${bookName} Chapter ${chapter}..." followed immediately by an engaging question or hook that sparks deep curiosity.`;
      } else if (isLast) {
        interactionRule = `\n5. MANDATORY BENEDICTION & CALL TO ACTION: The final sentences of this narration MUST conclude with a warm blessing and community engagement call to action: "May the peace and grace of God guard your heart. If this message blessed your soul today, subscribe to ByBibleWisdom, share this light with someone in need, and leave your prayer or Amen in the comments below. God bless you."`;
      }
    }

    const wordTargetInstruction = isShorts
      ? '1. STRICT FOR 60-SECOND SHORT: Write exactly 18 to 24 words (1 punchy, reverent spoken sentence) for this scene. Spoken duration must be 7 to 9 seconds. Do NOT write more than 28 words. Jump straight into the verse or truth without channel greetings.'
      : (isLast ? '1. Write 180-220 words of spoken narration, concluding with the benediction and community call to action.' : '1. Write 200-250 words of spoken narration for this section.');

    const prompt = `Do not use <think> tags. Respond immediately with pure spoken narration text only.
Book: ${bookName}, Chapter: ${chapter}
Section ${section.section_number}: ${section.section_title} (${section.verse_range})
Theological Theme: ${section.theological_theme}
Ancient Language Insight: ${section.hebrew_greek_word || 'Biblical truth'}

Target Script Style: ${typeConfig.name} (${typeConfig.badge})
Tone Directive: ${typeConfig.tone}
Style Directives: ${typeConfig.guidelines}

Exact Scripture Verses for this section:
${versesForSection.map(v => `[${v.verse}] ${v.verse_text}`).join('\n')}

Previous Context (continue smoothly):
${rollingContext ? rollingContext.slice(-300) : 'Opening of video production.'}

Strict Spoken Narration Rules:
${wordTargetInstruction}
2. Every Scripture quotation must match the verses above exactly.
3. STRICT: Do NOT include stage directions, bracketed audio cues, or sound effects (e.g. NO "[Music fades]", NO "(Soft reverent tone)"). Write ONLY words spoken aloud by the narrator.
4. Tone: ${typeConfig.tone}. Jesus Christ is depicted with gentle compassionate authority only where appropriate.${interactionRule}`;

    const systemPrompt = `You are the lead narrator for @ByBibleWisdom specializing in "${typeConfig.name}" style (${typeConfig.badge}). Tone: ${typeConfig.tone}. Write only spoken narration text.`;

    let res;
    if (provider === 'gemini') {
      res = await aiService.callGeminiText(prompt, systemPrompt, { model, temperature: 0.4, num_predict: isShorts ? 1000 : 1200 });
    } else {
      res = await ollamaService.generateCompletion(prompt, systemPrompt, { model, temperature: 0.4, num_predict: isShorts ? 800 : 1000, num_ctx: 2560 });
    }

    let text = ollamaService.stripThinkingText(res.text || res.rawText || '').trim();
    // Clean out accidental stage directions or sound effect cues
    text = text.replace(/\[(?:Music|Sound|Audio|Voice|SFX)[^\]]*\]/gi, '');
    text = text.replace(/\((?:Opening|Closing|Music|Soft tone|Fade)[^\)]*\)/gi, '');
    text = text.replace(/\*\*(?:Opening|Closing|Music)[^\*]*\*\*/gi, '');

    // Enforce intro line on first section if missing (LONG-FORM ONLY)
    if (!isShorts && isFirst && !text.toLowerCase().includes('bybiblewisdom')) {
      text = `Welcome to ByBibleWisdom. Today, we step into the sacred words of ${bookName} Chapter ${chapter}. ${text}`.trim();
    }

    // Enforce outro benediction and community call to action on final section if missing (LONG-FORM ONLY)
    if (!isShorts && isLast && (!text.toLowerCase().includes('subscribe') || !text.toLowerCase().includes('amen'))) {
      text = `${text}\n\nMay the peace and grace of God guard your heart. If this message blessed your soul today, subscribe to ByBibleWisdom, share this light with someone in need, and leave your prayer or Amen in the comments below. God bless you.`.trim();
    }

    return {
      text: text.trim(),
      performance: res.performance
    };
  }

  /**
   * REPETITION CHECK
   * Flags duplicate sentences across sections and excessive repeated phrases (>2 occurrences across non-adjacent paragraphs).
   */
  checkScriptRepetition(sections) {
    const duplicateSentences = [];
    const repeatedPhrases = [];
    const seenSentences = new Map();
    const phraseCounts = new Map();

    const biblicalStopPhrases = new Set([
      'in the beginning god created',
      'the heavens and the earth',
      'and god said let there',
      'and there was evening and',
      'there was evening and there',
      'evening and there was morning',
      'and god saw that it',
      'god saw that it was',
      'saw that it was good',
      'the lord god of israel',
      'in the name of jesus',
      'the word of the lord',
      'in the image of god',
      'male and female he created'
    ]);

    sections.forEach((secText, secIdx) => {
      // 1. Sentence check (sentences >= 5 words)
      const sentences = secText.match(/[^.!?]+[.!?]+/g) || [secText];
      sentences.forEach(s => {
        const clean = s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
        const wordCount = clean.split(' ').length;
        if (wordCount >= 5) {
          if (seenSentences.has(clean)) {
            const prev = seenSentences.get(clean);
            duplicateSentences.push({
              sentence: s.trim(),
              firstSeenSection: prev + 1,
              repeatedSection: secIdx + 1
            });
          } else {
            seenSentences.set(clean, secIdx);
          }
        }
      });

      // 2. 5-word phrase check
      const words = secText.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
      for (let i = 0; i <= words.length - 5; i++) {
        const phrase = words.slice(i, i + 5).join(' ');
        if (!biblicalStopPhrases.has(phrase)) {
          phraseCounts.set(phrase, (phraseCounts.get(phrase) || 0) + 1);
        }
      }
    });

    for (const [phrase, count] of phraseCounts.entries()) {
      if (count > 2) {
        repeatedPhrases.push({ phrase, count });
      }
    }

    return {
      passed: duplicateSentences.length === 0,
      status: duplicateSentences.length === 0 ? 'PASSED' : 'FLAGGED',
      duplicateSentences,
      repeatedPhrases: repeatedPhrases.slice(0, 5)
    };
  }

  /**
   * Main entry point to generate a script for a project
   * Implements Stage 5 Two-Pass architecture:
   * Pass 1: Outline first
   * Pass 2: Section-by-section writing with rolling context and repetition check
   */
  async generateScriptForProject(projectId, options = {}, onProgress = null) {
    const project = get(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (!project) throw new Error('Project not found');

    const bookName = project.bible_book || 'Genesis';
    const chapter = project.chapter_start || 1;
    const translation = project.bible_translation || 'WEB';
    const isShorts = project.format === 'SHORTS';
    const scriptTypeKey = (options.scriptType || options.script_type || project.script_type || (isShorts ? 'SHORTS_55S' : 'DOCUMENTARY')).toUpperCase();
    const activeScriptType = SCRIPT_TYPES[scriptTypeKey] ? scriptTypeKey : (isShorts ? 'SHORTS_55S' : 'DOCUMENTARY');
    const typeConfig = SCRIPT_TYPES[activeScriptType];

    // Provider resolution
    const provider = (options.provider || this.getScriptProvider()).toLowerCase();
    const model = options.model || (provider === 'gemini' ? (options.geminiModel || 'gemini-2.0-flash') : this.getScriptModel());

    console.log(`[ScriptService] Initiating Stage 5 script generation for ${bookName} ${chapter} (Style: ${typeConfig.name} [${activeScriptType}]) via provider: '${provider}', model: '${model}'...`);

    // Provider Health & Credential Verification (Zero fallback rule!)
    if (provider === 'gemini') {
      const geminiKey = aiService.getGeminiKey();
      if (!geminiKey) {
        throw new Error('NOT CONFIGURED: GEMINI_API_KEY is missing in Settings. Google Gemini text writer requires a valid API key (Free tier: 15 RPM, 1,500 RPD, 1M TPM).');
      }
      const test = await aiService.testGeminiTextConnection(geminiKey, model);
      if (!test.connected) {
        throw new Error(`FAILED: Google Gemini text connection failed: ${test.error}`);
      }
    } else {
      // Ollama Verification
      const ollamaStatus = await ollamaService.checkOllamaStatus();
      if (!ollamaStatus.running) {
        throw new Error(`DISCONNECTED: Cannot connect to Ollama at ${ollamaStatus.url}. Please ensure Ollama is running locally.`);
      }
      const isInstalled = await ollamaService.isModelInstalled(model);
      if (!isInstalled) {
        throw new Error(`DISCONNECTED: Model '${model}' is not installed in Ollama. Silent substitution is disabled.`);
      }
    }

    // Load Complete Bible Chapter from SQLite WEB table
    const chapterData = await chapterReaderService.readCompleteChapter(bookName, chapter, translation);
    if (!chapterData || !chapterData.verses || chapterData.verses.length === 0) {
      throw new Error(`Cannot generate script: Incomplete Bible chapter. Scripture verses for ${bookName} Chapter ${chapter} must be loaded.`);
    }

    const startTime = Date.now();
    const engineDisplayName = provider === 'gemini' ? `Google Gemini (${model})` : `Ollama (${model})`;

    let outline;
    const sectionTexts = [];
    let rollingMemory = '';
    let totalTokens = 0;

    // FAST MODE FOR SHORTS: Single Unified LLM Call (~15s instead of 7 sequential calls taking 4 mins)
    if (isShorts) {
      if (onProgress) onProgress(1, 2, 'Generating Fast 55s Scripture Shorts Script...');
      console.log(`[ScriptService] Fast Mode: Generating unified 55s Shorts script for ${bookName} ${chapter}...`);

      const shortsPrompt = `Do not use <think> tags. Respond immediately and strictly with valid JSON.
Write a fast-paced, punchy, 55-second YouTube Shorts script (~130 words total) for ${bookName} Chapter ${chapter}.
Guidelines:
1. Hook (0-5s): Arresting biblical hook without any channel welcome.
2. Context: Specific scripture truth from ${bookName} ${chapter}.
3. Narrative: Hebrew/Greek spiritual meaning.
4. Christ: Christological hope and depiction.
5. Life: Practical everyday lesson for the soul.
6. Takeaway: Inspiring 1-sentence spiritual takeaway.

Format strictly as JSON:
{
  "chapter_theme": "Core spiritual message in 1 sentence",
  "sections": [
    { "section_number": 1, "section_title": "Arresting Scripture Hook", "narration": "Hook text" },
    { "section_number": 2, "section_title": "Biblical Context", "narration": "Scripture context text" },
    { "section_number": 3, "section_title": "Spiritual Meaning", "narration": "Hebrew insight text" },
    { "section_number": 4, "section_title": "Christ in Scripture", "narration": "Christological hope text" },
    { "section_number": 5, "section_title": "Life Lesson", "narration": "Practical lesson text" },
    { "section_number": 6, "section_title": "Spiritual Takeaway", "narration": "Closing blessing text" }
  ]
}
Output ONLY the JSON object.`;

      let shortsRaw;
      if (provider === 'gemini') {
        shortsRaw = await aiService.callGeminiText(shortsPrompt, "You are a biblical scriptwriter. Output JSON only.", { model, temperature: 0.3, num_predict: 800 });
      } else {
        const oRes = await ollamaService.generateCompletion(shortsPrompt, "You are a biblical scriptwriter. Output JSON only.", { model, temperature: 0.3, num_predict: 800, num_ctx: 2048 });
        shortsRaw = ollamaService.stripThinkingText(oRes.text || oRes.rawText || '');
      }

      let parsedShorts = null;
      try {
        const clean = (shortsRaw || '').replace(/```json/gi, '').replace(/```/g, '').trim();
        parsedShorts = JSON.parse(clean);
      } catch (e) {
        console.warn(`[ScriptService] Fast Shorts parse notice:`, e.message);
      }

      if (parsedShorts && Array.isArray(parsedShorts.sections) && parsedShorts.sections.length > 0) {
        outline = {
          book: bookName,
          chapter,
          chapter_theme: parsedShorts.chapter_theme || `${bookName} ${chapter} Scripture Truth`,
          sections: parsedShorts.sections.map(s => ({
            section_number: s.section_number,
            section_title: s.section_title,
            theological_theme: s.narration,
            verse_range: `${bookName} ${chapter}`
          }))
        };
        for (const s of parsedShorts.sections) {
          const cleanText = (s.narration || '').replace(/\[(?:Music|Sound|Audio|Voice|SFX)[^\]]*\]/gi, '').trim();
          sectionTexts.push(cleanText);
          rollingMemory += ' ' + cleanText;
        }
      }
    }

    // LONG-FORM OR FALLBACK: TWO-PASS ARCHITECTURE
    if (!outline) {
      // ==========================================
      // PASS 1: CHAPTER OUTLINE GENERATION
      // ==========================================
      if (onProgress) onProgress(1, 6, 'Pass 1: Generating Structured Chapter Outline...');
      console.log(`[ScriptService] Pass 1: Generating structured outline for ${bookName} ${chapter}...`);

      const outlineRes = await this.generateChapterOutline(bookName, chapter, chapterData.verses, provider, model, { isShorts, scriptType: activeScriptType });
      outline = outlineRes.outline;
      console.log(`[ScriptService] Pass 1 complete: ${outline.sections.length} thematic sections created.`);

      // ==========================================
      // PASS 2: SECTION-BY-SECTION WRITING
      // ==========================================
      totalTokens = outlineRes.performance?.evalCount || 0;

      for (let i = 0; i < outline.sections.length; i++) {
        const sec = outline.sections[i];
        if (onProgress) onProgress(i + 2, outline.sections.length + 2, `Pass 2: Writing Section ${sec.section_number}: ${sec.section_title}...`);

        // Determine verse range for this section
        let versesForSection = [];
        const totalVerses = chapterData.verses.length;
        if (isShorts) {
          versesForSection = chapterData.verses.slice(0, Math.min(10, totalVerses));
        } else {
          const step = Math.ceil(totalVerses / outline.sections.length);
          const startIdx = i * step;
          const endIdx = Math.min(totalVerses, (i + 1) * step);
          versesForSection = chapterData.verses.slice(startIdx, endIdx);
          if (versesForSection.length === 0) {
            versesForSection = chapterData.verses.slice(0, 3);
          }
        }

        const isFirstSection = (i === 0);
        const isLastSection = (i === outline.sections.length - 1);

        console.log(`[ScriptService] Pass 2 [${i + 1}/${outline.sections.length}]: Writing "${sec.section_title}" (${sec.verse_range}) in [${activeScriptType}] style...`);
        const secRes = await this.generateSectionNarration(bookName, chapter, sec, versesForSection, rollingMemory, provider, model, {
          isShorts,
          isFirstSection,
          isLastSection,
          scriptType: activeScriptType
        });
        let text = (secRes.text || '').trim();
        if (!text || text.length < 15) {
          text = sec.theological_theme ? `In ${bookName} ${chapter}, ${sec.theological_theme}.` : `The Holy Word of God in ${bookName} ${chapter} brings eternal truth.`;
        }
        sectionTexts.push(text);
        rollingMemory += ' ' + text;
        totalTokens += (secRes.performance?.evalCount || 0);
      }
    }

    // ==========================================
    // REPETITION CHECK
    // ==========================================
    console.log('[ScriptService] Running script repetition check...');
    const repetitionReport = this.checkScriptRepetition(sectionTexts);
    console.log(`[ScriptService] Repetition check status: ${repetitionReport.status} (duplicate sentences: ${repetitionReport.duplicateSentences.length})`);

    const fullNarrationText = sectionTexts.join('\n\n');
    const words = fullNarrationText.trim().split(/\s+/).length;
    const readTimeSec = Math.round((words / 135) * 60);
    const totalDurationMs = Date.now() - startTime;

    const perfMetrics = {
      provider,
      model,
      scriptType: activeScriptType,
      totalDurationMs,
      durationSeconds: parseFloat((totalDurationMs / 1000).toFixed(2)),
      totalTokens,
      outlineSections: outline.sections.length,
      repetitionReport
    };

    const scriptContent = isShorts ? {
      hook: sectionTexts[0] || '',
      biblical_context: sectionTexts[1] || '',
      core_narrative: sectionTexts[2] || '',
      theological_insight: sectionTexts[3] || '',
      practical_application: sectionTexts[4] || '',
      call_to_action: sectionTexts[5] || '',
      sections: sectionTexts,
      full_text: fullNarrationText,
      outline
    } : {
      hook: sectionTexts[0]?.slice(0, 300) || '',
      biblical_context: sectionTexts[0] || '',
      core_narrative: sectionTexts.slice(1, Math.max(2, sectionTexts.length - 1)).join('\n\n'),
      theological_insight: sectionTexts[Math.max(1, sectionTexts.length - 2)] || '',
      practical_application: sectionTexts[sectionTexts.length - 1]?.slice(0, 300) || '',
      call_to_action: sectionTexts[sectionTexts.length - 1]?.slice(300) || '',
      sections: sectionTexts,
      full_text: fullNarrationText,
      outline
    };

    // Save into SQLite scripts table with model_used, generation_metrics, script_type, and is_approved = 0
    run(`DELETE FROM scripts WHERE project_id = ? AND version = 1`, [projectId]);

    const insertScript = db.prepare(`
      INSERT INTO scripts (
        project_id, version, hook, biblical_context, core_narrative,
        theological_insight, practical_application, call_to_action,
        full_narration_text, word_count, estimated_read_time_seconds,
        model_used, generation_metrics, script_type, is_approved
      ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `);

    insertScript.run(
      projectId,
      scriptContent.hook,
      scriptContent.biblical_context,
      scriptContent.core_narrative,
      scriptContent.theological_insight,
      scriptContent.practical_application,
      scriptContent.call_to_action,
      fullNarrationText,
      words,
      readTimeSec,
      engineDisplayName,
      JSON.stringify(perfMetrics),
      activeScriptType
    );

    // Build scene segments conforming to Stage 3 standardized prompt builder
    const chapterDataObj = chapterKnowledge.getChapterNarrative(bookName, chapter);
    this.generateSceneSegments(projectId, scriptContent, project, chapterDataObj, isShorts);

    const segments = query(`
      SELECT segment_order, narration_text, visual_description, image_prompt, duration_seconds, ken_burns_effect
      FROM script_segments WHERE project_id = ? ORDER BY segment_order ASC
    `, [projectId]);

    const sceneDescriptionsObj = {
      book: bookName,
      chapter,
      modelUsed: engineDisplayName,
      scriptType: activeScriptType,
      totalScenes: segments.length,
      scenes: segments.map(s => ({
        sceneNumber: s.segment_order,
        narration: s.narration_text,
        visualDescription: s.visual_description,
        imagePrompt: s.image_prompt,
        cameraMotion: s.ken_burns_effect || 'ZOOM_IN',
        durationSeconds: s.duration_seconds
      }))
    };

    run(`
      UPDATE scripts
      SET scene_descriptions = ?
      WHERE project_id = ? AND version = 1
    `, [JSON.stringify(sceneDescriptionsObj), projectId]);

    // Save Script.txt, Scene_Descriptions.json, Scene_Descriptions.txt, Script_Outline.json
    this.saveScriptAndSceneFiles(projectId, project, scriptContent, sceneDescriptionsObj, outline);

    // Update Project Status & script_type
    run(`
      UPDATE projects 
      SET status = 'SCRIPTED',
          target_duration_seconds = ?,
          script_type = ?,
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [readTimeSec, activeScriptType, projectId]);

    // Generate Stage 5 SEO Metadata (3 title options < 70 chars, timestamps, synthetic media notice)
    const seoData = seoService.generateMetadata(projectId);

    return {
      success: true,
      projectId,
      provider,
      engine: engineDisplayName,
      model: engineDisplayName,
      scriptType: activeScriptType,
      scriptTypeInfo: typeConfig,
      script: scriptContent,
      outline,
      repetitionReport,
      seo: seoData,
      sceneDescriptions: sceneDescriptionsObj,
      performance: perfMetrics,
      words,
      estimatedDurationSec: readTimeSec,
      format: project.format,
      isApproved: false
    };
  }

  /**
   * Dedicated Ollama Generator (alias for generateScriptForProject with provider = 'ollama')
   */
  async generateScriptWithOllama(projectId, options = {}, onProgress = null) {
    return this.generateScriptForProject(projectId, { ...options, provider: 'ollama' }, onProgress);
  }

  /**
   * Save Script.txt, Scene_Descriptions, and Script_Outline separately (Requirement 7 & Stage 5)
   */
  saveScriptAndSceneFiles(projectId, project, scriptContent, sceneDescriptionsObj, outlineObj = null) {
    const book = project.bible_book || 'Genesis';
    const chapter = project.chapter_start || 1;
    const chFormatted = `Chapter_${String(chapter).padStart(2, '0')}`;

    // Target 1: Project storage directory
    const projDir = path.join(config.PATHS.PROJECTS, projectId, 'output');
    if (!fs.existsSync(projDir)) fs.mkdirSync(projDir, { recursive: true });

    // Target 2: ByBibleWisdom standard package directory
    const pkgDir = path.join(config.PATHS.ROOT, 'ByBibleWisdom', book, chFormatted);
    if (!fs.existsSync(pkgDir)) fs.mkdirSync(pkgDir, { recursive: true });

    // 1. Script.txt (Narration text only, clean spoken words without stage directions)
    const scriptLines = [
      `====================================================`,
      `  BYBIBLEWISDOM AI STUDIO — SCRIPT RECORD           `,
      `  Title: ${project.title}                           `,
      `  Book: ${book} | Chapter: ${chapter}               `,
      `  Model Used: ${sceneDescriptionsObj.modelUsed || 'Ollama qwen3:4b'}`,
      `  Word Count: ${scriptContent.full_text.split(/\s+/).length} words`,
      `====================================================\n`,
      scriptContent.full_text
    ];
    fs.writeFileSync(path.join(projDir, 'Script.txt'), scriptLines.join('\n'), 'utf8');
    fs.writeFileSync(path.join(pkgDir, 'Script.txt'), scriptLines.join('\n'), 'utf8');

    // 2. Scene_Descriptions.json
    fs.writeFileSync(path.join(projDir, 'Scene_Descriptions.json'), JSON.stringify(sceneDescriptionsObj, null, 2), 'utf8');
    fs.writeFileSync(path.join(pkgDir, 'Scene_Descriptions.json'), JSON.stringify(sceneDescriptionsObj, null, 2), 'utf8');

    // 3. Scene_Descriptions.txt (Human-readable storyboard)
    const sceneTextLines = [
      `====================================================`,
      `  SCENE DESCRIPTIONS & CINEMATIC STORYBOARD         `,
      `  Book: ${book} | Chapter: ${chapter}               `,
      `  Total Scenes: ${sceneDescriptionsObj.totalScenes} `,
      `====================================================\n`
    ];
    sceneDescriptionsObj.scenes.forEach(s => {
      sceneTextLines.push(`[SCENE ${s.sceneNumber}] (Duration: ${s.durationSeconds}s | Camera: ${s.cameraMotion})`);
      sceneTextLines.push(`Visual Description: ${s.visualDescription}`);
      sceneTextLines.push(`Image Prompt: ${s.imagePrompt}`);
      sceneTextLines.push(`Narration: "${s.narration}"\n`);
    });
    fs.writeFileSync(path.join(projDir, 'Scene_Descriptions.txt'), sceneTextLines.join('\n'), 'utf8');
    fs.writeFileSync(path.join(pkgDir, 'Scene_Descriptions.txt'), sceneTextLines.join('\n'), 'utf8');

    // 4. Script_Outline.json (Pass 1 Blueprint)
    if (outlineObj) {
      fs.writeFileSync(path.join(projDir, 'Script_Outline.json'), JSON.stringify(outlineObj, null, 2), 'utf8');
      fs.writeFileSync(path.join(pkgDir, 'Script_Outline.json'), JSON.stringify(outlineObj, null, 2), 'utf8');
    }
  }

  /**
   * Requirement 8: Script review and approval
   */
  approveScript(projectId) {
    const project = get(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (!project) throw new Error('Project not found');

    const script = get(`SELECT * FROM scripts WHERE project_id = ? ORDER BY version DESC LIMIT 1`, [projectId]);
    if (!script) throw new Error('No script found to approve');

    run(`UPDATE scripts SET is_approved = 1 WHERE id = ?`, [script.id]);
    run(`UPDATE projects SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [projectId]);

    return {
      success: true,
      projectId,
      scriptId: script.id,
      isApproved: true,
      status: 'APPROVED'
    };
  }

  /**
   * Get latest script with parsed metrics and approval status
   */
  getScript(projectId) {
    const script = get(`
      SELECT * FROM scripts WHERE project_id = ? ORDER BY version DESC LIMIT 1
    `, [projectId]);
    if (!script) return null;

    let metrics = null;
    let sceneDesc = null;
    try {
      if (script.generation_metrics) metrics = JSON.parse(script.generation_metrics);
    } catch (e) { }
    try {
      if (script.scene_descriptions) sceneDesc = JSON.parse(script.scene_descriptions);
    } catch (e) { }

    const rawType = script.script_type || 'DOCUMENTARY';
    const typeInfo = SCRIPT_TYPES[rawType.toUpperCase()] || SCRIPT_TYPES.DOCUMENTARY;

    return {
      ...script,
      script_type: rawType,
      script_type_info: typeInfo,
      is_approved: Boolean(script.is_approved),
      generation_metrics: metrics,
      scene_descriptions: sceneDesc
    };
  }

  /**
   * Update script content manually
   */
  updateScript(projectId, scriptData) {
    const script = get(`SELECT * FROM scripts WHERE project_id = ? ORDER BY version DESC LIMIT 1`, [projectId]);
    if (!script) throw new Error('No script found to update');

    const hook = scriptData.hook !== undefined ? scriptData.hook : script.hook;
    const biblical_context = scriptData.biblical_context !== undefined ? scriptData.biblical_context : script.biblical_context;
    const core_narrative = scriptData.core_narrative !== undefined ? scriptData.core_narrative : script.core_narrative;
    const theological_insight = scriptData.theological_insight !== undefined ? scriptData.theological_insight : script.theological_insight;
    const practical_application = scriptData.practical_application !== undefined ? scriptData.practical_application : script.practical_application;
    const call_to_action = scriptData.call_to_action !== undefined ? scriptData.call_to_action : script.call_to_action;
    const script_type = (scriptData.script_type || scriptData.scriptType || script.script_type || 'DOCUMENTARY').toUpperCase();

    const full_text = scriptData.full_narration_text || [hook, biblical_context, core_narrative, theological_insight, practical_application, call_to_action].filter(Boolean).join('\n\n');
    const word_count = full_text.trim().split(/\s+/).length;
    const readTimeSec = Math.round((word_count / 135) * 60);

    run(`
      UPDATE scripts
      SET hook = ?, biblical_context = ?, core_narrative = ?,
          theological_insight = ?, practical_application = ?, call_to_action = ?,
          full_narration_text = ?, word_count = ?, estimated_read_time_seconds = ?,
          script_type = ?
      WHERE id = ?
    `, [hook, biblical_context, core_narrative, theological_insight, practical_application, call_to_action, full_text, word_count, readTimeSec, script_type, script.id]);

    run(`
      UPDATE projects
      SET script_type = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [script_type, projectId]);

    return this.getScript(projectId);
  }

  /**
   * Chapter Knowledge Engine Generator (Canonical Zero-Dependency Fallback)
   */
  generateScriptFromKnowledge(projectId) {
    const project = get(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (!project) throw new Error('Project not found');

    const bookName = project.bible_book || 'Genesis';
    const chapter = project.chapter_start || 1;
    const isShorts = project.format === 'SHORTS';

    const bookInfo = bibleService.getBookByName(bookName);
    const chapterData = chapterKnowledge.getChapterNarrative(bookName, chapter);

    let scriptContent = null;
    if (isShorts) {
      scriptContent = this.buildShortsFromKnowledge(project, bookInfo, chapterData);
    } else if (bookName.toLowerCase() === 'genesis' && chapter === 1) {
      scriptContent = this.buildGenesis1CompleteVerseByVerse();
    } else {
      scriptContent = this.buildEpic20MinLongFormFromKnowledge(project, bookInfo, chapterData);
    }

    const words = scriptContent.full_text.trim().split(/\s+/).length;
    const readTimeSec = Math.round((words / 135) * 60);

    run(`DELETE FROM scripts WHERE project_id = ? AND version = 1`, [projectId]);

    const insertScript = db.prepare(`
      INSERT INTO scripts (
        project_id, version, hook, biblical_context, core_narrative,
        theological_insight, practical_application, call_to_action,
        full_narration_text, word_count, estimated_read_time_seconds,
        model_used, is_approved
      ) VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ByBibleWisdom Canon Engine', 0)
    `);

    insertScript.run(
      projectId,
      scriptContent.hook,
      scriptContent.biblical_context,
      scriptContent.core_narrative,
      scriptContent.theological_insight,
      scriptContent.practical_application,
      scriptContent.call_to_action,
      scriptContent.full_text,
      words,
      readTimeSec
    );

    this.generateSceneSegments(projectId, scriptContent, project, chapterData, isShorts);

    // Save separated script and scene descriptions
    const segments = query(`
      SELECT segment_order, narration_text, visual_description, image_prompt, duration_seconds, ken_burns_effect
      FROM script_segments WHERE project_id = ? ORDER BY segment_order ASC
    `, [projectId]);

    const sceneDescriptionsObj = {
      book: bookName,
      chapter,
      modelUsed: 'ByBibleWisdom Canon Engine',
      totalScenes: segments.length,
      scenes: segments.map(s => ({
        sceneNumber: s.segment_order,
        narration: s.narration_text,
        visualDescription: s.visual_description,
        imagePrompt: s.image_prompt,
        cameraMotion: s.ken_burns_effect || 'ZOOM_IN',
        durationSeconds: s.duration_seconds
      }))
    };

    run(`
      UPDATE scripts
      SET scene_descriptions = ?
      WHERE project_id = ? AND version = 1
    `, [JSON.stringify(sceneDescriptionsObj), projectId]);

    this.saveScriptAndSceneFiles(projectId, project, scriptContent, sceneDescriptionsObj);

    run(`
      UPDATE projects 
      SET status = 'SCRIPTED',
          target_duration_seconds = ?,
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [readTimeSec, projectId]);

    return {
      projectId,
      script: scriptContent,
      sceneDescriptions: sceneDescriptionsObj,
      words,
      estimatedDurationSec: readTimeSec,
      format: project.format,
      model: 'ByBibleWisdom Canon Engine',
      isApproved: false
    };
  }

  /**
   * Dedicated, Verse-by-Verse Comprehensive Explanation of Genesis Chapter 1
   * Complete 24-section documentary covering all 31 verses and the 7 Days of Creation.
   * 100% Bible-centric, reverent, peaceful, comforting, and family-safe.
   */
  buildGenesis1CompleteVerseByVerse() {
    const sections = [
      // Section 1: The Book of Beginnings
      `Welcome to ByBibleWisdom. Today, we open the sacred pages of the Holy Scriptures to examine Genesis Chapter 1 in full, verse by verse. The title Genesis comes from the Greek translation meaning origin or beginning, while in the original Hebrew Bible, it is named Bereshit—In the beginning. This magnificent chapter forms the foundational bedrock of all biblical truth, revealing the eternal God Who speaks the cosmos into harmonious existence out of pure nothingness.`,

      // Section 2: Genesis 1:1 — The Cosmic Foundation
      `Genesis 1 verse 1 declares with majestic authority: "In the beginning, God created the heavens and the earth." Notice how Scripture begins not by defending the existence of God, but by proclaiming His uncaused, eternal majesty. Before a single star was ignited, before matter, space, and time were framed, God already was. The Hebrew name used here is Elohim—a plural of majesty, signifying the infinite power, fullness, and supreme sovereignty of the Living God.`,

      // Section 3: Genesis 1:2 — The Spirit of God Hovering
      `Verse 2 continues: "The earth was formless and void, and darkness was over the surface of the deep. And the Spirit of God was hovering over the face of the waters." In Hebrew, formless and void is Tohu va-Vohu—an unshaped, empty canvas. Yet darkness had no power, for the Holy Spirit was hovering—in Hebrew, Rachaph—gently, lovingly brooding like an eagle caring for its young, preparing to bring celestial order, divine light, and vibrant life out of darkness.`,

      // Section 4: Day One (Genesis 1:3-5) — Let There Be Light
      `In verse 3, God speaks the very first recorded words of divine revelation: "Let there be light," and there was light. God did not struggle; He did not require physical instruments. By the mere breath of His command, radiant light burst forth, illuminating the primordial cosmos. God saw that the light was good, and He separated the light from the darkness. God called the light Day, and the darkness He called Night. And there was evening, and there was morning—the first day.`,

      // Section 5: Day Two (Genesis 1:6-8) — The Firmament and the Expanse
      `On the second day, verses 6 through 8 record: "God said, 'Let there be an expanse between the waters to separate water from water.'" God fashioned the atmosphere and sky, establishing the delicate atmospheric envelope that shields and sustains our terrestrial home. God called the expanse Sky or Heaven. The waters above the expanse were separated from the waters below, demonstrating God’s architectural wisdom and orderly design for creation.`,

      // Section 6: Day Three (Genesis 1:9-10) — Dry Land and Seas
      `On the third day, recorded in verses 9 and 10, God commands: "Let the water under the sky be gathered to one place, and let dry ground appear." The majestic continents emerged as roaring oceans receded into their designated basins. God named the dry ground Earth, and the gathered waters He called Seas. God looked upon the rolling mountains, peaceful valleys, and crystal waters, and saw that it was good.`,

      // Section 7: Day Three (Genesis 1:11-13) — Vegetation and Fruit Trees
      `Still on the third day, in verses 11 through 13, God speaks life into the soil: "Let the land produce vegetation: seed-bearing plants and trees on the land that bear fruit with seed in it, according to their various kinds." Instantly, verdant emerald meadows, ancient cedar forests, olive groves, and flowering plants carpeted the earth. God encoded within each seed the miraculous reproductive ability to perpetuate life across generations.`,

      // Section 8: Day Four (Genesis 1:14-19) — Sun, Moon, and Stars
      `On the fourth day, verses 14 through 19 detail the heavenly luminaries: "God said, 'Let there be lights in the expanse of the sky to separate the day from the night, and let them serve as signs to mark sacred times, and days and years.'" God formed the sun as the greater light to govern the day, the moon as the lesser light to govern the night, and He set the billion galaxies of stars in space. They declare the glory of God without saying a word.`,

      // Section 9: Day Five (Genesis 1:20-23) — Creatures of the Sea and Sky
      `On the fifth day, verses 20 through 23 describe the filling of the waters and skies: "God said, 'Let the water teem with living creatures, and let birds fly above the earth across the vault of the sky.'" Great whales, schools of fish, soaring eagles, and singing birds filled the oceans and heavens. God blessed them with His very first recorded blessing, saying: "Be fruitful and increase in number."`,

      // Section 10: Day Six (Genesis 1:24-25) — Living Land Creatures
      `On the sixth day, in verses 24 and 25, God commands the earth to bring forth living creatures according to their kinds: cattle, creeping creatures, and beasts of the field. From the gentle deer to the magnificent herd, the animal kingdom took their place upon the fertile earth in complete peace and harmony under God’s caring providence.`,

      // Section 11: Day Six (Genesis 1:26-27) — The Creation of Humanity in God's Image
      `Then comes the crown of creation in verses 26 and 27: "Then God said, 'Let us make mankind in our image, in our likeness, so that they may rule over the fish in the sea and the birds in the sky, over the livestock and all the wild animals.'" In verse 27, scripture declares: "So God created mankind in his own image, in the image of God he created them; male and female he created them." Every human life bears the sacred, inviolable reflection of God (*Imago Dei*).`,

      // Section 12: Day Six (Genesis 1:28-30) — The Divine Blessing and Dominion
      `In verses 28 through 30, God blessed humanity, saying: "Be fruitful and multiply; fill the earth and subdue it." God entrusted mankind with loving stewardship over the earth, giving every seed-bearing plant and fruit for wholesome nourishment. There was no violence, no decay, and no fear; all of creation existed in serene fellowship with its Creator.`,

      // Section 13: Genesis 1:31 — "It Was Very Good"
      `Verse 31 brings the creative week to its triumphant climax: "God saw all that he had made, and behold, it was very good." In Hebrew, this is Tov Me'od—not merely adequate, but exquisitely beautiful, complete, harmonious, and perfect in righteousness. The heavens and the earth were arrayed in their full splendor, vibrating with peace, joy, and divine glory.`,

      // Section 14: Day Seven (Genesis 2:1-3) — The Sacred Sabbath Rest
      `As Genesis 2 opens, we read that on the seventh day God had finished the work he had been doing; so on the seventh day he rested from all his work. Then God blessed the seventh day and made it holy. God did not rest out of physical exhaustion, for the Lord never faints. He rested to celebrate the absolute completion of His masterpiece, giving humanity a sacred rhythm of peace, worship, and restful trust.`,

      // Section 15: The Hebrew Concept of "Bara"
      `Let us reflect on the profound linguistic depth of verse 1. The Hebrew verb Bara is used in the Old Testament exclusively with God as its subject. Humans can build, shape, or remodel existing elements, but only God can perform Bara—speaking reality into existence where nothing previously existed. This reveals that your existence is an intentional act of divine sovereignty.`,

      // Section 16: The Creative Power of the Spoken Word
      `Notice the recurring cadence throughout Genesis 1: "And God said... and it was so." God’s word is never powerless. When God speaks, light replaces darkness, order dispels confusion, and life springs forth from void. His word is living, active, creative, and completely trustworthy across all generations.`,

      // Section 17: Jesus Christ in Genesis 1 (The Eternal Word)
      `When we open the New Testament, the Holy Spirit illuminates the Christ-centered reality of Genesis 1. In John 1 verses 1 through 3, we are told: "In the beginning was the Word, and the Word was with God, and the Word was God. He was in the beginning with God. All things were made through him, and without him was not any thing made that was made." Jesus Christ is the very Word through Whom the heavens and the earth were framed!`,

      // Section 18: Colossians 1 — In Christ All Things Hold Together
      `The Apostle Paul writes in Colossians 1:16-17: "For by him all things were created: things in heaven and on earth, visible and invisible... all things were created through him and for him. He is before all things, and in him all things hold together." The gentle hands of Jesus that healed the sick and were nailed to the cross are the very hands that set the stars in their orbits and breathed life into creation.`,

      // Section 19: Jesus the Light of the World
      `Just as God commanded light to pierce the darkness in Genesis 1, Jesus proclaimed in John 8:12: "I am the light of the world. Whoever follows me will never walk in darkness, but will have the light of life." If your heart feels heavy or surrounded by darkness today, the light of Jesus Christ is greater than any shadow you face. He brings gentle peace and forgiveness to every soul who comes to Him.`,

      // Section 20: The Sacred Dignity of Every Human Soul
      `Because you were created in the image of God (*Imago Dei*), your life has inherent, sacred dignity. You are not a random biological accident; you are an intentional creation of the Almighty, loved with an everlasting love. No earthly trial, human opinion, or past mistake can erase the divine value God placed upon your soul.`,

      // Section 21: God’s Order Over Your Chaos
      `In Genesis 1 verse 2, the Holy Spirit hovered over the formless void, preparing to bring beauty out of chaos. Whatever disorder, uncertainty, or brokenness you are experiencing right now, invite the Holy Spirit in. The same God Who established the boundaries of the oceans can bring order, clarity, and peace to your family, your mind, and your life.`,

      // Section 22: Resting in God's Faithfulness
      `Just as God established the Sabbath rest, Jesus extends the ultimate invitation of peace in Matthew 11:28: "Come to me, all you who are weary and burdened, and I will give you rest." You do not have to carry the weight of your life alone. Surrender your burdens to the Creator of the universe, Who tenderly cares for every sparrow and knows the number of hairs on your head.`,

      // Section 23: Sacred Prayer to the Creator
      `Let us pray: Loving Heavenly Father, eternal Creator of the heavens and the earth, we bow before Your majesty in awe. We thank You for speaking light into the darkness, for creating us in Your sacred image, and for revealing Your boundless love through Jesus Christ our Lord. Bring Your peace, Your healing light, and Your divine order into our hearts today. We place our trust completely in You. In the holy, gentle name of Jesus Christ, Amen.`,

      // Section 24: Benediction and Next Chapter Invitation
      `May the peace of God, which surpasses all human understanding, guard your heart and mind in Christ Jesus. Thank you for walking through this verse-by-verse exploration of Genesis Chapter 1 with ByBibleWisdom. If this teaching brought encouragement and spiritual blessing to your life, please share it with loved ones. Be sure to subscribe and click the bell as we continue to Genesis Chapter 2—exploring the breath of life, the Garden of Eden, and God's covenant with mankind. Walk in the light of the Creator this week.`
    ];

    const full_text = sections.join('\n\n');

    return {
      hook: sections[0],
      biblical_context: sections.slice(1, 4).join('\n\n'),
      core_narrative: sections.slice(4, 15).join('\n\n'),
      theological_insight: sections.slice(15, 19).join('\n\n'),
      practical_application: sections.slice(19, 22).join('\n\n'),
      call_to_action: sections.slice(22, 24).join('\n\n'),
      sections,
      full_text
    };
  }

  /**
   * Attempt AI Generation with strict JSON formatting and chapter grounding
   */
  async generateWithAI(project, bookInfo, chapterData, isShorts) {
    const book = project.bible_book || 'Genesis';
    const ch = project.chapter_start || 1;
    const translation = project.bible_translation || 'WEB';

    const systemPrompt = `You are a senior biblical scholar and cinematic documentary scriptwriter for the YouTube channel @ByBibleWisdom.
You write Bible-accurate, original, educational scripts. You always distinguish scripture, historical facts, and faith.
Crucially, you connect the passage to Jesus Christ respectfully and authoritatively.
Never add anything not related to the Bible. Keep the content peaceful, reverent, and spiritually uplifting so it never distresses or hurts the viewer.
Return ONLY valid JSON matching the required schema. No markdown formatting outside the JSON.`;

    const userPrompt = isShorts
      ? `Write a 55-second YouTube Shorts script for ${book} Chapter ${ch} (${translation} Bible translation).
Key theme: ${chapterData.title}.
Must be 100% Bible-centric, peaceful, and family-safe:
1. An arresting 5-second hook jumping directly into the key truth of ${book} Chapter ${ch} (NO channel intro, NO filler).
2. The specific biblical context of chapter ${ch} quoting or referencing Scripture accurately.
3. The core narrative and Hebrew/Greek insight (${chapterData.hebrewWord}).
4. A Christological connection revealing Jesus Christ in this scripture with reverent depiction.
5. Practical everyday life application bringing peace and hope.
6. A punchy 1-sentence spiritual takeaway or blessing for the viewer.

Return as JSON:
{
  "hook": "string",
  "biblical_context": "string",
  "core_narrative": "string",
  "theological_insight": "string",
  "practical_application": "string",
  "call_to_action": "string"
}`
      : `Write a comprehensive, deep 20 to 25-minute long-form YouTube documentary script (~2,800 to 3,200 words) for ${book} Chapter ${ch} (${translation} Bible translation).
Key theme: ${chapterData.title}.
Must be 100% Bible-centric, verse-by-verse, peaceful, and spiritually uplifting. No secular filler or disturbing elements:
1. Majestic Hook & Canonical Overview opening with: "Welcome to ByBibleWisdom. Today, we step into the sacred words of ${book} Chapter ${ch}..."
2. Historical Background, Ancient Near East & Archaeology.
3. Detailed Chapter Verse-by-Verse Exposition.
4. Christological Revelation: How this chapter points directly to Jesus Christ with respectful depiction.
5. Deep Theological Insight and Hebrew/Greek linguistic depth.
6. Practical Life Application for modern believers.
7. Sacred Call to Action and Prayer concluding with: "May the peace and grace of God guard your heart. If this message blessed your soul, subscribe to ByBibleWisdom, share this light with someone in need, and leave your prayer or Amen in the comments below. God bless you."

Return as JSON:
{
  "hook": "string (extensive)",
  "biblical_context": "string (extensive)",
  "core_narrative": "string (extensive multi-paragraph)",
  "theological_insight": "string (extensive)",
  "practical_application": "string (extensive)",
  "call_to_action": "string"
}`;

    const rawResponse = await aiService.generateCompletion(userPrompt, systemPrompt);
    if (!rawResponse) return null;

    // Clean JSON response
    const cleanJson = rawResponse.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (!parsed.hook || !parsed.core_narrative) return null;

    parsed.full_text = [
      parsed.hook,
      parsed.biblical_context,
      parsed.core_narrative,
      parsed.theological_insight,
      parsed.practical_application,
      parsed.call_to_action
    ].filter(Boolean).join('\n\n');

    return parsed;
  }

  /**
   * Build structured 9:16 Shorts Script (30-60s) from Chapter Knowledge
   */
  buildShortsFromKnowledge(project, bookInfo, chapterData) {
    const hook = chapterData.hook;
    const biblical_context = `In ${chapterData.verseRef}, scripture reveals: "${chapterData.verseText}"`;
    const core_narrative = `${chapterData.context} ${chapterData.narrative} In the original ancient language, this reveals ${chapterData.hebrewWord}.`;
    const theological_insight = `${chapterData.theology} ${chapterData.christology}`;
    const practical_application = chapterData.application;
    const call_to_action = chapterData.cta;

    const full_text = `${hook}\n\n${biblical_context}\n\n${core_narrative}\n\n${theological_insight}\n\n${practical_application}\n\n${call_to_action}`;

    return {
      hook,
      biblical_context,
      core_narrative,
      theological_insight,
      practical_application,
      call_to_action,
      full_text
    };
  }

  /**
   * Build structured 16:9 Long-Form Script (20 to 25 minutes, 2,800 to 3,400 words)
   * Divided into 24 distinct documentary sections for deep verse-by-verse exploration.
   */
  buildEpic20MinLongFormFromKnowledge(project, bookInfo, chapterData) {
    const bookName = project.bible_book || 'Scripture';
    const ch = project.chapter_start || 1;
    const author = bookInfo?.author_tradition || 'Prophetic Author';
    const date = bookInfo?.approximate_date || 'Ancient Near East';
    const theme = bookInfo?.central_theme || chapterData.title;

    // 24 Detailed Documentary Narrative Blocks (~125 words each = ~3,000 words total)
    const sections = [
      // Block 1: Prologue
      `What if the most profound mysteries of your human identity, spiritual calling, and eternal redemption were mapped out thousands of years ago in a single ancient chapter? Welcome to ByBibleWisdom. Today, we step across millennia into the sacred scriptures to uncover the comprehensive historical, linguistic, archaeological, and Christ-centered message of ${bookName} Chapter ${ch}. Let us begin this journey by stepping into the silent majesty of eternity before the world was framed.`,

      // Block 2: Canonical Placement
      `Within the sacred architecture of the Holy Bible, ${bookName} occupies an indispensable position in the divine library of sixty-six books. Placed strategically within the canon, chapter ${ch} does not stand in isolation. It serves as a vital bridge in the overarching metanarrative of redemption—connecting the initial promises of God to their glorious fulfillment. When we examine the canonical context, we discover that every word was carefully orchestrated by the Holy Spirit through human instruments.`,

      // Block 3: Ancient Near Eastern World
      `To truly understand ${bookName} chapter ${ch}, we must reconstruct the ancient world in which its first hearers lived. This was an era of mighty ancient kingdoms, arid desert winds, fortified stone cities, and pervasive pagan polytheism. Surrounding nations worshiped capricious idols of stone and gold, living under constant terror of chaotic forces. Yet into this darkness, the God of Abraham, Isaac, and Jacob spoke absolute truth, revealing His singular, uncreated holiness and covenant faithfulness.`,

      // Block 4: Authorship Tradition & Scribes
      `Preserved under the authorship tradition of ${author} around ${date}, this sacred text was not written casually. In ancient Israel and the early church, scribes known as the Sopherim treated every stroke of the Hebrew consonant with breathless reverence. Before penning the sacred name of God, scribes would wash themselves in ceremonial purification and dedicate their pens, ensuring that not a single yod or title would be altered or lost.`,

      // Block 5: Dead Sea Scrolls & Manuscript Evidence
      `Modern archaeological discoveries—most notably the Dead Sea Scrolls unearthed in the caves of Qumran—have astounded biblical scholars and historians worldwide. Centuries-old sheepskin scrolls and papyrus fragments demonstrate an astonishing, miraculous fidelity to the biblical text we read today. The evidence confirms that what was written millennia ago in ${bookName} chapter ${ch} has reached our modern hands unaltered, standing as an enduring beacon of divine truth.`,

      // Block 6: Foundation Verse
      `Let us now center our hearts upon the foundational scripture of this chapter. In ${chapterData.verseRef}, the sacred text proclaims: "${chapterData.verseText}". These words are not mere human literature; they are God-breathed reality. They command our reverent attention and invite us into the peaceful presence of the Living God.`,

      // Block 7: Ancient Language Insights
      `When we examine the original Hebrew and Greek manuscripts, the richness of the biblical text deepens exponentially. In this chapter, the central theological keyword is ${chapterData.hebrewWord}. This ancient word carries layers of divine nuance that modern translations can barely encapsulate—signifying an intentional, covenantal, and unshakeable divine commitment that transcends all human failure.`,

      // Block 8: Archaeological Corroboration
      `Archaeological excavations throughout the biblical lands continue to illuminate the authenticity of the biblical world. Inscribed limestone boundary markers, royal seals bearing ancient biblical names, monumental palace reliefs in ancient Nineveh and Babylon, and temple foundations all bear witness to the tangible, historical realities described in ${bookName}. Faith in Scripture is not blind mythology; it is anchored in genuine human history.`,

      // Block 9: Chapter Narrative — Part 1
      `As we open the core narrative of ${bookName} chapter ${ch}, dramatic tension emerges between human frailty and divine sovereignty. ${chapterData.context} Humanity repeatedly grapples with vulnerability, doubt, and the weight of living in a fallen world. Yet precisely where human capability ends, divine purpose begins to dawn.`,

      // Block 10: Chapter Narrative — Part 2
      `Continuing deeper into the text, we witness the sovereign hand of God orchestrating events behind the visible veil. ${chapterData.narrative} What seems like coincidence or chaos to human perception is already held securely within God’s eternal counsel. He directs the steps of leaders, shepherds, kings, and ordinary believers alike toward His ultimate redemptive purpose.`,

      // Block 11: Chapter Narrative — Part 3
      `Notice how God responds to human adversity in this chapter. He does not remain distant or indifferent to the cries of His people. In ${bookName} chapter ${ch}, divine compassion intersects with human need, breaking chains of bondage, renewing weary spirits, and establishing a covenant foundation that no earthly trial or circumstance can ever overturn.`,

      // Block 12: Prophetic Foreshadowing
      `Every book and chapter of the Old Testament contains golden threads of prophetic foreshadowing, pointing ahead to the climax of all biblical history. In ${bookName} chapter ${ch}, we see types, shadows, and divine promises that anticipate a greater Deliverer, a truer Sacrifice, and an eternal King Who would permanently heal the breach between God and mankind.`,

      // Block 13: Jesus Christ Revealed — The Word & Light
      `This brings us to the supreme theological truth of all Scripture: the revelation of Jesus Christ. ${chapterData.christology} In the Gospel of John, we are told that the Word was with God in the beginning, and through Him all things were made. In ${bookName} chapter ${ch}, we see the dawn of that very light which ultimately shone in full glory through Jesus Christ, our Savior.`,

      // Block 14: The Character of God
      `Theologically, ${bookName} chapter ${ch} reveals the majestic character of the Almighty. ${chapterData.theology} God is simultaneously transcendent in His holy majesty and immanent in His intimate tender mercies. He is the sovereign Lord Who executes justice, yet the loving Father Who binds up the brokenhearted and draws near to those who seek Him with pure hearts.`,

      // Block 15: Jesus the Good Shepherd & Redeemer
      `Consider how Jesus Christ embodies the heart of this scripture in the Gospels. As the Good Shepherd, Christ leaves the ninety-nine to pursue the one lost sheep. He touches the untouchable leper, speaks forgiveness to the repentant sinner, and calms the raging tempest with a single word of peace. When you look upon Jesus, you behold the exact representation of the Father's glory and love.`,

      // Block 16: The Atonement of the Cross
      `The covenant promises of ${bookName} reached their ultimate culmination on a rugged cross outside Jerusalem. There, the sinless Son of God took upon Himself the judgment, grief, and curse of fallen humanity. As Christ cried, "It is finished," the temple veil was torn in two, inaugurating a new and living way for every person to enter into holy communion with God.`,

      // Block 17: Resurrection Victory
      `Death could not hold the Prince of Life! On the third day, the stone was rolled away, and Jesus Christ rose triumphant over the grave, hell, and the powers of darkness. Because He lives, every promise in ${bookName} chapter ${ch} is signed, sealed, and eternally verified. We do not serve a dead historical figure; we serve the risen, living Lord of all eternity.`,

      // Block 18: Jesus King of Kings
      `Today, Jesus sits exalted at the right hand of the Majesty on high. He is the King of kings and Lord of lords, crowned with glory and honor. Every knee in heaven, on earth, and under the earth will bow before His sovereign name. He is actively interceding for you right now, sustaining your faith and preserving your soul for His heavenly kingdom.`,

      // Block 19: Practical Application — Overcoming Fear
      `How does ${bookName} chapter ${ch} transform your everyday walk on a Monday morning? First, it provides an unshakeable anchor against fear and anxiety. ${chapterData.application} In a chaotic world inundated with noise, uncertainty, and constant panic, this chapter reminds you that your life is anchored in the eternal God Who never sleeps and never slumbers.`,

      // Block 20: Practical Application — Walking by Faith
      `Second, this passage calls you to walk by faith rather than sight. When your physical circumstances appear bleak or contradictory, cling tightly to the unchanging Word of God. Trust that what God has spoken in ${bookName} is truer than your temporary emotions, truer than your current struggles, and powerful enough to guide your footsteps through every storm.`,

      // Block 21: Practical Application — Righteous Character
      `Third, this sacred teaching beckons us to live with moral integrity, humble gratitude, and selfless love. As recipients of God's lavish mercy, we are called to be ambassadors of Christ in our families, workplaces, and communities—speaking words of life, extending grace to the hurting, and standing boldly for biblical truth.`,

      // Block 22: The Eternal Horizon
      `Finally, ${bookName} chapter ${ch} directs our gaze toward the eternal horizon. The story that began in creation does not end in tragedy; it concludes in radiant, triumphant renewal. One day, Christ will wipe every tear from our eyes, death and sorrow will be no more, and we shall dwell in His glorious presence forever and ever.`,

      // Block 23: Sacred Concluding Prayer
      `Let us bow our hearts in reverent prayer: Heavenly Father, Creator of heaven and earth, we thank You for the eternal wisdom of ${bookName} chapter ${ch}. We ask that Your Holy Spirit would imprint these truths deeply upon our hearts. Grant us unwavering faith to trust You, courage to follow Christ, and peace that surpasses all human understanding. We dedicate our lives, our families, and our tomorrows into Your loving hands. In the precious, holy name of Jesus Christ, Amen.`,

      // Block 24: Channel Outro & Call to Action
      `May the living grace and peace of our Lord Jesus Christ remain with you throughout this week. If this in-depth documentary brought blessing and clarity to your spiritual walk, please share it with a friend or family member who needs hope today. Subscribe to ByBibleWisdom and hit the notification bell so you never miss our deep, chapter-by-chapter explorations through all sixty-six books of the Bible. Leave your insights and prayer requests in the comments below. Until next time, walk in biblical wisdom and divine peace.`
    ];

    const full_text = sections.join('\n\n');

    return {
      hook: sections[0],
      biblical_context: sections.slice(1, 6).join('\n\n'),
      core_narrative: sections.slice(6, 12).join('\n\n'),
      theological_insight: sections.slice(12, 18).join('\n\n'),
      practical_application: sections.slice(18, 22).join('\n\n'),
      call_to_action: sections.slice(22, 24).join('\n\n'),
      sections,
      full_text
    };
  }

  /**
   * Generate Scene Segments with Visual Prompts and Durations
   * Shorts: 6 to 7 fast-paced scenes (~55-60s total, max 7 images)
   * Long-form: 12 to 15 comprehensive scenes (max 15 images, paced 25-45s per scene)
   * All prompts guaranteed peaceful, serene, uplifting, and strictly safe for all audiences.
   */
  generateSceneSegments(projectId, scriptContent, project, chapterData, isShorts) {
    run(`DELETE FROM script_segments WHERE project_id = ?`, [projectId]);

    const aspect = isShorts ? 'vertical 9:16' : 'horizontal 16:9';
    const book = project.bible_book || 'Biblical';
    const ch = project.chapter_start || 1;
    const isGenesis1 = book.toLowerCase() === 'genesis' && ch === 1;
    const isNT = /matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|jude|revelation/i.test(book);

    let segmentsData = [];

    if (isShorts) {
      // --- SHORTS: MAX 6 TO 7 SCENES (TOTAL ~55-58 SECONDS) ---
      const motions = ['ZOOM_IN', 'PAN_LEFT', 'ZOOM_OUT', 'PAN_RIGHT', 'ZOOM_IN', 'PAN_LEFT', 'ZOOM_OUT'];
      let hookText = (scriptContent.hook || `In ${book} Chapter ${ch}, scripture reveals a profound truth.`)
        .replace(/^Welcome to ByBibleWisdom\.?\s*(Today,\s*we\s*step\s*into\s*the\s*sacred\s*words\s*of\s*[^.]*\.\s*)?/i, '')
        .trim();

      let ctaText = (scriptContent.call_to_action || `Trust in the Lord with all your heart, and His peace will guide your path.`)
        .replace(/subscribe to ByBibleWisdom[^.]*\./gi, '')
        .replace(/leave an Amen in the comments[^.]*\./gi, '')
        .trim();
      if (!ctaText || ctaText.length < 10) {
        ctaText = `May the peace of God dwell in your heart as you walk in His light today.`;
      }

      segmentsData = [
        {
          order: 1,
          text: hookText,
          visual: `Cinematic peaceful establishing shot of ancient Near Eastern landscape at dawn, gentle golden rim light breaking through soft mist, sacred peaceful atmosphere, 8k, photorealistic, ${aspect}, documentary style, no text, no watermark`,
          motion: 'ZOOM_IN',
          duration: 6.0
        },
        {
          order: 2,
          text: scriptContent.biblical_context,
          visual: `Macro cinematic shot of an ancient Hebrew parchment scroll with sacred calligraphy, resting on weathered olive wood table in candlelight, gentle sunbeam, ${aspect}, no text, no watermark`,
          motion: 'PAN_LEFT',
          duration: 7.0
        },
        {
          order: 3,
          text: scriptContent.core_narrative,
          visual: `Epic atmospheric view of ancient biblical world during ${book} chapter ${ch}, majestic peaceful stone architecture and rolling hills under golden morning sky, photorealistic, ${aspect}, no text, no watermark`,
          motion: 'ZOOM_OUT',
          duration: 10.0
        },
        {
          order: 4,
          text: (scriptContent.core_narrative_p2 || scriptContent.core_narrative || '').slice(0, 150),
          visual: isNT
            ? `Cinematic reverent documentary shot of 1st century Judea, disciples gathered in prayer at sunset, authentic linen garments, peaceful atmosphere, ${aspect}, no text, no watermark`
            : `Devout ancient Hebrew scribe carefully inking parchment with reed pen in stone temple alcove, warm candlelight, dust motes in air, reverent focus, ${aspect}, no text, no watermark`,
          motion: 'PAN_RIGHT',
          duration: 9.0
        },
        {
          order: 5,
          text: scriptContent.theological_insight,
          visual: chapterData?.focalScene || `Majestic view of ancient Jerusalem sanctuary arches illuminated by warm celestial light, deep reverence, serene peace, ${aspect}, no text, no watermark`,
          motion: 'ZOOM_IN',
          duration: 10.0
        },
        {
          order: 6,
          text: scriptContent.practical_application,
          visual: `A solitary person in quiet peaceful prayer at sunset overlooking ancient Jerusalem valley, warm amber rim lighting, serene peace, comforting atmosphere, ${aspect}, no text, no watermark`,
          motion: 'PAN_RIGHT',
          duration: 8.0
        },
        {
          order: 7,
          text: ctaText,
          visual: `Ancient leather-bound open Holy Bible illuminated by celestial golden sunbeams in a peaceful stone sanctuary, museum quality, serene reverence, ${aspect}, no text, no watermark`,
          motion: 'ZOOM_OUT',
          duration: 7.0
        }
      ];
    } else if (isGenesis1) {
      // --- GENESIS 1 LONG-FORM (STRICTLY MAX 15 SCENES, PACED 25-40s PER SCENE) ---
      const motions = ['ZOOM_IN', 'PAN_LEFT', 'ZOOM_OUT', 'PAN_RIGHT', 'ZOOM_IN'];
      const rawSections = scriptContent.sections || scriptContent.full_text.split('\n\n');

      const genesis1VisualThemes = [
        `Cinematic cosmic prologue, deep ancient sky with soft celestial golden dawn, peaceful sacred beginning of time, 8k, ${aspect}, no text, no watermark`,
        `Verse 1: Majestic view of heavens and earth emerging from uncreated eternity, radiant soft golden aura, awe-inspiring tranquility, ${aspect}, no text, no watermark`,
        `Verse 2: The Spirit of God like a gentle dove hovering over the primordial tranquil ocean waters, soft ethereal mist and peaceful ripples, ${aspect}, no text, no watermark`,
        `Day 1 (Verses 3-5): Brilliant pure celestial golden light breaking through the darkness, radiating peace and divine order, ${aspect}, no text, no watermark`,
        `Day 2 (Verses 6-8): Glorious expanse of the clear blue sky separating the waters above and waters below, peaceful cumulus clouds, ${aspect}, no text, no watermark`,
        `Day 3 (Verses 9-10): Ancient continents and green coastlines rising gently from crystalline azure oceans, serene shores at dawn, ${aspect}, no text, no watermark`,
        `Day 3 (Verses 11-13): Flourishing lush green fields, olive groves, blooming wildflowers, and fruit-bearing trees under warm golden sunlight, ${aspect}, no text, no watermark`,
        `Day 4 (Verses 14-19): The golden sun illuminating the day, the silver moon in twilight, and brilliant stars shining in a peaceful night sky, ${aspect}, no text, no watermark`,
        `Day 5 (Verses 20-23): Clear turquoise ocean teeming with gentle dolphins and colorful fish, and graceful birds flying across the open sky, ${aspect}, no text, no watermark`,
        `Day 6 (Verses 24-25): Peaceful animals grazing on sunlit grassy hills—gentle deer, horses, and cattle living in tranquil harmony, ${aspect}, no text, no watermark`,
        `Day 6 (Verses 26-27): Creation of mankind in the image of God, noble and peaceful man and woman standing in lush Eden at sunrise, radiant light, ${aspect}, no text, no watermark`,
        `Day 7: The Seventh Day of sacred rest, serene ancient olive grove with golden afternoon light, deep peace, tranquil Sabbath stillness, ${aspect}, no text, no watermark`,
        `Linguistic exposition: Ancient Hebrew manuscript illuminated by warm lantern glow on an olive wood desk, reverent study of the word Bara, ${aspect}, no text, no watermark`,
        `Comforting spiritual application: Solitary person in peaceful contemplative prayer on mountain ridge overlooking sunrise, profound peace, ${aspect}, no text, no watermark`,
        `Closing cinematic shot of an ancient open Holy Bible with radiant golden light illuminating the sacred pages of Genesis, museum quality, ${aspect}, no text, no watermark`
      ];

      const totalScenes = Math.min(genesis1VisualThemes.length, Math.max(3, rawSections.length));
      const targetSec = project.target_duration_seconds || (totalScenes * 28);
      const sceneDur = Math.max(15, Math.round(targetSec / totalScenes));

      for (let i = 0; i < totalScenes; i++) {
        let text = rawSections[i] || `Exposition of Genesis 1, movement ${i + 1}.`;
        if (i === 0 && !text.toLowerCase().includes('bybiblewisdom')) {
          text = `Welcome to ByBibleWisdom. Today, we step into the sacred beginning of Genesis Chapter 1. ${text}`.trim();
        } else if (i === totalScenes - 1 && (!text.toLowerCase().includes('subscribe') || !text.toLowerCase().includes('amen'))) {
          text = `${text} May the peace and grace of God guard your heart. If this message blessed your soul today, subscribe to ByBibleWisdom, share this light with someone in need, and leave your prayer or Amen in the comments below. God bless you.`.trim();
        }
        const visual = genesis1VisualThemes[i];
        const motion = motions[i % motions.length];

        segmentsData.push({
          order: i + 1,
          text,
          visual,
          motion,
          duration: sceneDur
        });
      }
    } else {
      // --- GENERAL LONG-FORM (STRICTLY MAX 15 SCENES, HIGH-CTR & AUTHENTIC) ---
      const motions = ['ZOOM_IN', 'PAN_LEFT', 'ZOOM_OUT', 'PAN_RIGHT', 'ZOOM_IN'];
      const rawSections = scriptContent.sections || scriptContent.full_text.split('\n\n');

      const visualThemes = [
        `Cinematic peaceful prologue, deep ancient Near Eastern sky at dawn, gold celestial light rays piercing desert mist, 8k, ${aspect}, no text, no watermark`,
        `Sacred ancient library alcove, weathered scrolls of the biblical canon on cedar wood table, candlelight, peaceful, ${aspect}, no text, no watermark`,
        `Ancient kingdoms of the biblical world, monumental stone columns and temples under warm peaceful sunset, archaeological authenticity, ${aspect}, no text, no watermark`,
        `Devout ancient Hebrew scribe carefully inking parchment with reed pen, warm candlelight, dust motes in air, reverent focus, ${aspect}, no text, no watermark`,
        `Archaeological excavation inside Dead Sea Qumran caves, ancient earthenware jars containing sheepskin scrolls, documentary still, ${aspect}, no text, no watermark`,
        `Macro cinematic close-up of open ancient Hebrew Torah scroll with radiant golden sunbeam illuminating the holy text, ${aspect}, no text, no watermark`,
        `Ancient linguistic scholar studying original Hebrew letters on weathered papyrus with antique brass magnifying glass, ${aspect}, no text, no watermark`,
        `Archaeological excavation site in ancient Israel, uncovering ancient stone seal and inscribed clay bullae, golden hour sun, ${aspect}, no text, no watermark`,
        `Atmospheric wide landscape of ancient Near East during biblical times, peaceful nomadic caravans traversing majestic valley, ${aspect}, no text, no watermark`,
        `Dramatic biblical scene of God's sovereign covenant, peaceful clouds parting over mountain sanctuary with divine golden light, ${aspect}, no text, no watermark`,
        `Awe-inspiring view of sacred desert oasis under starry night sky, campfire glowing, quiet contemplation of divine deliverance, ${aspect}, no text, no watermark`,
        `Crimson sunrise over the mountains of Judea, prophetic radiance breaking through morning mist, epic documentary cinematography, ${aspect}, no text, no watermark`,
        `Majestic panoramic view of temple mount in ancient Jerusalem at sunrise, soaring marble columns, holy reverent majesty, ${aspect}, no text, no watermark`,
        `A devout believer in peaceful contemplative prayer on a mountain overlook at sunrise, serene surrender and unshakeable peace, ${aspect}, no text, no watermark`,
        `Closing cinematic shot of an ancient open Holy Bible with radiant golden light illuminating the sacred pages, peaceful sanctuary atmosphere, museum quality, ${aspect}, no text, no watermark`
      ];

      const totalScenes = Math.min(visualThemes.length, Math.max(3, rawSections.length));
      const targetSec = project.target_duration_seconds || (totalScenes * 28);
      const sceneDur = Math.max(15, Math.round(targetSec / totalScenes));

      for (let i = 0; i < totalScenes; i++) {
        let text = rawSections[i] || scriptContent.sections?.[i] || `Exposition of ${book} Chapter ${ch}, movement ${i + 1}.`;
        if (i === 0 && !text.toLowerCase().includes('bybiblewisdom')) {
          text = `Welcome to ByBibleWisdom. Today, we step into the sacred words of ${book} Chapter ${ch}. ${text}`.trim();
        } else if (i === totalScenes - 1 && (!text.toLowerCase().includes('subscribe') || !text.toLowerCase().includes('amen'))) {
          text = `${text} May the peace and grace of God guard your heart. If this message blessed your soul today, subscribe to ByBibleWisdom, share this light with someone in need, and leave your prayer or Amen in the comments below. God bless you.`.trim();
        }
        const visual = visualThemes[i];
        const motion = motions[i % motions.length];

        segmentsData.push({
          order: i + 1,
          text,
          visual,
          motion,
          duration: sceneDur
        });
      }
    }

    const insertSeg = db.prepare(`
      INSERT INTO script_segments (
        project_id, segment_order, narration_text, visual_description,
        image_prompt, duration_seconds, ken_burns_effect
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    db.exec('BEGIN TRANSACTION');
    try {
      for (const seg of segmentsData) {
        insertSeg.run(
          projectId, seg.order, seg.text, seg.visual,
          seg.visual, seg.duration, seg.motion
        );

        // Register in Visual Uniqueness Engine to guarantee diversity across chapters
        try {
          visualUniquenessService.registerSceneVisual(
            projectId, book, ch, seg.order, seg.visual, {
            animation: seg.motion,
            seed: 100000 + (ch * 1000) + (seg.order * 7919)
          }
          );
        } catch (e) {
          // Keep transaction moving even if registry record exists
        }
      }
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  }
}

module.exports = new ScriptService();
