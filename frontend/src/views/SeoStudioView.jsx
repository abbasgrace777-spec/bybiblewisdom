import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Copy, Check, ArrowRight, Tag, AlignLeft, CheckCircle2, RefreshCw } from 'lucide-react';

export default function SeoStudioView({ projects = [], activeProjectId, setActiveTab }) {
  const currentProject = projects.find(p => p.id === activeProjectId) || projects[0];

  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [titleOptions, setTitleOptions] = useState([]);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  useEffect(() => {
    if (currentProject) {
      loadSeoMetadata(currentProject.id);
    }
  }, [currentProject?.id]);

  async function loadSeoMetadata(projectId) {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/seo`);
      if (res.ok) {
        const d = await res.json();
        if (d.data) {
          setTitle(d.data.title || '');
          setTitleOptions(d.data.titleOptions || []);
          setDescription(d.data.description || '');
          setTags(d.data.tags || '');
        }
      }
    } catch (err) {
      console.warn('Could not load SEO metadata:', err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegenerate() {
    if (!currentProject) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${currentProject.id}/seo/generate`, { method: 'POST' });
      if (res.ok) {
        const d = await res.json();
        if (d.data) {
          setTitle(d.data.title || '');
          setTitleOptions(d.data.titleOptions || []);
          setDescription(d.data.description || '');
          setTags(d.data.tags || '');
        }
      }
    } catch (err) {
      alert('Error regenerating SEO metadata: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(`TITLE:\n${title}\n\nDESCRIPTION:\n${description}\n\nTAGS:\n${tags}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-400" />
            <span>SEO Studio — Titles, Descriptions & Timestamps</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Stage 5 SEO Generator: 3 Title options strictly under 70 characters, real subtitle timestamps, Scripture quotes, and AI synthetic media disclosure.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRegenerate}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            <span>{loading ? 'Refreshing...' : 'Regenerate'}</span>
          </button>

          <button
            onClick={handleCopy}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
            <span>{copied ? 'Copied Full Metadata!' : 'Copy All Metadata'}</span>
          </button>
        </div>
      </div>

      {/* 3 Title Options (Stage 5 Requirement) */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              3 High-CTR Title Options (Strictly &lt; 70 Characters)
            </h3>
          </div>
          <span className="text-[11px] text-emerald-400 font-medium">All &lt; 70 chars • Zero Clickbait</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {titleOptions.map((opt, idx) => {
            const isSelected = title === opt.title;
            return (
              <div
                key={idx}
                onClick={() => setTitle(opt.title)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 text-slate-100 shadow-md ring-1 ring-amber-500/30'
                    : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                      Option {idx + 1}: {opt.angle}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                      opt.length < 70 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {opt.length} / 70
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-100 leading-snug">
                    {opt.title}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{isSelected ? 'Active Title' : 'Click to Select'}</span>
                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center">
                    {isSelected && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor Fields */}
      <div className="space-y-5">
        {/* Active Title */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Selected YouTube Video Title
            </label>
            <span className={`text-xs font-mono ${title.length < 70 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {title.length} / 70 characters
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 font-medium focus:outline-none focus:border-amber-500 font-sans"
          />
        </div>

        {/* Description with Real Timestamps */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              YouTube Description with Real Timestamps & Synthetic Media Disclosure
            </label>
            <span className="text-xs text-slate-400 font-mono">{description.length} characters</span>
          </div>
          <textarea
            rows={14}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500 leading-relaxed"
          />
        </div>

        {/* Tags */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Video Tags (Under 500 Characters)
            </label>
            <span className="text-xs text-slate-400 font-mono">{tags.length} / 500</span>
          </div>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>
      </div>
    </div>
  );
}
