---
name: laohan-fengmianqiuzhi
version: 1.7.0
description: 基于三种视觉语言（秋芝白底对称系 / 拉斐尔深蓝科技场景系 / 暗色高对比戏剧系）生成真人口播封面提示词，解决"只换 cosplay 导致风格重复"的问题；默认 3 视觉语言 × 9:16 抖音 + 16:9 横屏两比例，以固定真人头像为 reference 生成至少 1 张真实候选即可通过。Use when 用户说"生成封面提示词""做封面""封面""封面图""封面词"或工作流进入⑥。
---

# 封面 brief 与提示词执行器

以经实战使用的秋芝2046白底模板为基线之一，**扩展为三种视觉语言**（白底对称系 / 深蓝科技场景系 / 暗色戏剧系）。三个候选之间必须是**视觉语言层级的真差异**，不是同一语言的三个 cosplay。头像 reference 硬合同继续保留；图片数量、provider 日志、预先选图从完成门槛中移除。

> v1.7 相对 v1.6 的变更：① 比例从 3:4/4:3/16:9 改为 **9:16（抖音）+ 16:9（横屏）**——抖音封面是 9:16，3:4 不够窄会被裁；② 风格从"29 种白底 cosplay 选 3 个"升级为"3 种视觉语言"，候选之间真不同；③ 整合拉斐尔2077深蓝科技风作为第二视觉语言。

## 边界

- 输入真源：`01-口播稿.md`、`episode-config.json` 的 `canvas` 与已锁定 `distribution_contract`。
- 人物身份真源固定为项目 `assets/identity/jeffrey-cover-reference.jpg`；新期副本固定为 `05-封面/reference/jeffrey-reference.jpg`。
- 输出：`05-封面/cover-prompts.md`，默认提供 3 种**视觉语言真正不同**的方向（白底对称系 / 深蓝科技场景系 / 暗色戏剧系）；每种分别提供 9:16 和 16:9 完整 prompt。提示词完成后只生成其中 1 张真实候选即可通过⑥。
- 不输出：假图片、CTR 结论或"某风格一定爆"。`provider-requests.json`、`cover-review.json`、`selected-cover.json` 可按需要记录，但都不是 candidate/final/full 硬门槛。
- 第一张图生成后由 Jeffrey 判断：接受现图、继续生成更多方向，或复制提示词到他选定的生图工具。执行器不得为了凑数量卡住后续视频制作。skill 本身只负责出提示词，不绑定任何具体生图工具。

## Episode 前置 gate

1. `episode-config.schema_version` 为 4（当前V5新期合同）。
2. `distribution_contract.primary_platform` 已包含在 `platforms`。
3. `master_aspect_ratio` 与 canvas 一致，`locked_at` 是有效 ISO-8601。
4. `01-口播稿.md` 标题已锁定。
5. `episode-config.cover_identity_contract` 必须声明 `reference_mode: REQUIRED`，项目真源、本期副本和登记 SHA 完全一致。

任一项失败就停在⑥，不自行改画布或猜发布平台。

## 三种视觉语言（核心：候选之间要真不同）

3 个候选必须是 3 种视觉语言，不是同一语言的 3 个 cosplay。先判断本期主题最适合哪种，选 3 种语言的组合（V1 最匹配，V2/V3 反差备选）：

- **A 白底对称系（秋芝2046原版）**：纯白/极浅灰背景 + 真人居中 + cosplay 服装+夸张道具 + 左右对称黄字卡通体。适合干货/盘点/对比/轻松入门题。来源：`references/styles.md` 29 风格（基本都属此系）。
- **B 深蓝科技场景系（拉斐尔2077）**：深蓝渐变背景（#0A1628→#1A3A5C）+ 人物中上部 + 顶部话题标签 + 底部大标题（黄+黑描边）+ 科技光感。适合严肃/产品/工具/技术题。完整模板已内嵌在本SKILL，不依赖外部参考文件。
- **C 暗色高对比戏剧系**：深色/废土/警示色背景 + 强戏剧光 + 警告/冲突情绪 + 高对比文字。适合警告/危机/行业洗牌/冲突题。来源：`styles.md` S18 末日废土 / S23 生存危机扩展。

同一种视觉语言内才换角色身份/道具/姿势；跨候选必须换视觉语言。

