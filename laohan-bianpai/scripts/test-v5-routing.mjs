#!/usr/bin/env node
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {tmpdir} from 'node:os';

const bianpai = resolve(dirname(new URL(import.meta.url).pathname), 'bianpai.mjs');
const testRoot = mkdtempSync(join(tmpdir(), 'laohan-bianpai-v51-'));
const episode = join(testRoot, 'episodes/imported');
const write = (path, value) => { mkdirSync(dirname(path), {recursive: true}); writeFileSync(path, value); };
const json = (path, value) => write(path, JSON.stringify(value, null, 2) + '\n');
const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const run = (...args) => spawnSync(process.execPath, [bianpai, ...args, '--episode', episode], {encoding: 'utf8'});
const promptEntries = [
  ['00-controller', '00-全自动编排控制器.md', 'NO_NEW_TASK'],
  ['01-topic-creation', '01-新期选题与创作.md', 'MUST_CREATE'],
  ['02-content-review', '02-内容终审与定稿.md', 'MUST_CREATE'],
  ['03-cover', '03-封面制作.md', 'MUST_CREATE'],
  ['04-director-draft', '04-导演初稿.md', 'MUST_CREATE'],
  ['05-director-final', '05-导演终审.md', 'MUST_CREATE'],
  ['06-edit-prep', '06-原片剪辑与制作准备.md', 'MUST_CREATE'],
  ['07-network', '07-网络素材.md', 'CONDITIONAL_CREATE'],
  ['08-local-capture', '08-本机录屏.md', 'CONDITIONAL_CREATE'],
  ['09-candidate', '09-成片candidate制作.md', 'MUST_CREATE'],
  ['10-finalize', '10-candidate验收与本地完结.md', 'MUST_CREATE'],
  ['11-publish', '11-四平台发布.md', 'MUST_CREATE'],
  ['12-retro', '12-数据与复盘.md', 'NO_NEW_TASK'],
];
const sourceManifest = ({network = false, capture = false} = {}) => ({
  schema_version: 1,
  source_entries: [],
  broll_requests: network ? [{request_id: 'network-001', beat_id: 'B01', source_mode: 'BROLL_STOCK', required: true, visual_need: '真实产品画面', start_s: 0, end_s: 2, must_not_imply: []}] : [],
  capture_requests: capture ? [{request_id: 'capture-001', beat_id: 'B02', source_mode: 'LOCAL_CAPTURE', required: true, capture_kind: 'PUBLIC_BROWSER_VIEWPORT', visual_need: '本机演示', start_s: 2, end_s: 4, must_not_imply: []}] : [],
});
const mediaStatus = (manifest, network, capture, {emptyTasks = false} = {}) => {
  const source = JSON.parse(readFileSync(manifest, 'utf8'));
  const networkRequests = [...source.broll_requests, ...source.source_entries.filter((entry) => ['PROOF_PUBLIC', 'PROOF_USER'].includes(entry.source_mode))];
  const task = (request, kind, state) => ({
    request_id: request.request_id,
    beat_id: request.beat_id,
    kind,
    required: request.required,
    status: state,
    review_verdict: state === 'COMPLETED' ? 'PASS' : undefined,
    handoff: state === 'COMPLETED' ? {episode_path: `10-素材/${request.request_id}/asset.mp4`, sha256: 'a'.repeat(64)} : undefined,
  });
  return {
    schema_version: 1,
    source_manifest_sha256: sha(manifest),
    network: {state: network, tasks: emptyTasks ? [] : networkRequests.map((request) => task(request, 'NETWORK_MATERIAL', network))},
    local_capture: {state: capture, tasks: emptyTasks ? [] : source.capture_requests.map((request) => task(request, 'LOCAL_CAPTURE', capture))},
  };
};
const promptManifest = () => ({
  schema_version: 1,
  executable_prompt_count: promptEntries.length,
  prompts: promptEntries.map(([id, promptFile, window_rule]) => ({id, file: promptFile, window_rule}))
});

