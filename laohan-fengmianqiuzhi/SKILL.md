---
name: laohan-fengmianqiuzhi
description: 基于秋芝2046视频封面风格生成Gemini图片提示词。接收口播稿路径或主题描述，根据口播稿内容动态生成3种差异化风格的英文Gemini提示词，每篇都不同，输出到桌面。使用场景：(1) 用户说"生成封面提示词"、"做封面"、"封面" (2) 用户提供口播稿script.md要求生成视频封面提示词 (3) 视频制作需要封面设计参考。触发词：/laohan-fengmianqiuzhi
---

# 封面提示词生成（秋芝2046风格升级版）

继承秋芝2046的品牌识别（白底+对称大字+夸张道具），但每期根据口播稿内容动态生成差异化的姿势、道具和场景，超越秋芝的重复感。

## 使用

```
/laohan-fengmianqiuzhi <script.md路径或主题描述>
```

## 流程

1. 读取口播稿，提取核心主题、关键词和视觉意象
2. 根据口播稿内容，设计3种**视觉上完全不同**的风格方案（不是换服装，是换整个画面故事）
3. 从口播稿中提炼4-8个字的关键词，分成左右两半（每边2-4字），要短、要大、要有冲击力（如"饺子馆" / "变Skill"，不是把完整标题塞进去）
4. 推荐第1种风格（匹配度最高的），其余2种为备选
5. **输出格式**：
   - **每种风格（V1、V2、V3）**：全部输出3种比例（3:4 抖音 / 4:3 小红书B站 / 16:9 B站）
   - 总共 9 个提示词
6. 输出到 `~/Desktop/fengmian_prompts/{标题}_prompts.md`

## 设计原则：每篇都不同

秋芝的问题是同风格=同服装=同姿势，每期封面雷同。我们要避免这个。读完口播稿后自由构思画面，3个方案之间追求**视觉反差最大化**。

## 提示词模板（英文，严格遵循）

每个提示词必须用以下模板，只替换【】中的内容：

```
A 【比例描述】 video thumbnail cover image.

LAYOUT: Large close-up head shot with symmetrical text framing.
- TOP-LEFT: Large bold cartoon-style text "【标题左半】" in bright yellow (#FFD700) with thick black outline
- TOP-RIGHT: Large bold cartoon-style text "【标题右半】" in bright yellow (#FFD700) with thick black outline, mirroring the left side
- CENTER: 【完整场景描述】
- BOTTOM: Tag text "【系列名#期号】" in white with black outline, bottom-center

BACKGROUND: Clean white (#FFFFFF) or very light gray (#F5F5F5), minimal and flat. No gradient.

COLOR SCHEME: White background + bright yellow (#FFD700) or orange text + thick black outlines + colorful costume/props.

TYPOGRAPHY: Extra bold cartoon-style Chinese font, very thick black stroke outline on all text. Rounded, playful letterforms. Very readable at thumbnail size. Text split symmetrically left and right of the person's head.

STYLE: Photorealistic person with cosplay costume and exaggerated props. High energy storytelling vibe. The person must look like a real photograph, NOT cartoon, NOT anime, NOT illustration. Fun, youthful, Bilibili-style content creator thumbnail.

DO NOT include: Watermarks, logos, QR codes, social media UI. DO NOT make the person look cartoonish or animated.
```

### CENTER 描述写法

CENTER 是每张封面唯一自由发挥的段落。根据口播稿主题，自由组合姿势、表情、服装、道具、场景，没有固定要素清单。秋芝每张封面的表情/姿势/场景都不同，我们也一样。

**必须包含**：
- 人物身份固定句：`The person in the reference photo, large close-up head and upper body dominating the frame, head takes up about 25-30% of image height`
- 结尾固定句：`Keep exact facial appearance from the reference photo.`
- 中间全部自由发挥，根据主题自然描述

**示例（饺子馆 - 侦探风）**：
```
The person in the reference photo, large close-up head and upper body dominating the frame, head takes up about 25-30% of image height, leaning forward with one hand on the table, squinting with curiosity. wearing a detective trench coat with a name tag that reads "AI探店员", using a magnifying glass to inspect a giant steaming bowl of dumplings where tiny glowing circuit board patterns emerge from the steam. A phone showing a GitHub skill page floats nearby. Keep exact facial appearance from the reference photo.
```

**示例（三文件 - 侦探风）**：
```
The person in the reference photo, large close-up head and upper body dominating the frame, head takes up about 25-30% of image height, standing with arms crossed and one eyebrow raised, confident smirk. wearing a detective trench coat with glowing blue tech trim, three floating holographic file cards orbit around the person — each card pulses with different colors (blue, green, purple) showing "CLAUDE.md" "claude.json" "ECC hooks". Keep exact facial appearance from the reference photo.
```

注意：同样是"侦探风"，但姿势、道具互动、场景细节完全不同。

## 风格生成原则

**不预设风格列表。** 读完口播稿后，根据内容自然构思画面——什么角色、什么道具、什么场景，完全由主题决定。3个方案之间追求**视觉反差最大化**（完全不同的画面故事），具体怎么实现没有限制。

## 关键规则

- **英文提示词**：Gemini 对英文理解更准确，效果更好
- **真实人物**：STYLE 必须写 "Photorealistic person... NOT cartoon, NOT anime, NOT illustration"，禁止生成卡通/动漫人物
- **禁止描述外貌**：用 "The person in the reference photo, keep exact facial appearance"，Jeffrey 会在 Gemini 端上传自己的照片，绝对不要编造人物外貌
- **三种比例**：3:4 竖版（抖音）/ 4:3 横版（小红书B站）/ 16:9 宽屏（B站）。每种风格全部输出3种比例
- **切换比例时改开头**：3:4 → `A vertical (3:4 aspect ratio)`，4:3 → `A horizontal (4:3 aspect ratio)`，16:9 → `A widescreen (16:9 aspect ratio)`
- **结构固定**：LAYOUT/BACKGROUND/COLOR SCHEME/TYPOGRAPHY/STYLE/DO NOT include 六层缺一不可
- **每篇差异化**：同样风格的提示词在不同口播稿之间必须视觉上可区分（不同的姿势+道具+场景）
- **同一篇内差异化**：V1/V2/V3 三个方案必须是完全不同的视觉故事，不能只是换了件衣服
- **头部比例**：经实测验证秋芝2046封面头部占画面高度约25-30%（非极端大头），通过中近景构图+黄色光晕+夸张表情实现视觉突出。提示词中写"large close-up head and upper body dominating the frame, head takes up about 25-30% of image height"
- **完整模板参考**：`workspace-shared/templates/douyin-cover-prompt.md`（含拉斐尔+秋芝两种风格）

## 风格详情

完整29种秋芝风格的视觉描述、适用场景、关键元素，见 `references/styles.md`。仅供参考灵感，不要照搬。

## 输出

```
~/Desktop/fengmian_prompts/
└── {标题}_prompts.md
```

每个文件包含：口播稿标题 + 推荐理由 + 9个英文提示词（3种风格 × 3种比例）。

## 前置依赖

- 无特殊依赖，纯文本输出
