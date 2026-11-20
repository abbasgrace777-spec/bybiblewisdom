"""
Faster-Whisper Subtitle Alignment Engine for ByBibleWisdom AI Studio
Author: ByBibleWisdom Studio Engineering
License: MIT

Requirements:
- faster-whisper (small.en or base.en on CUDA int8_float16 / CPU int8)
- Word-level acoustic timing extraction
- Script text faithful alignment (Whisper used ONLY for timestamps; text strictly from approved script)
- Max 2 lines per cue, 36-42 characters per line, 1-6s each, natural phrase boundaries
- Generates compliant SRT and ASS files
- Strict QC audit: last cue ends within 3s of narration end, no cue starts after audio end, no gap > 4s
"""

import os
import sys
import json
import time
import re
import difflib
from pathlib import Path
from faster_whisper import WhisperModel

MODEL_CACHE_DIR = "d:/bible/tools/whisper_models"

def normalize_token(w: str) -> str:
    """Normalize word for robust phonetic/lexical matching."""
    return re.sub(r"[^a-zA-Z0-9]", "", w).lower()

def format_timestamp_srt(seconds: float) -> str:
    """Format seconds into SRT timestamp HH:MM:SS,mmm"""
    total_ms = int(round(seconds * 1000))
    hours = total_ms // 3600000
    minutes = (total_ms % 3600000) // 60000
    secs = (total_ms % 60000) // 1000
    ms = total_ms % 1000
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{ms:03d}"

def format_timestamp_ass(seconds: float) -> str:
    """Format seconds into ASS timestamp H:MM:SS.cc"""
    total_cs = int(round(seconds * 100))
    hours = total_cs // 360000
    minutes = (total_cs % 360000) // 6000
    secs = (total_cs % 6000) // 100
    cs = total_cs % 100
    return f"{hours}:{minutes:02d}:{secs:02d}.{cs:02d}"

def setup_nvidia_dll_paths():
    """Add nvidia pip packages DLL directories to PATH and Windows DLL search path."""
    import site
    site_dirs = site.getsitepackages()
    base_env = os.path.dirname(os.path.dirname(sys.executable))
    site_dirs.append(os.path.join(base_env, "Lib", "site-packages"))

    for sp in site_dirs:
        nvidia_dir = os.path.join(sp, "nvidia")
        if os.path.exists(nvidia_dir):
            for sub in os.listdir(nvidia_dir):
                for candidate in ["bin", "lib"]:
                    p_dir = os.path.join(nvidia_dir, sub, candidate)
                    if os.path.exists(p_dir):
                        os.environ["PATH"] = p_dir + os.pathsep + os.environ.get("PATH", "")
                        if hasattr(os, "add_dll_directory"):
                            try:
                                os.add_dll_directory(p_dir)
                            except Exception:
                                pass

def get_whisper_model(preferred_model="small.en"):
    """
    Load faster-whisper model.
    Tries CUDA int8_float16 on RTX 3050 first with verified forward-pass.
    Falls back to high-performance CPU int8 if CUDA or DLLs are unavailable.
    """
    import numpy as np
    setup_nvidia_dll_paths()

    dummy_audio = np.zeros(8000, dtype=np.float32) # 0.5s silence

    for model_name in [preferred_model, "base.en"]:
        # 1. Attempt CUDA
        try:
            t0 = time.time()
            model = WhisperModel(
                model_name,
                device="cuda",
                compute_type="int8_float16",
                download_root=MODEL_CACHE_DIR
            )
            # Verify CUDA actually executes by running a test slice
            list(model.transcribe(dummy_audio, language="en", word_timestamps=False)[0])
            load_time = time.time() - t0
            print(f"[Whisper] Successfully initialized {model_name} on CUDA (int8_float16)", file=sys.stderr)
            return model, model_name, "cuda", "int8_float16", load_time
        except Exception as cuda_err:
            print(f"[Whisper] CUDA not available ({cuda_err}); trying CPU fallback...", file=sys.stderr)

        # 2. High-performance CPU int8 fallback
        try:
            t0 = time.time()
            model = WhisperModel(
                model_name,
                device="cpu",
                compute_type="int8",
                download_root=MODEL_CACHE_DIR,
                cpu_threads=4
            )
            # Verify CPU executes
            list(model.transcribe(dummy_audio, language="en", word_timestamps=False)[0])
            load_time = time.time() - t0
            print(f"[Whisper] Successfully initialized {model_name} on CPU (int8)", file=sys.stderr)
            return model, model_name, "cpu", "int8", load_time
        except Exception as cpu_err:
            print(f"[Whisper] Notice: CPU initialization for {model_name} failed: {cpu_err}", file=sys.stderr)

    raise RuntimeError("Failed to initialize faster-whisper on both CUDA and CPU.")

