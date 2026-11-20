import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Edit2,
  Film,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { api } from '../services/api';

const CATEGORY_COLORS = {
  BIBLE_STUDY: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  BIBLICAL_ARCHAEOLOGY: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  ANCIENT_CIVILIZATIONS: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
  JESUS_TEACHINGS: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  BIBLICAL_CHARACTERS: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  HISTORICAL_STORIES: 'text-pink-400 bg-pink-500/10 border-pink-500/30',
  CHRISTIAN_MOTIVATION: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
  PRAYERS_DEVOTIONALS: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
  BIBLE_QA: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
  CHRISTIAN_DOCUMENTARIES: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  BIBLE_PROPHECY: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  CHRISTIAN_HOLIDAYS: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30',
};

export default function ContentCalendarView({ setActiveTab, onStartProject }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingCadence, setGeneratingCadence] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [msg, setMsg] = useState('');

  // New Item Form
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('BIBLE_STUDY');
  const [newItemFormat, setNewItemFormat] = useState('LONG_FORM');
  const [newItemDate, setNewItemDate] = useState(new Date().toISOString().split('T')[0]);
  const [newItemTime, setNewItemTime] = useState('14:00');
  const [newItemNotes, setNewItemNotes] = useState('');

  useEffect(() => {
    loadCalendar();
  }, [selectedCategory]);

  const loadCalendar = async () => {
    try {
      const filters = {};
      if (selectedCategory) filters.category = selectedCategory;
      const res = await api.getCalendar(filters);
      if (res.success) {
        setItems(res.data);
      }
    } catch (e) {
      console.error('Error loading calendar:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCadence = async () => {
    setGeneratingCadence(true);
    try {
      const res = await api.generateCalendarCadence();
      if (res.success) {
        setMsg(`Generated 14-day balanced Christian content schedule (${res.count} slots)!`);
        await loadCalendar();
        setTimeout(() => setMsg(''), 4000);
      }
    } catch (e) {
      alert('Cadence error: ' + e.message);
    } finally {
      setGeneratingCadence(false);
    }
  };

  const handleScheduleItem = async (e) => {
    e.preventDefault();
    try {
      await api.scheduleCalendarItem({
        title: newItemTitle,
        category: newItemCategory,
        format: newItemFormat,
        target_date: newItemDate,
        scheduled_time: newItemTime,
        notes: newItemNotes
      });
      setIsModalOpen(false);
      setNewItemTitle('');
      setNewItemNotes('');
      setMsg('Scheduled new video release successfully!');
      await loadCalendar();
      setTimeout(() => setMsg(''), 4000);
    } catch (err) {
      alert('Error scheduling: ' + err.message);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!confirm('Remove this scheduled release slot?')) return;
    try {
      await api.deleteCalendarItem(id);
      setItems(prev => prev.filter(x => x.id !== id));
    } catch (e) {
      alert('Error deleting: ' + e.message);
    }
  };

  const handleStartProductionForSlot = (item) => {
    if (onStartProject) {
      onStartProject({
        title: item.title,
        topic: item.title,
        category: item.category,
        format: item.format,
        bible_translation: 'WEB',
        target_duration_seconds: item.format === 'SHORTS' ? 60 : 1200
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
              Publishing Roadmap
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-semibold text-slate-400">Target Cadence: Daily Shorts & 3x Weekly Long-Form</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-100 tracking-wide mt-1">
            Content Publishing Calendar
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Schedule releases across all 12 categories. Ensure disciplined distribution between chapter deep-dives, biblical archaeology, and uplifting Shorts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleGenerateCadence}
            disabled={generatingCadence}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 text-amber-400 ${generatingCadence ? 'animate-spin' : ''}`} />
            <span>Auto-Generate 14-Day Cadence</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-900/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Video</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {msg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-semibold text-slate-300">Filter Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-amber-400"
          >
            <option value="">All 12 Categories</option>
            <option value="BIBLE_STUDY">Complete Bible Study</option>
            <option value="BIBLICAL_ARCHAEOLOGY">Biblical Archaeology</option>
            <option value="ANCIENT_CIVILIZATIONS">Ancient Kingdoms</option>
            <option value="JESUS_TEACHINGS">Jesus' Teachings</option>
            <option value="BIBLICAL_CHARACTERS">Biblical Characters</option>
            <option value="HISTORICAL_STORIES">Lesser-Known Stories</option>
            <option value="CHRISTIAN_MOTIVATION">Christian Motivation</option>
            <option value="PRAYERS_DEVOTIONALS">Prayers & Devotionals</option>
            <option value="BIBLE_QA">Bible Q&A</option>
            <option value="CHRISTIAN_DOCUMENTARIES">Documentaries</option>
            <option value="BIBLE_PROPHECY">Bible Prophecy</option>
            <option value="CHRISTIAN_HOLIDAYS">Holidays & Feasts</option>
          </select>
        </div>

        <div className="text-slate-400">
          Scheduled Releases: <strong className="text-slate-100">{items.length} slots</strong>
        </div>
      </div>

      {/* Schedule Items List / Timeline */}
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[#0F172A] border border-slate-800 space-y-3">
            <CalendarIcon className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-300">No scheduled releases found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Use &quot;Auto-Generate 14-Day Cadence&quot; to automatically populate a balanced schedule across Bible studies, archaeology, and Shorts.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const catBadgeClass = CATEGORY_COLORS[item.category] || 'text-amber-400 bg-amber-500/10 border-amber-500/30';
            const isShorts = item.format === 'SHORTS';

            return (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Date & Time Column */}
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      {new Date(item.target_date).toLocaleDateString('en-US', { month: 'short' })}
                    </span>
                    <span className="text-base font-bold text-amber-400 leading-none mt-0.5">
                      {new Date(item.target_date).getDate()}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{item.scheduled_time || '14:00'} UTC</span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(item.target_date).toLocaleDateString('en-US', { weekday: 'long' })}
                    </span>
                  </div>
                </div>

                {/* Details Column */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${catBadgeClass}`}>
                      {item.category.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-950 text-slate-400 border border-slate-800">
                      {isShorts ? '9:16 Shorts' : '16:9 Long-Form'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-950/20 text-emerald-400 border border-emerald-500/30">
                      {item.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100">
                    {item.title}
                  </h3>

                  {item.notes && (
                    <p className="text-xs text-slate-400 italic">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 border-t md:border-t-0 border-slate-800 pt-3 md:pt-0">
                  <button
                    onClick={() => handleStartProductionForSlot(item)}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Produce</span>
                  </button>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Calendar Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-amber-400" />
              <span>Schedule New Video Release</span>
            </h3>

            <form onSubmit={handleScheduleItem} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Video Title / Concept</label>
                <input
                  type="text"
                  required
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="e.g. The Pool of Siloam Uncovered"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Content Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="BIBLE_STUDY">Complete Bible Study</option>
                    <option value="BIBLICAL_ARCHAEOLOGY">Biblical Archaeology</option>
                    <option value="ANCIENT_CIVILIZATIONS">Ancient Kingdoms</option>
                    <option value="JESUS_TEACHINGS">Jesus' Teachings</option>
                    <option value="BIBLICAL_CHARACTERS">Biblical Characters</option>
                    <option value="HISTORICAL_STORIES">Lesser-Known Stories</option>
                    <option value="CHRISTIAN_MOTIVATION">Christian Motivation</option>
                    <option value="PRAYERS_DEVOTIONALS">Prayers & Devotionals</option>
                    <option value="BIBLE_QA">Bible Q&A</option>
                    <option value="CHRISTIAN_DOCUMENTARIES">Documentaries</option>
                    <option value="BIBLE_PROPHECY">Bible Prophecy</option>
                    <option value="CHRISTIAN_HOLIDAYS">Holidays & Feasts</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Format</label>
                  <select
                    value={newItemFormat}
                    onChange={(e) => setNewItemFormat(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-400"
                  >
                    <option value="LONG_FORM">16:9 Long-Form (10-25m)</option>
                    <option value="SHORTS">9:16 Shorts (60s)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={newItemDate}
                    onChange={(e) => setNewItemDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Scheduled Time (UTC)</label>
                  <input
                    type="time"
                    value={newItemTime}
                    onChange={(e) => setNewItemTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Notes / Target Focus (Optional)</label>
                <textarea
                  rows="2"
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  placeholder="Archaeological references, scripture citations..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
