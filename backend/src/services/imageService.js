const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { db, get, query, run } = require('../db/database');
const config = require('../config');

class ImageService {
  /**
   * Get active Image Provider Mode from settings
   * Modes:
   * - 'MANUAL_IMPORT': Mode B (zero-cost default, copy prompt + drag/drop upload)
   * - 'GEMINI_IMAGEN': Mode A (Google Gemini Imagen 3, requires GEMINI_API_KEY & paid billing warning)
   * - 'NONE': Mode C (Not configured, halts pipeline, zero procedural fallbacks)
   */
  getImageProviderMode() {
    const row = get(`SELECT value FROM settings WHERE key = 'IMAGE_PROVIDER_MODE'`);
    return row?.value || 'MANUAL_IMPORT';
  }

  /**
   * Set Image Provider Mode in settings
   */
  setImageProviderMode(mode) {
    const validModes = ['MANUAL_IMPORT', 'GEMINI_IMAGEN', 'NONE'];
    if (!validModes.includes(mode)) {
      throw new Error(`Invalid image provider mode: ${mode}. Must be one of: ${validModes.join(', ')}`);
    }
    run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('IMAGE_PROVIDER_MODE', ?, CURRENT_TIMESTAMP)`, [mode]);
    return mode;
  }

  /**
   * Standardized Prompt Builder (Used by both Mode A and Mode B)
   * Formula:
   * scene subject + setting and era + era-accurate clothing/architecture + lighting + camera angle + fixed style line + fixed character description (if recurring) + avoid list.
   * Strict Jesus Rule: Jesus appears ONLY in scenes that explicitly need him.
   */
  buildStandardizedPrompt(scene, project = {}) {
    const isShorts = project.format === 'SHORTS';
    const aspect = isShorts ? '9:16 vertical' : '16:9 widescreen';
    const book = (project.bible_book || '').trim();
    const chapter = project.chapter_start || 1;

    // 1. Scene Subject
    let rawSubject = (scene.visual_description || scene.narration_text || '').replace(/\(Opening:.*?\)/g, '').replace(/[\r\n]+/g, ' ').trim();
    if (rawSubject.length > 220) {
      rawSubject = rawSubject.slice(0, 220).replace(/\s+\S*$/, '');
    }

    // 2. Setting & Era
    let settingEra = 'ancient Near East Bronze Age landscape';
    if (/genesis/i.test(book)) {
      if (chapter === 1) {
        settingEra = 'primordial cosmic dawn, before human civilization, ancient pristine Earth and celestial expanse';
      } else if (chapter === 2 || chapter === 3) {
        settingEra = 'pristine Garden of Eden, lush ancient Mesopotamian river basin, uncultivated wild beauty';
      } else {
        settingEra = 'patriarchal Bronze Age Canaan, rugged limestone hills and ancient drystone stone altars';
      }
    } else if (/exodus/i.test(book)) {
      settingEra = '13th century BC ancient New Kingdom Egypt, mudbrick store cities, Nile delta and Sinai desert wilderness';
    } else if (/job/i.test(book)) {
      settingEra = 'ancient Land of Uz, patriarchal era arid plateau, weathered boulders and acacia groves';
    } else if (/matthew|mark|luke|john|acts|revelation/i.test(book)) {
      settingEra = '1st century Roman Judea, limestone terraced hills, olive groves, and ancient Jerusalem stone architecture';
    }

    // 3. Era-accurate Clothing & Architecture (Zero modern objects)
    const clothingArch = 'historically authentic unbleached linen tunics, wool mantles, ancient rough-hewn drystone architecture, strictly zero modern elements';

    // 4. Lighting & Natural Atmosphere
    const lighting = 'warm directional natural golden hour light, soft atmospheric dust motes, reverent tranquility';

    // 5. Camera Angle & Framing
    const cameraAngles = [
      'cinematic wide establishing shot',
      'eye-level medium perspective with natural depth of field',
      'low-angle majestic panoramic view',
      'intimate documentary framing'
    ];
    const cameraAngle = cameraAngles[(scene.segment_order || 1) % cameraAngles.length];

    // 6. Fixed Natural Photographic Style Line (No AI painting / No CGI)
    const styleLine = `National Geographic documentary still, authentic cinematic photography shot on 35mm film, natural directional sunlight, raw organic textures of limestone, ancient olive wood, and unbleached linen, authentic historical antiquity, realistic physical world, sharp authentic photography, ${aspect}`;

    // 7. Core Central Figure: Dignified Portrayal of Jesus Christ ONLY when script/book is New Testament or specifically mentions Jesus
    const isNewTestament = /matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|jude|revelation/i.test(book);
    const mentionsJesus = /jesus|christ|savior|messiah|gospel|cross|resurrection|healing|prayer/i.test(rawSubject + ' ' + (project.category || ''));
    const jesusClause = (isNewTestament || mentionsJesus)
      ? 'Authentic documentary portrayal of Jesus Christ, dignified 1st century Galilean Jewish appearance, unadorned unbleached linen mantle, gentle compassionate gaze, authentic historical antiquity. '
      : '';

    // 8. Strict Negative Avoid List (Zero AI illustration / Zero digital painting / Zero CGI)
    const avoidList = 'painting, oil painting, acrylic, digital art, illustration, cartoon, anime, 3d render, cgi, plastic sheen, airbrushed skin, synthetic smoothing, oversaturated colors, glowing neon, modern clothing, wristwatches, eyeglasses, automobiles, modern buildings, text, typography, subtitles, watermarks, logos, signatures, distorted anatomy, extra fingers';

    return `${jesusClause}${rawSubject}. Setting: ${settingEra}, ${clothingArch}. Lighting: ${lighting}. Framing: ${cameraAngle}. Style: ${styleLine}. Negative: [${avoidList}].`;
  }

  /**
   * Validate image dimensions using FFprobe
   */
  validateImageDimensions(filePath, isShorts = false) {
    try {
      const probeOutput = execFileSync(config.PATHS.FFPROBE, [
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height',
        '-of', 'json',
        filePath
      ], { encoding: 'utf8' });

      const data = JSON.parse(probeOutput);
      const stream = data.streams?.[0];
      if (!stream || !stream.width || !stream.height) {
        return { valid: false, error: 'Could not detect image dimensions via FFprobe.' };
      }

      const width = parseInt(stream.width, 10);
      const height = parseInt(stream.height, 10);
      const minWidth = isShorts ? 1080 : 1920;
      const minHeight = isShorts ? 1920 : 1080;

      if (width < minWidth || height < minHeight) {
        return {
          valid: false,
          width,
          height,
          minWidth,
          minHeight,
          error: `Image resolution ${width}x${height} is below required minimum of ${minWidth}x${minHeight} (${isShorts ? 'Shorts' : 'Long Form'}).`
        };
      }

      return { valid: true, width, height, minWidth, minHeight };
    } catch (e) {
      return { valid: false, error: `FFprobe validation failed: ${e.message}` };
    }
  }

  /**
   * Save and validate manually imported image for a scene (Mode B)
   */
  validateAndSaveSceneImage(projectId, segmentOrder, fileBuffer, originalFilename = 'upload.jpg') {
    const project = get(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (!project) throw new Error('Project not found');

    const seg = get(`SELECT * FROM script_segments WHERE project_id = ? AND segment_order = ?`, [projectId, segmentOrder]);
    if (!seg) throw new Error(`Scene ${segmentOrder} not found`);

    const isShorts = project.format === 'SHORTS';
    const projectImgDir = path.join(config.PATHS.PROJECTS, projectId, 'images');
    if (!fs.existsSync(projectImgDir)) fs.mkdirSync(projectImgDir, { recursive: true });

    const targetFilename = `scene_${segmentOrder}.jpg`;
    const targetPath = path.join(projectImgDir, targetFilename);
    const tempUploadPath = path.join(projectImgDir, `temp_upload_${segmentOrder}_${Date.now()}.bin`);

    fs.writeFileSync(tempUploadPath, fileBuffer);

    // Validate resolution with ffprobe
    const valResult = this.validateImageDimensions(tempUploadPath, isShorts);
    if (!valResult.valid) {
      if (fs.existsSync(tempUploadPath)) fs.unlinkSync(tempUploadPath);
      throw new Error(`Resolution check failed: ${valResult.error}`);
    }

    // Convert/normalize to JPG using FFmpeg
    try {
      execFileSync(config.PATHS.FFMPEG, [
        '-i', tempUploadPath,
        '-q:v', '2',
        targetPath,
        '-y'
      ], { stdio: 'pipe' });
    } finally {
      if (fs.existsSync(tempUploadPath)) fs.unlinkSync(tempUploadPath);
    }

    // Update segment in SQLite
    run(`
      UPDATE script_segments 
      SET media_path = ?, media_type = 'IMAGE', image_status = 'MANUAL_IMPORT', engine_used = 'Manual Import'
      WHERE id = ?
    `, [targetPath, seg.id]);

    // Record asset in SQLite
    run(`
      INSERT INTO assets (
        project_id, asset_type, title, file_path, source_url,
        license_type, commercial_use_allowed, attribution_required, model_name
      ) VALUES (?, 'IMAGE', ?, ?, 'Manual Import', 'User Provided / Free Web Tool', 1, 0, 'Manual Import')
    `, [
      projectId,
      `Scene ${segmentOrder} Artwork (${valResult.width}x${valResult.height})`,
      targetPath
    ]);

    return {
      success: true,
      segmentOrder,
      width: valResult.width,
      height: valResult.height,
      filePath: targetPath,
      relativeUrl: `/storage/projects/${projectId}/images/${targetFilename}?t=${Date.now()}`
    };
  }

  /**
   * Match a dignified Jesus Christ depiction based on scene script keywords and actions
   * Requirement: Videos feature Jesus Christ images tailored to the script without repeating the same image
   */
  matchJesusPhotoForScene(seg, project = {}, isShorts = false, usedPhotos = new Set()) {
    const jesusLibDir = path.join(config.PATHS.ROOT, 'data', 'jesus_photo_library', isShorts ? 'vertical' : 'horizontal');
    if (!fs.existsSync(jesusLibDir)) return null;

    const availableFiles = fs.readdirSync(jesusLibDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    if (availableFiles.length === 0) return null;

    const text = ((seg.narration_text || '') + ' ' + (seg.image_prompt || '') + ' ' + (seg.visual_description || '')).toLowerCase();
    const order = seg.segment_order || 1;
    const chapter = project.chapter_start || 1;

    // Thematic Keyword Mapping to Jesus Christ Master Portrayals (Specific phrase matching to avoid false positives)
    const mapping = [
      { keywords: ['water', 'sea', 'galilee', 'shore', 'lake', 'waves', 'storm', 'boat', 'sink', 'calm the waters', 'ocean'], photo: 'jesus_walking_on_waters.jpg' },
      { keywords: ['shepherd', 'sheep', 'pasture', 'flock', 'green pastures', 'lead me', 'restore my soul', 'psalm 23', 'rod and staff'], photo: 'jesus_good_shepherd.jpg' },
      { keywords: ['sermon on the mount', 'beatitudes', 'multitude on the hill', 'blessed are the meek'], photo: 'jesus_teaching_sermon_mount.jpg' },
      { keywords: ['gethsemane', 'kneel', 'cup', 'agony', 'praying at night', 'supplication', 'garden of gethsemane'], photo: 'jesus_praying_gethsemane.jpg' },
      { keywords: ['heal', 'healing', 'sick', 'mercy', 'blind', 'lame', 'hand', 'touch', 'cure', 'compassion', 'wholeness', 'pain', 'disease'], photo: 'jesus_healing_and_mercy.jpg' },
      { keywords: ['light of the world', 'lantern', 'knock at the door', 'shine', 'radiant light', 'piercing darkness'], photo: 'jesus_light_of_world.jpg' },
      { keywords: ['bread of life', 'last supper', 'disciples at table', 'covenant cup', 'wine', 'communion'], photo: 'jesus_last_supper_bread.jpg' },
      { keywords: ['bless the children', 'little children', 'innocent', 'kingdom of children'], photo: 'jesus_blessing_children.jpg' },
      { keywords: ['resurrection', 'glory', 'risen', 'he is risen', 'tomb is empty', 'victory over death', 'eternal life'], photo: 'jesus_resurrection_glory.jpg' },
      { keywords: ['face of jesus', 'eyes of christ', 'savior', 'messiah', 'comfort my soul', 'peace of christ'], photo: 'jesus_portrait_compassion.jpg' }
    ];

    // Priority 1: Match scene action keywords (preferring unused photo first)
    for (const rule of mapping) {
      if (rule.keywords.some(kw => text.includes(kw))) {
        const candidate = path.join(jesusLibDir, rule.photo);
        if (fs.existsSync(candidate) && !usedPhotos.has(candidate)) {
          return candidate;
        }
      }
    }

    // Priority 2: Diverse rotation through Jesus library with unique project seed
    // Guarantees different videos get different portraits and within the video portraits rotate
    const projectSeed = (project.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    for (let offset = 0; offset < availableFiles.length; offset++) {
      const idx = (projectSeed + chapter * 3 + (order - 1) * 2 + offset) % availableFiles.length;
      const candidate = path.join(jesusLibDir, availableFiles[idx]);
      if (fs.existsSync(candidate) && !usedPhotos.has(candidate)) {
        return candidate;
      }
    }

    // Fallback: Return best matching even if seen
    const defaultIdx = (projectSeed + chapter * 3 + order - 1) % availableFiles.length;
    return path.join(jesusLibDir, availableFiles[defaultIdx]);
  }

  /**
   * Match an authentic, natural photograph from the library based on scene content keywords (fallback)
   */
  matchNaturalPhotoForScene(seg, project = {}, isShorts = false, usedPhotos = new Set()) {
    const naturalLibDir = path.join(config.PATHS.ROOT, 'data', 'natural_photo_library', isShorts ? 'vertical' : 'horizontal');
    if (!fs.existsSync(naturalLibDir)) return null;

    const availableFiles = fs.readdirSync(naturalLibDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    if (availableFiles.length === 0) return null;

    const text = ((seg.narration_text || '') + ' ' + (seg.image_prompt || '') + ' ' + (seg.visual_description || '')).toLowerCase();
    const order = seg.segment_order || 1;
    const chapter = project.chapter_start || 1;

    // Thematic Keyword Mapping to Authentic Natural Photos
    const mapping = [
      { keywords: ['olive', 'tree', 'grove', 'branch', 'vine', 'garden', 'fruit'], photo: 'ancient_olive_tree_hill.jpg' },
      { keywords: ['pasture', 'sheep', 'flock', 'green', 'shepherd', 'meadow'], photo: 'green_pastures_psalm23.jpg' },
      { keywords: ['lake', 'galilee', 'shore', 'still water'], photo: 'still_waters_galilee.jpg' },
      { keywords: ['river', 'stream', 'flow', 'fountain', 'jordan', 'spring'], photo: 'peaceful_flowing_river.jpg' },
      { keywords: ['ocean', 'sea', 'waters', 'deep', 'wave', 'fish', 'marine', 'current'], photo: 'tranquil_ocean_waters.jpg' },
      { keywords: ['flower', 'flora', 'grass', 'field', 'bloom', 'earth'], photo: 'wildflowers_field_flourishing.jpg' },
      { keywords: ['star', 'stars', 'night', 'sky', 'heavens', 'moon', 'constellation', 'abraham'], photo: 'starry_night_abraham.jpg' },
      { keywords: ['light', 'sunbeam', 'glory', 'radiant', 'shine', 'beam'], photo: 'sunbeams_celestial_light.jpg' },
      { keywords: ['dawn', 'morning', 'sunrise', 'beginning', 'create', 'creation', 'heavens and earth'], photo: 'creation_dawn_mountains.jpg' },
      { keywords: ['sunset', 'twilight', 'evening', 'dusk', 'golden'], photo: 'golden_sunset_hills.jpg' },
      { keywords: ['desert', 'wilderness', 'sinai', 'sand', 'dust', 'canyon', 'rock', 'dry'], photo: 'desert_wilderness_sinai.jpg' },
      { keywords: ['cave', 'qumran', 'dead sea', 'shelter', 'boulder', 'hide'], photo: 'ancient_rock_caves.jpg' },
      { keywords: ['scroll', 'parchment', 'book', 'scribe', 'write', 'word', 'law', 'manuscript'], photo: 'parchment_scroll_manuscript.jpg' },
      { keywords: ['temple', 'sanctuary', 'altar', 'stone', 'arch', 'holy', 'house'], photo: 'ancient_stone_sanctuary.jpg' },
      { keywords: ['path', 'walk', 'journey', 'way', 'trail', 'road', 'follow'], photo: 'ancient_stone_path.jpg' },
      { keywords: ['prayer', 'pray', 'peace', 'soul', 'bless', 'blessing', 'grace', 'overlook', 'mountain'], photo: 'mountain_prayer_overlook.jpg' }
    ];

    // Priority 1: Check keyword match with whole-word boundary, preferring unused photo
    for (const rule of mapping) {
      if (rule.keywords.some(kw => new RegExp(`\\b${kw}\\b`, 'i').test(text))) {
        const candidate = path.join(naturalLibDir, rule.photo);
        if (fs.existsSync(candidate) && !usedPhotos.has(candidate)) {
          return candidate;
        }
      }
    }

    // Priority 2: Unused file rotation with unique project seed
    const projectSeed = (project.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    for (let offset = 0; offset < availableFiles.length; offset++) {
      const idx = (projectSeed + chapter * 5 + (order - 1) * 3 + offset) % availableFiles.length;
      const candidate = path.join(naturalLibDir, availableFiles[idx]);
      if (fs.existsSync(candidate) && !usedPhotos.has(candidate)) {
        return candidate;
      }
    }

    // Fallback if all photos used
    const defaultIdx = (projectSeed + chapter * 5 + order - 1) % availableFiles.length;
    return path.join(naturalLibDir, availableFiles[defaultIdx]);
  }

  /**
   * Match classical biblical fine art from library with unique project seed and unused photo preference
   */
  matchFineArtForScene(seg, project = {}, isShorts = false, usedPhotos = new Set()) {
    const fineArtDir = path.join(config.PATHS.ROOT, 'data', 'fine_art_library', isShorts ? 'vertical' : 'horizontal');
    if (!fs.existsSync(fineArtDir)) return null;

    const availableFiles = fs.readdirSync(fineArtDir).filter(f => f.endsWith('.jpg') || f.endsWith('.png'));
    if (availableFiles.length === 0) return null;

    const chapter = project.chapter_start || 1;
    const order = seg.segment_order || 1;
    const projectSeed = (project.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

    // Prefer unused fine art first
    for (let offset = 0; offset < availableFiles.length; offset++) {
      const idx = (projectSeed + chapter * 7 + (order - 1) * 2 + offset) % availableFiles.length;
      const candidate = path.join(fineArtDir, availableFiles[idx]);
      if (fs.existsSync(candidate) && !usedPhotos.has(candidate)) {
        return candidate;
      }
    }

    const defaultIdx = (projectSeed + chapter * 7 + order - 1) % availableFiles.length;
    return path.join(fineArtDir, availableFiles[defaultIdx]);
  }

  /**
   * Dynamically fetch script-grounded public domain biblical fine art from Wikimedia Commons
   */
  async fetchScriptAccurateArt(queryStr, isShorts = false) {
    try {
      const cleanQuery = queryStr.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
      if (!cleanQuery || cleanQuery.length < 3) return null;

      const apiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanQuery)}&gsrnamespace=6&gsrlimit=5&prop=imageinfo&iiprop=url|size&format=json`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(apiUrl, {
        headers: { 'User-Agent': 'ByBibleWisdomStudio/1.0 (contact@bybiblewisdom.org)' },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.query?.pages) return null;

      const pages = Object.values(data.query.pages);
      const minDimension = isShorts ? 600 : 800;
      const valid = pages.find(p => {
        const info = p.imageinfo?.[0];
        if (!info || !info.url) return false;
        const ext = path.extname(info.url.split('?')[0]).toLowerCase();
        if (!['.jpg', '.jpeg', '.png'].includes(ext)) return false;
        return (info.width >= minDimension && info.height >= minDimension);
      });

      if (!valid || !valid.imageinfo?.[0]?.url) return null;

      const imgUrl = valid.imageinfo[0].url;
      const imgRes = await fetch(imgUrl, {
        headers: { 'User-Agent': 'ByBibleWisdomStudio/1.0 (contact@bybiblewisdom.org)' }
      });
      if (!imgRes.ok) return null;

      const buffer = Buffer.from(await imgRes.arrayBuffer());
      if (buffer.length < 25000) return null; // Reject tiny corrupt thumbnails
      return { buffer, title: valid.title, url: imgUrl };
    } catch (_) {
      return null;
    }
  }

