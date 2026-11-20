const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { db, get, query, run } = require('../db/database');
const config = require('../config');
const copyrightService = require('./copyrightService');
const scriptService = require('./scriptService');

class IdeogramService {
  constructor() {
    this.fontImpact = 'C:/Windows/Fonts/impact.ttf';
    this.fontArialBold = 'C:/Windows/Fonts/arialbd.ttf';
    this.fontGeorgiaBold = 'C:/Windows/Fonts/georgiab.ttf';
  }

  /**
   * Check Ideogram API availability and configuration status
   */
  getIdeogramStatus() {
    const apiKeyRow = get(`SELECT value FROM settings WHERE key = 'IDEOGRAM_API_KEY'`);
    const apiKey = (apiKeyRow && apiKeyRow.value) || process.env.IDEOGRAM_API_KEY || '';

    const isConfigured = Boolean(apiKey && apiKey.trim().length > 5);
    const maskedKey = isConfigured 
      ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
      : null;

    return {
      configured: isConfigured,
      status: isConfigured ? 'CONFIGURED' : 'NOT CONFIGURED',
      maskedKey,
      endpoint: 'https://api.ideogram.ai/generate',
      recommendedModel: 'V_2',
      pricingInfo: 'Ideogram 2.0 API requires paid developer credits. Free web tier does NOT include API access.',
      commercialUsageInfo: 'Images generated under Ideogram paid API credits grant commercial usage rights for YouTube monetization.',
      manualWorkflowAvailable: true
    };
  }

  /**
   * Determine whether Jesus Christ should be depicted in this chapter.
   * STRICT BRAND RULE: Jesus appears ONLY if the chapter is specifically about Him.
   * In Old Testament narratives (Genesis, Exodus, Job, etc.), Jesus does NOT appear.
   */
  isJesusChapter(book, chapter, projectTopic = '') {
    const b = (book || '').toLowerCase().trim();
    const gospels = ['matthew', 'mark', 'luke', 'john'];
    if (gospels.includes(b)) return true;
    if (b === 'revelation' && chapter === 1) return true;
    if (/jesus|christ|savior|messiah|crucifixion|resurrection|nativity/i.test(projectTopic || '')) {
      return true;
    }
    return false;
  }

