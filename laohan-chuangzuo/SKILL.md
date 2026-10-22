---
name: laohan-chuangzuo
description: 统一创作引擎，负责创作口播初稿（不含封面提示词，封面由 laohan-fengmianqiuzhi 独立产出；不含选题搜索，选题由工作流①前置用 laohan-xuanti/laohan-douyinsousuo 产出已核材料交接后写作）。支持录屏视频(音频提取→转录)、URL队列(抓取→整理)、结构化大纲、原始文本、自由主题五种输入。其他 skill 的写作环节统一调用本 skill。Use when 用户说"写口播稿""帮我写""录屏转口播""视频转口播稿""写一篇""根据链接改写""改写文档"。
version: "3.9.0"
---

# 统一创作引擎

所有涉及口播稿写作统一调用本 skill。一份方法论，一个入口。

## 写作前材料交接

先执行`references/creation-contract.md`的“选题→写作的创作交接”：真实源文/主稿论证、核心判断、承诺所需材料和独立材料审核齐全才写。大纲只可跳重复抽取，不能跳知识理解；五种输入共用判据。操作/效果承诺实跑前置，Sepia不补论证。普通独立/系列草稿同样检查，历史已录制输入不重创作。

## 核心理念

一份方法论、一个入口——所有写作走同一个管线，避免不同入口产出质量参差不齐。素材先整理（Layer A/B）再写稿，确保口播稿建立在结构化理解之上，而非对原始素材的直接改写。

内容长度由独立内容单位决定，不由预设字数或分钟数决定。内容重复与人味废话是两条不同的审计线：同一判断换词复述必须合并；结巴、语气词、自嘲、反问和停顿继续按风格保留，不能因去重被误删，也不能冒充内容增量。

## 不适用场景

- 纯文本摘要/总结 → 用 summarize skill，不走创作流程
- 翻译 → 直接翻译，不需要口播稿格式
- 学术论文/技术文档写作 → 输出格式是口播稿，不适合正式文档

## 知识来源（唯一正本，symlink 到 OpenClaw workspace）

- **写作规则**：`references/style.md`（恢复 2026-07-11 前实战版本）。其中开场、转场、修辞、标题公式和口头禅作为可选工具；按当前六步法判断适用性，不以数量/句长/禁词密度或旧稿节奏限制新题
- **整理方法**：`references/skill.md` → `~/.openclaw/workspace-reviewer/knowledge/skill.md`（进宝 skill.md v3.5）
- **转录方法**：`references/transcription.md`（音频提取 + 语音转文字三级降级）
- **转译选题法**：`references/yuanchuang-method.md`（转译选题法 + 角度库 + 标题公式 + 数据基准）。本 skill 不再自带热点搜索；此方法供工作流①前置阶段复用——①用 laohan-xuanti/laohan-douyinsousuo 出选题后，按本文件规则生成大纲再喂入本 skill 大纲模式
- **镜头友好模式**（可选扩展，默认关闭）：`references/camera-friendly.md`（四句式偏好 + 镜头结构 sidecar 契约；只在 Step 4 句式层叠加，不覆盖既有方法）
- **写作风格目录**：`references/styles/`（每份 .md 是一种写作结构框架，Step -1 明确选择依据）
- **创作机械合同**：`references/creation-contract.md`（Episode schema 4的选题/表达池绑定、内容单位、逐段审计、人味、自然时长、TTS与validator；独立模式兼容schema 3，历史采访合同仅对旧schema 3选题生效）
- **方法论真源**：项目`docs/老韩创作六步法.md`（定结构→选钩子三变体读选→铺内容含爆点分布/节奏锚点/情绪弧线→造记忆点含金句/评论区预设→HKRR自检→人味定稿+机械验收）；五波调研依据见`script-pool/口播稿方法论调研-2026-09-17.md`

GitHub 上是实体文件（拷贝），本地用 symlink 自动同步。

## 输入模式

| 模式 | 输入 | 触发场景 | 内部处理 |
|------|------|----------|---------|
| 大纲模式 | 结构化大纲文件 | 工作流①前置产出 / 外部传入 | 已有合格交接物才跳重复抽取，进入 Step 2 |
| 素材模式 | 原始文本/转录稿 | 录屏转录后、URL抓取后 | 先 Layer A/B 整理，再写稿 |
| 自由模式 | 主题关键词 或 无输入 | 用户直接调用 | 先生成大纲→确认→写稿 |

## 前置处理（将各种输入转化为三种模式）

### Pre-A：录屏预处理

触发：用户提供了视频文件（mp4/mov 等）或说"录屏转口播""视频转口播稿"。

1. **提取音频**：`ffmpeg -i "<视频路径>" -vn -acodec libmp3lame -q:a 2 "/tmp/录屏音频_$(date +%s).mp3" -y`
2. **语音转文字**：三级降级（详见 `references/transcription.md`）
   - 硅基流动 API（免费，秒级）→ whisper-cli（本地快）→ Python whisper（最准）
3. 独立写作时转录结果保存为 `output/transcript-YYYY-MM-DD.md`；Episode 模式保存为 `episodes/<slug>/02-创作工作稿/transcript.md`，自动进入**素材模式**。

### Pre-B：URL 队列预处理

触发：用户说"根据链接改写""链接内容改写""改写文档"。

1. **读取队列**：独立写作检查 `<cwd>/url.md`；Episode 模式只检查 `episodes/<slug>/02-创作工作稿/url.md`，找第一个 `- [ ]` 且后面有 URL 的行
   - 没有待处理 → 告诉用户"队列为空"，结束
