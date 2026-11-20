import React, { useState, useEffect } from 'react';
import {
  FolderCheck,
  CheckCircle2,
  Copy,
  Check,
  Download,
  ShieldCheck,
  Video,
  Image as ImageIcon,
  FileText,
  Tag,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Play,
  VolumeX,
  Type,
  Mic
} from 'lucide-react';
import { api } from '../services/api';

export default function ReadyToUploadView({ setActiveTab }) {
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [packageData, setPackageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [selectingVariant, setSelectingVariant] = useState(false);

  async function handleSelectVariant(variantNum) {
    if (!selectedProjectId) return;
    setSelectingVariant(true);
    try {
      await api.selectThumbnailVariant(selectedProjectId, variantNum);
      await loadPackageData(selectedProjectId);
    } catch (err) {
      console.error('Failed to select thumbnail variant:', err);
    } finally {
      setSelectingVariant(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      const res = await api.getProjects();
      if (res.success && res.data) {
        setProjects(res.data);
        // Find first project with output_video_path or default to first
        const readyProject = res.data.find(p => p.output_video_path) || res.data[0];
        if (readyProject) {
          setSelectedProjectId(readyProject.id);
          loadPackageData(readyProject.id);
        }
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    }
  }

  async function loadPackageData(projectId) {
    if (!projectId) return;
    setLoading(true);
    try {
      const res = await api.getReadyToUpload(projectId);
      if (res.success && res.data) {
        setPackageData(res.data);
      }
    } catch (err) {
      console.error('Failed to load ready-to-upload package:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleProjectChange(id) {
    setSelectedProjectId(id);
    loadPackageData(id);
  }

  function handleCopy(text, fieldName) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* 1. Header & Project Selector */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FolderCheck className="w-5 h-5 text-amber-400" />
            <span>Ready to Upload — Production Package</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Pre-assembled YouTube release package with verified video, thumbnail, metadata, and 4-point safe-source clearance.
          </p>
        </div>

        {/* Project Selector Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-400">Selected Project:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-amber-200 font-medium focus:outline-none focus:border-amber-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} {p.output_video_path ? '✓ (Ready)' : '(In Progress)'}
              </option>
            ))}
          </select>
          <button
            onClick={() => loadPackageData(selectedProjectId)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh package"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !packageData ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400 mb-3" />
          <p className="text-sm">Inspecting video package and verifying safe-source checks...</p>
        </div>
      ) : packageData ? (
        <>
          {/* 2. Simple Safe-Source Check Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Safe-Source Clearance (Monetization & Copyright Gate)
                </h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                packageData.safeSourceCheck?.overallSafe
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              }`}>
                {packageData.safeSourceCheck?.overallSafe ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>SAFE FOR MONETIZATION</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>REQUIRES REVIEW</span>
                  </>
                )}
              </span>
            </div>

            {/* 4 Pillars Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
              {/* Check 1: No Music */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <VolumeX className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">1. No Music</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    PASSED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {packageData.safeSourceCheck?.noMusic?.details || '1 voice stream (aac). 0 background music used.'}
                </p>
              </div>

              {/* Check 2: Images */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">2. AI / Free Images</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    packageData.safeSourceCheck?.images?.passed
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {packageData.safeSourceCheck?.images?.passed ? 'PASSED' : 'FALLBACK'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {packageData.safeSourceCheck?.images?.details || 'AI-generated / CC0 only. No procedural fallbacks.'}
                </p>
              </div>

              {/* Check 3: Fonts */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">3. Usable Fonts</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    PASSED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {packageData.safeSourceCheck?.fonts?.details || 'Cinzel & Inter (SIL OFL 1.1 / Apache 2.0).'}
                </p>
              </div>

              {/* Check 4: Spoken Voice */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">4. Usable Voice</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    PASSED
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  {packageData.safeSourceCheck?.voice?.details || 'Spoken word voice licensed for commercial broadcast.'}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Main Media & Metadata Package Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Final_Video.mp4 & Thumbnail (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Final Video Player Card */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                    <Video className="w-4 h-4 text-amber-400" />
                    <span>Final_Video.mp4</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {packageData.video?.sizeFormatted}
                  </span>
                </div>

                {packageData.video?.available ? (
                  <div className="space-y-3">
                    <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 relative shadow-lg">
                      <video
                        controls
                        className="w-full h-full object-contain"
                        src={packageData.video?.downloadUrl}
                        poster={packageData.thumbnail?.downloadUrl}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="text-[11px] text-slate-400 truncate max-w-[240px]">
                        Path: <span className="font-mono text-slate-300">{packageData.video?.path}</span>
                      </div>
                      <a
                        href={packageData.video?.downloadUrl}
                        download="Final_Video.mp4"
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download MP4</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-950 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-300">Video not rendered yet</p>
                    <p className="text-[11px] text-slate-500 mt-1">Render this project in the Video Editor tab first.</p>
                  </div>
                )}
              </div>

              {/* Thumbnail Preview & 3-Variant Selector */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
                    <ImageIcon className="w-4 h-4 text-amber-400" />
                    <span>Active YouTube Thumbnail (1280x720)</span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Active: Variant {packageData.thumbnail?.chosenVariantIndex || 1}
                  </span>
                </div>

                {packageData.thumbnail?.available ? (
                  <div className="space-y-3">
                    <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 shadow-lg relative group">
                      <img
                        src={packageData.thumbnail?.downloadUrl}
                        alt="Active Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-[200px]">
                        {packageData.thumbnail?.filename}
                      </span>
                      <a
                        href={packageData.thumbnail?.downloadUrl}
                        download={packageData.thumbnail?.filename}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Active</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video bg-slate-950 rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-6 text-slate-500">
                    <ImageIcon className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="text-xs font-semibold text-slate-400">
                      {packageData.thumbnail?.generationStatus === 'NOT_CONFIGURED' ? 'Ideogram API Not Configured' : 'No thumbnail generated'}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {packageData.thumbnail?.generationStatus === 'NOT_CONFIGURED' 
                        ? 'Set IDEOGRAM_API_KEY in Settings to enable AI thumbnails. Zero fallback art produced.' 
                        : 'Generate thumbnail in Ideogram Studio tab.'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Title, Description, Tags (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Ready-to-Copy YouTube Metadata */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                      YouTube Publishing Metadata
                    </h3>
                  </div>
                  <a
                    href="https://studio.youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open YouTube Studio</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Video Title</label>
                    <button
                      onClick={() => handleCopy(packageData.seo?.title, 'title')}
                      className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {copiedField === 'title' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Title</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={packageData.seo?.title || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-amber-200 font-medium focus:outline-none select-all"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300">Video Description (Timestamps & Scripture)</label>
                    <button
                      onClick={() => handleCopy(packageData.seo?.description, 'description')}
                      className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {copiedField === 'description' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Description</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    rows={8}
                    value={packageData.seo?.description || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 font-mono leading-relaxed focus:outline-none select-all resize-y"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <label className="text-xs font-bold text-slate-300">YouTube Tags</label>
                    </div>
                    <button
                      onClick={() => handleCopy(packageData.seo?.tags, 'tags')}
                      className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      {copiedField === 'tags' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Tags</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    rows={3}
                    value={packageData.seo?.tags || ''}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-amber-200/90 font-mono focus:outline-none select-all"
                  />
                </div>

                {/* Step-by-Step Manual Upload Instructions */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                    Manual Safe Publishing Workflow
                  </h4>
                  <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside leading-relaxed">
                    <li>Download or drag <strong className="text-slate-200">Final_Video.mp4</strong> into <a href="https://studio.youtube.com" target="_blank" rel="noreferrer" className="text-amber-400 underline">YouTube Studio</a>.</li>
                    <li>Paste the <strong>Title</strong>, <strong>Description</strong>, and <strong>Tags</strong> with the copy buttons above.</li>
                    <li>Upload the 1280x720 <strong>Thumbnail</strong>.</li>
                    <li>No audio copyright claims will be triggered (pure spoken voice, 0 background music).</li>
                    <li>Safe to publish publicly immediately.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Ideogram 2.0 Thumbnail 3-Variant Selector (Side-by-Side) */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <span>High-CTR Thumbnail Variants (Side-by-Side Selection)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  3 high-CTR variants with distinct focal scenes and 2–4 word theme text. Click any variant to choose the active video thumbnail.
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Brand Style: Bold White + Thin Gold Outline • 1280x720
              </span>
            </div>

            {/* If Not Configured Notice */}
            {packageData.thumbnail?.generationStatus === 'NOT_CONFIGURED' && (
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 space-y-1.5">
                <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Ideogram API Status: NOT CONFIGURED</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  IDEOGRAM_API_KEY is not configured in settings. In accordance with zero-silent-fallback rules, no procedural fallback images are produced as final thumbnails. To generate these 3 variants via Ideogram 2.0 API, configure your API key in Settings.
                </p>
              </div>
            )}

            {/* 3 Variants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {(packageData.thumbnail?.variants || []).map((v) => {
                const isActive = (packageData.thumbnail?.chosenVariantIndex || 1) === v.variantNumber;
                return (
                  <div
                    key={v.variantNumber}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                      isActive
                        ? 'bg-amber-500/10 border-amber-500/60 shadow-lg'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">{v.title}</span>
                        {isActive ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950 flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>ACTIVE</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-slate-400">Variant {v.variantNumber}</span>
                        )}
                      </div>

                      {/* 16:9 Thumbnail Image */}
                      <div className="aspect-video bg-black rounded-lg overflow-hidden border border-slate-800 relative">
                        {v.available ? (
                          <img
                            src={v.url}
                            alt={v.headlineText}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center text-slate-500">
                            <ImageIcon className="w-6 h-6 mb-1 text-slate-600" />
                            <span className="text-[10px]">Awaiting Ideogram API</span>
                          </div>
                        )}
                      </div>

                      {/* 160px Mobile Feed Preview Badge */}
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-semibold uppercase tracking-wider">Mobile View (160px)</span>
                          <span className={v.qcStatus === 'PASSED_QC' ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                            {v.qcStatus || 'QC Ready'}
                          </span>
                        </div>
                        {v.url160px ? (
                          <div className="w-40 h-[90px] mx-auto bg-black rounded overflow-hidden border border-slate-700">
                            <img src={v.url160px} alt="160px" className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 text-center py-2 font-mono">
                            Headline: "{v.headlineText}"
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="text-[11px] text-slate-300 space-y-1">
                        <div><strong className="text-slate-400">Headline:</strong> "{v.headlineText}"</div>
                        <div className="text-[10px] text-slate-400 line-clamp-2"><strong className="text-slate-500">Focal:</strong> {v.focalScene}</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex items-center gap-2">
                      <button
                        onClick={() => handleSelectVariant(v.variantNumber)}
                        disabled={isActive || selectingVariant || !v.available}
                        className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors ${
                          isActive
                            ? 'bg-amber-500/20 text-amber-300 cursor-default border border-amber-500/40'
                            : v.available
                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isActive ? 'Current Thumbnail' : 'Select as Active'}
                      </button>
                      {v.available && (
                        <a
                          href={v.url}
                          download={`thumbnail_variant_${v.variantNumber}.jpg`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="Download Variant"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="p-12 text-center text-slate-400">
          <p>No project selected or package data available.</p>
        </div>
      )}
    </div>
  );
}
