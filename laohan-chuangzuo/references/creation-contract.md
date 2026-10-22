# 创作机械合同 Episode schema 4 / 独立 schema 3 + 多平台发布内容 schema 1

本文件定义 `laohan-chuangzuo` 的可执行完成条件。风格负责怎么说，本合同负责是否真的完成；两者不能互相替代。

## Episode采访与大纲确认

标准Episode必须使用schema 4 / `content-units-v2`。2026-09-17五步法合同：选题为schema 4（AUTO_SELECTED）时，`创作决策.json`绑定当前选题SHA与`expression_pool_usage[]`个人表达池取材记录（每项`used/where`非空），且`hook_contract.fulfills_packaging_promise=true`并登记`packaging_title_direction`，证明前三秒钩子兑现①`packaging_assessment`的标题承诺；无采访、无大纲确认门槛。2026-09-17创作六步法（3.6.0）新增8字段：`structure_type`（TUTORIAL/EXPOSITION/STORY/CUSTOM按题选择）、`hook_variants[]`（≥3个不同方向+`selected_hook_index`+`tts_selected`读选证据）、`beat_distribution`（段落推进与空转检查）、`rhythm_anchors[]`（正文实际理解锚点）、`emotion_arc`（如实记录开头/中段/收尾感受）、`quote_anchor`（承载判断的金句）、`comment_hook`（预期评论+高潮处引导）、`hkrr_check`（节奏必须+K/R≥1）。历史episode的schema 3选题继续按原采访/大纲确认合同验证（`反向采访.json`+`大纲确认.json`+四份上游SHA绑定），且不要求8字段。

独立模式继续兼容schema 3 / `content-units-v1`，不伪造Episode人工记录。

## 系列研究来源绑定

当`00-选题.json.direction_research.mode=USER_DIRECTION_RESEARCH`时，当前episode必须存在`02-创作工作稿/系列研究摘录.json`，且选题中的`series_id`、`episode_id`、相对路径和SHA与该文件一致。

`创作决策.json.research_source_contract`必须登记`status=BOUND`、同一资料包路径与SHA、实际使用的`claim_id`，并以`content_unit_claim_map`逐项覆盖全部正文内容单位。来源单位使用`origin=SOURCE_PACKET`并绑定资料包claim；Jeffrey自己的新增判断使用`origin=JEFFREY_ORIGINAL`、空claim数组和非空`original_basis`。不得把`EDITORIAL_INFERENCE`改写成平台事实，也不得让没有来源或个人依据的内容单位进入正文。

独立写作使用已验证单期资料包时可以只生成`script-pool/<series-id>/`草稿；稿件必须带非口播的“来源与时间点”附录，决策使用`series-draft-v1`并标记`DRAFT / NOT_STAGE_2_COMPLETE`，绑定packet SHA与series research SHA。它不伪造Episode人工记录，也不能宣称②完成。

## 选题→写作的创作交接（2026-10-23取代空大纲旁路）

保持xuanti→chuangzuo→Sepia一线。文件像大纲不代表材料充分：只允许跳重复抽取，不允许跳来源理解、论证或真实材料。原创综合/亲历/主稿改编是来源模式，观点/教程是内容形态，两维独立，可多模式、多主稿。只借视听效果的来源不得假装成为正文论证；复杂参考的核心材料不可得，须改变真实承诺或换题。秋芝等作者可以借可兑现的观点/简单教学，不按作者名一刀切。

`creation_handoff`（schema_version=1）放在当前schema4可写candidate；正式00选题逐字段带入；普通独立新写作放decision；系列草稿放canonical episode-packet。字段唯一实现为xuanti的`scripts/creation-handoff-contract.mjs`，两侧ESM import；candidate既有子进程仍验证整个研究。无依赖明确失败，不另建入口。

