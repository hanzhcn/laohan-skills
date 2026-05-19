---
name: laohan-aihotjingxuan
description: 抓取 AIHOT 精选页当日全部内容，输出结构化 markdown 文件。AIHOT 从168个源头筛选AI高价值内容，每条含时间、来源分层、精选分数、标题、原文链接、AI摘要、标签和推荐理由。使用场景：(1) 用户说"抓精选""aihot精选""今日AI精选" (2) 用户想了解今日AI圈发生了什么 (3) 用户需要AI热点素材做选题扫描。触发词：/laohan-aihotjingxuan
---

# AIHOT 精选抓取（laohan-aihotjingxuan）

抓取 [AIHOT 精选页](https://aihot.virxact.com/) 当日全部内容，输出一份结构化 markdown。

## 使用

```
/laohan-aihotjingxuan
```

无参数，直接抓当日数据。

## 流程

### Step 1：抓取精选页

用 Scrapling GET 抓取：

```
GET https://aihot.virxact.com/
参数：impersonate=chrome136, extraction_type=markdown
```

### Step 2：过滤当日内容

从抓取结果中，只保留当天日期的条目。每条天然包含以下字段：

| 字段 | 说明 |
|------|------|
| 时间 | 当天时间（如 22:04） |
| 来源 | 发布者名称+分层（官方/X·KOL/综合资讯/学术机构） |
| 精选分数 | AIHOT 质量评分（56-83范围） |
| 标题+链接 | 标题原文 + 原文URL |
| AI摘要 | AIHOT 模型生成的摘要（100-200字） |
| 标签 | 2-3个分类标签 |
| 关联讨论 | 部分热点有相关X推文（可选） |
| 推荐理由 | AIHOT 编辑视角的推荐语 |

### Step 3：输出

输出到固定目录：

```
~/.openclaw/workspace-shared/data/aihot/YYYY-MM-DD_jingxuan.md
```

### 输出格式

```markdown
# AIHOT 精选 YYYY-MM-DD

共 N 条精选内容

---

## 1. 标题

- **时间**：HH:MM
- **来源**：来源名（分层标签）
- **精选分数**：XX
- **原文链接**：URL
- **标签**：标签1 标签2 标签3

AI摘要全文

> 推荐理由：AIHOT推荐语全文

---

## 2. 标题

（同上格式）

---

（所有条目）

## 统计

- 总条目数：N
- 最高分：XX（标题）
- 来源分布：官方 X 条 / X·KOL X 条 / 综合资讯 X 条 / 学术机构 X 条
- 热门标签：标签名（X次）
```

### Step 4：汇报

输出完成后告诉用户：
- 抓了多少条
- 文件路径
- 最高分的一条是什么（标题+分数）

## 注意事项

- 目标域名是 `aihot.virxact.com`，不是 `aihot.today`（后者是简化版）
- 不需要登录，公开可访问
- 精选页按时间倒序排列，内容是实时更新的
- 如果当天抓不到内容（比如凌晨还没更新），说明情况并提示稍后重试
- 输出目录 `~/.openclaw/workspace-shared/data/aihot/` 如果不存在就创建
