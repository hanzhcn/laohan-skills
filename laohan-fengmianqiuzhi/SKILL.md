---
name: laohan-fengmianqiuzhi
version: 1.4.0
description: 基于秋芝2046实战模板和29种场景风格生成真人口播封面；固定输出3种视觉风格，每种生成3:4、4:3、16:9三个尺寸，共9张真实候选，最终选择1个风格并保留其3个尺寸，同时绑定真实头像、provider 与选择证据。Use when 用户说"生成封面提示词""做封面""封面""封面图""封面词"或工作流进入⑥。
---

# 封面 brief 与提示词执行器

以 v1.0 经实战使用的秋芝2046模板为默认创作基线，完整恢复标题拆解、六层英文 prompt、CENTER人物写法、头部比例、白底大字、角色/动作/道具/场景差异和29种风格库；在此基础上继续扩充，不以“自由发挥”替代已有方法。v1.2 的头像 reference、provider 与选图证据合同继续保留。

## 边界

- 输入真源：`01-口播稿.md`、`episode-config.json` 的 `canvas` 与已锁定 `distribution_contract`。
- 输出：`05-封面/cover-prompts.md`，固定3个策略真正不同的视觉风格；每种分别提供3:4、4:3、16:9完整 prompt，共9个候选。
- 不输出：假图片、`selected-cover.json`、CTR 结论或“某风格一定爆”。
- REVIEW_GATED：最终选图留给 Jeffrey。
- AUTONOMOUS_RUN：可由 agent proxy 依据缩略图可读性与稿件一致性选择；这仍不是发布效果证明。

## Episode 前置 gate

1. `episode-config.schema_version` 为2。
2. `distribution_contract.primary_platform` 已包含在 `platforms`。
3. `master_aspect_ratio` 与 canvas 一致，`locked_at` 是有效 ISO-8601。
4. `01-口播稿.md` 标题已锁定。

任一项失败就停在⑥，不自行改画布或猜发布平台。

## 原版创作流程

先完整读取：

- `references/qiuzhi_analysis.md`：人物比例、平台差异和已观察到的视觉机制；
- `references/styles.md`：29种角色/场景方法库。它们可以直接使用、混合或扩充，不得压缩成少量固定标签。

1. 读取口播稿，提取核心主题、品牌/产品名、关键词和视觉意象。
2. 设计3种视觉上完全不同的画面故事。差异必须来自角色、环境、动作和夸张主道具，不是只换服装或背景色。
3. 把口播稿标题拆成三层封面大字：
   - **TOP-CENTER横式句子**：优先使用完整标题，红描边白字；标题过长时只做不改变含义的断句，不自造抽象概念。
   - **MID-LEFT关键词**：2—5字，突出主题、对象或问题。
   - **MID-RIGHT关键词**：2—5字，突出结果、冲突或情绪。
   - 具体品牌/产品名不能丢；陌生人只看封面也要知道视频讲什么。
4. 推荐与本期最匹配的V1，V2/V3保留为视觉反差备选。创新方向必须在完成这3个原版方向后再增加，不能用创新名义删掉原版输出。

好的大字来自标题并能独立看懂；“贴墙站”“拆标签”“反哺飞轮”等脱离标题的自造概念不能替代主题。

`REFERENCE_REQUIRED` 是执行合同，不是提示语。frontmatter 必须同时写 `image_provider`、`reference_mode: REQUIRED`、本期内 `reference_asset` 与 `reference_sha256`；reference 必须复制到 `05-封面/reference/`。provider 调用时必须把该文件作为 reference image 参数传入，不能只在 prompt 里说“参考头像”。

头像只锁定人物身份和真实面部特征，不锁原照片的服装、姿势、表情、背景或光线；这些按每个视觉世界重新设计。

## 原版英文提示词模板

每条 prompt 必须保留以下六层结构，只替换方括号内容：

```text
A [aspect ratio and orientation] video thumbnail cover image.

LAYOUT: Large close-up head shot with symmetrical text framing.
- TOP-CENTER: Horizontal sentence text "[完整标题]" in white (#FFFFFF) with thick bright red (#FF3333) outline, spanning the width above the person's head
- MID-LEFT: Large bold cartoon-style Chinese text "[左关键词]" in bright yellow (#FFD700) with thick black outline
- MID-RIGHT: Large bold cartoon-style Chinese text "[右关键词]" in bright yellow (#FFD700) with thick black outline, mirroring the left side
- CENTER: [完整场景描述]
- BOTTOM: Tag text "寒武纪说AI" in white with black outline

BACKGROUND: Clean white (#FFFFFF) or very light gray (#F5F5F5), minimal and flat. No gradient, unless this candidate deliberately uses one of the expanded scene worlds and clearly preserves thumbnail readability.

COLOR SCHEME: White/light background + white text with red outline + bright yellow text with black outline + colorful costume and exaggerated props.

TYPOGRAPHY: Extra bold cartoon-style Chinese font, very thick stroke outline on all text, rounded and playful, highly readable at thumbnail size.

STYLE: Photorealistic person with cosplay costume and exaggerated props. High-energy storytelling vibe. The person must look like a real photograph, NOT cartoon, NOT anime, NOT illustration.

DO NOT include: Watermarks, logos, QR codes, social media UI. Do not alter the person's identity or make the person cartoonish.
```

