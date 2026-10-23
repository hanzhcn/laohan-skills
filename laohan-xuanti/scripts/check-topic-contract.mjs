#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, realpathSync, statSync} from 'node:fs';
import {basename, dirname, isAbsolute, join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {verifyCreationHandoff, creationFraming, handoffHash} from './creation-handoff-contract.mjs';

const args = process.argv.slice(2);
const episodeIndex = args.indexOf('--episode');
const workspaceIndex = args.indexOf('--workspace');
const workspaceMode = workspaceIndex !== -1;
const directoryArg = args[(workspaceMode ? workspaceIndex : episodeIndex) + 1];
const baseIndex = args.indexOf('--base');
if ((episodeIndex !== -1) === workspaceMode || !directoryArg || directoryArg.startsWith('--') || (workspaceMode && (baseIndex === -1 || !args[baseIndex + 1]))) {
  console.error('用法: check-topic-contract.mjs --episode episodes/<slug> | --workspace <研究目录> --base <项目根>');
  process.exit(2);
}
const episode = resolve(directoryArg);
if (!existsSync(episode) || !statSync(episode).isDirectory() || (!workspaceMode && basename(dirname(episode)) !== 'episodes')) {
  console.error('BLOCKED topic contract: episode必须位于episodes/<slug>');
  process.exit(1);
}
const root = realpathSync(episode);
const projectRoot = workspaceMode ? realpathSync(resolve(args[baseIndex + 1])) : realpathSync(dirname(dirname(root)));
if (workspaceMode && !root.startsWith(projectRoot + '/')) {
  console.error('BLOCKED topic contract: 研究目录必须位于指定项目根内');
  process.exit(1);
}
const target = (relative) => {
  const path = join(root, relative);
  if (existsSync(path) && !realpathSync(path).startsWith(root + '/')) throw new Error('产物不得逃逸episode: ' + relative);
  return path;
};
const nonEmpty = (value) => typeof value === 'string' && value.trim();
const uniqueNonEmpty = (values) => Array.isArray(values) && values.length > 0 && values.every(nonEmpty) && new Set(values).size === values.length;
const shaFile = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const readJson = (relative) => JSON.parse(readFileSync(target(relative), 'utf8'));
const block = (message, marker = 'BLOCKED') => {
  console.error(`${marker} topic contract: ${message}`);
  process.exit(1);
};

for (const relative of ['00-选题-signals.json', '00-选题-candidates.json']) if (!existsSync(target(relative))) block('缺 ' + relative);
const signals = readJson('00-选题-signals.json');
const sources = Array.isArray(signals.sources) ? signals.sources : [];
if (signals.schema_version !== 3 || signals.episode !== basename(episode)) block('signals必须是当前episode的schema 3');
if (workspaceMode && signals.workspace_kind !== 'CANDIDATE_RESEARCH') block('workspace必须绑定当前候选研究身份');
const discoveryMode = signals.discovery_mode || 'AUTONOMOUS_SCAN';
if (!['AUTONOMOUS_SCAN', 'USER_DIRECTION_RESEARCH'].includes(discoveryMode)) block('discovery_mode非法');
let validatedDirectionResearch = null;
if (discoveryMode === 'USER_DIRECTION_RESEARCH') {
  const direction = signals.direction_research || {};
  if (!nonEmpty(direction.series_id) || !['DEMAND_VALIDATED', 'EXPERIMENTAL_ONE_OFF'].includes(direction.status) || !nonEmpty(direction.series_research_path) || !/^[a-f0-9]{64}$/.test(direction.series_research_sha256 || '')) block('USER_DIRECTION_RESEARCH必须绑定已验证的系列研究包');
  const seriesRoot = join(projectRoot, 'script-pool/series-research');
  const requestedSeriesPath = resolve(projectRoot, direction.series_research_path);
  if (!existsSync(seriesRoot) || !existsSync(requestedSeriesPath) || !statSync(requestedSeriesPath).isFile()) block('series_research_path或SHA无效');
  const realSeriesRoot = realpathSync(seriesRoot);
  const seriesPath = realpathSync(requestedSeriesPath);
  if (!seriesPath.startsWith(realSeriesRoot + '/') || basename(seriesPath) !== 'series-research.json' || direction.series_research_sha256 !== shaFile(seriesPath)) block('series_research_path必须指向canonical series-research.json且SHA有效');
  const seriesValidator = resolve(process.env.LAOHAN_SERIES_RESEARCH_VALIDATOR || join(projectRoot, 'scripts/check-series-research.mjs'));
  if (!existsSync(seriesValidator)) block('缺系列研究validator');
  const seriesValidation = spawnSync('node', [seriesValidator, '--series', dirname(seriesPath)], {encoding: 'utf8'});
  if (seriesValidation.status !== 0) block((seriesValidation.stderr || seriesValidation.stdout || '系列研究包验证失败').trim());
  let seriesResearch;
  try {
    seriesResearch = JSON.parse(readFileSync(seriesPath, 'utf8'));
  } catch {
    block('series_research.json不是合法JSON');
  }
  if (seriesResearch.series_id !== direction.series_id || seriesResearch.status !== direction.status) block('signals中的series_id/status与已验证研究包不一致');
  validatedDirectionResearch = seriesResearch;
  const requiredDirectionSources = ['bilibili', 'xiaohongshu', 'douyin', 'zhihu'];
  if (requiredDirectionSources.some((sourceId) => !sources.some((item) => item?.source_id === sourceId && ['OK', 'EMPTY', 'FAILED', 'PARTIAL'].includes(item?.status)))) block('方向研究必须真实尝试哔哩哔哩、小红书、抖音、知乎');
  if (direction.status === 'DEMAND_VALIDATED' && sources.filter((item) => requiredDirectionSources.includes(item?.source_id) && item?.status === 'OK' && item?.result_count > 0).length < 2) block('DEMAND_VALIDATED方向研究至少需要两个平台有需求信号');
} else {
  const tracked = sources.find((item) => item?.source_id === 'tracked-douyin-creators');
  const coverage = tracked?.coverage;
  const accounts = coverage?.accounts;
  const expected = Number(coverage?.expected) || 0;
  if (!tracked || tracked.status === 'FAILED' || !Array.isArray(accounts) || accounts.length !== expected || expected === 0 || new Set(accounts.map((item) => item?.sec_uid)).size !== expected) block('数据层达人库必须完整逐个扫描ACTIVE+PENDING全池');
  const activeAccounts = accounts.filter((item) => item?.pool_status !== 'PENDING');
  if (!activeAccounts.length || activeAccounts.some((item) => !['OK', 'EMPTY'].includes(item?.status))) block('ACTIVE账号必须全部扫描成功，正常空结果记EMPTY');
  if (!sources.some((item) => item?.source_id === 'self-channel' && item?.status === 'OK' && item?.result_count > 0)) block('必须读取数据层self-channel自频道异常倍数信号');
  if (!sources.some((item) => item?.source_id === 'personal-expression-pool' && ['OK', 'EMPTY'].includes(item?.status))) block('缺Jeffrey个人表达池读取记录');
  const supplemental = new Set(['tracked-douyin-creators', 'self-channel', 'personal-expression-pool']);
  if (!sources.some((item) => !supplemental.has(item?.source_id) && item?.status === 'OK' && item?.result_count > 0)) block('至少一个全面热点源必须成功');
}

const candidatesPath = target('00-选题-candidates.json');
const candidates = readJson('00-选题-candidates.json');
const items = Array.isArray(candidates.candidates) ? candidates.candidates : [];
if (![3, 4].includes(candidates.schema_version) || items.length < 2 || new Set(items.map((item) => item?.id)).size !== items.length) block('candidates必须是schema 3（历史合同）或schema 4（五步法合同）且至少两个唯一候选');
if (workspaceMode && (candidates.schema_version !== 4 || existsSync(target('00-选题.json')) || existsSync(target('00-选题.md')) || items.some((item) => !['SHORTLISTED', 'REJECTED'].includes(item.disposition)))) block('待选研究必须是schema4短名单，不得提前定题或冒充历史合同');
const readyForWriting = (item) => item.disposition === 'AUTO_SELECTED' || (workspaceMode && item.disposition === 'SHORTLISTED');

const validateDirectionPackets = () => {
  const topic = existsSync(target('00-选题.json')) ? readJson('00-选题.json') : null;
  const direction = topic?.direction_research || {};
  if (topic && (direction.mode !== 'USER_DIRECTION_RESEARCH' || direction.series_id !== signals.direction_research.series_id || !nonEmpty(direction.episode_id) || !nonEmpty(direction.packet_path) || !/^[a-f0-9]{64}$/.test(direction.packet_sha256 || ''))) block('最终选题必须绑定当前系列和单期资料包');
  if (topic) {
    const packetPath = target(direction.packet_path);
    if (!existsSync(packetPath) || !statSync(packetPath).isFile() || direction.packet_sha256 !== shaFile(packetPath)) block('direction_research.packet_sha256未绑定当前系列研究摘录');
    let packet;
    try {
      packet = JSON.parse(readFileSync(packetPath, 'utf8'));
    } catch {
      block('系列研究摘录不是合法JSON');
    }
    if (packet.schema_version !== 1 || packet.series_id !== direction.series_id || packet.episode_id !== direction.episode_id || packet.series_research_sha256 !== signals.direction_research.series_research_sha256 || !Array.isArray(packet.claims) || !packet.claims.length) block('系列研究摘录未绑定当前series、episode、series_research_sha256和可用claims');
    const sourceEpisode = validatedDirectionResearch?.episodes?.find((item) => item?.id === direction.episode_id);
    if (!sourceEpisode?.packet_path) block('系列研究真源中不存在当前episode资料包');
    const canonicalPacketPath = realpathSync(join(dirname(realpathSync(resolve(dirname(dirname(root)), signals.direction_research.series_research_path))), sourceEpisode.packet_path));
    if (!canonicalPacketPath.startsWith(realpathSync(join(dirname(dirname(root)), 'script-pool/series-research')) + '/') || shaFile(packetPath) !== shaFile(canonicalPacketPath)) block('episode系列研究摘录必须与已验证原始packet逐字节一致');
  }
};

if (candidates.schema_version === 3) {
  // ===== 历史合同（2026-09-17前episode）：Jeffrey情绪筛选路径，继续按原合同验证 =====
  if (!existsSync(target('00-选题-Jeffrey筛选.json'))) {
    if (items.some((item) => item.disposition !== 'AWAITING_JEFFREY') || existsSync(target('00-选题.json')) || existsSync(target('00-选题.md'))) block('Jeffrey确认前所有候选必须为AWAITING_JEFFREY，且不得预写最终选题');
    block('等待Jeffrey从候选中按情绪与表达欲选择', 'WAITING_FOR_JEFFREY_EMOTION_SELECTION');
  }
  const selection = readJson('00-选题-Jeffrey筛选.json');
  if (selection.status === 'REJECTED_ALL') {
    const rejectionRecordValid = selection.schema_version === 1 && selection.authorized_by === 'Jeffrey' && !Number.isNaN(Date.parse(selection.rejected_at)) && !nonEmpty(selection.selected_candidate_id) && nonEmpty(selection.rejection_reason) && nonEmpty(selection.strongest_near_miss) && nonEmpty(selection.rescan_direction) && /^[a-f0-9]{64}$/.test(selection.candidates_sha256 || '');
    if (!rejectionRecordValid) block('Jeffrey全部否决记录必须绑定候选，并说明无感原因、最接近项和下一轮扫描方向');
    if (selection.candidates_sha256 !== shaFile(candidatesPath)) {
      const history = Array.isArray(candidates.screening_summary?.rejection_history) ? candidates.screening_summary.rejection_history : [];
      const carried = history.some((item) => item?.candidates_sha256 === selection.candidates_sha256 && item?.rejected_at === selection.rejected_at && item?.rejection_reason === selection.rejection_reason && item?.strongest_near_miss === selection.strongest_near_miss && item?.rescan_direction === selection.rescan_direction);
      if (!carried) block('重新扫描后的候选必须在screening_summary.rejection_history保留上一轮Jeffrey全部否决记录');
      if (items.some((item) => item.disposition !== 'AWAITING_JEFFREY') || existsSync(target('00-选题.json')) || existsSync(target('00-选题.md'))) block('重新扫描后的候选必须全部等待Jeffrey选择，且不得保留最终选题');
      block('新一轮候选已生成并保留上一轮否决原因，等待Jeffrey重新进行情绪与表达欲筛选', 'WAITING_FOR_JEFFREY_EMOTION_SELECTION');
    }
    if (items.some((item) => item.disposition !== 'REJECTED') || existsSync(target('00-选题.json')) || existsSync(target('00-选题.md'))) block('Jeffrey全部无感时所有候选必须为REJECTED，且不得存在最终选题');
    block('Jeffrey已否决全部候选；保留否决原因并回到三路扫描，不得勉强选题或进入写稿', 'TOPIC_RESCAN_REQUIRED');
  }
  if (selection.schema_version !== 1 || selection.status !== 'ACCEPTED' || selection.authorized_by !== 'Jeffrey' || Number.isNaN(Date.parse(selection.accepted_at)) || selection.candidates_sha256 !== shaFile(candidatesPath) || !nonEmpty(selection.selected_candidate_id) || !nonEmpty(selection.first_reaction) || !nonEmpty(selection.challenge_or_addition) || !nonEmpty(selection.firsthand_detail) || selection.would_say_without_heat !== true) block('Jeffrey筛选必须绑定当前候选并记录第一反应、补充/反驳、亲历细节与无热度表达意愿');
  const legacySelected = items.filter((item) => item.disposition === 'SELECTED');
  if (legacySelected.length !== 1 || legacySelected[0].id !== selection.selected_candidate_id || items.some((item) => !['SELECTED', 'REJECTED'].includes(item.disposition))) block('Jeffrey接受后必须且只能有一个匹配的SELECTED候选');
  if (!existsSync(target('00-选题.json')) || !existsSync(target('00-选题.md')) || statSync(target('00-选题.md')).size === 0) block('Jeffrey筛选通过后必须生成最终选题JSON与Markdown');
  const legacyTopic = readJson('00-选题.json');
  if (legacyTopic.schema_version !== 3 || legacyTopic.selected_candidate_id !== selection.selected_candidate_id || !nonEmpty(legacyTopic.audience) || !nonEmpty(legacyTopic.thesis)) block('最终选题必须是schema 3并绑定Jeffrey选中的候选');
  if (discoveryMode === 'USER_DIRECTION_RESEARCH') validateDirectionPackets();
  const legacyLockPath = target('00-编排/executor-lock.json');
  const legacyLocked = existsSync(legacyLockPath) && (() => { try { return (JSON.parse(readFileSync(legacyLockPath, 'utf8')).selected_executors || []).some((entry) => ['laohan-xuanti', 'laohan-redian'].includes(entry?.id)); } catch { return false; } })();
  const legacyExperimental = validatedDirectionResearch?.status === 'EXPERIMENTAL_ONE_OFF';
  const legacyExperimentalValid = legacyExperimental && items.every((item) => {
    const exp = item?.experimental_basis;
    const expectedExp = validatedDirectionResearch?.experimental_basis;
    return exp?.type && expectedExp?.type && exp.type === expectedExp.type && Array.isArray(exp.source_ids) && exp.source_ids.length && nonEmpty(exp.rationale);
  });
  if (!legacyLocked && !(legacyExperimental && legacyExperimentalValid)) {
    if (items.some((item) => !nonEmpty(item?.tension?.type) || !nonEmpty(item?.tension?.common_assumption) || !nonEmpty(item?.tension?.jeffrey_position) || !nonEmpty(item?.tension?.conflict_statement))) block('每个候选必须包含冲突性判断（tension：类型/常见假设/Jeffrey立场/冲突表述）');
    const legacyLanePriority = new Map([['BENCHMARK_CREATOR', 1], ['SELF_CHANNEL', 2], ['BROAD_HOTSPOT', 3], ['PERSONAL_EXPRESSION', 4]]);
    const legacyLaneOf = (sourceId) => sourceId === 'tracked-douyin-creators' ? 'BENCHMARK_CREATOR' : sourceId === 'self-channel' ? 'SELF_CHANNEL' : sourceId === 'personal-expression-pool' ? 'PERSONAL_EXPRESSION' : 'BROAD_HOTSPOT';
    const legacySignalLane = new Map();
    for (const src of sources) for (const r of (Array.isArray(src?.results) ? src.results : [])) if (r?.id) legacySignalLane.set(r.id, legacyLaneOf(src.source_id));
    for (const item of items) {
      const origin = item?.candidate_origin;
      const ids = Array.isArray(item?.signal_ids) ? item.signal_ids : [];
      const originIds = Array.isArray(origin?.origin_signal_ids) ? origin.origin_signal_ids : [];
      const corrob = Array.isArray(origin?.corroborating_lanes) ? origin.corroborating_lanes : [];
      if (!origin || !legacyLanePriority.has(origin.primary_lane) || origin.priority_rank !== legacyLanePriority.get(origin.primary_lane) || !originIds.length || originIds.some((id) => !ids.includes(id) || legacySignalLane.get(id) !== origin.primary_lane) || new Set(corrob).size !== corrob.length || corrob.some((lane) => !legacyLanePriority.has(lane) || lane === origin.primary_lane || !ids.some((id) => legacySignalLane.get(id) === lane))) block('每个候选必须登记可追溯的来源优先级：对标账号=1、自频道=2、全面热点=3、个人表达=4；交叉印证不能伪造');
    }
    if (validatedDirectionResearch?.status !== 'EXPERIMENTAL_ONE_OFF' && items.some((item, index) => index > 0 && item?.candidate_origin?.priority_rank < items[index - 1]?.candidate_origin?.priority_rank)) block('候选展示顺序必须遵循来源优先级：对标账号在前、自频道其次、全面热点再次、个人表达最后');
  }
  console.log(`PASS xuanti topic contract schema=3 legacy selected=${selection.selected_candidate_id}`);
  process.exit(0);
}

// ===== 五步法合同（2026-09-17起）：AI自主定题 + Jeffrey否决权 =====

// Current schema 4 must carry the same factual/health protections as the older runtime.
const validTime = (value) => Number.isFinite(Date.parse(value)) && Date.parse(value) <= Date.now() + 300000;
const validEvidence = (x) => nonEmpty(x?.id) && nonEmpty(x.source) && ['PRIMARY', 'PLATFORM_SIGNAL', 'SECONDARY'].includes(x.source_type) && /^https?:\/\//.test(x.url || '') && validTime(x.retrieved_at);
const evidence = Array.isArray(candidates.evidence) ? candidates.evidence : [];
if (!uniqueNonEmpty(evidence.map((x) => x?.id)) || !evidence.every(validEvidence)) block('schema 4必须提供唯一、有效时间与URL的PRIMARY/平台来源');
const evidenceById = new Map(evidence.map((x) => [x.id, x]));
const allSignalIds = sources.flatMap((x) => Array.isArray(x.results) ? x.results.map((r) => r?.id) : []);
if (!validTime(signals.collected_at) || !uniqueNonEmpty(sources.map((x) => x?.source_id)) || !uniqueNonEmpty(allSignalIds)
  || sources.some((x) => !validTime(x.attempted_at) || !(discoveryMode === 'USER_DIRECTION_RESEARCH' ? ['OK', 'EMPTY', 'FAILED', 'PARTIAL'] : ['OK', 'EMPTY', 'FAILED']).includes(x.status)
    || !Array.isArray(x.results) || x.result_count !== x.results.length
    || (['OK', 'PARTIAL'].includes(x.status) ? x.result_count <= 0 : x.result_count !== 0)
    || (x.status === 'FAILED' && !nonEmpty(x.error)) || (x.status === 'PARTIAL' && !nonEmpty(x.error || x.limitations || x.reason))
    || x.record_sha256 !== createHash('sha256').update(JSON.stringify(x.results)).digest('hex'))) block('schema 4 signals状态、真实观测时间、结果条数或SHA无效');
for (const item of items) {
  if (!['opinion-video', 'tutorial-video'].includes(item.content_form) || !['BEGINNER', 'INTERMEDIATE', 'ADVANCED'].includes(item.audience_level)
    || !nonEmpty(item.audience_problem) || !nonEmpty(item.audience_promise) || !nonEmpty(item.why_now) || !nonEmpty(item.platform_query_intent)
    || !Array.isArray(item.assumed_prerequisites) || !Array.isArray(item.jargon_to_explain)
    || [...item.assumed_prerequisites, ...item.jargon_to_explain].some((x) => !nonEmpty(x))) block('schema 4候选必须声明合法内容形态、受众任务、承诺与前提解释');
  if (!uniqueNonEmpty(item.signal_ids) || item.signal_ids.some((id) => !allSignalIds.includes(id))) block('schema 4候选信号必须实际存在');
  const gap = item.content_gap;
  if (!gap || !['CONFIRMED', 'NOT_CONFIRMED', 'UNAVAILABLE'].includes(gap.status) || !nonEmpty(gap.rationale) || !Array.isArray(gap.evidence_ids)
    || (gap.status === 'UNAVAILABLE' ? gap.evidence_ids.length !== 0 : !uniqueNonEmpty(gap.evidence_ids) || gap.evidence_ids.some((id) => !item.evidence_ids?.includes(id) || evidenceById.get(id)?.source_type !== 'PLATFORM_SIGNAL'))) block('schema 4内容缺口状态必须如实绑定平台证据');
  const keys = ['audience_fit', 'evidence_strength', 'platform_relevance', 'differentiation', 'creator_fit', 'production_feasibility', 'learning_value'];
  if (!nonEmpty(item.scorecard?.rationale) || keys.some((key) => !Number.isInteger(item.scorecard[key]) || item.scorecard[key] < 1 || item.scorecard[key] > 5)) block('schema 4候选比较必须有完整七维与理由（不是流量预测）');
  const ids = item.evidence_ids;
  const map = item.claim_evidence_map;
  if (!uniqueNonEmpty(ids) || ids.some((id) => !evidenceById.has(id)) || !ids.some((id) => evidenceById.get(id).source_type === 'PRIMARY')
    || !Array.isArray(map) || !uniqueNonEmpty(map.map((x) => x?.claim_id))
    || map.some((x) => !nonEmpty(x.claim) || !uniqueNonEmpty(x.evidence_ids) || x.evidence_ids.some((id) => !ids.includes(id)))) block('schema 4每个候选必须绑定PRIMARY与逐主张来源映射');
  if (!map.some((x) => x.evidence_ids.some((id) => evidenceById.get(id)?.source_type === 'PRIMARY'))) block('PRIMARY必须实际支撑至少一个主张，不能只挂在来源列表');
  const alignment = item.platform_alignment;
  if (!alignment || !['ALIGNED', 'ADJACENT', 'CONTRADICTED', 'UNRESOLVED', 'UNAVAILABLE'].includes(alignment.status) || !nonEmpty(alignment.rationale) || !Array.isArray(alignment.evidence_ids)
    || (alignment.status === 'UNAVAILABLE' ? alignment.evidence_ids.length !== 0 : !uniqueNonEmpty(alignment.evidence_ids) || alignment.evidence_ids.some((id) => !ids.includes(id) || evidenceById.get(id)?.source_type !== 'PLATFORM_SIGNAL'))) block('schema 4平台语义状态必须绑定实际平台证据，不可用不能伪造对齐');
  if (readyForWriting(item) && !['ALIGNED', 'ADJACENT', 'UNAVAILABLE'].includes(alignment.status)) block('可写候选平台证据不能矛盾或未决');
  const fit = item.creator_fit;
  if (!fit || !['FIRSTHAND_EXPERIENCE', 'BUILT_OR_TESTED', 'OWNED_EVIDENCE', 'LONG_TERM_PRACTICE', 'RESEARCHED_JUDGMENT', 'NOT_ESTABLISHED'].includes(fit.basis) || !nonEmpty(fit.why_jeffrey) || !nonEmpty(fit.distinctive_judgment) || (readyForWriting(item) && fit.basis === 'NOT_ESTABLISHED')) block('schema 4必须登记真实作者依据与独特判断');
  if (readyForWriting(item) && (item.content_form === 'tutorial-video' || item.creation_handoff?.production?.delivery_modes?.some((x) => ['OPERATION', 'EFFECT_COMPARISON'].includes(x)))) {
    const proof = item.tutorial_proof;
    const path = proof?.evidence_path && target(proof.evidence_path);
    if (proof?.status !== 'VERIFIED' || !path || !existsSync(path) || !statSync(path).isFile() || proof.evidence_sha256 !== shaFile(path) || !nonEmpty(proof.version_boundary) || !nonEmpty(proof.recovery)) block('教程选中前必须绑定本机实测、版本边界与失败恢复');
  }
  if (readyForWriting(item)) {
    try { verifyCreationHandoff({handoff: item.creation_handoff, review: item.material_review, root: projectRoot, evidenceIds: item.evidence_ids, contentForm: item.content_form, tutorialProof: item.tutorial_proof, tutorialRoot: root, framing: creationFraming(item)}); }
    catch (error) { block('material: ' + error.message); }
  }
}
const screening = candidates.screening_summary;
const longlist = Array.isArray(screening?.longlist) ? screening.longlist : [];
if (!screening || screening.raw_signal_count !== allSignalIds.length || !Number.isInteger(screening.event_cluster_count)
  || screening.event_cluster_count < longlist.length || longlist.length < Math.min(8, screening.event_cluster_count) || longlist.length > 12
  || !uniqueNonEmpty(longlist.map((x) => x?.event_cluster_id))
  || longlist.some((x) => !nonEmpty(x.working_title) || !nonEmpty(x.reason) || !['SHORTLISTED', 'REJECTED'].includes(x.disposition)
    || !uniqueNonEmpty(x.signal_ids) || x.signal_ids.some((id) => !allSignalIds.includes(id))
    || x.source_count !== new Set(x.signal_ids.map((id) => sources.find((src) => src.results.some((r) => r.id === id))?.source_id)).size)
  || items.some((x) => !longlist.some((row) => row.event_cluster_id === x.event_cluster_id && row.disposition === 'SHORTLISTED'))) block('schema 4必须保留真实signals到长名单/候选的筛选链路');
const health = existsSync(target('00-选题-source-health.json')) ? readJson('00-选题-source-health.json') : {};
const healthSources = Array.isArray(health.sources) ? health.sources : [];
if (!uniqueNonEmpty(healthSources.map((row) => row?.source_id))) block('source-health必须有唯一非空来源身份');
for (const record of sources) {
  if (healthSources.filter((row) => row.source_id === record.source_id && row.result_file === '00-选题-signals.json').length !== 1) block('每个signals来源必须保留唯一对应health记录，不能省略失败源');
}
const signalRoles = new Set(['DISCOVERY', 'BENCHMARK_CREATOR', 'PERSONAL_EXPRESSION']);
if (healthSources.some((row) => (signalRoles.has(row.source_role) || row.result_file === '00-选题-signals.json') && !sources.some((record) => record.source_id === row.source_id))) block('health不得捏造signals之外的发现来源');
for (const row of healthSources) {
  const record = sources.find((src) => src.source_id === row.source_id);
  if (record && (row.status !== record.status || row.result_count !== record.result_count || row.record_sha256 !== record.record_sha256 || row.result_file !== '00-选题-signals.json')) block('source-health不能把signals失败或结果条数洗白，必须绑定同一record SHA');
}
if (health.schema_version !== 1 || !validTime(health.collected_at) || !uniqueNonEmpty(healthSources.map((x) => x?.source_id))
  || healthSources.some((x) => {
    if (!nonEmpty(x.result_file)) return true;
    const path = target(x.result_file);
    return !existsSync(path) || !statSync(path).isFile() || x.result_sha256 !== shaFile(path) || !validTime(x.attempted_at)
      || !(discoveryMode === 'USER_DIRECTION_RESEARCH' ? ['OK', 'EMPTY', 'FAILED', 'SKIPPED', 'PARTIAL'] : ['OK', 'EMPTY', 'FAILED', 'SKIPPED']).includes(x.status) || !Number.isInteger(x.result_count)
      || (['OK', 'PARTIAL'].includes(x.status) ? x.result_count <= 0 : x.result_count !== 0)
      || (x.status === 'FAILED' && !nonEmpty(x.error)) || (x.status === 'PARTIAL' && !nonEmpty(x.error || x.limitations || x.reason)) || (x.status === 'SKIPPED' && !nonEmpty(x.reason));
  }) || !healthSources.some((x) => x.source_role === 'DISCOVERY' && x.status === 'OK' && sources.some((src) => src.source_id === x.source_id))
  || !healthSources.some((x) => x.source_role === 'DOUYIN_SEARCH' && ['OK', 'EMPTY', 'FAILED'].includes(x.status) && x.result_file === '00-抖音搜索证据.json')
  || !healthSources.some((x) => x.source_role === 'PRIMARY_PROOF' && x.status === 'OK' && evidence.some((ev) => ev.source_type === 'PRIMARY' && ev.url === x.command_or_url))) block('schema 4 source-health必须绑定真实结果SHA、DISCOVERY/抖音尝试/PRIMARY角色');
const douyin = readJson('00-抖音搜索证据.json');
const validDouyinResult = (x) => nonEmpty(x?.id) && Number.isInteger(x.rank) && x.rank > 0 && nonEmpty(x.desc) && nonEmpty(x.author)
  && /^https?:\/\//.test(x.url || '') && x.field_availability && ['plays', 'likes', 'comments', 'shares'].every((key) =>
    typeof x.field_availability[key] === 'boolean' && (x.field_availability[key] ? Number.isFinite(x[key]) && x[key] >= 0 : x[key] === null));
