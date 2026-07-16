---
name: laohan-daoyan
version: "1.5.0-candidate"
description: METHOD_LAB/历史 episode 的真人口播语义导演。默认 CODEX_DIRECT 生产不使用本 skill；只有用户明确要求方法实验、旧 AST/双 renderer 路线或恢复历史 episode 时使用。
---

# 真人口播语义导演

> 2026-07-16 起，本 skill 不是新 episode 默认。默认⑨—⑪由 `codex-direct-production` 连续完成，只写 direct brief/source manifest 并直接制作 Remotion 成片。下面的 AST/styleframe/animatic 合同仅适用于 Jeffrey 明确发起的 METHOD_LAB 或历史 episode。

先决定观众在哪句话会失去理解，再决定是否需要画面。renderer 和素材库不能替代这个判断。

## 输入

读取当前 episode：

1. 01-口播稿.md：内容真值；
2. 07-剪辑/clean.mp4：剪后真人视频；
3. 07-剪辑/subtitles.srt：实际口播与时间真值；
4. episode-config.json：画布、平台、workflow_mode、renderer_mode、primary_renderer。
5. 07-剪辑/edit-manifest.json：当前 raw、clean、字幕与口播稿的 SHA-256，且 subtitles_confirmed=true。
6. 06-拍摄素材/shooting-record.json：当前稿与 raw 的 SHA-256。
7. 07-剪辑/spoken-script-variance.json：当前稿/字幕的差异审阅，必须 `CLEAR` 且事实偏离为 0。

缺任一项就列出缺失文件并停止。不得用原稿的预估时长代替剪后字幕时间。

🛑 STOP：缺 clean.mp4、subtitles.srt、edit-manifest 或有效 episode-config.json 时，不产生 beat sheet。

## 工作流

### 1. 验证输入与事实边界

- 检查字幕覆盖 clean.mp4 的首尾、画布与 fps 已声明。
- 口播稿和字幕不一致时：文字以实际说出的话为准。事实偏离不得由导演解释或继续制作，必须写入 variance record 并回②/⑤/④；只有非事实差异已明确审阅后才能写入导演简报。
- 声称真实产品、数据、结果或用户界面时标为 PROOF_PUBLIC 或 PROOF_USER；没有来源不得画成证据。

### 2. 生成语义 beat

按实际字幕切分，不按固定秒数切分。每个 beat 写：

| 字段 | 要求 |
|---|---|
| beat_id | 稳定编号 |
| quote | 实际口播原话 |
| start_s/end_s | 来自字幕 |
| understanding_problem | 观众为什么难理解 |
| selected | YES 或 NO |
| source_mode | HERO / PROOF_PUBLIC / PROOF_USER / BROLL_STOCK / ILLUSTRATIVE / NONE |
| must_not_imply | 不能误导成什么 |
| entry_exit | 与哪句原声建立和结束 |
| acceptance_question | 如何判断是否降低理解成本 |

没有明确理解障碍时选 HERO 或 NONE。禁止覆盖率、每 N 秒一场、固定 scene 数、固定文案和固定颜色。

### 3. 建立四层动画合同并路由素材

