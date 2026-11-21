import React, { useState } from 'react';
import {
  LayoutDashboard,
  Sparkles,
  BookOpen,
  Landmark,
  FileText,
  ShieldCheck,
  Mic,
  Image as ImageIcon,
  Film,
  Maximize2,
  Search,
  UploadCloud,
  BarChart3,
  Settings,
  ChevronRight,
  ChevronDown,
  ListOrdered,
  FolderCheck,
  Calendar,
  Compass,
  Layers,
  Wrench
} from 'lucide-react';

export const PRIMARY_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'ready-to-upload', label: 'My Ready Videos', icon: FolderCheck, badge: 'Download', highlight: true },
  { id: 'chapter-production', label: 'Multi-Chapter Queue', icon: ListOrdered, badge: 'Batch' },
  { id: 'bible-books', label: '66 Bible Books', icon: BookOpen, badge: '66' },
];

export const ADVANCED_NAV = [
  { id: 'script-studio', label: 'AI Script Studio', icon: FileText },
  { id: 'voice-studio', label: 'Voice Studio', icon: Mic },
  { id: 'image-studio', label: 'AI Image Studio', icon: ImageIcon },
  { id: 'video-production', label: 'Video Editor', icon: Film },
  { id: 'ideogram-studio', label: 'Thumbnails Studio', icon: Maximize2 },
  { id: 'seo-studio', label: 'SEO & Metadata', icon: Search },
  { id: 'category-hub', label: '12 Christian Categories', icon: Layers },
  { id: 'content-calendar', label: 'Content Calendar', icon: Calendar },
  { id: 'historical-stories', label: 'Historical Stories', icon: Compass },
  { id: 'research-sources', label: 'Archaeology & Sources', icon: Landmark },
  { id: 'accuracy-checker', label: 'Theological Safety Gate', icon: ShieldCheck },
  { id: 'analytics', label: 'Channel Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Workflow Settings', icon: Settings },
];

export const NAV_ITEMS = [...PRIMARY_NAV, ...ADVANCED_NAV];

export default function Sidebar({ activeTab, setActiveTab }) {
  const isCurrentlyInAdvanced = ADVANCED_NAV.some(item => item.id === activeTab);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(isCurrentlyInAdvanced);

  return (
    <aside className="hidden md:flex w-72 bg-[#0C1322] border-r border-slate-800/80 flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/30">
            <BookOpen className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-lg tracking-wide text-amber-100 leading-tight">
              ByBibleWisdom
            </h1>
            <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              AI Studio Active
            </p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-4">
        {/* Primary Simple Navigation */}
        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Main Menu
          </p>
          {PRIMARY_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500/25 to-amber-600/10 text-amber-300 border border-amber-500/40 shadow-sm font-semibold'
                    : item.highlight
                    ? 'text-amber-200/90 hover:text-amber-100 hover:bg-amber-500/10 border border-amber-500/15'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : item.highlight ? 'text-amber-400/80' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive 
                        ? 'bg-amber-500 text-slate-950' 
                        : item.highlight 
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Collapsible Advanced Studio Section */}
        <div className="pt-2 border-t border-slate-800/60">
          <button
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-slate-800/40"
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-slate-400" />
              <span>Advanced Studio Tools</span>
            </div>
            {isAdvancedOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            )}
          </button>

          {isAdvancedOpen && (
            <div className="mt-1 space-y-0.5 pl-2 border-l border-slate-800/80 ml-3">
              {ADVANCED_NAV.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-amber-500/20 text-amber-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Channel Link Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <a
          href="https://www.youtube.com/@ByBibleWisdom"
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 text-xs text-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-slate-200">@ByBibleWisdom</span>
          </div>
          <span className="text-[10px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">YouTube</span>
        </a>
      </div>
    </aside>
  );
}
