#!/usr/bin/env node
import {existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync} from 'node:fs';
import {basename, dirname, join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const args = process.argv.slice(2);
const command = args.shift();
const option = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1];
};
const episode = option('--episode');
const requiredStage = option('--require');
const syncVendors = args.includes('--sync');
if (!episode || !['status', 'next', 'check', 'vendors'].includes(command)) {
  console.error('用法: bianpai.mjs <status|next|check|vendors> --episode episodes/<slug> [--require production|final|full|--sync]');
  process.exit(2);
}
if (requiredStage && !['final', 'production', 'full'].includes(requiredStage)) {
  console.error('--require 只支持 production、final 或 full');
  process.exit(2);
}

const episodeDir = resolve(episode);
const episodesDir = dirname(episodeDir);
if (basename(episodesDir) !== 'episodes') {
  console.error('episode 必须位于 <工作流根>/episodes/<slug>，例如 episodes/2026-07-10-fde');
  process.exit(2);
}
const root = dirname(episodesDir);
const episodeRealRoot = existsSync(episodeDir) ? realpathSync(episodeDir) : episodeDir;
if (existsSync(episodeDir) && (lstatSync(episodeDir).isSymbolicLink() || !episodeRealRoot.startsWith(realpathSync(root) + '/episodes/'))) {
  console.error('episode 不得是外部或 symlink 目录');
  process.exit(2);
}
const checker = join(root, 'scripts/check-episode-contract.sh');
const vendorSync = join(root, 'scripts/sync-content-vendors.sh');
const vendorPreflightVerifier = join(root, 'scripts/verify-vendor-preflight.mjs');
const runtimeChecker = join(root, 'scripts/check-workflow-runtime.mjs');
const runtimeLock = join(root, 'workflow-runtime-lock.json');
if (!existsSync(checker)) {
  console.error('未找到工作流契约检查器: ' + checker);
  process.exit(2);
}
if (!existsSync(runtimeChecker)) {
  console.error('未找到跨仓运行时检查器: ' + runtimeChecker);
  process.exit(2);
}
const file = (relative) => join(episodeDir, relative);
const exists = (relative) => existsSync(file(relative));
const readJson = (relative) => {
  const target = file(relative);
  if (!existsSync(target) || !realpathSync(target).startsWith(episodeRealRoot + '/')) throw new Error('JSON 不得引用 episode 外部路径: ' + relative);
  return JSON.parse(readFileSync(target, 'utf8'));
};
const scriptHash = () => exists('01-口播稿.md') ? createHash('sha256').update(readFileSync(file('01-口播稿.md'))).digest('hex') : null;
const immutablePrediction = (body) => {
  const beforeRetro = body.split(/^##\s*复盘\s*$/m)[0];
  const marker = beforeRetro.match(/^##\s*预测(?:\s|$).*$/m);
  return marker ? beforeRetro.slice(marker.index) : beforeRetro;
};
const nonEmptyFile = (relative) => {
  const target = file(relative);
  return exists(relative) && statSync(target).isFile() && statSync(target).size > 0 && realpathSync(target).startsWith(episodeRealRoot + '/');
};
const shaPath = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const supersessionPath = file('00-编排/supersession-record.json');
if (existsSync(supersessionPath)) {
  const verifier = join(root, 'scripts/verify-episode-supersession.mjs');
  const result = existsSync(verifier) ? spawnSync('node', [verifier, episodeDir], {encoding: 'utf8'}) : {status: 1, stderr: '缺 supersession verifier'};
  if (result.status !== 0) {
    console.error('BLOCKED：supersession record 无效。\n' + (result.stderr || result.stdout || '').trim());
    process.exit(1);
  }
  console.error('SUPERSEDED：本期已在拍摄前作废，禁止继续、迁移或覆盖旧 executor lock；待方法冻结后从0创建新 episode。\n' + (result.stdout || '').trim());
  process.exit(1);
}
const vendorPreflightState = () => safely(() => {
  const relative = '00-编排/vendor-preflight.json';
  if (!nonEmptyFile(relative)) return {done: false, reason: '缺当前 vendor preflight；先运行 bianpai vendors'};
  if (!existsSync(vendorPreflightVerifier)) return {done: false, reason: '缺 vendor preflight verifier'};
  const result = spawnSync('node', [vendorPreflightVerifier, episodeDir], {encoding: 'utf8'});
  if (result.status !== 0) return {done: false, reason: (result.stderr || result.stdout || 'vendor preflight 核验失败').trim()};
  return {done: true, reason: (result.stdout || 'vendor preflight 已绑定当前 runtime lock 与 vendor HEAD').trim()};
}, 'vendor preflight 无法读取');
const conclusionState = (relative, label, statusField, countFields) => safely(() => {
  if (!nonEmptyFile(relative)) return {done: false, reason: '缺非空 ' + relative};
  const content = readFileSync(file(relative), 'utf8');
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
  const field = (name) => frontmatter?.[1].match(new RegExp('^' + name + ':\\s*(.+)\\s*$', 'm'))?.[1]?.trim();
  const reportHash = field('script_hash');
  const status = field(statusField);
  if (!reportHash || reportHash !== scriptHash()) return {done: false, reason: label + ' 必须匹配当前 01-口播稿.md 的 script_hash'};
  if (status !== 'CLEAR') return {done: false, reason: label + ' 的 ' + statusField + ' 必须为 CLEAR'};
  for (const countField of countFields) {
    const value = field(countField);
    if (!/^(0|[1-9]\d*)$/.test(value || '')) return {done: false, reason: label + ' 的 ' + countField + ' 必须是非负整数'};
    if (Number(value) !== 0) return {done: false, reason: label + ' 的 ' + countField + ' 必须为 0'};
  }
  return {done: true, reason: label + ' 已绑定当前稿且结论 CLEAR'};
}, label + ' 无法读取');
const complianceState = () => safely(() => {
  const base = conclusionState('02-违规报告.md', '02-违规报告.md', 'risk_status', ['unresolved_high_risk_count']);
  if (!base.done) return base;
  const config = readJson('episode-config.json');
  if (config.schema_version !== 2) return base;
  const content = readFileSync(file('02-违规报告.md'), 'utf8');
  const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);
  const field = (name) => frontmatter?.[1].match(new RegExp('^' + name + ':\\s*(.+)\\s*$', 'm'))?.[1]?.trim();
  const reviewed = Date.parse(field('ruleset_reviewed_at'));
  const expires = Date.parse(field('ruleset_expires_at'));
  const completed = Date.parse(field('scan_completed_at'));
  if (!field('ruleset_version') || Number.isNaN(reviewed) || Number.isNaN(expires) || Number.isNaN(completed) || completed < reviewed || completed > expires || field('platform_guarantee') !== 'false') return {done: false, reason: 'schema 2 违规报告必须绑定有效 ruleset_version/reviewed/expires/scan 时间并声明 platform_guarantee: false'};
  return {done: true, reason: '违规报告已绑定当前稿和有效规则集；CLEAR 不代表平台保证'};
}, '02-违规报告.md 无法读取');
const imageDimensions = (path) => {
  const bytes = readFileSync(path);
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) {
    return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
  }
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset < bytes.length) {
      if (bytes[offset] !== 0xff) { offset += 1; continue; }
      const marker = bytes[offset + 1];
      const length = bytes.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return {height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7)};
      }
      offset += 2 + length;
    }
  }
  throw new Error('selected_asset 必须是可读取尺寸的 PNG 或 JPEG');
};
const gate = (stage) => spawnSync('bash', [checker, episodeDir, stage], {encoding: 'utf8'});
const gateState = (stage, missingReason) => {
  const result = gate(stage);
  return result.status === 0
    ? {done: true, reason: (result.stdout || '').trim()}
    : {done: false, reason: (result.stderr || result.stdout || missingReason).trim()};
};
const safely = (fn, fallback) => {
  try {
    return fn();
  } catch (error) {
    return {done: false, reason: fallback + ': ' + error.message};
  }
};
const coverState = () => safely(() => {
  if (!exists('05-封面/selected-cover.json')) return {done: false, reason: '缺 05-封面/selected-cover.json'};
  const cover = readJson('05-封面/selected-cover.json');
  const review = readJson('05-封面/cover-review.json');
  const config = readJson('episode-config.json');
  const assetRoot = realpathSync(file('05-封面')) + '/';
  const assetPath = resolve(episodeDir, cover.selected_asset || '');
  const scriptTitle = readFileSync(file('01-口播稿.md'), 'utf8').match(/^#\s+(.+)$/m)?.[1]?.trim();
  const assetStat = existsSync(assetPath) ? statSync(assetPath) : null;
  const actualAsset = assetStat?.isFile() ? realpathSync(assetPath) : '';
  const dimensions = actualAsset ? imageDimensions(actualAsset) : null;
  const expectedSelectionMode = config.workflow_mode === 'AUTONOMOUS_RUN' ? 'AGENT_PROXY' : 'JEFFREY';
  const autonomousReviewerInvalid = config.workflow_mode === 'AUTONOMOUS_RUN' && typeof review.reviewer === 'string' && review.reviewer.toLowerCase().includes('jeffrey');
  if (!cover.selected_asset || !cover.title || !cover.canvas?.width || !cover.canvas?.height || cover.script_hash !== scriptHash()
    || !actualAsset.startsWith(assetRoot) || !dimensions || !Array.isArray(cover.large_text) || !cover.large_text.some((text) => typeof text === 'string' && text.trim())
    || cover.canvas.width !== config.canvas?.width || cover.canvas.height !== config.canvas?.height
    || dimensions.width !== config.canvas?.width || dimensions.height !== config.canvas?.height || cover.title !== scriptTitle
    || review.script_hash !== scriptHash() || review.selected_asset !== cover.selected_asset || review.thumbnail_readability !== 'PASS' || !Array.isArray(review.candidates) || review.candidates.length < 2 || typeof review.expected_metric !== 'string' || !review.expected_metric.trim() || typeof review.reviewer !== 'string' || !review.reviewer.trim() || Number.isNaN(Date.parse(review.reviewed_at))
    || (config.schema_version === 2 && (Number.isNaN(Date.parse(config.distribution_contract?.locked_at)) || typeof cover.source_prompt !== 'string' || !cover.source_prompt.trim() || typeof cover.image_provider !== 'string' || !cover.image_provider.trim() || cover.selection_mode !== expectedSelectionMode || cover.prompt_executor !== 'cover-prompt-strategy' || review.prompt_executor !== cover.prompt_executor || review.image_provider !== cover.image_provider || review.selection_mode !== cover.selection_mode || autonomousReviewerInvalid))) {
    return {done: false, reason: 'selected-cover 必须引用本期 05-封面内的真实 PNG/JPEG，真实像素、标题、large_text、画布和 script_hash 必须匹配当前稿/config；AUTONOMOUS_RUN 只接受非 Jeffrey 的 AGENT_PROXY，REVIEW_GATED 只接受 JEFFREY'};
  }
  return {done: true, reason: '封面选择已登记'};
}, 'selected-cover.json 无法读取');
const calibrationState = () => safely(() => {
  if (!exists('03-校准报告.md')) return {done: false, reason: '缺 03-校准报告.md'};
  const report = readFileSync(file('03-校准报告.md'), 'utf8');
  const frontmatter = report.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) return {done: false, reason: '03-校准报告.md 缺可验证 frontmatter'};
  const field = (name) => frontmatter[1].match(new RegExp('^' + name + ':\\s*(.+)\\s*$', 'm'))?.[1]?.trim();
  const engine = field('calibration_engine');
  const contentForm = field('content_form');
  const calibrationRootRef = field('calibration_root');
  const scoreStatus = field('score_status');
  const scoreEvidence = field('score_evidence');
  const predictionStatus = field('prediction_status');
  const prediction = field('prediction_file');
  const predictionScriptHash = field('prediction_script_hash');
  const predictionRevision = field('prediction_revision');
  const reportScriptHash = field('script_hash');
  if (engine !== 'cheat-on-content') return {done: false, reason: '校准必须由 cheat-on-content 记录，不能使用旧 laohan-cheat 公式'};
  if (!['opinion-video', 'tutorial-video'].includes(contentForm)) return {done: false, reason: 'content_form 必须为 opinion-video 或 tutorial-video'};
  if (!calibrationRootRef || !reportScriptHash || reportScriptHash !== scriptHash()) return {done: false, reason: '校准报告必须匹配当前 01-口播稿.md 的 script_hash'};
  if (scoreStatus !== 'COMPLETE') return {done: false, reason: 'score_status 必须为 COMPLETE'};
  if (!['PENDING', 'RECORDED'].includes(predictionStatus)) return {done: false, reason: 'prediction_status 必须为 PENDING 或 RECORDED'};
  const calibrationRoot = resolve(dirname(file('03-校准报告.md')), calibrationRootRef);
  const expectedRoot = resolve(root, 'calibration', contentForm);
  const projectRealRoot = realpathSync(root);
  if (calibrationRoot !== expectedRoot || !existsSync(expectedRoot) || realpathSync(calibrationRoot) !== realpathSync(expectedRoot) || !realpathSync(calibrationRoot).startsWith(projectRealRoot + '/')) return {done: false, reason: 'calibration_root 必须指向项目内真实 ' + contentForm + ' lane'};
  if (!existsSync(join(calibrationRoot, '.cheat-state.json'))) return {done: false, reason: '校准目录缺 .cheat-state.json: ' + calibrationRoot};
  const scoreEvidencePath = resolve(calibrationRoot, scoreEvidence || '');
  if (!scoreEvidence || scoreEvidence.includes('..') || !existsSync(scoreEvidencePath) || !realpathSync(scoreEvidencePath).startsWith(realpathSync(calibrationRoot) + '/')) return {done: false, reason: '校准报告必须引用 lane 内 score_evidence'};
  const scoreProof = JSON.parse(readFileSync(scoreEvidencePath, 'utf8'));
  const scoreOutputPath = resolve(calibrationRoot, scoreProof.score_output || '');
  const scoreStateSnapshot = resolve(calibrationRoot, scoreProof.lane_state_snapshot || '');
  if (scoreProof.episode !== basename(episodeDir) || scoreProof.command !== 'cheat-score' || scoreProof.script_hash !== scriptHash() || !scoreProof.lane_state_snapshot || scoreProof.lane_state_snapshot.includes('..') || !existsSync(scoreStateSnapshot) || !realpathSync(scoreStateSnapshot).startsWith(realpathSync(calibrationRoot) + '/') || createHash('sha256').update(readFileSync(scoreStateSnapshot)).digest('hex') !== scoreProof.lane_state_snapshot_sha256 || !scoreProof.score_output || scoreProof.score_output.includes('..') || !existsSync(scoreOutputPath) || !realpathSync(scoreOutputPath).startsWith(realpathSync(calibrationRoot) + '/') || createHash('sha256').update(readFileSync(scoreOutputPath)).digest('hex') !== scoreProof.score_output_sha256) return {done: false, reason: 'score_evidence 未绑定本期当前稿和 score 时点的 lane 状态快照'};
  const state = JSON.parse(readFileSync(join(calibrationRoot, '.cheat-state.json'), 'utf8'));
  if (state.content_form !== contentForm) return {done: false, reason: 'lane 的 content_form 与报告不一致'};
  if (predictionStatus === 'RECORDED') {
    if (!prediction || prediction === 'null' || prediction.includes('..') || !existsSync(join(calibrationRoot, prediction))) return {done: false, reason: '盲预测已标 RECORDED 但 prediction_file 不存在'};
    if (!exists('03-预测证据.json')) return {done: false, reason: '缺 03-预测证据.json'};
    const proof = readJson('03-预测证据.json');
    const predictionPath = join(calibrationRoot, prediction);
    const laneScriptPath = join(calibrationRoot, proof.lane_script_path || '');
    const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
    const predictionSectionHash = createHash('sha256').update(immutablePrediction(readFileSync(predictionPath, 'utf8'))).digest('hex');
    if (proof.script_hash !== scriptHash() || proof.prediction_file !== prediction || proof.prediction_section_sha256 !== predictionSectionHash
      || proof.prediction_revision !== predictionRevision || predictionScriptHash !== scriptHash() || !proof.prediction_revision || !existsSync(laneScriptPath) || !realpathSync(predictionPath).startsWith(realpathSync(calibrationRoot) + '/') || !realpathSync(laneScriptPath).startsWith(realpathSync(calibrationRoot) + '/') || sha(laneScriptPath) !== scriptHash()) {
      return {done: false, reason: '预测证据未绑定当前稿、预测文件或 lane 稿件快照'};
    }
    return {done: true, scoreDone: true, predictionStatus, phase: 'COMPLETE', reason: contentForm + ' score 与盲预测已落盘'};
  }
  return {done: false, scoreDone: true, predictionStatus, phase: 'PARTIAL', reason: contentForm + ' score 已落盘（PARTIAL），等待⑤后写盲预测'};
}, '03-校准报告.md 无法读取');
const deepScanState = () => safely(() => {
  const review = conclusionState('04-深扫报告.md', '04-深扫报告.md', 'review_status', ['unresolved_issue_count']);
  if (!review.done) return review;
  const facts = conclusionState('04-事实核验.md', '04-事实核验.md', 'fact_check_status', ['contradicted_count', 'unverifiable_count']);
  if (!facts.done) return facts;
  return {done: true, reason: '深扫与事实核验均匹配当前稿且结论 CLEAR'};
}, '⑤报告无法读取');
const materialState = () => {
  if (!exists('09-导演/source-manifest.json')) return {done: false, reason: '缺 09-导演/source-manifest.json'};
  return gateState('materials', '素材契约未通过');
};
const topicState = () => safely(() => {
  if (!nonEmptyFile('00-选题.md') || !exists('00-选题.json')) return {done: false, reason: '①必须同时有非空 00-选题.md 与 00-选题.json'};
  const topic = readJson('00-选题.json');
  const experiment = topic.experiment;
  const allowedMetricKeys = new Set(['plays', 'likes', 'comments', 'shares', 'favorites', 'ctr5s', 'avg_duration_sec']);
  if (topic.schema_version !== 1 || typeof topic.audience !== 'string' || !topic.audience.trim() || typeof topic.thesis !== 'string' || !topic.thesis.trim() || !Array.isArray(topic.evidence) || topic.evidence.length === 0 || !topic.evidence.every((item) => item && typeof item.id === 'string' && item.id.trim() && typeof item.source === 'string' && item.source.trim()) || !experiment || typeof experiment.hypothesis_id !== 'string' || !experiment.hypothesis_id.trim() || typeof experiment.intervention !== 'string' || !experiment.intervention.trim() || typeof experiment.expected_metric !== 'string' || !experiment.expected_metric.trim() || !Array.isArray(experiment.metric_keys) || !experiment.metric_keys.length || new Set(experiment.metric_keys).size !== experiment.metric_keys.length || !experiment.metric_keys.every((key) => typeof key === 'string' && allowedMetricKeys.has(key)) || typeof experiment.observation_window !== 'string' || !/^T\+\d+$/.test(experiment.observation_window) || typeof topic.not_do_reason !== 'string' || !topic.not_do_reason.trim()) return {done: false, reason: '00-选题.json 必须声明受众、论点、证据、实验假设/干预/指标键/T+N 窗口与不做理由'};
  const config = readJson('episode-config.json');
  if (config.schema_version === 2) {
    const types = new Set(['PRIMARY', 'PLATFORM_SIGNAL', 'SECONDARY']);
    const requiredFiles = ['00-选题-signals.json', '00-选题-candidates.json', '00-选题-source-health.json', '00-抖音搜索证据.json', '00-抖音搜索证据.md'];
    if (!requiredFiles.every(nonEmptyFile)) return {done: false, reason: 'schema 2 选题必须有 signals/candidates/source-health/抖音 JSON+Markdown 全部本期产物'};
    const futureLimit = Date.now() + 5 * 60 * 1000;
    const validTime = (value) => !Number.isNaN(Date.parse(value)) && Date.parse(value) <= futureLimit;
    const uniqueNonEmpty = (items) => Array.isArray(items) && items.length > 0 && new Set(items).size === items.length && items.every((item) => typeof item === 'string' && item.trim());
    const validEvidence = (item) => item && typeof item.id === 'string' && item.id.trim() && typeof item.source === 'string' && item.source.trim() && types.has(item.source_type) && typeof item.url === 'string' && /^https?:\/\//.test(item.url) && validTime(item.retrieved_at);
    if (!uniqueNonEmpty(topic.evidence.map((item) => item?.id)) || !topic.evidence.every(validEvidence) || !topic.evidence.some((item) => item.source_type === 'PRIMARY') || !topic.evidence.some((item) => item.source_type === 'PLATFORM_SIGNAL')) return {done: false, reason: 'schema 2 最终 evidence 必须唯一、可访问、时间有效，且同时含 PRIMARY 与 PLATFORM_SIGNAL'};

    const signals = readJson('00-选题-signals.json');
    const signalSources = Array.isArray(signals.sources) ? signals.sources : [];
    const signalSourceIds = signalSources.map((item) => item?.source_id);
    const signalIds = signalSources.flatMap((item) => Array.isArray(item?.results) ? item.results.map((result) => result?.id) : []);
    const signalStatuses = new Set(['OK', 'EMPTY', 'FAILED']);
    if (signals.schema_version !== 1 || signals.episode !== basename(episodeDir) || !validTime(signals.collected_at) || !uniqueNonEmpty(signalSourceIds) || !signalSources.every((item) => typeof item.command_or_url === 'string' && item.command_or_url.trim() && validTime(item.attempted_at) && signalStatuses.has(item.status) && Number.isInteger(item.result_count) && item.result_count >= 0 && Array.isArray(item.results) && item.results.length === item.result_count && ((item.status === 'OK' && item.result_count > 0) || (item.status !== 'OK' && item.result_count === 0)) && (item.status !== 'FAILED' || (typeof item.error === 'string' && item.error.trim())) && item.record_sha256 === createHash('sha256').update(JSON.stringify(item.results)).digest('hex')) || !uniqueNonEmpty(signalIds)) return {done: false, reason: 'signals 必须绑定本期、route/结果 ID 唯一、状态条数一致且 record SHA 正确'};

    const candidates = readJson('00-选题-candidates.json');
    const candidateItems = Array.isArray(candidates.candidates) ? candidates.candidates : [];
    const candidateIds = candidateItems.map((item) => item?.id);
    const candidateEvidence = Array.isArray(candidates.evidence) ? candidates.evidence : [];
    const candidateEvidenceIds = candidateEvidence.map((item) => item?.id);
    const scoreKeys = ['audience_fit', 'evidence_strength', 'platform_relevance', 'differentiation', 'production_feasibility', 'learning_value'];
    const validScorecard = (scorecard) => scorecard && scoreKeys.every((key) => Number.isInteger(scorecard[key]) && scorecard[key] >= 1 && scorecard[key] <= 5) && typeof scorecard.rationale === 'string' && scorecard.rationale.trim();
    if (candidates.schema_version !== 1 || !validTime(candidates.collected_at) || candidateItems.length < 2 || !uniqueNonEmpty(candidateIds) || !uniqueNonEmpty(candidateEvidenceIds) || !candidateEvidence.every(validEvidence) || !candidateItems.every((item) => typeof item.title === 'string' && item.title.trim() && typeof item.audience_problem === 'string' && item.audience_problem.trim() && typeof item.thesis === 'string' && item.thesis.trim() && uniqueNonEmpty(item.signal_ids) && item.signal_ids.every((id) => signalIds.includes(id)) && uniqueNonEmpty(item.evidence_ids) && item.evidence_ids.every((id) => candidateEvidenceIds.includes(id)) && validScorecard(item.scorecard) && typeof item.rationale === 'string' && item.rationale.trim() && ['SELECTED', 'REJECTED'].includes(item.disposition)) || candidateItems.filter((item) => item.disposition === 'SELECTED').length !== 1) return {done: false, reason: 'candidates 必须至少两个、引用真实 signals/evidence、六维分数完整且只有一个 SELECTED'};
    const selected = candidateItems.find((item) => item.disposition === 'SELECTED');
    const rejectedIds = candidateItems.filter((item) => item.disposition === 'REJECTED').map((item) => item.id);
    if (topic.selected_candidate_id !== selected.id || !uniqueNonEmpty(topic.rejected_candidate_ids) || !topic.rejected_candidate_ids.every((id) => rejectedIds.includes(id)) || typeof topic.selection_rationale !== 'string' || !topic.selection_rationale.trim() || !topic.evidence.every((item) => selected.evidence_ids.includes(item.id))) return {done: false, reason: '最终选题必须绑定唯一 SELECTED、非空淘汰项、选择理由及其候选 evidence'};

    const douyin = readJson('00-抖音搜索证据.json');
    const queryStatuses = new Set(['OK', 'EMPTY_OR_FIELD_UNAVAILABLE', 'FAILED']);
    const queryItems = Array.isArray(douyin.queries) ? douyin.queries : [];
    const douyinResultIds = queryItems.flatMap((query) => Array.isArray(query?.results) ? query.results.map((item) => item?.id) : []);
    const validDouyinResult = (item) => item && typeof item.id === 'string' && item.id.trim() && Number.isInteger(item.rank) && item.rank > 0 && typeof item.desc === 'string' && item.desc.trim() && typeof item.author === 'string' && item.author.trim() && typeof item.url === 'string' && /^https?:\/\//.test(item.url);
    if (douyin.schema_version !== 1 || !validTime(douyin.collected_at) || !douyin.executor || douyin.executor.name !== 'opencli' || typeof douyin.executor.version !== 'string' || !douyin.executor.version.trim() || douyin.executor.doctor_status !== 'PASS' || douyin.executor.logged_in !== true || !queryItems.length || !queryItems.every((query) => typeof query.query === 'string' && query.query.trim() && typeof query.command === 'string' && query.command.includes('opencli douyin search') && validTime(query.attempted_at) && queryStatuses.has(query.status) && Number.isInteger(query.result_count) && query.result_count >= 0 && Array.isArray(query.results) && query.results.length === query.result_count && query.results.every(validDouyinResult) && ((query.status === 'OK' && query.result_count > 0) || (query.status !== 'OK' && query.result_count === 0)) && (query.status !== 'FAILED' || (typeof query.error === 'string' && query.error.trim()))) || queryItems.every((query) => query.status === 'FAILED') || (douyinResultIds.length > 0 && !uniqueNonEmpty(douyinResultIds))) return {done: false, reason: '抖音证据必须绑定真实 OpenCLI 登录、合法查询状态/结果；全部 FAILED 不放行'};

    const health = readJson('00-选题-source-health.json');
    const statuses = new Set(['OK', 'EMPTY', 'FAILED', 'SKIPPED']);
    const roles = new Set(['DISCOVERY', 'DOUYIN_SEARCH', 'PRIMARY_PROOF']);
    const healthSources = Array.isArray(health.sources) ? health.sources : [];
    const healthIds = healthSources.map((item) => item?.source_id);
    const validResultFile = (item) => {
      if (typeof item.result_file !== 'string' || !item.result_file.trim() || item.result_file.includes('..') || !nonEmptyFile(item.result_file)) return false;
      return /^[a-f0-9]{64}$/.test(item.result_sha256 || '') && item.result_sha256 === shaPath(file(item.result_file));
    };
    if (health.schema_version !== 1 || !validTime(health.collected_at) || !uniqueNonEmpty(healthIds) || !healthSources.every((item) => roles.has(item.source_role) && typeof item.command_or_url === 'string' && item.command_or_url.trim() && validTime(item.attempted_at) && statuses.has(item.status) && Number.isInteger(item.result_count) && item.result_count >= 0 && ((item.status === 'OK' && item.result_count > 0) || (item.status !== 'OK' && item.result_count === 0)) && (item.status !== 'FAILED' || (typeof item.error === 'string' && item.error.trim())) && (item.status !== 'SKIPPED' || (typeof item.reason === 'string' && item.reason.trim())) && validResultFile(item)) || !healthSources.some((item) => item.source_role === 'DISCOVERY' && item.status === 'OK') || !healthSources.some((item) => item.source_role === 'DOUYIN_SEARCH' && ['OK', 'EMPTY'].includes(item.status)) || !healthSources.some((item) => item.source_role === 'PRIMARY_PROOF' && item.status === 'OK')) return {done: false, reason: 'source health 必须三类角色齐全、状态/条数一致，并绑定本期真实结果文件 SHA'};
    if (!healthSources.filter((item) => item.source_role === 'DISCOVERY').every((item) => signalSourceIds.includes(item.source_id)) || !healthSources.some((item) => item.source_role === 'DOUYIN_SEARCH' && item.result_file === '00-抖音搜索证据.json') || !healthSources.some((item) => item.source_role === 'PRIMARY_PROOF' && topic.evidence.some((evidence) => evidence.source_type === 'PRIMARY' && evidence.url === item.command_or_url))) return {done: false, reason: 'source health 必须绑定 signals route、抖音 JSON 与最终 PRIMARY URL'};

    const targetKeys = Array.isArray(experiment.metric_targets) ? experiment.metric_targets.map((item) => item?.key) : [];
    const directions = new Set(['INCREASE', 'DECREASE', 'MAINTAIN']);
    if (Number(experiment.observation_window.slice(2)) <= 0 || experiment.observation_window_unit !== 'DAY' || !uniqueNonEmpty(targetKeys) || targetKeys.length !== experiment.metric_keys.length || !experiment.metric_keys.every((key) => targetKeys.includes(key)) || !experiment.metric_targets.every((item) => allowedMetricKeys.has(item.key) && directions.has(item.direction) && typeof item.baseline_ref === 'string' && item.baseline_ref.trim() && item.measurement_source === 'douyin_creator_center')) return {done: false, reason: 'schema 2 experiment 必须用正整数 T+N/DAY，并为每个 metric key 预注册方向、基线和抖音创作者中心来源'};
  }
  return {done: true, reason: '选题决策已绑定候选、PRIMARY/平台证据、抖音搜索与可测实验'};
}, '00-选题.json 无法读取');
const scriptState = () => safely(() => {
  if (!nonEmptyFile('01-口播稿.md') || !exists('02-创作工作稿/创作决策.json')) return {done: false, reason: '②必须同时有非空 01-口播稿.md 与 02-创作工作稿/创作决策.json'};
  const topic = readJson('00-选题.json');
  const decision = readJson('02-创作工作稿/创作决策.json');
  const nonEmptyStrings = (items) => Array.isArray(items) && items.length > 0 && items.every((item) => typeof item === 'string' && item.trim());
  if (decision.schema_version !== 1 || decision.topic_thesis !== topic.thesis || decision.hypothesis_id !== topic.experiment?.hypothesis_id || typeof decision.active_style_file !== 'string' || !decision.active_style_file.trim() || typeof decision.structure_tool !== 'string' || !decision.structure_tool.trim() || typeof decision.structure_rationale !== 'string' || !decision.structure_rationale.trim() || !nonEmptyStrings(decision.fact_boundary) || typeof decision.expected_audience_effect !== 'string' || !decision.expected_audience_effect.trim() || !nonEmptyStrings(decision.alternative_structures) || !nonEmptyStrings(decision.unproven_assumptions) || !Number.isFinite(decision.expected_duration_seconds) || decision.expected_duration_seconds <= 0) return {done: false, reason: '创作决策必须绑定①论点/假设，并声明风格、结构及理由、替代结构、事实边界、待验证假设、预期效果与时长'};
  return {done: true, reason: '创作决策已绑定选题合同'};
}, '创作决策无法读取');
const animationState = () => {
  if (!exists('11-动画/render-manifest.json')) return {done: false, reason: '缺 11-动画/render-manifest.json'};
  return gateState('accepted-final', '动画尚未接受为 final');
};
const shootingState = () => safely(() => {
  if (!nonEmptyFile('06-拍摄素材/raw.mp4') || !exists('06-拍摄素材/shooting-record.json')) return {done: false, reason: '缺 raw.mp4 或 shooting-record.json'};
  const record = readJson('06-拍摄素材/shooting-record.json');
  const raw = createHash('sha256').update(readFileSync(file('06-拍摄素材/raw.mp4'))).digest('hex');
  return record.script_sha256 === scriptHash() && record.raw_sha256 === raw
    ? {done: true, reason: '拍摄记录绑定当前稿与 raw'} : {done: false, reason: 'shooting-record 未绑定当前稿或 raw'};
}, 'shooting-record.json 无法读取');
const publishState = () => safely(() => {
  if (!exists('12-发布/publish-record.json')) return {done: false, reason: '缺 12-发布/publish-record.json'};
  const record = readJson('12-发布/publish-record.json');
  const config = readJson('episode-config.json');
  if (!config.platforms?.includes('douyin')) return {done: false, reason: '手动发布前 episode-config.platforms 必须明确含 douyin'};
  if (record.platform !== 'douyin' || record.status !== 'PUBLISHED' || !record.url || !record.aweme_id || !record.platform_title || !record.published_at || record.source !== 'user-confirmed' || !record.url.includes(String(record.aweme_id))) {
    return {done: false, reason: 'publish-record 必须为用户确认且 URL/aweme_id/platform_title 一致的已发布抖音记录'};
  }
  if (Number.isNaN(Date.parse(record.published_at)) || !gateState('accepted-final', 'final 未接受').done) {
    return {done: false, reason: 'publish-record 的发布时间必须有效，且当前 final 必须仍通过 accepted-final gate'};
  }
  if (record.final_path !== '07-剪辑/final.mp4' || !nonEmptyFile('07-剪辑/final.mp4')) {
    return {done: false, reason: 'publish-record 必须引用已存在的 07-剪辑/final.mp4'};
  }
  const finalHash = createHash('sha256').update(readFileSync(file('07-剪辑/final.mp4'))).digest('hex');
  const render = readJson('11-动画/render-manifest.json');
  const selected = render.candidates?.find((candidate) => candidate.path === render.selected_candidate);
  if (record.final_sha256 !== finalHash || !selected || selected.sha256 !== finalHash) {
    return {done: false, reason: 'publish-record 必须绑定当前 final 与选中 candidate 的 SHA-256'};
  }
  if (exists('12-发布/platform-display-evidence.json')) {
    const display = readJson('12-发布/platform-display-evidence.json');
    const cover = readJson('05-封面/selected-cover.json');
    const displayPath = display.evidence_path;
    const hash = (relative) => createHash('sha256').update(readFileSync(file(relative))).digest('hex');
    if (display.schema_version !== 1 || typeof displayPath !== 'string' || !displayPath.startsWith('12-发布/') || displayPath.includes('..') || !nonEmptyFile(displayPath) || display.evidence_sha256 !== hash(displayPath) || String(display.aweme_id) !== String(record.aweme_id) || display.platform_title !== record.platform_title || display.display_title !== record.platform_title || display.cover_asset !== cover.selected_asset || !nonEmptyFile(cover.selected_asset) || display.cover_sha256 !== hash(cover.selected_asset) || display.final_sha256 !== finalHash || !['MATCHED', 'REVISE'].includes(display.title_verdict) || !['MATCHED', 'REVISE'].includes(display.cover_verdict) || !['MATCHED', 'REVISE'].includes(display.video_verdict) || display.title_verdict !== 'MATCHED' || display.cover_verdict !== 'MATCHED' || display.video_verdict !== 'MATCHED' || typeof display.reviewer !== 'string' || !display.reviewer.trim() || Number.isNaN(Date.parse(display.captured_at)) || Number.isNaN(Date.parse(display.reviewed_at))) {
      return {done: false, reason: '可选 platform-display-evidence 存在时必须绑定本期展示证据、标题、封面、final 与 MATCHED 人工核对'};
    }
  }
  if (!exists('12-发布/cheat-publish-evidence.json') || !exists('03-预测证据.json')) return {done: false, reason: '缺 cheat-publish 与本期预测/发布事实绑定证据'};
  const evidence = readJson('12-发布/cheat-publish-evidence.json');
  const proof = readJson('03-预测证据.json');
  const report = readFileSync(file('03-校准报告.md'), 'utf8');
  const form = report.match(/^content_form:\s*(.+)\s*$/m)?.[1]?.trim();
  const lane = resolve(root, 'calibration', form || '');
  const predictionPath = resolve(lane, proof.prediction_file || '');
  if (!existsSync(predictionPath) || !realpathSync(predictionPath).startsWith(realpathSync(lane) + '/')) return {done: false, reason: 'cheat-publish 对应 lane/prediction 不存在'};
  const prediction = readFileSync(predictionPath, 'utf8');
  if (evidence.lane_state_snapshot !== '12-发布/cheat-state-publish-snapshot.json' || !exists(evidence.lane_state_snapshot)) return {done: false, reason: '缺 cheat-publish 时点的 lane state 快照'};
  if (evidence.prediction_snapshot !== '12-发布/prediction-publish-snapshot.md' || !exists(evidence.prediction_snapshot)) return {done: false, reason: '缺 cheat-publish 时点的 prediction 快照'};
  const stateSnapshot = readJson(evidence.lane_state_snapshot);
  const predictionSnapshot = readFileSync(file(evidence.prediction_snapshot), 'utf8');
  const header = (name) => prediction.match(new RegExp(`^\\*\\*${name}\\*\\*:\\s*(.+)\\s*$`, 'mi'))?.[1]?.trim();
  const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
  const snapshotHeader = (name) => predictionSnapshot.match(new RegExp(`^\\*\\*${name}\\*\\*:\\s*(.+)\\s*$`, 'mi'))?.[1]?.trim();
  if (evidence.episode !== basename(episodeDir) || evidence.prediction_file !== proof.prediction_file || evidence.url !== record.url || String(evidence.aweme_id) !== String(record.aweme_id) || Date.parse(evidence.published_at) !== Date.parse(record.published_at) || evidence.prediction_section_sha256 !== proof.prediction_section_sha256 || createHash('sha256').update(immutablePrediction(prediction)).digest('hex') !== proof.prediction_section_sha256 || evidence.prediction_snapshot_sha256 !== hash(file(evidence.prediction_snapshot)) || createHash('sha256').update(immutablePrediction(predictionSnapshot)).digest('hex') !== proof.prediction_section_sha256 || evidence.lane_state_snapshot_sha256 !== hash(file(evidence.lane_state_snapshot)) || header('Platform') !== 'douyin' || header('URL') !== record.url || header('Aweme ID') !== String(record.aweme_id) || Date.parse(header('Published at')) !== Date.parse(record.published_at) || snapshotHeader('Platform') !== 'douyin' || snapshotHeader('URL') !== record.url || snapshotHeader('Aweme ID') !== String(record.aweme_id) || Date.parse(snapshotHeader('Published at')) !== Date.parse(record.published_at) || stateSnapshot.last_published_file !== proof.prediction_file || String(stateSnapshot.last_published_platform_id) !== String(record.aweme_id) || !stateSnapshot.pending_retros?.includes(proof.prediction_file)) return {done: false, reason: 'cheat-publish evidence/header/state 未绑定当前发布事实'};
  return {done: true, reason: '抖音发布已登记'};
}, 'publish-record.json 无法读取');
const jsonLines = (relative) => {
  if (!nonEmptyFile(relative)) throw new Error('JSONL 不得引用 episode 外部路径: ' + relative);
  const lines = readFileSync(file(relative), 'utf8').split('\n').filter((line) => line.trim());
  if (!lines.length) throw new Error('文件为空');
  return lines.map((line) => JSON.parse(line));
};
const snapshotState = () => safely(() => {
  if (!exists('13-数据/snapshots.jsonl')) return {done: false, reason: '缺 13-数据/snapshots.jsonl'};
  const publish = readJson('12-发布/publish-record.json');
  const topic = readJson('00-选题.json');
  const experiment = topic.experiment || {};
  let hasTarget = false;
  for (const snapshot of jsonLines('13-数据/snapshots.jsonl')) {
    if (snapshot.platform !== 'douyin' || snapshot.aweme_id !== publish.aweme_id || !snapshot.observed_at || !snapshot.source || !snapshot.observation_window || !/^T\+\d+$/.test(snapshot.observation_window) || !['TARGET', 'CONTEXT'].includes(snapshot.measurement_role) || snapshot.metric_dictionary_version !== 1 || !snapshot.metrics || Array.isArray(snapshot.metrics) || Object.keys(snapshot.metrics).length === 0 || Number.isNaN(Date.parse(snapshot.observed_at)) || Date.parse(snapshot.observed_at) < Date.parse(publish.published_at)) return {done: false, reason: '每条数据快照必须归属本作品、声明 TARGET/CONTEXT、窗口、指标字典和来源，且时间不得早于发布'};
    if (!Object.values(snapshot.metrics).every((value) => value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0))) return {done: false, reason: 'metrics 只能是非负数或 null'};
    if (snapshot.measurement_role === 'TARGET') {
      if (snapshot.observation_window !== experiment.observation_window || typeof snapshot.metrics.plays !== 'number' || !experiment.metric_keys.every((key) => typeof snapshot.metrics[key] === 'number')) return {done: false, reason: 'TARGET 快照必须匹配①的 T+N，并含非空播放和全部预注册指标'};
      hasTarget = true;
    }
  }
  if (!hasTarget) return {done: false, reason: '缺匹配①测量计划的 TARGET 快照；CONTEXT 不能完成⑬'};
  return {done: true, reason: '目标窗口抖音数据快照已登记'};
}, 'snapshots.jsonl 无法读取');
const commentState = () => safely(() => {
  if (!nonEmptyFile('14-评论/insights.md')) return {done: false, reason: '缺 14-评论/insights.md'};
  const insights = readFileSync(file('14-评论/insights.md'), 'utf8');
  const statuses = [...insights.matchAll(/^评论数据状态:\s*(AVAILABLE|UNAVAILABLE)$/gm)];
  if (statuses.length !== 1) {
    return {done: false, reason: 'insights.md 必须声明评论数据状态 AVAILABLE 或 UNAVAILABLE'};
  }
  if (/^评论数据状态:\s*AVAILABLE$/m.test(insights)) {
    if (!nonEmptyFile('14-评论/comments.jsonl')) return {done: false, reason: '评论可用时缺非空 comments.jsonl'};
    const publish = readJson('12-发布/publish-record.json');
    for (const comment of jsonLines('14-评论/comments.jsonl')) if (comment.platform !== 'douyin' || comment.aweme_id !== publish.aweme_id || !comment.captured_at || Number.isNaN(Date.parse(comment.captured_at)) || !comment.source || typeof comment.text !== 'string' || !comment.text.trim()) return {done: false, reason: '每条评论记录必须含有效归属、时间和证据字段'};
  }
  if (/^评论数据状态:\s*UNAVAILABLE$/m.test(insights) && !/^失败原因:\s*.+$/m.test(insights)) {
    return {done: false, reason: '评论不可用时必须写失败原因'};
  }
  if (!exists('14-评论/retro-handoff.json')) return {done: false, reason: '缺 cheat-retro 交接证据 retro-handoff.json'};
  const retro = readJson('14-评论/retro-handoff.json');
  const proof = readJson('03-预测证据.json');
  const publish = readJson('12-发布/publish-record.json');
  const sha = (relative) => createHash('sha256').update(readFileSync(file(relative))).digest('hex');
  const report = readFileSync(file('03-校准报告.md'), 'utf8');
  const form = report.match(/^content_form:\s*(.+)\s*$/m)?.[1]?.trim();
  const predictionPath = resolve(root, 'calibration', form || '', proof.prediction_file || '');
  const rubricMemoPath = resolve(root, 'calibration', form || '', 'rubric-memo.md');
  const commentsHash = exists('14-评论/comments.jsonl') ? sha('14-评论/comments.jsonl') : null;
  const rubricHash = existsSync(rubricMemoPath) ? createHash('sha256').update(readFileSync(rubricMemoPath)).digest('hex') : null;
  const predictionBody = existsSync(predictionPath) ? readFileSync(predictionPath, 'utf8') : '';
  const [, retroSection = ''] = predictionBody.split(/^##\s*复盘\s*$/m);
  const predictionAfterRetroHash = predictionBody ? createHash('sha256').update(predictionBody).digest('hex') : null;
  const hypotheses = retro.feedback_hypotheses;
  const ids = new Set();
  const validHypotheses = Array.isArray(hypotheses) && hypotheses.length > 0 && hypotheses.every((item) => {
    if (!item || typeof item.hypothesis_id !== 'string' || !item.hypothesis_id.trim() || ids.has(item.hypothesis_id) || typeof item.intervention !== 'string' || !item.intervention.trim() || typeof item.expected_metric !== 'string' || !item.expected_metric.trim() || typeof item.observation_window !== 'string' || !/^T\+\d+$/.test(item.observation_window) || !['OPEN', 'SUPPORTED', 'REJECTED', 'INCONCLUSIVE'].includes(item.status) || !['①', '④'].includes(item.feedback_target)) return false;
    ids.add(item.hypothesis_id);
    return true;
  });
  const upgradeEvidence = retro.conclusion_level !== 'UPGRADE_EVIDENCE' || (Array.isArray(retro.evidence_episode_ids) && new Set(retro.evidence_episode_ids).size >= 2 && retro.evidence_episode_ids.every((id) => typeof id === 'string' && id.trim()) && typeof retro.comparison_note === 'string' && retro.comparison_note.trim());
  if (retro.status !== 'COMPLETE' || !['OBSERVATION', 'HYPOTHESIS', 'UPGRADE_EVIDENCE'].includes(retro.conclusion_level) || !validHypotheses || !upgradeEvidence || retro.episode !== basename(episodeDir) || retro.aweme_id !== publish.aweme_id || retro.prediction_file !== proof.prediction_file || !predictionBody || createHash('sha256').update(immutablePrediction(predictionBody)).digest('hex') !== proof.prediction_section_sha256 || retroSection.trim().length < 20 || /待填|TODO/i.test(retroSection) || retro.prediction_after_retro_sha256 !== predictionAfterRetroHash || !rubricHash || retro.rubric_memo_sha256 !== rubricHash || retro.snapshots_sha256 !== sha('13-数据/snapshots.jsonl') || retro.insights_sha256 !== sha('14-评论/insights.md') || retro.comments_sha256 !== commentsHash || !retro.completed_at || Number.isNaN(Date.parse(retro.completed_at))) return {done: false, reason: 'retro-handoff 必须声明合法结论级别、反馈假设与绑定不可变预测段、真实复盘、rubric-memo、作品、数据和评论证据 SHA'};
  return {done: true, reason: '评论洞察与 cheat-retro 已登记'};
}, '评论洞察无法读取');

let directProduction = false;
try { directProduction = readJson('episode-config.json').renderer_mode === 'CODEX_DIRECT'; } catch {}
const steps = [
  {id: '①', name: '选题决策', skill: 'laohan-redian（决策主写）+ laohan-douyinsousuo（平台取证）', done: () => topicState().done, output: '00-选题-signals/source-health/candidates + 00-抖音搜索证据.{json,md} + 00-选题.{json,md}'},
  {id: '②', name: '写稿', skill: 'laohan-chuangzuo', done: () => scriptState().done, output: '01-口播稿.md + 02-创作工作稿/创作决策.json'},
  {id: '③', name: '违规', skill: 'laohan-weigui', done: () => complianceState().done, output: '02-违规报告.md（当前稿 hash + CLEAR 风险结论）'},
  {id: '④', name: '校准与盲预测', skill: 'laohan-cheat → cheat-on-content', done: () => calibrationState().done, output: '03-校准报告.md（score、script_hash、lane、盲预测状态）'},
  {id: '⑤', name: '深扫与事实核验', skill: 'dbs-script-flow + dbs-resonate + 条件 dbs-hook/dbs-ai-check + laohan-shencha', done: () => deepScanState().done, output: '04-深扫报告.md + 04-事实核验.md（均含 script_hash）'},
  {id: '⑥', name: '封面选择', skill: 'laohan-fengmianqiuzhi（prompt）+ registered image provider + selection policy', done: () => coverState().done, output: '05-封面/selected-cover.json + cover-review.json'},
  {id: '⑦', name: '拍摄', skill: '人工拍摄', done: () => shootingState().done, output: 'raw.mp4 + shooting-record.json'},
  {id: '⑧', name: 'Codex自动剪辑与实际字幕', skill: directProduction ? 'codex-direct-production' : 'whisper-timestamped + registered edit executor', done: () => gateState('director', '剪辑输入契约未通过').done, output: '07-剪辑/{raw-transcript.json,edit-candidates.json,edit-decision.json,edit-render.json,clean.mp4,clean-transcript.json,subtitles.srt,spoken-script-variance.json,edit-review.json,edit-manifest.json}'},
  {id: '⑨', name: directProduction ? 'Codex Direct导演' : 'METHOD_LAB语义导演', skill: directProduction ? 'codex-direct-production' : 'laohan-daoyan', done: () => gateState('director-output', directProduction ? 'Direct brief 契约未通过' : '导演输出契约未通过').done, output: directProduction ? '09-导演/{direct-brief.json,source-manifest.json}' : '09-导演/{edl.json,source-manifest.json,renderer-brief.md}'},
  {id: '⑩', name: '按需素材', skill: directProduction ? 'codex-direct-production + laohan-sucai（仅有请求时）' : 'laohan-sucai', done: () => materialState().done, output: '10-素材/真实已核验资产，或 not_applicable'},
  {id: '⑪', name: directProduction ? 'Codex Direct成片与选片' : 'METHOD_LAB动画与选片', skill: directProduction ? 'codex-direct-production' : 'laohan-donghua', done: () => animationState().done, output: directProduction ? 'Remotion candidates + 完整观看 QA + accepted final' : 'renderer candidates + QA + accepted final'},
  {id: '⑫', name: '发布登记', skill: 'laohan-yunying', done: () => publishState().done, output: '12-发布/publish-record.json'},
  {id: '⑬', name: '数据快照', skill: 'laohan-yunying', done: () => snapshotState().done, output: '13-数据/snapshots.jsonl'},
  {id: '⑭', name: '评论洞察', skill: 'laohan-yunying', done: () => commentState().done, output: '14-评论/{comments.jsonl,insights.md}'},
];

const configCheck = () => gate('config');
const configResult = configCheck();
let workflowMode = null;
try { workflowMode = readJson('episode-config.json').workflow_mode; } catch {}
if (command === 'vendors') {
  if (configResult.status !== 0) {
    console.error('BLOCKED：episode config/executor lock 未通过，不能刷新 vendor preflight。\n' + (configResult.stderr || configResult.stdout).trim());
    process.exit(1);
  }
  const runtime = spawnSync('node', [runtimeChecker], {encoding: 'utf8'});
  process.stdout.write(runtime.stdout);
  process.stderr.write(runtime.stderr);
  if (runtime.status) process.exit(runtime.status);
  if (!existsSync(vendorSync)) {
    console.error('未找到 vendor 同步器: ' + vendorSync);
    process.exit(2);
  }
  if (syncVendors && exists('01-口播稿.md')) {
    console.error('BLOCKED：当前 episode 已开始。vendor 同步只允许在新 episode 开始前或独立维护窗口执行，避免中途改变诊断/校准规则。');
    process.exit(1);
  }
  let frozenVendor = null;
  if (exists('01-口播稿.md')) {
    const preflightRelative = '00-编排/vendor-preflight.json';
    if (!nonEmptyFile(preflightRelative)) {
      console.error('BLOCKED：进行中的 episode 缺原 vendor preflight，不能用当前 HEAD 重建历史冻结值。');
      process.exit(1);
    }
    const existing = spawnSync('node', [vendorPreflightVerifier, episodeDir], {encoding: 'utf8'});
    if (existing.status !== 0) {
      console.error('BLOCKED：原 vendor preflight 无效或已漂移，不能刷新。\n' + (existing.stderr || existing.stdout || '').trim());
      process.exit(1);
    }
    frozenVendor = readJson(preflightRelative);
  }
  const result = spawnSync('bash', [vendorSync, syncVendors ? '--apply' : '--check'], {encoding: 'utf8'});
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status === 0) {
    const vendorInfo = (name) => {
      const match = result.stdout.match(new RegExp('^' + name + '=(UP_TO_DATE|READY_LOCAL_AHEAD)\\s+head=([a-f0-9]{40,64})$', 'm'));
      return match ? {state: match[1], head: match[2]} : null;
    };
    const cheat = vendorInfo('CHEAT');
    const dbskill = vendorInfo('DBSKILL');
    if (!cheat || !dbskill) {
      console.error('BLOCKED：vendor 检查未返回可冻结的 Cheat/dbskill 状态与完整 HEAD SHA。');
      process.exit(1);
    }
    if (frozenVendor && (frozenVendor.cheat_head_sha !== cheat.head || frozenVendor.dbskill_head_sha !== dbskill.head)) {
      console.error('BLOCKED：VENDOR_HEAD_DRIFT。进行中的 episode 只能续用原 schema 3 冻结的 vendor HEAD，不能迁移或猜填。');
      process.exit(1);
    }
    const preflightDir = file('00-编排');
    mkdirSync(preflightDir, {recursive: true});
    writeFileSync(join(preflightDir, 'vendor-preflight.json'), JSON.stringify({schema_version: 3, status: 'READY', source_scope: 'FROZEN_ON_RESUME', runtime_lock_sha256: shaPath(runtimeLock), checked_at: new Date().toISOString(), cheat_state: cheat.state, cheat_head_sha: cheat.head, dbskill_state: dbskill.state, dbskill_head_sha: dbskill.head}, null, 2) + '\n');
    const verified = spawnSync('node', [vendorPreflightVerifier, episodeDir], {encoding: 'utf8'});
    process.stdout.write(verified.stdout);
    process.stderr.write(verified.stderr);
    if (verified.status !== 0) process.exit(verified.status || 1);
    console.log('VENDOR_PREFLIGHT=00-编排/vendor-preflight.json');
  }
  process.exit(result.status ?? 1);
}
const runtime = spawnSync('node', [runtimeChecker], {encoding: 'utf8'});
if (runtime.status) {
  console.error((runtime.stderr || runtime.stdout).trim());
  process.exit(runtime.status ?? 1);
}
if (command === 'check') {
  if (requiredStage === 'final' || requiredStage === 'production' || requiredStage === 'full') {
    const prerequisites = [topicState().done, scriptState().done, complianceState().done, calibrationState().done, deepScanState().done, coverState().done, shootingState().done];
    if (prerequisites.some((value) => !value)) {
      console.error('FAIL ' + (requiredStage === 'production' ? '生产前' : '发布/闭环前') + '必须完成①—⑦、最终盲预测 RECORDED，且所有稿件绑定当前 hash');
      process.exit(1);
    }
  }
  const stages = ['config'];
  if (exists('07-剪辑/clean.mp4') && exists('07-剪辑/subtitles.srt')) stages.push('director');
  if ((exists('09-导演/direct-brief.json') || exists('09-导演/edl.json')) && exists('09-导演/source-manifest.json')) stages.push('director-output', 'materials', 'production');
  if (requiredStage === 'production' && !stages.includes('production')) stages.push('production');
  if (exists('11-动画/render-manifest.json')) stages.push('final');
  if (requiredStage === 'final' || requiredStage === 'full') stages.push('accepted-final');
  let exitCode = 0;
  for (const stage of stages) {
    const result = gate(stage);
    process.stdout.write(result.stdout);
    process.stderr.write(result.stderr);
    if (result.status) exitCode = result.status;
  }
  if (exitCode) process.exit(exitCode);
  const checkedStates = steps.map((step) => ({...step, done: step.done()}));
  const incomplete = checkedStates.filter((step) => !step.done);
  if (requiredStage === 'full' && incomplete.length) {
    console.error('FAIL full workflow incomplete: ' + incomplete.map((step) => step.id + step.name).join('、'));
    process.exit(1);
  }
  if (incomplete.length) console.log('INCOMPLETE next=' + incomplete[0].id + incomplete[0].name + '；PASS 仅表示当前已具备输入的机械 gate 通过');
  else console.log('PASS full workflow');
  process.exit(0);
}

