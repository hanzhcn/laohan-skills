#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, renameSync, statSync, writeFileSync} from 'node:fs';
import {basename, dirname, isAbsolute, join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const args = process.argv.slice(2);
const valueOf = (name) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};
const episodeArg = valueOf('--episode');
if (!episodeArg) throw new Error('用法: collect-topic-signals.mjs --episode episodes/<slug> [--sources aihot,hackernews,zhihu,weibo,36kr,bilibili,douyin-hot,toutiao,tieba,hupu]');

const episode = resolve(episodeArg);
if (!existsSync(episode) || !statSync(episode).isDirectory() || !existsSync(join(episode, 'episode-config.json'))) throw new Error('episode 不存在或缺 episode-config.json: ' + episode);
if (!isAbsolute(episodeArg) && !episodeArg.includes('episodes/')) throw new Error('episode 必须指向 episodes/<slug>');

const defaultSources = ['aihot', 'hackernews', 'zhihu', 'weibo', '36kr', 'bilibili', 'douyin-hot', 'toutiao', 'tieba', 'hupu'];
const selectedSources = (valueOf('--sources') || defaultSources.join(',')).split(',').map((item) => item.trim()).filter(Boolean);
if (selectedSources.length < 2 || selectedSources.length > 10 || new Set(selectedSources).size !== selectedSources.length) throw new Error('sources 必须是 2—10 个不重复 route');

const sourceDefinitions = {
  aihot: {type: 'http'},
  hackernews: {type: 'opencli', args: ['hackernews', 'top', '--limit', '20', '-f', 'json']},
  zhihu: {type: 'opencli', args: ['zhihu', 'hot', '--limit', '20', '-f', 'json']},
  'douyin-hot': {type: 'opencli', args: ['douyin', 'hashtag', 'hot', '--limit', '30', '-f', 'json']},
  '36kr': {type: 'opencli', args: ['36kr', 'hot', '--limit', '20', '-f', 'json']},
  weibo: {type: 'opencli', args: ['weibo', 'hot', '--limit', '20', '-f', 'json']},
  bilibili: {type: 'opencli', args: ['bilibili', 'hot', '--limit', '20', '-f', 'json']},
  toutiao: {type: 'opencli', args: ['toutiao', 'hot', '--limit', '20', '-f', 'json']},
  tieba: {type: 'opencli', args: ['tieba', 'hot', '--limit', '20', '-f', 'json']},
  hupu: {type: 'opencli', args: ['hupu', 'hot', '--limit', '20', '-f', 'json']}
};
for (const source of selectedSources) if (!sourceDefinitions[source]) throw new Error('未知 source: ' + source);

const sha = (value) => createHash('sha256').update(value).digest('hex');
const nowIso = () => new Date().toISOString();
const stableId = (sourceId, title, url, rawId) => sha([sourceId, String(rawId || ''), title, url].join('\n')).slice(0, 12);
const normalizeArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  for (const key of ['items', 'results', 'data', 'list']) if (Array.isArray(payload?.[key])) return payload[key];
  return [];
};
const normalizeItem = (sourceId, item, index) => {
  const title = String(item?.title ?? item?.name ?? item?.word ?? item?.desc ?? item?.question ?? '').trim();
  const fallbackUrl = sourceId === 'douyin-hot' && title ? `https://www.douyin.com/search/${encodeURIComponent(title)}` : '';
  const url = String(item?.url ?? item?.link ?? item?.permalink ?? fallbackUrl).trim();
  return {
    id: stableId(sourceId, title, url, item?.id ?? item?.aweme_id),
    rank: Number.isInteger(item?.rank) ? item.rank : index + 1,
    title,
    url,
    published_at: item?.publishedAt ?? item?.published_at ?? item?.created_at ?? null,
    raw: item
  };
};

const skillRoot = resolve(dirname(new URL(import.meta.url).pathname), '..');
const trackedCreatorsPath = resolve(process.env.LAOHAN_TRACKED_DOUYIN_CREATORS || join(skillRoot, 'references/tracked-douyin-creators.json'));
const localExpressionPoolPath = join(process.cwd(), 'script-pool/Jeffrey个人表达池.md');
const expressionPoolPath = resolve(process.env.LAOHAN_PERSONAL_EXPRESSION_POOL || (existsSync(localExpressionPoolPath) ? localExpressionPoolPath : join(process.cwd(), 'templates/Jeffrey个人表达池.md')));