这套模板是默认基线，不是待删除的“模板味”。若某个扩展方向需要深色背景、非对称构图或完整场景，可以有意识突破其中一项，但必须保留同等强度的标题可读性、人物识别和故事冲击，并在方向说明里写明突破理由。

### CENTER写法

CENTER必须包含：

- `The person in the reference photo, large close-up head and upper body dominating the frame, head takes up about 25-30% of image height`
- 与本期主题直接相关的表情、姿势、服装、动作、夸张主道具和场景互动
- `Keep exact facial appearance from the reference photo.`

三种方向必须是三个不同故事。同一方向适配不同平台比例时，CENTER也要改变姿势、道具互动和场景细节，不能只替换比例字符串。

### 29种风格与扩充

`references/styles.md` 中29种风格是可直接调用的成熟库，不是只读灵感。每期先从库中挑选、混合或变体出3个强方向；若主题适合库外新场景，再把新方向追加进候选和风格库评估，不以新方向替代原有探索数量。

## 完整 prompt 合同

每条 prompt 必须可直接交给 image provider，并明确画布比例、三层文字、人物、场景、动作、服装、主道具、构图、背景、配色、字体、photorealistic约束和禁止项。若任一 prompt 只替换标题就能用于另一选题，必须重写CENTER故事。

## 输出格式

Episode mode 固定写 `05-封面/cover-prompts.md`：

```markdown
---
schema_version: 1
script_hash: <01-口播稿.md sha256>
distribution_locked_at: <ISO-8601>
prompt_executor: cover-prompt-strategy
image_provider: <executor-lock 中⑥登记的 image provider>
reference_mode: REQUIRED # 或 NONE
reference_asset: reference/jeffrey-reference.jpg # NONE 时为 null
reference_sha256: <sha256> # NONE 时为 null
style_count: 3
size_count_per_style: 3
candidate_count: 9
sizes:
  - {aspect_ratio: "3:4", width: 1080, height: 1440}
  - {aspect_ratio: "4:3", width: 1440, height: 1080}
  - {aspect_ratio: "16:9", width: 1920, height: 1080}
---

## V1 <风格名>

<为什么适合本期；使用了哪种原版/扩展风格；角色、动作、主道具和场景是什么>

### V1-3x4 · 1080×1440

```text
<完整3:4 prompt>
```

### V1-4x3 · 1440×1080

```text
<完整4:3 prompt>
```

### V1-16x9 · 1920×1080

```text
<完整16:9 prompt>
```
```

V2、V3使用同一结构。Episode 与独立任务都固定输出3种风格×3种比例，共9个完整提示词。三个尺寸不是裁切版：同一风格内也要重新安排人物姿势、道具互动和场景细节。

## Image provider 与选择证据

prompt 写完后，编排器调用 `executor-lock.json` 已登记的 image provider，把 V1/V2/V3 的3:4、4:3、16:9各真实生成一张，共9张并全部参加比较。原图必须放入本期 `05-封面/`，不得用旧期图片、同图裁切或只写 prompt 冒充。provider 若支持 reference edit，使用已登记 reference 参数；OpenAI ImageGen 对人物身份保持使用 reference-image edit 路径，不得改走 brand-new generation。

每次真实调用追加写入 `05-封面/provider-requests.json`：`schema_version: 1`、`script_hash`、`image_provider`、`reference_mode`、reference 路径/SHA，以及每个候选的 `candidate_id`、`style_id`、`aspect_ratio`、`canvas`、`source_prompt`、`reference_asset`、`reference_sha256`、`output_asset`、`output_sha256`、`requested_at`。9个候选 ID 固定为 `V1|V2|V3` 与 `3x4|4x3|16x9` 的组合。声明 REQUIRED 却缺 reference，或 output SHA/尺寸与文件不一致，立即停在⑥。

