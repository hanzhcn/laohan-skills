<div align="center">

<img src="assets/logo.svg" alt="laohan-skills" width="96" height="96">

# laohan-skills

[![GitHub stars](https://img.shields.io/github/stars/hanzhcn/laohan-skills?style=social)](https://github.com/hanzhcn/laohan-skills/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Skills](https://img.shields.io/badge/Skills-14-blue.svg)](https://github.com/hanzhcn/laohan-skills)
[![Platform](https://img.shields.io/badge/Platform-Claude%20Code%20%7C%20OpenClaw-green.svg)](https://docs.anthropic.com/en/docs/claude-code)

**Claude Code Skills Pack** — Content creation pipeline + 30+ platform acquisition + dev tools
**Claude Code 超级技能包** — 内容创作全流程 + 30 平台内容获取 + 开发者工具，一句话搞定

</div>

**[English](./README.en.md)** | 中文

由 [寒武纪AI](https://github.com/hanzhcn) 出品 · 抖音搜索「**寒武纪AI**」看实战教程 · 基于 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) / [OpenClaw](https://github.com/openclaw/openclaw)

---

## Quick Start

```bash
# 一键安装全部 14 个技能（需要 Claude Code 或 OpenClaw）
npx skills add hanzhcn/laohan-skills -g -y
```

> `skills` CLI 来自 [vercel-labs/skills](https://github.com/vercel-labs/skills)，`npx` 自动下载无需手动安装。前提：已安装 [Claude Code](https://docs.anthropic.com/en/docs/claude-code)。

```
你: 抓热点                    → 三路并行输出 AI 热点简报
你: 帮我写一篇关于 xxx 的口播稿  → 统一创作引擎输出完整稿件
你: 下载这个 B站视频           → 自动选择最优方法下载
你: 抖音搜索 Claude Code      → 采集排行 + 选题分析
你: 检查有没有违规词           → 7 类扫描 + 替换建议
你: 帮我校准打分              → 6 维打分 + 播放量预测
```

---

## 内容创作（8 个）

> 从选题到成片，8 步全流程覆盖。每一步都有对应技能，说一句就能触发。

```
redian → chuangzuo → weigui → cheat → fengmian / fenjing → notebooklm → luping
 选题      写稿       审核     校准      封面 / 分镜          幻灯片      录屏
```

<table>
<tr><td>

### 🔥 redian（热点）

> *"AI 圈一天发几百条，等我看到的时候已经过气了。"*

三路并行抓取 AI 热点：AIHOT 精选 + 9 平台热榜 + 抖音 AI 筛选，合并去重后输出当日简报。

```
你: 抓热点 / 今天的AI精选 / 看看有什么热点
```

</td></tr>
</table>

<table>
<tr><td>

### ✍️ chuangzuo（创作）

> *"六种输入，一个出口——无论你手上有什么，都能变成口播稿。"*

统一创作引擎，支持录屏视频 / URL 队列 / 热点转译 / 结构化大纲 / 原始文本 / 自由主题，按风格规则输出完整稿件。

```
你: 帮我写一篇关于 xxx 的口播稿 / 不知道拍什么 / 把这个视频转成稿子
```

</td></tr>
</table>

<table>
<tr><td>

### 🛡️ weigui（违规检测）

> *"写的时候觉得自己没问题，发出去直接限流。"*

7 类扫描：引流词 / 极限词 / 医疗承诺 / 金融承诺 / 低质标记 / 敏感词 / 平台限制。结构化报告 + 替换建议，不是只告诉你有问题，还告诉你怎么改。

```
你: 检测违规 / 检查有没有违规词 / 发之前帮我看看
```

</td></tr>
</table>

<table>
<tr><td>

### 📊 cheat（校准）

> *"播放量不好，但不知道哪里可以改。"*

6 维打分（标题/开头/结构/节奏/信息密度/品牌感）+ 播放量预测 + 复盘建议。量化你的内容质量，不再靠感觉。

```
你: 校准打分 / 帮我打分 / 预测一下播放量
```

</td></tr>
</table>

| 技能 | 一句话 | 说 |
|------|--------|-----|
| 🎨 **fengmian** | Gemini 封面提示词（秋芝 2046 风格，3 种 × 3 比例） | "生成封面" |
| 🎬 **fenjing** | 分镜提示词（FLUX / SDXL / Gemini，质量校验后拆分） | "拆分镜" |
| 📑 **notebooklm** | 口播稿 → 幻灯片图片（NotebookLM，剪映直接用） | "做 PPT" |
| 🎥 **luping** | 录屏自动化（ffmpeg 物理屏 + Playwright 浏览器 → 1080p MP4） | "录屏" |

---

## 内容获取（2 个）

<table>
<tr><td>

### 📥 xiazai（下载）

> *"不只是下载器——从互联网上拿内容的任何场景，都是它的地盘。"*

30+ 平台，6 层智能降级架构，20+ 工具集成。说"下载""搜一下""读一下"自动路由：

```
Layer 1  平台封装     → opencli / agent-reach / yt-dlp / anysearch
Layer 2  轻量抓取     → Scrapling MCP（HTTP 请求，秒级）
Layer 3  JS 渲染      → Scrapling fetch（浏览器渲染）
Layer 4  反检测隐身   → Scrapling stealthy（绕 Cloudflare/WAF）
Layer 5  AI 浏览器    → browser-use（AI 理解页面，自主操作）
Layer 6  精确控制     → Playwright / web-access CDP（代码级控制）
```

覆盖：视频下载 / 搜索聚合 / 网页提取 / 评论采集 / 语音转录 / 博主数据

集成工具：opencli · agent-reach · AnySearch · yt-dlp · Scrapling · browser-use · Jina Reader · ffmpeg · whisper.cpp · DrissionPage · tesseract · wx_video_download

```
你: 下载这个视频 / 搜一下 xxx / 读一下这个链接 / 帮我转文字
```

</td></tr>
</table>

<table>
<tr><td>

### 🔍 douyinsousuo（抖音搜索）

> *"抖音搜索没有 API，那就自己造一个。"*

DrissionPage 监听 + 滚动采集，按点赞排行 TOP 20 + 选题分析。搜索竞品、发现选题、追踪热点。

```
你: 抖音搜索 Claude Code / 帮我搜一下抖音上关于 xxx 的视频
```

</td></tr>
</table>

---

## 开发者工具（4 个）

| 技能 | 一句话 | 说 |
|------|--------|-----|
| 🔎 **shencha** | 技术文档联网审查 — 验证地址/版本/参数准确性 | "深度审查" |
| 🔄 **gengxin** | 工具版本检查更新 — npm/brew/pip/GitHub/plugins | "检查更新" |
| 📖 **jiaocheng** | 教程路由器 — claude-mem/GLM/ECC/Gemini 等 5 个教程 | "教程" |
| 🛠️ **skillcreator** | 元技能 — 创建/修改/优化 Claude Code Skill | "创建 skill" |

---

## 独立工具：微信视频号下载

Mac + Windows 双平台安装包，装完直接用。基于 MITM 代理拦截视频流，自动注入下载按钮。

👉 [下载安装包](https://github.com/hanzhcn/laohan-skills/releases)

---

## 前置依赖

> 只需 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 或 [OpenClaw](https://github.com/openclaw/openclaw) 即可使用全部技能。以下为可选增强。

| 工具 | 安装 | 增强哪些技能 |
|------|------|-------------|
| [opencli](https://github.com/jackwener/opencli) | `npm i -g @jackwener/opencli` | xiazai（B站/小红书下载、热榜、搜索） |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | `brew install yt-dlp` | xiazai（YouTube 下载） |
| [ffmpeg](https://ffmpeg.org/) | `brew install ffmpeg` | xiazai（音视频转码）、chuangzuo（音频提取）、luping（录屏） |
| [Playwright](https://playwright.dev/) | `npm i -g playwright && npx playwright install chromium` | xiazai（浏览器抓取）、luping（浏览器录屏） |
| [tmux](https://github.com/tmux/tmux) | `brew install tmux` | luping（终端录屏） |
| 硅基流动 API Key | 注册 [siliconflow.cn](https://siliconflow.cn)（免费） | xiazai（云端语音转录）、chuangzuo（语音转文字） |
| [DrissionPage](https://github.com/g1879/DrissionPage) + Chrome | `pip install DrissionPage` | douyinsousuo（抖音搜索） |
| [nlm CLI](https://pypi.org/project/notebooklm-mcp-cli/) + [poppler](https://poppler.freedesktop.org/) | `pip install notebooklm-mcp-cli` + `brew install poppler` | notebooklm（幻灯片生成） |
| [whisper.cpp](https://github.com/ggml-org/whisper.cpp) | `brew install whisper-cpp` | xiazai / chuangzuo（本地语音转录） |

无额外依赖的技能：redian · weigui · cheat · shencha · gengxin · jiaocheng · skillcreator · fengmian · fenjing

---

## 教程

| 教程 | 说明 |
|------|------|
| [claude-mem + LiteLLM：国产大模型驱动跨会话记忆](./docs/claude-mem-litellm.md) | 智谱 GLM / DeepSeek 替代 OpenRouter |
| [CLAUDE.md 配置四原则](./docs/claude-md-guide.md) | 想清楚再动手 / 能50行别200行 / 只改该改的 / 目标驱动 |
| [Chrome Gemini 侧边栏修复](./docs/gemini-sidebar-fix.md) | Mac + Windows 双平台脚本 |
| [Claude Code + 智谱 GLM 接入](./docs/claude-code-glm.md) | 环境变量、thinking、超时、模型切换 |
| [ECC 插件安装维护指南](./docs/ecc-plugin-guide.md) | rules 分发、hooks 机制、升级清单 |

---

## 关于

我是寒武纪AI，一个用 AI 工具做内容创作的普通人。不是专业程序员，但相信好工具应该人人用得起。

这些 skill 都是我自己每天在用的——从选题、写稿、审核到发布，全靠 Claude Code + 这套技能包跑通。踩过的坑、调过的参数、摸过的套路，全都塞进去了。

觉得有用的话，给个 ⭐，抖音搜索「**寒武纪AI**」看我是怎么用这些工具的。

---

<div align="center">

[MIT License](./LICENSE) · 自由使用 / 修改 / 再分发

Made by [寒武纪AI](https://github.com/hanzhcn)

</div>
