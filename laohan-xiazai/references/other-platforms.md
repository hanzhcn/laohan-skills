# opencli 全平台能力总览（Xiaohongshu / B站 / 知乎 / 微博 / 贴吧 / 头条 / 微信 / 视频号等）

> 2026-07-08 实测 `opencli list`（175 个适配器，版本 1.8.6）。本文件只收录与内容/社交/资讯相关的平台，剔除 12306/booking/binance 等非内容站。
> ⚠️ opencli 不止"下载/搜索"，大量平台带 `[write]` 能力（发评论/关注/点赞/发布/回复）。MediaCrawler 只抓不写，opencli 在评论能力上是它超集（详见文末对照）。
> 升级方法（nvm node 22 绝对路径，不用 brew node）：`/Users/hanzhmacbookair/.nvm/versions/node/v22.22.0/bin/npm install -g @jackwener/opencli@latest`。本地已是 1.8.6 = npm 最新时无需升级。

## Cookie/登录态要求

带 `[cookie]` 的命令需 Browser Bridge 运行（`opencli doctor` 3 项全绿）；带 `[write]` 的命令通常需先 `opencli <platform> login` 建立登录态。`[public]`/`[read]` 公开 API 无需登录。

---

## 小红书 / Rednote（xiaohongshu = 国内版，rednote = 国际版，能力相近）

```bash
opencli xiaohongshu search "关键词" --limit 10 -f json      # 搜索笔记（返回含 xsec_token 的完整 URL）
opencli xiaohongshu note <note-url-with-xsec-token> -f json  # 笔记正文+互动数据（需 search 拿签名 URL）
opencli xiaohongshu download <note-url-or-xhslink> --output <目录>  # 下载图片/视频（需 Browser Bridge）
opencli xiaohongshu comments <note-id> -f json               # [read] 评论（支持楼中楼子回复）
opencli xiaohongshu user <id> -f json                        # 用户公开笔记
opencli xiaohongshu creator-notes [options] -f json          # 创作者笔记列表+数据（原上限10，用 creator-notes-all 突破）
opencli xiaohongshu creator-profile                          # 创作者账号信息（粉丝/获赞/等级）
opencli xiaohongshu creator-stats                            # 创作者数据总览（含每日趋势）
opencli xiaohongshu feed/liked/saved/notifications           # 推荐/赞过/收藏/通知
# [write] publish（发图文）/ delete-note / follow / unfollow / ask（AI问答）/ draft-*
```

典型流程：search → 拿签名 URL → note 读正文 / download 下素材 / comments 读评论

## B站（bilibili）

```bash
opencli bilibili download <bvid> --output <目录>             # 下载视频（需 yt-dlp + Browser Bridge）
opencli bilibili video <bvid> -f json                        # 视频元数据（标题/作者/时长/数据）
opencli bilibili subtitle <bvid> -f json                     # 字幕（需登录态）
opencli bilibili summary <bvid>                              # 官方 AI 总结（含分段大纲+时间戳）
opencli bilibili comments <bvid> -f json                     # [read] 评论（官方 API；--parent <rpid> 读楼中楼）
opencli bilibili comment <bvid> <message>                    # [write] 发表评论或回复（@用户 解析为真实提及）
opencli bilibili search <query> -f json                      # 搜视频/用户
opencli bilibili user-videos <uid> / following <uid> / feed [uid] / dynamic / history / hot / ranking
# [write] follow / unfollow / favorite
```

⚠️ B站已拦截 yt-dlp 直接访问（HTTP 412），必须 opencli + Browser Bridge。

## 知乎（zhihu）

```bash
opencli zhihu question <id> -f json          # 问答详情+回答
opencli zhihu answer-detail <id> -f json     # 单个回答完整内容
opencli zhihu answer-comments <id> -f json   # [read] 回答评论列表
opencli zhihu comment <target> <text>        # [write] 在回答/文章下发顶级评论
opencli zhihu answer <target> <text>         # [write] 回答问题
opencli zhihu search <query> / hot / recommend / user <user>
opencli zhihu user-answers <user> / user-articles <user> / pins <user> / followers / following
opencli zhihu collection(s) / download --url <url>   # 收藏夹（需登录）/ 专栏导出 Markdown
# [write] like / favorite / follow
```

## 微博（weibo）

```bash
opencli weibo search <keyword> -f json       # 搜索微博
opencli weibo post <id> -f json              # 单条微博
opencli weibo comments <id> -f json          # [read] 微博评论
opencli weibo user <id> / user-posts <id>    # 用户资料 / 用户微博（可按日期过滤）
opencli weibo feed / hot / favorites / me
opencli weibo publish <text>                 # [write] 立即发微博
opencli weibo delete <id>                    # [write] 删除自己微博
```

## 贴吧（tieba）

```bash
opencli tieba hot                            # 热门话题
opencli tieba search <keyword>               # 跨贴吧搜帖
opencli tieba posts <forum>                  # 某贴吧帖子列表
opencli tieba read <id>                      # 帖子详情+楼层（含回复）
```

## 今日头条（toutiao）

```bash
opencli toutiao hot                          # 首页热榜（公开 API，无需登录）
opencli toutiao articles                     # 头条号创作者后台文章列表+数据（需登录）
```

## 微信公众号（weixin）

```bash
opencli weixin search <query>                # 搜狗微信搜索公众号文章（搜到链接后用 download 取正文）
opencli weixin download                      # [read] 公众号文章导出 Markdown（优于 fetch.py，优先用这个）
opencli weixin create-draft <content>        # [write] 创建公众号图文草稿
opencli weixin drafts                        # 草稿箱列表
```

