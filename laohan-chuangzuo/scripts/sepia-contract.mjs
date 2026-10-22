import {createHash} from 'node:crypto';
import {existsSync, readFileSync, realpathSync, statSync} from 'node:fs';
import {join, resolve} from 'node:path';

export const SEPIA_COMMIT = 'fb06be76abeae7dd606960a32f2b10c1d1798e0d';
export const SEPIA_REFERENCES = ['professional-pass.md', 'discourse-pass.md', 'style-pass.md', 'languages/zh.md', 'model-fingerprints.md'];
export const SEPIA_COMPONENTS = ['sepia', 'sepia-write', 'sepia-review', 'sepia-refactor', 'sepia-recreate', 'sepia-hemingway'];
const sha = (value) => createHash('sha256').update(value).digest('hex');
const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;

// Hashes prove which bytes were reviewed; editorial and claim judgments still need independent review.
export function verifySepiaReview({review, base, spoken, unitIds, snapshotPath}) {
  const fail = (detail) => { throw new Error('Sepia语言审校: ' + detail); };
  const root = resolve(process.env.SEPIA_SKILLS_ROOT || join(process.env.HOME || '', '.agents/skills'));
  const canonical = join(root, 'sepia/SKILL.md');
  if (!review || review.status !== 'PASS' || review.skill !== 'sepia' || review.operation !== 'refactor'
    || review.skill_path !== 'agents-skills/sepia/SKILL.md' || review.upstream_commit !== SEPIA_COMMIT
    || !existsSync(canonical) || review.skill_sha256 !== sha(readFileSync(canonical))) fail('必须绑定完整Sepia原包及实际版本，旧humanizer或评分不能代替');
  const version = readFileSync(canonical, 'utf8').match(/^\s+version:\s*["']?([^\s"']+)/m)?.[1];
  if (!nonEmpty(version) || review.version !== version || 'quality_scores' in review) fail('版本不匹配或仍使用旧评分门');
  const components = review.components;
  if (!Array.isArray(components) || components.length !== SEPIA_COMPONENTS.length
    || SEPIA_COMPONENTS.some((name) => {
      const path = join(root, name, 'SKILL.md');
      const item = components.find((x) => x?.path === name + '/SKILL.md');
      return !existsSync(path) || !item || item.sha256 !== sha(readFileSync(path));
    })) fail('六个同级组件必须完整且绑定实际SHA');
  if (!['TECH_EXPLAINER', 'NONFICTION_COMMENTARY'].includes(review.route) || review.language !== 'zh-CN'
    || !nonEmpty(review.register) || !nonEmpty(review.author_model?.family) || !nonEmpty(review.author_model?.version)
    || !nonEmpty(review.executor_model?.family) || !nonEmpty(review.executor_model?.version)) fail('缺非虚构中文路由、语域或作者/执行模型身份');
  const expected = [...SEPIA_REFERENCES, ...(review.route === 'TECH_EXPLAINER' ? ['domains/tech-articles.md'] : [])];
  const refs = review.references;
  if (!Array.isArray(refs) || refs.length !== expected.length || new Set(refs.map((x) => x?.path)).size !== refs.length
    || expected.some((path) => {
      const file = join(root, 'sepia/references', path);
      const item = refs.find((x) => x?.path === path);
      return !item || !existsSync(file) || item.sha256 !== sha(readFileSync(file));
    })) fail('缺当前路由实际读取的references与SHA');
  const baseReal = realpathSync(base);
  const snapshot = resolve(base, review.input_snapshot_path || '');
  if (review.input_snapshot_path !== snapshotPath || !existsSync(snapshot) || !statSync(snapshot).isFile()
    || !realpathSync(snapshot).startsWith(baseReal + '/') || review.input_snapshot_sha256 !== sha(readFileSync(snapshot))
    || review.output_spoken_text_sha256 !== sha(spoken)) fail('输入快照或最终正文SHA不匹配');
  const audit = review.claim_audit;
  if (audit?.status !== 'PASS' || !Array.isArray(audit.audited_content_unit_ids) || audit.audited_content_unit_ids.length !== unitIds.length || new Set(audit.audited_content_unit_ids).size !== unitIds.length || unitIds.some((id) => !audit.audited_content_unit_ids.includes(id))
    || ['added_claims', 'removed_claims', 'changed_claims'].some((k) => !Array.isArray(audit[k]) || audit[k].length)
    || !nonEmpty(audit.reviewer) || !nonEmpty(audit.review_note)) fail('必须逐内容单位审计，语言修改不得增删改主张');
  if (!Array.isArray(review.findings) || review.findings.some((x) => !nonEmpty(x?.location) || !nonEmpty(x?.diagnosis)
    || !['RESOLVED', 'KEPT_WITH_REASON'].includes(x?.resolution) || !nonEmpty(x?.reason))
    || !nonEmpty(review.read_aloud_note) || Number.isNaN(Date.parse(review.applied_at))) fail('缺实际诊断、处理理由、直读记录或执行时间');
}