2. **抓取内容**：根据平台自动选择方法（参考 laohan-xiazai 路由）
   - 抖音：移动端 UA → iesdouyin.com
   - B站：opencli bilibili
   - 其他：Jina Reader / agent-reach
3. 独立写作时内容保存为 `output/content-YYYY-MM-DD.md`；Episode 模式保存为 `episodes/<slug>/02-创作工作稿/content.md`，进入**素材模式**。
4. **完成后更新队列**：将 url.md 中对应行改为 `- [x] URL 关键词 ✅ YYYY-MM-DD`

## 环境检测

```
STYLE_FILE = 检测顺序：
  1. <当前工作目录>/templates/style.md      ← 用户定制版（优先）
  2. <skill安装目录>/references/style.md    ← 标准版（symlink 到 OpenClaw）

ACTIVE_STYLE_FILE = 通用风格时为 STYLE_FILE；教程型/其他风格时为 <skill安装目录>/references/styles/<选择>.md

ORGANIZE_FILE = <skill安装目录>/references/skill.md  ← 标准版（symlink 到 OpenClaw）

OUTPUT_DIR = 普通独立写作时 <当前工作目录>/output/；已验证系列单期资料包的独立草稿写入 <项目>/script-pool/<series-id>/；Episode 模式时 episodes/<slug>/02-创作工作稿/
```

## 同一流程的待选择交付阶段

所有自主选题都先执行①五步法研究，再执行本skill全部六步创作和Sepia。Jeffrey要三篇供选时仅延后正式定题、发布物和制作，不另走轻合同。先执行同一`check-topic-contract.mjs --workspace <研究目录> --base <项目>`取得RESEARCH_READY，再为三个实质不同的SHORTLISTED主题/观众任务规划、比较钩子、创作、审来源、逐段审计及Sepia定稿；本机say机械试读与正式稿相同，只作写作QA，不是专属声音或视频音轨。

纯口播、同名decision/sepia-input、大纲、真实QA音频及来源账本写`script-pool/<任务>/`。decision使用共同`schema4 / content-units-v2`，标`AWAITING_JEFFREY_SELECTION / NOT_STAGE_2_COMPLETE`；字段见`references/creation-contract.md`。`check-script-contract.mjs --candidate --script <稿.md> --decision <稿.decision.json> --base <项目>`会实际重跑上游研究门，再继续共同六步/内容单位/逐段/Sepia/QA检查；旧candidate-script-v1不再放行。禁止缺研究、绑定淘汰项、偏离已研究论点或使用过期SHA。不要创建episode、正式配音、口型、渲染或发布物。

用户选择后按目标路线完成正式内容审校和发布绑定，最终稿和来源锁定后按Motion方法制作；待选择PASS不等于正式②完成。下文六步、来源、Sepia及本机机械试读共同执行，发布信息仅在正式交付时生成。

## Episode 模式

当参数含 `--episode episodes/<slug>` 时，先读取 `00-选题.md` 和 `00-选题.json`，不得重新选择另一主题。2026-09-17起按五步法合同执行：直接从选题、`script-pool/Jeffrey个人表达池.md`（真实场景、亲历细节、固定表达素材）和系列研究摘录取材，写`02-创作工作稿/大纲.md`后直接写全文；不产生反向采访或大纲确认（历史episode的schema 3选题继续按其原采访合同验证）。最终定稿只能写 `episodes/<slug>/01-口播稿.md`，同时写 schema 4 `02-创作工作稿/创作决策.json`（绑定选题SHA、`expression_pool_usage`取材记录，钩子兑现①packaging_assessment承诺）。共享 `output/` 只允许用于非 workflow 的独立写作，不能作为 episode 输入或真值。

Episode schema 4 在原schema 3全部内容之外，至少增加：

- 当前schema4选题绑定`topic_sha256`；采访/确认三份SHA只对历史schema3选题分支适用；
- 方向研究型选题必须读取`02-创作工作稿/系列研究摘录.json`，并在`research_source_contract`把全部内容单位映射到资料包claim或Jeffrey原创依据；
- 当前schema4选题绑定`hook_contract.fulfills_packaging_promise=true`；历史schema3选题才要求designed_after_outline_acceptance与确认时间；
- `contract_version=content-units-v2`。普通独立模式仍使用schema 3 / `content-units-v1`；已验证系列单期资料包使用`series-draft-v1`草稿合同，只能标记`DRAFT / NOT_STAGE_2_COMPLETE`。

原内容合同继续包含：

