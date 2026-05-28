---
name: laohan-douyinsousuo
description: 抖音关键词搜索，采集视频数据按点赞排行。Use when 用户说"抖音搜索""搜一下抖音""抖音上搜""抖音关于""抖音上有什么""douyin搜索"或提到"在抖音搜""抖音的xxx情况""抖音里xxx排行"。
version: "1.2.0"
---

# 抖音搜索

用 DrissionPage 监听抖音搜索 API 数据包，滚动采集视频列表，按点赞排行输出。

## 核心理念

抖音搜索 API 有 a_bogus 签名校验，无法直接调接口。唯一可行方案：浏览器自动化 → 监听数据包 → 后处理排序。不支持 API 级排序/筛选。

## 工作流

### 1. 确认搜索参数

从用户输入中提取：
- **关键词**（必填）：要搜什么
- **最少条数**（可选，默认 30）：`--min`
- **最大滚动**（可选，默认 10）：`--scroll`

如果用户只给了关键词，用默认参数直接执行。

### 2. 执行搜索

```bash
cd /tmp/douyin-test && source .venv/bin/activate
python ~/.agents/skills/laohan-douyinsousuo/scripts/search.py "关键词" --min 30 --scroll 10
```

脚本会自动：
- 启动 Chrome（需本机安装 Chrome）
- 检测登录态（已登录直接过，未登录等扫码最多 120 秒）
- 滚动采集，采够 `--min` 条即停
- 按点赞降序排列，输出 TOP 20
- JSON 保存到 `/tmp/douyin-test/{关键词}_results.json`

### 3. 展示结果

脚本运行结束后，读 JSON 文件，用表格展示（含发布时间）：

```
# 抖音搜索结果：{关键词}
共 {N} 条 | TOP {M}（按点赞排行）：

| # | 作者 | ❤️点赞 | 💬评论 | 📅发布时间 | 标题 |
|---|------|--------|--------|------------|------|
| 1 | {作者} | {点赞} | {评论} | {create_time_str} | {标题} |
```

- 时间字段用 `create_time_str`（格式 YYYY-MM-DD）
- 超过 30 天前的发布时间加粗标记（`**2026-01-05**`），让用户快速识别旧内容
- 如果用户问"有没有 xxx 博主"，逐条检查 author 字段回答

### 4. 选题分析

展示结果后，自动附上选题分析，包含：

**内容类型分布**：统计各类型视频数量（安装教程/进阶技巧/方法论/对比评测/实战/资源推荐）

**热门选题规律**：从标题和互动数据中总结 2-4 条规律（如哪些角度流量高、哪些话题红海、哪些角度竞品少）

**差异化机会**：基于搜索结果，指出老韩（寒武纪AI）可切入的选题方向，重点看竞品未覆盖的领域（Skills/Hooks/多Agent协作/飞书控制等 OpenClaw 独家经验）

## 操作规则

- **首次运行需安装依赖**：如果 `.venv` 不存在，`cd /tmp/douyin-test && python3 -m venv .venv && source .venv/bin/activate && pip install DrissionPage`
- **Chrome 必须已安装**：脚本硬编码了 `/Applications/Google Chrome.app` 路径
- **需要登录态**：首次需扫码，后续自动复用 Chrome profile 登录态
- **脚本是阻塞的**：运行时间 = 滚动次数 × ~5秒 + 登录等待。30 条约需 1-2 分钟
- **不同关键词结果完全不同**：抖音搜索算法对用户画像和关键词匹配权重高

## 已知限制

- author_id 全部为空（搜索 API 不返回）
- plays 全部为 0（搜索 API 不返回播放量）
- 不支持排序/时间筛选（API 需签名，UI 点击触发验证码）
- 如需筛选，建议多采集后 Python 后处理

## 不适用场景

- 下载抖音视频 → 用 yt-dlp 移动端 UA 方法（→ `/laohan-xiazai`）
- 抓取抖音评论 → 用 douyin-session adapter
- 博主作品列表 → 用 `opencli douyin user-videos`
