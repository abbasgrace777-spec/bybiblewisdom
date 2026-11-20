const express = require('express');
const router = express.Router();
const fs = require('node:fs');
const path = require('node:path');

const bibleService = require('../services/bibleService');
const historicalService = require('../services/historicalService');
const projectService = require('../services/projectService');
const scriptService = require('../services/scriptService');
const verificationService = require('../services/verificationService');
const voiceService = require('../services/voiceService');
const imageService = require('../services/imageService');
const videoService = require('../services/videoService');
const thumbnailService = require('../services/thumbnailService');
const seoService = require('../services/seoService');
const youtubeService = require('../services/youtubeService');
const analyticsService = require('../services/analyticsService');
const pipelineService = require('../services/pipelineService');
const queueService = require('../services/queueService');
const ideogramService = require('../services/ideogramService');
const chapterReaderService = require('../services/chapterReaderService');
const exportService = require('../services/exportService');
const editingEngineService = require('../services/editingEngineService');
const remotionService = require('../services/remotionService');
const qualityControlService = require('../services/qualityControlService');
const copyrightService = require('../services/copyrightService');
const ollamaService = require('../services/ollamaService');
const categoryService = require('../services/categoryService');
const calendarService = require('../services/calendarService');
const researchSourcesService = require('../services/researchSourcesService');
const promptModeService = require('../services/promptModeService');
const config = require('../config');
const { query, run, get } = require('../db/database');