- 只有 BROLL_STOCK beat 写入 source-manifest 的素材请求。
- ILLUSTRATIVE beat 写入 EDL 的动画 slot。
- HERO/NONE beat 不创建素材或动画任务。
- renderer_mode 为 CROSS_RENDER_VALIDATION_PAIR 时，给 Remotion 与 HyperFrames 相同事实层、不同 renderer brief；不得共享具体布局、代码或转场。
- renderer_mode 为 PRIMARY_RENDERER 时，primary_renderer 必须是 remotion 或 hyperframes，且有已接受的验证记录；否则停止并改回 CROSS_RENDER_VALIDATION_PAIR。
- EDL、source manifest 与 animation brief 使用项目 动画生产接口规格.md 的 schema；source_entries 覆盖每个 selected beat，broll_requests 只保留 BROLL_STOCK beat。
- 每个 selected beat 必须有非空 quote、understanding_problem、entry_exit、acceptance_question 和 must_not_imply；时间不得重叠或越出 clean.mp4。
- schema 2 的每个动画 beat 必须写 `semantic_contract → art_direction → parity_plan → native_challenge`：先明确 audience job、理解障碍、无动画反事实、证据边界和验收题，再明确注意力/人物/reading bands/字幕关系，最后才列可观察 state/transition、native capability allow-list 和 must-preserve。
- `animation-ast.json` 只能在 workflow 根运行 `node animation-method/scripts/compile-animation-ast.mjs episodes/<slug>/09-导演` 由批准 brief 确定性生成；禁止手填，禁止 JSX/HTML/CSS/GSAP/Remotion、绝对像素或视觉样式参数进入 AST。随后必须运行同命令加 `--check`。
- `renderer_track: NATIVE` 时禁止在 EDL 写固定 `visual.render_plan` 代替 animation brief；同时输出 hash-bound `renderer-route.json` 和统一的 `caption-style.json`。route 只决定候选/证据状态，不替 renderer 作视觉实现；caption style 必须匹配 `shooting_contract.caption_safe_area.bottom_reserved_pct`。⑪分别提交 native proposal。`renderer_track: PARITY` 只用于旧 render_plan 的等义执行/回归，不代表视觉上限。
- `acceptance_question` 只供 QA，禁止作为屏幕文案。屏幕文字必须来自 art direction 的 approved copy/copy contract，renderer 不得补写。
- PROOF_PUBLIC/PROOF_USER 必须声明⑤ `04-事实主张.json` 中 `SUPPORTED` 的 `claim_id`，以及与该 claim 同源的 `evidence.id` 与 URL/本地来源；真实资产由⑩物化到本期并核验，⑨不下载素材。

### 4. 落盘

在 09-导演/ 写入：导演简报.md、beat-sheet.md、edl.json、animation-brief.json、animation-ast.json、source-manifest.json、renderer-brief.md、styleframes/、animatic-manifest.json、review-checklist.md；NATIVE 还必须写 `renderer-route.json` 与 `caption-style.json`。`edl.json` 与 `source-manifest.json` 都必须记录 `edit_manifest_sha256`，并引用同一当前 edit-manifest。格式遵循项目 动画生产接口规格.md。

styleframe 先验证主状态的焦点、信息层级、人物/字幕安全区；animatic 必须绑定真实 clean.mp4/SRT 和 entry/establish/change/hold/exit 帧。静态帧拥挤、误导或读取时间不足时停在⑨，不把问题交给 motion 掩盖。

REVIEW_GATED 时，在 EDL、brief、styleframe 与 animatic 落盘后标记等待审阅；AUTONOMOUS_RUN 时继续⑩或⑪，但不允许代替 Jeffrey 写 viewer verdict。

🔴 CHECKPOINT：REVIEW_GATED 的 EDL、animation brief、styleframe、animatic、renderer route 与 caption style 必须获得审阅结论，才能交⑩或⑪；AST 重新编译后 SHA 必须与审阅输入一致。

## 失败处理

| 情况 | 动作 |
|---|---|
| 字幕与视频时长不匹配 | 回⑧重新转录或修正字幕，不规划动画 |
| 需要真实证据但没有来源 | 标记 proof_missing，停在该 beat，不用示意图伪装 |
| stock 无结果 | 保持 no_result，回到本 skill 重判，不自动改为动画 |
| 两个 renderer 看起来像同一模板 | 保留相同语义，重写各自 renderer brief，不改 beat 真值 |

## 不做什么

- 不调用素材 API、不下载、不合成、不渲染；
- 不把全稿逐句变成动画；
- 不复用上一期的文字、画面、颜色、场景数或时长；
- 不在没有 Jeffrey 发布确认时发布。
