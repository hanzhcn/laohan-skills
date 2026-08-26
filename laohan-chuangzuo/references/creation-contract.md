# 创作机械合同 Episode schema 4 / 独立 schema 3 + 多平台发布内容 schema 1

本文件定义 `laohan-chuangzuo` 的可执行完成条件。风格负责怎么说，本合同负责是否真的完成；两者不能互相替代。

## Episode采访与大纲确认

标准Episode必须使用schema 4 / `content-units-v2`。`反向采访.json`绑定当前schema 3选题；6—12轮只是常用范围，完成条件不是轮数，而是为真实场景、情绪转折、独特判断和观众行动逐项登记`completion_evidence`，每项绑定有效问答序号和非空提取摘要，同时`remaining_gaps=[]`并写明`completion_reason`。材料未齐时即使超过12轮也必须继续，材料完整且继续追问不再改变观点或结构时可以停止。`大纲确认.json`必须由Jeffrey接受并绑定采访与`大纲.md` SHA。`创作决策.json`再绑定这四份上游SHA，且`hook_contract.designed_after_outline_acceptance=true`。确认前不得写全文或锁钩子。

独立模式继续兼容schema 3 / `content-units-v1`，不伪造Episode人工记录。

## 系列研究来源绑定

当`00-选题.json.direction_research.mode=USER_DIRECTION_RESEARCH`时，当前episode必须存在`02-创作工作稿/系列研究摘录.json`，且选题中的`series_id`、`episode_id`、相对路径和SHA与该文件一致。

`创作决策.json.research_source_contract`必须登记`status=BOUND`、同一资料包路径与SHA、实际使用的`claim_id`，并以`content_unit_claim_map`逐项覆盖全部正文内容单位。来源单位使用`origin=SOURCE_PACKET`并绑定资料包claim；Jeffrey自己的新增判断使用`origin=JEFFREY_ORIGINAL`、空claim数组和非空`original_basis`。不得把`EDITORIAL_INFERENCE`改写成平台事实，也不得让没有来源或个人依据的内容单位进入正文。

独立写作使用已验证单期资料包时可以只生成`script-pool/<series-id>/`草稿；稿件必须带非口播的“来源与时间点”附录，决策使用`series-draft-v1`并标记`DRAFT / NOT_STAGE_2_COMPLETE`，绑定packet SHA与series research SHA。它不伪造Episode人工记录，也不能宣称②完成。

## 规划与原创增量

schema 3 必须先证明它执行了创作规划，而不是落稿后补一个hash：

- `topic_thesis`、`hypothesis_id`、`content_form`、`audience`、`expected_audience_effect`、`input_mode`、`structure_tool`、`structure_rationale` 均非空；
- `fact_boundary`、`alternative_structures`、`unproven_assumptions` 均为非空字符串数组；
- `argument_plan.opening_contract`、`material_tradeoffs`、`shootable_expression`、`originality_and_citations` 均非空，`reasoning_path` 是非空步骤数组；
- `original_contributions` 至少1项，每项必须同时写非空 `judgement` 与 `viewer_value`。只有1项时必须有非空 `single_contribution_rationale`，说明为什么这一题不该硬凑第二项；schema 2 的字符串数组不能冒充 schema 3 原创增量。
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

`human_voice_contract` 至少登记4种真实出现在稿件中的设备，例如 `INTERJECTION`、`SELF_DEPRECATION`、`RHETORICAL_QUESTION`、`COLLOQUIAL_EXPLANATION`、`SIGNATURE_INTERACTION`。人味设备允许不增加事实，不能因内容去重被删除。

有分层讲解时设置 `structure_contract.layered=true`，正文使用连续的 `1、2、3……`；每层绑定不同内容单位。无真实层级时设置 `layered=false`，不强行编号。

## humanizer-zh 最终语言定稿

正式Episode和普通独立正式稿在内容事实成立后、TTS与hash绑定前，必须保存humanizer输入快照并执行本机冻结的`humanizer-zh`。`series-draft-v1`仅是独立草稿，豁免本门；`USER_PROVIDED_FINAL_SCRIPT_AND_RAW`由Jeffrey确认且已经录制，不自动改写。

Episode输入快照固定为`02-创作工作稿/humanizer-input.md`；独立正式稿使用同basename`.humanizer-input.md`。`创作决策.json.humanizer_contract`固定为：

