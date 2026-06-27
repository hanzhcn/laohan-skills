---
name: laohan-donghua
version: "9.0.0"
description: "从口播稿+真人视频生成带B-roll overlay的最终视频。一个index.html+一次render出成片。Use when 用户说生成B-roll、做视频片段、配图动画、Hyperframes动画、教程配图、给视频加特效、做overlay、加动效。"
---

# Hyperframes B-roll Overlay 视频

从口播稿+真人视频，生成带 B-roll overlay 动画的最终成片。一个 index.html，一次 render。

## 核心理念

1. **一个 index.html，一个 render。** 禁止分开渲染再 ffmpeg overlay
2. **从零构建，不复制模板。** 按 DESIGN.md 从零写每个场景 HTML
3. **时间戳驱动。** 官方 `npx hyperframes transcribe` 拿真实时间戳
4. **每个场景不同视觉风格。** 在 DESIGN.md 框架内做变体
5. **B-Roll 占视频 30% 时长。** 按内容密度分配，不是均分

## 不适用场景

- **从零做视频（无口播稿+无视频）** → `/make-a-video`
- **纯动画/PPT（无真人出镜）** → `/hyperframes`
- **竖屏短视频（9:16）** → 需额外适配，本 skill 按 16:9

`make-a-video` 是完整视频创作流程（8-gate，从选题到渲染），laohan-donghua 是 B-roll overlay 专项流程（18-step，口播稿+真人视频→overlay 成片）。两者并行，不嵌套。

## 委托关系

| 职责 | 委托给 | 何时调用 |
|------|--------|----------|
| Composition 编写规则 | `/hyperframes` | 写 HTML 前 |
| CLI 命令 | `/hyperframes-cli` | lint/render |
| 媒体处理 | `/hyperframes-media` | 转录 |
| GSAP 动画 | `/gsap` | 复杂动画 |
| Catalog blocks 安装 | `/hyperframes-registry` | 需要官方预制组件时 |
| 规则约束 | `rules/hyperframes.md` | 自动加载 |
| Render Contract + workspace | `CLAUDE.md` | 自动加载（11 条硬规则 + 项目结构） |
| 架构/设计参数 | `references/` | 构建时查阅 |

**写 composition 前，先调用 `/hyperframes` 获取框架规则。**

---

## 执行流程

### 🚧 流程门控（每步必须通过才能继续）

| Gate | 位置 | 必须产出 | 未通过则 |
|------|------|---------|---------|
| G1 | 步骤 4 后 | 场景规划表（编号+口播段落+提取文字+布局+情绪+语义类型）| 禁止进入步骤 6 |
| G2 | 步骤 8 后 | 时间戳校准表（帧对齐 data-start/duration，场景间 ≥0.3s 间隔）| 禁止构建 compositions |
| G3 | 步骤 10 后 | 全场景构建检查清单全部 ✅ | 禁止 lint |
| G4 | 步骤 12 后 | lint 0 error + validate 通过 + inspect 无溢出 | 禁止 preview |
| G5 | 步骤 15 后 | 用户在 Studio 明确说"可以" | 禁止 draft render |
| G6 | 步骤 16 后 | 每个 hero 帧 Read 确认无黑帧/裁切/溢出 | 禁止 standard render |
| G7 | 步骤 17 后 | 用户在 MP4 明确说"可以" | 禁止 final render |

**强制规则**：
1. 跳过任何 Gate → 停止执行，回到未完成的步骤。没有例外。
2. 每完成一步，先输出该步产出物，标注 Gate 状态（✅ 通过 / ❌ 未通过），再问用户是否继续。
3. "我觉得大概是这样" ≠ 通过。必须有具体的表格/文件/命令输出。

### 用户侧（模型不参与）

1. 口播稿定稿
2. 录制真人出镜视频
3. 剪掉错误片段，得到干净口播视频

### 实际输入验收（必须先做）

真实拍摄素材经常不是干净成片。开始 overlay 前，先判断输入属于哪类：

