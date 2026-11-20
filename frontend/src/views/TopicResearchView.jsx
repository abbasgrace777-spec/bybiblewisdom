import React, { useState } from 'react';
import { Sparkles, BookOpen, Landmark, Heart, Flame, ArrowRight, Video } from 'lucide-react';

export default function TopicResearchView({ onStartProject }) {
  const [category, setCategory] = useState('ALL');

  const TOPIC_IDEAS = [
    {
      id: 1,
      title: 'The Secret Word God Spoke Before Creation',
      hook: 'Before the stars existed, before time was born, God spoke three words that shattered eternity...',
      category: 'BIBLE_BOOK',
      book: 'Genesis',
      chapter: 1,
      format: 'SHORTS',
      duration: '45s',
      viralScore: 98,
      angle: 'Creation & Divine Sovereignty'
    },
    {
      id: 2,
      title: 'The Cyrus Cylinder: When an Ancient Emperor Proved the Bible Right',
      hook: 'In 1879, archaeologists dug up a clay cylinder in Iraq that stunned the secular world...',
      category: 'HISTORICAL_STORY',
      book: 'Ezra',
      chapter: 1,
      format: 'LONG_FORM',
      duration: '12m',
      viralScore: 94,
      angle: 'Biblical Archaeology & Ancient Persia'
    },
    {
      id: 3,
      title: 'Why Jesus Answered When He Seemed Silent',
      hook: 'When everyone urged Him to speak, Christ stayed silent. But why did He finally break it?',
      category: 'JESUS_TEACHING',
      book: 'Matthew',
      chapter: 26,
      format: 'SHORTS',
      duration: '50s',
      viralScore: 96,
      angle: 'Parables & Miracles'
    },
    {
      id: 4,
      title: 'The Valley of Dry Bones: Ezekiel’s Bizarre Vision Explained',
      hook: 'Imagine standing in an open valley filled with millions of bleached skeletons, and God commands you to speak to them.',
      category: 'BIBLE_BOOK',
      book: 'Ezekiel',
      chapter: 37,
      format: 'LONG_FORM',
      duration: '15m',
      viralScore: 92,
      angle: 'Prophecy & Resurrection Hope'
    },
    {
      id: 5,
      title: 'The Mysterious City Beneath Jerusalem: Hezekiah’s Miracle Tunnel',
      hook: 'How did ancient miners carve 1,700 feet through solid bedrock from opposite ends and meet in the dark with zero compass?',
      category: 'HISTORICAL_STORY',
      book: '2 Kings',
      chapter: 20,
      format: 'SHORTS',
      duration: '55s',
      viralScore: 95,
      angle: 'Archaeology & City of David'
    },
    {
      id: 6,
      title: 'Romans 8: The Most Powerful Chapter Ever Written in Human History',
      hook: 'If you only had one chapter of the Bible on a deserted island, this is the one theologians agree you must take.',
      category: 'BIBLE_BOOK',
      book: 'Romans',
      chapter: 8,
      format: 'LONG_FORM',
      duration: '18m',
      viralScore: 99,
      angle: 'Theological Deep-Dive & Life in the Spirit'
    }
  ];

  const filtered = TOPIC_IDEAS.filter(t => category === 'ALL' || t.category === category);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" />
            <span>AI Topic Research & Hook Generator</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            High-retention video angles optimized for YouTube Shorts and cinematic biblical documentary retention
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'ALL', label: 'All Topics' },
            { id: 'BIBLE_BOOK', label: '66 Books' },
            { id: 'HISTORICAL_STORY', label: 'Archaeology' },
            { id: 'JESUS_TEACHING', label: 'Jesus’ Teachings' }
          ].map(c => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                category === c.id
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(item => (
          <div
            key={item.id}
            className="p-6 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 hover:bg-slate-800/30 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                  item.format === 'SHORTS' ? 'bg-sky-500/10 text-sky-300 border-sky-500/20' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                }`}>
                  {item.format} • {item.duration}
                </span>

                <div className="flex items-center gap-1 text-[11px] font-bold text-amber-400">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{item.viralScore}% Viral Potential</span>
                </div>
              </div>

              <h3 className="text-base font-serif font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                {item.title}
              </h3>

              <div className="mt-3 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 italic">
                <span className="text-amber-400 font-bold not-italic">Hook: </span>
                "{item.hook}"
              </div>

              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <span className="font-semibold text-slate-300">{item.book} {item.chapter}</span>
                <span>•</span>
                <span>{item.angle}</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/60">
              <button
                onClick={() => onStartProject({
                  title: item.title,
                  topic: item.hook,
                  category: item.category,
                  format: item.format,
                  bible_book: item.book,
                  chapter_start: item.chapter,
                  chapter_end: item.chapter,
                })}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 font-semibold text-xs text-slate-200 flex items-center justify-center gap-2 transition-all"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Launch This Video</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
