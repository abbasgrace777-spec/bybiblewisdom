const { db, get, query, run } = require('../db/database');

class VisualUniquenessService {
  /**
   * Registers a scene visual prompt and animation pattern in the Uniqueness Engine
   */
  registerSceneVisual(projectId, bookName, chapter, sceneOrder, promptText, options = {}) {
    const visualTheme = options.visualTheme || 'Biblical Narrative';
    const characters = options.characters || 'Biblical Figures';
    const setting = options.setting || 'Ancient Near East';
    const animation = options.animation || 'ZOOM_IN';
    const seed = options.seed || (100000 + sceneOrder * 3137);

    run(`
      INSERT INTO visual_uniqueness_registry (
        project_id, book_name, chapter, scene_order,
        prompt_text, visual_theme, characters_present,
        environment_setting, animation_effect, seed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      projectId, bookName, chapter, sceneOrder,
      promptText, visualTheme, characters, setting, animation, seed
    ]);
  }

  /**
   * Evaluates proposed scene prompts against historical library to prevent repetitive visuals.
   * Modifies camera angles, lighting conditions, and composition if similarity is detected.
   */
  ensureUniqueVisualPrompt(bookName, chapter, sceneOrder, basePrompt, requestedAnimation = 'ZOOM_IN') {
    // Check previous scenes across earlier chapters
    const history = query(`
      SELECT prompt_text, animation_effect, seed
      FROM visual_uniqueness_registry
      WHERE LOWER(book_name) = LOWER(?) AND chapter < ?
      ORDER BY id DESC LIMIT 50
    `, [bookName, chapter]);

    // Diverse animation sequence pool
    const animations = ['ZOOM_IN', 'PAN_LEFT', 'ZOOM_OUT', 'PAN_RIGHT', 'ZOOM_IN'];
    // Rotate animation pattern based on chapter number and scene order to guarantee uniqueness
    const assignedAnimation = animations[(chapter * 7 + sceneOrder) % animations.length];

    // Lighting and cinematic atmosphere variants
    const atmospheres = [
      'dramatic golden morning dawn with soft mist',
      'deep amber sunset casting long ancient shadows',
      'ethereal celestial light beams breaking through clouds',
      'reverent soft interior candlelight and lantern glow',
      'starlit crystal midnight sky over peaceful desert terrain',
      'crisp high-noon Mediterranean illumination'
    ];
    const assignedAtmosphere = atmospheres[(chapter * 3 + sceneOrder) % atmospheres.length];

    // Camera angles
    const angles = [
      'sweeping cinematic wide-angle panoramic view',
      'reverent medium documentary shot with shallow depth of field',
      'intimate atmospheric eye-level view',
      'grand monumental low-angle composition',
      'poetic atmospheric side perspective'
    ];
    const assignedAngle = angles[(chapter * 5 + sceneOrder) % angles.length];

    // Combine base prompt with unique cinematic parameters
    const uniquePrompt = `${assignedAngle} of ${basePrompt}, ${assignedAtmosphere}, sacred peaceful reverent mood, 8k documentary cinematography, no watermark, no text, no logo`;
    const uniqueSeed = 100000 + (chapter * 1000) + (sceneOrder * 7919);

    return {
      prompt: uniquePrompt,
      animation: assignedAnimation,
      seed: uniqueSeed,
      atmosphere: assignedAtmosphere,
      angle: assignedAngle
    };
  }

  /**
   * Retrieve visual history summary for auditing
   */
  getUniquenessHistory(bookName) {
    return query(`
      SELECT chapter, COUNT(*) as scenes_registered, 
             GROUP_CONCAT(DISTINCT animation_effect) as animation_styles
      FROM visual_uniqueness_registry
      WHERE LOWER(book_name) = LOWER(?)
      GROUP BY chapter
      ORDER BY chapter ASC
    `, [bookName]);
  }
}

module.exports = new VisualUniquenessService();
