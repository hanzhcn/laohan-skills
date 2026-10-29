# 抖音下载方法

单视频先查当前`opencli douyin detail --help`，有该命令就用它；2026-10-29本机2.0.2已核可接短链/链接/ID，返回作品信息与play_url。下载失败再按下方浏览器分支，不把历史“没有单条resolve”或旧SSR方法当当前事实。抖音不走yt-dlp；短链HTTP重定向仍能取ID，不泛称所有HTTP都无效。

## 下载视频

### 第 1 步：优先已有detail入口

```bash
opencli douyin detail <短链/链接/ID> --window background -f json
```

核返回的aweme_id/作者/时长对应用户给的作品，再立即下载临时play_url，失败不得把JSON错误保存成MP4。页面预导航超时，即使doctor全绿也不证明内容已取得；转第2/3步。旧版本缺命令可直接用浏览器分支，不为取一条视频强制升级或全量更新skills。

### 第 2 步：必要时短链解析拿video_id

从分享口令正则提取短链（`https?://v\.douyin\.com/[\w]+/`），带移动端 UA 请求，302 落地 URL 路径里的数字即 video_id：

```bash
curl -sL -o /dev/null -w '%{url_effective}' \
  -H "User-Agent: {移动端UA}" "https://v.douyin.com/5Rv_b7nF6EE/"
# → https://www.iesdouyin.com/share/video/7657727877504437538/?region=CN&...
# video_id = 7657727877504437538
```

移动端 UA（必须）：
```
Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) EdgiOS/121.0.2277.107 Version/17.0 Mobile/15E148 Safari/604.1
```

### 第 3 步：明确绑定已登录浏览器取实际媒体

优先新建本任务tab打开canonical作品页，核可见作者/标题/时长。播放器已加载时读实际`video.currentSrc`，使用宿主的media download能力或curl立即下载。2026-10-29此分支已取得Eleanor作品`7701720177322684539`完整50.48秒/720×1280源片，ffmpeg全片解码成功。**浏览器返回只有画面/视频地址，不等于已听BGM。**

多浏览器/profile并存时，必须把tabID和真实浏览器实例绑定。若列表有tab但操作连续报NO_TAB，转实例归属诊断，不拿另一浏览器的ID反复操作；不重启用户共享浏览器/daemon、不关他人tab。huashu不可明确绑定时，使用宿主提供的等效浏览器控制，按其真实文档取媒体，不猜API。

播放器源不可得时，按宿主现有网络能力抓aweme/detail响应：

1. Playwright（ECC Playwright MCP `browser_navigate`）打开 `https://www.iesdouyin.com/share/video/{video_id}/`，页面自动跳转到 `www.douyin.com/video/{video_id}` 并渲染
2. 页面自己调用 `https://www.douyin.com/aweme/v1/web/aweme/detail/?aweme_id={video_id}`——签名（a_bogus/msToken）由浏览器自动计算，无需关心
3. 从 network 抓该请求的响应体（`browser_network_requests` 过滤 `aweme/detail` → `browser_network_request` 取 `response-body`）
4. JSON 路径：`aweme_detail.video.play_addr.url_list[0]` → CDN直链；`bit_rate`数组含多码率备选。实际清晰度/编码以下载后的ffprobe为准，不保证都是1080p
5. curl 带 `Referer: https://www.douyin.com/` 下载，**拿到立即下载**——CDN 直链带签名时效（约几小时）

备选取法：页面 network 里 douyinvod.com 的 `media-video-avc1` + `media-audio-und-mp4a` 是分离流（206 请求），下载两段后 `ffmpeg -i video.mp4 -i audio.mp4 -c copy out.mp4` 合并。

下载后记录稳定作品URL/ID、时间、源文件SHA/流信息，ffmpeg完整解码。临时CDN签名与无关账号信息不入Git。对标原片保留标题/字幕供研究；项目要求的clean另存并登记裁剪边界，不能把学习片自动改成当前形象/训练素材。

