import React, { useState } from 'react';
import { BookOpen, Sparkles, Smartphone, Monitor, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export default function CreateVideoView({ onProjectCreated, bibleBooks = [] }) {
  const [activeMode, setActiveMode] = useState('MODE_A'); // 'MODE_A' (Chapter) or 'MODE_B' (Prompt)
  const [format, setFormat] = useState('SHORTS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mode A: Chapter Mode
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [chapter, setChapter] = useState(1);
  const [category, setCategory] = useState('BIBLE_BOOK');
  const [translation, setTranslation] = useState('WEB');

  // Mode B: Prompt Mode
  const [promptText, setPromptText] = useState('');
  const [outline, setOutline] = useState(null);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);

  // Selected book data for max chapters
  const currentBookObj = bibleBooks.find(b => b.name === selectedBook);
  const maxChapters = currentBookObj?.total_chapters || 50;

  async function handleModeASubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const projectData = {
        title: format === 'SHORTS' ? `${selectedBook} ${chapter} in 60 Seconds` : `The Complete Story of ${selectedBook} ${chapter}`,
        topic: `${selectedBook} Chapter ${chapter}`,
        category,
        format,
        bible_book: selectedBook,
        chapter_start: parseInt(chapter, 10),
        chapter_end: parseInt(chapter, 10),
        bible_translation: translation,
      };
      await onProjectCreated(projectData);
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateOutline(e) {
    e.preventDefault();
    if (!promptText.trim()) return;
    setIsGeneratingOutline(true);
    setError(null);
    setOutline(null);
    try {
      const res = await api.generatePromptOutline({
        prompt: promptText.trim(),
        format,
      });
      if (res.success && res.data) {
        setOutline(res.data);
      } else {
        throw new Error(res.error || 'Failed to generate outline');
      }
    } catch (err) {
      setError(err.message || 'Outline generation failed');
    } finally {
      setIsGeneratingOutline(false);
    }
  }

  async function handleApprovePromptProject() {
    if (!outline) return;
    setLoading(true);
    setError(null);
    try {
      const projectData = {
        title: outline.title || promptText.slice(0, 50),
        topic: promptText.trim(),
        category: 'CUSTOM_PROMPT',
        format,
        bible_book: outline.primaryBook || 'Scripture',
        chapter_start: 1,
        chapter_end: 1,
        bible_translation: 'WEB',
        outline: outline
      };
      await onProjectCreated(projectData);
    } catch (err) {
      setError(err.message || 'Failed to approve project');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-100">Create Video</h1>
        <p className="text-xs text-slate-400 mt-1">
          Choose between Chapter Mode (complete verse-by-verse chapter) or Prompt Mode (thematic question or topic).
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg max-w-md">
        <button
          type="button"
          onClick={() => { setActiveMode('MODE_A'); setError(null); }}
          className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
            activeMode === 'MODE_A'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Chapter Mode</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveMode('MODE_B'); setError(null); }}
          className={`flex-1 py-2 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
            activeMode === 'MODE_B'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Prompt Mode</span>
        </button>
      </div>

      {/* Format Selector (Shared) */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Video Format
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button
            type="button"
            onClick={() => setFormat('SHORTS')}
            className={`p-3 rounded-lg border text-left transition-colors flex items-center gap-3 ${
              format === 'SHORTS'
                ? 'border-amber-500 bg-amber-500/10 text-slate-100'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Smartphone className={`w-5 h-5 ${format === 'SHORTS' ? 'text-amber-400' : 'text-slate-500'}`} />
            <div>
              <div className="text-xs font-semibold text-slate-200">YouTube Shorts</div>
              <div className="text-[11px] text-slate-400">9:16 vertical • ~60s</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setFormat('LONG_FORM')}
            className={`p-3 rounded-lg border text-left transition-colors flex items-center gap-3 ${
              format === 'LONG_FORM'
                ? 'border-amber-500 bg-amber-500/10 text-slate-100'
                : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Monitor className={`w-5 h-5 ${format === 'LONG_FORM' ? 'text-amber-400' : 'text-slate-500'}`} />
            <div>
              <div className="text-xs font-semibold text-slate-200">Long-Form Documentary</div>
              <div className="text-[11px] text-slate-400">16:9 widescreen • 15–25m</div>
            </div>
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-500/40 flex items-start gap-2.5 text-xs text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* MODE A: CHAPTER MODE FORM */}
      {activeMode === 'MODE_A' && (
        <form onSubmit={handleModeASubmit} className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Bible Book
              </label>
              <select
                value={selectedBook}
                onChange={(e) => {
                  setSelectedBook(e.target.value);
                  setChapter(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {bibleBooks.length > 0 ? (
                  bibleBooks.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name} ({b.testament === 'OT' ? 'Old' : 'New'} • {b.total_chapters} ch)
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Genesis">Genesis</option>
                    <option value="Exodus">Exodus</option>
                    <option value="Psalms">Psalms</option>
                    <option value="Matthew">Matthew</option>
                    <option value="John">John</option>
                    <option value="Romans">Romans</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Chapter (1 to {maxChapters})
              </label>
              <input
                type="number"
                min="1"
                max={maxChapters}
                value={chapter}
                onChange={(e) => setChapter(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Translation
              </label>
              <select
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="WEB">World English Bible (WEB) — Public Domain</option>
                <option value="ASV">American Standard Version (ASV) — Public Domain</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="BIBLE_BOOK">Bible Book Verse-by-Verse</option>
                <option value="BIBLICAL_ARCHAEOLOGY">Biblical Archaeology & Historical Context</option>
                <option value="BIBLE_STUDY">Theological Deep Dive</option>
                <option value="JESUS_TEACHING">Gospel & Teachings of Christ</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-5 py-2 rounded-md text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <span>{loading ? 'Creating Project...' : 'Create & Start Pipeline'}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </form>
      )}

      {/* MODE B: PROMPT MODE FORM */}
      {activeMode === 'MODE_B' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <form onSubmit={handleGenerateOutline} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-300">
              Thematic Question or Prompt
            </label>
            <input
              type="text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder='e.g., "How big was Noah&#39;s ark?" or "Why did David call Psalm 23 the Lord is my shepherd?"'
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500"
            />
            <div className="flex justify-between items-center pt-1">
              <span className="text-[11px] text-slate-500">
                AI extracts verified scripture from SQLite and classifies historical claims.
              </span>
              <button
                type="submit"
                disabled={isGeneratingOutline || !promptText.trim()}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2 rounded-md text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingOutline ? 'Generating Outline...' : 'Generate Outline'}</span>
              </button>
            </div>
          </form>

          {/* Outline Review before media production */}
          {outline && (
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-amber-400">{outline.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Review verified scripture references before proceeding.</p>
                </div>
                <button
                  type="button"
                  onClick={handleApprovePromptProject}
                  disabled={loading}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 rounded-md text-xs transition-colors flex items-center gap-1.5 shadow"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{loading ? 'Approving...' : 'Approve & Produce Video'}</span>
                </button>
              </div>

              {/* Sections & Verses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-md">
                  <div className="font-semibold text-slate-300 mb-2">Outline Sections ({outline.sections?.length || 0})</div>
                  <ul className="space-y-1.5 text-slate-400">
                    {outline.sections?.map((sec, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-amber-500 font-mono">{i + 1}.</span>
                        <span>{sec.title || sec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-md">
                  <div className="font-semibold text-slate-300 mb-2">Verified Scripture Quotes ({outline.verses?.length || 0})</div>
                  <ul className="space-y-1.5 text-slate-400 max-h-40 overflow-y-auto">
                    {outline.verses?.map((v, i) => (
                      <li key={i} className="text-[11px] border-b border-slate-900 pb-1">
                        <span className="text-amber-400 font-semibold">{v.reference}: </span>
                        <span>"{v.text}"</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
