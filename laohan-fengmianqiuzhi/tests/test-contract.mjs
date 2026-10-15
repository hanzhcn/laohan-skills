#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..');
const skill=readFileSync(join(root,'SKILL.md'),'utf8'),library=readFileSync(join(root,'references/qiuzhi-template-library.md'),'utf8');
for(const token of ['version: 1.21.0','QIUZHI_SINGLE_STYLE_THREE_SIZES','visual_system: QIUZHI_03KV','primary_aspect_ratio: "3:4"','required_generated_candidate_count: 1','required_physical_cover_count: 3','cover-qiuzhi-3x4','cover-qiuzhi-4x3','cover-qiuzhi-16x9','default_publish_candidate: cover-qiuzhi-3x4','image-use','gpt-image-2-codex','magick等比重采样'])assert.ok(skill.includes(token),'missing '+token);
for(const old of ['cover-qiuzhi-9x16','cover-01-qiuzhi-9x16','cover-02-qiuzhi-9x16','cover-03-qiuzhi-9x16','QIUZHI_THREE_RANKED_DIRECT_COVERS','01 → 02 → 03'])assert.ok(!skill.includes(old),'obsolete '+old);
assert.match(library,/只选择1个模板/);assert.doesNotMatch(library,/选择3个不同模板族/);
for(const scenario of [
 {name:'教程目标样本',conflict:'教程、步骤、怎么做',expected:'教学操作'},
 {name:'风险held-out',conflict:'风险、淘汰、骗局、危机',expected:'调查危机'},
 {name:'新品held-out',conflict:'新品、重大发布、首次出现',expected:'发布展示'},
])assert.ok(library.includes(`| ${scenario.conflict} | ${scenario.expected} |`),scenario.name+' semantic route missing');
console.log('PASS qiuzhi v1.21 single 03KV concept + exactly three sizes; obsolete ranks/master absent; two held-out conflict routes retained');
