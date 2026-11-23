const path = require('node:path');
const fs = require('node:fs');
const { execFileSync, spawnSync } = require('node:child_process');
const config = require('../config');
const { query, get } = require('../db/database');

// Biblical and spiritual keywords highlighted in radiant gold in Cinematic Bible Documentary style
const BIBLICAL_KEYWORDS = new Set([
  'god', 'lord', 'jesus', 'christ', 'spirit', 'holy', 'beginning', 'created', 'creation',
  'heaven', 'heavens', 'earth', 'light', 'darkness', 'waters', 'firmament', 'seas',
  'morning', 'evening', 'day', 'night', 'sun', 'moon', 'stars', 'living', 'creatures',
  'blessed', 'image', 'likeness', 'dominion', 'rested', 'sabbath', 'faith', 'glory',
  'grace', 'truth', 'life', 'eternal', 'savior', 'covenant', 'wisdom', 'righteousness',
  'mercy', 'prayer', 'shepherd', 'salvation', 'peace', 'blessing', 'amen', 'prophet',
  'kingdom', 'messiah', 'psalm', 'genesis', 'gospel', 'almighty', 'father',
  'commandment', 'commandments', 'word', 'testament', 'sacred', 'resurrection', 'cross',
  'redemption', 'hope', 'soul', 'heal', 'heals', 'healing', 'strength', 'comfort',
  'rest', 'body', 'heart', 'recovery', 'mighty', 'praise', 'trust', 'miracle', 'miracles'
]);

class SubtitleService {
  /**
   * Parse standard SRT text into cue objects for Remotion and FFmpeg players
   */
  parseSrtToCues(srtText) {
    if (!srtText) return [];
    const blocks = srtText.trim().split(/\n\s*\n/);
    const cues = [];
    for (const b of blocks) {
      const lines = b.trim().split('\n');
      if (lines.length >= 3) {
        const id = parseInt(lines[0], 10) || (cues.length + 1);
        const timing = lines[1];
        const text = lines.slice(2).join('\n');
        const match = timing.match(/(\d+):(\d+):(\d+),(\d+)\s*-->\s*(\d+):(\d+):(\d+),(\d+)/);
        if (match) {
          const startMs = (parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseInt(match[3])) * 1000 + parseInt(match[4]);
          const endMs = (parseInt(match[5]) * 3600 + parseInt(match[6]) * 60 + parseInt(match[7])) * 1000 + parseInt(match[8]);
          cues.push({
            id,
            text,
            startMs,
            endMs,
            durationMs: Math.max(200, endMs - startMs)
          });
        }
      }
    }
    return cues;
  }

