import React from 'react';
import { interpolate, useCurrentFrame, Img } from 'remotion';
import { SceneData } from '../types';

interface SceneSequenceProps {
  scene: SceneData;
}

export const SceneSequence: React.FC<SceneSequenceProps> = ({ scene }) => {
  const frame = useCurrentFrame();
  const totalFrames = scene.durationFrames;

  // Calculate normalized progress (0.0 to 1.0)
  const progress = Math.min(1, Math.max(0, frame / totalFrames));

  // Ken Burns Camera Motion calculations
  let scale = 1.0;
  let translateX = 0;
  let translateY = 0;

  switch (scene.motion) {
    case 'ZOOM_IN':
      // Smooth slow zoom in from 1.00 to 1.15
      scale = interpolate(progress, [0, 1], [1.0, 1.15], { extrapolateRight: 'clamp' });
      break;

    case 'ZOOM_OUT':
      // Grand reveal slow zoom out from 1.15 to 1.00
      scale = interpolate(progress, [0, 1], [1.15, 1.0], { extrapolateRight: 'clamp' });
      break;

    case 'PAN_LEFT':
      // Cinematic slow pan from right to left
      scale = 1.12;
      translateX = interpolate(progress, [0, 1], [40, -40], { extrapolateRight: 'clamp' });
      break;

    case 'PAN_RIGHT':
      // Cinematic slow pan from left to right
      scale = 1.12;
      translateX = interpolate(progress, [0, 1], [-40, 40], { extrapolateRight: 'clamp' });
      break;

    case 'STATIC':
    default:
      scale = 1.0;
      break;
  }

  // Crossfade opacity at scene boundaries (first 15 frames and last 15 frames = 0.5s at 30fps)
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [totalFrames - 15, totalFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = Math.min(fadeIn, fadeOut);

  // Parallax subtle shadow depth
  const parallaxOffset = interpolate(progress, [0, 1], [-8, 8]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        opacity,
      }}
    >
      {/* Background Layer: Actual Generated Biblical Image */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          transformOrigin: 'center 32%',
          transition: 'transform 0.05s linear',
        }}
      >
        <Img
          src={scene.imageUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 15%',
          }}
        />
      </div>

      {/* Subtle Parallax Depth Gradient Overlay (Track 2) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(11,19,43,0.1) 0%, rgba(5,11,20,0.55) 100%)',
          transform: `translate(${parallaxOffset * 0.5}px, ${parallaxOffset * 0.2}px)`,
          pointerEvents: 'none',
        }}
      />

      {/* Subtle Warm Earth Color Grading Tint */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(217, 119, 6, 0.04)',
          mixBlendMode: 'color',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
