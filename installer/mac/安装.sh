#!/bin/bash
clear
echo "╔══════════════════════════════════════╗"
echo "║    视频号下载 — laohanAI             ║"
echo "╚══════════════════════════════════════╝"
echo ""

BIN="$HOME/.local/bin/wx_video_download"
CERT_NAME="SunnyNet"

# 复制二进制
mkdir -p "$HOME/.local/bin"
cp "$(dirname "$0")/wx_video_download" "$BIN"
chmod +x "$BIN"
echo "✓ 程序已安装"

# 安装证书
if ! sudo security find-certificate -c "$CERT_NAME" /Library/Keychains/System.keychain >/dev/null 2>&1; then
    echo "安装证书（需要输入密码）..."
    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$(dirname "$0")/SunnyRoot.cer"
    echo "✓ 证书已安装"
else
    echo "✓ 证书已存在"
fi

echo ""
echo "╔══════════════════════════════════════╗"
echo "║          安装完成！                   ║"
echo "╠══════════════════════════════════════╣"
echo "║  使用：双击「视频号下载.app」启动     ║"
echo "║  然后：微信→视频号→点视频即可下载     ║"
echo "╠══════════════════════════════════════╣"
echo "║  关注「laohanAI」获取更多AI工具       ║"
echo "╚══════════════════════════════════════╝"
