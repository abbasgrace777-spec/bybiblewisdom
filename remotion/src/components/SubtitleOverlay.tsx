import React from 'react';
import { useCurrentFrame } from 'remotion';
import { SubtitleCue, SubtitleStyle } from '../types';

interface SubtitleOverlayProps {
  subtitles: SubtitleCue[];
  style: SubtitleStyle;
}

const BIBLICAL_KEYWORDS = new Set([
  'god', 'lord', 'jesus', 'christ', 'spirit', 'holy', 'beginning', 'created', 'creation',
  'heaven', 'heavens', 'earth', 'light', 'darkness', 'waters', 'firmament', 'seas',
  'morning', 'evening', 'day', 'night', 'sun', 'moon', 'stars', 'living', 'creatures',
  'blessed', 'image', 'likeness', 'dominion', 'rested', 'sabbath', 'faith', 'glory',
  'grace', 'truth', 'life', 'eternal', 'savior', 'covenant', 'wisdom', 'righteousness'
]);

export const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({ subtitles, style }) => {
  const frame = useCurrentFrame();

  // Find active subtitle cue at this exact frame
  const activeCue = subtitles.find(
    cue => frame >= cue.startFrame && frame <= cue.endFrame
  );

  if (!activeCue) return null;

  // Split words to apply gold keyword highlights
  const words = activeCue.text.split(/\s+/);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '85px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '85%',
        maxWidth: '1200px',
        textAlign: 'center',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: 'inline-block',
          padding: style === 'educational' ? '12px 28px' : '8px 20px',
          backgroundColor:
            style === 'educational'
              ? 'rgba(15, 23, 42, 0.85)'
              : style === 'documentary'
              ? 'rgba(0, 0, 0, 0.65)'
              : 'transparent',
          borderRadius: style === 'educational' ? '16px' : '8px',
          border: style === 'educational' ? '1px solid rgba(245, 158, 11, 0.3)' : 'none',
          boxShadow: style === 'educational' ? '0 8px 32px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '34px',
            lineHeight: 1.35,
            fontWeight: 800,
            fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
            letterSpacing: '0.02em',
            textShadow:
              style === 'cinematic' || style === 'word_highlight'
                ? '0 3px 6px rgba(0, 0, 0, 0.95), 0 0 12px rgba(0, 0, 0, 0.8)'
                : '0 2px 4px rgba(0, 0, 0, 0.9)',
          }}
        >
          {words.map((word, idx) => {
            const stripped = word.toLowerCase().replace(/[^a-z]/g, '');
            const isBiblical = BIBLICAL_KEYWORDS.has(stripped);

            let color = '#FFFFFF';
            if ((style === 'cinematic' || style === 'word_highlight') && isBiblical) {
              color = '#FCD34D'; // Radiant bright gold for sacred keywords
            }

            return (
              <span
                key={idx}
                style={{
                  color,
                  display: 'inline-block',
                  marginRight: '8px',
                  fontWeight: isBiblical ? 900 : 700,
                  transform: isBiblical && style === 'word_highlight' ? 'scale(1.05)' : 'none',
                  transition: 'transform 0.1s ease',
                }}
              >
                {word}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
};
