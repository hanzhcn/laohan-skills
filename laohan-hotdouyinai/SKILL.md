---
name: laohan-hotdouyinai
description: 从抖音热榜筛选 AI 相关内容。使用 tag=6000 科技分类 + AI 关键词双匹配策略，无需登录，公开 API。使用场景：(1) 用户说"抖音热榜 AI"、"抖音 AI 热点"、"查抖音" (2) 旺财 cron 需要监测抖音热榜中的 AI 内容 (3) 选题发现需要了解抖音 AI 话题热度。触发词：/laohan-hotdouyinai
---

# 抖音热榜 AI 内容筛选

从抖音热榜公开 API 拉取全量数据，双匹配过滤 AI 相关条目。

## 使用

```bash
cd "$(dirname "$0")/.." && node scripts/douyin-ai.js

# JSON 格式（管道处理）
node scripts/douyin-ai.js -f json

# 限制条数
node scripts/douyin-ai.js 3
```

## 筛选逻辑

双匹配策略（任一命中即入选）：

1. **Tag 匹配**：`sentence_tag === 6000`（抖音科技分类）
2. **关键词匹配**：标题包含 AI/GPT/Claude/大模型/deepseek/人工智能等 30+ 关键词

## 输出字段

| 字段 | 说明 |
|------|------|
| rank | 榜内排名 |
| title | 热点标题 |
| heat | 热度值 |
| video_count | 相关视频数 |
| link | 搜索链接 |
| tag | 抖音内部分类码（6000=科技） |

## 注意事项

- 公开 API，无需登录或 Browser Bridge
- AI 内容通常占热榜 2-10%（1-5 条），属正常现象
- 抖音 API 结构可能变动，tag 值 6000 需定期验证
- 脚本在 `scripts/douyin-ai.js`，纯 Node.js 无依赖