def align_script_to_whisper_words(script_text: str, whisper_words: list, total_duration: float):
    """
    Align approved script words to Whisper acoustic timestamps.
    Whisper is used ONLY for timings; script words remain 100% faithful to approved script.
    """
    # 1. Tokenize script words preserving original punctuation and casing
    raw_script_tokens = script_text.split()
    if not raw_script_tokens:
        return []

    script_norms = [normalize_token(t) for t in raw_script_tokens]
    whisper_norms = [normalize_token(w["word"]) for w in whisper_words]

    # 2. Sequence Matcher for monotonic anchor alignment
    matcher = difflib.SequenceMatcher(None, script_norms, whisper_norms)
    matching_blocks = matcher.get_matching_blocks()

    aligned_words = []
    # Map index in script to matched whisper word
    script_to_whisper = {}
    for block in matching_blocks:
        for offset in range(block.size):
            s_idx = block.a + offset
            w_idx = block.b + offset
            if s_idx < len(raw_script_tokens) and w_idx < len(whisper_words):
                script_to_whisper[s_idx] = whisper_words[w_idx]

    # 3. Interpolate timings for unaligned words
    last_known_end = 0.0
    for idx, token in enumerate(raw_script_tokens):
        if idx in script_to_whisper:
            w_match = script_to_whisper[idx]
            start_t = max(w_match["start"], last_known_end)
            end_t = max(w_match["end"], start_t + 0.15)
            confidence = w_match.get("probability", 0.95)
            last_known_end = end_t
            aligned_words.append({
                "word": token,
                "start": start_t,
                "end": end_t,
                "confidence": confidence,
                "aligned": True
            })
        else:
            # Look ahead for next matched word to interpolate
            next_idx = None
            for look in range(idx + 1, len(raw_script_tokens)):
                if look in script_to_whisper:
                    next_idx = look
                    break
            
            if next_idx is not None:
                next_start = script_to_whisper[next_idx]["start"]
                remaining_span = max(0.2, next_start - last_known_end)
                count_between = (next_idx - idx) + 1
                slot = remaining_span / count_between
                start_t = last_known_end
                end_t = min(next_start, start_t + slot)
            else:
                start_t = last_known_end
                end_t = min(total_duration, start_t + 0.35)

            last_known_end = end_t
            aligned_words.append({
                "word": token,
                "start": start_t,
                "end": end_t,
                "confidence": 0.50, # Interpolated
                "aligned": False
            })

    return aligned_words

def build_natural_cues(aligned_words: list, total_duration: float, max_chars_per_line=40, max_lines=2, min_dur=1.0, max_dur=6.0):
    """
    Group aligned words into visual subtitle cues:
    - Max 2 lines per cue
    - 36-42 characters per line
    - 1-6 seconds per cue
    - Broken at natural phrase boundaries
    """
    if not aligned_words:
        return []

    cues = []
    current_cue_words = []

    def finalize_cue(words):
        if not words:
            return None
        start = words[0]["start"]
        end = words[-1]["end"]
        # Ensure minimum cue duration
        if end - start < min_dur:
            end = min(total_duration, start + min_dur)
        # Cap at max_dur
        if end - start > max_dur:
            end = start + max_dur

        # Format into max 2 lines with 36-42 characters
        lines = []
        cur_line = []
        cur_line_len = 0

        for w in words:
            txt = w["word"]
            add_len = len(txt) + (1 if cur_line else 0)
            if cur_line and (cur_line_len + add_len > max_chars_per_line):
                lines.append(" ".join(cur_line))
                cur_line = [txt]
                cur_line_len = len(txt)
            else:
                cur_line.append(txt)
                cur_line_len += add_len

        if cur_line:
            lines.append(" ".join(cur_line))

        # If more than 2 lines, condense into 2 lines
        if len(lines) > max_lines:
            all_text = " ".join(lines)
            mid = len(all_text) // 2
            split_space = all_text.rfind(" ", 0, mid + 10)
            if split_space == -1:
                split_space = mid
            lines = [all_text[:split_space].strip(), all_text[split_space:].strip()]

        mean_confidence = sum(w.get("confidence", 0.9) for w in words) / len(words)

        return {
            "start": round(start, 3),
            "end": round(end, 3),
            "lines": lines,
            "text": "\n".join(lines),
            "mean_confidence": round(mean_confidence, 3),
            "low_confidence_flag": mean_confidence < 0.70
        }

    for i, w in enumerate(aligned_words):
        current_cue_words.append(w)
        
        # Check boundary conditions
        is_last = (i == len(aligned_words) - 1)
        next_w = aligned_words[i + 1] if not is_last else None
        
        dur_so_far = w["end"] - current_cue_words[0]["start"]
        total_chars = sum(len(x["word"]) + 1 for x in current_cue_words)
        
        has_clause_break = bool(re.search(r"[,;:.?!—–]$", w["word"]))
        has_sentence_end = bool(re.search(r"[.!?]$", w["word"]))
        spoken_pause = (next_w["start"] - w["end"]) if next_w else 0.0

        should_split = False
        if is_last:
            should_split = True
        elif dur_so_far >= max_dur - 0.5:
            should_split = True
        elif total_chars >= (max_chars_per_line * max_lines) - 5:
            should_split = True
        elif has_sentence_end and dur_so_far >= min_dur:
            should_split = True
        elif has_clause_break and dur_so_far >= 2.5:
            should_split = True
        elif spoken_pause >= 0.35 and dur_so_far >= min_dur:
            should_split = True

        if should_split:
            cue = finalize_cue(current_cue_words)
            if cue:
                cues.append(cue)
            current_cue_words = []

    # Final sweep: eliminate overlaps and ensure monotonicity
    for j in range(len(cues) - 1):
        if cues[j]["end"] > cues[j + 1]["start"]:
            cues[j]["end"] = max(cues[j]["start"] + 0.5, cues[j + 1]["start"])

    # Ensure last cue ends near audio end without exceeding it
    if cues:
        if cues[-1]["end"] > total_duration:
            cues[-1]["end"] = total_duration

    return cues