### ~~旧方法：移动端 UA + iesdouyin SSR~~（已失效，2026-08-26 验证）

原四步：`iesdouyin.com/share/video/{id}` 提取 `window._ROUTER_DATA` → `loaderData` → `videoInfoRes` → `item_list[0]` → `video.play_addr.url_list[0]` 替换 `playwm` → `play`。

失效原因：SSR 页面的 `_ROUTER_DATA` 里只剩 query/abParams，`play_addr` 出现 0 次——抖音把视频数据从服务端渲染抽走，改为前端 JS 调带签名的 API。此路不可修，别再试。

## 提取音频 + 转录

```bash
# 下载视频后提取音频
ffmpeg -i input.mp4 -vn -acodec libmp3lame output.mp3
```

### Apple Silicon 高精度 benchmark 路线

对标拆稿优先准确率，不走日常“云端秒级”默认。M1/M2/M3/M4 Mac 使用 Apple MLX 实现和**未量化** `mlx-community/whisper-large-v3-mlx`：

```bash
python3 -m venv .venv
.venv/bin/pip install mlx-whisper
.venv/bin/mlx_whisper input.mp3 \
  --model mlx-community/whisper-large-v3-mlx \
  --language zh \
  --output-format txt
```

- `large-v3` 是 OpenAI 完整多语种模型；不要把 `large-v3-turbo`、4bit/8bit 量化版写成“最高精度”。
- 不用 PyTorch `whisper --device mps`：本机 M1 Pro 实测 FP16 产生 NaN；FP32 虽可运行但两条 6 分钟视频 30 分钟仍未完成。
- `whisper-cli + small` 只用于快速预跑；最终 benchmark transcript 必须记录真实 engine/model。

对标拆稿沿上面的MLX高精度分支，先复用已有环境/模型缓存，不每条新建环境或重下模型。2026-10-29已验证本机缓存可由`uv run --offline --with mlx-whisper python`加载未量化large-v3（`HF_HUB_OFFLINE=1`，显式传已核snapshot路径）；这是本机可达实例，不保证别的机器也有缓存。输出记录engine/model/设置/源SHA，ASR草稿对照烧录字幕，不能把转写当听感/音乐分析或精确停顿真值。

其他ASR仅按本次已授权受控入口使用，不source交互shell、不把Bearer密钥放进可见命令行或日志；缺配置只报告受影响范围，不以空转录登记成功。日常低精度预跑与正式对标转录分别标注。

## 批量下载博主视频

```bash
opencli douyin user-videos <sec_uid> --limit 20 --with_comments false -f json
```

使用项目已有受控批量入口，逐条核aweme_id/作者和临时play_url，再立即下载、提取PCM音频并沿上面ASR分支转录；每步必须检查返回码及实际文件，失败保留条目和原因，不能把空转录或下载错误记成功。文件存在只证明缓存存在，仍核源身份/完整解码，不以固定字节大小判视频有效。不要复制旧版含语法错误、未初始化failed或明文Bearer argv的示例脚本。

- 返回条数不等于博主作品总数；主页计数与分页另核。2026-09-19曾出现主页95条但列表仅17条，不能把不足limit当已取全。
- 当前sec_uid与实际作者必须对应；旧值/接口降级可能返回自己账号数据，错人时停止，不能按数量继续。
- 临时CDN地址有时效；稳定ID/作品URL入档，签名URL不作为永久来源。

## 批量采集博主封面（2026-09-19 实测 95 条采到 89 张）

封面不在 user-videos 输出里（opencli 不返回 cover 字段），也不用登录态 hook——**逐条渲染视频分享页**即可：

