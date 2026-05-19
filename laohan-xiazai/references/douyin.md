# 抖音下载方法

抖音反爬极强，yt-dlp/Jina/web_fetch 全部无效。以下方法是唯一可靠方案（无需 cookies）。

## 下载视频

1. 移动端 UA 请求短链接 → 获取 video_id
2. `iesdouyin.com/share/video/{id}` → 提取 `window._ROUTER_DATA` JSON
3. JSON 路径：`loaderData` → `video_(id)/page` 或 `note_(id)/page` → `videoInfoRes` → `item_list[0]`
4. `video.play_addr.url_list[0]` 中替换 `playwm` → `play` → 下载视频

移动端 UA（必须，iesdouyin.com 只对移动端返回完整数据）：
```
Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/121.0.2277.107 Version/17.0 Mobile/15E148 Safari/604.1
```

## 提取音频 + 转录

```bash
# 下载视频后提取音频
ffmpeg -i input.mp4 -vn -acodec libmp3lame output.mp3
```

转录优先用硅基流动 API（免费、秒级返回），失败降级到本地 whisper：

```bash
# 第1选：硅基流动 SenseVoiceSmall（免费，中文优化）
source ~/.zshrc 2>/dev/null
curl -s -X POST "https://api.siliconflow.cn/v1/audio/transcriptions" \
  -H "Authorization: Bearer $SILICONFLOW_API_KEY" \
  -F "model=FunAudioLLM/SenseVoiceSmall" \
  -F "file=@output.mp3" | python3 -c "import sys,json; print(json.load(sys.stdin).get('text',''))"

# 第2选：whisper-cli（快，本地）
whisper-cli -m /opt/homebrew/share/whisper.cpp/ggml-small.bin -f output.mp3 -l zh

# 第3选：Python whisper（准，本地，慢）
python3 -c "
import whisper
model = whisper.load_model('small')
result = model.transcribe('output.mp3', language='zh')
print(result['text'])
"
```

## 批量下载博主视频（完整流程）

实测用于拉斐尔2077 benchmark 样本采集，opencli 获取 play_url → curl 下载 → ffmpeg 提取音频 → whisper 转录，一体化 Python 脚本：

```bash
# 1. 获取视频列表（含 play_url CDN 临时链接）
opencli douyin user-videos {sec_uid} --limit 200 --with_comments false -f json > /tmp/videos.json

# 2. 批量下载+音频提取+转录
python3 << 'PYEOF'
import json, subprocess, os

data = json.load(open('/tmp/videos.json'))
out_dir = '/tmp/douyin_videos'  # 改成目标目录
os.makedirs(out_dir, exist_ok=True)

for i, v in enumerate(data):
    aweme_id = v['aweme_id']
    play_url = v.get('play_url', '')
    title = v.get('title', '')[:40]
    vdir = f'{out_dir}/video-{i+1:02d}'
    os.makedirs(vdir, exist_ok=True)

    # 下载视频（CDN 链接有时效，获取后立即下载）
    mp4 = f'{vdir}/source.mp4'
    if not os.path.exists(mp4) or os.path.getsize(mp4) < 10000:
        print(f'[{i+1}] 下载: {title}...')
        subprocess.run(['curl', '-sL', '-o', mp4, play_url], timeout=60, capture_output=True)
    else:
        print(f'[{i+1}] 已存在，跳过')

    # 提取音频
    wav = f'{vdir}/audio.wav'
    if not os.path.exists(wav):
        subprocess.run(['ffmpeg', '-y', '-i', mp4, '-vn', '-acodec', 'pcm_s16le', wav],
                       capture_output=True, timeout=30)

    # 转录（优先硅基流动 API，降级 whisper-cli）
    transcript = f'{vdir}/transcript.md'
    if not os.path.exists(transcript) or os.path.getsize(transcript) < 10:
        subprocess.run(['whisper-cli', '-m', '/opt/homebrew/share/whisper.cpp/ggml-small.bin',
                        '-f', wav, '-l', 'zh', '--no-timestamps'],
                       capture_output=True, text=True, timeout=120)
PYEOF
```

