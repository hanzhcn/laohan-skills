# TikTok 下载方法

TikTok 用 tikwm.com API，无需认证，无需 Browser Bridge。**不支持抖音**。

## 搜索视频

```bash
curl -s "https://www.tikwm.com/api/feed/search?keywords=KEYWORD&count=10" | \
  python3 -c "
import sys,json
d=json.load(sys.stdin)
for v in d.get('data',{}).get('videos',[]):
    print(f\"{v['author']['unique_id']} | {v.get('duration',0)//1000}s | {v.get('play_count',0)//1000000}M | {v['title'][:60]} | https://www.tiktok.com/@{v['author']['unique_id']}/video/{v['video_id']}\")
"
```

## 下载视频（无水印）

```bash
# 获取 CDN 地址
CDN_URL=$(curl -s -X POST "https://www.tikwm.com/api/" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "url=https://www.tiktok.com/@USER/video/VIDEO_ID&hd=1" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['hdplay'] or d['data']['play'])")

# 下载
curl -L -o "output.mp4" "$CDN_URL"
```

- `hdplay`=高清，`play`=标清，`wmplay`=带水印
- CDN URL 是临时的，获取后立即下载
- 不能自己拼 URL（`/video/media/hd/ID.mp4` 格式已失效）

## opencli 命令（需 Browser Bridge）

```bash
opencli tiktok explore --limit 20 -f json     # 热门
opencli tiktok search "关键词" --limit 10 -f json  # 搜索
opencli tiktok user <username> --limit 10 -f json  # 用户视频（不加 @）
opencli tiktok profile <username> -f json      # 用户资料
```
