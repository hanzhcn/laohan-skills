#!/usr/bin/env node
// laohan-douyinsousuo 包装器回归（node --test tests/test-search-evidence.mjs）
//
// 覆盖 2026-11-23 判例：`opencli douyin search` 报 COMMAND_EXEC「did not render result cards within the timeout」
// 属平台侧瞬时降级（同命令 20 分钟后重放 4 次全成功）。包装器必须：
//   1) 对该类瞬时错误退避重试，恢复后记 OK；
//   2) 持续失败时恰好尝试 3 次后记 FAILED，且每次失败保留 trace 现场；
//   3) 非瞬时错误（登录/桥接/协议失败）不重试；
//   4) 每次搜索都带 --trace retain-on-failure。
// 用 PATH 前置的假 opencli 复现真实返回形态，不访问网络。
import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const SKILL = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// SEARCH_EVIDENCE_WRAPPER 可指向任意版本的包装器（用于在修复前的原件上验证本检查确实会失败）。
const WRAPPER = process.env.SEARCH_EVIDENCE_WRAPPER || join(SKILL, 'scripts', 'search-evidence.mjs');
const TRANSIENT_ERROR = JSON.stringify({ok: false, error: {code: 'COMMAND_EXEC', message: 'Douyin search did not render result cards within the timeout. Open the same search in Chrome and verify login/security state before retrying.', exitCode: 1}});
const SUCCESS = JSON.stringify({ok: true, data: [{rank: 1, desc: '样本', author: '作者', url: 'https://www.douyin.com/video/7000000000000000000', plays: 0, likes: 12, comments: 0, shares: 0}]});

// 假 opencli：按调用序号与 FAKE_MODE 返回；日志记录每次完整参数，供断言重试次数与 trace 参数。
const FAKE = `#!/bin/bash
echo "$*" >> "$FAKE_LOG"
case "$1" in
  --version) echo "2.0.3"; exit 0;;
  doctor) echo "opencli 2.0.3"; echo "Daemon: running"; echo "Extension: connected"; exit 0;;
  douyin)
    [ "$2" = "whoami" ] && { echo '{"ok":true,"data":{"logged_in":true,"id":"1","username":"fake"}}'; exit 0; }
    [ "$2" = "search" ] || { echo "unexpected" >&2; exit 2; }
    n=$(grep -c "^douyin search" "$FAKE_LOG")
    case "$FAKE_MODE" in
      transient-once)
        if [ "$n" -ge 2 ]; then echo '${SUCCESS}'; exit 0; fi
        echo '${TRANSIENT_ERROR}'; echo "OpenCLI trace artifact: /tmp/fake-trace-$n" >&2; exit 1;;
      transient-always) echo '${TRANSIENT_ERROR}'; echo "OpenCLI trace artifact: /tmp/fake-trace-$n" >&2; exit 1;;
      auth) echo '{"ok":false,"error":{"code":"AUTH_REQUIRED","message":"login required"}}'; exit 77;;
      browser) echo '{"ok":false,"error":{"code":"BROWSER_CONNECT","message":"bridge down"}}'; exit 69;;
      protocol) exit 0;;
    esac;;
esac
exit 2
`;

function runWrapper(mode, {backoff = '0,0'} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'douyin-search-test-'));
  const bin = join(root, 'bin');
  const workspace = join(root, 'ws');
  mkdirSync(bin);
  mkdirSync(workspace);
  writeFileSync(join(bin, 'opencli'), FAKE, {mode: 0o755});
  const log = join(root, 'calls.log');
  const env = {...process.env, PATH: `${bin}:${process.env.PATH}`, FAKE_LOG: log, FAKE_MODE: mode};
  if (backoff === null) delete env.DOUYIN_SEARCH_BACKOFF_MS;
  else env.DOUYIN_SEARCH_BACKOFF_MS = backoff;
  const run = spawnSync(process.execPath, [WRAPPER, '--workspace', workspace, '--query', '关键词', '--limit', '5'], {encoding: 'utf8', env, timeout: 60000});
  const evidence = JSON.parse(readFileSync(join(workspace, '00-抖音搜索证据.json'), 'utf8'));
  const markdown = readFileSync(join(workspace, '00-抖音搜索证据.md'), 'utf8');
  const calls = readFileSync(log, 'utf8').trim().split('\n');
  return {root, run, evidence, markdown, searchCalls: calls.filter((call) => call.startsWith('douyin search'))};
}

