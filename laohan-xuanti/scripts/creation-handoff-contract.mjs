import {createHash} from 'node:crypto';
import {existsSync, readFileSync, realpathSync, statSync} from 'node:fs';
import {isAbsolute, resolve} from 'node:path';

const nonEmpty = (x) => typeof x === 'string' && x.trim().length > 0;
const list = (xs) => Array.isArray(xs) && xs.every(nonEmpty) && new Set(xs).size === xs.length;
const nonEmptyList = (xs) => list(xs) && xs.length > 0;
const sha = (x) => createHash('sha256').update(x).digest('hex');
const ordered = (x) => Array.isArray(x) ? x.map(ordered) : x && typeof x === 'object'
  ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, ordered(x[k])])) : x;
export const handoffHash = (x) => sha(JSON.stringify(ordered(x)));
// Bind the reader's acceptance to the actual promise, not just the supporting packet.
export const creationFraming = (owner) => ({
  audience: owner.audience ?? null,
  thesis: owner.thesis ?? owner.topic_thesis ?? owner.one_sentence_outcome ?? null,
  audience_promise: owner.audience_promise ?? owner.expected_audience_effect ?? owner.one_sentence_outcome ?? null,
  content_form: owner.content_form ?? null,
  title_direction: owner.packaging_assessment?.title_direction ?? owner.hook_contract?.packaging_title_direction ?? null,
  working_title: owner.title ?? owner.script_title ?? null,
  audience_problem: owner.audience_problem ?? null,
  series_id: owner.series_id ?? null,
  episode_id: owner.episode_id ?? null,
});
const fail = (message) => { throw new Error('创作交接: ' + message); };

// This checks local evidence identity, not whether a reader's interpretation is true.
function artifact(root, path, digest, label) {
  if (!nonEmpty(path) || isAbsolute(path) || path.split(/[\\/]/).includes('..')) fail(label + '路径必须相对项目根');
  const file = resolve(root, path);
  if (!existsSync(file) || !realpathSync(file).startsWith(realpathSync(root) + '/') || !statSync(file).isFile() || statSync(file).size === 0) fail(label + '路径不存在、为空或越界');
  if (!/^[a-f0-9]{64}$/.test(digest || '') || digest !== sha(readFileSync(file))) fail(label + 'SHA不匹配');
  return file;
}
const actor = (x) => nonEmpty(x?.actor) && nonEmpty(x.context_id);
const validTime = (x) => nonEmpty(x) && Number.isFinite(Date.parse(x)) && Date.parse(x) <= Date.now() + 300000;
const roles = new Set(['DISCOVERY_ONLY', 'FACT_CHECK', 'SYNTHESIS_INPUT', 'ADAPTATION_BASE', 'FIRSTHAND_RECORD', 'VISUAL_REFERENCE']);
const contentRoles = new Set(['FACT_CHECK', 'SYNTHESIS_INPUT', 'ADAPTATION_BASE', 'FIRSTHAND_RECORD']);
const modes = new Set(['FIRSTHAND', 'RESEARCH_SYNTHESIS', 'SOURCE_ADAPTATION']);
const deliveryModes = new Set(['EXPLANATION', 'OPERATION', 'EFFECT_COMPARISON']);
const kinds = new Set(['SOURCE_FACT', 'EDITORIAL_INFERENCE', 'HYPOTHETICAL', 'JEFFREY_FIRSTHAND']);