1. 对每个 aweme_id：`Chrome --headless=new --dump-dom --virtual-time-budget=9000 --timeout=15000 https://www.douyin.com/video/{id}`（每条带独立 `--user-data-dir=/tmp/chrome-prof-cover-{id[-4:]}`，外层 `timeout 30`）
2. 从 DOM 正则取 `https://p\d-pc-sign.douyinpic.com/tos-cn-p-0015/[^"' ]*` 且含 `pcweb_cover` 的 URL（`&amp;` 还原为 `&`）
3. 下载必须带 `Referer: https://www.douyin.com/` + 普通 UA，否则 403
4. 脚本：`laohanvideo/scripts/fetch_douyin_covers.py`（python3 直跑，subprocess 调 Chrome，支持断点续传；约 27s/条，95 条≈45 分钟）
5. 已知缺口：约 15% 视频分享页渲染后无 pcweb_cover img（NOURL），重试同样失败——疑为抖音侧未生成 PC 封面，这部分只能登录态 App/网页查看

实测：柱子哥95条→成功89张+6 NOURL（重试后仍NOURL）。注意响应 model 字段与封面无关；数字水印等元素不在 origin 封面层（封面就是视频帧直出）。

## 主页全量采集（登录态 hook 翻页法，2026-09-19 实测 95 条全覆盖）

opencli user-videos 只能拿最新一批。要全量：

1. **必须登录态浏览器**（opencli browser 绑定日常 Chrome）。未登录 Playwright 开主页有登录墙：`body overflow:hidden`、scrollHeight 锁死一屏、无关闭按钮，window 滚动全部无效
2. **滚动容器不是 window**：主页真正滚动发生在 `.parent-route-container` div 上。对它 `scrollTop/scrollBy` 且 `dispatchEvent(new Event("scroll", {bubbles:true}))`；懒加载需要"滚回顶部→再滚到底"才触发，直接置底不加载下一页
3. **播放地址在列表分页响应里，不在单视频 detail**：主页点击视频弹窗播放器不发 `/aweme/detail/`（点击 95 个卡片实测 0 请求），地址就在 `/aweme/post/` 每页响应的 `aweme_list[].video.play_addr.url_list[0]`（备选 `bit_rate[0].play_addr`）
4. **opencli browser network 缓冲不可靠**：捕获窗口会丢历史响应（抓到 7 页 post 响应没立刻 `--detail` 就没了）；`--follow` 若起在 reload 前也会漏 reload 后的请求。可靠做法是**页面内注入 fetch+XHR hook**：包装 `window.fetch` 和 `XMLHttpRequest.prototype.open`，命中 `/aweme/post/` 就解析响应、只留精简字段（id/desc/dur/ct/digg/play_addr）存 `window.__x`；然后切"喜欢→作品"tab 重触发全部分页；滚动至 `has_more=0`；分批 eval 取回后立即 curl 下载（CDN 时效几分钟）。下载校验：>500KB 且文件头 `ftyp`，ffprobe 时长与元数据差 >5s 算失败
5. 收尾：`git rm --cached` 才能让后补的 .gitignore 规则对已追踪文件生效

## 查博主更新

```bash
opencli douyin user-videos {sec_uid} --limit 20 --with_comments false -f json
```

- sec_uid 从 URL 的 `/user/` 后面提取，或通过短链接解析获取
- **`--limit` 上限 20 条且无翻页**：opencli 1.8.6 源码 `clis/douyin/user-videos.js` 中 `MAX_USER_VIDEOS_LIMIT = 20` 硬截断，`max_cursor` 只是单次请求参数非分页迭代——**重复调用只返回同样首批 20 条**，不要靠多次调用取更多；超 20 条需走 huashu-chrome/Playwright 抓网页端分页
- 单条视频：**opencli ≥2.0 有 `douyin detail <短链/链接/ID>`**（单视频全解：文案/互动数据/作者/下载地址/图集），优先于抓包链路
- 返回 aweme_id + play_url（CDN临时链接）→ 立即下载视频
- ⚠️ sec_uid 必须是最新的：旧 sec_uid 会触发 Cookie 覆盖返回自己账号的数据
- 获取最新 sec_uid：`curl -sL -o /dev/null -w '%{url_effective}' -H "User-Agent: {移动端UA}" "https://v.douyin.com/{短链接}/"`
- 返回 aweme_id → `https://www.douyin.com/video/{aweme_id}`

