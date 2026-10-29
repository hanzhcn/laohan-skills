---
name: laohan-fengmianqiuzhi
version: 1.21.2
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
- 不拆成无字底图、贴头合成、排字脚本或评分器。整图生成失败或逐张复核不通过时先修正原prompt重新生成（image-use无seed控制，每次生成自然随机），每个尺寸最多重采2次；重复出现同一构图偏差后停止盲抽，按下述「有界构图恢复」诊断，不降低质量阈值。

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

### 生图执行器：image-use

生图用本地CLI `image-use`（`~/.local/bin/image-use`，仓库 leeguooooo/image-use，走ChatGPT订阅的codex后端，服务端模型`gpt-image-2-codex`；无API key、无新增付费点）。每条prompt独立执行：

```bash
image-use "<该比例完整prompt>" \
  -i 05-封面/reference/jeffrey-reference.jpg \
  -o 05-封面/cover-qiuzhi-3x4.png \
  --size 1080x1440 --backend codex --no-style \
  --codex-provider "" --quiet
```

- CLI缺失时先按image-use自身SKILL.md的自愈流程拉取（单文件curl）或重跑其install.sh；仍失败如实报BLOCKED，不临时换其他生图工具。
- 参考图每次显式传当期`reference/jeffrey-reference.jpg`，不pin成style资产——每期reference是合同真源，pin会用旧脸。
- `--no-style`必带：禁用一切已启用的默认style/character资产叠加。若环境设了默认资产，其固定参考图会与当期`-i`抢4张附图上限，当期reference可能被丢弃或混入旧脸。每次生成后核对stderr附图清单：人物参考必须只有当期reference这一张，出现dropped refs或意外附图立即停止。
- `--codex-provider ""`必带：显式空值锁定ChatGPT OAuth订阅路径（argparse显式参数覆盖default，`IMAGE_USE_CODEX_PROVIDER`环境变量不再生效），防止请求连同参考图被导向`~/.codex/config.toml`里的第三方relay。
- `--quality`/`--image-model`在codex后端是无效杠杆（服务端重写image_generation工具配置：image model→`gpt-image-2-codex`、quality/size/background→auto、compression→100），不传；以saved line打印的实际`model=`/`size=`/`quality=`/`tokens=`为准记入manifest，`quality=`为服务端最终值。
- 服务端按请求比例就近出档（实测3:4→1086×1448、4:3→1448×1086、16:9→1672×941），像素不达硬尺寸时用magick重采样对齐：比例偏差≤0.1%时允许像素对齐（如1672×941等比只得1919×1080，差1px，对齐到1920×1080的变形0.05%视觉不可感知），偏差>0.1%说明服务端档位与目标比例不符，该张拒收走重采；不裁切、不扩边，不把比例不符的图冒充目标比例。在manifest记录原始尺寸、比例偏差与重采样后尺寸，采样后复核锐度。
- 429/额度类错误不循环重试，如实报错停下；stall/timeout按image-use错误表处理（调`--timeout`/`--stall-timeout`后重试一次），技术性重试与prompt重采共用每尺寸2次上限。

### 有界构图恢复（已有宿主原生编辑能力时）

仅当整图的身份、主标题/事实文字、主题和主物件已正确，且同一人物占比/位置或标题组安全边距偏差已在两次整图中重复出现时适用。保留原图、prompt、实测比例和失败理由；不得把换脸、错字、事实或风格问题包装成几何恢复，也不绕过429或新增付费。

宿主已有原生`image_gen`编辑能力时，可在现有生图授权内对该尺寸做**一次**受控编辑：将已经查看的原图作为唯一编辑目标，只等比缩放/移动**整个人物**或移动**完整标题组**并说明锚点，保留真实身份、标题字面内容、主物件、画布及其余设计；禁止只缩头、贴头、手工合成人物、裁切或扩边。同一次编辑可清除主物件表面未请求、无语义的伪字/数字装饰，但不能改标题、事实文字或删除水印、来源及AI生成标记；此附带修复也须单独留证。工具要求的参考传递按当前宿主文档执行，不假定任意宿主支持本机路径。此步骤是修复已定位的构图错误，不追加随机整图候选，也不把新工具能力推成所有宿主可用。

