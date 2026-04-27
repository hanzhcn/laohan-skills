# YouTube 下载方法

## 下载视频

**必须加 `--cookies-from-browser chrome`**，否则报 bot 检测拦截。

```bash
yt-dlp --cookies-from-browser chrome -o "%(title)s.%(ext)s" <url>
```

## 获取字幕

**首选 opencli**（直接返回干净文本，无需清洗）：
```bash
opencli youtube transcript <url> --lang en --mode grouped -f plain
```

备选 yt-dlp（返回 VTT 文件，需要清洗）：
```bash
yt-dlp --cookies-from-browser chrome --write-auto-subs --sub-lang en --skip-download -o <prefix> <url>
python3 ./tools/clean_vtt.py <input>.vtt <output>.txt
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
