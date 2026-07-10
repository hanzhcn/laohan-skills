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
const vendorPreflightState = () => safely(() => {
  const relative = '00-编排/vendor-preflight.json';
  if (!nonEmptyFile(relative)) return {done: false, reason: '缺当前 vendor preflight；先运行 bianpai vendors'};
  const record = readJson(relative);
  if (record.schema_version !== 1 || record.status !== 'READY' || record.runtime_lock_sha256 !== shaPath(runtimeLock) || Number.isNaN(Date.parse(record.checked_at)) || record.cheat !== 'READY' || record.dbskill !== 'READY') return {done: false, reason: 'vendor preflight 无效或未绑定当前 runtime lock；重新运行 bianpai vendors'};
  return {done: true, reason: 'vendor preflight 已绑定当前 runtime lock'};
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
const complianceState = () => conclusionState('02-违规报告.md', '02-违规报告.md', 'risk_status', ['unresolved_high_risk_count']);
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
  if (!cover.selected_asset || !cover.title || !cover.canvas?.width || !cover.canvas?.height || cover.script_hash !== scriptHash()
    || !actualAsset.startsWith(assetRoot) || !dimensions || !Array.isArray(cover.large_text) || !cover.large_text.some((text) => typeof text === 'string' && text.trim())
    || cover.canvas.width !== config.canvas?.width || cover.canvas.height !== config.canvas?.height
    || dimensions.width !== config.canvas?.width || dimensions.height !== config.canvas?.height || cover.title !== scriptTitle
    || review.script_hash !== scriptHash() || review.selected_asset !== cover.selected_asset || review.thumbnail_readability !== 'PASS' || !Array.isArray(review.candidates) || review.candidates.length < 2 || typeof review.expected_metric !== 'string' || !review.expected_metric.trim() || typeof review.reviewer !== 'string' || !review.reviewer.trim() || Number.isNaN(Date.parse(review.reviewed_at))) {
    return {done: false, reason: 'selected-cover 必须引用本期 05-封面内的真实 PNG/JPEG，真实像素、标题、large_text、画布和 script_hash 必须匹配当前稿/config'};
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
  for (const snapshot of jsonLines('13-数据/snapshots.jsonl')) {
    if (snapshot.platform !== 'douyin' || snapshot.aweme_id !== publish.aweme_id || !snapshot.observed_at || !snapshot.source || !snapshot.observation_window || !/^T\+\d+$/.test(snapshot.observation_window) || snapshot.metric_dictionary_version !== 1 || !snapshot.metrics || Array.isArray(snapshot.metrics) || Object.keys(snapshot.metrics).length === 0 || Number.isNaN(Date.parse(snapshot.observed_at)) || Date.parse(snapshot.observed_at) < Date.parse(publish.published_at)) return {done: false, reason: '每条数据快照必须归属本作品、含固定 T+N 窗口、指标字典版本和非空指标来源，且时间不得早于发布'};
    if (!Object.values(snapshot.metrics).every((value) => value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0))) return {done: false, reason: 'metrics 只能是非负数或 null'};
  }
  return {done: true, reason: '最新抖音数据快照已登记'};
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
  if (retro.status !== 'COMPLETE' || !['OBSERVATION', 'HYPOTHESIS', 'UPGRADE_EVIDENCE'].includes(retro.conclusion_level) || retro.episode !== basename(episodeDir) || retro.aweme_id !== publish.aweme_id || retro.prediction_file !== proof.prediction_file || !predictionBody || createHash('sha256').update(immutablePrediction(predictionBody)).digest('hex') !== proof.prediction_section_sha256 || retroSection.trim().length < 20 || /待填|TODO/i.test(retroSection) || retro.prediction_after_retro_sha256 !== predictionAfterRetroHash || !rubricHash || retro.rubric_memo_sha256 !== rubricHash || retro.snapshots_sha256 !== sha('13-数据/snapshots.jsonl') || retro.insights_sha256 !== sha('14-评论/insights.md') || retro.comments_sha256 !== commentsHash || !retro.completed_at || Number.isNaN(Date.parse(retro.completed_at))) return {done: false, reason: 'retro-handoff 必须声明结论级别，并绑定不可变预测段、真实复盘内容、rubric-memo、作品、数据与评论证据 SHA'};
  return {done: true, reason: '评论洞察与 cheat-retro 已登记'};
}, '评论洞察无法读取');