| 问题类型 | 例子 | 处理 |
|----------|------|------|
| 媒体格式问题 | 非 H.264、无音轨、奇数尺寸、异常 fps、竖屏/方屏 | 先转码或选对应 face-wrapper 架构，再继续 |
| 口播内容问题 | 口误、重说、咳嗽、长停顿、重复 take、废话段 | 不要用动画遮盖；先让用户剪映导出干净版，或输出粗剪时间戳清单让用户确认 |
| 文稿不匹配 | 口播稿和实际说法不一致 | 以 transcript 时间戳为准，先修正 SCRIPT.md，再规划 overlay |
| 素材缺失 | 提到网页/数据/聊天/产品但没有截图或录屏 | 先收集用户自己的证据素材，或改用原创信息卡表达 |

如果项目提供输入检查脚本，先运行它。例如 HyperFrames student-kit：

```bash
npm run input:inspect -- <video.mp4>
```

**硬规则**：内容问题没有处理前，不进入步骤 4 的 overlay 场景规划。动画不能拯救坏口播。

### 阶段一：只要口播稿

#### 步骤 4：读口播稿 → 插入点设计 + 内容规划 + 场景规划

📖 **读取**：口播稿全文
📖 **查阅**：`scene-index.md`（52 个内容场景 + 速查表，按内容类型匹配视觉结构）

这是最关键的步骤。三层规划决定视频质量。

**4a. 语义分类 + 默认技法映射**：给口播稿每段标记内容类型，并匹配默认技法（模型可覆盖，但默认选择已覆盖 80% 场景）：

| 类型 | Overlay？ | 默认技法 | 来源 |
|------|-----------|---------|------|
| 数据/数字 | ✅ | Counter count-up + 数字 glow | may-shorts-6 scene1 |
| 列举/枚举 | ✅ | Stagger list + strike-through（否定项） | may-shorts-6 scene3 |
| 概念解释 | ✅ | Chrome gradient sweep + text-shadow glow | may-shorts-6 scene6 |
| 对比/VS | ✅ | 分栏卡片 + mask-image feather | — |
| 重点强调 | ✅ | Slam + micro-tremor + scan-line sweep | may-shorts-18 scene1 |
| 冲击/反转 | ✅ | Hero slam + spark burst + glow pulse | may-shorts-18 scene5 |
| 标签/功能名 | ✅ | Chip/pill badge pop + glow pulse | may-shorts-18 scene2 |
| 紧张/倒计时 | ✅ | Letter-spacing breath + vignette breathing | may-shorts-18 scene5 |
| 工具介绍 | ✅ | 命令行/步骤列表 + accent 色 glow | — |
| 总结/CTA | ✅ | 全屏 endcard + shimmer sweep | may-shorts-6 scene8 |
| 纯叙述/过渡 | ❌ | 保持真人全屏（HERO 模式） | — |
| 情感/故事 | ❌ | 保持真人全屏 | — |

**4b. B-Roll 占比计算**：

```
总视频时长 × 30% = overlay 总时长
overlay 总时长 ÷ 场景数 = 平均场景时长（目标 4-8s）
```

场景数由内容密度决定，不是均分。密集段落可以连续多个场景，稀疏段落保持全屏。

**4c. 内容提取**：为每个 overlay 场景提炼显示文字。

不是整句口播稿搬上去，是**提炼后的关键词/短语**。文字量决定布局：

| 提取文字量 | 适合布局 | 典型字号 |
|-----------|---------|---------|
| 1 个关键词 | hero 大字居中 | 80-120px |
| 1 标题 + 2-3 标签 | 上标题下列表 | 标题 64px, 标签 36px |
| 1 标题 + 1 数字 | 左文右数据 | 标题 56px, 数字 96px |
| 3-5 个并列项 | 横向卡片/竖向列表 | 32-40px |

输出格式：

```
场景 | 口播段落 | 提取的 overlay 文字 | 文字量 | 建议布局 | 情绪
s1   | "终端输一行..." | "opencli" + "一行命令搞定" + "标题·播放量·时间" | 3 标签 | 列表式 | 震撼
s2   | "想抓知乎热榜..." | "知乎热榜" + "50条" + "链接+摘要" | 标题+数据 | 数据展示 | 专业
```

**4d. 视觉结构匹配**：根据内容类型 + 文字量，从 `scene-index.md` 找视觉结构模式。

