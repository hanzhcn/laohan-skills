---
name: laohan-fengmianqiuzhi
version: 1.16.0
description: 根据真人AI口播稿和 Jeffrey 身份参考图，生成3张排序9:16视觉母版，并为选中rank生成3张3:4/4:3/16:9真实封面，共享到四平台7个逻辑入口。Use when 用户说“生成封面提示词”“做封面”“封面”“封面图”“封面词”或工作流进入⑥。
---

# 真人口播封面直接生成

目标：从口播稿提炼一个跨平台可成立的点击钩子，只使用秋芝方向，按推荐顺序直接生成3张“人物＋场景＋准确中文标题”的9:16视觉母版，再以默认01或 Jeffrey 明确改选的同一rank生成3张真实尺寸封面，共享到四平台7个逻辑入口。三个比例必须分别重新构图和生成，不把裁切或发布页临时取景当成适配。不要拆成无字底图、排字脚本、评分器或多阶段合成。

## 输入与边界

- `episode-config.schema_version` 为4；身份reference或稿件绑定不满足时停止，不自行改合同。
- 读取当前 `01-口播稿.md`、`12-发布/多平台发布内容.md`和锁定的抖音发布信息。
- 人物参考固定为本期 `05-封面/reference/jeffrey-reference.jpg`，并作为 image reference 传给生图模型。
- ⑥先生成3张9:16完整候选，再为默认01生成3张共享真实尺寸封面；Jeffrey明确改选02或03时，⑫前必须为新rank重新生成这3张，旧rank成品不能混用。不允许简单裁掉人物、主物件或标题。
- 不在 prompt 中写“模仿某博主风格”。只使用 `references/douyin-cover-study.md` 的秋芝观察和 `references/qiuzhi-template-library.md`。
- 默认只生成3个秋芝方向候选；拉斐尔和柱子哥方向暂不进入默认输出。
- 三张按推荐程度从高到低排列为`01 → 02 → 03`。没有Jeffrey明确改选时，后续发布自动化优先使用`01`作为发布封面的源候选。

## 执行

### 1. 提炼封面文字

从口播稿提炼：

- `主标题`：4—10个汉字，最多两行；保留真正影响理解的产品名。
- `辅助短句`：0—8个汉字；主标题已经说清楚时不要添加。
- `画面事件`：Jeffrey正在做什么，他面对什么具体问题或结果。

禁止“AI神器”“效率翻倍”等可套用到任何选题的空话。封面文字不能超出口播稿事实。

### 2. 选择3个秋芝模板并排序

完整读取 `references/douyin-cover-study.md` 的秋芝部分和 `references/qiuzhi-template-library.md`，先按口播核心冲突筛选模板。

1. 先在内部筛出语义最匹配的5—8个模板。
2. 最终选择3个不同模板族；三张不能只是同一空间换衣服或换颜色。
3. 每张独立遵守`1个基础模板 + 最多1个主物件机制`。
4. 按“口播钩子匹配度 → 手机缩略图辨识度 → 人物动作与主物件关系 → 与近期候选的差异”排序。`01`必须是本期最推荐方案，不随机排序。
5. 禁止凭“AI感”默认选择宇航员、驾驶舱、未来办公室或实验室；`CONDITIONAL_ONLY`仍只在语义明确匹配时使用。

每条提示词都必须一次性描述：

1. 9:16抖音完整封面；
2. Jeffrey的身份、位置、表情、动作和服装；
3. 与本期直接相关的一个主场景或主物件；
4. 主标题和可选辅助短句的准确原文、断行、位置、颜色、粗黑描边；
5. 该方向对应的版式规律；
6. 禁止错字、多余文字、平台UI、水印、二维码、额外人物和无关装饰。

共用身份约束：

```text
Use the supplied portrait as the non-replaceable identity reference for Jeffrey. Preserve his recognizable face shape, glasses, short hair, moustache and goatee, chin mole, skin tone and age impression. Exactly one Jeffrey.
```

共用文字约束：

