---
name: laohan-yunying
version: "1.0.0"
description: 抖音数据与评论编排器。读取 Jeffrey 手动发布后登记的作品记录，回收作品数据和评论洞察，并把真实数据交给 cheat-on-content 复盘。Use when 用户说抓作品数据、复盘评论、登记手动发布结果、进入⑬数据或⑭评论。
---

# 抖音数据与评论编排器

本 skill 不发布、不准备发布文案、不代替 Jeffrey 点击平台。它只读取手动发布事实，保存数据和评论证据；`cheat-on-content` 是预测与复盘引擎。

## 工作流

### 1. 手动发布事实登记

Jeffrey 在平台手动发布后，提供 URL、aweme_id 与平台显示的精确标题 platform_title；先运行 `bianpai check --require final`，再由本 skill 写 `12-发布/publish-record.json`。Jeffrey 只负责平台点击，本 skill 只登记事实；不得生成 release-ready、发布文案、定时发布或任何平台点击自动化。

### 2. 手动发布记录

只登记 Jeffrey 提供的作品 URL、aweme_id 与 platform_title；不调用 URL 解析、平台浏览器、发布 adapter 或任何替代发布工具。URL 必须包含同一 aweme_id；缺任一身份字段则停，不能编造。

写 `12-发布/publish-record.json`：

```json
{
  "platform": "douyin",
  "status": "PUBLISHED",
  "url": "https://www.douyin.com/video/<aweme_id>",
  "aweme_id": "<id>",
  "platform_title": "平台显示的精确作品标题",
  "published_at": "2026-07-10T20:00:00+08:00",
  "final_path": "07-剪辑/final.mp4",
  "final_sha256": "当前 final.mp4 的 SHA-256",
  "source": "user-confirmed"
}
```

然后调用上游 `cheat-publish` 登记同一 URL；只更新预测 metadata，绝不修改预测段。完成后运行 `node scripts/register-cheat-publish-evidence.mjs episodes/<slug>`，保存 publish 时点的 lane state 快照并验证 prediction header、URL、aweme_id、发布时间和不可变预测段；缺该证据时⑫不得完成。

### 3. 数据快照

人工提供的创作者中心数据来源写 `manual`。TzFilm SQLite adapter 只允许显式运行：`python3 scripts/tzfilm_douyin_adapter.py snapshot --db <douyin_stats.db> --episode episodes/<slug>`。它必须从本期 publish-record 读取 aweme_id/platform_title，按精确标题查询并拒绝歧义，不再接受命令行伪造作品 ID，也不得覆盖已有快照。它不运行 launchd、Telegram、预测追踪或任何发布动作。

TzFilm 的飞书同步仅作为外部看板；不读取飞书作为数据源，也不写 episode 以外的状态。发布后预测追踪完成并经本地验证后，可额外保存到 `13-数据/tzfilm-tracking.json`，标 `source: tzfilm-tracker` 与抓取时间；它只辅助观察，不得替代 Cheat 的发布前盲预测、retro 或 rubric。

发布后默认 T+3 回收；用户指定 T+N 时覆盖。当前只接受用户提供的创作者中心数据；不得把未验证的 opencli 或浏览器抓取写成默认链路。TzFilm adapter 验收完成后再更新这一段的自动化优先级和降级链。

每次追加一行到 `13-数据/snapshots.jsonl`：

```json
{"platform":"douyin","aweme_id":"<id>","observed_at":"ISO-8601","source":"opencli|creator-center|manual","metrics":{"plays":0,"likes":0,"comments":0,"shares":0,"favorites":0}}
```

数据自动抓取失败必须保留失败原因和数据来源，降级为 manual；不得把空值写成 0。

### 4. 评论与复盘交接

TzFilm 的评论导出只允许 export，不允许 reply。显式导入：`python3 scripts/tzfilm_douyin_adapter.py comments --input <unreplied-comments.json> --episode episodes/<slug>`。adapter 必须验证 selectedWork 精确标题与 publish-record 一致，过滤空文本并去重；禁止调用 `auto_reply.py reply` 或保存回复计划到 episode。

首选 `douyin-session` 抓取高赞评论；Cookie 失效时引导用户重新登录，失败后让用户粘贴高赞评论。评论可用时写 `14-评论/comments.jsonl`，每行固定为 `{"platform":"douyin","aweme_id":"<id>","captured_at":"ISO-8601","source":"douyin-session|manual","text":"评论正文","likes":0}`；不可用时仍写洞察文件并说明原因。

写 `14-评论/insights.md`，首行必须为 `评论数据状态: AVAILABLE` 或 `评论数据状态: UNAVAILABLE`。UNAVAILABLE 时第二行必须是 `失败原因: <具体原因>`；之后记录抓取时间、来源、代表评论、3—5 个主题、选题信号与待验证假设。

T+N 数据和评论齐备后，调用上游 `cheat-retro`。它写 prediction 的 `## 复盘` 段、`rubric-memo.md` 和经用户确认的 `script_patterns.md`；本 skill 不修改 rubric。完成后写 `14-评论/retro-handoff.json`：`status: "COMPLETE"`、episode、aweme_id、prediction_file、prediction_after_retro_sha256、rubric_memo_sha256、snapshots_sha256、insights_sha256、comments_sha256（无评论时为 null）和 ISO `completed_at` 都必填；没有该证据不得把⑭标完成。

## 降级链

| 环节 | 首选 | 失败后 | 最终兜底 |
|---|---|---|---|
| aweme_id | Jeffrey 提供 ID | — | BLOCKED |
| 数据 | 用户提供创作者中心数据 | TzFilm adapter 独立验收（不覆盖真值） | BLOCKED |
| 评论 | 用户提供导出的高赞评论 | TzFilm export-only 导入独立验收 | 标记 UNAVAILABLE |

## 反模式

❌ 看到 `final.mp4` 就自动发布，或拿播放数据反改盲预测。  
✅ 用户发布后登记 URL；数据只进入快照和 upstream retro。

❌ 把 `laohan-xiazai` 的临时抓取输出当运营真源。  
✅ 统一写入 episode 的发布、快照和评论产物，再由 bianpai 路由。
