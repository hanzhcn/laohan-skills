---
name: laohan-cheat
version: "2.0.0"
description: 内容校准工作流适配器。为 episode 选择正确的 cheat-on-content 校准 lane，保存可追溯的校准入口；评分、盲预测、发布登记、复盘和 rubric 更新一律由上游 cheat-on-content 执行。Use when 用户说校准这期、给本期打分并预测、把 episode 接入 cheat、选择校准轨道、进入④校准。
---

# 内容校准适配器

这里不是第二套 Cheat。`cheat-on-content` 是唯一校准引擎；本 skill 只把 episode 和它的校准 lane 接起来，避免本地 fork 公式、预测规则或迁移规则漂移。

## 不可跨越的边界

- 禁止在这里按固定教程型权重打分，禁止估算后把分数当预测，禁止另写 PREDICT / RETRO / BUMP。
- 禁止把 `tutorial-video` 的历史样本拿来评估 `opinion-video`；两种内容必须是独立 lane。
- 盲预测必须在拍摄、发布、查看本期实际数据之前，由上游 `cheat-on-content` 写入其 `predictions/`；预测段不可改写。
- 上游版本更新后若 state schema 不匹配，只能先执行 `cheat-migrate` dry-run。备份与用户确认前不得迁移历史 lane。

## 路由

1. 先运行 `laohan-bianpai vendors`。Cheat 或 dbskill upstream 有更新时只记录待办；只在新 episode 前或独立维护窗口运行 `vendors --sync`。它报告 schema migration 时停止，不能绕过，也不能在本期中途切换规则。
2. 读取 `episodes/<slug>/01-口播稿.md` 与 `00-选题.md`，判断内容形态。
   - 教程、明确操作路径、资源交付 → `tutorial-video` lane。
   - 观点、评论、议题、个人判断 → `opinion-video` lane。
   - 无法判断时停止，不能默认为教程型。
3. 读取目标 lane 的 `.cheat-state.json`，确认 `content_form` 一致。观点视频固定使用工作流项目的 `calibration/opinion-video/`；无 lane 时先在该目录用上游 `cheat-init` 创建，不复用不匹配的旧目录。
4. 先运行 `node scripts/verify-blind-rubric.mjs calibration/<content_form>`。对当前 `01-口播稿.md` 运行上游 `cheat-score`：主评分器可用完整 `rubric_notes.md` 解析公式，但隔离子评分器只可读取已验证的 `blind-rubric.md` 与本期稿。任何 contamination warning 都必须丢弃并重启全新隔离评分。把无告警的完整输出保存到本 lane 内，再运行 `node scripts/register-cheat-score-evidence.mjs episodes/<slug> calibration/<content_form> <lane内score输出.md>`。在 `03-校准报告.md` frontmatter 写 `score_evidence: <相对lane路径>` 与当前 SHA-256。此时 `prediction_status` 必须为 `PENDING`；不能在⑤修改稿之前写盲预测。
5. 进入⑤：固定调用 `dbs-script-flow`、`dbs-resonate`、`laohan-shencha CONTENT_CLAIMS`；只有首 5 秒被判弱时调用 `dbs-hook`，只有语言审计需要时调用 `dbs-ai-check`。报告完成后运行 `node scripts/stamp-episode-script-hash.mjs episodes/<slug> 04-深扫报告.md 04-事实核验.md`，两份⑤报告才会写入同一个 script_hash。仅 hash 匹配不足：③必须 `risk_status: CLEAR` 且 `unresolved_high_risk_count: 0`；⑤深扫必须 `review_status: CLEAR` 与 `unresolved_issue_count: 0`，事实核验必须 `fact_check_status: CLEAR`、`contradicted_count: 0`、`unverifiable_count: 0`，否则不得 prepare 或登记最终盲预测。
6. ⑤报告与当前稿 hash 一致后，先运行 `node scripts/prepare-cheat-prediction-input.mjs episodes/<slug> calibration/<content_form>`。把输出的 lane snapshot 作为上游 `cheat-predict` 的唯一输入，并在预测 metadata 写 `**Script**: <snapshot path>` 与 `**Script Hash**: <sha256>`。然后运行 `node scripts/register-cheat-prediction.mjs episodes/<slug> calibration/<content_form> predictions/<file>.md v1`。它验证预测晚于快照、metadata 与快照一致，才写 `03-预测证据.json` 并标 `RECORDED`。任何改稿都会使 hash 失效；必须重跑⑤、prepare 新快照并登记新的 prediction revision，不能改写旧预测。
7. `03-校准报告.md` 的开头必须是：

```yaml
---
calibration_engine: cheat-on-content
content_form: opinion-video # 或 tutorial-video
calibration_root: <相对于本报告的 lane 路径>
script_hash: <01-口播稿.md 的 sha256>
score_status: COMPLETE
prediction_status: PENDING # ⑤完成后才改为 RECORDED
prediction_file: null # RECORDED 时必须是 predictions/...md
---
```

随后只摘要本期分数、关键修改点与上游预测文件路径；不复制一套 rubric。运行 `laohan-bianpai status`；缺上游 state、hash 或最终预测即为 BLOCKED。

## 历史兼容

`~/.openclaw/workspace-shared/content-ops` 是旧的 `tutorial-video` 校准数据，不是所有 episode 的默认源。它升级到上游 schema 前保持只读；FDE 这类观点视频不得使用它的旧教程型 composite 作为放行依据。

## 何时回到这里

- 发布后：`laohan-yunying` 只归档真实发布/数据/评论，再交给上游 `cheat-publish` 与 `cheat-retro`。
- 样本足够时：只由上游 `cheat-bump` 进行全量重打与独立审核。
