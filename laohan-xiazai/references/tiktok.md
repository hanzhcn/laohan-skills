# TikTok 下载方法

> 实测 2026-06-29：tikwm API **当前可用**（search 端点返回真实视频数据，未触发 Cloudflare）。CF 防护间歇性，若再次被拦则降级 yt-dlp / opencli。**不支持抖音**（抖音见 `references/douyin.md`）。
>
> **2026-11-08 判例更新：批量下载首选 TikHub**——本地 yt-dlp 连发 21 条即触发 TikTok IP 风控（"Your IP address is blocked"），同刻 tikwm 亦被 CF 拦（间歇性复发）；TikHub 服务端代取+CDN 直链一次 16 条全成。单条/低频仍可用 yt-dlp（免费）；批量/被风控→TikHub。凭证 `TIKHUB_API_KEY`（~/.zshrc，Jeffrey 2026-09-22 授权本地跑，按 API 请求计费，量级很小）。现成真源脚本：laowai `scripts/tikhub-fetch.py`（翻页全量→对照库→≥90s 过滤→分批下载→落盘即 SHA 台账）。
>
> 历史记录：2026-06 初 tikwm 曾被 Cloudflare 拦截，现已恢复。判断 tikwm 是否被拦——看 curl 返回是否 JSON（正常）还是 Cloudflare 验证页（被拦）。

## 推荐方法（按场景）

| 场景 | 方法 | 需 Browser Bridge | 说明 |
|------|------|------------------|------|
| 批量/多视频收割 | **TikHub API** | 否 | 服务端代取不暴露本机 IP；无水印直链走 CDN；付费按请求计费（量级小） |
| 单条/低频 | tikwm API 或 yt-dlp | 否 | 免费首选；tikwm 被 CF 拦或 yt-dlp 被 IP 风控时降级 TikHub |
| 完整数据接口 | opencli | 是 | user/profile/search/explore（无下载命令） |

## TikHub API（批量首选，2026-11-08 实战验证）

```bash
# ① 用户名→secUid
curl -s "https://api.tikhub.io/api/v1/tiktok/app/v3/get_user_id_and_sec_user_id_by_username?username=USER" \
  -H "Authorization: Bearer $TIKHUB_API_KEY"
# ② 翻页全量视频列表（count=50，跟 max_cursor + has_more）
curl -s "https://api.tikhub.io/api/v1/tiktok/app/v3/fetch_user_post_videos?sec_user_id=$SEC&count=50&max_cursor=0" \
  -H "Authorization: Bearer $TIKHUB_API_KEY"
#   → data.aweme_list[].video.play_addr.url_list[0] = 无水印直链（tiktokcdn，curl -L 下载即可）
# ③ 单视频（含下载直链）
curl -s "https://api.tikhub.io/api/v1/tiktok/app/v3/fetch_one_video?aweme_id=ID" \
  -H "Authorization: Bearer $TIKHUB_API_KEY"
```

- 端点全集：`https://api.tikhub.io/openapi.json`（166 个 tiktok 端点，web/ 前缀为网页版、app/v3/ 为应用版）
- 抖音版同构（路径 douyin 换 tiktok），现成样例：laohanvideo `scripts/benchmark-fetch.mjs`
- 直链有时效性，取到即下，不缓存 URL

## tikwm API（单条免费首选）

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
# 获取 CDN 地址（校验业务 code 与字段存在，避免拿空链接）
CDN_URL=$(curl -sf -X POST "https://www.tikwm.com/api/" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "url=https://www.tiktok.com/@USER/video/VIDEO_ID&hd=1" | \
  python3 -c "
import sys,json
try:
    d=json.load(sys.stdin)
    data=d.get('data') or {}
    url=data.get('hdplay') or data.get('play')
    assert d.get('code')==0 and url, d.get('msg','empty')
    print(url)
except Exception as e:
    sys.exit(f'tikwm 解析失败: {e}')") || exit 1

# 下载（URL 非空才下）
[ -n "$CDN_URL" ] && curl -fL -o "output.mp4" "$CDN_URL"
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
