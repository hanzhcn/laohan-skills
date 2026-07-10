---
name: laohan-donghua
version: "11.1.0-candidate"
description: 真人口播动画生产编排器。读取⑨导演 EDL、⑩已核验素材、剪后视频和实际字幕，分别用 Remotion 或 HyperFrames 生成并 QA 最终成片。Use when 用户说生成动画成片、渲染口播动画、进入⑪动画生产、Remotion 成片、HyperFrames 成片、合成最终视频。
---

# 真人口播动画生产

本 skill 执行已经做出的导演决策，不重新决定哪些话要动画。动画不是固定 B-roll 覆盖率，也不是一个 HTML 模板。

## 必要输入

读取当前 episode：

1. 07-剪辑/clean.mp4 与 subtitles.srt；
2. 09-导演/edl.json、source-manifest.json、renderer-brief.md；
3. 10-素材/素材清单.json（仅当 EDL 有 BROLL_STOCK）；
4. episode-config.json。

缺输入时报告文件名并停止。只有 素材清单.json 标为 visually_verified 的资产可以使用。

🛑 STOP：EDL、source manifest、renderer brief 或 required 素材缺失时，不创建 renderer 项目。

## 工作流

### 1. 建立 renderer 任务

先在 workflow 根运行 `node scripts/prepare-renderer-handoff.mjs episodes/<slug> <remotion|hyperframes>`。两个 renderer 只能消费各自 `11-动画/renderer-handoffs/<renderer>/input-manifest.json`，先验证全部 SHA-256；禁止从 `视频动画` 的旧 pilot 或历史 project 猜输入。

渲染前运行 `node scripts/verify-renderer-handoff.mjs episodes/<slug>/11-动画/renderer-handoffs/<renderer>/input-manifest.json`。任何 hash 变化都回⑨或⑩重新生成 handoff，不能沿用旧 candidate。

随后运行 `node scripts/create-renderer-workspace.mjs episodes/<slug> <renderer>`，只在本期 `11-动画/renderer-projects/<renderer>/` 实现；生成器拒绝覆盖已有 workspace，旧 pilot 不参与。

workspace 必须通过 `node scripts/verify-renderer-workspace.mjs episodes/<slug> <renderer>`；它绑定当前 handoff SHA 和全部生成文件 SHA。handoff 变化后旧 workspace 与 candidate 必须拒绝，不能继续渲染。

完成检查后用 `node scripts/render-episode-remotion.mjs episodes/<slug>` 或 `node scripts/render-episode-hyperframes.mjs episodes/<slug>` 写入各自 candidate；渲染后必须继续走本期 QA 与审片 gate。

每个 candidate 先由独立审阅写入 `11-动画/qa-reviews/<renderer>.json`（绑定 candidate SHA、审阅者、时间、字幕安全区和有声审片结论及说明），再运行 `node scripts/create-qa-evidence.mjs episodes/<slug> <renderer> --review-file 11-动画/qa-reviews/<renderer>.json`，最后运行 `node scripts/create-render-manifest.mjs episodes/<slug>`。它生成真实 contact sheet、每个 selected beat 的入场/中段/退场帧、完整解码和结构化 `qa-evidence.json`。不能靠命令行或 Markdown 写 PASS 放行。

- CROSS_RENDER_VALIDATION_PAIR：Remotion 和 HyperFrames 各建独立 candidate 项目，使用同一 source hash、EDL、字幕和事实文字。
- PRIMARY_RENDERER：primary_renderer 必须是 remotion 或 hyperframes，且已有接受记录；否则停止并要求回到 CROSS_RENDER_VALIDATION_PAIR。专项 beat 只有在 EDL 明确指定后才交给另一 renderer。
- 两个 candidate 不共享组件、HTML、CSS、GSAP、布局常量、转场或旧项目 scene。

### 2. 实现 base video

- 每个 ILLUSTRATIVE beat 只实现 EDL 指定的理解问题。
- HERO/NONE beat 保持真人，不新增主动画。
- PROOF beat 只能使用 source-manifest 记录的来源。
- BROLL_STOCK beat 只能使用 visually_verified 素材。
- Remotion 使用 frame-driven composition；HyperFrames 使用 deterministic paused timeline。
- BROLL/PROOF 只使用 handoff 锁定的本期真实资产；ILLUSTRATIVE 只显示 EDL 的 `visual.on_screen_text`，禁止显示 `acceptance_question`。

### 3. 统一字幕与合成

- workspace 以⑧的校对字幕作为唯一字幕文本，并在 candidate 中统一合成。
- Remotion 使用 component motion diagram；HyperFrames 使用 timeline full-bleed scene，两者不得共享固定卡片布局。
- 不把口播稿精简版、场景标题或旧项目字幕混入字幕轨。

### 4. QA 与交付

在 11-动画/ 写 candidates、contact sheets、render-manifest.json、qa-report.md。CROSS_RENDER_VALIDATION_PAIR 只写两个 candidate；viewer_verdict 为 ACCEPTED 且 selected_candidate 明确后，才把选中 candidate 写为 07-剪辑/final.mp4。PRIMARY_RENDERER 也遵守同一 final 条件。

QA 必须记录：画布、fps、时长、音视频 stream、完整解码、source hash、EDL 版本、字幕安全区、每个 selected beat 的 hero frame 与边界帧、有声审片结论。

## 执行模式

- REVIEW_GATED：静态构图和最终 MP4 等 Jeffrey 结论。
- AUTONOMOUS_RUN：在锁定 EDL 内自主渲染并最多三轮自检；发布始终等 Jeffrey。

技术 PASS 不等于 viewer PASS，不得因渲染成功把 candidate 写成 accepted 方法。

🔴 CHECKPOINT：只有 viewer_verdict=ACCEPTED 且 selected_candidate 是 technical_qa=PASS 的候选，才创建 final.mp4。

Jeffrey 明确选片后运行 `node scripts/accept-render-candidate.mjs episodes/<slug> candidates/<renderer>.mp4 --viewer-accepted`；脚本绑定 manifest、candidate、QA evidence，并创建同字节 final 与 review-record。

双 renderer 比较成立后运行 `node scripts/record-renderer-validation.mjs episodes/<slug> <renderer> --viewer-accepted "<选择理由>"`。它绑定两份 candidate/QA/review 并生成结构化 comparison；只有该记录通过后，下期才允许切 PRIMARY_RENDERER。

## 失败处理

| 情况 | 动作 |
|---|---|
| renderer 无法读 source | 生成兼容 production source，记录新 hash，并让两边使用同一字节文件 |
| 画面遮挡字幕 | 修 overlay 或字幕安全区后重渲染，不能删字幕掩盖 |
| 视觉像旧模板或两个 renderer 太像 | 回读 renderer-brief；保留同一语义，分别重做视觉语言 |
| EDL 缺 source 或事实来源 | 返回⑨，不由本 skill 猜补 |
| QA 不通过 | 最多三轮针对性修复；仍失败则保留 candidate 并报告失败证据 |

## 禁止事项

- 不按固定 coverage、每 N 秒场景、固定 face-wrapper、固定卡片或固定文字生成；
- 不把 clean.mp4 复制命名为 final.mp4；
- 不为展示素材而插无关 B-roll；
- 不使用旧 v10 的 index.html、示例、视觉常量或人工 gate 规则；
- 不自动发布。
