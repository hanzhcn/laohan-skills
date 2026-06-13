# B-roll 常用动画技法

> 从 6 个项目提炼的可复用技法。每个技法是独立 building block，按场景需要组合。
>
> **项目来源**：may-shorts-6、may-shorts-18、may-shorts-19、claude-edit-intro、golden-ratio-demo、tutorial6
>
> **颜色说明**：以下代码中的颜色值来自各项目的品牌色（AIS 品牌用 `#37bdf8`/`#f09025`，其他项目用各自 DESIGN.md），实际使用时替换为你的 DESIGN.md 中的 token。

## 1. Counter Count-up（数字跳动）

**适合**：数据/数字场景（"500+"、"3 种方案"、"10 个平台"）

来源：`may-shorts-6/scene1-hook`

```html
<!-- HTML -->
<span class="counter" id="counter">0</span><span class="plus" id="plus">+</span>

<!-- CSS -->
.counter {
  font-weight: 900; font-size: 360px; line-height: 0.9;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 60px rgba(55, 189, 248, 0.45);
}
.plus {
  font-size: 240px; opacity: 0; transform: scale(0);
  text-shadow: 0 0 50px rgba(240, 144, 37, 0.55);
}

<!-- JS — count-up with snap -->
const counter = { val: 0 };
const el = document.querySelector(SCOPE + ".counter");
tl.to(counter, {
  val: 500, duration: 0.65, ease: "power2.out",
  snap: { val: 1 },
  onUpdate: function () { if (el) el.textContent = Math.round(counter.val); }
}, 0.28);
// "+" bounce in after counter finishes
tl.to(SCOPE + ".plus",
  { opacity: 1, scale: 1, duration: 0.26, ease: "back.out(3)" }, 0.95);
```

**关键点**：`snap: { val: 1 }` 让数字只取整数，避免小数闪烁。

## 2. Clip-path Reveal（文字从左到右揭示）

**适合**：重点概念/标语/总结句

来源：`may-shorts-6/scene1-hook`

```html
<!-- CSS — 初始隐藏（clip 右侧 100%）-->
.stamp {
  clip-path: inset(0 100% 0 0);
  /* 或 polygon 版本（对角线揭示）：
  clip-path: polygon(0 0, 0 0, 0 100%, 0 100%); */
}

<!-- JS — reveal -->
tl.to(SCOPE + ".stamp",
  { clipPath: "inset(0 0% 0 0)", duration: 0.32, ease: "power3.out" }, 1.18);
```

**变体**：对角线揭示用 `polygon(0 0, 100% 0, 100% 100%, 0 100%)`，效果更有冲击力。

## 3. Underline Scale（下划线生长）

**适合**：标签下方强调线、CTA 按钮装饰

来源：`may-shorts-6/scene1-hook`

```html
<!-- HTML -->
<span class="text">从入门到进阶</span>
<span class="underline" id="underline"></span>

<!-- CSS -->
.underline {
  position: absolute; left: 0; bottom: -10px;
  height: 4px; width: 100%;
  background: #37bdf8;
  transform: scaleX(0);
  transform-origin: left center;
}

<!-- JS -->
tl.to(SCOPE + ".underline",
  { scaleX: 1, duration: 0.32, ease: "power2.out" }, 1.5);
```

## 4. Stagger List + Strike-through（列表逐行打叉）

**适合**：列举/枚举（"不是这样"、"三大误区"）

来源：`may-shorts-6/scene3-flashy-list`

```html
<!-- HTML（每行一个 row + 一个 strike）-->
<div class="row" id="row1">
  <span class="text">门槛很高</span>
  <span class="strike" id="strike1"></span>
</div>
<div class="row" id="row2">
  <span class="text">很难学</span>
  <span class="strike" id="strike2"></span>
</div>

<!-- CSS -->
.row {
  position: relative;
  font-weight: 900; font-size: 78px;
  color: rgba(255, 255, 255, 0.55);
  opacity: 0; transform: translateX(-30px);
}
.strike {
  position: absolute; left: -10px; top: 50%;
  height: 7px; width: calc(100% + 20px);
  background: #f09025;
  transform-origin: left center;
  transform: scaleX(0);
  box-shadow: 0 0 18px rgba(240, 144, 37, 0.6);
}

<!-- JS — 每行先滑入，再打叉 -->
const GAP = 0.5; // 行间间隔
const ROWS = [
  { row: "#row1", strike: "#strike1", t: 0.3 },
  { row: "#row2", strike: "#strike2", t: 0.3 + GAP },
  { row: "#row3", strike: "#strike3", t: 0.3 + GAP * 2 },
];
ROWS.forEach(({ row, strike, t }) => {
  tl.to(SCOPE + row,
    { opacity: 1, x: 0, duration: 0.34, ease: "power3.out" }, t);
  tl.to(SCOPE + strike,
    { scaleX: 1, duration: 0.32, ease: "power2.out" }, t + 0.4);
});
```

**关键点**：文字用 `rgba(255,255,255,0.55)` 半透明，strike 用 accent 色 + glow，视觉对比明显。

## 5. Chrome Gradient Sweep（金属渐变扫光）

**适合**：hero 大字/核心概念强调（"约束先行"、"效率×10"）

来源：`may-shorts-6/scene6-boring`

```html
<!-- CSS — 8-stop chrome gradient -->
.hero-word {
  font-weight: 900; font-size: 200px;
  background: linear-gradient(90deg,
    #1a1410 0%, #5a3215 25%, #c84f1c 40%,
    #f09025 55%, #ffd84a 65%, #ffffff 80%, #1a1410 100%
  );
  background-size: 300% 100%;
  background-position: 100% 0;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0; transform: translateY(20px);
}

<!-- JS — 文字入场 + gradient 扫过 -->
tl.to(SCOPE + ".hero-word",
  { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, 0.34);
tl.to(SCOPE + ".hero-word",
  { backgroundPosition: "0% 0", duration: 0.7, ease: "power2.out" }, 0.5);
```

**关键点**：
- `background-size: 300% 100%` 让渐变比文字宽 3 倍，扫光效果明显
- 初始 `background-position: 100% 0`（右侧），动画到 `0% 0`（左侧）
- 颜色从深到亮再到深，模拟金属反光

**变体配色**：冷色系（蓝色系，适合科技/AI 场景）：
```
#0a0a1a 0%, #1a2a4a 25%, #2a5a8a 40%, #37bdf8 55%, #a5d8ff 65%, #ffffff 80%, #0a0a1a 100%
```

## 6. Mask-image Feather（边缘渐变柔化）

**适合**：所有 overlay 场景 bg 面板的右边缘

来源：`may-shorts-6/scene1-hook`（所有场景都用）

```css
.panel {
  mask-image: linear-gradient(90deg, #000 0%, #000 88%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 88%, transparent 100%);
}
```

