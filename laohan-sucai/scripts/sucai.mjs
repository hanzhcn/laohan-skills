#!/usr/bin/env node
import {copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, existsSync} from 'node:fs';
import {dirname, extname, join, relative, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const envFile = fileURLToPath(new URL('../.env', import.meta.url));
if (existsSync(envFile)) {
  for (const rawLine of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const divider = line.indexOf('=');
    if (divider < 1) continue;
    const key = line.slice(0, divider).trim();
    const value = line.slice(divider + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

const args = process.argv.slice(2);
const command = args.shift();
const option = (name, fallback = null) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
};
const required = (name) => {
  const value = option(name);
  if (!value || value.startsWith('--')) throw new Error('缺少参数 ' + name);
  return value;
};
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const writeJson = (file, value) => writeFileSync(file, JSON.stringify(value, null, 2) + '\n');
const now = () => new Date().toISOString();
const safeName = (value) => String(value).replace(/[^a-zA-Z0-9_-]+/g, '_');
const mkdir = (path) => mkdirSync(path, {recursive: true});
const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

const providers = {
  pexels: {
    env: 'PEXELS_API_KEY',
    licenseUrl: 'https://www.pexels.com/license/',
    attribution: 'Photos and videos provided by Pexels; credit the creator when possible.',
  },
  pixabay: {
    env: 'PIXABAY_API_KEY',
    licenseUrl: 'https://pixabay.com/service/license-summary/',
    attribution: 'Videos provided by Pixabay; show source when API results are displayed.',
  },
  coverr: {
    env: 'COVERR_API_KEY',
    licenseUrl: 'https://coverr.co/license/',
    attribution: 'Videos provided by Coverr; API attribution is required.',
  },
  local: {
    env: 'LAOHAN_LOCAL_BROLL_DIR',
    licenseUrl: null,
    attribution: 'Local library asset; retain the original licensing record.',
  },
};

const rateLimitHeaders = (response) => Object.fromEntries(
  ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset', 'ratelimit-limit', 'ratelimit-remaining', 'ratelimit-reset', 'retry-after']
    .map((name) => [name, response.headers.get(name)])
    .filter(([, value]) => value !== null),
);

const fetchJson = async (url, headers = {}) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, {headers, signal: controller.signal});
    if (!response.ok) throw new Error(response.status + ' ' + (await response.text()).slice(0, 300));
    return {data: await response.json(), rate_limit: rateLimitHeaders(response)};
  } finally {
    clearTimeout(timeout);
  }
};

const bestPexelsFile = (files = []) => {
  const mp4 = files.filter((file) => file.file_type === 'video/mp4' && file.link);
  return mp4.sort((a, b) => Math.abs((a.width || 0) - 1920) - Math.abs((b.width || 0) - 1920))[0];
};

const searchPexels = async (query, perPage) => {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error('缺 PEXELS_API_KEY');
  const url = 'https://api.pexels.com/v1/videos/search?query=' + encodeURIComponent(query) + '&per_page=' + perPage + '&orientation=landscape';
  const {data, rate_limit} = await fetchJson(url, {Authorization: key});
  return {rate_limit, candidates: (data.videos || []).map((video) => {
    const file = bestPexelsFile(video.video_files);
    if (!file) return null;
    return {
      provider: 'pexels',
      asset_id: String(video.id),
      page_url: video.url,
      download_url: file.link,
      preview_url: video.image,
      creator: video.user?.name || null,
      creator_url: video.user?.url || null,
      width: file.width || null,
      height: file.height || null,
      duration_s: video.duration || null,
      tags: [],
    };
  }).filter(Boolean)};
};

const searchPixabay = async (query, perPage) => {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) throw new Error('缺 PIXABAY_API_KEY');
  const url = 'https://pixabay.com/api/videos/?key=' + encodeURIComponent(key) + '&q=' + encodeURIComponent(query) + '&per_page=' + Math.max(3, perPage) + '&safesearch=true&video_type=film';
  const {data, rate_limit} = await fetchJson(url);
  return {rate_limit, candidates: (data.hits || []).map((video) => {
    const file = video.videos?.large?.url ? video.videos.large : video.videos?.medium;
    if (!file?.url) return null;
    return {
      provider: 'pixabay',
      asset_id: String(video.id),
      page_url: video.pageURL,
      download_url: file.url,
      preview_url: file.thumbnail || null,
      creator: video.user || null,
      creator_url: video.user && video.user_id ? 'https://pixabay.com/users/' + video.user + '-' + video.user_id + '/' : null,
      width: file.width || null,
      height: file.height || null,
      duration_s: video.duration || null,
      tags: String(video.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
    };
  }).filter(Boolean).slice(0, perPage)};
};

