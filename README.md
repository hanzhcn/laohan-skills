<div align="center">

<img src="assets/logo.svg" alt="laohan-skills" width="96" height="96">

# laohan-skills

[![GitHub stars](https://img.shields.io/github/stars/hanzhcn/laohan-skills?style=social)](https://github.com/hanzhcn/laohan-skills/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Skills](https://img.shields.io/badge/Skills-24-blue.svg)](https://github.com/hanzhcn/laohan-skills)
[![Platform](https://img.shields.io/badge/Platform-Claude%20Code%20%7C%20Codex%20%7C%20OpenClaw-green.svg)](https://agentskills.io/)

**Agent Skills Pack** — Content creation pipeline + 30+ platform acquisition + dev tools
**Agent 超级技能包** — 内容创作全流程 + 30 平台内容获取 + 开发者工具，一句话搞定

</div>

**[English](./README.en.md)** | 中文

由 [老韩AI](https://github.com/hanzhcn) 出品 · 抖音搜索「**老韩AI**」看实战教程 · 支持 [Claude Code](https://docs.anthropic.com/en/docs/claude-code)、[Codex](https://developers.openai.com/codex/) / [OpenClaw](https://github.com/openclaw/openclaw)

---

## Quick Start

> **不必全装**——挑你要的技能单独装，避免装一堆用不上的。完整单装命令见「[按需安装](#按需安装)」。

```bash
# 一键全装（21 个技能，需要 Claude Code、Codex 或 OpenClaw）
npx skills add hanzhcn/laohan-skills --agent claude-code -g -y   # Codex/OpenClaw 用户把 claude-code 换成对应 agent 名

# 单装一个（推荐：按需挑）
npx skills add hanzhcn/laohan-skills --skill laohan-xiazai

# 多选几个
npx skills add hanzhcn/laohan-skills --skill laohan-xiazai --skill laohan-chuangzuo

# Codex 专用初始化 skill（只安装到 Codex）
npx skills add hanzhcn/laohan-skills --agent claude-code -g -y   # Codex/OpenClaw 用户把 claude-code 换成对应 agent 名 --agent codex --skill laohan-chushicodex
```

---

## 按需安装

不必全装。挑你要的，复制对应命令（前提：已装 [Claude Code](https://docs.anthropic.com/en/docs/claude-code)、[Codex](https://developers.openai.com/codex/) 或 OpenClaw）：

**内容创作（10 个）**
```bash
npx skills add hanzhcn/laohan-skills --skill laohan-xuanti           # 🔥 AI 热点三路并行抓取
npx skills add hanzhcn/laohan-skills --skill laohan-chuangzuo        # ✍️ 统一创作引擎（6 输入→口播稿）
npx skills add hanzhcn/laohan-skills --skill laohan-weigui           # 🛡️ 抖音文案违规检测
npx skills add hanzhcn/laohan-skills --skill laohan-jiaozhun            # 📊 内容校准打分+预测
npx skills add hanzhcn/laohan-skills --skill laohan-chushihua  # 🚀 项目初始化(新建+接入)
npx skills add hanzhcn/laohan-skills --skill laohan-fengmianqiuzhi   # 🎨 封面提示词
npx skills add hanzhcn/laohan-skills --skill laohan-fengmianzhuzige  # 🖼️ 柱子哥封面体系(三层合成,默认套)
npx skills add hanzhcn/laohan-skills --skill laohan-fenjingtishici   # 🎬 分镜提示词
npx skills add hanzhcn/laohan-skills --skill laohan-notebooklm       # 📑 幻灯片图片
npx skills add hanzhcn/laohan-skills --skill laohan-luping           # 🎥 录屏自动化
npx skills add hanzhcn/laohan-skills --skill laohan-daoyan          # 🎬 V5.1导演初稿+终审（同一director-state）
npx skills add hanzhcn/laohan-skills --skill laohan-donghua          # 🎞️ B-roll overlay 成片
```

**内容获取（2 个）**
```bash
npx skills add hanzhcn/laohan-skills --skill laohan-xiazai           # 📥 30+平台下载/抓取/搜索
npx skills add hanzhcn/laohan-skills --skill laohan-douyinsousuo     # 🔍 抖音关键词搜索
```

**开发者与工作流工具（8 个 · 自用/进阶，内容创作者可跳过）**
```bash
npx skills add hanzhcn/laohan-skills --skill laohan-shencha          # 🔎 技术文档联网审查
npx skills add hanzhcn/laohan-skills --skill laohan-gengxin          # 🔄 工具版本检查
npx skills add hanzhcn/laohan-skills --skill laohan-jiaocheng        # 📖 配置教程路由
npx skills add hanzhcn/laohan-skills --skill laohan-skillcreator     # 🛠️ 创建/修改 skill
npx skills add hanzhcn/laohan-skills --skill laohan-chushicodex      # ⚙️ Codex 轻量初始化
npx skills add hanzhcn/laohan-skills --skill laohan-bianpai          # 🧭 视频工作流状态路由
npx skills add hanzhcn/laohan-skills --skill laohan-sucai            # 📦 B-roll 素材供应
npx skills add hanzhcn/laohan-skills --skill laohan-yunying          # 📈 发布后运营与复盘
```

**多平台改写（1 个）**
```bash
npx skills add hanzhcn/laohan-skills --skill laohan-duopingtai              # 🔄 抖音/小红书/公众号改写
```

> 一键全装：`npx skills add hanzhcn/laohan-skills --agent claude-code -g -y   # Codex/OpenClaw 用户把 claude-code 换成对应 agent 名`

---

## 内容创作（10 个）

> 从选题到成片，8 步全流程覆盖。每一步都有对应技能，说一句就能触发。

```
redian → chuangzuo → weigui → cheat → fengmian / fenjing → notebooklm → luping / donghua
 选题      写稿       审核     校准      封面 / 分镜          幻灯片      录屏 / B-roll成片
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

<table>
<tr><td>

### 🎞️ donghua（B-roll 成片）

> *"口播稿写好了，真人视频也拍了，怎么合成一个有质感的成片？"*

口播稿 + 真人视频 → 带 B-roll overlay 的最终成片。基于 Hyperframes，一个 index.html + 一次 render 出片，10 种技法库（grain / vignette / stagger / 3D / cinematic-zoom / glitch / glow / shimmer 等）。

```
你: 做 B-roll / 给视频加特效 / 生成动画片段
```

</td></tr>
</table>

| 技能 | 一句话 | 说 |
|------|--------|-----|
| 🎨 **fengmian** | 默认只走秋芝方向，从45套词典选3个不同模板族，按推荐顺序生成3张带准确中文的9:16完整封面 | "生成封面" |
| 🎬 **fenjing** | 分镜提示词（FLUX / SDXL / Gemini，质量校验后拆分） | "拆分镜" |
| 📑 **notebooklm** | 口播稿 → 幻灯片图片（NotebookLM，剪映直接用） | "做 PPT" |
| 🎥 **luping** | 录屏自动化（ffmpeg 物理屏 + Playwright 浏览器 → 1080p MP4） | "录屏" |
| 🔄 **laohan-duopingtai** | 多平台改写（口播稿 → 抖音 / 小红书 / 公众号三版本） | "多平台改写" |

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

集成工具：opencli · agent-reach · AnySearch · yt-dlp · Scrapling · browser-use · Jina Reader · ffmpeg · whisper.cpp · tesseract · wx_video_download

```
你: 下载这个视频 / 搜一下 xxx / 读一下这个链接 / 帮我转文字
```

</td></tr>
</table>

<table>
<tr><td>

### 🔍 douyinsousuo（抖音搜索）

> *"搜索能力已有成熟入口，就不再维护第二套浏览器。"*

编排已安装的 OpenCLI 完成登录态预检、关键词搜索和选题分析；失败只在 OpenCLI adapter、trace/autofix 与 Browser Bridge 内降级，不增加独立浏览器运行时。

```
你: 抖音搜索 Claude Code / 帮我搜一下抖音上关于 xxx 的视频
```

</td></tr>
</table>

---

## 开发者与工作流工具（10 个 · 自用/进阶）

> ⚠️ 以下为开发者维护、配置、审查用，**内容创作者可跳过此板块**。
> 每个 skill 都有**自然语言触发词**——对 AI 助手说出来就会自动启用，不需要记命令。

### 🔍 联网查证（强烈推荐所有开发者安装）

| 技能 | 作用 | 你说 | 注意事项 |
|------|------|------|---------|
| 🌐 **sousuo** | 技术断言先查证再下结论——API 用法/版本行为/配置语义/报错归因，三路检索（官方文档/GitHub issue/社区心得），结论带来源链接 | "上网搜""查证""先查再说""别人怎么解决" | 防止 AI 凭训练记忆瞎编 API 行为；结论带 `(verified: URL)` 标注，查不到会明说"未查到，以下是推断" |
| 🔎 **shencha** | 技术文档联网审查——验证地址/版本/参数准确性；默认只读，明确授权才修复 | "深度审查""核验事实" | 普通审查只查可验证事实，不会删你的模板和表达 |

### 🛠️ 开发工具

| 技能 | 作用 | 你说 | 注意事项 |
|------|------|------|---------|
| 🛠️ **skillcreator** | 元技能——创建/修改/优化/审计 Agent Skill 的标准流程 | "创建 skill""改 skill""skill 体检" | 修改已长期使用的 skill 时，原有模板/方法默认视为有效基线，只增不删（防把实战验证过的内容优化掉） |
| 🔄 **gengxin** | 工具版本检查更新——npm/brew/pip/GitHub/plugins | "检查更新" | — |
| 📖 **jiaocheng** | 教程路由器——按关键词加载对应教程（claude-mem/GLM/ECC/Gemini 等） | "教程""怎么配置" | — |
| ⚙️ **chushicodex** | 新装或待整顿 Codex 的安全最小配置与验证闭环 | "初始化 Codex" | 只读审计优先，不自动升级/装依赖 |

### 🎬 视频创作工作流（配套内容创作板块）

| 技能 | 作用 | 你说 | 注意事项 |
|------|------|------|---------|
| 🧭 **bianpai** | 视频 workflow 的状态路由与机械 gate——按落盘产物判断下一步 | "恢复 episode""判断下一步""编排路由" | 只路由不执行——不会自动调其他 skill 或发布 |
| 📦 **sucai** | 按 source manifest 搜索下载+视觉核验 B-roll 素材 | "配素材""找 B-roll" | 第一目标是观感和节奏，不是给每句话取证 |
| 📈 **yunying** | ⑫发布登记+⑬数据+⑭评论+复盘交接 | "运营""数据""评论""复盘" | — |

### 🏛️ 治理体系技能（11 个 · 不在本仓，自用）

> 以下 skill 属于私有治理仓（`~/.agents`），**不在本公开仓的安装范围**，此处列出仅供了解完整体系：

| 技能 | 作用 | 你说 | 什么时候用 |
|------|------|------|-----------|
| 📚 **devrules** | 会话开工前加载开发规则体系+复述验证 | "学习规则""接上规则" | 新窗口/新模型接手重要任务时 |
| 🏗️ **chushihua** | 新项目一键初始化（文档骨架+git 门禁+审查台账） | "初始化""开新项目""装门禁" | 每开一个新项目 |
| 🔌 **harness** | 新 AI 客户端接进规则体系（五步接线+六家判例） | "新 harness""接入新 harness" | 每换一个新 AI 工具（一次性） |
| ✅ **review** | 两级审查：自审四法→跨模型对抗→逐条裁决 | "审查""审一下""对抗审查" | 每次改完代码 |
| 🔍 **paicha** | 异常排查取证——判红归属→只读归因→修复留证 | "排查""为什么红""为什么失败" | 东西坏了时（需带现象描述） |
| ⚖️ **caijue** | 别的 AI 给的修改建议，先逐条验真假再修 | 粘贴建议+"裁决""按这个修" | 接手别窗口的审查结论时（需先粘贴材料） |
| 🤝 **jiaojie** | 窗口接力——交接写状态包/接手读+核验 | "交接"（写）/"接手"（读） | 多窗口并行换手时 |
| 🚀 **fabu** | 跨项目发布手册——多面依序/四同步/门禁核对 | "发布""直接发布""发预发" | 要上线时 |
| 🧹 **shouwei** | 关窗前收尾审计——worktree/未 push/部署一致性/裸条文收账 | "收尾""检查收尾" | 每次关窗口前 |
| 📋 **doccheck** | 文档六项机械体检（指针/条数/超长/孤儿/断链） | "文档体检""检查文档" | 文档多起来后定期 |
| 🎫 **edu-guard** | GLM 额度守卫——定时查额度自动用重置卡 | "开守卫""还剩几张卡" | 额度管理（与"收尾"无关，纯撞名已改名） |

**治理体系一句话总结**：学习规则(devrules)→初始化(chushihua)→接线(harness)→审查(review)→排查(paicha)→裁决(caijue)→交接(jiaojie)→发布(fabu)→收尾(shouwei)→文档(doccheck)——开发全流程每一步都有手册。

---

## 独立工具：微信视频号下载

Mac + Windows 双平台安装包，装完直接用。基于 MITM 代理拦截视频流，自动注入下载按钮。

👉 [下载安装包](https://github.com/hanzhcn/laohan-skills/releases)

---

## 前置依赖

> 只需 [Claude Code](https://docs.anthropic.com/en/docs/claude-code)、[Codex](https://developers.openai.com/codex/) 或 [OpenClaw](https://github.com/openclaw/openclaw) 即可使用全部技能。以下为可选增强。

| 工具 | 安装 | 增强哪些技能 |
|------|------|-------------|
| [opencli](https://github.com/jackwener/opencli) | `npm i -g @jackwener/opencli` | xiazai（B站/小红书下载、热榜、搜索）、douyinsousuo（抖音搜索） |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | `brew install yt-dlp` | xiazai（YouTube 下载） |
| [ffmpeg](https://ffmpeg.org/) | `brew install ffmpeg` | xiazai（音视频转码）、chuangzuo（音频提取）、luping（录屏） |
| [Playwright](https://playwright.dev/) | `npm i -g playwright && npx playwright install chromium` | xiazai（浏览器抓取）、luping（浏览器录屏） |
| [tmux](https://github.com/tmux/tmux) | `brew install tmux` | luping（终端录屏） |
| 硅基流动 API Key | 注册 [siliconflow.cn](https://siliconflow.cn)（免费） | xiazai（云端语音转录）、chuangzuo（语音转文字） |
| [nlm CLI](https://pypi.org/project/notebooklm-mcp-cli/) + [poppler](https://poppler.freedesktop.org/) | `pip install notebooklm-mcp-cli` + `brew install poppler` | notebooklm（幻灯片生成） |
| [whisper.cpp](https://github.com/ggml-org/whisper.cpp) | `brew install whisper-cpp` | xiazai / chuangzuo（本地语音转录） |

无额外依赖的技能：redian · weigui · cheat · shencha · gengxin · jiaocheng · skillcreator · laohan-chushicodex · fengmian · fenjing；douyinsousuo 复用已安装的 opencli，不再自带 Python/浏览器依赖。

---

## 教程

| 教程 | 说明 |
|------|------|
| [claude-mem + LiteLLM：国产大模型驱动跨会话记忆](./docs/claude-mem-litellm.md) | 智谱 GLM / DeepSeek 替代 OpenRouter |
| [CLAUDE.md 配置四原则](./docs/claude-md-guide.md) | 想清楚再动手 / 能50行别200行 / 只改该改的 / 目标驱动 |
| [Chrome Gemini 侧边栏修复](./docs/gemini-sidebar-fix.md) | Mac + Windows 双平台脚本 |
| [Claude Code + 智谱 GLM 接入](./docs/claude-code-glm.md) | 环境变量、thinking、超时、模型切换 |
| [ECC 插件安装维护指南](./docs/ecc-plugin-guide.md) | rules 分发、hooks 机制、升级清单 |
| `laohan-chushicodex` | 新装或待整顿 Codex 的安全最小配置、分层 `AGENTS.md`、项目验证与证据闭环 |

---

## 关于

我是老韩AI，一个用 AI 工具做内容创作的普通人。不是专业程序员，但相信好工具应该人人用得起。

这些 skill 都是我自己每天在用的——从选题、写稿、审核到发布，全靠 Claude Code + 这套技能包跑通。踩过的坑、调过的参数、摸过的套路，全都塞进去了。

觉得有用的话，给个 ⭐，抖音搜索「**老韩AI**」看我是怎么用这些工具的。

---

<div align="center">

[MIT License](./LICENSE) · 自由使用 / 修改 / 再分发

Made by [老韩AI](https://github.com/hanzhcn)

</div>
