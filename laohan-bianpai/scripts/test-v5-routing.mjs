#!/usr/bin/env node
import {createHash} from 'node:crypto';
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

try {
  write(join(testRoot, 'scripts/check-episode-contract.sh'), '#!/usr/bin/env bash\nif [ "$2" = "accepted-final" ]; then exit 1; fi\necho "PASS $2"\n');
  write(join(testRoot, 'scripts/check-workflow-runtime.mjs'), 'console.log("PASS runtime");\n');
  write(join(testRoot, 'scripts/verify-vendor-preflight.mjs'), 'console.log("PASS vendor preflight");\n');
  write(join(testRoot, 'scripts/check-production-dependencies.mjs'), 'console.log("{}");\n');
  write(join(testRoot, 'scripts/sync-content-vendors.sh'), '#!/usr/bin/env bash\nexit 0\n');
  chmodSync(join(testRoot, 'scripts/check-episode-contract.sh'), 0o755);
  chmodSync(join(testRoot, 'scripts/sync-content-vendors.sh'), 0o755);
  write(join(testRoot, 'workflow-runtime-lock.json'), '{}\n');
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
  write(join(episode, '05-封面/cover-prompts.md'), `---\nscript_hash: ${sha(join(episode, '01-口播稿.md'))}\nprompt_executor: cover-prompt-strategy\nimage_provider: fixture\nreference_mode: REQUIRED\nreference_asset: reference/jeffrey-reference.jpg\nreference_sha256: ${sha(projectReference)}\nstrategy: QIUZHI_THREE_RANKED_DIRECT_COVERS\nrequired_generated_candidate_count: 3\npublish_priority: "01>02>03"\ndefault_publish_candidate: cover-01-qiuzhi-9x16\n---\n\n## 01｜秋芝方向｜最推荐\n- 模板族：角色戏剧\n\n## 02｜秋芝方向｜第二推荐\n- 模板族：现实动作\n\n## 03｜秋芝方向｜第三推荐\n- 模板族：符号隐喻\n`);
  const cover01 = join(episode, '05-封面/cover-01-qiuzhi-9x16.png');
  const cover02 = join(episode, '05-封面/cover-02-qiuzhi-9x16.png');
  const cover03 = join(episode, '05-封面/cover-03-qiuzhi-9x16.png');
  execFileSync('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=purple:s=180x320', '-frames:v', '1', cover01]);
  const oneCover = run('status');
  if (oneCover.status !== 0 || !oneCover.stdout.includes('缺秋芝9:16排序候选：02、03') || oneCover.stdout.includes('- [x] ⑥')) throw new Error(oneCover.stderr || oneCover.stdout || '只有01时⑥必须保持未完成');
  execFileSync('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=green:s=180x320', '-frames:v', '1', cover02]);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=orange:s=180x320', '-frames:v', '1', cover03]);
  const threeCovers = run('status');
  if (threeCovers.status !== 0 || !threeCovers.stdout.includes('- [x] ⑥') || !threeCovers.stdout.includes('自动发布默认=cover-01-qiuzhi-9x16.png')) throw new Error(threeCovers.stderr || threeCovers.stdout || '01—03三张9:16齐全后⑥必须完成并默认01');

  write(join(episode, '09-导演/director-state.md'), '# V5旧字段导演稿\nmethod: V5\nstatus: READY_FOR_IMPLEMENTATION\n');
  json(join(episode, '09-导演/source-manifest.json'), {schema_version: 1});
  json(join(episode, '06-拍摄素材/shooting-record.json'), {script_sha256: sha(join(episode, '01-口播稿.md')), raw_sha256: sha(join(episode, '06-拍摄素材/raw.mp4'))});
  write(join(episode, '11-动画/candidates/remotion-v1.mp4'), 'candidate');
  json(join(episode, '11-动画/render-manifest.json'), {version: 7, viewer_verdict: 'PENDING', selected_candidate: null, candidates: [{path: 'candidates/remotion-v1.mp4', sha256: sha(join(episode, '11-动画/candidates/remotion-v1.mp4')), director_state_sha256: sha(join(episode, '09-导演/director-state.md')), technical_qa: 'PASS'}]});
  const migrationPath = join(episode, '00-编排/v5-pending-candidate-workflow-migration.json');
  json(migrationPath, {schema_version: 1, status: 'MIGRATED_DURING_V5_PENDING_CANDIDATE_WORKFLOW_REVISION', preserved_candidate_path: '11-动画/candidates/remotion-v1.mp4', preserved_candidate_sha256: sha(join(episode, '11-动画/candidates/remotion-v1.mp4')), preserved_director_state_sha256: sha(join(episode, '09-导演/director-state.md'))});
  const migratedConfig = JSON.parse(readFileSync(join(episode, 'episode-config.json'), 'utf8'));
  migratedConfig.motion_director_contract = {workflow_revision: 'V5.1', director_review_required: true, director_review_migration: {mode: 'FROZEN_PENDING_CANDIDATE_PREDATES_V5_1_STATE_FIELDS', record_path: '00-编排/v5-pending-candidate-workflow-migration.json'}};
  json(join(episode, 'episode-config.json'), migratedConfig);
  const migratedReview = run('next');
  if (migratedReview.status !== 0 || !migratedReview.stdout.includes('JEFFREY_REVIEW') || migratedReview.stdout.includes('HANDOFF_TO_CODEX')) throw new Error(migratedReview.stderr || migratedReview.stdout || '冻结的pending candidate必须停在Jeffrey验收，不得倒退到D1/D2或重新生产');

  console.log('PASS laohan-bianpai USER_PROVIDED inputs -> D1 -> D2 -> ⑦ + frozen candidate review routing');
} finally {
  rmSync(testRoot, {recursive: true, force: true});
}
