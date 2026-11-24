import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Sparkles, Copy, Check, Upload, AlertCircle, CheckCircle2, ArrowRight, RefreshCw, ShieldAlert, FolderOpen } from 'lucide-react';

export default function ImageStudioView({ setActiveTab }) {
  const [providerMode, setProviderMode] = useState('MANUAL_IMPORT');
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [scenes, setScenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedScene, setCopiedScene] = useState(null);
  const [uploadingScene, setUploadingScene] = useState(null);
  const [uploadError, setUploadError] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  async function fetchInitialData() {
    setLoading(true);
    try {
      // 1. Fetch Provider Mode
      const modeRes = await fetch('/api/images/provider-mode');
      if (modeRes.ok) {
        const md = await modeRes.json();
        if (md.mode) setProviderMode(md.mode);
      }

      // 2. Fetch Projects
      const projRes = await fetch('/api/projects');
      if (projRes.ok) {
        const pd = await projRes.json();
        const list = pd.data || [];
        setProjects(list);
        if (list.length > 0) {
          const current = list[0].id;
          setSelectedProjectId(current);
          fetchProjectScenes(current);
        }
      }
    } catch (e) {
      console.error('Failed to load initial data:', e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchProjectScenes(projectId) {
    if (!projectId) return;
    try {
      // Fetch project details and segments
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        let segs = data.data?.segments || data.segments || [];
        // Secondary fallback to dedicated segments endpoint if needed
        if (!segs || segs.length === 0) {
          const segRes = await fetch(`/api/projects/${projectId}/segments`);
          if (segRes.ok) {
            const segData = await segRes.json();
            segs = segData.data || segData || [];
          }
        }
        setScenes(segs);
      }
    } catch (e) {
      console.error('Failed to fetch scenes:', e);
    }
  }

  async function handleProviderModeChange(newMode) {
    setProviderMode(newMode);
    try {
      await fetch('/api/images/provider-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode })
      });
    } catch (e) {
      console.error('Failed to save provider mode:', e);
    }
  }

  const handleCopyPrompt = (sceneOrder, promptText) => {
    navigator.clipboard.writeText(promptText);
    setCopiedScene(sceneOrder);
    setTimeout(() => setCopiedScene(null), 2500);
  };

  const handleFileUpload = async (sceneOrder, file) => {
    if (!file || !selectedProjectId) return;
    setUploadingScene(sceneOrder);
    setUploadError(prev => ({ ...prev, [sceneOrder]: null }));

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result;
        const res = await fetch(`/api/projects/${selectedProjectId}/scenes/${sceneOrder}/upload-image`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            filename: file.name
          })
        });

        const resData = await res.json();
        if (res.ok && resData.success) {
          fetchProjectScenes(selectedProjectId);
        } else {
          setUploadError(prev => ({ ...prev, [sceneOrder]: resData.error || 'Upload failed' }));
        }
        setUploadingScene(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError(prev => ({ ...prev, [sceneOrder]: err.message }));
      setUploadingScene(null);
    }
  };

  const currentProject = projects.find(p => p.id === selectedProjectId);
  const isShorts = currentProject?.format === 'SHORTS';
  const readyScenesCount = scenes.filter(s => s.image_status === 'MANUAL_IMPORT' || s.image_status === 'AI_GENERATED').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-400" />
            <span>Image Studio — 3-Mode Biblical Visual Pipeline</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Zero procedural fallback artwork • Minimum 1920x1080 (Long Form) / 1080x1920 (Shorts)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {projects.length > 0 && (
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                fetchProjectScenes(e.target.value);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title} ({p.format})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Provider Setting Toggle Strip */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-300">
          Image Provider Setting:
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleProviderModeChange('MANUAL_IMPORT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              providerMode === 'MANUAL_IMPORT'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <span>Mode B — Manual Import (Zero-Cost Default)</span>
          </button>

          <button
            onClick={() => handleProviderModeChange('GEMINI_IMAGEN')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              providerMode === 'GEMINI_IMAGEN'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mode A — Gemini Imagen 3 (Paid API)</span>
          </button>

          <button
            onClick={() => handleProviderModeChange('NONE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              providerMode === 'NONE'
                ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Mode C — None Configured</span>
          </button>
        </div>
      </div>

      {/* Mode C Warning Banner if active */}
      {providerMode === 'NONE' && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              <strong>Mode C Active:</strong> No image provider is configured. Production is halted at the visual stage.
            </span>
          </div>
          <button
            onClick={() => handleProviderModeChange('MANUAL_IMPORT')}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
          >
            <span>Activate Mode B (Zero-Cost Default)</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}

      {/* Mode A Notice Banner if active */}
      {providerMode === 'GEMINI_IMAGEN' && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>
            <strong>Mode A Active (Google Gemini Imagen 3):</strong> Model <code className="text-amber-200">imagen-3.0-generate-002</code> charges ~$0.03/image. Free tier does not cover Imagen 3. Automated runs require key and paid confirmation.
          </span>
        </div>
      )}

      {/* Mode B Workflow Instructions Banner */}
      {providerMode === 'MANUAL_IMPORT' && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              <strong>Mode B Active (Zero-Cost Default):</strong> Copy standardized prompts below, generate on any free AI tool (Copilot, Civitai, FLUX web), and drag/drop upload. Min resolution: {isShorts ? '1080x1920' : '1920x1080'}.
            </span>
          </div>
          <span className="font-semibold text-slate-200 font-mono">
            {readyScenesCount} / {scenes.length} Scenes Ready
          </span>
        </div>
      )}

      {/* Scenes List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Project Visual Scenes ({scenes.length} Scenes)
          </h3>
          <span className="text-xs text-slate-400">
            {readyScenesCount === scenes.length ? '✓ All Visuals Verified' : `${scenes.length - readyScenesCount} pending upload`}
          </span>
        </div>

        {scenes.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
            No scenes found for this project. Please generate the script in Chapter Production first.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenes.map((scene) => {
              const isReady = scene.image_status === 'MANUAL_IMPORT' || scene.image_status === 'AI_GENERATED';
              const isFallback = scene.image_status === 'FALLBACK';
              const imgUrl = `/storage/projects/${selectedProjectId}/images/scene_${scene.segment_order}.jpg`;

              return (
                <div
                  key={scene.id || scene.segment_order}
                  className={`p-5 rounded-xl border flex flex-col justify-between transition-all ${
                    isReady
                      ? 'bg-slate-900/80 border-emerald-500/30'
                      : isFallback
                      ? 'bg-slate-950/60 border-rose-500/30'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-amber-400 uppercase">
                          Scene {scene.segment_order}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({scene.duration_seconds ? `${scene.duration_seconds.toFixed(1)}s` : '~6s'})
                        </span>
                      </div>

                      {isReady ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Ready ({scene.engine_used || 'Manual'})
                        </span>
                      ) : isFallback ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Blocked Fallback
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                          Awaiting Image
                        </span>
                      )}
                    </div>

                    {/* Narration Excerpt */}
                    {scene.narration_text && (
                      <div className="text-[11px] text-slate-400 italic line-clamp-2 border-l-2 border-slate-700 pl-2">
                        "{scene.narration_text}"
                      </div>
                    )}

                    {/* Standardized Prompt Display */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-300">Standardized Prompt:</span>
                        <button
                          onClick={() => handleCopyPrompt(scene.segment_order, scene.image_prompt)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-[10px] font-semibold flex items-center gap-1 transition-all"
                        >
                          {copiedScene === scene.segment_order ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy Prompt</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-300 font-mono bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed max-h-28 overflow-y-auto">
                        {scene.image_prompt || 'Prompt will be generated automatically.'}
                      </p>
                    </div>

                    {/* Upload error display */}
                    {uploadError[scene.segment_order] && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{uploadError[scene.segment_order]}</span>
                      </p>
                    )}
                  </div>

                  {/* Bottom: Image Upload & Preview */}
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{uploadingScene === scene.segment_order ? 'Validating...' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          disabled={uploadingScene === scene.segment_order}
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleFileUpload(scene.segment_order, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                      <span className="text-[10px] text-slate-500">
                        Min {isShorts ? '1080x1920' : '1920x1080'}
                      </span>
                    </div>

                    {isReady && (
                      <a
                        href={imgUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 underline font-medium"
                      >
                        Preview Image
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Step Action */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#131D31] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-100">
            {readyScenesCount === scenes.length ? 'Visual Assets Verified' : `${readyScenesCount} of ${scenes.length} Scenes Ready`}
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            {readyScenesCount === scenes.length
              ? 'All scenes meet high-resolution criteria (&ge;1920x1080). Ready for Ken Burns video composition.'
              : 'Upload images for the remaining scenes to proceed to automated video composition.'}
          </p>
        </div>

        <button
          onClick={() => setActiveTab('video-production')}
          disabled={readyScenesCount < scenes.length && providerMode !== 'NONE'}
          className={`px-6 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-lg transition-all ${
            readyScenesCount === scenes.length
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-amber-500/20 cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
          }`}
        >
          <span>Open Video Production Studio</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