这不是复制模板——是参考空间分配和布局方式。用实际文字长度重新设计具体位置和字号。

**完成条件：**
- 场景清单（编号 + 口播段落 + 提取文字 + 建议布局 + 情绪）
- overlay 总占比 ≈ 30%
- 每个场景有明确的文字内容和布局方向

**🚧 GATE 1**：场景规划表未输出 → 禁止进入步骤 6。必须包含所有列。产出物是一个完整的 markdown 表格。

#### 步骤 5：创建 DESIGN.md

📖 **读取**：`~/.claude/skills/hyperframes/visual-styles.md`（8 种风格 YAML token）
📖 **参考**：`DESIGN.ais-example.md`（完整结构模板）

从 visual-styles.md 选择最匹配口播内容的风格。教程类 AI 工具测评通常适合 Swiss Pulse（数据驱动）或 Data Drift（AI/未来感）。

DESIGN.md 必须包含：
- Style Prompt（一句话风格描述）
- Colors（token + hex + role）
- Typography（标题/正文/标签 各用哪个字体）
- Motion Rules（energy / easing entry/exit/ambient / duration entrance/hold/transition）
- What NOT to Do

**完成条件：** DESIGN.md 包含上述全部段落

### 阶段二：需要口播视频

#### 步骤 6：环境检查

📖 **读取**：`~/.claude/skills/hyperframes-cli/SKILL.md`（doctor 命令详情）

```bash
cd video-projects/<project-slug>
npx hyperframes doctor
npx hyperframes benchmark   # 找到系统最优 workers/quality 设置
```

CLI 必须从项目目录运行。检查 assets/ 中视频是否为 H.264 MP4，非 H.264 需先 re-encode：

```bash
ffmpeg -i raw.mov -c:v libx264 -preset medium -crf 20 -c:a aac -b:a 192k -movflags +faststart assets/clip.mp4
```

#### 步骤 7：转录

📖 **读取**：`~/.claude/skills/hyperframes-media/SKILL.md`（transcribe 命令详情）

**字幕系统选择（固定优先级）**：

| 优先级 | 方案 | 条件 | 说明 |
|--------|------|------|------|
| ★ 首选 | word-level 逐词字幕 | 官方转录输出含 word timestamps | 三态颜色（未读→accent→白色）+ 逐词 scale 弹跳 + 8 方向 text-shadow 描边。参考 may-shorts-6 captions.html |
| ↓ 降级 | sentence-level 整句字幕 | word 数据缺失 | 28px 毛玻璃条底板 |

用官方转录拿时间戳：

```bash
npx hyperframes transcribe assets/<video>.mp4 --model small --language zh --json
```

**字幕文本来源**：用 Whisper 转录原文，手动修正识别错误（如"翻热节"→"翻热点"）。不用口播稿精简版。字幕是屏幕底部的口播内容，不是场景动画里的文字。

**中文识别准确率校验**（可选）：如官方识别质量不满意，用硅基流动做对照参考：

```bash
curl -s -X POST https://api.siliconflow.cn/v1/audio/transcriptions \
  -H "Authorization: Bearer $SILICONFLOW_API_KEY" \
  -F "model=FunAudioLLM/SenseVoiceSmall" -F "file=@assets/<video>.mp4"
```

注意：硅基流动返回纯文本（无时间戳），只能用于校验中文识别准确率，不能替代官方 `--json` 输出。

#### 步骤 8：精确校准时间戳

读 transcript.json，将步骤 4 的场景清单中每个 overlay 匹配到精确的口播段落：
- 起始时间 = 对应口播句子的开始
- 结束时间 = 对应口播句子的结束
- 帧边界对齐：时间 snap 到 0.0333s 倍数（30fps）
- 场景间留 0.3-0.5s 间隔（避免连续 overlay 太密）

**完成条件：** 每个场景有精确的帧对齐 data-start/data-duration，overlay 总占比 ≈ 30%

**🚧 GATE 2**：时间戳校准表未输出 → 禁止构建 compositions。产出物是一个完整的时间戳表，每行有 data-start、data-duration、帧对齐确认。

