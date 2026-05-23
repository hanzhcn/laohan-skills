#!/bin/bash
# 录屏模板（CLI+浏览器混合） — laohan-luping 生成
#
# 使用方法：
#   bash record_<name>.sh [屏幕索引，默认3]
#
# 全屏终端后运行，手别碰，Gate 确认框按回车。

set -e

RECORD_NAME="<NAME>"
SCREEN_INDEX="${1:-3}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/output"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
WORK_DIR="/tmp/luping_${TIMESTAMP}"
RAW_FILE="/tmp/screen_raw_${TIMESTAMP}.mp4"
MP4_FILE="$OUTPUT_DIR/${RECORD_NAME}_${TIMESTAMP}.mp4"
SESSION="rec_${TIMESTAMP}"
mkdir -p "$WORK_DIR"

BROWSER_SCRIPT="$SCRIPT_DIR/browser_segment.js"

echo "============================================"
echo "  录屏: $RECORD_NAME"
echo "============================================"
echo ""
echo "准备："
echo "  1. 终端全屏"
echo "  2. 开勿扰模式"
echo "  3. 录制期间不要操作键盘鼠标"
echo ""
read -p "准备好后按回车开始..."

tmux kill-session -t "$SESSION" 2>/dev/null || true

# 录屏启动
echo "启动录屏（屏幕 $SCREEN_INDEX）..."
ffmpeg -y -f avfoundation -framerate 30 -capture_cursor 0 -i "$SCREEN_INDEX" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  "$RAW_FILE" >/dev/null 2>&1 &
FFMPEG_PID=$!
sleep 3

if ! kill -0 $FFMPEG_PID 2>/dev/null; then
  echo "❌ 录屏启动失败，检查屏幕录制权限或屏幕索引"
  exit 1
fi
echo "✅ 录屏已启动 (PID: $FFMPEG_PID)"

# CLI 段支持：如有 CLI 段则启动 tmux + claude
START_CLI="${START_CLI:-1}"

if [ "$START_CLI" = "1" ]; then
  echo "启动 Claude Code..."
  tmux new-session -d -s "$SESSION" -x 200 -y 50 "cd $WORK_DIR && claude"
  sleep 5
fi

# 辅助函数
send_cmd() {
  tmux send-keys -t "$SESSION" "$1" Enter
}

wait_for_claude() {
  local label="${1:-等待}"
  local waited=0
  local max_wait=300
  local settled=0

  echo "  → $label 开始"
  sleep 10
  waited=10

  while [ $waited -lt $max_wait ]; do
    local claude_pid=$(tmux list-panes -t "$SESSION" -F '#{pane_pid}' 2>/dev/null | head -1)
    if [ -n "$claude_pid" ]; then
      local child_pid=$(pgrep -P "$claude_pid" -x claude 2>/dev/null || echo "$claude_pid")
      local cpu=$(ps -p "$child_pid" -o %cpu= 2>/dev/null | tr -d ' ' || echo "0")
      local cpu_int=${cpu%%.*}

      if [ -z "$cpu_int" ] || [ "$cpu_int" -lt 2 ] 2>/dev/null; then
        settled=$((settled + 1))
        if [ $settled -ge 6 ]; then
          echo "  ✓ $label 完成 (${waited}s)"
          sleep 3
          return 0
        fi
      else
        settled=0
      fi
    else
      echo "  ⚠ tmux 会话未找到"
      sleep 5
      return 0
    fi

    sleep 5
    waited=$((waited + 5))
    if [ $((waited % 60)) -eq 0 ]; then
      echo "  ...$label 进行中 (${waited}s)"
    fi
  done

  echo "  ⚠ $label 超时 (5min)"
  return 0
}

# 浏览器段函数
browser_run() {
  local json_file="$1"
  echo "  → 浏览器段: $json_file"
  tmux detach-client -s "$SESSION" 2>/dev/null || true
  sleep 1
  node "$BROWSER_SCRIPT" "$json_file"
  if tmux has-session -t "$SESSION" 2>/dev/null; then
    sleep 1
  fi
}

browser_goto() {
  local url="$1"
  local wait_ms="${2:-3000}"
  echo "  → 浏览器打开: $url"
  tmux detach-client -s "$SESSION" 2>/dev/null || true
  sleep 1
  node -e "
    const { chromium } = require('playwright');
    (async () => {
      const b = await chromium.launch({ headless: false });
      const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
      await p.goto('$url', { waitUntil: 'domcontentloaded', timeout: 15000 });
      await p.waitForTimeout($wait_ms);
      await b.close();
    })();
  "
}

# 后台命令发送器
(
  echo ""
  echo "后台发送器启动..."
  sleep 25

  # ============ COMMANDS START ============
  # 以下内容由 laohan-luping 根据口播稿自动生成
  # 支持 send_cmd / wait_for_claude / browser_run / browser_goto / sleep

  ### PLACEHOLDER — 命令序列由 skill 生成时替换此区域 ###

  # ============ COMMANDS END ============

  # 退出 tmux
  if tmux has-session -t "$SESSION" 2>/dev/null; then
    tmux send-keys -t "$SESSION" "/exit" Enter
    sleep 5
  fi

  # 停止录屏
  echo ""
  echo "录制完成，停止 ffmpeg..."
  sleep 3
  kill $FFMPEG_PID 2>/dev/null
  sleep 2

  # 转 1080p
  if [ -f "$RAW_FILE" ]; then
    echo "转换 1080p..."
    ffmpeg -y -i "$RAW_FILE" \
      -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
      -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black" \
      -r 30 -movflags faststart \
      "$MP4_FILE" >/dev/null 2>&1

    if [ -f "$MP4_FILE" ]; then
      size=$(du -h "$MP4_FILE" | cut -f1)
      duration=$(ffprobe -v quiet -show_format "$MP4_FILE" 2>/dev/null | grep duration | head -1 | cut -d= -f2)
      echo ""
      echo "============================================"
      echo "  ✅ 完成！"
      echo "  文件: $MP4_FILE"
      echo "  大小: $size"
      echo "  时长: ${duration}s"
      echo "============================================"
    fi
  fi

  tmux kill-session -t "$SESSION" 2>/dev/null || true
) &

SENDER_PID=$!

# 前台 attach（只有 CLI 段才需要）
if [ "$START_CLI" = "1" ]; then
  echo ""
  echo ">>> Claude Code 即将显示"
  echo ">>> 屏幕上看到的画面就是录屏画面"
  echo ">>> 如果弹出确认框，按回车继续"
  echo ""

  tmux attach -t "$SESSION" || true
fi

echo ""
echo "录制流程结束"
wait $SENDER_PID 2>/dev/null || true
rm -f "$RAW_FILE"
rm -rf "$WORK_DIR"
echo "最终文件: $MP4_FILE"