关键点：
- `play_url` 是 CDN 临时链接，有时效（约几分钟），获取后必须立即下载
- 不是手动走 iesdouyin 方法——opencli 内部已经做了同样的 API 调用，直接返回 play_url
- 音频用 `pcm_s16le`（WAV）格式，whisper 兼容性最好

## 查博主更新

```bash
opencli douyin user-videos {sec_uid} --limit 200 --with_comments false -f json
```

- sec_uid 从 URL 的 `/user/` 后面提取，或通过短链接解析获取
- **最大200条，分页已内置**（`public-api.js` 有 `max_cursor` 循环 + `has_more` 检查，每批20条自动翻页）
- 默认值 `--limit 20`，加 `--limit 200` 可获取全部视频（实际受账号视频总数限制）
- 返回 aweme_id + play_url（CDN临时链接）→ 立即下载视频
- ⚠️ sec_uid 必须是最新的：旧 sec_uid 会触发 Cookie 覆盖返回自己账号的数据
- 获取最新 sec_uid：`curl -sL -o /dev/null -w '%{url_effective}' -H "User-Agent: {移动端UA}" "https://v.douyin.com/{短链接}/"`
- 返回 aweme_id → `https://www.douyin.com/video/{aweme_id}`

> **踩坑记录**：源码 `user-videos.js` 第43行 help 文字写"最大 20"，实际 `MAX_USER_VIDEOS_LIMIT = 200`。help 文字是 opencli 自身 bug。不要信 help 文字，以源码常量为准。

## 代码层抓取（agent 内嵌）

```python
from douyin_tiktok_scraper.scraper import Scraper
async with Scraper() as s:
    data = await s.hybrid_parsing("https://v.douyin.com/xxx")
```

## 抓取评论（douyin-session adapter）

`~/.claude/skills/adapters/perf-data/douyin-session/crawler.py` 提供基于 Playwright 的评论抓取，支持任意公开视频。

```python
import sys, asyncio
sys.path.insert(0, '~/.claude/skills/adapters/perf-data/douyin-session')
from crawler import Session, fetch_comments

async def main():
    sess = await Session.open(headless=False)  # headless 也可用
    try:
        comments = await fetch_comments(sess, '{aweme_id}', max_pages=20)
        for c in comments[:20]:
            print(f"[{c['digg_count']}赞] {c['user_name']}: {c['text']}")
    finally:
        await sess.close()

asyncio.run(main())
```

注意事项：
- `fetch_comments`：抓任意公开视频评论（headless/headful 都行），拦截 XHR 滚动加载
- `fetch_video_detail`：仅对自己账号视频有效（创作者中心 API 限制）
- `.auth/` 目录存持久化 Cookie（需扫码登录一次），Chrome 异常退出后需清理 `SingletonLock/SingletonCookie/SingletonSocket`
- 获取用户视频列表：`opencli douyin user-videos {sec_uid} --limit 200 -f json`（⚠️ 最大200条分页已内置；旧 sec_uid 会 Cookie 覆盖返回自己账号的视频，需用短链接解析获取最新 sec_uid）
- 抖音主页 Scrapling stealthy_fetch 可获取公开视频页面（点赞+评论），但无法滚动加载全部评论

## 方法论：如何发现工具的真实能力

这次"最大20条"→"实际最大200条"的纠正过程，暴露了一个通用问题：**help 文字和文档会滞后于代码**。发现正确方法的步骤：

1. **不信 help 文字**：`--help` 输出的"最大 20"和 `default: 20` 是两个不同的东西——default 不等于 max
2. **读源码常量**：直接看工具的源码（npm 包在 `~/.nvm/.../lib/node_modules/` 下），找 `MAX_*` / `LIMIT` 等常量定义
3. **读分页逻辑**：看 API 调用层是否有 `cursor` / `max_cursor` / `has_more` / `page_token` 等分页机制
4. **用递增 limit 测试**：先测 `--limit 30`（超过声称的20），再测 `--limit 200`，用 `grep "^- index:" | wc -l` 计算实际返回条数
5. **区分限制来源**：返回少于 limit 可能是账号视频总数不够（如拉斐尔只有63条），不是工具限制

**通用原则**：当工具文档说"最大 N"时，用 `--limit N+1` 跑一次验证。如果成功了，文档就是错的。
