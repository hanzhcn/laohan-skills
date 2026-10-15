#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const skill=readFileSync(join(root,'SKILL.md'),'utf8'),library=readFileSync(join(root,'references/qiuzhi-template-library.md'),'utf8');
for(const token of ['version: 1.21.1','QIUZHI_SINGLE_STYLE_THREE_SIZES','visual_system: QIUZHI_03KV','primary_aspect_ratio: "3:4"','required_generated_candidate_count: 1','required_physical_cover_count: 3','cover-qiuzhi-3x4','cover-qiuzhi-4x3','cover-qiuzhi-16x9','default_publish_candidate: cover-qiuzhi-3x4','image-use','gpt-image-2-codex'])assert.ok(skill.includes(token),'missing '+token);
// 生图执行器合同断言（v1.21.1 codex审查后补强：防变异删除关键 flag/尺寸/上限）
const cmdBlock=skill.slice(skill.indexOf('### 生图执行器'),skill.indexOf('## 5.'));
for(const flag of ['--no-style','--codex-provider ""','-i 05-封面/reference/jeffrey-reference.jpg','--backend codex','--size 1080x1440'])assert.ok(cmdBlock.includes(flag),'cmd missing '+flag);
for(const size of ['1080×1440','1440×1080','1920×1080'])assert.ok(skill.includes(size),'hard size missing '+size);
assert.ok(skill.includes('每个尺寸最多重采2次'),'re-sample cap missing');
assert.ok(skill.includes('比例偏差≤0.1%'),'ratio tolerance missing');
assert.ok(skill.includes('技术性重试与prompt重采共用每尺寸2次上限'),'retry-cap sharing missing');
assert.ok(skill.includes('C2PA/caBX不可见来源标记'),'invisible-provenance carve-out missing');
assert.ok(skill.includes('dropped refs或意外附图立即停止'),'foreign-ref guard missing');
for(const old of ['cover-qiuzhi-9x16','cover-01-qiuzhi-9x16','cover-02-qiuzhi-9x16','cover-03-qiuzhi-9x16','QIUZHI_THREE_RANKED_DIRECT_COVERS','01 → 02 → 03'])assert.ok(!skill.includes(old),'obsolete '+old);
assert.match(library,/只选择1个模板/);assert.doesNotMatch(library,/选择3个不同模板族/);
for(const scenario of [
 {name:'教程目标样本',conflict:'教程、步骤、怎么做',expected:'教学操作'},
 {name:'风险held-out',conflict:'风险、淘汰、骗局、危机',expected:'调查危机'},
 {name:'新品held-out',conflict:'新品、重大发布、首次出现',expected:'发布展示'},
])assert.ok(library.includes(`| ${scenario.conflict} | ${scenario.expected} |`),scenario.name+' semantic route missing');
console.log('PASS qiuzhi v1.21.1 single 03KV concept + exactly three sizes; obsolete ranks/master absent; two held-out conflict routes retained');
