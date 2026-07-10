---
name: laohan-fengmianqiuzhi
version: 1.0
description: 基于秋芝2046视频封面风格生成Gemini图片提示词，动态生成3种差异化风格的英文提示词，每篇都不同。Use when 用户说"生成封面提示词""做封面""封面""封面图""封面词"或提到视频封面设计/Gemini生图提示词。
---

# 封面提示词生成（秋芝2046风格升级版）

继承秋芝2046的品牌识别（白底+对称大字+夸张道具），但每期根据口播稿内容动态生成差异化的姿势、道具和场景，超越秋芝的重复感。

## 核心理念

每篇都不同——秋芝的问题是同风格=同服装=同姿势，3个方案之间追求视觉反差最大化。封面大字来源于标题，不是自造概念——陌生人扫一眼就知道视频在讲什么。

## 不适用场景

- 生成视频本身 → 这是封面图提示词，不是视频生成
- 想要自定义风格（非秋芝白底大字风）→ 需要重写模板，本 skill 只输出秋芝风格
- 没有 reference photo → 提示词依赖用户上传照片到 Gemini，没有照片也能生成但无法固定人物

## 使用

```
/laohan-fengmianqiuzhi <script.md路径或主题描述>
```

## 流程

1. 读取口播稿，提取核心主题、关键词和视觉意象
2. 根据口播稿内容，设计3种**视觉上完全不同**的风格方案（不是换服装，是换整个画面故事）
3. **封面大字文案**（来源于标题，不是自造概念）：把口播稿标题拆成三部分——横式句子（TOP-CENTER）+ 左右关键词（MID-LEFT/MID-RIGHT）。原则：
   - **来源：标题**，不是从正文提炼抽象概念。标题说啥，封面就说啥
   - **必须保留主题**：读者看到封面大字就能猜到视频在讲什么
   - **陌生人能看懂**：没看过视频的人扫一眼就知道在说什么，禁止自造词（如"贴墙站""拆标签""反哺飞轮"）
   - **横式句子**：使用口播稿完整标题，不做缩短。放在顶部居中（红描边白色字）。Gemini 会根据文字长度自行决定一行显示或分行显示，不需要在提示词中强制分行
   - **左右关键词**：标题拆成两半，每边2-5字。左半=主题阐述，右半=情绪升华。两者不重复横式句子的内容
   - **有力量感**：可以用疑问句、感叹句、对比、数字制造悬念
   - **品牌名不能丢**：如果标题提到具体品牌/产品（DeepSeek、GLM、Claude），封面大字必须体现
   
   **好的例子**（从标题拆分，层次清晰）：
   - 标题"每次立flag两天就倒？真不是你懒" → 横式"每次立flag两天就倒？真不是你懒" | 左"改变失败" | 右"不是你的错"
   - 标题"月薪两万五被AI取代，法院判了" → 横式"月薪两万五被AI取代，法院判了" | 左"被AI开除" | 右"真话扎心"
   - 标题"花大钱补课，考场都没了" → 横式"花大钱补课，考场都没了" | 左"AI拆考场" | 右"还在补课?"
   
   **坏的例子**（自造概念，陌生人看不懂）：
   - "贴墙站" / "别追风" — 没看过视频的人完全不懂
   - "拆标签" / "不设限" — 抽象概念，不知道在说什么
   - "反哺飞轮" / "爱马仕" — 术语堆砌
4. 推荐第1种风格（匹配度最高的），其余2种为备选
5. **输出格式**：
   - **头部**：封面大字文案（横式句子 + 左右关键词 + 标签）+ 三种风格概览表（风格名 / 视觉故事 / 推荐理由）+ V1 推荐说明
   - **正文**：独立任务可输出多比例；Episode 模式只按 `episode-config.json` 的 canvas 与 platforms 输出，不得把泛平台比例覆盖本期画布。
   - 独立任务总共 9 个提示词；Episode 模式按本期画布输出 3 个差异化候选。
6. 输出到 `{task_dir}/{标题}_prompts.md`（与 script.md 同级）

7. 用户在 Gemini 或其他工具生成并选定封面后，把真实 PNG 或 JPEG 放入 `episodes/<slug>/05-封面/`，再登记 `selected-cover.json`；没有真实选图不得伪造这个文件。`script_hash` 必须为当前 `01-口播稿.md` 的 SHA-256；JSON 声明的画布与图片真实像素都必须匹配 `episode-config.json`，`large_text` 不得为空。最小格式：

