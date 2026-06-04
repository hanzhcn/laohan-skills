# B-roll 常用动画技法

> 从 may-shorts-6 提取的可复用技法。每个技法是独立 building block，按场景需要组合。
>
> **颜色说明**：以下代码中的颜色值来自 AIS 品牌（`DESIGN.ais-example.md`），实际使用时替换为你的 DESIGN.md 中的 token。
>
> 来源标注格式：`may-shorts-6/<scene>`

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
  font-weight: 900; font-size: 90px;
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
  font-weight: 500; font-size: 52px;
  letter-spacing: 0.08em;
  opacity: 0;  /* 初始隐藏，GSAP 入场 */
}
```

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