provider 单次失败可用同一候选重试一次；仅当 `executor-lock.json` 已登记允许的 fallback 时才可切换 provider。任一风格缺任一尺寸、任一候选不可解码、9张不是独立生成、候选违反事实/可读性约束，或 default 与 fallback 均失败时，留在⑥并报告 `BLOCKED`，不得创建 `selected-cover.json` 或用旧图补位。

最终 `selected-cover.json` 至少包含：

```json
{
  "selected_style_id": "V1",
  "selected_asset": "05-封面/V1-16x9.png",
  "selected_assets": [
    {"candidate_id": "V1-3x4", "aspect_ratio": "3:4", "canvas": {"width": 1080, "height": 1440}, "asset": "05-封面/V1-3x4.png", "source_prompt": "05-封面/cover-prompts.md#V1-3x4"},
    {"candidate_id": "V1-4x3", "aspect_ratio": "4:3", "canvas": {"width": 1440, "height": 1080}, "asset": "05-封面/V1-4x3.png", "source_prompt": "05-封面/cover-prompts.md#V1-4x3"},
    {"candidate_id": "V1-16x9", "aspect_ratio": "16:9", "canvas": {"width": 1920, "height": 1080}, "asset": "05-封面/V1-16x9.png", "source_prompt": "05-封面/cover-prompts.md#V1-16x9"}
  ],
  "title": "与当前稿一致的标题",
  "canvas": {"width": 1920, "height": 1080},
  "large_text": ["实际画面中的大字"],
  "source_prompt": "05-封面/cover-prompts.md#V1-16x9",
  "prompt_executor": "cover-prompt-strategy",
  "image_provider": "openai-imagegen",
  "reference_mode": "REQUIRED",
  "reference_asset": "05-封面/reference/jeffrey-reference.jpg",
  "reference_sha256": "<sha256>",
  "selection_mode": "AGENT_PROXY",
  "script_hash": "<sha256>",
  "selected_at": "<ISO-8601>"
}
```

`cover-review.json` 必须复制 `script_hash`、`selected_style_id`、`selected_asset`、`selected_assets`、`prompt_executor`、`image_provider`、`selection_mode`，写 `thumbnail_readability: "PASS"`、3个风格结论、9个真实 candidates、非空 `expected_metric`、非空 `reviewer` 和有效 `reviewed_at`。风格层只能一个 `SELECTED`；候选层记录各自尺寸、asset/thumbnail、缩略图可读性和稿件一致性。最小结构：

```json
{
  "schema_version": 1,
  "script_hash": "<sha256>",
  "selected_style_id": "V1",
  "selected_asset": "05-封面/V1-16x9.png",
  "selected_assets": ["05-封面/V1-3x4.png", "05-封面/V1-4x3.png", "05-封面/V1-16x9.png"],
  "prompt_executor": "cover-prompt-strategy",
  "image_provider": "openai-imagegen",
  "reference_mode": "REQUIRED",
  "reference_asset": "05-封面/reference/jeffrey-reference.jpg",
  "reference_sha256": "<sha256>",
  "selection_mode": "AGENT_PROXY",
  "thumbnail_readability": "PASS",
  "styles": [
    {"style_id": "V1", "verdict": "SELECTED", "reason": "具体理由"},
    {"style_id": "V2", "verdict": "NOT_SELECTED", "reason": "具体理由"},
    {"style_id": "V3", "verdict": "NOT_SELECTED", "reason": "具体理由"}
  ],
  "candidates": [
    {"candidate_id": "V1-3x4", "style_id": "V1", "aspect_ratio": "3:4", "canvas": {"width": 1080, "height": 1440}, "asset": "05-封面/V1-3x4.png", "thumbnail": "05-封面/thumbnails/V1-3x4.png", "readability": "PASS", "script_consistency": "PASS"}
  ],
  "expected_metric": "发布后固定窗口验证的指标",
  "reviewer": "审阅者",
  "reviewed_at": "<ISO-8601>"
}
```

REVIEW_GATED 的 `selection_mode` 必须是 `JEFFREY`；AUTONOMOUS_RUN 可用 `AGENT_PROXY`。

## 选择标准

先按风格分组匿名看9张缩略图，比较3个完整风格组：

- 真实像素/比例正确；
- 缩到实际信息流尺寸后核心文字仍可辨；
- 标题、对象、动作和画面不冲突；
- 无水印、二维码、伪 UI、错误汉字或未核验事实；
- 三个风格确实是不同场景、动作和主道具，不是同一模板换皮；每个风格的3个尺寸都独立构图且完整可用。

发布后才能验证：点击/首屏代理、5秒留存及与同账号基线的关系。没有固定窗口数据时只能写“当前可读性选择”，不能升级某模板为默认。