- 与①一致的 `topic_thesis`、`hypothesis_id`、`content_form`、`audience`、`expected_audience_effect`；
- `contract_version=content-units-v1`、`input_mode`、`active_style_file`、`active_style_sha256`、`structure_tool`、`structure_rationale`；
- 非空数组 `fact_boundary`、`alternative_structures`、`unproven_assumptions`；
- Step 3 的 `argument_plan`：`opening_contract`、`reasoning_path`、`material_tradeoffs`、`shootable_expression`、`originality_and_citations`；
- 至少一项 `original_contributions`，每项写清新增判断及其观众价值；只有一项时必须登记 `single_contribution_rationale`，证明没有为了数量硬凑第二个观点；
- `opening_contract` 登记 `mode: DEFAULT_SIGNATURE|TOPIC_SPECIFIC_HOOK`。默认使用“嘿，你有没有这种感觉，”，只有题目存在明显更强的具体结果、数字、动作、冲突或直问时才允许题目专属开场，并记录 `exception_reason`；两种模式的 `anchor_text` 都必须绑定第一段5秒内真实锚点；
- `visual_anchors` 至少一项，每项绑定一个内容单位，写清观众理解任务与可视化表达；它只给后续导演可拍依据，不规定动画技术；同时保留 `content_sufficiency`、唯一 `content_units`、覆盖全部口播段落SHA的 `paragraph_audit`、两遍 `semantic_redundancy_review`；
- `01-口播稿.md`正文只允许Jeffrey真正口播的文字，禁止B-Roll、字幕、镜头、转场、特效或Remotion执行提示；正文承诺模板、清单、提示词、命令或其他可复制资源时，必须独立写入`12-发布/观众资源/`，完整填写推荐值，并由`audience_resource_contract`绑定文件SHA及四平台交付方式；
- `human_voice_contract` 必须登记真实作者语域；设备可为空，禁止数量配额；`structure_contract` 在分层时绑定连续的 `1、2、3……`；
- `duration_contract.mode=CONTENT_DETERMINED`、`padding_for_duration=PROHIBITED`，并绑定本机 `say` 生成的TTS机械试读音频、SHA和 `ffprobe` 实测时长；TTS只用于检查5秒锚点、拗口句和自然时长，是可重建的内部QA代理，不是正式口播音轨，不进入视频或Remotion，也不能替代Jeffrey真人试拍后的节奏判断；
- `execution_steps` 逐项记录 `step_minus_1`、`step_0`、`step_2`—`step_7` 与新增`step_5_5`为 `COMPLETED`，不适用的 Pre-A/B、Step 1/1.5 写 `SKIPPED` 及理由；
- `quality_checks` 在原六关之外增加 `semantic_redundancy`、`human_voice`、`language_review`、`dynamic_duration`、`structure_clarity`，全部为 `PASS`，另有非空 `read_aloud_note`；
- 最终 `script_title`、`script_hash`、合法 `completed_at`。
- `publish_copy_contract` 必须绑定3个标题候选、唯一主推标题、选择理由、标题与介绍证据、视频介绍结构与SHA，以及每次必带的 `#AI新星计划`。
- Episode 模式还必须读取 `references/multi-platform-publish-contract.md`，在同一轮创作中输出 `12-发布/多平台发布内容.md`。抖音、视频号、小红书、哔哩哔哩的标题、介绍/正文和话题必须按平台受众分别创作，不能复制口播稿或复用一份文案；视频号独立短标题不超过16字；抖音、视频号、小红书话题固定包含 `#老韩AI`，哔哩哔哩标签固定包含 `老韩AI`。

字段和命令以 `references/creation-contract.md` 为准。Step 7 必须实际运行validator；Episode未出现 `PASS chuangzuo script contract schema=4` 时不得声称②完成。

任一改动改变 `01-口播稿.md` hash，都使②立即失效。错字或标点之外的实质改稿必须回 Step 3，重做规划、质量检查和试读，再写新的 schema 4 决策记录；不得只替换 hash。

## 执行清单（每步完成后打勾）

- [ ] Step -1: **风格选择（强制，不可跳过）**
- [ ] Pre-A/B: 前置处理（如需；Pre-C 热点转译已移除，搜索归工作流①）
- [ ] Step 0: 判断输入模式（大纲/素材/自由）
- [ ] Step 1: [素材模式] Layer A/B 整理
- [ ] Step 1.5: [Episode] 从选题+表达池取材生成大纲；[独立自由模式] 生成大纲→用户确认
- [ ] Step 2: 选题确认（模式A/B选择+主题锁定）
- [ ] Step 3: 规划（原版12项 + 内容单位/自然稿长/分层合同，不可跳过）
- [ ] Step 4: 写口播稿
- [ ] Step 5: 质量检查（6关）
- [ ] Step 5.5: Sepia中文非虚构语言定稿与主张零增删改审计
- [ ] Step 6: 通过/重试
- [ ] Step 7: 输出口播初稿（封面提示词不在本 skill 范围，由独立 skill laohan-fengmianqiuzhi 在后续流程产出）
- [ ] 镜头友好模式: [可选，默认关闭] 显式启用时句式叠加四偏好并产出镜头结构 sidecar（见下方专节与 references/camera-friendly.md）
- [ ] Post-A: [可选] NotebookLM 幻灯片

---

## Step -1：风格选择（强制，不可跳过）

独立写作先核用户已给的风格与自主权限；已授权三稿候选或AUTONOMOUS_RUN时由执行者按受众任务选择并说明，不重复询问。未给自主权限且风格差异会改变目标时才澄清。**Episode mode 例外**：先依据 `00-选题.md`/JSON 的受众、论点、干预和预期效果判断教程型或观点型，锁定 `ACTIVE_STYLE_FILE`，再用该文件选择结构工具；在 gate 真源 `02-创作工作稿/创作决策.json` 记录风格文件、选择理由、替代方案和待验证假设。Step 2 只复核该选择与大纲一致，不得重新选择。可同时写同名 `.md` 人类摘要，但它不代替 JSON。不得因等待风格选择而阻断已授权的 AUTONOMOUS_RUN。

执行方式：
1. 读取 `references/styles/` 目录下所有 `.md` 文件
2. 列出所有可用风格，格式如下：

```
请选择本次口播稿的写作风格：

1. 通用 — 观点型/热点评论/行业分析，使用 style.md 默认规则
2. 教程型（五层模型）— 工具教程/操作指南，使用完整五层结构、六要素、品牌层、结尾层和自检清单

请输入编号或名称。
```

