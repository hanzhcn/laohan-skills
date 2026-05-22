---
name: laohan-redian
version: 1.0
description: AI 热点统一抓取，三路并行（AIHOT 精选 + opencli 9 平台热榜 + 抖音 AI 筛选），合并去重输出完整热点简报。其他 skill 需要热点数据时直接读简报文件。Use when 用户说"抓热点""AI热点""今天的AI精选""找选题""热点""redian"或提到AI新闻/热门话题/今日精选。
argument-hint: [可选：关键词，如"OpenAI""Claude"]
allowed-tools: Bash(*), Read, Write, Glob, Grep
---

# AI 热点统一抓取

三路并行抓取，合并去重，输出一份完整热点简报。**所有热点需求统一走这里，其他 skill 不再自己抓。**

## 核心理念

三路并行是容错设计——单路失败不影响整体输出。多源交叉验证比单源更有价值：3个平台同时在聊的话题，比1个平台的爆款更值得关注。

## 不适用场景

- 抓单个平台热榜 → 直接用 `opencli <platform> hot`，不需要本 skill
- 抓特定博主更新 → 用 laohan-chuangzuo 的录屏模式，不走热点
- 非中文场景的热点 → AIHOT 和 opencli 主要覆盖中文平台，英文热点直接看 HackerNews

## 三路数据源

| 路数 | 来源 | 方法 | 特点 |
|------|------|------|------|
| 1 | AIHOT 精选 | REST API + Scrapling 降级 | AI 圈最精准，有分类和摘要 |
| 2 | 全平台热榜 | opencli 9 平台 | 覆盖最广，可交叉验证 |
| 3 | 抖音 AI 筛选 | douyin-ai.js（tag=6000 + 关键词） | 大众关注风向，短视频视角 |

## 输出

```
<当前工作目录>/output/热点-YYYY-MM-DD.md
```

目录不存在时自动创建。

---

## 执行流程

### Step 1：三路并行抓取

三路同时跑，不串行。

**路 1：AIHOT 精选**

```bash
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
since=$(date -u -v-24H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%SZ)
curl -sfH "User-Agent: $UA" --max-time 15 "https://aihot.virxact.com/api/public/items?mode=selected&since=$since&take=100"
```

失败时降级用 Scrapling MCP 抓 `https://aihot.virxact.com/` 首页解析。

**路 2：全平台热榜（opencli）**

```bash
# 核心平台
opencli zhihu hot
opencli weibo hot
opencli 36kr hot
opencli bilibili hot
opencli douyin hashtag hot --limit 30

# 补充平台
opencli toutiao hot
opencli tieba hot
opencli hupu hot
opencli hackernews hot
```

某个平台失败就跳过，不阻塞。

**路 3：抖音 AI 筛选**

```bash
SCRIPT=$(find ~/.claude/skills/laohan-redian ~/.agents/skills/laohan-redian -name "douyin-ai.js" 2>/dev/null | head -1)
node "$SCRIPT"
```

输出 JSON 格式用 `-f json`。

### Step 2：AI 关键词过滤（仅全平台热榜）

从 9 个平台的 50+ 条热榜中筛选 AI 相关：

- **直接相关**：AI / GPT / Claude / 大模型 / 机器人 / 自动化 / 失业 / 裁员 / 编程 / 副业 / 赚钱 / deepseek / openai
- **间接相关**：教育 / 职业 / 消费 / 创业 / 职场 / 35 岁 / 年轻人

排除：纯娱乐八卦、体育赛事（无 AI 角度）、地域新闻、纯政治。

### Step 3：合并去重 + 交叉验证

1. 同一话题在多个来源出现 → 合并为一条，记录所有来源
2. 按来源数评分：
   - **3+ 来源** → 高价值（多平台共振）
   - **2 来源** → 值得关注
   - **1 来源** → 单源（AIHOT 精选或抖音 AI 独有的仍有价值）

### Step 4：输出简报

按以下格式写入 `output/热点-YYYY-MM-DD.md`：

```markdown
# AI 热点日报 YYYY-MM-DD

> 三路抓取：AIHOT 精选 + 全平台热榜 + 抖音 AI | 合并去重后 N 条

---

## 🔥 高价值热点（多平台共振）

### 1. [标题]
- **热度**：[热度值/播放数]
- **来源**：AIHOT + 知乎 + 微博（3 个来源）
- **分类**：模型发布 / 行业动态 / ...
- **AI 摘要**：[AIHOT 摘要或一句话概括]

---

## ⭐ 值得关注（2 来源）
[同上格式]

---

## 📌 AIHOT 独家精选
[AIHOT 有但其他源没有的内容，保持 AIHOT 原始格式：时间/来源/分类/链接/摘要]

## 📌 抖音 AI 热门
[抖音筛选结果：排名/标题/热度/视频数/链接]

## 📌 其他平台热点
[全平台过滤后非重叠的内容]

---

## 统计

- 抓取：AIHOT X 条 / 全平台 X 条（过滤后） / 抖音 AI X 条
- 去重后：X 条
- 交叉验证：3+ 来源 X 条 / 2 来源 X 条 / 单源 X 条
```

---

## AIHOT API 速查

| 要点 | 说明 |
|------|------|
| Base URL | `https://aihot.virxact.com` |
| 鉴权 | 无（匿名） |
| 限流 | 600 req/min/IP |
| UA 要求 | 必须带浏览器 UA，否则 403 |
| items since | 限最近 7 天 |
| take 上限 | 100 |
| 分类 | ai-models / ai-products / industry / paper / tip |
| 关键词搜索 | `?q=OpenAI`（title + 中文 title + 中文 summary 匹配） |

## 错误处理

| 失败场景 | 处理 |
|---------|------|
| AIHOT API 403/超时 | 降级 Scrapling 抓首页 |
| opencli 某平台失败 | 跳过该平台，继续其他 |
| 抖音脚本失败 | 跳过路 3，用路 2 的 douyin 数据补充 |
| 全部失败 | 提示用户检查网络，建议稍后重试 |

## 与其他 skill 的关系

- **laohan-yuanchuang**：需要热点时读 `output/热点-YYYY-MM-DD.md`，不自己抓
- **laohan-cheat**：打分时引用简报中的热点信息
- **laohan-aihotjingxuan**：被本 skill 替代（路 1 完全覆盖其能力）
- **laohan-hotdouyinai**：被本 skill 替代（路 3 完全覆盖其能力）
