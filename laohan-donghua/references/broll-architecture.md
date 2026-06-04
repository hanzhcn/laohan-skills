# B-roll Overlay 架构约束

> 来源：may-shorts-6 / aisoc-hype / aisoc-lesson-5-1 / clickup-demo 参考项目验证

## Sub-composition 正确结构

### 根 div（唯一有 timing 属性的元素）

```html
<template id="scene-name-template">
<div data-composition-id="scene-name"
     data-start="0"
     data-duration="8.5"
     data-width="1920"
     data-height="1080">
  <!-- 内部元素全部没有 class="clip" / data-start / data-duration / data-track-index -->
  <div class="bg">...</div>
  <div class="title">...</div>
</div>
```

**规则：只有根 div 有 `data-start`、`data-duration`、`data-width`、`data-height`。**
根 div 不适用 `data-track-index`——该属性只在 mount div（index.html 中）使用，框架通过它调度 composition 的可见性。sub-composition 内部由 GSAP timeline 控制时序，不涉及 track 调度。

### 内部元素禁止的属性

| 禁止 | 原因 |
|------|------|
| `class="clip"` | GSAP timeline 管内部可见性，framework 管整体可见性，双管会冲突 |
| `data-start` | 只有根 div 需要，内部元素靠 GSAP timeline 的时间轴位置控制 |
| `data-duration` | 同上 |
| `data-track-index` | 同上 |

### mount div（在 index.html 里）

```html
<div data-composition-id="scene-name"
     data-composition-src="compositions/scene-name.html"
     data-start="7.29"
     data-duration="8.5"
     data-track-index="3"
     data-width="1920"
     data-height="1080"></div>
```

**缺 `data-track-index` / `data-width` / `data-height` 任一 = 黑帧，lint 不报错。**

## CSS Scope

每个 composition 的 CSS 必须用 `[data-composition-id="xxx"]` 前缀：

```css
[data-composition-id="scene-name"] .bg { ... }
[data-composition-id="scene-name"] .title { ... }
```

原因：Hyperframes 把所有 composition 加载到同一 DOM，不加 scope 会跨场景样式污染。

## GSAP Script

每个 composition 文件必须有自己的 GSAP script 标签：

```html
<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
```

没有这个标签 = `gsap is not defined` 错误。Framework 不自动注入。

## Overlay 模式 vs 独立 Promo 的区别

| 维度 | Overlay（本 skill） | 独立 Promo |
|------|-------------------|-----------|
| 退场动画 | **不需要** — face-wrapper 动画掩盖消失 | 需要 — 场景间转场 |
| 场景间转场 | 不需要 — 有视频间隙 | 需要（whip-streak 等） |
| grain | 不需要 — 视频背景已有纹理 | 可选 |
| 背景色 | 深色渐变（非纯黑 #000） | 纯黑 + grid + crosshair |
| bg 宽度 | 按需设计（may-shorts-6 用 960px），右侧留空给 face-wrapper | 全屏 1920px |
| vignette | 0.15-0.3（轻） | 0.75（重） |
| 场景时长 | 跟口播节奏（3-17s 正常） | 1-2s 一个 beat |

### 退场动画不需要的原因

may-shorts-6（官方 overlay 示例）8 个场景中，7 个没有 exit/resolve 动画。scene5 是特例（0.96s 极短场景的 punch 效果，有 opacity:0 退场），不作为通用规则。
face-wrapper 在 overlay 结束时缩放回 1.0，观众注意力在人脸，overlay 消失被自然掩盖。
加 exit fade 反而可能与 framework 的可见性管理冲突。

## Timeline 合同

### data-duration 在 composition 上的语义

官方 html-schema.mdx + data-attributes.mdx 明确：**compositions 不使用 data-duration**。

- **mount div（index.html）**：`data-duration` 被框架忽略，可保留作为文档参考（may-shorts-6 也保留了）
- **sub-composition 根 div**：同样不使用 data-duration
- **实际时长 = `tl.duration()`**：由 GSAP timeline 最后一个 tween 的结束时间决定
- **anchor tween 作用**：`tl.to({}, { duration: DURATION }, 0)` 或 `tl.set({}, {}, DURATION)` 确保 tl.duration() >= 预期时长

对比：**clip 元素**（video/img/audio/div.clip）的 `data-duration` **是必需的**（img 必需，video/audio 可选默认源时长）。

### 其他有用的 data 属性

| 属性 | 适用 | 说明 |
|------|------|------|
| `data-media-start` | video, audio | 源文件播放偏移/裁剪起点（秒），默认 0。用于"从第5秒开始播放" |
| `data-has-audio` | video | 标记视频包含音轨 |
| `data-variable-values` | composition mount div | 传递 JSON 值给嵌套 composition（子组件用 `window.__hyperframes.getVariables()` 读取） |
| `data-caption-root` | caption root div | 标记字幕 composition，配合 `data-timeline-role="captions"` |

### 相对时间引用

`data-start` 可引用同 composition 内其他 clip 的 id：

```html
<video id="intro" data-start="0" data-duration="10" data-track-index="0" src="..."></video>
<!-- intro 结束后 0.5s 开始 -->
<video id="main" data-start="intro + 0.5" data-duration="20" data-track-index="0" src="..."></video>
```

