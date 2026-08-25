#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, realpathSync, statSync} from 'node:fs';
import {basename, dirname, join, resolve} from 'node:path';

const args = process.argv.slice(2);
const episodeIndex = args.indexOf('--episode');
if (episodeIndex === -1 || !args[episodeIndex + 1]) {
  console.error('用法: check-topic-contract.mjs --episode episodes/<slug>');
  process.exit(2);
}
const episode = resolve(args[episodeIndex + 1]);
if (!existsSync(episode) || !statSync(episode).isDirectory() || basename(dirname(episode)) !== 'episodes') {
  console.error('BLOCKED topic contract: episode必须位于episodes/<slug>');
  process.exit(1);
}
const root = realpathSync(episode);
const target = (relative) => {
  const path = join(root, relative);
  if (existsSync(path) && !realpathSync(path).startsWith(root + '/')) throw new Error('产物不得逃逸episode: ' + relative);
  return path;
};
const nonEmpty = (value) => typeof value === 'string' && value.trim();
const shaFile = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const readJson = (relative) => JSON.parse(readFileSync(target(relative), 'utf8'));
const block = (message, marker = 'BLOCKED') => {
  console.error(`${marker} topic contract: ${message}`);
  process.exit(1);
};

for (const relative of ['00-选题-signals.json', '00-选题-candidates.json']) if (!existsSync(target(relative))) block('缺 ' + relative);
const signals = readJson('00-选题-signals.json');
const sources = Array.isArray(signals.sources) ? signals.sources : [];
if (signals.schema_version !== 2 || signals.episode !== basename(episode)) block('signals必须是当前episode的schema 2');
const tracked = sources.find((item) => item?.source_id === 'tracked-douyin-creators');
const accounts = tracked?.coverage?.accounts;
if (!tracked || tracked.status === 'FAILED' || tracked.coverage?.expected !== 9 || tracked.coverage?.attempted !== 9 || tracked.coverage?.completed !== 9 || tracked.coverage?.failed !== 0 || !Array.isArray(accounts) || accounts.length !== 9 || new Set(accounts.map((item) => item?.sec_uid)).size !== 9 || accounts.some((item) => !['OK', 'EMPTY'].includes(item?.status))) block('9个对标账号必须完整逐个扫描，正常空结果记EMPTY');
if (!sources.some((item) => item?.source_id === 'personal-expression-pool' && ['OK', 'EMPTY'].includes(item?.status))) block('缺Jeffrey个人表达池读取记录');
const supplemental = new Set(['tracked-douyin-creators', 'personal-expression-pool']);
if (!sources.some((item) => !supplemental.has(item?.source_id) && item?.status === 'OK' && item?.result_count > 0)) block('至少一个全面热点源必须成功');

const candidatesPath = target('00-选题-candidates.json');
const candidates = readJson('00-选题-candidates.json');
const items = Array.isArray(candidates.candidates) ? candidates.candidates : [];
if (candidates.schema_version !== 3 || items.length < 2 || new Set(items.map((item) => item?.id)).size !== items.length) block('candidates必须是schema 3且至少两个唯一候选');
const signalIds = new Set(sources.flatMap((source) => Array.isArray(source.results) ? source.results.map((item) => item?.id) : []));
const publicSignalIds = new Set(sources.filter((source) => source?.source_id !== 'personal-expression-pool').flatMap((source) => Array.isArray(source.results) ? source.results.map((item) => item?.id) : []));
for (const item of items) {
  const publicInterestIds = Array.isArray(item?.public_interest_evidence_ids) ? item.public_interest_evidence_ids : item?.signal_ids;
  if (!nonEmpty(item?.id) || !nonEmpty(item?.title) || !nonEmpty(item?.audience || item?.audience_problem) || !nonEmpty(item?.thesis) || !Array.isArray(publicInterestIds) || !publicInterestIds.some((id) => publicSignalIds.has(id)) || publicInterestIds.some((id) => !signalIds.has(id)) || !nonEmpty(item?.creator_fit?.why_jeffrey) || !nonEmpty(item?.creator_fit?.distinctive_judgment)) block('每个候选必须有非个人池的大众兴趣信号、受众问题、论点和Jeffrey个人依据');
}

if (!existsSync(target('00-选题-Jeffrey筛选.json'))) block('等待Jeffrey从候选中按情绪与表达欲选择', 'WAITING_FOR_JEFFREY_EMOTION_SELECTION');
const selection = readJson('00-选题-Jeffrey筛选.json');
if (selection.schema_version !== 1 || selection.status !== 'ACCEPTED' || selection.authorized_by !== 'Jeffrey' || Number.isNaN(Date.parse(selection.accepted_at)) || selection.candidates_sha256 !== shaFile(candidatesPath) || !nonEmpty(selection.selected_candidate_id) || !nonEmpty(selection.first_reaction) || !nonEmpty(selection.challenge_or_addition) || !nonEmpty(selection.firsthand_detail) || selection.would_say_without_heat !== true) block('Jeffrey筛选必须绑定当前候选并记录第一反应、补充/反驳、亲历细节与无热度表达意愿');
const selected = items.filter((item) => item.disposition === 'SELECTED');
if (selected.length !== 1 || selected[0].id !== selection.selected_candidate_id || items.some((item) => !['SELECTED', 'REJECTED'].includes(item.disposition))) block('Jeffrey接受后必须且只能有一个匹配的SELECTED候选');
if (!existsSync(target('00-选题.json')) || !existsSync(target('00-选题.md')) || statSync(target('00-选题.md')).size === 0) block('Jeffrey筛选通过后必须生成最终选题JSON与Markdown');
const topic = readJson('00-选题.json');
if (topic.schema_version !== 3 || topic.selected_candidate_id !== selection.selected_candidate_id || !nonEmpty(topic.audience) || !nonEmpty(topic.thesis)) block('最终选题必须是schema 3并绑定Jeffrey选中的候选');

console.log(`PASS redian topic contract schema=3 selected=${selection.selected_candidate_id}`);