try {
  write(join(testRoot, 'scripts/check-episode-contract.sh'), `#!/usr/bin/env bash
if [ "$2" = "accepted-final" ]; then exit 1; fi
if [ "$2" = "materials" ]; then
  node - "$1" <<'NODE'
const fs = require('node:fs');
const path = require('node:path');
const episode = process.argv[2];
const source = JSON.parse(fs.readFileSync(path.join(episode, '09-导演/source-manifest.json'), 'utf8'));
const status = JSON.parse(fs.readFileSync(path.join(episode, '10-素材/real-media-status.json'), 'utf8'));
const network = [...source.broll_requests, ...source.source_entries.filter((entry) => ['PROOF_PUBLIC', 'PROOF_USER'].includes(entry.source_mode))];
for (const [requests, group] of [[network, 'network'], [source.capture_requests, 'local_capture']]) {
  const tasks = status[group]?.tasks;
  if (!Array.isArray(tasks) || tasks.length !== requests.length) throw new Error(group + ' request/task set mismatch');
  for (const request of requests) {
    const task = tasks.find((item) => item.request_id === request.request_id);
    if (!task || task.required !== request.required || task.status !== 'COMPLETED' || task.review_verdict !== 'PASS' || !task.handoff?.episode_path || !task.handoff?.sha256) throw new Error(group + ' request lacks completed reviewed handoff');
  }
}
NODE
  if [ $? -ne 0 ]; then exit 1; fi
fi
echo "PASS $2"
`);
  write(join(testRoot, 'scripts/check-workflow-runtime.mjs'), 'console.log("PASS runtime");\n');
  write(join(testRoot, 'scripts/verify-vendor-preflight.mjs'), 'console.log("PASS vendor preflight");\n');
  write(join(testRoot, 'scripts/check-production-dependencies.mjs'), 'console.log("{}");\n');
  write(join(testRoot, 'scripts/sync-content-vendors.sh'), '#!/usr/bin/env bash\nexit 0\n');
  chmodSync(join(testRoot, 'scripts/check-episode-contract.sh'), 0o755);
  chmodSync(join(testRoot, 'scripts/sync-content-vendors.sh'), 0o755);
  write(join(testRoot, 'workflow-runtime-lock.json'), '{}\n');
  for (const [, promptFile] of promptEntries) write(join(testRoot, 'docs/固定提示词', promptFile), '# fixture prompt\n');
  const promptManifestPath = join(testRoot, 'docs/固定提示词/manifest.json');
  json(promptManifestPath, promptManifest());
  write(join(episode, '01-口播稿.md'), '# 最终稿\n');
  write(join(episode, '06-拍摄素材/raw.mp4'), 'raw');
  const now = new Date().toISOString();
  const inputRecordPath = join(episode, '00-编排/user-provided-inputs.json');
  json(inputRecordPath, {
    schema_version: 1,
    mode: 'USER_PROVIDED_FINAL_SCRIPT_AND_RAW',
    episode: 'imported',
    authorized_by: 'Jeffrey',
    authorization_note: '最终稿和原片已附上，封面延后',
    registered_at: now,
    script: {episode_path: '01-口播稿.md', sha256: sha(join(episode, '01-口播稿.md'))},
    raw: {episode_path: '06-拍摄素材/raw.mp4', sha256: sha(join(episode, '06-拍摄素材/raw.mp4'))}
  });
  json(join(episode, 'episode-config.json'), {
    workflow_mode: 'AUTONOMOUS_RUN',
    renderer_mode: 'CODEX_DIRECT',
    episode_entry_contract: {mode: 'USER_PROVIDED_FINAL_SCRIPT_AND_RAW', record_path: '00-编排/user-provided-inputs.json', record_sha256: sha(inputRecordPath)},
    cover_schedule: {mode: 'DEFERRED_UNTIL_CANDIDATE_SELECTION', authorized_by: 'Jeffrey', authorized_at: now, authorization_note: '最终稿和原片已附上，封面延后'}
  });
  write(join(episode, '00-编排/vendor-preflight.json'), '{}\n');

  const initial = run('next');
  if (initial.status !== 0 || !initial.stdout.includes('D1V5.1导演初稿')) throw new Error(initial.stderr || initial.stdout || '用户输入入口未路由导演初稿');

  write(join(episode, '09-导演/director-state.md'), '# V5\nmethod: V5\nworkflow_revision: V5.1\ndirector_draft: COMPLETED\ndirector_review: PENDING\nstatus: WAITING_FOR_FOOTAGE\n\n## 最终导演复审\ndirector_review: PENDING\n');
  const review = run('next');
  if (review.status !== 0 || !review.stdout.includes('D2V5.1最终导演复审')) throw new Error(review.stderr || review.stdout || '导演初稿后未路由最终复审');

  write(join(episode, '09-导演/director-state.md'), '# V5\nmethod: V5\nworkflow_revision: V5.1\ndirector_draft: COMPLETED\ndirector_review: COMPLETED\nstatus: WAITING_FOR_FOOTAGE\n\n## 最终导演复审\ndirector_review: COMPLETED\n');
  const shooting = run('next');
  if (shooting.status !== 0 || !shooting.stdout.includes('⑦拍摄') || !shooting.stdout.includes('WAITING_FOR_JEFFREY_SHOOTING')) throw new Error(shooting.stderr || shooting.stdout || '导演终审后未路由⑦');

  const status = run('status');
  if (status.status !== 0 || !status.stdout.includes('- [~] ①') || !status.stdout.includes('用户输入替代态') || !status.stdout.includes('- [x] D2')) throw new Error(status.stderr || status.stdout || '状态未正确显示用户输入替代态和导演终审');

  const projectReference = join(testRoot, 'assets/identity/jeffrey-cover-reference.jpg');
  const episodeReference = join(episode, '05-封面/reference/jeffrey-reference.jpg');
  write(projectReference, 'jeffrey-reference');
  write(episodeReference, 'jeffrey-reference');
  const coverConfig = JSON.parse(readFileSync(join(episode, 'episode-config.json'), 'utf8'));
  coverConfig.cover_schedule = {mode: 'REQUIRED_BEFORE_SHOOTING', authorized_by: null, authorized_at: null, authorization_note: null};
  coverConfig.cover_identity_contract = {reference_mode: 'REQUIRED', project_asset: 'assets/identity/jeffrey-cover-reference.jpg', episode_asset: '05-封面/reference/jeffrey-reference.jpg', reference_sha256: sha(projectReference)};
  json(join(episode, 'episode-config.json'), coverConfig);
  write(join(episode, '05-封面/cover-prompts.md'), `---\nscript_hash: ${sha(join(episode, '01-口播稿.md'))}\nprompt_executor: cover-prompt-strategy\nimage_provider: fixture\nreference_mode: REQUIRED\nreference_asset: reference/jeffrey-reference.jpg\nreference_sha256: ${sha(projectReference)}\nstrategy: QIUZHI_THREE_RANKED_DIRECT_COVERS\nrequired_generated_candidate_count: 3\nrequired_physical_cover_count: 3\nrequired_logical_cover_usage_count: 7\npublish_priority: "01>02>03"\ndefault_publish_candidate: cover-01-qiuzhi-9x16\n---\n\n## 01｜秋芝方向｜最推荐\n- 模板族：角色戏剧\n\n## 02｜秋芝方向｜第二推荐\n- 模板族：现实动作\n\n## 03｜秋芝方向｜第三推荐\n- 模板族：符号隐喻\n`);
  const cover01 = join(episode, '05-封面/cover-01-qiuzhi-9x16.png');
  const cover02 = join(episode, '05-封面/cover-02-qiuzhi-9x16.png');
  const cover03 = join(episode, '05-封面/cover-03-qiuzhi-9x16.png');
  execFileSync('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=purple:s=180x320', '-frames:v', '1', cover01]);
  const oneCover = run('status');
  if (oneCover.status !== 0 || !oneCover.stdout.includes('缺秋芝9:16排序候选：02、03') || oneCover.stdout.includes('- [x] ⑥')) throw new Error(oneCover.stderr || oneCover.stdout || '只有01时⑥必须保持未完成');
  execFileSync('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=green:s=180x320', '-frames:v', '1', cover02]);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=orange:s=180x320', '-frames:v', '1', cover03]);
  const missingPlatformCovers = run('status');
  if (missingPlatformCovers.status !== 0 || !missingPlatformCovers.stdout.includes('缺默认01共享真实封面') || missingPlatformCovers.stdout.includes('- [x] ⑥')) throw new Error(missingPlatformCovers.stderr || missingPlatformCovers.stdout || '只有3张9:16候选时⑥必须等待3张共享真实尺寸封面');
  const platformCoverFixtures = [
    ['cover-01-qiuzhi-3x4.png', '180x240'],
    ['cover-01-qiuzhi-4x3.png', '240x180'],
    ['cover-01-qiuzhi-16x9.png', '320x180'],
  ];
  for (const [name, size] of platformCoverFixtures) execFileSync('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', `color=c=blue:s=${size}`, '-frames:v', '1', join(episode, '05-封面', name)]);
  const undersizedPlatformCovers = run('status');
  if (undersizedPlatformCovers.status !== 0 || !undersizedPlatformCovers.stdout.includes('必须是1080×1440') || undersizedPlatformCovers.stdout.includes('- [x] ⑥')) throw new Error(undersizedPlatformCovers.stderr || undersizedPlatformCovers.stdout || '同宽高比低分辨率图片不能冒充平台真实尺寸封面');
  const exactPlatformCoverFixtures = [
    ['cover-01-qiuzhi-3x4.png', '1080x1440'],
    ['cover-01-qiuzhi-4x3.png', '1440x1080'],
    ['cover-01-qiuzhi-16x9.png', '1920x1080'],
  ];
  for (const [name, size] of exactPlatformCoverFixtures) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `color=c=blue:s=${size}`, '-frames:v', '1', join(episode, '05-封面', name)]);
  const threeCovers = run('status');
  if (threeCovers.status !== 0 || !threeCovers.stdout.includes('- [x] ⑥') || !threeCovers.stdout.includes('3张共享真实封面齐全')) throw new Error(threeCovers.stderr || threeCovers.stdout || '01—03候选和默认01三张共享尺寸封面齐全后⑥必须完成');

  write(join(episode, '09-导演/director-state.md'), '# V5\nmethod: V5\nworkflow_revision: V5.1\ndirector_draft: COMPLETED\ndirector_review: COMPLETED\nstatus: READY_FOR_IMPLEMENTATION\n\n## 最终导演复审\ndirector_review: COMPLETED\n');
  const sourceManifestPath = join(episode, '09-导演/source-manifest.json');
  json(sourceManifestPath, sourceManifest());
  json(join(episode, '06-拍摄素材/shooting-record.json'), {script_sha256: sha(join(episode, '01-口播稿.md')), raw_sha256: sha(join(episode, '06-拍摄素材/raw.mp4'))});

  const noRequests = run('next');
  if (noRequests.status !== 0) throw new Error(noRequests.stderr || noRequests.stdout || '无素材请求路由失败');
  assert.match(noRequests.stdout, /prompt_id: 09-candidate/);
  assert.match(noRequests.stdout, /window_rule: MUST_CREATE/);
  assert.match(noRequests.stdout, new RegExp('prompt_file: ' + testRoot.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/docs/固定提示词/09-成片candidate制作.md'));
  const noRequestsStatus = run('status');
  assert.equal(noRequestsStatus.status, 0, noRequestsStatus.stderr || noRequestsStatus.stdout);
  assert.match(noRequestsStatus.stdout, /prompt_id: 09-candidate/);
  assert.match(noRequestsStatus.stdout, /window_rule: MUST_CREATE/);

  json(promptManifestPath, {schema_version: 0, executable_prompt_count: 0, prompts: []});
  const drift = run('next');
  assert.notEqual(drift.status, 0, '无效 Prompt manifest 必须停止');
  assert.match(drift.stdout + drift.stderr, /PROMPT_SKILL_CONTRACT_DRIFT/);
  assert.doesNotMatch(drift.stdout + drift.stderr, /at file:|node:internal\/modules/);
  json(promptManifestPath, promptManifest());

  json(sourceManifestPath, sourceManifest({network: true}));
  const networkOnly = run('next');
  if (networkOnly.status !== 0) throw new Error(networkOnly.stderr || networkOnly.stdout || '网络素材路由失败');
  assert.match(networkOnly.stdout, /prompt_id: 07-network/);

  json(join(episode, '10-素材/real-media-status.json'), mediaStatus(sourceManifestPath, 'NOT_NEEDED', 'NOT_NEEDED'));
  const requiredNetworkNotNeeded = run('next');
  assert.match(requiredNetworkNotNeeded.stdout, /prompt_id: 07-network/);
  assert.doesNotMatch(requiredNetworkNotNeeded.stdout, /prompt_id: 09-candidate/);

  json(sourceManifestPath, sourceManifest({network: true, capture: true}));
  const outputAfterEditPrep = run('next').stdout;
  assert.match(outputAfterEditPrep, /prompt_id: 07-network/);
  assert.doesNotMatch(outputAfterEditPrep, /next_scope: ⑧—⑪|next_scope: ⑧—⑫/);

  json(join(episode, '10-素材/real-media-status.json'), mediaStatus(sourceManifestPath, 'COMPLETED', 'NOT_NEEDED'));
  const requiredCaptureNotNeeded = run('next');
  assert.match(requiredCaptureNotNeeded.stdout, /prompt_id: 08-local-capture/);
  assert.doesNotMatch(requiredCaptureNotNeeded.stdout, /prompt_id: 09-candidate/);

  json(join(episode, '10-素材/real-media-status.json'), mediaStatus(sourceManifestPath, 'COMPLETED', 'WAITING'));
  const outputAfterNetwork = run('next').stdout;
  assert.match(outputAfterNetwork, /prompt_id: 08-local-capture/);

  json(join(episode, '10-素材/real-media-status.json'), mediaStatus(sourceManifestPath, 'COMPLETED', 'COMPLETED'));
  const outputAfterMaterials = run('next').stdout;
  assert.match(outputAfterMaterials, /prompt_id: 09-candidate/);
  json(join(episode, '10-素材/real-media-status.json'), mediaStatus(sourceManifestPath, 'COMPLETED', 'COMPLETED', {emptyTasks: true}));
  const emptyCompletedTasks = run('next');
  assert.match(emptyCompletedTasks.stdout, /prompt_id: 07-network/);
  assert.doesNotMatch(emptyCompletedTasks.stdout, /prompt_id: 09-candidate/);
  json(join(episode, '10-素材/real-media-status.json'), mediaStatus(sourceManifestPath, 'COMPLETED', 'COMPLETED'));
  write(join(episode, '11-动画/candidates/remotion-v1.mp4'), 'candidate');
  json(join(episode, '11-动画/render-manifest.json'), {version: 7, viewer_verdict: 'PENDING', selected_candidate: null, candidates: [{path: 'candidates/remotion-v1.mp4', sha256: sha(join(episode, '11-动画/candidates/remotion-v1.mp4')), director_state_sha256: sha(join(episode, '09-导演/director-state.md')), technical_qa: 'PASS'}]});
  const migrationPath = join(episode, '00-编排/v5-pending-candidate-workflow-migration.json');
  json(migrationPath, {schema_version: 1, status: 'MIGRATED_DURING_V5_PENDING_CANDIDATE_WORKFLOW_REVISION', preserved_candidate_path: '11-动画/candidates/remotion-v1.mp4', preserved_candidate_sha256: sha(join(episode, '11-动画/candidates/remotion-v1.mp4')), preserved_director_state_sha256: sha(join(episode, '09-导演/director-state.md'))});
  const migratedConfig = JSON.parse(readFileSync(join(episode, 'episode-config.json'), 'utf8'));
  migratedConfig.motion_director_contract = {workflow_revision: 'V5.1', director_review_required: true, director_review_migration: {mode: 'FROZEN_PENDING_CANDIDATE_PREDATES_V5_1_STATE_FIELDS', record_path: '00-编排/v5-pending-candidate-workflow-migration.json'}};
  json(join(episode, 'episode-config.json'), migratedConfig);
  const migratedReview = run('next');
  if (migratedReview.status !== 0 || !migratedReview.stdout.includes('JEFFREY_REVIEW') || migratedReview.stdout.includes('HANDOFF_TO_CODEX')) throw new Error(migratedReview.stderr || migratedReview.stdout || '冻结的pending candidate必须停在Jeffrey验收，不得倒退到D1/D2或重新生产');

  const automatedInput = JSON.parse(readFileSync(inputRecordPath, 'utf8'));
  automatedInput.automation = {mode: 'FULL_PIPELINE_TO_PUBLISH', scopes: ['DEFAULT_COVER_RANK_01', 'AGENT_PROXY_FINAL_SELECTION', 'FOUR_PLATFORM_AUTO_PUBLISH', 'SCHEDULE_T_PLUS_N_RETRO']};
  json(inputRecordPath, automatedInput);
  const automatedConfig = JSON.parse(readFileSync(join(episode, 'episode-config.json'), 'utf8'));
  const automationNote = '本期从真人未剪辑视频开始全自动制作并发布四个平台';
  const automationAuth = {authorized_by: 'Jeffrey', authorized_at: now, authorization_note: automationNote};
  automatedConfig.workflow_mode = 'AUTONOMOUS_RUN';
  automatedConfig.episode_entry_contract.record_sha256 = sha(inputRecordPath);
  automatedConfig.automation_contract = {
    mode: 'FULL_PIPELINE_TO_PUBLISH',
    ...automationAuth,
    input_record_path: '00-编排/user-provided-inputs.json',
    input_record_sha256: sha(inputRecordPath),
    scopes: ['DEFAULT_COVER_RANK_01', 'AGENT_PROXY_FINAL_SELECTION', 'FOUR_PLATFORM_AUTO_PUBLISH', 'SCHEDULE_T_PLUS_N_RETRO']
  };
  automatedConfig.final_selection_contract = {mode: 'AGENT_PROXY', ...automationAuth};
  automatedConfig.cover_schedule = {mode: 'AUTO_DEFAULT_RANK_01_AFTER_CANDIDATE', ...automationAuth};
  json(join(episode, 'episode-config.json'), automatedConfig);
  const automatedReview = run('next');
  if (automatedReview.status !== 0 || !automatedReview.stdout.includes('AUTO_CONTINUE_FULL_PIPELINE') || !automatedReview.stdout.includes('AGENT_PROXY') || automatedReview.stdout.includes('JEFFREY_REVIEW')) throw new Error(automatedReview.stderr || automatedReview.stdout || '完整自动化授权的pending candidate必须回到09完成代理验收，不得停在Jeffrey验收');
  assert.match(automatedReview.stdout, /prompt_id: 09-candidate/);
  assert.doesNotMatch(automatedReview.stdout, /生成默认rank 01|创建schema 8发布包|--auto-publish/);

  write(join(testRoot, 'scripts/check-episode-contract.sh'), '#!/usr/bin/env bash\necho "PASS $2"\n');
  chmodSync(join(testRoot, 'scripts/check-episode-contract.sh'), 0o755);
  for (const [name] of platformCoverFixtures) rmSync(join(episode, '05-封面', name));
  write(join(episode, '07-剪辑/final.mp4'), 'candidate');
  json(join(episode, '11-动画/render-manifest.json'), {version: 7, viewer_verdict: 'ACCEPTED', selected_candidate: 'candidates/remotion-v1.mp4', candidates: [{path: 'candidates/remotion-v1.mp4', sha256: sha(join(episode, '07-剪辑/final.mp4')), director_state_sha256: sha(join(episode, '09-导演/director-state.md')), technical_qa: 'PASS'}]});
  const coverAfterAgentAcceptance = run('next');
  assert.match(coverAfterAgentAcceptance.stdout, /prompt_id: 03-cover/);
  for (const [name, size] of exactPlatformCoverFixtures) execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', `color=c=blue:s=${size}`, '-frames:v', '1', join(episode, '05-封面', name)]);
  const finalizeAfterCover = run('next');
  assert.match(finalizeAfterCover.stdout, /prompt_id: 10-finalize/);
  write(join(episode, '00-编排/task-handoffs.jsonl'), JSON.stringify({prompt_id: '10-finalize', event: 'COMPLETED', result: 'COMPLETED', artifact_gate: 'PASS', completed_at: now}) + '\n');
  const publishAfterFinalize = run('next');
  assert.match(publishAfterFinalize.stdout, /prompt_id: 11-publish/);

  write(join(testRoot, 'scripts/check-episode-contract.sh'), '#!/usr/bin/env bash\necho "PASS $2"\n');
  chmodSync(join(testRoot, 'scripts/check-episode-contract.sh'), 0o755);
  write(join(episode, '07-剪辑/final.mp4'), 'candidate');
  json(join(episode, '11-动画/render-manifest.json'), {version: 7, viewer_verdict: 'ACCEPTED', selected_candidate: 'candidates/remotion-v1.mp4', candidates: [{path: 'candidates/remotion-v1.mp4', sha256: sha(join(episode, '07-剪辑/final.mp4')), director_state_sha256: sha(join(episode, '09-导演/director-state.md')), technical_qa: 'PASS'}]});
  const finalSha = sha(join(episode, '07-剪辑/final.mp4'));
  const receipt = (platform, overrides = {}) => ({
    platform,
    source: 'ADAPTER_VERIFIED_RECEIPT',
    receipt_id: `${platform}-receipt-001`,
    platform_title: `${platform} 标题`,
    published_at: now,
    recorded_at: now,
    final_sha256: finalSha,
    authorized_by: 'Jeffrey',
    authorized_at: now,
    authorization_note: automationNote,
    bound_input_record_sha256: sha(inputRecordPath),
    auto_publish_authorized: true,
    publish_result: 'PUBLISHED',
    ...overrides,
  });
  for (const platform of ['douyin', 'weixin_channels', 'xiaohongshu', 'bilibili']) write(join(episode, `12-发布/${platform}-publish-results.jsonl`), JSON.stringify(receipt(platform, {source: undefined})) + '\n');
  const missingReceiptSource = run('status');
  if (missingReceiptSource.status !== 0 || missingReceiptSource.stdout.includes('- [x] ⑫')) throw new Error(missingReceiptSource.stderr || missingReceiptSource.stdout || '缺 ADAPTER_VERIFIED_RECEIPT source 的回执不得完成⑫');
  for (const platform of ['douyin', 'weixin_channels', 'xiaohongshu', 'bilibili']) write(join(episode, `12-发布/${platform}-publish-results.jsonl`), JSON.stringify(receipt(platform, {source: 'user-confirmed'})) + '\n');
  const wrongReceiptSource = run('status');
  if (wrongReceiptSource.status !== 0 || wrongReceiptSource.stdout.includes('- [x] ⑫')) throw new Error(wrongReceiptSource.stderr || wrongReceiptSource.stdout || '错误 source 的自动回执不得完成⑫');
  const malformedReceipts = {
    douyin: receipt('douyin', {platform: undefined}),
    weixin_channels: receipt('weixin_channels', {receipt_id: undefined}),
    xiaohongshu: receipt('xiaohongshu', {published_at: undefined}),
    bilibili: receipt('bilibili', {platform_title: undefined}),
  };
  for (const [platform, value] of Object.entries(malformedReceipts)) write(join(episode, `12-发布/${platform}-publish-results.jsonl`), JSON.stringify(value) + '\n');
  const incompleteReceipts = run('status');
  if (incompleteReceipts.status !== 0 || incompleteReceipts.stdout.includes('- [x] ⑫')) throw new Error(incompleteReceipts.stderr || incompleteReceipts.stdout || '缺归一化字段的回执不得完成⑫');
  for (const platform of ['douyin', 'weixin_channels', 'xiaohongshu', 'bilibili']) {
    const path = join(episode, `12-发布/${platform}-publish-results.jsonl`);
    write(path, JSON.stringify(receipt(platform)) + '\n' + JSON.stringify(receipt(platform, {publish_result: 'FAILED'})) + '\n');
  }
  const publishedStatus = run('status');
  if (publishedStatus.status !== 0 || !publishedStatus.stdout.includes('- [x] ⑫') || !publishedStatus.stdout.includes('四平台自动发布归一化回执均已绑定当前final与本期授权')) throw new Error(publishedStatus.stderr || publishedStatus.stdout || '四平台真实PUBLISHED回执齐全后⑫必须完成');

  console.log('PASS laohan-bianpai manual review and FULL_PIPELINE_TO_PUBLISH routing');
} finally {
  rmSync(testRoot, {recursive: true, force: true});
}