if (!existsSync(target('00-抖音搜索证据.md')) || statSync(target('00-抖音搜索证据.md')).size === 0 || !validTime(douyin.collected_at) || douyin.executor?.name !== 'opencli'
  || !nonEmpty(douyin.executor.version) || !['PASS', 'FAILED'].includes(douyin.executor.doctor_status) || typeof douyin.executor.logged_in !== 'boolean'
  || !['AVAILABLE', 'UNAVAILABLE'].includes(douyin.executor.availability_status)
  || (douyin.executor.availability_status === 'AVAILABLE' && (douyin.executor.doctor_status !== 'PASS' || !douyin.executor.logged_in))
  || !Array.isArray(douyin.queries) || !douyin.queries.length
  || douyin.queries.some((x) => !nonEmpty(x.query) || !nonEmpty(x.command) || !x.command.includes('opencli douyin search') || !validTime(x.attempted_at)
    || !['OK', 'EMPTY_OR_FIELD_UNAVAILABLE', 'FAILED'].includes(x.status) || !Array.isArray(x.results) || x.result_count !== x.results.length
    || !x.results.every(validDouyinResult) || (x.status === 'OK' ? !x.results.length : x.results.length !== 0) || (x.status === 'FAILED' && !nonEmpty(x.error)))
  || (douyin.executor.availability_status === 'UNAVAILABLE' && douyin.queries.some((x) => x.status !== 'FAILED'))
  || (douyin.queries.every((x) => x.status === 'FAILED') && douyin.executor.availability_status !== 'UNAVAILABLE')) block('schema 4抖音必须是真实预检/登录/查询/结构有效结果，失败与零结果分开');

