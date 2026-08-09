---
name: laohan-fengmianqiuzhi
version: 1.6.0
description: 基于秋芝2046实战模板和29种场景风格生成真人口播封面提示词；默认提供3种视觉风格与3种比例，但只要求以固定真人头像为reference生成至少1张真实候选即可通过，是否继续生成或改用Gemini由Jeffrey决定。Use when 用户说"生成封面提示词""做封面""封面""封面图""封面词"或工作流进入⑥。
---

# 封面 brief 与提示词执行器

以 v1.0 经实战使用的秋芝2046模板为默认创作基线，完整恢复标题拆解、六层英文 prompt、CENTER人物写法、头部比例、白底大字、角色/动作/道具/场景差异和29种风格库；在此基础上继续扩充，不以“自由发挥”替代已有方法。头像 reference 硬合同继续保留；图片数量、provider日志和预先选图从完成门槛中移除。

## 边界

- 输入真源：`01-口播稿.md`、`episode-config.json` 的 `canvas` 与已锁定 `distribution_contract`。
- 人物身份真源固定为项目 `assets/identity/jeffrey-cover-reference.jpg`；新期副本固定为 `05-封面/reference/jeffrey-reference.jpg`。
- 输出：`05-封面/cover-prompts.md`，默认提供3个策略真正不同的视觉风格；每种分别提供3:4、4:3、16:9完整 prompt。提示词完成后只生成其中1张真实候选即可通过⑥。
- 不输出：假图片、CTR 结论或“某风格一定爆”。`provider-requests.json`、`cover-review.json`、`selected-cover.json` 可按需要记录，但都不是candidate/final/full硬门槛。
- 第一张图生成后由 Jeffrey判断：接受现图、继续生成更多方向，或复制提示词到 Gemini。执行器不得为了凑数量卡住后续视频制作。

## Episode 前置 gate

1. `episode-config.schema_version` 为2。
2. `distribution_contract.primary_platform` 已包含在 `platforms`。
3. `master_aspect_ratio` 与 canvas 一致，`locked_at` 是有效 ISO-8601。
4. `01-口播稿.md` 标题已锁定。
5. `episode-config.cover_identity_contract` 必须声明 `reference_mode: REQUIRED`，项目真源、本期副本和登记 SHA 完全一致。

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

好的大字来自标题并能独立看懂；”贴墙站””拆标签””反哺飞轮”等脱离标题的自造概念不能替代主题。

好的拆分示例（从标题拆出，层次清晰）：

- 标题”每次立flag两天就倒？真不是你懒” -> 横式”每次立flag两天就倒？真不是你懒” | 左”改变失败” | 右”不是你的错”
- 标题”月薪两万五被AI取代，法院判了” -> 横式”月薪两万五被AI取代，法院判了” | 左”被AI开除” | 右”真话扎心”
- 标题”花大钱补课，考场都没了” -> 横式”花大钱补课，考场都没了” | 左”AI拆考场” | 右”还在补课?”

`REFERENCE_REQUIRED` 是不可关闭的执行合同，不是提示语。frontmatter 必须同时写 `image_provider`、`reference_mode: REQUIRED`、本期内 `reference_asset` 与 `reference_sha256`；reference 必须来自项目真源并由新期创建器复制到 `05-封面/reference/`。每次实际生成都必须把该文件作为 reference image 参数传入，不能只在 prompt 里说“参考头像”，也不能使用 brand-new generation。

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
- BOTTOM: Tag text "laohanAI" in white with black outline