3. **独立写作等待用户选择**。Episode mode 按上面的可追溯自主选择执行。
4. 用户选择后：
   - **通用**：直接使用 style.md 作为唯一规则，不加载额外风格文件
   - **教程型或其他**：读取对应的 `references/styles/<选择>.md` 作为自包含完整规则；不得只摘取其中的抽象结构而跳过语言、场景、节奏、品牌和自检方法
5. **默认不选**：没有"默认选项"，必须明确选择依据；用户已授权自主写作时可由模型选择，候选可选不同结构

**新增风格**：往 `references/styles/` 目录添加新 `.md` 文件即可，自动被发现。不需要修改本文件。

---

## Step 0：判断输入模式

检查输入参数：
- **大纲模式**：输入是 Markdown 文件，含 `## 核心论点` 或 `## 论证路径` 等大纲结构 → 先校验creation_handoff与独立材料审核，充分才跳重复抽取到 Step 2
- **素材模式**：输入是长文本（转录稿/网页抓取内容），无大纲结构 → 执行 Step 1
- **自由模式**：无输入文件 或 只有主题关键词 → 执行 Step 1.5

## Step 1：素材模式 — Layer A/B 整理

读 `references/skill.md`（进宝 Layer A/B v3.5），对原始素材执行：

**Layer A（无损事实层）**：
1. 素材信息表（来源/标题/作者/日期/时长）
2. 黄金开局钩子（痛点场景+渴望结果+核心冲突）
3. 结构化模块（按逻辑拆分为独立模块，编号标注）
4. 断言台账（每个可验证的事实单独列出）

**Layer B（衍生加工层）**：
5. 可操作步骤提取（教程型素材必填，非教程型标注"不适用"）
6. 痛点映射（观众的真实痛点→素材能解决哪个）
7. 延伸思考（反常识发现、跨域连接、可执行收获）
8. 核心选题提炼（一句话主题+标题底子+裁剪建议）
9. 教程型质量预评分（模式A时执行，6维度打分）

独立写作时整理结果输出到 `output/organize-YYYY-MM-DD.md`；Episode 模式输出到 `episodes/<slug>/02-创作工作稿/organize.md`，进入 Step 2。

### Step 1 改写分支（对标爆款素材专用，2026-09-17生效）

素材是对标爆款视频的转录全文时（①已产出），Layer A/B 整理之后按改写管线执行，方法真源为项目`docs/老韩创作六步法.md`改写模式节（原创题不走改写分支，直接走标准六步法）：

1. **organize保留原始事实及来源**：按本题选取必要材料，不要求源模块覆盖率；新增判断要标真实依据；按自己的承诺重组，保留所采用主张不可缺的推理和条件；
2. **经历归属**：只把Jeffrey真实经历写第一人称；第三方故事自然注明来源，不能把订单/收入/群聊/学费变成自己做过。历史亲历内化授权记录保留，当前生产按真实来源规则执行；
3. **有据取舍**：用主稿拆解记录采用/改变及理由，形成自己的判断与例子；不锁源骨架、不为增量数量凑句子；
4. **原创表达**：换自己的论点与表达，不为去同源指纹修改真实数字、事实组合、日期或能力边界；假设示例必须明说是假设；
5. **直读测试**（Sepia 后置）：逐句三问——指代能否在前句找到同类别对象、拟物动词（叫/响/漏/爬/断）有无本体铺垫、术语首现有无当句解释；无铺垫隐喻必须改为字面直白表述，词内误报人工判读保留；
6. 决策 JSON `rewrite_record` 登记organize绑定及素材取舍理由、经历归属与真实来源、直读测试结果、原创表达与事实保真记录与被否版本演进链。

## Step 1.5：取材与大纲

Episode模式从三处取材后直接写`大纲.md`：①当前选题（thesis、tension、audience、packaging_assessment）；②`script-pool/Jeffrey个人表达池.md`中与题目相关的真实场景、亲历细节和固定表达（在决策JSON的`expression_pool_usage[]`登记`used/where`）；③`USER_DIRECTION_RESEARCH`时的系列研究摘录。反向采访与大纲确认门槛已于2026-09-17砍除；Jeffrey的修改意见在④—⑤或成稿反馈时吸收。

大纲成立后按`docs/老韩创作六步法.md`写全文，机械要求：
1. **定结构**：决策JSON登记`structure_type: TUTORIAL|EXPOSITION|STORY|CUSTOM`（教程/科普/故事是工具，也允许CUSTOM并说明；不设留存率保证）。
2. **钩子三变体**：先出3个不同方向的开头钩子登记`hook_variants[]`（各含text+direction），TTS读出声后选最自然的（登记`selected_hook_index`与`tts_selected: true`）；选中钩子必须兑现①`packaging_assessment.title_direction`的标题承诺（`hook_contract.fulfills_packaging_promise=true`）。
3. **铺内容**：内容单位制照旧；另登记`beat_distribution`（正文各段推进及信息空转检查结论）、`rhythm_anchors[]`（按正文实际理解任务登记锚点：悬念/转折/提问/数字，供⑨导演，不进口播正文；`position`必须用「第N段」指到正文真实段落——段号越界或只写模糊位置会被合同判红，见 3.6.1 内容层交叉判据）、`emotion_arc`（如实记录开头/中段/收尾感受，不预设情绪曲线）。
4. **造记忆点**：登记`quote_anchor`（一句可被观众二创引用的金句，必须承载本期判断非鸡汤，放情绪高点或收尾前；**且必须是正文里真实出现的原句**——字幕/剪辑要按它取原文，validator 自 2026-09-30 起机械核对"逐字出现在口播段落里"，忽略标点与空白）与`comment_hook`（引导放最自然的位置并说明，记录预期观众最想说什么；有上期评论素材时引用被问最多的问题做跨期钩子）。
5. **HKRR自检**：登记`hkrr_check`（快乐/知识/共鸣至少一项为true，rhythm必须true，附rationale）；不达标重排再写。

