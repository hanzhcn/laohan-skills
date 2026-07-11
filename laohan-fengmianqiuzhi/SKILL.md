---
name: laohan-fengmianqiuzhi
version: 1.1
description: 真人口播封面 brief 与提示词执行器（保留旧 skill 名兼容调用）。读取当前稿和已锁定 distribution contract，生成可追溯、差异化的封面策略候选；不冒充图片 provider 或最终选择。Use when 用户说"生成封面提示词""做封面""封面""封面图""封面词"或工作流进入⑥。
---

# 封面 brief 与提示词执行器

旧名称含“秋芝”，但秋芝2046风格现在只是一个候选策略，不是默认规律。这个 Skill 只负责把当前稿转换成可比较的封面 brief/prompt；真实生图由注册的 image provider 执行，选择由 selection policy 留证。

## 边界

- 输入真源：`01-口播稿.md`、`episode-config.json` 的 `canvas` 与已锁定 `distribution_contract`。
- 输出：`05-封面/cover-prompts.md`，至少3个策略真正不同的 prompt 候选。
- 不输出：假图片、`selected-cover.json`、CTR 结论或“某风格一定爆”。
- REVIEW_GATED：最终选图留给 Jeffrey。
- AUTONOMOUS_RUN：可由 agent proxy 依据缩略图可读性与稿件一致性选择；这仍不是发布效果证明。

## Episode 前置 gate

1. `episode-config.schema_version` 为2。
2. `distribution_contract.primary_platform` 已包含在 `platforms`。
3. `master_aspect_ratio` 与 canvas 一致，`locked_at` 是有效 ISO-8601。
4. `01-口播稿.md` 标题已锁定。

任一项失败就停在⑥，不自行改画布或猜发布平台。

## 策略生成

至少生成三种视觉机制不同的候选，不是同模板换服装：

1. **信息直给**：标题语义、对象和结果一眼可见，控制文字层级。
2. **内容证据/动作**：用与稿件真实相关的动作、界面、道具或对比承载信息；不得发明产品能力或用户经历。
3. **品牌表达候选**：可以测试秋芝衍生的白底、大字、真人、夸张道具，也可以提出更适合本题的品牌策略；必须标 `UNPROVEN_STRATEGY`。

每个候选必须记录：

- `candidate_id`、`strategy_name`、`strategy_status`；
- 对应标题语义与目标受众；
- 一句话视觉故事、文字层级、缩略图最小可读目标；
- 精确 canvas/比例、safe-space 约束；
- 英文或中英混合 image prompt；
- `must_not_imply`（不能暗示的事实、能力、收益、身份）；
- 若依赖人物 reference photo，明确写 `REFERENCE_REQUIRED`，不得编造外貌。

固定短语、头部占比、白底、左右对称、字体颜色和夸张表情均不是硬要求。任何具体布局都必须说明它如何服务本期受众识别与理解。

## 输出格式

Episode mode 固定写 `05-封面/cover-prompts.md`：

```markdown
---
schema_version: 1
script_hash: <01-口播稿.md sha256>
distribution_locked_at: <ISO-8601>
prompt_executor: cover-prompt-strategy
candidate_count: 3
---

## C01 信息直给
- strategy_status: UNPROVEN_STRATEGY
- audience_job: ...
- text_plan: ...
- thumbnail_test: ...
- must_not_imply: ...

```text
<完整 prompt>
```
```

独立任务可按用户指定比例输出；不得把独立任务多比例规则带入 Episode。

## Image provider 与选择证据

prompt 写完后，编排器调用 `executor-lock.json` 已登记的 image provider 真实生成至少2张候选。原图必须放入本期 `05-封面/`，不得用旧期图片或只写 prompt 冒充。

provider 单次失败可用同一候选重试一次；仅当 `executor-lock.json` 已登记允许的 fallback 时才可切换 provider。少于2张可解码候选、全部候选违反画布/事实/可读性约束，或 default 与 fallback 均失败时，留在⑥并报告 `BLOCKED`，不得创建 `selected-cover.json` 或用旧图补位。

最终 `selected-cover.json` 至少包含：

```json
{
  "selected_asset": "05-封面/final.png",
  "title": "与当前稿一致的标题",
  "canvas": {"width": 1920, "height": 1080},
  "large_text": ["实际画面中的大字"],
  "source_prompt": "05-封面/cover-prompts.md#C01",
  "prompt_executor": "cover-prompt-strategy",
  "image_provider": "openai-imagegen",
  "selection_mode": "AGENT_PROXY",
  "script_hash": "<sha256>",
  "selected_at": "<ISO-8601>"
}
```

`cover-review.json` 必须复制 `script_hash`、`selected_asset`、`prompt_executor`、`image_provider`、`selection_mode`，写 `thumbnail_readability: "PASS"`、至少2个真实 candidates、非空 `expected_metric`、非空 `reviewer` 和有效 `reviewed_at`。每个候选记录 asset/thumbnail、缩略图可读性、与稿件一致性、选择结论和具体理由。最小结构：

```json
{
  "schema_version": 1,
  "script_hash": "<sha256>",
  "selected_asset": "05-封面/final.png",
  "prompt_executor": "cover-prompt-strategy",
  "image_provider": "openai-imagegen",
  "selection_mode": "AGENT_PROXY",
  "thumbnail_readability": "PASS",
  "candidates": [
    {"candidate_id": "C01", "asset": "05-封面/C01.png", "thumbnail": "05-封面/thumbnails/C01-320x180.png", "readability": "PASS", "script_consistency": "PASS", "verdict": "SELECTED", "reason": "具体理由"},
    {"candidate_id": "C02", "asset": "05-封面/C02.png", "thumbnail": "05-封面/thumbnails/C02-320x180.png", "readability": "PASS", "script_consistency": "PASS", "verdict": "NOT_SELECTED", "reason": "具体理由"}
  ],
  "expected_metric": "发布后固定窗口验证的指标",
  "reviewer": "审阅者",
  "reviewed_at": "<ISO-8601>"
}
```

REVIEW_GATED 的 `selection_mode` 必须是 `JEFFREY`；AUTONOMOUS_RUN 可用 `AGENT_PROXY`。

## 选择标准

本机可验证：

- 真实像素/比例正确；
- 缩到实际信息流尺寸后核心文字仍可辨；
- 标题、对象、动作和画面不冲突；
- 无水印、二维码、伪 UI、错误汉字或未核验事实；
- 候选之间有可解释差异。

发布后才能验证：点击/首屏代理、5秒留存及与同账号基线的关系。没有固定窗口数据时只能写“当前可读性选择”，不能升级某模板为默认。
