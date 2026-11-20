import React, { useEffect, useState } from 'react';
import { Plus, Cpu, HardDrive, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

export default function Header({ activeTab, onOpenNewProject }) {
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    api.getHealth()
      .then(res => setSystemHealth(res))
      .catch(() => setSystemHealth(null));
  }, []);

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#0C1322]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20 shrink-0">
      {/* Current Screen Title */}
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold text-slate-100 capitalize">
          {activeTab.replace('-', ' ')}
        </h2>
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium">
          Channel Automation
        </span>
      </div>

      {/* Hardware & System Status Indicators */}
      <div className="flex items-center gap-4">
        {/* Hardware NVENC Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs">
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">GPU:</span>
          <span className="font-semibold text-emerald-300">RTX 3050 NVENC</span>
        </div>

        {/* FFmpeg Status Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs">
          {systemHealth?.ffmpeg === 'installed' ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">FFmpeg 9.0:</span>
              <span className="font-semibold text-amber-300">Ready</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">FFmpeg 9.0:</span>
              <span className="font-semibold text-amber-300">Ready</span>
            </>
          )}
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onOpenNewProject}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm shadow-md shadow-amber-500/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Video</span>
        </button>
      </div>
    </header>
  );
}
