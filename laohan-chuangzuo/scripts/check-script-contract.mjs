#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1];
};
const episodeArg = option('--episode');
const scriptArg = option('--script');
const decisionArg = option('--decision');
const baseArg = option('--base');

const fail = (message) => {
  console.error('BLOCKED chuangzuo script contract: ' + message);
  process.exit(1);
};
const requireFile = (path, label) => {
  if (!existsSync(path) || !statSync(path).isFile() || statSync(path).size === 0) fail('缺非空 ' + label);
  return realpathSync(path);
};
const shaFile = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const shaText = (value) => createHash('sha256').update(value).digest('hex');
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const uniqueNonEmpty = (items) => Array.isArray(items) && items.length > 0 && items.every(nonEmpty) && new Set(items).size === items.length;

let base;
let scriptPath;
let decisionPath;
if (episodeArg) {
  base = resolve(episodeArg);
  scriptPath = join(base, '01-口播稿.md');
  decisionPath = join(base, '02-创作工作稿/创作决策.json');
} else if (scriptArg && decisionArg) {
  base = resolve(baseArg || process.cwd());
  scriptPath = resolve(scriptArg);
  decisionPath = resolve(decisionArg);
} else {
  console.error('用法: check-script-contract.mjs --episode episodes/<slug> | --script <script.md> --decision <decision.json> [--base <root>]');
  process.exit(2);
}

const baseReal = requireFile(scriptPath, '口播稿').startsWith(realpathSync(base) + '/') ? realpathSync(base) : null;
if (!baseReal || !requireFile(decisionPath, '创作决策.json').startsWith(baseReal + '/')) fail('稿件和决策必须位于指定根目录内');

