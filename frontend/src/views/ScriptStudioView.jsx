import React, { useState, useEffect } from 'react';
import { 
  FileText, Sparkles, RefreshCw, CheckCircle2, ShieldCheck, ArrowRight, 
  Cpu, Terminal, Zap, Film, Layers, Check, AlertTriangle, Download, 
  Sliders, Eye, HardDrive, Play, ChevronDown, ChevronUp
} from 'lucide-react';
import { api } from '../services/api';

export default function ScriptStudioView({ projects = [], activeProjectId, onSelectProject, setActiveTab }) {
  const currentProject = projects.find(p => p.id === activeProjectId) || projects[0];

  // Script text sections
  const [hook, setHook] = useState('');
  const [context, setContext] = useState('');
  const [narrative, setNarrative] = useState('');
  const [theology, setTheology] = useState('');
  const [application, setApplication] = useState('');
  const [cta, setCta] = useState('');
  const [fullNarration, setFullNarration] = useState('');

  // Ollama status & model selection
  const [ollamaStatus, setOllamaStatus] = useState({ running: false, url: 'http://localhost:11434', version: null, error: null });
  const [installedModels, setInstalledModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('qwen3:4b');
  const [pullModelName, setPullModelName] = useState('');
  const [isPulling, setIsPulling] = useState(false);

  // Generation settings
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.85);
  const [numCtx, setNumCtx] = useState(8192);
  const [numPredict, setNumPredict] = useState(4000);
  const [repeatPenalty, setRepeatPenalty] = useState(1.1);
  const [showSettings, setShowSettings] = useState(false);

  // Performance metrics & state
  const [generating, setGenerating] = useState(false);
  const [genStep, setGenStep] = useState('');
  const [perfMetrics, setPerfMetrics] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  // Tab switching: 'script' vs 'scenes' vs 'outline' (Stage 5 Two-Pass)
  const [activeSubTab, setActiveSubTab] = useState('script');
  const [sceneDescriptions, setSceneDescriptions] = useState(null);
  const [scriptOutline, setScriptOutline] = useState(null);
  const [repetitionReport, setRepetitionReport] = useState(null);

  useEffect(() => {
    checkOllama();
    if (currentProject) {
      loadProjectScript(currentProject.id);
    }
  }, [currentProject?.id]);

  const checkOllama = async () => {
    try {
      const res = await api.getOllamaStatus();
      if (res.success && res.data) {
        setOllamaStatus(res.data);
        if (res.data.activeModel) setSelectedModel(res.data.activeModel);
      }
      const modelsRes = await api.getOllamaModels();
      if (modelsRes.success && modelsRes.data) {
        setInstalledModels(modelsRes.data);
      }
    } catch (e) {
      setOllamaStatus({ running: false, url: 'http://localhost:11434', version: null, error: e.message });
    }
  };

  const loadProjectScript = async (id) => {
    setErrorMessage(null);
    try {
      const res = await api.getProjectScript(id);
      if (res.success && res.data) {
        const s = res.data;
        setHook(s.hook || '');
        setContext(s.biblical_context || '');
        setNarrative(s.core_narrative || '');
        setTheology(s.theological_insight || '');
        setApplication(s.practical_application || '');
        setCta(s.call_to_action || '');
        setFullNarration(s.full_narration_text || '');
        setIsApproved(Boolean(s.is_approved));
        if (s.generation_metrics) {
          setPerfMetrics(s.generation_metrics);
          if (s.generation_metrics.repetitionReport) setRepetitionReport(s.generation_metrics.repetitionReport);
        }
        if (s.outline) setScriptOutline(s.outline);
        if (s.scene_descriptions) setSceneDescriptions(s.scene_descriptions);
        if (s.model_used) setSelectedModel(s.model_used);
      } else {
        // Fallback: check project object
        const pRes = await api.getProject(id);
        const p = pRes.data;
        if (p?.scripts && p.scripts.length > 0) {
          const s = p.scripts[0];
          setHook(s.hook || '');
          setContext(s.biblical_context || '');
          setNarrative(s.core_narrative || '');
          setTheology(s.theological_insight || '');
          setApplication(s.practical_application || '');
          setCta(s.call_to_action || '');
          setFullNarration(s.full_narration_text || '');
        }
      }
    } catch (e) {
      console.warn('Load script notice:', e.message);
    }
  };

  const handleModelChange = async (newModel) => {
    setSelectedModel(newModel);
    try {
      await api.setOllamaModel(newModel);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePullModel = async () => {
    if (!pullModelName.trim()) return;
    setIsPulling(true);
    setErrorMessage(null);
    try {
      await api.pullOllamaModel(pullModelName.trim());
      setPullModelName('');
      await checkOllama();
    } catch (e) {
      setErrorMessage(`Failed to pull model: ${e.message}`);
    } finally {
      setIsPulling(false);
    }
  };

  const handleGenerateScript = async (engine = 'ollama') => {
    if (!currentProject) return;
    setGenerating(true);
    setErrorMessage(null);
    setGenStep(engine === 'ollama' ? `Validating chapter and calling Ollama (${selectedModel})...` : 'Building from Chapter Knowledge Engine...');

    try {
      const res = await api.generateScriptWithOllama(currentProject.id, {
        engine,
        model: selectedModel,
        temperature,
        top_p: topP,
        num_ctx: numCtx,
        num_predict: numPredict,
        repeat_penalty: repeatPenalty
      });

      if (res.success && res.data) {
        const s = res.data.script;
        setHook(s.hook || '');
        setContext(s.biblical_context || '');
        setNarrative(s.core_narrative || '');
        setTheology(s.theological_insight || '');
        setApplication(s.practical_application || '');
        setCta(s.call_to_action || '');
        setFullNarration(s.full_text || '');
        setIsApproved(false);

        if (res.data.performance) setPerfMetrics(res.data.performance);
        if (res.data.sceneDescriptions) setSceneDescriptions(res.data.sceneDescriptions);
        if (res.data.outline) setScriptOutline(res.data.outline);
        if (res.data.repetitionReport) setRepetitionReport(res.data.repetitionReport);
      }
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setGenerating(false);
      setGenStep('');
    }
  };

  const handleSaveEdits = async () => {
    if (!currentProject) return;
    try {
      const res = await api.updateProjectScript(currentProject.id, {
        hook,
        biblical_context: context,
        core_narrative: narrative,
        theological_insight: theology,
        practical_application: application,
        call_to_action: cta,
        full_narration_text: fullNarration || [hook, context, narrative, theology, application, cta].filter(Boolean).join('\n\n')
      });
      if (res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      setErrorMessage(`Failed to save edits: ${e.message}`);
    }
  };

  const handleApproveScript = async () => {
    if (!currentProject) return;
    try {
      const res = await api.approveProjectScript(currentProject.id);
      if (res.success) {
        setIsApproved(true);
      }
    } catch (e) {
      setErrorMessage(`Failed to approve script: ${e.message}`);
    }
  };

  const calculatedFullScript = fullNarration || `${hook}\n\n${context}\n\n${narrative}\n\n${theology}\n\n${application}\n\n${cta}`.trim();
  const wordCount = calculatedFullScript ? calculatedFullScript.split(/\s+/).length : 0;
  const estimatedSeconds = Math.round((wordCount / 135) * 60);
  const isShorts = currentProject?.format === 'SHORTS';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Header & Project Selector */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Ollama AI Script Studio</span>
            </h2>
            {isApproved ? (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Script Approved by Director</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Pending Director Approval</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Local Ollama pipeline • Chapter-by-Chapter Scripture Analysis • Sequential Generation • Zero Silent Substitutions
          </p>
        </div>

        {/* Project Selector & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {projects.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Project:</span>
              <select
                value={currentProject?.id}
                onChange={(e) => onSelectProject(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 max-w-xs truncate"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title} ({p.format})</option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => handleGenerateScript('ollama')}
            disabled={generating}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50 transition-all"
          >
            <Zap className={`w-4 h-4 ${generating ? 'animate-spin' : 'fill-slate-950'}`} />
            <span>{generating ? 'Generating with Ollama...' : `Generate Script (${selectedModel})`}</span>
          </button>
        </div>
      </div>

      {/* 2. Ollama Status & Model Control Bar (Requirements 1, 2, 3, 10) */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Indicator */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${ollamaStatus.running ? 'bg-emerald-400 shadow-md shadow-emerald-500/40 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-xs font-bold text-slate-200">
              Ollama API: <code className="text-amber-300 font-mono text-[11px]">{ollamaStatus.url}</code>
            </span>
          </div>

          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
            ollamaStatus.running ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950/60 text-rose-300 border border-rose-500/30'
          }`}>
            {ollamaStatus.running ? `ONLINE (v${ollamaStatus.version || '0.1'})` : 'OFFLINE'}
          </span>

          <button
            onClick={checkOllama}
            title="Refresh Ollama Connection"
            className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Model Switcher & Pull Input */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Model:</span>
          </span>

          <select
            value={selectedModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400"
          >
            <option value="qwen3:4b">qwen3:4b (Default Recommended)</option>
            <option value="qwen3:8b">qwen3:8b (Alternative High Precision)</option>
            {installedModels
              .filter(m => m.name !== 'qwen3:4b' && m.name !== 'qwen3:8b')
              .map(m => (
                <option key={m.name} value={m.name}>{m.name} ({m.sizeGB} GB)</option>
              ))}
          </select>

          {/* Quick Pull / Install Model */}
          <div className="flex items-center gap-1.5 ml-2">
            <input
              type="text"
              placeholder="e.g. qwen3:4b"
              value={pullModelName}
              onChange={(e) => setPullModelName(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 w-28 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handlePullModel}
              disabled={isPulling || !pullModelName.trim()}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold disabled:opacity-40"
            >
              {isPulling ? 'Pulling...' : 'Pull'}
            </button>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 ml-1"
            title="Toggle Generation Hyperparameters"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hyperparameters Settings Accordion */}
      {showSettings && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs animate-in fade-in">
          <div>
            <label className="text-slate-400 block mb-1">Temperature</label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="1.5"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Top P</label>
            <input
              type="number"
              step="0.05"
              min="0.1"
              max="1.0"
              value={topP}
              onChange={(e) => setTopP(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Context Length (num_ctx)</label>
            <input
              type="number"
              step="1024"
              value={numCtx}
              onChange={(e) => setNumCtx(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Max Tokens (num_predict)</label>
            <input
              type="number"
              step="500"
              value={numPredict}
              onChange={(e) => setNumPredict(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
            />
          </div>
          <div>
            <label className="text-slate-400 block mb-1">Repeat Penalty</label>
            <input
              type="number"
              step="0.05"
              value={repeatPenalty}
              onChange={(e) => setRepeatPenalty(parseFloat(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono"
            />
          </div>
        </div>
      )}

      {/* Error & Diagnostic Banner (Requirement 9 & 10) */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-300">
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Ollama Generation Error (Silent Substitution Blocked):</span>
          </div>
          <p className="font-mono text-[11px] bg-slate-950/70 p-2.5 rounded border border-rose-900/50">
            {errorMessage}
          </p>
          <div className="flex items-center gap-3 text-slate-400">
            <span>Troubleshooting:</span>
            <code className="text-amber-300 bg-slate-900 px-2 py-0.5 rounded text-[11px]">ollama serve</code>
            <span>or</span>
            <code className="text-amber-300 bg-slate-900 px-2 py-0.5 rounded text-[11px]">ollama run {selectedModel}</code>
            <button
              onClick={() => handleGenerateScript('knowledge')}
              className="ml-auto px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
            >
              Use Offline Canon Knowledge Engine
            </button>
          </div>
        </div>
      )}

      {/* Generation Status Progress */}
      {generating && (
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 flex items-center gap-3 animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          <span>{genStep || 'Generating biblical script sequentially...'}</span>
        </div>
      )}

      {/* Performance Metrics Bar (Requirement 9) */}
      {perfMetrics && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200">Model Performance Metrics:</span>
            <span className="font-mono text-amber-300">{perfMetrics.model}</span>
          </div>

          <div className="flex items-center gap-6 font-mono text-[11px] text-slate-300">
            <div>
              <span className="text-slate-500 mr-1.5">Speed:</span>
              <strong className="text-emerald-400">{perfMetrics.tokensPerSecond || '0'} tokens/s</strong>
            </div>
            <div>
              <span className="text-slate-500 mr-1.5">Eval Tokens:</span>
              <strong className="text-slate-200">{perfMetrics.totalEvalCount || perfMetrics.evalCount || 0}</strong>
            </div>
            <div>
              <span className="text-slate-500 mr-1.5">Duration:</span>
              <strong className="text-slate-200">{perfMetrics.evalDurationSeconds || (perfMetrics.totalDurationMs ? (perfMetrics.totalDurationMs/1000).toFixed(1) : 0)}s</strong>
            </div>
          </div>
        </div>
      )}

      {/* Stage 5 Repetition Audit Banner */}
      {repetitionReport && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
          repetitionReport.passed
            ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-bold">Stage 5 Repetition Audit:</span>
            <span>
              {repetitionReport.passed 
                ? 'PASSED (0 duplicate sentences detected across sequential sections)' 
                : `${repetitionReport.duplicateSentences?.length || 0} duplicate sentence(s) flagged`}
            </span>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-slate-900 border border-slate-700 font-semibold">
            Status: {repetitionReport.status}
          </span>
        </div>
      )}

      {/* Sub-Tabs: Narration Script vs Outline vs Scene Descriptions */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('script')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'script'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Narration Script (Continuous Text)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('outline')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'outline'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Pass 1 Chapter Outline ({scriptOutline?.sections?.length || 5} Sections)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('scenes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeSubTab === 'scenes'
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Scene Descriptions ({sceneDescriptions?.scenes?.length || (isShorts ? 6 : 24)} Scenes)</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveEdits}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{saveSuccess ? 'Saved!' : 'Save Script Edits'}</span>
          </button>

          <button
            onClick={handleApproveScript}
            disabled={isApproved}
            className={`px-4 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-md transition-all ${
              isApproved
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isApproved ? 'Approved ✓' : 'Approve Script'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'script' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: 6-Section Documentary Script Editor */}
          <div className="lg:col-span-2 space-y-4">
            {/* 1. Hook */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  1. Opening Hook ({isShorts ? 'First 3–5s' : 'Cinematic Prelude'})
                </label>
                <span className="text-[11px] text-slate-400">Immediate audience retention</span>
              </div>
              <textarea
                rows={2}
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
              />
            </div>

            {/* 2. Scripture Context */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  2. Scripture Context & Verse References
                </label>
                <span className="text-[11px] text-emerald-400">Public Domain Translation</span>
              </div>
              <textarea
                rows={2}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
              />
            </div>

            {/* 3. Core Narrative */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  3. Core Narrative & Ancient World Exposition
                </label>
                <span className="text-[11px] text-slate-400">Unique to this chapter</span>
              </div>
              <textarea
                rows={isShorts ? 4 : 7}
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
              />
            </div>

            {/* 4. Theological Depth & Jesus Connection */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-amber-300 uppercase tracking-wider">
                  4. Theological Teaching & Jesus Christ Revealed
                </label>
                <span className="text-[11px] text-amber-400/90 font-semibold">Includes Jesus Scene</span>
              </div>
              <textarea
                rows={isShorts ? 3 : 6}
                value={theology}
                onChange={(e) => setTheology(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
              />
            </div>

            {/* 5. Application & CTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  5. Practical Life Application
                </label>
                <textarea
                  rows={3}
                  value={application}
                  onChange={(e) => setApplication(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                />
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  6. Reverent Call To Action (CTA)
                </label>
                <textarea
                  rows={3}
                  value={cta}
                  onChange={(e) => setCta(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-amber-500 leading-relaxed font-sans"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Duration, Verification & Export */}
          <div className="space-y-4">
            {/* Duration & Pacing Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Script Duration & Pacing
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Total Words</span>
                  <div className="text-xl font-bold text-slate-100 mt-0.5">{wordCount}</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Target Duration</span>
                  <div className="text-xl font-bold text-amber-400 mt-0.5">
                    {isShorts ? `~${estimatedSeconds}s (Shorts)` : `${Math.floor(estimatedSeconds / 60)}m ${estimatedSeconds % 60}s`}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                💡 <strong>Documentary Pacing (~135 wpm):</strong> Pure narration track with zero background music. Designed for clear, reverent listening.
              </div>

              {/* Approval status banner */}
              <div className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
                isApproved 
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200' 
                  : 'bg-amber-950/20 border-amber-500/40 text-amber-200'
              }`}>
                {isApproved ? <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" /> : <ShieldCheck className="w-5 h-5 text-amber-400 flex-shrink-0" />}
                <div>
                  <div className="font-bold">{isApproved ? 'Script Approved by Director' : 'Awaiting Director Review'}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {isApproved ? 'Ready for voice synthesis and video production' : 'Review scripture quotations before voice synthesis'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('accuracy-checker')}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify 10-Point Safety Gate →</span>
              </button>
            </div>

            {/* Standardized Package Info */}
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2 text-slate-400">
              <div className="flex items-center gap-2 text-amber-400 font-semibold">
                <HardDrive className="w-4 h-4" />
                <span>Dual File Storage (Requirement 7)</span>
              </div>
              <p className="leading-relaxed">
                Narration script is exported to <code className="text-slate-200">Script.txt</code> and storyboard cues to <code className="text-slate-200">Scene_Descriptions.json</code> in <code className="text-amber-300 font-mono text-[11px]">ByBibleWisdom/{currentProject?.bible_book || 'Genesis'}/Chapter_{String(currentProject?.chapter_start || 1).padStart(2, '0')}/</code>.
              </p>
            </div>
          </div>
        </div>
      ) : activeSubTab === 'outline' ? (
        /* Tab 2: Pass 1 Chapter Outline (Stage 5 Two-Pass) */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">
                Pass 1 Chapter Outline Blueprint
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                The thematic framework driving sequential section writing. Guarantees scripts maintain theological depth without thinning or repeating.
              </p>
            </div>

            <div className="text-xs text-amber-400 font-mono font-semibold">
              Sections: {scriptOutline?.sections?.length || 5}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(scriptOutline?.sections || []).map((sec, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400">Section {sec.section_number}: {sec.section_title}</span>
                  <span className="font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{sec.verse_range}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Theological Theme:</span>
                  {sec.theological_theme}
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-amber-200/90 font-mono">
                  <span className="text-[10px] uppercase font-bold text-amber-500/80 block mb-1">Hebrew / Greek Word Insight:</span>
                  {sec.hebrew_greek_word || 'N/A'}
                </div>

                {sec.key_exposition_points && (
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Key Exposition Points:</span>
                    <ul className="text-[11px] text-slate-400 list-disc list-inside space-y-1">
                      {sec.key_exposition_points.map((pt, pIdx) => (
                        <li key={pIdx}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Tab 3: Scene Descriptions & Storyboard View (Requirement 7) */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200">
                Visual Storyboard & Scene Cues (Stored Separately from Script)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Each scene includes duration, camera motion (Ken Burns effect), lighting atmosphere, and image prompt.
              </p>
            </div>

            <div className="text-xs text-amber-400 font-mono">
              Total Scenes: {sceneDescriptions?.scenes?.length || (isShorts ? 6 : 24)}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(sceneDescriptions?.scenes || []).map((sc) => (
              <div key={sc.sceneNumber} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400">Scene #{sc.sceneNumber}</span>
                  <span className="font-mono text-slate-400">{sc.durationSeconds}s • {sc.cameraMotion}</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Visual Atmosphere:</span>
                  {sc.visualDescription}
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-amber-200/80 leading-relaxed font-mono">
                  <span className="text-[10px] uppercase font-bold text-amber-500/80 block mb-1">Narration Segment:</span>
                  "{sc.narration?.slice(0, 160)}..."
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