BACKGROUND: Clean white (#FFFFFF) or very light gray (#F5F5F5), minimal and flat. No gradient, unless this candidate deliberately uses one of the expanded scene worlds and clearly preserves thumbnail readability.

COLOR SCHEME: White/light background + white text with red outline + bright yellow text with black outline + colorful costume and exaggerated props.

TYPOGRAPHY: Extra bold cartoon-style Chinese font, very thick stroke outline on all text, rounded and playful, highly readable at thumbnail size.

STYLE: Photorealistic person with cosplay costume and exaggerated props. High-energy storytelling vibe. The person must look like a real photograph, NOT cartoon, NOT anime, NOT illustration.

DO NOT include: Watermarks, logos, QR codes, social media UI. Do not alter the person's identity or make the person cartoonish.
```

模板第一行 `A [aspect ratio and orientation] video thumbnail cover image.` 是占位符，按候选画布替换为具体写法：

- 3:4 竖版 -> `A vertical (3:4 aspect ratio) video thumbnail cover image.`
- 4:3 横版 -> `A horizontal (4:3 aspect ratio) video thumbnail cover image.`
- 16:9 宽屏 -> `A widescreen (16:9 aspect ratio) video thumbnail cover image.`

这套模板是默认基线，不是待删除的”模板味”。若某个扩展方向需要深色背景、非对称构图或完整场景，可以有意识突破其中一项，但必须保留同等强度的标题可读性、人物识别和故事冲击，并在方向说明里写明突破理由。

### CENTER写法

CENTER必须包含：

- `The person in the reference photo, large close-up head and upper body dominating the frame, head takes up about 25-30% of image height`
- 与本期主题直接相关的表情、姿势、服装、动作、夸张主道具和场景互动
- `Keep exact facial appearance from the reference photo.`

三种方向必须是三个不同故事。同一方向适配不同平台比例时，CENTER也要改变姿势、道具互动和场景细节，不能只替换比例字符串。

完整 CENTER 示例（饺子馆 - 侦探风）：

```text
The person in the reference photo, large close-up head and upper body dominating the frame, head takes up about 25-30% of image height, leaning forward with one hand on the table, squinting with curiosity. wearing a detective trench coat with a name tag that reads "AI探店员", using a magnifying glass to inspect a giant steaming bowl of dumplings where tiny glowing circuit board patterns emerge from the steam. A phone showing a GitHub skill page floats nearby. Keep exact facial appearance from the reference photo.
```

完整 CENTER 示例（三文件 - 侦探风）：

```text
The person in the reference photo, large close-up head and upper body dominating the frame, head takes up about 25-30% of image height, standing with arms crossed and one eyebrow raised, confident smirk. wearing a detective trench coat with glowing blue tech trim, three floating holographic file cards orbit around the person - each card pulses with different colors (blue, green, purple) showing "CLAUDE.md" "claude.json" "ECC hooks". Keep exact facial appearance from the reference photo.
```

注意：同样是"侦探风"，但姿势、道具互动、场景细节完全不同。

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
reference_mode: REQUIRED
reference_asset: reference/jeffrey-reference.jpg
reference_sha256: <sha256>
style_count: 3
size_count_per_style: 3
prompt_count: 9
minimum_generated_candidate_count: 1
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

V2、V3使用同一结构。Episode 与独立任务默认输出3种风格×3种比例，共9个完整提示词；这表示提示词探索数量，不表示必须生成9张图片。三个尺寸不是裁切版：同一风格内也要重新安排人物姿势、道具互动和场景细节。

## Image provider 与完成条件

prompt 写完后，从最匹配本期的一个 prompt 开始，调用可用 image provider 生成1张真实候选。图片放入本期 `05-封面/` 根目录，格式使用可解码的 PNG、JPEG 或 WebP；不得用旧期图片、占位图或只写 prompt 冒充。

这一次实际生成必须传入 `05-封面/reference/jeffrey-reference.jpg`。项目真源、本期副本与 config SHA 不一致，或调用未传 reference image 时，立即停在⑥。头像只锁人物身份，服装、姿势、表情、背景和光线仍按提示词变化。

满足以下两项即完成⑥：

1. `cover-prompts.md` 绑定当前 `01-口播稿.md` SHA、`reference_mode: REQUIRED`、本期 reference 路径/SHA；
2. `05-封面/` 根目录至少有1张真实、非空、可解码的候选图。

生成首张后立即把决定权交给 Jeffrey。只有 Jeffrey要求继续时才生成其他风格或尺寸；他也可以复制现有提示词到 Gemini。`provider-requests.json`、`cover-review.json`、`selected-cover.json` 可用于后续追踪或发布选图，但缺失不得阻塞⑪接受、`final/full` 或下一制作环节。

## 选择标准

有多张候选时再做缩略图比较；只有一张时，Jeffrey直接判断是否继续生成：

- 真实像素/比例正确；
- 缩到实际信息流尺寸后核心文字仍可辨；
- 标题、对象、动作和画面不冲突；
- 无水印、二维码、伪 UI、错误汉字或未核验事实；
- 若继续扩展多个风格，它们应是不同场景、动作和主道具，不是同一模板换皮；多个尺寸应独立构图而不是机械裁切。

发布后才能验证：点击/首屏代理、5秒留存及与同账号基线的关系。没有固定窗口数据时只能写“当前可读性选择”，不能升级某模板为默认。