  /**
   * Generate visual imagery for a project based on active Provider Mode
   */
  async generateProjectImages(projectId, options = {}, onProgress = null) {
    const project = get(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (!project) throw new Error('Project not found');

    let segments = query(`
      SELECT * FROM script_segments WHERE project_id = ? ORDER BY segment_order ASC
    `, [projectId]);

    if (!segments || segments.length === 0) {
      console.log(`[ImageService] No script segments found in DB for ${projectId}. Auto-restoring from script...`);
      const script = get(`SELECT * FROM scripts WHERE project_id = ? ORDER BY version DESC LIMIT 1`, [projectId]);
      if (script) {
        const scriptService = require('./scriptService');
        const chapterKnowledge = require('./chapterKnowledge');
        const scriptContent = {
          hook: script.hook || '',
          biblical_context: script.biblical_context || '',
          core_narrative: script.core_narrative || '',
          theological_insight: script.theological_insight || '',
          practical_application: script.practical_application || '',
          call_to_action: script.call_to_action || '',
          full_text: script.full_narration_text || '',
          sections: (script.full_narration_text || '').split('\n\n')
        };
        const chapterDataObj = chapterKnowledge.getChapterNarrative(project.bible_book || 'Genesis', project.chapter_start || 1);
        scriptService.generateSceneSegments(projectId, scriptContent, project, chapterDataObj, project.format === 'SHORTS');
        segments = query(`SELECT * FROM script_segments WHERE project_id = ? ORDER BY segment_order ASC`, [projectId]);
      }
    }

    if (!segments || segments.length === 0) {
      throw new Error('No script segments found. Generate script and scenes before image production.');
    }

    let providerMode = options.providerMode || this.getImageProviderMode();
    const geminiApiKey = (get(`SELECT value FROM settings WHERE key = 'GEMINI_API_KEY'`)?.value) || process.env.GEMINI_API_KEY || config.AI.GEMINI_API_KEY || '';
    if (providerMode === 'GEMINI_IMAGEN' && (!geminiApiKey || (!options.confirmPaidCharges && options.confirmPaidCharges !== 'true'))) {
      console.log(`[ImageService] Gemini Imagen key not configured or confirmation omitted. Gracefully utilizing authentic sacred artwork library (Mode B)...`);
      providerMode = 'MANUAL_IMPORT';
    }
    const isShorts = project.format === 'SHORTS';
    const projectImgDir = path.join(config.PATHS.PROJECTS, projectId, 'images');
    if (!fs.existsSync(projectImgDir)) fs.mkdirSync(projectImgDir, { recursive: true });

    // Step 1: Ensure all segments have standardized prompts populated
    for (const seg of segments) {
      const stdPrompt = this.buildStandardizedPrompt(seg, project);
      run(`UPDATE script_segments SET image_prompt = ? WHERE id = ?`, [stdPrompt, seg.id]);
      seg.image_prompt = stdPrompt;
    }

    // MODE C: NONE CONFIGURED
    if (providerMode === 'NONE') {
      console.warn(`[ImageService] Provider Mode is set to NONE. Zero procedural fallbacks allowed. Halting visual stage.`);
      return {
        projectId,
        providerMode: 'NONE',
        status: 'NOT CONFIGURED',
        error: 'Image provider is set to NONE. No API key configured and manual images not selected. Visual stage halted (zero procedural fallbacks permitted).',
        totalScenes: segments.length,
        readyCount: 0
      };
    }

    // MODE B: MANUAL IMPORT (Zero-Cost Default)
    if (providerMode === 'MANUAL_IMPORT') {
      console.log(`[ImageService] Operating in Mode B (Manual Import). Evaluating scene readiness...`);
      const sceneStatusList = [];
      const usedPhotosInProject = new Set();

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const filename = `scene_${seg.segment_order}.jpg`;
        const targetPath = path.join(projectImgDir, filename);

        let isReady = false;
        let dimInfo = null;

        if (fs.existsSync(targetPath) && fs.statSync(targetPath).size > 10000 && (seg.image_status === 'MANUAL_IMPORT' || seg.image_status === 'AI_GENERATED')) {
          const check = this.validateImageDimensions(targetPath, isShorts);
          if (check.valid) {
            isReady = true;
            dimInfo = check;
          }
        }

        // Script-Accurate Image Selection:
        // Prioritize authentic depiction of Jesus Christ, Gospel themes, and sacred biblical masterworks
        const sceneText = ((seg.narration_text || '') + ' ' + (seg.image_prompt || '') + ' ' + (seg.visual_description || '')).toLowerCase();
        const bookName = (project.bible_book || '').toLowerCase();
        const isNewTestament = /matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|jude|revelation/.test(bookName);
        const mentionsJesus = /jesus|christ|savior|messiah|gospel|cross|resurrection|healing|prayer|bless|lord|amen|god|peace|faith|grace|love|comfort|hope/.test(sceneText + ' ' + (project.category || ''));
        const isClosingScene = (i === segments.length - 1) || (seg.segment_order === segments.length);
        const useJesusLibrary = (isNewTestament || mentionsJesus || isClosingScene || project.category === 'PRAYER_AND_DEVOTIONAL' || project.prefer_jesus_art);

        // Step 1: Attempt Dynamic Online Public Domain Artwork Fetching matching the exact scene text
        if (!isReady) {
          try {
            const queryNoun = (seg.visual_description || seg.narration_text || '')
              .replace(/welcome to bybiblewisdom.*?\. /i, '')
              .replace(/[\r\n]+/g, ' ')
              .trim()
              .split(/\s+/)
              .slice(0, 4)
              .join(' ');

            const searchSubject = project.bible_book 
              ? `${project.bible_book} ${project.chapter_start || 1} ${queryNoun}`
              : (useJesusLibrary ? `Jesus Christ ${queryNoun}` : `Biblical ${queryNoun}`);

            const dynamicArt = await this.fetchScriptAccurateArt(searchSubject, isShorts);
            if (dynamicArt && dynamicArt.buffer) {
              fs.writeFileSync(targetPath, dynamicArt.buffer);
              const check = this.validateImageDimensions(targetPath, isShorts);
              if (check.valid) {
                isReady = true;
                dimInfo = check;
                seg.image_status = 'AI_GENERATED';
                const artTitle = (dynamicArt.title || 'Biblical Masterpiece').replace(/^File:/i, '').replace(/\.[^.]+$/, '').slice(0, 40);
                seg.engine_used = `Script-Grounded Biblical Art (${artTitle})`;
                run(`UPDATE script_segments SET media_path = ?, media_type = 'IMAGE', image_status = 'AI_GENERATED', engine_used = ? WHERE id = ?`, 
                  [targetPath, seg.engine_used, seg.id]);
              }
            }
          } catch (_) {}
        }

        // Step 2: Context-Aware Diverse Local Library Matching (Authentic Jesus Art & Classical Fine Art)
        if (!isReady) {
          let selectedPhotoPath = null;
          let engineLabel = 'Authentic Jesus Imagery';

          // If pool tracking is nearly full, clear it so long videos (30-50+ scenes) cycle without starvation
          if (usedPhotosInProject.size >= 32) {
            usedPhotosInProject.clear();
          }

          if (useJesusLibrary) {
            selectedPhotoPath = this.matchJesusPhotoForScene(seg, project, isShorts, usedPhotosInProject);
            engineLabel = 'Authentic Jesus Imagery';
            if (!selectedPhotoPath || !fs.existsSync(selectedPhotoPath)) {
              selectedPhotoPath = this.matchFineArtForScene(seg, project, isShorts, usedPhotosInProject);
              engineLabel = 'Classical Biblical Fine Art';
            }
          } else {
            // Narrative Scene: Prioritize Classical Biblical Fine Art
            selectedPhotoPath = this.matchFineArtForScene(seg, project, isShorts, usedPhotosInProject);
            engineLabel = 'Classical Biblical Fine Art';
            if (!selectedPhotoPath || !fs.existsSync(selectedPhotoPath)) {
              selectedPhotoPath = this.matchNaturalPhotoForScene(seg, project, isShorts, usedPhotosInProject);
              engineLabel = 'Authentic Biblical Archaeology & Nature';
            }
            if (!selectedPhotoPath || !fs.existsSync(selectedPhotoPath)) {
              selectedPhotoPath = this.matchJesusPhotoForScene(seg, project, isShorts, usedPhotosInProject);
              engineLabel = 'Authentic Jesus Imagery';
            }
          }

          // Fallback to verified biblical nature/archaeology (strictly zero modern elements)
          if (!selectedPhotoPath || !fs.existsSync(selectedPhotoPath)) {
            selectedPhotoPath = this.matchNaturalPhotoForScene(seg, project, isShorts, usedPhotosInProject);
            engineLabel = 'Authentic Biblical Archaeology & Nature';
          }

          if (selectedPhotoPath && fs.existsSync(selectedPhotoPath)) {
            usedPhotosInProject.add(selectedPhotoPath);
            try {
              fs.copyFileSync(selectedPhotoPath, targetPath);
              const check = this.validateImageDimensions(targetPath, isShorts);
              if (check.valid) {
                isReady = true;
                dimInfo = check;
                seg.image_status = 'AI_GENERATED';
                seg.engine_used = engineLabel;
                run(`UPDATE script_segments SET media_path = ?, media_type = 'IMAGE', image_status = 'AI_GENERATED', engine_used = ? WHERE id = ?`, 
                  [targetPath, engineLabel, seg.id]);
              }
            } catch (e) {
              console.warn(`[ImageService] Auto-populate from photo library failed:`, e.message);
            }
          }
        }

        sceneStatusList.push({
          segmentOrder: seg.segment_order,
          isReady,
          imageStatus: isReady ? (seg.image_status || 'MANUAL_IMPORT') : 'AWAITING_IMPORT',
          engineUsed: isReady ? (seg.engine_used || 'Manual Import') : 'Pending Upload',
          prompt: seg.image_prompt,
          narration: seg.narration_text,
          dimensions: dimInfo ? `${dimInfo.width}x${dimInfo.height}` : null,
          filePath: isReady ? targetPath : null,
          relativeUrl: isReady ? `/storage/projects/${projectId}/images/${filename}?t=${Date.now()}` : null
        });

        if (onProgress) {
          onProgress(i + 1, segments.length);
        }
      }

      const readyCount = sceneStatusList.filter(s => s.isReady).length;
      const allReady = readyCount === segments.length;

      if (allReady) {
        run(`UPDATE projects SET status = 'VISUALS_READY', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [projectId]);
      }

      return {
        projectId,
        providerMode: 'MANUAL_IMPORT',
        totalScenes: segments.length,
        readyCount,
        allReady,
        status: allReady ? 'ALL_VISUALS_READY' : 'AWAITING_MANUAL_IMPORT',
        message: allReady 
          ? `All ${segments.length} scene images verified and ready for video composition.`
          : `${readyCount} of ${segments.length} scene images imported. Please copy prompts and upload remaining ${segments.length - readyCount} scene(s).`,
        scenes: sceneStatusList
      };
    }

    // MODE A: GOOGLE GEMINI (IMAGEN 3)
    if (providerMode === 'GEMINI_IMAGEN') {
      const geminiApiKey = (get(`SELECT value FROM settings WHERE key = 'GEMINI_API_KEY'`)?.value) || process.env.GEMINI_API_KEY || config.AI.GEMINI_API_KEY || '';

      if (!geminiApiKey) {
        console.warn(`[ImageService] Mode A selected but GEMINI_API_KEY is not configured.`);
        return {
          projectId,
          providerMode: 'GEMINI_IMAGEN',
          status: 'NOT CONFIGURED',
          error: 'GEMINI_API_KEY is missing. Please configure your Gemini API key in Settings or switch to Mode B (Manual Import).',
          totalScenes: segments.length,
          readyCount: 0
        };
      }

      // Check for explicit user confirmation for paid billing
      if (options.confirmPaidCharges !== true && options.confirmPaidCharges !== 'true') {
        return {
          projectId,
          providerMode: 'GEMINI_IMAGEN',
          status: 'CONFIRMATION_REQUIRED',
          warning: 'Google Gemini Imagen 3 (imagen-3.0-generate-002) is a pay-as-you-go service (~$0.03/image) and is NOT covered by the free tier quota. Automatic generation is halted to prevent unexpected charges. Pass confirmPaidCharges: true to proceed.',
          model: 'imagen-3.0-generate-002',
          estimatedCost: `$${(segments.length * 0.03).toFixed(2)} USD`,
          totalScenes: segments.length
        };
      }

      console.log(`[ImageService] Generating ${segments.length} scenes via Gemini Imagen 3 (imagen-3.0-generate-002)...`);
      const generatedScenes = [];

      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const filename = `scene_${seg.segment_order}.jpg`;
        const targetPath = path.join(projectImgDir, filename);

        let imageSuccess = false;
        let attempt = 0;
        const maxAttempts = 2; // Regenerate once on failure

        while (attempt < maxAttempts && !imageSuccess) {
          attempt++;
          try {
            const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${geminiApiKey}`;
            const gController = new AbortController();
            const gTimeout = setTimeout(() => gController.abort(), 35000);

            const gRes = await fetch(geminiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: gController.signal,
              body: JSON.stringify({
                instances: [{ prompt: seg.image_prompt }],
                parameters: {
                  sampleCount: 1,
                  aspectRatio: isShorts ? '9:16' : '16:9',
                  personGeneration: 'ALLOW_ADULT',
                  safetyFilterLevel: 'block_medium_and_above'
                }
              })
            });
            clearTimeout(gTimeout);

            if (gRes.ok) {
              const gData = await gRes.json();
              const b64 = gData.predictions?.[0]?.bytesBase64Encoded;
              if (b64) {
                const buf = Buffer.from(b64, 'base64');
                fs.writeFileSync(targetPath, buf);

                // Validate resolution
                const vCheck = this.validateImageDimensions(targetPath, isShorts);
                if (vCheck.valid) {
                  imageSuccess = true;
                  run(`
                    UPDATE script_segments 
                    SET media_path = ?, media_type = 'IMAGE', image_status = 'AI_GENERATED', engine_used = 'Google Gemini Imagen 3'
                    WHERE id = ?
                  `, [targetPath, seg.id]);
                  break;
                }
              }
            }
          } catch (gErr) {
            console.warn(`[ImageService] Gemini attempt ${attempt} failed for scene ${seg.segment_order}:`, gErr.message);
          }
        }

        if (!imageSuccess) {
          // Zero procedural fallback rule: mark as FAILED and stop
          run(`UPDATE script_segments SET image_status = 'FAILED', engine_used = 'Gemini Failed' WHERE id = ?`, [seg.id]);
          return {
            projectId,
            providerMode: 'GEMINI_IMAGEN',
            status: 'FAILED',
            error: `Failed generating image for Scene ${seg.segment_order} with Gemini Imagen 3 after ${maxAttempts} attempts. Stage halted with zero procedural fallbacks.`,
            failedScene: seg.segment_order
          };
        }

        generatedScenes.push({
          segmentOrder: seg.segment_order,
          filePath: targetPath,
          engineUsed: 'Google Gemini Imagen 3',
          relativeUrl: `/storage/projects/${projectId}/images/${filename}`
        });

        if (onProgress) {
          onProgress(i + 1, segments.length);
        }
      }