独立自由模式无素材时生成大纲：

无素材时，基于用户提供的主题（或交互询问）生成大纲：

```markdown
# [两句话标题，＜30字]

## 核心论点（一句话）
[全篇围绕这一个论点]

## 论证路径
1. [切入点]
2. [递进]
3. [收束]

## 关键素材/数据/场景
- [素材点1]
- [素材点2]

## 内容模式
[模式A 教程型 / 模式B 观点型]
```

独立写作时输出到 `output/outline-YYYY-MM-DD.md`；Episode 模式输出到 `episodes/<slug>/02-创作工作稿/outline.md`。展示确认后再进入 Step 2。

## Step 2：选题确认（动笔前必须完成，不可跳过）

1. **复核内容模式**：按下列信号确认 Step -1 已锁定的模式 A（教程型）或模式 B（观点型）及 `ACTIVE_STYLE_FILE`；若与①证据冲突，回 Step -1 重选并在决策 JSON 留痕
   - 选 A 信号：涉及具体工具/操作/配置/流程/对比测试
   - 选 B 信号：行业观点/新闻/深度思考/人物故事
2. **锁定主题**：大纲/整理结果中的一句话主题 = 全篇锚点，不准自换
3. **判断素材类型**：对照 `ACTIVE_STYLE_FILE` 内的素材适配规则；该文件没有专用表时，按 Step 1 的 Layer A/B 证据类型记录，不另外加载 style.md
4. **大纲自检**：Episode模式确认大纲覆盖选题thesis与tension，且钩子设计兑现packaging承诺
5. **（教程型专用）可操作步骤清单**：模式 A 时从素材中提取观众能跟着做的步骤

## Step 3：规划（不写稿，不可跳过）

以 Step 2 锁定的论点为锚，恢复原版12项规划。它们是经过实战验证的默认模板，可以在本题上增加，但无具体理由不得删除：

1. **一句话论点**
2. **内容模式 + 素材类型**
3. **教程型操作步骤规划**：步骤骨架，标注每步使用的真实素材或来源
4. **核心主题贯穿规划**：标题关键词和核心概念在正文中的落点
5. **精华筛选**：必须包含、选择性包含、跳过的内容与理由
   - 方向研究型选题先按单期资料包的claim和事实边界筛选；来源只提供事实与公共需求，不复制竞品标题、结构或整段表达
6. **场景规划**：至少1个核心生活场景、动作链和代入式互动点
7. **改写策略**：comprehensive（默认）/ angle / structure / depth
8. **目标读者、预期效果与待验证假设**：与①及 `创作决策.json` 一致
9. **技法选配**：根据理解任务选开场、转场、对比或呼应，工具箱只作参考，不要求逐项使用
10. **结构错位方案**：原序与叙述序，避免照搬素材结构
11. **金句/比喻处理**：保留引用或替换；替换不得弱于原版冲击力
12. **增量点与事实边界**：按题规划有观众价值的判断或取舍，不设增量数量配额。同时标清来源、待⑤核验主张和不能伪装成亲测的内容

原版12项完成后必须再产出三份硬结果，不能直接进入Step 4：

1. **内容充足度**：把热点或素材能支持的独立内容单位全部列出。每个单位必须包含新判断、支撑和观众价值；只有措辞不同的不算新单位。
2. **自然稿长决策**：热点短小但已经能形成完整判断时写 `KEEP_NATURAL_LENGTH`，允许短稿；只有找到新的机制、案例、反例、操作或边界才能写 `EXPANDED_WITH_NEW_UNITS`。禁止为了 `expected_duration_seconds`、`typical_duration_seconds` 或字数补同义段落。
3. **结构合同**：确有多个并列层级时，规划连续的 `1、2、3……`；没有真实层级时保持自然叙述，不为了形式拆段。
4. **发布文案策略**：从正文核心冲突中生成3个标题候选，登记标题公式和至少两条正文证据，再按明确理由只选1个主推标题。观点型/产品回归介绍按“观众问题 → 可信证据 → 核心内容 → 下一步 → 互动”规划；教程型按“观众问题 → 核心内容 → 实测或步骤证据 → 下一步 → 互动”规划，不能临时拼接与正文无关的卖点。
5. **可视化锚点**：至少选择1个最需要画面帮助理解的内容单位，写清观众要看懂什么，以及适合用对比、过程、因果、证据、真实场景或产品画面中的哪种表达；不在②指定Remotion技术。
6. **观众资源规划**：正文若承诺模板、清单、提示词、命令或其他可复制资源，规划一份独立完整资源。所有字段用可直接复制的推荐值填满，允许观众按自己的项目修改，但不得留下`[填写]`、`[粘贴]`、TODO、TBD或空字段；同时规划四平台实际交付位置。

## Step 4：写口播稿

按规划写稿。硬性要求：

