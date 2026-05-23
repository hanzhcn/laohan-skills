#!/bin/bash
# 真实屏录脚本 v3.1 — tmux send-keys + ffmpeg 录物理屏幕
#
# 原理：
#   1. ffmpeg 后台录物理屏幕（录到的就是你在屏幕上看到的）
#   2. claude 在 tmux 里运行（tmux attach 让画面显示在终端上）
#   3. 后台进程通过 tmux send-keys 发命令（不需要辅助功能权限）
#   4. 监控 claude 进程 CPU 判断完成（连续30秒低CPU=完成）
#
# 使用方法（在 Ghostty 里直接运行）:
#   1. 全屏 Ghostty（Cmd+Enter）
#   2. bash screen_record_v3.sh tutorial_04
#   3. 手别碰，等着就行
#   4. 如果弹出 Gate 确认框，按回车继续
#
# 产出: output/tutorial_XX_screen_YYYYMMDD_HHMMSS.mp4

set -e

TUTORIAL="${1:-tutorial_04}"
SCREEN_INDEX="${2:-3}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/output"
mkdir -p "$OUTPUT_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
WORK_DIR="/tmp/lupingcli_${TIMESTAMP}"
RAW_FILE="/tmp/screen_raw_${TIMESTAMP}.mp4"
MP4_FILE="$OUTPUT_DIR/${TUTORIAL}_screen_${TIMESTAMP}.mp4"
SESSION="rec_${TIMESTAMP}"
mkdir -p "$WORK_DIR"

echo "============================================"
echo "  真实屏录 v3.1: $TUTORIAL"
echo "============================================"
echo ""
echo "准备："
echo "  1. 终端全屏（Cmd+Enter）"
echo "  2. 关掉通知（勿扰模式）"
echo "  3. 录制期间不要操作键盘鼠标"
echo ""
read -p "准备好后按回车开始..."

# 清理旧 tmux 会话
tmux kill-session -t "$SESSION" 2>/dev/null || true

# ============ 第1步：启动 ffmpeg 录屏 ============
echo "启动录屏..."
ffmpeg -y -f avfoundation -framerate 30 -capture_cursor 0 -i "$SCREEN_INDEX" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p \
  "$RAW_FILE" >/dev/null 2>&1 &
FFMPEG_PID=$!
sleep 3

if ! kill -0 $FFMPEG_PID 2>/dev/null; then
  echo "❌ 录屏启动失败，检查屏幕录制权限"
  exit 1
fi
echo "✅ 录屏已启动 (PID: $FFMPEG_PID)"

# ============ 第2步：创建 tmux 会话，启动 claude ============
echo "启动 Claude Code..."
tmux new-session -d -s "$SESSION" -x 200 -y 50 "cd $WORK_DIR && claude"
sleep 5

# ============ 辅助函数 ============
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

# ============ 第3步：后台命令发送器 ============
(
  echo ""
  echo "后台发送器启动，等待 Claude Code..."
  sleep 25

  if [ "$TUTORIAL" = "tutorial_04" ]; then
    echo "开始教程④..."

    # 0-2段：开场静态画面（18秒，口播开场白）
    echo "  → 开场静态画面"
    sleep 18

    # 3段：Agent介绍 + 5段：抓选题
    send_cmd "抓今天的AI精选"
    wait_for_claude "① 抓热点"

    # 7段：写口播稿
    send_cmd "从第二个热点帮我写口播稿"
    wait_for_claude "② 写口播稿"

    # 8段：封面提示词
    send_cmd "生成封面提示词"
    wait_for_claude "③ 封面提示词"

    # 9段：幻灯片
    send_cmd "生成幻灯片图片素材"
    wait_for_claude "④ 幻灯片"

    # 10段：cheat打分
    send_cmd "帮我预测"
    wait_for_claude "⑤ cheat打分"

    # 11段：安装命令演示（口播：npx skills add...）
    echo "  → 安装命令演示（10秒展示）"
    sleep 10

    # 12段：展示产出文件
    send_cmd "ls output/"
    sleep 10

    # 13段：结尾（口播收尾，保持画面）
    echo "  → 结尾静态画面"
    sleep 15

    send_cmd "/exit"
    sleep 5

  elif [ "$TUTORIAL" = "tutorial_05" ]; then
    echo "开始教程⑤..."

    send_cmd "cat ~/.claude/skills/laohan-skillcreator/SKILL.md | head -20"
    sleep 15

    send_cmd "帮我创建一个Skill，功能是把口播稿改成抖音、小红书、公众号三个平台的版本"
    wait_for_claude "① 说需求"

    send_cmd "多平台改写，抖音版口语化300字以内，小红书加emoji，公众号深度长文带小标题"
    wait_for_claude "② 规则"

    send_cmd "多平台改写"
    sleep 5
    send_cmd "你有没有这种感觉，AI工具装了一堆结果每次还是用那两个"
    wait_for_claude "③ 三平台测试"

    send_cmd "抖音版字数不够，帮我加一条自检规则"
    wait_for_claude "④ 调教"

    send_cmd "帮我检查这个Skill"
    wait_for_claude "⑤ 审查"

    send_cmd "/exit"
    sleep 5

  else
    echo "未知教程: $TUTORIAL"
    kill $FFMPEG_PID 2>/dev/null
    exit 1
  fi

  # ============ 停止录屏 ============
  echo ""
  echo "录制完成，停止 ffmpeg..."
  sleep 3
  kill $FFMPEG_PID 2>/dev/null
  sleep 2

  # ============ 转 1080p ============
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

  # 退出 tmux
  tmux kill-session -t "$SESSION" 2>/dev/null || true
) &

SENDER_PID=$!

# ============ 第4步：前台 attach tmux（屏幕上看到的就是录屏画面） ============
echo ""
echo ">>> Claude Code 即将显示"
echo ">>> 屏幕上看到的画面就是录屏画面"
echo ">>> 如果弹出确认框，按回车继续"
echo ""

tmux attach -t "$SESSION" || true

# tmux 退出后
echo ""
echo "Claude Code 已退出"
wait $SENDER_PID 2>/dev/null || true
rm -f "$RAW_FILE"
rm -rf "$WORK_DIR"
echo "最终文件: $MP4_FILE"
