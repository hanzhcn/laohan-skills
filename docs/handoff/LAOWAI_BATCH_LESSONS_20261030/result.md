# 本轮独立对抗复审（静态，未调用任何工具；仅引用材料内回执）

## 1. Scope 与候选身份

- **内容候选**：`cc119a48af9b6698b43447f473993af51f99ba37`（仓级声明值，本轮以文件级 SHA 绑定审）。技能源候选 `a6715a94659e196dc74f6af67fd7973f661f76b0`。我无法运行 git/sha256，commit 级身份**按申报接受**；文件级绑定可静态核对，见下。
- **本轮只审**：① prepare/assemble 四处显式 CFR + CRF0/slow 任务副本（`same-voice-local-lossless-cfr.py`，声明 SHA `c5af834a…`）；② EP06/EP07 v2 融合稿、subtitle-lines、三平台文案、weigui；③ 三平台与中文语义；④ 技能文件中转述引号修正与新判例的边界收紧。
- **不重审**（前次 GLM max 已 PASS 且 diff 显示未变）：partition/float_safe、PCM 取样、controlled()/symlink 门、output_collection/receipt 门、concat 安全、保护逻辑。diff 四处编码参数 + `transport.crf` 外无其他 hunks；提供的全文与 diff 终态逐处一致。
- **关键绑定链（静态可核）**：EP04 复核增量记录"临时副本 SHA `c5af834a…`，其余字节与 `04a498b4…` 一致"；`vsync-cfr-increment.json` 的 `candidate_sha256` 与 `all-frame-clock-check.json` 的 `assembly_script_sha256` 均为同一 `c5af834a…`。即：**本轮被审字节 = 回执实测字节**，无"审 A 测 B"错位。
- **回执数值自洽性（我可算）**：EP04 九 core 之和 75+102+100+82+107+64+110+108+112=860=whole；时长和 34.4s=whole；core+左右5帧上下文与 prepare 块数 80/112/110/92/117/74/120/118/117 逐块吻合（首块无左上下文、末块无右）。合成例 9+20+25=54、0.36+0.80+1.00=2.16s、51840 样本/24000=2.16s。全部自洽。

## 2. Adversarial attempts

| # | 反例路径 | 证据 | 结果 |
|---|---|---|---|
| A1 | nb_frames 比实际多 1 复现（原缺陷） | `all-frame-clock-check.json`：9 core+silent+final 实际解码帧=容器帧=应有帧，PTS 全 25fps 连续（EP04 真实 GPU 回执） | 未推翻；**仅 EP04 覆盖**，后续各集须照跑同门 |
| A2 | `-xerror` exit0 误绿仍在脚本内 | 代码 `full_decode='PASS'` 仍无条件写；EP04 复核已实证 non-monotonic DTS 仍 exit0 | 路径成立但已知、已修成因+外部真检覆盖 → 降为 LOW finding |
| A3 | 远端 `-r 25 -vsync cfr` 丢/重帧 | EP04 真实回执：帧数/PTS 正确 + `lossless-core-pixel-check.json` 860 帧像素全等 GPU trim | 未推翻（该实测 FFmpeg 版本） |
| A4 | 修复归因错误（B帧/CRF0） | 材料给定：fast18+B帧+显式CFR也通过；Motion 原 fast18 无 CFR 失败 | 拒绝 B 帧归因，成立且与回执方向一致 |
| A5 | prepare 重编码像素漂移 | EP04 复核：原片→reference→cycle→global→chunk 逐帧像素 SHA 全等（给定回执） | 未推翻（EP04） |
| A6 | 周期端点重复（cycle 数学） | 7帧→12周期→54帧跨循环对抗（review.md 给定回执） | 未推翻 |
| A7 | 清单/回执被改 | `validate(expected_bytes=…)`、output_collection SHA 门均未在 diff 中变化（前次 PASS 范围） | 未推翻（按 diff 关联） |
| A8 | EP06/07 中文丢条件/否定/人称/漏句 | 我逐行静态比对（见 §4） | 未推翻：14/14、11/11 组完整 |
| A9 | 标题>20 或抖音≠5tags | 逐字计数（§4） | 未推翻 |
| A10 | 绝对断言/假亲历残留 | EP06 无 "once does no harm" 类绝对；EP07 无 "never"；小红书"我会试着"为建议口吻+虚构角色声明，无编造亲历事件 | 未推翻 |
| A11 | weigui 与源稿脱钩 | `source_script_sha256` 与两份 md 声明 SHA 字符串一致；`spoken_sha256` 无法静态复算 | 源稿绑定✓；spoken 按申报接受（INFO） |
| A12 | 首次 root clock 检查失败被算媒体故障 | 材料说明：glob 工具错误，修正后真实检查 PASS，失败现场留存 | 定性为工具事故，非媒体缺陷；通过依据是重跑回执（给定） |
| A13 | 576 升采样冒 720 | 材料声明原生 576 不升采样；EP04 回执 576×1024 | EP04 覆盖；后续各集按政策执行（未逐集实测） |
| A14 | 委派语义被本轮放宽 | SKILL.md 持续委派处标注"概括性转述，实际范围以留存用户原文为准"；episode-execution 保留"成片接受/外发另核" | 未放宽；引号修正到位 |
| A15 | 文件↔SHA 绑定造假 | 无法静态复算 SHA；但三份回执 + 增量记录 + 提供文本四方同指 `c5af834a…` | 按申报接受，未测复算 |

