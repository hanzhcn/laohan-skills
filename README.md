# laohan-skills

[![GitHub stars](https://img.shields.io/github/stars/hanzhcn/laohan-skills?style=social)](https://github.com/hanzhcn/laohan-skills/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> AI 内容创作者和开发者的 Claude Code 工具箱 —— 13 个技能 + 微信视频号下载工具。内容创作全流程 + Claude Code 必学配置 + 开发者效率工具，一个命令搞定。

[English](./README.en.md) | 中文

由 [寒武纪AI](https://github.com/hanzhcn) 出品。抖音搜索「**寒武纪AI**」关注更多 AI 工具实战教程。

基于 [Claude Code](https://claude.ai/code) / [OpenClaw](https://github.com/openclaw/openclaw)。

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
| **laohan-xiazai** | 从互联网获取内容一站式——下载视频/音频/字幕、抓取网页/评论/搜索结果、阅读公众号/知乎/小红书，覆盖 7+ 平台自动降级 | `/laohan-xiazai` 或说"下载""读一下""搜一下" |

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

## License

[MIT](./LICENSE) © 2026 [寒武纪AI](https://github.com/hanzhcn)
