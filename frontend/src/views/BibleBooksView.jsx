import React, { useState, useMemo } from 'react';
import { BookOpen, Search, Filter, Sparkles, ChevronRight, CheckCircle2, Video, Layers, Check } from 'lucide-react';

export default function BibleBooksView({ books = [], onStartProjectForBook }) {
  const [search, setSearch] = useState('');
  const [selectedTestament, setSelectedTestament] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeBook, setActiveBook] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchMsg, setBatchMsg] = useState('');

  const categories = useMemo(() => {
    const set = new Set(books.map(b => b.category));
    return ['ALL', ...Array.from(set)];
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
                          b.central_theme.toLowerCase().includes(search.toLowerCase());
      const matchTestament = selectedTestament === 'ALL' || b.testament === selectedTestament;
      const matchCategory = selectedCategory === 'ALL' || b.category === selectedCategory;
      return matchSearch && matchTestament && matchCategory;
    });
  }, [books, search, selectedTestament, selectedCategory]);

  const handleBatchCreate = async (book, count = 25) => {
    setBatchLoading(true);
    setBatchMsg(`Creating ${Math.min(count, book.total_chapters)} 20–25 minute long-form videos for ${book.name}...`);
    try {
      const res = await fetch('/api/projects/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book: book.name,
          startChapter: 1,
          endChapter: Math.min(count, book.total_chapters),
          format: 'LONG_FORM'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setBatchMsg(`Successfully created ${data.count} 20–25 minute video projects for ${book.name}!`);
        setTimeout(() => {
          setActiveBook(null);
          setBatchMsg('');
        }, 2500);
      }
    } catch (err) {
      setBatchMsg(`Batch error: ${err.message}`);
    } finally {
      setBatchLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>The 66 Books of the Bible</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete Genesis to Revelation curriculum database with central themes and key verses
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search book or theme..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* 2. Testament & Category Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center rounded-xl bg-slate-900 p-1 border border-slate-800">
          <button
            onClick={() => setSelectedTestament('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTestament === 'ALL' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All (66)
          </button>
          <button
            onClick={() => setSelectedTestament('OLD')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTestament === 'OLD' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Old Testament (39)
          </button>
          <button
            onClick={() => setSelectedTestament('NEW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedTestament === 'NEW' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            New Testament (27)
          </button>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === 'ALL' ? 'All Divisions' : c}</option>
          ))}
        </select>
      </div>

      {/* 3. Grid of Books */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBooks.map((book) => (
          <div
            key={book.id}
            onClick={() => setActiveBook(book)}
            className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-800/40 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-mono text-[11px] text-amber-500/80">#{String(book.book_order).padStart(2, '0')}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300">{book.category}</span>
              </div>

              <h3 className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                {book.name}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                {book.central_theme}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
              <span>{book.total_chapters} Chapters</span>
              <span className="text-amber-400 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span>View Book</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 4. Book Profile Modal */}
      {activeBook && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  Book #{activeBook.book_order} • {activeBook.testament}
                </span>
                <h3 className="text-2xl font-serif font-bold text-slate-100 mt-0.5">
                  {activeBook.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveBook(null)}
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {batchMsg && (
                <div className="p-3 rounded-lg bg-amber-500/20 border border-amber-500/40 text-xs text-amber-300 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  <span>{batchMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Chapters</span>
                  <div className="text-lg font-bold text-slate-100 mt-0.5">{activeBook.total_chapters} Chapters</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Author Tradition</span>
                  <div className="text-sm font-semibold text-slate-200 mt-0.5 truncate">{activeBook.author_tradition}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Approximate Date</span>
                  <div className="text-sm font-semibold text-slate-200 mt-0.5 truncate">{activeBook.approximate_date}</div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Central Theological Theme
                </h4>
                <p className="text-sm text-amber-200/90 font-medium bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                  {activeBook.central_theme}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Key Scripture Verse ({activeBook.key_verse_reference})
                </h4>
                <blockquote className="text-sm text-slate-200 italic bg-slate-900 border-l-2 border-amber-500 p-3 rounded-r-lg">
                  "{activeBook.key_verse_text}"
                </blockquote>
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => handleBatchCreate(activeBook, 25)}
                disabled={batchLoading}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Batch Create 20–25 Videos</span>
              </button>

              <button
                onClick={() => {
                  onStartProjectForBook(activeBook);
                  setActiveBook(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Video className="w-4 h-4 fill-slate-950" />
                <span>Create Video for {activeBook.name}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
