# TikTok 下载方法

> 实测 2026-06-29：tikwm API **当前可用**（search 端点返回真实视频数据，未触发 Cloudflare）。CF 防护间歇性，若再次被拦则降级 yt-dlp / opencli。**不支持抖音**（抖音见 `references/douyin.md`）。
>
> 历史记录：2026-06 初 tikwm 曾被 Cloudflare 拦截，现已恢复。判断 tikwm 是否被拦——看 curl 返回是否 JSON（正常）还是 Cloudflare 验证页（被拦）。

## 推荐方法（按轻量度排序）

| 顺序 | 方法 | 需 Browser Bridge | 适用 |
|------|------|------------------|------|
| 1 | tikwm API | 否 | curl 直连最轻；搜索 + 下载无水印 |
| 2 | yt-dlp | 否 | 通用兜底，失败率低 |
| 3 | opencli | 是 | 完整数据（user/profile/search/explore）|

## tikwm API（首选）

### 搜索视频

```bash
curl -s "https://www.tikwm.com/api/feed/search?keywords=KEYWORD&count=10" | \
  python3 -c "
import sys,json
d=json.load(sys.stdin)
for v in d.get('data',{}).get('videos',[]):
    print(f\"{v['author']['unique_id']} | {v.get('duration',0)//1000}s | {v.get('play_count',0)//1000000}M | {v['title'][:60]} | https://www.tiktok.com/@{v['author']['unique_id']}/video/{v['video_id']}\")
"
```

### 下载视频（无水印）

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
- 若 curl 返回 Cloudflare 验证页（非 JSON），说明 CF 防护又起，降级 yt-dlp

## yt-dlp（备选）

```bash
yt-dlp -o "%(title)s.%(ext)s" <tiktok-url>
```

## opencli 命令（需 Browser Bridge）

```bash
opencli tiktok explore --limit 20 -f json     # 热门
opencli tiktok search "关键词" --limit 10 -f json  # 搜索
opencli tiktok user <username> --limit 10 -f json  # 用户视频（不加 @）
opencli tiktok profile <username> -f json      # 用户资料
```
