#!/usr/bin/env node

/**
 * 抖音热榜 AI 内容筛选
 * 从抖音热榜公开 API 拉取全量数据，用 tag+关键词双匹配过滤 AI 相关条目
 */

const https = require('https');

const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const TECH_TAG = 6000;

const AI_KEYWORDS = [
  'ai', 'AI', 'Artificial Intelligence',
  '人工智能', '大模型', '大语言模型',
  'chatgpt', 'claude', 'gemini', 'copilot',
  'gpt', 'openai', 'anthropic', 'deepseek',
  'sora', 'midjourney', 'stable diffusion',
  'llm', 'agentic', 'agent',
  '智谱', '通义', '文心', 'kimi', '豆包',
  'transformer', 'diffusion',
  '机器学习', '深度学习',
  'notebooklm', 'cursor', 'windsurf',
  'claude code', 'claudecode',
  'vibe coding', 'vibe coding',
  'ai编程', 'ai写代码',
];

function fetchHotBoard() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'www.douyin.com',
      path: '/aweme/v1/hot/search/list/',
      method: 'GET',
      headers: {
        'User-Agent': DESKTOP_UA,
        'Accept': 'application/json',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': 'https://www.douyin.com/',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`JSON 解析失败: ${e.message}`));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('请求超时')); });
    req.end();
  });
}

function isAIRelated(item) {
  if (item.sentence_tag === TECH_TAG) return true;
  const text = (item.word || '').toLowerCase();
  return AI_KEYWORDS.some((kw) => text.includes(kw.toLowerCase()));
}

function formatResult(items) {
  return items.map((item, idx) => ({
    rank: idx + 1,
    title: item.word || '无标题',
    heat: item.hot_value || 0,
    video_count: item.video_count || 0,
    link: `https://www.douyin.com/search/${encodeURIComponent(item.word || '')}`,
    is_tech_tag: item.sentence_tag === TECH_TAG,
    tag: item.sentence_tag,
  }));
}

function printResults(results) {
  if (results.length === 0) {
    console.log('当前抖音热榜无 AI 相关内容');
    return;
  }
  console.log(`抖音热榜 AI 相关 (${results.length} 条)`);
  console.log('='.repeat(60));
  results.forEach((r) => {
    console.log(`${r.rank}. ${r.title}`);
    console.log(`   热度: ${r.heat.toLocaleString()} | 视频: ${r.video_count} | tag: ${r.tag}${r.is_tech_tag ? ' (科技)' : ''}`);
    console.log(`   ${r.link}`);
  });
}

async function main() {
  const args = process.argv.slice(2);
  const format = args.includes('-f') ? args[args.indexOf('-f') + 1] : 'text';
  const limit = parseInt(args.find((a) => !a.startsWith('-')) || '0', 10) || 0;

  try {
    const data = await fetchHotBoard();
    if (!data?.data?.word_list) {
      console.error('热榜数据为空');
      process.exit(1);
    }

    let results = formatResult(data.data.word_list.filter(isAIRelated));
    if (limit > 0) results = results.slice(0, limit);

    if (format === 'json') {
      console.log(JSON.stringify(results, null, 2));
    } else {
      printResults(results);
    }
  } catch (e) {
    console.error(`获取失败: ${e.message}`);
    process.exit(1);
  }
}

main();
