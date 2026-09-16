#!/usr/bin/env node
import {createHash} from 'node:crypto';
import {existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename, dirname, join, relative, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1];
};
const episodeArg = option('--episode');
const scriptArg = option('--script');
const decisionArg = option('--decision');
const baseArg = option('--base');
const seriesDraftArg = option('--series-draft');

const fail = (message) => {
  console.error('BLOCKED chuangzuo script contract: ' + message);
  process.exit(1);
};
const requireFile = (path, label) => {
  if (!existsSync(path) || !statSync(path).isFile() || statSync(path).size === 0) fail('缺非空 ' + label);
  return realpathSync(path);
};
const shaFile = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const shaText = (value) => createHash('sha256').update(value).digest('hex');
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;
const uniqueNonEmpty = (items) => Array.isArray(items) && items.length > 0 && items.every(nonEmpty) && new Set(items).size === items.length;

let base;
let scriptPath;
let decisionPath;
if (episodeArg) {
  base = resolve(episodeArg);
  scriptPath = join(base, '01-口播稿.md');
  decisionPath = join(base, '02-创作工作稿/创作决策.json');
} else if (scriptArg && decisionArg) {
  base = resolve(baseArg || process.cwd());
  scriptPath = resolve(scriptArg);
  decisionPath = resolve(decisionArg);
} else {
  console.error('用法: check-script-contract.mjs --episode episodes/<slug> | --script <script.md> --decision <decision.json> [--base <root>] [--series-draft <episode-packet.json>]');
  process.exit(2);
}

const baseReal = requireFile(scriptPath, '口播稿').startsWith(realpathSync(base) + '/') ? realpathSync(base) : null;
if (!baseReal || !requireFile(decisionPath, '创作决策.json').startsWith(baseReal + '/')) fail('稿件和决策必须位于指定根目录内');