function collectTrackedCreators() {
  const attemptedAt = nowIso();
  let creators;
  try {
    const payload = JSON.parse(readFileSync(trackedCreatorsPath, 'utf8'));
    creators = Array.isArray(payload?.creators) ? payload.creators : [];
  } catch (error) {
    return {source_id: 'tracked-douyin-creators', command_or_url: trackedCreatorsPath, attempted_at: attemptedAt, status: 'FAILED', result_count: 0, error: `对标账号清单不可读: ${error.message}`, results: [], coverage: {expected: 9, attempted: 0, completed: 0, failed: 9, accounts: []}};
  }
  const uniqueIds = new Set(creators.map((item) => item?.sec_uid));
  if (creators.length !== 9 || uniqueIds.size !== 9 || creators.some((item) => !String(item?.name || '').trim() || !String(item?.sec_uid || '').trim())) {
    return {source_id: 'tracked-douyin-creators', command_or_url: trackedCreatorsPath, attempted_at: attemptedAt, status: 'FAILED', result_count: 0, error: '对标账号清单必须恰好包含9个唯一且完整的name/sec_uid', results: [], coverage: {expected: 9, attempted: 0, completed: 0, failed: 9, accounts: []}};
  }

  const results = [];
  const accounts = [];
  for (const creator of creators) {
    const args = ['douyin', 'user-videos', creator.sec_uid, '--limit', '20', '--with_comments', 'false', '-f', 'json'];
    let finalRun = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      finalRun = spawnSync('opencli', args, {encoding: 'utf8', timeout: 90000, maxBuffer: 16 * 1024 * 1024});
      if (!finalRun.error && [0, 66].includes(finalRun.status)) break;
    }
    if (finalRun.error || ![0, 66].includes(finalRun.status)) {
      accounts.push({name: creator.name, sec_uid: creator.sec_uid, status: 'FAILED', result_count: 0, error: String(finalRun.error?.message || finalRun.stderr || `exit ${finalRun.status}`).trim()});
      continue;
    }
    try {
      const payload = finalRun.stdout.trim() ? JSON.parse(finalRun.stdout) : [];
      const rawItems = normalizeArray(payload);
      const counts = rawItems.map((item) => Number(item?.statistics?.digg_count ?? item?.digg_count ?? 0)).filter((value) => Number.isFinite(value) && value >= 0).sort((a, b) => a - b);
      const median = counts.length ? (counts[Math.floor((counts.length - 1) / 2)] + counts[Math.ceil((counts.length - 1) / 2)]) / 2 : 0;
      const creatorResults = rawItems.map((item, index) => {
        const normalized = normalizeItem('tracked-douyin-creators', item, index);
        const diggCount = Number(item?.statistics?.digg_count ?? item?.digg_count ?? 0);
        const performanceRatio = median > 0 ? Number((diggCount / median).toFixed(2)) : null;
        return {
          ...normalized,
          url: normalized.url || (item?.aweme_id ? `https://www.douyin.com/video/${item.aweme_id}` : ''),
          creator_name: creator.name,
          creator_sec_uid: creator.sec_uid,
          digg_count: diggCount,
          recent_digg_median: median,
          performance_ratio: performanceRatio,
          anomaly_status: performanceRatio !== null && performanceRatio >= 2 ? 'ANOMALY' : 'NORMAL'
        };
      });
      results.push(...creatorResults);
      accounts.push({name: creator.name, sec_uid: creator.sec_uid, status: creatorResults.length ? 'OK' : 'EMPTY', result_count: creatorResults.length});
    } catch (error) {
      accounts.push({name: creator.name, sec_uid: creator.sec_uid, status: 'FAILED', result_count: 0, error: `JSON 解析失败: ${error.message}`});
    }
  }
  const failed = accounts.filter((item) => item.status === 'FAILED').length;
  const coverage = {expected: 9, attempted: accounts.length, completed: accounts.length - failed, failed, accounts};
  return {
    source_id: 'tracked-douyin-creators',
    command_or_url: 'opencli douyin user-videos <sec_uid> --limit 20 --with_comments false -f json',
    attempted_at: attemptedAt,
    status: failed ? 'FAILED' : results.length ? 'OK' : 'EMPTY',
    result_count: failed ? 0 : results.length,
    ...(failed ? {error: `${failed}个对标账号扫描失败，候选生成必须停止`} : {}),
    results: failed ? [] : results,
    coverage
  };
}

function collectPersonalExpressionPool() {
  const attemptedAt = nowIso();
  try {
    const content = readFileSync(expressionPoolPath, 'utf8');
    const ideas = content.split(/\r?\n/).map((line) => line.match(/^\s*-\s*\[\s*\]\s+(.+?)\s*$/)?.[1]?.trim()).filter(Boolean);
    const results = ideas.map((title, index) => ({id: stableId('personal-expression-pool', title, '', index + 1), rank: index + 1, title, url: '', published_at: null, raw: {title}}));
    return {source_id: 'personal-expression-pool', command_or_url: expressionPoolPath, attempted_at: attemptedAt, status: results.length ? 'OK' : 'EMPTY', result_count: results.length, results};
  } catch (error) {
    return {source_id: 'personal-expression-pool', command_or_url: expressionPoolPath, attempted_at: attemptedAt, status: 'FAILED', result_count: 0, error: `个人表达池不可读: ${error.message}`, results: []};
  }
}

