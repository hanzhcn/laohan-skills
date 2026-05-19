---
name: laohan-xiazai
description: 从互联网获取内容的一站式 skill。覆盖下载（视频/音频/字幕/博主数据）、抓取（网页/文章/评论/搜索结果）、阅读（公众号/知乎/小红书等）。按降级链自动选择最优工具：平台CLI→反检测抓取→AI浏览器→CDP接管→手动操作。确保在以下场景触发：用户说"下载""抓取""搜索""读一下""看看这个链接"，用户给出任意 URL 要求获取内容，任何涉及从互联网拿内容的操作。触发词：/laohan-xiazai
---

# 从互联网拿内容

按平台选择正确方法，一步到位。先看平台路由表，再读对应 reference 文件。平台方法不行时，按品类降级链逐层深入——每层解决不同问题，能浅不深。

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

### 场景 A：下载（视频/音频/字幕/博主数据）

先判断平台，再读对应的 reference 文件：

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

### 场景 B：搜索/阅读（文章/评论/帖子/搜索结果）

不走 reference 文件，直接走平台封装降级。注意：场景B 的首选方法与第一层降级表（下载场景）不同——搜索/阅读优先用 opencli 搜索命令或 agent-reach，下载才用移动端 UA / fetch.py 等。

| 平台 | 第1选 | 第2选 | 第3选 | 第4选 |
|------|-------|-------|-------|-------|
| 公众号 | agent-reach | Jina Reader | Scrapling stealthy | — |
| 知乎 | opencli zhihu | agent-reach | Jina Reader | — |
| 小红书 | opencli xiaohongshu | agent-reach | Scrapling stealthy | — |
| 微博 | opencli weibo | agent-reach | Jina Reader | — |
| B站 | opencli bilibili | agent-reach | Jina Reader | — |
| 抖音 | opencli douyin | agent-reach | douyin-session（评论） | Scrapling stealthy |
| TikTok | opencli tiktok（需 Browser Bridge） | agent-reach | Scrapling stealthy | — |
| 任意平台 | agent-reach（17平台搜索） | web-content-fetcher | Jina Reader | Scrapling stealthy |

**agent-reach 触发场景**：用户说"搜一下""读一下这个链接""这个公众号文章""帮我查"，或给出非视频的社交平台链接。

## 降级链

### 第一层：平台路由（Layer 2 平台封装）

每个平台方法失败时，按以下顺序降级，直到成功或全部失败才报错给用户：

| 平台 | 第1选 | 第2选 | 第3选 | 最终兜底 |
|------|-------|-------|-------|---------|
| 抖音 | 移动端 UA + iesdouyin | `opencli douyin` | `douyin_tiktok_scraper`（Python）+ douyin-session（评论） | Scrapling stealthy |
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
- 全部失败时，告诉用户具体哪步失败了、可能的原因、建议用户做什么

### 第二层：品类降级（平台路由全部失败时）

平台方法全部失败后，按能力从轻到重逐层深入。每层解决一个不同的问题：

```
平台封装已试过（opencli / agent-reach / yt-dlp 全部失败）
  ↓ 问题：普通网页抓取即可
轻量抓取 → Scrapling MCP get（普通 HTTP 请求，无 JS 渲染）
  ↓ 问题：页面需要 JS 渲染
JS 渲染抓取 → Scrapling MCP fetch（Playwright 浏览器渲染）
  ↓ 问题：被反爬拦截
反检测抓取 → Scrapling stealthy_fetch（绕过检测 + 提取内容）
  ↓ 问题：页面结构未知，写不出选择器
AI 浏览器 → browser-use（AI 理解页面结构、自主操作）
  ↓ 问题：需要登录态才能看到内容
CDP 接管 → web-access（接管已登录的 Chrome，天然携带 cookie）
  ↓ 问题：AI 也搞不定，需要精确控制
手动驱动 → ECC Playwright MCP（代码级精确控制每一步）
```

**每层解决的问题不同，不要跳层**：
- 普通网页 → Scrapling get（最轻，HTTP 直接请求）
- JS 渲染 → Scrapling fetch（需要浏览器但不需隐身）
- 反爬拦截 → Scrapling stealthy（隐身模式绕过检测）
- 页面看不懂 → browser-use（AI 理解能力）
- 内容需要登录 → web-access（用用户自己的登录态）
- 精确操作 → Playwright（人工级控制）

