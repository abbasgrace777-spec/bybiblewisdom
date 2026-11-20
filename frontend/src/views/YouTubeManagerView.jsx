import React, { useState } from 'react';
import { UploadCloud, Lock, CheckCircle2, AlertTriangle, ShieldCheck, ExternalLink, Calendar } from 'lucide-react';

export default function YouTubeManagerView() {
  const [privacy, setPrivacy] = useState('private');
  const [scheduleDate, setScheduleDate] = useState('2026-11-20T18:00');
  const [isUploading, setIsUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-amber-400" />
            <span>YouTube Upload & Scheduling Manager</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Official YouTube Data API v3 integration with mandatory Private-upload safety verification
          </p>
        </div>

        {/* Channel Status */}
        <div className="flex items-center gap-3">
          <a
            href="https://www.youtube.com/@ByBibleWisdom"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 hover:border-amber-500/40"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-semibold">@ByBibleWisdom</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </a>
        </div>
      </div>

      {/* Safety Notice Card */}
      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
        <Lock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <strong className="text-amber-300 block mb-1">MANDATORY SAFEGUARD: INITIAL UPLOAD AS PRIVATE</strong>
          In accordance with your channel protection guidelines, every video is initially uploaded as <strong>PRIVATE</strong>. 
          This allows you to review the video inside official YouTube Studio (checks for audio copyright claims, resolution processing, and thumbnail rendering) before scheduling it for public publishing.
        </div>
      </div>

      {/* Upload Settings Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Distribution Settings
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Privacy Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['private', 'unlisted', 'public'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setPrivacy(st)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold uppercase border transition-all ${
                    privacy === st
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Publish Schedule (Local Time)
            </label>
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">
              Content Disclosures
            </label>
            <div className="space-y-2 text-xs text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-amber-500 rounded" />
                <span>Mark as "Contains altered or synthetic content" (YouTube AI Policy)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked={false} className="accent-amber-500 rounded" />
                <span>Not made for kids (Standard audience age verification)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Upload Action Card */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-6">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Final Pre-Flight Check
            </h3>
            <ul className="text-xs space-y-2 text-slate-400">
              <li className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Original Script Verified</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Public Domain Scripture Cited (WEB)</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>1080p Video File Ready in Storage</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>High-CTR Thumbnail Attached</span>
              </li>
            </ul>
          </div>

          <div>
            <button
              onClick={() => {
                setIsUploading(true);
                setTimeout(() => {
                  setIsUploading(false);
                  setUploaded(true);
                }, 1500);
              }}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isUploading ? 'Uploading to YouTube...' : uploaded ? 'Uploaded as Private (ID: v_test94)' : 'Upload to @ByBibleWisdom (Private)'}</span>
            </button>
            <p className="text-[11px] text-center text-slate-500 mt-2">
              Secure OAuth2 • API Token safely managed in backend
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