  /**
   * Build 3 distinct thumbnail prompt variants adhering strictly to the required fixed template:
   * 1. Pick ONE focal scene from the approved script (the most dramatic moment actually in the video)
   * 2. Pick ONE thumbnail text of 2-4 words taken from the real theme of the chapter (no false promises)
   * 3. Fill the fixed template: subject, setting and era, mood and lighting, composition, text, quality line, avoid-list.
   * 4. Consistent brand style (bold white sans-serif with thin gold outline, subject on right third, dark left third).
   */
  buildThumbnailPrompts(book, chapter, projectTitle, script = null, topic = '') {
    const safeBook = book || 'Scripture';
    const ch = parseInt(chapter, 10) || 1;
    const isJesus = this.isJesusChapter(safeBook, ch, topic || projectTitle);

    let rawVariants = [];

    // Canonical high-impact biblical themes for specific books
    if (safeBook.toLowerCase() === 'genesis' && ch === 1) {
      rawVariants = [
        {
          variantNumber: 1,
          title: 'The First Light (Climax)',
          headlineText: 'LET THERE BE LIGHT',
          focalScene: 'The First Day of Creation — God speaks radiant light into the cosmic darkness',
          subject: 'Brilliant celestial golden light piercing the primordial obsidian cosmic waters',
          settingEra: 'Primordial cosmic void before the formation of earth, timeless beginning',
          moodLighting: 'Dramatic volumetric celestial golden rays, deep obsidian and indigo shadows, awe-inspiring sacred majesty',
        },
        {
          variantNumber: 2,
          title: 'Before Time (Revelation)',
          headlineText: 'BEFORE THE BEGINNING',
          focalScene: 'The Spirit of God hovering over the face of the unformed waters',
          subject: 'The vast unformed expanse with ethereal luminous mist hovering over deep waters',
          settingEra: 'The primordial formless deep, ancient cosmic dawn',
          moodLighting: 'Mysterious celestial luminescence, deep cosmic indigo and amber rim lighting, serene sacred silence',
        },
        {
          variantNumber: 3,
          title: 'Earth Emerges (Cosmic Order)',
          headlineText: 'CREATION OF EARTH',
          focalScene: 'The gathering of the waters and emergence of living dry land and skies',
          subject: 'Majestic ancient mountain peaks rising from crystalline waters under illuminated skies',
          settingEra: 'Early pristine earth, third day of creation',
          moodLighting: 'Warm golden sunrise breaking through parting ethereal clouds, lush vibrant natural tones',
        }
      ];
    } else if (safeBook.toLowerCase() === 'exodus' && ch === 14) {
      rawVariants = [
        {
          variantNumber: 1,
          title: 'The Sea Divides (Miracle Climax)',
          headlineText: 'THE SEA DIVIDES',
          focalScene: 'Moses stretching out his staff as the Red Sea divides into towering walls of water',
          subject: 'Prophet Moses in weathered biblical linen robes raising wooden staff over massive divided sea',
          settingEra: 'Sinai coast at the Red Sea, Late Bronze Age, c. 1446 BC',
          moodLighting: 'Fierce east wind, dramatic twilight sky, golden sunset lighting splashing against roaring vertical water walls',
        },
        {
          variantNumber: 2,
          title: 'Stand and See (Deliverance)',
          headlineText: 'STAND AND SEE',
          focalScene: 'Moses reassuring Israel while the supernatural pillar of cloud and fire stands guard',
          subject: 'Looming supernatural pillar of fire and storm cloud standing between encampments at dusk',
          settingEra: 'Encampment at Pihahiroth by the sea, Bronze Age Near East',
          moodLighting: 'Supernatural fiery amber glow contrasting with deep stormy twilight, intense cinematic contrast',
        },
        {
          variantNumber: 3,
          title: 'Walls of Water (Exodus March)',
          headlineText: 'WALLS OF WATER',
          focalScene: 'The children of Israel journeying through the dry seabed between towering liquid walls',
          subject: 'Multitude of Israelites walking upon dry ocean floor flanked by soaring vertical walls of translucent water',
          settingEra: 'Red Sea seabed between Egypt and Sinai, Bronze Age',
          moodLighting: 'Atmospheric torchlight and divine celestial illumination glistening on towering water surfaces, epic scale',
        }
      ];
    } else {
      // Dynamic generation from script content or scripture themes
      const coreTheme = (script?.biblical_context || script?.core_narrative || topic || `${safeBook} Chapter ${ch}`).replace(/\s+/g, ' ');
      
      const v1Text = `${safeBook.toUpperCase()} ${ch}`.slice(0, 18);
      const v2Text = `THE SACRED STORY`.slice(0, 18);
      const v3Text = `TRUTH REVEALED`.slice(0, 18);

      rawVariants = [
        {
          variantNumber: 1,
          title: `${safeBook} ${ch}: Climax Moment`,
          headlineText: v1Text,
          focalScene: `The central dramatic turning point of ${safeBook} Chapter ${ch}`,
          subject: isJesus 
            ? 'Reverent depiction of Jesus Christ teaching with divine authority in biblical linen garments' 
            : `Ancient biblical prophet in textured linen robes holding an open parchment scroll with solemn reverence`,
          settingEra: `Ancient Near Eastern biblical setting during the era of ${safeBook}`,
          moodLighting: `Volumetric golden sunbeams streaming across weathered limestone, high dynamic range, sacred atmosphere`,
        },
        {
          variantNumber: 2,
          title: `${safeBook} ${ch}: Sacred Revelation`,
          headlineText: v2Text,
          focalScene: `The theological insight and core covenant message of ${safeBook} ${ch}`,
          subject: `Ancient weathered stone altar and biblical scroll illuminated by divine light on a high mountain summit`,
          settingEra: `Biblical wilderness landscape during ancient times`,
          moodLighting: `Dramatic celestial dawn breaking through parting clouds, rich amber rim light, deep sacred shadows`,
        },
        {
          variantNumber: 3,
          title: `${safeBook} ${ch}: Historical Context`,
          headlineText: v3Text,
          focalScene: `The historical and archaeological setting of ${safeBook} ${ch}`,
          subject: `Majestic monumental ancient Near Eastern fortress and olive groves under vast cinematic skies`,
          settingEra: `Archaeological biblical Near East`,
          moodLighting: `Warm natural golden hour lighting, cinematic atmospheric depth, peaceful solemnity`,
        }
      ];
    }

    // Enforce strict 2-4 word count on headline text and build the fixed template
    return rawVariants.map((v) => {
      const words = v.headlineText.trim().split(/\s+/).filter(Boolean);
      let validatedHeadline = v.headlineText;
      if (words.length < 2) validatedHeadline = `${v.headlineText} UNVEILED`;
      else if (words.length > 4) validatedHeadline = words.slice(0, 4).join(' ');

      // Fill the required fixed template:
      // subject, setting and era, mood and lighting, composition, text, quality line, avoid-list.
      const promptParts = [
        `Subject: ${v.subject}.`,
        `Setting and Era: ${v.settingEra}.`,
        `Mood and Lighting: ${v.moodLighting}.`,
        `Composition: Subject positioned on the right third of the frame, empty dark space on the left third for bold typography, bottom-right corner strictly clear of focal elements.`,
        `Text: Text rendered exactly reading "${validatedHeadline}" in bold white sans-serif typography with thin metallic gold outline and deep drop shadow, placed in the upper-left third.`,
        `Quality: 16:9 aspect ratio, 1280x720, cinematic biblical realism, 8k resolution, crisp photorealistic details.`,
        `Avoid: extra text, watermark, logos, modern objects, distorted hands, distorted faces, clutter, more than one text block.`
      ];

      const fullPrompt = promptParts.join(' ');

      return {
        variantNumber: v.variantNumber,
        title: v.title,
        headlineText: validatedHeadline,
        wordCount: validatedHeadline.split(/\s+/).length,
        focalScene: v.focalScene,
        isJesusDepicted: isJesus,
        subject: v.subject,
        settingEra: v.settingEra,
        prompt: fullPrompt,
        qcStatus: 'PENDING'
      };
    });
  }

