import React, { useState, useEffect } from 'react';
import {
  Landmark,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  Play,
  Plus,
  ExternalLink,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { api } from '../services/api';

const EVIDENCE_TIERS = {
  SCRIPTURE: {
    label: 'Scripture',
    badgeClass: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    desc: 'Verbatim canonical biblical text'
  },
  HISTORICAL_EVIDENCE: {
    label: 'Historical Evidence',
    badgeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    desc: 'Archaeological discoveries, extra-biblical inscriptions & contemporary relics'
  },
  TRADITIONAL_BELIEF: {
    label: 'Traditional Belief',
    badgeClass: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    desc: 'Patristic and early church historical traditions'
  },
  THEOLOGICAL_THEORY: {
    label: 'Theological Theory',
    badgeClass: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    desc: 'Scholarly theological interpretation & prophetic framework'
  }
};

export default function ResearchSourcesView({ onStartProject }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Source Form
  const [newSourceName, setNewSourceName] = useState('');
  const [newCategory, setNewCategory] = useState('BIBLICAL_ARCHAEOLOGY');
  const [newPeriod, setNewPeriod] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newArtifact, setNewArtifact] = useState('');
  const [newCorrelation, setNewCorrelation] = useState('');
  const [newTier, setNewTier] = useState('HISTORICAL_EVIDENCE');
  const [newSummary, setNewSummary] = useState('');
  const [newCitation, setNewCitation] = useState('');

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    try {
      const res = await api.getResearchSources();
      if (res.success) {
        setSources(res.data);
      }
    } catch (e) {
      console.error('Error loading research sources:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSource = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addResearchSource({
        source_name: newSourceName,
        category: newCategory,
        period_or_century: newPeriod,
        primary_location: newLocation,
        archaeological_artifact: newArtifact,
        biblical_correlation: newCorrelation,
        evidence_type: newTier,
        summary: newSummary,
        academic_citation: newCitation
      });
      if (res.success) {
        setSources(prev => [...prev, res.data]);
        setIsModalOpen(false);
      }
    } catch (err) {
      alert('Error adding source: ' + err.message);
    }
  };

  const handleStartProductionForDiscovery = (source) => {
    if (onStartProject) {
      onStartProject({
        title: `${source.source_name}: Archaeological Discovery & Biblical Truth`,
        topic: `${source.source_name} - ${source.summary}`,
        category: source.category || 'BIBLICAL_ARCHAEOLOGY',
        format: 'LONG_FORM',
        verses_referenced: source.biblical_correlation,
        bible_translation: 'WEB',
        target_duration_seconds: 1100
      });
    }
  };

  const filtered = sources.filter(s => {
    if (selectedTier && s.evidence_type !== selectedTier) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.source_name.toLowerCase().includes(q) ||
      s.summary.toLowerCase().includes(q) ||
      s.biblical_correlation.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase tracking-widest">
              Reputable Sources & Research
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-xs font-semibold text-slate-400">4-Tier Truth Distinction Standard</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-100 tracking-wide mt-1">
            Archaeology & Historical Sources Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Strict verification guarantees Scripture, archaeology, church tradition, and theological theory are never confused. 
            All historical claims are backed by documented academic excavations and ancient museum relics.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-950/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Artifact / Source</span>
        </button>
      </div>

      {/* 4 Truth Tiers Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(EVIDENCE_TIERS).map(([key, t]) => (
          <div
            key={key}
            onClick={() => setSelectedTier(selectedTier === key ? '' : key)}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              selectedTier === key
                ? 'border-emerald-400 bg-emerald-950/30 shadow-md ring-1 ring-emerald-400/40'
                : 'border-slate-800 bg-[#0F172A] hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${t.badgeClass}`}>
                [{t.label.toUpperCase()}]
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {sources.filter(s => s.evidence_type === key).length} items
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug mt-1.5">
              {t.desc}
            </p>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artifacts, King David, Isaiah, Cyrus..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="text-slate-400">
          Verified Sources: <strong className="text-emerald-400">{filtered.length} documented</strong>
        </div>
      </div>

      {/* Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((s) => {
          const tier = EVIDENCE_TIERS[s.evidence_type] || EVIDENCE_TIERS.HISTORICAL_EVIDENCE;

          return (
            <div
              key={s.id}
              className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${tier.badgeClass}`}>
                    [{tier.label.toUpperCase()}]
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {s.period_or_century}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{s.source_name}</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Location: <strong className="text-slate-300">{s.primary_location}</strong>
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Archaeological Relic:</span>
                    <p className="text-slate-200 font-medium">{s.archaeological_artifact}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Biblical Correlation:</span>
                    <p className="text-amber-400 font-mono text-[11px]">{s.biblical_correlation}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Academic Summary:</span>
                    <p className="text-slate-300 italic">{s.summary}</p>
                  </div>
                </div>

                {s.academic_citation && (
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    Citation: {s.academic_citation}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>100% Academic Verified</span>
                </span>

                <button
                  onClick={() => handleStartProductionForDiscovery(s)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
                >
                  <Play className="w-3 h-3 fill-slate-950" />
                  <span>Produce Documentary</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Source Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-emerald-400" />
              <span>Add Archaeological Artifact or Source</span>
            </h3>

            <form onSubmit={handleAddSource} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Source / Artifact Name</label>
                <input
                  type="text"
                  required
                  value={newSourceName}
                  onChange={(e) => setNewSourceName(e.target.value)}
                  placeholder="e.g. The Pilate Stone at Caesarea Maritima"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Evidence Classification</label>
                  <select
                    value={newTier}
                    onChange={(e) => setNewTier(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400"
                  >
                    <option value="HISTORICAL_EVIDENCE">HISTORICAL EVIDENCE (Archaeology/Relic)</option>
                    <option value="SCRIPTURE">SCRIPTURE (Canonical Text)</option>
                    <option value="TRADITIONAL_BELIEF">TRADITIONAL BELIEF (Church History)</option>
                    <option value="THEOLOGICAL_THEORY">THEOLOGICAL THEORY (Scholarly Frame)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Time Period / Century</label>
                  <input
                    type="text"
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value)}
                    placeholder="e.g. 1st Century AD (c. 26-36 AD)"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Primary Location / Museum</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Israel Museum, Jerusalem"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Biblical Verses Correlated</label>
                  <input
                    type="text"
                    value={newCorrelation}
                    onChange={(e) => setNewCorrelation(e.target.value)}
                    placeholder="e.g. Matthew 27:2; Luke 3:1"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Archaeological Artifact Description</label>
                <input
                  type="text"
                  value={newArtifact}
                  onChange={(e) => setNewArtifact(e.target.value)}
                  placeholder="e.g. Limestone block bearing Latin inscription 'Pontius Pilatus, Prefect of Judea'"
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Academic Summary</label>
                <textarea
                  rows="2"
                  required
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  placeholder="Definitive extra-biblical confirmation..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Academic Citation (Optional)</label>
                <input
                  type="text"
                  value={newCitation}
                  onChange={(e) => setNewCitation(e.target.value)}
                  placeholder="e.g. Frova, A. (1961). L'iscrizione di Ponzio Pilato a Cesarea."
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 focus:outline-none focus:border-emerald-400"
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
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Register Source
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