- **开场默认与例外**：默认以“嘿，你有没有这种感觉，”开头。只有题目专属的具体结果、数字、动作、冲突或直问明显更强、更自然时，才可直接使用该钩子，并在 `opening_contract.exception_reason` 说明为什么；两种模式都必须在5秒内给真实锚点，不能用例外制造空泛标题党
- **停更/回归/产品开发题**：第一段强制使用 `ACTIVE_STYLE_FILE` 的“问题先行四问开场”，依次回答观众问题、停更动机、可信行动、产物定义；“做了一个”却不说明产品类别、目标用户和使用结果，Step 4 不通过
- 第一行 `# 标题`（≤30字，模式A「动词+工具/场景+结果」，模式B「主题句+情绪句」）
- 正文只写Jeffrey真正要说的话。禁止插入`[B-Roll]`、`[字幕]`、`[画面]`、镜头、转场、特效、Remotion包名、时长、位置或其他导演/实现提示；这些只能在`创作决策.json.visual_anchors`中保留抽象理解任务，并由后续导演阶段决定表达。
- 正文承诺观众资源时，只口播资源用途和取得位置；资源本体独立写入`12-发布/观众资源/<资源名>.md`，不能附在口播稿末尾。资源必须完整填写推荐值并提示“这是推荐起点，请按自己的项目判断并修改”。
- **抖音发布信息**：口播正文后固定追加 `## 抖音发布信息`，下设 `### 主推标题` 和 `### 视频介绍`。视频介绍末尾附与本题相关的标签，并且每次必须包含抖音活动标签 `#AI新星计划`；这一区域不进入口播、TTS、内容单位或段落审计
- **视频介绍SEO/GEO规则（2026-09-17）**：核心搜索词前置在前55字折叠线内（题材词+动作词）；介绍必须总结整篇骨架（案例/方法/增量/资源）不能只抓一点；关键词在标题/介绍前段/话题标签三处命中；实体词+一个真实互动问号（GEO利于AI搜索引用）；120—200字，只保留一个问号
- 严格执行 `ACTIVE_STYLE_FILE` 的完整方法；原版模板是默认基线，不因重复使用就自动判坏

**写稿时同步自检：**
- 长短句服从解释和呼吸，不设短句比例或平均句长目标
- 转场优先使用原版转场句式库，禁“首先/其次/最后”式说明书结构
- 标点：冒号→逗号，双引号→「」，「---」做句末停顿
- #19“是不是有点意思”按本题语气自然使用，不设次数
- 按作者真实语域保留自然习惯，不凑结巴、语气词、自嘲或设备数量
- 人味废话单独登记为 `VOICE_ONLY` 或具体人味设备；内容审计时排除它们，不能因为不增加事实就删除
- 每个内容段必须绑定至少一个内容单位并写清新增信息；同一判断只换词、没有新增支撑/例子/推论/操作/边界时直接合并
- 节奏按原版快慢交替：开头拉满→缓冲→加速→缓冲→结尾加速→减速

## Step 5：质量检查

**E. 内容底线（命中 = 不通过）：**
- 核心论点、关键证据和必要边界均已覆盖；素材取舍围绕本题承诺，不设覆盖比例
- 有明确反常识论点或足够强的结果演示
- 结尾行动号召源自素材中的可执行精华
- 标题核心词在开场和关键结论自然出现；不设出现次数，不为记忆点复述同一内容
- 核心主题贯穿全文，无偏离段落
- 至少1个核心生活场景，并有代入式互动或动作链
- 全文至少有一句离开本期经历、判断或边界就不能成立的具体表达；纯中性说明书不通过
- 至少有一个内容单位被转成明确可视化锚点，说明画面承担的理解任务；只有“放大文字、变颜色”而没有内容关系的不算
- 字数与时长没有默认下限或为凑时长设置的目标；完稿后仅用本机TTS机械试读估算自然时长，不把它称为真人实测或正式音轨
- 两遍内容重复审计都必须通过：第一遍逐段检查新增内容单位，第二遍排除人味设备后检查同义判断；未解决的重复一律不通过

**E2. 教程型专用（模式 A 时执行）：**
- 有 ≥1 个明确操作步骤
- 有操作前后对比
- 标题含工具名+动作词
- 结尾恢复资源钩子、收藏引导、互动引导和行动式结尾；资源必须真实存在，不能虚构

**D. 原创性检查（命中 = 不通过）：**
- 原创判断/取舍有来源和观众价值；不靠同义总结凑增量
- 引用原话 ≤2 处，伪装成自己的 → 不通过
- 「我实测」类声明可溯源到素材

**A. 正则提示（命中后按语境审阅，不自动判失败）：**
- 模板连接词：首先/其次/总而言之/综上所述
- AI 填充：值得注意的是/毋庸置疑/显而易见
- 空洞大词：至关重要/开创性的/赋能/抓手/赛道（非比喻）
- 禁词：意味着什么|本质上|换句话说|不可否认|不难发现|作为一个|让我们|不妨|试想一下|值得一提的是

**B. 禁区检查**（禁用词+禁用标点+禁用结构，按 `ACTIVE_STYLE_FILE` 的自检规则）

**B2. 表达检查（按实际问题和Sepia诊断，不以词表判AI）：**
- 体制化开头：不可否认/众所周知/在当今的时代/随着...的发展
- 空心强化：真正地/不得不说/坦率地说
- 三连排比：连续 3+ 相同句式
- 冒号堆砌：一段内 >3 个「：」后接列表
- 过度总结：由此可见/这充分说明/这告诉我们
- 假设复数："我们都知道"/"每个人都会"（应用"你"单数）

