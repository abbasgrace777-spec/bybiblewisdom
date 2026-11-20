import React from 'react';
import { Sequence, Audio } from 'remotion';
import { BibleVideoProps } from '../types';
import { SceneSequence } from '../components/SceneSequence';
import { SubtitleOverlay } from '../components/SubtitleOverlay';
import { TitleCard } from '../components/TitleCard';
import { ColorGrading } from '../components/ColorGrading';

export const BibleVideoComposition: React.FC<BibleVideoProps> = ({
  bookTitle,
  chapterNumber,
  translation,
  totalDurationFrames,
  audioUrl,
  subtitleStyle,
  scenes,
  subtitles,
}) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#050B14',
        overflow: 'hidden',
      }}
    >
      {/* TRACK 1 & 2: Real Generated Biblical Images & Ken Burns Sequences */}
      {scenes.map((scene) => (
        <Sequence
          key={scene.sceneNumber}
          from={scene.startFrame}
          durationInFrames={scene.durationFrames}
        >
          <SceneSequence scene={scene} />
        </Sequence>
      ))}

      {/* TRACK 2b: Consistent Biblical Color Grading & Vignette */}
      <ColorGrading />

      {/* TRACK 3: Primary Narration Audio (STRICT RULE: PURE VOICE, ZERO BACKGROUND MUSIC) */}
      {audioUrl && (
        <Audio
          src={audioUrl}
          startFrom={0}
          volume={1.0}
        />
      )}

      {/* TRACK 4: Professional Subtitles Synchronized with Narration Speech */}
      <SubtitleOverlay
        subtitles={subtitles}
        style={subtitleStyle}
      />

      {/* TRACK 5: Chapter Title Card & Visual Bible References */}
      <TitleCard
        bookTitle={bookTitle}
        chapterNumber={chapterNumber}
        translation={translation}
        totalDurationFrames={totalDurationFrames}
      />
    </div>
  );
};