- `prepared_by={actor,context_id}`记录实际准备上下文。
- `composition_modes[]`：FIRSTHAND / RESEARCH_SYNTHESIS / SOURCE_ADAPTATION，可多选，对应内容来源，不能只写发现线索。
- `sources[]`：唯一id、可选evidence_id（若填必须属于当前候选），roles（DISCOVERY_ONLY/FACT_CHECK/SYNTHESIS_INPUT/ADAPTATION_BASE/FIRSTHAND_RECORD/VISUAL_REFERENCE）、snapshot_path/snapshot_sha256、read_scope、summary。每项绑定实读本地非空快照，不用URL/标题替原文。FIRSTHAND_RECORD必须speaker=Jeffrey且真实记录；不能把作者亲历改我。ADAPTATION_BASE追加adaptation：problem、thesis、reasoning_chain[]、examples、necessary_conditions、audiovisual_dependencies、adoption_and_changes；源无例证/条件/视听依赖如实说明，不凑。
- `argument_units[]`：至少一个真实核心判断，单一判断记录一项；唯一id、kind=SOURCE_FACT/EDITORIAL_INFERENCE/HYPOTHETICAL/JEFFREY_FIRSTHAND、statement、source_ids[]、reasoning、boundary、viewer_value。事实/亲历须相应内容源；推论/假设明确依据与边界，可以没有外部source。不能按来源逐条堆摘要，也不固定论证卡数、反例数。
- `production.delivery_modes[]`：EXPLANATION/OPERATION/EFFECT_COMPARISON，按真实承诺，可多选。`materials[]`每项id、required布尔、purpose、argument_unit_ids[]、status。AVAILABLE_ARTIFACT需path/sha256真实材料；VERIFIED_CAPABILITY需verified_instance={path,sha256,delivery_modes[],material_type,reuse_plan,differences,verified_scope_basis,differences_within_verified_scope:true}，绑定同类既往实例/回执及本题差异在已验证范围内的依据，不能只写“有录屏/图表能力”。既往证据可在本项目motion/baselines等目录，不限本期。差异未验证则UNRESOLVED；该态只准非required并有reason。无required时须narration_only_reason解释为何讲述已足够。required未就绪回①，不能动画代实测。
- tutorial-video或OPERATION/EFFECT_COMPARISON均须写作前已有tutorial_proof={status:VERIFIED,evidence_path,evidence_sha256,version_boundary,recovery}；其path相对研究目录/episode/独立根/系列目录，其余快照与材料path相对项目根。换观点标签不免实跑，实际承诺的语义由材料读者核。

①入围→②写作前，root组织另一个独立上下文或Jeffrey实际读来源与关键材料。`material_review`与handoff并列，避免自hash循环：status=ACCEPTED、reviewer={actor,context_id}且不同准备context、handoff_sha256（共享handoffHash稳定键排序JSON）、reviewed_at、report_path/report_sha256、rationale；审核另绑framing_sha256（共享creationFraming提取受众/问题/论点/承诺/形态/标题方向/工作标题及系列身份；独立读取script_title与hook_contract，系列读取上游research受众/单期问题），报告正文须含这两项SHA；操作/效果承诺另绑tutorial_proof_sha256（稳定键排序JSON）且报告含该SHA，防实跑/版本边界被换掉。报告说明来源论证/必要条件有无丢失、素材能否兑现承诺、复用差异是否可控，以及本题必要反例/异见查到什么或未查原因。REJECTED回①；非空和SHA只证记录存在不证模型读懂。第二个材料读者不替代项目要求的跨模型家族复核。

`decision.creation_handoff_contract={schema_version:1,handoff_sha256,unit_bindings[],visual_bindings[]}`：每个content_unit一条{content_unit_id,argument_unit_ids[]}；有据新增推论可加new_inference={kind:EDITORIAL_INFERENCE|HYPOTHETICAL,basis,boundary,source_ids[]}，新增事实或操作承诺回材料更新再审。每个visual_anchor一条{visual_anchor_index,material_ids[],narration_only_reason}，索引从0开始，引用实际已就绪材料；无材料解释为何仅讲述可兑现。required材料须落在画面或unit_bindings.material_ids，且材料argument_unit_ids与该正文单位映射的论证ID相交，不能挂到无关段落冒充兑现。系列草稿用used_claim_ids对应content_unit_id，不伪造后续TTS/正式完成。作者可选取/重排，不强制逐段照包。

