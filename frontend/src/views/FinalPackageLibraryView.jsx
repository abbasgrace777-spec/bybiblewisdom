import React, { useState, useEffect } from 'react';
import { FolderCheck, Film, Play, FileText, CheckCircle2, Download, Copy, Check, ExternalLink } from 'lucide-react';

export default function FinalPackageLibraryView({ setActiveTab }) {
  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [copiedSeo, setCopiedSeo] = useState(false);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch('/api/packages');
      if (res.ok) {
        const d = await res.json();
        setPackages(d.data || []);
        if (d.data && d.data.length > 0 && !selectedPackage) {
          setSelectedPackage(d.data[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopySeo = () => {
    if (!selectedPackage) return;
    const text = `TITLE: ${selectedPackage.title}\n\nPACKAGE DIRECTORY:\n${selectedPackage.package_dir}`;
    navigator.clipboard.writeText(text);
    setCopiedSeo(true);
    setTimeout(() => setCopiedSeo(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <FolderCheck className="w-5 h-5 text-amber-400" />
            <span>Final Chapter Production Packages</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Standard Output Directory: <code className="text-amber-400">D:\bible\ByBibleWisdom\&lt;Book&gt;\Chapter_XX\</code>. Each chapter has all 14 production files.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('chapter-production')}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20"
        >
          <span>Produce More Chapters</span>
        </button>
      </div>

      {packages.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
          <FolderCheck className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-300">No Exported Packages Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Once a chapter video finishes rendering, all 14 production assets are organized into <code>ByBibleWisdom/&lt;Book&gt;/Chapter_XX/</code>.
          </p>
          <button
            onClick={() => setActiveTab('chapter-production')}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs inline-flex items-center gap-2"
          >
            <span>Go to Chapter Production Queue</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Package List on Left */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Exported Packages ({packages.length})
            </h3>
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                onClick={() => setSelectedPackage(pkg)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedPackage?.id === pkg.id
                    ? 'bg-slate-800/80 border-amber-500/50 shadow-lg shadow-amber-950/20'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-sm">{pkg.book_name} Chapter {pkg.chapter}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Complete
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1 truncate">{pkg.title}</p>
                <p className="text-[10px] font-mono text-slate-500 mt-2 truncate">{pkg.package_dir}</p>
              </div>
            ))}
          </div>

          {/* Package Details on Right */}
          {selectedPackage && (
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-100">
                      {selectedPackage.book_name} Chapter {selectedPackage.chapter} Production Package
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {selectedPackage.package_dir}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveTab('video-production')}
                      className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Watch Video</span>
                    </button>
                    <button
                      onClick={handleCopySeo}
                      className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 border border-slate-700"
                    >
                      {copiedSeo ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSeo ? 'Copied' : 'Copy Path'}</span>
                    </button>
                  </div>
                </div>

                {/* In-Browser Video & Thumbnail Player Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Film className="w-3.5 h-3.5 text-amber-400" />
                      <span>Video Player (Subtitles & Pure Voice)</span>
                    </h4>
                    <div className="rounded-xl overflow-hidden bg-black border border-slate-800 aspect-video shadow-lg">
                      <video
                        controls
                        className="w-full h-full object-contain"
                        src={`/packages/${selectedPackage.book_name}/Chapter_${String(selectedPackage.chapter).padStart(2, '0')}/Final_Video.mp4`}
                        poster={`/packages/${selectedPackage.book_name}/Chapter_${String(selectedPackage.chapter).padStart(2, '0')}/Thumbnail.jpg`}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <FolderCheck className="w-3.5 h-3.5 text-amber-400" />
                      <span>YouTube Thumbnail</span>
                    </h4>
                    <div className="rounded-xl overflow-hidden bg-black border border-slate-800 aspect-video shadow-lg">
                      <img
                        src={`/packages/${selectedPackage.book_name}/Chapter_${String(selectedPackage.chapter).padStart(2, '0')}/Thumbnail.jpg`}
                        alt="Thumbnail Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>

                {/* 14 Production Files Checklist */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Included Production Assets (14/14 Ready):
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {[
                      { name: 'Final_Video.mp4', desc: '1080p MP4 with subtitles & zero BGM', type: 'video' },
                      { name: 'Thumbnail.jpg', desc: '1280x720 high-CTR thumbnail', type: 'image' },
                      { name: 'Ideogram_Prompt.txt', desc: 'Copy-ready Ideogram 2.0 prompt', type: 'text' },
                      { name: 'Voice.mp3', desc: 'Natural documentary voice narration', type: 'audio' },
                      { name: 'Subtitles.srt', desc: 'Timed SRT subtitle transcription', type: 'sub' },
                      { name: 'Subtitles.ass', desc: 'High-contrast styled subtitles', type: 'sub' },
                      { name: 'Script.txt', desc: '10-part original biblical script', type: 'text' },
                      { name: 'Bible_Chapter.txt', desc: 'Complete chapter text (WEB)', type: 'text' },
                      { name: 'Bible_References.txt', desc: 'Exact citations & Hebrew keywords', type: 'text' },
                      { name: 'Research_Sources.txt', desc: 'Archaeological & canon sources', type: 'text' },
                      { name: 'SEO.txt', desc: 'Title, description, timestamps, tags', type: 'text' },
                      { name: 'Copyright_Report.txt', desc: '10-point compliance audit report', type: 'text' },
                      { name: 'Images/', desc: 'Scene visual imagery folder', type: 'folder' },
                      { name: 'Animation/', desc: 'Camera movements & motion cues', type: 'folder' }
                    ].map((f, i) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <span className="font-bold text-slate-200 font-mono text-[11px]">{f.name}</span>
                            <p className="text-[10px] text-slate-400">{f.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
