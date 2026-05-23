#!/usr/bin/env node
// 浏览器录屏段 — Playwright headed 模式
//
// 用法：node browser_segment.js browser_actions.json
//
// 读取 JSON 中的导航步骤，在 headed 浏览器中依次执行。
// ffmpeg 在外部持续录物理屏幕，本脚本只控制浏览器显示内容。

const fs = require('fs');

async function run() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error('用法: node browser_segment.js <browser_actions.json>');
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (e) {
    console.error('读取 JSON 失败:', e.message);
    process.exit(1);
  }

  const { chromium } = require('playwright');
  const viewport = config.viewport || { width: 1920, height: 1080 };

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport });

  console.log(`浏览器已启动 (${viewport.width}x${viewport.height})`);

  for (let i = 0; i < config.steps.length; i++) {
    const step = config.steps[i];
    const label = step.label || `步骤 ${i + 1}`;

    switch (step.action) {
      case 'goto':
        console.log(`  → ${label}: ${step.url}`);
        await page.goto(step.url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        break;

      case 'wait':
        console.log(`  ⏱ ${label}: ${step.ms}ms`);
        await page.waitForTimeout(step.ms);
        break;

      case 'scroll': {
        const pixels = step.pixels || 400;
        const smooth = step.smooth !== false;
        console.log(`  ↕ ${label}: ${pixels}px${smooth ? ' (smooth)' : ''}`);
        if (smooth) {
          const chunks = Math.ceil(pixels / 200);
          const perChunk = Math.floor(pixels / chunks);
          for (let c = 0; c < chunks; c++) {
            await page.evaluate((px) => window.scrollBy(0, px), perChunk);
            await page.waitForTimeout(300 + Math.random() * 400);
          }
        } else {
          await page.evaluate((px) => window.scrollBy(0, px), pixels);
        }
        break;
      }

      case 'click':
        console.log(`  ← ${label}: ${step.selector}`);
        await page.click(step.selector, { timeout: 5000 }).catch(() => {
          console.log(`    ⚠ 未找到: ${step.selector}`);
        });
        break;

      default:
        console.log(`  ⚠ 未知 action: ${step.action}`);
    }
  }

  console.log('浏览器操作完成，保持打开 3 秒...');
  await page.waitForTimeout(3000);

  await browser.close();
  console.log('浏览器已关闭');
}

run().catch((e) => {
  console.error('浏览器录屏段失败:', e.message);
  process.exit(1);
});
