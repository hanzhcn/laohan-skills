#!/usr/bin/env node
import {readFileSync, writeFileSync, existsSync, mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const ep = process.argv[2];
if (!ep) { console.error('用法: scan.mjs episodes/<slug>'); process.exit(1); }
const root = process.cwd();
const scriptPath = resolve(root, ep, '01-口播稿.md');
const skillDir = dirname(fileURLToPath(import.meta.url));
const keywordsPath = resolve(skillDir, '..', 'references', 'keywords.md');
const rulesetPath = resolve(skillDir, '..', 'references', 'ruleset.json');
if (!existsSync(scriptPath)) throw new Error('缺 01-口播稿.md');
if (!existsSync(keywordsPath)) throw new Error('缺 keywords.md');

const script = readFileSync(scriptPath, 'utf8');
const keywordsMd = readFileSync(keywordsPath, 'utf8');
const ruleset = JSON.parse(readFileSync(rulesetPath, 'utf8'));
const keywordsSha = createHash('sha256').update(keywordsMd).digest('hex');
const scriptSha = createHash('sha256').update(script).digest('hex');

// 变形归一化：全角转半角 + 去非汉字非字母数字符号
const normalize = (s) => s.replace(/[！-～]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/\s+/g, '').replace(/[^一-龥a-zA-Z0-9]/g, '');
const scriptNorm = normalize(script);

// 解析 keywords.md 提取关键词（按 ## 类 + 表格第一列）
const lines = keywordsMd.split('\n');
let currentCat = '';
const keywords = {};
for (const line of lines) {
  const h2 = line.match(/^## ([A-Z]+(?:-[A-Z]+)?)\s/);
  if (h2) { currentCat = h2[1]; keywords[currentCat] = []; continue; }
  if (currentCat && line.startsWith('|')) {
    const cols = line.split('|').map(c => c.trim());
    if (cols.length < 3) continue;
    const word = cols[1];
    if (!word || ['关键词','模式','规则','时期','变形类型'].includes(word) || word.startsWith('---') || word.startsWith('```') || word.includes(' ')) continue;
    if (word.length >= 2 && !word.match(/^(建议替换|说明|归一化方式|示例)$/)) keywords[currentCat].push(word);
  }
}

// 扫描
const hits = [];
for (const [cat, words] of Object.entries(keywords)) {
  for (const word of words) {
    const wordNorm = normalize(word);
    if (wordNorm && wordNorm.length >= 2 && scriptNorm.includes(wordNorm)) {
      const idx = script.indexOf(word);
      hits.push({category: cat, word, context: script.substring(Math.max(0,idx-5), idx+word.length+10).replace(/\n/g,' ')});
    }
  }
}

const output = {
  schema_version: 1,
  episode: ep.split('/').pop(),
  script_hash: scriptSha,
  ruleset_version: ruleset.ruleset_version,
  keywords_sha256: keywordsSha,
  scan_completed_at: new Date().toISOString(),
  hits, hit_count: hits.length
};
const outPath = resolve(root, ep, '02-违规扫描.json');
writeFileSync(outPath, JSON.stringify(output, null, 2));
console.log(`SCAN ${outPath}`);
console.log(`  ruleset=${ruleset.ruleset_version} keywords_sha=${keywordsSha.slice(0,12)} script=${scriptSha.slice(0,12)}`);
console.log(`  hits=${hits.length}`);
for (const h of hits) console.log(`  [${h.category}] ${h.word} :: ${h.context}`);