if (configResult.status !== 0) {
  console.log('# 编排状态\n\n状态：BLOCKED\n\n- 当前 gate：episode-config.json\n- 原因：' + (configResult.stderr || configResult.stdout).trim());
  process.exit(1);
}
if (['status', 'next'].includes(command)) {
  const preflight = vendorPreflightState();
  if (!preflight.done) {
    console.log('# 编排状态\n\n状态：BLOCKED\n\n- 当前 gate：vendor preflight\n- 原因：' + preflight.reason);
    process.exit(1);
  }
}

const states = steps.map((step) => ({...step, done: step.done()}));
const calibration = calibrationState();
const deepScan = deepScanState();
let next = states.find((step) => !step.done);
if (calibration.scoreDone && !deepScan.done) next = states[4];
if (calibration.scoreDone && deepScan.done && calibration.predictionStatus !== 'RECORDED') {
  next = {...states[3], name: '最终盲预测', skill: 'laohan-cheat → cheat-on-content cheat-predict', output: '03-校准报告.md（prediction_status=RECORDED）'};
}
if (calibration.done && deepScan.done && calibration.predictionStatus === 'RECORDED') {
  next = states.slice(5).find((step) => !step.done);
}
if (command === 'next') {
  if (!next) console.log('# 下一步\n\n所有 ①—⑭ 标准产物已存在；进入 laohan-cheat 的复盘与方法更新 gate。');
  else if (next.skill === 'codex-direct-production') console.log(`# 下一步：${next.id}${next.name}\n\nHANDOFF_TO_CODEX\nepisode: ${basename(episodeDir)}\nexecutor: codex-direct-production\nnext_scope: ⑧—⑪\n\n- 需要落盘：${next.output}\n- 前置：⑦真实拍摄及当前稿件合同必须保留；Claude Code不得代写⑧—⑪产物。`);
  else if (workflowMode === 'AUTONOMOUS_RUN' && ['①', '②', '③', '④', '⑤', '⑥'].includes(next.id)) console.log(`# 下一步：${next.id}${next.name}\n\nAUTO_CONTINUE_REQUIRED\nworkflow_mode: AUTONOMOUS_RUN\nstop_condition: ⑦\n\n- 路由：${next.skill}\n- 需要落盘：${next.output}\n- 前置：前一已完成步骤的产物必须保留；成功后重跑 bianpai 并自动继续，不逐步询问 Jeffrey。`);
  else if (workflowMode === 'AUTONOMOUS_RUN' && next.id === '⑦') console.log(`# 下一步：⑦拍摄\n\nWAITING_FOR_JEFFREY_SHOOTING\nworkflow_mode: AUTONOMOUS_RUN\nplanned_manual_handoff: true\n\n- 需要落盘：${next.output}\n- 说明：到达计划内唯一拍摄交接；等 Jeffrey 拍摄，这不是 BLOCKED。`);
  else console.log(`# 下一步：${next.id}${next.name}\n\n- 路由：${next.skill}\n- 需要落盘：${next.output}\n- 前置：前一已完成步骤的产物必须保留。`);
  process.exit(0);
}