export function verifyCreationHandoff({handoff: h, review, root, evidenceIds, contentForm, tutorialProof, tutorialRoot = root, framing = {}}) {
  if (h?.schema_version !== 1 || !actor(h.prepared_by)) fail('缺creation_handoff schema1与准备者身份；回材料阶段，历史文件不追填');
  if (!nonEmptyList(h.composition_modes) || h.composition_modes.some((x) => !modes.has(x))) fail('创作模式非法');
  if (!Array.isArray(h.sources) || !nonEmptyList(h.sources.map((x) => x?.id))) fail('缺真实来源材料');
  const sources = new Map(h.sources.map((x) => [x.id, x]));
  for (const source of h.sources) {
    if (!nonEmptyList(source.roles) || source.roles.some((x) => !roles.has(x)) || !nonEmpty(source.read_scope) || !nonEmpty(source.summary)) fail('来源缺用途、实读范围或内容摘要: ' + source.id);
    if (source.evidence_id && (!Array.isArray(evidenceIds) || !evidenceIds.includes(source.evidence_id))) fail('来源evidence_id不属于当前候选: ' + source.id);
    artifact(root, source.snapshot_path, source.snapshot_sha256, '来源' + source.id);
    if (source.roles.includes('ADAPTATION_BASE')) {
      const d = source.adaptation;
      if (!d || !['problem', 'thesis', 'examples', 'necessary_conditions', 'audiovisual_dependencies', 'adoption_and_changes'].every((k) => nonEmpty(d[k])) || !nonEmptyList(d.reasoning_chain)) fail('主稿拆解缺问题、论证链、例证/条件、视听依赖或取舍: ' + source.id);
    }
    if (source.roles.includes('FIRSTHAND_RECORD') && source.speaker !== 'Jeffrey') fail('亲历必须绑定Jeffrey本人记录');
  }
  const hasRole = (role) => h.sources.some((x) => x.roles.includes(role));
  if ((h.composition_modes.includes('FIRSTHAND') && !hasRole('FIRSTHAND_RECORD'))
    || (h.composition_modes.includes('SOURCE_ADAPTATION') && !hasRole('ADAPTATION_BASE'))
    || (h.composition_modes.includes('RESEARCH_SYNTHESIS') && !hasRole('SYNTHESIS_INPUT'))) fail('创作模式没有相应内容来源');
  if (!Array.isArray(h.argument_units) || !nonEmptyList(h.argument_units.map((x) => x?.id))) fail('必须有真实核心判断，单一判断也记录一项');
  const argumentIds = h.argument_units.map((x) => x.id);
  for (const unit of h.argument_units) {
    if (!kinds.has(unit.kind) || !['statement', 'reasoning', 'boundary', 'viewer_value'].every((k) => nonEmpty(unit[k]))
      || !list(unit.source_ids) || unit.source_ids.some((id) => !sources.has(id) || !sources.get(id).roles.some((r) => contentRoles.has(r)))) fail('核心判断来源、推理或边界不完整: ' + unit.id);
    if (unit.kind === 'SOURCE_FACT' && !unit.source_ids.length) fail('来源事实不可使用空来源');
    if (unit.kind === 'JEFFREY_FIRSTHAND' && !unit.source_ids.some((id) => sources.get(id).roles.includes('FIRSTHAND_RECORD') && sources.get(id).speaker === 'Jeffrey')) fail('亲历缺本人记录: ' + unit.id);
  }
  const p = h.production;
  if (!p || !nonEmptyList(p.delivery_modes) || p.delivery_modes.some((x) => !deliveryModes.has(x)) || !Array.isArray(p.materials)
    || !list(p.materials.map((x) => x?.id))) fail('缺交付承诺类型或材料清单');
  for (const m of p.materials) {
    if (typeof m.required !== 'boolean' || !nonEmpty(m.purpose) || !nonEmptyList(m.argument_unit_ids) || m.argument_unit_ids.some((id) => !argumentIds.includes(id))
      || !['AVAILABLE_ARTIFACT', 'VERIFIED_CAPABILITY', 'UNRESOLVED'].includes(m.status)) fail('材料职责、判断映射或状态无效: ' + m.id);
    if (m.status === 'UNRESOLVED') {
      if (m.required || !nonEmpty(m.reason)) fail('required材料未就绪；回选题或改变真实承诺: ' + m.id);
    } else if (m.status === 'AVAILABLE_ARTIFACT') {
      artifact(root, m.path, m.sha256, '材料' + m.id);
    } else {
      const v = m.verified_instance;
      if (!v || !nonEmpty(v.path) || !nonEmpty(v.sha256)) fail('能力缺实例证据路径/SHA: ' + m.id);
      artifact(root, v.path, v.sha256, '能力实例' + m.id);
      if (!nonEmptyList(v.delivery_modes) || v.delivery_modes.some((x) => !deliveryModes.has(x)) || !p.delivery_modes.every((x) => v.delivery_modes.includes(x))
        || !['material_type', 'reuse_plan', 'differences', 'verified_scope_basis'].every((k) => nonEmpty(v[k])) || v.differences_within_verified_scope !== true) fail('能力实例缺同类交付、复用差异或已验证范围依据: ' + m.id);
    }
  }
  if (!p.materials.some((x) => x.required) && !nonEmpty(p.narration_only_reason)) fail('无required材料时须解释口播为何足够兑现');
  if (contentForm === 'tutorial-video' || p.delivery_modes.some((x) => ['OPERATION', 'EFFECT_COMPARISON'].includes(x))) {
    const proof = tutorialProof;
    if (proof?.status !== 'VERIFIED' || !nonEmpty(proof.version_boundary) || !nonEmpty(proof.recovery)) fail('操作/效果承诺写作前必须绑定本机实测、版本边界与失败恢复');
    artifact(tutorialRoot, proof.evidence_path, proof.evidence_sha256, '本机实测');
    if (review?.tutorial_proof_sha256 !== handoffHash(proof)) fail('材料审核未绑定当前本机实测与版本边界');
  }
  if (review?.status !== 'ACCEPTED' || !actor(review.reviewer) || review.reviewer.context_id === h.prepared_by.context_id) fail('材料审核须为独立上下文ACCEPTED；拒绝回①');
  if (review.handoff_sha256 !== handoffHash(h) || !validTime(review.reviewed_at) || !nonEmpty(review.rationale)) fail('材料审核未绑定当前handoff、日期或具体理由');
  if (review.framing_sha256 !== handoffHash(framing)) fail('材料审核未绑定当前承诺/受众/论点；回①重审');
  const report = artifact(root, review.report_path, review.report_sha256, '材料审核报告');
  const reportText = readFileSync(report, 'utf8');
  if ([review.handoff_sha256, review.framing_sha256, ...(tutorialProof && (contentForm === 'tutorial-video' || p.delivery_modes.some((x) => x !== 'EXPLANATION')) ? [handoffHash(tutorialProof)] : [])].some((digest) => !reportText.includes(digest))) fail('材料审核报告未指向当前handoff/承诺/实跑');
  return h;
}

