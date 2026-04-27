# B站 / 小红书 / 知乎 / 微信公众号

## B站

下载视频：
```bash
opencli bilibili download <bvid> --output <目录>
# 需要 Browser Bridge（opencli doctor 检查状态）
```

获取字幕：
```bash
opencli bilibili subtitle <bvid> -f json
# 需要登录态（Cookie 命令），部分视频无字幕
```

获取视频信息：
```bash
opencli bilibili video <bvid> -f json
```

注意：B站已拦截 yt-dlp 直接访问（HTTP 412），必须通过 opencli + Browser Bridge。

## 小红书

搜索笔记（返回含 xsec_token 的完整 URL）：
```bash
opencli xiaohongshu search "关键词" --limit 10 -f json
```

下载笔记中的图片/视频：
```bash
opencli xiaohongshu download <note-url-or-xhslink> --output <目录>
# 参数可以是：完整 URL（含 xsec_token）或 xhslink 短链接
# 需要 Browser Bridge
```

获取笔记正文：
```bash
opencli xiaohongshu note <note-url-with-xsec-token> -f json
# 需要完整签名 URL（从 search 结果中获取）
```

获取用户笔记：
```bash
opencli xiaohongshu user <id> -f json
```

典型流程：search → 拿 URL → download 下载图片/视频 或 note 读正文

## 知乎

```bash
opencli zhihu question <id> -f json        # 问答详情
opencli zhihu search "关键词" -f json       # 搜索
opencli zhihu download --url <url>          # 专栏文章导出 Markdown
# 兜底：Jina Reader
```

## 微信公众号

```bash
python3 ~/.agents/skills/web-content-fetcher/scripts/fetch.py <url> --stealth -o <output>
# 兜底：agent-reach → Jina Reader
```