const douyinCount = douyin.queries.reduce((sum, query) => sum + query.result_count, 0);
const douyinStatus = douyinCount > 0 ? 'OK' : douyin.queries.every((query) => query.status === 'FAILED') ? 'FAILED' : 'EMPTY';
if (!healthSources.filter((row) => row.source_role === 'DOUYIN_SEARCH').length || healthSources.filter((row) => row.source_role === 'DOUYIN_SEARCH').some((row) => row.result_file !== '00-抖音搜索证据.json' || row.status !== douyinStatus || row.result_count !== douyinCount)) block('DOUYIN_SEARCH health必须与真实查询聚合状态和条数一致');



// Jeffrey否决：存在否决记录时进入重扫，不得保留最终选题
const rejectionHistory = candidates.screening_summary?.rejection_history || [];
if (!Array.isArray(rejectionHistory) || rejectionHistory.some((entry) => !/^[a-f0-9]{64}$/.test(entry?.candidates_sha256 || '') || !nonEmpty(entry.veto_reason || entry.rejection_reason))) block('否决历史必须保留原候选SHA与真实理由');
if (rejectionHistory.length && !existsSync(target('00-选题-Jeffrey否决.json'))) block('已有否决历史时必须保留原否决记录，不删除源记录清门');
if (rejectionHistory.some((entry) => nonEmpty(entry.selected_candidate_title) && items.some((item) => item.title === entry.selected_candidate_title && item.disposition === 'AUTO_SELECTED'))) block('不得重复自动选中历史已否决同题', 'TOPIC_RESCAN_REQUIRED');
if (existsSync(target('00-选题-Jeffrey否决.json'))) {
  const veto = readJson('00-选题-Jeffrey否决.json');
  const vetoValid = veto.schema_version === 1 && veto.vetoed_by === 'Jeffrey' && !Number.isNaN(Date.parse(veto.vetoed_at)) && /^[a-f0-9]{64}$/.test(veto.candidates_sha256 || '') && nonEmpty(veto.selected_candidate_id) && nonEmpty(veto.veto_reason);
  if (!vetoValid) block('Jeffrey否决记录必须绑定候选SHA并说明否决原因');
  if (veto.candidates_sha256 === shaFile(candidatesPath)) block('Jeffrey已否决当前选题；保留否决记录并按原因重扫，不得进入②', 'TOPIC_RESCAN_REQUIRED');
  const history = candidates.screening_summary?.rejection_history;
  if (!Array.isArray(history) || !history.some((entry) => ['candidates_sha256', 'vetoed_at', 'veto_reason', 'selected_candidate_id'].every((key) => entry?.[key] === veto[key]))) block('重新扫描的候选必须保留上轮Jeffrey否决历史，不删除否决记录');
  if (nonEmpty(veto.selected_candidate_title) && items.some((item) => item.title === veto.selected_candidate_title && item.disposition === 'AUTO_SELECTED')) block('不得重复自动选中Jeffrey已否决的同题', 'TOPIC_RESCAN_REQUIRED');

}