**变体**：更宽的羽化（12% → 20%）：
```css
mask-image: linear-gradient(90deg, #000 0%, #000 80%, transparent 100%);
```

## 7. Vignette Breathing（暗角呼吸）

**适合**：所有场景的 ambient 效果

```js
const cycles = Math.ceil(DURATION / 4) - 1;
tl.to('.vignette', {
  opacity: '+=0.08', duration: 2,
  repeat: cycles, yoyo: true, ease: 'sine.inOut'
}, 1.5);
```

**关键点**：用 `'+=0.08'` 相对值而非绝对值，确保不同 opacity 起点都能正常呼吸。

## 8. Title Micro-scale Breathing（标题微缩放呼吸）

**适合**：停留时间较长的标题/关键词

```js
const titleCycles = Math.ceil(DURATION / 6) - 1;
tl.to('.title', {
  scale: '+=0.015', duration: 3,
  repeat: titleCycles, yoyo: true, ease: 'sine.inOut'
}, 2.0);
```

## 通用 CSS 模式

### 面板基础结构（所有场景共用）

```css
[data-composition-id="xxx"] .panel {
  position: absolute; top: 0; left: 0;
  width: 960px; height: 1080px;          /* 宽度按需设计 */
  background: linear-gradient(135deg, #07121c 0%, #0a1828 70%, #0d2031 100%);
  display: flex; flex-direction: column;
  align-items: flex-start; justify-content: center;
  gap: 36px; padding: 80px 100px;
  box-sizing: border-box; overflow: hidden;
  mask-image: linear-gradient(90deg, #000 0%, #000 88%, transparent 100%);
  -webkit-mask-image: linear-gradient(90deg, #000 0%, #000 88%, transparent 100%);
}
```

### 标签样式

```css
.label {
  font-family: "Roboto Mono", monospace;
  font-weight: 500; font-size: 44px;
  letter-spacing: 0.18em;  /* 宽字距，统一视觉节奏 */
  opacity: 0;  /* 初始隐藏，GSAP 入场 */
}
```

## 9. X-mark Pop + Global Strike（否定标记弹入 + 全局否定线）

**适合**：否定/反转场景（"不需要"、"别这么做"、"已经过时"）

来源：`may-shorts-6/scene2-not-needed`

```html
<!-- HTML -->
<div class="big">
  <span class="x-mark" id="x-mark">✕</span>
  <span class="text" id="neg-text">不需要<br/>这些</span>
</div>
<div class="global-strike" id="global-strike"></div>

<!-- CSS -->
.x-mark {
  color: #f09025;                     /* warm accent */
  font-size: 260px; line-height: 0.8;
  opacity: 0; transform: scale(0.4);
  text-shadow: 0 0 60px rgba(240,144,37,0.55);
}
.text {
  font-weight: 900; font-size: 130px; line-height: 0.96;
  color: #fff; opacity: 0; transform: translateY(20px);
}
.global-strike {
  position: absolute; bottom: 320px; left: 100px;
  height: 8px; width: 460px;
  background: #f09025;
  transform-origin: left center; transform: scaleX(0);
  box-shadow: 0 0 24px rgba(240,144,37,0.5);
}

<!-- JS — label fade → X 弹入 → 文字入场 → 否定线生长 -->
tl.to('.label', { opacity: 1, duration: 0.3, ease: "power2.out" }, 0.05);
tl.to('.x-mark', { opacity: 1, scale: 1, duration: 0.32, ease: "back.out(2.4)" }, 0.32);
tl.to('.text', { opacity: 1, y: 0, duration: 0.34, ease: "power2.out" }, 0.55);
tl.to('.global-strike', { scaleX: 1, duration: 0.4, ease: "power3.out" }, 1.3);
```

**关键点**：与技法4（逐行打叉）不同——这是**单一否定标记 + 底部全局否定线**，适合"整体否定"而非"逐项否定"。X 用 `back.out(2.4)` 弹入产生冲击感。

## 10. Check-list Stagger + Dual-accent（勾选列表 + 双色优先级）

**适合**：肯定/正面列举（"核心功能"、"三大优势"、"你需要这些"）

来源：`may-shorts-6/scene4-want-list`

```html
<!-- HTML — 每行一个勾选 + 文字 -->
<div class="row" id="row1">
  <span class="check">✓</span>
  <span class="text">省时间</span>
</div>
<div class="row" id="row2">
  <span class="check check-warn">✓</span>
  <span class="text text-warn">能赚钱</span>
</div>

<!-- CSS -->
.row {
  display: flex; align-items: center; gap: 28px;
  font-weight: 900; font-size: 96px; line-height: 1.0;
  color: #fff; opacity: 0; transform: translateX(-30px);
}
.check {
  color: #37bdf8; font-size: 96px;                  /* 主 accent 蓝 */
  text-shadow: 0 0 28px rgba(55,189,248,0.65);
}
.check-warn {
  color: #f09025;                                    /* warm accent 橙 — 高优先级标记 */
  text-shadow: 0 0 28px rgba(240,144,37,0.65);
}
.text-warn {
  color: #f09025;
  text-shadow: 0 0 32px rgba(240,144,37,0.45);
}

<!-- JS — 逐行 stagger 滑入 -->
tl.to('.label', { opacity: 1, duration: 0.28, ease: "power2.out" }, 0.05);
tl.to('#row1', { opacity: 1, x: 0, duration: 0.36, ease: "back.out(1.6)" }, 0.32);
tl.to('#row2', { opacity: 1, x: 0, duration: 0.36, ease: "back.out(1.6)" }, 1.5);
```

**关键点**：技法4（否定打叉）的镜像——**肯定勾选**。双色系统用蓝=普通项、橙=重点项，一行 CSS class 切换。stagger 间隔可以不均匀（示例中 row1→row2 间隔 1.18s），让重点项有停顿感。

## 11. Burst Flash + Punch Card（爆闪径向光 + 冲击卡片弹入退场）

**适合**：极短冲击过渡（<1s）、情绪转折点、"就是这样"时刻

来源：`may-shorts-6/scene5-thats-it`