⚠️ 公众号文章**优先用 `opencli weixin download`**，fetch.py/agent-reach 是降级。必须短链接格式 `https://mp.weixin.qq.com/s/xxx`，长链接 poc_token 过期触发验证码。

## 微信视频号（wechat-channels + wx_video_download 双路径）

**发布**（opencli）：
```bash
opencli wechat-channels publish <video>      # [write] 发布视频到视频号
opencli wechat-channels whoami               # 登录态确认
```

**下载别人视频**（MITM 代理，opencli 不支持下载，只能 wx_video_download）：

基于 MITM 代理拦截微信视频号视频流，使用 `wx_video_download` 二进制（来自 [hanzhcn/wx_channels_download](https://github.com/hanzhcn/wx_channels_download)）。

### 工作原理
1. 启动本地 HTTPS 代理（系统代理端口 2023，API 端口 2022）
2. 拦截微信客户端的视频号请求
3. 在视频号页面注入下载按钮
4. 视频流经代理时自动解密（WechatSphDecrypt）

### 启动方式
**Mac（GUI）**：双击 DMG 里的「视频号下载.app」（首次引导装证书）
**Mac（命令行）**：`~/.local/bin/视频号下载`（wrapper，内部处理 sudo + 自动下载 + 装证书）
**Windows**：双击桌面「视频号下载」快捷方式

### 注意事项
- **必须安装 CA 证书**（SunnyRoot.cer → 系统信任存储），否则代理无法解密 HTTPS。Mac 位置 `/Library/Keychains/System.keychain` 需 sudo；Windows `certutil -addstore Root SunnyRoot.cer` 需管理员
- **重启后需重新运行**——是代理进程，不是系统服务
- 打开微信→视频号→点任意视频，页面出现下载按钮
- 代理只能抓微信 PC 客户端视频号，不能抓手机端
- yt-dlp / Jina / Scrapling 全部无法获取视频号内容

### 安装包分发
下载：https://github.com/hanzhcn/laohan-skills/releases/tag/v1.2.0
- Mac：`weixin-video-download-mac.dmg`
- Windows：`weixin-video-download-windows.exe`（NSIS 安装器，自动生成桌面快捷方式）
- 品牌：laohanAI

---

## 其他内容平台（opencli 已覆盖，按需用）

| 平台 | 命令 | 能力要点 |
|------|------|---------|
| **即刻（jike）** | `opencli jike feed/post/search/topic/user` | `[read]` post 含评论；`[write]` comment（发评论）/create（发动态）/like/repost |
| **知识星球（zsxq）** | `opencli zsxq dynamics/groups/topics/topic/search` | topic 含评论；需登录 |
| **雪球（xueqiu）** | `opencli xueqiu comments <symbol>` 等 | `[read]` 股票讨论评论 + 行情/K线/自选股/持仓 |
| **豆瓣（douban）** | `opencli douban search/subject/movie-hot/top250/marks/reviews` | 电影/图书/音乐，个人标记导出 |
| **小宇宙（xiaoyuzhou）** | `opencli xiaoyuzhou episode/podcast/transcript/download` | 播客音频下载+转录 |
| **Pixiv** | `opencli pixiv search/ranking/illusts/detail/download` | 插画搜索/下载，需登录 |
| **微信读书（weread）** | `opencli weread book/ai-outline/book-search` | 书籍详情+AI大纲+书内搜索 |
| **Substack** | `opencli substack feed/publication/search` | Newsletter 文章 |
| **Medium** | `opencli medium feed/search/tag/user` | 文章搜索/Feed |
| **什么值得买（smzdm）** | `opencli smzdm search <query>` | 好价搜索 |

> 完整 175 平台清单：`opencli list`。新平台高频加入，命令失败时 `opencli <platform> --help` 查最新。

---

## opencli vs MediaCrawler 能力对照

MediaCrawler（55k star，NON-COMMERCIAL LEARNING LICENSE，**禁止商业用途**）核心能力：多平台关键词搜索、指定帖子爬取、**二级评论爬取**、创作者主页抓取、登录态缓存、IP代理池、评论词云。**只抓不写，无发评论/发布能力。**

| 能力 | MediaCrawler | opencli | 判断 |
|------|-------------|---------|------|
| 评论 read（含楼中楼） | 7平台（xhs/抖音/B站/快手/微博/贴吧/知乎） | 8平台（**多了** jike/zsxq/xueqiu，**少了快手**） | opencli 基本超集 |
| 评论 write（发评论/回复） | ❌ 无 | 3平台（bilibili/zhihu/jike） | opencli 独有 |
| 发布/关注/点赞 | ❌ 无 | 全平台普遍支持 | opencli 独有 |
| 创作者数据 | ✅ | ✅（xhs creator-*/douyin stats） | 平 |
| IP代理池/断点续爬 | ✅ | ❌ | MediaCrawler 独有（批量场景） |
| 快手 | ✅ | ❌ | **唯一真缺口** |
| License | 禁商业 | MIT 类 | opencli 无限制 |

**结论**：MediaCrawler 评论采集能力 opencli 已覆盖且更强（多 write）。
- ✅ 不装 MediaCrawler（license 禁商业 + 只抓不写 + opencli 更强）
- ⚠️ 唯一真缺口 = **快手**（opencli 无，laohan-xiazai 无），需单独调研补丁
- 批量评论/批量主页采集属"爬虫框架"范畴，laohan-xiazai 定位是按需获取，不在此 skill 内做（见 SKILL.md「不适用场景」）
