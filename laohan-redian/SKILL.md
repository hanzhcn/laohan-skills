---
name: laohan-redian
version: 2.3.0
description: 真人口播①选题决策主写者；从 AIHOT 与已安装 OpenCLI 的当前信号生成观点/教程候选，核对小白受众承诺、抖音语义对齐和 PRIMARY 原始来源后，只选一个可生产且可复盘的主题。Use when 用户说"抓热点""AI热点""找选题""选题""今天做什么""redian"，或 bianpai 路由到①；单独搜抖音时改用 laohan-douyinsousuo。
argument-hint: [可选：--episode episodes/<slug>；或关键词]
allowed-tools: Bash(*), Read, Write, Glob, Grep
---

# ①选题决策

热点只用于发现，最终结果是一个可审计的生产决策：为什么现在做、给谁看、论点凭什么成立、抖音上有哪些重复角度、为什么淘汰其他候选，以及发布后如何按固定窗口复盘。

## 边界

- 本 skill 是①唯一主写者，写 signals、candidates、source-health 和 `00-选题.*`。
- `laohan-douyinsousuo` 只写 `00-抖音搜索证据.{json,md}`；同一 Agent 宿主按 bianpai 路由执行，不做 programmatic skill-to-skill 调用。
- ②才写口播稿；①不生成正文、大纲段落或封面。
- ⑤才做完整事实核验；①仍须给最终事实前提找到至少一条 PRIMARY 原始来源。
- 不安装新浏览器、爬虫、Python runtime 或第三方 skill。抖音平台访问只用已安装 OpenCLI。
- 同一事件可以形成观点候选和教程候选；受众任务、标题承诺和内容路径真正不同时可分别参加比较。②—④沿用选中 lane，不混写。

## 输入

Episode 模式必须读取：

1. 本期 `episode-config.json` 与 `00-编排/` 冻结产物。
2. 本期已显式登记的反馈快照；没有就记录 `NOT_AVAILABLE`，不得扫描旧 episode 猜经验。
3. 本轮真实 signals 与抖音搜索证据。

默认 `AUTONOMOUS_DISCOVERY`：自主完成①。Jeffrey 明确给题时走 `USER_SEED`，可缩短广泛发现，但仍必须给出至少一个真实替代候选、抖音取证、PRIMARY 证据和测量合同。`REVIEW_GATED` 才等待 Jeffrey 选题。

## 工作流

### 1. 采集当前信号

Episode 模式执行唯一确定性入口：

```bash
node ~/Documents/laohan-skills/laohan-redian/scripts/collect-topic-signals.mjs \
  --episode episodes/<slug>
```

恢复原版“AIHOT精选 + 全平台热榜 + 抖音视角”三路发现法。默认实际 route 为 AIHOT、Hacker News、知乎、微博、36kr、B站、抖音热榜、头条、贴吧和虎扑；某路失败如实记录，其他路继续。需要缩小或替换时才传 `--sources`，总数2—10路。全部仍使用现有 AIHOT/OpenCLI，不安装第二套工具。

脚本只写：

- `00-选题-signals.json`
- 初始 `00-选题-source-health.json`

脚本不选题、不访问旧 episode、不调用 `douyin-ai.js`。

### 2. 标准化、去重、形成候选

读取 signals，按稳定 signal id 聚类同一事实事件；排除同 URL/同承诺/同路径的重复表达。同一事件只有在“帮观众作判断”和“带观众完成任务”分别成立时才生成两个形态。写 schema 2 `00-选题-candidates.json`，先用顶层 `screening_summary` 留下筛选链路，再写至少两个真正不同的短名单候选。`screening_summary` 只包含：

- `raw_signal_count`：signals 中实际结果总数；`event_cluster_count`：去重后的事件簇总数。
- `longlist`：有效事件足够时记8—12条，不足8条时全部记录。每条含唯一 `event_cluster_id`、`working_title`、非空 `signal_ids`、正整数 `source_count`、`disposition: SHORTLISTED|REJECTED` 和具体 `reason`。
- 每个最终候选的 `event_cluster_id` 都必须在 longlist 中标 `SHORTLISTED`。不新增中间文件、额外节点或第二套打分器。

同一事件的观点/教程变体在受众任务、标题承诺和内容路径不同时可分别计数。每项必须有：