> **踩坑记录（2026-07-08 读源码纠正）**：本文档早先版本曾断言"源码 `MAX_USER_VIDEOS_LIMIT = 200`、help 写'最大 20'是 opencli bug"——这是编造的。直接读 `user-videos.js`：常量就是 `20`，help 文字正确，`Math.min(20, …)` 把更大值截断为 20，`--limit 200` 实际只返回 20 条。作者当时没真读源码就下了结论，还据此写了下方"方法论"——反面教材，但方法论本身（不信文档、读源码）值得保留，已用本次纠正重写。

## 代码层抓取（agent 内嵌）

> **douyin_tiktok_scraper 1.2.9 已失效**（2026-08-26 验证）：`hybrid_parsing` 内部走 `douyin.com/aweme/v1/web/aweme/detail/`（X-Bogus 签名），当前签名算不过校验，重试 4 次全返回空。另 API 已变：1.2.9 的 `Scraper()` 不支持 `async with`，须直接实例化调用。库若更新签名算法可能复活，复活前代码内嵌场景改用上方 Playwright 抓包法。

```python
# 历史用法存档（当前失效，勿用）
from douyin_tiktok_scraper.scraper import Scraper
async with Scraper() as s:  # 1.2.9 已不支持 async with
    data = await s.hybrid_parsing("https://v.douyin.com/xxx")
```

## 抓取评论（douyin-session adapter）

`~/.agents/skills/adapters/perf-data/douyin-session/crawler.py` 提供基于 Playwright 的评论抓取，支持任意公开视频。（本机扩展，非 laohan-skills 自带；opencli 无抖音评论命令，评论需靠此 adapter 或第三方库）

