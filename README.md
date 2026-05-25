# laohan-skills

[![GitHub stars](https://img.shields.io/github/stars/hanzhcn/laohan-skills?style=social)](https://github.com/hanzhcn/laohan-skills/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> Claude Code 超级技能包 —— 让你的 AI 编程助手拥有内容创作、多平台下载、技术审查、质量校准、自动化录屏的能力。一个命令，从选题到发布全搞定。

[English](./README.en.md) | 中文

由 [寒武纪AI](https://github.com/hanzhcn) 出品 · 抖音搜索「**寒武纪AI**」看实战教程 · 基于 [Claude Code](https://claude.ai/code) / [OpenClaw](https://github.com/openclaw/openclaw)

---

## 一句话亮点

- **30+ 平台一键下载**：抖音、B站、YouTube、TikTok、小红书、知乎、公众号、视频号……说"下载"就行
- **抖音关键词搜索**：搜竞品、看排行、分析选题，说"抖音搜索 xxx"直接出结果 + 选题分析报告
- **内容创作全流程**：选题 → 写稿 → 违规检测 → 质量校准 → 封面分镜 → 幻灯片 → 录屏，8 步全自动化
- **Claude Code 必学配置**：claude-mem 跨会话记忆、智谱 GLM 接入、ECC 插件维护、Gemini 侧边栏修复……踩过的坑都帮你填了
- **微信视频号下载**：独立安装包，[Mac + Windows 双平台](https://github.com/hanzhcn/laohan-skills/releases)，装完直接用
- **持续进化**：AI 热点监控、技术文档审查、Skill 创建器、工具更新检查……更多能力持续加入

---

## 内容创作全流程

| 阶段 | 选题 → | 写稿 → | 审核 → | 校准 → | 封面/分镜 → | 图片素材 → | 录屏素材 → | 发布 |
|------|--------|--------|--------|--------|------------|-----------|-----------|------|
| 技能 | redian | chuangzuo | weigui | cheat | fengmian / fenjing | notebooklm | luping | — |

## 技能列表

### 内容创作

从选题到成片，每个环节都有对应技能。

| 技能 | 阶段 | 功能 | 触发方式 |
|------|------|------|----------|
| **laohan-redian** | 选题 | AI 热点三路并行抓取（[AIHOT](https://aihot.virxact.com/agent) 精选 + opencli 9 平台热榜 + 抖音 AI 筛选），合并去重，输出热点简报 | `/laohan-redian` 或说"抓热点""找选题" |
| **laohan-chuangzuo** | 写稿 | 统一创作引擎——录屏转口播 / 热点转译 / URL 改写 / 自由主题，统一方法论 | `/laohan-chuangzuo` 或说"写一篇""帮我写""不知道拍什么""根据链接改写" |
| **laohan-weigui** | 审核 | 抖音文案违规检测——7 类扫描（引流/极限词/医疗/金融/低质/敏感/平台限制），结构化报告 + 替换建议 | `/laohan-weigui` 或说"检测违规""会不会被限流""发之前帮我看看" |
| **laohan-cheat** | 校准 | 内容校准——6 维打分 + 播放量预测 + 发布后复盘 + rubric 进化，数据驱动提升内容质量 | `/laohan-cheat` 或说"校准""打分" |
| **laohan-fengmianqiuzhi** | 封面 | 口播稿生成 Gemini 封面提示词（秋芝 2046 风格，3 种差异化 x 3 比例） | `/laohan-fengmianqiuzhi` 或说"生成封面""封面提示词" |
| **laohan-fenjingtishici** | 分镜 | 生成专业分镜提示词，适配 FLUX / SDXL / Gemini 扩散模型 | `/laohan-fenjingtishici` 或说"生成分镜""拆分镜" |
| **laohan-notebooklm** | 素材 | 口播稿一键生成幻灯片图片（NotebookLM → PDF → PNG，剪映直接用） | `/laohan-notebooklm` 或说"生成PPT""做幻灯片" |
| **laohan-luping** | 录屏 | 录屏自动化——口播稿转录屏脚本（CLI + 浏览器），ffmpeg + tmux + Playwright，输出 1080p MP4 | `/laohan-luping` 或说"录屏""录制教程""补录" |

### 内容获取

| 技能 | 功能 | 触发方式 |
|------|------|----------|
| **laohan-xiazai** | 从互联网拿内容一站式——视频下载、音频提取+转文字、字幕下载、评论采集、博主数据、网页抓取、搜索聚合，覆盖 30+ 平台（抖音/TikTok/YouTube/B站/小红书/知乎/公众号/视频号/微博/Reddit/HackerNews 等），自动降级 | `/laohan-xiazai` 或说"下载""读一下""搜一下" |
| **laohan-douyinsousuo** | 抖音关键词搜索——DrissionPage 监听 API 数据包 + 滚动采集，按点赞排行输出 TOP 20，自动附选题分析（内容类型分布、热门选题规律、差异化机会）。支持自定义采集量（`--min`）和滚动次数（`--scroll`），结果保存 JSON。需 Chrome + 首次扫码登录 | `/laohan-douyinsousuo` 或说"抖音搜索""搜一下抖音""抖音上搜""抖音关于""抖音上有什么""抖音里xxx排行" |

### 开发者工具

| 技能 | 功能 | 触发方式 |
|------|------|----------|
| **laohan-shencha** | 技术文档深度联网审查——验证仓库地址、版本号、参数值、硬件需求的准确性 | `/laohan-shencha` 或说"深度审查" |
| **laohan-gengxin** | 工具版本检查与更新——扫描 npm / brew / pip / uv / GitHub / plugins / skills | `/laohan-gengxin` 或说"检查更新" |
| **laohan-jiaocheng** | 教程路由器——按关键词加载配置教程（claude-mem / GLM / ECC / Gemini 侧边栏等） | `/laohan-jiaocheng <关键词>` 或说"教程""怎么配置" |
| **laohan-skillcreator** | 元技能——创建/修改/优化 Claude Code Skill，融合 Anthropic 官方 + Matt Pocock + 9arm 最佳实践 | `/laohan-skillcreator` 或说"创建skill""改skill""优化skill" |

## 独立工具

### 微信视频号下载

一键下载微信视频号视频。基于 MITM 代理拦截视频流，自动注入下载按钮。

| 平台 | 文件 | 说明 |
|------|------|------|
| Mac | `weixin-video-download-mac.dmg` | 双击安装，拖拽到 Applications |
| Windows | `weixin-video-download-windows.exe` | 双击安装向导，自动创建桌面快捷方式 |

**使用**：安装 → 打开 → 启动微信 PC 端 → 视频号点视频 → 出现下载按钮

👉 [下载安装包](https://github.com/hanzhcn/laohan-skills/releases)

## 教程

> 实战教程，每一步可复现。

| 教程 | 说明 |
|------|------|
| [claude-mem + LiteLLM：用国产大模型驱动 Claude Code 跨会话记忆](./docs/claude-mem-litellm.md) | 用 LiteLLM 代理让 claude-mem 支持智谱 GLM / DeepSeek 等国产模型，替代 OpenRouter |
| [CLAUDE.md 配置指南：让 AI 编程助手少犯错的四个原则](./docs/claude-md-guide.md) | 想清楚再动手 / 能 50 行别 200 行 / 只改该改的 / 目标驱动执行，含正反代码示例 |
| [Chrome Gemini 侧边栏强制开启指南（国内修复版）](./docs/gemini-sidebar-fix.md) | Mac + Windows 双平台脚本，修复 Chrome Gemini 侧边栏地区限制 |
| [Claude Code + 智谱 GLM：国内大模型驱动 AI 编程助手](./docs/claude-code-glm.md) | 环境变量、thinking 模式、超时配置、模型切换、常见问题 |
| [ECC 插件安装维护完全指南](./docs/ecc-plugin-guide.md) | rules 分发、hooks 三种加载机制、升级 6 步清单、4 个常见坑 |

## 安装

```bash
npx skills add hanzhcn/laohan-skills -g -y
```

安装完成后，在 Claude Code 或 OpenClaw 中直接使用。

## 前置依赖

### 所有技能通用
- [Claude Code](https://claude.ai/code) 或 [OpenClaw](https://github.com/openclaw/openclaw)

### laohan-xiazai（从互联网拿内容）

| 工具 | 安装方式 | 用途 |
|------|----------|------|
| [opencli](https://github.com/jackwener/opencli) | `npm install -g @jackwener/opencli` | 平台数据获取（B站下载、字幕、小红书下载等） |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | `brew install yt-dlp` | YouTube 视频下载 |
| [ffmpeg](https://ffmpeg.org/) | `brew install ffmpeg` | 音视频转码 |
| 硅基流动 API Key（可选） | 注册 [siliconflow.cn](https://siliconflow.cn) | 云端语音转录（免费） |

### laohan-luping（录屏自动化）
- [ffmpeg](https://ffmpeg.org/)：录屏 + 音视频处理 — `brew install ffmpeg`
- [tmux](https://github.com/tmux/tmux)：终端复用（CLI 操作录制）— `brew install tmux`
- [Playwright](https://playwright.dev/)：浏览器操作录制 — `npm install -g playwright && npx playwright install chromium`

### laohan-notebooklm（幻灯片生成）
- [nlm CLI](https://pypi.org/project/notebooklm-mcp-cli/)：`pip install notebooklm-mcp-cli`
- [poppler](https://poppler.freedesktop.org/)：`brew install poppler`
- Google 账号（NotebookLM 有地区限制，部分地区需网络切换）

### laohan-chuangzuo（统一创作引擎）
- [ffmpeg](https://ffmpeg.org/)：音频提取（录屏模式需要）— `brew install ffmpeg`
- 硅基流动 API Key（可选）：语音转文字 — 注册 [siliconflow.cn](https://siliconflow.cn)
- [whisper.cpp](https://github.com/ggml-org/whisper.cpp)（可选）：本地语音转文字 — `brew install whisper.cpp`
- laohan-notebooklm 的全部依赖（幻灯片模式需要）

### 其他技能
- **laohan-cheat / laohan-shencha / laohan-jiaocheng / laohan-skillcreator**：无额外依赖
- **laohan-douyinsousuo**：[Chrome 浏览器](https://www.google.com/chrome/) + [DrissionPage](https://github.com/g1879/DrissionPage)（`pip install DrissionPage`）
- **laohan-weigui**：无额外依赖（违规词库已内置在 `references/keywords.md`）
- **laohan-fengmianqiuzhi / laohan-fenjingtishici**：无额外依赖，纯文本输出

## 使用示例

### 内容创作全流程
```
你: 抓热点                          → redian 三路并行输出热点
你: 帮我写一篇关于 Claude Code 的口播稿  → chuangzuo 统一创作引擎
你: 检查下有没有违规词                 → weigui 7类扫描
你: 帮我校准打分                      → cheat 6维打分+预测
你: 生成封面                         → fengmianqiuzhi Gemini提示词
你: 做PPT                           → notebooklm 幻灯片
你: 录屏                            → luping 自动化录制脚本
```

### 从互联网拿内容
```
你: 帮我下载这个B站视频 https://www.bilibili.com/video/BV1xxx
你: 读一下这个公众号文章
你: 搜一下小红书上关于 Claude Code 的讨论
→ 自动触发 laohan-xiazai，按平台自动选择最优方法
```

### 抖音搜索
```
你: 抖音搜索 Claude Code 教程
你: 搜一下抖音上关于 Cursor 的视频
你: 抖音里 AI 编程工具排行怎么样
→ 自动触发 laohan-douyinsousuo，采集+排行+选题分析
```

## License

[MIT](./LICENSE) © 2026 [寒武纪AI](https://github.com/hanzhcn)
