const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');

module.exports = {
  PORT: process.env.PORT || 5000,
  CLIENT_PORT: process.env.CLIENT_PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Paths
  PATHS: {
    ROOT: ROOT_DIR,
    BACKEND: path.join(ROOT_DIR, 'backend'),
    FRONTEND: path.join(ROOT_DIR, 'frontend'),
    DATA: path.join(ROOT_DIR, 'data'),
    DB_FILE: path.join(ROOT_DIR, 'data', 'bible_studio.db'),
    STORAGE: path.join(ROOT_DIR, 'storage'),
    PROJECTS: path.join(ROOT_DIR, 'storage', 'projects'),
    TEMP: path.join(ROOT_DIR, 'storage', 'temp'),
    AUDIO_LIBRARY: path.join(ROOT_DIR, 'data', 'audio_library'),
    BIBLE_TEXTS: path.join(ROOT_DIR, 'data', 'bible_texts'),
    TOOLS_BIN: path.join(ROOT_DIR, 'tools', 'bin'),
    FFMPEG: path.join(ROOT_DIR, 'tools', 'bin', 'ffmpeg.exe'),
    FFPROBE: path.join(ROOT_DIR, 'tools', 'bin', 'ffprobe.exe'),
  },

  // AI & Generation Configuration
  AI: {
    // Default to free local Ollama or free API providers
    OLLAMA_URL: process.env.OLLAMA_URL || 'http://127.0.0.1:11434',
    DEFAULT_OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'qwen3:4b',
    // Fallback free providers (User can input API keys in Settings tab)
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  },

  // Voice Settings (Kokoro TTS - Free, Apache 2.0, Local High-Quality Documentary Narration)
  VOICE: {
    ENGINE: 'kokoro', // 'kokoro' (default, local Apache 2.0)
    DEFAULT_VOICE: 'af_bella', // Bella: Gentle, loving, soul-touching American female
    ALTERNATIVE_VOICES: [
      // Natural Human Male Voices (Ultra-Realistic, Zero Robotic Sound)
      { id: 'en-US-AndrewNeural', name: 'Andrew (Natural & Warm American Male - Human Sounding)', engine: 'edge', gender: 'Male', enabled: true, recommended: true },
      { id: 'en-US-BrianNeural', name: 'Brian (Expressive & Deep Storyteller Male)', engine: 'edge', gender: 'Male', enabled: true, recommended: true },
      { id: 'en-US-GuyNeural', name: 'Guy (Calm, Relaxed & Natural Human Male)', engine: 'edge', gender: 'Male', enabled: true },
      { id: 'en-US-ChristopherNeural', name: 'Christopher (Deep, Reverent Documentary Baritone)', engine: 'edge', gender: 'Male', enabled: true },
      { id: 'en-US-SteffanNeural', name: 'Steffan (Soft, Peaceful & Gentle Soulful Male)', engine: 'edge', gender: 'Male', enabled: true },
      // Kokoro Offline Voices
      { id: 'am_adam', name: 'Adam (Kokoro Offline - Deep Storyteller Male)', engine: 'kokoro', gender: 'Male', enabled: true },
      { id: 'am_michael', name: 'Michael (Kokoro Offline - Calm Reverent Male)', engine: 'kokoro', gender: 'Male', enabled: true },
      { id: 'bm_george', name: 'George (Kokoro Offline - Classical British Male)', engine: 'kokoro', gender: 'Male', enabled: true },
      { id: 'af_bella', name: 'Bella (Kokoro Offline - Gentle Female)', engine: 'kokoro', gender: 'Female', enabled: true },
      { id: 'en-US-JennyNeural', name: 'Jenny (Edge Neural - Warm Human Female)', engine: 'edge', gender: 'Female', enabled: true },
    ],
    PITCH: '+0Hz',
    RATE: '-10%',
  },

  // Video Specifications
  VIDEO: {
    SHORTS: {
      WIDTH: 1080,
      HEIGHT: 1920,
      FPS: 30,
      BITRATE: '6M',
      ASPECT_RATIO: '9:16',
      MAX_DURATION: 60,
    },
    LONG_FORM: {
      WIDTH: 1920,
      HEIGHT: 1080,
      FPS: 30,
      BITRATE: '10M',
      ASPECT_RATIO: '16:9',
      TARGET_MIN_DURATION: 1200, // 20 minutes minimum
      TARGET_MAX_DURATION: 1500, // 25 minutes
    },
    // GPU NVENC Acceleration
    USE_NVENC: true,
  },

  // Compliance & Copyright Guardrails
  COMPLIANCE: {
    ALLOWED_BIBLE_TRANSLATIONS: [
      { code: 'WEB', name: 'World English Bible', status: 'Public Domain', notes: 'Modern language, completely public domain worldwide.' },
      { code: 'KJV', name: 'King James Version', status: 'Public Domain', notes: 'Historic majesty, public domain worldwide outside Crown Rights in UK.' },
      { code: 'ASV', name: 'American Standard Version (1901)', status: 'Public Domain', notes: 'Literal scholarship, public domain worldwide.' },
      { code: 'BSB', name: 'Berean Standard Bible', status: 'Permissive Digital License', notes: 'Free for digital ministry with attribution.' },
    ],
    DEFAULT_TRANSLATION: 'WEB',
    DEFAULT_UPLOAD_STATUS: 'private', // Safety first: never upload public directly
  }
};
