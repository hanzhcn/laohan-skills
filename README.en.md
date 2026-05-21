# laohan-skills

[![GitHub stars](https://img.shields.io/github/stars/hanzhcn/laohan-skills?style=social)](https://github.com/hanzhcn/laohan-skills/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> The Swiss Army Knife for AI content creators — download videos, generate slides, audit docs, filter trends, all in one command.

English | [中文](./README.md)

Built by [寒武纪AI](https://github.com/hanzhcn), for [Claude Code](https://claude.ai/code) / [OpenClaw](https://github.com/openclaw/openclaw).

## Skills

### Content Acquisition

| Skill | What it does | Trigger |
|-------|-------------|----------|
| **laohan-xiazai** | One-stop content download — videos/audio/subtitles from 7+ platforms with auto-fallback | `/laohan-xiazai` |
| **laohan-aihotjingxuan** | AIHOT daily picks — curated AI content from 168 sources | `/laohan-aihotjingxuan` |
| **laohan-hotdouyinai** | Douyin trending AI filter — 6000+ keyword matching, no login needed | `/laohan-hotdouyinai` |

### Content Creation

| Skill | What it does | Trigger |
|-------|-------------|----------|
| **laohan-luping** | Screen recording to script — full pipeline: extract audio → transcribe → structure → write | `/laohan-luping` |
| **laohan-yuanchuang** | Trend to original — multi-platform trend → unique angle → script | `/laohan-yuanchuang` |
| **laohan-notebooklm** | Script to slides via NotebookLM (PDF → PNG for video editing) | `/laohan-notebooklm <script.md>` |
| **laohan-fengmianqiuzhi** | Script to Gemini cover image prompts (3 styles × 3 ratios) | `/laohan-fengmianqiuzhi <script.md>` |
| **laohan-fenjingtishici** | Storyboard prompts for diffusion models (FLUX/SDXL/Gemini) | `/laohan-fenjingtishici` |

### Quality & Tools

| Skill | What it does | Trigger |
|-------|-------------|----------|
| **laohan-cheat** | Content calibration — scoring, prediction, review, trend analysis | `/laohan-cheat` |
| **laohan-shencha** | Deep audit for technical docs — verify URLs, versions, params | `/laohan-shencha` |
| **laohan-gengxin** | Tool version checker — npm/brew/pip/uv/GitHub/plugins/skills | `/laohan-gengxin` |
| **laohan-urlgaixie** | Manual URL rewrite queue | `/laohan-urlgaixie` |
| **laohan-jiaocheng** | Tutorial router — load config tutorials by keyword (claude-mem / GLM / ECC / Gemini sidebar, etc.) | `/laohan-jiaocheng <keyword>` |

## Tutorials

> Step-by-step guides, fully reproducible.

| Tutorial | Description |
|----------|-------------|
| [claude-mem + LiteLLM: Drive Claude Code Cross-Session Memory with Local LLMs](./docs/claude-mem-litellm.md) | Use LiteLLM proxy to let claude-mem support GLM / DeepSeek instead of OpenRouter. Full install, patch, config, and verification steps |
| [CLAUDE.md Configuration Guide: Four Principles to Reduce AI Coding Mistakes](./docs/claude-md-guide.md) | From [andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills): Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution, with before/after code examples |
| [Chrome Gemini Sidebar Fix (China)](./docs/gemini-sidebar-fix.md) | Mac + Windows scripts to fix Chrome Gemini sidebar disappearing in China due to region restrictions. Re-run after each Chrome update |
| [Claude Code + ZhiPu GLM: Drive AI Coding with Domestic LLMs](./docs/claude-code-glm.md) | Full guide to configure Claude Code with ZhiPu GLM backend: env vars, thinking mode, capability declarations, timeout config, model switching, FAQ |
| [ECC Plugin Install & Maintenance Guide](./docs/ecc-plugin-guide.md) | Everything-Claude-Code plugin: install, rules distribution, 3 hook loading mechanisms, 6-step upgrade checklist, 4 common pitfalls with solutions |

## Install

```bash
npx skills add hanzhcn/laohan-skills -g -y
```

## Prerequisites

### All skills
- [Claude Code](https://claude.ai/code) or [OpenClaw](https://github.com/openclaw/openclaw)

### laohan-xiazai (video/content download)
- [opencli](https://github.com/jackwener/opencli) — `npm install -g @jackwener/opencli`
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) — `brew install yt-dlp` or `pip install yt-dlp`
- [ffmpeg](https://ffmpeg.org/) — `brew install ffmpeg`
- Optional: SiliconFlow API key for cloud transcription (free) — set `SILICONFLOW_API_KEY` env var

### laohan-notebooklm
- [nlm CLI](https://pypi.org/project/notebooklm-mcp-cli/) — `pip install notebooklm-mcp-cli`
- [poppler](https://poppler.freedesktop.org/) — `brew install poppler`

### laohan-luping
- All laohan-notebooklm dependencies
- Optional: [whisper.cpp](https://github.com/ggml-org/whisper.cpp) for local transcription

### laohan-cheat
- [cheat-on-content](https://github.com/XBuilderLAB/cheat-on-content) project — `git clone https://github.com/XBuilderLAB/cheat-on-content.git`

### laohan-hotdouyinai
- Node.js

### laohan-jiaocheng
- No extra dependencies

### laohan-shencha
- No extra dependencies (uses Claude Code built-in web search + gh CLI)

### laohan-fengmianqiuzhi / laohan-fenjingtishici
- No extra dependencies, pure text output

## Quick Start

### Download content
```
You: 帮我下载这个B站视频 https://www.bilibili.com/video/BV1xxx
→ triggers laohan-xiazai → auto-selects best method per platform
```

### Screen recording to script
```
You: 把这个录屏视频转成口播稿 /path/to/recording.mp4
→ triggers laohan-luping → full pipeline output
```

### Content calibration
```
You: 帮我校准这篇口播稿
→ triggers laohan-cheat → scoring + prediction + suggestions
```

### Script to slides
```
You: 帮我用口播稿生成PPT
→ /laohan-notebooklm script.md
```

### Generate cover prompts
```
You: 给这个口播稿生成封面
→ /laohan-fengmianqiuzhi script.md
```

### Check tool updates
```
You: 看看哪些工具该更新了
→ /laohan-gengxin
```

## License

MIT

## Author

**寒武纪AI** — AI content creator, sharing tools for the community.

- GitHub: [@hanzhcn](https://github.com/hanzhcn)
- Douyin: **寒武纪AI** (follow for more AI tool tutorials)

If you find this useful, please Star ⭐ and follow on Douyin!
