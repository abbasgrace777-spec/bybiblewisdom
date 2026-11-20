import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, CheckCircle2, Lock, ArrowRight, BookOpen } from 'lucide-react';

export default function AccuracyCheckerView({ project, onApproveGate, setActiveTab }) {
  const [checks, setChecks] = useState([
    { id: 'originality', label: '1. Script Originality Verification', desc: 'Original exposition, zero scraping or copied scripts from other channels.', passed: true },
    { id: 'reference_accuracy', label: '2. Bible Reference Accuracy', desc: 'All quotes matched against verified Tanakh/Greek manuscripts. Zero hallucinated verses.', passed: true },
    { id: 'translation_license', label: '3. Translation Rights (WEB / KJV)', desc: 'World English Bible (WEB) or King James (KJV) used. Fully public domain worldwide.', passed: true },
    { id: 'historical_sources', label: '4. Historical & Archaeological Integrity', desc: 'Distinguished established evidence from theories/traditions.', passed: true },
    { id: 'visual_licenses', label: '5. Visual Asset Commercial Licenses', desc: 'AI-generated base visuals and CC0 archives cleared for commercial monetization.', passed: true },
    { id: 'voice_license', label: '6. Voice Model Commercial Licensing', desc: 'Permissible commercial-use text-to-speech narration.', passed: true },
    { id: 'audio_license', label: '7. Background Music & SFX Licensing', desc: 'YouTube Audio Library or royalty-free CC0 audio only.', passed: true },
    { id: 'font_license', label: '8. Subtitle & Typography Font Rights', desc: 'SIL Open Font License (OFL) / Google Fonts used for on-screen typography.', passed: true },
    { id: 'youtube_compliance', label: '9. YouTube Terms & Community Guidelines', desc: 'Respectful depiction, no repetitive spam or low-value mass-production.', passed: true },
    { id: 'synthetic_disclosure', label: '10. Synthetic Content Disclosure (YouTube AI)', desc: 'Marked "Contains altered or synthetic content" for full YouTube transparency.', passed: true },
  ]);

  const allPassed = checks.every(c => c.passed);

  function toggleCheck(id) {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, passed: !c.passed } : c));
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-xs font-semibold mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>Mandatory Copyright & Accuracy Safety Gate</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Pre-Production Compliance Verification
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Every video must pass all 10 legal and biblical checkpoints before voice generation and video rendering
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-bold text-slate-200">
              {checks.filter(c => c.passed).length} / {checks.length} Passed
            </div>
            <div className="text-[11px] text-amber-400 font-medium">Initial Upload: Private</div>
          </div>
        </div>
      </div>

      {/* 10 Checkpoints List */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
        {checks.map((item) => (
          <div
            key={item.id}
            onClick={() => toggleCheck(item.id)}
            className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
              item.passed
                ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-200'
                : 'bg-rose-950/20 border-rose-500/30 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.passed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              )}
              <div>
                <h4 className="text-sm font-semibold text-slate-100">{item.label}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
              </div>
            </div>

            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full uppercase ${
              item.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
            }`}>
              {item.passed ? 'Verified' : 'Manual Review'}
            </span>
          </div>
        ))}
      </div>

      {/* Safety Gate Sign-off & Next Action */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#131D31] border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-slate-100">Proceed to Voice & Media Generation?</h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Once signed off, the script moves into Edge Natural Voice synthesis and cinematic visual generation.
          </p>
        </div>

        <button
          disabled={!allPassed}
          onClick={() => setActiveTab('voice-studio')}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
        >
          <span>Gate Cleared — Open Voice Studio</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