形成候选前恢复原版分析：以“AI/GPT/Claude/大模型/机器人/自动化/编程/副业”等直接词和“教育/职业/消费/创业/职场”等间接词标注相关度，但保留可能产生新角度的边缘信号；统计安装教程/进阶技巧/方法论/对比评测/实战/资源推荐等内容类型；标出多平台共振、单平台独有、已拥挤角度和竞品未覆盖机会。它们用于扩大候选，不替代后面的 PRIMARY 与抖音关键词核验。

- 唯一 `id`、稳定非空 `event_cluster_id`、非空 `why_now`、`title`、`content_form: opinion-video|tutorial-video`、`audience_level: BEGINNER|INTERMEDIATE|ADVANCED`、`audience_problem`、`audience_promise`、`thesis`。
- `assumed_prerequisites` 与 `jargon_to_explain` 字符串数组。BEGINNER 候选必须把标题和论点里的关键工具、命令、迁移/导入概念列入解释清单，不能只提高 `audience_fit` 分。
- 非空 `signal_ids` 和 `evidence_ids`。
- 非空 `platform_query_intent`；`platform_alignment` 含 `status: ALIGNED|ADJACENT|CONTRADICTED|UNRESOLVED|UNAVAILABLE`、非空 `rationale` 和 `evidence_ids`。有平台结果时 evidence ids 必须真实；平台访问失败时写 `UNAVAILABLE` 和空数组。
- `content_gap` 含 `status: CONFIRMED|NOT_CONFIRMED|UNAVAILABLE`、非空 `rationale` 和 `evidence_ids`。只有平台直接提供搜索量、供给或缺口证据时才能写前两种；搜索结果条数、互动字段缺失或模型判断一律不能冒充内容缺口。`UNAVAILABLE` 合法且不参与机械淘汰。
- 非空 `claim_evidence_map`；每条含唯一 `claim_id`、非空 `claim`、`evidence_ids`。它要把技术事实绑定 PRIMARY；平台证据可用时，把“平台有人关心什么”绑定 PLATFORM_SIGNAL，不能让相邻关键词替另一个论点背书。平台 `UNAVAILABLE` 时不虚构 PLATFORM_SIGNAL claim。
- `scorecard` 六维整数 1—5：`audience_fit`、`evidence_strength`、`platform_relevance`、`differentiation`、`production_feasibility`、`learning_value`。
- 非空 `rationale` 与 `disposition: SELECTED|REJECTED`；最终只能一个 SELECTED。

分数是可挑战的候选比较，不是流量预测。热度不能替代受众价值、证据强度、差异化或可拍性。SELECTED 可为 `ALIGNED`、有明确差异化解释的 `ADJACENT`，也可在 discovery 与 PRIMARY 充分时为如实说明缺失范围的 `UNAVAILABLE`；平台缺失降低 `platform_relevance` 置信度，但不能单独淘汰候选。`CONTRADICTED|UNRESOLVED` 不得入选。教程候选写成确定步骤前仍必须在 `tutorial_proof` 登记 `status: VERIFIED`、本期内 `evidence_path`、`evidence_sha256`、非空 `version_boundary` 和 `recovery`。

### 3. 对短名单做抖音关键词验证

为 1—3 个短名单各设计一个具体查询，交同一宿主执行 `laohan-douyinsousuo` episode 模式。必须得到 `00-抖音搜索证据.json` 与 `.md` 后才继续。

- `OK`：引用真实结果 id，写清查询实际证明的观众意图。直接支持候选标题承诺、受众任务和 `why_now` 时标 `ALIGNED`；只支持同一产品、迁移热度或相邻概念时标 `ADJACENT`。优先补充更直接查询，但不因缺少完全同标题内容自动淘汰差异化新角度。
- `EMPTY_OR_FIELD_UNAVAILABLE`：只写“平台证据未决”，不得写“无人做/蓝海”。
- OpenCLI 登录或 adapter 全部失败：保留真实 FAILED 证据，把 `platform_alignment` 与 `content_gap` 标 `UNAVAILABLE`；只要 discovery 与 PRIMARY 足够，继续比较，不把平台缺失当卡点。

### 4. 回到 PRIMARY 原始来源

对最终候选的事实前提查找官网、官方公告、论文、产品文档或原始公开记录。平台热榜、搜索结果、媒体转述只能是 `PLATFORM_SIGNAL` 或 `SECONDARY`。