#### 步骤 9：构建 compositions

📖 **必读**：`references/broll-architecture.md`（架构约束 + 常见错误速查）
📖 **查阅**：`references/broll-techniques.md`（24 种常用动画技法 + 3 大基础设施系统，按场景需要选用）
📖 **查阅**：`references/broll-design-reference.md`（face-wrapper 4 种架构、8 种视觉风格、face 美化）
📖 **参考**：`scene-index.md`（按内容类型 + 文字量匹配视觉结构模式）
📖 **必读**：`~/.claude/skills/hyperframes/references/typography.md`（字体排版规则，每个场景都有文字）
📖 **参考**：`~/.claude/skills/hyperframes/references/css-patterns.md`（文字强调效果）
📖 **规则**：`rules/hyperframes.md`（自动加载，承重 GSAP 规则）

对每个场景创建 `compositions/<scene-name>.html`。从零按 DESIGN.md 构建。

**推荐 Layout Before Animation 方法论**（官方）：先写最终状态的静态 CSS（hero frame），再用 `gsap.from()` 添加入场动画。

**场景视觉设计**：
- 每个场景在 DESIGN.md 框架内做变体（同色系不同布局）
- 按 `scene-index.md` 匹配内容类型的视觉结构
- 变体方式：布局方向（左对齐/居中/卡片）、强调元素（数字/标签/图标）、动画节奏

**文字尺寸验证**（用官方工具，不靠猜）：

在 Studio preview 中运行以下工具验证文字不溢出：

```js
// 方法 1：自动计算最佳字号
var result = window.__hyperframes.fitTextFontSize("显示的文字", {
  maxWidth: 800,      // 容器宽度（overlay bg 通常 960px，内容区 600-800px）
  fontFamily: "Noto Sans SC",
  fontWeight: 900
});
// result.fontSize → 设到 CSS 中

// 方法 2：精确文字测量（无 DOM reflow）
var prepared = window.__hyperframes.pretext.prepare("显示的文字", "900 64px 'Noto Sans SC'");
var layout = window.__hyperframes.pretext.layout(prepared, 800, 1.3);
// layout.width, layout.height → 检查是否超出容器
```

原则：先确定容器宽度 → 用 fitTextFontSize 算字号 → 写入 CSS。不要反过来先猜字号再发现溢出。

**完整场景示例**（改文字/颜色即用，不需要从片段组装）：

| 示例文件 | 覆盖内容类型 | 包含技法 |
|---------|------------|---------|
| `references/example-a-data.html` | 数据/数字 | panel + counter count-up + underline + vignette breathing + anchor |
| `references/example-b-list.html` | 列举/枚举 | panel + stagger list + strike-through + mask-image + vignette breathing + anchor |
| `references/example-c-concept.html` | 概念解释 | panel + chrome gradient sweep + clip-path reveal + text-shadow glow + vignette breathing + anchor |
| `references/example-d-negate.html` | 否定/反转 | X-mark pop + global strike + mask-image feather + vignette breathing |
| `references/example-e-affirm.html` | 肯定列表 | check-list stagger + dual-accent + mask-image feather + vignette breathing |
| `references/example-f-punch.html` | 短冲击强调 | burst flash + punch card + text-stroke outline（<1s，带退场） |
| `references/example-g-cta.html` | CTA/Outro | logo crystallize + shimmer sweep + underline scale + wordmark fade |
| `references/example-h-stamp.html` | 价格/印章强调 | stamp badge（旋转弹入）+ banner bar（横向展开）+ backdrop blur |

**用法**：复制最匹配的示例 → 改 `data-composition-id`、文字内容、颜色、DURATION → 按需增减元素。

**最小模板**（极简骨架，仅用于无法匹配上述 8 种示例时）：

