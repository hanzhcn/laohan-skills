---
name: laohan-redian
version: 2.1.0
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
- 同一事件可以形成观点候选和教程候选，但本期最终只能选一个；②—④沿用选中 lane，不混写。

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

默认 source plan 是 AIHOT、Hacker News、知乎热榜、抖音热榜四路；某路失败如实记录，不能伪写成功。只有候选不足或主题明显偏产业时才用 `--sources` 替换/补充 36kr、微博或 B站，总数保持 2—5 路。

脚本只写：

- `00-选题-signals.json`
- 初始 `00-选题-source-health.json`

脚本不选题、不访问旧 episode、不调用 `douyin-ai.js`。

### 2. 标准化、去重、形成候选

读取 signals，按稳定 signal id 聚类同一事件；参考 Cheat 的 candidate 去重原则，排除同 URL/同事实事件的重复表达。同一事件只有在“帮观众作判断”和“带观众完成任务”都分别成立时才生成两个形态，不为凑数强制成对。写 schema 2 `00-选题-candidates.json`，至少两个候选，每项必须有：

- 唯一 `id`、`title`、`content_form: opinion-video|tutorial-video`、`audience_level: BEGINNER|INTERMEDIATE|ADVANCED`、`audience_problem`、`audience_promise`、`thesis`。
- `assumed_prerequisites` 与 `jargon_to_explain` 字符串数组。BEGINNER 候选必须把标题和论点里的关键工具、命令、迁移/导入概念列入解释清单，不能只提高 `audience_fit` 分。
- 非空 `signal_ids` 和 `evidence_ids`。
- 非空 `platform_query_intent`；`platform_alignment` 含 `status: ALIGNED|ADJACENT|CONTRADICTED|UNRESOLVED`、非空 `rationale` 和实际 `evidence_ids`。
- 非空 `claim_evidence_map`；每条含唯一 `claim_id`、非空 `claim`、`evidence_ids`。它要把技术事实绑定 PRIMARY，把“平台有人关心什么”绑定 PLATFORM_SIGNAL，不能让相邻关键词替另一个论点背书。
- `scorecard` 六维整数 1—5：`audience_fit`、`evidence_strength`、`platform_relevance`、`differentiation`、`production_feasibility`、`learning_value`。
- 非空 `rationale` 与 `disposition: SELECTED|REJECTED`；最终只能一个 SELECTED。

分数是可挑战的候选比较，不是流量预测。热度不能替代受众价值、证据强度、差异化或可拍性。SELECTED 必须 `platform_alignment.status: ALIGNED`。教程候选入选还必须在 `tutorial_proof` 登记 `status: VERIFIED`、本期内 `evidence_path`、`evidence_sha256`、非空 `version_boundary` 和 `recovery`；只看到官方发布或别人的教程时保持 REJECTED。

### 3. 对短名单做抖音关键词验证

为 1—3 个短名单各设计一个具体查询，交同一宿主执行 `laohan-douyinsousuo` episode 模式。必须得到 `00-抖音搜索证据.json` 与 `.md` 后才继续。

- `OK`：引用真实结果 id，写清查询实际证明的观众意图。只有结果直接支持候选标题承诺和受众任务时标 `ALIGNED`；只支持同一产品、迁移热度或相邻概念时标 `ADJACENT`，换查询或淘汰。
- `EMPTY_OR_FIELD_UNAVAILABLE`：只写“平台证据未决”，不得写“无人做/蓝海”。
- OpenCLI 登录或 adapter 全部失败：报告 `BLOCKED`，停在①。

### 4. 回到 PRIMARY 原始来源

对最终候选的事实前提查找官网、官方公告、论文、产品文档或原始公开记录。平台热榜、搜索结果、媒体转述只能是 `PLATFORM_SIGNAL` 或 `SECONDARY`。

把 PRIMARY 与 PLATFORM_SIGNAL evidence 写入候选文件；每条有稳定 `id`、`source`、`source_type`、`url`、`retrieved_at`。缺 PRIMARY 时缩窄论点为可证范围；仍无法成立就换候选或 BLOCKED。

### 5. 写最终决策与 source health

更新 `00-选题-source-health.json`，每路记录：

- 唯一 `source_id` 与 `source_role: DISCOVERY|DOUYIN_SEARCH|PRIMARY_PROOF`。
- 实际 `command_or_url`、`attempted_at`、`status`、`result_count`。
- 本期相对 `result_file` 与真实 `result_sha256`。
- FAILED 写 `error`；SKIPPED 写 `reason`。

状态必须一致：OK 条数大于 0，EMPTY/FAILED/SKIPPED 条数为 0。至少一条 DISCOVERY 为 OK、一条 DOUYIN_SEARCH 为 OK 或 EMPTY、一条 PRIMARY_PROOF 为 OK。

写 schema 2 `00-选题.json`：

- `schema_version: 2`、`selected_candidate_id`、非空 `rejected_candidate_ids`。
- 原样复制选中项的 `content_form`、`audience_level`、`audience_promise`、`assumed_prerequisites`、`jargon_to_explain`、`platform_query_intent`、`platform_alignment` 和 `claim_evidence_map`。
- `audience`、`thesis`、`evidence`、`selection_rationale`、`not_do_reason`。
- evidence 全部属于选中候选，且至少一条 PRIMARY、一条 PLATFORM_SIGNAL。
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
| OpenCLI 登录/adapter 全路径失败 | BLOCKED，不安装替代爬虫 |
| 最终候选无 PRIMARY | 缩窄论点或换候选；仍无则 BLOCKED |
| 平台结果只支持相邻话题 | 标 `ADJACENT`，换查询或淘汰；不得用差异化解释冒充语义对齐 |
| 教程候选没有本机真实执行证据 | 保持 REJECTED；可保留为待验证候选，不能写成教程已可交付 |
| 候选不可在既有⑬指标测量 | 换 intervention/metric 或换候选 |

## 反模式

❌ “三个平台都热，所以就做这个。”

✅ “候选 C02 同时解决目标受众问题，PRIMARY 支持事实前提，抖音证据显示现有内容集中在功能介绍，本期以真实工作流代价形成差异；C01/C03 因证据弱或不可拍被淘汰。”

❌ “抖音有人搜 Claude Code 迁移，所以能证明‘验证闭环’是当前平台需求。”

✅ “该结果只证明迁移/导入需求，标 ADJACENT；若选择迁移决策题就重写标题与 PRIMARY，若坚持验证闭环就重新搜索验证失败、上线回归等直接意图。”

❌ “搜索 0 条，所以这是蓝海。”

✅ “搜索执行成功但返回 0 条，记为平台证据未决，不据此判断竞争度。”

## 非 Episode 模式

用户只要热点简报时，可以执行同一采集脚本到临时目录后返回当前信号摘要；不写 episode 真源。用户只要搜抖音时直接路由 `laohan-douyinsousuo`。