  /**
   * Break text into natural spoken phrases for dynamic subtitle display
   */
  splitIntoPhrases(text, isShorts = true) {
    const clean = (text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return [];

    // Shorts: Punchy 3-5 word bursts for high retention mobile viewership
    // Long-Form: Dignified 6-8 word phrases for documentary immersion
    const targetWords = isShorts ? 4 : 7;
    const sentences = clean.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [clean];
    const phrases = [];

    for (const rawSentence of sentences) {
      const sentence = rawSentence.trim();
      if (!sentence) continue;

      const words = sentence.split(' ');
      if (words.length <= targetWords + 1) {
        phrases.push(sentence);
      } else {
        let chunk = [];
        for (let i = 0; i < words.length; i++) {
          chunk.push(words[i]);
          const w = words[i];
          const hasPause = /[,;—–]/.test(w);
          if (chunk.length >= targetWords || (hasPause && chunk.length >= 3)) {
            phrases.push(chunk.join(' '));
            chunk = [];
          }
        }
        if (chunk.length > 0) {
          if (phrases.length > 0 && chunk.length < 3) {
            phrases[phrases.length - 1] += ' ' + chunk.join(' ');
          } else {
            phrases.push(chunk.join(' '));
          }
        }
      }
    }

    return phrases.length > 0 ? phrases : [clean];
  }

  /**
   * Format text according to the selected subtitle style:
   * - 'cinematic': Pure white text with key biblical & prayer terms highlighted in radiant luminous gold (&H001FD8FF&)
   */
  formatStyledAssText(text, style = 'cinematic', isShorts = false) {
    const cleanText = text.replace(/\n+/g, ' ').replace(/[{}]/g, '').trim();

    if (style === 'cinematic') {
      const tokens = cleanText.split(' ');
      const styledTokens = tokens.map(token => {
        const stripped = token.toLowerCase().replace(/[^a-z]/g, '');
        if (BIBLICAL_KEYWORDS.has(stripped)) {
          return `{\\c&H001FD8FF&}${token}{\\c&H00FFFFFF&}`;
        }
        return token;
      });
      return styledTokens.join(' ');
    }

    return cleanText;
  }

  /**
   * Primary Stage 1 Subtitle Generator:
   * 1. Uses local faster-whisper (small.en / base.en on CUDA RTX 3050 or CPU fallback) for word-level acoustic alignment.
   * 2. Preserves approved script text faithfully (Whisper used ONLY for timings; Scripture quotes match database exactly).
   * 3. Max 2 lines per cue, 36-42 chars/line, 1-6s each, natural phrase breaks.
   * 4. Enforces strict QC: last cue ends within 3s of narration end, no cue starts after audio ends, no gap > 4s.
   */
  generateSubtitles(projectId, segments, format = 'LONG_FORM', subtitleStyle = 'cinematic', options = {}) {
    if (!segments || !Array.isArray(segments)) {
      segments = query('SELECT * FROM script_segments WHERE project_id = ? ORDER BY segment_order ASC', [projectId]);
    }
    const isShorts = format === 'SHORTS';
    const projectAudioDir = path.join(config.PATHS.PROJECTS, projectId, 'audio');
    const masterNarrationPath = path.join(projectAudioDir, 'narration.mp3');
    const outputDir = path.join(config.PATHS.PROJECTS, projectId, 'subtitles');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const srtOutPath = path.join(outputDir, 'subtitles.srt');
    const assOutPath = path.join(outputDir, 'subtitles.ass');

    // Reuse existing verified subtitles if available and not forced and duration matches
    if (!options.forceRealign && fs.existsSync(srtOutPath) && fs.existsSync(assOutPath)) {
      const srtStat = fs.statSync(srtOutPath);
      if (srtStat.size > 200) {
        const srt = fs.readFileSync(srtOutPath, 'utf8');
        const ass = fs.readFileSync(assOutPath, 'utf8');
        const cues = this.parseSrtToCues(srt);
        if (cues.length > 0) {
          let audioDur = 0;
          if (fs.existsSync(masterNarrationPath)) {
            try {
              const p = execFileSync(config.PATHS.FFPROBE, ['-i', masterNarrationPath, '-show_entries', 'format=duration', '-v', 'quiet', '-of', 'csv=p=0'], { encoding: 'utf8' }).trim();
              audioDur = parseFloat(p) || 0;
            } catch (_) {}
          }
          const cueLastSec = cues[cues.length - 1].endMs / 1000;
          if (audioDur <= 0 || Math.abs(cueLastSec - audioDur) <= 4.0) {
            console.log(`[SubtitleService] Reusing verified faster-whisper subtitles (${cues.length} cues, ${cueLastSec.toFixed(1)}s)...`);
            return {
              srt,
              ass,
              cues,
              totalDurationMs: cues[cues.length - 1].endMs,
              subtitleStyle
            };
          } else {
            console.log(`[SubtitleService] Cached subtitles duration (${cueLastSec.toFixed(1)}s) does not match narration (${audioDur.toFixed(1)}s). Re-aligning with Whisper...`);
          }
        }
      }
    }

    // 1. Attempt Faster-Whisper Alignment if master narration audio is present
    if (fs.existsSync(masterNarrationPath)) {
      try {
        const scriptRow = get(`SELECT full_narration_text FROM scripts WHERE project_id = ? ORDER BY version DESC LIMIT 1`, [projectId]);
        const scriptText = scriptRow?.full_narration_text || (segments || []).map(s => s.narration_text).join(' ');

        const tempScriptPath = path.join(outputDir, 'temp_script.txt');
        fs.writeFileSync(tempScriptPath, scriptText, 'utf8');

        const pythonExe = path.join(config.PATHS.ROOT, 'tools', 'ai_env', 'Scripts', 'python.exe');
        const alignerScript = path.join(config.PATHS.ROOT, 'tools', 'scripts', 'whisper_aligner.py');

        if (fs.existsSync(pythonExe) && fs.existsSync(alignerScript)) {
          console.log(`[SubtitleService] Executing faster-whisper acoustic alignment on ${masterNarrationPath}...`);
          const rawQc = execFileSync(pythonExe, [
            alignerScript,
            masterNarrationPath,
            tempScriptPath,
            srtOutPath,
            assOutPath,
            isShorts ? 'SHORTS' : 'LONG_FORM'
          ], { encoding: 'utf8' });

          const qc = JSON.parse(rawQc.trim());
          const srt = fs.readFileSync(srtOutPath, 'utf8');
          const ass = fs.readFileSync(assOutPath, 'utf8');
          const cues = this.parseSrtToCues(srt);

          console.log(`[SubtitleService] Faster-Whisper alignment completed: ${cues.length} cues, coverage: ${qc.speech_to_cue_coverage_percentage}%, status: ${qc.status}`);

          return {
            srt,
            ass,
            cues,
            qc,
            totalDurationMs: Math.round(qc.audio_duration_seconds * 1000),
            subtitleStyle
          };
        }
      } catch (whisperErr) {
        console.warn(`[SubtitleService] Faster-whisper alignment notice: ${whisperErr.message}. Executing acoustic fallback.`);
      }
    }

    // 2. Acoustic Fallback: Pre-audio or fallback generation
    const allSceneCues = [];
    let currentStartMs = 0;
    let totalNarrationSec = 0;

    if (fs.existsSync(masterNarrationPath)) {
      try {
        const probe = execFileSync(config.PATHS.FFPROBE, [
          '-i', masterNarrationPath,
          '-show_entries', 'format=duration',
          '-v', 'quiet',
          '-of', 'csv=p=0'
        ], { encoding: 'utf8' }).trim();
        totalNarrationSec = parseFloat(probe) || 0;
      } catch (_) { }
    }

    segments.forEach((seg) => {
      const actualSceneDuration = parseFloat(seg.duration_seconds || 5);
      const segDurationMs = Math.round(actualSceneDuration * 1000);
      const narrationText = (seg.narration_text || '').trim();

      const phrases = this.splitIntoPhrases(narrationText, isShorts);
      const phraseDurMs = Math.round(segDurationMs / Math.max(1, phrases.length));
      phrases.forEach((phrase, idx) => {
        const startMs = currentStartMs + (idx * phraseDurMs);
        const endMs = Math.min(startMs + phraseDurMs, currentStartMs + segDurationMs);
        allSceneCues.push({
          id: allSceneCues.length + 1,
          text: phrase,
          startMs,
          endMs,
          durationMs: endMs - startMs
        });
      });
      currentStartMs += segDurationMs;
    });

    const totalVideoDurationMs = Math.round((totalNarrationSec > 0 ? totalNarrationSec : (currentStartMs / 1000)) * 1000);
    const srtContent = [];
    const assEvents = [];

    allSceneCues.forEach((cue) => {
      const srtTime = `${this.formatSrtTime(cue.startMs)} --> ${this.formatSrtTime(cue.endMs)}`;
      srtContent.push(`${cue.id}\n${srtTime}\n${cue.text}\n`);
      const assStart = this.formatAssTime(cue.startMs);
      const assEnd = this.formatAssTime(cue.endMs);
      const styledText = this.formatStyledAssText(cue.text, subtitleStyle);
      assEvents.push(`Dialogue: 0,${assStart},${assEnd},Default,,0,0,0,,${styledText}`);
    });

    const assHeader = this.getAssHeader(isShorts, subtitleStyle);
    const assFull = `${assHeader}\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n${assEvents.join('\n')}`;

    return {
      srt: srtContent.join('\n'),
      ass: assFull,
      cues: allSceneCues,
      totalDurationMs: totalVideoDurationMs,
      subtitleStyle
    };
  }

  formatSrtTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const millis = ms % 1000;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
  }