**C. 技法检查：**
- 技法按内容选用，未使用不算缺陷
- 反常识钩子或结果演示构成全文核心吸引力
- #15 回环呼应：结尾照应开头
- #18 框架命名：使用时形成可复述名称
- #19 签名互动：“是不是有点意思”只在自然时保留，不设次数
- 横向对比至少1次
- 技法只保留对本题有效的部分，不设数量目标
- 人味以直读自然、真实作者习惯为依据，不设数量目标
- 任何删减都写入 `创作决策.json`，说明为什么删后效果更好；没有证据时保留原版

**F. 发布文案检查：**
- 主推标题有3个候选、至少2条正文证据和非空选择理由，最终稿只保留选中的1个
- 标题承诺能被正文兑现；观点型突出可信证据与反常结果，教程型突出搜索词、动作和具体结果
- 视频介绍按当前内容类型完成五段信息结构，数字、功能和结果不超出正文事实边界
- 视频介绍只保留1个互动问题，并且标签原样包含 `#AI新星计划`

## Step 5.5：Sepia中文非虚构定稿

按`references/sepia.md`执行完整原包与真实路由：professional、技术域适配、discourse§1—3、style和zh。先诊断后最小修改，不加载fiction/台湾新闻规则，不设45分、词表命中率或人味数量。直读检查指代、隐喻铺垫、术语首现和拗口。

保存完整输入快照；逐内容单位核主张零增删改。正式稿沿用`humanizer-input.md`文件名以兼容媒体/迁移路径，工具绑定字段改为`language_review_contract`，skill必须是sepia。绑定六组件与实际加载references SHA、原包版本、输入/输出、诊断处理、模型身份和时间。无问题允许不改；主张需改回内容/事实阶段，再生成新快照，不偷偷改事实。

普通系列草稿按原合同保留非正式边界；本次三稿候选也实际执行Sepia，但不做正式TTS或伪造②完成。用户已提供并录制的正式稿不自动改写，保留recorded-input guard。

## Step 6：通过/重试

- ✅ 全部通过 → Step 7
- ❌ 不通过 → 第1次重试换角度，第2次重试换结构，仍不通过回 Step 3 重新规划（最多2轮）

## Step 7：输出口播初稿

1. 普通独立写作时口播稿写入 `output/script-YYYY-MM-DD.md`，并保留同basename`.humanizer-input.md`；传入已验证系列单期资料包时，口播草稿与同basename `.decision.json` 写入 `script-pool/<series-id>/`，不伪造humanizer正式门；Episode 模式写入 `episodes/<slug>/01-口播稿.md`并保留`02-创作工作稿/humanizer-input.md`。Episode正文承诺观众资源时，资源独立写入`episodes/<slug>/12-发布/观众资源/`，不得塞回口播稿。
2. 普通独立写作也必须写同basename的 `.decision.json` 和 `.tts.aiff`；系列资料包草稿不得伪造TTS或正式完成证据，使用`series-draft-v1`并绑定packet SHA；Episode 模式写 `02-创作工作稿/创作决策.json` 与 `tts-read-aloud.aiff`。
3. 用本机 `say` 完整机械试读并用 `ffprobe` 记录TTS音频时长；TTS音频、正文有效口播文本和决策JSON必须互相绑定SHA，但该时长只能作为口播时长估算，不能称为真人实测。
4. 在正文后写入非口播的抖音发布信息，主推标题和视频介绍都必须非空，视频介绍必须带 `#AI新星计划`。
5. Episode 模式按 `references/multi-platform-publish-contract.md` 同步写 `12-发布/多平台发布内容.md`；四个平台分别选择切入点、标题、介绍/正文和话题，视频号独立短标题不超过16字，所有事实仍受当前口播稿与审核边界约束；三端话题必须带 `#老韩AI`，B站标签必须带 `老韩AI`。存在观众资源时，四个平台还必须绑定同一资源并登记实际交付位置。
6. 按 `references/creation-contract.md` 运行 `scripts/check-script-contract.mjs`。系列资料包草稿使用`--series-draft <packet.json>`；没有对应机械PASS不得交付，即使PASS也只算草稿，不算②完成。

❌ 差：用户否掉旧稿后直接重写 `01-口播稿.md`，沿用旧决策和旧质量结论。

✅ 好：实质改稿回到 Step 3，重新说明论证、取舍、可拍表达和原创增量，跑完六关与试读，再用新 hash 封口。

> 封面提示词不在本 skill 范围。chuangzuo 的职责止于「确定来源 + 创作口播初稿」。封面由独立 skill `laohan-fengmianqiuzhi` 在后续流程（违规检查、校准评分通过、标题锁定后）单独产出。

---

## 镜头友好模式（可选，默认关闭）

**显式启用才生效**（用户点名「镜头友好」或 Episode 决策 JSON 登记 `camera_friendly: true`）；不启用时一切照旧，默认产出与既有全部合同不受影响。完整规则见 `references/camera-friendly.md`。

启用时在 **Step 4 写稿的句式层**叠加四个倾向性偏好（非硬规则、不覆盖六步法与任何质量门）：

1. 短主张：关键节奏点尽量 ≤15 字独立短句（与既有默认叠加）
2. 成对对比句式：对比内容写对仗双实体句
3. 清单句：并列要点「第一个/第二个/第三个」引导、要点名前置
4. 真实数字带单位：可量化处写具体数字+单位

两条结构偏好：金句独立成段（与 quote_anchor 同句原句）；术语首现集中。