```text
Render only the following Chinese cover text, exactly as written, with no missing, substituted or extra characters: “[主标题]” and, only when provided, “[辅助短句]”. The Chinese text must be large, crisp, correctly spelled and readable at phone-thumbnail size. Do not render any other words, letters or numbers.
```

### 3. 直接生成3张

- 用3条提示词分别调用 image provider，并传入同一张 Jeffrey reference。
- 三张都生成9:16完整成图，按推荐顺序保存为`cover-01-qiuzhi-9x16.<ext>`、`cover-02-qiuzhi-9x16.<ext>`、`cover-03-qiuzhi-9x16.<ext>`；`ext`只允许png、jpg、jpeg或webp。
- 完整成图直接保存到 `05-封面/` 根目录；不创建 `backgrounds/`，不运行后排字脚本。
- 如果中文错字、人物不像或主题画错，只修正原提示词并重生该张；不要增加新流程。
- 三张排序候选真实、可解码、9:16且命名符合顺序，并且默认01的3张共享尺寸成品全部真实可解码、尺寸正确后，才满足⑥机械门槛。人物身份、标题准确度、主题一致性、缩略图安全区必须在当前任务中逐张视觉复看后如实报告，但不新增review文件或生产阶段。
- Jeffrey可明确改选02或03；没有明确改选时，发布准备默认从01适配平台所需封面比例，不能静默改用02或03。

### 4. 一次生成3张共享尺寸真实成品

在 `cover-prompts.md` 末尾增加 `## 四平台封面成品`，并为当前发布rank分别编写3条完整生成提示词、调用 image provider、传入同一 Jeffrey reference。三张保持同一视觉主张、主标题、人物和主物件，但必须按真实画布、安全区和断行分别重新构图：

- 3:4：`cover-<rank>-qiuzhi-3x4.<ext>`，必须1080×1440；共享到抖音竖封面、视频号个人主页卡片和小红书。
- 4:3：`cover-<rank>-qiuzhi-4x3.<ext>`，必须1440×1080；共享到抖音横封面、视频号分享卡片和B站首页推荐。
- 16:9：`cover-<rank>-qiuzhi-16x9.<ext>`，必须1920×1080；用于B站个人空间。

只生成这3个物理文件，同比例平台直接复用；平台属性差异由各自标题、介绍、话题和发布字段承担。三张封面仍绑定同一rank源图与SHA；不得把任一比例简单中心裁切、扩边或在发布页拖动取景后冒充另一比例。

## 输出

写入 `05-封面/cover-prompts.md`：

```markdown
---
schema_version: 3
script_hash: <01-口播稿.md sha256>
distribution_locked_at: <ISO-8601>
prompt_executor: cover-prompt-strategy
image_provider: <实际provider>
reference_mode: REQUIRED
reference_asset: reference/jeffrey-reference.jpg
reference_sha256: <sha256>
strategy: QIUZHI_THREE_RANKED_DIRECT_COVERS
primary_aspect_ratio: "9:16"
required_generated_candidate_count: 3
required_physical_cover_count: 3
required_logical_cover_usage_count: 7
publish_priority: "01>02>03"
default_publish_candidate: cover-01-qiuzhi-9x16
---

## 封面文字
- 主标题：<准确原文与断行>
- 辅助短句：<原文或无>
- 事实绑定：<对应口播稿哪一判断>

## 01｜秋芝方向｜最推荐
- 模板族：<族名>
- 模板：<S编号＋模板名>
- 推荐理由：<为什么最适合本期钩子>
<一条可直接生成完整封面的英文提示词>

## 02｜秋芝方向｜第二推荐
- 模板族：<与01不同的族名>
- 模板：<S编号＋模板名>
- 推荐理由：<为什么排第二>
<一条可直接生成完整封面的英文提示词>

## 03｜秋芝方向｜第三推荐
- 模板族：<与01、02不同的族名>
- 模板：<S编号＋模板名>
- 推荐理由：<为什么排第三>
<一条可直接生成完整封面的英文提示词>
```

不要宣称复制某个账号的CTR或独特风格。这里只借鉴公开封面中可观察的通用版式规律。
