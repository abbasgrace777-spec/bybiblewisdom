import React, { useState } from 'react';
import { Landmark, ShieldAlert, CheckCircle2, BookOpen, ExternalLink, Video } from 'lucide-react';

export default function HistoricalStoriesView({ stories = [], onStartProjectForStory }) {
  const [selectedCivilization, setSelectedCivilization] = useState('ALL');
  const [activeStory, setActiveStory] = useState(null);

  const civilizations = ['ALL', 'Persia', 'Israel', 'Rome', 'Babylon', 'Assyria', 'Egypt'];

  const filteredStories = stories.filter(s => {
    return selectedCivilization === 'ALL' || s.civilization?.toLowerCase() === selectedCivilization.toLowerCase();
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-amber-400" />
            <span>Unseen Biblical & Historical Stories</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Ancient kingdoms, archaeological discoveries, and lesser-known biblical events with strict fact-checking
          </p>
        </div>

        {/* Civ Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          {civilizations.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCivilization(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCivilization === c
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredStories.map((story) => (
          <div
            key={story.id}
            onClick={() => setActiveStory(story)}
            className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-800/30 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 uppercase">
                  {story.civilization} • {story.category}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {story.biblical_era}
                </span>
              </div>

              <h3 className="text-base font-serif font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                {story.title}
              </h3>

              <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                {story.educational_summary}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 truncate max-w-[200px]">{story.scripture_references}</span>
              <span className="text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                Read Evidence →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {activeStory && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-[#0F172A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in duration-200">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                  {activeStory.civilization} • {activeStory.category}
                </span>
                <h3 className="text-2xl font-serif font-bold text-slate-100 mt-1">
                  {activeStory.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveStory(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                <span className="font-bold text-amber-400 uppercase tracking-wider">Related Scripture:</span>
                <span className="ml-2 text-slate-200">{activeStory.scripture_references}</span>
              </div>

              {/* Established Facts */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                    Established Historical & Archaeological Facts
                  </h4>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {activeStory.established_facts}
                </p>
                {activeStory.historical_sources && (
                  <div className="mt-2 text-[11px] text-slate-400 italic">
                    Sources: {activeStory.historical_sources}
                  </div>
                )}
              </div>

              {/* Theories vs Speculation */}
              {activeStory.theories_and_traditions && (
                <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Theological Context & Theories (Distinguished from Raw Fact)
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeStory.theories_and_traditions}
                  </p>
                </div>
              )}

              {/* Educational Summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Audience Takeaway & Channel Narration Hook
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-lg border border-slate-800">
                  {activeStory.educational_summary}
                </p>
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">Ready to script this historical discovery?</span>
              <button
                onClick={() => {
                  onStartProjectForStory(activeStory);
                  setActiveStory(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <Video className="w-4 h-4 fill-slate-950" />
                <span>Create Video for this Story</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