**成本递增，能浅不深**：Scrapling get（HTTP 秒级）< Scrapling fetch（浏览器秒级）< Scrapling stealthy（反检测）< browser-use（需调 LLM API）< web-access（需 CDP 连接）< Playwright（需写代码）

## 通用兜底

| 方法 | 工具 | 场景 |
|------|------|------|
| agent-reach | `agent-reach` skill（npx） | 17 平台搜索/阅读，社交内容首选 |
| Jina Reader | `curl -sL "https://r.jina.ai/<url>"` | 通用网页内容提取 |
| web-content-fetcher | `/web-content-fetcher` skill | agent-reach 失败时的三级降级抓网页 |
| Scrapling stealthy | MCP stealthy_fetch | 反爬场景 |
| yt-dlp | `yt-dlp <url>` | 通用视频下载 |
| browser-use | `/open-source` skill（npx） | AI 自主操作浏览器，全新/未知页面 |
| web-access CDP | `/web-access` skill（npx） | 接管已登录 Chrome，需登录态的场景 |
| Playwright 手动 | ECC Playwright MCP | 精确手动控制，最后兜底 |

## 工具速查

### 语音转文字

| 优先级 | 工具 | 命令 | 说明 |
|--------|------|------|------|
| 1 | 硅基流动 API | `curl -X POST https://api.siliconflow.cn/v1/audio/transcriptions -H "Authorization: Bearer $SILICONFLOW_API_KEY" -F "model=FunAudioLLM/SenseVoiceSmall" -F "file=@audio.mp3"` | 秒级，免费，中文优化 |
| 2 | whisper-cli | `whisper-cli -m model.bin -f audio.mp3 -l zh` | 本地 C++，快 |
| 3 | whisper Python | `python3 -c "import whisper; ..."` (small 模型) | 本地，最准 |
| 4 | whisper-timestamped | `python3 -c "import whisper_timestamped; ..."` | 精确时间戳，字幕制作用 |

### 语音合成 / 音视频处理

| 操作 | 命令 |
|------|------|
| 语音合成（TTS） | `edge-tts --text "文本" --voice zh-CN-XiaoxiaoNeural --write-media output.mp3` |
| 音视频转码 | `ffmpeg -i input.mp4 -vn -acodec libmp3lame output.mp3` |
| OCR | `tesseract image.png stdout -l chi_sim+eng` |
| PDF 提取文本 | `python3 -c "import fitz; doc=fitz.open('file.pdf'); [page.get_text() for page in doc]"` |
| 图片处理 | `convert input.png -resize 800x600 output.png` |

### 搜索兜底

| 工具 | 场景 | 说明 |
|------|------|------|
| smart-search | opencli 搜索路由 | 基于 opencli 的智能搜索，覆盖社交/技术/新闻/购物，`~/.agents/skills/smart-search/` |
| web-search | 通用网页搜索 | DuckDuckGo API，轻量搜索，`~/.openclaw/skills/web-search/` |
| multi-search-engine | agent-reach + Jina 都搜不到时 | 17 搜索引擎聚合对比，`~/.openclaw/skills/multi-search-engine/` |
| baidu-search | 中文内容搜索 | 百度 AI 搜索，中文场景优于通用引擎，`~/.openclaw/skills/baidu-search/` |

### Scrapling 调用路径

| 环境 | 方式 | 说明 |
|------|------|------|
| Claude Code 主会话 | MCP 直调 `mcp__ScraplingServer__stealthy_fetch` | 直接可用 |
| OpenClaw 子 agent | mcporter 桥接 `mcporter call ScraplingServer.stealthy_fetch url=<url>` | 子 agent 无 MCP 权限，需桥接 |

## 关键注意事项

- 抖音反爬极强，yt-dlp/Jina 全部无效，只能用移动端 UA 方法（见 `references/douyin.md`）
- TikTok 用 tikwm API，CDN URL 临时，获取后立即下载
- YouTube VTT 字幕必须清洗，否则 LLM 处理不了
- opencli Cookie 命令需要 Browser Bridge 运行（排障：`opencli doctor`）
