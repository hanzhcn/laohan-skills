---
name: laohan-fengmianqiuzhi
version: 1.20.0
description: 根据真人AI口播稿和 Jeffrey 身份参考图，默认采用秋芝03KV视觉系统，选择1个语义最匹配的场景模板，只生成同一方案的3:4、4:3、16:9三张真实尺寸封面。Use when 用户说“生成封面提示词”“做封面”“封面”“封面图”“封面词”或工作流进入⑥。
---

# 秋芝封面：一个方案，三个尺寸

目标：从口播稿提炼一个点击钩子，由执行者选择最匹配的秋芝场景，形成**一个视觉方案**，并分别生成3:4、4:3、16:9三张真实尺寸成图。三张图共享标题、人物身份、主题世界、主物件和视觉事件，但按各自画布重新构图。默认视觉系统固定为Jeffrey已认可的秋芝03KV：真人头部保真、小型主题化3D身体或广告角色身体、主物件朝镜头前伸、高饱和三光场景、上方超大黄白标题。

不生成候选排名，不生成额外9:16母版，不把裁切、拉伸、扩边或发布页取景冒充尺寸适配。

## 输入与边界

- `episode-config.schema_version`为4；身份reference或稿件绑定不满足时停止，不自行改合同。
- 读取当前`01-口播稿.md`、`12-发布/多平台发布内容.md`和锁定的抖音发布信息。
- 人物参考固定为本期`05-封面/reference/jeffrey-reference.jpg`，作为image reference传给生图模型。
- 完整读取`references/douyin-cover-study.md`的秋芝部分、`references/qiuzhi-template-library.md`和`samples/baseline-cover-03-kv-prompt.txt`。
- 不在prompt中写“模仿某博主风格”，只使用公开样本中可观察的版式规律。
- 不拆成无字底图、贴头合成、排字脚本或评分器。整图生成失败时只修正原prompt和seed，每个尺寸最多重采2次。

## 1. 提炼唯一视觉主张

从口播稿提炼：

- `主标题`：4—10个汉字，最多两行；保留真正影响理解的产品名。
- `辅助短句`：0—8个汉字；主标题已经说清楚时省略。
- `视觉事件`：Jeffrey正在对一个主题物件做什么，以及动作呈现的结果或冲突。

禁止“AI神器”“效率翻倍”等可套用到任何选题的空话。所有文字和画面结论不得超出口播稿事实。

## 2. 选择一个秋芝场景

1. 按口播核心冲突在模板库内部筛出5—8个模板。
2. 只选择1个语义最命中的模板；执行者直接裁决，不把备选方案交给Jeffrey选择。
3. 一期只用`1个基础模板 + 最多1个主物件机制`。
4. 能读取历史时，避免重复上一期已发布模板族；不能读取时不假装已检查。
5. `CONDITIONAL_ONLY`只在语义明确匹配时使用。不能因为选题与AI有关，就默认实验室、未来办公室、驾驶舱或宇航场景。

03KV是固定视觉系统，模板只决定主题世界、服装、动作、主物件和色相。不要在一期内混用多种风格。

## 3. 生成人物与场景合同

生成前分析本期reference，动态记录真实可见的脸型、发型、眼镜、胡须、痣、肤色和神态。每张prompt都必须包含：

- 头部photoreal，保留真实皮肤纹理、毛孔和五官结构；禁止磨皮、变脸、Q版脸或3D卡通脸。
- 大头反差来自身体缩小，不改变头部形状和五官比例。
- 头顶到下巴占画面高度16%—26%，人物总体占48%—72%，禁止全身小人缩在底部。
- 表情明确为惊讶、兴奋、笃定或质疑，禁止普通微笑和放松站立。
- 人物或主物件朝镜头前伸，形成强透视；动作必须是托举、打开、操作、检验、指向或对抗之一。
- 主物件是标题的视觉翻译，只有一个，必须大而清楚。
- 人物周围用3—4个主题相关的小型发光3D挂件组成松散弧线，不堆无关装饰。
- 高饱和亮泽广告KV；物件主题光染脸、冷色轮廓光、顶部柔光/体积光组成三光系统，并有粒子、气泡或光束之一。
- 主标题位于主要安全区上方，黄/白超粗体、粗黑描边和硬阴影，手机缩略图可读；英文眉题可选。
- Exactly one Jeffrey；禁止额外人物、平台UI、水印、二维码及声明外文字。