let decision;
try {
  decision = JSON.parse(readFileSync(decisionPath, 'utf8'));
} catch {
  fail('创作决策.json 不是合法 JSON');
}
const script = readFileSync(scriptPath, 'utf8').replace(/\r\n/g, '\n');
const title = script.match(/^#\s+(.+)$/m)?.[1]?.trim();
if (!title) fail('稿件第一行必须是非空一级标题');

const publishHeading = /^##\s+抖音发布信息\s*$/m.exec(script);
if (!publishHeading) fail('稿件必须包含“## 抖音发布信息”');
const titleLineEnd = script.indexOf('\n');
const shootingNotesIndex = script.search(/^##\s+拍摄备注\s*$/m);
const bodyEnd = Math.min(publishHeading.index, shootingNotesIndex >= 0 ? shootingNotesIndex : publishHeading.index);
const body = script.slice(titleLineEnd + 1, bodyEnd);
const paragraphs = body
  .split(/\n\s*\n/)
  .map((block) => block.split('\n').filter((line) => !/^\s*(?:---|>|##\s)/.test(line)).join('\n').trim())
  .filter(Boolean);
if (!paragraphs.length) fail('稿件没有有效口播段落');

const publishStart = publishHeading.index + publishHeading[0].length;
const publishTail = script.slice(publishStart);
const nextLevelTwoHeading = publishTail.search(/^##\s+/m);
const publishBlock = (nextLevelTwoHeading >= 0 ? publishTail.slice(0, nextLevelTwoHeading) : publishTail).trim();
const publishSubsection = (name) => {
  const heading = new RegExp(`^###\\s+${name}\\s*$`, 'm').exec(publishBlock);
  if (!heading) return '';
  const tail = publishBlock.slice(heading.index + heading[0].length).replace(/^\s*\n/, '');
  const nextHeading = tail.search(/^###\s+/m);
  return (nextHeading >= 0 ? tail.slice(0, nextHeading) : tail).trim();
};
const recommendedTitle = publishSubsection('主推标题');
const videoDescription = publishSubsection('视频介绍');
if (!nonEmpty(recommendedTitle) || recommendedTitle.includes('\n') || Array.from(recommendedTitle).length > 30) fail('抖音主推标题必须是30字以内的单行非空标题');
if (!nonEmpty(videoDescription)) fail('抖音视频介绍不能为空');
const descriptionHashtags = videoDescription.match(/#[\p{L}\p{N}_-]+/gu) || [];
if (!descriptionHashtags.includes('#AI新星计划')) fail('抖音视频介绍必须包含#AI新星计划');
if ((videoDescription.match(/[？?]/g) || []).length !== 1) fail('抖音视频介绍必须且只能包含一个明确互动问题');

if (decision.schema_version !== 3 || decision.contract_version !== 'content-units-v1') fail('创作决策必须使用 schema 3 / content-units-v1');
if (decision.script_title !== title || decision.script_hash !== shaFile(scriptPath)) fail('创作决策未绑定当前稿标题与SHA-256');
if (!nonEmpty(decision.active_style_file) || !existsSync(decision.active_style_file) || !statSync(decision.active_style_file).isFile() || decision.active_style_sha256 !== shaFile(decision.active_style_file)) fail('active style 路径或SHA-256无效');

const publish = decision.publish_copy_contract || {};
const allowedTitleStrategies = new Set(['SPECIFIC_EVIDENCE_PLUS_COUNTERINTUITIVE_RESULT', 'SEARCHABLE_TOOL_ACTION_RESULT', 'AUDIENCE_PROBLEM_PLUS_UNEXPECTED_RESULT']);
const allowedDescriptionStructures = new Set([
  JSON.stringify(['AUDIENCE_PROBLEM', 'CREDIBILITY_EVIDENCE', 'CORE_CONTENT', 'NEXT_EXPECTATION_OR_ACTION', 'INTERACTION']),
  JSON.stringify(['AUDIENCE_PROBLEM', 'CORE_CONTENT', 'CREDIBILITY_EVIDENCE', 'NEXT_EXPECTATION_OR_ACTION', 'INTERACTION'])
]);
if (publish.platform !== 'douyin' || publish.status !== 'PASS' || !allowedTitleStrategies.has(publish.title_strategy) || publish.recommended_title !== recommendedTitle || !nonEmpty(publish.selection_rationale) || publish.video_description_sha256 !== shaText(videoDescription) || !allowedDescriptionStructures.has(JSON.stringify(publish.video_description_structure)) || !uniqueNonEmpty(publish.required_hashtags) || !publish.required_hashtags.includes('#AI新星计划')) fail('publish_copy_contract 未绑定标题选择、视频介绍结构与必带标签');
if (!uniqueNonEmpty(publish.title_evidence) || publish.title_evidence.length < 2) fail('publish_copy_contract 至少需要两条标题证据');
if (!uniqueNonEmpty(publish.title_candidates) || publish.title_candidates.length !== 3 || !publish.title_candidates.includes(recommendedTitle) || publish.title_candidates.some((candidate) => candidate.includes('\n') || Array.from(candidate).length > 30)) fail('publish_copy_contract 必须登记3个30字以内候选并选中唯一主推标题');
if (!uniqueNonEmpty(publish.description_evidence) || publish.description_evidence.length < 2) fail('publish_copy_contract 至少需要两条视频介绍证据');
const publishEvidenceCorpus = `${recommendedTitle}\n${paragraphs.join('\n')}\n${videoDescription}`;
if (!publish.title_evidence.some((evidence) => recommendedTitle.includes(evidence)) || publish.title_evidence.some((evidence) => !publishEvidenceCorpus.includes(evidence))) fail('主推标题证据必须来自标题、正文或视频介绍，且至少一条直接进入标题');
const descriptionEvidenceCorpus = `${paragraphs.join('\n')}\n${videoDescription}`;
if (publish.description_evidence.some((evidence) => !descriptionEvidenceCorpus.includes(evidence))) fail('视频介绍证据必须来自正文或介绍');

const requiredPlanningFields = ['topic_thesis', 'hypothesis_id', 'content_form', 'audience', 'expected_audience_effect', 'input_mode', 'structure_tool', 'structure_rationale'];
if (!requiredPlanningFields.every((key) => nonEmpty(decision[key])) || !uniqueNonEmpty(decision.fact_boundary) || !uniqueNonEmpty(decision.alternative_structures) || !uniqueNonEmpty(decision.unproven_assumptions)) fail('schema 3 缺主题、受众、结构或事实边界规划');
const argumentPlan = decision.argument_plan || {};
const requiredArgumentFields = ['opening_contract', 'material_tradeoffs', 'shootable_expression', 'originality_and_citations'];
if (!requiredArgumentFields.every((key) => nonEmpty(argumentPlan[key])) || !uniqueNonEmpty(argumentPlan.reasoning_path)) fail('argument_plan 必须包含开场、论证路径、素材取舍、可拍表达与原创引用规划');
const originalContributions = decision.original_contributions;
if (!Array.isArray(originalContributions) || originalContributions.length < 1 || originalContributions.some((item) => !nonEmpty(item?.judgement) || !nonEmpty(item?.viewer_value)) || (originalContributions.length === 1 && !nonEmpty(decision.single_contribution_rationale))) fail('original_contributions 必须至少一项；只有一项时需说明不硬凑第二项的理由');

const opening = decision.opening_contract || {};
if (opening.status !== 'PASS' || !nonEmpty(opening.anchor_text) || !['DEFAULT_SIGNATURE', 'TOPIC_SPECIFIC_HOOK'].includes(opening.mode)) fail('opening_contract 必须登记合法开场模式与第一段锚点');
if (opening.mode === 'DEFAULT_SIGNATURE' && (opening.required_prefix !== '嘿，你有没有这种感觉，' || !paragraphs[0].startsWith(opening.required_prefix))) fail('DEFAULT_SIGNATURE 必须以“嘿，你有没有这种感觉，”开头');
if (opening.mode === 'TOPIC_SPECIFIC_HOOK' && (opening.required_prefix !== null || !nonEmpty(opening.exception_reason))) fail('TOPIC_SPECIFIC_HOOK 必须取消固定前缀并登记具体例外理由');
const anchorIndex = paragraphs[0].indexOf(opening.anchor_text);
const minimumAnchorIndex = opening.mode === 'DEFAULT_SIGNATURE' ? opening.required_prefix.length : 0;
if (anchorIndex < minimumAnchorIndex) fail('opening_contract.anchor_text 必须真实出现在第一段合法位置');
const anchorText = paragraphs[0].slice(0, anchorIndex + opening.anchor_text.length);
const anchorTemp = mkdtempSync(join(tmpdir(), 'chuangzuo-opening-'));
try {
  const anchorAudio = join(anchorTemp, 'anchor.aiff');
  const say = spawnSync('say', ['-o', anchorAudio, anchorText], {encoding: 'utf8'});
  if (say.status !== 0) fail('无法执行开场锚点本机TTS');
  const anchorProbe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', anchorAudio], {encoding: 'utf8'});
  const anchorSeconds = Number(anchorProbe.stdout?.trim());
  if (anchorProbe.status !== 0 || !Number.isFinite(anchorSeconds) || anchorSeconds > 5) fail(`开场锚点超过5秒 actual=${anchorSeconds}`);
} finally {
  rmSync(anchorTemp, {recursive: true, force: true});
}

const sufficiency = decision.content_sufficiency || {};
const sufficiencyStatuses = new Set(['SUFFICIENT_FOR_NATURAL_LENGTH', 'RESEARCHED_TO_SUFFICIENCY']);
if (!nonEmpty(sufficiency.source_kind) || !sufficiencyStatuses.has(sufficiency.status) || !['KEEP_NATURAL_LENGTH', 'EXPANDED_WITH_NEW_UNITS'].includes(sufficiency.expansion_decision) || !Number.isInteger(sufficiency.selected_content_unit_count) || sufficiency.selected_content_unit_count < 1 || !nonEmpty(sufficiency.rationale)) fail('content_sufficiency 未证明内容量决定自然稿长');

const units = decision.content_units;
const unitIds = Array.isArray(units) ? units.map((unit) => unit?.id) : [];
if (!uniqueNonEmpty(unitIds) || units.some((unit) => !nonEmpty(unit.claim) || !nonEmpty(unit.support) || !nonEmpty(unit.viewer_value))) fail('content_units 必须是唯一且完整的“判断+支撑+观众价值”');
if (sufficiency.selected_content_unit_count !== units.length) fail('content_sufficiency 的内容单位数量与实际不一致');
const normalizedClaims = units.map((unit) => unit.claim.replace(/[\s，。！？、,.!?]/g, '').toLowerCase());
if (new Set(normalizedClaims).size !== normalizedClaims.length) fail('content_units 存在重复判断');
const visualAnchors = decision.visual_anchors;
if (!Array.isArray(visualAnchors) || visualAnchors.length < 1 || visualAnchors.some((item) => !unitIds.includes(item?.content_unit_id) || !nonEmpty(item?.audience_understanding) || !nonEmpty(item?.visual_expression))) fail('visual_anchors 必须至少绑定一个内容单位，并写清观众理解任务与可视化表达');

const audit = decision.paragraph_audit;
if (!Array.isArray(audit) || audit.length !== paragraphs.length) fail('paragraph_audit 必须逐段覆盖全部有效口播段落');
const auditIds = audit.map((item) => item?.paragraph_id);
if (!uniqueNonEmpty(auditIds)) fail('paragraph_audit 的 paragraph_id 必须唯一');
const allowedRoles = new Set(['CONTENT', 'VOICE_ONLY', 'CALLBACK', 'CTA']);
for (let index = 0; index < audit.length; index += 1) {
  const item = audit[index];
  const ids = Array.isArray(item.content_unit_ids) ? item.content_unit_ids : [];
  if (item.paragraph_sha256 !== shaText(paragraphs[index])) fail(`paragraph_audit SHA不匹配: ${item.paragraph_id || index + 1}`);
  if (!allowedRoles.has(item.role) || ids.some((id) => !unitIds.includes(id))) fail(`paragraph_audit role或内容单位非法: ${item.paragraph_id}`);
  if (item.role === 'CONTENT' && (!ids.length || !nonEmpty(item.new_information))) fail(`CONTENT段缺新增信息: ${item.paragraph_id}`);
  if ((item.role === 'VOICE_ONLY' || item.role === 'CTA') && (ids.length || item.new_information != null)) fail(`${item.role}段不得冒充内容增量: ${item.paragraph_id}`);
  if (item.role === 'CALLBACK' && (!ids.length || !nonEmpty(item.new_consequence))) fail(`CALLBACK必须增加新后果或行动: ${item.paragraph_id}`);
}
const usedUnits = new Set(audit.filter((item) => item.role === 'CONTENT').flatMap((item) => item.content_unit_ids));
if (unitIds.some((id) => !usedUnits.has(id))) fail('存在未落入正文CONTENT段的内容单位');
const contentBindings = audit.filter((item) => item.role === 'CONTENT').flatMap((item) => item.content_unit_ids);
if (new Set(contentBindings).size !== contentBindings.length) fail('同一内容单位不得在多个CONTENT段重复使用');

const redundancy = decision.semantic_redundancy_review || {};
if (redundancy.status !== 'PASS' || !Array.isArray(redundancy.passes) || redundancy.passes.length !== 2 || redundancy.passes.map((item) => item?.pass).join(',') !== '1,2' || redundancy.passes.some((item) => !nonEmpty(item.focus) || item.verdict !== 'PASS') || !Array.isArray(redundancy.duplicate_groups)) fail('必须完成两遍内容语义重复审计');
for (const group of redundancy.duplicate_groups) {
  if (!['MERGED', 'REMOVED', 'ALLOWED_CALLBACK'].includes(group?.resolution) || !nonEmpty(group?.rationale)) fail('重复候选必须记录合并、删除或带新增后果的回扣');
}

const voice = decision.human_voice_contract || {};
const voiceDevices = Array.isArray(voice.devices) ? voice.devices : [];
const voiceTypes = voiceDevices.map((item) => item?.type).filter(nonEmpty);
if (voice.status !== 'PRESERVED' || voice.required_minimum_device_types !== 4 || new Set(voiceTypes).size < 4) fail('人味废话必须保留至少4种不同设备');
for (const device of voiceDevices) {
  const index = auditIds.indexOf(device.paragraph_id);
  if (!nonEmpty(device.type) || index === -1 || !nonEmpty(device.text) || !paragraphs[index].includes(device.text)) fail('人味设备没有绑定类型和真实段落原文');
}

const structure = decision.structure_contract || {};
if (structure.status !== 'PASS' || typeof structure.layered !== 'boolean') fail('缺结构清晰度合同');
if (structure.layered) {
  if (structure.numbering !== 'ARABIC_CONTIGUOUS' || !uniqueNonEmpty(structure.labels) || structure.labels.some((label, index) => label !== String(index + 1)) || structure.labels.some((label) => !paragraphs.some((paragraph) => paragraph.startsWith(label + '、')))) fail('分层讲解必须使用连续的1、2、3……编号');
} else if (Array.isArray(structure.labels) && structure.labels.length) {
  fail('非分层稿不得伪造层级编号');
}

const duration = decision.duration_contract || {};
if (duration.mode !== 'CONTENT_DETERMINED' || duration.target_is_hard_limit !== false || duration.padding_for_duration !== 'PROHIBITED' || duration.hot_signal_brevity !== 'KEEP_CONCISE' || duration.tts_engine !== 'macos-say' || !nonEmpty(duration.tts_audio_path) || !/^[a-f0-9]{64}$/.test(duration.tts_audio_sha256 || '') || duration.tts_spoken_text_sha256 !== shaText(paragraphs.join('\n')) || !Number.isFinite(duration.actual_tts_seconds) || duration.actual_tts_seconds <= 0) fail('时长合同必须由内容决定并绑定本机TTS证据');
const ttsPath = resolve(base, duration.tts_audio_path);
const ttsReal = requireFile(ttsPath, 'TTS音频');
if (!ttsReal.startsWith(baseReal + '/') || duration.tts_audio_sha256 !== shaFile(ttsPath)) fail('TTS音频路径或SHA-256无效');
const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', ttsPath], {encoding: 'utf8'});
const probedSeconds = Number(probe.stdout?.trim());
if (probe.status !== 0 || !Number.isFinite(probedSeconds) || Math.abs(probedSeconds - duration.actual_tts_seconds) > 0.05) fail('TTS实测时长与音频不一致');

const countSpoken = (value) => (value.match(/[\p{L}\p{N}]/gu) || []).length;
const sentenceLengths = paragraphs.flatMap((paragraph) => paragraph.split(/[。！？!?]+/).map(countSpoken).filter((length) => length > 0));
const effectiveSpokenChars = countSpoken(paragraphs.join(''));
const shortThreshold = 15;
const shortRatio = Number((sentenceLengths.filter((length) => length <= shortThreshold).length / sentenceLengths.length).toFixed(4));
const metrics = decision.script_metrics || {};
if (metrics.effective_spoken_chars !== effectiveSpokenChars || metrics.sentence_count !== sentenceLengths.length || metrics.short_sentence_threshold_chars !== shortThreshold || metrics.short_sentence_ratio !== shortRatio || JSON.stringify(metrics.sentence_lengths) !== JSON.stringify(sentenceLengths)) fail('script_metrics 未绑定实际有效口播量与句长分布 expected=' + JSON.stringify({effective_spoken_chars: effectiveSpokenChars, sentence_count: sentenceLengths.length, short_sentence_threshold_chars: shortThreshold, short_sentence_ratio: shortRatio, sentence_lengths: sentenceLengths}));

const steps = decision.execution_steps || {};
const completed = ['step_minus_1', 'step_0', 'step_2', 'step_3', 'step_4', 'step_5', 'step_6', 'step_7'];
const optional = ['pre_a_b', 'step_1', 'step_1_5'];
if (!completed.every((key) => steps[key]?.status === 'COMPLETED' && nonEmpty(steps[key]?.reason)) || !optional.every((key) => ['COMPLETED', 'SKIPPED'].includes(steps[key]?.status) && nonEmpty(steps[key]?.reason))) fail('Step -1至7没有逐项执行并记录理由');

const checks = decision.quality_checks || {};
const requiredChecks = ['content_floor', 'semantic_redundancy', 'human_voice', 'dynamic_duration', 'structure_clarity', 'originality', 'regex', 'style_boundary', 'ai_taste', 'technique_purpose'];
if (!requiredChecks.every((key) => checks[key] === 'PASS') || !nonEmpty(checks.read_aloud_note)) fail('质量检查没有覆盖内容、人味、时长、结构与原有六关');
if (Number.isNaN(Date.parse(decision.completed_at))) fail('completed_at 不是合法时间');

console.log(`PASS chuangzuo script contract schema=3 paragraphs=${paragraphs.length} content_units=${units.length} voice_types=${new Set(voiceTypes).size} publish_copy=PASS tts_seconds=${duration.actual_tts_seconds}`);
