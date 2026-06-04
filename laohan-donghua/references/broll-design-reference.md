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

## Face-wrapper 模式（标准：translate-only）

may-shorts-6 实测值。Face 不缩放，平移到右侧，overlay panel 覆盖左侧。

| 模式 | 值 | 何时用 | 说明 |
|------|-----|--------|------|
| **SIDE** | `x:480, y:0, scale:1` | 日常讲解场景（默认） | 左右分屏，960px 内容区 + 右侧全尺寸人脸 |
| **INSET** | `x:1340, y:760, scale:0.27` | outro/CTA、多栏对比、需要全屏宽度 | 小窗人脸，释放完整画面空间 |
| **HERO** | `x:0, y:0, scale:1` | 无 overlay 时、冲击/强调时刻 | 全屏人脸 |

**禁止**：直接 fade out face（用 INSET 替代，保留人格存在感）。

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