```html
<!-- HTML — 无 panel，全屏 overlay（HERO 模式，face 全屏在后面）-->
<div class="burst" id="burst"></div>
<div class="punch-card" id="punch-card">
  <div class="punch-text">就是<br/>这样。</div>
</div>

<!-- CSS -->
.burst {
  position: absolute; left: 50%; top: 22%;
  width: 800px; height: 800px;
  margin-left: -400px; margin-top: -400px;
  background: radial-gradient(circle,
    rgba(240,144,37,0.45) 0%, rgba(240,144,37,0.18) 30%, transparent 65%);
  opacity: 0; transform: scale(0.4);
  will-change: transform, opacity;
}
.punch-card {
  position: absolute; left: 50%; top: 18%;
  transform: translateX(-50%) translateY(20px) scale(0.85);
  opacity: 0; text-align: center;
  font-weight: 900; font-size: 200px; line-height: 0.95;
  color: #fff;
  text-shadow: /* 8方向描边 */
    -4px -4px 0 #07121c, 4px -4px 0 #07121c,
    -4px 4px 0 #07121c, 4px 4px 0 #07121c,
    -5px 0 0 #07121c, 5px 0 0 #07121c,
    0 -5px 0 #07121c, 0 5px 0 #07121c,
    0 0 60px rgba(240,144,37,0.55);
}

<!-- JS — 爆闪放大+淡出 与 卡片弹入 退场 交叉 -->
// Burst: 快速放大后淡出
tl.to('#burst', { opacity: 1, scale: 1, duration: 0.22, ease: "power3.out" }, 0);
tl.to('#burst', { opacity: 0, scale: 1.3, duration: 0.55, ease: "power2.in" }, 0.22);
// Card: 弹入 → 短暂停留 → 向上飘退
tl.to('#punch-card', { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "back.out(2.4)" }, 0.05);
tl.to('#punch-card', { opacity: 0, y: -16, duration: 0.22, ease: "power2.in" }, 0.78);
```

**关键点**：
- **唯一带完整退场动画**的 overlay 场景（0.96s 总时长）。正常 overlay 不写退场，但极短冲击场景需要，否则 face-wrapper 恢复时视觉不连贯
- burst 和 card 几乎同时开始（0ms vs 0.05ms），但结束时间错开（burst 0.77s, card 1.0s）
- 无 panel、无 bg 渐变——直接叠在 HERO 模式的人脸上，所以需要 8 方向描边保证可读性

## 12. Text-stroke Outline（8 方向文字描边）

**适合**：任何需要叠在复杂背景上的文字（爆闪场景、字幕、无 panel 的全屏文字）

来源：`may-shorts-6/scene5-thats-it` + `captions.html`

```css
.text-stroke {
  text-shadow:
    -4px -4px 0 #07121c,    /* 左上 */
     4px -4px 0 #07121c,    /* 右上 */
    -4px  4px 0 #07121c,    /* 左下 */
     4px  4px 0 #07121c,    /* 右下 */
    -5px  0  0 #07121c,    /* 左 */
     5px  0  0 #07121c,    /* 右 */
     0 -5px  0 #07121c,    /* 上 */
     0  5px  0 #07121c,    /* 下 */
     0  0 60px rgba(240,144,37,0.55);  /* 外 glow（可选）*/
}
```

**变体**：纯白描边（浅色背景）：
```css
text-shadow:
  -3px -3px 0 #000, 3px -3px 0 #000,
  -3px 3px 0 #000, 3px 3px 0 #000,
  -4px 0 0 #000, 4px 0 0 #000,
  0 -4px 0 #000, 0 4px 0 #000;
```

**关键点**：8 方向描边确保文字在任何背景（视频帧、渐变、爆闪）上可读。比 `backdrop-filter: blur()` 性能更好（无 GPU 开销）。描边颜色通常用最深背景色（`#07121c`），让描边融入背景。

## 组合示例

一个"数据展示 + 列表"场景的典型组合：

```
1. 面板基础（CSS pattern）→ 承载所有元素
2. 标签入场 → opacity fade-in
3. Chrome gradient hero word → 核心数据
4. Stagger list → 子项逐行入场
5. Underline → CTA 行动号召
6. Vignette breathing → ambient 保持活跃
7. Anchor tween → 锁定时长
```

不需要用全部技法——每个场景选 2-3 个组合即可。选的依据是步骤 4 的内容类型和情绪。


## 13. Stamp Badge + Backdrop-filter（倾斜印章徽章）

**适合**：价格标签、核心卖点、重要数据强调（"$20"、"PRO会员"、"已验证"）

来源：`may-shorts-6/scene7-pay-for.html`

```html
<!-- HTML -->
<div class="stamp" id="stamp">
  <span class="stamp-amount">$20</span>
  <span class="stamp-label">PRO会员</span>
</div>
<div class="banner" id="banner">
  <div class="banner-bar" id="banner-bar"></div>
  <div class="banner-text">这是企业愿意付费的</div>
</div>

<!-- CSS -->
.stamp {
  position: absolute; top: 80px; left: 90px;
  padding: 30px 56px;
  border: 6px solid #f09025;          /* accent 色边框 */
  border-radius: 22px;
  background: rgba(7, 18, 28, 0.78);  /* 半透明深色底 */
  backdrop-filter: blur(12px);         /* 毛玻璃效果 */
  -webkit-backdrop-filter: blur(12px);
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  opacity: 0;
  transform: rotate(-6deg) scale(0.8); /* 初始倾斜+缩小 */
  box-shadow:
    0 0 60px rgba(240, 144, 37, 0.45),       /* 外 glow */
    inset 0 0 30px rgba(240, 144, 37, 0.12);  /* 内 glow */
}
.stamp-amount {
  font-weight: 900; font-size: 140px;
  color: #f09025; letter-spacing: -0.04em;
  text-shadow: 0 0 32px rgba(240, 144, 37, 0.65);
}
.stamp-label {
  font-family: "Roboto Mono", monospace;
  font-weight: 700; font-size: 46px; letter-spacing: 0.18em; color: #fff;
}
.banner {
  position: absolute; bottom: 230px; left: 0; width: 100%; height: 88px;
  display: flex; align-items: center; justify-content: center; opacity: 0;
}
.banner-bar {
  position: absolute; left: 50%; top: 50%;
  height: 88px; width: 940px; margin-left: -470px; margin-top: -44px;
  background: linear-gradient(90deg, transparent 0%, rgba(7,18,28,0.92) 12%, rgba(7,18,28,0.92) 88%, transparent 100%);
  border-top: 2px solid rgba(240, 144, 37, 0.55);
  border-bottom: 2px solid rgba(240, 144, 37, 0.55);
  transform: scaleX(0); transform-origin: center center;
}
.banner-text {
  position: relative; z-index: 1;
  font-family: "Roboto Mono", monospace; font-weight: 700; font-size: 44px;
  letter-spacing: 0.22em; color: #fff;
  text-shadow: 0 0 24px rgba(240, 144, 37, 0.6); opacity: 0;
}

<!-- JS — stamp 弹入 → banner 展开 → 文字淡入 -->
tl.to(SCOPE + "#stamp",
  { opacity: 1, scale: 1, rotate: -6, duration: 0.34, ease: "back.out(2.6)" }, 0.05);
tl.to(SCOPE + "#banner",
  { opacity: 1, duration: 0.28, ease: "power2.out" }, 0.35);
tl.to(SCOPE + "#banner-bar",
  { scaleX: 1, duration: 0.42, ease: "power3.out" }, 0.35);
tl.to(SCOPE + ".banner-text",
  { opacity: 1, duration: 0.28, ease: "power2.out" }, 0.6);
```

