# B站 / 小红书 / 知乎 / 微信公众号 / 微信视频号

## B站

下载视频：
```bash
opencli bilibili download <bvid> --output <目录>
# 需要 Browser Bridge（opencli doctor 检查状态）
```

获取字幕：
```bash
opencli bilibili subtitle <bvid> -f json
# 需要登录态（Cookie 命令），部分视频无字幕
```

获取视频信息：
```bash
opencli bilibili video <bvid> -f json
```

注意：B站已拦截 yt-dlp 直接访问（HTTP 412），必须通过 opencli + Browser Bridge。

## 小红书

搜索笔记（返回含 xsec_token 的完整 URL）：
```bash
opencli xiaohongshu search "关键词" --limit 10 -f json
```

下载笔记中的图片/视频：
```bash
opencli xiaohongshu download <note-url-or-xhslink> --output <目录>
# 参数可以是：完整 URL（含 xsec_token）或 xhslink 短链接
# 需要 Browser Bridge
```

获取笔记正文：
```bash
opencli xiaohongshu note <note-url-with-xsec-token> -f json
# 需要完整签名 URL（从 search 结果中获取）
```

获取用户笔记：
```bash
opencli xiaohongshu user <id> -f json
```

典型流程：search → 拿 URL → download 下载图片/视频 或 note 读正文

## 知乎

```bash
opencli zhihu question <id> -f json        # 问答详情
opencli zhihu search "关键词" -f json       # 搜索
opencli zhihu download --url <url>          # 专栏文章导出 Markdown
# 兜底：Jina Reader
```

## 微信公众号

```bash
python3 ~/.agents/skills/web-content-fetcher/scripts/fetch.py <url> --stealth
# 兜底：agent-reach → Jina Reader
```

**必须用短链接格式**：`https://mp.weixin.qq.com/s/xxxxxxxx`（成功率极高）
- 长链接 `?__biz=&mid=&sn=&poc_token=` 的 poc_token 会过期，触发验证码拦截
- 短链接是永久映射，无 token 时效问题

## 微信视频号

基于 MITM 代理拦截微信视频号视频流，使用 `wx_video_download` 二进制（来自 [hanzhcn/wx_channels_download](https://github.com/hanzhcn/wx_channels_download)）。

### 工作原理

1. 启动本地 HTTPS 代理（系统代理端口 2023，API 端口 2022）
2. 拦截微信客户端的视频号请求
3. 在视频号页面注入下载按钮
4. 视频流经代理时自动解密（WechatSphDecrypt）

### 启动方式

**Mac（GUI）：**
- 双击 DMG 里的「视频号下载.app」（首次运行会引导装证书）
- 以后直接双击 app 启动

**Mac（命令行）：**
```bash
~/.local/bin/视频号下载  # wrapper 脚本，内部处理 sudo + 自动下载 + 装证书
```

**Windows：**
- 双击桌面「视频号下载」快捷方式（安装包自动生成）
- 安装后直接用，不需要命令行

### 注意事项

- **必须安装 CA 证书**（SunnyRoot.cer → 系统信任存储），否则代理无法解密 HTTPS
- Mac 证书位置：`/Library/Keychains/System.keychain`，需 sudo
- Windows 证书：`certutil -addstore Root SunnyRoot.cer`，需管理员
- **重启后需重新运行**——是代理进程，不是系统服务
- 打开微信→视频号→点任意视频，页面会出现下载按钮
- 二进制文件托管在自己 fork 的仓库 `hanzhcn/wx_channels_download`，不依赖第三方

### 安装包分发

下载地址：https://github.com/hanzhcn/laohan-skills/releases/tag/v1.1.0

- Mac：`weixin-video-download-mac.dmg`（磁盘映像，打开后里面有 .app 启动器 + 安装.sh + 二进制 + 证书）
- Windows：`weixin-video-download-windows.exe`（NSIS 安装器，安装后自动生成桌面快捷方式）
- 品牌：寒武纪AI

用户指引：
- Mac：下载 DMG → 打开 → 双击「视频号下载.app」即可启动（首次会引导装证书）
- Windows：下载 EXE → 运行安装 → 双击桌面「视频号下载」快捷方式启动

### 关键警告

- 视频号没有 API/CLI 工具（opencli 不支持），只能走 MITM 代理
- yt-dlp / Jina / Scrapling 全部无法获取视频号内容
- 代理只能抓微信 PC 客户端的视频号，不能抓手机端
