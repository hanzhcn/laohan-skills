# laohan-skills

[![GitHub stars](https://img.shields.io/github/stars/hanzhcn/laohan-skills?style=social)](https://github.com/hanzhcn/laohan-skills/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Skills](https://img.shields.io/badge/Skills-14-blue.svg)](https://github.com/hanzhcn/laohan-skills)
[![Platform](https://img.shields.io/badge/Platform-Claude%20Code%20%7C%20OpenClaw-green.svg)](https://claude.ai/code)

> Claude Code 超级技能包 — 内容创作全流程 + 30 平台内容获取 + 开发者工具，一句话搞定。

[English](./README.en.md) | 中文

由 [寒武纪AI](https://github.com/hanzhcn) 出品 · 抖音搜索「**寒武纪AI**」看实战教程 · 基于 [Claude Code](https://claude.ai/code) / [OpenClaw](https://github.com/openclaw/openclaw)

---

## Quick Start

```bash
# 一键安装全部 14 个技能
npx skills add hanzhcn/laohan-skills -g -y

# 然后在 Claude Code 或 OpenClaw 中直接用
你: 抓热点                    → 三路并行输出 AI 热点简报
你: 帮我写一篇关于 xxx 的口播稿  → 统一创作引擎输出完整稿件
你: 下载这个 B站视频           → 自动选择最优方法下载
你: 抖音搜索 Claude Code      → 采集排行 + 选题分析
你: 检查有没有违规词           → 7 类扫描 + 替换建议
你: 帮我校准打分              → 6 维打分 + 播放量预测
```

## 三句话了解

**内容创作全流程** — 从选题到成片 8 步自动化：热点抓取 → 口播稿 → 违规检测 → 质量校准 → 封面分镜 → 幻灯片 → 录屏，每一步都有对应技能。

**30+ 平台内容获取** — 抖音/B站/YouTube/TikTok/小红书/知乎/公众号/视频号，6 层智能降级架构（平台接口 → HTTP 抓取 → JS 渲染 → 反检测隐身 → AI 浏览器 → 手动控制），说"下载""搜一下"自动路由。

**开发者工具箱** — claude-mem 记忆配置、智谱 GLM 接入、技术文档审查、Skill 创建器，踩过的坑都帮你填了。

---

## 技能总览

### 内容创作（8 个，全流程覆盖）

```
redian → chuangzuo → weigui → cheat → fengmian / fenjing → notebooklm → luping → 发布
 选题      写稿       审核     校准      封面 / 分镜          幻灯片      录屏
```

| 技能 | 一句话 | 说 |
|------|--------|-----|
| **redian** | AI 热点三路并行（AIHOT + 9平台热榜 + 抖音筛选） | "抓热点" |
| **chuangzuo** | 统一创作引擎（录屏/热点/URL/自由 → 口播稿） | "写一篇" |
| **weigui** | 抖音违规检测（7类扫描 + 替换建议） | "检测违规" |
| **cheat** | 内容校准（6维打分 + 播放量预测 + 复盘） | "校准打分" |
| **fengmian** | Gemini 封面提示词（秋芝 2046 风格） | "生成封面" |
| **fenjing** | 分镜提示词（FLUX / SDXL / Gemini） | "拆分镜" |
| **notebooklm** | 口播稿 → 幻灯片图片（剪映直接用） | "做 PPT" |
| **luping** | 录屏自动化（CLI + 浏览器 → 1080p MP4） | "录屏" |

### 内容获取（2 个）

| 技能 | 一句话 | 说 |
|------|--------|-----|
| **xiazai** | 互联网内容获取引擎 — 30+ 平台，6 层智能降级，20+ 工具集成 | "下载""搜一下""读一下" |
| **douyinsousuo** | 抖音关键词搜索 — 按点赞排行 TOP 20 + 选题分析 | "抖音搜索 xxx" |

<details>
<summary><strong>laohan-xiazai 详细能力</strong></summary>

**不只是下载器** — 从互联网上拿内容的任何场景，都是它的地盘：

- **视频下载**：抖音 / TikTok / YouTube / B站 / 小红书 / 视频号，30+ 平台
- **搜索聚合**：全网搜索 / 垂直领域（股票/CVE/DOI/法律/学术）/ 批量并行
- **网页提取**：任意 URL 转 Markdown / 反爬绕过 / JS 渲染抓取
- **社交数据**：评论采集 / 博主数据 / 热榜 / 话题分析
- **语音转录**：云端秒级 / 本地 C++ / Python 三级降级
- **浏览器自动化**：AI 自主操作 / CDP 登录态 / 反检测隐身 / 精确控制

**6 层降级架构**（能浅不深，成本递增）：

```
Layer 1  平台封装     → opencli / agent-reach / yt-dlp / anysearch
Layer 2  轻量抓取     → Scrapling MCP（HTTP 请求，秒级）
Layer 3  JS 渲染      → Scrapling fetch（浏览器渲染）
Layer 4  反检测隐身   → Scrapling stealthy（绕 Cloudflare/WAF）
Layer 5  AI 浏览器    → browser-use（AI 理解页面，自主操作）
Layer 6  精确控制     → Playwright / web-access CDP（代码级控制）
```

**集成工具**：opencli · agent-reach · AnySearch · yt-dlp · Scrapling · browser-use · web-access · Jina Reader · ffmpeg · whisper.cpp · DrissionPage · tesseract · wx_video_download

</details>

### 开发者工具（4 个）

| 技能 | 一句话 | 说 |
|------|--------|-----|
| **shencha** | 技术文档联网审查 — 验证地址/版本/参数准确性 | "深度审查" |
| **gengxin** | 工具版本检查更新 — npm/brew/pip/GitHub/plugins | "检查更新" |
| **jiaocheng** | 教程路由器 — claude-mem/GLM/ECC/Gemini 等 | "教程" |
| **skillcreator** | 元技能 — 创建/修改/优化 Claude Code Skill | "创建 skill" |

### 独立工具：微信视频号下载

Mac + Windows 双平台安装包，装完直接用。基于 MITM 代理拦截视频流，自动注入下载按钮。

👉 [下载安装包](https://github.com/hanzhcn/laohan-skills/releases)

---

## 前置依赖

> 只需 [Claude Code](https://claude.ai/code) 或 [OpenClaw](https://github.com/openclaw/openclaw) 即可使用全部技能。以下为可选增强。

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

## License

[MIT](./LICENSE) © 2026 [寒武纪AI](https://github.com/hanzhcn)