```python
import sys, asyncio, os
sys.path.insert(0, os.path.expanduser('~/.agents/skills/adapters/perf-data/douyin-session'))
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
- 获取用户视频列表：`opencli douyin user-videos {sec_uid} --limit 20 -f json`（⚠️ `--limit` 上限 20 无翻页；旧 sec_uid 会 Cookie 覆盖返回自己账号的视频，需用短链接解析获取最新 sec_uid）
- 抖音主页 Scrapling stealthy_fetch 可获取公开视频页面（点赞+评论），但无法滚动加载全部评论

## 踩坑记录（2026-08-26 反爬升级全链路验证）

背景：单视频下载（`v.douyin.com` 短链）失败，触发降级链全链路实测。

**仍然有效的**：
- 短链 302 重定向（curl + 移动端 UA → video_id）
- opencli（search/user-videos 等，内部维护签名）
- Playwright 渲染 + 抓 aweme/detail 响应（新首选，实测下载成功 86MB/533s/1080p）

**死路清单（别浪费时间重试）**：

| 方法 | 现象 |
|------|------|
| iesdouyin SSR `_ROUTER_DATA` + `playwm→play` | JSON 里只剩 query/abParams，`play_addr` 出现 0 次 |
| `iesdouyin.com/web/api/v2/aweme/iteminfo` 老 API | 返回空 |
| douyin_tiktok_scraper 1.2.9 | web detail API 签名失效，重试 4 次空响应 |
| tikwm API 喂抖音链接 | "Url parsing is failed"（本就不支持抖音，见 tiktok.md） |
| api.douyin.wtf 公共实例 | 无响应（源头项目自顾不暇） |
| www.douyin.com 直抓（ttwid + RENDER_DATA） | ttwid 注册接口返回空，页面是 72KB 风控页 |

**源头项目调研**（2026-08-26）：
- Evil0ctal/Douyin_TikTok_Download_API（14.7k★，douyin.wtf 背后）：官方文档承认多端点 400 / 返回 200 但空响应体 / 评论端点崩溃，社区转向 TikHub（商业付费）或自部署 + 实时 Cookie
- Johnserf-Seed/f2（原 TikTokDownload）：仍活跃，`f2 dy -M one -u <链接>` 单视频模式，纯 HTTP 比浏览器轻，但必须配登录 Cookie 且依赖其 a_bogus 签名持续跟进——**轻量备选，未实测**
- 业界格局：免签名轻量通道已绝，只剩"自算签名 + Cookie"（军备竞赛）与"浏览器层"（重但稳）两条路。a_bogus = SM3 国密哈希 + RC4 + 浏览器指纹，纯逆向实现的开源库不少但随抖音更新频繁失效

## 方法论：如何发现工具的真实能力

本次"user-videos 到底是 20 还是 200"的纠正过程（见上方踩坑记录），正好是这套方法论的活教材。发现工具真实能力的步骤：

1. **不信文档，也不盲信 help**：文档会编造（本文档就曾把 20 写成 200），help 文字也可能滞后于代码——两者都要用源码验证
2. **直接读源码常量**：npm 包在 `~/.nvm/.../lib/node_modules/@jackwener/opencli/clis/<platform>/` 下，找 `MAX_*` / `LIMIT` / `DEFAULT_*` 常量定义（如 `MAX_USER_VIDEOS_LIMIT = 20`）
3. **读截断/分页逻辑**：看是否有 `Math.min(MAX, …)` 硬截断（→ 上限就是 MAX），还是 `cursor` / `max_cursor` 在 `while` / `has_more` 循环里递增（→ 真分页）。注意 `max_cursor: '0'` 只是单次请求参数，没有循环就不是分页
4. **用递增 limit 实测**：`--limit 30` 超过声称上限跑一次，数返回条数（`-f json | jq length` 或 `grep -c`），若被截断到上限说明硬限制
5. **区分限制来源**：返回少于 limit 可能是数据源本身不够（如某博主只有 15 条视频），不是工具限制

**通用原则**：`Math.min(MAX, x)` + `.slice(0, limit)` = 硬上限，文档/help 说的"最大 N"通常就是这个 MAX；只有看到游标在循环里递增才是真分页。本次教训：声称"读了源码"却得出错误结论（200），比不读源码更有害——读源码时必须真的找到常量定义行，不能靠猜。

## 获取视频发布时间（aweme_id 解码法）

opencli `douyin user-videos` 不返回 `create_time` 字段，网页端需登录态才渲染视频列表。解决方案：**从 aweme_id 估算发布时间**，无需登录、无需额外 API。

原理：aweme_id 是 64 位整数，高 32 位与生成时间相关（+13s 偏移）。**这是估算不是精确发布时间**（ID 生成与实际发布可能有偏差，官方未承诺精确性，见上游 FAQ；能用真实 `create_time` 时优先用真实值）。解码示例输出为 UTC 时间戳，换算北京时间显式指定时区。来源 [Evil0ctal/Douyin-TikTok-Video-ID-Decoder](https://github.com/Evil0ctal/Douyin-TikTok-Video-ID-Decoder)。

```python
from datetime import datetime

def decode_douyin_time(aweme_id):
    """从 aweme_id 解码发布时间，精度 ±13 秒"""
    ts = (int(aweme_id) >> 32) + 13  # 高32位 + 抖音校准偏移
    return datetime.fromtimestamp(ts)

# 用法示例
print(decode_douyin_time("7481234567890123456"))
# → 2026-02-25 19:26:xx
```

完整流程（获取博主最近3条发布时间）：

```python
import json, subprocess
from datetime import datetime

def decode_douyin_time(aweme_id):
    ts = (int(aweme_id) >> 32) + 13
    return datetime.fromtimestamp(ts)

sec_uid = "MS4wLjABAAAA..."  # 博主 sec_uid
r = subprocess.run(
    ['opencli', 'douyin', 'user-videos', sec_uid, '--limit', '3', '-f', 'json'],
    capture_output=True, text=True, timeout=30
)
videos = json.loads(r.stdout)
for v in videos[:3]:
    dt = decode_douyin_time(v['aweme_id']).strftime('%m-%d %H:%M')
    print(f"{dt} | 赞{v['digg_count']} | {v['title'][:40]}")