export function verifyCreationBinding({handoff: h, contract, unitIds, visualAnchors = []}) {
  if (contract?.schema_version !== 1 || contract.handoff_sha256 !== handoffHash(h)) fail('写作决策未绑定当前handoff');
  const bindings = contract.unit_bindings;
  if (!nonEmptyList(unitIds) || !Array.isArray(bindings) || bindings.length !== unitIds.length || !nonEmptyList(bindings.map((x) => x?.content_unit_id)) || bindings.some((x) => !unitIds.includes(x.content_unit_id))) fail('正文单位未完整映射材料判断');
  const argumentIds = h.argument_units.map((x) => x.id);
  const sourceIds = h.sources.filter((x) => x.roles.some((r) => contentRoles.has(r))).map((x) => x.id);
  for (const binding of bindings) {
    if (!list(binding.argument_unit_ids) || binding.argument_unit_ids.some((id) => !argumentIds.includes(id))) fail('正文单位引用未知材料判断');
    if (binding.new_inference) {
      const n = binding.new_inference;
      if (!['EDITORIAL_INFERENCE', 'HYPOTHETICAL'].includes(n.kind) || !nonEmpty(n.basis) || !nonEmpty(n.boundary) || !list(n.source_ids) || n.source_ids.some((id) => !sourceIds.includes(id))) fail('正文单位新增推论缺依据/边界；新事实回材料阶段');
    } else if (!binding.argument_unit_ids.length) fail('正文单位缺材料判断或显式推论');
  }
  const visuals = contract.visual_bindings;
  if (!Array.isArray(visuals) || visuals.length !== visualAnchors.length || new Set(visuals.map((x) => x?.visual_anchor_index)).size !== visuals.length) fail('画面材料映射不完整');
  const materials = h.production.materials;
  const unitById = new Map(bindings.map((b) => [b.content_unit_id, b]));
  const relevant = (materialId, binding) => materials.find((m) => m.id === materialId)?.argument_unit_ids.some((id) => binding?.argument_unit_ids.includes(id));
  for (const v of visuals) {
    if (!Number.isInteger(v.visual_anchor_index) || v.visual_anchor_index < 0 || v.visual_anchor_index >= visualAnchors.length || !list(v.material_ids)
      || v.material_ids.some((id) => !materials.some((m) => m.id === id && m.status !== 'UNRESOLVED')) || (!v.material_ids.length && !nonEmpty(v.narration_only_reason))) fail('画面材料引用无效或未说明口播为何足够');
    if (v.material_ids.some((id) => !relevant(id, unitById.get(visualAnchors[v.visual_anchor_index].content_unit_id)))) fail('画面材料与其正文论证职责不一致');
  }
  const usedMaterials = [...visuals.flatMap((v) => v.material_ids), ...bindings.flatMap((b) => b.material_ids || [])];
  if (bindings.some((b) => b.material_ids && (!list(b.material_ids) || b.material_ids.some((id) => !materials.some((m) => m.id === id && m.status !== 'UNRESOLVED') || !relevant(id, b))))
    || materials.some((m) => m.required && !usedMaterials.includes(m.id))) fail('必要材料未落入正文/画面职责');
}