**关键点**：
- `backdrop-filter: blur(12px)` 创造毛玻璃效果，让背景透过来
- `rotate(-6deg) scale(0.8)` 初始状态，`back.out(2.6)` 弹入时保留倾斜角度
- 外 glow + 内 glow 双层 box-shadow 增加立体感
- Banner 条从中心 scaleX 展开，两端渐变透明

## 14. Logo Crystallize + Shimmer Sweep（品牌 logo 弹入 + 光泽扫过）

**适合**：outro/endcard 品牌露出、logo reveal

来源：`may-shorts-6/scene8-cta-outro.html`

```html
<!-- HTML -->
<img class="logo" id="logo" src="assets/logo.png" alt="品牌" />
<div class="cta" id="cta">
  <span class="cta-pre">评论区</span>
  <span class="cta-key" id="cta-key">自取</span>
</div>
<div class="wordmark" id="wordmark">
  <span>品牌名</span>
  <span class="wordmark-bar" id="wordmark-bar"></span>
</div>
<div class="shimmer" id="shimmer"></div>

<!-- CSS -->
.logo {
  width: 220px; height: auto;
  opacity: 0; transform: translateY(40px) scale(0.92);
  filter: drop-shadow(0 0 24px rgba(55, 189, 248, 0.55));
}
.cta {
  display: flex; align-items: baseline; gap: 36px;
  font-weight: 900; font-size: 220px; line-height: 0.95;
  color: #fff; opacity: 0; transform: translateY(30px);
  text-shadow: 0 0 60px rgba(55, 189, 248, 0.35), 0 6px 20px rgba(0,0,0,0.55);
}
.cta-key {
  color: #f09025;
  text-shadow: 0 0 36px rgba(240, 144, 37, 0.6), 0 0 80px rgba(240, 144, 37, 0.35);
}
.wordmark {
  position: relative;
  font-family: "Roboto Mono", monospace; font-weight: 700; font-size: 48px;
  letter-spacing: 0.22em; color: #fff; opacity: 0; padding-bottom: 16px;
}
.wordmark-bar {
  position: absolute; left: 0; bottom: 0;
  height: 3px; width: 100%;
  background: linear-gradient(90deg, #37bdf8 0%, #f09025 100%);
  transform: scaleX(0); transform-origin: left center;
}
.shimmer {
  position: absolute; top: 0; left: -40%;
  width: 30%; height: 100%;
  background: linear-gradient(110deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%);
  opacity: 0; pointer-events: none; filter: blur(6px);
}

<!-- JS — logo 弹入 → CTA 落地 → 关键词 pop → wordmark 淡入 + bar wipe → shimmer 扫过 -->
// Logo crystallizes from below
tl.to(SCOPE + "#logo",
  { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "back.out(1.6)" }, 0.1);
// CTA lands
tl.to(SCOPE + "#cta",
  { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }, 0.45);
// Accent word pop
tl.fromTo(SCOPE + "#cta-key",
  { scale: 0.92 }, { scale: 1.06, duration: 0.22, ease: "back.out(3)" }, 0.78);
tl.to(SCOPE + "#cta-key",
  { scale: 1, duration: 0.32, ease: "power2.out" }, 1.0);
// Wordmark + bar wipe
tl.to(SCOPE + "#wordmark",
  { opacity: 1, duration: 0.4, ease: "power2.out" }, 1.0);
tl.to(SCOPE + "#wordmark-bar",
  { scaleX: 1, duration: 0.55, ease: "power3.out" }, 1.15);
// Shimmer sweep
tl.set(SCOPE + "#shimmer", { opacity: 1 }, 1.8);
tl.fromTo(SCOPE + "#shimmer",
  { x: 0 }, { x: "1500%", duration: 1.0, ease: "power2.inOut" }, 1.8);
tl.set(SCOPE + "#shimmer", { opacity: 0 }, 2.85);
```

**关键点**：
- Logo 用 `translateY(40px) scale(0.92)` 初始状态，`back.out(1.6)` 弹入——"结晶"感
- CTA 关键词用 `fromTo scale 0.92→1.06→1` 三段式 pop，比单纯 fade 有冲击力
- Shimmer 用 `left: -40%` 起点 + `x: "1500%"` 终点，确保扫过整个画面
- `filter: blur(6px)` 让 shimmer 边缘柔和，不像硬切割
- 所有时间点基于 4.14s 的 outro 时长，按需调整

## 15. Scan-line Sweep（扫描线横扫）

**适合**：场景开场、转场分隔、品牌条标记（3px 渐变条从左到右横扫）

来源：`may-shorts-18/scene1+scene6`、`may-shorts-19/scene4+scene7`、`golden-ratio-demo/root`

```html
<div class="scan-line" id="scan-line"></div>

<!-- CSS -->
.scan-line {
  position: absolute; top: 0; left: 0;
  width: 100%; height: 3px;
  background: linear-gradient(90deg, transparent, #37bdf8 35%, #f09025 65%, transparent);
  opacity: 0.9;
}
```

```js
// GSAP
tl.fromTo("#scan-line",
  { x: "-100%" },
  { x: "100%", duration: 0.65, ease: "power2.inOut" }, 0);
```

**关键点**：
- 3px 高度 + blur 天然融合背景，不需要额外模糊
- 双色渐变（品牌色→暖色）比单色更有质感
- 放在场景最开头（t=0），让"条扫过→内容入场"成为固定节奏
- 可重复：may-shorts-19 在 scene4 和 scene7 都用它做开场标记

## 16. Slam + Micro-tremor（重击 + 微震）

**适合**：关键文字/元素入场强调（弹入后快速抖动 2-3 次，模拟冲击余震）

来源：`may-shorts-18/scene1+scene2+scene5`、`may-shorts-19/scene3+scene4+scene5`、`golden-ratio-demo/scene02+scene04`

```html
<span class="hero" id="hero-text">SWITCH.</span>

<!-- CSS -->
.hero {
  font-weight: 900; font-size: 200px; color: #f09025;
  opacity: 0; transform: scale(0.7);
  text-shadow: 0 0 60px rgba(240,144,37,0.8), 0 8px 0 #07121c;
}
```

```js
// Phase 1: Slam entrance
tl.to("#hero-text",
  { opacity: 1, scale: 1, duration: 0.38, ease: "back.out(2.2)" }, 0.4);

// Phase 2: Micro-tremor (after slam settles)
tl.to("#hero-text",
  { x: 6, duration: 0.04, yoyo: true, repeat: 3, ease: "power1.inOut" }, 0.8);
```

