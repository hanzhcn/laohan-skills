---
name: laohan-aihotjingxuan
description: AIHOT 精选页当日内容抓取。基于官方 aihot skill 的公开 REST API（无需 API Key），拉取当日精选条目，输出结构化 markdown 到 OpenClaw 数据目录。使用场景：(1) 用户说"抓精选""aihot精选""今日AI精选" (2) 用户想了解今日AI圈发生了什么 (3) 用户需要AI热点素材做选题扫描。触发词：/laohan-aihotjingxuan。依赖：官方 aihot skill（KKKKhazix/khazix-skills），如未安装会自动用 curl 调 API。
---

# AIHOT 精选抓取（laohan-aihotjingxuan）

基于 [AIHOT 官方 skill](https://github.com/KKKKhazix/khazix-skills/blob/main/aihot/SKILL.md) 的公开 REST API，拉取当日精选条目，输出结构化 markdown。

## 前置依赖

- **官方 aihot skill**：`npx skills add KKKKhazix/khazix-skills -g -y`（可选，未安装时本 skill 直接用 curl 调 API）
- API：`https://aihot.virxact.com/api/public/*`（公开匿名，无需 token）
- curl 必须带浏览器 UA（否则 403）

## 使用

```
/laohan-aihotjingxuan
```

无参数，直接抓当日精选数据。

## 执行流程

### Step 1：设置 UA

```bash
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
```

### Step 2：拉取当日精选

```bash
# since=24小时前，只拉精选（mode=selected）
since=$(date -u -v-24H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)
curl -sH "User-Agent: $UA" "https://aihot.virxact.com/api/public/items?mode=selected&since=$since&take=100"
```

如果用户说"全部"，改为 `mode=all`。

### Step 3：格式化输出

将 API 返回的 JSON 条目按以下格式整理为 markdown：

```markdown
# AIHOT 精选 YYYY-MM-DD

共 N 条精选内容

---

## 1. 标题

- **时间**：HH:MM（北京时间，从 publishedAt UTC+8 转换）
- **来源**：source 字段
- **分类**：category 中文映射（ai-models→模型发布 / ai-products→产品发布 / industry→行业动态 / paper→论文研究 / tip→技巧观点）
- **原文链接**：url 字段
- **AI摘要**：summary 字段

---

（所有条目）

## 统计

- 总条目数：N
- 分类分布：模型发布 X 条 / 产品发布 X 条 / 行业动态 X 条 / 论文研究 X 条 / 技巧观点 X 条
```

### Step 4：保存文件

```bash
# 确保目录存在
mkdir -p ~/.openclaw/workspace-shared/data/aihot/

# 保存（文件名用当天日期）
# ~/.openclaw/workspace-shared/data/aihot/YYYY-MM-DD_jingxuan.md
```

### Step 5：汇报

输出完成后告诉用户：
- 抓了多少条
- 文件路径
- 最热门的一条是什么（标题+分类）

## API 要点速查

| 要点 | 说明 |
|------|------|
| Base URL | `https://aihot.virxact.com` |
| 鉴权 | 无（匿名） |
| 限流 | 600 req/min/IP |
| UA 要求 | `/api/public/*` 必须带浏览器 UA，否则 403 |
| items since | 限最近 7 天，不传等同 now-7d |
| take 上限 | 100，更多用 cursor 翻页 |
| 关键词搜索 | `?q=OpenAI`（在 title + 中文 title + 中文 summary 三列匹配） |
| 分类 | ai-models / ai-products / industry / paper / tip |
| OpenAPI 规范 | `https://aihot.virxact.com/openapi.yaml` |

## 与官方 skill 的关系

本 skill 是 [KKKKhazix/khazix-skills aihot](https://github.com/KKKKhazix/khazix-skills) 的**薄包装层**：
- 官方 skill 提供完整的 AIHOT API 能力（精选/日报/全量/分类/搜索/翻页）
- 本 skill 固定场景：只抓当日精选 + 保存到 OpenClaw 数据目录 + 汇报
- 如需更灵活查询（日报、关键词搜索、指定日期），直接用官方 aihot skill

## 常见错误

- 403：curl 没带 UA → 加 `-H "User-Agent: $UA"`
- 空结果：since 太早或当天还没更新 → 提示稍后重试
- 429：超限流 → 串行调用，加间隔

## 注意事项

- 目标域名是 `aihot.virxact.com`，不是 `aihot.today`（后者是简化版）
- 不需要登录，公开可访问
- 如果当天抓不到内容（比如凌晨还没更新），说明情况并提示稍后重试
- 输出目录 `~/.openclaw/workspace-shared/data/aihot/` 如果不存在就创建
- `publishedAt` 是 UTC，展示时转北京时间（+8h）+ 人话（"2小时前"）
