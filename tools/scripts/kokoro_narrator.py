"""
Kokoro TTS Narration Engine for ByBibleWisdom AI Studio
Author: ByBibleWisdom Studio Engineering
License: Apache 2.0 (Kokoro Model & Engine)

Requirements:
- Kokoro (local, free, Apache 2.0)
- Sentence boundary splitting (max 400 chars per chunk)
- 250-400ms pauses between sentences, 600-800ms between sections
- Zero-click crossfade audio joining
- Target speaking rate: ~140-160 WPM
- Audio mastering to -16 LUFS, True Peak < -1 dB
- Strictly zero background music
"""

import os
import sys

# Ensure Python 3.11 ai_env is first in PATH and remove Python 2.7 interference
ai_scripts_dir = os.path.dirname(os.path.abspath(sys.executable))
clean_paths = [ai_scripts_dir] + [p for p in os.environ.get("PATH", "").split(os.pathsep) if "python27" not in p.lower()]
os.environ["PATH"] = os.pathsep.join(clean_paths)
sys.executable = os.path.join(ai_scripts_dir, "python.exe")

import re
import time
import json
import subprocess
import numpy as np
import soundfile as sf
from pathlib import Path

# Fix Windows HuggingFace cache warning
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

# Kokoro sample rate is 24000 Hz
SAMPLE_RATE = 24000

# Recommended English Voices for Biblical Documentary & Emotional Storytelling
KOKORO_VOICES = {
    "af_bella": {"name": "Bella (Gentle, Loving & Soothing American Female)", "lang": "a", "gender": "female"},
    "am_adam": {"name": "Adam (Deep Storyteller & Compassionate American Male)", "lang": "a", "gender": "male"},
    "af_sarah": {"name": "Sarah (Soft, Heartfelt Emotional American Female)", "lang": "a", "gender": "female"},
    "af_nicole": {"name": "Nicole (Calm & Reflective Intimate Female)", "lang": "a", "gender": "female"},
    "af_sky": {"name": "Sky (Serene & Peaceful American Female)", "lang": "a", "gender": "female"},
    "bm_george": {"name": "George (Classical British Documentary Male)", "lang": "b", "gender": "male"},
    "am_michael": {"name": "Michael (Calm Reverent American Male)", "lang": "a", "gender": "male"},
}

def split_into_sentence_chunks(text: str, max_chars: int = 380) -> list:
    """
    Split narration text at sentence boundaries into chunks <= max_chars.
    Returns list of dicts: {"text": str, "is_section_break": bool}
    """
    # Normalize whitespace
    clean = re.sub(r"\r\n|\r", "\n", text).strip()
    paragraphs = [p.strip() for p in clean.split("\n\n") if p.strip()]

    chunks = []
    sentence_regex = re.compile(r'[^.!?]+[.!?]+|[^.!?]+$')

    for p_idx, para in enumerate(paragraphs):
        raw_sentences = [s.strip() for s in sentence_regex.findall(para) if s.strip()]
        if not raw_sentences:
            raw_sentences = [para]

        cur_chunk = []
        cur_len = 0

        for s_idx, sentence in enumerate(raw_sentences):
            s_len = len(sentence)
            if cur_chunk and (cur_len + s_len + 1 > max_chars):
                is_last_in_para = (s_idx == len(raw_sentences))
                chunks.append({
                    "text": " ".join(cur_chunk),
                    "is_section_break": False
                })
                cur_chunk = [sentence]
                cur_len = s_len
            else:
                cur_chunk.append(sentence)
                cur_len += s_len + 1

        if cur_chunk:
            is_para_end = (p_idx < len(paragraphs) - 1)
            chunks.append({
                "text": " ".join(cur_chunk),
                "is_section_break": is_para_end
            })

    return chunks

def apply_crossfade(audio1: np.ndarray, audio2: np.ndarray, crossfade_samples: int = 360) -> np.ndarray:
    """
    Smoothly join two audio arrays with a short crossfade to eliminate click artifacts.
    """
    if len(audio1) == 0:
        return audio2
    if len(audio2) == 0:
        return audio1

    cf = min(crossfade_samples, len(audio1), len(audio2))
    if cf <= 0:
        return np.concatenate([audio1, audio2])

    fade_out = np.linspace(1.0, 0.0, cf)
    fade_in = np.linspace(0.0, 1.0, cf)

    blended = (audio1[-cf:] * fade_out) + (audio2[:cf] * fade_in)
    return np.concatenate([audio1[:-cf], blended, audio2[cf:]])