**关键点**：
- Slam 用 `back.out(2.0-2.8)` 过冲 ease，模拟"砸进来"
- Tremor 延迟 0.3-0.4s（等 slam 的过冲动画稳定后）
- Tremor 极短：`duration: 0.04-0.06s`，`x/y: 4-6px`，`repeat: 3-4`——快到几乎看不到，但能"感觉到"
- 可叠加：scale slam + rotation slam + tremor 组合效果最强
- golden-ratio-demo 的 hero 数字用 `scale(0.35) rotate(-8deg)` 双维 slam

## 17. Text-shadow Glow Pulse（文字辉光呼吸）

**适合**：已入场的重点文字需要持续"活着"的感觉（ambient 动效）

来源：`may-shorts-18/scene1+scene4+scene6`、`may-shorts-19/scene3`

```css
.glow-text {
  color: #37bdf8;
  text-shadow: 0 0 30px rgba(55,189,248,0.55), 0 6px 0 #07121c;
}
```

```js
const glowCycles = Math.ceil(DURATION / 3) - 1;
tl.to("#glow-text",
  { textShadow: "0 0 72px rgba(55,189,248,0.9), 0 6px 0 #07121c",
    duration: 0.4, yoyo: true, repeat: glowCycles,
    ease: "sine.inOut" }, 1.5);
```

**关键点**：
- 只动画 `textShadow` 属性，不动 transform/opacity——性能好
- 低频呼吸（0.4s yoyo × 3-4 周期），不会分散注意力
- `sine.inOut` ease 保证呼吸平滑无顿挫
- 适合与 Vignette Breathing（#7）同步节奏

## 18. Chip/Pill Badge Pop（药丸徽章弹入）

**适合**：标签、功能名、CTA 按钮、关键词高亮（圆角药丸形元素）

来源：`may-shorts-18/scene2+scene6`、`may-shorts-19/scene2+scene4+scene7`、`golden-ratio-demo/scene02-04`、`tutorial6/scene2`

```html
<span class="chip" id="chip">ACTUAL USE</span>

<!-- CSS -->
.chip {
  display: inline-block; padding: 8px 24px;
  border-radius: 999px; border: 3px solid #f09025;
  background: rgba(7,18,28,0.92);
  font: 700 32px "Roboto Mono", monospace; color: #f09025;
  opacity: 0; transform: scale(0.5);
  box-shadow: 0 0 40px rgba(240,144,37,0.4);
}
```

```js
// Entrance
tl.to("#chip",
  { opacity: 1, scale: 1, duration: 0.34, ease: "back.out(2.4)" }, 0.3);
// Optional: scale pulse hold
tl.to("#chip",
  { scale: 1.05, duration: 0.26, yoyo: true, repeat: 1, ease: "sine.inOut" }, 0.95);
```

**关键点**：
- `border-radius: 999px` 确保完全圆角
- `back.out(2.4)` 的过冲量比文字入场更大——小元素需要更多弹力才显眼
- 可叠加 Glow Pulse（#17）在 chip 上做持续动效
- 变体：实心填充（`background: #37bdf8`）vs 描边（`border: 3px solid`）

## 19. SVG Stroke-draw（SVG 路径描绘）

**适合**：图标描边动画、连接线绘制、X-mark 叉号、气泡轮廓、环形进度条

来源：`may-shorts-18/scene2+scene4+scene6`、`may-shorts-19/scene2+scene7`、`golden-ratio-demo/scene01+scene05`

```html
<svg viewBox="0 0 100 100" width="120" height="120">
  <line x1="20" y1="20" x2="80" y2="80"
        stroke="#f09025" stroke-width="8" stroke-linecap="round"
        pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"
        id="line1" />
  <line x1="80" y1="20" x2="20" y2="80"
        stroke="#f09025" stroke-width="8" stroke-linecap="round"
        pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"
        id="line2" />
</svg>
```

```js
tl.to("#line1",
  { strokeDashoffset: 0, duration: 0.22, ease: "power2.out" }, 0.12);
tl.to("#line2",
  { strokeDashoffset: 0, duration: 0.22, ease: "power2.out" }, 0.22);
```

**关键点**：
- `pathLength="1"` 归一化路径长度，配合 `strokeDasharray: "1"` + `strokeDashoffset: 1→0` 实现描绘
- 比 CSS clip-path 更适合有机曲线（SVG 路径任意形状）
- 可用于：X-mark（#9 的 SVG 实现）、气泡轮廓、环形进度、路径动画、对勾打勾
- 确定性：纯 GSAP tween，无随机值，渲染安全
- golden-ratio-demo 用此技法描绘黄金螺旋弧线（`strokeDashoffset: 2000→0`，长路径）

## 20. Spark Burst（火花放射）

**适合**：冲击时刻的粒子爆发（6-8 个小圆点从中心向外扩散然后消失）

来源：`may-shorts-18/scene4`、`may-shorts-19/scene3`

```html
<div class="sparks" id="sparks">
  <span class="spark"></span><!-- ×6，通过 CSS transform 分散方向 -->
</div>

<!-- CSS -->
.spark {
  position: absolute; top: 50%; left: 50%;
  width: 10px; height: 10px; border-radius: 50%;
  background: #f09025; opacity: 0; transform: scale(0.3);
  box-shadow: 0 0 14px rgba(240,144,37,0.85);
}
```

```js
const sparks = gsap.utils.toArray("#sparks .spark");
// Phase 1: burst out
tl.to(sparks,
  { opacity: 1, scale: 1.4, duration: 0.26,
    ease: "back.out(2.5)", stagger: 0.06 }, burstTime);
// Phase 2: fade
tl.to(sparks,
  { opacity: 0, scale: 0.6, duration: 0.44, ease: "power2.in" }, burstTime + 0.3);
```

**关键点**：
- 确定性：方向通过 CSS `transform: rotate(Ndeg) translateX(60px)` 预设，不用 `Math.random()`
- 两阶段：快速扩散（0.26s, `back.out`）→ 缓慢消失（0.44s, `power2.in`）
- `stagger: 0.06` 让粒子有先后，不是同时出现
- 颜色和主场景保持一致，不要引入第三种颜色
- 适合与 Slam（#16）组合：slam 落地瞬间触发 spark

## 21. Background-position Shimmer（背景位移微光）

**适合**：渐变文字的持续微光效果（文字上有一道光不断扫过）

来源：`claude-edit-intro/beat5`、`golden-ratio-demo/scene05`、`tutorial6/scene1+scene8`

```css
.shimmer-text {
  background: linear-gradient(120deg, #9aceff, #e9a8ff, #ffd166, #9efff0, #e9a8ff, #9aceff);
  background-size: 200% 100%;
  -webkit-background-clip: text; color: transparent;
}
```

