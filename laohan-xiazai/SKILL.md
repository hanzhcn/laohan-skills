---
name: laohan-xiazai
description: 视频/音频/内容下载一站式 skill。覆盖抖音、TikTok、YouTube、B站、小红书、知乎、微信公众号等主流平台。支持视频下载、音频提取、字幕获取、博主数据查询、语音转文字。确保在以下场景触发：用户说"下载视频""下载抖音""下载TT""下载YouTube""下载B站""抓视频""保存视频"，用户说"查博主""看封面""获取字幕""提取音频""转录"，用户给出视频/社交平台链接要求获取内容，用户说"这个视频帮我下一下""帮我看看这个博主"，任何涉及视频平台或社交平台内容获取的操作。触发词：/laohan-xiazai
---

# 视频/内容下载

按平台选择正确方法，一步到位。每个平台反爬机制不同，不能通用处理——先看路由表，再读对应平台的 reference 文件。

## 前置检查（每次使用前）

### 第1步：更新 opencli（npm 包）
```bash
npm update -g @jackwener/opencli
```
opencli 高频发版（每周 2-3 次），新命令经常加。不更新就用不到最新方法。

### 第2步：更新 opencli skills（npx 管理）
```bash
npx skills update -g -y
```
opencli 自带 4 个辅助 skill，随 opencli 仓库更新但独立于 npm 包。必须单独更新：
- **opencli-usage**：查命令总览，不确定有什么命令时用
- **opencli-autofix**：命令失败时自动诊断修复（SELECTOR 错误、页面结构变化等）
- **opencli-browser**：浏览器自动化操作
- **opencli-adapter-author**：写新的 opencli 适配器

### 第3步：查最新命令比对文档
```bash
opencli <platform> --help
```
opencli 经常加新命令（如 4 月加了 bilibili download、xiaohongshu download），SKILL 文档可能滞后。**发现新命令时更新对应 reference 文件。**

### 第4步：检查 Browser Bridge
```bash
opencli doctor
```
3 项全绿（Daemon + Extension + Connectivity）才能用 Cookie 命令。失败时排障：
1. `opencli doctor` 看哪项失败
2. daemon 没跑 → `launchctl start com.opencli.daemon`
3. daemon 在跑但扩展未连 → 让用户 `chrome://extensions/` 关开 OpenCLI 扩展
4. 都 OK 还连不上 → `launchctl kickstart -k gui/$(id -u)/com.opencli.daemon`

### 命令失败时的处理

1. 先用 **opencli-autofix** skill 诊断：`OPENCLI_DIAGNOSTIC=1` 重跑失败命令
2. 修复成功 → 更新 reference 文件记录正确方法
3. 修复失败 → 按降级链切换方法

## 快速路由

用户说"下载 XXX"时，先判断平台，再读对应的 reference 文件：

| 关键词 | 平台 | reference 文件 |
|--------|------|---------------|
| 抖音 / douyin | 抖音 | `references/douyin.md` |
| TT / tiktok / TikTok | TikTok | `references/tiktok.md` |
| YouTube / youtube / 油管 | YouTube | `references/youtube.md` |
| B站 / bilibili / BV | B站 | `references/other-platforms.md` |
| 小红书 / xhs | 小红书 | `references/other-platforms.md` |
| 知乎 / zhihu | 知乎 | `references/other-platforms.md` |
| 公众号 / 微信文章 | 微信公众号 | `references/other-platforms.md` |

不确定平台时，默认尝试 `yt-dlp <url>`，失败再按平台路由。

## 降级链

每个平台方法失败时，按以下顺序降级，直到成功或全部失败才报错给用户：

| 平台 | 第1选 | 第2选 | 第3选 | 最终兜底 |
|------|-------|-------|-------|---------|
| 抖音 | 移动端 UA + iesdouyin | `opencli douyin` | `douyin_tiktok_scraper`（Python） | Scrapling stealthy |
| TikTok | tikwm API | `yt-dlp` | `opencli tiktok`（需 Browser Bridge） | — |
| YouTube | `yt-dlp`（需 `--cookies-from-browser chrome`） | `opencli youtube transcript`（字幕） | — | — |
| B站 | `opencli bilibili download`（需 Browser Bridge） | Jina Reader | — | — |
| 小红书 | `opencli xiaohongshu download`（需 Browser Bridge） | agent-reach | Jina Reader | — |
| 知乎 | `opencli zhihu` | Jina Reader | — | — |
| 公众号 | `fetch.py` | agent-reach | Jina Reader | Scrapling stealthy |
| 未知平台 | `yt-dlp` | Scrapling MCP（get） | Scrapling stealthy | Jina Reader |

降级时注意：
- 抖音不存在 yt-dlp 降级路径（已验证无效），不要浪费时间尝试
- B站 yt-dlp 已被 HTTP 412 全面拦截（2026-04-28 验证），不要尝试 yt-dlp 下载B站视频
- YouTube 无 cookies 会被 bot 检测拦截，必须加 `--cookies-from-browser chrome`
- 每步失败后简要告诉用户换了个方法，不要静默切换
- 全部失败时，告诉用户具体哪步失败了、可能的的原因、建议用户做什么

## 通用兜底

| 方法 | 命令 | 场景 |
|------|------|------|
| Jina Reader | `curl -sL "https://r.jina.ai/<url>"` | 通用网页内容提取 |
| Scrapling stealthy | MCP stealthy_fetch | 反爬场景 |
| yt-dlp | `yt-dlp <url>` | 通用视频下载 |

## 工具速查

| 操作 | 命令 |
|------|------|
| 语音转文字（快） | `whisper-cli -m model.bin -f audio.mp3 -l zh` |
| 语音转文字（准） | `python3 -c "import whisper; ..."` (small 模型) |
| 语音合成（TTS） | `edge-tts --text "文本" --voice zh-CN-XiaoxiaoNeural --write-media output.mp3` |
| 音视频转码 | `ffmpeg -i input.mp4 -vn -acodec libmp3lame output.mp3` |
| OCR | `tesseract image.png stdout -l chi_sim+eng` |

## 关键注意事项

- 抖音反爬极强，yt-dlp/Jina 全部无效，只能用移动端 UA 方法（见 `references/douyin.md`）
- TikTok 用 tikwm API，CDN URL 临时，获取后立即下载
- YouTube VTT 字幕必须清洗，否则 LLM 处理不了
- opencli Cookie 命令需要 Browser Bridge 运行（排障：`opencli doctor`）
