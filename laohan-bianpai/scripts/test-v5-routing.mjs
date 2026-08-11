#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
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
  write(join(testRoot, 'scripts/check-episode-contract.sh'), '#!/usr/bin/env bash\necho "PASS $2"\n');
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

  console.log('PASS laohan-bianpai USER_PROVIDED inputs -> D1 -> D2 -> ⑦ routing');
} finally {
  rmSync(testRoot, {recursive: true, force: true});
}