## 原版创作流程

先完整读取：

- `references/qiuzhi_analysis.md`：人物比例、平台差异（含抖音彩色背景实测）和已观察到的视觉机制；
- `references/styles.md`：29 种角色/场景方法库（归在视觉语言 A 白底系下）+ 视觉语言 B/C 说明。

1. 读取口播稿，提取核心主题、品牌/产品名、关键词和视觉意象。
2. 判断主题最适合哪种视觉语言（A/B/C），定 V1；V2/V3 用另外两种语言作反差备选。
3. 把口播稿标题拆成三层封面大字：
   - **TOP-CENTER 横式句子**（A 系）/ **TOP 话题标签 + BOTTOM 大标题**（B/C 系）：优先使用完整标题，红描边白字或黄字黑描边；标题过长时只做不改变含义的断句，不自造抽象概念。
   - **MID-LEFT 关键词**：2—5 字，突出主题、对象或问题。
   - **MID-RIGHT 关键词**：2—5 字，突出结果、冲突或情绪。
   - 具体品牌/产品名不能丢；陌生人只看封面也要知道视频讲什么。
4. 推荐与本期最匹配的 V1，V2/V3 保留为视觉反差备选。创新方向必须在完成这 3 个原版方向后再增加，不能用创新名义删掉原版输出。

好的大字来自标题并能独立看懂；"贴墙站""拆标签""反哺飞轮"等脱离标题的自造概念不能替代主题。

好的拆分示例（从标题拆出，层次清晰）：

- 标题"每次立 flag 两天就倒？真不是你懒" -> 横式"每次立 flag 两天就倒？真不是你懒" | 左"改变失败" | 右"不是你的错"
- 标题"月薪两万五被 AI 取代，法院判了" -> 横式"月薪两万五被 AI 取代，法院判了" | 左"被 AI 开除" | 右"真话扎心"
- 标题"花大钱补课，考场都没了" -> 横式"花大钱补课，考场都没了" | 左"AI 拆考场" | 右"还在补课?"

`REFERENCE_REQUIRED` 是不可关闭的执行合同，不是提示语。frontmatter 必须同时写 `image_provider`、`reference_mode: REQUIRED`、本期内 `reference_asset` 与 `reference_sha256`；reference 必须来自项目真源并由新期创建器复制到 `05-封面/reference/`。每次实际生成都必须把该文件作为 reference image 参数传入，不能只在 prompt 里说"参考头像"，也不能使用 brand-new generation。

头像只锁定人物身份和真实面部特征，不锁原照片的服装、姿势、表情、背景或光线；这些按每个视觉世界重新设计。

## 英文提示词模板（六层框架，按视觉语言分变体）

每条 prompt 必须保留六层结构。LAYOUT / BACKGROUND / COLOR SCHEME / TYPOGRAPHY / STYLE 按视觉语言 A/B/C 取对应变体；CENTER 和 DO NOT 三种语言共通。

### 视觉语言 A — 白底对称系（秋芝）

```text
A [aspect ratio and orientation] video thumbnail cover image.

LAYOUT: Large close-up head shot with symmetrical text framing.
- TOP-CENTER: Horizontal sentence text "[完整标题]" in white (#FFFFFF) with thick bright red (#FF3333) outline, spanning the width above the person's head
- MID-LEFT: Large bold cartoon-style Chinese text "[左关键词]" in bright yellow (#FFD700) with thick black outline
- MID-RIGHT: Large bold cartoon-style Chinese text "[右关键词]" in bright yellow (#FFD700) with thick black outline, mirroring the left side
- CENTER: [完整场景描述]
- BOTTOM: Tag text "laohanAI" in white with black outline

BACKGROUND: Clean white (#FFFFFF) or very light gray (#F5F5F5), minimal and flat. No gradient.

COLOR SCHEME: White/light background + white text with red outline + bright yellow text with black outline + colorful costume and exaggerated props.

TYPOGRAPHY: Extra bold cartoon-style Chinese font, very thick stroke outline on all text, rounded and playful, highly readable at thumbnail size.

STYLE: Photorealistic person with cosplay costume and exaggerated props. High-energy storytelling vibe. The person must look like a real photograph, NOT cartoon, NOT anime, NOT illustration.

DO NOT include: Watermarks, logos, QR codes, social media UI. Do not alter the person's identity or make the person cartoonish.
```

