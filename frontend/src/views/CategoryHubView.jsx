import React, { useState, useEffect } from 'react';
import {
  Layers,
  BookOpen,
  Compass,
  Landmark,
  Sun,
  UserCheck,
  Scroll,
  Sparkles,
  HeartHandshake,
  HelpCircle,
  Film,
  Eye,
  Calendar,
  Play,
  Clock,
  CheckCircle2,
  ListOrdered,
  Plus,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';

const ICONS = {
  BookOpen,
  Compass,
  Landmark,
  Sun,
  UserCheck,
  Scroll,
  Sparkles,
  HeartHandshake,
  HelpCircle,
  Film,
  Eye,
  Calendar
};

export default function CategoryHubView({ onStartProject, setActiveTab }) {
  const [categories, setCategories] = useState([]);
  const [selectedCatId, setSelectedCatId] = useState('BIBLE_STUDY');
  const [categoryData, setCategoryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [focusPrompt, setFocusPrompt] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCatId) {
      loadCategoryDetails(selectedCatId);
    }
  }, [selectedCatId]);

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      if (res.success) {
        setCategories(res.data);
      }
    } catch (e) {
      console.error('Error loading categories:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoryDetails = async (id) => {
    try {
      const res = await api.getCategoryTopics(id);
      if (res.success) {
        setCategoryData(res.data);
      }
    } catch (e) {
      console.error('Error loading category topics:', e);
    }
  };

  const handleGenerateTopic = async () => {
    if (!selectedCatId) return;
    setGenerating(true);
    setSuccessMsg('');
    try {
      const res = await api.generateCategoryTopic(selectedCatId, focusPrompt);
      if (res.success && res.data) {
        // Add to curated topics in state
        setCategoryData(prev => ({
          ...prev,
          curatedTopics: [res.data, ...(prev?.curatedTopics || [])]
        }));
        setFocusPrompt('');
        setSuccessMsg(`Generated new topic: "${res.data.title}"`);
        setTimeout(() => setSuccessMsg(''), 4000);
      }
    } catch (e) {
      alert('Error generating topic: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleStartProduction = (topicItem, format = 'LONG_FORM') => {
    if (onStartProject) {
      onStartProject({
        title: topicItem.title,
        topic: topicItem.hook || topicItem.title,
        category: selectedCatId,
        format: format || topicItem.format || 'LONG_FORM',
        verses_referenced: topicItem.verses || topicItem.scriptureReferences,
        bible_translation: 'WEB',
        target_duration_seconds: format === 'SHORTS' ? 60 : (topicItem.duration || 1200)
      });
    }
  };

  const handleEnqueue = async (topicItem, format = 'LONG_FORM') => {
    try {
      await api.enqueueCategoryTopic({
        title: topicItem.title,
        topic: topicItem.hook || topicItem.title,
        category: selectedCatId,
        format: format || topicItem.format || 'LONG_FORM',
        scriptureReferences: topicItem.verses || topicItem.scriptureReferences,
        targetDurationSeconds: format === 'SHORTS' ? 60 : (topicItem.duration || 1200)
      });
      setSuccessMsg(`Enqueued "${topicItem.title.slice(0, 35)}..." into automated production queue!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      alert('Enqueue error: ' + e.message);
    }
  };

  const selectedCategory = categories.find(c => c.id === selectedCatId);

  const filteredTopics = (categoryData?.curatedTopics || []).filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.hook && t.hook.toLowerCase().includes(q)) ||
      (t.verses && t.verses.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase tracking-widest">
              ByBibleWisdom Content Platform
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-semibold text-slate-400">12 Categories • 1,189 Chapters • Global Christian Outreach</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-100 tracking-wide mt-1">
            Christian Content Automation Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Scalable multi-format production across all 12 biblical categories. Every topic utilizes our unified engine: 
            Scripture Research → Original Script → 10-Point Safety Gate → Voice Synthesis → Unique Imagery → Motion Video → Subtitles → Ideogram Thumbnails → SEO.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab && setActiveTab('content-calendar')}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center gap-2 transition-all shadow-sm"
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Content Calendar</span>
          </button>
          <button
            onClick={() => setActiveTab && setActiveTab('chapter-production')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-900/20"
          >
            <ListOrdered className="w-4 h-4" />
            <span>Production Queue</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 12 Interactive Category Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>12 Core Christian Content Categories</span>
          </h2>
          <span className="text-[11px] text-slate-500">Select a category to research topics & trigger production</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {categories.map((cat) => {
            const IconComp = ICONS[cat.icon] || BookOpen;
            const isSelected = selectedCatId === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCatId(cat.id)}
                className={`p-3.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between h-32 ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/20 ring-2 ring-amber-500/30 shadow-lg shadow-amber-950/40'
                    : 'border-slate-800 bg-[#0F172A] hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}20`, color: cat.color }}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-400 border border-slate-800">
                      {cat.defaultFormat === 'SHORTS' ? '9:16 Shorts' : '16:9 Long'}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-100 leading-tight line-clamp-2">
                    {cat.name}
                  </h3>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5 mt-1">
                  <span>{cat.curatedTopicCount} Topics</span>
                  <span className="text-amber-400 font-semibold">{cat.completedVideos} Videos</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Category Workspace & Topic Research */}
      {selectedCategory && (
        <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-6 shadow-xl">
          {/* Category Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-amber-400 uppercase tracking-wider">{selectedCategory.shortName}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">{selectedCategory.scope}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-100 mt-1">
                {selectedCategory.name}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                {selectedCategory.description}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-medium">
                Default: <strong className="text-amber-400">{selectedCategory.defaultFormat}</strong> (~{selectedCategory.targetMinutes}m)
              </span>
            </div>
          </div>

          {/* AI / Procedural Topic Generator Bar */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col md:flex-row items-center gap-3">
            <div className="flex-1 flex items-center gap-2.5 w-full">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <input
                type="text"
                value={focusPrompt}
                onChange={(e) => setFocusPrompt(e.target.value)}
                placeholder={`Generate a topic for ${selectedCategory.shortName}... (e.g. "The Siege of Lachish", "Parable of the Talents")`}
                className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleGenerateTopic}
              disabled={generating}
              className="w-full md:w-auto px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 flex-shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              <span>{generating ? 'Generating...' : 'Generate AI Topic'}</span>
            </button>
          </div>

          {/* Search & Topic Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search topics, scriptures..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="text-xs text-slate-400">
              Showing <strong className="text-slate-200">{filteredTopics.length}</strong> production-ready topics
            </div>
          </div>

          {/* Topics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTopics.map((topic, idx) => (
              <div
                key={idx}
                className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {topic.format || 'LONG_FORM'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-slate-900 text-slate-400 border border-slate-800">
                      {topic.evidenceType || 'SCRIPTURE'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-200 transition-colors">
                    {topic.title}
                  </h3>

                  <p className="text-xs text-slate-400 italic line-clamp-2">
                    &quot;{topic.hook}&quot;
                  </p>

                  <div className="pt-2 border-t border-slate-900 space-y-1 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3 text-amber-400/80 flex-shrink-0" />
                      <span className="truncate">{topic.verses || topic.scriptureReferences || 'Scripture references included'}</span>
                    </div>
                    {topic.sources && (
                      <div className="flex items-center gap-1.5">
                        <Landmark className="w-3 h-3 text-emerald-400/80 flex-shrink-0" />
                        <span className="truncate">{topic.sources}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleEnqueue(topic, topic.format)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Enqueue</span>
                  </button>

                  <button
                    onClick={() => handleStartProduction(topic, topic.format)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-900/20 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-slate-950" />
                    <span>Produce</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
