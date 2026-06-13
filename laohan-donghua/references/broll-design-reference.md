# B-roll 设计参考

> Overlay 独有设计参数。通用参数见 `rules/hyperframes.md`（easing 表、时长指南、速度表、ambient 代码、overlay 适配表）。

## 8 种视觉风格

| 情绪 | 风格名 | 适用 |
|------|--------|------|
| 数据驱动、技术分析 | Swiss Pulse | SaaS、数据、开发者工具 |
| 高端、企业 | Velvet Standard | 奢侈品、企业软件、演讲 |
| 原始、攻击性 | Deconstructed | 技术发布、安全产品 |
| 炒作、大声、高能 | Maximalist Type | 大发布、里程碑 |
| AI、未来感 | Data Drift | AI产品、ML、前沿技术 |
| 温暖、个人化 | Soft Signal | 健康、个人故事、生活方式 |
| 文化、热闹 | Folk Frequency | 消费应用、社区产品 |
| 暗黑、戏剧性 | Shadow Cut | 安全产品、调查内容 |

详细 YAML token 见 `/hyperframes` skill 的 `visual-styles.md`。

## Face-wrapper 架构（4 种）

> 不同视频项目使用不同的 face-wrapper 架构。选择依据：口播视频比例（16:9 vs 9:16）、overlay 内容面积需求、叙事节奏。

### 架构 A：左右分屏（HERO/SIDE/INSET）

来源：`may-shorts-6`、`tutorial6`

面在右侧（固定 960px 宽），overlay panel 覆盖左侧。

| 模式 | x | y | scale | 何时用 |
|------|---|---|-------|--------|
| **SIDE** | 480 | 0 | 1 | 日常讲解场景（默认），左右分屏 |
| **INSET** | 1340 | 760 | 0.27 | outro/CTA、多栏对比、需要全屏宽度 |
| **HERO** | 0 | 0 | 1 | 无 overlay 时、冲击/强调时刻 |

- `transform-origin: 0 0`
- 过渡：`duration: 0.32, ease: "expo.inOut"`，提前 0.15s
- Overlay panel 边缘：Mask-image Feather（技法 #6），`mask-image: linear-gradient(90deg, #000 0%, #000 88%, transparent 100%)`

### 架构 B：上下分屏（BOTTOM/FULLSCREEN/HIDDEN）

来源：`may-shorts-18`、`may-shorts-19`

面在下方（9:16 竖拍视频，裁切为横屏），overlay panel 覆盖上方。

| 模式 | x | y | scale | opacity | 何时用 |
|------|---|---|-------|---------|--------|
| **BOTTOM** | -180 | 1110 | 0.75 | 1 | 日常讲解（面在下半部分） |
| **FULLSCREEN** | -1166.5 | 0 | 1.778 | 1 | 冲击/强调时刻（面放大填满） |
| **HIDDEN** | -180 | 1110 | 0.75 | 0 | 全幅 overlay 场景（面完全隐藏） |

- 9:16 源视频 `scale:1.778` 放大到 16:9 画幅（1920/1080 ≈ 1.778）
- BOTTOM 模式：面在下方约 75% 位置，上方留 960px 给 overlay
- **需要 Seam Treatment（技法 #22）**：面/overlay 交界处的渐变柔化 + accent line
- 过渡：`duration: 0.32-0.50s, ease: "expo.inOut"`

**may-shorts-19 变体**（BOTTOM 参数不同）：

| 模式 | x | y | scale |
|------|---|---|-------|
| BOTTOM | 0 | 1136 | 0.5625 |
| FULLSCREEN | -1166.5 | 0 | 1.778 |

### 架构 C：全屏→画中画（FULL→PIP）

来源：`claude-edit-intro`

前半段面全屏，后半段面缩小到右上角（独立 promo 风格）。

| 模式 | x | y | width | height | 何时用 |
|------|---|---|-------|--------|--------|
| **FULL** | 0 | 0 | 1920 | 1080 | 开场（面全屏） |
| **PIP** | 1340 | 60 | 540 | 960 | 后半段（面缩小到右上，画中画） |

- PIP 模式加 `.pip` class：`border-radius: 36px`、3 层 `box-shadow`（橙色辉光）
- 过渡只发生一次（FULL→PIP），`duration: 0.60, ease: "power3.inOut"`
- PIP 的 `width:540, height:960` 把横屏源裁成竖屏窗口（`overflow:hidden`）

### 架构 D：无 wrapper（全屏 + 遮罩层）

来源：`golden-ratio-demo`

没有 face-wrapper transform。面视频全屏 z-index:0，overlay 通过遮罩层叠加。

- **Face Wash**：`linear-gradient(180deg, rgba(7,18,28,0.10), rgba(7,18,28,0.30))`，`mix-blend-mode: multiply`
- **Left-zone Dark Mask**：`width:760px`，`linear-gradient(90deg, rgba(7,18,28,0.92), transparent)` — 左侧深色区域放 MG
- **Vignette**：`radial-gradient(ellipse 70% 60%, transparent 40%, rgba(0,0,0,0.55) 100%)`
- 适合：面始终全屏、MG 内容较轻的场景

### 通用规则

**禁止**：中途直接 fade out face（用 INSET/BOTTOM 或 HIDDEN 替代，保留人格存在感）。结尾最后 ~0.6s 可以 fade out face 让 CTA/锁屏画面独占。

### 过渡时序

- SIDE/HERO 切换用 `t - 0.15`（提前 150ms，让 face 在场景到来时已就位）
- HERO 全屏回归可加长到 0.45-0.55s + 提前 0.25-0.30s（更有电影感）

### Face 美化（三层）

```css
/* 1. 色彩校正（按实拍调整，仅供参考） */
#face-video {
  filter: contrast(1.04) saturate(1.02) brightness(0.99); /* may-shorts-6 用 1.06/1.06/0.98 */
}

/* 2. Ken Burns 缓慢缩放（在 mainTl 中） */
mainTl.to("#face-video", { scale: 1.03, duration: TOTAL, ease: "none" }, 0);

/* 3. vignette（face-wrapper::after） */
#face-wrapper::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: radial-gradient(ellipse at center, transparent 60%,
    rgba(5,11,19,0.3) 88%, rgba(5,11,19,0.7) 100%);
}
```

### 边缘 feather

overlay bg 右边缘加 `mask-image` 渐变（60-100px），避免和 face-wrapper 硬切：

```css
[data-composition-id="xxx"] .bg {
  mask-image: linear-gradient(to right, #000 0%, #000 calc(100% - 80px), transparent 100%);
}
```