```json
{
  "status": "PASS",
  "skill": "humanizer-zh",
  "skill_path": "agents-skills/humanizer-zh/SKILL.md",
  "skill_sha256": "<sha256>",
  "input_snapshot_path": "02-创作工作稿/humanizer-input.md",
  "input_snapshot_sha256": "<sha256>",
  "output_spoken_text_sha256": "<最终有效口播文本sha256>",
  "claim_audit": {
    "status": "PASS",
    "audited_content_unit_ids": ["U01"],
    "added_claims": [],
    "removed_claims": [],
    "changed_claims": [],
    "reviewer": "Codex",
    "review_note": "逐项对照内容单位，语言改写未改变主张。"
  },
  "quality_scores": {
    "directness": 9,
    "rhythm": 9,
    "trust": 9,
    "authenticity": 9,
    "conciseness": 9,
    "total": 45
  },
  "applied_at": "<ISO-8601>"
}
```

五项分数均为1—10整数，`total`必须等于五项之和且至少45。主张审计必须逐项覆盖全部`content_units`，三个变更数组必须为空；发现任何主张变化就回到规划与事实步骤，不得把变化伪装成语言润色。机械validator校验路径/SHA、Skill SHA、最终口播SHA、覆盖范围和空变更数组；语义是否真的保持仍由创作者/终审负责。

## 自然时长与TTS

TTS是可重建的内部机械试读证据，只检查5秒内容锚点、拗口句和自然时长。它不是Jeffrey的正式口播音轨，不进入视频、导演或Remotion，也不能替代真人试拍后按脸部安全区和真实语速进行的节奏对齐；`actual_tts_seconds`只能表述为TTS机械试读时长，不能表述为真人口播实测。

`duration_contract` 固定为：

```json
{
  "mode": "CONTENT_DETERMINED",
  "target_is_hard_limit": false,
  "padding_for_duration": "PROHIBITED",
  "hot_signal_brevity": "KEEP_CONCISE",
  "tts_engine": "macos-say",
  "tts_audio_path": "02-创作工作稿/tts-read-aloud.aiff",
  "tts_audio_sha256": "<sha256>",
  "tts_spoken_text_sha256": "<有效口播段落以换行连接后的sha256>",
  "actual_tts_seconds": 0
}
```

`script_metrics` 记录validator按有效口播段落重新计算的 `effective_spoken_chars`、`sentence_count`、`sentence_lengths`、15字阈值与短句占比。它们是测量结果，不是字数或时长门槛。

Episode模式执行：

```bash
say -o episodes/<slug>/02-创作工作稿/tts-read-aloud.aiff -f /tmp/<slug>-spoken.txt
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 episodes/<slug>/02-创作工作稿/tts-read-aloud.aiff
node ~/Documents/laohan-skills/laohan-chuangzuo/scripts/check-script-contract.mjs --episode episodes/<slug>
```

独立模式执行：

```bash
node ~/Documents/laohan-skills/laohan-chuangzuo/scripts/check-script-contract.mjs \
  --script output/script-YYYY-MM-DD.md \
  --decision output/script-YYYY-MM-DD.decision.json \
  --base "$PWD"
```

已验证系列资料包草稿执行：

```bash
node ~/Documents/laohan-skills/laohan-chuangzuo/scripts/check-script-contract.mjs \
  --script script-pool/<series-id>/E01-口播稿草稿.md \
  --decision script-pool/<series-id>/E01-口播稿草稿.decision.json \
  --series-draft script-pool/series-research/<series-id>/episode-packets/E01.json \
  --base "$PWD"
```

Episode只有命令输出 `PASS chuangzuo script contract schema=4` 才完成；独立模式仍输出schema 3。validator检查采访四类完成证据与空缺口、大纲确认、钩子时序、默认签名开场或有理由的题目专属开场、5秒锚点、当前稿/风格SHA、正文没有导演提示、观众资源完整性与四平台交付绑定、真实原创增量、可视化锚点、内容单位、逐段角色、两遍去重、人味至少4种、连续编号、3选1标题证据、视频介绍结构、`#AI新星计划`、TTS音频与Step -1—7执行证据；缺一项立即BLOCKED。