```html
<template id="<scene-name>-template">
<div data-composition-id="<scene-name>" data-start="0"
     data-duration="<时长>" data-width="1920" data-height="1080">  <!-- data-duration 可选，框架不使用，仅作文档参考。实际时长由 anchor tween 的 tl.duration() 决定 -->
  <div class="bg"></div>
  <div class="vignette"></div>
  <div class="title">标题</div>
</div>

<style>
[data-composition-id="<scene-name>"] .bg {
  position: absolute; top: 0; left: 0; width: 960px; height: 1080px; /* 宽度按需设计，右侧留空给 face-wrapper */
  background: linear-gradient(160deg, #0a0e1a, #0d1225);
  mask-image: linear-gradient(to right, #000 0%, #000 calc(100% - 80px), transparent 100%);
}
[data-composition-id="<scene-name>"] .vignette {
  position: absolute; top: 0; left: 0; width: 960px; height: 1080px;
  pointer-events: none;
  background: radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%);
  opacity: 0.2;
}
[data-composition-id="<scene-name>"] .title {
  position: absolute; top: 120px; left: 80px;
  font: 900 96px/1 "Noto Sans SC", sans-serif; color: #f5f5f5;
}
</style>

<script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
<script>
(() => {
  const DURATION = <时长>;
  const tl = gsap.timeline({ paused: true });

  // BUILD（入场）
  tl.fromTo('.title', { autoAlpha: 0, y: 30 },
    { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, 0.1);

  // BREATHE（ambient）
  const cycles = Math.ceil(DURATION / 4) - 1;
  tl.to('.vignette', { opacity: '+=0.08', duration: 2,
    repeat: cycles, yoyo: true, ease: 'sine.inOut' }, 1.5);

  // Anchor tween（必须）
  tl.to({}, { duration: DURATION }, 0);
  window.__timelines['<scene-name>'] = tl;
})();
</script>
</template>
```

**构建检查清单：**

```
□ 根 div 有 data-start="0" + data-duration + data-width + data-height
□ 内部元素没有 class="clip" / data-start / data-duration / data-track-index
□ CSS 全部用 [data-composition-id="xxx"] scope
□ 文件有 <template> 包装 + <script src="gsap.min.js">
□ 背景最低 3 层：渐变底 + vignette + 至少一个漂移/呼吸元素
□ 所有彩色文字有匹配色 text-shadow glow
□ 按 DESIGN.md motion token 选 easing/duration
□ 两阶段：build（入场）+ breathe（ambient）
□ overlay 模式不写退场/resolve 动画（outro 除外）
□ 禁止 Math.random() / Date.now() / repeat: -1
□ 文字尺寸已用 fitTextFontSize 或 pretext 验证，不溢出容器
□ 每个场景的文字内容来自步骤 4c 的内容提取表
□ INSET 场景 bg 用全宽（1920px 或 inset:0），SIDE 场景用 960px + mask-image
```

#### 步骤 10：构建 index.html

📖 **必读**：`references/broll-architecture.md`（mount div 属性要求）
📖 **查阅**：`references/broll-design-reference.md`（face-wrapper 4 种架构和过渡时序）

**完整模板**：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=1920, height=1080" />
  <title><项目名></title>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&family=Space+Grotesk:wght@700;900&display=block"
    rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 1920px; height: 1080px; overflow: hidden;
      background: #050b13; font-family: "Noto Sans SC", sans-serif; color: #fff; }
    #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; }

    /* Face-wrapper — 三种模式（固定，不改） */
    #face-wrapper {
      position: absolute; top: 0; left: 0; width: 1920px; height: 1080px;
      transform-origin: 0 0; transform: translate(0px, 0px) scale(1);
      z-index: 0;
    }
    #face-video {
      display: block; width: 100%; height: 100%; object-fit: cover;
      filter: contrast(1.04) saturate(1.02) brightness(0.99);
    }
    #face-wrapper::after {
      content: ""; position: absolute; inset: 0; pointer-events: none;
      background: radial-gradient(ellipse at center, transparent 60%,
        rgba(5,11,19,0.3) 88%, rgba(5,11,19,0.7) 100%);
    }

    .scene-layer {
      position: absolute; top: 0; left: 0; width: 1920px; height: 1080px;
    }
  </style>
