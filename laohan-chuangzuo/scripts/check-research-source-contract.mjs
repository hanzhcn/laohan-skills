#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {existsSync, readFileSync, realpathSync, statSync} from 'node:fs';
import {isAbsolute, join, normalize, resolve} from 'node:path';

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1];
};
const episodeArg = option('--episode');
const decisionArg = option('--decision');
const fail = (message) => {
  console.error('BLOCKED research source contract: ' + message);
  process.exit(1);
};
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const uniqueNonEmpty = (values) => Array.isArray(values) && values.length > 0 && values.every(nonEmpty) && new Set(values).size === values.length;
const shaFile = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

if (!episodeArg || !decisionArg) {
  console.error('用法: check-research-source-contract.mjs --episode episodes/<slug> --decision <创作决策.json>');
  process.exit(2);
}
const episode = realpathSync(resolve(episodeArg));
const decisionPath = realpathSync(resolve(decisionArg));
if (!decisionPath.startsWith(episode + '/')) fail('创作决策必须位于当前episode');
const readJson = (path, label) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    fail(label + '不是合法JSON');
  }
};
const topicPath = join(episode, '00-选题.json');
if (!existsSync(topicPath) || !statSync(topicPath).isFile()) fail('缺00-选题.json');
const topic = readJson(topicPath, '00-选题.json');
const direction = topic.direction_research;
if (direction?.mode !== 'USER_DIRECTION_RESEARCH') {
  console.log('PASS research source contract not-applicable');
  process.exit(0);
}
if (!nonEmpty(direction.series_id) || !nonEmpty(direction.episode_id) || !nonEmpty(direction.packet_path) || !/^[a-f0-9]{64}$/.test(direction.packet_sha256 || '')) fail('direction_research缺series、episode、packet路径或packet_sha256');
if (isAbsolute(direction.packet_path) || normalize(direction.packet_path).startsWith('..')) fail('direction_research.packet_path必须是episode内相对路径');
const packetPath = join(episode, direction.packet_path);
if (!existsSync(packetPath) || !statSync(packetPath).isFile() || statSync(packetPath).size === 0 || !realpathSync(packetPath).startsWith(episode + '/')) fail('系列研究摘录必须位于当前episode');
if (direction.packet_sha256 !== shaFile(packetPath)) fail('topic.direction_research.packet_sha256未绑定当前系列研究摘录');
const packet = readJson(packetPath, '系列研究摘录');
if (packet.schema_version !== 1 || packet.series_id !== direction.series_id || packet.episode_id !== direction.episode_id) fail('系列研究摘录未绑定当前series和episode');
const claims = Array.isArray(packet.claims) ? packet.claims : [];
const claimIds = claims.map((claim) => claim?.claim_id);
if (!uniqueNonEmpty(claimIds) || claims.some((claim) => !nonEmpty(claim?.claim) || !['SOURCE_SUMMARY', 'EDITORIAL_INFERENCE', 'JEFFREY_FIRSTHAND'].includes(claim?.evidence_type) || !Array.isArray(claim?.source_ids) || (claim.evidence_type === 'SOURCE_SUMMARY' && !claim.source_ids.length) || !nonEmpty(claim?.fact_boundary))) fail('系列研究摘录claims缺证据类型、来源或事实边界');
const claimById = new Map(claims.map((claim) => [claim.claim_id, claim]));
const interviewPath = join(episode, '02-创作工作稿/反向采访.json');
const interview = existsSync(interviewPath) ? readJson(interviewPath, '反向采访.json') : null;
const exchangeCount = Array.isArray(interview?.exchanges) ? interview.exchanges.length : 0;

const decision = readJson(decisionPath, '创作决策.json');
const units = Array.isArray(decision.content_units) ? decision.content_units : [];
const unitIds = units.map((unit) => unit?.id);
if (!uniqueNonEmpty(unitIds)) fail('创作决策缺唯一content_units');
const contract = decision.research_source_contract || {};
if (contract.status !== 'BOUND' || contract.packet_path !== direction.packet_path || contract.packet_sha256 !== shaFile(packetPath) || !uniqueNonEmpty(contract.used_claim_ids) || contract.used_claim_ids.some((id) => !claimIds.includes(id))) fail('research_source_contract未绑定当前packet_sha256和合法used_claim_ids');
const mapping = Array.isArray(contract.content_unit_claim_map) ? contract.content_unit_claim_map : [];
if (mapping.length !== unitIds.length || new Set(mapping.map((item) => item?.content_unit_id)).size !== unitIds.length || unitIds.some((id) => !mapping.some((item) => item?.content_unit_id === id))) fail('每个content_unit必须且只能有一条来源或Jeffrey原创映射');
for (const item of mapping) {
  const ids = Array.isArray(item.claim_ids) ? item.claim_ids : [];
  if (!unitIds.includes(item.content_unit_id) || !['SOURCE_PACKET', 'JEFFREY_ORIGINAL'].includes(item.origin) || !['FACT', 'INFERENCE', 'FIRSTHAND'].includes(item.usage_mode)) fail('content_unit_claim_map包含非法内容单位、origin或usage_mode');
  if (item.origin === 'SOURCE_PACKET') {
    if (!uniqueNonEmpty(ids) || ids.some((id) => !contract.used_claim_ids.includes(id))) fail('SOURCE_PACKET内容单位必须绑定used_claim_ids中的真实主张');
    const evidenceTypes = ids.map((id) => claimById.get(id)?.evidence_type);
    if (item.usage_mode === 'FACT' && evidenceTypes.some((type) => type !== 'SOURCE_SUMMARY')) fail('FACT内容单位只能由SOURCE_SUMMARY支撑，EDITORIAL_INFERENCE不得写成事实');
    if (item.usage_mode === 'INFERENCE' && !evidenceTypes.includes('EDITORIAL_INFERENCE')) fail('INFERENCE内容单位必须明确绑定EDITORIAL_INFERENCE主张');
    if (item.usage_mode === 'FIRSTHAND' && evidenceTypes.some((type) => type !== 'JEFFREY_FIRSTHAND')) fail('FIRSTHAND内容单位只能绑定JEFFREY_FIRSTHAND主张');
  }
  if (item.origin === 'JEFFREY_ORIGINAL') {
    const indexes = item.interview_exchange_indexes;
    if (item.usage_mode !== 'FIRSTHAND' || ids.length || !nonEmpty(item.original_basis) || !Array.isArray(indexes) || !indexes.length || indexes.some((index) => !Number.isInteger(index) || index < 1 || index > exchangeCount)) fail('JEFFREY_ORIGINAL必须绑定反向采访中的真实exchange索引且不能伪造来源claim');
  }
}

console.log(`PASS research source contract series=${direction.series_id} episode=${direction.episode_id} content_units=${unitIds.length}`);
