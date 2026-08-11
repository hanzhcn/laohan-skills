#!/usr/bin/env node
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const skillRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const project = resolve(process.argv[2] || join(process.env.HOME || '', 'Documents/laohanAI视频创作'));
const read = (path, label) => {
  if (!existsSync(path)) throw new Error(`缺${label}: ${path}`);
  return readFileSync(path, 'utf8');
};

const skill = read(join(skillRoot, 'SKILL.md'), 'V5导演Skill');
const legacy = read(join(skillRoot, 'references/method-lab-legacy.md'), 'METHOD_LAB历史参考');
const method = JSON.parse(read(join(project, 'animation-method/director-system/method-v5.json'), 'V5方法真源'));
const template = read(join(project, 'templates/director-state-v5.md'), 'V5导演状态模板');

if (!/^version:\s*["']?2\.1\.1["']?\s*$/m.test(skill) || !/^description:.*V5\.1导演预制.*WAITING_FOR_FOOTAGE/m.test(skill)) throw new Error('laohan-daoyan元数据必须把V5.1两段导演预制声明为默认入口');
for (const token of ['UNDERSTAND_CONTENT', 'DIVERGE_2_TO_3_DIRECTIONS', 'CONVERGE_ONE_COHERENT_PLAN', 'DENSITY_REVIEW', 'ADVANCED_EXPRESSION_CHALLENGE', 'COHERENT_RECONVERGENCE', '2—3个本质不同的候选', '非穷尽技术搜索地图', '未入选候选不落盘', 'director_draft: COMPLETED', 'director_review: PENDING', 'director_review: COMPLETED', 'method-v5.json', 'director-state-v5.md', 'LIGHTWEIGHT_RESULT_ONLY', '唯一新增业务产物', 'status: WAITING_FOR_FOOTAGE', '_status.md', 'check-episode-contract.sh', '不得引用窗口开始时的旧PASS']) {
  if (!skill.includes(token)) throw new Error(`V5导演Skill缺少当前路线标记: ${token}`);
}
for (const forbiddenDefault of ['缺 clean.mp4、subtitles.srt', '在 09-导演/ 写入：导演简报.md', 'renderer_mode 为 CROSS_RENDER_VALIDATION_PAIR']) {
  if (skill.includes(forbiddenDefault)) throw new Error(`V5默认Skill残留METHOD_LAB合同: ${forbiddenDefault}`);
}
if (!skill.includes('只有用户明确说出“METHOD_LAB”') || !legacy.includes('beat-sheet.md') || !legacy.includes('animation-ast.json') || !legacy.includes('新episode和V5导演预制禁止读取')) throw new Error('METHOD_LAB必须保留在显式legacy分支，不能混入默认路线');
if (method.method_version !== 'V5' || method.workflow_revision !== 'V5.1' || method.mode !== 'DIRECTOR_FIRST' || method.director_final_review?.mode !== 'REQUIRED_BEFORE_PRODUCTION' || method.visual_quality_floor?.mode !== 'LIGHTWEIGHT_RESULT_ONLY' || !template.includes('quality_floor_policy: LIGHTWEIGHT_RESULT_ONLY')) throw new Error('Skill引用的项目V5.1方法、导演终审或视觉底线不匹配');

console.log('PASS laohan-daoyan V5 default routing + explicit METHOD_LAB legacy isolation');