把 PRIMARY 与 PLATFORM_SIGNAL evidence 写入候选文件；每条有稳定 `id`、`source`、`source_type`、`url`、`retrieved_at`。缺 PRIMARY 时缩窄论点为可证范围；仍无法成立就换候选或 BLOCKED。

### 5. 写最终决策与 source health

更新 `00-选题-source-health.json`，每路记录：

- 唯一 `source_id` 与 `source_role: DISCOVERY|DOUYIN_SEARCH|PRIMARY_PROOF`。
- 实际 `command_or_url`、`attempted_at`、`status`、`result_count`。
- 本期相对 `result_file` 与真实 `result_sha256`。
- FAILED 写 `error`；SKIPPED 写 `reason`。

状态必须一致：OK 条数大于 0，EMPTY/FAILED/SKIPPED 条数为 0。至少一条 DISCOVERY 为 OK、一条 DOUYIN_SEARCH 有真实尝试记录、一条 PRIMARY_PROOF 为 OK；DOUYIN_SEARCH 可以 FAILED，但必须绑定本期抖音证据文件与原始错误。

写 schema 2 `00-选题.json`：

- `schema_version: 2`、`selected_candidate_id`、非空 `rejected_candidate_ids`。
- 原样复制选中项的 `content_form`、`audience_level`、`audience_promise`、`assumed_prerequisites`、`jargon_to_explain`、`platform_query_intent`、`platform_alignment`、`content_gap` 和 `claim_evidence_map`。
- `audience`、`thesis`、`evidence`、`selection_rationale`、`not_do_reason`。
- evidence 全部属于选中候选，且至少一条 PRIMARY；平台可用时至少一条 PLATFORM_SIGNAL，`platform_alignment.status=UNAVAILABLE` 时可没有。
- experiment 含唯一主要 intervention、合法 `metric_keys`、正整数 `T+N`、`observation_window_unit: DAY` 和逐键 `metric_targets`。

每条 metric target：

```json
{
  "key": "avg_duration_sec",
  "direction": "INCREASE",
  "baseline_ref": "recent_5_median",
  "measurement_source": "douyin_creator_center"
}
```

最后写 `00-选题.md`，只解释机器合同里的真实决策，不新增未登记事实。

## 失败处理

| 触发条件 | 处理 |
|---|---|
| 单一 discovery source 失败 | 记录 FAILED；其他来源满足角色合同可继续 |
| 所有 discovery source 无结果 | BLOCKED，不凭模型记忆选题 |
| 抖音返回合法空数组 | 记录 EMPTY；不得推断没有竞争 |
| OpenCLI 登录/adapter 全路径失败 | 平台证据记 `UNAVAILABLE` 并继续；不安装替代爬虫，不推断蓝海 |
| 最终候选无 PRIMARY | 缩窄论点或换候选；仍无则 BLOCKED |
| 平台结果只支持相邻话题 | 标 `ADJACENT`，补充查询；仍相邻时如实说明差异化与风险，可参加最终比较，不得冒充直接对齐 |
| 教程候选没有本机真实执行证据 | 保持 REJECTED；可保留为待验证候选，不能写成教程已可交付 |
| 候选不可在既有⑬指标测量 | 换 intervention/metric 或换候选 |

## 反模式

❌ “三个平台都热，所以就做这个。”

✅ “候选 C02 同时解决目标受众问题，PRIMARY 支持事实前提，抖音证据显示现有内容集中在功能介绍，本期以真实工作流代价形成差异；C01/C03 因证据弱或不可拍被淘汰。”

❌ “抖音有人搜 Claude Code 迁移，所以能证明‘验证闭环’是当前平台需求。”

✅ “该结果只证明迁移/导入需求，标 ADJACENT；继续搜索验证失败、上线回归等直接意图。若仍无直接结果，可把‘验证闭环’作为差异化观点参加比较，但明确平台证据只支持相邻需求。”

❌ “搜索 0 条，所以这是蓝海。”

✅ “搜索执行成功但返回 0 条，记为平台证据未决，不据此判断竞争度。”

## 非 Episode 模式

用户只要热点简报时，可以执行同一采集脚本到临时目录后返回当前信号摘要；不写 episode 真源。用户只要搜抖音时直接路由 `laohan-douyinsousuo`。