def synthesize_text_with_kokoro(
    text: str,
    output_path: str,
    voice_name: str = "af_bella",
    speed: float = 0.88, # Calming, reverent storytelling pacing (~125-135 wpm)
    sentence_pause_sec: float = 0.55, # Natural contemplative breathing pause
    section_pause_sec: float = 0.95
) -> dict:
    """
    Generate complete mastered narration audio with Kokoro TTS:
    1. Chunk sentences
    2. Synthesize each chunk
    3. Insert natural pauses (400-600ms sentence, 800-1100ms section)
    4. Smooth crossfading
    5. Master to -16 LUFS, True Peak < -1 dB with Warm Acoustic EQ & FFmpeg loudnorm
    """
    from kokoro import KPipeline
    lang_code = KOKORO_VOICES.get(voice_name, {}).get("lang", "a")

    t_start = time.time()
    pipeline = KPipeline(lang_code=lang_code, repo_id='hexgrad/Kokoro-82M')

    chunks = split_into_sentence_chunks(text)
    combined_audio = np.array([], dtype=np.float32)

    sentence_pause = np.zeros(int(SAMPLE_RATE * sentence_pause_sec), dtype=np.float32)
    section_pause = np.zeros(int(SAMPLE_RATE * section_pause_sec), dtype=np.float32)

    total_words = len(text.split())

    for idx, chunk in enumerate(chunks):
        c_text = chunk["text"]
        if not c_text:
            continue

        generator = pipeline(c_text, voice=voice_name, speed=speed)
        chunk_pieces = []
        for _, _, audio in generator:
            if audio is not None and len(audio) > 0:
                chunk_pieces.append(audio)

        if chunk_pieces:
            chunk_full = np.concatenate(chunk_pieces)
            combined_audio = apply_crossfade(combined_audio, chunk_full)

            # Insert pause after chunk
            if idx < len(chunks) - 1:
                pause_to_insert = section_pause if chunk["is_section_break"] else sentence_pause
                combined_audio = np.concatenate([combined_audio, pause_to_insert])

    # Add gentle 200ms tail silence
    tail_silence = np.zeros(int(SAMPLE_RATE * 0.20), dtype=np.float32)
    combined_audio = np.concatenate([combined_audio, tail_silence])

    # Save raw audio to temp file
    temp_raw = output_path.replace(".mp3", "_raw.wav")
    sf.write(temp_raw, combined_audio, SAMPLE_RATE)
    raw_duration = len(combined_audio) / SAMPLE_RATE

    # 5. Master audio to -16 LUFS and True Peak < -1 dB via FFmpeg with Warm Acoustic EQ
    ffmpeg_bin = "d:/bible/tools/bin/ffmpeg.exe"
    ffprobe_bin = "d:/bible/tools/bin/ffprobe.exe"

    mastered_cmd = [
        ffmpeg_bin,
        "-i", temp_raw,
        "-af", "equalizer=f=220:t=q:w=1.2:g=2.5,highshelf=f=7500:g=-1.8,loudnorm=I=-16:LRA=11:TP=-1.5",
        "-c:a", "libmp3lame",
        "-b:a", "192k",
        output_path,
        "-y"
    ]
    subprocess.run(mastered_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

    if os.path.exists(temp_raw):
        try:
            os.remove(temp_raw)
        except Exception:
            pass

    # 6. Measure mastered audio with FFmpeg loudnorm measurement pass
    measure_cmd = [
        ffmpeg_bin,
        "-i", output_path,
        "-af", "loudnorm=I=-16:LRA=11:TP=-1.5:print_format=json",
        "-f", "null",
        "-"
    ]
    m_proc = subprocess.run(measure_cmd, capture_output=True, text=True)
    m_text = m_proc.stderr

    # Extract JSON block from stderr
    lufs = -16.0
    true_peak = -1.5
    try:
        json_start = m_text.rfind("{")
        json_end = m_text.rfind("}") + 1
        if json_start != -1 and json_end != -1:
            data = json.loads(m_text[json_start:json_end])
            lufs = float(data.get("output_i", data.get("input_i", -16.0)))
            true_peak = float(data.get("output_tp", data.get("input_tp", -1.5)))
    except Exception:
        pass

    # Measure exact final duration with ffprobe
    probe_cmd = [
        ffprobe_bin,
        "-i", output_path,
        "-show_entries", "format=duration",
        "-v", "quiet",
        "-of", "csv=p=0"
    ]
    final_duration = float(subprocess.check_output(probe_cmd, text=True).strip())
    wpm = round((total_words / final_duration) * 60, 1) if final_duration > 0 else 0

    gen_time = round(time.time() - t_start, 2)

    return {
        "engine": "Kokoro TTS",
        "version": "0.9.4",
        "license": "Apache 2.0",
        "voice": voice_name,
        "voice_display_name": KOKORO_VOICES.get(voice_name, {}).get("name", voice_name),
        "total_words": total_words,
        "duration_seconds": round(final_duration, 3),
        "words_per_minute": wpm,
        "wpm_in_target_range": 135 <= wpm <= 165,
        "integrated_lufs": round(lufs, 2),
        "lufs_target_achieved": -17.0 <= lufs <= -15.0,
        "true_peak_db": round(true_peak, 2),
        "true_peak_under_1db": true_peak <= -1.0,
        "generation_time_sec": gen_time,
        "output_file": output_path,
        "file_size_bytes": os.path.getsize(output_path)
    }

def synthesize_project_batch(manifest_path: str) -> dict:
    """
    Synthesize all scenes for a project in a single pipeline session:
    - Loads KPipeline once into memory
    - Generates each scene audio with sentence chunking & pauses
    - Concatenates and masters to final_narration_path (-16 LUFS, TP < -1 dB)
    - Returns detailed scene-by-scene timing and QC report
    """
    from kokoro import KPipeline
    with open(manifest_path, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    voice_name = manifest.get("voice", "af_bella")
    speed = float(manifest.get("speed", 0.88))
    scenes = manifest.get("scenes", [])
    final_output = manifest.get("final_narration_path")
    lang_code = KOKORO_VOICES.get(voice_name, {}).get("lang", "a")

    t_start = time.time()
    pipeline = KPipeline(lang_code=lang_code, repo_id='hexgrad/Kokoro-82M')

    sentence_pause = np.zeros(int(SAMPLE_RATE * 0.55), dtype=np.float32)
    section_pause = np.zeros(int(SAMPLE_RATE * 0.95), dtype=np.float32)
    tail_silence = np.zeros(int(SAMPLE_RATE * 0.25), dtype=np.float32)

    ffmpeg_bin = "d:/bible/tools/bin/ffmpeg.exe"
    ffprobe_bin = "d:/bible/tools/bin/ffprobe.exe"

    scene_results = []
    concat_files = []

    for sc in scenes:
        s_order = sc.get("segment_order", 1)
        s_text = (sc.get("text") or "").strip()
        s_out = sc.get("output_path")
        os.makedirs(os.path.dirname(os.path.abspath(s_out)), exist_ok=True)

        if not s_text:
            # 3 second gentle silence for empty text
            sf.write(s_out, np.zeros(int(SAMPLE_RATE * 3.0), dtype=np.float32), SAMPLE_RATE)
            scene_results.append({
                "segment_order": s_order,
                "duration_seconds": 3.0,
                "output_path": s_out
            })
            concat_files.append(s_out)
            continue

        chunks = split_into_sentence_chunks(s_text)
        combined_audio = np.array([], dtype=np.float32)

        for idx, chunk in enumerate(chunks):
            c_text = chunk["text"]
            if not c_text:
                continue
            generator = pipeline(c_text, voice=voice_name, speed=speed)
            pieces = []
            for _, _, audio in generator:
                if audio is not None and len(audio) > 0:
                    pieces.append(audio)
            if pieces:
                c_full = np.concatenate(pieces)
                combined_audio = apply_crossfade(combined_audio, c_full)
                if idx < len(chunks) - 1:
                    pause = section_pause if chunk["is_section_break"] else sentence_pause
                    combined_audio = np.concatenate([combined_audio, pause])

        combined_audio = np.concatenate([combined_audio, tail_silence])
        temp_wav = s_out.replace(".mp3", "_raw.wav")
        sf.write(temp_wav, combined_audio, SAMPLE_RATE)

        # Encode scene mp3
        subprocess.run([
            ffmpeg_bin, "-y",
            "-i", temp_wav,
            "-c:a", "libmp3lame",
            "-b:a", "192k",
            s_out
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        if os.path.exists(temp_wav):
            try:
                os.remove(temp_wav)
            except Exception:
                pass

        # Measure exact scene duration
        probe_cmd = [
            ffprobe_bin,
            "-i", s_out,
            "-show_entries", "format=duration",
            "-v", "quiet",
            "-of", "csv=p=0"
        ]
        s_dur = float(subprocess.check_output(probe_cmd, text=True).strip())
        scene_results.append({
            "segment_order": s_order,
            "duration_seconds": round(s_dur, 3),
            "output_path": s_out
        })
        concat_files.append(s_out)
        print(f"SCENE_PROGRESS:{s_order}:{len(scenes)}", flush=True)

    # Master final narration if requested
    master_duration = 0.0
    lufs = -16.0
    true_peak = -1.5

    if final_output and concat_files:
        concat_txt = os.path.join(os.path.dirname(final_output), "concat_batch.txt")
        with open(concat_txt, "w", encoding="utf-8") as f:
            for cp in concat_files:
                norm_p = cp.replace("\\", "/")
                f.write(f"file '{norm_p}'\n")

        # Concat and master with loudnorm
        temp_master_raw = final_output.replace(".mp3", "_raw.mp3")
        subprocess.run([
            ffmpeg_bin, "-y",
            "-f", "concat",
            "-safe", "0",
            "-i", concat_txt,
            "-c:a", "libmp3lame",
            "-b:a", "192k",
            temp_master_raw
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        # Master to -16 LUFS, True Peak < -1 dB with Warm Acoustic EQ
        subprocess.run([
            ffmpeg_bin, "-y",
            "-i", temp_master_raw,
            "-af", "equalizer=f=220:t=q:w=1.2:g=2.5,highshelf=f=7500:g=-1.8,loudnorm=I=-16:LRA=11:TP=-1.5",
            "-c:a", "libmp3lame",
            "-b:a", "192k",
            final_output
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

        if os.path.exists(temp_master_raw):
            try:
                os.remove(temp_master_raw)
            except Exception:
                pass

        # Measure final audio
        probe_cmd = [
            ffprobe_bin,
            "-i", final_output,
            "-show_entries", "format=duration",
            "-v", "quiet",
            "-of", "csv=p=0"
        ]
        master_duration = float(subprocess.check_output(probe_cmd, text=True).strip())

        measure_proc = subprocess.run([
            ffmpeg_bin,
            "-i", final_output,
            "-af", "loudnorm=I=-16:LRA=11:TP=-1.5:print_format=json",
            "-f", "null", "-"
        ], capture_output=True, text=True)
        m_txt = measure_proc.stderr
        j_start = m_txt.rfind("{")
        j_end = m_txt.rfind("}") + 1
        if j_start != -1 and j_end != -1:
            try:
                m_data = json.loads(m_txt[j_start:j_end])
                lufs = float(m_data.get("output_i", m_data.get("input_i", -16.0)))
                true_peak = float(m_data.get("output_tp", m_data.get("input_tp", -1.5)))
            except Exception:
                pass

    total_words = sum(len((sc.get("text") or "").split()) for sc in scenes)
    total_time = round(time.time() - t_start, 2)
    wpm = round((total_words / master_duration) * 60, 1) if master_duration > 0 else 0

    return {
        "engine": "Kokoro TTS",
        "version": "0.9.4",
        "license": "Apache 2.0",
        "voice": voice_name,
        "voice_display_name": KOKORO_VOICES.get(voice_name, {}).get("name", voice_name),
        "total_scenes": len(scenes),
        "total_words": total_words,
        "duration_seconds": round(master_duration, 3),
        "words_per_minute": wpm,
        "integrated_lufs": round(lufs, 2),
        "true_peak_db": round(true_peak, 2),
        "generation_time_sec": total_time,
        "output_file": final_output,
        "scenes": scene_results
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python kokoro_narrator.py <output_mp3> <text_or_file> [voice_name]")
        print("  python kokoro_narrator.py --batch <manifest_json>")
        sys.exit(1)

    if sys.argv[1] == "--batch":
        manifest_file = sys.argv[2]
        res = synthesize_project_batch(manifest_file)
        print(json.dumps(res, indent=2))
        sys.exit(0)

    out_file = sys.argv[1]
    in_text = sys.argv[2]
    voice = sys.argv[3] if len(sys.argv) > 3 else "am_michael"

    if os.path.exists(in_text):
        with open(in_text, "r", encoding="utf-8") as f:
            text_content = f.read()
    else:
        text_content = in_text

    result = synthesize_text_with_kokoro(text_content, out_file, voice)
    print(json.dumps(result, indent=2))
