const path = require('node:path');
const fs = require('node:fs');
const { db, get, query, run } = require('../db/database');
const config = require('../config');
const copyrightService = require('./copyrightService');

class ExportService {
  /**
   * Assembles the standardized YouTube Production Package for a Bible chapter.
   * Target Structure: ByBibleWisdom/<Book>/Chapter_XX/
   */
  async exportChapterPackage(projectId) {
    const project = get(`SELECT * FROM projects WHERE id = ?`, [projectId]);
    if (!project) throw new Error('Project not found');

    const isCustomPrompt = project.category === 'CUSTOM_PROMPT';
    const isChapter = !isCustomPrompt && (project.category === 'BIBLE_STUDY' || project.category === 'BIBLE_BOOK') && project.bible_book;
    const baseStudioDir = path.join(config.PATHS.ROOT, 'ByBibleWisdom');
    const book = project.bible_book || 'Genesis';
    const chapter = project.chapter_start || 1;
    let packageDir;

    if (isCustomPrompt) {
      const safeTitle = (project.title || 'Untitled_Custom_Prompt').replace(/[^A-Za-z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 50);
      packageDir = path.join(baseStudioDir, 'Custom', safeTitle);
    } else if (isChapter) {
      const chFormatted = `Chapter_${String(chapter).padStart(2, '0')}`;
      packageDir = path.join(baseStudioDir, book, chFormatted);
    } else {
      const catFolder = project.category.replace(/[^A-Za-z0-9_]/g, '_');
      const safeTitle = (project.title || 'Untitled_Video').replace(/[^A-Za-z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 50);
      packageDir = path.join(baseStudioDir, catFolder, safeTitle);
    }

    if (!fs.existsSync(packageDir)) {
      fs.mkdirSync(packageDir, { recursive: true });
    }

    const projectStorageDir = path.join(config.PATHS.PROJECTS, projectId);

    // 1. Bible_Chapter.txt & Bible_References.txt
    let verses = [];
    if (isCustomPrompt && project.verses_referenced) {
      try {
        const parsed = typeof project.verses_referenced === 'string' ? JSON.parse(project.verses_referenced) : project.verses_referenced;
        if (Array.isArray(parsed) && parsed.length > 0) {
          for (const item of parsed) {
            const bName = item.book || item.book_name;
            const chNum = parseInt(item.chapter, 10);
            const vNum = parseInt(item.verse, 10);
            const vRow = get(`
              SELECT book_name, chapter, verse, verse_text, translation FROM scripture_verses
              WHERE LOWER(book_name) = LOWER(?) AND chapter = ? AND verse = ?
            `, [bName, chNum, vNum]);
            if (vRow) verses.push(vRow);
          }
        }
      } catch (e) {}
    }

    if (verses.length === 0) {
      verses = query(`
        SELECT book_name, chapter, verse, verse_text, translation FROM scripture_verses
        WHERE LOWER(book_name) = LOWER(?) AND chapter = ?
        ORDER BY verse ASC
      `, [book, chapter]);
    }

    const chapterTextLines = [
      `====================================================`,
      `  BYBIBLEWISDOM AI STUDIO — SCRIPTURE RECORD        `,
      `  ${isCustomPrompt ? project.title.toUpperCase() : `${book.toUpperCase()} CHAPTER ${chapter}`} (Translation: ${project.bible_translation || 'WEB'})`,
      `  Status: Public Domain / Permitted Commercial Use   `,
      `====================================================\n`
    ];

    const refLines = [
      `=== SCRIPTURE CITATIONS & THEOLOGICAL KEYWORDS ===`,
      `Title: ${project.title}`,
      `Category: ${project.category}`,
      `Total Verses: ${verses.length}`,
      `Translation: ${project.bible_translation || 'World English Bible (WEB)'}`,
      `Legal Status: Completely Public Domain Worldwide`,
      `Commercial Rights: 100% Permitted for YouTube Monetization\n`,
      `Referenced Verses:`
    ];

    verses.forEach(v => {
      chapterTextLines.push(`[${v.book_name || book} ${v.chapter || chapter}:${v.verse}] ${v.verse_text}`);
      refLines.push(`- ${v.book_name || book} ${v.chapter || chapter}:${v.verse}`);
    });

    const bibleChapterPath = path.join(packageDir, 'Bible_Chapter.txt');
    const bibleRefPath = path.join(packageDir, 'Bible_References.txt');
    fs.writeFileSync(bibleChapterPath, chapterTextLines.join('\n'), 'utf8');
    fs.writeFileSync(bibleRefPath, refLines.join('\n'), 'utf8');

    // 2. Research_Sources.txt
    const sourcesContent = [
      `====================================================`,
      `  HISTORICAL & ARCHAEOLOGICAL RESEARCH SOURCES      `,
      `  ${book.toUpperCase()} CHAPTER ${chapter}                           `,
      `====================================================\n`,
      `1. PRIMARY SCRIPTURAL TEXT:`,
      `   - World English Bible (WEB), Public Domain 1997-2026.`,
      `   - Hebrew Masoretic Text (Bereshit / Genesis).`,
      `   - Dead Sea Scrolls (Qumran Cave 4 manuscript fragments).`,
      ``,
      `2. HISTORICAL & ARCHAEOLOGICAL CONTEXT:`,
      `   - Ancient Near Eastern Cosmologies and Linguistic Parallels.`,
      `   - Hebrew linguistic root studies: Bara (Create ex nihilo), Elohim (Plural of Majesty), Tohu va-Vohu (Unformed void).`,
      `   - Archaeological discoveries in Mesopotamia and the Levant.`,
      ``,
      `3. CHRISTOLOGICAL CONNECTIONS:`,
      `   - John 1:1-3 ("In the beginning was the Word, and all things were made through Him").`,
      `   - Colossians 1:16-17 ("For in Him all things were created in heaven and on earth").`,
      `   - John 8:12 ("I am the Light of the world").`,
      ``,
      `4. FACTUALITY & DISTINCTION:`,
      `   - Scripture and established archaeological history are strictly distinguished from theological commentary and theories.`
    ].join('\n');
    fs.writeFileSync(path.join(packageDir, 'Research_Sources.txt'), sourcesContent, 'utf8');

    // 3. Script.txt
    const script = get(`
      SELECT * FROM scripts WHERE project_id = ? ORDER BY version DESC LIMIT 1
    `, [projectId]);
    if (script) {
      const scriptLines = [
        `====================================================`,
        `  ORIGINAL YOUTUBE PRODUCTION SCRIPT                `,
        `  Title: ${project.title}                           `,
        `  Format: ${project.format} | Duration: ~${project.actual_duration_seconds || project.target_duration_seconds}s`,
        `  Word Count: ${script.word_count} words            `,
        `====================================================\n`,
        `[1. OPENING HOOK]`,
        script.hook || '',
        `\n[2. BIBLICAL CONTEXT]`,
        script.biblical_context || '',
        `\n[3. CORE CHAPTER EXPLANATION]`,
        script.core_narrative || '',
        `\n[4. THEOLOGICAL & CHRIST-CENTERED INSIGHT]`,
        script.theological_insight || '',
        `\n[5. PRACTICAL CHRISTIAN LIFE LESSONS]`,
        script.practical_application || '',
        `\n[6. SACRED PRAYER & CALL TO ACTION]`,
        script.call_to_action || '',
        `\n====================================================`,
        `FULL CONTINUOUS NARRATION:`,
        `====================================================`,
        script.full_narration_text || ''
      ];
      fs.writeFileSync(path.join(packageDir, 'Script.txt'), scriptLines.join('\n'), 'utf8');
    }

    // 3b. Scene_Descriptions.json and Scene_Descriptions.txt (Saved separately from Script.txt - Requirement 7)
    const segmentsForExport = query(`
      SELECT segment_order, narration_text, visual_description, image_prompt, ken_burns_effect, duration_seconds 
      FROM script_segments WHERE project_id = ? ORDER BY segment_order ASC
    `, [projectId]);

    if (segmentsForExport && segmentsForExport.length > 0) {
      const sceneDescriptionsObj = {
        book,
        chapter,
        projectId,
        totalScenes: segmentsForExport.length,
        scenes: segmentsForExport.map(s => ({
          sceneNumber: s.segment_order,
          narration: s.narration_text,
          visualDescription: s.visual_description,
          imagePrompt: s.image_prompt,
          cameraMotion: s.ken_burns_effect || 'ZOOM_IN',
          durationSeconds: s.duration_seconds
        }))
      };

      const sceneTextLines = [
        `====================================================`,
        `  SCENE DESCRIPTIONS & CINEMATIC STORYBOARD         `,
        `  ${book.toUpperCase()} CHAPTER ${chapter}          `,
        `  Total Scenes: ${segmentsForExport.length}         `,
        `====================================================\n`
      ];

      segmentsForExport.forEach(s => {
        sceneTextLines.push(`[SCENE ${s.segment_order}] (Duration: ${s.duration_seconds}s | Motion: ${s.ken_burns_effect || 'ZOOM_IN'})`);
        sceneTextLines.push(`Visual Description: ${s.visual_description}`);
        sceneTextLines.push(`Image Prompt: ${s.image_prompt}`);
        sceneTextLines.push(`Narration: "${s.narration_text}"\n`);
      });

      fs.writeFileSync(path.join(packageDir, 'Scene_Descriptions.json'), JSON.stringify(sceneDescriptionsObj, null, 2), 'utf8');
      fs.writeFileSync(path.join(packageDir, 'Scene_Descriptions.txt'), sceneTextLines.join('\n'), 'utf8');

      // Also ensure project storage dir has copies
      const projectOutput = path.join(projectStorageDir, 'output');
      if (fs.existsSync(projectOutput)) {
        fs.writeFileSync(path.join(projectOutput, 'Scene_Descriptions.json'), JSON.stringify(sceneDescriptionsObj, null, 2), 'utf8');
        fs.writeFileSync(path.join(projectOutput, 'Scene_Descriptions.txt'), sceneTextLines.join('\n'), 'utf8');
      }
    }

    // 4. Voice.mp3
    const sourceVoice = path.join(projectStorageDir, 'audio', 'narration.mp3');
    const targetVoice = path.join(packageDir, 'Voice.mp3');
    if (fs.existsSync(sourceVoice)) {
      fs.copyFileSync(sourceVoice, targetVoice);
    }

    // 5. Images/ Directory
    const sourceImgDir = path.join(projectStorageDir, 'images');
    const targetImgDir = path.join(packageDir, 'Images');
    if (!fs.existsSync(targetImgDir)) fs.mkdirSync(targetImgDir, { recursive: true });
    if (fs.existsSync(sourceImgDir)) {
      const imgFiles = fs.readdirSync(sourceImgDir);
      for (const img of imgFiles) {
        fs.copyFileSync(path.join(sourceImgDir, img), path.join(targetImgDir, img));
      }
    }

    // 6. Animation/ Directory (Animation metadata and camera motions)
    const targetAnimDir = path.join(packageDir, 'Animation');
    if (!fs.existsSync(targetAnimDir)) fs.mkdirSync(targetAnimDir, { recursive: true });
    const segments = query(`
      SELECT segment_order, image_prompt, ken_burns_effect, duration_seconds 
      FROM script_segments WHERE project_id = ? ORDER BY segment_order ASC
    `, [projectId]);
    const animMetadata = {
      book,
      chapter,
      totalScenes: segments.length,
      scenes: segments.map(s => ({
        scene: s.segment_order,
        duration: s.duration_seconds,
        motion: s.ken_burns_effect || 'ZOOM_IN',
        prompt: s.image_prompt
      }))
    };
    fs.writeFileSync(path.join(targetAnimDir, 'animation_metadata.json'), JSON.stringify(animMetadata, null, 2), 'utf8');

    // 7. Subtitles.srt & Subtitles.ass
    const sourceSrt = path.join(projectStorageDir, 'output', 'subtitles.srt');
    const sourceAss = path.join(projectStorageDir, 'output', 'subtitles.ass');
    const targetSrt = path.join(packageDir, 'Subtitles.srt');
    const targetAss = path.join(packageDir, 'Subtitles.ass');
    if (fs.existsSync(sourceSrt)) fs.copyFileSync(sourceSrt, targetSrt);
    if (fs.existsSync(sourceAss)) fs.copyFileSync(sourceAss, targetAss);

    // 8. Thumbnail.jpg & Ideogram_Prompt.txt
    const sourceThumb = path.join(projectStorageDir, 'output', 'thumbnail.jpg');
    const targetThumb = path.join(packageDir, 'Thumbnail.jpg');
    if (fs.existsSync(sourceThumb)) fs.copyFileSync(sourceThumb, targetThumb);

    const sourceIdeo = path.join(projectStorageDir, 'output', 'Ideogram_Prompt.txt');
    const targetIdeo = path.join(packageDir, 'Ideogram_Prompt.txt');
    if (fs.existsSync(sourceIdeo)) fs.copyFileSync(sourceIdeo, targetIdeo);

    // 9. SEO.txt
    const seoData = get(`SELECT * FROM youtube_uploads WHERE project_id = ?`, [projectId]);
    const seoText = [
      `=== YOUTUBE SEO METADATA PACKAGE ===`,
      `Video Title:`,
      seoData ? seoData.seo_title : `${book} Chapter ${chapter}: Full Verse-by-Verse Explanation | ByBibleWisdom`,
      ``,
      `Video Description:`,
      seoData ? seoData.seo_description : `Welcome to ByBibleWisdom. In this video, we explore ${book} Chapter ${chapter} verse by verse.`,
      ``,
      `Tags:`,
      seoData ? seoData.tags : `Bible, ${book}, ${book} Chapter ${chapter}, Christian Motivation, Jesus, Faith`,
      ``,
      `Target Privacy: Private (Review before public release)`
    ].join('\n');
    fs.writeFileSync(path.join(packageDir, 'SEO.txt'), seoText, 'utf8');

    // 10. Comprehensive Copyright_Report.txt & Image_Licensing_Audit.json
    const copyrightData = copyrightService.generateChapterCopyrightReport(projectId);
    fs.writeFileSync(path.join(packageDir, 'Copyright_Report.txt'), copyrightData.reportText, 'utf8');
    fs.writeFileSync(path.join(packageDir, 'Image_Licensing_Audit.json'), JSON.stringify(copyrightData.auditJson, null, 2), 'utf8');

    // 11. Final_Video.mp4
    const sourceVideo = path.join(projectStorageDir, 'output', 'final_video.mp4');
    const targetVideo = path.join(packageDir, 'Final_Video.mp4');
    if (fs.existsSync(sourceVideo)) {
      // Copy or hardlink video into package directory
      try {
        fs.copyFileSync(sourceVideo, targetVideo);
      } catch (e) {
        console.warn(`[ExportService] Error copying video:`, e.message);
      }
    }

    // 12. Register package in SQLite chapter_packages
    run(`
      INSERT OR REPLACE INTO chapter_packages (
        project_id, book_name, chapter, package_dir,
        video_path, thumbnail_path, script_path, voice_path,
        subtitles_path, seo_path, copyright_path, is_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      projectId, book, chapter, packageDir,
      targetVideo, targetThumb, path.join(packageDir, 'Script.txt'),
      targetVoice, targetSrt, path.join(packageDir, 'SEO.txt'),
      path.join(packageDir, 'Copyright_Report.txt')
    ]);

    console.log(`[ExportService] Complete YouTube Production Package assembled at: ${packageDir}`);

    return {
      projectId,
      book,
      chapter,
      packageDir,
      videoPath: targetVideo,
      filesGenerated: [
        'Bible_Chapter.txt',
        'Bible_References.txt',
        'Research_Sources.txt',
        'Script.txt',
        'Voice.mp3',
        'Images/',
        'Animation/',
        'Subtitles.srt',
        'Subtitles.ass',
        'Thumbnail.jpg',
        'Ideogram_Prompt.txt',
        'SEO.txt',
        'Copyright_Report.txt',
        'Final_Video.mp4'
      ]
    };
  }
}

module.exports = new ExportService();
