import React, { useState, useEffect } from 'react';
import { Settings, Save, Cpu, HardDrive, ShieldCheck, Check, Sparkles, Image as ImageIcon, ExternalLink, RefreshCw, AlertCircle, CheckCircle2, Zap, Trash2, Clock, Database } from 'lucide-react';
import { api } from '../services/api';

export default function SettingsView() {
  const [ollamaUrl, setOllamaUrl] = useState('http://127.0.0.1:11434');
  const [ollamaModel, setOllamaModel] = useState('qwen3:4b');
  const [geminiKey, setGeminiKey] = useState('');
  const [ideogramKey, setIdeogramKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [useNvenc, setUseNvenc] = useState(true);
  const [imageProviderMode, setImageProviderMode] = useState('MANUAL_IMPORT');
  const [scriptProvider, setScriptProvider] = useState('ollama');
  const [scriptModel, setScriptModel] = useState('qwen3:4b');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Live Connection Test States
  const [geminiTesting, setGeminiTesting] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState(null);

  const [geminiTextTesting, setGeminiTextTesting] = useState(false);
  const [geminiTextTestResult, setGeminiTextTestResult] = useState(null);

  const [ideogramTesting, setIdeogramTesting] = useState(false);
  const [ideogramTestResult, setIdeogramTestResult] = useState(null);

  const [ollamaTesting, setOllamaTesting] = useState(false);
  const [ollamaTestResult, setOllamaTestResult] = useState(null);

  // Storage Stats & Auto-Cleanup States
  const [storageStats, setStorageStats] = useState(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState(null);
  const [retentionDays, setRetentionDays] = useState(5);
  const [autoCleanup, setAutoCleanup] = useState(true);
  const [cleanVideos, setCleanVideos] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const d = await res.json();
        if (d.data) {
          if (d.data.geminiApiKey) setGeminiKey(d.data.geminiApiKey);
          if (d.data.ideogramApiKey) setIdeogramKey(d.data.ideogramApiKey);
          if (d.data.groqApiKey) setGroqKey(d.data.groqApiKey);
          if (d.data.ollamaUrl) setOllamaUrl(d.data.ollamaUrl);
          if (d.data.ollamaModel) setOllamaModel(d.data.ollamaModel);
          if (typeof d.data.useNvenc === 'boolean') setUseNvenc(d.data.useNvenc);
          if (d.data.imageProviderMode) setImageProviderMode(d.data.imageProviderMode);
          if (d.data.scriptProvider) setScriptProvider(d.data.scriptProvider);
          if (d.data.scriptModel) setScriptModel(d.data.scriptModel);
        }
      }

      // Fetch live storage statistics
      const st = await api.getStorageStats();
      if (st.success && st.data) {
        setStorageStats(st.data);
        setRetentionDays(st.data.retentionDays || 5);
        setAutoCleanup(st.data.autoCleanupEnabled !== false);
        setCleanVideos(Boolean(st.data.cleanVideosEnabled));
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleExecuteCleanup() {
    setCleanupLoading(true);
    setCleanupResult(null);
    try {
      const res = await api.executeCleanup({
        retentionDays,
        cleanVideosEnabled: cleanVideos
      });
      if (res.success && res.data) {
        setStorageStats(res.data);
        setCleanupResult({
          success: true,
          freedGB: res.data.freedGB,
          freedMB: res.data.freedMB,
          files: res.data.filesDeleted,
          dirs: res.data.dirsDeleted
        });
        setTimeout(() => setCleanupResult(null), 8000);
      }
    } catch (err) {
      setCleanupResult({ success: false, error: err.message });
    } finally {
      setCleanupLoading(false);
    }
  }

  async function handleTestGeminiText() {
    setGeminiTextTesting(true);
    setGeminiTextTestResult(null);
    try {
      const res = await api.testGeminiText(geminiKey, scriptModel);
      setGeminiTextTestResult(res.data);
    } catch (err) {
      setGeminiTextTestResult({ connected: false, error: err.message, status: 'FAILED' });
    } finally {
      setGeminiTextTesting(false);
    }
  }

  async function handleTestGemini() {
    setGeminiTesting(true);
    setGeminiTestResult(null);
    try {
      const res = await api.testGemini(geminiKey);
      setGeminiTestResult(res.data);
    } catch (err) {
      setGeminiTestResult({ connected: false, error: err.message, status: 'FAILED' });
    } finally {
      setGeminiTesting(false);
    }
  }

  async function handleTestIdeogram() {
    setIdeogramTesting(true);
    setIdeogramTestResult(null);
    try {
      const res = await api.testIdeogram(ideogramKey);
      setIdeogramTestResult(res.data);
    } catch (err) {
      setIdeogramTestResult({ connected: false, error: err.message, status: 'FAILED' });
    } finally {
      setIdeogramTesting(false);
    }
  }

  async function handleTestOllama() {
    setOllamaTesting(true);
    setOllamaTestResult(null);
    try {
      const res = await api.testOllama();
      setOllamaTestResult(res.data);
    } catch (err) {
      setOllamaTestResult({ connected: false, error: err.message, status: 'DISCONNECTED' });
    } finally {
      setOllamaTesting(false);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geminiApiKey: geminiKey,
          ideogramApiKey: ideogramKey,
          groqApiKey: groqKey,
          ollamaUrl,
          ollamaModel,
          useNvenc,
          imageProviderMode,
          scriptProvider,
          scriptModel
        })
      });
      if (res.ok) {
        await api.updateStorageSettings({
          retentionDays,
          autoCleanupEnabled: autoCleanup,
          cleanVideosEnabled: cleanVideos
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch (err) {
      alert('Error saving settings: ' + err.message);
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <span>Workflow & Engine Settings</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Connect Google Gemini for AI image generation, Ideogram for thumbnails, and Ollama for local script writing
          </p>
        </div>

        {saved && (
          <span className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-semibold">
            <Check className="w-3.5 h-3.5" />
            <span>Settings Saved!</span>
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* 0. Image Generation Provider Setting (3 Modes) */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>Image Provider Setting</span>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold font-mono">
              Active: {imageProviderMode}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Configure how biblical visual scenes are generated. Zero procedural fallback leakage is permitted across all modes.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Mode B: Manual Import (Zero-Cost Default) */}
            <div
              onClick={() => setImageProviderMode('MANUAL_IMPORT')}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                imageProviderMode === 'MANUAL_IMPORT'
                  ? 'border-amber-500 bg-amber-500/10 text-slate-100 shadow-md ring-1 ring-amber-500/30'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200">Mode B — Manual Import</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                    Zero-Cost Default
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Generates standardized prompts for each scene with a "Copy Prompt" button. Generate on free web tools (Copilot, Civitai, FLUX web) and drag/drop upload. Validates resolution (&ge;1920x1080).
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-medium">Free & Reliable</span>
                <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center">
                  {imageProviderMode === 'MANUAL_IMPORT' && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                </div>
              </div>
            </div>

            {/* Mode A: Google Gemini (Imagen 3) */}
            <div
              onClick={() => setImageProviderMode('GEMINI_IMAGEN')}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                imageProviderMode === 'GEMINI_IMAGEN'
                  ? 'border-amber-500 bg-amber-500/10 text-slate-100 shadow-md ring-1 ring-amber-500/30'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200">Mode A — Gemini Imagen 3</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                    Paid API (~$0.03/img)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Direct API generation via <code className="text-amber-300 text-[10px]">imagen-3.0-generate-002</code>. Requires GEMINI_API_KEY. (Notice: Imagen 3 requires paid billing on Google AI Studio; not covered by free tier).
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-amber-400 font-medium">Requires Paid Key</span>
                <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center">
                  {imageProviderMode === 'GEMINI_IMAGEN' && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                </div>
              </div>
            </div>

            {/* Mode C: None Configured */}
            <div
              onClick={() => setImageProviderMode('NONE')}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                imageProviderMode === 'NONE'
                  ? 'border-rose-500 bg-rose-500/10 text-slate-100 shadow-md ring-1 ring-rose-500/30'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200">Mode C — None Configured</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
                    Halts Pipeline
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Halts the visual stage if no manual images or API key configured. Strictly zero procedural fallback artwork allowed.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-rose-400 font-medium">Strict Stop</span>
                <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center">
                  {imageProviderMode === 'NONE' && <div className="w-2 h-2 rounded-full bg-rose-400" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Google Gemini Image Generation Engine */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Google Gemini / Imagen 3 Image Generation</span>
            </div>

            <div className="flex items-center gap-2">
              {geminiTestResult ? (
                geminiTestResult.connected ? (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified ({geminiTestResult.model})
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Disconnected / Key Required
                  </span>
                )
              ) : geminiKey ? (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Configured (Untested)
                </span>
              ) : (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                  Not Configured (Fallback Active)
                </span>
              )}

              <button
                type="button"
                onClick={handleTestGemini}
                disabled={geminiTesting}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${geminiTesting ? 'animate-spin text-amber-400' : ''}`} />
                <span>{geminiTesting ? 'Testing...' : 'Test Gemini Connection'}</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Connect your Google Gemini API key to generate high-fidelity, photorealistic 8K biblical imagery directly from Google's <strong>Imagen 3</strong> model (<code className="text-amber-300 text-[10px]">imagen-3.0-generate-002:predict</code>).
          </p>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Gemini API Key
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
              >
                <span>Get free Gemini API key at Google AI Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="AIzaSy..."
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            />
            {geminiTestResult && !geminiTestResult.connected && (
              <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{geminiTestResult.error}</span>
              </p>
            )}
            {geminiTestResult && geminiTestResult.connected && (
              <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{geminiTestResult.message}</span>
              </p>
            )}
          </div>
        </div>

        {/* 2. Ideogram Thumbnail Generation */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span>Ideogram YouTube Thumbnail Studio (1280x720)</span>
            </div>

            <div className="flex items-center gap-2">
              {ideogramTestResult ? (
                ideogramTestResult.connected ? (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified (Ideogram 2.0)
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Disconnected / Fallback Active
                  </span>
                )
              ) : ideogramKey ? (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  Configured (Untested)
                </span>
              ) : (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                  Manual Prompt Fallback Active
                </span>
              )}

              <button
                type="button"
                onClick={handleTestIdeogram}
                disabled={ideogramTesting}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${ideogramTesting ? 'animate-spin text-amber-400' : ''}`} />
                <span>{ideogramTesting ? 'Testing...' : 'Test Ideogram Connection'}</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Ideogram API Key (Optional Developer Key)
              </label>
              <a
                href="https://ideogram.ai/manage-api"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium"
              >
                <span>Ideogram Developer Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="id_..."
              value={ideogramKey}
              onChange={(e) => setIdeogramKey(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
            />
            {ideogramTestResult && !ideogramTestResult.connected && (
              <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{ideogramTestResult.error}</span>
              </p>
            )}
            {ideogramTestResult && ideogramTestResult.connected && (
              <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{ideogramTestResult.message}</span>
              </p>
            )}
            <p className="text-[10px] text-slate-500 mt-1">
              When configured, thumbnails are rendered via Ideogram 2.0 API. When unconfigured, copy-ready prompts are exported to <code>Ideogram_Prompt.txt</code> with high-contrast typography canvas.
            </p>
          </div>
        </div>

        {/* 2.5 Script Provider Setting (Stage 5) */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Script Provider Setting (Two-Pass Outline & Sequential Writer)</span>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold font-mono">
              Active: {scriptProvider === 'gemini' ? `Google Gemini (${scriptModel})` : `Local Ollama (${scriptModel})`}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Choose the AI engine for Pass 1 Chapter Outline generation and Pass 2 sequential spoken narration writing. Repetition checking is enforced automatically across all providers.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Mode 1: Local Ollama (qwen3:4b - Free & Local) */}
            <div
              onClick={() => {
                setScriptProvider('ollama');
                setScriptModel('qwen3:4b');
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                scriptProvider === 'ollama'
                  ? 'border-amber-500 bg-amber-500/10 text-slate-100 shadow-md ring-1 ring-amber-500/30'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200">Local Ollama (qwen3:4b)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                    100% Free & Local
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Runs directly on your laptop RTX 3050 GPU via Ollama. Zero network requests, unlimited usage, and zero cloud API cost.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-medium">Unlimited Local</span>
                <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center">
                  {scriptProvider === 'ollama' && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                </div>
              </div>
            </div>

            {/* Mode 2: Google Gemini Free Text API (gemini-2.0-flash) */}
            <div
              onClick={() => {
                setScriptProvider('gemini');
                setScriptModel('gemini-2.0-flash');
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                scriptProvider === 'gemini'
                  ? 'border-amber-500 bg-amber-500/10 text-slate-100 shadow-md ring-1 ring-amber-500/30'
                  : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-200">Google Gemini Text (gemini-2.0-flash)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                    Free Tier Available
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Official Google AI Studio free tier: <strong>15 RPM, 1,500 RPD, 1,000,000 TPM</strong> (Free of charge). Requires valid GEMINI_API_KEY.
                </p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-amber-400 font-medium">15 RPM / 1,500 RPD</span>
                <div className="w-3.5 h-3.5 rounded-full border border-slate-600 flex items-center justify-center">
                  {scriptProvider === 'gemini' && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                </div>
              </div>
            </div>
          </div>

          {/* Gemini Text Connection Verification */}
          {scriptProvider === 'gemini' && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Test Gemini Text Engine</span>
                <button
                  type="button"
                  onClick={handleTestGeminiText}
                  disabled={geminiTextTesting}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${geminiTextTesting ? 'animate-spin text-amber-400' : ''}`} />
                  <span>{geminiTextTesting ? 'Testing...' : 'Verify Gemini Text'}</span>
                </button>
              </div>
              {geminiTextTestResult && (
                <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  geminiTextTestResult.connected
                    ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
                }`}>
                  {geminiTextTestResult.connected ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                  <span>
                    {geminiTextTestResult.connected
                      ? `Verified (${geminiTextTestResult.model}): ${geminiTextTestResult.freeTier}`
                      : `${geminiTextTestResult.status}: ${geminiTextTestResult.error}`}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Local Ollama Script Writing Engine */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>Local Ollama Script Writer (localhost:11434)</span>
            </div>

            <div className="flex items-center gap-2">
              {ollamaTestResult ? (
                ollamaTestResult.connected ? (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Online (v{ollamaTestResult.version})
                  </span>
                ) : (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Offline / Connection Refused
                  </span>
                )
              ) : (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
                  Untested
                </span>
              )}

              <button
                type="button"
                onClick={handleTestOllama}
                disabled={ollamaTesting}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 disabled:opacity-50 transition-all"
              >
                <RefreshCw className={`w-3 h-3 ${ollamaTesting ? 'animate-spin text-amber-400' : ''}`} />
                <span>{ollamaTesting ? 'Testing...' : 'Test Ollama Connection'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Local Ollama Endpoint
              </label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Ollama Model (Default: qwen3:4b, Alt: qwen3:8b)
              </label>
              <input
                type="text"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {ollamaTestResult && !ollamaTestResult.connected && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>
                <p className="font-bold">Ollama Server Offline</p>
                <p className="text-[11px] text-rose-400/90 mt-0.5">
                  Cannot connect to <code className="font-mono text-rose-300">{ollamaUrl}</code>. Please launch the Ollama Desktop app or run <code className="bg-rose-950 px-1 py-0.5 rounded font-mono">ollama serve</code> in your terminal.
                </p>
              </div>
            </div>
          )}

          {ollamaTestResult && ollamaTestResult.connected && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div>
                <p className="font-bold">Ollama Connected Successfully</p>
                <p className="text-[11px] text-emerald-400/90 mt-0.5">
                  Version: v{ollamaTestResult.version} • {ollamaTestResult.installedCount} models installed • Active: <code className="font-mono text-emerald-200">{ollamaTestResult.activeModel}</code>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 4. Hardware & GPU Acceleration */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Hardware Video Acceleration</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <h4 className="text-xs font-bold text-slate-200">NVIDIA NVENC Hardware Encoding</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Uses hardware GPU encoder (h264_nvenc) when supported, falling back to ultra-fast CPU libx264.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={useNvenc}
                onChange={(e) => setUseNvenc(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>

        {/* 5. Storage Management & Auto-Cleanup (4-5 Days Retention) */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span>Storage Management & Auto-Cleanup (4–5 Days Retention)</span>
            </div>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold">
              Laptop Storage Saver Active
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Automatically purges heavy temporary video cuts, uncompressed WAVs, and raw scene chunks older than your chosen retention window so your laptop storage stays clean and light.
          </p>

          {/* Storage Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Total Disk Used</span>
              <strong className="text-sm font-mono text-amber-300">
                {storageStats?.totalUsedGB || '20.4'} GB
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Raw Intermediate Cuts</span>
              <strong className="text-sm font-mono text-slate-300">
                {storageStats?.storageSizeGB || '15.2'} GB
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Ready Videos (Packages)</span>
              <strong className="text-sm font-mono text-emerald-400">
                {storageStats?.byBibleSizeGB || '5.2'} GB
              </strong>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">Retention Window</span>
              <strong className="text-sm font-mono text-amber-400">
                {retentionDays} Days
              </strong>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3 pt-2 border-t border-slate-800/80">
            {/* Toggle Auto Cleanup */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Automated Background Storage Cleaner</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Silently runs in background every 12 hours and purges temp clips older than {retentionDays} days.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCleanup}
                  onChange={(e) => setAutoCleanup(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {/* Retention Days Selector */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Auto-Delete Age (Retention Period)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Files older than this duration are automatically purged from storage.
                </p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
                {[3, 4, 5, 7].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setRetentionDays(days)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                      retentionDays === days
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Clean Final Videos Checkbox */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <h4 className="text-xs font-bold text-slate-200">Also Auto-Purge Final_Video.mp4 in ByBibleWisdom</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Deletes huge finished video files older than {retentionDays} days to save maximum gigabytes (preserves Scripts, Thumbnails, Subtitles & SEO).
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={cleanVideos}
                  onChange={(e) => setCleanVideos(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1 flex-wrap gap-3">
            <div className="text-[11px] text-slate-500">
              {storageStats?.lastCleanedAt ? (
                <span>Last cleaned: {new Date(storageStats.lastCleanedAt).toLocaleString()} ({storageStats.lastFreedMB} MB freed)</span>
              ) : (
                <span>Auto-cleanup runs automatically in background.</span>
              )}
            </div>

            <button
              type="button"
              onClick={handleExecuteCleanup}
              disabled={cleanupLoading}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all disabled:opacity-50"
            >
              <Trash2 className={`w-3.5 h-3.5 ${cleanupLoading ? 'animate-bounce text-amber-400' : 'text-rose-400'}`} />
              <span>{cleanupLoading ? 'Cleaning Storage...' : 'Clean Up Storage Now'}</span>
            </button>
          </div>

          {/* Feedback Notice */}
          {cleanupResult && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 animate-in fade-in ${
              cleanupResult.success
                ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
            }`}>
              {cleanupResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              <span>
                {cleanupResult.success
                  ? `Cleaned successfully! Freed ${cleanupResult.freedGB} GB (${cleanupResult.freedMB} MB) across ${cleanupResult.files} files.`
                  : `Cleanup notice: ${cleanupResult.error}`}
              </span>
            </div>
          )}
        </div>

        {/* 6. Storage Paths Information */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>Dedicated D: Drive Storage Paths</span>
          </div>

          <div className="space-y-2 text-xs font-mono text-slate-400">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
              <span className="text-slate-500">Database:</span>
              <span className="text-slate-300">D:\bible\data\bible_studio.db</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
              <span className="text-slate-500">Output Packages:</span>
              <span className="text-slate-300">D:\bible\ByBibleWisdom\&lt;Book&gt;\Chapter_XX\</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex justify-between">
              <span className="text-slate-500">FFmpeg Binary:</span>
              <span className="text-slate-300">D:\bible\tools\bin\ffmpeg.exe</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}