console.log('# 编排状态\n');
for (const step of states) {
  const detail = step.id === '①' ? ' · ' + topicState().reason : step.id === '②' ? ' · ' + scriptState().reason : step.id === '③' ? ' · ' + complianceState().reason : step.id === '④' ? ' · ' + calibration.reason : step.id === '⑤' ? ' · ' + deepScan.reason : step.id === '⑥' ? ' · ' + coverState().reason : step.id === '⑦' ? ' · ' + shootingState().reason : step.id === '⑩' ? ' · ' + materialState().reason : step.id === '⑪' ? ' · ' + animationState().reason : step.id === '⑫' ? ' · ' + publishState().reason : step.id === '⑬' ? ' · ' + snapshotState().reason : step.id === '⑭' ? ' · ' + commentState().reason : '';
  const marker = step.id === '④' && calibration.scoreDone && !calibration.done ? '~' : step.done ? 'x' : ' ';
  console.log(`- [${marker}] ${step.id}${step.name} → ${step.output}${detail}`);
}
if (next) {
  console.log(`\n当前唯一下一步：${next.id}${next.name}（${next.skill}）`);
  if (next.skill === 'codex-direct-production') console.log(`HANDOFF_TO_CODEX episode=${basename(episodeDir)} executor=codex-direct-production next_scope=⑧—⑪`);
  else if (workflowMode === 'AUTONOMOUS_RUN' && ['①', '②', '③', '④', '⑤', '⑥'].includes(next.id)) console.log('AUTO_CONTINUE_REQUIRED workflow_mode=AUTONOMOUS_RUN stop_condition=⑦');
  else if (workflowMode === 'AUTONOMOUS_RUN' && next.id === '⑦') console.log('WAITING_FOR_JEFFREY_SHOOTING planned_manual_handoff=true blocked=false');
}
else console.log('\n全部标准产物已存在；进入复盘与方法更新 gate。');
