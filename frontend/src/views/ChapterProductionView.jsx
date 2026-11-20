import React, { useState, useEffect } from 'react';
import { ListOrdered, Play, Pause, RefreshCw, CheckCircle2, AlertCircle, Clock, Film, Layers, ArrowRight, FolderCheck } from 'lucide-react';

export default function ChapterProductionView({ setActiveTab }) {
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [startChapter, setStartChapter] = useState(1);
  const [endChapter, setEndChapter] = useState(1);
  const [mode, setMode] = useState('single'); // 'single', 'range', 'entire_book'
  const [format, setFormat] = useState('LONG_FORM');
  const [queueData, setQueueData] = useState({ items: [], isPaused: false, isRunning: false });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    fetchBooks();
    fetchQueue();
    const interval = setInterval(fetchQueue, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchBooks = async () => {
    try {
      const res = await fetch('/api/bible/books');
      if (res.ok) {
        const d = await res.json();
        setBooks(d.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchQueue = async () => {
    try {
      const res = await fetch('/api/queue');
      if (res.ok) {
        const d = await res.json();
        setQueueData(d.data || { items: [] });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const currentBookObj = books.find(b => b.name === selectedBook) || { total_chapters: 50 };

  const handleBookChange = (bookName) => {
    setSelectedBook(bookName);
    const b = books.find(x => x.name === bookName);
    if (b) {
      setStartChapter(1);
      setEndChapter(mode === 'entire_book' ? b.total_chapters : 1);
    }
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (newMode === 'single') {
      setEndChapter(startChapter);
    } else if (newMode === 'entire_book') {
      setStartChapter(1);
      setEndChapter(currentBookObj.total_chapters);
    }
  };

  const handleEnqueue = async () => {
    setLoading(true);
    setMsg('');
    try {
      const actualEnd = mode === 'single' ? startChapter : (mode === 'entire_book' ? currentBookObj.total_chapters : endChapter);
      const res = await fetch('/api/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookName: selectedBook,
          startChapter,
          endChapter: actualEnd,
          format
        })
      });

      if (res.ok) {
        const d = await res.json();
        setMsg(`Successfully enqueued ${d.count} separate chapter video(s) for ${selectedBook}! Sequential processing started.`);
        fetchQueue();
      } else {
        const err = await res.json();
        setMsg(`Error: ${err.error || 'Failed to enqueue'}`);
      }
    } catch (e) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePauseResume = async () => {
    const endpoint = queueData.isPaused ? '/api/queue/resume' : '/api/queue/pause';
    try {
      await fetch(endpoint, { method: 'POST' });
      fetchQueue();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRetry = async (queueId) => {
    try {
      await fetch(`/api/queue/${queueId}/retry`, { method: 'POST' });
      fetchQueue();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-amber-400" />
            <span>Sequential Chapter Production Queue</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Golden Rule: <strong>One Chapter = One Separate Video</strong>. Never combines books into one video.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePauseResume}
            className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all ${
              queueData.isPaused
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {queueData.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span>{queueData.isPaused ? 'Resume Queue' : 'Pause Queue'}</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-500/40 text-xs text-amber-300 flex items-center justify-between">
          <span>{msg}</span>
          <span className="cursor-pointer text-slate-400 hover:text-slate-200" onClick={() => setMsg('')}>✕</span>
        </div>
      )}

      {/* Production Enqueue Form */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-5">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Queue Chapter Production</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Bible Book */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Select Bible Book</label>
            <select
              value={selectedBook}
              onChange={(e) => handleBookChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              {books.map(b => (
                <option key={b.name} value={b.name}>
                  {b.name} ({b.total_chapters} Chapters)
                </option>
              ))}
            </select>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Production Scope</label>
            <select
              value={mode}
              onChange={(e) => handleModeChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="single">Single Chapter (1 Video)</option>
              <option value="range">Chapter Range (Sequential Videos)</option>
              <option value="entire_book">Entire Book ({currentBookObj.total_chapters} Separate Videos)</option>
            </select>
          </div>

          {/* Chapters */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Start Ch</label>
              <input
                type="number"
                min="1"
                max={currentBookObj.total_chapters}
                value={startChapter}
                onChange={(e) => setStartChapter(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={mode === 'entire_book'}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400 disabled:opacity-50"
              />
            </div>

            {mode === 'range' && (
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">End Ch</label>
                <input
                  type="number"
                  min={startChapter}
                  max={currentBookObj.total_chapters}
                  value={endChapter}
                  onChange={(e) => setEndChapter(Math.min(currentBookObj.total_chapters, parseInt(e.target.value) || startChapter))}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* Video Format */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="LONG_FORM">Horizontal 16:9 (Documentary)</option>
              <option value="SHORTS">Vertical 9:16 (~55s Shorts)</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleEnqueue}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
        >
          <Film className="w-4 h-4" />
          <span>{loading ? 'Adding to Sequential Queue...' : `Enqueue ${mode === 'single' ? 'Chapter ' + startChapter : selectedBook + ' Chapters'} for Automated Production`}</span>
        </button>
      </div>

      {/* Queue Table */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Active Sequential Queue Status</span>
          </h3>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Pending: <strong className="text-slate-200">{queueData.totalQueued || 0}</strong></span>
            <span>Processing: <strong className="text-amber-400">{queueData.totalProcessing || 0}</strong></span>
            <span>Completed: <strong className="text-emerald-400">{queueData.totalCompleted || 0}</strong></span>
            <span>Failed: <strong className="text-red-400">{queueData.totalFailed || 0}</strong></span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2 px-3">#</th>
                <th className="py-2 px-3">Chapter</th>
                <th className="py-2 px-3">Format</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Progress</th>
                <th className="py-2 px-3">Package / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(queueData.items || []).length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-500">
                    No chapters in queue. Select a book and chapter above to begin sequential automation.
                  </td>
                </tr>
              ) : (
                queueData.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-800/20">
                    <td className="py-3 px-3 text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {item.book_name} Chapter {item.chapter}
                    </td>
                    <td className="py-3 px-3 text-slate-400">{item.format}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        item.status === 'PROCESSING' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' :
                        item.status === 'FAILED' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="w-36">
                        <div className="text-[10px] text-slate-400 truncate mb-1">
                          {item.step_name || 'Queued'} ({item.progress_percent || 0}%)
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-400 h-full transition-all duration-300"
                            style={{ width: `${item.progress_percent || 0}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {item.status === 'COMPLETED' ? (
                        <button
                          onClick={() => setActiveTab('packages')}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-semibold flex items-center gap-1.5"
                        >
                          <FolderCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>View Package</span>
                        </button>
                      ) : item.status === 'FAILED' ? (
                        <button
                          onClick={() => handleRetry(item.id)}
                          className="px-2.5 py-1 rounded bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-200 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Retry</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500">Auto-processing</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
