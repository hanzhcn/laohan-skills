#!/bin/bash
# 单独录制 cheat 评分段
#
# 使用方法：bash cheat_only.sh
# 1. 全屏 Ghostty（Cmd+Enter）
# 2. 跑这个脚本
# 3. 手别碰，等着就行

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/output"
mkdir -p "$OUTPUT_DIR"

SCREEN_INDEX="${1:-3}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
WORK_DIR="/tmp/lupingcli_${TIMESTAMP}"
RAW_FILE="/tmp/cheat_raw_${TIMESTAMP}.mp4"
MP4_FILE="$OUTPUT_DIR/cheat_segment_${TIMESTAMP}.mp4"
SESSION="cheat_${TIMESTAMP}"
mkdir -p "$WORK_DIR"

echo "============================================"
echo "  Cheat 评分单独录制"
echo "============================================"
echo ""
read -p "全屏后按回车开始..."

tmux kill-session -t "$SESSION" 2>/dev/null || true

# 启动录屏
echo "启动录屏..."
ffmpeg -y -f avfoundation -framerate 30 -capture_cursor 0 -i "$SCREEN_INDEX" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  "$RAW_FILE" >/dev/null 2>&1 &
FFMPEG_PID=$!
sleep 3

if ! kill -0 $FFMPEG_PID 2>/dev/null; then
  echo "❌ 录屏启动失败"
  exit 1
fi
echo "✅ 录屏已启动"

# 启动 claude
tmux new-session -d -s "$SESSION" -x 200 -y 50 "cd $WORK_DIR && claude"

# 后台发送器
(
  sleep 20
  tmux send-keys -t "$SESSION" "帮我预测" Enter

  # 等 claude 完成（最多3分钟）
  waited=0
  settled=0
  while [ $waited -lt 180 ]; do
    claude_pid=$(tmux list-panes -t "$SESSION" -F '#{pane_pid}' 2>/dev/null | head -1)
    if [ -n "$claude_pid" ]; then
      child_pid=$(pgrep -P "$claude_pid" -x claude 2>/dev/null || echo "$claude_pid")
      cpu=$(ps -p "$child_pid" -o %cpu= 2>/dev/null | tr -d ' ' || echo "0")
      cpu_int=${cpu%%.*}
      if [ -z "$cpu_int" ] || [ "$cpu_int" -lt 2 ] 2>/dev/null; then
        settled=$((settled + 1))
        if [ $settled -ge 6 ]; then
          echo "  ✓ 评分完成"
          break
        fi
      else
        settled=0
      fi
    fi
    sleep 5
    waited=$((waited + 5))
  done

  # 结尾多留几秒
  sleep 5

  # 退出
  tmux send-keys -t "$SESSION" "/exit" Enter
  sleep 3

  # 停止录屏
  kill $FFMPEG_PID 2>/dev/null
  sleep 2

  # 转1080p
  if [ -f "$RAW_FILE" ]; then
    ffmpeg -y -i "$RAW_FILE" \
      -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
      -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black" \
      -r 30 -movflags faststart \
      "$MP4_FILE" >/dev/null 2>&1

    if [ -f "$MP4_FILE" ]; then
      size=$(du -h "$MP4_FILE" | cut -f1)
      echo ""
      echo "✅ 完成: $MP4_FILE ($size)"
    fi
  fi

  tmux kill-session -t "$SESSION" 2>/dev/null || true
) &

SENDER_PID=$!

echo ""
echo ">>> Claude Code 启动中，自动发「帮我预测」..."
echo ""

tmux attach -t "$SESSION" || true

wait $SENDER_PID 2>/dev/null || true
rm -f "$RAW_FILE"
rm -rf "$WORK_DIR"
echo "最终文件: $MP4_FILE"