适用入口：topic readyForWriting、script候选、正式schema4、普通独立content-units-v1及series-draft早返回前。历史schema3 Episode按原冻结合同；用户已录制/raw-first按原外层路径，不重创作。旧两组三稿与7个旧系列packet原件/回执保留，不直接满足新写作门；复用须在新研究修订补交接/审核重绑，不追填旧回执。

程序只核结构/路径/绑定/状态。真实论证、角度、全文语义、理解成本与效果仍由实际读者判断；外部留存/完播阈值、英语句长/固定镜头频次和博客自报不能成为本项目通过门。新增表格不能证明爆款。Sepia只改表达，发现内容问题退回，不补写缺失论证或虚构材料。

## 规划与原创增量

schema 3 必须先证明它执行了创作规划，而不是落稿后补一个hash：

- `topic_thesis`、`hypothesis_id`、`content_form`、`audience`、`expected_audience_effect`、`input_mode`、`structure_tool`、`structure_rationale` 均非空；
- `fact_boundary`、`alternative_structures`、`unproven_assumptions` 均为非空字符串数组；
- `argument_plan.opening_contract`、`material_tradeoffs`、`shootable_expression`、`originality_and_citations` 均非空，`reasoning_path` 是非空步骤数组；
- `original_contributions` 至少1项，每项必须同时写非空 `judgement` 与 `viewer_value`。按本题表达原创判断或取舍，不设增量数量配额；schema 2 的字符串数组不能冒充 schema 3 原创增量。
- `visual_anchors` 至少1项，每项包含存在于 `content_units` 的 `content_unit_id`、非空 `audience_understanding` 与 `visual_expression`。它证明稿件给导演留下了可视化抓手，不规定具体动画技术。
- `01-口播稿.md`正文只允许Jeffrey实际口播文本，不得包含`[B-Roll]`、`[字幕]`、`[画面]`、镜头提示、转场提示、特效提示、Remotion执行提示或其他导演指令。`visual_anchors`只能存在于决策记录，不能通过Markdown标注提前替导演选卡片、PPT、具体技术、时长或位置。
- `publish_copy_contract` 必须在Step 3登记3个标题候选、唯一主推标题、选择理由、至少两条可回到正文的标题证据、视频介绍证据及其结构；落稿后再绑定主推标题原文和视频介绍SHA。

Episode模式由编排器先核对①的主题、假设、内容形式和受众，再把其余 schema 3 机械检查统一交给本validator；不得在编排器内另写一套互相冲突的schema 3字段规则。

Episode模式还必须生成 `12-发布/多平台发布内容.md`，完整合同见 `multi-platform-publish-contract.md`。该文件绑定当前口播稿 SHA，但不是正文附录，不进入TTS或段落审计。四个平台文案必须分别创作，视频号短标题不超过16字，不能把抖音文案或口播段落复制到其他平台。

## 观众可复制资源

每个Episode都必须在`创作决策.json.audience_resource_contract`明确登记：

- `status=NOT_APPLICABLE`：正文没有承诺模板、清单、提示词、命令或其他可复制资源，`resources=[]`；
- `status=BOUND`：正文承诺了观众资源，至少一份资源独立存放在`12-发布/观众资源/`，不得附在`01-口播稿.md`末尾。

`BOUND`的每份资源至少包含唯一`resource_id`、非空`title`、episode内相对`path`、文件`sha256`、`editable_defaults=true`、文件中真实出现的`edit_notice`，以及抖音、视频号、小红书、哔哩哔哩四个平台的交付方式。资源正文必须全部使用完整、可直接复制的推荐值；允许与观众实际项目不同，但必须明确提醒观众判断修改。禁止`[填写]`、`[粘贴]`、`[替换]`、TODO、TBD、待填写、待补充、空字段或伪造的空白链接。

四个平台的允许交付方式为`DESCRIPTION_APPENDIX`、`BODY_APPENDIX`、`MANUAL_PINNED_COMMENT`或`ATTACHED_RESOURCE_CARD`。`12-发布/多平台发布内容.md`必须在每个平台块内以`### 观众资源交付`登记同一资源标题与方式。MANUAL涉及置顶评论时只准备完整文本交Jeffrey；FULL不得自动回复评论或私信，平台字段无法完整承载时必须停止，不能只交付半份。

