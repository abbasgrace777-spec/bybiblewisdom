import React, { useState, useRef } from 'react';
import { Mic, Play, Pause, Volume2, Sparkles, CheckCircle2, ArrowRight, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function VoiceStudioView({ setActiveTab }) {
  const [selectedVoice, setSelectedVoice] = useState('am_michael');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null);

  const VOICES = [
    {
      id: 'am_michael',
      name: 'Michael',
      accent: 'American',
      engine: 'Kokoro (Apache 2.0)',
      tone: 'Warm, Calm, Reverent Documentary Narrator (138 WPM, -16.7 LUFS)',
      recommended: true,
      enabled: true,
      sample: '/storage/voice_samples/kokoro_am_michael.mp3'
    },
    {
      id: 'am_adam',
      name: 'Adam',
      accent: 'American',
      engine: 'Kokoro (Apache 2.0)',
      tone: 'Deep, Resonant, Authoritative Biblical Storyteller (159 WPM, -16.6 LUFS)',
      enabled: true,
      sample: '/storage/voice_samples/kokoro_am_adam.mp3'
    },
    {
      id: 'bm_george',
      name: 'George',
      accent: 'British Classical',
      engine: 'Kokoro (Apache 2.0)',
      tone: 'Scholarly, BBC-Style Classical Documentary (143 WPM, -16.5 LUFS)',
      enabled: true,
      sample: '/storage/voice_samples/kokoro_bm_george.mp3'
    },
    {
      id: 'af_bella',
      name: 'Bella',
      accent: 'American',
      engine: 'Kokoro (Apache 2.0)',
      tone: 'Gentle, Contemplative Reflective Spiritual Narrator',
      enabled: true,
      sample: null
    },
    {
      id: 'en-US-ChristopherNeural',
      name: 'Christopher',
      accent: 'American',
      engine: 'Edge TTS',
      tone: 'Edge Natural Voice',
      enabled: false,
      disabledReason: 'unofficial, check terms'
    },
    {
      id: 'en-US-GuyNeural',
      name: 'Guy',
      accent: 'American',
      engine: 'Edge TTS',
      tone: 'Edge Resonant Voice',
      enabled: false,
      disabledReason: 'unofficial, check terms'
    },
    {
      id: 'en-GB-RyanNeural',
      name: 'Ryan',
      accent: 'British Classical',
      engine: 'Edge TTS',
      tone: 'Edge British Voice',
      enabled: false,
      disabledReason: 'unofficial, check terms'
    }
  ];

  const currentVoiceObj = VOICES.find(v => v.id === selectedVoice) || VOICES[0];

  const handlePlayToggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  const handleVoiceSelect = (v) => {
    if (!v.enabled) return;
    setSelectedVoice(v.id);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Hidden audio element */}
      {currentVoiceObj.sample && (
        <audio
          ref={audioRef}
          src={currentVoiceObj.sample}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Mic className="w-5 h-5 text-amber-400" />
            <span>Voice Studio — Kokoro TTS Documentary Narration</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Local, Apache 2.0 licensed, free neural voice engine calibrated for sacred storytelling (Target: 140–160 WPM, -16 LUFS)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Zero Cloud Cost • Kokoro 82M (Apache 2.0 Local)
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Voice Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Select Documentary Voice
            </h3>
            <span className="text-[11px] text-slate-400">
              One consistent voice per video
            </span>
          </div>

          <div className="space-y-3">
            {VOICES.map((v) => {
              const isSelected = selectedVoice === v.id;
              const isDisabled = !v.enabled;

              return (
                <div
                  key={v.id}
                  onClick={() => handleVoiceSelect(v)}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                    isDisabled
                      ? 'border-slate-800/40 bg-slate-950/40 text-slate-500 cursor-not-allowed opacity-60'
                      : isSelected
                      ? 'border-amber-500 bg-amber-500/10 text-slate-100 shadow-md cursor-pointer'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-lg ${
                      isDisabled
                        ? 'bg-slate-900 text-slate-600'
                        : isSelected
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-slate-100">{v.name}</span>
                        <span className="text-xs text-slate-400">({v.accent})</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                          {v.engine}
                        </span>
                        {v.recommended && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                            Recommended
                          </span>
                        )}
                        {isDisabled && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {v.disabledReason}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{v.tone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {v.sample && (
                      <span className="text-[10px] px-2 py-1 rounded bg-slate-800/80 text-emerald-400 border border-slate-700 font-medium">
                        Sample Ready
                      </span>
                    )}
                    <div className="w-4 h-4 rounded-full border flex items-center justify-center border-slate-700">
                      {isSelected && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Audio Player & Action */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Audition Voice Sample
            </h3>

            {/* Waveform & Player */}
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1 h-12 w-full justify-center px-4">
                {[40, 65, 20, 85, 95, 45, 60, 30, 75, 90, 50, 80, 60, 35, 70, 90, 45, 25, 60, 85, 30].map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className={`w-1 rounded-full transition-all ${
                      isPlaying ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={handlePlayToggle}
                  disabled={!currentVoiceObj.sample}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${
                    currentVoiceObj.sample
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20 cursor-pointer'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                  title={currentVoiceObj.sample ? 'Play Sample' : 'No sample available'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-slate-950" />
                  ) : (
                    <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                  )}
                </button>
                <div className="text-left text-xs">
                  <div className="font-semibold text-slate-200">
                    Genesis_1_Sample_{currentVoiceObj.name}.mp3
                  </div>
                  <div className="text-slate-400">
                    Mastered -16 LUFS • Kokoro Neural Engine
                  </div>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-400 bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="font-semibold text-slate-300">Auditioned Paragraph (Genesis 1):</div>
              <p className="italic text-[11px] text-slate-400 leading-relaxed">
                "Before time was born, before a single star burned in the vast silence, there was only God. In Genesis 1:1, scripture reveals: 'In the beginning, God created the heavens and the earth.' Written in ancient Hebrew, the opening word 'Bereshit' anchors the universe not in random chance, but in divine purpose."
              </p>
            </div>

            <button
              onClick={() => setActiveTab('image-studio')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <span>Voice Selected — Proceed to Image Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
