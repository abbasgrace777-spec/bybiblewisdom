import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Play, CheckCircle2, AlertCircle, Clock, Video, UploadCloud, Film, 
  Eye, Sparkles, RefreshCw, Edit3, Image as ImageIcon, Check, ArrowLeft, 
  Layers, Save
} from 'lucide-react';
import { api } from '../services/api';

const MOTION_PRESETS = [
  { id: 'ZOOM_IN', label: '🔍 Zoom In (Focus Hold)' },
  { id: 'ZOOM_OUT', label: '🔎 Zoom Out (Grand Reveal)' },
  { id: 'PAN_LEFT', label: '⬅️ Pan Left (Cinematic Drift)' },
  { id: 'PAN_RIGHT', label: '➡️ Pan Right (Panoramic Sweep)' },
  { id: 'STATIC', label: '⏸️ Static Hold' }
];

export default function OneClickProductionModal({ isOpen, onClose, project, onComplete, initialEditMode = false }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepName, setStepName] = useState('Initializing Production Pipeline...');
  const [percent, setPercent] = useState(0);
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [awaitingVisuals, setAwaitingVisuals] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  // Manual Editing Studio State
  const [isEditMode, setIsEditMode] = useState(initialEditMode);
  const [segments, setSegments] = useState([]);
  const [loadingSegments, setLoadingSegments] = useState(false);
  const [savingEdits, setSavingEdits] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [jesusPhotos, setJesusPhotos] = useState([]);
  const [activeJesusPickerScene, setActiveJesusPickerScene] = useState(null);
  const [imageTimestamps, setImageTimestamps] = useState({});

  const currentProjectIdRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !project) {
      currentProjectIdRef.current = null;
      return;
    }

    // Always reset whenever opening or switching to a new project
    if (currentProjectIdRef.current !== project.id) {
      currentProjectIdRef.current = project.id;
      setResult(null);
      setError(null);
      setLogs([]);
      setAwaitingVisuals(null);
      setUploaded(false);
      setIsEditMode(initialEditMode);

      if (project.output_video_path || project.status === 'RENDERED') {
        setIsExecuting(false);
        setPercent(100);
        setCurrentStep(10);
        setStepName('Production Finished Successfully!');
        setResult({
          videoUrl: `/storage/projects/${project.id}/output/final_video.mp4?t=${Date.now()}`,
          thumbnailUrl: `/storage/projects/${project.id}/output/thumbnail.jpg?t=${Date.now()}`,
          durationSeconds: project.actual_duration_seconds || project.target_duration_seconds || 1440
        });
        if (initialEditMode) {
          openEditStudio();
        }
      } else {
        // Unrendered project: start fresh production pipeline!
        setIsExecuting(true);
        setCurrentStep(1);
        setPercent(10);
        setStepName('Initializing Production Pipeline...');
        runPipeline();
      }
    }
  }, [isOpen, project?.id]);

  async function openEditStudio() {
    setIsEditMode(true);
    setLoadingSegments(true);
    try {
      const segRes = await api.getSegments(project.id);
      if (segRes.success && segRes.data) {
        setSegments(segRes.data);
      }
      const photoRes = await api.getJesusPhotos(project.format || 'SHORTS');
      if (photoRes.success && photoRes.data) {
        setJesusPhotos(photoRes.data);
      }
    } catch (err) {
      console.error('Failed to load segments for editor:', err);
    } finally {
      setLoadingSegments(false);
    }
  }

  function handleSceneTextChange(order, newText) {
    setSegments(prev => prev.map(s => s.segment_order === order ? { ...s, narration_text: newText } : s));
  }

  function handleSceneMotionChange(order, newMotion) {
    setSegments(prev => prev.map(s => s.segment_order === order ? { ...s, ken_burns_effect: newMotion } : s));
  }

  async function handleSelectJesusPhoto(order, filename) {
    try {
      const res = await api.selectLibraryImage(project.id, order, filename, project.format);
      if (res.success) {
        setImageTimestamps(prev => ({ ...prev, [order]: Date.now() }));
        setSegments(prev => prev.map(s => s.segment_order === order ? {
          ...s,
          media_path: res.media_path,
          previewUrl: res.relativeUrl
        } : s));
        setActiveJesusPickerScene(null);
      }
    } catch (err) {
      alert('Failed to update Jesus artwork: ' + err.message);
    }
  }

  function handleUploadPhoto(order, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      try {
        const res = await api.uploadSceneImage(project.id, order, base64, file.name);
        if (res.success) {
          const freshTime = Date.now();
          setImageTimestamps(prev => ({ ...prev, [order]: freshTime }));
          setSegments(prev => prev.map(s => s.segment_order === order ? {
            ...s,
            media_path: res.data?.filePath || s.media_path,
            previewUrl: `/storage/projects/${project.id}/images/scene_${order}.jpg?t=${freshTime}`
          } : s));
        }
      } catch (err) {
        alert('Upload failed: ' + err.message);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSaveSegments() {
    setSavingEdits(true);
    try {
      await api.updateSegmentsBatch(project.id, segments);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save segment changes: ' + err.message);
    } finally {
      setSavingEdits(false);
    }
  }

  async function handleSaveAndRegenerate() {
    setSavingEdits(true);
    try {
      // 1. Save all edited scenes to database and invalidate changed clips & audios
      await api.updateSegmentsBatch(project.id, segments);
      
      // 2. Return to pipeline view and clear previous result to trigger full re-render
      setIsEditMode(false);
      setResult(null);

      // 3. Re-run pipeline forcing voice re-synthesis & FFmpeg video assembly
      runPipeline({ forceRegenerateVoice: 'true', forceRerender: 'true' });
    } catch (err) {
      alert('Failed to trigger video regeneration: ' + err.message);
    } finally {
      setSavingEdits(false);
    }
  }

  async function runPipeline(extraParams = {}) {
    setIsExecuting(true);
    setResult(null);
    setError(null);
    setAwaitingVisuals(null);
    setLogs([]);
    setCurrentStep(1);
    setPercent(10);
    setStepName('Validating Biblical Topic & Setup...');

    try {
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
            const completedData = {
              ...data.result,
              videoUrl: `/storage/projects/${project.id}/output/final_video.mp4?t=${Date.now()}`,
              thumbnailUrl: `/storage/projects/${project.id}/output/thumbnail.jpg?t=${Date.now()}`
            };
            setResult(completedData);
            if (onComplete) onComplete(completedData);
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
                videoUrl: `/storage/projects/${p.id}/output/final_video.mp4?t=${Date.now()}`,
                thumbnailUrl: `/storage/projects/${p.id}/output/thumbnail.jpg?t=${Date.now()}`,
                durationSeconds: p.actual_duration_seconds || p.target_duration_seconds || 1440
              };
              setResult(resData);
              if (onComplete) onComplete(resData);
            } else if (p.status === 'FAILED' && attempts > 3) {
              clearInterval(poller);
              setIsExecuting(false);
              setError(p.error_message || 'Production halted. Please review errors and retry.');
            } else if (staleCount > 200) {
              clearInterval(poller);
              setIsExecuting(false);
              setError('Production reached maximum idle threshold with no status change.');
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
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-hidden">
      <div className={`w-full ${isEditMode ? 'max-w-4xl' : 'max-w-2xl'} max-h-[92vh] sm:max-h-[88vh] bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in duration-200 transition-all`}>
        
        {/* Modal Header */}
        <div className="flex-shrink-0 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl ${isEditMode ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-amber-500/20 border-amber-500/30 text-amber-400'} border flex items-center justify-center flex-shrink-0`}>
              {isEditMode ? <Edit3 className="w-4 h-4" /> : <Play className="w-4 h-4 fill-amber-400" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate max-w-md">
                {isEditMode ? 'Manual Studio — Edit Script & Video' : project.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-amber-400/90 font-medium flex items-center gap-2 flex-wrap mt-0.5">
                <span>{project.format}</span>
                <span>•</span>
                <span>{project.category.replace('_', ' ')}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  Style: {project.script_type || (project.format === 'SHORTS' ? '55s Scripture Short' : 'Canonical Documentary')}
                </span>
                <span>•</span>
                <span>{isEditMode ? `${segments.length} Scenes Loaded` : 'One-Click Pipeline'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isEditMode && !isExecuting && (
              <button
                onClick={openEditStudio}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Edit script text and scene camera motions"
              >
                <Edit3 className="w-3.5 h-3.5 text-indigo-400" />
                <span className="hidden sm:inline">Edit Script & Scenes</span>
              </button>
            )}

            {isEditMode && (
              <button
                onClick={() => setIsEditMode(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Video</span>
              </button>
            )}

            <button
              onClick={onClose}
              disabled={isExecuting}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {isEditMode ? (
          /* MANUAL EDITING STUDIO VIEW */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Studio Instruction Banner */}
            <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-3 text-xs text-indigo-200">
              <Sparkles className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold text-slate-100">100% Control Over Script Words, Motion & Imagery:</span>
                <p className="text-indigo-200/90 leading-relaxed text-[11px]">
                  Edit any scene narration text below. Change camera motions or swap Jesus portraits. When satisfied, click <strong>"Save & Regenerate Video"</strong> to synthesize natural voice narration and re-render the video in full 1080p with embedded subtitles!
                </p>
              </div>
            </div>

            {loadingSegments ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400" />
                <p className="text-xs">Loading scenes and authentic Jesus portrait library...</p>
              </div>
            ) : segments.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No scenes found. Please run the pipeline once to generate initial script segments.
              </div>
            ) : (
              <div className="space-y-4">
                {segments.map((seg) => {
                  const order = seg.segment_order;
                  const wordCount = (seg.narration_text || '').split(/\s+/).filter(Boolean).length;
                  const imageSrc = seg.previewUrl || `/storage/projects/${project.id}/images/scene_${order}.jpg?t=${imageTimestamps[order] || 0}`;
                  const isPickerOpen = activeJesusPickerScene === order;

                  return (
                    <div
                      key={order}
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-3"
                    >
                      {/* Scene Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center">
                            #{order}
                          </span>
                          <span className="text-xs font-bold text-slate-200">
                            Scene {order}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            • ~{seg.duration_seconds || 5}s • {wordCount} words
                          </span>
                        </div>

                        {/* Ken Burns Motion Selector */}
                        <div className="flex items-center gap-1.5">
                          <label className="text-[11px] font-semibold text-slate-400">Motion:</label>
                          <select
                            value={seg.ken_burns_effect || 'ZOOM_IN'}
                            onChange={(e) => handleSceneMotionChange(order, e.target.value)}
                            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-500"
                          >
                            {MOTION_PRESETS.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Scene Body: Text on Left, Visuals on Right */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                        {/* Narration Script Textarea (Left 8 cols) */}
                        <div className="md:col-span-8 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                            <span>Spoken Narration (Exact Words):</span>
                            <span className="text-slate-500 text-[10px]">{seg.narration_text?.length || 0} chars</span>
                          </label>
                          <textarea
                            rows={3}
                            value={seg.narration_text || ''}
                            onChange={(e) => handleSceneTextChange(order, e.target.value)}
                            placeholder="Type scene narration text..."
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 font-sans focus:outline-none focus:border-amber-500 resize-y leading-relaxed"
                          />
                        </div>

                        {/* Image Preview & Swap Controls (Right 4 cols) */}
                        <div className="md:col-span-4 space-y-2">
                          <div className="w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-700 relative shadow">
                            <img
                              src={imageSrc}
                              alt={`Scene ${order}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = '/data/jesus_photo_library/vertical/jesus_portrait_compassion.jpg';
                              }}
                            />
                            <div className="absolute bottom-1 right-1 bg-black/70 px-1.5 py-0.5 rounded text-[9px] text-amber-300 font-mono">
                              {seg.ken_burns_effect || 'ZOOM_IN'}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => setActiveJesusPickerScene(isPickerOpen ? null : order)}
                              className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors border border-amber-500/20"
                            >
                              <Sparkles className="w-3 h-3 text-amber-400" />
                              <span>{isPickerOpen ? 'Close Art' : 'Swap Jesus Art'}</span>
                            </button>

                            <label className="py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors border border-slate-700 cursor-pointer">
                              <UploadCloud className="w-3 h-3 text-indigo-400" />
                              <span>Upload Photo</span>
                              <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => handleUploadPhoto(order, e.target.files[0])}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Jesus Masterwork Library Gallery Picker Drawer */}
                      {isPickerOpen && (
                        <div className="pt-2 border-t border-slate-800/80 animate-in fade-in duration-150">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              Select Authentic Jesus Portrayal for Scene #{order}:
                            </span>
                            <span className="text-[10px] text-slate-500">100% Public Domain & Copyright Safe</span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                            {jesusPhotos.map((photo) => (
                              <button
                                key={photo.filename}
                                type="button"
                                onClick={() => handleSelectJesusPhoto(order, photo.filename)}
                                className="group text-left p-1 rounded-lg hover:bg-slate-800 border border-transparent hover:border-amber-500/50 transition-all"
                              >
                                <div className="aspect-square bg-slate-900 rounded overflow-hidden relative">
                                  <img
                                    src={photo.url}
                                    alt={photo.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                </div>
                                <p className="text-[10px] text-slate-300 font-semibold truncate mt-1 group-hover:text-amber-300">
                                  {photo.title}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* STANDARD EXECUTION & PROGRESS VIEW */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
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
                    onClick={openEditStudio}
                    className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Script & Video</span>
                  </button>

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
        )}

        {/* Modal Footer / Sticky Action Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          {isEditMode ? (
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditMode(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Preview</span>
                </button>
                {saveSuccess && (
                  <span className="text-emerald-400 text-xs flex items-center gap-1 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    <span>Saved!</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveSegments}
                  disabled={savingEdits}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-slate-400" />
                  <span>{savingEdits ? 'Saving...' : 'Save Edits'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveAndRegenerate}
                  disabled={savingEdits}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>Save & Regenerate Video</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="text-[11px] text-slate-500">
                Automated production runs on drive D:\bible
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                {result ? 'Done' : 'Close'}
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