```

为什么不用其他方法：
- **opencli `user-videos`**：不返回 `create_time` 字段（注意：`videos` 命令返回自己作品的 create_time，但 `user-videos` 查别人的不返回）
- **抖音网页**：未登录不渲染视频列表（显示"服务异常"）
- **iesdouyin 移动端**：返回 72KB 空 HTML
- **Scrapling stealthy**：同样需要登录态
- **第三方 API（JustOneAPI 等）**：收费，aweme_id 解码法免费且精确

## 账号与作品管理（需 Browser Bridge）

以下命令通过创作者中心（creator.douyin.com）操作，需要 Browser Bridge 运行。

### 获取自己账号信息

```bash
opencli douyin profile -f json
# 返回：uid, nickname, follower_count, following_count, aweme_count
```

### 获取自己作品列表（含发布时间）

```bash
opencli douyin videos --limit 20 --status published -f json
# 返回：aweme_id, title, status, play_count, digg_count, create_time
```

- `create_time` 是精确的发布时间（如 `2026/4/26 22:09:38`）
- **注意区分**：`videos` 查自己作品（有 create_time），`user-videos` 查别人作品（没有 create_time，需用 aweme_id 解码法）
- `--status` 过滤：`all`（默认）、`published`、`reviewing`、`scheduled`
- `--page` 分页（默认第1页）

### 单个作品数据分析

```bash
opencli douyin stats <aweme_id> -f json
# 返回：metric, value 键值对
```

- 注意：部分作品可能返回 API error（隐私设置或创作者中心权限限制）

## 关键词搜索

第1选 `opencli douyin search`（零额外安装，借 Bridge 登录态，但互动字段仅 likes 真实）；需要完整互动数据（播放/评论/分享/发布时间）时用第2选 `dy-cli`（statistics 字段全，需自行扫码登录）。不再安装或维护另一套浏览器爬虫。

### 第1选：opencli douyin search

```bash
opencli douyin search "关键词" --limit 30 -f json
# 输出列：rank, desc, author, url, plays, likes, comments, shares
```

- `--limit 1-30`（default 10），返回视频流和视频地址；互动字段是否可用以当次响应为准
- 需 Browser Bridge（`opencli doctor` 查状态）
- 这是视频搜索，区别于 `hashtag search`（只搜话题标签）

失败时按现有 OpenCLI 能力降级：同一命令加 `--trace retain-on-failure` 并运行 autofix；最多三次仍失败且 `opencli doctor` 正常时，用 `opencli browser` 绑定当前已登录抖音标签页做只读取证。全部失败就报告 `BLOCKED`，不安装 DrissionPage、Playwright、另一套浏览器或自制 adapter（dy-cli 除外，它是第2选）。

### 第2选：dy-cli（statistics 字段全，需自行登录）

GitHub [Youhai020616/douyin]，`pip install dy-cli`。PyPI 0.2.2（2026-03-15）为最新版；仓库 52★ 低频维护（2026-08-02 仍在修 bug，修复未发 PyPI）。老韩AI 生产环境实战验证：2026-08-15 记录"363KB/16s + statistics 字段全"，2026-08-26 安装版关键词返回 18 条真实结果。

```bash
# 本机系统 Python 3.14 受 PEP 668 管控，直接 pip install 会被拒；用专用 venv（2026-09-19 实测）
python3 -m venv ~/.venvs/dy-cli && ~/.venvs/dy-cli/bin/pip install dy-cli
ln -sf ~/.venvs/dy-cli/bin/dy ~/.local/bin/dy          # PATH 需含 ~/.local/bin
~/.venvs/dy-cli/bin/playwright install chromium        # 首次必装，否则 login 报 Executable doesn't exist
dy login          # 扫码登录。⚠️ --browser"从浏览器提取"在本机读不到主 Chrome cookie，会自动降级扫码（2026-09-19 实测，扫码一次成功存 65 cookie）
dy search "关键词" --time 一周内 --count 20 --json-output -o out.json
```

- `--sort`：综合 / 最多点赞 / 最新发布；`--time`：不限 / 一天内 / 一周内…；另有 `--type` 视频 / 图集 / 用户
  - ⚠️ `--sort 最多点赞` 2026-09-19 实测返回空数组（2 字节），默认排序与 `--time` 正常；偶发 `maokai_extra` 风控空响应，重试即恢复
- 返回 statistics 字段（点赞/发布时间/评论真实；`play_count` 常为 0，见下方已知限制），可导出 json/csv/yaml；搜索走 API 引擎，发布/互动走 Playwright
  - `-o` 输出文件为纯 item 数组（与 stdout 的 `{ok,data}` 包裹结构不同），解析时注意
- 多账号：`--account u-xxx` + cookie 文件 `~/.dy/cookies/<account>.json`（storage_state JSON）
- ⚠️ Linux 容器内 chromium 指纹会被风控 `verify_check` 打回空结果（老韩AI BATCH34 实测，Mac/Windows 宿主正常）

已知限制：互动字段缺失或为 `0` 只能记为不可用，不能当作真实零；空数组也不能直接证明平台没有相关内容。

### 搜索方案对比

| 方案 | 返回 | 适用 |
|------|------|------|
| `opencli douyin search` | 视频流（rank/desc/author/url/plays/likes/comments/shares，仅 likes 真实） | **第1选**，日常关键词搜索 |
| `dy-cli` | statistics 全字段（点赞/发布时间/播放/评论）+ 排序/时间过滤 | **第2选**，需完整互动数据时（pip 装 + 扫码） |
| `opencli douyin hashtag search` | 话题标签（name/id/view_count） | 选题调研，不返回视频 |
| OpenCLI trace/autofix | 修复当前 adapter | 主命令异常时，最多三次 |
| `opencli browser` 绑定当前标签页 | 当前登录页只读取证 | adapter 持续失败时 |
| 纯 requests 调搜索 API | ❌ | a_bogus 签名校验，不可行 |

## 话题与热点

### 话题热点词

```bash
opencli douyin hashtag hot --keyword "AI" --limit 10 -f json
# 返回：name, id, view_count
```

- `--keyword` 可选，不加则返回全站热点
- 返回的是抖音热榜话题，不是视频搜索结果

### 话题搜索

```bash
opencli douyin hashtag search --keyword "Claude Code" --limit 10 -f json
# 返回：name, id, view_count
```

- 搜索话题标签，用于选题调研和话题关联

### AI 推荐话题

```bash
opencli douyin hashtag suggest --cover <封面URI> -f json
# 根据封面图片推荐关联话题
```

## 发布自动化

### 定时发布（publish）

```bash
opencli douyin publish <video.mp4> \
  --title "标题（≤30字）" \
  --caption "正文内容（≤1000字，支持 #话题）" \
  --cover <封面图片路径> \
  --schedule "2026-05-24T18:15:00" \
  --visibility public \
  --hotspot "AI" \
  --sync_toutiao true \
  -f json
