# YouTube 下载方法

## 下载视频

被 bot 检测拦截（HTTP 429/403）时**加 `--cookies-from-browser <浏览器>`**（chrome/chromium/firefox/edge/safari 按用户实际浏览器选）——无 cookie 也可能成功，按报错决定，不必默认全加：

```bash
yt-dlp -o "%(title)s.%(ext)s" <url>                       # 先裸跑
yt-dlp --cookies-from-browser chrome -o "%(title)s.%(ext)s" <url>   # 被拦时加 cookie
```

YouTube 完整支持需 yt-dlp 完整依赖 + JS runtime（2026 起部分视频需 EJS 解密）：`pip3 install -U "yt-dlp[default]"`，详见 [官方 dependencies](https://github.com/yt-dlp/yt-dlp#dependencies)。

## 获取字幕

**首选 opencli**（直接返回干净文本，无需清洗）：
```bash
opencli youtube transcript <url> --lang en --mode grouped -f plain
```

备选 yt-dlp（返回 VTT 文件，需要清洗）：
```bash
yt-dlp --cookies-from-browser chrome --write-auto-subs --sub-lang en --skip-download -o <prefix> <url>
python3 ~/.openclaw/workspace-shared/tools/clean_vtt.py <input>.vtt <output>.txt   # ⚠️ 本机资产，外部机器无此脚本时改用 ffmpeg 或 sed 手动清洗 VTT（去时间轴/序号行）
```

## 提取音频

```bash
yt-dlp --cookies-from-browser chrome -x --audio-format mp3 -o "output.%(ext)s" <url>
```

## 其他 opencli 命令

```bash
opencli youtube video <url> -f json      # 视频元数据（标题/播放量/描述）
opencli youtube search "关键词" -f json   # 搜索
opencli youtube comments <url> -f json    # 评论
opencli youtube channel <id> -f json      # 频道信息
```