function withWrapper(mode, options, check) {
  const state = runWrapper(mode, options);
  try {
    check(state);
  } finally {
    rmSync(state.root, {recursive: true, force: true});
  }
}

test('瞬时失败一次后重试成功：记 OK，保留两次尝试记录与失败现场路径', () => {
  withWrapper('transient-once', {}, ({run, evidence, searchCalls}) => {
    assert.equal(run.status, 0, run.stderr);
    const [record] = evidence.queries;
    assert.equal(record.status, 'OK');
    assert.equal(record.result_count, 1);
    assert.equal(searchCalls.length, 2);
    assert.equal(record.attempts?.length, 2);
    assert.match(record.attempts[0].error, /did not render result cards within the timeout/);
    assert.equal(record.attempts[0].trace_dir, '/tmp/fake-trace-1');
    assert.equal(record.attempts[1].error, undefined);
    assert.equal(evidence.executor.availability_status, 'AVAILABLE');
  });
});

test('持续瞬时失败：恰好尝试 3 次后记 FAILED，每次失败都有 trace 现场，整体 UNAVAILABLE', () => {
  withWrapper('transient-always', {}, ({run, evidence, markdown, searchCalls}) => {
    assert.equal(run.status, 0, run.stderr);
    const [record] = evidence.queries;
    assert.equal(record.status, 'FAILED');
    assert.equal(record.result_count, 0);
    assert.deepEqual(record.results, []);
    assert.equal(searchCalls.length, 3);
    assert.equal(record.attempts?.length, 3);
    assert.ok(record.attempts.every((attempt) => attempt.trace_dir?.startsWith('/tmp/fake-trace-')));
    assert.match(record.error, /did not render result cards within the timeout/);
    assert.equal(evidence.executor.availability_status, 'UNAVAILABLE');
    assert.match(markdown, /错误：/);
  });
});

test('非瞬时错误不重试：登录缺失(77)、桥接断开(69)、协议失败(0 无输出) 都只尝试一次', () => {
  for (const [mode, expected] of [['auth', /AUTH_REQUIRED|login required/], ['browser', /BROWSER_CONNECT|bridge down/], ['protocol', /协议失败|没有JSON输出/]]) {
    withWrapper(mode, {}, ({evidence, searchCalls}) => {
      const [record] = evidence.queries;
      assert.equal(searchCalls.length, 1, mode);
      assert.equal(record.status, 'FAILED', mode);
      assert.equal(record.attempts?.length, 1, mode);
      assert.match(record.error, expected, mode);
    });
  }
});

test('每次搜索都带 --trace retain-on-failure，且命令字符串如实反映', () => {
  withWrapper('transient-once', {}, ({evidence, searchCalls}) => {
    assert.ok(searchCalls.every((call) => call.endsWith('--trace retain-on-failure')), JSON.stringify(searchCalls));
    assert.match(evidence.queries[0].command, /--trace retain-on-failure$/);
  });
});

test('默认退避为 30 秒、60 秒（测试用环境变量覆盖为 0，不实际等待）', () => {
  const source = readFileSync(process.env.SEARCH_EVIDENCE_WRAPPER || WRAPPER, 'utf8');
  assert.match(source, /'30000',\s*'60000'/);
  assert.match(source, /DOUYIN_SEARCH_BACKOFF_MS/);
});
