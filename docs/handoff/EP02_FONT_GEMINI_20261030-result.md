# GLM 独立对抗增量复审记录（review-n1u633xm → 本轮）

**候选** db96c4594ba50e1498c43df38a3eadca914c2f9f ｜ **源skill** deb004da1eca72080b13634891dab5869387fcaf
**范围**：仅 F-1/F-2/F-3 最小修（check_caption_glyphs.py / make_captions.py / render_and_mix.py）、SKILL.md 新增一行、新文件 references/gemini-client.md，及随附工件。未重审未改全稿。

**静态声明（前置）**：本复审未运行任何工具、未复跑任何脚本。以下全部为对所给 diff 与工件文本的静态对抗分析；工件中的 PASS/REJECT_EXPECTED 结论系提交方声明，本复审只做一致性证伪，不冒充实跑复现。

---

## 一、证伪尝试（先攻后核）

| # | 攻击路径 | 结果 |
|---|---|---|
| A1 | 陈旧 negative 绕过：换 ASS 后沿用旧 negative 报告 | render_and_mix 新增 `negative['ass_sha256'] == sha(ASS)` 前置拒绝，reason 与工件逐字一致，未找到绕过 |
| A2 | 换 TSV/脚本后重跑 make_captions 使 plan 自洽 | plan 会同步更新，但 language-bounds 与 negative 的 `ass_sha256` 随之失配 → 仍拒。绑定链 cues.tsv↔plan↔ASS↔glyph/negative 闭环成立 |
| A3 | 只改 script / raw / music / voice | 分别被 `script source changed`、`raw changed`、`music changed since calibration`、WAV 硬编码 SHA 拦截；与 6 条 REJECT_EXPECTED 工件一一对应 |
| A4 | 工件伪造嫌疑 | **反向佐证真实性**：`changed_voice` 的 reason 为空串，恰与代码中第一条**无 message** 的硬编码 WAV 断言先于带 message 的 calibration 断言触发的真实执行行为吻合；伪造品通常会复制 reason。7 条 reason 与 diff 中 assert 字符串（含缺省）完全一致 |
| A5 | guard 非真前置 | `main()` 首行即调 `verify_inputs()`，先于输出存在性断言与两次 ffmpeg，时序成立 |
| A6 | 两处脚本路径不一致 | make_captions `HERE.parents[1]/'scripts/…'` 与 render `ROOT/'docs/scripts/…'` 静态解析为同一文件 `<root>/docs/scripts/ep02-allowance-v2.md`，一致 |

## 二、常规核对

- **F4**：final-media-qa 中 `video_payload_sha256` == `dry_video_payload_sha256`（b8891f08…），证 `-c:v copy` 载荷保真。注意这是**载荷 SHA，非整文件 SHA**（整文件为 56c4fae6…），工件表述精确，比"包SHA"口语更严谨。内部一致性：2249 帧 ÷ 25fps = 89.96s ✓；loudnorm 输出 -18.29/-1.53 在目标容差内；对 EP01 帧差三点均 >25；`user_acceptance: PENDING` 如实未冒收。
- **F5**：冗余字形报告不入门为设计决定，gate 由 language-bounds 全量 + negative 覆盖；`longest` 补 `ass_sha256` 作档案绑定，可接受。
- **F6**：plan 新增 `english_equivalence_scope: 'lowercase alphanumeric tokens; punctuation not byte-compared'`，口径明示，满足最小修要求。
- **F7/gemini-client.md**：触发条件双重门（网页已按 huashu 核过仍退稿 **且** 本轮已有同目标同文案授权）；不绕验证码/登录、不新增费用、不扩收件人、不自动发布；完成判据（三平台全文+末尾讨论齐+停止按钮消失，在途/HTTP200 不算）与既有 SKILL.md 判据同构；"填稿前已选高不算、粘贴后回低"的实测坑位已固化；取回后清空暂存草稿、不读思考内容、不归档凭据。SKILL.md 新增行与 reference 文件内容一致。授权引用为用户本轮逐字授权，未见扩权。

## 三、Findings（均不构成 REVISE）

1. **[advisory]** render_and_mix 中硬编码 WAV 断言无 message，致 `changed_voice` 工件 reason 为空串。功能不受影响（仍拒绝），建议补 message 提升可诊断性。
2. **[advisory]** gemini-client.md 步骤 4 的"回贴输入框取回"存在误触发送的残余风险，目前仅指令级缓解（"只取回、不再发送"）。建议补机械性防护：取回全程不触 Enter/Send、粘贴即查即清、焦点丢失即中止。本轮已成功执行且外溢限定同会话，不阻。
3. **[note]** 用户口中 "gemini4" 与 UI 标签 "4 Argon" 的映射以"实际界面型号留档 + 按当前 UI 与用户决定核"处理，未断言身份等同——可接受；建议留档补记映射依据，防未来 UI 改名时静默错档（"不盲用历史编号"条款已部分覆盖）。
4. **[note/静态假设]** check_caption_glyphs.py 的 `ass_sha` 变量、make_captions.py 的 `hashlib` 导入未在 diff 上下文直接可见，由同 dict 既有 `ass_sha256` 行与 context line 中 `hashlib.sha256(ass.encode())` 推断存在；未实跑验证。
5. **[note]** preflight-guard-negatives.json 无时间戳，测试 harness 脚本未随 diff 入库，溯源依赖工件内部一致性（已核一致）；建议后续将 harness 入库或工件加时间戳。

## 四、结论

**APPROVE**

F-1/F-2/F-3 最小修内部自洽、绑定链闭环、工件与代码逐字吻合（含空 reason 这一真实执行特征）；原媒体 ASS 未动、无 GPU 重算或重烧要求；F4–F7 声明与工件相符。上述 advisory 项供下轮顺手处理，不构成本轮阻断。
