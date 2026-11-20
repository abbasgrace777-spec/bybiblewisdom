-- ByBibleWisdom AI Studio SQLite Database Schema
-- Designed for zero-dependency local execution, full pipeline tracking, and copyright auditing.

PRAGMA foreign_keys = ON;

-- 1. Projects (Video Production Pipeline across all 12 Christian Content Categories)
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    category TEXT NOT NULL,
    format TEXT CHECK(format IN ('SHORTS', 'LONG_FORM')) NOT NULL DEFAULT 'SHORTS',
    status TEXT NOT NULL DEFAULT 'DRAFT',
    bible_book TEXT,
    chapter_start INTEGER,
    chapter_end INTEGER,
    verses_referenced TEXT,
    bible_translation TEXT DEFAULT 'WEB',
    target_duration_seconds INTEGER DEFAULT 60,
    actual_duration_seconds INTEGER,
    output_video_path TEXT,
    thumbnail_path TEXT,
    error_message TEXT,
    current_step INTEGER DEFAULT 1,
    current_step_name TEXT,
    progress_percent INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Scripts and Revisions
CREATE TABLE IF NOT EXISTS scripts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    hook TEXT,
    biblical_context TEXT,
    core_narrative TEXT NOT NULL,
    theological_insight TEXT,
    practical_application TEXT,
    call_to_action TEXT,
    full_narration_text TEXT NOT NULL,
    word_count INTEGER DEFAULT 0,
    estimated_read_time_seconds INTEGER DEFAULT 0,
    is_approved BOOLEAN DEFAULT 0,
    model_used TEXT,
    generation_metrics TEXT,
    scene_descriptions TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3. Script Scene Breakdown (One-to-One with Video Segments)
CREATE TABLE IF NOT EXISTS script_segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    segment_order INTEGER NOT NULL,
    narration_text TEXT NOT NULL,
    visual_description TEXT,
    image_prompt TEXT,
    media_path TEXT,
    media_type TEXT CHECK(media_type IN ('IMAGE', 'VIDEO', 'COLOR_BACKGROUND')) DEFAULT 'IMAGE',
    image_status TEXT DEFAULT 'AI_GENERATED',
    engine_used TEXT DEFAULT 'Google Gemini Imagen 3',
    duration_seconds REAL DEFAULT 4.0,
    audio_start_ms INTEGER DEFAULT 0,
    audio_end_ms INTEGER DEFAULT 0,
    ken_burns_effect TEXT CHECK(ken_burns_effect IN ('ZOOM_IN', 'ZOOM_OUT', 'PAN_LEFT', 'PAN_RIGHT', 'STATIC')) DEFAULT 'ZOOM_IN',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. Mandatory Safety Gate & Compliance Audits
CREATE TABLE IF NOT EXISTS compliance_audits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    script_originality_passed BOOLEAN DEFAULT 0,
    bible_accuracy_passed BOOLEAN DEFAULT 0,
    translation_licensed_passed BOOLEAN DEFAULT 0,
    historical_evidence_verified BOOLEAN DEFAULT 0,
    visual_licenses_passed BOOLEAN DEFAULT 0,
    audio_licenses_passed BOOLEAN DEFAULT 0,
    synthetic_disclosure_flag BOOLEAN DEFAULT 1,
    manual_approval_granted BOOLEAN DEFAULT 0,
    approved_by TEXT,
    approval_notes TEXT,
    audit_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Asset Library & Copyright Tracking
CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    asset_type TEXT CHECK(asset_type IN ('IMAGE', 'VOICE', 'MUSIC', 'SFX', 'THUMBNAIL', 'FONT')) NOT NULL,
    title TEXT,
    file_path TEXT NOT NULL,
    source_url TEXT,
    creator_name TEXT,
    source_website TEXT,
    license_type TEXT NOT NULL DEFAULT 'Public Domain / CC0',
    license_url TEXT,
    commercial_use_allowed BOOLEAN DEFAULT 1,
    attribution_required BOOLEAN DEFAULT 0,
    attribution_text TEXT,
    local_filename TEXT,
    verification_status TEXT DEFAULT 'VERIFIED_COMMERCIAL',
    verification_notes TEXT,
    download_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    model_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 6. Bible Books Master Table (All 66 Books)
CREATE TABLE IF NOT EXISTS bible_books (
    id INTEGER PRIMARY KEY,
    book_order INTEGER UNIQUE NOT NULL,
    name TEXT NOT NULL,
    testament TEXT CHECK(testament IN ('OLD', 'NEW')) NOT NULL,
    category TEXT NOT NULL, -- e.g. Law, Historical, Poetry, Major Prophets, Gospels, Epistles
    total_chapters INTEGER NOT NULL,
    author_tradition TEXT,
    approximate_date TEXT,
    central_theme TEXT NOT NULL,
    key_verse_reference TEXT,
    key_verse_text TEXT,
    historical_background TEXT
);

-- 7. Scripture Verses (Pre-loaded public domain text: WEB / KJV)
CREATE TABLE IF NOT EXISTS scripture_verses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_name TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    translation TEXT NOT NULL, -- 'WEB', 'KJV', 'ASV'
    verse_text TEXT NOT NULL,
    UNIQUE(book_name, chapter, verse, translation)
);

