export type MotionType = 'ZOOM_IN' | 'ZOOM_OUT' | 'PAN_LEFT' | 'PAN_RIGHT' | 'STATIC';
export type SubtitleStyle = 'cinematic' | 'documentary' | 'word_highlight' | 'educational';

export interface SceneData {
  sceneNumber: number;
  imageUrl: string;
  durationFrames: number;
  durationSeconds: number;
  startFrame: number;
  motion: MotionType;
  narrationText: string;
  visualDescription?: string;
}

export interface SubtitleCue {
  id: number;
  text: string;
  startFrame: number;
  endFrame: number;
  startMs: number;
  endMs: number;
  highlightedWords?: string[];
}

export interface BibleVideoProps {
  projectId: string;
  bookTitle: string;
  chapterNumber: number;
  translation: string;
  fps: number;
  width: number;
  height: number;
  totalDurationFrames: number;
  audioUrl: string; // Strictly narration only, ZERO BGM
  subtitleStyle: SubtitleStyle;
  scenes: SceneData[];
  subtitles: SubtitleCue[];
}
