# METHOD_LAB 历史导演合同

本文件只服务 Jeffrey 明确要求的 METHOD_LAB、旧 AST/双 renderer 路线或历史 episode 恢复。新episode和V5导演预制禁止读取或执行本文件。

## 输入

读取历史episode：

1. `01-口播稿.md`：内容真值；
2. `07-剪辑/clean.mp4`：剪后真人视频；
3. `07-剪辑/subtitles.srt`：实际口播与时间真值；
4. `episode-config.json`：画布、平台、workflow_mode、renderer_mode、primary_renderer；
5. `07-剪辑/edit-manifest.json`：当前 raw、clean、字幕与口播稿的 SHA-256，且 subtitles_confirmed=true；
6. `06-拍摄素材/shooting-record.json`：当前稿与 raw 的 SHA-256；
7. `07-剪辑/spoken-script-variance.json`：当前稿/字幕的差异审阅，必须 `CLEAR` 且事实偏离为0。

缺任一项就列出缺失文件并停止。不得用原稿的预估时长代替剪后字幕时间。

## 历史工作流

### 1. 验证输入与事实边界

- 检查字幕覆盖 clean.mp4 的首尾、画布与 fps 已声明。
- 口播稿和字幕不一致时，文字以实际说出的话为准。事实偏离必须回上游处理。
- 声称真实产品、数据、结果或用户界面时标为 PROOF_PUBLIC 或 PROOF_USER；没有来源不得画成证据。

### 2. 生成语义beat

按实际字幕切分，不按固定秒数切分。每个beat记录：

- beat_id、quote、start_s/end_s；
- understanding_problem、selected、source_mode；
- must_not_imply、entry_exit、acceptance_question。

没有明确理解障碍时选 HERO 或 NONE。禁止覆盖率、每N秒一场、固定scene数、固定文案和固定颜色。

### 3. 建立历史动画合同并路由素材

- 只有 BROLL_STOCK beat 写入 source-manifest 的素材请求。
- ILLUSTRATIVE beat 写入 EDL 的动画slot。
- HERO/NONE beat 不创建素材或动画任务。
- CROSS_RENDER_VALIDATION_PAIR 给Remotion与HyperFrames相同事实层、不同renderer brief。
- animation brief使用历史schema；`animation-ast.json`由历史编译脚本确定性生成，不得手填。
- PROOF_PUBLIC/PROOF_USER必须绑定受支持的claim与同源证据。

### 4. 历史落盘

在`09-导演/`写入：`导演简报.md`、`beat-sheet.md`、`edl.json`、`animation-brief.json`、`animation-ast.json`、`source-manifest.json`、`renderer-brief.md`、`styleframes/`、`animatic-manifest.json`、`review-checklist.md`；NATIVE历史路线还包括`renderer-route.json`与`caption-style.json`。

styleframe验证焦点、层级和安全区；animatic绑定真实clean/SRT及完整动画周期。REVIEW_GATED必须等待审阅。

## 历史失败处理

| 情况 | 动作 |
|---|---|
| 字幕与视频时长不匹配 | 回⑧重新转录或修正字幕 |
| 需要真实证据但没有来源 | 标记proof_missing，不用示意图伪装 |
| stock无结果 | 保持no_result，重新判断表达方式 |
| 两个renderer像同一模板 | 保留语义，重写各自renderer brief |

## 历史边界

- 不发布、不回复外部平台；
- 不把全稿逐句变成动画；
- 不复用上一期文字、画面、颜色、场景数或时长；
- 不把本文件用于V5新episode。