async function collectAihot() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const url = `https://aihot.virxact.com/api/public/items?mode=selected&since=${encodeURIComponent(since)}&take=100`;
  const attemptedAt = nowIso();
  try {
    const response = await fetch(url, {headers: {'User-Agent': 'laohan-redian/2.0'}, signal: AbortSignal.timeout(20000)});
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const results = normalizeArray(payload).map((item, index) => normalizeItem('aihot', item, index));
    return {source_id: 'aihot', command_or_url: url, attempted_at: attemptedAt, status: results.length ? 'OK' : 'EMPTY', result_count: results.length, results};
  } catch (error) {
    return {source_id: 'aihot', command_or_url: url, attempted_at: attemptedAt, status: 'FAILED', result_count: 0, error: String(error?.message || error), results: []};
  }
}

function collectOpencli(sourceId, commandArgs) {
  const attemptedAt = nowIso();
  const command = ['opencli', ...commandArgs].join(' ');
  const run = spawnSync('opencli', commandArgs, {encoding: 'utf8', timeout: 90000, maxBuffer: 16 * 1024 * 1024});
  // status 66 = opencli EMPTY_RESULT (EX_NOINPUT)，"无数据/未命中"的合法退出码；当 OK 放行，结果数量由后续 stdout 解析决定（空 -> EMPTY，有数据 -> OK）
  if (run.error || ![0, 66].includes(run.status)) {
    return {source_id: sourceId, command_or_url: command, attempted_at: attemptedAt, status: 'FAILED', result_count: 0, error: String(run.error?.message || run.stderr || `exit ${run.status}`).trim(), results: []};
  }
  try {
    const payload = run.stdout.trim() ? JSON.parse(run.stdout) : [];
    const results = normalizeArray(payload).map((item, index) => normalizeItem(sourceId, item, index));
    return {source_id: sourceId, command_or_url: command, attempted_at: attemptedAt, status: results.length ? 'OK' : 'EMPTY', result_count: results.length, results};
  } catch (error) {
    return {source_id: sourceId, command_or_url: command, attempted_at: attemptedAt, status: 'FAILED', result_count: 0, error: `JSON 解析失败: ${error.message}`, results: []};
  }
}

const records = [];
for (const sourceId of selectedSources) {
  const definition = sourceDefinitions[sourceId];
  records.push(definition.type === 'http' ? await collectAihot() : collectOpencli(sourceId, definition.args));
}
records.push(collectTrackedCreators());
records.push(collectPersonalExpressionPool());

const collectedAt = nowIso();
const signals = {
  schema_version: 2,
  episode: basename(episode),
  collected_at: collectedAt,
  source_plan: [...selectedSources, 'tracked-douyin-creators', 'personal-expression-pool'],
  sources: records.map((record) => ({...record, record_sha256: sha(JSON.stringify(record.results))}))
};
const signalsBody = JSON.stringify(signals, null, 2) + '\n';
const signalsPath = join(episode, '00-选题-signals.json');
const signalsTmp = signalsPath + '.tmp';
writeFileSync(signalsTmp, signalsBody);
renameSync(signalsTmp, signalsPath);
const signalsSha = sha(readFileSync(signalsPath));

const health = {
  schema_version: 1,
  collected_at: collectedAt,
  sources: records.map((record) => ({
    source_id: record.source_id,
    source_role: record.source_id === 'tracked-douyin-creators' ? 'BENCHMARK_CREATOR' : record.source_id === 'personal-expression-pool' ? 'PERSONAL_EXPRESSION' : 'DISCOVERY',
    command_or_url: record.command_or_url,
    attempted_at: record.attempted_at,
    status: record.status,
    result_count: record.result_count,
    result_file: '00-选题-signals.json',
    result_sha256: signalsSha,
    record_sha256: sha(JSON.stringify(record.results)),
    ...(record.error ? {error: record.error} : {})
  }))
};
const healthPath = join(episode, '00-选题-source-health.json');
const healthTmp = healthPath + '.tmp';
writeFileSync(healthTmp, JSON.stringify(health, null, 2) + '\n');
renameSync(healthTmp, healthPath);

const okCount = records.filter((record) => record.status === 'OK').length;
const hotOkCount = records.filter((record) => selectedSources.includes(record.source_id) && record.status === 'OK').length;
const trackedComplete = records.find((record) => record.source_id === 'tracked-douyin-creators')?.coverage?.failed === 0;
console.log(`signals=${signalsPath}`);
console.log(`source_health=${healthPath}`);
console.log(`sources=${records.length} ok=${okCount} empty=${records.filter((record) => record.status === 'EMPTY').length} failed=${records.filter((record) => record.status === 'FAILED').length}`);
if (hotOkCount === 0 || !trackedComplete) process.exitCode = 1;