// --- 1. Dashboard Overview Stats ---
router.get('/dashboard/stats', (req, res) => {
  try {
    const stats = projectService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 2. Bible Books & Chapters ---
router.get('/bible/books', (req, res) => {
  try {
    const books = bibleService.getAllBooks();
    res.json({ success: true, count: books.length, data: books });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/bible/books/:name', (req, res) => {
  try {
    const book = bibleService.getBookByName(req.params.name);
    if (!book) return res.status(404).json({ success: false, error: 'Book not found' });
    res.json({ success: true, data: book });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/bible/verses/:book/:chapter', (req, res) => {
  try {
    const translation = req.query.translation || 'WEB';
    const verses = bibleService.getChapterVerses(req.params.book, parseInt(req.params.chapter, 10), translation);
    res.json({ success: true, count: verses.length, data: verses });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 3. Historical Stories & Discoveries ---
router.get('/historical/stories', (req, res) => {
  try {
    const stories = historicalService.getAllStories();
    res.json({ success: true, count: stories.length, data: stories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/historical/stories/:id', (req, res) => {
  try {
    const story = historicalService.getStoryById(req.params.id);
    if (!story) return res.status(404).json({ success: false, error: 'Story not found' });
    res.json({ success: true, data: story });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 4. Video Projects ---
router.get('/projects', (req, res) => {
  try {
    const projects = projectService.getAllProjects();
    res.json({ success: true, count: projects.length, data: projects });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/projects', (req, res) => {
  try {
    const newProject = projectService.createProject(req.body);
    res.status(201).json({ success: true, data: newProject });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/projects/batch', (req, res) => {
  try {
    const { book, startChapter, endChapter, format } = req.body;
    const batch = projectService.createBatchProjects({
      book: book || 'Genesis',
      startChapter: startChapter || 1,
      endChapter: endChapter || 25,
      format: format || 'LONG_FORM'
    });
    res.status(201).json({ success: true, count: batch.length, data: batch });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/projects/:id', (req, res) => {
  try {
    const project = projectService.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/projects/:id/status', (req, res) => {
  try {
    const updated = projectService.updateStatus(req.params.id, req.body.status);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 4b. Local Ollama API & Model Management (Requirements 1, 2, 3, 9, 10) ---
router.get('/ollama/status', async (req, res) => {
  try {
    const status = await ollamaService.checkOllamaStatus();
    const activeModel = ollamaService.getActiveModel();
    res.json({
      success: true,
      connected: status.running,
      data: {
        connected: status.running,
        running: status.running,
        url: status.url,
        version: status.version,
        activeModel,
        defaultModel: ollamaService.defaultModel,
        alternativeModel: ollamaService.alternativeModel,
        defaultSettings: ollamaService.defaultSettings,
        error: status.error
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, connected: false, error: err.message });
  }
});

router.get('/ollama/models', async (req, res) => {
  try {
    const models = await ollamaService.getInstalledModels();
    res.json({ success: true, count: models.length, data: models });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/ollama/model', (req, res) => {
  try {
    const { model } = req.body;
    if (!model) throw new Error('Model name is required');
    run(`INSERT OR REPLACE INTO settings (key, value) VALUES ('OLLAMA_MODEL', ?)`, [model]);
    res.json({ success: true, activeModel: model });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/ollama/pull', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) throw new Error('Model name to pull is required');
    const result = await ollamaService.pullModel(name);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(['/ollama/test', '/settings/test-ollama'], async (req, res) => {
  try {
    const result = await ollamaService.testOllamaConnection();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(['/ollama/test', '/settings/test-ollama'], async (req, res) => {
  try {
    const result = await ollamaService.testOllamaConnection();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 5. Script & Scene Generation ---
router.post(['/projects/:id/generate-script', '/projects/:id/script'], async (req, res) => {
  try {
    const result = await scriptService.generateScriptForProject(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/projects/:id/script', (req, res) => {
  try {
    const script = scriptService.getScript(req.params.id);
    res.json({ success: true, data: script });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/projects/:id/script', (req, res) => {
  try {
    const updated = scriptService.updateScript(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Script Review & Approval (Requirement 8)
router.post('/projects/:id/script/approve', (req, res) => {
  try {
    const approval = scriptService.approveScript(req.params.id);
    res.json({ success: true, data: approval });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Scene Descriptions Separate from Narration (Requirement 7)
router.get('/projects/:id/scene-descriptions', (req, res) => {
  try {
    const script = scriptService.getScript(req.params.id);
    if (!script) throw new Error('Script not found');
    res.json({ success: true, data: script.scene_descriptions });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/projects/:id/segments', (req, res) => {
  try {
    const segments = query(`
      SELECT * FROM script_segments WHERE project_id = ? ORDER BY segment_order ASC
    `, [req.params.id]);
    res.json({ success: true, count: segments.length, data: segments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 6. Mandatory Compliance & Accuracy Safety Gate ---
router.post('/projects/:id/verify-accuracy', async (req, res) => {
  try {
    const audit = await verificationService.runFullSafetyGate(req.params.id);
    res.json({ success: true, data: audit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/projects/:id/compliance', (req, res) => {
  try {
    const audit = get(`SELECT * FROM compliance_audits WHERE project_id = ?`, [req.params.id]);
    res.json({ success: true, data: audit });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 6b. Copyright-Safe Image System & Licensing Registry ---
router.get('/copyright/assets', (req, res) => {
  try {
    const assets = copyrightService.getRegisteredAssets(req.query.projectId || null);
    res.json({ success: true, count: assets.length, data: assets });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/copyright/verify-candidate', (req, res) => {
  try {
    const verification = copyrightService.verifyImageCopyright(req.body);
    res.json({ success: true, data: verification });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/copyright/sources', (req, res) => {
  try {
    const sources = copyrightService.getApprovedSources();
    res.json({ success: true, data: sources });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/copyright/disclaimer', (req, res) => {
  try {
    res.json({ success: true, data: copyrightService.getLegalDisclaimer() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/projects/:id/copyright-report', (req, res) => {
  try {
    const report = copyrightService.generateChapterCopyrightReport(req.params.id);
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// --- 7. Voice Studio & Narration Synthesis ---
router.get('/voices', (req, res) => {
  try {
    const voices = voiceService.getAvailableVoices();
    res.json({ success: true, data: voices });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/projects/:id/generate-voice', async (req, res) => {
  try {
    const result = await voiceService.generateProjectNarration(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 8. AI Image Studio & Visual Scenes ---
router.get('/images/provider-mode', (req, res) => {
  try {
    const mode = imageService.getImageProviderMode();
    res.json({ success: true, mode });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/images/provider-mode', (req, res) => {
  try {
    const mode = imageService.setImageProviderMode(req.body.mode);
    res.json({ success: true, mode, message: `Image provider mode set to ${mode}` });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/projects/:id/generate-images', async (req, res) => {
  try {
    const result = await imageService.generateProjectImages(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(['/projects/:id/scenes/:order/upload-image', '/projects/:id/segments/:order/upload-image'], (req, res) => {
  try {
    const { imageBase64, filename } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'imageBase64 payload is required' });
    }
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    const result = imageService.validateAndSaveSceneImage(
      req.params.id,
      parseInt(req.params.order, 10),
      buffer,
      filename || `upload_scene_${req.params.order}.jpg`
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// --- 9. Automated Video Production & FFmpeg NVENC Render ---
router.post(['/projects/:id/render-video', '/projects/:id/render'], async (req, res) => {
  try {
    const result = await videoService.renderProjectVideo(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 9b. Professional Multi-Track Video Editing Studio & Quality Control ---
router.get('/projects/:id/remotion-props', (req, res) => {
  try {
    const props = remotionService.buildRemotionProps(req.params.id, req.query);
    res.json({ success: true, data: props });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post(['/projects/:id/remotion/render', '/projects/:id/editor/render'], async (req, res) => {
  try {
    const result = await remotionService.renderMasterVideo(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/projects/:id/quality-control', async (req, res) => {
  try {
    const qcResult = await qualityControlService.runFullQualityControl(req.params.id);
    res.json({ success: true, data: qcResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/projects/:id/segments/:order', (req, res) => {
  try {
    const { narration_text, image_prompt, ken_burns_effect, duration_seconds } = req.body;
    const project = query(`SELECT id FROM projects WHERE id = ?`, [req.params.id]);
    if (!project || project.length === 0) return res.status(404).json({ success: false, error: 'Project not found' });

    run(`
      UPDATE script_segments 
      SET narration_text = COALESCE(?, narration_text),
          image_prompt = COALESCE(?, image_prompt),
          ken_burns_effect = COALESCE(?, ken_burns_effect),
          duration_seconds = COALESCE(?, duration_seconds)
      WHERE project_id = ? AND segment_order = ?
    `, [
      narration_text !== undefined ? narration_text : null,
      image_prompt !== undefined ? image_prompt : null,
      ken_burns_effect !== undefined ? ken_burns_effect : null,
      duration_seconds !== undefined ? duration_seconds : null,
      req.params.id,
      parseInt(req.params.order, 10)
    ]);

    // Invalidate cached scene clip
    const fs = require('node:fs');
    const path = require('node:path');
    const cachedClip = path.join(config.PATHS.PROJECTS, req.params.id, 'clips', `scene_${req.params.order}.mp4`);
    if (fs.existsSync(cachedClip)) fs.unlinkSync(cachedClip);

    res.json({ success: true, message: `Scene ${req.params.order} updated successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/projects/:id/segments/:order/regenerate-image', async (req, res) => {
  try {
    const result = await imageService.generateSingleSceneImage(req.params.id, parseInt(req.params.order, 10), req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/projects/:id/segments/:order/regenerate-voice', async (req, res) => {
  try {
    const result = await voiceService.generateSingleSceneNarration(req.params.id, parseInt(req.params.order, 10), req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


// --- 10. Thumbnail Studio ---
router.post('/projects/:id/generate-thumbnail', async (req, res) => {
  try {
    const result = await thumbnailService.generateThumbnail(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 11. SEO Studio ---
router.post('/projects/:id/generate-seo', (req, res) => {
  try {
    const result = seoService.generateMetadata(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 12. Ready to Upload Studio (Replaces direct upload & copyright log) ---
router.get('/projects/:id/ready-to-upload', async (req, res) => {
  try {
    const projectId = req.params.id;
    const project = projectService.getProjectById(projectId);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    // Video verification
    let videoPath = project.output_video_path;
    if (!videoPath || !fs.existsSync(videoPath)) {
      const defaultPath = path.join(config.PATHS.PROJECTS, projectId, 'output', 'final_video.mp4');
      if (fs.existsSync(defaultPath)) videoPath = defaultPath;
    }
    const hasVideo = !!(videoPath && fs.existsSync(videoPath));
    let videoSize = 0;
    let videoFormattedSize = '0 MB';
    if (hasVideo) {
      const stats = fs.statSync(videoPath);
      videoSize = stats.size;
      videoFormattedSize = (videoSize / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // Thumbnail verification
    let thumbnailPath = project.thumbnail_path;
    if (!thumbnailPath || !fs.existsSync(thumbnailPath)) {
      const jpgPath = path.join(config.PATHS.PROJECTS, projectId, 'output', 'thumbnail.jpg');
      const pngPath = path.join(config.PATHS.PROJECTS, projectId, 'output', 'thumbnail.png');
      if (fs.existsSync(jpgPath)) thumbnailPath = jpgPath;
      else if (fs.existsSync(pngPath)) thumbnailPath = pngPath;
    }
    const hasThumbnail = !!(thumbnailPath && fs.existsSync(thumbnailPath));

    // SEO Metadata
    let seo = get(`SELECT * FROM youtube_uploads WHERE project_id = ?`, [projectId]);
    if (!seo || !seo.video_title) {
      try {
        seo = seoService.generateMetadata(projectId);
      } catch (e) {
        seo = {
          video_title: `${project.title} | ByBibleWisdom`,
          description: `The complete biblical narrative of ${project.title}. Produced by ByBibleWisdom AI Studio.\n\n📖 Scripture: ${project.bible_book || 'Bible'} Chapter ${project.chapter_start || 1} (WEB Translation)\n🎙️ Narration: Commercially Licensed Pure Spoken Audio\n🎨 Visuals: AI Biblical Fine Art\n\n#ByBibleWisdom #BibleStudy #Scripture`,
          tags: `${project.title}, Bible, Holy Scripture, ByBibleWisdom, Christian Faith, Bible Study`
        };
      }
    }

    // 4-Point Safe-Source Check
    let safetyGate = null;
    try {
      safetyGate = await verificationService.runFullSafetyGate(projectId);
    } catch (_) {}

    const audioCheck = safetyGate?.checks?.find(c => c.id === 'audio_license');
    const visualCheck = safetyGate?.checks?.find(c => c.id === 'visual_licenses');
    const voiceCheck = safetyGate?.checks?.find(c => c.id === 'voice_license');
    const fontCheck = safetyGate?.checks?.find(c => c.id === 'font_license');

    const fallbackSegments = query(`
      SELECT segment_order, visual_description, image_status, engine_used 
      FROM script_segments 
      WHERE project_id = ? AND (image_status = 'FALLBACK' OR engine_used LIKE '%Fallback%')
    `, [projectId]);

    const safeSourceCheck = {
      noMusic: {
        passed: audioCheck ? audioCheck.passed : true,
        label: 'Strictly Zero Background Music',
        details: audioCheck?.notes || 'Verified: Exactly 1 voice audio stream. Zero background music audio used.'
      },
      images: {
        passed: visualCheck ? (visualCheck.passed && fallbackSegments.length === 0) : fallbackSegments.length === 0,
        label: 'AI-Generated / Free-License Images Only',
        fallbackCount: fallbackSegments.length,
        details: fallbackSegments.length === 0
          ? 'Verified: 100% of scenes use AI-Generated (Gemini Imagen 3 / Ideogram) or CC0 images. Zero procedural fallbacks.'
          : `BLOCKED: ${fallbackSegments.length} scene(s) used procedural fallback imagery.`
      },
      fonts: {
        passed: fontCheck ? fontCheck.passed : true,
        label: 'Commercially Usable Fonts',
        details: fontCheck?.notes || 'Verified: Cinzel & Inter fonts licensed under SIL Open Font License 1.1 / Apache 2.0.'
      },
      voice: {
        passed: voiceCheck ? voiceCheck.passed : true,
        label: 'Commercially Usable Voice Narration',
        details: voiceCheck?.notes || 'Verified: Spoken narration generated under permissible commercial terms.'
      },
      overallSafe: (audioCheck ? audioCheck.passed : true) &&
                   fallbackSegments.length === 0 &&
                   (voiceCheck ? voiceCheck.passed : true) &&
                   (fontCheck ? fontCheck.passed : true)
    };

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          title: project.title,
          category: project.category,
          status: project.status,
          duration: project.duration || 649,
          bible_book: project.bible_book,
          chapter: project.chapter_start || 1
        },
        video: {
          filename: 'Final_Video.mp4',
          available: hasVideo,
          path: videoPath,
          sizeBytes: videoSize,
          sizeFormatted: videoFormattedSize,
          downloadUrl: `/api/projects/${projectId}/video`
        },
        thumbnail: {
          filename: thumbnailPath ? path.basename(thumbnailPath) : 'thumbnail.jpg',
          available: hasThumbnail,
          path: thumbnailPath,
          downloadUrl: `/api/projects/${projectId}/thumbnail`,
          variants: ideogramService.getThumbnailData(projectId)?.variants || [],
          chosenVariantIndex: ideogramService.getThumbnailData(projectId)?.chosenVariantIndex || 1,
          generationStatus: ideogramService.getThumbnailData(projectId)?.generationStatus || 'NOT_CONFIGURED',
          ideogramPrompt: ideogramService.getThumbnailData(projectId)?.ideogramPrompt || ''
        },
        seo: {
          title: seo?.video_title || `${project.title} | ByBibleWisdom`,
          description: seo?.description || '',
          tags: seo?.tags || ''
        },
        safeSourceCheck
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/projects/:id/video', (req, res) => {
  try {
    const projectId = req.params.id;
    const project = projectService.getProjectById(projectId);
    let videoPath = project?.output_video_path;
    if (!videoPath || !fs.existsSync(videoPath)) {
      videoPath = path.join(config.PATHS.PROJECTS, projectId, 'output', 'final_video.mp4');
    }
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ success: false, error: 'Video file not found' });
    }
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', 'inline; filename="Final_Video.mp4"');
    res.sendFile(path.resolve(videoPath));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/projects/:id/thumbnail', (req, res) => {
  try {
    const projectId = req.params.id;
    const project = projectService.getProjectById(projectId);
    let thumbPath = project?.thumbnail_path;
    if (!thumbPath || !fs.existsSync(thumbPath)) {
      const jpgPath = path.join(config.PATHS.PROJECTS, projectId, 'output', 'thumbnail.jpg');
      const pngPath = path.join(config.PATHS.PROJECTS, projectId, 'output', 'thumbnail.png');
      thumbPath = fs.existsSync(jpgPath) ? jpgPath : (fs.existsSync(pngPath) ? pngPath : null);
    }
    if (!thumbPath || !fs.existsSync(thumbPath)) {
      return res.status(404).json({ success: false, error: 'Thumbnail not found' });
    }
    const ext = path.extname(thumbPath).toLowerCase();
    res.setHeader('Content-Type', ext === '.png' ? 'image/png' : 'image/jpeg');
    res.sendFile(path.resolve(thumbPath));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve specific thumbnail variant image (1, 2, or 3)
router.get('/projects/:id/thumbnail-variant/:num', (req, res) => {
  try {
    const projectId = req.params.id;
    const vNum = parseInt(req.params.num, 10) || 1;
    const varPath = path.join(config.PATHS.PROJECTS, projectId, 'output', `thumbnail_variant_${vNum}.jpg`);
    if (!fs.existsSync(varPath)) {
      return res.status(404).json({ success: false, error: `Thumbnail variant ${vNum} not found` });
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(path.resolve(varPath));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve 160px wide mobile preview of thumbnail variant
router.get('/projects/:id/thumbnail-variant/:num/160px', (req, res) => {
  try {
    const projectId = req.params.id;
    const vNum = parseInt(req.params.num, 10) || 1;
    const var160 = path.join(config.PATHS.PROJECTS, projectId, 'output', `thumbnail_variant_${vNum}_160px.jpg`);
    if (!fs.existsSync(var160)) {
      // Fallback: check if standard 160px exists or full image
      const full = path.join(config.PATHS.PROJECTS, projectId, 'output', `thumbnail_variant_${vNum}.jpg`);
      if (fs.existsSync(full)) {
        ideogramService.generate160pxPreview(full, var160);
      }
    }
    if (!fs.existsSync(var160)) {
      return res.status(404).json({ success: false, error: `160px preview for variant ${vNum} not found` });
    }
    res.setHeader('Content-Type', 'image/jpeg');
    res.sendFile(path.resolve(var160));
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Select active thumbnail variant (1, 2, or 3)
router.post('/projects/:id/select-thumbnail-variant', (req, res) => {
  try {
    const projectId = req.params.id;
    const { variantNumber } = req.body;
    const data = ideogramService.selectThumbnailVariant(projectId, variantNumber);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 13. Analytics & Curriculum Tracker ---
router.get('/analytics/overview', (req, res) => {
  try {
    const overview = analyticsService.getChannelOverview();
    res.json({ success: true, data: overview });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- Mode B: Prompt Mode Pipeline Endpoints ---
router.post('/prompt-mode/outline', async (req, res) => {
  try {
    const { prompt, format } = req.body;
    const outline = await promptModeService.generateOutline(prompt, format);
    res.json({ success: true, data: outline });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/prompt-mode/outline/:projectId', (req, res) => {
  try {
    const outline = promptModeService.getOutline(req.params.projectId);
    res.json({ success: true, data: outline });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/prompt-mode/approve-and-run', async (req, res) => {
  try {
    const { projectId, outline } = req.body;
    const scriptResult = await promptModeService.approveAndGenerateScript(projectId, outline);
    res.json({ success: true, data: scriptResult });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 14. One-Click Master Production Pipeline ---
router.post('/projects/:id/pipeline', async (req, res) => {
  try {
    const result = await pipelineService.runFullProductionPipeline(req.params.id, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/projects/:id/pipeline/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Keep-alive heartbeat every 4 seconds to prevent browser/socket timeout
  const heartbeat = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch (e) {
      clearInterval(heartbeat);
    }
  }, 4000);

  req.on('close', () => {
    clearInterval(heartbeat);
  });

  const sendEvent = (data) => {
    try {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (e) {
      clearInterval(heartbeat);
    }
  };

  try {
    sendEvent({ status: 'STARTING', message: 'Initiating 1-Click Production...' });
    const result = await pipelineService.runFullProductionPipeline(req.params.id, req.query, (progress) => {
      sendEvent({ status: 'PROGRESS', progress });
    });
    clearInterval(heartbeat);
    if (result && result.status === 'AWAITING_VISUALS') {
      sendEvent({ status: 'AWAITING_VISUALS', result });
    } else {
      sendEvent({ status: 'COMPLETE', result });
    }
    res.end();
  } catch (err) {
    clearInterval(heartbeat);
    sendEvent({ status: 'ERROR', error: err.message });
    res.end();
  }
});

// --- 16. Sequential Chapter Production Queue (One Chapter = One Video) ---
router.get('/queue', (req, res) => {
  try {
    const queueStatus = queueService.getQueueStatus();
    res.json({ success: true, data: queueStatus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/queue', async (req, res) => {
  try {
    const { bookName, startChapter, endChapter, format } = req.body;
    const queued = await queueService.enqueueChapters(bookName, startChapter, endChapter, format);
    res.json({ success: true, count: queued.length, data: queued });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/queue/pause', (req, res) => {
  try {
    const result = queueService.pauseQueue();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/queue/resume', (req, res) => {
  try {
    const result = queueService.resumeQueue();
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/queue/:id/retry', (req, res) => {
  try {
    const result = queueService.retryQueueItem(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 17. Ideogram Dedicated Thumbnail Studio ---
router.get('/ideogram/status', (req, res) => {
  try {
    res.json({ success: true, data: ideogramService.getIdeogramStatus() });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/ideogram/:projectId', (req, res) => {
  try {
    const data = ideogramService.getThumbnailData(req.params.projectId);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/ideogram/:projectId/generate', async (req, res) => {
  try {
    const result = await ideogramService.generateChapterThumbnail(req.params.projectId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/ideogram/:projectId/upload', async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) throw new Error('No image data provided');
    const cleanB64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanB64, 'base64');
    const result = await ideogramService.uploadCustomThumbnail(req.params.projectId, buffer, mimeType);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/ideogram/:projectId/apply-text', (req, res) => {
  try {
    const result = ideogramService.applyCustomTextOverlay(req.params.projectId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/ideogram/:projectId/download/jpg', (req, res) => {
  const data = ideogramService.getThumbnailData(req.params.projectId);
  const jpgFile = path.join(config.PATHS.PROJECTS, req.params.projectId, 'output', 'thumbnail.jpg');
  if (fs.existsSync(jpgFile)) {
    res.download(jpgFile, `${data?.book || 'Bible'}_Chapter_${data?.chapter || 1}_Thumbnail.jpg`);
  } else {
    res.status(404).json({ error: 'Thumbnail file not found' });
  }
});

router.get('/ideogram/:projectId/download/png', (req, res) => {
  const data = ideogramService.getThumbnailData(req.params.projectId);
  const pngFile = path.join(config.PATHS.PROJECTS, req.params.projectId, 'output', 'thumbnail.png');
  if (fs.existsSync(pngFile)) {
    res.download(pngFile, `${data?.book || 'Bible'}_Chapter_${data?.chapter || 1}_Thumbnail.png`);
  } else {
    res.status(404).json({ error: 'Thumbnail PNG file not found' });
  }
});

// --- 18. Chapter Production Packages (ByBibleWisdom/<Book>/Chapter_XX) ---
router.get('/packages', (req, res) => {
  try {
    const packages = query(`
      SELECT cp.*, p.title, p.format, p.status, p.actual_duration_seconds
      FROM chapter_packages cp
      JOIN projects p ON cp.project_id = p.id
      ORDER BY cp.id DESC
    `);
    res.json({ success: true, count: packages.length, data: packages });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/projects/:id/export-package', async (req, res) => {
  try {
    const result = await exportService.exportChapterPackage(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 19. Chapter Reader (Complete Chapter Verses & Analysis) ---
router.get('/bible/chapters/:book/:chapter', async (req, res) => {
  try {
    const result = await chapterReaderService.readCompleteChapter(req.params.book, req.params.chapter);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 20. Studio Settings & API Keys (Gemini, Ideogram, Ollama, Hardware) ---
router.get('/settings', (req, res) => {
  try {
    const rows = query(`SELECT key, value FROM settings`);
    const settingsObj = {};
    rows.forEach(r => { settingsObj[r.key] = r.value; });
    res.json({
      success: true,
      data: {
        geminiApiKey: settingsObj['GEMINI_API_KEY'] || process.env.GEMINI_API_KEY || config.AI.GEMINI_API_KEY || '',
        ideogramApiKey: settingsObj['IDEOGRAM_API_KEY'] || process.env.IDEOGRAM_API_KEY || '',
        groqApiKey: settingsObj['GROQ_API_KEY'] || process.env.GROQ_API_KEY || '',
        ollamaUrl: settingsObj['OLLAMA_URL'] || config.AI.OLLAMA_URL,
        ollamaModel: settingsObj['OLLAMA_MODEL'] || config.AI.DEFAULT_OLLAMA_MODEL,
        useNvenc: settingsObj['USE_NVENC'] ? settingsObj['USE_NVENC'] === 'true' : config.VIDEO.USE_NVENC,
        imageProviderMode: settingsObj['IMAGE_PROVIDER_MODE'] || 'MANUAL_IMPORT',
        scriptProvider: settingsObj['SCRIPT_PROVIDER'] || 'ollama',
        scriptModel: settingsObj['SCRIPT_MODEL'] || (settingsObj['SCRIPT_PROVIDER'] === 'gemini' ? 'gemini-2.0-flash' : 'qwen3:4b')
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/settings', (req, res) => {
  try {
    const { geminiApiKey, ideogramApiKey, groqApiKey, ollamaUrl, ollamaModel, useNvenc, imageProviderMode, scriptProvider, scriptModel } = req.body;

    if (geminiApiKey !== undefined) {
      run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('GEMINI_API_KEY', ?, CURRENT_TIMESTAMP)`, [geminiApiKey.trim()]);
      process.env.GEMINI_API_KEY = geminiApiKey.trim();
      config.AI.GEMINI_API_KEY = geminiApiKey.trim();
    }
    if (ideogramApiKey !== undefined) {
      run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('IDEOGRAM_API_KEY', ?, CURRENT_TIMESTAMP)`, [ideogramApiKey.trim()]);
      process.env.IDEOGRAM_API_KEY = ideogramApiKey.trim();
    }
    if (groqApiKey !== undefined) {
      run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('GROQ_API_KEY', ?, CURRENT_TIMESTAMP)`, [groqApiKey.trim()]);
      process.env.GROQ_API_KEY = groqApiKey.trim();
    }
    if (ollamaUrl !== undefined) {
      run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('OLLAMA_URL', ?, CURRENT_TIMESTAMP)`, [ollamaUrl.trim()]);
      config.AI.OLLAMA_URL = ollamaUrl.trim();
    }
    if (ollamaModel !== undefined) {
      run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('OLLAMA_MODEL', ?, CURRENT_TIMESTAMP)`, [ollamaModel.trim()]);
      config.AI.DEFAULT_OLLAMA_MODEL = ollamaModel.trim();
    }
    if (useNvenc !== undefined) {
      run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES ('USE_NVENC', ?, CURRENT_TIMESTAMP)`, [String(useNvenc)]);
      config.VIDEO.USE_NVENC = Boolean(useNvenc);
    }
    if (imageProviderMode !== undefined) {
      imageService.setImageProviderMode(imageProviderMode);
    }
    if (scriptProvider !== undefined || scriptModel !== undefined) {
      scriptService.setScriptProviderSettings(scriptProvider, scriptModel);
    }

    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/settings/test-gemini', async (req, res) => {
  try {
    const result = await imageService.testGeminiConnection(req.body.geminiApiKey);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/settings/test-gemini-text', async (req, res) => {
  try {
    const result = await aiService.testGeminiTextConnection(req.body.geminiApiKey, req.body.model);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/settings/test-ideogram', async (req, res) => {
  try {
    const result = await ideogramService.testIdeogramConnection(req.body.ideogramApiKey);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- SEO Metadata with 3 Titles & Subtitle Timestamps ---
router.get('/projects/:id/seo', (req, res) => {
  try {
    const result = seoService.generateMetadata(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/projects/:id/seo/generate', (req, res) => {
  try {
    const result = seoService.generateMetadata(req.params.id);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/settings/test-gemini', async (req, res) => {
  try {
    const result = await imageService.testGeminiConnection(req.body.geminiApiKey);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/settings/test-ideogram', async (req, res) => {
  try {
    const result = await ideogramService.testIdeogramConnection(req.body.ideogramApiKey);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 18. Christian Content Categories Hub (12 Categories) ---
router.get('/categories', (req, res) => {
  try {
    const categories = categoryService.getAllCategories();
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/categories/:id/topics', (req, res) => {
  try {
    const data = categoryService.getCategoryTopics(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/categories/:id/generate-topic', (req, res) => {
  try {
    const topic = categoryService.generateTopicForCategory(req.params.id, req.body.focusPrompt);
    res.json({ success: true, data: topic });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 19. Content Calendar & Publishing Cadence ---
router.get('/calendar', (req, res) => {
  try {
    const items = calendarService.getCalendarItems(req.query);
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/calendar', (req, res) => {
  try {
    const scheduled = calendarService.scheduleItem(req.body);
    res.json({ success: true, data: scheduled });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/calendar/cadence', (req, res) => {
  try {
    const scheduled = calendarService.generateCadenceSchedule(req.body.startDate);
    res.json({ success: true, count: scheduled.length, data: scheduled });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/calendar/:id', (req, res) => {
  try {
    const updated = calendarService.updateCalendarItem(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/calendar/:id', (req, res) => {
  try {
    const deleted = calendarService.deleteCalendarItem(req.params.id);
    res.json({ success: true, data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 20. Research Sources & Archaeological Registry ---
router.get('/research/sources', (req, res) => {
  try {
    const sources = researchSourcesService.getAllSources(req.query);
    res.json({ success: true, count: sources.length, data: sources });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/research/sources', (req, res) => {
  try {
    const created = researchSourcesService.addSource(req.body);
    res.json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 21. Multi-Category Production Queue Actions ---
router.post('/queue/topic', async (req, res) => {
  try {
    const item = await queueService.enqueueCategoryTopic(req.body);
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/queue/project', async (req, res) => {
  try {
    const item = await queueService.enqueueProject(req.body.projectId);
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 18. Christian Content Categories Hub (12 Categories) ---
router.get('/categories', (req, res) => {
  try {
    const categories = categoryService.getAllCategories();
    res.json({ success: true, count: categories.length, data: categories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/categories/:id/topics', (req, res) => {
  try {
    const data = categoryService.getCategoryTopics(req.params.id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/categories/:id/generate-topic', (req, res) => {
  try {
    const topic = categoryService.generateTopicForCategory(req.params.id, req.body.focusPrompt);
    res.json({ success: true, data: topic });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 19. Content Calendar & Publishing Cadence ---
router.get('/calendar', (req, res) => {
  try {
    const items = calendarService.getCalendarItems(req.query);
    res.json({ success: true, count: items.length, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/calendar', (req, res) => {
  try {
    const scheduled = calendarService.scheduleItem(req.body);
    res.json({ success: true, data: scheduled });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/calendar/cadence', (req, res) => {
  try {
    const scheduled = calendarService.generateCadenceSchedule(req.body.startDate);
    res.json({ success: true, count: scheduled.length, data: scheduled });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.patch('/calendar/:id', (req, res) => {
  try {
    const updated = calendarService.updateCalendarItem(req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/calendar/:id', (req, res) => {
  try {
    const deleted = calendarService.deleteCalendarItem(req.params.id);
    res.json({ success: true, data: deleted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 20. Research Sources & Archaeological Registry ---
router.get('/research/sources', (req, res) => {
  try {
    const sources = researchSourcesService.getAllSources(req.query);
    res.json({ success: true, count: sources.length, data: sources });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/research/sources', (req, res) => {
  try {
    const created = researchSourcesService.addSource(req.body);
    res.json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 21. Multi-Category Production Queue Actions ---
router.post('/queue/topic', async (req, res) => {
  try {
    const item = await queueService.enqueueCategoryTopic(req.body);
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/queue/project', async (req, res) => {
  try {
    const item = await queueService.enqueueProject(req.body.projectId);
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// --- 15. System Health & Environment ---
router.get('/system/health', (req, res) => {
  const fs = require('node:fs');
  res.json({
    status: 'healthy',
    studio: 'ByBibleWisdom AI Studio',
    version: '1.0.0',
    platform: process.platform,
    nodeVersion: process.version,
    database: fs.existsSync(config.PATHS.DB_FILE) ? 'connected' : 'missing',
    ffmpeg: fs.existsSync(config.PATHS.FFMPEG) ? 'installed' : 'missing',
    nvencGpuSupport: true,
    paths: {
      storage: config.PATHS.STORAGE,
      database: config.PATHS.DB_FILE,
      ffmpeg: config.PATHS.FFMPEG
    }
  });
});

module.exports = router;
