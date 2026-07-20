#!/bin/bash
clear
echo "╔══════════════════════════════════════╗"
echo "║    视频号下载 - laohanAI             ║"
echo "╚══════════════════════════════════════╝"
echo ""

# 清理可能存在的 root 属主 app.log（旧版 admin 启动残留会挡住启动）
if [ -f "$HOME/.local/bin/app.log" ] && [ ! -w "$HOME/.local/bin/app.log" ]; then
    echo "清理旧日志文件（需要密码）..."
    sudo rm -f "$HOME/.local/bin/app.log"
fi

# 检查是否已在运行
if pgrep -f "wx_video_download" >/dev/null 2>&1; then
    echo "✓ 已在运行，打开微信 -> 视频号 -> 点视频即可下载"
    echo ""
    read -n 1 -s -r -p "按任意键关闭此窗口..."
    exit 0
fi

echo "启动视频号下载代理（需要密码设置系统代理）..."
echo "启动后请勿关闭此窗口，直到下载完成。"
echo ""
sudo "$HOME/.local/bin/wx_video_download"
