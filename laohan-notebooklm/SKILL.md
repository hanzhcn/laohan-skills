---
name: laohan-notebooklm
description: 口播稿一键生成幻灯片图片。接收 script.md 路径，通过 NotebookLM 生成中文幻灯片，PDF 转图片输出到桌面文件夹供剪映使用。使用场景：(1) 用户说"生成PPT"、"生成幻灯片"、"做PPT图片" (2) 用户提供口播稿 script.md 要求生成视觉素材 (3) 口播稿视频制作需要背景幻灯片。触发词：/laohan-notebooklm
---

# 口播稿幻灯片生成

把口播稿一键生成幻灯片图片，输出到桌面文件夹，剪映直接用。

## 使用

```
/laohan-notebooklm <script.md路径>
```

## 流程

每步可能 SSL 超时，加重试（最多3次，间隔3秒）。

### 0. 准备

- 从 script.md 路径提取标题（取 `task_YYYYMMDD_` 后面的部分，下划线转空格）
- `mkdir -p ~/Desktop/"<标题>_slides"`
- `cp "$SCRIPT" ~/Desktop/"<标题>_slides/script.md"`
- 确认网络可访问 NotebookLM（REGION_NOT_SUPPORTED 时需切换网络环境）

### 1. 创建笔记本

```bash
nlm notebook create "<标题>PPT"
```

记录返回的 NOTEBOOK_ID。

### 2. 上传素材

```bash
nlm source add NOTEBOOK_ID --file ~/Desktop/"<标题>_slides/script.md"
```

只上传口播稿原文，不加任何提示词或引导注释。

### 3. 触发生成

```bash
echo "y" | nlm slides create NOTEBOOK_ID --language zh-CN --length default
```

`--language zh-CN` 是关键，漏了生成英文版。

### 4. 轮询+下载+转图片（后台脚本）

必须用一个后台脚本一次性完成轮询、下载、转图片。用 `Bash` 工具的 `run_in_background: true` 执行：

```bash
NB="NOTEBOOK_ID"
TITLE="<标题>"
OUTPUT=~/Desktop/"${TITLE}_slides"

for i in $(seq 1 20); do
  status=$(nlm studio status "$NB" 2>&1 | grep -o '"status": "[^"]*"' | head -1)
  echo "[$i] $status"
  echo "$status" | grep -q "completed" && break
  sleep 30
done

for i in 1 2 3; do
  nlm download slide-deck "$NB" -o "${OUTPUT}/${TITLE}.pdf" 2>&1 && break
  sleep 5
done

pdftoppm -png -r 200 "${OUTPUT}/${TITLE}.pdf" "${OUTPUT}/slide"
echo "Done: $(ls "${OUTPUT}"/slide-*.png | wc -l | tr -d ' ') slides"
```

后台完成后读取输出确认图片数量，告知用户。

## 输出

```
~/Desktop/<标题>_slides/
├── script.md
├── <标题>.pdf
├── slide-01.png
├── slide-02.png
└── ...
```

## 关键原则

- 不加提示词：只上传口播稿原文，NotebookLM 自由发挥效果最好
- 不加布局要求：布局在剪映里调整
- 所有输出放桌面文件夹：用完用户自己删除

## 前置依赖

- nlm CLI v0.5.25（`pip install notebooklm-mcp-cli`）
- poppler（`brew install poppler`）