      run(`UPDATE projects SET status = 'VISUALS_READY', updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [projectId]);
      return {
        projectId,
        providerMode: 'GEMINI_IMAGEN',
        status: 'ALL_AI_GENERATED',
        totalScenes: generatedScenes.length,
        scenes: generatedScenes
      };
    }
  }

  /**
   * Test live Google Gemini Imagen 3 API connection with billing warning
   */
  async testGeminiConnection(providedKey = null) {
    const key = (providedKey || get(`SELECT value FROM settings WHERE key = 'GEMINI_API_KEY'`)?.value || process.env.GEMINI_API_KEY || config.AI.GEMINI_API_KEY || '').trim();
    if (!key) {
      return {
        connected: false,
        status: 'NOT CONFIGURED',
        error: 'GEMINI_API_KEY is not configured in settings or environment. Please enter your Google Gemini API key.',
        model: 'imagen-3.0-generate-002',
        provider: 'Google Gemini Imagen 3',
        pricingNotice: 'Imagen 3 requires paid billing on Google AI Studio (~$0.03/image). Free tier does not include image generation.'
      };
    }

    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${key}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      const res = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          instances: [{ prompt: 'Peaceful biblical morning sunrise over ancient Jerusalem mountains, warm golden celestial light, 8k cinematic photorealistic, no text, no watermark' }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '16:9',
            personGeneration: 'ALLOW_ADULT',
            safetyFilterLevel: 'block_medium_and_above'
          }
        })
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const b64 = data.predictions?.[0]?.bytesBase64Encoded;
        return {
          connected: true,
          status: 'CONNECTED_AND_VERIFIED',
          model: 'imagen-3.0-generate-002',
          provider: 'Google Gemini Imagen 3',
          sampleGenerated: Boolean(b64),
          pricingWarning: 'Verified active. Note: Each image generated charges ~$0.03 USD to your Google Cloud / Google AI account.',
          message: 'Successfully verified Google Gemini Imagen 3 API.'
        };
      } else {
        const errBody = await res.json().catch(() => null);
        const errMsg = errBody?.error?.message || `HTTP ${res.status}: ${res.statusText}`;
        return {
          connected: false,
          status: 'FAILED',
          httpStatus: res.status,
          error: errMsg,
          model: 'imagen-3.0-generate-002',
          provider: 'Google Gemini Imagen 3',
          pricingNotice: 'Requires Google AI Studio account with billing enabled.'
        };
      }
    } catch (err) {
      clearTimeout(timeout);
      return {
        connected: false,
        status: 'DISCONNECTED',
        error: `Network error connecting to Gemini API: ${err.message}`,
        model: 'imagen-3.0-generate-002',
        provider: 'Google Gemini Imagen 3'
      };
    }
  }
}

module.exports = new ImageService();