</head>
<body>
  <div id="root" data-composition-id="<project-id>" data-start="0"
       data-width="1920" data-height="1080">

    <!-- Poster frame（GSAP-managed, not a clip） -->
    <img id="poster" src="assets/clip-poster.jpg"
         style="position:absolute;top:0;left:0;width:1920px;height:1080px;object-fit:cover;">

    <!-- Face video (muted, audio from sibling <audio>) -->
    <div id="face-wrapper">
      <video id="face-video" src="assets/talking_head.mp4"
             muted data-start="0" data-duration="TOTAL" data-track-index="1"
             playsinline></video>
    </div>

    <!-- Last frame（GSAP-managed, not a clip） -->
    <img id="lastframe" src="assets/clip-lastframe.jpg"
         style="position:absolute;top:0;left:0;width:1920px;height:1080px;object-fit:cover;opacity:0;">

    <!-- Audio track -->
    <audio src="assets/audio.wav" data-start="0" data-duration="TOTAL"
           data-volume="1" data-track-index="2"></audio>

    <!-- Ambient background（全时长舞台层：grid 漂移 + 粒子 + vignette） -->
    <div class="scene-layer" data-composition-id="ambient-bg"
         data-composition-src="compositions/ambient-bg.html"
         data-start="0" data-duration="TOTAL" data-track-index="0"
         data-width="1920" data-height="1080"></div>

    <!-- Scene overlays（每个 mount div 必须有 data-track-index + data-width + data-height） -->
    <div class="scene-layer" data-composition-id="s1-hook"
         data-composition-src="compositions/s1-hook.html"
         data-start="17.0" data-duration="4.8" data-track-index="3"
         data-width="1920" data-height="1080"></div>
    <!-- ...更多场景... -->

    <!-- Captions（word-level 逐词字幕，独立 sub-composition） -->
    <div class="scene-layer" data-composition-id="captions"
         data-composition-src="compositions/captions.html"
         data-start="0" data-duration="TOTAL" data-track-index="4"
         data-width="1920" data-height="1080"></div>
  </div>

  <script>
    window.__timelines = window.__timelines || {};
    const mainTl = gsap.timeline({ paused: true });
    const TOTAL = <总时长>;

    // ── Face-wrapper 三种模式（固定参数，不改） ──
    const HERO   = { x: 0,    y: 0,   scale: 1,    opacity: 1 }; // 全屏人脸
    const SIDE   = { x: 480,  y: 0,   scale: 1,    opacity: 1 }; // 左右分屏（默认）
    const INSET  = { x: 1340, y: 760, scale: 0.27, opacity: 1 }; // 小窗右下角
    const MODE_DUR = 0.32;

    // 初始状态：HERO（开场全屏人脸）
    mainTl.set("#face-wrapper", HERO, 0);

    // ── Face 过渡时间表 ──
    const transitions = [
      { t: 17.0,  mode: SIDE  }, // s1 开始
      { t: 21.8,  mode: HERO  }, // s1 结束
      // ...按场景填充...
      { t: 174.3, mode: INSET }, // outro 开始（INSET 替代 fade out）
    ];
    transitions.forEach(({ t, mode }) => {
      mainTl.to("#face-wrapper",
        { ...mode, duration: MODE_DUR, ease: "expo.inOut" }, t - 0.15);
    });

    // ── Poster → video handoff ──
    mainTl.to("#poster", { opacity: 0, duration: 0.15, ease: "power2.out" }, 0.1);
    // ── Lastframe hold after video ends ──
    mainTl.set("#lastframe", { opacity: 1 }, TOTAL - 0.5);

    // ── Ken Burns 缓慢缩放 ──
    mainTl.to("#face-video", { scale: 1.03, duration: TOTAL, ease: "none" }, 0);

    // ── Pad to TOTAL ──
    mainTl.set({}, {}, TOTAL);
    window.__timelines["<project-id>"] = mainTl;
  </script>
