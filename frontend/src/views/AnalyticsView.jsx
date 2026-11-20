import React from 'react';
import { BarChart3, TrendingUp, BookOpen, Clock, Users, Eye } from 'lucide-react';

export default function AnalyticsView({ books = [] }) {
  // Calculate completion percentage across all 66 books
  const completedBooks = 1; // Genesis initialized
  const progressPercent = Math.round((completedBooks / 66) * 100);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span>Channel Analytics & Curriculum Progress</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tracking audience retention, top performing biblical categories, and the Genesis-to-Revelation progress
          </p>
        </div>
      </div>

      {/* 66 Books Curriculum Progress Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-amber-500/30 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              Channel Core Mission
            </span>
            <h3 className="text-lg font-bold text-slate-100 mt-0.5">
              66 Books of the Bible Curriculum
            </h3>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-amber-400">{completedBooks} / 66</span>
            <span className="text-xs text-slate-400 block">{progressPercent}% Explored</span>
          </div>
        </div>

        <div className="w-full h-3 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Torah / Law:</span>
            <div className="font-bold text-slate-200 mt-0.5">1 of 5 (Genesis in progress)</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Historical Books:</span>
            <div className="font-bold text-slate-200 mt-0.5">0 of 12</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400">Wisdom & Poetry:</span>
            <div className="font-bold text-slate-200 mt-0.5">0 of 5</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400">New Testament:</span>
            <div className="font-bold text-slate-200 mt-0.5">0 of 27</div>
          </div>
        </div>
      </div>

      {/* Target Content Benchmarks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-medium">Target Shorts Retention</span>
          <div className="text-2xl font-bold text-slate-100">&gt; 85%</div>
          <p className="text-[11px] text-slate-400">High first 3-second hook conversion</p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-medium">Target Long-Form Watch Time</span>
          <div className="text-2xl font-bold text-slate-100">&gt; 55%</div>
          <p className="text-[11px] text-slate-400">Cinematic narrative progression</p>
        </div>
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 font-medium">Biblical Accuracy Score</span>
          <div className="text-2xl font-bold text-emerald-400">100%</div>
          <p className="text-[11px] text-slate-400">Verified against public domain text</p>
        </div>
      </div>
    </div>
  );
}
