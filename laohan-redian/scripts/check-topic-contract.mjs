#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, realpathSync, statSync} from 'node:fs';
import {basename, dirname, join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const args = process.argv.slice(2);
const episodeIndex = args.indexOf('--episode');
if (episodeIndex === -1 || !args[episodeIndex + 1]) {
  console.error('用法: check-topic-contract.mjs --episode episodes/<slug>');
  process.exit(2);
}
const episode = resolve(args[episodeIndex + 1]);
if (!existsSync(episode) || !statSync(episode).isDirectory() || basename(dirname(episode)) !== 'episodes') {
  console.error('BLOCKED topic contract: episode必须位于episodes/<slug>');
  process.exit(1);
}
const root = realpathSync(episode);
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
if (signals.schema_version !== 2 || signals.episode !== basename(episode)) block('signals必须是当前episode的schema 2');
const discoveryMode = signals.discovery_mode || 'AUTONOMOUS_SCAN';
if (!['AUTONOMOUS_SCAN', 'USER_DIRECTION_RESEARCH'].includes(discoveryMode)) block('discovery_mode非法');
let validatedDirectionResearch = null;
if (discoveryMode === 'USER_DIRECTION_RESEARCH') {
  const direction = signals.direction_research || {};
  if (!nonEmpty(direction.series_id) || !['DEMAND_VALIDATED', 'EXPERIMENTAL_ONE_OFF'].includes(direction.status) || !nonEmpty(direction.series_research_path) || !/^[a-f0-9]{64}$/.test(direction.series_research_sha256 || '')) block('USER_DIRECTION_RESEARCH必须绑定已验证的系列研究包');
  const projectRoot = realpathSync(dirname(dirname(root)));
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
  const accounts = tracked?.coverage?.accounts;
  if (!tracked || tracked.status === 'FAILED' || tracked.coverage?.expected !== 9 || tracked.coverage?.attempted !== 9 || tracked.coverage?.completed !== 9 || tracked.coverage?.failed !== 0 || !Array.isArray(accounts) || accounts.length !== 9 || new Set(accounts.map((item) => item?.sec_uid)).size !== 9 || accounts.some((item) => !['OK', 'EMPTY'].includes(item?.status))) block('9个对标账号必须完整逐个扫描，正常空结果记EMPTY');
  if (!sources.some((item) => item?.source_id === 'personal-expression-pool' && ['OK', 'EMPTY'].includes(item?.status))) block('缺Jeffrey个人表达池读取记录');
  const supplemental = new Set(['tracked-douyin-creators', 'personal-expression-pool']);
  if (!sources.some((item) => !supplemental.has(item?.source_id) && item?.status === 'OK' && item?.result_count > 0)) block('至少一个全面热点源必须成功');
}

const candidatesPath = target('00-选题-candidates.json');
const candidates = readJson('00-选题-candidates.json');
const items = Array.isArray(candidates.candidates) ? candidates.candidates : [];
if (candidates.schema_version !== 3 || items.length < 2 || new Set(items.map((item) => item?.id)).size !== items.length) block('candidates必须是schema 3且至少两个唯一候选');
let calibratedContract = true;
if (existsSync(target('00-编排/executor-lock.json'))) {
  const executorLock = readJson('00-编排/executor-lock.json');
  const lockedVersion = executorLock.selected_executors?.find((item) => String(item?.node) === '1' && item?.id === 'laohan-redian')?.version;
  const match = String(lockedVersion || '').match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) block('executor lock 中 laohan-redian 版本无效');
  calibratedContract = Number(match[1]) > 3 || (Number(match[1]) === 3 && Number(match[2]) >= 1);
}
const signalIds = new Set(sources.flatMap((source) => Array.isArray(source.results) ? source.results.map((item) => item?.id) : []));
const publicSignalIds = new Set(sources.filter((source) => source?.source_id !== 'personal-expression-pool').flatMap((source) => Array.isArray(source.results) ? source.results.map((item) => item?.id) : []));
const laneForSource = (sourceId) => sourceId === 'tracked-douyin-creators' ? 'BENCHMARK_CREATOR' : sourceId === 'personal-expression-pool' ? 'PERSONAL_EXPRESSION' : 'BROAD_HOTSPOT';
const signalLane = new Map(sources.flatMap((source) => Array.isArray(source.results) ? source.results.map((item) => [item?.id, laneForSource(source.source_id)]) : []));
const lanePriority = new Map([['BENCHMARK_CREATOR', 1], ['BROAD_HOTSPOT', 2], ['PERSONAL_EXPRESSION', 3]]);
const tensionTypes = new Set(['CONFLICT', 'MISCONCEPTION', 'COUNTERINTUITIVE', 'TRADEOFF']);
for (const item of items) {
  const publicInterestIds = Array.isArray(item?.public_interest_evidence_ids) ? item.public_interest_evidence_ids : item?.signal_ids;
  const experimental = discoveryMode === 'USER_DIRECTION_RESEARCH' && validatedDirectionResearch?.status === 'EXPERIMENTAL_ONE_OFF';
  const experimentalEvidence = item?.experimental_basis;
  const expectedExperimental = validatedDirectionResearch?.experimental_basis;
  const validExperimentalEvidence = experimental && experimentalEvidence?.type === expectedExperimental?.type && uniqueNonEmpty(experimentalEvidence?.source_ids) && expectedExperimental.source_ids.every((id) => experimentalEvidence.source_ids.includes(id)) && nonEmpty(experimentalEvidence?.rationale);
  const validPublicEvidence = Array.isArray(publicInterestIds) && publicInterestIds.some((id) => publicSignalIds.has(id)) && publicInterestIds.every((id) => signalIds.has(id));
  if (!nonEmpty(item?.id) || !nonEmpty(item?.title) || !nonEmpty(item?.audience || item?.audience_problem) || !nonEmpty(item?.thesis) || (!validPublicEvidence && !validExperimentalEvidence) || !nonEmpty(item?.creator_fit?.why_jeffrey) || !nonEmpty(item?.creator_fit?.distinctive_judgment)) block('每个候选必须有公共兴趣信号，或为EXPERIMENTAL_ONE_OFF绑定已验证官方事件/Jeffrey亲历/小众任务依据，并提供受众问题、论点和Jeffrey个人依据');
  if (calibratedContract) {
    const itemSignalIds = Array.isArray(item?.signal_ids) ? item.signal_ids : [];
    const origin = item?.candidate_origin || {};
    const originSignalIds = Array.isArray(origin.origin_signal_ids) ? origin.origin_signal_ids : [];
    const corroborating = Array.isArray(origin.corroborating_lanes) ? origin.corroborating_lanes : [];
    if (!validExperimentalEvidence && (!lanePriority.has(origin.primary_lane) || origin.priority_rank !== lanePriority.get(origin.primary_lane) || !originSignalIds.length || originSignalIds.some((id) => !itemSignalIds.includes(id) || signalLane.get(id) !== origin.primary_lane) || new Set(corroborating).size !== corroborating.length || corroborating.some((lane) => !lanePriority.has(lane) || lane === origin.primary_lane || !itemSignalIds.some((id) => signalLane.get(id) === lane)))) block('每个候选必须登记可追溯的来源优先级：对标账号=1、全面热点=2、个人表达=3；交叉印证不能伪造');
    const tension = item?.tension || {};
    if (!tensionTypes.has(tension.type) || !nonEmpty(tension.common_assumption) || !nonEmpty(tension.jeffrey_position) || !nonEmpty(tension.conflict_statement)) block('每个候选必须提炼可由正文兑现的冲突性判断，而不是只给领域或事件名称');
  }
}
if (calibratedContract && validatedDirectionResearch?.status !== 'EXPERIMENTAL_ONE_OFF' && items.some((item, index) => index > 0 && item.candidate_origin.priority_rank < items[index - 1].candidate_origin.priority_rank)) block('候选展示顺序必须遵循来源优先级：对标账号在前、全面热点其次、个人表达最后；该排序不替Jeffrey定题');

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
const selected = items.filter((item) => item.disposition === 'SELECTED');
if (selected.length !== 1 || selected[0].id !== selection.selected_candidate_id || items.some((item) => !['SELECTED', 'REJECTED'].includes(item.disposition))) block('Jeffrey接受后必须且只能有一个匹配的SELECTED候选');
if (!existsSync(target('00-选题.json')) || !existsSync(target('00-选题.md')) || statSync(target('00-选题.md')).size === 0) block('Jeffrey筛选通过后必须生成最终选题JSON与Markdown');
const topic = readJson('00-选题.json');
if (topic.schema_version !== 3 || topic.selected_candidate_id !== selection.selected_candidate_id || !nonEmpty(topic.audience) || !nonEmpty(topic.thesis)) block('最终选题必须是schema 3并绑定Jeffrey选中的候选');
if (discoveryMode === 'USER_DIRECTION_RESEARCH') {
  const direction = topic.direction_research || {};
  if (direction.mode !== 'USER_DIRECTION_RESEARCH' || direction.series_id !== signals.direction_research.series_id || !nonEmpty(direction.episode_id) || !nonEmpty(direction.packet_path) || !/^[a-f0-9]{64}$/.test(direction.packet_sha256 || '')) block('最终选题必须绑定当前系列和单期资料包');
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

console.log(`PASS redian topic contract schema=3 selected=${selection.selected_candidate_id}`);