`opening_contract.mode` 只能是 `DEFAULT_SIGNATURE` 或 `TOPIC_SPECIFIC_HOOK`。前者要求 `required_prefix` 为“嘿，你有没有这种感觉，”并位于第一段开头；后者要求 `required_prefix` 为 `null`、`exception_reason` 非空，且第一段直接使用题目专属的具体结果、数字、动作、冲突或直问。两种模式的 `anchor_text` 都必须是第一段真实原文；validator用本机TTS测量从开头到该锚点的时长，超过5秒即BLOCKED。

## 内容单位

每个 `content_units[]` 必须包含：

- `id`：本稿唯一ID，如 `U01`。
- `claim`：本段新增的判断。
- `support`：事实、案例、操作、反例、边界或明确推论。
- `viewer_value`：观众因此能理解、判断或执行什么。

同一判断换词复述不是新单位。热点只有少量事实但已经形成完整判断时，`content_sufficiency.expansion_decision` 写 `KEEP_NATURAL_LENGTH`；只有补到新的内容单位才能写 `EXPANDED_WITH_NEW_UNITS`。

## 逐段角色

`paragraph_audit[]` 按正文有效口播段落原顺序逐段绑定SHA：

| role | 规则 |
|---|---|
| `CONTENT` | 绑定至少一个内容单位，并写 `new_information` |
| `VOICE_ONLY` | 人味呼吸段；不绑定内容单位，不冒充信息增量 |
| `CALLBACK` | 回扣旧单位，但必须写新的后果或行动 |
| `CTA` | 行动号召或固定收尾；不绑定内容单位 |

同一内容单位只能在一个 `CONTENT` 段承担新增信息；后文需要回扣时使用 `CALLBACK` 并增加新的后果或行动，不能再次把它登记成内容增量。

两遍 `semantic_redundancy_review` 固定为：第一遍逐段核对内容单位，第二遍排除人味设备后复核同义判断。发现重复只能 `MERGED`、`REMOVED`，或在确有新后果时 `ALLOWED_CALLBACK`。

## 抖音发布信息

每份口播稿在正文之后固定追加以下非口播区域：

```markdown
## 抖音发布信息

### 主推标题
[本期唯一主推标题]

### 视频介绍
[本期视频介绍]

#本题标签 #AI新星计划
```

主推标题和视频介绍都必须非空；视频介绍中的标签按本题选择，但每次必须原样包含抖音活动标签 `#AI新星计划`。发布信息不进入口播段落、内容单位、逐段审计、句长统计或TTS，整份Markdown的 `script_hash` 仍必须绑定它，防止正文与发布文案脱节。

`publish_copy_contract` 最小合同：

```json
{
  "platform": "douyin",
  "status": "PASS",
  "title_strategy": "SPECIFIC_EVIDENCE_PLUS_COUNTERINTUITIVE_RESULT",
  "title_evidence": ["正文证据一", "正文证据二"],
  "title_candidates": ["候选一", "候选二", "候选三"],
  "recommended_title": "稿件中的主推标题原文",
  "selection_rationale": "为什么这一条比另外两条更适合",
  "description_evidence": ["介绍证据一", "介绍证据二"],
  "video_description_structure": [
    "AUDIENCE_PROBLEM",
    "CREDIBILITY_EVIDENCE",
    "CORE_CONTENT",
    "NEXT_EXPECTATION_OR_ACTION",
    "INTERACTION"
  ],
  "video_description_sha256": "视频介绍区全文sha256",
  "required_hashtags": ["#AI新星计划"]
}
```

主推标题生成顺序固定为：先提炼正文唯一核心冲突，再挑可核验的数字、时间、成本、动作或结果，最后选择匹配本题的公式。观点型优先“具体证据 + 反常结果/追问”；教程型优先“工具或场景 + 动作 + 具体结果”。必须生成3个不重复候选，按信息具体、冲突或搜索词清楚、正文兑现、念着顺口四项选出唯一主推，并登记非空选择理由。至少一条 `title_evidence` 必须直接出现在主推标题中，全部证据必须能在正文、标题或介绍中找到；禁止拿陌生品牌名、空泛情绪或正文没有兑现的夸张承诺硬做钩子。

