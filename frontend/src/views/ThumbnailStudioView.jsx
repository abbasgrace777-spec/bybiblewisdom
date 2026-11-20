import React, { useState } from 'react';
import { Maximize2, Type, Sparkles, Download, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ThumbnailStudioView({ setActiveTab }) {
  const [headline, setHeadline] = useState('BEFORE TIME BEGAN');
  const [subline, setSubline] = useState('THE SECRET OF GENESIS 1');
  const [textColor, setTextColor] = useState('#F59E0B');

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Maximize2 className="w-5 h-5 text-amber-400" />
            <span>Thumbnail Studio — High CTR Biblical Artwork</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Bold, legible typography with cinematic contrast designed for high click-through-rates on mobile and desktop
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
            1280 × 720 (16:9) & 1080 × 1920 (9:16)
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Thumbnail Canvas Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video w-full rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden relative shadow-2xl flex flex-col justify-end p-8">
            {/* Background art mockup */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent z-10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-600/30 via-slate-950/90 to-slate-950" />

            {/* Thumbnail Text Layout */}
            <div className="relative z-20 space-y-2 max-w-lg">
              <span className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-md">
                GENESIS 1:1
              </span>
              <h1
                style={{ color: textColor }}
                className="text-4xl sm:text-5xl font-black font-sans tracking-tight leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] uppercase"
              >
                {headline}
              </h1>
              <p className="text-xl sm:text-2xl font-extrabold text-white tracking-wide drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] uppercase">
                {subline}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Customization Controls */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Thumbnail Typography
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Primary Hook Text (Bold)
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Secondary Subtitle
              </label>
              <input
                type="text"
                value={subline}
                onChange={(e) => setSubline(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 font-semibold"
              />
            </div>

            <button
              onClick={() => setActiveTab('seo-studio')}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <span>Thumbnail Ready — Open SEO Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
