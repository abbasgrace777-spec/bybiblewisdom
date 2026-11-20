# Third-Party Open Source Software & Model Licenses

This document records the exact licenses and terms of all open source libraries, local AI models, and binary tools used by the **ByBibleWisdom AI Studio** pipeline.

---

## 1. Subtitles & Audio Alignment
### `faster-whisper`
* **Repository**: [https://github.com/SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper)
* **Author**: Guillaume Klein / SYSTRAN
* **License**: **MIT License**
* **Usage**: Local word-level acoustic timestamp alignment on GPU (CUDA, `int8_float16`) and CPU fallback. Zero cloud network calls; 100% free and open-source.

### `ctranslate2`
* **Repository**: [https://github.com/OpenNMT/CTranslate2](https://github.com/OpenNMT/CTranslate2)
* **Author**: OpenNMT & SYSTRAN
* **License**: **MIT License**
* **Usage**: Fast inference engine for Transformer models on CPU and GPU with custom INT8/FP16 CUDA kernels.

### Whisper Models (`base.en`, `small.en`)
* **Original Author**: OpenAI
* **Fine-Tuning / CTranslate2 Conversion**: SYSTRAN / Hugging Face
* **License**: **MIT License**
* **Usage**: Word timestamp extraction only; text is strictly aligned to approved SQLite Scripture canon.

---

## 2. Audio & Video Processing Binaries
### `FFmpeg` & `FFprobe`
* **Version**: 9.0.2-essentials_build-www.gyan.dev
* **License**: **GNU General Public License v3.0 (GPLv3)** / GNU Lesser General Public License (LGPLv2.1+)
* **Usage**: Audio format encoding, Loudnorm -16 LUFS normalization, Ken Burns zoom/pan video composition, and subtitle burn-in.

---

## 3. Fonts
* **Arial Bold (`arialbd.ttf`)**: Microsoft Typography License / Windows OS OEM license.
* **Impact (`impact.ttf`)**: Microsoft Core Fonts for the Web / Windows OS OEM license.
* **Georgia (`georgia.ttf`)**: Microsoft Core Fonts / Windows OS OEM license.
* **Usage**: Subtitle ASS rendering and 1280x720 video thumbnail text rendering.

---

## 4. Voice Narration & Speech Synthesis
### `Kokoro-82M` & `kokoro` Python Package
* **Repository**: [https://huggingface.co/hexgrad/Kokoro-82M](https://huggingface.co/hexgrad/Kokoro-82M) & [https://github.com/hexgrad/kokoro](https://github.com/hexgrad/kokoro)
* **Author**: hexgrad
* **Version**: v0.9.4
* **License**: **Apache License 2.0**
* **Usage**: 100% local neural speech synthesis for sacred documentary narration. Free for commercial and non-commercial deployment without cloud API keys or telemetry.
* **Voices Used**: `am_michael` (Warm Reverent American Male), `am_adam` (Deep Storyteller American Male), `bm_george` (Classical British Documentary Male).
* **Mastering Compliance**: Output normalized via EBU R128 / FFmpeg loudnorm to -16 LUFS integrated loudness with True Peak < -1 dBFS, with zero background music.

### Microsoft Edge TTS (`msedge-tts`)
* **Status**: **DISABLED BY DEFAULT**
* **Label**: "unofficial, check terms"
* **Usage**: Legacy fallback option disabled in standard pipeline execution.

---

## 5. Visual Art & Image Providers
### Mode B — Manual Import (Default Zero-Cost Provider)
* **Terms**: User provides original, public domain, or permissively licensed imagery generated via free AI tools (Microsoft Copilot / Bing Image Creator, Civitai, FLUX web, Wikimedia Commons).
* **Compliance Checks**: Enforces resolution criteria ($\ge 1920\times 1080$ for 16:9 Long Form, $\ge 1080\times 1920$ for 9:16 Shorts), verifies file integrity, and permanently blocks procedural fallback artwork.

### Mode A — Google Gemini Imagen 3 (`imagen-3.0-generate-002`)
* **Provider**: Google AI Studio / Google Generative AI
* **Terms & Billing**: [https://ai.google.dev/terms](https://ai.google.dev/terms). Pay-as-you-go model (~$0.03/image). Not covered under zero-cost free-tier quota; requires explicit confirmation before calling.
* **Commercial Use**: Allowed under Google Generative AI Terms of Service.

### Mode C — None Configured (Strict Quality Policy)
* **Status**: Automatic halt. Procedural canvas/tinted placeholder artwork is strictly forbidden from video assembly.

---

## 6. Thumbnail Studio & Typography Engine
### Code-Rendered Typography Engine (FFmpeg Drawtext)
* **Status**: **PRIMARY & DEFAULT** (100% Free & Local)
* **Engine**: FFmpeg `drawtext` with local TrueType Fonts (`Impact.ttf`, `Arialbd.ttf`).
* **Compliance Checks**: Standard 16:9 ($1280\times 720\text{ px}$), file size $< 2\text{ MB}$, high-contrast dark outline, verified legibility when scaled down to $160\text{ px}$ mobile preview, and bottom-right quadrant strictly clear for YouTube duration badge.
* **Commercial Use**: Fully permitted for YouTube commercial monetization.

### Ideogram 2.0 API (`ideogramService`)
* **Status**: **OPTIONAL ONLY**
* **Policy**: When `IDEOGRAM_API_KEY` is not present, reports `NOT CONFIGURED` and smoothly passes control to the local code-rendered engine with zero pipeline failures.

---

## 7. Script Writing, Narrative Outlining & SEO Metadata
### Ollama Local Engine (`ollama.exe`)
* **Repository**: [https://github.com/ollama/ollama](https://github.com/ollama/ollama)
* **License**: **MIT License**
* **Usage**: Local inference runner for Transformer models on Windows utilizing NVIDIA GPU acceleration via CUDA. 100% private, local-first, zero cloud calls, zero cost.

### Qwen3 LLM Model (`qwen3:4b`)
* **Author**: Alibaba Cloud / Qwen Team
* **License**: **Apache License 2.0** / **Qwen Open License**
* **Usage**: Chapter outline generation (Pass 1) and sequential spoken documentary scriptwriting (Pass 2). Permits commercial reproduction and educational generation without royalties.
* **Separation Policy**: All internal thinking traces (`<think>...</think>`) are strictly isolated and never leaked into narration audio, video subtitles, or project metadata.

### Google Gemini Text API (`gemini-2.0-flash`, `gemini-1.5-flash`)
* **Provider**: Google AI Studio / Google Generative AI
* **Terms of Service**: [https://ai.google.dev/terms](https://ai.google.dev/terms)
* **Free Tier Quota**: 15 Requests Per Minute (RPM), 1,500 Requests Per Day (RPD), 1,000,000 Tokens Per Minute (TPM). Free of charge.
* **Usage**: Alternative cloud text generation engine when configured with a valid `GEMINI_API_KEY`.

### World English Bible (WEB)
* **Author / Publisher**: Rainbow Missions, Inc. / Michael Paul Johnson
* **Status**: **100% Public Domain Worldwide**
* **Usage**: Primary canonical Scripture source. In accordance with public domain terms, Scripture quotations are reproduced without alteration, copyright restrictions, or licensing fees.

---

## 8. Programmatic Video Composition & Motion Framework
### Remotion (`remotion`, `@remotion/cli`, `@remotion/bundler`, `@remotion/renderer`)
* **Repository**: [https://github.com/remotion-dev/remotion](https://github.com/remotion-dev/remotion)
* **Author**: Jonny Burger / Remotion GmbH
* **License**: **Remotion Free License (Individuals & Small Teams)**
* **License Terms for Individual Creator**:
  * **Free for Solo Creators**: Remotion is **100% free of charge** (including for commercial use, YouTube monetization, and client deliverables) for individuals, solo creators, non-profit/educational projects, and small teams/companies with **up to 3 employees**.
  * **No Watermarks or Limitations**: The free tier includes complete access to all composition primitives, interpolations, transitions, and local rendering capabilities with zero watermarks.
  * **Paid License Threshold**: A paid commercial company license is only required if the organization grows to **4 or more employees** ($25/month/seat for Creators or $0.01/render for Automators).
  * **Verdict for ByBibleWisdom**: As an individual solo creator running on a single laptop workstation, ByBibleWisdom operates fully within the **Free Remotion License** with full commercial rights and zero ongoing cost.

