import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

interface TitleCardProps {
  bookTitle: string;
  chapterNumber: number;
  translation: string;
  totalDurationFrames: number;
}

export const TitleCard: React.FC<TitleCardProps> = ({
  bookTitle,
  chapterNumber,
  translation,
  totalDurationFrames,
}) => {
  const frame = useCurrentFrame();

  // 1. Opening Title Card (Frames 10 to 180 = ~6 seconds)
  const isOpening = frame <= 180;
  const isClosing = frame >= totalDurationFrames - 120;

  if (!isOpening && !isClosing) return null;

  // Opening Fade In / Fade Out
  let opacity = 0;
  if (isOpening) {
    const fadeIn = interpolate(frame, [10, 35], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fadeOut = interpolate(frame, [150, 180], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    opacity = Math.min(fadeIn, fadeOut);
  } else if (isClosing) {
    // Closing Fade In / Fade Out
    const fadeIn = interpolate(frame, [totalDurationFrames - 120, totalDurationFrames - 95], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    const fadeOut = interpolate(frame, [totalDurationFrames - 30, totalDurationFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    opacity = Math.min(fadeIn, fadeOut);
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: isOpening ? '80px' : '50%',
        left: '50%',
        transform: isOpening ? 'translateX(-50%)' : 'translate(-50%, -50%)',
        textAlign: 'center',
        opacity,
        pointerEvents: 'none',
        zIndex: 40,
      }}
    >
      {isOpening ? (
        <div
          style={{
            padding: '16px 36px',
            backgroundColor: 'rgba(11, 19, 43, 0.75)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 800,
              color: '#F59E0B',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              marginBottom: '4px',
            }}
          >
            ByBibleWisdom Documentary
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: '44px',
              fontWeight: 900,
              color: '#FFFFFF',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              textShadow: '0 4px 12px rgba(0,0,0,0.8)',
            }}
          >
            {bookTitle} Chapter {chapterNumber}
          </h1>
          <div
            style={{
              fontSize: '14px',
              fontWeight: 600,
              color: '#CBD5E1',
              marginTop: '4px',
            }}
          >
            Verse-by-Verse Scripture Exposition • {translation} Translation
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '24px 48px',
            backgroundColor: 'rgba(11, 19, 43, 0.85)',
            backdropFilter: 'blur(16px)',
            borderRadius: '20px',
            border: '1px solid rgba(245, 158, 11, 0.5)',
            boxShadow: '0 12px 48px rgba(0, 0, 0, 0.8)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '36px',
              fontWeight: 900,
              color: '#FCD34D',
              marginBottom: '8px',
            }}
          >
            Subscribe to @ByBibleWisdom
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: '18px',
              fontWeight: 600,
              color: '#FFFFFF',
            }}
          >
            Continue the journey with {bookTitle} Chapter {chapterNumber + 1}
          </p>
        </div>
      )}
    </div>
  );
};