const steps = [
  {id: '①', name: '选题', skill: 'laohan-redian（主写）+ laohan-douyinsousuo（证据）', done: () => nonEmptyFile('00-选题.md'), output: '00-选题.md'},
  {id: '②', name: '写稿', skill: 'laohan-chuangzuo', done: () => nonEmptyFile('01-口播稿.md'), output: '01-口播稿.md'},
  {id: '③', name: '违规', skill: 'laohan-weigui', done: () => complianceState().done, output: '02-违规报告.md（当前稿 hash + CLEAR 风险结论）'},
  {id: '④', name: '校准与盲预测', skill: 'laohan-cheat → cheat-on-content', done: () => calibrationState().done, output: '03-校准报告.md（score、script_hash、lane、盲预测状态）'},
  {id: '⑤', name: '深扫与事实核验', skill: 'dbs-script-flow + dbs-resonate + 条件 dbs-hook/dbs-ai-check + laohan-shencha', done: () => deepScanState().done, output: '04-深扫报告.md + 04-事实核验.md（均含 script_hash）'},
  {id: '⑥', name: '封面选择', skill: 'laohan-fengmianqiuzhi', done: () => coverState().done, output: '05-封面/selected-cover.json'},
  {id: '⑦', name: '拍摄', skill: '人工拍摄', done: () => shootingState().done, output: 'raw.mp4 + shooting-record.json'},
  {id: '⑧', name: '剪辑与实际字幕', skill: '人工剪辑 + chengfeng adapter', done: () => gateState('director', '剪辑输入契约未通过').done, output: '07-剪辑/clean.mp4 + subtitles.srt'},
  {id: '⑨', name: '语义导演', skill: 'laohan-daoyan', done: () => gateState('director-output', '导演输出契约未通过').done, output: '09-导演/{edl.json,source-manifest.json,renderer-brief.md}'},
  {id: '⑩', name: '素材供应', skill: 'laohan-sucai', done: () => materialState().done, output: '10-素材/素材清单.json'},
  {id: '⑪', name: '动画生产与选片', skill: 'laohan-donghua', done: () => animationState().done, output: '11-动画/render-manifest.json + 07-剪辑/final.mp4'},
  {id: '⑫', name: '发布登记', skill: 'laohan-yunying', done: () => publishState().done, output: '12-发布/publish-record.json'},
  {id: '⑬', name: '数据快照', skill: 'laohan-yunying', done: () => snapshotState().done, output: '13-数据/snapshots.jsonl'},
  {id: '⑭', name: '评论洞察', skill: 'laohan-yunying', done: () => commentState().done, output: '14-评论/{comments.jsonl,insights.md}'},
];

const configCheck = () => gate('config');
const configResult = configCheck();
if (command === 'vendors') {
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
  const result = spawnSync('bash', [vendorSync, syncVendors ? '--apply' : '--check'], {encoding: 'utf8'});
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status === 0) {
    const preflightDir = file('00-编排');
    mkdirSync(preflightDir, {recursive: true});
    writeFileSync(join(preflightDir, 'vendor-preflight.json'), JSON.stringify({schema_version: 1, status: 'READY', runtime_lock_sha256: shaPath(runtimeLock), checked_at: new Date().toISOString(), cheat: 'READY', dbskill: 'READY'}, null, 2) + '\n');
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
    const prerequisites = [nonEmptyFile('00-选题.md'), nonEmptyFile('01-口播稿.md'), complianceState().done, calibrationState().done, deepScanState().done, coverState().done, shootingState().done];
    if (prerequisites.some((value) => !value)) {
      console.error('FAIL ' + (requiredStage === 'production' ? '生产前' : '发布/闭环前') + '必须完成①—⑦、最终盲预测 RECORDED，且所有稿件绑定当前 hash');
      process.exit(1);
    }
  }
  const stages = ['config'];
  if (exists('07-剪辑/clean.mp4') && exists('07-剪辑/subtitles.srt')) stages.push('director');
  if (exists('09-导演/edl.json') && exists('09-导演/source-manifest.json') && exists('09-导演/renderer-brief.md')) stages.push('director-output', 'materials', 'production');
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
if (['status', 'next'].includes(command) && !vendorPreflightState().done) {
  console.log('# 编排状态\n\n状态：BLOCKED\n\n- 当前 gate：vendor preflight\n- 原因：' + vendorPreflightState().reason);
  process.exit(1);
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
  else console.log(`# 下一步：${next.id}${next.name}\n\n- 路由：${next.skill}\n- 需要落盘：${next.output}\n- 前置：前一已完成步骤的产物必须保留。`);
  process.exit(0);
}

console.log('# 编排状态\n');
for (const step of states) {
  const detail = step.id === '③' ? ' · ' + complianceState().reason : step.id === '④' ? ' · ' + calibration.reason : step.id === '⑤' ? ' · ' + deepScan.reason : step.id === '⑥' ? ' · ' + coverState().reason : step.id === '⑦' ? ' · ' + shootingState().reason : step.id === '⑩' ? ' · ' + materialState().reason : step.id === '⑪' ? ' · ' + animationState().reason : step.id === '⑫' ? ' · ' + publishState().reason : step.id === '⑬' ? ' · ' + snapshotState().reason : step.id === '⑭' ? ' · ' + commentState().reason : '';
  const marker = step.id === '④' && calibration.scoreDone && !calibration.done ? '~' : step.done ? 'x' : ' ';
  console.log(`- [${marker}] ${step.id}${step.name} → ${step.output}${detail}`);
}
if (next) console.log(`\n当前唯一下一步：${next.id}${next.name}（${next.skill}）`);
else console.log('\n全部标准产物已存在；进入复盘与方法更新 gate。');
