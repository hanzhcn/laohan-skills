#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {existsSync, renameSync, statSync, writeFileSync} from 'node:fs';
import {basename, join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const args = process.argv.slice(2);
const valueOf = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};
const valuesOf = (name) => args.flatMap((item, index) => item === name && args[index + 1] ? [args[index + 1]] : []);
const episodeArg = valueOf('--episode');
const queries = valuesOf('--query');
const limit = Number(valueOf('--limit') || 10);
if (!episodeArg || !queries.length || !Number.isInteger(limit) || limit < 1 || limit > 30) throw new Error('用法: search-evidence.mjs --episode episodes/<slug> --query 关键词 [--query 关键词] [--limit 1-30]');
const episode = resolve(episodeArg);
if (!existsSync(episode) || !statSync(episode).isDirectory() || !existsSync(join(episode, 'episode-config.json'))) throw new Error('episode 不存在或缺 episode-config.json');

const run = (commandArgs, timeout = 90000) => spawnSync('opencli', commandArgs, {encoding: 'utf8', timeout, maxBuffer: 16 * 1024 * 1024});
const versionRun = run(['--version'], 15000);
const doctorRun = run(['doctor'], 30000);
const whoamiRun = run(['douyin', 'whoami', '-f', 'json'], 30000);
if (versionRun.status !== 0 || doctorRun.status !== 0 || whoamiRun.status !== 0) throw new Error('OpenCLI 预检失败: ' + String(versionRun.stderr || doctorRun.stderr || whoamiRun.stderr || '').trim());
let whoami;
try { whoami = JSON.parse(whoamiRun.stdout); } catch { throw new Error('OpenCLI whoami 不是合法 JSON'); }
if (whoami?.logged_in !== true) throw new Error('OpenCLI 抖音未登录，拒绝搜索');

const version = versionRun.stdout.trim().replace(/^opencli\s+v?/i, '');
const sha = (value) => createHash('sha256').update(value).digest('hex');
const records = [];
for (const query of queries) {
  const attemptedAt = new Date().toISOString();
  const commandArgs = ['douyin', 'search', query, '--limit', String(limit), '-f', 'json'];
  const command = ['opencli', ...commandArgs.map((item) => /\s/.test(item) ? JSON.stringify(item) : item)].join(' ');
  const result = run(commandArgs);
  if (result.status !== 0) {
    records.push({query, command, attempted_at: attemptedAt, status: 'FAILED', result_count: 0, error: String(result.stderr || result.stdout || `exit ${result.status}`).trim(), results: []});
    continue;
  }
  try {
    const payload = result.stdout.trim() ? JSON.parse(result.stdout) : [];
    if (!Array.isArray(payload)) throw new Error('返回值不是数组');
    const normalized = payload.map((item, index) => {
      const rank = Number.isInteger(item?.rank) && item.rank > 0 ? item.rank : index + 1;
      const desc = typeof item?.desc === 'string' && item.desc.trim() ? item.desc.trim() : '不可用';
      const author = typeof item?.author === 'string' && item.author.trim() ? item.author.trim() : '不可用';
      const url = typeof item?.url === 'string' ? item.url.trim() : '';
      return {
        id: sha([query, rank, url, desc].join('\n')).slice(0, 12),
        rank,
        desc,
        author,
        url,
        plays: Number.isFinite(item?.plays) ? item.plays : null,
        likes: Number.isFinite(item?.likes) ? item.likes : null,
        comments: Number.isFinite(item?.comments) ? item.comments : null,
        shares: Number.isFinite(item?.shares) ? item.shares : null
      };
    });
    records.push({query, command, attempted_at: attemptedAt, status: normalized.length ? 'OK' : 'EMPTY_OR_FIELD_UNAVAILABLE', result_count: normalized.length, results: normalized});
  } catch (error) {
    records.push({query, command, attempted_at: attemptedAt, status: 'FAILED', result_count: 0, error: `JSON 解析失败: ${error.message}`, results: []});
  }
}

const collectedAt = new Date().toISOString();
const evidence = {schema_version: 1, episode: basename(episode), collected_at: collectedAt, executor: {name: 'opencli', version, doctor_status: 'PASS', extension_connected: /Extension:\s+connected/.test(doctorRun.stdout), logged_in: true, account: {id: String(whoami.id || ''), username: String(whoami.username || '')}}, queries: records};
const jsonPath = join(episode, '00-抖音搜索证据.json');
const jsonTmp = jsonPath + '.tmp';
writeFileSync(jsonTmp, JSON.stringify(evidence, null, 2) + '\n');
renameSync(jsonTmp, jsonPath);

const lines = ['# 抖音关键词搜索证据', '', `- 执行时间：${collectedAt}`, `- OpenCLI：${version}`, `- 登录状态：已验证`, ''];
for (const record of records) {
  lines.push(`## ${record.query}`, '', `- 状态：${record.status}`, `- 实际条数：${record.result_count}`, `- 命令：\`${record.command}\``, '');
  if (record.status === 'FAILED') lines.push(`- 错误：${record.error}`, '');
  else if (record.status === 'EMPTY_OR_FIELD_UNAVAILABLE') lines.push('- 返回合法空数组；只能判定平台证据未决，不能判定无人做。', '');
  else {
    lines.push('| # | 作者 | 点赞 | 标题 | 链接 |', '|---|---|---:|---|---|');
    for (const item of record.results) lines.push(`| ${item.rank} | ${item.author.replaceAll('|', '\\|')} | ${item.likes ?? '不可用'} | ${item.desc.replaceAll('|', '\\|').replaceAll('\n', ' ')} | [原视频](${item.url}) |`);
    lines.push('');
  }
}
const mdPath = join(episode, '00-抖音搜索证据.md');
const mdTmp = mdPath + '.tmp';
writeFileSync(mdTmp, lines.join('\n') + '\n');
renameSync(mdTmp, mdPath);

console.log(`json=${jsonPath}`);
console.log(`markdown=${mdPath}`);
console.log(`queries=${records.length} ok=${records.filter((item) => item.status === 'OK').length} empty=${records.filter((item) => item.status === 'EMPTY_OR_FIELD_UNAVAILABLE').length} failed=${records.filter((item) => item.status === 'FAILED').length}`);
if (records.every((item) => item.status === 'FAILED')) process.exitCode = 1;
