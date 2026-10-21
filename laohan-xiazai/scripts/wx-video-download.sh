#!/bin/bash
# 微信视频号下载 — 输入就启动（Mac）
# 自动查上游最新版 → 下载二进制 → 装 SunnyNet 证书 → 启动 MITM 代理
# 用法：bash wx-video-download.sh（需输入一次 sudo 密码）
# 前提：微信 PC 客户端已登录；代理起来后在视频号播放页点下载按钮

BIN="$HOME/.local/bin/wx_video_download"
CERT_NAME="SunnyNet"
PLAT="darwin_arm64"
[[ "$(uname -m)" == "x86_64" ]] && PLAT="darwin_x86_64"
REPO="ltaoo/wx_channels_download"
FALLBACK_VERSION="v260907"  # GitHub API 查询失败时兜底

# 查上游最新版本（匿名 API，失败用兜底版本）
VERSION=$(curl -s --connect-timeout 10 "https://api.github.com/repos/${REPO}/releases/latest" | grep -o '"tag_name": *"[^"]*"' | head -1 | cut -d'"' -f4)
[ -z "$VERSION" ] && VERSION="$FALLBACK_VERSION"
URL="https://github.com/${REPO}/releases/download/${VERSION}/wx_video_download_${VERSION}_${PLAT}.zip"

# 已在运行？
if pgrep -f "wx_video_download" >/dev/null 2>&1; then
    echo "已在运行中，打开微信→视频号→点视频即可下载"
    exit 0
fi

# 没有二进制？下载（直连失败自动换 ghfast.top 镜像，外部/国内网络兜底）
if [ ! -f "$BIN" ]; then
    echo "首次使用，下载 ${VERSION} 中..."
    curl -L --connect-timeout 15 -o /tmp/wx_video.zip "$URL" --progress-bar ||
        curl -L --connect-timeout 15 -o /tmp/wx_video.zip "https://ghfast.top/$URL" --progress-bar
    unzip -o /tmp/wx_video.zip -d /tmp/wx_video_tmp >/dev/null
    cp /tmp/wx_video_tmp/wx_video_download "$BIN"
    chmod +x "$BIN"
    rm -rf /tmp/wx_video.zip /tmp/wx_video_tmp
    echo "下载完成"
fi

# 证书没装？装
if ! sudo security find-certificate -c "$CERT_NAME" /Library/Keychains/System.keychain >/dev/null 2>&1; then
    echo "安装证书（需要输入密码）..."
    curl -sL --connect-timeout 15 "https://github.com/${REPO}/releases/download/${VERSION}/SunnyRoot.cer" -o /tmp/SunnyRoot.cer ||
        curl -sL --connect-timeout 15 "https://ghfast.top/https://github.com/${REPO}/releases/download/${VERSION}/SunnyRoot.cer" -o /tmp/SunnyRoot.cer
    sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain /tmp/SunnyRoot.cer
    rm -f /tmp/SunnyRoot.cer
    echo "证书安装完成"
fi

# 启动
echo "启动中（${VERSION}）..."
sudo -v  # 先请求密码建缓存（nohup 后台的 sudo 弹不出密码提示）
nohup sudo "$BIN" > /tmp/weixin-video.log 2>&1 &
sleep 2
if pgrep -f "wx_video_download" >/dev/null 2>&1; then
    echo "OK！打开微信→视频号→点视频即可下载（文件存 ~/Downloads）"
else
    echo "启动失败，查看日志: cat /tmp/weixin-video.log"
fi