```json
{
  "selected_asset": "05-封面/final.png",
  "title": "与 01-口播稿一致的标题",
  "canvas": {"width": 1920, "height": 1080},
  "large_text": ["顶部标题", "左关键词", "右关键词"],
  "source_prompt": "相对路径或 prompt ID",
  "script_hash": "01-口播稿.md 的 SHA-256",
  "selected_at": "ISO-8601 时间"
}
```

`laohan-bianpai` 只认该登记文件，不以 prompt 文件存在替代真实封面选择。

## 设计原则：每篇都不同

秋芝的问题是同风格=同服装=同姿势，每期封面雷同。我们要避免这个。读完口播稿后自由构思画面，3个方案之间追求**视觉反差最大化**。

## 提示词模板（英文，严格遵循）

每个提示词必须用以下模板，只替换【】中的内容：

```
A 【比例描述】 video thumbnail cover image.

LAYOUT: Large close-up head shot with symmetrical text framing.
- TOP-CENTER: Horizontal sentence text "【横式句子】" in white (#FFFFFF) with thick bright red (#FF3333) outline, spanning the full width above the person's head
- MID-LEFT: Large bold cartoon-style text "【关键词左】" in bright yellow (#FFD700) with thick black outline
- MID-RIGHT: Large bold cartoon-style text "【关键词右】" in bright yellow (#FFD700) with thick black outline, mirroring the left side
- CENTER: 【完整场景描述】
- BOTTOM: Tag text "【系列名】" in white with black outline

BACKGROUND: Clean white (#FFFFFF) or very light gray (#F5F5F5), minimal and flat. No gradient.

COLOR SCHEME: White background + white text with red outline (top sentence) + bright yellow (#FFD700) text with black outline (side keywords) + colorful costume/props.

TYPOGRAPHY: Extra bold cartoon-style Chinese font, very thick stroke outline on all text. Rounded, playful letterforms. Very readable at thumbnail size. Top sentence uses red outline, side keywords use black outline.

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
- **禁止描述外貌**：用 "The person in the reference photo, keep exact facial appearance"，用户会在 Gemini 端上传自己的照片，绝对不要编造人物外貌
- **三种比例**：3:4 竖版（抖音）/ 4:3 横版（小红书B站）/ 16:9 宽屏（B站）。每种风格全部输出3种比例
- **切换比例时改开头**：3:4 → `A vertical (3:4 aspect ratio)`，4:3 → `A horizontal (4:3 aspect ratio)`，16:9 → `A widescreen (16:9 aspect ratio)`
- **结构固定**：LAYOUT/BACKGROUND/COLOR SCHEME/TYPOGRAPHY/STYLE/DO NOT include 六层缺一不可
- **每篇差异化**：同样风格的提示词在不同口播稿之间必须视觉上可区分（不同的姿势+道具+场景）
- **同一篇内差异化**：V1/V2/V3 三个方案必须是完全不同的视觉故事，不能只是换了件衣服
- **同风格内比例差异化**：同一风格下，3种比例（3:4/4:3/16:9）的 CENTER 描述必须不同——不同的姿势、不同的道具互动、不同的场景细节。不能只换开头比例描述，CENTER 照抄。示例：3:4 可以是「双手拼装积木」，4:3 可以是「举着成品展示」，16:9 可以是「指向流水线全景」
- **头部比例**：经实测验证秋芝2046封面头部占画面高度约25-30%（非极端大头），通过中近景构图+黄色光晕+夸张表情实现视觉突出。提示词中写"large close-up head and upper body dominating the frame, head takes up about 25-30% of image height"
- **BOTTOM 标签**：使用项目系列名（当前为「寒武纪说AI」），不是「Claude Code保姆教程⑤」等编号式名称。系列名变更时以 content_branding.md 记忆文件为准
- **完整模板参考**：`workspace-shared/templates/douyin-cover-prompt.md`（含拉斐尔+秋芝两种风格）

## 风格详情

完整29种秋芝风格的视觉描述、适用场景、关键元素，见 `references/styles.md`。仅供参考灵感，不要照搬。

## 输出

```
{task_dir}/（与 script.md 同级）
└── {标题}_prompts.md
```

每个文件包含：口播稿标题 + 推荐理由 + 9个英文提示词（3种风格 × 3种比例）。

## 前置依赖

- 无特殊依赖，纯文本输出
