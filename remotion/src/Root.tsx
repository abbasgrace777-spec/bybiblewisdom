import React from 'react';
import { Composition } from 'remotion';
import { BibleVideoComposition } from './compositions/BibleVideoComposition';
import { BibleVideoProps } from './types';

// Default mock props for Remotion Preview
const defaultProps: BibleVideoProps = {
  projectId: 'genesis_1_demo',
  bookTitle: 'Genesis',
  chapterNumber: 1,
  translation: 'World English Bible (WEB)',
  fps: 30,
  width: 1920,
  height: 1080,
  totalDurationFrames: 900, // 30 seconds preview default
  audioUrl: '', // strictly pure narration, zero BGM
  subtitleStyle: 'cinematic',
  scenes: [
    {
      sceneNumber: 1,
      imageUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914',
      durationFrames: 300,
      durationSeconds: 10,
      startFrame: 0,
      motion: 'ZOOM_IN',
      narrationText: 'In the beginning, God created the heavens and the earth.',
    },
    {
      sceneNumber: 2,
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23',
      durationFrames: 300,
      durationSeconds: 10,
      startFrame: 300,
      motion: 'PAN_LEFT',
      narrationText: 'The earth was without form, and darkness was over the face of the deep.',
    },
    {
      sceneNumber: 3,
      imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
      durationFrames: 300,
      durationSeconds: 10,
      startFrame: 600,
      motion: 'ZOOM_OUT',
      narrationText: 'And God said, Let there be light, and there was light.',
    },
  ],
  subtitles: [
    {
      id: 1,
      text: 'In the beginning, God created the heavens and the earth.',
      startFrame: 15,
      endFrame: 280,
      startMs: 500,
      endMs: 9300,
      highlightedWords: ['beginning', 'God', 'heavens', 'earth'],
    },
    {
      id: 2,
      text: 'The earth was without form, and darkness was over the face of the deep.',
      startFrame: 315,
      endFrame: 580,
      startMs: 10500,
      endMs: 19300,
      highlightedWords: ['earth', 'form', 'darkness'],
    },
    {
      id: 3,
      text: 'And God said, Let there be light, and there was light.',
      startFrame: 615,
      endFrame: 880,
      startMs: 20500,
      endMs: 29300,
      highlightedWords: ['God', 'light'],
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 16:9 Long-Form Master Composition */}
      <Composition
        id="BibleChapterVideo"
        component={BibleVideoComposition}
        durationInFrames={defaultProps.totalDurationFrames}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProps}
      />

      {/* 9:16 Shorts Master Composition */}
      <Composition
        id="BibleChapterShorts"
        component={BibleVideoComposition}
        durationInFrames={1800} // 60 seconds
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          ...defaultProps,
          width: 1080,
          height: 1920,
        }}
      />
    </>
  );
};
