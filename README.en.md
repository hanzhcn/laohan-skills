# laohan-skills

[![GitHub stars](https://img.shields.io/github/stars/hanzhcn/laohan-skills?style=social)](https://github.com/hanzhcn/laohan-skills/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> The Swiss Army Knife for AI content creators — 12 Claude Code skills for downloading videos, generating slides, auditing docs, filtering trends, detecting content violations, and more.

English | [中文](./README.md)

Built by [寒武纪AI](https://github.com/hanzhcn), for [Claude Code](https://claude.ai/code) / [OpenClaw](https://github.com/openclaw/openclaw).

## Skills

### Content Acquisition

| Skill | What it does | Trigger |
|-------|-------------|----------|
| **laohan-xiazai** | One-stop content download — videos/audio/subtitles from 7+ platforms with auto-fallback | `/laohan-xiazai` |
| **laohan-redian** | Unified AI trend aggregator — 3 parallel sources (AIHOT picks + 9-platform trending + Douyin AI filter), merged & deduplicated | `/laohan-redian` |

### Content Creation

| Skill | What it does | Trigger |
|-------|-------------|----------|
| **laohan-chuangzuo** | Unified creation engine — recording to script / trend to original / URL rewrite / free topic, all through one writing methodology | `/laohan-chuangzuo` or "录屏转口播""找选题""写一篇""根据链接改写""帮我写""不知道拍什么""改写文档" |
| **laohan-notebooklm** | Script to slides via NotebookLM (PDF → PNG for video editing) | `/laohan-notebooklm` or "生成PPT""做幻灯片" |
| **laohan-fengmianqiuzhi** | Script to Gemini cover image prompts (3 styles × 3 ratios) | `/laohan-fengmianqiuzhi` or "生成封面""做封面" |
| **laohan-fenjingtishici** | Storyboard prompts for diffusion models (FLUX/SDXL/Gemini) | `/laohan-fenjingtishici` or "生成分镜""拆分镜" |

### Quality & Tools

| Skill | What it does | Trigger |
|-------|-------------|----------|
| **laohan-cheat** | Content calibration — scoring, prediction, review, trend analysis | `/laohan-cheat` |
| **laohan-shencha** | Deep audit for technical docs — verify URLs, versions, params | `/laohan-shencha` |
| **laohan-weigui** | Douyin content compliance check — 7 categories (promo/extreme claims/medical/financial/low-quality/sensitive/platform rules), structured report with fix suggestions | `/laohan-weigui` or "检测违规""检查文案""会不会被限流""发之前帮我看看" |
| **laohan-gengxin** | Tool version checker — npm/brew/pip/uv/GitHub/plugins/skills | `/laohan-gengxin` |
| **laohan-jiaocheng** | Tutorial router — load config tutorials by keyword (claude-mem / GLM / ECC / Gemini sidebar, etc.) | `/laohan-jiaocheng <keyword>` |
| **laohan-skillcreator** | Meta-skill — create/modify/optimize Claude Code Skills, combining best practices from Anthropic + Matt Pocock + 9arm | `/laohan-skillcreator` or "创建skill""改skill""优化skill" |

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

### laohan-chuangzuo (unified creation engine)
- [ffmpeg](https://ffmpeg.org/): Audio extraction (recording mode) — `brew install ffmpeg`
- SiliconFlow API key (optional): Transcription — register at [siliconflow.cn](https://siliconflow.cn)
- [whisper.cpp](https://github.com/ggml-org/whisper.cpp) (optional): Local transcription — `brew install whisper.cpp`
- All laohan-notebooklm dependencies (slide mode)

### laohan-cheat
- No extra dependencies (rubric and state templates are bundled in `references/`)

### laohan-jiaocheng
- No extra dependencies

### laohan-shencha
- No extra dependencies (uses Claude Code built-in web search + gh CLI)

### laohan-fengmianqiuzhi / laohan-fenjingtishici
- No extra dependencies, pure text output

### laohan-weigui (content compliance)
- No extra dependencies (keyword database bundled in `references/keywords.md`)

### laohan-skillcreator (Skill creator)
- No extra dependencies

## Quick Start

### Download content
```
You: 帮我下载这个B站视频 https://www.bilibili.com/video/BV1xxx
→ triggers laohan-xiazai → auto-selects best method per platform
```

### Fetch AI trends
```
You: 抓热点
You: 今天的AI精选
→ triggers laohan-redian → 3 sources merged & deduplicated
```

### Unified creation (recording / trends / URL / free topic)
```
You: 把这个录屏视频转成口播稿 /path/to/recording.mp4
You: 找选题 / 写一篇 / 不知道拍什么
You: 根据链接改写 / 改写文档
You: 帮我写个关于 Claude Code 配置的口播稿
→ triggers laohan-chuangzuo, auto-selects mode based on input
```

### Content calibration
```
You: 帮我校准这篇口播稿
→ triggers laohan-cheat → scoring + prediction + suggestions
```

### Script to slides
```
You: 帮我用口播稿生成PPT
→ triggers laohan-notebooklm
```

### Generate cover prompts
```
You: 给这个口播稿生成封面
→ triggers laohan-fengmianqiuzhi
```

### Check tool updates
```
You: 看看哪些工具该更新了
→ /laohan-gengxin
```

### Detect content violations
```
You: 检查下这段口播稿有没有违规词
You: 发之前帮我看看会不会被限流
→ triggers laohan-weigui → 7-category scan with structured report
```

### Create custom Skills
```
You: 帮我创建一个 Skill
You: 优化这个 Skill
→ triggers laohan-skillcreator → guided full creation workflow
```

## License

MIT

## Author

**寒武纪AI** — AI content creator, sharing tools for the community.

- GitHub: [@hanzhcn](https://github.com/hanzhcn)
- Douyin: **寒武纪AI** (follow for more AI tool tutorials)

If you find this useful, please Star ⭐ and follow on Douyin!
