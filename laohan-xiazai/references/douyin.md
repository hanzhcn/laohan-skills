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
whisper-cli -m $(brew --prefix whisper.cpp)/share/whisper.cpp/ggml-small.bin -f output.mp3 -l zh

# 第3选：Python whisper（准，本地，慢）
python3 -c "
import whisper
model = whisper.load_model('small')
result = model.transcribe('output.mp3', language='zh')
print(result['text'])
"
```

## 查博主更新

```bash
opencli douyin user-videos {sec_uid} --limit 1 -f json
```

- sec_uid 从 URL 的 `/user/` 后面提取
- 返回 aweme_id → `https://www.douyin.com/video/{aweme_id}`

## 代码层抓取（agent 内嵌）

```python
from douyin_tiktok_scraper.scraper import Scraper
async with Scraper() as s:
    data = await s.hybrid_parsing("https://v.douyin.com/xxx")
```