</body>
</html>
```

关键规则：
- `<video>` 不加 `class="clip"`
- poster/lastframe 由 GSAP 管理 opacity（不是 class="clip" + data 属性）
- mount div 缺 `data-track-index` / `data-width` / `data-height` 任一 = 黑帧
- **index.html 不用 `<template>` 包装**（只有 sub-composition 文件才用）
- Face-wrapper 过渡时间表与场景 data-start 对齐，`t - 0.15` 提前
- Google Fonts CDN 保留（Studio preview 需要，渲染时编译器自动嵌入）
- **字幕用独立 captions.html sub-composition**（track-index 4），不用 inline .cap div
- **outro 用 INSET 模式**（结尾最后 ~0.6s 可 fade out face 让锁屏画面独占）
- **ambient-bg 常开**（track-index 0，全时长舞台层）

**🚧 GATE 3**：步骤 9 的构建检查清单全部 ✅ 后才能进入 lint。逐场景检查，任何一项未通过 → 返回修改对应 composition。

#### 步骤 11-18：验证管线

📖 **读取**：`~/.claude/skills/hyperframes-cli/SKILL.md`（命令参数详解）

```bash
# 11. 静态检查
npx hyperframes lint                                    # 修 error，triage warning（含对比度检查）

# 12. 运行时检查（lint 看不到 JS 异常、音频同步等运行时问题）
npx hyperframes validate                                # headless Chrome 运行时验证

# 13. 布局检查
npx hyperframes inspect                                 # headless Chrome 视觉布局

# 14. 动画编排分析（新场景或重大改动时运行）
node .claude/skills/hyperframes/scripts/animation-map.mjs compositions/ --out compositions/.hyperframes/anim-map
# 输出：per-tween 摘要、ASCII 时间线、stagger 检测、dead zone 标记、元素生命周期、场景快照

# 15. Gate 1: Studio preview（强制）
npx hyperframes preview                                 # localhost:3002
# → 用户确认布局后才进下一步

# 16. Draft 渲染 + 抽帧验证
npx hyperframes render --quality draft --output renders/draft.mp4
# 抽帧验证（snapshot 优先，ffmpeg fallback）：
npx hyperframes snapshot --at <scene1-t>,<scene2-t>,<scene3-t> --timeout 10000
# fallback（snapshot 不可用时）：
# mkdir -p renders/frames
# for t in <scene1-t> <scene2-t> ...; do
#   ffmpeg -y -ss $t -i renders/draft.mp4 -frames:v 1 -q:v 2 "renders/frames/t${t}.png"
# done
# 每个 PNG 必须 Read 确认无黑帧/裁切/溢出

# 17. Gate 2: MP4 preview（强制）
# npx serve renders -p 8080 -n → 用户确认节奏+音频同步

# 18. Standard 渲染
npx hyperframes render --quality standard --output renders/final.mp4
# 性能选项（按需）：
#   --workers <n>    并行 worker（默认 CPU/2 上限4，短视频用 1）
#   --gpu            硬件编码（Mac: VideoToolbox）
#   --docker         确定性渲染（跨平台一致，AI agent 推荐）
```

**渲染策略**：优先整体渲染（官方方法）。如黑帧严重，降级为逐场景渲染 + ffmpeg overlay 合成。黑帧预防见 `rules/hyperframes.md` 的结构性预防清单。

**两个 preview gate 强制**：Gate 1 确认布局，Gate 2 确认节奏+音频。lint 通过 ≠ 渲染正确。

---

## Overlay 专属规则

以下规则仅适用于 B-roll overlay 模式，通用规则见 `rules/hyperframes.md`。

### Face-wrapper 模式选择（固定优先级）

| 模式 | 参数 | 何时用 | 说明 |
|------|------|--------|------|
| **SIDE** | `x:480, y:0, scale:1` | 日常讲解场景（默认） | 左右分屏，960px 内容区 + 右侧全尺寸人脸 |
| **INSET** | `x:1340, y:760, scale:0.27` | outro/CTA、多栏对比、需要全屏宽度的内容 | 小窗人脸，释放完整画面空间 |
| **HERO** | `x:0, y:0, scale:1` | 无场景 overlay 时、冲击/强调时刻 | 全屏人脸 |

**禁止**：中途直接 fade out face（用 INSET 替代，保留人格存在感）。结尾最后 0.6s 可以 fade out（may-shorts-6 在 CTA 锁定后 fade face 让锁屏画面独占结尾）。

**使用逻辑**：
- SIDE → INSET 转换用于 outro（人脸缩小但一直在）
- INSET 场景的 bg 必须用全宽（1920px 或 `inset: 0`），因为人脸只占右下角
- 多栏/多内容需要全屏宽度时选 INSET，不是 SIDE

### 场景视觉规则

📖 **详细规则见 `rules/hyperframes.md`** overlay 美学规范章节。核心要点：

- bg 深色渐变（非纯黑 `#000`），vignette opacity 0.15-0.3，不需要 grain overlay
- SIDE 场景 bg 960px + mask-image feather（60-100px 右边缘），INSET 场景全宽（1920px 或 inset:0）
- 所有彩色文字加匹配色 text-shadow glow（如 `0 0 30px rgba(accent,0.5)`）
- overlay 不写退场/resolve 动画（outro 除外）— face-wrapper 缩回 scale 1.0 自然掩盖
- outro 可以有退场 fade（0.8-1.2s）

