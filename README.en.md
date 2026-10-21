<div align="center">

<img src="assets/logo.svg" alt="laohan-skills" width="96" height="96">

# laohan-skills

[![GitHub stars](https://img.shields.io/github/stars/hanzhcn/laohan-skills?style=social)](https://github.com/hanzhcn/laohan-skills/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Skills](https://img.shields.io/badge/Skills-22-blue.svg)](https://github.com/hanzhcn/laohan-skills)
[![Platform](https://img.shields.io/badge/Platform-Claude%20Code%20%7C%20Codex%20%7C%20OpenClaw-green.svg)](https://agentskills.io/)

**Agent Skills Pack** — Content creation pipeline + 30+ platform acquisition + dev tools

</div>

English | **[中文](./README.md)**

Built by [老韩AI](https://github.com/hanzhcn) · Search **老韩AI** on Douyin for tutorials · Powered by [Claude Code](https://docs.anthropic.com/en/docs/claude-code) / [Codex](https://developers.openai.com/codex/) / [OpenClaw](https://github.com/openclaw/openclaw)

---

## Quick Start

> **Don't install all** — pick only the skills you need. Full per-skill commands in [Install on demand](#install-on-demand).

```bash
# Install all 22 skills (requires Claude Code, Codex, or OpenClaw)
npx skills add hanzhcn/laohan-skills --agent claude-code -g -y   # Codex/OpenClaw users: replace claude-code with codex or openclaw

# Install one (recommended: pick what you need)
npx skills add hanzhcn/laohan-skills --skill laohan-xiazai

# Pick several
npx skills add hanzhcn/laohan-skills --skill laohan-xiazai --skill laohan-chuangzuo

# Codex-only initializer
npx skills add hanzhcn/laohan-skills -a codex --skill laohan-chushicodex -y
```

---

## Install on demand

No need to install all. Pick what you need and copy the command (requires [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Codex](https://developers.openai.com/codex/), or [OpenClaw](https://github.com/openclaw/openclaw)):

**Content Creation (12)**
```bash
npx skills add hanzhcn/laohan-skills --skill laohan-xuanti           # 🔥 Topic decision (trends + creator scan + Douyin validation)
npx skills add hanzhcn/laohan-skills --skill laohan-chuangzuo        # ✍️ Unified creation engine (5 inputs → script)
npx skills add hanzhcn/laohan-skills --skill laohan-weigui           # 🛡️ Douyin compliance scan
npx skills add hanzhcn/laohan-skills --skill laohan-jiaozhun         # 📊 Content calibration (upstream engine)
npx skills add hanzhcn/laohan-skills --skill laohan-fengmianqiuzhi   # 🎨 Qiuzhi covers (1 template × 3 sizes)
npx skills add hanzhcn/laohan-skills --skill laohan-fengmianzhuzige  # 🖼️ TzFilm-style cover system (3-layer, default)
npx skills add hanzhcn/laohan-skills --skill laohan-fenjingtishici   # 🎬 Storyboard prompts
npx skills add hanzhcn/laohan-skills --skill laohan-notebooklm       # 📑 Slide images
npx skills add hanzhcn/laohan-skills --skill laohan-luping           # 🎥 Screen recording automation
npx skills add hanzhcn/laohan-skills --skill laohan-daoyan           # 🎬 V5.1 director pre-production (shared director-state)
npx skills add hanzhcn/laohan-skills --skill laohan-donghua          # 🎞️ B-roll animation (legacy / dual-renderer)
npx skills add hanzhcn/laohan-skills --skill laohan-duopingtai       # 🔄 Multi-platform rewrite (Douyin/Xiaohongshu/WeChat)
```

**Content Acquisition (2)**
```bash
npx skills add hanzhcn/laohan-skills --skill laohan-xiazai           # 📥 30+ platform download/scrape/search
npx skills add hanzhcn/laohan-skills --skill laohan-douyinsousuo     # 🔍 Douyin keyword search
```

**Developer Tools (8 · self-use/advanced, content creators can skip)**
```bash
npx skills add hanzhcn/laohan-skills --skill laohan-shencha          # 🔎 Technical doc audit
npx skills add hanzhcn/laohan-skills --skill laohan-sousuo           # 🌐 Web search & fact verification
npx skills add hanzhcn/laohan-skills --skill laohan-gengxin          # 🔄 Tool version checker
npx skills add hanzhcn/laohan-skills --skill laohan-jiaocheng        # 📖 Config tutorial router
npx skills add hanzhcn/laohan-skills --skill laohan-chushicodex      # ⚙️ Codex environment initializer
npx skills add hanzhcn/laohan-skills --skill laohan-bianpai    # 🧭 Workflow state router (tells the single next step)
npx skills add hanzhcn/laohan-skills --skill laohan-sucai      # 🎞️ B-roll stock footage supplier (visual-reviewed)
npx skills add hanzhcn/laohan-skills --skill laohan-yunying    # 📊 Douyin data & comment insights after publish
```

> Install all: `npx skills add hanzhcn/laohan-skills --agent claude-code -g -y   # Codex/OpenClaw users: replace claude-code with codex or openclaw`

---

## Content Creation (12)

> From topic selection to final cut, full pipeline coverage. Each step has a matching skill — just say the word.

```
laohan-xuanti → laohan-chuangzuo → laohan-weigui → laohan-jiaozhun → laohan-fengmianqiuzhi / laohan-fenjingtishici → laohan-notebooklm → laohan-luping / laohan-donghua
   topics          script             review          score            covers / storyboards                         slides             recording / B-roll
```

<table>
<tr><td>

### 🔥 laohan-xuanti (Trends)

> *"Hundreds of AI news per day — by the time I see them, they're already stale."*

Topic decision engine: follows the five-step method (scan hits → filter fake hits → check repetition → pick an angle → verify save value), scans creator and self-channel outliers, decides the topic with your veto retained; AIHOT + 9-platform trending and Douyin keyword validation serve as evidence inputs.

```
You: 抓热点 / 今天的AI精选 / 看看有什么热点
```

</td></tr>
</table>

<table>
<tr><td>

### ✍️ laohan-chuangzuo (Creation)

> *"Five inputs, one output — whatever you have on hand can become a script."*

Unified creation engine supporting 5 input modes: screen recording / URL queue / structured outline / raw text / free topic. Outputs complete scripts following style rules.

```
You: 帮我写一篇关于 xxx 的口播稿 / 不知道拍什么 / 把这个视频转成稿子
```

</td></tr>
</table>

<table>
<tr><td>

### 🛡️ laohan-weigui (Compliance)

> *"Looks fine when writing, gets shadowbanned after posting."*

9-category scan: off-platform funneling / superlatives & ad law / medical promises / financial promises / clickbait & low quality / sensitive topics / platform-specific restrictions / sexual content / flame-bait & abuse. Structured report with fix suggestions — not just "you have a problem", but "here's how to fix it".

```
You: 检测违规 / 检查有没有违规词 / 发之前帮我看看
```

</td></tr>
</table>

<table>
<tr><td>

### 📊 laohan-jiaozhun (Calibration)

> *"Bad views, but no idea what to change."*

Calibration adapter that wires an episode into the upstream cheat-on-content engine: 6-dimension scoring (title searchability / operability & effect verification / duration fit / collection value / hook strength / ending completeness) + view prediction + post-mortem advice. The scoring engine is not in this repo and must be installed separately.

```
You: 校准打分 / 帮我打分 / 预测一下播放量
```

</td></tr>
</table>

<table>
<tr><td>

### 🎞️ laohan-donghua (B-roll Video)

> *"Script written, real-person video shot — how do I composite a polished final cut?"*

B-roll animation compositing for legacy episodes or when Remotion/HyperFrames is explicitly requested, rendered from AST and renderer handoffs. 24-technique library (count-up / text reveal / strike-through list / gradient sweep / vignette breathing / scan-line / word-level karaoke, etc.). New episodes default to direct Codex production and do not use this skill.

```
你: 做 B-roll / 给视频加特效 / 生成动画片段
```

</td></tr>
</table>

| Skill | One-liner | Say |
|-------|-----------|-----|
| 🎨 **laohan-fengmianqiuzhi** | Qiuzhi set (switchable): 1 best-fit template from 45, rendered at 3:4 / 4:3 / 16:9 with accurate Chinese text | "生成封面" |
| 🖼️ **laohan-fengmianzhuzige** | TzFilm set (default): background plate + real-person layer + Remotion text layer, native 3:4 | "柱子哥封面" |
| 🎬 **laohan-fenjingtishici** | Storyboard prompts (FLUX / SDXL / Gemini, quality-validated) | "拆分镜" |
| 📑 **laohan-notebooklm** | Script → slide images (NotebookLM, ready for video editors) | "做 PPT" |
| 🎥 **laohan-luping** | Screen recording automation (ffmpeg physical screen + Playwright browser → 1080p MP4) | "录屏" |
| 🎬 **laohan-daoyan** | V5.1 director pre-production (draft + final review share director-state, stops for footage) | "做导演初稿" |
| 🔄 **laohan-duopingtai** | Multi-platform rewrite (script → Douyin / Xiaohongshu / WeChat 3 versions) | "多平台改写" |

---

## Content Acquisition (2)

<table>
<tr><td>

### 📥 laohan-xiazai (Download)

> *"More than a downloader — any scenario where you grab content from the internet is its territory."*

30+ platforms, platform routing + 6 fallback tiers, 20+ tool integration. Say "下载" "搜一下" "读一下" and it auto-routes:

```
Platform routing        → opencli / agent-reach / yt-dlp / Jina Reader
Tier 1  Lightweight     → Scrapling get (HTTP requests, seconds)
Tier 2  Real login      → huashu-chrome MCP (your daily Chrome + effect evidence)
Tier 3  Anti-detection  → Scrapling stealthy (bypass Cloudflare/WAF)
Tier 4  AI browser      → browser-use (AI understands page, autonomous)
Tier 5  CDP takeover    → web-access (daily Chrome, login-state fallback)
Tier 6  Precision       → Playwright (code-level control)
```

Covers: Video download / search aggregation / web extraction / comment scraping / speech transcription / creator data

Integrated tools (common selection, 20+ total): opencli · agent-reach · AnySearch · yt-dlp · Scrapling · huashu-chrome · browser-use · web-access · Jina Reader · ffmpeg · whisper.cpp · tesseract · wx_video_download, etc.

```
You: 下载这个视频 / 搜一下 xxx / 读一下这个链接 / 帮我转文字
```

</td></tr>
</table>

<table>
<tr><td>

### 🔍 laohan-douyinsousuo (Douyin Search)

> *"When a mature search path exists, do not maintain a second browser stack."*

Orchestrates the installed OpenCLI for login preflight, keyword search, and topic analysis. Failures stay within the OpenCLI adapter, trace/autofix, and Browser Bridge path, with no separate browser runtime.

```
You: 抖音搜索 Claude Code / 帮我搜一下抖音上关于 xxx 的视频
```

</td></tr>
</table>

---

## Developer Tools (8 · self-use/advanced)

> ⚠️ Below are for developers (maintenance/config/audit). **Content creators can skip this section.**

| Skill | One-liner | Say | Notes |
|-------|-----------|-----|-------|
| 🌐 **laohan-sousuo** | Verify technical claims before asserting — 3-way retrieval (official docs / GitHub issues / community posts), with cited sources | "上网搜" "查证" "先查再说" | Prevents invented API behavior; conclusions carry `(verified: URL)`, and it says plainly when nothing was found |
| 🔎 **laohan-shencha** | Technical doc deep audit — verify URLs, versions, params accuracy | "深度审查" | Read-only by default; verifies facts only and will not rewrite your templates or wording |
| 🔄 **laohan-gengxin** | Tool version checker — npm/brew/pip/uv/GitHub/plugins/skills | "检查更新" | — |
| 📖 **laohan-jiaocheng** | Tutorial router — claude-mem / GLM / ECC / Gemini (5 tutorials) | "教程" | — |
| ⚙️ **laohan-chushicodex** | Safe minimal Codex setup and verification loop | "初始化 Codex" | Read-only audit first; does not auto-upgrade or install dependencies |
| 🧭 **laohan-bianpai** | Video workflow state router — inspect artifacts and gate the next step | "恢复 episode" "判断下一步" | Routes only — never calls other skills or publishes |
| 📦 **laohan-sucai** | Search, download, and visually review B-roll against a source manifest | "配素材" "找 B-roll" | Optimizes for look and pacing, not for sourcing evidence per sentence |
| 📈 **laohan-yunying** | Post-publish registration, metrics, comments, and retro handoff | "运营" "数据" "复盘" | — |

### 🏛️ Governance Skills (11 · private repo, not in this pack)

> These live in a private governance repo (`~/.agents`) and are **not installable from this public pack**. Listed only so you can see the full system:

| Skill | What it does | Say | When |
|-------|--------------|-----|------|
| 📚 **devrules** | Load the dev rulebook before work, then recite it back | "学习规则" "接上规则" | New window/model taking over important work |
| 🏗️ **chushihua** | One-shot project init (doc skeleton + git gates + review ledger) | "初始化" "开新项目" | Every new project |
| 🔌 **harness** | Wire a new AI client into the rule system (5 steps + 6 case studies) | "新 harness" | Every new AI tool (one-time) |
| ✅ **review** | Two-level review: self-review → cross-model adversarial → item-by-item adjudication | "审查" "对抗审查" | Every code change |
| 🔍 **paicha** | Failure investigation: attribute the red → read-only diagnosis → fix with evidence | "排查" "为什么失败" | When something breaks (describe symptoms) |
| ⚖️ **caijue** | Validate another AI's suggestions before applying them | "裁决" "按这个修" | Taking over another window's review findings |
| 🤝 **jiaojie** | Window handoff: write/read a state pack and verify it | "交接" "接手" | Switching between parallel windows |
| 🚀 **fabu** | Cross-project release manual: ordered surfaces / four syncs / gate checks | "发布" | When shipping |
| 🧹 **shouwei** | Pre-close audit: worktrees / unpushed commits / deploy consistency | "收尾" | Before closing a window |
| 📋 **doccheck** | Six mechanical doc checks (pointers / counts / length / orphans / broken links) | "文档体检" | Periodically as docs grow |
| 🎫 **edu-guard** | GLM quota guard: check quota and apply reset cards on schedule | "开守卫" | Quota management |

**In one line**: learn (devrules) → initialize (chushihua) → wire (harness) → review (review) → diagnose (paicha) → adjudicate (caijue) → hand off (jiaojie) → release (fabu) → wrap up (shouwei) → docs (doccheck).

---

## Standalone Tool: WeChat Video Download

Mac + Windows installer packages. Install and use directly. Based on MITM proxy intercepting video streams with auto-injected download button.

👉 [Download installer](https://github.com/hanzhcn/laohan-skills/releases)

---

## Prerequisites

> [Claude Code](https://docs.anthropic.com/en/docs/claude-code), [Codex](https://developers.openai.com/codex/), or [OpenClaw](https://github.com/openclaw/openclaw) is all you need to install the pack. Some skills need the optional tools below, and laohan-jiaozhun also needs the upstream cheat-on-content engine (not in this repo).

| Tool | Install | Enhances which skills |
|------|---------|----------------------|
| [opencli](https://github.com/jackwener/opencli) | `npm i -g @jackwener/opencli` | laohan-xiazai (Bilibili/Xiaohongshu download, trending, search), laohan-douyinsousuo (Douyin search) |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | `brew install yt-dlp` | laohan-xiazai (YouTube download) |
| [ffmpeg](https://ffmpeg.org/) | `brew install ffmpeg` | laohan-xiazai (audio/video transcoding), laohan-chuangzuo (audio extraction), laohan-luping (recording) |
| [Playwright](https://playwright.dev/) | `npm i -g playwright && npx playwright install chromium` | laohan-xiazai (browser scraping), laohan-luping (browser recording) |
| [tmux](https://github.com/tmux/tmux) | `brew install tmux` | laohan-luping (terminal recording) |
| SiliconFlow API Key | Register at [siliconflow.cn](https://siliconflow.cn) (free) | laohan-xiazai (cloud transcription), laohan-chuangzuo (speech-to-text) |
| [nlm CLI](https://pypi.org/project/notebooklm-mcp-cli/) + [poppler](https://poppler.freedesktop.org/) | `pip install notebooklm-mcp-cli` + `brew install poppler` | laohan-notebooklm (slide generation) |
| [whisper.cpp](https://github.com/ggml-org/whisper.cpp) | `brew install whisper-cpp` | laohan-xiazai / laohan-chuangzuo (local transcription) |

> This table lists common enhancements only; other tools in the fallback chain are documented in each skill and installed on demand.

Skills that commonly need no extra dependencies: laohan-xuanti · laohan-weigui · laohan-shencha · laohan-gengxin · laohan-jiaocheng · laohan-chushicodex · laohan-fengmianqiuzhi · laohan-fenjingtishici. laohan-jiaozhun requires the upstream cheat-on-content engine (not in this repo). laohan-fengmianzhuzige requires the Remotion runtime, a local Python vision environment (rembg/onnxruntime), and ffmpeg. laohan-douyinsousuo reuses the installed opencli and no longer ships a Python/browser runtime.

---

## Tutorials

| Tutorial | Description |
|----------|-------------|
| [claude-mem + LiteLLM: Drive Claude Code Cross-Session Memory with Chinese LLMs](./docs/claude-mem-litellm.md) | Use LiteLLM proxy to let claude-mem support GLM / DeepSeek instead of OpenRouter |
| [CLAUDE.md Configuration Guide: Four Principles to Reduce AI Coding Mistakes](./docs/claude-md-guide.md) | Think Before Coding / Simplicity First / Surgical Changes / Goal-Driven Execution |
| [Chrome Gemini Sidebar Fix (China)](./docs/gemini-sidebar-fix.md) | Mac + Windows scripts to fix Chrome Gemini sidebar in China |
| [Claude Code + ZhiPu GLM: Drive AI Coding with Domestic LLMs](./docs/claude-code-glm.md) | Full guide: env vars, thinking mode, timeout, model switching |
| [ECC Plugin Install & Maintenance Guide](./docs/ecc-plugin-guide.md) | Rules distribution, hooks mechanism, upgrade checklist |

---

## About

I'm 老韩AI, a content creator using AI tools. Not a professional programmer, but I believe good tools should be accessible to everyone.

These skills are what I use daily — from topic selection, writing, review to publishing, all powered by Claude Code + this skill pack. Every pitfall I've hit, every parameter I've tuned, every pattern I've learned — they're all baked in.

If you find this useful, please ⭐ and search **老韩AI** on Douyin to see how I use these tools.

---

<div align="center">

[MIT License](./LICENSE) · Free to use / modify / redistribute

Made by [老韩AI](https://github.com/hanzhcn)

</div>