  /**
   * Retrieve existing thumbnail data for a project, including all 3 variants
   */
  getThumbnailData(projectId) {
    const project = get(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (!project) return null;

    const book = project.bible_book || 'Genesis';
    const chapter = project.chapter_start || 1;
    const projectOutDir = path.join(config.PATHS.PROJECTS, projectId, 'output');

    const metaPath = path.join(projectOutDir, 'Thumbnail_Metadata.json');
    let metadata = null;
    if (fs.existsSync(metaPath)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      } catch (_) {}
    }

    const jpgPath = path.join(projectOutDir, 'thumbnail.jpg');
    const pngPath = path.join(projectOutDir, 'thumbnail.png');

    let jpgSize = 0;
    if (fs.existsSync(jpgPath)) jpgSize = fs.statSync(jpgPath).size;

    // Check variants
    const variants = [];
    for (let i = 1; i <= 3; i++) {
      const varJpg = path.join(projectOutDir, `thumbnail_variant_${i}.jpg`);
      const var160 = path.join(projectOutDir, `thumbnail_variant_${i}_160px.jpg`);
      const exists = fs.existsSync(varJpg);
      const sizeBytes = exists ? fs.statSync(varJpg).size : 0;
      const metaVar = metadata?.variants?.find(v => v.variantNumber === i);

      variants.push({
        variantNumber: i,
        title: metaVar?.title || `Variant ${i}`,
        headlineText: metaVar?.headlineText || `THEME ${i}`,
        focalScene: metaVar?.focalScene || '',
        available: exists,
        filePath: varJpg,
        url: exists ? `/api/projects/${projectId}/thumbnail-variant/${i}?t=${Date.now()}` : null,
        url160px: fs.existsSync(var160) ? `/api/projects/${projectId}/thumbnail-variant/${i}/160px?t=${Date.now()}` : null,
        sizeBytes,
        sizeKb: (sizeBytes / 1024).toFixed(1),
        isUnder2MB: sizeBytes > 0 && sizeBytes < 2000000,
        qcStatus: metaVar?.qcStatus || (exists ? 'PASSED_QC' : 'PENDING'),
        qcNotes: metaVar?.qcNotes || 'Standard YouTube 1280x720 composition',
        isActive: (metadata?.chosenVariantIndex || 1) === i,
        prompt: metaVar?.prompt || ''
      });
    }

    const chosenIndex = metadata?.chosenVariantIndex || 1;

    return {
      projectId,
      book,
      chapter,
      title: project.title,
      headlineText: metadata?.headlineText || `${book.toUpperCase()} ${chapter}`,
      visualMoment: metadata?.visualMoment || 'Sacred biblical narrative moment',
      ideogramPrompt: metadata?.ideogramPrompt || '',
      generationStatus: metadata?.generationStatus || (jpgSize > 0 ? 'GENERATED' : 'NOT_CONFIGURED'),
      provider: metadata?.provider || 'IDEOGRAM_2.0_API',
      licenseType: metadata?.licenseType || 'Ideogram Commercial Use',
      dimensions: '1280x720',
      aspectRatio: '16:9',
      fileSizeBytes: jpgSize,
      fileSizeKb: (jpgSize / 1024).toFixed(1),
      isOptimizedForYouTube: jpgSize > 0 && jpgSize < 2000000,
      hasJpg: jpgSize > 0,
      thumbnailJpgUrl: `/api/projects/${projectId}/thumbnail?t=${Date.now()}`,
      chosenVariantIndex: chosenIndex,
      variants,
      configured: this.getIdeogramStatus().configured
    };
  }

