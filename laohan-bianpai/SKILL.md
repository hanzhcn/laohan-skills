---
name: laohan-bianpai
version: "1.3.0-candidate"
description: 真人口播工作流编排器。根据 episode 已落盘产物识别当前步骤、验证前置 gate，并给出唯一下一步与对应 skill；不替代创作、剪辑、发布或复盘。Use when 用户说工作流下一步、检查本期进度、编排这期视频、当前做到哪、验证 episode、开始下一环节。
---

# 真人口播编排器

编排器只根据 episode 里的真实文件路由。它不把聊天结论当完成，也不自动调用其他 skill。

## 命令

```bash
# 从 laohanAI视频创作 根目录运行；不要从 skill 目录运行

# 当前状态、缺失产物、唯一下一步
node ~/Documents/laohan-skills/laohan-bianpai/scripts/bianpai.mjs status --episode episodes/<slug>

# 先检查 dbskill / Cheat 上游；只在新 episode 前或独立维护窗口同步
node ~/Documents/laohan-skills/laohan-bianpai/scripts/bianpai.mjs vendors --episode episodes/<slug>
node ~/Documents/laohan-skills/laohan-bianpai/scripts/bianpai.mjs vendors --episode episodes/<slug> --sync

# 只输出下一步的输入、产物、gate 与 skill
node ~/Documents/laohan-skills/laohan-bianpai/scripts/bianpai.mjs next --episode episodes/<slug>

# 运行已实现的机械契约检查
node ~/Documents/laohan-skills/laohan-bianpai/scripts/bianpai.mjs check --episode episodes/<slug>

# 阶段验收；未完成时退出非 0
node ~/Documents/laohan-skills/laohan-bianpai/scripts/bianpai.mjs check --episode episodes/<slug> --require production
node ~/Documents/laohan-skills/laohan-bianpai/scripts/bianpai.mjs check --episode episodes/<slug> --require full

# 要求成片已经接受；供⑫发布前调用
node ~/Documents/laohan-skills/laohan-bianpai/scripts/bianpai.mjs check --episode episodes/<slug> --require final
```

## 工作流

1. 恢复工作先运行 `vendors`。它把当时可用 vendor 写为 `FROZEN_ON_RESUME`；`--sync` 只会在新 episode 前或独立维护窗口、Cheat 工作树干净、活动 lane 没有 schema migration 时更新。新 episode 只能从 `UP_TO_DATE` 或审计过的 `READY_LOCAL_AHEAD` 状态创建；更新可用/待安装不得写成 READY。schema 2 episode 还必须通过 `00-编排/executor-lock.json`；registry/runtime lock 漂移时不得刷新 preflight 掩盖执行器变化。
   已存在且通过机械核验的 `00-编排/supersession-record.json` 必须优先返回 `SUPERSEDED`，不得继续 vendors/status/next/check，也不得用新 lock 覆盖旧 lock。
2. 读取 `episode-config.json`，先运行 config gate。失败时停在①之前，不路由任何内容或生产步骤。
3. 按 ①—⑭检查标准产物。新 episode 默认 `CODEX_DIRECT + Remotion`：⑨—⑪由同一个 Codex 任务连续完成，⑨只落 `direct-brief.json + source-manifest.json`；第⑩步只在 source manifest 有真实素材请求时运行，无 request 标为 not_applicable。
4. ④先记录 score，此时状态为 PARTIAL，再进入⑤；⑤报告匹配当前稿后，④必须写最终盲预测并成为 COMPLETE，才可进入⑥或任何 production/final gate。任何改稿改变 `script_hash` 都回到⑤再④。
5. 输出唯一下一步的 skill、必要输入、应落盘产物与不能跨越的 gate。

## 硬规则

- schema 2 在①前必须有 distribution contract 与 executor lock；⑥开始前 distribution 必须锁定。⑦前必须有 shooting_contract；⑨前必须有 clean.mp4 与 subtitles.srt。
- schema 2 的①还必须有真实 source health；③报告必须绑定未过期 ruleset 并声明 `platform_guarantee: false`；⑥必须分别登记 prompt executor、image provider 和 selection mode。
- CODEX_DIRECT 的 direct brief 必须绑定当前 clean/SRT、柱子哥 production learning profile、3—5 个当前样本和 2—4 个本期学习目标，且不能包含 renderer 实现细节。
- ⑩不能因 stock 无结果放行；⑪不能因 candidate 存在写 final.mp4，必须有完整观看 QA 与 Jeffrey 接受。
- ⑫发布、账号操作、评论回复与方法论升级都不自动执行。
- 有产物但未满足 gate 时，报告 BLOCKED，不算完成；JSON 损坏也必须报告 BLOCKED，不输出 stack trace。
- 普通 `check` 只检查已有输入并明确输出 INCOMPLETE；只有 `--require production|final|full` 可作为阶段验收。
- ⑫—⑭由 `laohan-yunying` 处理；发布、评论回复和数据纠正都必须有对应的人工确认或来源证据，不能把预留目录当完成。

## 不适用

- 写口播稿、剪辑、发布 → 使用对应专业 skill。⑨—⑪默认返回 `codex-direct-production` executor；它不是新 skill，而是同一 Codex 任务的连续生产职责。
- 只有一个独立文案、没有 episode 目录 → 先创建 episode，不猜文件位置。

## 反模式

❌ 看见 `01-口播稿.md` 就认为整期可拍。  
✅ 先检查 config、事实核验、封面选择和拍摄契约。

❌ 自动跳过 no_result 或技术失败。  
✅ 保留 BLOCKED，并返回产生该决策的上游步骤。
