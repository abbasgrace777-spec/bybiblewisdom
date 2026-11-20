import React, { useState, useEffect } from 'react';
import { X, Play, CheckCircle2, AlertCircle, Clock, Video, UploadCloud, Film, Eye, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function OneClickProductionModal({ isOpen, onClose, project, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepName, setStepName] = useState('Initializing Production Pipeline...');
  const [percent, setPercent] = useState(0);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [awaitingVisuals, setAwaitingVisuals] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  useEffect(() => {
    if (isOpen && project && !isExecuting && !result) {
      if (project.output_video_path || project.status === 'RENDERED') {
        setIsExecuting(false);
        setPercent(100);
        setCurrentStep(10);
        setStepName('Production Finished Successfully!');
        setResult({
          videoUrl: `/storage/projects/${project.id}/output/final_video.mp4`,
          thumbnailUrl: `/storage/projects/${project.id}/output/thumbnail.jpg`,
          durationSeconds: project.actual_duration_seconds || project.target_duration_seconds || 1440
        });
      } else {
        runPipeline();
      }
    }
  }, [isOpen, project]);

  async function runPipeline(extraParams = {}) {
    setIsExecuting(true);
    setError(null);
    setAwaitingVisuals(null);
    setLogs([]);
    setCurrentStep(1);
    setPercent(10);
    setStepName('Validating Biblical Topic & Setup...');

    try {
      // Connect to EventSource SSE stream with optional parameters
      const queryParams = new URLSearchParams(extraParams).toString();
      const streamUrl = `/api/projects/${project.id}/pipeline/stream${queryParams ? `?${queryParams}` : ''}`;
      const eventSource = new EventSource(streamUrl);

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.status === 'PROGRESS') {
            const p = data.progress;
            setCurrentStep(p.step);
            setStepName(p.stepName);
            setPercent(p.percent);
            setLogs(prev => [...prev, `[Step ${p.step}/10] ${p.stepName}`]);
            if (p.details?.status === 'AWAITING_VISUALS') {
              setIsExecuting(false);
              setAwaitingVisuals(p.details);
            }
          } else if (data.status === 'AWAITING_VISUALS' || data.result?.status === 'AWAITING_VISUALS') {
            eventSource.close();
            setIsExecuting(false);
            setCurrentStep(5);
            setPercent(60);
            setStepName('Awaiting Scene Visuals (Mode B Manual Import)');
            setAwaitingVisuals(data.result || data);
            setLogs(prev => [...prev, '[Step 5/10] Paused: Awaiting Scene Visuals in Mode B']);
          } else if (data.status === 'COMPLETE') {
            eventSource.close();
            setIsExecuting(false);
            setPercent(100);
            setCurrentStep(10);
            setStepName('Production Finished Successfully!');
            setResult(data.result);
            if (onComplete) onComplete(data.result);
          } else if (data.status === 'ERROR') {
            eventSource.close();
            setIsExecuting(false);
            setError(data.error);
          }
        } catch (e) {
          console.error('Error parsing SSE:', e);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        // Resilient polling fallback: checks status every 3s so network hiccups never halt the UI
        let attempts = 0;
        let lastProgress = 0;
        let lastStep = 0;
        let staleCount = 0;
        const poller = setInterval(async () => {
          attempts++;
          try {
            const pRes = await api.getProject(project.id);
            const p = pRes.data;
            if (p.current_step) setCurrentStep(p.current_step);
            if (p.current_step_name) setStepName(p.current_step_name);
            if (p.progress_percent) setPercent(p.progress_percent);

            // Reset stall counter whenever progress advances or step changes
            if (p.progress_percent !== lastProgress || p.current_step !== lastStep) {
              lastProgress = p.progress_percent;
              lastStep = p.current_step;
              staleCount = 0;
            } else {
              staleCount++;
            }

            if (p.status === 'AWAITING_VISUALS') {
              clearInterval(poller);
              setIsExecuting(false);
              setCurrentStep(5);
              setPercent(60);
              setStepName('Awaiting Scene Images (Mode B Manual Import)');
              setAwaitingVisuals(p);
            } else if (p.status === 'RENDERED' || p.output_video_path) {
              clearInterval(poller);
              setIsExecuting(false);
              setPercent(100);
              setCurrentStep(10);
              setStepName('Production Finished Successfully!');
              const resData = {
                videoUrl: `/storage/projects/${p.id}/output/final_video.mp4`,
                thumbnailUrl: `/storage/projects/${p.id}/output/thumbnail.jpg`,
                durationSeconds: p.actual_duration_seconds || p.target_duration_seconds || 1440
              };
              setResult(resData);
              if (onComplete) onComplete(resData);
            } else if (p.status === 'FAILED') {
              clearInterval(poller);
              setIsExecuting(false);
              setError(p.error_message || 'Production halted. Please review errors and retry.');
            } else if (staleCount > 200) { // 10 minutes with zero activity
              clearInterval(poller);
              setIsExecuting(false);
              setError('Production reached maximum idle threshold with no status change. Please check Video Production tab.');
            }
          } catch (e) {
            if (attempts > 300) {
              clearInterval(poller);
              setIsExecuting(false);
              setError('Network connection lost. Please check server status.');
            }
          }
        }, 3000);
      };
    } catch (err) {
      setIsExecuting(false);
      setError(err.message);
    }
  }

  async function handleUploadYouTube() {
    if (!project) return;
    try {
      const res = await api.uploadYouTube(project.id);
      if (res.success) {
        setUploaded(true);
      }
    } catch (err) {
      alert('Upload error: ' + err.message);
    }
  }

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Play className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{project.title}</h3>
              <p className="text-xs text-amber-400/90 font-medium">
                {project.format} • {project.category.replace('_', ' ')} • One-Click Pipeline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isExecuting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Progress Bar & Current Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-2">
                {isExecuting && <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
                <span>{stepName}</span>
              </span>
              <span className="font-bold text-amber-400">{percent}%</span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
              <div
                style={{ width: `${percent}%` }}
                className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-300"
              />
            </div>
          </div>

          {/* Stepper Indicators (1 to 10) */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 text-center">
            {[
              'Canon',
              'Script',
              'Gate',
              'Voice',
              'Visuals',
              'FFmpeg',
              'Thumb',
              'SEO',
              'Package',
              'Ready'
            ].map((name, i) => {
              const stepIdx = i + 1;
              const isPast = currentStep > stepIdx;
              const isCur = currentStep === stepIdx;
              return (
                <div
                  key={name}
                  className={`p-2 rounded-lg border text-[10px] font-bold transition-all ${
                    isPast
                      ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                      : isCur
                      ? 'border-amber-500 bg-amber-500/20 text-amber-300 shadow-sm'
                      : 'border-slate-800/80 bg-slate-950/40 text-slate-500'
                  }`}
                >
                  <div>{stepIdx}</div>
                  <div className="truncate mt-0.5">{name}</div>
                </div>
              );
            })}
          </div>

          {/* Error Message if any */}
          {error && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 flex flex-col gap-3 text-xs text-rose-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Production Halted:</strong>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                {(error.includes('Fallback') || error.includes('fallback') || error.includes('Procedural') || error.includes('BLOCKED')) && (
                  <>
                    <button
                      onClick={() => runPipeline({ regenerateFallbacks: 'true' })}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Regenerate Scene(s) with AI</span>
                    </button>
                    <button
                      onClick={() => runPipeline({ confirmFallback: 'true' })}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Proceed with Fallback Imagery</span>
                    </button>
                  </>
                )}
                {(error.includes('Visual asset') || error.includes('scene') || error.includes('image')) && (
                  <>
                    <button
                      onClick={() => runPipeline({ autoFillFineArt: 'true' })}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Assemble with Curated Biblical Art</span>
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        window.location.hash = '#/images';
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Open Image Studio</span>
                    </button>
                  </>
                )}
                {error.includes('Ollama') && (
                  <button
                    onClick={() => runPipeline({ allowFallback: 'true', engine: 'knowledge' })}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Continue with Built-in Biblical Knowledge Engine</span>
                  </button>
                )}
                <button
                  onClick={() => runPipeline({})}
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Production Pipeline</span>
                </button>
              </div>
            </div>
          )}

          {/* Mode B Awaiting Visuals Banner */}
          {awaitingVisuals && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col gap-3 text-xs text-amber-200">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="block font-semibold text-slate-100 text-sm">
                    Script & Voice Narration Ready!
                  </strong>
                  <p className="text-amber-200/90 leading-relaxed">
                    Mode B (Manual Import) is active. Please open the <strong>Image Studio</strong> tab to view the standardized prompts and import/upload images for each scene. Once scene images are uploaded, click Assemble Final Video below.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <button
                  onClick={() => {
                    onClose();
                    window.location.hash = '#images';
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>Open Image Studio</span>
                </button>
                <button
                  onClick={() => runPipeline()}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Assemble Final Video (Steps 6–10)</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Progress Logs Console */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 h-28 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <span className="text-slate-600">Initializing automated workflow engines...</span>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-amber-500">▶</span>
                  <span>{log}</span>
                </div>
              ))
            )}
          </div>

          {/* Video Preview when Finished */}
          {result && (
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Video Rendered & Verified!</h4>
                  <p className="text-xs text-slate-400">
                    Duration: {result.durationSeconds}s • Resolution: {project.format === 'SHORTS' ? '1080×1920' : '1920×1080'} • Subtitles Embedded
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={result.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </a>

                <button
                  onClick={handleUploadYouTube}
                  disabled={uploaded}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{uploaded ? 'Uploaded as Private' : 'Upload to YouTube (Private)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Automated production runs on drive D:\bible
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
          >
            {result ? 'Done' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