```js
const shimmerCycles = Math.ceil(DURATION / 4) - 1;
tl.fromTo(".shimmer-text",
  { backgroundPosition: "0% 50%" },
  { backgroundPosition: "200% 50%", duration: 2.6,
    ease: "sine.inOut", yoyo: true, repeat: shimmerCycles }, 1.0);
```

**关键点**：
- `background-size: 200%` + `backgroundPosition: "0%→200%"` 是核心——渐变宽度两倍于容器，位移时产生扫光
- 用 `sine.inOut` + `yoyo` 保证来回扫光平滑
- `-webkit-background-clip: text` + `color: transparent` 让渐变只出现在文字形状内
- 多色渐变（3-5 色）比双色更有"光"的感觉
- 性能好：只动画 `backgroundPosition`，不触发 layout/paint

## 22. Seam Treatment（面/内容交界处理）

**适合**：上下分屏架构（BOTTOM 模式）中面视频与 overlay 面板的接缝处理

来源：`may-shorts-18/seam-treatment`、`may-shorts-19/seam-treatment`

```html
<div class="seam-gradient" id="seam-gradient"></div>
<div class="seam-line" id="seam-line"></div>

<!-- CSS -->
.seam-gradient {
  position: absolute; top: 960px; left: 0;
  width: 100%; height: 80px;
  background: linear-gradient(to bottom,
    rgba(7,18,28,0.85) 0%, rgba(7,18,28,0.4) 35%, rgba(7,18,28,0) 100%);
  pointer-events: none; opacity: 0;
}
.seam-line {
  position: absolute; top: 958px; left: 0;
  width: 100%; height: 2px;
  background: linear-gradient(90deg,
    transparent, rgba(55,189,248,0.35) 20%, rgba(55,189,248,0.9) 50%,
    rgba(55,189,248,0.35) 80%, transparent);
  box-shadow: 0 0 18px rgba(55,189,248,0.55);
  pointer-events: none; opacity: 0;
}
```

```js
// Show during BOTTOM-mode scenes only
// Visible windows: [0.0-2.36], [7.38-10.32], [13.82-19.82]
tl.to("#seam-gradient", { opacity: 1, duration: 0.25, ease: "power2.out" }, 0);
tl.to("#seam-line", { opacity: 0.8, duration: 0.25, ease: "power2.out" }, 0);
// Hide during FULLSCREEN/HIDDEN scenes
tl.to("#seam-gradient", { opacity: 0, duration: 0.25, ease: "power2.in" }, 2.36);
tl.to("#seam-line", { opacity: 0, duration: 0.25, ease: "power2.in" }, 2.36);
```

**关键点**：
- 只在 BOTTOM 模式（上下分屏）时显示，FULLSCREEN/HIDDEN 时隐藏
- 渐变层 + 线条层分离：渐变做柔化，线条做标记
- `top: 958-960px`（1080p 的 89%）定位在面/内容交界处
- 线条用 `box-shadow` 辉光，比纯色线更有科技感
- **仅上下分屏架构需要**，左右分屏用 Mask-image Feather（#6）即可

## 23. Word-level Karaoke（逐词卡拉OK高亮）

**适合**：字幕系统中的逐词高亮（每个词被读到的瞬间变色+弹跳）

来源：`may-shorts-18/captions`、`may-shorts-19/captions`

```css
.word {
  display: inline-block; color: rgba(255,255,255,0.55);
  transition: none; /* GSAP 控制，不用 CSS transition */
}
.word.active {
  color: #37bdf8;
  text-shadow: 0 0 18px rgba(55,189,248,0.75);
}
```

```js
// For each word in transcript:
// On word start time:
tl.to(wordEl, { color: "#37bdf8", scale: 1.14, duration: 0.08, ease: "back.out(3)" }, startTime);
// On word end time (spoken):
tl.to(wordEl, { color: "#ffffff", scale: 1.0, duration: 0.12, ease: "power2.out" }, endTime);
```

**关键点**：
- `back.out(3)` 的 scale pop 到 1.14 极快（0.08s），产生"弹"的触感
- 3 个颜色状态：待读（`rgba(255,255,255,0.55)`）→ 正在读（`#37bdf8`）→ 已读（`#ffffff`）
- 需要精确的 transcript 时间戳（用 `npx hyperframes transcribe`）
- CSS `text-shadow` 8 方向堆叠做描边效果（比 `-webkit-text-stroke` 渲染更稳定）
- 整行字幕 fade-in/fade-out 用 wrapper 的 opacity 控制，词级别只做 color + scale

## 24. Letter-spacing Breath（字距呼吸）

**适合**：紧张感/强调感的文字 ambient（字母间距缓慢张合）

来源：`may-shorts-18/scene5`、`golden-ratio-demo/scene02`

```css
.breath-text {
  font: 500 48px "Roboto Mono", monospace;
  letter-spacing: 0.08em; color: rgba(255,255,255,0.7);
}
```

```js
const breathCycles = Math.ceil(DURATION / 3) - 1;
tl.to("#breath-text",
  { letterSpacing: "0.14em", duration: 0.5,
    yoyo: true, repeat: breathCycles, ease: "sine.inOut" }, 0.85);
```

**关键点**：
- 变化范围极小：`0.08em → 0.14em`（仅 0.06em 差异），肉眼几乎看不到但能"感觉到"
- `sine.inOut` + yoyo 保证无限循环感
- 可与 Text-shadow Glow Pulse（#17）叠加
- golden-ratio-demo 的入场变体：`0.35em → 0.24em`（收缩方向，配合入场动画）
- **确定性**：用 `Math.ceil(DURATION/cycle) - 1` 计算重复次数，不用 `repeat: -1`

---

# 基础设施系统

> 以下三个系统是 may-shorts-6 的"看不见的承重墙"——每个场景都依赖它们，但单独看任何一个场景不会注意到。理解这些系统是构建新项目的基础。

## 系统 A：Ambient Background（持久背景层）

**作用**：为所有 overlay 场景提供统一的视觉基底——深色渐变 + 网格线 + 十字准星 + 漂浮粒子 + 暗角。不需要每个场景单独写。

来源：`may-shorts-6/compositions/ambient-bg.html`

### 5 个子系统

| 子系统 | 视觉效果 | 实现方式 |
|--------|---------|---------|
| Grid Drift | 缓慢对角移动的正交网格 | 0°/90° `linear-gradient` 双层 1px 线 + GSAP `x`/`y` transform 线性持续 |
| Crosshair Pulse | 中央十字准星 + 开场/结尾两次脉冲 | SVG（4 条线 + 中心圆）+ GSAP `scale`/`opacity` |
| Particle Float | 12 个蓝点独立漂移 + 明暗呼吸 | `.amb-dot` div（6px `border-radius` 圆）+ 逐个 GSAP `x`/`y`/`opacity` |
| Radial Base | 中心向外的渐变光晕 | `background: radial-gradient(ellipse 70% 80%, #0f2033 → #07121c → #050b13)` |
| Ambient Vignette | 边缘暗角 | `background: radial-gradient(ellipse 100% 80%, transparent 50% → rgba(5,11,19,0.85))` |

