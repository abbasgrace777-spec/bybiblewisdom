import React from 'react';

export const ColorGrading: React.FC = () => {
  return (
    <>
      {/* 1. Cinematic Vignette (Soft dark border drawing focus to center) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.55) 100%)',
          pointerEvents: 'none',
          zIndex: 30,
        }}
      />

      {/* 2. Warm Biblical Amber Grade (Subtle earth tones & golden highlight presence) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(245, 158, 11, 0.03) 0%, rgba(180, 83, 9, 0.05) 100%)',
          mixBlendMode: 'soft-light',
          pointerEvents: 'none',
          zIndex: 31,
        }}
      />
    </>
  );
};