const searchCoverr = async (query, perPage) => {
  const key = process.env.COVERR_API_KEY;
  if (!key) throw new Error('缺 COVERR_API_KEY');
  const url = 'https://api.coverr.co/videos?query=' + encodeURIComponent(query) + '&page_size=' + perPage + '&urls=true';
  const {data, rate_limit} = await fetchJson(url, {Authorization: 'Bearer ' + key});
  return {rate_limit, candidates: (data.hits || []).map((video) => {
    const download = video.urls?.mp4_download || video.urls?.mp4;
    if (!download) return null;
    return {
      provider: 'coverr',
      asset_id: String(video.id),
      page_url: 'https://coverr.co/videos/' + video.id,
      download_url: download,
      preview_url: video.thumbnail || video.poster || null,
      creator: null,
      creator_url: null,
      width: video.max_width || null,
      height: video.max_height || null,
      duration_s: video.duration || null,
      tags: video.tags || [],
    };
  }).filter(Boolean)};
};

const localVideoExtensions = new Set(['.mp4', '.mov', '.mkv', '.m4v', '.webm']);

const walkLocalVideos = (root, files = []) => {
  if (files.length >= 2000) return files;
  for (const entry of readdirSync(root, {withFileTypes: true})) {
    const file = join(root, entry.name);
    if (entry.isDirectory()) walkLocalVideos(file, files);
    else if (entry.isFile() && localVideoExtensions.has(extname(entry.name).toLowerCase())) files.push(file);
    if (files.length >= 2000) return files;
  }
  return files;
};

const searchLocal = async (query, perPage, library) => {
  if (!library) throw new Error('缺 --local-library 或 LAOHAN_LOCAL_BROLL_DIR');
  const root = resolve(library);
  if (!existsSync(root)) throw new Error('本地素材库不存在: ' + root);
  const terms = query.toLowerCase().split(/[^a-z0-9\u4e00-\u9fff]+/i).filter((term) => term.length > 1);
  const candidates = walkLocalVideos(root).map((file) => {
    const searchable = relative(root, file).toLowerCase();
    const score = terms.reduce((total, term) => total + (searchable.includes(term) ? 1 : 0), 0);
    return {file, score};
  }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score || a.file.localeCompare(b.file)).slice(0, perPage).map(({file}) => ({
    provider: 'local',
    asset_id: createHash('sha1').update(file).digest('hex').slice(0, 16),
    page_url: null,
    download_url: null,
    local_source_path: file,
    preview_url: null,
    creator: 'local-library',
    creator_url: null,
    width: null,
    height: null,
    duration_s: null,
    tags: relative(root, file).split(/[/.\\]/).filter(Boolean),
  }));
  return {rate_limit: {}, candidates};
};

const run = (command, commandArgs) => {
  const result = spawnSync(command, commandArgs, {encoding: 'utf8'});
  if (result.status !== 0) throw new Error(command + ' 失败: ' + (result.stderr || result.stdout).trim());
  return result.stdout;
};

const loadMaterial = (manifest) => {
  if (!Array.isArray(manifest.items)) throw new Error('素材清单缺 items');
  return manifest;
};

const validateSourceManifest = (manifest) => {
  if (!Array.isArray(manifest.broll_requests)) throw new Error('source manifest 缺 broll_requests');
  for (const request of manifest.broll_requests) {
    if (request.source_mode !== 'BROLL_STOCK') throw new Error('非 BROLL_STOCK 请求: ' + request.beat_id);
    if (!request.beat_id || !request.visual_need) throw new Error('请求缺 beat_id 或 visual_need');
  }
};

const providerSearch = async (provider, terms, perProvider, localLibrary) => {
  const started = Date.now();
  try {
    const candidates = [];
    const rate_limits = [];
    for (const term of terms.slice(0, 3)) {
      let result;
      if (provider === 'pexels') result = await searchPexels(term, perProvider);
      else if (provider === 'pixabay') result = await searchPixabay(term, perProvider);
      else if (provider === 'coverr') result = await searchCoverr(term, perProvider);
      else if (provider === 'local') result = await searchLocal(term, perProvider, localLibrary);
      else throw new Error('不支持 provider: ' + provider);
      candidates.push(...result.candidates);
      if (Object.keys(result.rate_limit).length) rate_limits.push(result.rate_limit);
    }
    const unique = candidates.filter((candidate, index) => candidates.findIndex((entry) => entry.provider === candidate.provider && entry.asset_id === candidate.asset_id) === index);
    return {
      provider,
      status: unique.length ? 'ok' : 'no_result',
      candidate_count: unique.length,
      elapsed_ms: Date.now() - started,
      rate_limits,
      candidates: unique,
    };
  } catch (error) {
    return {
      provider,
      status: /(^|\s)429\b/.test(error.message) ? 'rate_limited' : 'error',
      candidate_count: 0,
      elapsed_ms: Date.now() - started,
      rate_limits: [],
      error: error.message,
      candidates: [],
    };
  }
};