### 视觉语言 B — 深蓝科技场景系（拉斐尔2077）

```text
A [aspect ratio and orientation] video thumbnail cover image.

LAYOUT: Three-tier vertical composition (for 9:16) / horizontal tech-news composition (for 16:9).
- TOP: A bold yellow hashtag text "[话题标签]" with a series tag "[系列名]" in small white text beside it
- CENTER: A person's portrait positioned in the center-upper area, with a subtle white glow outline edge to separate from background. [完整场景描述] Keep exact facial appearance from the reference photo.
- BOTTOM: Large bold Chinese title text "[主标题]" in bright yellow (#FFD700) with black stroke outline. Optional second line "[副标题]" in smaller white text.
- BOTTOM-LEFT corner: Small brand text "laohanAI" in white, minimal and unobtrusive.

BACKGROUND: Deep blue gradient (dark navy #0A1628 to medium blue #1A3A5C), clean and minimal. Slight tech-feel glow emanating from center.

COLOR SCHEME: High contrast — deep navy background + bright yellow text (#FFD700) + white secondary text + black text outlines.

TYPOGRAPHY: Bold sans-serif Chinese font (Noto Sans CJK Heavy / 思源黑体 Heavy), thick strokes, very readable at small thumbnails. Title has black stroke outline. All text horizontal.

STYLE: Professional tech content creator thumbnail. Clean, high-contrast, information-forward. Photorealistic person, cinematic rim light. NOT cartoon, NOT cute, NOT 3D.

DO NOT include: Watermarks, logos, QR codes, social media UI, multiple images collage. Do not alter the person's identity.
```

### 视觉语言 C — 暗色高对比戏剧系

```text
A [aspect ratio and orientation] video thumbnail cover image.

LAYOUT: Dramatic centered subject with high-contrast warning text.
- TOP-CENTER: Horizontal sentence text "[完整标题]" in bright yellow (#FFD700) with thick black outline, or warning red (#FF3333) with white outline
- MID-LEFT / MID-RIGHT: Large bold Chinese keyword text "[左/右关键词]" with thick outline, color tuned to warning or crisis tone
- CENTER: [完整场景描述，含紧张/严肃表情、戏剧光、警示或废土道具]
- BOTTOM: Tag text "laohanAI" in white with black outline

BACKGROUND: Dark/desaturated dramatic scene (deep charcoal, wasteland, dim red warning glow, or storm). Cinematic lighting, strong rim light on subject. NOT clean white.

COLOR SCHEME: Dark background + high-contrast text (yellow/red/white with thick outline) + desaturated or warning-color props.

TYPOGRAPHY: Extra bold Chinese font, very thick stroke outline, urgent/dramatic feel, highly readable at thumbnail size.

STYLE: Photorealistic person in dramatic/crisis setting. High tension storytelling vibe. The person must look like a real photograph, NOT cartoon, NOT anime.

DO NOT include: Watermarks, logos, QR codes, social media UI. Do not alter the person's identity or make the person cartoonish.
```

模板第一行 `A [aspect ratio and orientation] video thumbnail cover image.` 是占位符，按候选画布替换为具体写法：

- 9:16 抖音竖版（主） -> `A vertical (9:16 aspect ratio) video thumbnail cover image.`
- 16:9 横屏（备） -> `A widescreen (16:9 aspect ratio) video thumbnail cover image.`

同一视觉语言内，9:16 和 16:9 也要重新安排人物位置、构图和文字排布，不能只替换比例字符串。

### CENTER 写法

CENTER 必须包含：

- `The person in the reference photo, large close-up head and upper body dominating the frame, head takes up about 25-30% of image height`（视觉语言 B 可写"positioned in the center-upper area"）
- 与本期主题直接相关的表情、姿势、服装、动作、夸张主道具和场景互动
- `Keep exact facial appearance from the reference photo.`

三个方向必须是三个不同视觉语言、三个不同故事。同一方向适配 9:16/16:9 时，CENTER 也要改变姿势、道具互动和场景细节。

完整 CENTER 示例（视觉语言 A 白底 - 三文件侦探风）：