限制：只同一 composition 内、不能循环引用、被引用 clip 必须有已知 duration。

### Timeline 代码模板

```js
(() => {
  const DURATION = 8.5; // 与根 div 的 data-duration 一致
  const tl = gsap.timeline({ paused: true });

  // 入场动画
  tl.fromTo('.title', { autoAlpha: 0, y: 30 },
    { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.1);

  // Ambient 动效
  const cycles = Math.ceil(DURATION / 4) - 1;
  tl.to('.vignette', { opacity: '+=0.08', duration: 2,
    repeat: cycles, yoyo: true, ease: 'sine.inOut' }, 1.5);

  // 时长锚定（必须）
  tl.to({}, { duration: DURATION }, 0);

  window.__timelines['scene-name'] = tl;
})();
```

关键规则：
- `{ paused: true }` — framework 是 seek-driven，不手动 play
- `tl.to({}, { duration: DURATION }, 0)` 或 `tl.set({}, {}, DURATION)` — 两者功能等价，确保 timeline 时长 = data-duration
- 注册到 `window.__timelines["<data-composition-id>"]` — key 必须与根 div 的 data-composition-id 完全匹配
- 禁止 `Math.random()`、`Date.now()`、`repeat: -1`
- `autoAlpha` 优于 `opacity`（在 0 时同时设 `visibility:hidden`）

## `<template>` 包装

Composition 文件必须用 `<template>` 包装：

```html
<template id="scene-name-template">
  <div data-composition-id="scene-name" ...>
    ...
  </div>
  <style>...</style>
  <script src="gsap.min.js"></script>
  <script>...</script>
</template>
```

`<template>` 阻止浏览器预渲染内容，等 framework 加载时再实例化。

## 确定性渲染

| 禁止 | 替代 |
|------|------|
| `Math.random()` | seeded PRNG（mulberry32） |
| `Date.now()` | 用 args 传入时间戳 |
| `repeat: -1` | `Math.ceil(DURATION / cycleDuration) - 1` |
| 异步构建 timeline | 全同步 |
| 帧边界不对齐 | 时间 snap 到 `1/fps` 整数倍（30fps = 0.0333s） |

## 常见错误速查

| 错误 | 现象 | 修复 |
|------|------|------|
| 内部元素有 `class="clip"` | 元素闪烁或不可见 | 删掉内部元素的 `class="clip"` |
| CSS 没有 scope | 跨场景样式污染 | 加 `[data-composition-id]` 前缀 |
| 缺 GSAP script | `gsap is not defined` | 加 `<script src="gsap.min.js">` |
| timeline 比 data-duration 短 | 场景后半段黑帧 | 加 `tl.to({}, { duration: DURATION }, 0)` |
| mount div 缺属性 | 整体黑帧 | 补 `data-track-index` + `data-width` + `data-height` |
| 用 `from()` 不用 `fromTo()` | 元素停在 opacity:0 | overlay 模式两者均可（官方推荐 `from()`，may-shorts-6 用 `fromTo()`） |
| grain 0.5s steps(1) | 跳闪 | overlay 场景不需要 grain，删掉 |
| `<video>` 加 `class="clip"` | 视频不可见 | 删掉 |
| Google Fonts 未加载 | 字体 fallback 到系统字体，渲染与预览不一致 | CDN 保留给 Studio preview，渲染时编译器自动嵌入 |
| H.264 banding | 深色背景大区域线性渐变编码后色阶 | 避免全屏 linear-gradient，改用 radial-gradient 或纯色+局部 glow |
| 硬切边 | face-wrapper 缩小时场景面板右边缘明显分割线 | 加 `mask-image` 渐变 feather（60-100px）软化边缘 |
| 字幕用 `left:50%;transform:translateX(-50%)` | 宽字幕被裁切 | 改用 `left:0;right:0;margin:0 auto` 居中 |
| 背景只有纯色/渐变 | 场景感觉空洞 | 背景最低 3 层：渐变底 + vignette + 至少一个漂移/呼吸元素（粒子/ghost text/glow） |
| 字幕做成 sub-composition | 也能工作，但更复杂 | 两种方式都正确：body-level siblings（推荐）或独立 sub-composition（参考 may-shorts-6/captions.html） |
| overlay 字幕做 self-lint | 不必要 | overlay 字幕是 index.html body-level `.clip`，框架管理可见性。self-lint 只适用于 sub-composition 内的动态字幕 |
| mount div 上的 data-duration 影响时长 | 不影响 | 官方 html-schema.mdx：compositions 不使用 data-duration。时长 = tl.duration() |

## 官方源码仓库

路径：`/Users/hanzhmacbookair/Documents/hyperframes/hyperframes-repo/docs/`

权威文档（skill 文件未覆盖的内容以这里为准）：
- `reference/html-schema.mdx` — clip 类型、属性表的权威定义
- `concepts/data-attributes.mdx` — data 属性完整语义（含相对时间引用）
- `guides/gsap-animation.mdx` — GSAP 在 Hyperframes 中的官方规则
- `guides/rendering.mdx` — 渲染模式、workers、GPU、Docker
- `guides/common-mistakes.mdx` — 7 个常见错误 + 调试清单