const createSearchManifest = async () => {
  const sourceFile = required('--source');
  const out = required('--out');
  const perProvider = Number(option('--per-provider', '4'));
  const localLibrary = option('--local-library', process.env.LAOHAN_LOCAL_BROLL_DIR || null);
  const selectedProviders = option('--providers', 'pexels,pixabay,coverr').split(',').map((name) => name.trim()).filter(Boolean);
  if (localLibrary && !selectedProviders.includes('local')) selectedProviders.unshift('local');
  const source = readJson(sourceFile);
  validateSourceManifest(source);
  const root = join(out, 'broll-assets');
  mkdir(join(root, 'files'));
  mkdir(join(root, 'thumbs'));
  const manifest = {
    version: 1,
    generated_at: now(),
    source_manifest: sourceFile,
    source_manifest_sha256: sha256(sourceFile),
    providers_requested: selectedProviders,
    search_policy: 'parallel_fan_out',
    local_library: localLibrary || null,
    items: [],
  };
  for (const request of source.broll_requests) {
    const terms = Array.isArray(request.query_terms) && request.query_terms.length ? request.query_terms : [request.visual_need];
    const candidates = [];
    const provider_health = await Promise.all(selectedProviders.map((provider) => providerSearch(provider, terms, perProvider, localLibrary)));
    const provider_errors = provider_health.filter((run) => run.error).map(({provider, status, error}) => ({provider, status, error}));
    for (const run of provider_health) {
      for (const result of run.candidates) {
        const candidate_id = result.provider + ':' + result.asset_id;
        if (candidates.some((candidate) => candidate.candidate_id === candidate_id)) continue;
        candidates.push({
          candidate_id,
          ...result,
          license_url: providers[result.provider].licenseUrl,
          attribution: providers[result.provider].attribution,
          query_terms: terms,
          accessed_at: now(),
          download_status: 'not_downloaded',
          visual_verdict: 'unreviewed',
        });
      }
    }
    manifest.items.push({
      beat_id: request.beat_id,
      script_quote: request.script_quote,
      visual_need: request.visual_need,
      must_not_imply: request.must_not_imply || [],
      query_terms: terms,
      status: candidates.length ? 'candidate_unverified' : 'no_result',
      selected_candidate_id: null,
      candidates,
      provider_health: provider_health.map(({candidates: _candidates, ...health}) => health),
      provider_errors,
    });
  }
  writeJson(join(out, '素材清单.json'), manifest);
  writeFileSync(join(out, '素材清单.md'), renderMarkdown(manifest));
  writeFileSync(join(out, '_credits.md'), renderCredits(manifest));
  console.log('已写入 ' + join(out, '素材清单.json'));
};

const renderMarkdown = (manifest) => {
  const rows = ['# 素材清单', '', '| Beat | 状态 | 候选 | 已选 |', '|---|---|---:|---|'];
  for (const item of manifest.items) rows.push('| ' + item.beat_id + ' | ' + item.status + ' | ' + item.candidates.length + ' | ' + (item.selected_candidate_id || '-') + ' |');
  return rows.join('\n') + '\n';
};

const renderCredits = (manifest) => {
  const lines = ['# 素材署名与来源', ''];
  for (const item of manifest.items) {
    const selected = item.candidates.find((candidate) => candidate.candidate_id === item.selected_candidate_id);
    if (!selected) continue;
    lines.push('- ' + item.beat_id + ': ' + selected.provider + ' · ' + (selected.creator || 'creator unavailable') + ' · ' + selected.page_url);
    lines.push('  - ' + selected.attribution);
  }
  return lines.join('\n') + '\n';
};