const signalIds = new Set(sources.flatMap((source) => Array.isArray(source.results) ? source.results.map((item) => item?.id) : []));
const publicSignalIds = new Set(sources.filter((source) => source?.source_id !== 'personal-expression-pool').flatMap((source) => Array.isArray(source.results) ? source.results.map((item) => item?.id) : []));
const laneForSource = (sourceId) => sourceId === 'tracked-douyin-creators' ? 'BENCHMARK_CREATOR' : sourceId === 'self-channel' ? 'SELF_CHANNEL' : sourceId === 'personal-expression-pool' ? 'PERSONAL_EXPRESSION' : 'BROAD_HOTSPOT';
const signalLane = new Map(sources.flatMap((source) => Array.isArray(source.results) ? source.results.map((item) => [item?.id, laneForSource(source.source_id)]) : []));
const lanePriority = new Map([['BENCHMARK_CREATOR', 1], ['SELF_CHANNEL', 2], ['BROAD_HOTSPOT', 3], ['PERSONAL_EXPRESSION', 4]]);
const tensionTypes = new Set(['CONFLICT', 'MISCONCEPTION', 'COUNTERINTUITIVE', 'TRADEOFF']);
const falsePositiveTypes = ['celebrity_event', 'controversy', 'off_niche', 'pure_news'];
for (const item of items) {
  const publicInterestIds = Array.isArray(item?.public_interest_evidence_ids) ? item.public_interest_evidence_ids : item?.signal_ids;
  const experimental = discoveryMode === 'USER_DIRECTION_RESEARCH' && validatedDirectionResearch?.status === 'EXPERIMENTAL_ONE_OFF';
  const experimentalEvidence = item?.experimental_basis;
  const expectedExperimental = validatedDirectionResearch?.experimental_basis;
  const validExperimentalEvidence = experimental && experimentalEvidence?.type === expectedExperimental?.type && uniqueNonEmpty(experimentalEvidence?.source_ids) && expectedExperimental.source_ids.every((id) => experimentalEvidence.source_ids.includes(id)) && nonEmpty(experimentalEvidence?.rationale);
  const validPublicEvidence = Array.isArray(publicInterestIds) && publicInterestIds.some((id) => publicSignalIds.has(id)) && publicInterestIds.every((id) => signalIds.has(id));
  if (!nonEmpty(item?.id) || !nonEmpty(item?.title) || !nonEmpty(item?.audience || item?.audience_problem) || !nonEmpty(item?.thesis) || (!validPublicEvidence && !validExperimentalEvidence) || !nonEmpty(item?.creator_fit?.why_jeffrey) || !nonEmpty(item?.creator_fit?.distinctive_judgment)) block('每个候选必须有公共兴趣信号，或为EXPERIMENTAL_ONE_OFF绑定已验证官方事件/Jeffrey亲历/小众任务依据，并提供受众问题、论点和Jeffrey个人依据');
  const itemSignalIds = Array.isArray(item?.signal_ids) ? item.signal_ids : [];
  const origin = item?.candidate_origin || {};
  const originSignalIds = Array.isArray(origin.origin_signal_ids) ? origin.origin_signal_ids : [];
  const corroborating = Array.isArray(origin.corroborating_lanes) ? origin.corroborating_lanes : [];
  if (!validExperimentalEvidence && (!lanePriority.has(origin.primary_lane) || origin.priority_rank !== lanePriority.get(origin.primary_lane) || !originSignalIds.length || originSignalIds.some((id) => !itemSignalIds.includes(id) || signalLane.get(id) !== origin.primary_lane) || new Set(corroborating).size !== corroborating.length || corroborating.some((lane) => !lanePriority.has(lane) || lane === origin.primary_lane || !itemSignalIds.some((id) => signalLane.get(id) === lane)))) block('每个候选必须登记可追溯的来源优先级：对标账号=1、自频道=2、全面热点=3、个人表达=4；交叉印证不能伪造');
  const tension = item?.tension || {};
  if (!tensionTypes.has(tension.type) || !nonEmpty(tension.common_assumption) || !nonEmpty(tension.jeffrey_position) || !nonEmpty(tension.conflict_statement)) block('每个候选必须提炼可由正文兑现的冲突性判断，而不是只给领域或事件名称');
  // 五步法第2步：假阳性过滤
  const fp = item?.false_positive_filter;
  const fpChecks = fp?.checks || {};
  if (!fp || !['PASSED', 'REJECTED'].includes(fp.status) || !falsePositiveTypes.every((type) => typeof fpChecks[type] === 'boolean') || !nonEmpty(fp.rationale)) block('每个候选必须完成假阳性过滤：名人/大事件、争议、定位无关、纯新闻四项逐项布尔判定加理由');
  if (fp?.status === 'PASSED' && falsePositiveTypes.some((type) => fpChecks[type] === true)) block('假阳性过滤PASSED但四项检查存在true，属于矛盾记录');
  // 五步法第3步：单期/系列判定
  if (!['SERIES_CANDIDATE', 'ONE_OFF'].includes(item?.topic_kind)) block('每个候选必须登记topic_kind：SERIES_CANDIDATE或ONE_OFF');
  if (item?.topic_kind === 'SERIES_CANDIDATE') {
    const corroboration = item?.topic_corroboration || {};
    const corroborationIds = Array.isArray(corroboration.signal_ids) ? corroboration.signal_ids : [];
    const signalMap = new Map(sources.flatMap((source) => (source.results || []).map((r) => [r.id, r])));
    const refs = corroborationIds.map((id) => signalMap.get(id));
    const creators = new Set(refs.map((r) => r?.creator_sec_uid).filter(Boolean));
    const topicBySignal = corroboration.topic_by_signal;
    const collectedAt = Date.parse(signals.collected_at);
    const recentAnomaly = (r) => r?.anomaly_status === 'ANOMALY' && Number.isFinite(r.performance_ratio) && r.performance_ratio >= 3
      && Number.isFinite(Date.parse(r.published_at)) && Date.parse(r.published_at) <= collectedAt
      && collectedAt - Date.parse(r.published_at) <= 30 * 86400000
      && Number.isFinite(Date.parse(r.metrics_observed_at)) && Date.parse(r.metrics_observed_at) <= collectedAt + 300000
      && collectedAt - Date.parse(r.metrics_observed_at) <= 21 * 86400000;
    if (!uniqueNonEmpty(corroborationIds) || creators.size < 2 || refs.some((r) => !recentAnomaly(r))
      || !nonEmpty(corroboration.mother_topic) || !nonEmpty(corroboration.independence_note) || !nonEmpty(corroboration.content_review_note)
      || !Array.isArray(topicBySignal) || topicBySignal.length !== corroborationIds.length
      || corroborationIds.some((id) => !topicBySignal.some((x) => x?.signal_id === id && x.mother_topic === corroboration.mother_topic && nonEmpty(x.viewer_task)))) block('SERIES_CANDIDATE必须绑定不同账号的近期同母题异常、观测时间与内容核读；只表示试水线索');
  }
  // 五步法第5步：包装与收藏价值
  const pa = item?.packaging_assessment || {};
  if (!nonEmpty(pa.title_direction) || !nonEmpty(pa.cover_concept) || !nonEmpty(pa.rationale) || ![true, false].includes(pa.worth_collecting) || ![true, false].includes(pa.evergreen_half_year) || ![true, false].includes(pa.title_clickable)) block('每个候选必须完成包装前置评估：标题方向、封面概念、收藏三问（值得收藏/半年后有用/标题想点）与理由');
  if (readyForWriting(item) && (fp.status !== 'PASSED' || pa.title_clickable !== true || (pa.worth_collecting !== true && !['DECISION_SUPPORT', 'SHARE_FOR_RECOGNITION', 'TIMELY_ACTION'].includes(pa.value_basis)))) block('可写候选必须通过假阳性过滤并有兑现标题的观众价值');
}
// Audience opportunity and material readiness are separate editorial decisions.
// This binds the comparison and real observations; it cannot predict popularity.
const selectionInputsHash = handoffHash({signals, evidence, douyin, candidates: items.map(({disposition, material_review, selection_review, ...candidate}) => candidate)});
const signalRecords = new Map(sources.flatMap((source) => source.results.map((record) => [record.id, {record, sourceId: source.source_id}])));
const searchRecords = new Map(douyin.queries.flatMap((query) => query.results.map((record) => [record.id, record])));
const stringList = (xs) => Array.isArray(xs) && xs.every(nonEmpty) && new Set(xs).size === xs.length;
const audienceResponse = (record, sourceId) => {
  const platformFields = {bilibili: ['play', 'danmaku'], zhihu: ['answers'], hupu: ['lights', 'replies']};
  const fields = ['digg_count', 'play_count', 'likes', 'plays', 'comments', 'comment_count', 'shares', 'share_count', 'collect_count', 'favorites', 'view_count', 'views', ...(platformFields[sourceId] || [])];
  return fields.some((key) => {
    const value = record[key] ?? record.raw?.[key];
    return record.field_availability?.[key] !== false && typeof value === 'number' && Number.isFinite(value) && value > 0;
  }) || (sourceId === 'hackernews' && Number.isFinite(record.raw?.score) && record.raw.score > 0);
};
for (const item of items.filter(readyForWriting)) {
  const opportunity = item.opportunity_case;
  if (opportunity?.schema_version !== 1 || !nonEmpty(opportunity.presentation_form)) block('selection: 缺选题机会论证opportunity_case或实际表达形式；旧研究须重新选题，不追填历史');
  const demand = opportunity.demand;
  if (!demand || !['EVIDENCED', 'HYPOTHESIS', 'CONTRADICTED'].includes(demand.status) || !Array.isArray(demand.support)
    || !['cross_check', 'time_window', 'limitations'].every((key) => nonEmpty(demand[key]))) block('selection: 需求须登记真实支持、交叉判断、时间边界与限制');
  let directAudienceSupport = false;
  for (const support of demand.support) {
    const signal = signalRecords.get(support?.signal_id);
    const record = support?.signal_id ? signal?.record : searchRecords.get(support?.douyin_result_id);
    if (!record || Boolean(support.signal_id) === Boolean(support.douyin_result_id)
      || (support.signal_id && (!item.signal_ids.includes(support.signal_id) || signal.sourceId === 'personal-expression-pool'))
      || !['SAME_VIEWER_PROBLEM', 'ADJACENT_ONLY'].includes(support.relation)
      || !['AUDIENCE_RESPONSE', 'COMMENT_QUESTION', 'CONTEXT_ONLY'].includes(support.basis)
      || !['observation', 'audience_link', 'time_note'].every((key) => nonEmpty(support[key]))) block('selection: 需求支持须引用本题真实信号/搜索结果并说明受众关联与时间');
    if (support.basis === 'AUDIENCE_RESPONSE' && !audienceResponse(record, signal?.sourceId)) block('selection: 观众响应须有原始非零互动，官方更新或结果条数不能冒充需求');
    const comments = record.top_comments || record.raw?.top_comments;
    if (support.basis === 'COMMENT_QUESTION' && (!nonEmpty(support.quote) || !Array.isArray(comments) || !comments.some((comment) => (typeof comment === 'string' ? comment : comment?.text || comment?.content) === support.quote))) block('selection: 评论需求须引用原始评论原句');
    if (support.relation === 'SAME_VIEWER_PROBLEM' && support.basis !== 'CONTEXT_ONLY') directAudienceSupport = true;
  }
  if (demand.status === 'EVIDENCED' && !directAudienceSupport) block('selection: 相邻产品/官方消息不能单独证明本题观众需求');
  const explicitExperiment = discoveryMode === 'USER_DIRECTION_RESEARCH' && validatedDirectionResearch?.status === 'EXPERIMENTAL_ONE_OFF';
  if (demand.status !== 'EVIDENCED' && !(explicitExperiment && demand.status === 'HYPOTHESIS')) block('selection: 当前需求未证，不以可制作或模型投票替代；补研究或换题', 'TOPIC_RESCAN_REQUIRED');
  if (!['click', 'stay', 'share_save_discuss', 'difference', 'main_risk'].every((key) => nonEmpty(opportunity.spread?.[key]))) block('selection: 缺点击、看下去、分享收藏讨论、差异与传播风险论证');
  const handoff = item.creation_handoff;
  if (!uniqueNonEmpty(opportunity.content_source_ids) || opportunity.content_source_ids.some((id) => !handoff.sources.some((source) => source.id === id && source.roles.some((role) => ['SYNTHESIS_INPUT', 'ADAPTATION_BASE', 'FIRSTHAND_RECORD'].includes(role))))) block('selection: 内容提炼须引用实际综合/改编/亲历来源，查证资料不自动等于创作主稿');
  const visual = opportunity.visual_plan;
  const materials = handoff.production.materials;
  if (!visual || !['MOTION', 'NATIVE_REMOTION', 'OTHER'].includes(visual.route)
    || !['viewer_needs_to_see', 'expression_and_limits', 'supplementary_reason'].every((key) => nonEmpty(visual[key]))
    || !stringList(visual.material_ids) || visual.material_ids.some((id) => !materials.some((material) => material.id === id && material.status !== 'UNRESOLVED'))
    || !stringList(visual.reference_source_ids) || visual.reference_source_ids.some((id) => !handoff.sources.some((source) => source.id === id && source.roles.includes('VISUAL_REFERENCE')))
    || (visual.route === 'MOTION' && !visual.reference_source_ids.length) || !Array.isArray(visual.supplementary_collection)) block('selection: 画面策略须绑定真实材料/表达边界；Motion须引用已核模板契约、演示或实例');
  for (const supplement of visual.supplementary_collection) {
    const material = materials.find((entry) => entry.id === supplement?.material_id);
    if (!['LOCAL_CAPTURE', 'WEB_SEARCH', 'EXISTING_ASSET'].includes(supplement?.method) || !nonEmpty(supplement.target) || !nonEmpty(supplement.purpose)
      || typeof supplement.required !== 'boolean' || (supplement.material_id && !material)
      || (supplement.required && (!material?.required || material.status === 'UNRESOLVED'))) block('selection: 关键补采须先落真实required材料；非关键素材可记录搜索/录屏目标后交⑩');
  }
  const comparison = opportunity.comparison;
  if (!uniqueNonEmpty(comparison?.against_candidate_ids) || comparison.against_candidate_ids.some((id) => id === item.id || !items.some((candidate) => candidate.id === id))
    || !nonEmpty(comparison.why_preferred) || !nonEmpty(comparison.tradeoffs)) block('selection: 须比较本轮真实其它候选并保留取舍，不按资料齐全或总分直接选题');
  const review = item.selection_review;
  if (review?.status !== 'ACCEPTED' || !nonEmpty(review.reviewer?.actor) || !nonEmpty(review.reviewer.context_id)
    || review.reviewer.context_id === handoff.prepared_by.context_id || !validTime(review.reviewed_at) || !nonEmpty(review.rationale)) block('selection: 缺独立选题复核；材料成立不自动证明值得选');
  if (review.inputs_sha256 !== selectionInputsHash) block('selection: 选题复核未绑定当前比较、来源与观测；回①重审');
  const reportPath = review.report_path;
  if (!nonEmpty(reportPath) || isAbsolute(reportPath) || reportPath.split(/[\\/]/).includes('..')) block('selection: 选题复核报告路径必须相对项目根');
  const report = resolve(projectRoot, reportPath);
  if (!existsSync(report) || !realpathSync(report).startsWith(projectRoot + '/') || !statSync(report).isFile() || !statSync(report).size
    || review.report_sha256 !== shaFile(report) || !readFileSync(report, 'utf8').includes(selectionInputsHash)) block('selection: 选题复核报告缺失、越界、SHA失配或未核本轮比较');
}
const autoSelected = items.filter((item) => item.disposition === 'AUTO_SELECTED');
if (autoSelected.length > 1) block('最多只能有一个AUTO_SELECTED候选');
if (autoSelected.length === 1) {
  const selected = autoSelected[0];
  if (items.some((item) => item !== selected && !['REJECTED', 'SHORTLISTED'].includes(item.disposition))) block('AUTO_SELECTED之外的候选只能是REJECTED或SHORTLISTED');
  if (selected.false_positive_filter?.status !== 'PASSED') block('AUTO_SELECTED候选必须通过假阳性过滤');
  const pa = selected.packaging_assessment || {};
  if (pa.title_clickable !== true || (pa.worth_collecting !== true && !['DECISION_SUPPORT', 'SHARE_FOR_RECOGNITION', 'TIMELY_ACTION'].includes(pa.value_basis))) block('AUTO_SELECTED候选必须有兑现标题的观众价值；观点/时效题可登记决策、共鸣分享或即时行动依据');
  if (!existsSync(target('00-选题.json')) || !existsSync(target('00-选题.md')) || statSync(target('00-选题.md')).size === 0) block('AI自主定题后必须生成最终选题JSON与Markdown');
  const topic = readJson('00-选题.json');
  if (topic.schema_version !== 4 || topic.selected_candidate_id !== selected.id || !nonEmpty(topic.audience) || !nonEmpty(topic.thesis) || !nonEmpty(topic.auto_selection_rationale)) block('最终选题必须是schema 4并绑定AUTO_SELECTED候选与自主定题理由');
  if (!Array.isArray(topic.evidence) || !uniqueNonEmpty(topic.evidence.map((x) => x?.id)) || !topic.evidence.every((x) => validEvidence(x) && selected.evidence_ids.includes(x.id) && JSON.stringify(x) === JSON.stringify(evidenceById.get(x.id))) || !topic.evidence.some((x) => x.source_type === 'PRIMARY')) block('最终选题必须绑定所选候选的同字节PRIMARY来源');
  if (!Array.isArray(topic.claim_evidence_map) || [...topic.claim_evidence_map.flatMap((claim) => claim.evidence_ids || []), ...(selected.platform_alignment?.evidence_ids || []), ...(selected.content_gap?.evidence_ids || [])].some((id) => !topic.evidence.some((ev) => ev.id === id))) block('最终选题来源必须覆盖全部主张映射与平台/内容缺口引用');
  for (const key of ['audience', 'thesis', 'content_form', 'audience_level', 'audience_promise', 'creator_fit', 'assumed_prerequisites', 'jargon_to_explain', 'platform_query_intent', 'platform_alignment', 'content_gap', 'claim_evidence_map', 'creation_handoff', 'material_review', 'tutorial_proof', 'opportunity_case', 'selection_review']) if (JSON.stringify(topic[key]) !== JSON.stringify(selected[key])) block('最终选题与所选候选字段漂移: ' + key);
  const experiment = topic.experiment;
  const allowedKeys = new Set(['plays', 'likes', 'comments', 'shares', 'favorites', 'ctr5s', 'avg_duration_sec', 'digg_count', 'comment_count', 'share_count']);
  if (!nonEmpty(experiment?.hypothesis_id) || !nonEmpty(experiment.intervention) || !nonEmpty(experiment.expected_metric)
    || !uniqueNonEmpty(experiment.metric_keys) || experiment.metric_keys.some((x) => !allowedKeys.has(x))
    || !/^T\+[1-9]\d*$/.test(experiment.observation_window || '') || experiment.observation_window_unit !== 'DAY'
    || !Array.isArray(experiment.metric_targets) || experiment.metric_targets.length !== experiment.metric_keys.length
    || !uniqueNonEmpty(experiment.metric_targets.map((x) => x?.key)) || experiment.metric_targets.some((x) => !experiment.metric_keys.includes(x.key) || !['INCREASE', 'DECREASE', 'MAINTAIN'].includes(x.direction) || !nonEmpty(x.baseline_ref) || x.measurement_source !== 'douyin_creator_center')) block('schema 4实验必须预注册合法指标、方向、基线与正整数T+N/DAY窗口');

} else if (existsSync(target('00-选题.json')) || existsSync(target('00-选题.md'))) {
  block('存在最终选题但没有AUTO_SELECTED候选，定题链路不完整');
} else if (items.some((item) => !['REJECTED', 'SHORTLISTED'].includes(item.disposition))) {
  block('未定题时候选只能是REJECTED或SHORTLISTED');
}
if (validatedDirectionResearch?.status !== 'EXPERIMENTAL_ONE_OFF' && items.some((item, index) => index > 0 && item.candidate_origin.priority_rank < items[index - 1].candidate_origin.priority_rank)) block('候选展示顺序必须遵循来源优先级：对标账号在前、自频道其次、全面热点再次、个人表达最后');

if (workspaceMode) {
  if (!items.some((item) => item.disposition === 'SHORTLISTED')) block('没有可进入创作的短名单', 'TOPIC_RESCAN_REQUIRED');
  console.log(`PASS redian topic contract schema=4 phase=RESEARCH_READY mode=${discoveryMode}`);
  process.exit(0);
}
if (!autoSelected.length) block('短名单审查不是正式①完成；必须有唯一AUTO_SELECTED及最终选题', 'AWAITING_TOPIC_SELECTION');

if (discoveryMode === 'USER_DIRECTION_RESEARCH') validateDirectionPackets();

console.log(`PASS redian topic contract schema=4 selected=${autoSelected.length ? autoSelected[0].id : 'none'} mode=${discoveryMode}`);