## 3. Findings

- **[LOW-1]** `assemble` 内部 `full_decode:'PASS'` 仍仅由 `-xerror` exit0 支撑，且 STOP_CORE_LENGTH/ASSEMBLED/FINAL 帧门仍读容器 nb_frames——EP04 已证明二者均可误绿。缓解已存在：四处显式 CFR 消除已知成因；技能强制"每 core 与整片核实际解码帧数+PTS+时长"，EP04 真实回执已执行。**要求**：每集 assemble 后外部时钟检查不得省略，assembly.json 的 full_decode 不得单独代签。
- **[LOW-2]** core 编码处未钉 `-pix_fmt yuv420p`（prepare 三处有）。EP04 实测为 yuv420p 且像素校验覆盖；若 GPU 端格式漂移则无内建门。建议后续副本补齐，本轮不阻断。
- **[INFO-1]** 文件名 "lossless" 与 `decoded_pixel_identity_claimed:false`、技能"不称整链无损"一致，无冒称，接受命名。
- **[INFO-2]** `spoken_sha256` 两集均无法静态复算，按申报接受；weigui scope 自称覆盖口播/字幕/三平台，与其内容一致。
- **[INFO-3]** EP07 teaser 中文省略主语（"要不要帮送到学校"），"忘带作业/送到学校/疑问句"三要素俱在，"帮"为轻微增义，可接受。
- **[INFO-4]** 最终 mux 的 AAC priming / A/V 起点对齐无回执，属成片 QA 范围（技能已列要求），列 UNTESTED 而非 finding。

无 MEDIUM/HIGH。前次 HIGH（第四处 CFR 缺失）已被精确修复字节 + EP04 真实回执关闭。

## 4. 三平台及中英语义核对（静态）

**EP06**：标题 抖音"总夸你真聪明，合适吗"(10) / 视频号(11) / 小红书(10+emoji) 均≤20；抖音恰 5 tags；AI 角色声明+Easy Lemon CC BY 4.0（含 Edited/looped/mixed）三平台齐全。字幕 14 组=英文 14 句一一对应，跨组引号开合完整；"always→总""can matter too→也可能重要""not a cheer→不用每个动作都喝彩"等条件/否定全保留；三平台均保留"不是禁用聪明二字/不是成绩保证"对冲，与拒绝 Gemini 绝对表述一致。
**EP07**：标题 12/11/12 均≤20；抖音恰 5 tags；AI/CC 三平台齐全。字幕 11 组完整；"It doesn't make you a failure→但不代表你是失败者""Skip the shaming→别用羞辱的话""doesn't measure→衡量不了"否定全保；teaser 修复后含 forgotten homework+完整疑问句；"Do you ever let your child win→你会故意让孩子赢吗"人称/故意性保留；平台文案保留"不规定永远不让/不保证挫败效果"，与稿界一致，无 never 绝对词。
两集 subtitle-lines.json 与 md 表逐条一致；weigui 均 CLEAR、`platform_guarantee:false`、not_attested 如实列听感/成片/平台。

## 5. 最终 Verdict

**APPROVE_METHOD_CODE_SCRIPT_SCOPE**（方法/代码/脚本/文案/技能边界；非成片、非发布、非听感签署）。

**UNTESTED / 未覆盖（不得写 PASS）**：
- EP03/05/06/07 真实 assemble 后的外部时钟/PTS/像素回执（材料仅覆盖 EP04 真实 GPU 全链）；EP07 v2 尚待重合成+同一全文门。
- 本批各集新 WAV 整轨音文/听感（无声学实测；不要求 Jeffrey 听英文，不以 ASR/旧接受冒签）。
- 成片视听 QA：口型/接缝/节奏/字幕烧录实际字形/标题常驻/BGM 响度/AAC priming 与 A/V 对齐。
- 后期 CRF0/slow 母版新耗时 SLA（旧 CRF17 速度不转用）；平台真实预览与发布（未授权自动发布）；commit/文件 SHA 复算与旧 FFmpeg 未来版本兼容性（不推广本轮实测结论）。

允许范围：按现候选字节继续本批 prepare/GPU/assemble 与逐集机械门；每集成片仍逐集实际 QA，候选推进不等于接受或发布。