  formatAssTime(ms) {
    const totalSec = Math.floor(ms / 1000);
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    const centis = Math.floor((ms % 1000) / 10);
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
  }

  getAssHeader(isShorts, style) {
    const playResX = isShorts ? config.VIDEO.SHORTS.WIDTH : config.VIDEO.LONG_FORM.WIDTH;
    const playResY = isShorts ? config.VIDEO.SHORTS.HEIGHT : config.VIDEO.LONG_FORM.HEIGHT;
    // Shorts: High-impact 52pt font positioned in the safe zone (marginV = 680) above YouTube Shorts UI overlays
    // Long-Form: Dignified 40pt font placed cleanly at the bottom margin (marginV = 80)
    const fontSize = isShorts ? 52 : 40;
    const marginV = isShorts ? 680 : 80;
    const outline = isShorts ? 3.8 : 2.8;
    const shadow = isShorts ? 2.0 : 1.8;
    const spacing = isShorts ? 0.6 : 0.4;

    return `[Script Info]
Title: ByBibleWisdom Professional Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709
PlayResX: ${playResX}
PlayResY: ${playResY}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Trebuchet MS,${fontSize},&H00FFFFFF,&H000000FF,&H000B0E14,&H80000000,-1,0,0,0,100,100,${spacing},0,1,${outline},${shadow},2,40,40,${marginV},1`;
  }
}

module.exports = new SubtitleService();
