# laohan-skills

[![GitHub stars](https://img.shields.io/github/stars/hanzhcn/laohan-skills?style=social)](https://github.com/hanzhcn/laohan-skills/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

> AI 内容创作者的瑞士军刀 —— 从互联网拿内容、生成幻灯片、审查文档、筛选热点、录屏转口播、校准内容质量，一个命令搞定。

[English](./README.en.md) | 中文

由 [寒武纪AI](https://github.com/hanzhcn) 出品，基于 [Claude Code](https://claude.ai/code) / [OpenClaw](https://github.com/openclaw/openclaw)。

## 技能列表

### 内容获取

| 技能 | 功能 | 触发方式 |
|------|------|----------|
| **laohan-xiazai** | 从互联网获取内容一站式——下载视频/音频/字幕、抓取网页/评论/搜索结果、阅读公众号/知乎/小红书，覆盖 7+ 平台自动降级 | `/laohan-xiazai` 或说"下载""读一下""搜一下" |
| **laohan-redian** | AI 热点统一抓取——三路并行（[AIHOT](https://aihot.virxact.com/agent) 精选 + opencli 9 平台热榜 + 抖音 AI 筛选），合并去重，输出完整热点简报 | `/laohan-redian` 或说"抓热点""今日AI精选""找选题" |

### 内容创作

| 技能 | 功能 | 触发方式 |
|------|------|----------|
| **laohan-chuangzuo** | 统一创作引擎——录屏转口播/热点转译/URL改写/自由主题，全部走同一套写作方法论 | `/laohan-chuangzuo` 或说"录屏转口播""找选题""写一篇""根据链接改写""帮我写""不知道拍什么""改写文档" |
| **laohan-notebooklm** | 口播稿一键生成幻灯片图片（NotebookLM → PDF → PNG，剪映直接用） | `/laohan-notebooklm` 或说"生成PPT""做幻灯片""PPT图片" |
| **laohan-fengmianqiuzhi** | 口播稿生成 Gemini 封面提示词（秋芝2046风格，3种差异化×3比例） | `/laohan-fengmianqiuzhi` 或说"生成封面""做封面""封面提示词" |
| **laohan-fenjingtishici** | 生成专业分镜提示词，适配 FLUX/SDXL/Gemini 扩散模型 | `/laohan-fenjingtishici` 或说"生成分镜""校验分镜""拆分镜" |

### 质量与工具

| 技能 | 功能 | 触发方式 |
|------|------|----------|
| **laohan-cheat** | 内容校准统一入口——打分、预测、复盘、趋势分析，自动路由到对应子流程 | `/laohan-cheat` 或说"校准""打分" |
| **laohan-shencha** | 技术文档深度联网审查——验证仓库地址、版本号、参数值、硬件需求的准确性 | `/laohan-shencha` 或说"深度审查" |
| **laohan-gengxin** | 工具版本检查与更新——扫描 npm/brew/pip/uv/GitHub/plugins/skills，生成更新报告 | `/laohan-gengxin` 或说"检查更新" |
| **laohan-jiaocheng** | 教程路由器——按关键词加载配置教程并引导安装（claude-mem / GLM / ECC / Gemini 侧边栏等） | `/laohan-jiaocheng <关键词>` 或说"教程""怎么配置" |

## 教程

> 实战教程，每一步可复现。

| 教程 | 说明 |
|------|------|
| [claude-mem + LiteLLM：用国产大模型驱动 Claude Code 跨会话记忆](./docs/claude-mem-litellm.md) | 用 LiteLLM 代理让 claude-mem 支持智谱 GLM / DeepSeek 等国产模型，替代 OpenRouter。含完整安装、patch、配置、验证步骤 |
| [CLAUDE.md 配置指南：让 AI 编程助手少犯错的四个原则](./docs/claude-md-guide.md) | 来自 [andrej-karpathy-skills](https://github.com/multica-ai/andrej-karpathy-skills) 的四个核心原则（想清楚再动手/能50行别200行/只改该改的/目标驱动执行），含正反代码示例 |
| [Chrome Gemini 侧边栏强制开启指南（国内修复版）](./docs/gemini-sidebar-fix.md) | Mac + Windows 双平台脚本，修复 Chrome Gemini 侧边栏在国内因地区限制丢失的问题。每次 Chrome 更新后可重复运行 |
| [Claude Code + 智谱 GLM：国内大模型驱动 AI 编程助手](./docs/claude-code-glm.md) | 完整配置 Claude Code 使用智谱 GLM 作为后端：环境变量、thinking 模式、功能声明、超时配置、模型切换、常见问题 |
| [ECC 插件安装维护完全指南](./docs/ecc-plugin-guide.md) | everything-claude-code 插件的安装、rules 分发、hooks 三种加载机制、升级 6 步清单、4 个常见坑及解决方案 |

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

### laohan-notebooklm（幻灯片生成）
- [nlm CLI](https://pypi.org/project/notebooklm-mcp-cli/)：`pip install notebooklm-mcp-cli`
- [poppler](https://poppler.freedesktop.org/)：`brew install poppler`
- Google 账号（NotebookLM 有地区限制，部分地区需网络切换）

### laohan-chuangzuo（统一创作引擎）
- [ffmpeg](https://ffmpeg.org/)：音频提取（录屏模式需要）— `brew install ffmpeg`
- 硅基流动 API Key（可选）：语音转文字 — 注册 [siliconflow.cn](https://siliconflow.cn)
- [whisper.cpp](https://github.com/ggml-org/whisper.cpp)（可选）：本地语音转文字 — `brew install whisper.cpp`
- laohan-notebooklm 的全部依赖（幻灯片模式需要）

### laohan-cheat（内容校准）
- 无额外依赖（rubric 和状态模板已内置在 `references/` 目录中）
- 可选：[Gemini](https://gemini.google.com) 账号（封面图生成需要）

### laohan-jiaocheng（教程路由器）
- 无额外依赖

### laohan-shencha（深度审查）
- 无额外依赖（使用 Claude Code 内置的 web search + gh CLI）

### laohan-fengmianqiuzhi / laohan-fenjingtishici（提示词生成）
- 无额外依赖，纯文本输出

## 使用示例

### 从互联网拿内容
```
你: 帮我下载这个B站视频 https://www.bilibili.com/video/BV1xxx
你: 读一下这个公众号文章
你: 搜一下小红书上关于 Claude Code 的讨论
→ 自动触发 laohan-xiazai，按平台自动选择最优方法
```

### 抓取AI热点
```
你: 抓热点
你: 今天的AI精选
→ 自动触发 laohan-redian，三路并行输出热点简报
```

### 统一创作（录屏/热点/URL/自由主题）
```
你: 把这个录屏视频转成口播稿 /path/to/recording.mp4
你: 找选题 / 写一篇 / 不知道拍什么
你: 根据链接改写 / 改写文档
你: 帮我写个关于 Claude Code 配置的口播稿
→ 自动触发 laohan-chuangzuo，按输入类型选择对应模式
```

### 内容校准
```
你: 帮我校准这篇口播稿
→ 自动触发 laohan-cheat，打分+预测+改进建议
```

### 口播稿生成幻灯片
```
你: 帮我用口播稿生成PPT
→ 自动触发 laohan-notebooklm
```

### 生成封面提示词
```
你: 给这个口播稿生成封面
→ 自动触发 laohan-fengmianqiuzhi
```

### 检查工具更新
```
你: 看看哪些工具该更新了
→ /laohan-gengxin
```

## License

[MIT](./LICENSE) © 2026 寒武纪AI