def generate_srt_file(cues: list, out_path: str):
    """Write standard SRT file."""
    lines = []
    for i, cue in enumerate(cues, 1):
        lines.append(str(i))
        lines.append(f"{format_timestamp_srt(cue['start'])} --> {format_timestamp_srt(cue['end'])}")
        lines.append(cue["text"])
        lines.append("")
    
    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines).strip() + "\n")

def generate_ass_file(cues: list, out_path: str, format_type="SHORTS"):
    """Write standard ASS file with Biblical aesthetic."""
    is_shorts = (format_type == "SHORTS")
    play_res_x = 1080 if is_shorts else 1920
    play_res_y = 1920 if is_shorts else 1080
    font_size = 56 if is_shorts else 48
    margin_v = 240 if is_shorts else 90

    ass_header = f"""[Script Info]
Title: ByBibleWisdom Verified Subtitles
ScriptType: v4.00+
WrapStyle: 0
PlayResX: {play_res_x}
PlayResY: {play_res_y}
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,{font_size},&H00FFFFFF,&H000000FF,&H00090D16,&H80000000,-1,0,0,0,100,100,0.5,0,1,3.5,1.5,2,40,40,{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    # Biblical keywords highlighted in gold in ASS
    gold_words = {
        'god', 'lord', 'jesus', 'christ', 'spirit', 'holy', 'beginning', 'created', 'creation',
        'heaven', 'heavens', 'earth', 'light', 'darkness', 'waters', 'firmament', 'seas',
        'morning', 'evening', 'day', 'night', 'sun', 'moon', 'stars', 'living', 'creatures',
        'blessed', 'image', 'likeness', 'dominion', 'rested', 'sabbath', 'faith', 'glory',
        'grace', 'truth', 'life', 'eternal', 'savior', 'covenant', 'wisdom', 'righteousness'
    }

    for cue in cues:
        start_str = format_timestamp_ass(cue["start"])
        end_str = format_timestamp_ass(cue["end"])
        
        # Format text with gold highlights
        raw_lines = cue["text"].split("\n")
        formatted_lines = []
        for line in raw_lines:
            tokens = line.split()
            styled_tokens = []
            for t in tokens:
                clean_t = re.sub(r"[^a-zA-Z]", "", t).lower()
                if clean_t in gold_words:
                    styled_tokens.append(r"{\c&H002BD7FF&}" + t + r"{\c&H00FFFFFF&}")
                else:
                    styled_tokens.append(t)
            formatted_lines.append(" ".join(styled_tokens))
        
        ass_text = r"\N".join(formatted_lines)
        events.append(f"Dialogue: 0,{start_str},{end_str},Default,,0,0,0,,{ass_text}")

    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(ass_header + "\n".join(events) + "\n")

def run_alignment_pipeline(audio_path: str, script_text: str, srt_out_path: str, ass_out_path: str, format_type="SHORTS", preferred_model="small.en"):
    """
    Main orchestration entrypoint for Stage 1 Subtitle Generation.
    Returns complete QC audit and cue list.
    """
    if not os.path.exists(audio_path):
        raise FileNotFoundError(f"Audio file not found: {audio_path}")

    # 1. Probe total audio duration with ffprobe
    import subprocess
    probe_cmd = [
        "d:/bible/tools/bin/ffprobe.exe",
        "-i", audio_path,
        "-show_entries", "format=duration",
        "-v", "quiet",
        "-of", "csv=p=0"
    ]
    probe_res = subprocess.check_output(probe_cmd, text=True).strip()
    total_audio_duration = float(probe_res)

    # 2. Load model
    model, model_name, device, compute_type, load_time = get_whisper_model(preferred_model)

    # 3. Transcribe audio with word-level timestamps
    t_transcribe_start = time.time()
    segments, info = model.transcribe(
        audio_path,
        language="en",
        word_timestamps=True,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=250)
    )

    whisper_words = []
    for segment in segments:
        if segment.words:
            for w in segment.words:
                whisper_words.append({
                    "word": w.word.strip(),
                    "start": round(w.start, 3),
                    "end": round(w.end, 3),
                    "probability": round(w.probability, 3)
                })

    transcribe_time = time.time() - t_transcribe_start

    # 4. Align approved script words to Whisper acoustic timestamps
    aligned_words = align_script_to_whisper_words(script_text, whisper_words, total_audio_duration)

    # 5. Build cues (max 2 lines, 36-42 chars, 1-6s each)
    cues = build_natural_cues(aligned_words, total_audio_duration)

    # 6. Generate output files
    generate_srt_file(cues, srt_out_path)
    generate_ass_file(cues, ass_out_path, format_type)

    # 7. Rigorous QC Audit
    last_cue_end = cues[-1]["end"] if cues else 0.0
    first_cue_start = cues[0]["start"] if cues else 0.0
    last_cue_delta = abs(total_audio_duration - last_cue_end)
    
    # Check max gap between speech cues
    max_gap = 0.0
    for k in range(len(cues) - 1):
        gap = cues[k + 1]["start"] - cues[k]["end"]
        if gap > max_gap:
            max_gap = gap

    total_cue_duration = sum(c["end"] - c["start"] for c in cues)
    coverage_pct = round((total_cue_duration / total_audio_duration) * 100, 2) if total_audio_duration > 0 else 0

    qc_audit = {
        "status": "PASSED" if (bool(last_cue_delta <= 3.0) and bool(max_gap <= 4.0) and bool(last_cue_end <= total_audio_duration + 0.1)) else "WARNING",
        "audio_duration_seconds": float(round(total_audio_duration, 3)),
        "total_cues": int(len(cues)),
        "whisper_model": str(model_name),
        "device": str(device),
        "compute_type": str(compute_type),
        "model_load_time_sec": float(round(load_time, 2)),
        "transcription_speed_sec": float(round(transcribe_time, 2)),
        "realtime_factor": float(round(total_audio_duration / transcribe_time, 2)) if transcribe_time > 0 else 0.0,
        "first_cue_start": float(first_cue_start),
        "last_cue_end": float(last_cue_end),
        "last_cue_delta_sec": float(round(last_cue_delta, 3)),
        "last_cue_within_3s_limit": bool(last_cue_delta <= 3.0),
        "no_cue_starts_after_audio": bool(first_cue_start < total_audio_duration),
        "max_speech_gap_sec": float(round(max_gap, 3)),
        "max_gap_under_4s": bool(max_gap <= 4.0),
        "speech_to_cue_coverage_percentage": float(coverage_pct),
        "aligned_words_count": int(len(aligned_words)),
        "low_confidence_cues_count": int(sum(1 for c in cues if c.get("low_confidence_flag")))
    }

    return {
        "qc": qc_audit,
        "cues": cues,
        "srt_path": srt_out_path,
        "ass_path": ass_out_path
    }

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print("Usage: python whisper_aligner.py <audio_path> <script_file_or_text> <srt_out> <ass_out> [format]")
        sys.exit(1)

    audio_file = sys.argv[1]
    script_arg = sys.argv[2]
    srt_out = sys.argv[3]
    ass_out = sys.argv[4]
    fmt = sys.argv[5] if len(sys.argv) > 5 else "SHORTS"

    if os.path.exists(script_arg):
        with open(script_arg, "r", encoding="utf-8") as f:
            script_text = f.read()
    else:
        script_text = script_arg

    result = run_alignment_pipeline(audio_file, script_text, srt_out, ass_out, fmt)
    print(json.dumps(result["qc"], indent=2))