观点型和产品回归的视频介绍固定覆盖“观众问题 → 可信证据 → 核心内容 → 下一步 → 单一互动问题”；教程型覆盖“观众问题 → 核心内容 → 实测或步骤证据 → 下一步 → 单一互动问题”。`description_evidence`至少两条且必须出现在正文或介绍中。介绍不是正文摘要，也不重复整篇口播；标签通常选择题材、工具、内容类型和品牌词，必须保留 `#AI新星计划`。

## 人味与结构

`human_voice_contract` 按作者语域如实登记设备（允许0种），例如 `INTERJECTION`、`SELF_DEPRECATION`、`RHETORICAL_QUESTION`、`COLLOQUIAL_EXPLANATION`、`SIGNATURE_INTERACTION`。人味设备允许不增加事实，不能因内容去重被删除。

有分层讲解时设置 `structure_contract.layered=true`，正文使用连续的 `1、2、3……`；每层绑定不同内容单位。无真实层级时设置 `layered=false`，不强行编号。

## Sepia最终语言定稿

执行`sepia.md`。正式稿`language_review_contract`绑定完整上游包、中文非虚构路由、实际references、输入/输出SHA和逐内容单位零主张增删改审计；不使用humanizer-zh或45分。`quality_checks.language_review=PASS`。保留既有humanizer-input.md兼容路径，不恢复旧工具。

`human_voice_contract={status:"PRESERVED",policy:"AUTHOR_REGISTER",devices:[],review_note:"实际语域判断"}`；devices有则逐条绑定真实段落，允许为空，禁止required_minimum_device_types或强制四种。

## 三稿待选择

`--candidate --script <稿.md> --decision <同名.decision.json> --base <项目>`只是共同`schema4 / content-units-v2`的待选阶段，旧`candidate-script-v1`拒绝。稿件与决策同目录位于script-pool，纯口播不含发布信息。共同六步规划、表达池/钩子/正文锚点、内容单位、逐段SHA、两遍去重、作者语域、结构、Sepia和本机say机械QA均继续执行，无提前PASS出口。

额外绑定：`topic_research_contract={workspace_path,candidate_id,signals_sha256,candidates_sha256,source_health_sha256,douyin_sha256}`，路径相对项目，SHA绑定研究目录四份当前JSON；实际调用xuanti同一validator的workspace研究阶段，必须成功。candidate_id必须指向可写SHORTLISTED，稿件topic_thesis/audience/content_form及hook_contract.packaging_title_direction与其一致；topic_sha256绑定candidates文件。大纲用outline_path/outline_sha256绑定。source_ledger_path/SHA、每单位claim_ids及真实来源/主张类型映射照常检查。

共同`quality_checks`与`completed_at`在待选阶段也必需；这里的completed_at只记录本轮写作/审校封口时间，不是Jeffrey选择、正式②完成或接受。真正阶段由status/stage_status与入口回执区分，不得因此恢复免QA的候选提前出口。

状态固定`AWAITING_JEFFREY_SELECTION / NOT_STAGE_2_COMPLETE`，只延后用户选择、发布物和正式制作。机械QA音频不作为专属声音生产或真人听审；不创建episode、口型或视频。三稿要在主题/任务/核心判断上不同；来源与事实审校另存，不能混入口播。用户选择后对选中内容做正式审核和路线交接。自述完成与机械绑定不能证明研究判断、全文语义或传播效果，仍要实际读来源和独立审稿。

## 范围

series-draft-v1保留原非正式草稿边界；已录制的USER_PROVIDED_FINAL_SCRIPT_AND_RAW不自动改写。旧episode不静默迁移，新期按当前冻结执行器与runtime。

候选claim按kind登记依据：编辑推论必有reasoning，假设必有assumption_basis，亲历必有firsthand_basis及OWNED_RECORD或真实用户口述记录；来源ID不代替这些边界。不为亲历伪造Jeffrey接受/签名。资源承诺检测两种语序共用判定，仍需实际全文审阅。