```text
The person in the reference photo, large close-up head and upper body dominating the frame, head takes up about 25-30% of image height, standing with arms crossed and one eyebrow raised, confident smirk. wearing a detective trench coat with glowing blue tech trim, three floating holographic file cards orbit around the person - each card pulses with different colors (blue, green, purple) showing "CLAUDE.md" "claude.json" "ECC hooks". Keep exact facial appearance from the reference photo.
```

### 29 种风格与扩充

`references/styles.md` 中 29 种风格（基本归在视觉语言 A 白底系下）是可直接调用的成熟库，不是只读灵感。视觉语言 A 的候选从中挑选、混合或变体；视觉语言 B（深蓝科技）的完整拉斐尔风模板已内嵌在本文件；视觉语言 C（暗色戏剧）从 S18/S23 等扩展。若主题适合库外新场景，再把新方向追加进候选和风格库评估，不以新方向替代原有探索数量。

## 完整 prompt 合同

每条 prompt 必须可直接交给 image provider，并明确画布比例、文字层、人物、场景、动作、服装、主道具、构图、背景、配色、字体、photorealistic 约束和禁止项。若任一 prompt 只替换标题就能用于另一选题，必须重写 CENTER 故事。

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
visual_language_count: 3
size_count_per_language: 2
prompt_count: 6
minimum_generated_candidate_count: 1
sizes:
  - {aspect_ratio: "9:16", width: 1080, height: 1920, usage: "抖音主"}
  - {aspect_ratio: "16:9", width: 1920, height: 1080, usage: "横屏备"}
---

## V1 <视觉语言名 - 具体方向>

<为什么适合本期；用了哪种视觉语言（A/B/C）；角色、动作、主道具和场景是什么>

### V1-9x16 · 1080×1920（抖音）

```text
<完整 9:16 prompt>
```

### V1-16x9 · 1920×1080（横屏）

```text
<完整 16:9 prompt>
```
```

V2、V3 使用同一结构，且必须是另外两种视觉语言。Episode 与独立任务默认输出 3 种视觉语言 × 2 种比例，共 6 个完整提示词；这表示提示词探索数量，不表示必须生成 6 张图片。两个尺寸不是裁切版：同一视觉语言内也要重新安排人物姿势、道具互动和场景细节。

## Image provider 与完成条件

prompt 写完后，从最匹配本期的一个 prompt 开始，调用可用 image provider 生成 1 张真实候选。图片放入本期 `05-封面/` 根目录，格式使用可解码的 PNG、JPEG 或 WebP；不得用旧期图片、占位图或只写 prompt 冒充。

这一次实际生成必须传入 `05-封面/reference/jeffrey-reference.jpg`。项目真源、本期副本与 config SHA 不一致，或调用未传 reference image 时，立即停在⑥。头像只锁人物身份，服装、姿势、表情、背景和光线仍按提示词变化。

满足以下两项即完成⑥：

1. `cover-prompts.md` 绑定当前 `01-口播稿.md` SHA、`reference_mode: REQUIRED`、本期 reference 路径/SHA；
2. `05-封面/` 根目录至少有 1 张真实、非空、可解码的候选图。

生成首张后立即把决定权交给 Jeffrey。只有 Jeffrey 要求继续时才生成其他视觉语言或尺寸；他也可以复制现有提示词到他选定的生图工具。`provider-requests.json`、`cover-review.json`、`selected-cover.json` 可用于后续追踪或发布选图，但缺失不得阻塞⑪接受、`final/full` 或下一制作环节。

## 选择标准

有多张候选时再做缩略图比较；只有一张时，Jeffrey 直接判断是否继续生成：

- 真实像素/比例正确（9:16 抖音或 16:9 横屏）；
- 缩到实际信息流尺寸后核心文字仍可辨；
- 标题、对象、动作和画面不冲突；
- 无水印、二维码、伪 UI、错误汉字或未核验事实；
- 若继续扩展多个方向，它们应是不同视觉语言、不同场景和主道具，不是同一模板换皮；多个尺寸应独立构图而不是机械裁切。

发布后才能验证：点击/首屏代理、5 秒留存及与同账号基线的关系。没有固定窗口数据时只能写"当前可读性选择"，不能升级某模板为默认。