产出：**正文照旧**（只含 Jeffrey 口播文字，零变化）+ 可选 sidecar `镜头结构.json`（Episode 模式 `02-创作工作稿/`；独立模式与口播稿同 basename）。sidecar 只含语义 role 提示（opening/point/contrast/list/quote/cta）与段落全文/SHA 绑定，**不含任何模板参数或视觉执行细节**（模板 props 归下游适配器产生并审阅）；不进正文、不进创作决策.json、不进 validator 校验范围。Sepia 或实质改稿后必须重出 sidecar（段落 SHA 会失配，下游按全文匹配、失配即拒绝）。

---

## Post-A：NotebookLM 幻灯片（可选，用户要求时执行）

用户要求生成幻灯片时，基于 script.md 用 NotebookLM 生成 PNG 图片：

1. `mkdir -p <script.md所在目录>/slides`
2. `cp script.md <script.md所在目录>/slides/script.md`
3. `nlm notebook create "<标题>PPT"`
4. `nlm source add NOTEBOOK_ID --file <script.md所在目录>/slides/script.md`
5. `echo "y" | nlm slides create NOTEBOOK_ID --language zh-CN --length default`
6. 轮询等待 completed（30秒间隔，最多20轮）
7. `nlm download slide-deck --notebook NOTEBOOK_ID -o <script.md所在目录>/slides/<标题>.pdf`
8. `pdftoppm -png -r 200 <script.md所在目录>/slides/<标题>.pdf <script.md所在目录>/slides/slide`

输出到 `<script.md所在目录>/slides/slide-*.png`

依赖：nlm CLI v0.5.25 + poppler

## 输出路径

```
output/
├── transcript-YYYY-MM-DD.md    ← Pre-A 录屏转录结果
├── content-YYYY-MM-DD.md       ← Pre-B URL 抓取内容
├── organize-YYYY-MM-DD.md      ← Step 1 整理结果（素材模式）
├── outline-YYYY-MM-DD.md       ← Step 1.5 大纲（自由模式/热点模式）
├── script-YYYY-MM-DD.md        ← Step 7 口播初稿（本 skill 唯一终产物）
├── script-YYYY-MM-DD.decision.json ← schema 3创作执行证据
├── script-YYYY-MM-DD.tts.aiff  ← 本机实际试读证据
└── (cover-prompts 不在此产出，由 laohan-fengmianqiuzhi 独立 skill 后续生成)
```

如果 `output/` 不存在，自动创建。

Episode 模式的完整中间产物固定为：

```
episodes/<slug>/
├── 01-口播稿.md
├── 12-发布/
│   ├── 多平台发布内容.md
│   └── 观众资源/             ← 仅正文承诺资源时生成；完整推荐值，无空白占位
└── 02-创作工作稿/
　 ├── 创作决策.json
　 ├── 创作决策.md       ← 可选人类摘要
　 ├── humanizer-input.md ← 最终语言定稿前的完整稿件快照
　 ├── tts-read-aloud.aiff ← 本机实际试读证据
    ├── transcript.md
    ├── content.md
    ├── organize.md
    └── outline.md
```

Episode 模式禁止读取或写入共享 `output/`。

## 依赖

| 依赖 | 用途 | 安装方式 |
|------|------|---------|
| ffmpeg | 音频提取（Pre-A） | `brew install ffmpeg` |
| 硅基流动 API Key | 语音转文字（Pre-A，优先） | 注册 siliconflow.cn |
| whisper.cpp | 本地语音转文字（Pre-A，备选） | `brew install whisper.cpp` |
| nlm CLI + poppler | NotebookLM 幻灯片（Post-A） | `pip install notebooklm-mcp-cli && brew install poppler` |

Pre-A/B 按需依赖，不使用对应模式时无需安装。

## 触发方式

```bash
# 录屏模式（传入视频文件）
/laohan-chuangzuo /path/to/recording.mp4
"把这个录屏视频转成口播稿"

# URL 队列模式
"根据链接改写""链接内容改写""改写文档"

# 大纲模式（传入大纲文件；选题搜索归工作流①）
/laohan-chuangzuo output/outline-YYYY-MM-DD.md

# Episode 模式（00-选题已锁定）
/laohan-chuangzuo --episode episodes/<slug>

# 素材模式（传入原始文本文件）
/laohan-chuangzuo output/transcript.md
/laohan-chuangzuo output/content.md

# 自由模式（直接触发或给主题）
/laohan-chuangzuo
/laohan-chuangzuo "Claude Code 配置技巧"
"帮我写""写口播稿"
```

## 注意事项

- style.md和风格文件提供默认工具；事实纪律、当前六步法及本次用户目标优先，旧数量/固定情绪/节奏配额不恢复
- **风格文件**（`references/styles/`）是完全自包含的写作规范，每次创作前必须选择一个风格。通用模式无额外文件，直接用 style.md；其他模式只读对应风格文件
- skill.md 是唯一的整理方法来源，Layer A/B 规则以该文件为准
- 转译选题法详见 `references/yuanchuang-method.md`（转译案例+角度库+标题公式+数据基准）。本 skill 不自带热点搜索；该文件供工作流①前置阶段复用
- 转录技术详见 `references/transcription.md`（音频提取+三级降级）
- 二创原创表达与真实来源规则（style.md 第十节）：素材来自他人内容时执行；自由模式（原创主题）跳过
- 本 skill 不负责选题搜索（那是工作流①阶段的职责，用 laohan-xuanti + laohan-douyinsousuo 出大纲后喂入）
- 本 skill 不负责平台特定下载（那是 laohan-xiazai 的职责）