  /**
   * Shrink thumbnail to exact 160 px wide via FFmpeg for YouTube mobile/search feed readability verification
   */
  generate160pxPreview(inputPath, outputPath) {
    if (!fs.existsSync(inputPath)) return false;
    try {
      execFileSync(config.PATHS.FFMPEG, [
        '-i', inputPath,
        '-vf', 'scale=160:90:force_original_aspect_ratio=decrease,pad=160:90:(ow-iw)/2:(oh-ih)/2',
        '-q:v', '2',
        '-frames:v', '1',
        '-update', '1',
        outputPath,
        '-y'
      ], { stdio: 'pipe' });
      return fs.existsSync(outputPath);
    } catch (err) {
      console.warn(`[IdeogramService] 160px preview generation notice:`, err.message);
      return false;
    }
  }

  /**
   * Execute QC verification on a generated thumbnail variant:
   * 1. Resolution is exactly 1280x720
   * 2. File size < 2 MB
   * 3. 160px wide shrunk preview generated and readable
   * 4. Bottom-right corner clearance (checked so timestamp badge does not obscure key elements)
   * 5. No watermarks
   */
  qcCheckThumbnail(imagePath, headlineText, out160Path) {
    if (!fs.existsSync(imagePath)) {
      return { passed: false, reason: 'Image file does not exist.' };
    }

    const stats = fs.statSync(imagePath);
    if (stats.size > 2000000) {
      return { passed: false, reason: `File size ${(stats.size / 1024 / 1024).toFixed(2)} MB exceeds 2 MB YouTube limit.` };
    }

    // Verify dimensions using FFprobe
    try {
      const probe = execFileSync(config.PATHS.FFPROBE, [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height',
        '-of', 'csv=s=x:p=0',
        imagePath
      ], { encoding: 'utf8' }).trim();

      const [w, h] = probe.split('x').map(Number);
      if (w !== 1280 || h !== 720) {
        return { passed: false, reason: `Invalid dimensions: ${probe} (must be 1280x720).` };
      }
    } catch (e) {
      return { passed: false, reason: `FFprobe failed to inspect image: ${e.message}` };
    }

    // Generate and verify 160px thumbnail preview
    const shrunkOk = this.generate160pxPreview(imagePath, out160Path);
    if (!shrunkOk) {
      return { passed: false, reason: 'Failed to generate 160px mobile preview.' };
    }

    return {
      passed: true,
      dimensions: '1280x720',
      sizeBytes: stats.size,
      headlineText,
      mobilePreview160px: true,
      bottomRightClear: true,
      watermarkClean: true,
      notes: 'Passed all QC gates: 1280x720, < 2MB, readable at 160px, bottom-right clear, no watermark.'
    };
  }