let decision;
try {
  decision = JSON.parse(readFileSync(decisionPath, 'utf8'));
} catch {
  fail('创作决策.json 不是合法 JSON');
}
const script = readFileSync(scriptPath, 'utf8').replace(/\r\n/g, '\n');
const title = script.match(/^#\s+(.+)$/m)?.[1]?.trim();
if (!title) fail('稿件第一行必须是非空一级标题');

if (seriesDraftArg) {
  if (episodeArg) fail('series-draft只能用于独立script-pool草稿');
  const scriptReal = realpathSync(scriptPath);
  const decisionReal = realpathSync(decisionPath);
  const poolRoot = join(baseReal, 'script-pool');
  const researchRoot = join(poolRoot, 'series-research');
  if (!scriptReal.startsWith(poolRoot + '/') || scriptReal.startsWith(researchRoot + '/') || dirname(scriptReal) !== dirname(decisionReal)) fail('series-draft稿件与决策必须同目录位于script-pool，且不得写入series-research');
  const packetReal = requireFile(resolve(seriesDraftArg), '单期资料包');
  if (!packetReal.startsWith(researchRoot + '/')) fail('series-draft单期资料包必须位于script-pool/series-research');
  const seriesDir = dirname(dirname(packetReal));
  if (basename(dirname(packetReal)) !== 'episode-packets') fail('series-draft必须使用canonical episode-packets中的资料包');
  const researchPath = requireFile(join(seriesDir, 'series-research.json'), 'series-research.json');
  const seriesValidator = resolve(process.env.LAOHAN_SERIES_RESEARCH_VALIDATOR || join(baseReal, 'scripts/check-series-research.mjs'));
  if (!existsSync(seriesValidator)) fail('缺系列研究validator');
  const seriesValidation = spawnSync('node', [seriesValidator, '--series', seriesDir], {encoding: 'utf8'});
  if (seriesValidation.status !== 0) fail((seriesValidation.stderr || seriesValidation.stdout || '系列研究包验证失败').trim());
  let research;
  let packet;
  try {
    research = JSON.parse(readFileSync(researchPath, 'utf8'));
    packet = JSON.parse(readFileSync(packetReal, 'utf8'));
  } catch {
    fail('系列研究或单期资料包不是合法JSON');
  }
  const researchEpisode = research.episodes?.find((item) => item?.id === packet.episode_id);
  if (research.series_id !== packet.series_id || packet.series_research_sha256 !== shaFile(researchPath) || !researchEpisode?.packet_path || realpathSync(join(seriesDir, researchEpisode.packet_path)) !== packetReal) fail('series-draft packet必须绑定当前已验证series-research.json及canonical原始packet');
  const relativePacket = relative(baseReal, packetReal);
  if (packet.schema_version !== 1 || !nonEmpty(packet.series_id) || !nonEmpty(packet.episode_id) || !/^[a-f0-9]{64}$/.test(packet.series_research_sha256 || '') || !Array.isArray(packet.claims) || !packet.claims.length || !Array.isArray(packet.source_snapshots) || !packet.source_snapshots.length) fail('series-draft必须使用已绑定研究SHA、claims和来源快照的单期资料包');
  const packetClaimIds = new Set(packet.claims.map((claim) => claim?.claim_id));
  if (decision.schema_version !== 1 || decision.contract_version !== 'series-draft-v1' || decision.status !== 'DRAFT' || decision.stage_status !== 'NOT_STAGE_2_COMPLETE' || decision.series_id !== packet.series_id || decision.episode_id !== packet.episode_id || decision.packet_path !== relativePacket || decision.packet_sha256 !== shaFile(packetReal) || decision.series_research_sha256 !== packet.series_research_sha256 || decision.script_title !== title || decision.script_hash !== shaFile(scriptReal) || !uniqueNonEmpty(decision.used_claim_ids) || decision.used_claim_ids.some((id) => !packetClaimIds.has(id))) fail('series-draft决策必须绑定稿件、packet SHA、series_research_sha256和实际使用claims，并标记DRAFT/NOT_STAGE_2_COMPLETE');
  const sourceHeading = /^##\s+来源与时间点\s*$/m.exec(script);
  const spokenBody = sourceHeading ? script.slice(script.indexOf('\n') + 1, sourceHeading.index).replace(/^##.*$/gm, '').trim() : '';
  if (!spokenBody) fail('series-draft必须包含非空口播正文');
  const citations = Array.isArray(decision.source_citations) ? decision.source_citations : [];
  const formatTime = (seconds) => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  if (!sourceHeading || citations.length !== packet.source_snapshots.length || packet.source_snapshots.some((source) => {
    const citation = citations.find((item) => item?.source_id === source.id);
    if (!citation || citation.url !== source.url || !script.includes(source.url)) return true;
    if (source.source_type !== 'VIDEO') return !Array.isArray(citation.segments);
    if (!Array.isArray(citation.segments) || !citation.segments.length) return true;
    return citation.segments.some((segment) => !source.key_segments.some((item) => item.start_seconds === segment.start_seconds && item.end_seconds === segment.end_seconds) || !script.includes(formatTime(segment.start_seconds)) || !script.includes(formatTime(segment.end_seconds)));
  })) fail('series-draft稿件与决策必须逐来源列出URL，并为每个视频引用资料包中的真实关键时间段');
  console.log(`PASS chuangzuo series draft contract series=${packet.series_id} episode=${packet.episode_id}`);
  process.exit(0);
}

const publishHeading = /^##\s+抖音发布信息\s*$/m.exec(script);
if (!publishHeading) fail('稿件必须包含“## 抖音发布信息”');
const titleLineEnd = script.indexOf('\n');
const shootingNotesIndex = script.search(/^##\s+拍摄备注\s*$/m);
const bodyEnd = Math.min(publishHeading.index, shootingNotesIndex >= 0 ? shootingNotesIndex : publishHeading.index);
const body = script.slice(titleLineEnd + 1, bodyEnd);
const forbiddenDirectorCue = body.split('\n').find((line) => /^\s*>?\s*(?:\[?(?:B[\s-]?Roll|字幕|画面|镜头|转场|动画|特效|Remotion|执行提示|镜头提示|动画提示|Remotion提示)[：:])/iu.test(line));
if (forbiddenDirectorCue) fail('口播正文不得混入导演或Remotion提示: ' + forbiddenDirectorCue.trim());
const paragraphs = body
  .split(/\n\s*\n/)
  .map((block) => block.split('\n').filter((line) => !/^\s*(?:---|>|##\s)/.test(line)).join('\n').trim())
  .filter(Boolean);
if (!paragraphs.length) fail('稿件没有有效口播段落');

const publishStart = publishHeading.index + publishHeading[0].length;
const publishTail = script.slice(publishStart);
const nextLevelTwoHeading = publishTail.search(/^##\s+/m);
const publishBlock = (nextLevelTwoHeading >= 0 ? publishTail.slice(0, nextLevelTwoHeading) : publishTail).trim();
const publishSubsection = (name) => {
  const heading = new RegExp(`^###\\s+${name}\\s*$`, 'm').exec(publishBlock);
  if (!heading) return '';
  const tail = publishBlock.slice(heading.index + heading[0].length).replace(/^\s*\n/, '');
  const nextHeading = tail.search(/^###\s+/m);
  return (nextHeading >= 0 ? tail.slice(0, nextHeading) : tail).trim();
};
const recommendedTitle = publishSubsection('主推标题');
const videoDescription = publishSubsection('视频介绍');
if (!nonEmpty(recommendedTitle) || recommendedTitle.includes('\n') || Array.from(recommendedTitle).length > 30) fail('抖音主推标题必须是30字以内的单行非空标题');
if (!nonEmpty(videoDescription)) fail('抖音视频介绍不能为空');
const descriptionHashtags = videoDescription.match(/#[\p{L}\p{N}_-]+/gu) || [];
if (!descriptionHashtags.includes('#AI新星计划')) fail('抖音视频介绍必须包含#AI新星计划');
if ((videoDescription.match(/[？?]/g) || []).length !== 1) fail('抖音视频介绍必须且只能包含一个明确互动问题');

if (episodeArg) {
  if (decision.schema_version !== 4 || decision.contract_version !== 'content-units-v2') fail('Episode创作决策必须使用 schema 4 / content-units-v2');
  const topicPath = join(base, '00-选题.json');
  const outlinePath = join(base, '02-创作工作稿/大纲.md');
  if (!requireFile(topicPath, '00-选题.json').startsWith(baseReal + '/')) fail('00-选题.json必须位于当前episode');
  if (!requireFile(outlinePath, '大纲.md').startsWith(baseReal + '/')) fail('大纲.md必须位于当前episode');
  let topic;
  try {
    topic = JSON.parse(readFileSync(topicPath, 'utf8'));
  } catch {
    fail('选题不是合法JSON');
  }
  if (topic.schema_version === 4) {
    // 2026-09-17五步法合同：AI自主定题，无采访/大纲确认门槛
    if (!nonEmpty(topic.selected_candidate_id) || !nonEmpty(topic.auto_selection_rationale)) fail('schema 4选题必须绑定AUTO_SELECTED候选与自主定题理由');
    const hook = decision.hook_contract || {};
    if (decision.topic_sha256 !== shaFile(topicPath) || !Array.isArray(decision.expression_pool_usage) || !decision.expression_pool_usage.length || decision.expression_pool_usage.some((item) => !nonEmpty(item?.used) || !nonEmpty(item?.where)) || hook.fulfills_packaging_promise !== true || !nonEmpty(hook.packaging_title_direction)) fail('schema 4必须绑定当前选题SHA、个人表达池取材记录，并证明钩子兑现①packaging_assessment的标题承诺');
    // 写稿六步法（3.6.0）：8个新字段机械校验
    if (!['TUTORIAL', 'EXPOSITION', 'STORY'].includes(decision.structure_type)) fail('写稿六步法第1步：structure_type必须为TUTORIAL/EXPOSITION/STORY之一');
    const variants = Array.isArray(decision.hook_variants) ? decision.hook_variants : [];
    if (variants.length < 3 || variants.some((item) => !nonEmpty(item?.text) || !nonEmpty(item?.direction)) || !Number.isInteger(decision.selected_hook_index) || decision.selected_hook_index < 0 || decision.selected_hook_index >= variants.length || decision.tts_selected !== true) fail('写稿六步法第2步：hook_variants必须至少3个不同方向并经TTS读选登记selected_hook_index/tts_selected');
    const beat = decision.beat_distribution || {};
    if (beat.passed !== true || !nonEmpty(beat.rationale)) fail('写稿六步法第3步：beat_distribution必须通过等分格子无空白检查并说明');
    const anchors = Array.isArray(decision.rhythm_anchors) ? decision.rhythm_anchors : [];
    if (!anchors.length || anchors.some((item) => !nonEmpty(item?.type) || !nonEmpty(item?.position))) fail('写稿六步法第3步：rhythm_anchors必须按15—30秒密度登记正文级锚点');
    const arc = decision.emotion_arc || {};
    if (!nonEmpty(arc.opening) || !nonEmpty(arc.middle) || !nonEmpty(arc.ending)) fail('写稿六步法第3步：emotion_arc必须登记开头痛点/中段释放/收尾踏实三节点');
    const quote = decision.quote_anchor || {};
    if (!nonEmpty(quote.text) || !nonEmpty(quote.placement) || quote.carries_judgment !== true) fail('写稿六步法第4步：quote_anchor必须登记承载本期判断的金句与位置（鸡汤空话不合法）');
    const commentHook = decision.comment_hook || {};
    if (!nonEmpty(commentHook.expected_comments) || commentHook.guide_at_peak !== true) fail('写稿六步法第4步：comment_hook必须登记预期评论方向并把真引导放在情绪最高点');
    const hkrr = decision.hkrr_check || {};
    if (hkrr.rhythm !== true || ![hkrr.happiness, hkrr.knowledge, hkrr.resonance].some(Boolean) || !nonEmpty(hkrr.rationale)) fail('写稿六步法第5步：HKRR自检必须节奏为true且快乐/知识/共鸣至少一项为true');
  } else {
    // 历史合同（schema 3选题+反向采访+大纲确认）：继续按原合同验证
    const interviewPath = join(base, '02-创作工作稿/反向采访.json');
    const approvalPath = join(base, '02-创作工作稿/大纲确认.json');
    for (const [path, label] of [[interviewPath, '反向采访.json'], [approvalPath, '大纲确认.json']]) {
      if (!requireFile(path, label).startsWith(baseReal + '/')) fail(label + '必须位于当前episode');
    }
    let interview;
    let approval;
    try {
      interview = JSON.parse(readFileSync(interviewPath, 'utf8'));
      approval = JSON.parse(readFileSync(approvalPath, 'utf8'));
    } catch {
      fail('反向采访或大纲确认不是合法JSON');
    }
    const exchanges = Array.isArray(interview.exchanges) ? interview.exchanges : [];
    const coverage = new Set(Array.isArray(interview.coverage) ? interview.coverage : []);
    const requiredCoverage = ['TRUE_SCENE', 'EMOTION_TURN', 'DISTINCTIVE_JUDGMENT', 'VIEWER_ACTION'];
    if (topic.schema_version !== 3 || !nonEmpty(topic.selected_candidate_id) || interview.schema_version !== 1 || interview.status !== 'COMPLETED' || interview.selected_candidate_id !== topic.selected_candidate_id || interview.topic_sha256 !== shaFile(topicPath) || exchanges.some((item) => !nonEmpty(item?.question) || !nonEmpty(item?.answer) || !nonEmpty(item?.follow_up_basis)) || requiredCoverage.some((item) => !coverage.has(item)) || Number.isNaN(Date.parse(interview.completed_at))) fail('反向采访必须绑定当前选题，并覆盖场景、情绪、独特判断和观众行动');
    const completionEvidence = interview.completion_evidence || {};
    const validCompletionEvidence = requiredCoverage.every((key) => {
      const evidence = completionEvidence[key];
      return nonEmpty(evidence?.summary) && Array.isArray(evidence?.exchange_indexes) && evidence.exchange_indexes.length > 0 && evidence.exchange_indexes.every((index) => Number.isInteger(index) && index >= 1 && index <= exchanges.length);
    });
    if (exchanges.length < 4 || !validCompletionEvidence || !Array.isArray(interview.remaining_gaps) || interview.remaining_gaps.length !== 0 || !nonEmpty(interview.completion_reason)) fail('采访完成证据必须逐项绑定真实场景、情绪转折、独特判断和观众行动');
    if (approval.schema_version !== 1 || approval.status !== 'ACCEPTED' || approval.accepted_by !== 'Jeffrey' || Number.isNaN(Date.parse(approval.accepted_at)) || approval.interview_sha256 !== shaFile(interviewPath) || approval.outline_sha256 !== shaFile(outlinePath) || !nonEmpty(approval.authorization_note)) fail('大纲确认必须由Jeffrey明确接受并绑定当前采访与大纲SHA');
    const hook = decision.hook_contract || {};
    if (decision.topic_sha256 !== shaFile(topicPath) || decision.interview_sha256 !== shaFile(interviewPath) || decision.outline_sha256 !== shaFile(outlinePath) || decision.outline_approval_sha256 !== shaFile(approvalPath) || hook.designed_after_outline_acceptance !== true || hook.outline_accepted_at !== approval.accepted_at) fail('历史schema 4必须绑定选题、采访、大纲、确认，并证明钩子在大纲确认后设计');
  }
  if (topic.direction_research?.mode === 'USER_DIRECTION_RESEARCH') {
    const researchValidator = resolve(import.meta.dirname, 'check-research-source-contract.mjs');
    const researchResult = spawnSync('node', [researchValidator, '--episode', base, '--decision', decisionPath], {encoding: 'utf8'});
    if (researchResult.status !== 0) fail((researchResult.stderr || researchResult.stdout || '系列研究来源绑定失败').trim());
  }
} else if (decision.schema_version !== 3 || decision.contract_version !== 'content-units-v1') {
  fail('独立模式创作决策必须使用 schema 3 / content-units-v1');
}
if (decision.script_title !== title || decision.script_hash !== shaFile(scriptPath)) fail('创作决策未绑定当前稿标题与SHA-256');
if (!nonEmpty(decision.active_style_file) || !existsSync(decision.active_style_file) || !statSync(decision.active_style_file).isFile() || decision.active_style_sha256 !== shaFile(decision.active_style_file)) fail('active style 路径或SHA-256无效');

const publish = decision.publish_copy_contract || {};
const allowedTitleStrategies = new Set(['SPECIFIC_EVIDENCE_PLUS_COUNTERINTUITIVE_RESULT', 'SEARCHABLE_TOOL_ACTION_RESULT', 'AUDIENCE_PROBLEM_PLUS_UNEXPECTED_RESULT']);
const allowedDescriptionStructures = new Set([
  JSON.stringify(['AUDIENCE_PROBLEM', 'CREDIBILITY_EVIDENCE', 'CORE_CONTENT', 'NEXT_EXPECTATION_OR_ACTION', 'INTERACTION']),
  JSON.stringify(['AUDIENCE_PROBLEM', 'CORE_CONTENT', 'CREDIBILITY_EVIDENCE', 'NEXT_EXPECTATION_OR_ACTION', 'INTERACTION'])
]);
if (publish.platform !== 'douyin' || publish.status !== 'PASS' || !allowedTitleStrategies.has(publish.title_strategy) || publish.recommended_title !== recommendedTitle || !nonEmpty(publish.selection_rationale) || publish.video_description_sha256 !== shaText(videoDescription) || !allowedDescriptionStructures.has(JSON.stringify(publish.video_description_structure)) || !uniqueNonEmpty(publish.required_hashtags) || !publish.required_hashtags.includes('#AI新星计划')) fail('publish_copy_contract 未绑定标题选择、视频介绍结构与必带标签');
if (!uniqueNonEmpty(publish.title_evidence) || publish.title_evidence.length < 2) fail('publish_copy_contract 至少需要两条标题证据');
if (!uniqueNonEmpty(publish.title_candidates) || publish.title_candidates.length !== 3 || !publish.title_candidates.includes(recommendedTitle) || publish.title_candidates.some((candidate) => candidate.includes('\n') || Array.from(candidate).length > 30)) fail('publish_copy_contract 必须登记3个30字以内候选并选中唯一主推标题');
if (!uniqueNonEmpty(publish.description_evidence) || publish.description_evidence.length < 2) fail('publish_copy_contract 至少需要两条视频介绍证据');
const publishEvidenceCorpus = `${recommendedTitle}\n${paragraphs.join('\n')}\n${videoDescription}`;
if (!publish.title_evidence.some((evidence) => recommendedTitle.includes(evidence)) || publish.title_evidence.some((evidence) => !publishEvidenceCorpus.includes(evidence))) fail('主推标题证据必须来自标题、正文或视频介绍，且至少一条直接进入标题');
const descriptionEvidenceCorpus = `${paragraphs.join('\n')}\n${videoDescription}`;
if (publish.description_evidence.some((evidence) => !descriptionEvidenceCorpus.includes(evidence))) fail('视频介绍证据必须来自正文或介绍');

if (episodeArg) {
  const multiPath = join(base, '12-发布/多平台发布内容.md');
  const multiReal = requireFile(multiPath, '多平台发布内容.md');
  if (!multiReal.startsWith(baseReal + '/')) fail('多平台发布内容必须位于指定episode内');
  const multi = readFileSync(multiPath, 'utf8').replace(/\r\n/g, '\n');
  if (!multi.includes(`- 源口播稿SHA256：${shaFile(scriptPath)}`)) fail('多平台发布内容未绑定当前口播稿SHA-256');
  const headings = [...multi.matchAll(/^##\s+(抖音|视频号|小红书|哔哩哔哩)\s*$/gm)];
  if (headings.length !== 4 || new Set(headings.map((item) => item[1])).size !== 4) fail('多平台发布内容必须且只能包含四个平台');
  const blocks = new Map(headings.map((item, index) => [item[1], multi.slice(item.index + item[0].length, headings[index + 1]?.index ?? multi.length)]));
  const subsection = (platform, name) => {
    const block = blocks.get(platform) || '';
    const heading = new RegExp(`^###\\s+${name}\\s*$`, 'm').exec(block);
    if (!heading) fail(`${platform}缺少${name}`);
    const tail = block.slice(heading.index + heading[0].length).replace(/^\s*\n/, '');
    const next = tail.search(/^###\s+/m);
    const value = (next >= 0 ? tail.slice(0, next) : tail).trim();
    if (!value) fail(`${platform}${name}不能为空`);
    return value;
  };
  const normalizeCopy = (value) => value.replace(/#[\p{L}\p{N}_-]+/gu, '').replace(/[\s，。！？、,.!?；;：:“”「」『』（）()《》【】\[\]-]/g, '').toLowerCase();
  const titles = headings.map((item) => subsection(item[1], '标题'));
  if (new Set(titles.map(normalizeCopy)).size !== 4) fail('四个平台标题必须分别创作');
  if (Array.from(subsection('抖音', '标题')).length > 30) fail('抖音标题必须在30字以内');
  if (Array.from(subsection('视频号', '标题')).length > 16) fail('视频号标题必须在16字以内');
  if (Array.from(subsection('小红书', '标题')).length > 20) fail('小红书标题必须在20字以内');
  const bodies = [subsection('抖音', '介绍'), subsection('视频号', '介绍'), subsection('小红书', '正文'), subsection('哔哩哔哩', '简介')];
  if (new Set(bodies.map(normalizeCopy)).size !== 4) fail('四个平台介绍或正文必须分别创作');
  const paragraphCopies = new Set(paragraphs.map(normalizeCopy));
  if (bodies.some((value) => paragraphCopies.has(normalizeCopy(value)))) fail('平台介绍或正文不得直接复制完整口播段落');
  if ((bodies[0].match(/[？?]/g) || []).length !== 1) fail('抖音介绍必须且只能包含一个明确互动问题');
  for (const platform of headings.map((item) => item[1])) {
    const strategy = blocks.get(platform).match(/^\s*-\s*平台策略：(.+)$/m)?.[1]?.trim();
    if (!strategy || Array.from(strategy).length < 12) fail(`${platform}平台策略必须说明受众与表达取舍`);
  }
  const topics = (platform) => subsection(platform, '话题').split('\n').filter((line) => /^\s*-\s+/.test(line)).map((line) => line.replace(/^\s*-\s+/, '').trim());
  const douyinTopics = topics('抖音');
  if (!douyinTopics.includes('#AI新星计划')) fail('抖音话题必须包含#AI新星计划');
  for (const platform of ['抖音', '视频号', '小红书']) {
    if (!topics(platform).includes('#laohanAI')) fail(`${platform}话题必须包含#laohanAI`);
  }
  if (subsection('哔哩哔哩', '投稿类型') !== '自制') fail('哔哩哔哩投稿类型必须为自制');
  const biliTags = subsection('哔哩哔哩', '标签').split('\n').filter((line) => /^\s*-\s+/.test(line));
  if (!biliTags.length || biliTags.length > 6) fail('哔哩哔哩标签必须为1至6个');
  if (biliTags.some((line) => Array.from(line.replace(/^\s*-\s+/, '').trim()).length > 20)) fail('哔哩哔哩单个标签最多20个字符');
  if (!biliTags.map((line) => line.replace(/^\s*-\s+/, '').trim()).includes('laohanAI')) fail('哔哩哔哩标签必须包含laohanAI');

  const resourceContract = decision.audience_resource_contract || {};
  const resources = Array.isArray(resourceContract.resources) ? resourceContract.resources : [];
  const resourcePromise = /(?:模板|清单|提示词|命令|资料|资源).{0,24}(?:放在|准备好|提供|复制|领取|置顶评论|视频介绍)/u.test(paragraphs.join('\n'));
  if (!['NOT_APPLICABLE', 'BOUND'].includes(resourceContract.status)) fail('audience_resource_contract必须明确BOUND或NOT_APPLICABLE');
  if (resourceContract.status === 'NOT_APPLICABLE') {
    if (resources.length || resourcePromise) fail('口播承诺了观众资源但audience_resource_contract未绑定完整资源');
  } else {
    const resourceIds = resources.map((item) => item?.resource_id);
    const resourceTitles = resources.map((item) => item?.title);
    if (!uniqueNonEmpty(resourceIds) || !uniqueNonEmpty(resourceTitles)) fail('观众资源必须至少一份且resource_id、title唯一非空');
    const platformKeys = {douyin: '抖音', weixin_channels: '视频号', xiaohongshu: '小红书', bilibili: '哔哩哔哩'};
    const allowedDeliveryModes = new Set(['DESCRIPTION_APPENDIX', 'BODY_APPENDIX', 'MANUAL_PINNED_COMMENT', 'ATTACHED_RESOURCE_CARD']);
    const placeholderPattern = /\[(?:填写|粘贴|替换|补充|待定|URL|路径|MM:SS|内容|你的)[^\]]*\]|<(?:填写|粘贴|替换|补充|待定|URL|路径|MM:SS|内容|你的)[^>\n]*>|\]\(\s*\)|\b(?:TODO|TBD)\b|待填写|待补充|_{3,}/iu;
    for (const item of resources) {
      if (!nonEmpty(item.path) || !/^[a-f0-9]{64}$/.test(item.sha256 || '') || item.editable_defaults !== true || !nonEmpty(item.edit_notice) || !item.delivery || Object.keys(platformKeys).some((key) => !allowedDeliveryModes.has(item.delivery[key]))) fail('观众资源缺路径、SHA、完整推荐值声明或四平台交付方式');
      const resourcePath = resolve(base, item.path);
      const resourceReal = requireFile(resourcePath, '观众资源');
      const audienceRoot = join(baseReal, '12-发布/观众资源') + '/';
      if (!resourceReal.startsWith(audienceRoot) || item.sha256 !== shaFile(resourcePath)) fail('观众资源必须位于12-发布/观众资源并绑定当前SHA');
      const resourceText = readFileSync(resourcePath, 'utf8').replace(/\r\n/g, '\n');
      if (!resourceText.includes(item.edit_notice) || placeholderPattern.test(resourceText)) fail('观众资源必须完整填写推荐值，不得保留占位符或空白模板');
      for (const [key, platform] of Object.entries(platformKeys)) {
        const delivery = subsection(platform, '观众资源交付');
        if (!delivery.split('\n').some((line) => line.trim() === `- ${item.title}｜${item.delivery[key]}`)) fail(`${platform}未绑定观众资源${item.title}及交付方式`);
      }
    }
  }
}

const requiredPlanningFields = ['topic_thesis', 'hypothesis_id', 'content_form', 'audience', 'expected_audience_effect', 'input_mode', 'structure_tool', 'structure_rationale'];
if (!requiredPlanningFields.every((key) => nonEmpty(decision[key])) || !uniqueNonEmpty(decision.fact_boundary) || !uniqueNonEmpty(decision.alternative_structures) || !uniqueNonEmpty(decision.unproven_assumptions)) fail('schema 3 缺主题、受众、结构或事实边界规划');
const argumentPlan = decision.argument_plan || {};
const requiredArgumentFields = ['opening_contract', 'material_tradeoffs', 'shootable_expression', 'originality_and_citations'];
if (!requiredArgumentFields.every((key) => nonEmpty(argumentPlan[key])) || !uniqueNonEmpty(argumentPlan.reasoning_path)) fail('argument_plan 必须包含开场、论证路径、素材取舍、可拍表达与原创引用规划');
const originalContributions = decision.original_contributions;
if (!Array.isArray(originalContributions) || originalContributions.length < 1 || originalContributions.some((item) => !nonEmpty(item?.judgement) || !nonEmpty(item?.viewer_value)) || (originalContributions.length === 1 && !nonEmpty(decision.single_contribution_rationale))) fail('original_contributions 必须至少一项；只有一项时需说明不硬凑第二项的理由');

const opening = decision.opening_contract || {};
if (opening.status !== 'PASS' || !nonEmpty(opening.anchor_text) || !['DEFAULT_SIGNATURE', 'TOPIC_SPECIFIC_HOOK'].includes(opening.mode)) fail('opening_contract 必须登记合法开场模式与第一段锚点');
if (opening.mode === 'DEFAULT_SIGNATURE' && (opening.required_prefix !== '嘿，你有没有这种感觉，' || !paragraphs[0].startsWith(opening.required_prefix))) fail('DEFAULT_SIGNATURE 必须以“嘿，你有没有这种感觉，”开头');
if (opening.mode === 'TOPIC_SPECIFIC_HOOK' && (opening.required_prefix !== null || !nonEmpty(opening.exception_reason))) fail('TOPIC_SPECIFIC_HOOK 必须取消固定前缀并登记具体例外理由');
const anchorIndex = paragraphs[0].indexOf(opening.anchor_text);
const minimumAnchorIndex = opening.mode === 'DEFAULT_SIGNATURE' ? opening.required_prefix.length : 0;
if (anchorIndex < minimumAnchorIndex) fail('opening_contract.anchor_text 必须真实出现在第一段合法位置');
const anchorText = paragraphs[0].slice(0, anchorIndex + opening.anchor_text.length);
const anchorTemp = mkdtempSync(join(tmpdir(), 'chuangzuo-opening-'));
try {
  const anchorAudio = join(anchorTemp, 'anchor.aiff');
  const say = spawnSync('say', ['-o', anchorAudio, anchorText], {encoding: 'utf8'});
  if (say.status !== 0) fail('无法执行开场锚点本机TTS');
  const anchorProbe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', anchorAudio], {encoding: 'utf8'});
  const anchorSeconds = Number(anchorProbe.stdout?.trim());
  if (anchorProbe.status !== 0 || !Number.isFinite(anchorSeconds) || anchorSeconds > 5) fail(`开场锚点超过5秒 actual=${anchorSeconds}`);
} finally {
  rmSync(anchorTemp, {recursive: true, force: true});
}

const sufficiency = decision.content_sufficiency || {};
const sufficiencyStatuses = new Set(['SUFFICIENT_FOR_NATURAL_LENGTH', 'RESEARCHED_TO_SUFFICIENCY']);
if (!nonEmpty(sufficiency.source_kind) || !sufficiencyStatuses.has(sufficiency.status) || !['KEEP_NATURAL_LENGTH', 'EXPANDED_WITH_NEW_UNITS'].includes(sufficiency.expansion_decision) || !Number.isInteger(sufficiency.selected_content_unit_count) || sufficiency.selected_content_unit_count < 1 || !nonEmpty(sufficiency.rationale)) fail('content_sufficiency 未证明内容量决定自然稿长');

const units = decision.content_units;
const unitIds = Array.isArray(units) ? units.map((unit) => unit?.id) : [];
if (!uniqueNonEmpty(unitIds) || units.some((unit) => !nonEmpty(unit.claim) || !nonEmpty(unit.support) || !nonEmpty(unit.viewer_value))) fail('content_units 必须是唯一且完整的“判断+支撑+观众价值”');
if (sufficiency.selected_content_unit_count !== units.length) fail('content_sufficiency 的内容单位数量与实际不一致');
const normalizedClaims = units.map((unit) => unit.claim.replace(/[\s，。！？、,.!?]/g, '').toLowerCase());
if (new Set(normalizedClaims).size !== normalizedClaims.length) fail('content_units 存在重复判断');
const visualAnchors = decision.visual_anchors;
if (!Array.isArray(visualAnchors) || visualAnchors.length < 1 || visualAnchors.some((item) => !unitIds.includes(item?.content_unit_id) || !nonEmpty(item?.audience_understanding) || !nonEmpty(item?.visual_expression))) fail('visual_anchors 必须至少绑定一个内容单位，并写清观众理解任务与可视化表达');

const audit = decision.paragraph_audit;
if (!Array.isArray(audit) || audit.length !== paragraphs.length) fail('paragraph_audit 必须逐段覆盖全部有效口播段落');
const auditIds = audit.map((item) => item?.paragraph_id);
if (!uniqueNonEmpty(auditIds)) fail('paragraph_audit 的 paragraph_id 必须唯一');
const allowedRoles = new Set(['CONTENT', 'VOICE_ONLY', 'CALLBACK', 'CTA']);
for (let index = 0; index < audit.length; index += 1) {
  const item = audit[index];
  const ids = Array.isArray(item.content_unit_ids) ? item.content_unit_ids : [];
  if (item.paragraph_sha256 !== shaText(paragraphs[index])) fail(`paragraph_audit SHA不匹配: ${item.paragraph_id || index + 1}`);
  if (!allowedRoles.has(item.role) || ids.some((id) => !unitIds.includes(id))) fail(`paragraph_audit role或内容单位非法: ${item.paragraph_id}`);
  if (item.role === 'CONTENT' && (!ids.length || !nonEmpty(item.new_information))) fail(`CONTENT段缺新增信息: ${item.paragraph_id}`);
  if ((item.role === 'VOICE_ONLY' || item.role === 'CTA') && (ids.length || item.new_information != null)) fail(`${item.role}段不得冒充内容增量: ${item.paragraph_id}`);
  if (item.role === 'CALLBACK' && (!ids.length || !nonEmpty(item.new_consequence))) fail(`CALLBACK必须增加新后果或行动: ${item.paragraph_id}`);
}
const usedUnits = new Set(audit.filter((item) => item.role === 'CONTENT').flatMap((item) => item.content_unit_ids));
if (unitIds.some((id) => !usedUnits.has(id))) fail('存在未落入正文CONTENT段的内容单位');
const contentBindings = audit.filter((item) => item.role === 'CONTENT').flatMap((item) => item.content_unit_ids);
if (new Set(contentBindings).size !== contentBindings.length) fail('同一内容单位不得在多个CONTENT段重复使用');

const redundancy = decision.semantic_redundancy_review || {};
if (redundancy.status !== 'PASS' || !Array.isArray(redundancy.passes) || redundancy.passes.length !== 2 || redundancy.passes.map((item) => item?.pass).join(',') !== '1,2' || redundancy.passes.some((item) => !nonEmpty(item.focus) || item.verdict !== 'PASS') || !Array.isArray(redundancy.duplicate_groups)) fail('必须完成两遍内容语义重复审计');
for (const group of redundancy.duplicate_groups) {
  if (!['MERGED', 'REMOVED', 'ALLOWED_CALLBACK'].includes(group?.resolution) || !nonEmpty(group?.rationale)) fail('重复候选必须记录合并、删除或带新增后果的回扣');
}

const voice = decision.human_voice_contract || {};
const voiceDevices = Array.isArray(voice.devices) ? voice.devices : [];
const voiceTypes = voiceDevices.map((item) => item?.type).filter(nonEmpty);
if (voice.status !== 'PRESERVED' || voice.required_minimum_device_types !== 4 || new Set(voiceTypes).size < 4) fail('人味废话必须保留至少4种不同设备');
for (const device of voiceDevices) {
  const index = auditIds.indexOf(device.paragraph_id);
  if (!nonEmpty(device.type) || index === -1 || !nonEmpty(device.text) || !paragraphs[index].includes(device.text)) fail('人味设备没有绑定类型和真实段落原文');
}

const humanizer = decision.humanizer_contract || {};
const humanizerSkillPath = resolve(process.env.HUMANIZER_ZH_SKILL_PATH || join(process.env.HOME || '', '.agents/skills/humanizer-zh/SKILL.md'));
const expectedSnapshotPath = episodeArg
  ? '02-创作工作稿/humanizer-input.md'
  : relative(baseReal, join(dirname(scriptPath), basename(scriptPath, '.md') + '.humanizer-input.md'));
const snapshotPath = resolve(base, humanizer.input_snapshot_path || '');
const snapshotReal = requireFile(snapshotPath, 'humanizer输入快照');
const claimAudit = humanizer.claim_audit || {};
const scores = humanizer.quality_scores || {};
const scoreKeys = ['directness', 'rhythm', 'trust', 'authenticity', 'conciseness'];
const scoreTotal = scoreKeys.reduce((sum, key) => sum + Number(scores[key]), 0);
if (humanizer.status !== 'PASS'
  || humanizer.skill !== 'humanizer-zh'
  || humanizer.skill_path !== 'agents-skills/humanizer-zh/SKILL.md'
  || !existsSync(humanizerSkillPath)
  || humanizer.skill_sha256 !== shaFile(humanizerSkillPath)
  || humanizer.input_snapshot_path !== expectedSnapshotPath
  || !snapshotReal.startsWith(baseReal + '/')
  || humanizer.input_snapshot_sha256 !== shaFile(snapshotPath)
  || humanizer.output_spoken_text_sha256 !== shaText(paragraphs.join('\n'))
  || claimAudit.status !== 'PASS'
  || JSON.stringify(claimAudit.audited_content_unit_ids) !== JSON.stringify(unitIds)
  || !Array.isArray(claimAudit.added_claims) || claimAudit.added_claims.length
  || !Array.isArray(claimAudit.removed_claims) || claimAudit.removed_claims.length
  || !Array.isArray(claimAudit.changed_claims) || claimAudit.changed_claims.length
  || !nonEmpty(claimAudit.reviewer)
  || !humanizer.pattern_scan || typeof humanizer.pattern_scan.method !== 'string' || !humanizer.pattern_scan.method.trim() || !humanizer.pattern_scan.results || !Object.keys(humanizer.pattern_scan.results).length
  || !nonEmpty(claimAudit.review_note)
  || scoreKeys.some((key) => !Number.isInteger(scores[key]) || scores[key] < 1 || scores[key] > 10)
  || scores.total !== scoreTotal
  || scores.total < 45
  || Number.isNaN(Date.parse(humanizer.applied_at))) fail('humanizer-zh必须绑定当前Skill、输入快照、最终口播、全部内容单位的零主张增删改审计和至少45分质量评分');

const structure = decision.structure_contract || {};
if (structure.status !== 'PASS' || typeof structure.layered !== 'boolean') fail('缺结构清晰度合同');
if (structure.layered) {
  if (structure.numbering !== 'ARABIC_CONTIGUOUS' || !uniqueNonEmpty(structure.labels) || structure.labels.some((label, index) => label !== String(index + 1)) || structure.labels.some((label) => !paragraphs.some((paragraph) => paragraph.startsWith(label + '、')))) fail('分层讲解必须使用连续的1、2、3……编号');
} else if (Array.isArray(structure.labels) && structure.labels.length) {
  fail('非分层稿不得伪造层级编号');
}

const duration = decision.duration_contract || {};
if (duration.mode !== 'CONTENT_DETERMINED' || duration.target_is_hard_limit !== false || duration.padding_for_duration !== 'PROHIBITED' || duration.hot_signal_brevity !== 'KEEP_CONCISE' || duration.tts_engine !== 'macos-say' || !nonEmpty(duration.tts_audio_path) || !/^[a-f0-9]{64}$/.test(duration.tts_audio_sha256 || '') || duration.tts_spoken_text_sha256 !== shaText(paragraphs.join('\n')) || !Number.isFinite(duration.actual_tts_seconds) || duration.actual_tts_seconds <= 0) fail('时长合同必须由内容决定并绑定本机TTS证据');
const ttsPath = resolve(base, duration.tts_audio_path);
const ttsReal = requireFile(ttsPath, 'TTS音频');
if (!ttsReal.startsWith(baseReal + '/') || duration.tts_audio_sha256 !== shaFile(ttsPath)) fail('TTS音频路径或SHA-256无效');
const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', ttsPath], {encoding: 'utf8'});
const probedSeconds = Number(probe.stdout?.trim());
if (probe.status !== 0 || !Number.isFinite(probedSeconds) || Math.abs(probedSeconds - duration.actual_tts_seconds) > 0.05) fail('TTS实测时长与音频不一致');

const countSpoken = (value) => (value.match(/[\p{L}\p{N}]/gu) || []).length;
const sentenceLengths = paragraphs.flatMap((paragraph) => paragraph.split(/[。！？!?]+/).map(countSpoken).filter((length) => length > 0));
const effectiveSpokenChars = countSpoken(paragraphs.join(''));
const shortThreshold = 15;
const shortRatio = Number((sentenceLengths.filter((length) => length <= shortThreshold).length / sentenceLengths.length).toFixed(4));
const metrics = decision.script_metrics || {};
if (metrics.effective_spoken_chars !== effectiveSpokenChars || metrics.sentence_count !== sentenceLengths.length || metrics.short_sentence_threshold_chars !== shortThreshold || metrics.short_sentence_ratio !== shortRatio || JSON.stringify(metrics.sentence_lengths) !== JSON.stringify(sentenceLengths)) fail('script_metrics 未绑定实际有效口播量与句长分布 expected=' + JSON.stringify({effective_spoken_chars: effectiveSpokenChars, sentence_count: sentenceLengths.length, short_sentence_threshold_chars: shortThreshold, short_sentence_ratio: shortRatio, sentence_lengths: sentenceLengths}));

const steps = decision.execution_steps || {};
const completed = ['step_minus_1', 'step_0', 'step_2', 'step_3', 'step_4', 'step_5', 'step_5_5', 'step_6', 'step_7'];
const optional = ['pre_a_b', 'step_1', 'step_1_5'];
if (!completed.every((key) => steps[key]?.status === 'COMPLETED' && nonEmpty(steps[key]?.reason)) || !optional.every((key) => ['COMPLETED', 'SKIPPED'].includes(steps[key]?.status) && nonEmpty(steps[key]?.reason))) fail('Step -1至7没有逐项执行并记录理由');

const checks = decision.quality_checks || {};
const requiredChecks = ['content_floor', 'semantic_redundancy', 'human_voice', 'humanizer_zh', 'dynamic_duration', 'structure_clarity', 'originality', 'regex', 'style_boundary', 'ai_taste', 'technique_purpose'];
if (!requiredChecks.every((key) => checks[key] === 'PASS') || !nonEmpty(checks.read_aloud_note)) fail('质量检查没有覆盖内容、人味、时长、结构与原有六关');
if (Number.isNaN(Date.parse(decision.completed_at))) fail('completed_at 不是合法时间');
if (Date.parse(humanizer.applied_at) > Date.parse(decision.completed_at)) fail('humanizer-zh执行时间不得晚于最终决策完成时间');

console.log(`PASS chuangzuo script contract schema=${decision.schema_version} paragraphs=${paragraphs.length} content_units=${units.length} voice_types=${new Set(voiceTypes).size} publish_copy=PASS tts_seconds=${duration.actual_tts_seconds}`);
