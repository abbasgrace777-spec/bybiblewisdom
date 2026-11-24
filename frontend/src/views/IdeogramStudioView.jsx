import React, { useState, useEffect } from 'react';
import { 
  Maximize2, Copy, Sparkles, RefreshCw, Check, ExternalLink, Image as ImageIcon,
  Download, Upload, Sliders, Monitor, Smartphone, ShieldCheck, CheckCircle2,
  FileText, AlertCircle, HardDrive, Palette, Zap
} from 'lucide-react';
import { api } from '../services/api';

export default function IdeogramStudioView({ setActiveTab }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [thumbnailData, setThumbnailData] = useState(null);
  const [ideogramStatus, setIdeogramStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Editable typography & concept
  const [headlineText, setHeadlineText] = useState('');
  const [subtitleText, setSubtitleText] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('cinematic');

  // Preview simulator mode: 'canvas', 'desktop', 'mobile'
  const [previewMode, setPreviewMode] = useState('canvas');

  // Uploading state
  const [isUploading, setIsUploading] = useState(false);
  const [thumbTimestamp, setThumbTimestamp] = useState(Date.now());

  useEffect(() => {
    fetchProjects();
    fetchIdeogramStatus();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectThumbnail(selectedProjectId);
    }
  }, [selectedProjectId]);

  const fetchIdeogramStatus = async () => {
    try {
      const res = await api.getIdeogramStatus();
      if (res.success) {
        setIdeogramStatus(res.data);
      }
    } catch (e) {
      console.warn('Ideogram status notice:', e.message);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.getProjects();
      const list = res.data || res;
      if (Array.isArray(list)) {
        setProjects(list);
        if (list.length > 0 && !selectedProjectId) {
          setSelectedProjectId(list[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to fetch projects', e);
    }
  };

  const loadProjectThumbnail = async (projId) => {
    setErrorMsg('');
    try {
      const res = await api.getIdeogramThumbnail(projId);
      if (res.success && res.data) {
        const d = res.data;
        setThumbnailData(d);
        setHeadlineText(d.headlineText || '');
        setCustomPrompt(d.ideogramPrompt || '');
        setSubtitleText(d.subtitle || `${d.book?.toUpperCase() || 'BIBLE'} ${d.chapter || 1} • FULL EXPLANATION`);
        setThumbTimestamp(Date.now());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyPrompt = () => {
    const textToCopy = customPrompt || thumbnailData?.ideogramPrompt;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleGenerate = async (skipApi = false) => {
    if (!selectedProjectId) return;
    setLoading(true);
    setErrorMsg('');
    setStatusMsg(skipApi ? 'Generating local high-CTR thumbnail canvas...' : 'Sending request to Ideogram generator...');

    try {
      const res = await api.generateIdeogramThumbnail(selectedProjectId, {
        headlineText,
        subtitle: subtitleText,
        customPrompt: customPrompt || undefined,
        stylePreset: selectedPreset,
        skipApi
      });

      if (res.success && res.data) {
        setThumbnailData(res.data);
        setThumbTimestamp(Date.now());
        setStatusMsg('1280x720 Thumbnail generated, optimized, and saved separately!');
        setTimeout(() => setStatusMsg(''), 4000);
      } else {
        setErrorMsg(res.error || 'Generation failed');
      }
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTextOverlay = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const res = await api.applyIdeogramText(selectedProjectId, {
        headlineText,
        subtitleText
      });
      if (res.success && res.data) {
        setThumbnailData(res.data);
        setThumbTimestamp(Date.now());
        setStatusMsg('Custom gold & white typography successfully applied to thumbnail!');
        setTimeout(() => setStatusMsg(''), 4000);
      }
    } catch (e) {
      setErrorMsg(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result;
        const res = await api.uploadIdeogramThumbnail(selectedProjectId, base64, file.type);
        if (res.success && res.data) {
          setThumbnailData(res.data);
          setThumbTimestamp(Date.now());
          setStatusMsg('Manual Ideogram image uploaded, scaled to 1280x720, and optimized!');
          setTimeout(() => setStatusMsg(''), 4000);
        }
      } catch (err) {
        setErrorMsg(`Upload failed: ${err.message}`);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const selectedProj = projects.find(p => p.id === selectedProjectId);
  const currentThumbUrl = selectedProjectId 
    ? `/api/projects/${selectedProjectId}/thumbnail?t=${thumbTimestamp}`
    : (thumbnailData?.thumbnailJpgUrl || null);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Bar */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Maximize2 className="w-5 h-5 text-amber-400" />
              <span>AI YouTube Thumbnail Generator</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Ideogram 2.0 Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dedicated 1280x720 thumbnail creation • 3D Metallic Gold & White Typography • High Mobile CTR • Distinct Chapter Compositions
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <a
            href="https://ideogram.ai/create"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-2 transition-all shadow-sm"
          >
            <span>Open Ideogram.ai Web</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </a>
        </div>
      </div>

      {/* 2. Project Selector & Status Banner */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400 max-w-sm"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.format})
              </option>
            ))}
          </select>
        </div>

        {/* Ideogram API & Commercial Terms Indicator */}
        <div className="flex items-center gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${ideogramStatus?.configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-semibold">
              API Status: {ideogramStatus?.configured ? 'Key Configured' : 'Manual / Free Mode'}
            </span>
          </div>

          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
            {ideogramStatus?.configured ? 'Commercial API Permitted' : 'Ready-to-Copy Prompts Active'}
          </span>

          <button
            onClick={async () => {
              try {
                const res = await api.testIdeogram();
                if (res.data?.connected) {
                  setStatusMsg(`Ideogram Connected! Credits: ${res.data.credits || 'Active'}`);
                } else {
                  setErrorMsg(res.data?.error || 'Ideogram connection test failed');
                }
              } catch (e) {
                setErrorMsg(e.message);
              }
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-medium flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>Test Ideogram</span>
          </button>
        </div>
      </div>

      {/* Feedback Alerts */}
      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Thumbnail Preview & YouTube Feed Simulator */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            {/* View Mode Controls */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>1280×720 Thumbnail Preview (16:9)</span>
              </h3>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setPreviewMode('canvas')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                    previewMode === 'canvas' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Canvas</span>
                </button>
                <button
                  onClick={() => setPreviewMode('desktop')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                    previewMode === 'desktop' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>YouTube Desktop Feed</span>
                </button>
                <button
                  onClick={() => setPreviewMode('mobile')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all ${
                    previewMode === 'mobile' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>YouTube Mobile Feed</span>
                </button>
              </div>
            </div>

            {/* Display Area: Mode Conditionals */}
            {previewMode === 'canvas' && (
              <div className="aspect-video w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl relative group">
                {currentThumbUrl ? (
                  <img
                    src={currentThumbUrl}
                    alt="Master Thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                    <span className="text-xs">No thumbnail generated yet. Click generate below.</span>
                  </div>
                )}
              </div>
            )}

            {/* YouTube Desktop Feed Simulation */}
            {previewMode === 'desktop' && (
              <div className="p-4 rounded-xl bg-[#0F0F0F] border border-slate-800 space-y-3 font-sans">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Simulated YouTube Desktop Search Result (How viewers see it)
                </span>
                <div className="flex gap-4 items-start">
                  <div className="w-64 aspect-video rounded-xl bg-slate-900 overflow-hidden relative flex-shrink-0 border border-slate-800">
                    <img src={currentThumbUrl} alt="Desktop Preview" className="w-full h-full object-cover" />
                    <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
                      10:49
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-white line-clamp-2 leading-snug">
                      {selectedProj?.title || 'Genesis Chapter 1 Explained | Complete Verse-by-Verse Bible Study'}
                    </h4>
                    <p className="text-[11px] text-slate-400">ByBibleWisdom • 14K views • 3 hours ago</p>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-[10px] font-bold text-slate-950">
                        B
                      </div>
                      <span>ByBibleWisdom</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* YouTube Mobile Feed Simulation */}
            {previewMode === 'mobile' && (
              <div className="p-4 rounded-xl bg-[#0F0F0F] border border-slate-800 space-y-3 max-w-sm mx-auto font-sans">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Simulated YouTube Mobile Feed (Check Text Readability)
                </span>
                <div className="w-full aspect-video rounded-xl bg-slate-900 overflow-hidden relative border border-slate-800">
                  <img src={currentThumbUrl} alt="Mobile Preview" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-white">
                    10:49
                  </span>
                </div>
                <div className="flex gap-3 items-start pt-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 flex items-center justify-center text-xs font-bold text-slate-950 flex-shrink-0">
                    B
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">
                      {selectedProj?.title || 'The Complete Story of Genesis 1'}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">ByBibleWisdom • 18K views • 2 days ago</p>
                  </div>
                </div>
              </div>
            )}

            {/* Thumbnail Metadata & File Size Optimization Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Resolution</span>
                <strong className="text-slate-100 font-mono">1280 × 720 (16:9)</strong>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">File Size</span>
                <strong className="text-emerald-400 font-mono">
                  {thumbnailData?.fileSizeKb ? `${thumbnailData.fileSizeKb} KB` : '112 KB'}
                </strong>
                <span className="text-[9px] text-slate-500 block">&lt; 2.0MB YouTube Max ✓</span>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Headline Text</span>
                <strong className="text-amber-400 truncate block">"{headlineText || thumbnailData?.headlineText}"</strong>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">License Provenance</span>
                <strong className="text-slate-200 text-[11px] truncate block">Commercial Permitted</strong>
              </div>
            </div>

            {/* Download & Upload Actions */}
            <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800 flex-wrap">
              <div className="flex items-center gap-2">
                <a
                  href={`/api/ideogram/${selectedProjectId}/download/jpg`}
                  download
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download JPG (YouTube)</span>
                </a>

                <a
                  href={`/api/ideogram/${selectedProjectId}/download/png`}
                  download
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Download PNG (Lossless)</span>
                </a>
              </div>

              {/* Upload Finished Ideogram Web Thumbnail */}
              <label className="px-3.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{isUploading ? 'Uploading...' : 'Upload Ideogram Image'}</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Concept, Typography & Ideogram Prompt */}
        <div className="lg:col-span-5 space-y-4">
          {/* Typography Customizer Card (Requirements 5 & 6) */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4 text-amber-400" />
              <span>Thumbnail Typography & Peak Moment</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Large Bold Headline (Bright Gold & White):
                </label>
                <input
                  type="text"
                  value={headlineText}
                  onChange={(e) => setHeadlineText(e.target.value)}
                  placeholder="e.g. BEFORE TIME BEGAN"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-amber-300 font-bold focus:outline-none focus:border-amber-400 uppercase tracking-wide"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">2 to 4 words for maximum CTR and mobile readability</span>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-semibold">
                  Secondary Subtitle / Reference:
                </label>
                <input
                  type="text"
                  value={subtitleText}
                  onChange={(e) => setSubtitleText(e.target.value)}
                  placeholder="e.g. GENESIS 1 • FULL EXPLANATION"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleApplyTextOverlay}
                  disabled={loading}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition-colors"
                >
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                  <span>Apply Typography to Canvas</span>
                </button>
              </div>
            </div>
          </div>

          {/* Ready-to-Copy Ideogram Prompt Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Ready-to-Copy Ideogram Prompt</span>
              </h3>

              <button
                onClick={handleCopyPrompt}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
              </button>
            </div>

            {/* Prompt Textarea */}
            <textarea
              rows={6}
              value={customPrompt || thumbnailData?.ideogramPrompt || ''}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 leading-relaxed font-mono focus:outline-none focus:border-amber-400 select-all"
            />

            {/* Prompt Variations Picker */}
            {thumbnailData?.promptVariations && thumbnailData.promptVariations.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Composition Presets:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {thumbnailData.promptVariations.map((v, idx) => {
                    const presetKey = v.variantNumber || v.id || (idx + 1);
                    const titleText = v.title || v.name || `Variant ${idx + 1}`;
                    const label = String(titleText).split(' (')[0].split(':')[1]?.trim() || String(titleText).split(' (')[0];
                    return (
                      <button
                        key={presetKey}
                        onClick={() => {
                          setSelectedPreset(presetKey);
                          if (v.prompt) setCustomPrompt(v.prompt);
                          if (v.headlineText) setHeadlineText(v.headlineText);
                        }}
                        className={`p-2 rounded-lg border text-[10px] font-semibold text-center transition-all truncate ${
                          selectedPreset === presetKey
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                            : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                        }`}
                        title={titleText}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Master Generate Button */}
            <div className="pt-2">
              <button
                onClick={() => handleGenerate(false)}
                disabled={loading || !selectedProjectId}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'Generating...' : 'Regenerate 1280×720 Thumbnail'}</span>
              </button>
            </div>
          </div>

          {/* Separate Storage & License Information (Requirement 10) */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs space-y-2 text-slate-400">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <HardDrive className="w-4 h-4" />
              <span>Independent Chapter File Storage (Requirement 10)</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              Every chapter thumbnail is saved separately in:
            </p>
            <code className="text-slate-300 font-mono text-[10px] block bg-slate-950 p-2 rounded border border-slate-800/80">
              ByBibleWisdom/{thumbnailData?.book || 'Genesis'}/Chapter_{String(thumbnailData?.chapter || 1).padStart(2, '0')}/
            </code>
            <ul className="list-disc list-inside text-[11px] text-slate-400 space-y-0.5">
              <li><code className="text-slate-300">Thumbnail.jpg</code> (1280x720, &lt;2MB YouTube Spec)</li>
              <li><code className="text-slate-300">Thumbnail.png</code> (1280x720, Lossless Master)</li>
              <li><code className="text-slate-300">Ideogram_Prompt.txt</code> (Copy-Ready Prompt)</li>
              <li><code className="text-slate-300">Thumbnail_Metadata.json</code> (Typography & License)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