### 关键实现模式

```css
/* Grid — 正交网格（0° + 90° 双层 1px 线），非 45° 斜线 */
[data-composition-id="ambient-bg"] .amb-grid {
  position: absolute; inset: -80px;  /* 负边距确保漂移时不露底 */
  background-image:
    linear-gradient(rgba(55, 189, 248, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(55, 189, 248, 0.06) 1px, transparent 1px);
  background-size: 96px 96px;
  opacity: 0.6;
  will-change: transform;
}

/* Crosshair — SVG，非 CSS 伪元素 */
[data-composition-id="ambient-bg"] .amb-crosshair {
  position: absolute; left: 50%; top: 50%;
  width: 60px; height: 60px;
  margin-left: -30px; margin-top: -30px;
  opacity: 0.18; will-change: transform, opacity;
}

/* Particle — 12 个小圆点，非 3 个大光球 */
[data-composition-id="ambient-bg"] .amb-dot {
  position: absolute; width: 6px; height: 6px;
  border-radius: 50%; background: #37bdf8;
  box-shadow: 0 0 14px rgba(55, 189, 248, 0.55);
  opacity: 0.45; will-change: transform, opacity;
}
```

```js
// Grid drift — GSAP x/y transform，非 backgroundPosition
// 96px = 一个 grid cell 宽，漂移一个 cell 后无缝循环
const GRID_CYCLE = 14;
tl.to(SCOPE + "#amb-grid", {
  x: -96, y: -96, duration: GRID_CYCLE, ease: "none",
  repeat: Math.max(Math.floor(TOTAL / GRID_CYCLE) - 1, 0)
}, 0);

// Crosshair callback — 开场脉冲 + outro 脉冲（叙事回声）
tl.fromTo(SCOPE + "#amb-crosshair",
  { scale: 0.6, opacity: 0 },
  { scale: 1, opacity: 0.22, duration: 0.7, ease: "expo.out" }, 0.2);
tl.to(SCOPE + "#amb-crosshair", { opacity: 0.1, duration: 1.4, ease: "sine.inOut" }, 1.0);
// Outro 脉冲——呼应 CTA 锁定时刻
tl.to(SCOPE + "#amb-crosshair",
  { scale: 1.4, opacity: 0.42, duration: 0.6, ease: "expo.out" }, 16.6);
tl.to(SCOPE + "#amb-crosshair",
  { scale: 1.2, opacity: 0.28, duration: 1.2, ease: "sine.inOut" }, 17.4);

// Particle float — 12 个点，逐个独立 x/y + opacity 双轨道
const dots = document.querySelectorAll(SCOPE + ".amb-dot");
dots.forEach(function (dot, i) {
  const dx = 36 + (i % 3) * 18;   // 每个点不同幅度
  const dy = 26 + ((i + 1) % 3) * 14;
  const dur = 7 + (i % 4) * 1.4;  // 每个点不同速度
  const cycles = Math.max(Math.floor(TOTAL / (dur * 2)), 1);
  tl.to(dot, {
    x: dx * (i % 2 === 0 ? 1 : -1), y: -dy,
    duration: dur, ease: "sine.inOut",
    yoyo: true, repeat: cycles * 2 - 1
  }, 0);
  // 独立 opacity 呼吸
  const opDur = dur * 0.55;
  const opCycles = Math.max(Math.floor(TOTAL / (opDur * 2)), 1);
  tl.to(dot, {
    opacity: 0.78, duration: opDur, ease: "sine.inOut",
    yoyo: true, repeat: opCycles * 2 - 1
  }, 0);
});
```

### Crosshair 叙事手法

crosshair 不只是装饰——它在两个关键时刻脉冲，形成"叙事回声"：

1. **开场脉冲**（0.2s）：crosshair 从 `scale:0.6` 弹到 `1.0`，标记视频开始
2. **Outro 脉冲**（16.6s）：crosshair 膨胀到 `scale:1.4`，呼应 CTA 锁定时刻（scene8 logo 出现）

这种"同一元素在不同时刻出现两次"的手法比 `call()` 更确定性（纯 GSAP timeline，无回调），适合渲染器 seek-driven 架构。

### 使用方法

1. ambient-bg 作为 index.html 的第一个 sub-composition（`data-track-index="1"`）
2. `data-start="0"` + `data-duration` = 整个视频总时长
3. 各 overlay 场景（`data-track-index="3"`+）在它上面叠放
4. ambient-bg 的 timeline duration 也设为总时长，确保漂移动画持续整片

---

## 系统 B：Captions Engine（字幕系统）

**作用**：逐词卡拉 OK 式字幕，三态色系统 + scale 弹跳，双 accent 色高亮，防重叠。

来源：`may-shorts-6/compositions/captions.html`

### 核心机制

#### 1. 三态色系统（非简单 opacity）

每个词经历三种颜色状态，配合 scale 弹跳：

| 状态 | 颜色 | Scale | 何时 |
|------|------|-------|------|
| DIM（未读到） | `rgba(255,255,255,0.7)` | 1.0 | 词出现时默认 |
| ACTIVE（正在读） | `#37bdf8` 或 `#f09025`（accent 色决定） | **1.06** | word.start 时刻 |
| SPOKEN（已读完） | `#ffffff` | 1.0 | word.end 时刻 |

```js
const DIM = "rgba(255,255,255,0.7)";
const ACTIVE = "#37bdf8";
const ACTIVE_WARN = "#f09025";
const SPOKEN = "#ffffff";
const ACTIVE_SCALE = 1.06;

// 逐词三态转换
seg.words.forEach(function (w, wIdx) {
  const activeColor = w.accent === "warn" ? ACTIVE_WARN : ACTIVE;
  // DIM → ACTIVE：scale 1.06 + 变色 + back.out(3) 弹跳
  tl.to(wordSel, {
    color: activeColor, scale: ACTIVE_SCALE,
    duration: 0.08, ease: "back.out(3)"
  }, w.start);
  // ACTIVE → SPOKEN：scale 回 1.0 + 变白
  tl.to(wordSel, {
    color: SPOKEN, scale: 1.0,
    duration: 0.12, ease: "power2.out"
  }, w.end);
});
```

#### 2. Accent 色标记

关键词和数字在数据中标记 `accent: "warn"`，读到此词时高亮为橙色而非蓝色：

