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
const workspaceArg = valueOf('--workspace');
const queries = valuesOf('--query');
const limit = Number(valueOf('--limit') || 10);
if (Boolean(episodeArg) === Boolean(workspaceArg) || !queries.length || queries.some((query) => !query.trim() || query.trim().startsWith('-')) || !Number.isInteger(limit) || limit < 1 || limit > 30) throw new Error('用法: search-evidence.mjs --episode episodes/<slug> | --workspace <研究目录> --query 关键词 [--query 关键词] [--limit 1-30]');
const episode = resolve(episodeArg || workspaceArg);
if (!existsSync(episode) || !statSync(episode).isDirectory() || (episodeArg && !existsSync(join(episode, 'episode-config.json')))) throw new Error('研究目录不存在或episode缺 episode-config.json');

const run = (commandArgs, timeout = 90000) => spawnSync('opencli', commandArgs, {encoding: 'utf8', timeout, maxBuffer: 16 * 1024 * 1024});
const processError = (result, fallback) => String(result.error?.code || result.error?.message || result.stderr || result.stdout || result.signal || fallback || `exit ${result.status}`).trim();
const unwrap = (payload) => {
  if (payload?.ok === false) throw new Error('OpenCLI返回失败终态: ' + (typeof payload.error === 'string' ? payload.error : payload.error?.message || payload.error?.code || '未提供原因'));
  return payload?.ok === true ? payload.data : payload;
};
const versionRun = run(['--version'], 15000);
const doctorRun = run(['doctor'], 30000);
const whoamiRun = run(['douyin', 'whoami', '-f', 'json'], 30000);
let whoami = null;
let whoamiError = '';
if (whoamiRun.status === 0) {
  try { whoami = unwrap(JSON.parse(whoamiRun.stdout)); } catch (error) { whoamiError = error instanceof SyntaxError ? 'OpenCLI whoami JSON解析失败' : error.message; }
}
const version = versionRun.status === 0 ? versionRun.stdout.trim().replace(/^opencli\s+v?/i, '') : 'unknown';
const doctorStatus = doctorRun.status === 0 ? 'PASS' : 'FAILED';
const loggedIn = whoami?.logged_in === true;
const preflightErrors = [
  versionRun.status === 0 ? '' : processError(versionRun, 'opencli --version 失败'),
  doctorRun.status === 0 ? '' : processError(doctorRun, 'opencli doctor 失败'),
  whoamiRun.status === 0 ? whoamiError : processError(whoamiRun, 'opencli douyin whoami 失败'),
  whoamiRun.status === 0 && !whoamiError && !loggedIn ? 'OpenCLI 抖音未登录' : ''
].filter(Boolean);
const preflightAvailable = versionRun.status === 0 && doctorRun.status === 0 && whoamiRun.status === 0 && !whoamiError && loggedIn;
const sha = (value) => createHash('sha256').update(value).digest('hex');
const records = [];
for (const query of queries) {
  const attemptedAt = new Date().toISOString();
  const commandArgs = ['douyin', 'search', query, '--limit', String(limit), '-f', 'json'];
  const command = ['opencli', ...commandArgs.map((item) => /\s/.test(item) ? JSON.stringify(item) : item)].join(' ');
  if (!preflightAvailable) {
    records.push({query, command, attempted_at: attemptedAt, status: 'FAILED', result_count: 0, error: `OpenCLI 预检不可用: ${preflightErrors.join(' | ')}`, results: []});
    continue;
  }
  const result = run(commandArgs);
  if (![0, 66].includes(result.status)) {
    records.push({query, command, attempted_at: attemptedAt, status: 'FAILED', result_count: 0, error: processError(result), results: []});
    continue;
  }
  try {
    if (result.status === 0 && !result.stdout.trim()) throw new Error('成功退出但没有JSON输出');
    const payload = unwrap(result.stdout.trim() ? JSON.parse(result.stdout) : []);
    if (!Array.isArray(payload)) throw new Error('返回值不是数组');
    const normalized = payload.map((item, index) => {
      const rank = Number.isInteger(item?.rank) && item.rank > 0 ? item.rank : index + 1;
      const desc = typeof item?.desc === 'string' && item.desc.trim() ? item.desc.trim() : '不可用';
      const author = typeof item?.author === 'string' && item.author.trim() ? item.author.trim() : '不可用';
      const url = typeof item?.url === 'string' ? item.url.trim() : '';
      const explicitAwemeId = [item?.aweme_id, item?.awemeId].find((value) => typeof value === 'string' || typeof value === 'number');
      const awemeId = explicitAwemeId != null ? String(explicitAwemeId) : url.match(/\/video\/(\d+)/)?.[1] || null;
      const publishedAt = item?.published_at ?? item?.create_time ?? null;
      const available = (key) => typeof item?.[key] === 'number' && Number.isFinite(item[key]);
      return {
        id: awemeId || sha([url, desc].join('\n')).slice(0, 12),
        aweme_id: awemeId,
        rank,
        desc,
        author,
        url,
        published_at: publishedAt,
        plays: available('plays') ? item.plays : null,
        likes: available('likes') ? item.likes : null,
        comments: available('comments') ? item.comments : null,
        shares: available('shares') ? item.shares : null,
        field_availability: {
          published_at: publishedAt != null,
          plays: available('plays'),
          likes: available('likes'),
          comments: available('comments'),
          shares: available('shares')
        }
      };
    });
    records.push({query, command, attempted_at: attemptedAt, status: normalized.length ? 'OK' : 'EMPTY_OR_FIELD_UNAVAILABLE', result_count: normalized.length, results: normalized});
  } catch (error) {
    records.push({query, command, attempted_at: attemptedAt, status: 'FAILED', result_count: 0, error: `${error instanceof SyntaxError ? 'JSON解析失败' : 'OpenCLI协议失败'}: ${error.message}`, results: []});
  }
}

const collectedAt = new Date().toISOString();
const availabilityStatus = preflightAvailable && records.some((item) => item.status !== 'FAILED') ? 'AVAILABLE' : 'UNAVAILABLE';
const evidence = {schema_version: 1, episode: basename(episode), collected_at: collectedAt, executor: {name: 'opencli', version, doctor_status: doctorStatus, extension_connected: doctorRun.status === 0 && /Extension:\s+connected/.test(doctorRun.stdout), logged_in: loggedIn, availability_status: availabilityStatus, account: loggedIn ? {id: String(whoami.id || ''), username: String(whoami.username || '')} : null, ...(preflightErrors.length ? {preflight_error: preflightErrors.join(' | ')} : {})}, queries: records};
const jsonPath = join(episode, '00-抖音搜索证据.json');
const jsonTmp = jsonPath + '.tmp';
writeFileSync(jsonTmp, JSON.stringify(evidence, null, 2) + '\n');
renameSync(jsonTmp, jsonPath);

const lines = ['# 抖音关键词搜索证据', '', `- 执行时间：${collectedAt}`, `- OpenCLI：${version}`, `- 登录状态：${loggedIn ? '已验证' : '不可用'}`, `- 本次搜索执行状态（含合法空结果）：${availabilityStatus}`, ''];
for (const record of records) {
  lines.push(`## ${record.query}`, '', `- 状态：${record.status}`, `- 实际条数：${record.result_count}`, `- 命令：\`${record.command}\``, '');
  if (record.status === 'FAILED') lines.push(`- 错误：${record.error}`, '');
  else if (record.status === 'EMPTY_OR_FIELD_UNAVAILABLE') lines.push('- 返回合法空结果；只能判定平台证据未决，不能判定无人做。', '');
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
