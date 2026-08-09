#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, realpathSync, statSync} from 'node:fs';
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

const body = script.replace(/^#\s+.+\n?/, '').split(/^##\s+拍摄备注\s*$/m)[0];
const paragraphs = body
  .split(/\n\s*\n/)
  .map((block) => block.split('\n').filter((line) => !/^\s*(?:---|>|##\s)/.test(line)).join('\n').trim())
  .filter(Boolean);
if (!paragraphs.length) fail('稿件没有有效口播段落');

if (decision.schema_version !== 3 || decision.contract_version !== 'content-units-v1') fail('创作决策必须使用 schema 3 / content-units-v1');
if (decision.script_title !== title || decision.script_hash !== shaFile(scriptPath)) fail('创作决策未绑定当前稿标题与SHA-256');
if (!nonEmpty(decision.active_style_file) || !existsSync(decision.active_style_file) || !statSync(decision.active_style_file).isFile() || decision.active_style_sha256 !== shaFile(decision.active_style_file)) fail('active style 路径或SHA-256无效');

const requiredPlanningFields = ['topic_thesis', 'hypothesis_id', 'content_form', 'audience', 'expected_audience_effect', 'input_mode', 'structure_tool', 'structure_rationale'];
if (!requiredPlanningFields.every((key) => nonEmpty(decision[key])) || !uniqueNonEmpty(decision.fact_boundary) || !uniqueNonEmpty(decision.alternative_structures) || !uniqueNonEmpty(decision.unproven_assumptions)) fail('schema 3 缺主题、受众、结构或事实边界规划');
const argumentPlan = decision.argument_plan || {};
const requiredArgumentFields = ['opening_contract', 'material_tradeoffs', 'shootable_expression', 'originality_and_citations'];
if (!requiredArgumentFields.every((key) => nonEmpty(argumentPlan[key])) || !uniqueNonEmpty(argumentPlan.reasoning_path)) fail('argument_plan 必须包含开场、论证路径、素材取舍、可拍表达与原创引用规划');
const originalContributions = decision.original_contributions;
if (!Array.isArray(originalContributions) || originalContributions.length < 2 || originalContributions.some((item) => !nonEmpty(item?.judgement) || !nonEmpty(item?.viewer_value))) fail('original_contributions 必须至少两项并写清新增判断与观众价值');

const opening = decision.opening_contract || {};
if (opening.required_prefix !== '嘿，你有没有这种感觉，' || opening.status !== 'PASS' || !paragraphs[0].startsWith(opening.required_prefix)) fail('固定开场必须为“嘿，你有没有这种感觉，”且位于第一段开头');

const sufficiency = decision.content_sufficiency || {};
const sufficiencyStatuses = new Set(['SUFFICIENT_FOR_NATURAL_LENGTH', 'RESEARCHED_TO_SUFFICIENCY']);
if (!nonEmpty(sufficiency.source_kind) || !sufficiencyStatuses.has(sufficiency.status) || !['KEEP_NATURAL_LENGTH', 'EXPANDED_WITH_NEW_UNITS'].includes(sufficiency.expansion_decision) || !Number.isInteger(sufficiency.selected_content_unit_count) || sufficiency.selected_content_unit_count < 1 || !nonEmpty(sufficiency.rationale)) fail('content_sufficiency 未证明内容量决定自然稿长');

const units = decision.content_units;
const unitIds = Array.isArray(units) ? units.map((unit) => unit?.id) : [];
if (!uniqueNonEmpty(unitIds) || units.some((unit) => !nonEmpty(unit.claim) || !nonEmpty(unit.support) || !nonEmpty(unit.viewer_value))) fail('content_units 必须是唯一且完整的“判断+支撑+观众价值”');
if (sufficiency.selected_content_unit_count !== units.length) fail('content_sufficiency 的内容单位数量与实际不一致');
const normalizedClaims = units.map((unit) => unit.claim.replace(/[\s，。！？、,.!?]/g, '').toLowerCase());
if (new Set(normalizedClaims).size !== normalizedClaims.length) fail('content_units 存在重复判断');

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

const redundancy = decision.semantic_redundancy_review || {};
if (redundancy.status !== 'PASS' || !Array.isArray(redundancy.passes) || redundancy.passes.length !== 2 || redundancy.passes.map((item) => item?.pass).join(',') !== '1,2' || redundancy.passes.some((item) => !nonEmpty(item.focus) || item.verdict !== 'PASS') || !Array.isArray(redundancy.duplicate_groups)) fail('必须完成两遍内容语义重复审计');
for (const group of redundancy.duplicate_groups) {
  if (!['MERGED', 'REMOVED', 'ALLOWED_CALLBACK'].includes(group?.resolution) || !nonEmpty(group?.rationale)) fail('重复候选必须记录合并、删除或带新增后果的回扣');
}

const voice = decision.human_voice_contract || {};
const voiceDevices = Array.isArray(voice.devices) ? voice.devices : [];
const voiceTypes = voiceDevices.map((item) => item?.type);
if (voice.status !== 'PRESERVED' || voice.required_minimum_device_types !== 4 || new Set(voiceTypes).size < 4) fail('人味废话必须保留至少4种不同设备');
for (const device of voiceDevices) {
  const index = auditIds.indexOf(device.paragraph_id);
  if (index === -1 || !nonEmpty(device.text) || !paragraphs[index].includes(device.text)) fail('人味设备没有绑定真实段落原文');
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

console.log(`PASS chuangzuo script contract schema=3 paragraphs=${paragraphs.length} content_units=${units.length} voice_types=${new Set(voiceTypes).size} tts_seconds=${duration.actual_tts_seconds}`);
