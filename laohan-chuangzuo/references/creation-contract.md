# 创作机械合同 schema 3

本文件定义 `laohan-chuangzuo` 的可执行完成条件。风格负责怎么说，本合同负责是否真的完成；两者不能互相替代。

## 规划与原创增量

schema 3 必须先证明它执行了创作规划，而不是落稿后补一个hash：

- `topic_thesis`、`hypothesis_id`、`content_form`、`audience`、`expected_audience_effect`、`input_mode`、`structure_tool`、`structure_rationale` 均非空；
- `fact_boundary`、`alternative_structures`、`unproven_assumptions` 均为非空字符串数组；
- `argument_plan.opening_contract`、`material_tradeoffs`、`shootable_expression`、`originality_and_citations` 均非空，`reasoning_path` 是非空步骤数组；
- `original_contributions` 至少2项，每项必须同时写非空 `judgement` 与 `viewer_value`。schema 2 的字符串数组不能冒充 schema 3 原创增量。

Episode模式由编排器先核对①的主题、假设、内容形式和受众，再把其余 schema 3 机械检查统一交给本validator；不得在编排器内另写一套互相冲突的schema 3字段规则。

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

两遍 `semantic_redundancy_review` 固定为：第一遍逐段核对内容单位，第二遍排除人味设备后复核同义判断。发现重复只能 `MERGED`、`REMOVED`，或在确有新后果时 `ALLOWED_CALLBACK`。

## 人味与结构

`human_voice_contract` 至少登记4种真实出现在稿件中的设备，例如 `INTERJECTION`、`SELF_DEPRECATION`、`RHETORICAL_QUESTION`、`COLLOQUIAL_EXPLANATION`、`SIGNATURE_INTERACTION`。人味设备允许不增加事实，不能因内容去重被删除。

有分层讲解时设置 `structure_contract.layered=true`，正文使用连续的 `1、2、3……`；每层绑定不同内容单位。无真实层级时设置 `layered=false`，不强行编号。

## 自然时长与TTS

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

只有命令输出 `PASS chuangzuo script contract schema=3` 才完成。validator检查固定开场、当前稿/风格SHA、内容单位、逐段角色、两遍去重、人味至少4种、连续编号、TTS音频与Step -1—7执行证据；缺一项立即BLOCKED。