# 返回：status, aweme_id, url, publish_time
```

**关键限制：必须设置定时，且至少 2 小时后、最多 14 天后。不能即时发布。**

参数说明：
- `--title`：视频标题，≤30 字
- `--caption`：正文/描述，≤1000 字，支持 `#话题` 标签
- `--cover`：封面图片路径（不提供时使用视频截帧）
- `--schedule`：定时发布时间（ISO8601 或 Unix 秒）
- `--visibility`：`public`（默认）/ `friends` / `private`
- `--collection`：合集 ID
- `--activity`：活动 ID
- `--poi_id` + `--poi_name`：地理位置
- `--hotspot`：关联热点词
- `--allow_download`：是否允许下载（默认 false）
- `--sync_toutiao`：同步发布到头条（默认 false）
- `--no_safety_check`：跳过内容安全检测（默认 false）

### 保存为草稿（draft）

```bash
opencli douyin draft <video.mp4> \
  --title "标题" \
  --caption "正文" \
  --cover <封面图片路径> \
  -f json
# 返回：status, draft_id
```

- 不需要 `--schedule`，保存到草稿箱后可手动发布或改用 `update` 定时发布
- 适合：先上传视频，再在手机端选封面/加音乐后手动发布

### 获取草稿列表

```bash
opencli douyin drafts -f json
```

