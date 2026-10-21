#!/bin/bash
# 微信视频号下载 — 输入就启动（仅 macOS）
# 自动查上游最新版 → 下载二进制 → 装 SunnyNet 证书 → 启动 MITM 代理
# 用法：bash wx-video-download.sh（需输入一次 sudo 密码）
# 前提：微信 PC 客户端已登录；代理起来后在视频号播放页点下载按钮
set -euo pipefail

BIN_DIR="$HOME/.local/bin"
BIN="$BIN_DIR/wx_video_download"
VER_FILE="$BIN_DIR/.wxvd_version"
CERT_NAME="SunnyNet"
CERT_URL="https://raw.githubusercontent.com/ltaoo/wx_channels_download/main/pkg/certificate/certs/SunnyNet.cer"
PLAT="darwin_arm64"
[[ "$(uname -m)" == "x86_64" ]] && PLAT="darwin_x86_64"
REPO="ltaoo/wx_channels_download"
FALLBACK_VERSION="v260907"  # GitHub API 查询失败时兜底

# 仅 macOS（上游无 Linux 包，security 命令也是 macOS 专属）
if [[ "$(uname -s)" != "Darwin" ]]; then
    echo "✗ 本脚本仅支持 macOS。Windows 请从 ${REPO} releases 下载 zip 手动安装。"
    exit 1
fi

mkdir -p "$BIN_DIR"

# 查上游最新版本（匿名 API，失败用兜底版本）
VERSION=$(curl -sf --connect-timeout 10 "https://api.github.com/repos/${REPO}/releases/latest" | grep -o '"tag_name": *"[^"]*"' | head -1 | cut -d'"' -f4 || true)
[ -z "$VERSION" ] && VERSION="$FALLBACK_VERSION"

# 已在运行？（pgrep 仅提示，不代表代理健康；失效重跑前先 sudo pkill）
if pgrep -f "wx_video_download" >/dev/null 2>&1; then
    echo "已有进程在跑。播放页无下载按钮 = 版本过期，先执行: sudo pkill -f wx_video_download && sleep 3 && 重跑本脚本"
    exit 0
fi

LOCAL_VER=$(cat "$VER_FILE" 2>/dev/null || echo "none")

# 下载/升级：无二进制或版本落后（重跑即升级，旧版自动备份）
if [ ! -f "$BIN" ] || [ "$LOCAL_VER" != "$VERSION" ]; then
    echo "获取 ${VERSION} 中（本地: ${LOCAL_VER}）..."
    TMPDIR_DL=$(mktemp -d)
    trap 'rm -rf "$TMPDIR_DL"' EXIT
    URL="https://github.com/${REPO}/releases/download/${VERSION}/wx_video_download_${VERSION}_${PLAT}.zip"
    curl -fL --connect-timeout 15 -o "$TMPDIR_DL/wx_video.zip" "$URL" --progress-bar ||
        curl -fL --connect-timeout 15 -o "$TMPDIR_DL/wx_video.zip" "https://ghfast.top/$URL" --progress-bar
    unzip -o "$TMPDIR_DL/wx_video.zip" -d "$TMPDIR_DL/un" >/dev/null
    [ -f "$BIN" ] && cp "$BIN" "$BIN.bak-${LOCAL_VER}"   # 旧版备份
    cp "$TMPDIR_DL/un/wx_video_download" "$BIN"
    chmod +x "$BIN"
    echo "$VERSION" > "$VER_FILE"
    echo "✓ 二进制就绪：${VERSION}"
fi

# 证书没装？装（上游证书文件名为 SunnyNet.cer）
if ! sudo security find-certificate -c "$CERT_NAME" /Library/Keychains/System.keychain >/dev/null 2>&1; then
    echo "安装证书（需要输入密码）..."
    TMPDIR_CERT=$(mktemp -d)
    [ -d "$TMPDIR_DL" ] || { TMPDIR_DL="$TMPDIR_CERT"; trap 'rm -rf "$TMPDIR_CERT"' EXIT; }
    curl -fsL --connect-timeout 15 "$CERT_URL" -o "$TMPDIR_CERT/SunnyNet.cer" ||
        curl -fsL --connect-timeout 15 "https://ghfast.top/$CERT_URL" -o "$TMPDIR_CERT/SunnyNet.cer"
    [ -s "$TMPDIR_CERT/SunnyNet.cer" ] || { echo "✗ 证书下载为空，中止"; exit 1; }
    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$TMPDIR_CERT/SunnyNet.cer"
    rm -rf "$TMPDIR_CERT"
    echo "✓ 证书安装完成"
fi

# 启动
echo "启动中（${VERSION}）..."
sudo -v  # 先请求密码建缓存（nohup 后台的 sudo 弹不出密码提示）
nohup sudo "$BIN" > /tmp/weixin-video.log 2>&1 &
sleep 3
if pgrep -f "wx_video_download" >/dev/null 2>&1; then
    echo "OK！打开微信→视频号→点视频即可下载（文件存 ~/Downloads）"
else
    echo "✗ 启动失败，查看日志: cat /tmp/weixin-video.log"
    exit 1
fi
