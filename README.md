# laohan-skills

[English](./README.en.md) | 中文

Claude Code / OpenClaw 技能包，专为 AI 内容创作者打造。下载视频、生成幻灯片、审查文档——一个命令搞定。

由 [寒武纪AI](https://github.com/hanzhcn) 出品。

## 技能列表

| 技能 | 功能 | 触发方式 |
|------|------|---------|
| **laohan-xiazai** | 视频/音频/内容下载，覆盖抖音、TikTok、YouTube、B站、小红书、知乎、微信公众号 7 大平台 | `/laohan-xiazai` 或说"下载视频" |
| **laohan-notebooklm** | 口播稿一键生成幻灯片图片（NotebookLM → PDF → PNG，剪映直接用） | `/laohan-notebooklm <script.md>` |
| **laohan-shencha** | 技术文档深度审查——联网验证仓库地址、版本号、参数值是否正确 | `/laohan-shencha` 或说"深度审查" |
| **laohan-hotdouyinai** | 抖音热榜 AI 内容筛选（6000+ 关键词匹配） | `/laohan-hotdouyinai` |
| **laohan-fengmianqiuzhi** | 口播稿生成 Gemini 封面提示词（秋芝2046风格，29种样式） | `/laohan-fengmianqiuzhi <script.md>` |
| **laohan-fenjingtishici** | 对标视频生成分镜提示词，用于扩散模型（FLUX/SDXL/Gemini）产出分镜图片 | `/laohan-fenjingtishici` |

## 安装

```bash
npx skills add hanzhcn/laohan-skills -g -y
```

安装完成后，在 Claude Code 或 OpenClaw 中直接使用。

## 前置依赖

### 所有技能通用
- [Claude Code](https://claude.ai/code) 或 [OpenClaw](https://github.com/hanzhcn/openclaw)

### laohan-xiazai（视频/内容下载）

| 工具 | 安装方式 | 用途 |
|------|---------|------|
| [opencli](https://github.com/jackwener/opencli) | `npm install -g @jackwener/opencli` | 平台数据获取（B站下载、字幕、小红书下载等） |
| [yt-dlp](https://github.com/yt-dlp/yt-dlp) | `brew install yt-dlp` | YouTube 视频下载 |
| [ffmpeg](https://ffmpeg.org/) | `brew install ffmpeg` | 音视频转码 |
| [whisper.cpp](https://github.com/ggerganov/whisper.cpp)（可选） | `brew install whisper.cpp` | 本地语音转文字 |
| 硅基流动 API Key（可选，免费） | 注册 [siliconflow.cn](https://siliconflow.cn) 获取 | 云端语音转录，比本地更快更准 |

设置硅基流动 API Key：
```bash
echo 'export SILICONFLOW_API_KEY="你的key"' >> ~/.zshrc
```

### laohan-notebooklm（幻灯片生成）
| 工具 | 安装方式 | 用途 |
|------|---------|------|
| [nlm CLI](https://pypi.org/project/notebooklm-mcp-cli/) | `pip install notebooklm-mcp-cli` | NotebookLM 命令行工具 |
| [poppler](https://poppler.freedesktop.org/) | `brew install poppler` | PDF 转图片 |

### laohan-hotdouyinai（抖音热榜筛选）
- Node.js（运行内置脚本）

## 使用示例

### 下载视频
```
你: 帮我下载这个B站视频 https://www.bilibili.com/video/BV1xxx
→ 自动触发 laohan-xiazai → opencli bilibili download BV1xxx

你: 下载这个抖音 https://v.douyin.com/xxx
→ 自动触发 laohan-xiazai → 移动端 UA 方法下载

你: 下载这个YouTube https://youtube.com/watch?v=xxx
→ 自动触发 laohan-xiazai → yt-dlp --cookies-from-browser chrome

你: 获取这个B站视频的字幕
→ opencli bilibili subtitle BV1xxx
```

### 口播稿生成幻灯片
```
你: 帮我用口播稿生成PPT
→ /laohan-notebooklm script.md
→ 创建笔记本 → 上传口播稿 → 生成幻灯片 → PDF → PNG图片
→ 输出到 ~/Desktop/标题_slides/，剪映直接导入
```

### 技术文档审查
```
你: 深度审查这个部署方案
→ /laohan-shencha
→ 提取声明 → 联网验证URL/版本/参数 → 交叉比对 → 修复错误
```

### 抖音热榜 AI 内容筛选
```
你: 看看抖音热榜有什么AI相关的内容
→ /laohan-hotdouyinai
→ 抓取热榜 → 6000+关键词匹配 → 筛选AI相关内容
```

## 平台覆盖（laohan-xiazai）

| 平台 | 视频下载 | 字幕 | 音频提取 | 语音转录 |
|------|---------|------|---------|---------|
| 抖音 | 移动端 UA + iesdouyin | — | ffmpeg | 硅基流动 / whisper |
| TikTok | tikwm API | — | ffmpeg | 硅基流动 / whisper |
| YouTube | yt-dlp（需 Chrome cookies） | opencli youtube transcript | yt-dlp -x | 硅基流动 / whisper |
| B站 | opencli bilibili download | opencli bilibili subtitle | ffmpeg | 硅基流动 / whisper |
| 小红书 | opencli xiaohongshu download | — | — | — |
| 知乎 | opencli zhihu | — | — | — |
| 公众号 | fetch.py --stealth | — | — | — |

## 降级策略

每个平台都有降级链，首选方法失败会自动尝试备选：

| 平台 | 首选 | 备选 | 兜底 |
|------|------|------|------|
| 抖音 | 移动端 UA | opencli douyin | Scrapling stealthy |
| TikTok | tikwm API | yt-dlp | opencli tiktok |
| YouTube | yt-dlp + cookies | opencli youtube transcript | — |
| B站 | opencli bilibili download | Jina Reader | — |
| 小红书 | opencli xiaohongshu download | agent-reach | Jina Reader |
| 知乎 | opencli zhihu | Jina Reader | — |
| 公众号 | fetch.py --stealth | agent-reach | Jina Reader |

## 开源协议

MIT

## 作者

**寒武纪AI** — AI 内容创作者，分享工具，造福社区。

- GitHub: [@hanzhcn](https://github.com/hanzhcn)
- 抖音: 寒武纪AI

如果觉得有用，欢迎 Star ⭐ 和关注！
