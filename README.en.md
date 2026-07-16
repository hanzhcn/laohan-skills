<div align="center">

<img src="assets/logo.svg" alt="laohan-skills" width="96" height="96">

# laohan-skills

[![GitHub stars](https://img.shields.io/github/stars/hanzhcn/laohan-skills?style=social)](https://github.com/hanzhcn/laohan-skills/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Skills](https://img.shields.io/badge/Skills-16-blue.svg)](https://github.com/hanzhcn/laohan-skills)
[![Platform](https://img.shields.io/badge/Platform-Claude%20Code%20%7C%20OpenClaw-green.svg)](https://docs.anthropic.com/en/docs/claude-code)

**Claude Code Skills Pack** — Content creation pipeline + 30+ platform acquisition + dev tools

</div>

English | **[中文](./README.md)**

Built by [寒武纪AI](https://github.com/hanzhcn) · Search **寒武纪AI** on Douyin for tutorials · Powered by [Claude Code](https://docs.anthropic.com/en/docs/claude-code) / [OpenClaw](https://github.com/openclaw/openclaw)

---

## Quick Start

> **Don't install all** — pick only the skills you need. Full per-skill commands in [Install on demand](#install-on-demand).

```bash
# Install all 16 skills (requires Claude Code or OpenClaw)
npx skills add hanzhcn/laohan-skills -g -y

# Install one (recommended: pick what you need)
npx skills add hanzhcn/laohan-skills --skill laohan-xiazai

# Pick several
npx skills add hanzhcn/laohan-skills --skill laohan-xiazai --skill laohan-chuangzuo
```

---

## Install on demand

No need to install all. Pick what you need and copy the command (requires [Claude Code](https://docs.anthropic.com/en/docs/claude-code)):

**Content Creation (10)**
```bash
npx skills add hanzhcn/laohan-skills --skill laohan-redian           # 🔥 3-source AI trend aggregation
npx skills add hanzhcn/laohan-skills --skill laohan-chuangzuo        # ✍️ Unified creation engine (6 inputs → script)
npx skills add hanzhcn/laohan-skills --skill laohan-weigui           # 🛡️ Douyin compliance scan
npx skills add hanzhcn/laohan-skills --skill laohan-cheat            # 📊 Content calibration scoring
npx skills add hanzhcn/laohan-skills --skill laohan-fengmianqiuzhi   # 🎨 Cover image prompts
npx skills add hanzhcn/laohan-skills --skill laohan-fenjingtishici   # 🎬 Storyboard prompts
npx skills add hanzhcn/laohan-skills --skill laohan-notebooklm       # 📑 Slide images
npx skills add hanzhcn/laohan-skills --skill laohan-luping           # 🎥 Screen recording automation
npx skills add hanzhcn/laohan-skills --skill laohan-donghua          # 🎞️ B-roll overlay video
npx skills add hanzhcn/laohan-skills --skill duopingtai              # 🔄 Multi-platform rewrite (Douyin/Xiaohongshu/WeChat)
```

**Content Acquisition (2)**
```bash
npx skills add hanzhcn/laohan-skills --skill laohan-xiazai           # 📥 30+ platform download/scrape/search
npx skills add hanzhcn/laohan-skills --skill laohan-douyinsousuo     # 🔍 Douyin keyword search
```

**Developer Tools (4 · self-use/advanced, content creators can skip)**
```bash
npx skills add hanzhcn/laohan-skills --skill laohan-shencha          # 🔎 Technical doc audit
npx skills add hanzhcn/laohan-skills --skill laohan-gengxin          # 🔄 Tool version checker
npx skills add hanzhcn/laohan-skills --skill laohan-jiaocheng        # 📖 Config tutorial router
npx skills add hanzhcn/laohan-skills --skill laohan-skillcreator     # 🛠️ Create/modify skills
```

> Install all: `npx skills add hanzhcn/laohan-skills -g -y`

---

## Content Creation (10)

> From topic selection to final recording, 8-step full pipeline. Each step has a matching skill — just say the word.

```
redian → chuangzuo → weigui → cheat → fengmian / fenjing → notebooklm → luping / donghua
 trends    script     review   score    cover / storyboard    slides     recording / B-roll
```

<table>
<tr><td>

### 🔥 redian (Trends)

> *"Hundreds of AI news per day — by the time I see them, they're already stale."*

3-source parallel AI trend aggregation: AIHOT picks + 9-platform trending + Douyin AI filter, merged & deduplicated into a daily briefing.

```
You: 抓热点 / 今天的AI精选 / 看看有什么热点
```

</td></tr>
</table>

<table>
<tr><td>

### ✍️ chuangzuo (Creation)

> *"Six inputs, one output — whatever you have on hand can become a script."*

Unified creation engine supporting 6 input modes: screen recording / URL queue / trend translation / structured outline / raw text / free topic. Outputs complete scripts following style rules.

```
You: 帮我写一篇关于 xxx 的口播稿 / 不知道拍什么 / 把这个视频转成稿子
```

</td></tr>
</table>

<table>
<tr><td>

### 🛡️ weigui (Compliance)

> *"Looks fine when writing, gets shadowbanned after posting."*

7-category scan: promo words / extreme claims / medical promises / financial promises / low-quality markers / sensitive words / platform restrictions. Structured report with fix suggestions — not just "you have a problem", but "here's how to fix it".

```
You: 检测违规 / 检查有没有违规词 / 发之前帮我看看
```

</td></tr>
</table>

<table>
<tr><td>

### 📊 cheat (Calibration)

> *"Bad views, but no idea what to change."*

6-dimension scoring (title / hook / structure / pacing / info density / brand feel) + view prediction + post-mortem suggestions. Quantify your content quality — no more guessing.

```
You: 校准打分 / 帮我打分 / 预测一下播放量
```

</td></tr>
</table>

<table>
<tr><td>

### 🎞️ donghua (B-roll Video)

> *"Script written, real-person video shot — how do I composite a polished final cut?"*

Script + real-person video → B-roll overlay final video. Built on Hyperframes: one index.html + one render. 10-technique library (grain / vignette / stagger / 3D / cinematic-zoom / glitch / glow / shimmer, etc.).

```
你: 做 B-roll / 给视频加特效 / 生成动画片段
```

</td></tr>
</table>

| Skill | One-liner | Say |
|-------|-----------|-----|
| 🎨 **fengmian** | Gemini cover prompts (Qiuzhi 2046 style, 3 styles × 3 ratios) | "生成封面" |
| 🎬 **fenjing** | Storyboard prompts (FLUX / SDXL / Gemini, quality-validated) | "拆分镜" |
| 📑 **notebooklm** | Script → slide images (NotebookLM, ready for video editors) | "做 PPT" |
| 🎥 **luping** | Screen recording automation (ffmpeg physical screen + Playwright browser → 1080p MP4) | "录屏" |
| 🔄 **duopingtai** | Multi-platform rewrite (script → Douyin / Xiaohongshu / WeChat 3 versions) | "多平台改写" |

---

## Content Acquisition (2)

<table>
<tr><td>

### 📥 xiazai (Download)

> *"More than a downloader — any scenario where you grab content from the internet is its territory."*

30+ platforms, 6-layer smart fallback, 20+ tool integration. Say "下载" "搜一下" "读一下" and it auto-routes:

```
Layer 1  Platform wrappers    → opencli / agent-reach / yt-dlp / anysearch
Layer 2  Lightweight fetch    → Scrapling MCP (HTTP requests, seconds)
Layer 3  JS rendering         → Scrapling fetch (browser rendering)
Layer 4  Anti-detection       → Scrapling stealthy (bypass Cloudflare/WAF)
Layer 5  AI browser           → browser-use (AI understands page, autonomous)
Layer 6  Precision control    → Playwright / web-access CDP (code-level control)
```

Covers: Video download / search aggregation / web extraction / comment scraping / speech transcription / creator data

Integrated tools: opencli · agent-reach · AnySearch · yt-dlp · Scrapling · browser-use · Jina Reader · ffmpeg · whisper.cpp · tesseract · wx_video_download

```
You: 下载这个视频 / 搜一下 xxx / 读一下这个链接 / 帮我转文字
```

</td></tr>
</table>

<table>
<tr><td>

### 🔍 douyinsousuo (Douyin Search)

> *"When a mature search path exists, do not maintain a second browser stack."*

Orchestrates the installed OpenCLI for login preflight, keyword search, and topic analysis. Failures stay within the OpenCLI adapter, trace/autofix, and Browser Bridge path, with no separate browser runtime.

```
You: 抖音搜索 Claude Code / 帮我搜一下抖音上关于 xxx 的视频
```

</td></tr>
</table>

---

## Developer Tools (4 · self-use/advanced)

> ⚠️ Below are for developers (maintenance/config/audit). **Content creators can skip this section.**

| Skill | One-liner | Say |
|-------|-----------|-----|
| 🔎 **shencha** | Technical doc deep audit — verify URLs, versions, params accuracy | "深度审查" |
| 🔄 **gengxin** | Tool version checker — npm/brew/pip/GitHub/plugins | "检查更新" |
| 📖 **jiaocheng** | Tutorial router — claude-mem / GLM / ECC / Gemini (5 tutorials) | "教程" |
| 🛠️ **skillcreator** | Meta-skill — create / modify / optimize Claude Code Skills | "创建 skill" |

---

## Standalone Tool: WeChat Video Download

Mac + Windows installer packages. Install and use directly. Based on MITM proxy intercepting video streams with auto-injected download button.

👉 [Download installer](https://github.com/hanzhcn/laohan-skills/releases)

---

## Prerequisites

> Only [Claude Code](https://docs.anthropic.com/en/docs/claude-code) or [OpenClaw](https://github.com/openclaw/openclaw) is required. Below are optional enhancements.

| Tool | Install | Enhances which skills |
|------|---------|----------------------|
| [opencli](https://github.com/jackwener/opencli) | `npm i -g @jackwener/opencli` | xiazai (Bilibili/Xiaohongshu download, trending, search), douyinsousuo (Douyin search) |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | `brew install yt-dlp` | xiazai (YouTube download) |
| [ffmpeg](https://ffmpeg.org/) | `brew install ffmpeg` | xiazai (audio/video transcoding), chuangzuo (audio extraction), luping (recording) |
| [Playwright](https://playwright.dev/) | `npm i -g playwright && npx playwright install chromium` | xiazai (browser scraping), luping (browser recording) |
| [tmux](https://github.com/tmux/tmux) | `brew install tmux` | luping (terminal recording) |
| SiliconFlow API Key | Register at [siliconflow.cn](https://siliconflow.cn) (free) | xiazai (cloud transcription), chuangzuo (speech-to-text) |
| [nlm CLI](https://pypi.org/project/notebooklm-mcp-cli/) + [poppler](https://poppler.freedesktop.org/) | `pip install notebooklm-mcp-cli` + `brew install poppler` | notebooklm (slide generation) |
| [whisper.cpp](https://github.com/ggml-org/whisper.cpp) | `brew install whisper-cpp` | xiazai / chuangzuo (local transcription) |

Skills with no extra dependencies: redian · weigui · cheat · shencha · gengxin · jiaocheng · skillcreator · fengmian · fenjing. douyinsousuo reuses the installed opencli and no longer ships a Python/browser runtime.

---

## Tutorials

| Tutorial | Description |
|----------|-------------|
| [claude-mem + LiteLLM: Drive Claude Code Cross-Session Memory with Local LLMs](./docs/claude-mem-litellm.md) | Use LiteLLM proxy to let claude-mem support GLM / DeepSeek instead of OpenRouter |
| [CLAUDE.md Configuration Guide: Four Principles to Reduce AI Coding Mistakes](./docs/claude-md-guide.md) | Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution |
| [Chrome Gemini Sidebar Fix (China)](./docs/gemini-sidebar-fix.md) | Mac + Windows scripts to fix Chrome Gemini sidebar in China |
| [Claude Code + ZhiPu GLM: Drive AI Coding with Domestic LLMs](./docs/claude-code-glm.md) | Full guide: env vars, thinking mode, timeout, model switching |
| [ECC Plugin Install & Maintenance Guide](./docs/ecc-plugin-guide.md) | Rules distribution, hooks mechanism, upgrade checklist |

---

## About

I'm 寒武纪AI, a content creator using AI tools. Not a professional programmer, but I believe good tools should be accessible to everyone.

These skills are what I use daily — from topic selection, writing, review to publishing, all powered by Claude Code + this skill pack. Every pitfall I've hit, every parameter I've tuned, every pattern I've learned — they're all baked in.

If you find this useful, please ⭐ and search **寒武纪AI** on Douyin to see how I use these tools.

---

<div align="center">

[MIT License](./LICENSE) · Free to use / modify / redistribute

Made by [寒武纪AI](https://github.com/hanzhcn)

</div>