### 字幕系统规则

📖 **详细规则见 `rules/hyperframes.md`** Captions 章节。核心要点：

- 首选 word-level 逐词字幕（独立 captions.html sub-composition），降级用整句字幕
- 字幕文本用 Whisper 转录原文 + 手动修正（不是口播稿精简版）
- 逐词三态颜色：未读(dim) → 当前(accent) → 已读(white) + scale 1.06 微弹跳 back.out(3)
- 8 方向 text-shadow 描边（非毛玻璃底板）
- 特殊关键词可标 accent 色切换（如"warn"切橙色）

### 场景密度策略

| 原则 | 说明 |
|------|------|
| B-Roll 占比 > 30% | 总 overlay 时长 / 总视频时长 |
| 每 10-15s 至少一个场景 | 避免长时间无动画 |
| 场景时长跟口播段落匹配 | 不能太短（看不完）也不能太长（想关掉） |
| 长口播段落拆分多个场景 | 不在一个场景里塞 15s+ 内容 |

---

## 项目目录

```
video-projects/<project-slug>/
  DESIGN.md          ← 视觉设计（含 motion token）
  index.html         ← 主编排（video + audio + scenes）
  compositions/      ← 场景 HTML
  assets/            ← 视频/音频/转录
  renders/           ← 渲染产物（gitignore）
```

## 知识参考

**本 skill 自带：**
- `references/broll-architecture.md` — sub-composition 结构、CSS scope、常见错误
- `references/broll-design-reference.md` — face-wrapper 4 种架构、8 种视觉风格、face 美化、边缘 feather
- `references/broll-techniques.md` — 24 种常用动画技法 + 3 大基础设施系统（ambient-bg/captions/face-wrapper）

**项目级（自动加载）：**
- `CLAUDE.md` — **Render Contract（11 条硬规则）+ workspace layout + 全部 CLI 命令**。构建前必读
- `rules/hyperframes.md` — B-roll overlay 完整规则 + 渲染器踩坑 + 性能优化
- `MOTION_PHILOSOPHY.md` — 官方美学体系（10 Laws + pre-flight checklist）
- `DESIGN.ais-example.md` — 完整 DESIGN.md 结构模板
- `video-projects/may-shorts-6/` — 官方 overlay 参考项目
- `scene-index.md` — 52 个内容场景的视觉灵感库（7 横屏模板，按内容类型速查）

**委托 skill：**
- `/hyperframes` — Composition 编写规则，写 HTML 前调用
- `/hyperframes-cli` — init / lint / inspect / preview / render / doctor
- `/hyperframes-media` — 转录 / TTS / 背景移除
- `/hyperframes-registry` — 安装 catalog blocks（`npx hyperframes add <name>`）
- `/gsap` — GSAP 动画参考

**官方源码仓库（本地权威文档）：**
- `/Users/hanzhmacbookair/Documents/hyperframes/hyperframes-repo/docs/` — 超越 skill 文件的官方文档
  - `guides/rendering.mdx` — workers/GPU/Docker/质量设置
  - `guides/gsap-animation.mdx` — GSAP 官方规则
  - `guides/performance.mdx` — 性能优化
  - `guides/common-mistakes.mdx` — 7 个常见错误
  - `concepts/determinism.mdx` — 确定性渲染原理
  - `concepts/data-attributes.mdx` — data 属性完整参考
  - `reference/html-schema.mdx` — HTML Schema 权威定义