编辑产物先落QA目录；重新逐张核对全部验收项，特别是16%—26%头部、48%—72%人物、脸部照片质感、文字逐字一致及三尺寸同方案。编辑失败、出现身份/文字/风格漂移或原生工具不可用时，保留失败并将该尺寸记为BLOCKED，继续不依赖它的工作；任一尺寸BLOCKED，三尺寸封面整体不能标为完成或发布就绪。不伪造通过、不无限换工具重试。复核通过后才晋升为发布封面；原图保留作来源证据。生成/编辑工具自动写入或改变来源元数据时如实登记，不主动剥除。

来源按实际执行器记录：CLI产物保留其saved line；原生工具产物保留实际调用参数、输入/输出SHA及工具提供的元数据，工具未报告的model/quality明确填UNREPORTED。不得用CLI的model或quality替原生编辑签名。`cover-manifest.json`的每个size单独记录实际provider与生成/编辑链；混合执行器时顶层填mixed，并保留最终像素对齐记录。

### 本人照片质感恢复（与几何问题分开诊断）

整图生成或几何编辑后，若独立复核证实**头部本身**塑料化、年龄/眼形/脸型偏离本人，而文字、主题和几何已正确，先保留REVISE与原图，定位为身份/材质问题；不得签为几何通过，也不得把3D衣服本身误判为脸部失败。尤其横版全身Q版会诱导娃娃脸，单写“photoreal face”不证明已经保真。

在已有本人封面授权和宿主原生编辑能力内，该尺寸允许**一次**定向照片质感恢复：同时传已查看的当前封面与本期真实身份照片，前者是唯一编辑目标、后者仅作本人身份参考；锁定头部位置/占比与画布，恢复自然成年面部结构、眼镜/胡须/痣和真实皮肤/发丝，不美化成陌生人，不手工贴头、不换成他人身份，不改主标题、主物件或来源标记。这是单独记录的身份质感修复，不冒称前次几何编辑已合格。它与一次几何恢复各自最多一次，故每尺寸原生修复总计最多两次；与原整图最多两次重采共同计数，不因换文件名/换模型/新revision清零。

修复先落QA并按全套门重新复核，保留目标/身份参考/实际调用/输出SHA与元数据变化；不能因“恢复本人”字样就接受。若仍不像本人、照片感不达标、文字/比例漂移或工具不可用，该尺寸BLOCKED，整套不得标为完成或发布就绪；停止该尺寸，不再添加第三种恢复分支继续抽图，不新增付费或绕过429。

## 5. 逐张复核

每张生成或编辑后都放大复核，任一为假即按该尺寸剩余重采次数或上述有界构图恢复处理；两者均用尽则记BLOCKED，不降低标准：

`exactTitle`／`samePerson`／`singlePerson`／`faceProminent`／`expressiveAction`／`expressionContrast`／`heroObjectClear`／`compositionIntegrated`／`thumbnailLegible`／`safeAtTargetRatio`／`noExtraText`／`noWatermark`。

`exactTitle`必须逐字符检查，英文逐字母检查。三张还必须并排确认属于同一方案，同时检查它们没有裁切掉脸、主物件或标题。机械尺寸通过不等于人物、错字和缩略图观感已通过。

gpt-image对人物有放大倾向（实测头部占比可达33%—35%，高于prompt声明的22%）：`faceProminent`与`compositionIntegrated`必须从严核对头部16%—26%、人物48%—72%区间，超区间判该张失败走重采；面部必须为照片质感（毛孔、胡茬颗粒、真实发丝），出现磨皮或3D卡通脸即判失败。`noWatermark`只检查可见水印、Logo、二维码等视觉元素；PNG内的C2PA/caBX不可见来源标记（OpenAI provenance）不判失败、不得主动清除，重采样时保留原始文件作来源证据。

## 6. 输出

写入`05-封面/cover-prompts.md`（如使用有界构图恢复，同文件补原图、定位理由、编辑指令与QA/晋升证据）：

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

同时写`05-封面/cover-manifest.json`，`schema_version`为2，声明`skill_version`、`visual_system`、`selected_template`、reference/script SHA、三张`sizes`的文件名/尺寸/SHA/req/resp和`texts`。不得声明不存在的9:16母版或rank。`req`记录完整生成命令与prompt哈希，`resp`记录实际执行器返回的`model`/`size`/`quality`/`tokens`及magick等比重采样记录（如有）；原生编辑按上节记录。仅全部由CLI生成时`image_provider`填`image-use/codex/gpt-image-2-codex`，不得为混合或未报告的执行器冒填该值。

不要宣称复制任何账号的CTR或独特风格。这里只借鉴公开封面中可观察的通用版式规律。