`samples/baseline-cover-03-kv-prompt.txt`是结构基线。新期只替换主题场景、主物件、标题组、主题服装和表情；前伸透视、三光、高饱和、比例和负面清单保持不变。

共用文字约束：

```text
Render only the following Chinese cover text, exactly as written, with no missing, substituted or extra characters: “[主标题]” and, only when provided, “[辅助短句]”. The Chinese text must be large, crisp, correctly spelled and readable at phone-thumbnail size. Do not render any other words, letters or numbers.
```

## 4. 只生成三个真实尺寸

在`05-封面/cover-prompts.md`为同一方案写3条完整prompt，并传入同一reference。每条都重新描述人物位置、标题断行、安全区、主物件大小和景别，不写“裁切上一张”或“沿用母版”。

| 比例 | 文件名 | 硬尺寸 | 逻辑用途 |
|---|---|---:|---|
| 3:4 | `cover-qiuzhi-3x4.<ext>` | 1080×1440 | 抖音竖封面、视频号个人主页、小红书 |
| 4:3 | `cover-qiuzhi-4x3.<ext>` | 1440×1080 | 抖音横封面、视频号分享卡、B站首页 |
| 16:9 | `cover-qiuzhi-16x9.<ext>` | 1920×1080 | B站个人空间 |

`ext`只允许png、jpg、jpeg或webp。三个比例各自独立生成和构图，只产出这3个物理文件，对应四平台7个逻辑入口。默认发布源是3:4成图；平台需要其他比例时使用已生成的对应文件。

## 5. 逐张复核

每张生成后都放大复核，任一为假即修改该尺寸原prompt并重生：

`exactTitle`／`samePerson`／`singlePerson`／`faceProminent`／`expressiveAction`／`expressionContrast`／`heroObjectClear`／`compositionIntegrated`／`thumbnailLegible`／`safeAtTargetRatio`／`noExtraText`／`noWatermark`。

`exactTitle`必须逐字符检查，英文逐字母检查。三张还必须并排确认属于同一方案，同时检查它们没有裁切掉脸、主物件或标题。机械尺寸通过不等于人物、错字和缩略图观感已通过。

## 6. 输出

写入`05-封面/cover-prompts.md`：

```markdown
---
schema_version: 4
script_hash: <01-口播稿.md sha256>
distribution_locked_at: <ISO-8601>
prompt_executor: cover-prompt-strategy
image_provider: <实际provider>
reference_mode: REQUIRED
reference_asset: reference/jeffrey-reference.jpg
reference_sha256: <sha256>
strategy: QIUZHI_SINGLE_STYLE_THREE_SIZES
visual_system: QIUZHI_03KV
primary_aspect_ratio: "3:4"
required_generated_candidate_count: 1
required_physical_cover_count: 3
required_logical_cover_usage_count: 7
default_publish_candidate: cover-qiuzhi-3x4
---

## 封面文字
- 主标题：<准确原文与断行>
- 辅助短句：<原文或无>
- 事实绑定：<对应口播稿哪一判断>

## 唯一方案｜秋芝03KV
- 模板族：<族名>
- 模板：<S编号＋模板名>
- 选择理由：<为什么最适合本期冲突>
- 视觉事件：<人物动作、主物件与结果>

## 3:4
<完整生成提示词>

## 4:3
<完整生成提示词>

## 16:9
<完整生成提示词>
```

同时写`05-封面/cover-manifest.json`，`schema_version`为2，声明`skill_version`、`visual_system`、`selected_template`、reference/script SHA、三张`sizes`的文件名/尺寸/SHA/req/resp和`texts`。不得声明不存在的9:16母版或rank。

不要宣称复制任何账号的CTR或独特风格。这里只借鉴公开封面中可观察的通用版式规律。
