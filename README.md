# ByBibleWisdom AI Studio

> **AI-Powered YouTube Automation Platform for [@ByBibleWisdom](https://www.youtube.com/@ByBibleWisdom)**  
> High-retention, Bible-accurate Christian education across all 66 books, unseen historical narratives, and Jesus' teachings.

---

## 🌟 Channel Core Pillars

1. **Complete Bible Book Explanations**: Systematic coverage from Genesis to Revelation covering chapter breakdowns, historical authorship, theological themes, and practical life applications.
2. **Unseen Biblical & Historical Stories**: Ancient empires (Persia, Babylon, Assyria, Egypt, Rome) and archaeological discoveries (Cyrus Cylinder, Dead Sea Scrolls, Tel Dan Stele, Siloam Inscription) with strict separation of established facts from theories.
3. **Jesus’ Teachings & Christian Motivation**: Parables, miracles, and daily devotionals for everyday life.

---

## 🚀 Quick Start (One Command)

To launch the complete studio dashboard and backend engine:

```powershell
cd D:\bible
npm start
```

Then open your browser to:
👉 **`http://localhost:5000`**

---

## 🛡️ The 10-Point Mandatory Copyright & Accuracy Safety Gate

Before any video is marked for distribution, the platform automatically validates:

1. **Script Originality**: Original exposition; zero copied scripts from other creators.
2. **Bible Reference Accuracy**: Validated against the 66-book biblical canon. Zero hallucinated verses.
3. **Translation Permissions**: Strictly enforces public domain translations (**World English Bible [WEB]**, **King James Version [KJV]**, or **American Standard Version [ASV]**).
4. **Historical & Archaeological Integrity**: Fact-checked claims; never presents speculation as proven history.
5. **Visual Asset Commercial Licenses**: Cleared for commercial monetization.
6. **Voice Model License**: Permissible commercial documentary text-to-speech.
7. **Audio & Narration Verification**: Pure spoken narration only (Strictly Zero Background Music). No music files permitted; single clean audio stream.
8. **Font Licenses**: SIL Open Font License (OFL) typography.
9. **YouTube Policy Compliance**: Educational, reverent, and non-repetitive content.
10. **Synthetic Content Disclosure**: Marked "Contains altered or synthetic content" for full YouTube AI transparency.

> **Mandatory Safeguard**: All videos are initially uploaded as **`PRIVATE`**. Review automated Content ID and policy checks in official YouTube Studio before public publishing.

---

## 🛠️ Automated 18-Step Production Pipeline

| Step | Engine / Service | Output Artifact |
| :--- | :--- | :--- |
| **1–3. Topic & Script** | `scriptService.js` | 6-block script (Hook, Context, Narrative, Theology, Application, CTA) |
| **4–5. Safety Gate** | `verificationService.js` | 10-point audit recorded in SQLite |
| **6. Voice Narration** | `voiceService.js` + Edge Natural Voice | Natural 24kHz documentary narration (`narration.mp3`) |
| **7–8. Scene Artwork** | `imageService.js` + FLUX / CC0 | 1080×1920 (Shorts) or 1920×1080 (Long-form) visuals (`scene_{n}.jpg`) |
| **9–11. Video & Audio** | `videoService.js` + FFmpeg 9.0 | Automated Ken Burns motion, pure broadcast voice narration, and frame-accurate subtitles |
| **12. Subtitles** | `subtitleService.js` | Stylized `.ass` and standard YouTube `.srt` captions |
| **13. Thumbnail** | `thumbnailService.js` | High-CTR bold typography thumbnail (`thumbnail.jpg`) |
| **14–15. SEO Studio** | `seoService.js` | Title, description with chapter timestamps, and tags |
| **16. YouTube Upload** | `youtubeService.js` | Uploaded as `PRIVATE` to `@ByBibleWisdom` via Data API v3 |
| **17–18. Analytics** | `analyticsService.js` | 66 Books curriculum tracker & retention metrics |

---

## 💻 System Architecture & Hardware Notes

- **GPU**: NVIDIA GeForce RTX 3050 Laptop GPU (4 GB VRAM) — Hardware encoding via NVENC / libx264.
- **Storage**: All projects and database stored on `D:\bible` to protect `C:\` drive capacity.
- **Database**: Local SQLite with WAL mode (`D:\bible\data\bible_studio.db`).
- **Media Engine**: Portable static FFmpeg 9.0 build located in `D:\bible\tools\bin`.

---

## 🧪 Test Suite Execution

Run the master test suite anytime:

```powershell
cd D:\bible
npm test
```
