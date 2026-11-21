import React, { useState } from 'react';
import { X, Smartphone, Monitor, BookOpen, Sparkles, Check, HelpCircle, Layers, FileText, ShieldAlert, Play, Clock } from 'lucide-react';
import { api } from '../services/api';

export default function NewProjectModal({ isOpen, onClose, onProjectCreated, bibleBooks = [] }) {
  // Mode selection: 'MODE_A' (Chapter Mode) or 'MODE_B' (Prompt Mode)
  const [activeMode, setActiveMode] = useState('MODE_A');

  // Common State
  const [format, setFormat] = useState('SHORTS');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Mode A: Chapter Mode State
  const [category, setCategory] = useState('BIBLE_BOOK');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [chapter, setChapter] = useState(1);
  const [translation, setTranslation] = useState('WEB');

  // Mode B: Prompt Mode State
  const [promptText, setPromptText] = useState('');
  const [outline, setOutline] = useState(null);
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Mode C: Direct Script Mode (Zero AI Rewriting)
  const [customScriptText, setCustomScriptText] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false);
  const [trimNotification, setTrimNotification] = useState(null);

  const selectedBookObj = bibleBooks.find(b => b.name === selectedBook);
  const totalChaptersForBook = selectedBookObj?.total_chapters || 50;

  if (!isOpen) return null;

  function handleAutoTrimToShort() {
    if (!customScriptText.trim()) return;
    const clean = customScriptText
      .replace(/>>\s*\[music\]\s*>>/gi, '')
      .replace(/\[music\]/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const rawSentences = (clean.match(/[^.!?]+[.!?]+|\s*[^.!?]+$/g) || [clean])
      .map(s => s.trim())
      .filter(Boolean);

    if (rawSentences.length <= 4) return;

    const selected = [];
    let currentWords = 0;
    const targetWords = 125;

    // 1. Hook / Opening Address to God (First 1-2 sentences)
    for (let i = 0; i < Math.min(2, rawSentences.length); i++) {
      const s = rawSentences[i];
      const wCount = s.split(/\s+/).filter(Boolean).length;
      if (currentWords + wCount <= targetWords - 35) {
        selected.push(s);
        currentWords += wCount;
      }
    }

    // 2. Core Petition & Healing (Sentences mentioning healing, peace, comfort, strength, Lord, pain)
    const middleSentences = rawSentences.slice(2, rawSentences.length - 2);
    for (const s of middleSentences) {
      const lower = s.toLowerCase();
      if (lower.includes('heal') || lower.includes('peace') || lower.includes('strength') || lower.includes('body') || lower.includes('comfort') || lower.includes('relief') || lower.includes('pain') || lower.includes('amen')) {
        const wCount = s.split(/\s+/).filter(Boolean).length;
        if (currentWords + wCount <= targetWords - 35) {
          selected.push(s);
          currentWords += wCount;
        }
      }
    }

    // 3. Concluding Blessing, Amen & Call to Action (Last 1-2 sentences)
    const endingSentences = rawSentences.slice(Math.max(2, rawSentences.length - 2));
    for (const s of endingSentences) {
      const wCount = s.split(/\s+/).filter(Boolean).length;
      if (currentWords + wCount <= targetWords + 10) {
        selected.push(s);
        currentWords += wCount;
      }
    }

    if (selected.length > 0) {
      const trimmed = selected.join(' ');
      setCustomScriptText(trimmed);
      const newCount = trimmed.split(/\s+/).filter(Boolean).length;
      setTrimNotification(`⚡ Prayer auto-trimmed to ${newCount} words (~${Math.round(newCount / 2.3)}s). Perfectly calibrated for YouTube Shorts!`);
      setTimeout(() => setTrimNotification(null), 6000);
    }
  }

  // Handle Mode C submission (Direct Custom Script to Video)
  async function handleModeCSubmit(e) {
    e.preventDefault();
    if (!customScriptText.trim()) {
      setError('Please paste your script or prayer text.');
      return;
    }
    setIsSubmittingCustom(true);
    setError(null);
    try {
      const res = await api.createCustomScriptProject({
        title: customTitle.trim() || customScriptText.trim().slice(0, 40) + '...',
        scriptText: customScriptText.trim(),
        format
      });
      if (!res.success || !res.data) {
        throw new Error(res.error || 'Failed to create project from custom script.');
      }
      await onProjectCreated(res.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Error processing custom script.');
    } finally {
      setIsSubmittingCustom(false);
    }
  }

  // Handle Mode A submission (Chapter Mode)
  async function handleModeASubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const projectData = {
      title: title || (format === 'SHORTS' ? `${selectedBook} ${chapter} in 60 Seconds` : `The Complete Story of ${selectedBook} ${chapter}`),
      topic: topic || `${selectedBook} Chapter ${chapter}`,
      category,
      format,
      bible_book: selectedBook,
      chapter_start: parseInt(chapter, 10),
      chapter_end: parseInt(chapter, 10),
      bible_translation: translation,
    };

    try {
      await onProjectCreated(projectData);
      onClose();
    } catch (err) {
      setError('Error creating project: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Mode B Outline Generation
  async function handleGenerateOutline(e) {
    e.preventDefault();
    if (!promptText.trim()) {
      setError('Please enter a biblical question or topic.');
      return;
    }

    setIsGeneratingOutline(true);
    setError(null);
    setOutline(null);

    try {
      const res = await api.generatePromptOutline({
        prompt: promptText.trim(),
        format
      });
      if (res.success && res.data) {
        setOutline(res.data);
      } else {
        throw new Error(res.error || 'Failed to generate outline.');
      }
    } catch (err) {
      setError(err.message || 'Error communicating with outline engine.');
    } finally {
      setIsGeneratingOutline(false);
    }
  }

  // Handle Mode B Outline Approval & Pipeline Launch
  async function handleApproveOutline() {
    if (!outline || !outline.projectId) return;

    setIsApproving(true);
    setError(null);

    try {
      // Step 2 & 3: Approve outline and generate script with exact scripture quotes
      const scriptRes = await api.approvePromptAndRun({
        projectId: outline.projectId,
        outline
      });

      if (!scriptRes.success) {
        throw new Error(scriptRes.error || 'Script generation failed validation.');
      }

      // Fetch newly scripted project record
      const projectRes = await api.getProject(outline.projectId);
      if (projectRes.data) {
        await onProjectCreated(projectRes.data);
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Error approving outline and starting pipeline.');
    } finally {
      setIsApproving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className="w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-100">Create Video Project</h3>
            <p className="text-[11px] sm:text-xs text-slate-400">Automated YouTube Bible Production Engine</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex-shrink-0 grid grid-cols-3 border-b border-slate-800 bg-slate-900/40">
          <button
            type="button"
            onClick={() => { setActiveMode('MODE_A'); setError(null); }}
            className={`py-3 px-2 sm:px-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeMode === 'MODE_A'
                ? 'border-amber-500 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="truncate">1. Chapter Mode</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveMode('MODE_B'); setError(null); }}
            className={`py-3 px-2 sm:px-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeMode === 'MODE_B'
                ? 'border-amber-500 text-amber-300 bg-amber-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="truncate">2. AI Question</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveMode('MODE_C'); setError(null); }}
            className={`py-3 px-2 sm:px-3 text-[11px] sm:text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeMode === 'MODE_C'
                ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="truncate">3. Paste My Script</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto">
          {/* Error Alert */}
          {error && (
            <div className="mx-5 mt-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Production Notice:</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* MODE A: CHAPTER MODE */}
          {activeMode === 'MODE_A' && (
            <form onSubmit={handleModeASubmit} className="p-5 sm:p-6 space-y-4">
            {/* Format Switcher */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Video Format
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormat('SHORTS')}
                  className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                    format === 'SHORTS'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Smartphone className="w-6 h-6 text-amber-400" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">YouTube Shorts</div>
                    <div className="text-xs text-slate-400">9:16 Vertical • 30–60s</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('LONG_FORM')}
                  className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                    format === 'LONG_FORM'
                      ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Monitor className="w-6 h-6 text-amber-400" />
                  <div className="text-left">
                    <div className="font-semibold text-sm">Long-Form Video</div>
                    <div className="text-xs text-slate-400">16:9 Cinematic • 8–20min</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Content Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="BIBLE_BOOK">1. Complete Bible Study (66 Books, 1,189 Chapters)</option>
                <option value="BIBLICAL_ARCHAEOLOGY">2. Biblical History & Archaeology</option>
                <option value="ANCIENT_CIVILIZATIONS">3. Ancient Kingdoms & Empires</option>
                <option value="JESUS_TEACHINGS">4. Jesus Christ's Life & Teachings</option>
                <option value="BIBLICAL_CHARACTERS">5. Prophets & Apostles</option>
                <option value="HISTORICAL_STORIES">6. Lesser-Known Biblical Accounts</option>
              </select>
            </div>

            {/* Book & Chapter */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Bible Book
                </label>
                <select
                  value={selectedBook}
                  onChange={(e) => {
                    setSelectedBook(e.target.value);
                    setChapter(1);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  {bibleBooks.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.book_order}. {b.name} ({b.total_chapters} ch)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Chapter ({totalChaptersForBook})
                </label>
                <select
                  value={chapter}
                  onChange={(e) => setChapter(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {Array.from({ length: totalChaptersForBook }, (_, i) => i + 1).map((chNum) => (
                    <option key={chNum} value={chNum} className="bg-slate-900 text-slate-100 font-medium">
                      Chapter {chNum}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Translation */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Translation (Public Domain)
              </label>
              <select
                value={translation}
                onChange={(e) => setTranslation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="WEB">World English Bible (WEB) — Public Domain</option>
                <option value="ASV">American Standard Version 1901 (ASV) — Public Domain</option>
              </select>
            </div>

            {/* Optional Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Video Title (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Genesis 1 in 60 Seconds"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Initialize Chapter Project'}
              </button>
            </div>
          </form>
        )}

        {/* MODE B: PROMPT MODE */}
        {activeMode === 'MODE_B' && (
          <div className="p-6 space-y-6">
            {!outline ? (
              <form onSubmit={handleGenerateOutline} className="space-y-5">
                {/* Format Switcher */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Video Format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFormat('SHORTS')}
                      className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                        format === 'SHORTS'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Smartphone className="w-6 h-6 text-amber-400" />
                      <div className="text-left">
                        <div className="font-semibold text-sm">Short (9:16)</div>
                        <div className="text-xs text-slate-400">Vertical Fast-Paced • 60s</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setFormat('LONG_FORM')}
                      className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${
                        format === 'LONG_FORM'
                          ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Monitor className="w-6 h-6 text-amber-400" />
                      <div className="text-left">
                        <div className="font-semibold text-sm">Long (16:9)</div>
                        <div className="text-xs text-slate-400">Widescreen Documentary • 8–12min</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Prompt Text Box */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Enter Prompt or Biblical Question
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. How big was Noah's ark? or Why did David call Psalm 23 the Lord is my shepherd?"
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Mode B extracts Scripture references directly from SQLite (WEB), generates a 5–6 section outline, and classifies all historical claims before production.
                  </p>
                </div>

                {/* Submit Outline Button */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Powered by local Ollama qwen3:4b</span>
                  </span>
                  <button
                    type="submit"
                    disabled={isGeneratingOutline || !promptText.trim()}
                    className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isGeneratingOutline ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                        <span>Analyzing & Verifying Verses...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Generate Biblical Outline</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* OUTLINE REVIEW & APPROVAL SCREEN */
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Title & Format Badge */}
                <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Mode B Proposed Production Outline
                      </span>
                      <h4 className="text-sm sm:text-base font-bold text-slate-100 mt-0.5">{outline.title}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOutline(null)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex-shrink-0 transition-colors"
                    >
                      Edit Prompt
                    </button>
                  </div>
                  <div className="text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 max-h-20 overflow-y-auto leading-relaxed">
                    <span className="font-semibold text-slate-300">Prompt: </span>
                    "{outline.prompt}"
                    <span className="ml-2 inline-block text-[10px] text-amber-400 font-semibold">• Format: {outline.format}</span>
                  </div>
                </div>

                {/* 1. Outline Sections (5-6 Sections) */}
                <div>
                  <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>5–6 Section Outline</span>
                  </h5>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {outline.sections?.map((s) => (
                      <div key={s.section} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
                        <div className="font-semibold text-amber-300">
                          Section {s.section}: {s.heading}
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5">{s.summary}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Scripture References & Exact Database Text */}
                <div>
                  <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Direct Scripture Quoted (Verified in SQLite)</span>
                  </h5>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {outline.verses?.map((v) => (
                      <div key={v.citation} className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs">
                        <div className="font-bold text-emerald-300 flex items-center justify-between">
                          <span>{v.citation} ({v.translation || 'WEB'})</span>
                          <span className="text-[10px] text-emerald-400/80">Exact DB Text</span>
                        </div>
                        <p className="text-slate-300 text-[11px] mt-1 italic">"{v.verse_text}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. History & Archaeology Claim Classifications */}
                <div>
                  <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Historical / Archaeological Claims & Classification</span>
                  </h5>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {outline.claims?.map((c, i) => {
                      const badgeStyles = {
                        'Established': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                        'Tradition': 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                        'Scholarly view': 'bg-blue-500/20 text-blue-300 border-blue-500/40',
                        'Speculation': 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      }[c.classification] || 'bg-slate-800 text-slate-300 border-slate-700';

                      return (
                        <div key={i} className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-start gap-2.5">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold flex-shrink-0 uppercase ${badgeStyles}`}>
                            {c.classification}
                          </span>
                          <div>
                            <span className="text-slate-200 font-medium">{c.claim}</span>
                            {c.notes && <span className="block text-slate-400 text-[10px] mt-0.5">{c.notes}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Approval & Production Launch Button */}
                <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 bg-[#0F172A] py-2">
                  <span className="text-xs text-slate-400">
                    Click Approve to generate full script & launch 10-step media pipeline.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOutline(null)}
                      className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 font-semibold"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveOutline}
                      disabled={isApproving}
                      className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                    >
                      {isApproving ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                          <span>Generating Script & Media...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Approve & Run Full Production</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE C: PASTE MY SCRIPT (ZERO OLLAMA REWRITING) */}
        {activeMode === 'MODE_C' && (() => {
          const modeCWordCount = customScriptText.trim().split(/\s+/).filter(Boolean).length;
          const modeCEstSeconds = Math.round(modeCWordCount / 2.3);
          const isTooLongForShorts = format === 'SHORTS' && modeCWordCount > 130;

          return (
            <form onSubmit={handleModeCSubmit} className="p-5 sm:p-6 space-y-4 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl bg-emerald-950/25 border border-emerald-500/35 text-xs text-emerald-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Instant Video From Your Exact Words (No AI Changes):</strong>
                  <span>Paste your pre-written prayer or narration. The studio speaks your exact words word-for-word, matches authentic Jesus portrait masterworks, and renders the 1080p video directly!</span>
                </div>
              </div>

              {/* Title & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Video Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sleep Healed: 3 Bible Verses for Peaceful Nights"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Format
                  </label>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm font-semibold text-emerald-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="SHORTS">Shorts (9:16 Vertical)</option>
                    <option value="LONG_FORM">Full (16:9 Landscape)</option>
                  </select>
                </div>
              </div>

              {/* Shorts Length Warning Banner */}
              {isTooLongForShorts && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
                  <div className="text-xs text-amber-200">
                    <span className="font-bold flex items-center gap-1.5 text-amber-300">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>YouTube Shorts Duration Notice ({modeCWordCount} words = ~{modeCEstSeconds}s):</span>
                    </span>
                    <span className="text-[11px] text-slate-300 block mt-1 leading-relaxed">
                      YouTube Shorts must strictly be <strong>under 60 seconds</strong> (~120–125 words max). To make a 54s Short, click Auto-Trim below, or change format to <strong>Full (16:9 Landscape)</strong> for the full 3+ minute video:
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoTrimToShort}
                    className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-bold flex items-center gap-1.5 flex-shrink-0 shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                    <span>⚡ Trim to 54s Short (~120 words)</span>
                  </button>
                </div>
              )}

              {/* Trim Notification */}
              {trimNotification && (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                  <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{trimNotification}</span>
                </div>
              )}

              {/* Script Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Paste Your Script / Prayer Text
                  </label>
                  {format === 'SHORTS' ? (
                    isTooLongForShorts ? (
                      <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1">
                        <span>⚠️ {modeCWordCount} words • ~{modeCEstSeconds}s (Exceeds 60s)</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <span>{modeCWordCount > 0 ? `✓ ${modeCWordCount} words • ~${modeCEstSeconds}s (Under 60s)` : '0 words'}</span>
                      </span>
                    )
                  ) : (
                    <span className="text-[11px] text-sky-400 font-semibold">
                      {modeCWordCount} words • ~{Math.floor(modeCEstSeconds / 60)}m {modeCEstSeconds % 60}s (Full Video)
                    </span>
                  )}
                </div>
                <textarea
                  rows={7}
                  placeholder="Paste your exact narration or prayer here... (e.g. Heavenly Father, tonight I come before you with a heart that needs your healing touch...)"
                  value={customScriptText}
                  onChange={(e) => setCustomScriptText(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                  required
                />
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 sticky bottom-0 bg-[#0F172A] py-2">
                <span className="text-xs text-slate-400">
                  Direct voice narration + Jesus artwork + 1080p rendering
                </span>
                <button
                  type="submit"
                  disabled={isSubmittingCustom || !customScriptText.trim()}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2 transition-all active:scale-95"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>{isSubmittingCustom ? 'Preparing Video...' : '⚡ Generate Video Now (My Script)'}</span>
                </button>
              </div>
            </form>
          );
        })()}
      </div>
    </div>
  </div>
);
}
