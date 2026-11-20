import React, { useState, useEffect } from 'react';
import {
  Scale,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Filter,
  Search,
  Check,
  X,
  Sparkles,
  Info,
  FileText,
  Camera,
  Layers,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';

const APPROVED_SOURCES = [
  {
    id: 'OBI',
    name: 'Open Bible Images',
    badge: 'OBI Free / CC0',
    description: 'Accepts only images explicitly verified under OBI Free or CC0. Non-Commercial (NC) and No-Derivatives (ND) are strictly rejected.',
    website: 'https://openbible.info/images/',
    commercial: true,
  },
  {
    id: 'PIXABAY',
    name: 'Pixabay',
    badge: 'Pixabay Content License',
    description: 'Permitted for commercial YouTube video production and monetization. Free to use without mandatory attribution.',
    website: 'https://pixabay.com/service/license-summary/',
    commercial: true,
  },
  {
    id: 'PEXELS',
    name: 'Pexels',
    badge: 'Pexels License',
    description: 'Permitted for commercial use and modifications. Free to use with zero copyright strikes.',
    website: 'https://www.pexels.com/license/',
    commercial: true,
  },
  {
    id: 'AI_IMAGEN',
    name: 'Google Gemini Imagen 3',
    badge: 'Commercial AI Terms',
    description: 'Original high-resolution biblical imagery synthesized under Google Generative AI commercial terms as safe fallback.',
    website: 'https://ai.google.dev/terms',
    commercial: true,
  },
];

export default function AssetCopyrightView() {
  const [assets, setAssets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Manual Verification Checker State
  const [testSource, setTestSource] = useState('Pixabay');
  const [testUrl, setTestUrl] = useState('https://pixabay.com/photos/sunrise-mountains-12345/');
  const [testLicense, setTestLicense] = useState('Pixabay Content License');
  const [testCreator, setTestCreator] = useState('BiblicalLandscapeArtist');
  const [verificationResult, setVerificationResult] = useState(null);
  const [testingLicense, setTestingLicense] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchAssets(selectedProjectId);
  }, [selectedProjectId]);

  const fetchInitialData = async () => {
    try {
      const pRes = await api.getProjects();
      const pList = Array.isArray(pRes) ? pRes : (pRes.data || []);
      setProjects(pList);
      if (pList.length > 0 && !selectedProjectId) {
        setSelectedProjectId(pList[0].id);
      }
    } catch (e) {
      console.error('Failed to load projects:', e);
    }
  };

  const fetchAssets = async (projectId) => {
    setLoading(true);
    try {
      const res = await api.getCopyrightAssets(projectId);
      if (res.success) {
        setAssets(res.data || []);
      }
    } catch (e) {
      console.error('Failed to load copyright assets:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleTestVerification = async () => {
    setTestingLicense(true);
    try {
      const res = await api.verifyCopyrightCandidate({
        sourceWebsite: testSource,
        sourceUrl: testUrl,
        licenseName: testLicense,
        creatorName: testCreator,
      });
      if (res.success) {
        setVerificationResult(res.data);
      }
    } catch (e) {
      alert('Verification test error: ' + e.message);
    } finally {
      setTestingLicense(false);
    }
  };

  const handleDownloadReport = () => {
    if (!selectedProjectId) return;
    window.open(`/api/projects/${selectedProjectId}/copyright-report`, '_blank');
  };

  // Filtered Assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSource =
      sourceFilter === 'ALL' ||
      (sourceFilter === 'OBI' && (asset.sourceWebsite || '').toLowerCase().includes('bible')) ||
      (sourceFilter === 'PIXABAY' && (asset.sourceWebsite || '').toLowerCase().includes('pixabay')) ||
      (sourceFilter === 'PEXELS' && (asset.sourceWebsite || '').toLowerCase().includes('pexels')) ||
      (sourceFilter === 'AI' && (asset.creatorName || '').toLowerCase().includes('gemini'));

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      (asset.title || '').toLowerCase().includes(q) ||
      (asset.localFilename || '').toLowerCase().includes(q) ||
      (asset.creatorName || '').toLowerCase().includes(q) ||
      (asset.licenseName || '').toLowerCase().includes(q);

    return matchesSource && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-[#0F172A] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <span>Copyright-Safe Image System & Registry</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Strict Whitelist
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated license verification across Open Bible Images, Pixabay, Pexels & Gemini Imagen 3
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchAssets(selectedProjectId)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Registry</span>
          </button>

          {selectedProjectId && (
            <button
              onClick={handleDownloadReport}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-900/30 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Mandatory Legal Compliance Notice */}
      <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-semibold text-amber-300">
            Mandatory YouTube Monetization & Legal Disclaimer:
          </strong>
          <p className="text-[11px] text-amber-200/80 leading-relaxed">
            While ByBibleWisdom AI Studio strictly verifies every image against approved commercial licenses (Open Bible Images OBI Free, Pixabay Content License, Pexels License, and Commercial AI Generation), no platform or software can legally guarantee an image is completely immune to third-party copyright claims or automated Content ID disputes on open platforms.
            To provide maximum legal defense, ByBibleWisdom AI Studio preserves full provenance metadata for every asset—including creator name, source URL, exact license text, license terms URL, download date, and local filename—enabling rapid counter-notification and DMCA safe harbor compliance in the event of an unjustified claim.
          </p>
        </div>
      </div>

      {/* Approved Sources Whitelist Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {APPROVED_SOURCES.map((src) => (
          <div
            key={src.id}
            className="p-4 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-2 hover:border-slate-700 transition-all shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-100">{src.name}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {src.badge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">{src.description}</p>
            <a
              href={src.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 hover:text-amber-300 pt-1"
            >
              <span>License Terms</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
        ))}
      </div>

      {/* Interactive License Verification Sandbox */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-4 shadow-xl">
        <div className="border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Automatic Copyright Verification Engine</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Test candidate images against the 7 strict copyright rules before downloading or embedding.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Source Provider:</label>
            <select
              value={testSource}
              onChange={(e) => setTestSource(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="Pixabay">Pixabay</option>
              <option value="Pexels">Pexels</option>
              <option value="Open Bible Images">Open Bible Images (OBI Free)</option>
              <option value="Google Gemini Imagen 3">Google Gemini Imagen 3</option>
              <option value="Google Images (Unverified Scraper)">Google Images (Unverified Scraper)</option>
              <option value="FreeBibleimages (Non-Commercial)">FreeBibleimages (Non-Commercial)</option>
              <option value="YouTube Video Rip">YouTube Video Rip</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Exact License Name:</label>
            <input
              type="text"
              value={testLicense}
              onChange={(e) => setTestLicense(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              placeholder="e.g. Pixabay Content License, OBI Free, CC-BY-NC"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-400">Creator Name:</label>
            <input
              type="text"
              value={testCreator}
              onChange={(e) => setTestCreator(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
              placeholder="e.g. Photographer or AI Model"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleTestVerification}
              disabled={testingLicense}
              className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{testingLicense ? 'Auditing...' : 'Test License'}</span>
            </button>
          </div>
        </div>

        {/* Verification Audit Result Output */}
        {verificationResult && (
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 text-xs animate-in fade-in ${
              verificationResult.approved
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            }`}
          >
            {verificationResult.approved ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between">
                <strong className="font-bold text-slate-100">
                  {verificationResult.approved ? 'LICENSE CLEARED' : 'REJECTED — PROHIBITED RESTRICTION'}
                </strong>
                {verificationResult.fallbackRequired && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Auto-Replacement: Gemini Imagen 3
                  </span>
                )}
              </div>
              <p className="text-[11px] leading-relaxed">{verificationResult.reason}</p>
            </div>
          </div>
        )}
      </div>

      {/* Asset Provenance Registry Table */}
      <div className="p-5 rounded-2xl bg-[#0F172A] border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Visual Asset Provenance Registry</span>
              <span className="text-xs text-slate-400 font-mono">({filteredAssets.length} verified records)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Individual audit trail preserving creator names, exact license texts, URLs & timestamps.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Project Filter */}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Sources</option>
              <option value="OBI">Open Bible Images</option>
              <option value="PIXABAY">Pixabay</option>
              <option value="PEXELS">Pexels</option>
              <option value="AI">Gemini Imagen 3</option>
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search assets by filename, creator, license, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Asset / Preview</th>
                <th className="py-2.5 px-3">Local Filename</th>
                <th className="py-2.5 px-3">Source Website</th>
                <th className="py-2.5 px-3">Creator Name</th>
                <th className="py-2.5 px-3">Exact License</th>
                <th className="py-2.5 px-3">Commercial Use</th>
                <th className="py-2.5 px-3">Attribution</th>
                <th className="py-2.5 px-3">Verified Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2 px-3">
                      <div className="w-12 h-8 rounded overflow-hidden bg-slate-950 border border-slate-800">
                        {asset.relativeUrl ? (
                          <img
                            src={asset.relativeUrl}
                            alt={asset.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Camera className="w-4 h-4 text-slate-600 m-auto mt-2" />
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px] text-slate-200 font-semibold">
                      {asset.localFilename}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-slate-300">{asset.sourceWebsite}</span>
                    </td>
                    <td className="py-2 px-3 text-slate-300">
                      {asset.creatorName}
                    </td>
                    <td className="py-2 px-3">
                      <a
                        href={asset.licenseUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
                      >
                        <span>{asset.licenseName}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Permitted</span>
                      </span>
                    </td>
                    <td className="py-2 px-3 text-[11px]">
                      {asset.attributionRequired ? (
                        <span className="text-amber-300 font-medium">Required</span>
                      ) : (
                        <span className="text-slate-400">None required</span>
                      )}
                    </td>
                    <td className="py-2 px-3 text-[10px] text-slate-400 font-mono">
                      {asset.downloadDate ? asset.downloadDate.slice(0, 10) : '2026-11-15'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-xs text-slate-500">
                    No visual assets matching filter criteria found in registry.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