### 更新已发布/草稿作品

```bash
opencli douyin update <aweme_id> \
  --caption "新的正文内容" \
  --reschedule "2026-05-25T18:15:00" \
  -f json
```

- 可修改正文和重新设置定时
- 适合：发布前改文案，或调整发布时间

### 发布自动化 vs 手动发布的区别

| 维度 | opencli publish | 手动发布（APP/创作者中心） |
|------|----------------|------------------------|
| **即时性** | ❌ 必须定时（≥2h） | ✅ 可立即发布 |
| **封面** | 上传一张图片或视频截帧 | AI 生成多张封面 + 自定义上传 + 视频帧选择 |
| **背景音乐** | ❌ 不支持 | ✅ 音乐库 + 原声 |
| **视频剪辑** | ❌ 不支持 | ✅ 裁剪/滤镜/特效 |
| **互动设置** | 仅 visibility | 评论管理/合拍/拼接权限 |
| **产品标签** | ❌ | ✅ 电商带货 |
| **合集管理** | 通过 `--collection` | 可创建+管理 |
| **同步头条** | `--sync_toutiao` | 手动勾选 |
| **定时精度** | ISO8601 精确到秒 | 分钟级 |

**实操建议**：
- **推荐流程**：`draft` 上传视频 → 手机端选封面/加音乐 → 手动发布（兼顾自动化和质量）
- **纯自动化流程**：`publish` 定时发布（适合封面对画质要求不高、不需要 BGM 的教程类视频）
- **黄金时段**：定时 18:15，需在当天 16:15 前执行 publish 命令

## 合集与活动

```bash
# 查看合集列表
opencli douyin collections -f json
# 返回：mix_id, name, item_count

# 查看官方活动
opencli douyin activities -f json
```

## opencli 抖音命令速查（1.8.6 共 16 个顶级命令，hashtag 含 hot/search/suggest 3 个子命令）

| 命令 | 用途 | 需登录 | 场景 |
|------|------|--------|------|
| `search` | 关键词搜索视频流 | Browser Bridge | 竞品/选题搜索（首选） |
| `user-videos` | 获取指定用户视频列表 | Browser Bridge | 监测博主更新 |
| `videos` | 获取自己作品列表 | Browser Bridge | 贤德数据分析 |
| `profile` | 获取账号信息 | Browser Bridge | 贤德数据分析 |
| `whoami` | 当前登录账号 | Browser Bridge | 多账号切换确认 |
| `login` | 扫码登录抖音 | Browser Bridge | 首次登录/换号 |
| `stats` | 单个作品数据分析 | Browser Bridge | 贤德数据分析 |
| `hashtag hot` | 话题热点词 | Browser Bridge | 选题调研 |
| `hashtag search` | 话题搜索 | Browser Bridge | 选题调研 |
| `hashtag suggest` | AI推荐话题 | Browser Bridge | 选题辅助 |
| `publish` | 定时发布视频 | Browser Bridge | 发布自动化 |
| `draft` | 上传保存为草稿 | Browser Bridge | 发布流程 |
| `drafts` | 获取草稿列表 | Browser Bridge | 发布管理 |
| `update` | 更新作品信息 | Browser Bridge | 发布后管理 |
| `delete` | 删除作品 | Browser Bridge | 发布后管理 |
| `collections` | 合集列表 | Browser Bridge | 内容组织 |
| `activities` | 官方活动列表 | Browser Bridge | 运营 |
| `location` | 地理位置POI搜索 | Browser Bridge | 地理标签 |