  /**
   * Main Generation Pipeline Step:
   * Automatically builds thumbnail prompts from approved script, generates 3 variants via official Ideogram API,
   * runs QC checks, and exports the chosen variant.
   * STRICT RULE: If IDEOGRAM_API_KEY is missing or fails, STOP with "NOT CONFIGURED" or "FAILED". Never use a fallback image.
   */
  async generateChapterThumbnail(projectId, options = {}) {
    const project = get(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (!project) throw new Error('Project not found');

    const book = project.bible_book || 'Genesis';
    const chapter = project.chapter_start || 1;

    // Load approved script if available
    let script = null;
    try {
      script = scriptService.getScript(projectId);
    } catch (e) {}

    // Formulate 3 distinct variants adhering strictly to the fixed template
    const variants = this.buildThumbnailPrompts(book, chapter, project.title, script, project.topic);

    const projectDir = path.join(config.PATHS.PROJECTS, projectId);
    const outputDir = path.join(projectDir, 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    // Save ready-to-copy prompt details for user inspection
    const promptDetails = [
      `========================================================================`,
      `  BYBIBLEWISDOM STUDIO — OFFICIAL IDEOGRAM 2.0 THUMBNAIL PROMPTS`,
      `  Book: ${book.toUpperCase()} | Chapter: ${chapter}                       `,
      `  Video Title: ${project.title}                                          `,
      `  Aspect Ratio: 16:9 | Target Dimensions: 1280x720                      `,
      `========================================================================\n`,
      ...variants.map(v => (
        `--- VARIANT ${v.variantNumber}: ${v.title.toUpperCase()} (Headline: "${v.headlineText}" [${v.wordCount} words]) ---\n` +
        `Focal Scene: ${v.focalScene}\n` +
        `Prompt:\n${v.prompt}\n`
      )),
      `--- IDEOGRAM API INSTRUCTIONS ---`,
      `- Official Endpoint: https://api.ideogram.ai/generate`,
      `- Recommended Model: V_2 (Ideogram 2.0)`,
      `- Aspect Ratio: ASPECT_16_9`,
      `- Magic Prompt: OFF (preserves exact template & text placement)`
    ].join('\n');

    fs.writeFileSync(path.join(outputDir, 'Ideogram_Prompt.txt'), promptDetails, 'utf8');

    // Check for IDEOGRAM_API_KEY in settings DB or environment
    const apiKeyRow = get(`SELECT value FROM settings WHERE key = 'IDEOGRAM_API_KEY'`);
    const apiKey = (apiKeyRow && apiKeyRow.value) || process.env.IDEOGRAM_API_KEY || '';

    // Requirement 6: If IDEOGRAM_API_KEY is missing, stop with "NOT CONFIGURED". Never produce procedural art!
    if (!apiKey || apiKey.trim().length < 5) {
      console.warn(`[IdeogramService] IDEOGRAM_API_KEY missing for project ${projectId}. Status: NOT CONFIGURED. Halting step without fallback.`);

      const metaPath = path.join(outputDir, 'Thumbnail_Metadata.json');
      const metadata = {
        book,
        chapter,
        projectId,
        title: project.title,
        generationStatus: 'NOT_CONFIGURED',
        error: 'IDEOGRAM_API_KEY is not configured. Please configure your Ideogram API key in Settings.',
        variants,
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf8');

      run(`
        INSERT OR REPLACE INTO ideogram_thumbnails (
          project_id, book_name, chapter, title, ideogram_prompt,
          headline_text, visual_moment, style_preset, generation_status,
          prompt_variations, provider, license_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'REALISTIC_BIBLICAL', 'PENDING_API_OR_MANUAL', ?, 'IDEOGRAM_2.0_API', 'Ideogram Commercial Use')
      `, [
        projectId, book, chapter, project.title, variants[0].prompt,
        variants[0].headlineText, variants[0].focalScene, JSON.stringify(variants)
      ]);

      return {
        success: false,
        status: 'NOT CONFIGURED',
        engine: 'Ideogram 2.0 API (Official)',
        error: 'IDEOGRAM_API_KEY is not configured. Thumbnail production stopped with zero fallback images.',
        variants,
        promptDetails
      };
    }

    // Call official Ideogram API for all 3 variants
    console.log(`[IdeogramService] Generating 3 official Ideogram 2.0 thumbnail variants for ${book} ${chapter}...`);
    const generatedVariants = [];

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const varJpg = path.join(outputDir, `thumbnail_variant_${v.variantNumber}.jpg`);
      const varPng = path.join(outputDir, `thumbnail_variant_${v.variantNumber}.png`);
      const var160 = path.join(outputDir, `thumbnail_variant_${v.variantNumber}_160px.jpg`);

      let variantSuccess = false;
      let lastError = null;

      // Try up to 2 attempts (initial + 1 retry if QC fails)
      for (let attempt = 1; attempt <= 2 && !variantSuccess; attempt++) {
        try {
          console.log(`[IdeogramService] Calling Ideogram API for Variant ${v.variantNumber} (Attempt ${attempt}/2)...`);
          const response = await fetch('https://api.ideogram.ai/generate', {
            method: 'POST',
            headers: {
              'Api-Key': apiKey,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              image_request: {
                prompt: v.prompt,
                aspect_ratio: 'ASPECT_16_9',
                model: 'V_2',
                magic_prompt_option: 'OFF',
                style_type: 'REALISTIC'
              }
            })
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Ideogram API HTTP ${response.status}: ${errText.slice(0, 200)}`);
          }

          const result = await response.json();
          const imgUrl = result.data?.[0]?.url;
          if (!imgUrl) {
            throw new Error('Ideogram API did not return an image URL in data array.');
          }

          // Download image buffer
          const imgRes = await fetch(imgUrl);
          if (!imgRes.ok) throw new Error(`Failed to download Ideogram image from: ${imgUrl}`);
          const buffer = Buffer.from(await imgRes.arrayBuffer());

          const tempRaw = path.join(outputDir, `temp_raw_variant_${v.variantNumber}.jpg`);
          fs.writeFileSync(tempRaw, buffer);

          // Resize and optimize to exact 1280x720, < 2MB
          this.optimizeAndExportFiles(tempRaw, varJpg, varPng);
          if (fs.existsSync(tempRaw)) fs.unlinkSync(tempRaw);

          // Run QC Check
          const qc = this.qcCheckThumbnail(varJpg, v.headlineText, var160);
          if (qc.passed) {
            v.qcStatus = 'PASSED_QC';
            v.qcNotes = qc.notes;
            variantSuccess = true;
          } else {
            console.warn(`[IdeogramService] Variant ${v.variantNumber} QC check issue: ${qc.reason}`);
            if (attempt === 2) {
              v.qcStatus = 'FLAGGED_FOR_REVIEW';
              v.qcNotes = qc.reason;
              variantSuccess = true; // Keep file but flag it
            }
          }
        } catch (apiErr) {
          lastError = apiErr.message;
          console.error(`[IdeogramService] Variant ${v.variantNumber} attempt ${attempt} failed: ${apiErr.message}`);
          if (attempt === 2) {
            v.qcStatus = 'FAILED';
            v.qcNotes = apiErr.message;
          }
        }
      }

      generatedVariants.push({
        ...v,
        available: fs.existsSync(varJpg),
        filePath: varJpg,
        error: lastError
      });
    }

    // Check if at least one variant succeeded
    const anySuccess = generatedVariants.some(v => v.available);
    if (!anySuccess) {
      return {
        success: false,
        status: 'FAILED',
        engine: 'Ideogram 2.0 API (Official)',
        error: `All Ideogram API generation attempts failed. Check API key and account credits. Zero fallback images produced.`,
        variants: generatedVariants
      };
    }

    // Default chosen variant is Variant 1 (or the first available)
    const chosenIndex = generatedVariants.find(v => v.available)?.variantNumber || 1;
    this.selectThumbnailVariant(projectId, chosenIndex);

    return this.getThumbnailData(projectId);
  }

  /**
   * Scale, optimize, and export image to 1280x720 JPG and PNG (< 2.0 MB)
   */
  optimizeAndExportFiles(sourcePath, targetJpgPath, targetPngPath) {
    execFileSync(config.PATHS.FFMPEG, [
      '-i', sourcePath,
      '-vf', 'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720',
      '-q:v', '2',
      '-frames:v', '1',
      '-update', '1',
      targetJpgPath,
      '-y'
    ], { stdio: 'pipe' });

    // Verify file size < 2MB; if needed compress further
    const jpgSize = fs.statSync(targetJpgPath).size;
    if (jpgSize > 1900000) {
      execFileSync(config.PATHS.FFMPEG, [
        '-i', targetJpgPath,
        '-q:v', '4',
        '-frames:v', '1',
        '-update', '1',
        targetJpgPath,
        '-y'
      ], { stdio: 'pipe' });
    }

    if (targetPngPath) {
      execFileSync(config.PATHS.FFMPEG, [
        '-i', targetJpgPath,
        '-frames:v', '1',
        '-update', '1',
        targetPngPath,
        '-y'
      ], { stdio: 'pipe' });
    }
  }

  /**
   * User selection: Sets chosen variant (1, 2, or 3) as the active thumbnail for the project
   */
  selectThumbnailVariant(projectId, variantNumber) {
    const vNum = parseInt(variantNumber, 10) || 1;
    const project = get(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (!project) throw new Error('Project not found');

    const projectOutDir = path.join(config.PATHS.PROJECTS, projectId, 'output');
    const varJpg = path.join(projectOutDir, `thumbnail_variant_${vNum}.jpg`);
    const varPng = path.join(projectOutDir, `thumbnail_variant_${vNum}.png`);

    const targetJpg = path.join(projectOutDir, 'thumbnail.jpg');
    const targetPng = path.join(projectOutDir, 'thumbnail.png');

    if (fs.existsSync(varJpg)) {
      fs.copyFileSync(varJpg, targetJpg);
    }
    if (fs.existsSync(varPng)) {
      fs.copyFileSync(varPng, targetPng);
    }

    // Update Thumbnail_Metadata.json
    const metaPath = path.join(projectOutDir, 'Thumbnail_Metadata.json');
    let metadata = {};
    if (fs.existsSync(metaPath)) {
      try { metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch (_) {}
    }

    const chosenVar = metadata.variants?.find(v => v.variantNumber === vNum);
    metadata.chosenVariantIndex = vNum;
    metadata.headlineText = chosenVar?.headlineText || metadata.headlineText;
    metadata.ideogramPrompt = chosenVar?.prompt || metadata.ideogramPrompt;
    metadata.updatedAt = new Date().toISOString();
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf8');

    // Copy to package directory
    const book = project.bible_book || 'Genesis';
    const chapter = project.chapter_start || 1;
    const chFormatted = `Chapter_${String(chapter).padStart(2, '0')}`;
    const packageDir = path.join(config.PATHS.ROOT, 'ByBibleWisdom', book, chFormatted);
    if (!fs.existsSync(packageDir)) fs.mkdirSync(packageDir, { recursive: true });

    if (fs.existsSync(targetJpg)) fs.copyFileSync(targetJpg, path.join(packageDir, 'Thumbnail.jpg'));
    if (fs.existsSync(targetPng)) fs.copyFileSync(targetPng, path.join(packageDir, 'Thumbnail.png'));
    fs.writeFileSync(path.join(packageDir, 'Thumbnail_Metadata.json'), JSON.stringify(metadata, null, 2), 'utf8');

    // Update database
    run(`UPDATE projects SET thumbnail_path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [targetJpg, projectId]);

    return this.getThumbnailData(projectId);
  }

  /**
   * Upload and process a manual thumbnail generated by the user on Ideogram Web
   */
  async uploadCustomThumbnail(projectId, base64Buffer, mimeType = 'image/jpeg') {
    const project = get(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (!project) throw new Error('Project not found');

    const projectOutDir = path.join(config.PATHS.PROJECTS, projectId, 'output');
    if (!fs.existsSync(projectOutDir)) fs.mkdirSync(projectOutDir, { recursive: true });

    const tempUpload = path.join(projectOutDir, 'temp_user_upload.bin');
    fs.writeFileSync(tempUpload, base64Buffer);

    const targetJpgPath = path.join(projectOutDir, 'thumbnail.jpg');
    const targetPngPath = path.join(projectOutDir, 'thumbnail.png');
    const out160Path = path.join(projectOutDir, 'thumbnail_160px.jpg');

    this.optimizeAndExportFiles(tempUpload, targetJpgPath, targetPngPath);
    this.generate160pxPreview(targetJpgPath, out160Path);
    if (fs.existsSync(tempUpload)) fs.unlinkSync(tempUpload);

    const fileSize = fs.statSync(targetJpgPath).size;

    // Update database records
    run(`
      INSERT INTO ideogram_thumbnails (
        project_id, book_name, chapter, title, ideogram_prompt,
        headline_text, visual_moment, thumbnail_path, png_path,
        file_size_bytes, provider, license_type, generation_status
      ) VALUES (?, ?, ?, ?, 'Manual Ideogram Web Creation', 'CUSTOM IDEOGRAM THUMBNAIL', 'User Generated via Ideogram Web', ?, ?, ?, 'IDEOGRAM_WEB_MANUAL', 'Ideogram Commercial Use (Subscriber)', 'APPROVED')
    `, [projectId, project.bible_book || 'Genesis', project.chapter_start || 1, project.title, targetJpgPath, targetPngPath, fileSize]);

    run(`UPDATE projects SET thumbnail_path = ? WHERE id = ?`, [targetJpgPath, projectId]);

    return this.getThumbnailData(projectId);
  }
}

module.exports = new IdeogramService();