```js
// 字幕数据中标记 accent 词
{ word: "500", start: 0.68, end: 1.08, accent: "warn" },
{ word: "money", start: 8.6, end: 8.8, accent: "warn" },
{ word: "pay", start: 14.26, end: 14.54, accent: "warn" },
{ word: "500W", start: 15.84, end: 16.32, accent: "warn" },
```

#### 3. 整行 y 平移入场 + SWAP_GAP 防重叠

每行字幕不是简单的 opacity 切换——它从底部滑入（`y: 12 → 0`），离开时 fade out：

```js
const FADE_IN = 0.16;   // 160ms 入场
const FADE_OUT = 0.12;  // 120ms 退场
const PRE_ROLL = 0.10;  // 提前 100ms 开始入场
const POST_HOLD = 0.18; // 延后 180ms 开始退场
const SWAP_GAP = 0.06;  // 60ms 安全间隙

// 整行入场
tl.fromTo(wrapSel,
  { opacity: 0, y: 12 },
  { opacity: 1, y: 0, duration: FADE_IN, ease: "power2.out" },
  fadeInAt);

// 整行退场
tl.to(wrapSel, { opacity: 0, duration: FADE_OUT, ease: "power2.in" }, fadeOutAt);
tl.set(wrapSel, { visibility: "hidden" }, hideAt);

// 退场时间钳制：不超过下一行入场时间 - FADE_OUT - SWAP_GAP
const fadeOutAt = next
  ? Math.min(naiveFadeOut, nextStart - PRE_ROLL - FADE_OUT - SWAP_GAP)
  : naiveFadeOut;
```

#### 4. 8 方向 text-shadow 描边

字幕文字在任何背景上都可读——与技法 #14 相同的 8 方向描边：

```css
.cap-line {
  font-weight: 900; font-size: 64px; line-height: 1.12;
  color: #ffffff;
  text-shadow:
    -3px -3px 0 #07121c, 3px -3px 0 #07121c,
    -3px 3px 0 #07121c, 3px 3px 0 #07121c,
    -4px 0 0 #07121c, 4px 0 0 #07121c,
    0 -4px 0 #07121c, 0 4px 0 #07121c,
    0 6px 18px rgba(0, 0, 0, 0.6);
}
```

### 字幕放置规范

- 字幕 div 放在 `index.html` 的 `#root` 内，`data-track-index ≥ 20`
- 底部居中：`position: absolute; bottom: 72px; left: 0; right: 0; margin: 0 auto`
- **禁止** `left: 50%; transform: translateX(-50%)`——composition 边缘裁切
- 背景：`rgba(10, 8, 5, 0.55) + backdrop-filter: blur(8px)`

---

## 系统 C：Face-wrapper 三模式系统

**作用**：根据场景内容动态切换人脸区域——全屏（HERO）、右半屏（SIDE）、右下角小窗（INSET）。

**核心原理**：face-wrapper 是固定 1920×1080 的 div，`transform-origin: 0 0`。所有模式通过 GSAP `x`/`y`/`scale` transform 实现——不改 width/height/left/top。wrapper 内的 `<video>` 保持 100% 填充。

来源：`may-shorts-6/index.html`

### 三模式参数（x/y/scale transform）

```css
#face-wrapper {
  position: absolute; top: 0; left: 0;
  width: 1920px; height: 1080px;
  transform-origin: 0 0;  /* 关键：让 translate + scale 可预测组合 */
  will-change: transform, opacity;
}
```

| 模式 | x | y | scale | 视觉效果 | 用途 |
|------|---|---|-------|---------|------|
| HERO | 0 | 0 | 1 | 1920×1080 全屏 | 人脸全屏，文字叠在人脸上（punch/stamp 场景） |
| SIDE | 480 | 0 | 1 | 右移 480px，视频中心落在右半屏中心 | 人脸在右侧，左侧给 overlay panel |
| INSET | 1340 | 760 | 0.27 | ~518×292 小窗在右下角 | 人脸缩小，全屏给 CTA/outro |

```js
const HERO  = { x: 0,    y: 0,   scale: 1,    opacity: 1 };
const SIDE  = { x: 480,  y: 0,   scale: 1,    opacity: 1 };
const INSET = { x: 1340, y: 760, scale: 0.27, opacity: 1 };
const MODE_DUR = 0.32;  // 切换持续 0.32s
```

### 切换机制

```js
// 初始状态（scene1 需要 SIDE 模式）
mainTl.set("#face-wrapper", SIDE, 0);

// 场景边界切换，提前 0.15s 开始
[
  { t: 9.18,  mode: HERO  },  // scene5 punch — 人脸全屏
  { t: 10.14, mode: SIDE  },  // scene6 boring — 人脸让出左半屏
  { t: 13.71, mode: HERO  },  // scene7 stamp — 人脸全屏
  { t: 15.36, mode: INSET },  // scene8 CTA — 人脸缩到右下角
].forEach(({ t, mode }) => {
  mainTl.to("#face-wrapper",
    { ...mode, duration: MODE_DUR, ease: "expo.inOut" },
    t - 0.15  // 提前 0.15s 开始，确保人脸就位后场景内容才入场
  );
});
```

### Face 内部细节

#### Face Grading（色彩校正）
```css
#face-video {
  filter: contrast(1.06) saturate(1.06) brightness(0.98);
  /* 微调对比度和饱和度，让面部在深色背景上更鲜明 */
}
```

#### Face Vignette（wrapper 内暗角）
```css
#face-wrapper::after {
  content: ""; position: absolute; inset: 0;
  pointer-events: none;
  background: radial-gradient(
    ellipse at center,
    transparent 60%,
    rgba(7, 18, 28, 0.32) 88%,
    rgba(7, 18, 28, 0.7) 100%
  );
  /* 随 wrapper 缩放——任何模式下面部边缘都有暗角 */
}
```

#### Face Fade-out（结尾淡出）
```js
// 音频在 17.92s 结束 → 18.0s 开始淡出人脸，让 CTA 锁定画面独占最后 1s
mainTl.to("#face-wrapper",
  { opacity: 0, duration: 0.6, ease: "power2.in" }, 18.0);
```

### Ken Burns 效果

视频在 face-wrapper 内缓慢缩放，避免静态感：

```js
// Ken Burns — 整段视频单方向慢缩放，非 yoyo（确定性）
mainTl.to("#face-video",
  { scale: 1.03, duration: 18.4, ease: "none" }, 0);
```

**关键**：Ken Burns 是 `ease: "none"` 线性、无 repeat、无 yoyo——保证渲染确定性。不要用 yoyo 漂移，会产生非确定性。

### Pre-switch 提前量

face-wrapper 切换（0.32s）在场景内容出现前 0.15s 开始，确保观众看到"人脸已就位 → 内容入场"的顺序：

```js
// 时间线：
// t - 0.15s  face-wrapper 开始切换
// t          新场景内容开始入场（wrapper 已就位）
```