-- 8. Historical & Archaeological Discoveries Database
CREATE TABLE IF NOT EXISTS historical_stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Archaeology', 'Ancient Empire', 'Lesser-Known Figure', 'Artifact'
    civilization TEXT, -- 'Egypt', 'Babylon', 'Assyria', 'Persia', 'Rome', 'Israel'
    biblical_era TEXT,
    scripture_references TEXT,
    established_facts TEXT NOT NULL,
    historical_sources TEXT NOT NULL,
    theories_and_traditions TEXT,
    educational_summary TEXT NOT NULL
);

-- 9. YouTube Upload & Metadata Registry
CREATE TABLE IF NOT EXISTS youtube_uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT UNIQUE NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    youtube_video_id TEXT,
    privacy_status TEXT CHECK(privacy_status IN ('private', 'unlisted', 'public')) DEFAULT 'private',
    scheduled_publish_time DATETIME,
    seo_title TEXT NOT NULL,
    seo_description TEXT NOT NULL,
    tags TEXT,
    category_id TEXT DEFAULT '27', -- 27 = Education
    made_for_kids BOOLEAN DEFAULT 0,
    contains_synthetic_media BOOLEAN DEFAULT 1,
    upload_timestamp DATETIME,
    upload_status TEXT CHECK(upload_status IN ('READY', 'UPLOADING', 'UPLOADED', 'FAILED')) DEFAULT 'READY',
    upload_error TEXT
);

-- 10. System Configuration & Keys
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 11. Sequential Chapter Production Queue (One Chapter = One Separate Video)
CREATE TABLE IF NOT EXISTS production_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    book_name TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    format TEXT CHECK(format IN ('SHORTS', 'LONG_FORM')) DEFAULT 'LONG_FORM',
    status TEXT CHECK(status IN ('QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED', 'PAUSED')) DEFAULT 'QUEUED',
    current_step INTEGER DEFAULT 0,
    step_name TEXT,
    progress_percent INTEGER DEFAULT 0,
    error_message TEXT,
    output_package_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 12. Visual Uniqueness Engine Registry (Never repeat scene compositions or animations)
CREATE TABLE IF NOT EXISTS visual_uniqueness_registry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    book_name TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    scene_order INTEGER NOT NULL,
    prompt_text TEXT NOT NULL,
    visual_theme TEXT,
    characters_present TEXT,
    environment_setting TEXT,
    animation_effect TEXT,
    seed INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. Ideogram Dedicated Thumbnail Studio
CREATE TABLE IF NOT EXISTS ideogram_thumbnails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    book_name TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    title TEXT NOT NULL,
    ideogram_prompt TEXT NOT NULL,
    headline_text TEXT,
    visual_moment TEXT,
    style_preset TEXT DEFAULT 'REALISTIC_BIBLICAL',
    thumbnail_path TEXT,
    png_path TEXT,
    file_size_bytes INTEGER DEFAULT 0,
    provider TEXT DEFAULT 'IDEOGRAM',
    license_type TEXT DEFAULT 'Ideogram Commercial Terms',
    prompt_variations TEXT,
    generation_status TEXT CHECK(generation_status IN ('PENDING_API_OR_MANUAL', 'GENERATED', 'APPROVED')) DEFAULT 'PENDING_API_OR_MANUAL',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 14. Standardized Chapter Package Records
CREATE TABLE IF NOT EXISTS chapter_packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id TEXT UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
    book_name TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    package_dir TEXT NOT NULL,
    video_path TEXT NOT NULL,
    thumbnail_path TEXT,
    script_path TEXT,
    voice_path TEXT,
    subtitles_path TEXT,
    seo_path TEXT,
    copyright_path TEXT,
    is_verified BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 15. Content Calendar (12-Category Publishing Cadence)
CREATE TABLE IF NOT EXISTS content_calendar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    format TEXT CHECK(format IN ('SHORTS', 'LONG_FORM')) NOT NULL DEFAULT 'LONG_FORM',
    target_date DATE NOT NULL,
    scheduled_time TEXT DEFAULT '14:00',
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
    status TEXT CHECK(status IN ('PLANNED', 'SCRIPTED', 'IN_PRODUCTION', 'READY_FOR_REVIEW', 'PUBLISHED_PRIVATE', 'PUBLISHED_PUBLIC')) DEFAULT 'PLANNED',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 16. Research & Archaeological Sources Registry
CREATE TABLE IF NOT EXISTS research_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source_name TEXT NOT NULL,
    category TEXT NOT NULL,
    period_or_century TEXT,
    primary_location TEXT,
    archaeological_artifact TEXT,
    biblical_correlation TEXT NOT NULL,
    evidence_type TEXT CHECK(evidence_type IN ('SCRIPTURE', 'HISTORICAL_EVIDENCE', 'TRADITIONAL_BELIEF', 'THEOLOGICAL_THEORY')) NOT NULL,
    summary TEXT NOT NULL,
    academic_citation TEXT,
    is_verified BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_scripture_lookup ON scripture_verses(book_name, chapter, translation);
CREATE INDEX IF NOT EXISTS idx_queue_status ON production_queue(status);
CREATE INDEX IF NOT EXISTS idx_uniqueness_book ON visual_uniqueness_registry(book_name, chapter);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON content_calendar(target_date);
CREATE INDEX IF NOT EXISTS idx_sources_category ON research_sources(category);