const download = async () => {
  const materialFile = required('--manifest');
  const beat = required('--beat');
  const candidateId = required('--candidate');
  const out = option('--out', dirname(materialFile));
  const manifest = loadMaterial(readJson(materialFile));
  const item = manifest.items.find((entry) => entry.beat_id === beat);
  const candidate = item?.candidates.find((entry) => entry.candidate_id === candidateId);
  if (!candidate) throw new Error('找不到 candidate: ' + candidateId);
  const filesDir = join(out, 'broll-assets', 'files');
  const thumbsDir = join(out, 'broll-assets', 'thumbs');
  mkdir(filesDir);
  mkdir(thumbsDir);
  const filename = safeName(beat + '_' + candidate.provider + '_' + candidate.asset_id) + '.mp4';
  const target = join(filesDir, filename);
  try {
    if (candidate.provider === 'local') {
      if (!candidate.local_source_path || !existsSync(candidate.local_source_path)) throw new Error('本地源文件不存在');
      copyFileSync(candidate.local_source_path, target);
    } else {
      const response = await fetch(candidate.download_url);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      writeFileSync(target, Buffer.from(await response.arrayBuffer()));
    }
    const probe = JSON.parse(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:stream=width,height', '-of', 'json', target]));
    const duration = Number(probe.format?.duration || candidate.duration_s || 1);
    const thumbnail = join(thumbsDir, safeName(beat + '_' + candidate.provider + '_' + candidate.asset_id) + '.jpg');
    run('ffmpeg', ['-y', '-v', 'error', '-ss', String(Math.max(0, duration / 3)), '-i', target, '-frames:v', '1', '-vf', 'scale=960:-2', thumbnail]);
    candidate.local_path = relative(out, target);
    candidate.thumb_path = relative(out, thumbnail);
    candidate.sha256 = sha256(target);
    candidate.thumb_sha256 = sha256(thumbnail);
    candidate.download_status = 'downloaded_unverified';
    candidate.width = probe.streams?.[0]?.width || candidate.width;
    candidate.height = probe.streams?.[0]?.height || candidate.height;
    candidate.duration_s = duration;
    item.status = 'candidate_unverified';
    console.log('已下载 ' + target + '；先查看 ' + thumbnail + '，再执行 verify。');
  } catch (error) {
    candidate.download_status = 'download_failed';
    candidate.download_error = error.message;
    console.error('下载失败，已写入素材清单：' + error.message);
  }
  writeJson(materialFile, manifest);
  writeFileSync(join(out, '素材清单.md'), renderMarkdown(manifest));
};

const verify = () => {
  const materialFile = required('--manifest');
  const beat = required('--beat');
  const candidateId = required('--candidate');
  const verdict = required('--verdict');
  const reason = required('--reason');
  if (!['pass', 'reject'].includes(verdict)) throw new Error('--verdict 只能是 pass 或 reject');
  const manifest = loadMaterial(readJson(materialFile));
  const item = manifest.items.find((entry) => entry.beat_id === beat);
  const candidate = item?.candidates.find((entry) => entry.candidate_id === candidateId);
  if (!candidate || !candidate.local_path || !candidate.thumb_path) throw new Error('候选尚未下载并抽帧');
  const base = dirname(materialFile);
  if (!existsSync(join(base, candidate.local_path)) || !existsSync(join(base, candidate.thumb_path))) {
    throw new Error('候选文件或缩略图不存在，不能确认视觉复核');
  }
  candidate.sha256 = sha256(join(base, candidate.local_path));
  candidate.thumb_sha256 = sha256(join(base, candidate.thumb_path));
  candidate.visual_verdict = verdict;
  candidate.visual_reason = reason;
  candidate.verified_at = now();
  if (verdict === 'pass') {
    item.selected_candidate_id = candidateId;
    item.status = 'visually_verified';
  } else {
    if (item.selected_candidate_id === candidateId) item.selected_candidate_id = null;
    item.status = item.candidates.some((entry) => entry.visual_verdict === 'unreviewed')
      ? 'candidate_unverified'
      : 'no_approved_candidate';
  }
  writeJson(materialFile, manifest);
  const out = base;
  writeFileSync(join(out, '素材清单.md'), renderMarkdown(manifest));
  writeFileSync(join(out, '_credits.md'), renderCredits(manifest));
  console.log('已记录 ' + beat + ' -> ' + verdict);
};

const report = () => {
  const manifest = loadMaterial(readJson(required('--manifest')));
  console.log(renderMarkdown(manifest));
};

try {
  if (command === 'search') await createSearchManifest();
  else if (command === 'download') await download();
  else if (command === 'verify') verify();
  else if (command === 'report') report();
  else throw new Error('用法: sucai.mjs <search|download|verify|report> ...');
} catch (error) {
  console.error('FAIL ' + error.message);
  process.exit(1);
}
