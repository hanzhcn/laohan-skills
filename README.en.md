# laohan-skills

English | [中文](./README.md)

Claude Code / OpenClaw skills for AI content creators. Download videos, generate slides, audit docs — one command each.

Built by [寒武纪AI](https://github.com/hanzhcn).

## Skills

| Skill | What it does | Trigger |
|-------|-------------|---------|
| **laohan-xiazai** | Video/audio/content download for 7 platforms (Douyin, TikTok, YouTube, Bilibili, Xiaohongshu, Zhihu, WeChat) | `/laohan-xiazai` |
| **laohan-notebooklm** | Script to slides via NotebookLM (PDF → PNG for video editing) | `/laohan-notebooklm <script.md>` |
| **laohan-shencha** | Deep audit for technical docs — verify URLs, versions, params against live sources | `/laohan-shencha` |
| **laohan-hotdouyinai** | Filter Douyin trending for AI-related content (6000+ keyword matching) | `/laohan-hotdouyinai` |
| **laohan-fengmianqiuzhi** | Script to Gemini cover image prompts (29 styles) | `/laohan-fengmianqiuzhi <script.md>` |
| **laohan-fenjingtishici** | Generate storyboard prompts from reference videos for diffusion models (FLUX/SDXL/Gemini) | `/laohan-fenjingtishici` |

## Install

```bash
npx skills add hanzhcn/laohan-skills -g -y
```

## Prerequisites

### All skills
- [Claude Code](https://claude.ai/code) or [OpenClaw](https://github.com/hanzhcn/openclaw)

### laohan-xiazai (video/content download)
- [opencli](https://github.com/jackwener/opencli) — `npm install -g @jackwener/opencli`
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — `brew install yt-dlp` or `pip install yt-dlp`
- [ffmpeg](https://ffmpeg.org/) — `brew install ffmpeg`
- Optional: [whisper.cpp](https://github.com/ggerganov/whisper.cpp) for local transcription
- Optional: SiliconFlow API key for cloud transcription (free) — set `SILICONFLOW_API_KEY` env var

### laohan-notebooklm
- [nlm CLI](https://pypi.org/project/notebooklm-mcp-cli/) — `pip install notebooklm-mcp-cli`
- [poppler](https://poppler.freedesktop.org/) — `brew install poppler`

### laohan-hotdouyinai
- Node.js (for running the included script)

## Quick Start

### Download a video
```
User: 帮我下载这个B站视频 https://www.bilibili.com/video/BV1xxx
→ triggers laohan-xiazai → opencli bilibili download BV1xxx

User: 下载这个抖音 https://v.douyin.com/xxx
→ triggers laohan-xiazai → mobile UA method

User: 下载这个YouTube https://youtube.com/watch?v=xxx
→ triggers laohan-xiazai → yt-dlp --cookies-from-browser chrome
```

### Generate slides from script
```
User: 帮我用口播稿生成PPT /laohan-notebooklm script.md
→ creates notebook → uploads script → generates slides → PDF → PNGs
```

### Audit technical docs
```
User: 深度审查这个部署方案 /laohan-shencha
→ extracts claims → verifies URLs/versions/params → cross-references → fixes
```

## Platform Coverage (laohan-xiazai)

| Platform | Download | Subtitles | Audio | Transcription |
|----------|----------|-----------|-------|---------------|
| Douyin (抖音) | Mobile UA + iesdouyin | — | ffmpeg | SiliconFlow / whisper |
| TikTok | tikwm API | — | ffmpeg | SiliconFlow / whisper |
| YouTube | yt-dlp (cookies) | opencli youtube transcript | yt-dlp -x | SiliconFlow / whisper |
| Bilibili (B站) | opencli bilibili download | opencli bilibili subtitle | ffmpeg | SiliconFlow / whisper |
| Xiaohongshu (小红书) | opencli xiaohongshu download | — | — | — |
| Zhihu (知乎) | opencli zhihu | — | — | — |
| WeChat (公众号) | fetch.py --stealth | — | — | — |

## License

MIT

## Author

**寒武纪AI** — AI content creator, sharing tools for the community.

- GitHub: [@hanzhcn](https://github.com/hanzhcn)
- Douyin: 寒武纪AI
