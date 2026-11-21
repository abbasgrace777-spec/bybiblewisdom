import React, { useState } from 'react';
import {
  Film,
  Smartphone,
  Monitor,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  BookOpen,
  Sparkles,
  FolderCheck,
  ListOrdered,
  ChevronRight,
  Download,
  Plus
} from 'lucide-react';

export default function DashboardView({
  stats,
  projects = [],
  bibleBooks = [],
  onSelectProject,
  onOpenNewProject,
  onOpenProduction,
  onCreateProject,
  setActiveTab
}) {
  // Quick Maker State
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [chapter, setChapter] = useState(1);
  const [format, setFormat] = useState('SHORTS');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentBookObj = bibleBooks.find(b => b.name === selectedBook);
  const maxChapters = currentBookObj?.total_chapters || 50;

  async function handleQuickCreate(e) {
    e.preventDefault();
    if (!onCreateProject) return;
    setIsSubmitting(true);
    try {
      await onCreateProject({
        title: format === 'SHORTS' ? `${selectedBook} ${chapter} in 60 Seconds` : `The Complete Story of ${selectedBook} ${chapter}`,
        topic: `${selectedBook} Chapter ${chapter}`,
        category: 'BIBLE_BOOK',
        format,
        bible_book: selectedBook,
        chapter_start: parseInt(chapter, 10),
        chapter_end: parseInt(chapter, 10),
        bible_translation: 'WEB',
      });
    } catch (err) {
      console.error('Quick create error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  const kpis = [
    { label: 'Total Videos Created', value: stats?.totalProjects || projects.length || 0, icon: Film, color: 'text-amber-400', border: 'border-amber-500/20' },
    { label: 'Shorts (60s)', value: stats?.shortsCount || projects.filter(p => p.format === 'SHORTS').length, icon: Smartphone, color: 'text-sky-400', border: 'border-sky-500/20' },
    { label: 'Full Videos (16:9)', value: stats?.longFormCount || projects.filter(p => p.format === 'LONG_FORM').length, icon: Monitor, color: 'text-indigo-400', border: 'border-indigo-500/20' },
    { label: 'Ready to Download', value: projects.filter(p => p.status === 'RENDERED' || p.output_video_path).length, icon: CheckCircle2, color: 'text-emerald-400', border: 'border-emerald-500/20' },
  ];

  const recent = projects.slice(0, 6);

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* 1. Super Simple 3-Click Video Creator (Hero Widget) */}
      <div className="p-7 md:p-8 rounded-3xl bg-gradient-to-br from-[#111A2E] via-[#0E1526] to-[#0A0E1A] border border-amber-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant 1-Click Video Maker</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-slate-100 tracking-tight">
                Create A Bible Video in 3 Easy Steps
              </h2>
              <p className="text-slate-400 text-xs md:text-sm mt-1">
                Select your book and chapter. AI writes the Bible-grounded script, narrates with natural human voice, and renders the 1080p video.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('chapter-production')}
              className="text-xs px-3.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition-all"
            >
              <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
              <span>Make 5-6 Chapters at Once (Batch Queue) →</span>
            </button>
          </div>

          <form onSubmit={handleQuickCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            {/* Step 1: Select Book */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">1</span>
                Bible Book
              </label>
              <select
                value={selectedBook}
                onChange={(e) => {
                  setSelectedBook(e.target.value);
                  setChapter(1);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm font-medium text-slate-100 focus:outline-none focus:border-amber-500"
              >
                {bibleBooks.length > 0 ? (
                  bibleBooks.map((b) => (
                    <option key={b.name} value={b.name}>
                      {b.name} ({b.total_chapters} ch)
                    </option>
                  ))
                ) : (
                  <>
                    <option value="Genesis">Genesis (50 ch)</option>
                    <option value="Psalms">Psalms (150 ch)</option>
                    <option value="Proverbs">Proverbs (31 ch)</option>
                    <option value="Matthew">Matthew (28 ch)</option>
                    <option value="John">John (21 ch)</option>
                    <option value="Revelation">Revelation (22 ch)</option>
                  </>
                )}
              </select>
            </div>

            {/* Step 2: Select Chapter */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">2</span>
                  Chapter
                </span>
                <span className="text-[11px] text-amber-400/80 font-normal">
                  ({maxChapters} Chapters)
                </span>
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setChapter((prev) => Math.max(1, Number(prev) - 1))}
                  disabled={Number(chapter) <= 1}
                  title="Previous Chapter"
                  className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center active:scale-95 transition-all"
                >
                  -
                </button>
                <select
                  value={chapter}
                  onChange={(e) => setChapter(Number(e.target.value))}
                  className="flex-1 px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-sm font-bold text-amber-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {Array.from({ length: maxChapters }, (_, i) => i + 1).map((chNum) => (
                    <option key={chNum} value={chNum} className="bg-slate-900 text-slate-100 font-medium">
                      Chapter {chNum}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setChapter((prev) => Math.min(maxChapters, Number(prev) + 1))}
                  disabled={Number(chapter) >= maxChapters}
                  title="Next Chapter"
                  className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg flex items-center justify-center active:scale-95 transition-all"
                >
                  +
                </button>
              </div>
            </div>

            {/* Step 3: Format */}
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">3</span>
                Format
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormat('SHORTS')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                    format === 'SHORTS'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Shorts (9:16)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormat('LONG_FORM')}
                  className={`py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                    format === 'LONG_FORM'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Full (16:9)</span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{isSubmitting ? 'Starting...' : '⚡ Generate Video Now'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 2. Key Action Cards (Simple Shortcuts) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab('create-video')}
          className="p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-left transition-all group shadow-sm flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
              Create New Video
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Chapter mode or custom prompt
            </p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('ready-to-upload')}
          className="p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/40 text-left transition-all group shadow-sm flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <FolderCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
              My Ready Videos
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Watch & download MP4 & thumbnails
            </p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('chapter-production')}
          className="p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-sky-500/40 text-left transition-all group shadow-sm flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ListOrdered className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 group-hover:text-sky-300 transition-colors">
              Multi-Chapter Queue
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Batch create 5-6 chapters in 1 click
            </p>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('bible-books')}
          className="p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group shadow-sm flex flex-col justify-between"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
              66 Bible Books Library
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse Genesis to Revelation
            </p>
          </div>
        </button>
      </div>

      {/* 3. Simple KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl bg-slate-900/50 border ${kpi.border} flex items-center justify-between`}
            >
              <div>
                <span className="text-xs text-slate-400 font-medium">{kpi.label}</span>
                <div className="text-2xl font-bold text-slate-100 mt-1">{kpi.value}</div>
              </div>
              <div className={`p-2 rounded-lg bg-slate-950/60 ${kpi.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Recent Videos Section (Clean & Direct) */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100">
              Recent Videos
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any video to watch, download MP4, or copy YouTube tags
            </p>
          </div>
          <button
            onClick={() => setActiveTab('ready-to-upload')}
            className="text-xs text-amber-400 hover:underline font-semibold flex items-center gap-1"
          >
            <span>View All Downloads</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recent.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl">
            <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400">No videos created yet.</p>
            <p className="text-xs text-slate-500 mt-1">Use the quick creator above to generate your first video!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {recent.map((proj) => {
              const isRendered = proj.status === 'RENDERED' || proj.output_video_path;
              return (
                <div
                  key={proj.id}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-800/25 px-2.5 rounded-xl transition-colors cursor-pointer"
                  onClick={() => {
                    if (onSelectProject) onSelectProject(proj.id);
                    setActiveTab('ready-to-upload');
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${
                      proj.format === 'SHORTS' ? 'bg-sky-500/10 text-sky-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>
                      {proj.format === 'SHORTS' ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200 hover:text-amber-300 transition-colors">
                        {proj.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-300">{proj.bible_book || 'Bible'} Ch {proj.chapter_start || 1}</span>
                        <span>•</span>
                        <span>{proj.format === 'SHORTS' ? '60s Short (9:16)' : 'Full Documentary (16:9)'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isRendered ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Ready to Watch</span>
                      </span>
                    ) : proj.status === 'FAILED' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                        <span>Failed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{proj.status}</span>
                      </span>
                    )}

                    <div className="text-slate-400 hover:text-amber-400 p-1.5">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}