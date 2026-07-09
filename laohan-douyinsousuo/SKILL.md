---
name: laohan-douyinsousuo
description: 抖音关键词搜索，采集视频数据按点赞排行。Use when 用户说"抖音搜索""搜一下抖音""抖音上搜""抖音关于""抖音上有什么""douyin搜索"或提到"在抖音搜""抖音的xxx情况""抖音里xxx排行"。
version: "2.0.0"
---

# 抖音搜索

用 DrissionPage 监听抖音搜索 API 数据包，滚动采集视频列表，按点赞排行输出。

## 核心理念

抖音搜索 API 有 a_bogus 签名校验，无法直接调接口。唯一可行方案：浏览器自动化 → 监听数据包 → 后处理排序。不支持 API 级排序/筛选。

## 登录态机制（v2.0 核心升级）

**免扫码**：脚本不复用日常 Chrome（日常 Chrome 默认目录开不了远程调试口），而是启动**独立 profile**（`~/.douyin-search-profile`），注入从日常 Chrome 抽取的抖音登录态 cookie，带 sessionid 直接进站。

- 登录态来源：日常 Chrome 抖音登录态在 **Profile 5**（本机 7 个 Profile 无 Default，抖音登录在 Profile 5）
- cookie 抽取：`extract_cookies.py` 用 browser_cookie3 读 Chrome Cookies 库（自动 keychain 解密），筛 douyin 域存 JSON
- cookie 注入：search.py 用 DrissionPage 4.x `tab.set.cookies(list)` 传整个 list（不是逐条），先 `tab.get(目标域)` 再注 + refresh 生效
- cookie 失效（几天到几周）：重跑 `extract_cookies.py` 一键刷新

**为什么不直接连日常 Chrome**：① 日常 Chrome 不带 `--remote-debugging-port`；② 带了也开不了——Chrome 远程调试拒绝配"默认" user-data-dir（`Application Support/Google/Chrome`）；③ 复用日常 Chrome 的 profile 要先关 Chrome，扰民。独立 profile + cookie 注入三全其美。

## 工作流

### 1. 确认搜索参数

从用户输入中提取：
- **关键词**（必填）：要搜什么
- **最少条数**（可选，默认 30）：`--min`
- **最大滚动**（可选，默认 10）：`--scroll`

如果用户只给了关键词，用默认参数直接执行。

### 2. 确保登录态 cookie 存在（首次或失效时）

cookie 文件 `~/.douyin-search-profile/douyin_cookies.json` 不存在、或搜索时提示"登录态无效"时，先抽 cookie：

```bash
~/.douyin-search-profile/.venv/bin/python ~/.agents/skills/laohan-douyinsousuo/scripts/extract_cookies.py
```

前提：日常 Chrome 的 **Profile 5** 已登录 douyin.com（没登就先用 Chrome 登一次）。成功输出 "sessionid ✓ 登录态有效"。

### 3. 执行搜索

```bash
~/.douyin-search-profile/.venv/bin/python ~/.agents/skills/laohan-douyinsousuo/scripts/search.py "关键词" --min 30 --scroll 10
```

脚本会自动：
- 启动独立 Chrome（`~/.douyin-search-profile`，**不动日常 Chrome**）
- 注入抖音 cookie，免扫码带登录态进站
- 滚动采集，采够 `--min` 条即停
- 按点赞降序，输出 TOP 20
- JSON 保存到 `~/.douyin-search-profile/output/{关键词}_results.json`

### 4. 展示结果

脚本运行结束后，读 JSON 文件，用表格展示（含发布时间）：

```
# 抖音搜索结果：{关键词}
共 {N} 条 | TOP {M}（按点赞排行）：

| # | 作者 | ❤️点赞 | 💬评论 | 📅发布时间 | 标题 |
|---|------|--------|--------|------------|------|
| 1 | {作者} | {点赞} | {评论} | {create_time_str} | {标题} |
```

- 时间字段用 `create_time_str`（格式 YYYY-MM-DD HH:MM）
- 超过 30 天前的发布时间加粗标记（`**2026-01-05**`），让用户快速识别旧内容
- 如果用户问"有没有 xxx 博主"，逐条检查 author 字段回答

### 5. 选题分析

展示结果后，自动附上选题分析，包含：

**内容类型分布**：统计各类型视频数量（安装教程/进阶技巧/方法论/对比评测/实战/资源推荐）

**热门选题规律**：从标题和互动数据中总结 2-4 条规律（如哪些角度流量高、哪些话题红海、哪些角度竞品少）

**差异化机会**：基于搜索结果，指出老韩（寒武纪AI）可切入的选题方向，重点看竞品未覆盖的领域（Skills/Hooks/多Agent协作/飞书控制等 OpenClaw 独家经验）

## 操作规则

- **首次运行需建 venv 装依赖**（持久位置，重启不丢）：
  ```bash
  mkdir -p ~/.douyin-search-profile
  python3 -m venv ~/.douyin-search-profile/.venv
  ~/.douyin-search-profile/.venv/bin/pip install DrissionPage browser-cookie3
  ```
- **Chrome 必须已安装**：脚本硬编码 `/Applications/Google Chrome.app` 路径
- **依赖登录态**：Profile 5 登录抖音 → `extract_cookies.py` 抽 cookie → search.py 注入。全程免扫码
- **脚本是阻塞的**：运行时间 = 滚动次数 × ~5秒 + cookie 注入/登录等待。30 条约需 1-2 分钟
- **弹独立 Chrome 窗口**：脚本会弹一个独立 Chrome 跑搜索，跑完自动关。**不动用户日常 Chrome**
- **不同关键词结果完全不同**：抖音搜索算法对用户画像和关键词匹配权重高

## 已知限制

- author_id 全部为空（搜索 API 不返回）
- plays 全部为 0（搜索 API 不返回播放量）
- 不支持排序/时间筛选（API 需签名，UI 点击触发验证码）
- 如需筛选，建议多采集后 Python 后处理
- cookie 会过期（抖音 sessionid 几天到几周），失效重跑 extract_cookies.py

## 不适用场景

- 下载抖音视频 → 用 yt-dlp 移动端 UA 方法（→ `/laohan-xiazai`）
- 抓取抖音评论 → 用 douyin-session adapter
- 博主作品列表 → 用 `opencli douyin user-videos`
