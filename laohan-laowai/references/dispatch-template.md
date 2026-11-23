# 制作窗口 DISPATCH 任务包模板（2026-11-12 建，EP08/09 判例固化）

> 用法：复制本模板到 `docs/handoff/EPXX_<slug>_<日期>/DISPATCH.md`，填 `{{占位符}}`；**不带占位符的节是判例资产，照抄不重踩、不得删除**。派发按 laohan-paifa（§10 合同+满配 settings+监督先行）。
> 模板本体即判例真源：新判例产生时回写本模板对应节并 commit（laohan-skills 仓），下期自动继承，不再依赖"上期 README 当必读"人工传递链。

---

# EP{{NN}} 制作任务包《{{标题}}》

派发：{{日期时间}} | 派发方：{{主会话/派发窗口}} | Jeffrey 已拍板开工
回执首行四态：做成 / 没事做 / 没跑成 / 待你处理（四选一开头）

## 1. 目标

按 retro-fusion.md EP{{NN}} 节定稿完成全链制作并交付发布包（发布仍由 Jeffrey 手动，不自动发布）。预告链位置：{{上期}}({{上期主题})→**EP{{NN}} {{本期主题}}**→[预告{{下期主题}}]→EP{{NN+1}}。

## 2. 允许/禁止范围

- 允许：本项目内写稿/WAV/素材预占/GPU same-voice/字幕/出片/封面/发布包/飞书交付/git **任务分支**（`task/<slug>-<日期>`，从派发提交创建）精确 stage 提交并 push 该分支。**不自行合入 main**——ff-only 集成与 canonical 集成检查由派发方收尾执行（项目合同 L39、`docs/ops/project-closeout.md`；EP07/08 先例，EP09/10 直提 main 为已知偏差，2026-11-23 模板对齐合同）
- 禁止：自动发布平台、新增付费点、改生产 sidecar/冻结 runner 合同（GPU 走已验定式）、不动他人 WIP、定时续跑禁用会话内 CronCreate（用 task-guard add 或 create_schedule）
- 发布文案标题/封面文字落定后不改口播正文（正文锚 SHA 后仅包装层可调）

## 3. 候选基线与必读资料（按序读）

1. `/Users/hanzhmacbookair/Documents/laohan-laowai/AGENTS.md` + `STATUS.md` 当前任务区
2. `docs/handoff/RETRO_DATA_20261110/retro/retro-fusion.md` **EP{{NN}} 节全文**（选题/标题公式/赢面落点/时长/风险前置/下期预告原话）
3. {{本期素材输入：评论 JSON/数据文件路径与使用边界（引内容不引昵称）}}
4. 项目 `docs/ops/cover-spec.md`（三尺寸封面、字数硬拦、大字=发布标题拆行统一策略）
5. **项目脚本真源=项目根 `scripts/`**：`post-one.sh <批次目录> <EP> <DUR>`、`build-pubpk.py`、`publish-feishu.sh`、`make-cover.py`、`episode-caption-qa.py`、`footage-registry.py`——旧批次目录内同名文件已标 DEPRECATED，禁止复制/执行（2026-11-23 判例：SKILL.md 曾残留 EP05 副本指针，已修正）
6. 上期基线批次目录（`DISPATCH.md`/`README.md` 判例节/控制器脚本/`EPxx/` 证据/`pubpk/`，全链可复制）

git 基线：main @ `{{SHA}}`（派发时 HEAD）。

## 4. 关键定稿输入（不得偏离）

- **片尾兑现上期预告（原话已投放观众）**：「{{上期预告原话}}」
- **片尾预告下期（原话）**：「{{下期预告原话}}」
- **三标题统一锁定（2026-11-12 Jeffrey 拍板）**：发布标题（≤20字，预告句浓缩优先）、封面大字（line1/line2 各≤7字、sub≤14字）、片内 title_zh（**≥5 且 ≤7 字内容字**）**同轮一次产出**；封面大字与片内大字=发布标题的拆行子串或问句展开，**禁止引入标题没有的新词、禁止自由压缩出零信息短语**（判例：EP09「糖和辣条」）；**title_zh ≥5 内容字+单独 3 秒可读（EP10 判例：「随便取」3 字被 Jeffrey 驳回「绝对不可以」）；字形门预检前置——title_zh 候选先跑 glyph-bounds 实测定稿，放不下时先降字号（72→64→56→48 至手机可读实测最小档，「字多字号小」优于「字少零信息」，2026-11-15 Jeffrey 指令），全不过门才回标题候选 2/3 重选发布标题，禁止退到 <5 字碎片**；三处全部过外行 3 秒可读检验（laohan-chuangzuo）；title_zh 与 line1 取不同段（同文查重，cover-spec 质检第 5 项）。仍按合同出 3 候选+登记理由 title-candidates.json。
- **敏感边界（fusion 原文）**：{{本期敏感边界，如儿童健康/金钱观邻域的落点限制}}
- **上期数据教训**：{{上期首读/48h 关键指标与改进指令，如跳出率与前 5 秒要求}}

## 5. 流程硬规则（判例资产，照抄不重踩）

0. **开工前置义务（项目合同「数据补收事件驱动」）——写稿前必须先完成**：①线上实查（CDP9333 采集一轮即同时完成在架对账）②全量数据补收（按 `docs/ops/amy-data-readback.md` CDP9333 口径）。**补收清单真源=gap-analysis.json 各期 48h/7d 现值，不是 STATUS 待办队列快照**——STATUS 待办行更新滞后于实际回收（EP10 判例 2026-11-15：DISPATCH 沿用 STATUS 旧快照把已收的 EP08 48h 列为"立即补收"，制作窗口核实 gap-analysis 后落空，白耗核对工时；派发前必须对 gap-analysis 逐期核状态再写补收清单）；due 落在制作窗口期内的观测点写明「到点收」并给 due 时刻；Chrome157 playwright 补丁先验在位（丢了按 amy-data-readback.md 判例重打）；收完登记 gap-analysis.json 并 commit
1. 字幕初稿每屏 **≤11 字**（字形安全框，EP08 为此多花 5 轮审阅）；**审阅 prompt 必须显式写"修法 ≤11 内容字"**——DS 会把字形门当软约束反复给 12-14 字修法（EP09 四轮不收敛实锤）
2. 审阅通道：单模型 **4 轮不收敛即换通道**（DS R1-R5 漂移判例）；跨家族优先级 codex→Magpie免费→官方ds（实现方 GLM 不复审自己初稿）；全不可用按完成优先兜底条款（官方 ds 同模型绿灯）
3. GPU same-voice 定式：`svc.sh stop worker tts tbdub` → 分片批跑（内存 20GiB 预算、块数按成片长度）→ `start` 恢复；SSH 命令一律 `> log 2>&1` 不用管道；失败残留 `rm -rf outputs` 全量重跑。**EP10 判例四则（2026-11-15）**：①`--max-input-frames`=每块上限帧数（≤300），不是总帧数；新素材（无 tbdub-cache 预处理缓存）首块 preprocess 页缓存叠加可致容器增量 20GiB 门（rss 未超也会拦）——缩块至 ~150 帧+单块批跑；内存水位高先 `posix_fadvise DONTNEED` 释放 pkl 页缓存（无特权，84→46.6GiB 实测；drop_caches 容器内被拦）②probe 试跑也须 SVC stop→跑→start 全序列（裸跑撞生产日志门）③**素材头身位移稳定性进 D3 判据**：人物动幅大（脸 bbox 块内位移>16%）触发 crop_mode=2 与其余块分歧，被 assemble 一致性门（LIPSYNC_BATCH_MISMATCH，2026-11-14 上线）拒拼——D3 除正脸/嘴/手外加多帧人物轮廓位置对比；换素材前可 probe 首尾 2 块实测 crop_mode 一致性再全链 ④launch_voice.py 用 sys.executable 转发——必须 cosyvoice-train/venv/bin/python 调用（tbdub python 缺 torchaudio）
4. 封面一条命令三尺寸默认齐出（34/43/916），crop-y=240、crop-y-43=240；**916 一律带 --mask-916**（遮盖 y≤240 片内标题带防同文双写，EP09 判例②闭环 2026-11-12；crop 方案裁后仅剩 1040 高补回必变形故用遮盖）；zai 视觉审 4 项×3 尺寸；大字按 §4 统一策略。**★底图选帧强制视觉审（2026-11-15 EP10 判例：封面半脸被 Jeffrey 驳回）**：定帧前抽 4 帧交 GLM-5V-Turbo（zai analyze_image）逐帧审四项（人脸完整不入边/正脸嘴部自然/构图清晰/下部干净），任一 FAIL 换帧，审帧记录落批次；制作窗口可 API 直调 **glm-5.3-flash**（GLM-5 系原生多模态，智谱兼容端点同 key 套餐内，判例见 duomoxing.md 多模态节；glm-5.3 旗舰纯文本勿混淆）审帧，或用 zai MCP；回复取 text 块非 content[0]。**通道优先级（2026-11-23 补）：先 zai MCP `analyze_image`（GLM-5V-Turbo，走 MCP 月度额度，不占 GLM 5h 窗口），glm-5.3-flash API 备用；glm-5.4（cc 现主力）在 CC 内同样看不到图（base64 图请求 200 但模型称未见图，11-23 实测），CC 主会话/制作窗口不得用自身看图验收**
5. 飞书交付双通道：≤25MB 消息直发（push-feishu.mjs 带附件，**消息附评分行**）、>25MB 云盘 folder+链接；桌面发布包照放（~/Desktop/EP{{NN}}-发布包-日期/）且**必含 EP{{NN}}-评分.md**（`pingfen.py report --prediction docs/ops/pingfen/predictions/EP{{NN}}.json --out <桌面包>/EP{{NN}}-评分.md`）；交付汇报正文含总分/档位/最大风险
6. 发布登记：gap-analysis.json 加 EP{{NN}} 行，published_at 待 Jeffrey 发布后登记（**登记发布时刻必须核实真实发布时间——创作者中心快照时间戳，禁止拿报告时刻冒充**，EP08 判例）；观测点 48h/7d 用 task-guard add 登记（带时区 offset，due=发布时刻+N，脚本用 ~/miniconda3/bin/python；**prompt 内嵌 laohan-pingfen 回收命令**——48h 点 `pingfen.py actual`、7d 点 actual 终判+`calibrate` 档差归因，样例照抄 `docs/ops/pingfen/` 观测点 prompt 或 STATUS PINGFEN 卡；显式传 --mode bypassPermissions --thinking max，漏传会落 daemon 默认弹审批）
7. **三标题拆行定稿须实测三道门**（EP10 判例 2026-11-15）：line1/line2/title_zh 字数达标≠能过——①title_zh 过 glyph err（墨迹中心容差 576 几何 1.6px；「月息1块」类字形天然右偏 2.0px 直接 FAIL 且 pos 自动居中不可调、手改 ASS 被 verify 拒）——穷举合法子串实测选 err≤容差者，必要时主推标题为 title_zh 让位换候选；②line1/line2 过 make-cover 硬校验（数字算字符数，「100块月息1块」8 字符超 7 上限）；③title_zh 与 line1 不同段不同文。标题候选登记时把三处拆行方案+实测 err 写进 title-candidates.json
8. **laohan-pingfen 预评分（建包前必做，2026-11-15 建）**：按 laohan-pingfen SKILL.md PREDICT 模式，对最终发布包（主推标题+三平台文案+封面+全门回执）按当前生效 rubric（`docs/ops/pingfen/rubric.json`）逐维打分留 rationale，`pingfen.py score --out docs/ops/pingfen/predictions/EP{{NN}}.json` 落盘（**immutable，写入后不可改**）；预测 notes 必附承接池基数风险（承上期播放）；交付消息附评分行（总分/档位/最大风险）。build-pubpk pingfen_gate 会核评分存在（缺则 WARN）。窗口无视觉通道不影响（评分输入=文本+回执，非看帧）。**按当前生效版本的锚诚实打分**（打分前读 `references/scoring-rubric.md` 最新版本节），T1 对照锚表（EP06 禁令式=5 / EP07 同构「头X秒不说话」=2），不因「本期是验证实验」抬分；预测 notes 必附承接池基数（上期 7d 播放）与实验读数
9. **环境注意（2026-11-23 判例）**：①本机 Bash 的 `ls` 是 `eza --icons` 别名，在 `/tmp` 等目录会挂死（主会话实测挂 10 分钟被超时转后台）——脚本、循环、管道里一律 `/bin/ls`、`stat`、`find`；②Documents 子树目录列举报 `Operation not permitted`=Paseo 的 TCC「文稿」授权丢失（Paseo 自动升级后常见，非代码问题）——文件读取改 Read 工具、飞书报派发方，不反复重试
10. **README 素材行同步（2026-11-23 判例，收尾清单项）**：批次 README 的「素材」行与证据清单在换素材/门校准后必须同步改到与 `footage-binding.json`、registry 锁定一致——EP10 README 残留「换 b189 全链」过时记载，下期派发前靠抽帧 MAD 比对才排除「已发布造型仍在可选池」风险；收尾自审逐项核 README↔footage-binding↔registry 三方一致

## 6. 验收标准（可执行入口）

- `build-pubpk.py` 五文件包 PASS（script-review 双 SHA 绑定、cover_gate 三尺寸、pingfen_gate 评分行输出）
- **laohan-pingfen 预评分落盘**（predictions/EP{{NN}}.json，immutable，含逐维 rationale+env_risk）
- 字幕语义+字形双门 PASS（record-review 留证）；WAV 词锚零差异；weigui CLEAR
- GPU 收据 sole_audio_source=与 WAV SHA 一致；full_decode PASS
- 封面 zai 审 4 项 PASS ×3 尺寸（含同文查重）
- git 任务分支提交+push（回执写分支 tip 完整 SHA；不自行合入 main）；飞书交付回执落盘 pubpk/（消息含评分行）
- STATUS.md 建批次卡片；work_state 开 ep{{nn}}-creation-{{日期}} 列表全程更新
- 发布登记时观测点 prompt 内嵌评分回收：48h 点跑 `pingfen.py actual`、7d 点跑 actual 终判+`calibrate`（档差≥2 归因）

## 7. 时间预算与监督

- 预算：制作全链目标 **≤{{4-8}}h**（EP09 实测 1.5h 全通，判例资产在手时按 4h 预算、新链路首跑 8h）；写稿双引擎 ~1.5h、GPU ~0.5h、字幕审阅 ~2h、出片交付 ~1.5h
- 超时处置：单环节超预算 2 倍 → 中期报告（飞书推 Jeffrey）再继续，不静默拖
- 监督：统一看门狗（laohan-watchdog，停滞>20min 飞书告警）+ notifyOnFinish；边界事件即时飞书推送（完成/卡住/超时/转人工）
- 完成即收窗：回执核对后 archive_agent + 台账 done + 监督注销

## 8. 控制面

- cwd：`/Users/hanzhmacbookair/Documents/laohan-laowai`
- 模型：claude/glm-5.4，modeId=bypassPermissions，thinkingOptionId=max（一次定死不改；主力模型以 duomoxing.md 为准）
- 费用：仅既有 key（智谱/GPU 生产）；外发：飞书交付通道既有授权；新付费点停问 Jeffrey
- 回执格式：四态首行 + 关键产物路径 + 留证清单 + 未完成/未知项
