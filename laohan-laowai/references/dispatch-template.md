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

- 允许：本项目内写稿/WAV/素材预占/GPU same-voice/字幕/出片/封面/发布包/飞书交付/git 提交推送 main（direct 授权在案）
- 禁止：自动发布平台、新增付费点、改生产 sidecar/冻结 runner 合同（GPU 走已验定式）、不动他人 WIP、定时续跑禁用会话内 CronCreate（用 task-guard add 或 create_schedule）
- 发布文案标题/封面文字落定后不改口播正文（正文锚 SHA 后仅包装层可调）

## 3. 候选基线与必读资料（按序读）

1. `/Users/hanzhmacbookair/Documents/laohan-laowai/AGENTS.md` + `STATUS.md` 当前任务区
2. `docs/handoff/RETRO_DATA_20261110/retro/retro-fusion.md` **EP{{NN}} 节全文**（选题/标题公式/赢面落点/时长/风险前置/下期预告原话）
3. {{本期素材输入：评论 JSON/数据文件路径与使用边界（引内容不引昵称）}}
4. 项目 `docs/ops/cover-spec.md`（三尺寸封面、字数硬拦、大字=发布标题拆行统一策略）

git 基线：main @ `{{SHA}}`（派发时 HEAD）。

## 4. 关键定稿输入（不得偏离）

- **片尾兑现上期预告（原话已投放观众）**：「{{上期预告原话}}」
- **片尾预告下期（原话）**：「{{下期预告原话}}」
- **三标题统一锁定（2026-11-12 Jeffrey 拍板）**：发布标题（≤20字，预告句浓缩优先）、封面大字（line1/line2 各≤7字、sub≤14字）、片内 title_zh（≤7字）**同轮一次产出**；封面大字与片内大字=发布标题的拆行子串或问句展开，**禁止引入标题没有的新词、禁止自由压缩出零信息短语**（判例：EP09「糖和辣条」）；三处全部过外行 3 秒可读检验（laohan-chuangzuo）；title_zh 与 line1 取不同段（同文查重，cover-spec 质检第 5 项）。仍按合同出 3 候选+登记理由 title-candidates.json。
- **敏感边界（fusion 原文）**：{{本期敏感边界，如儿童健康/金钱观邻域的落点限制}}
- **上期数据教训**：{{上期首读/48h 关键指标与改进指令，如跳出率与前 5 秒要求}}

## 5. 流程硬规则（判例资产，照抄不重踩）

1. 字幕初稿每屏 **≤11 字**（字形安全框，EP08 为此多花 5 轮审阅）；**审阅 prompt 必须显式写"修法 ≤11 内容字"**——DS 会把字形门当软约束反复给 12-14 字修法（EP09 四轮不收敛实锤）
2. 审阅通道：单模型 **4 轮不收敛即换通道**（DS R1-R5 漂移判例）；跨家族优先级 codex→Magpie免费→官方ds（实现方 GLM 不复审自己初稿）；全不可用按完成优先兜底条款（官方 ds 同模型绿灯）
3. GPU same-voice 定式：`svc.sh stop worker tts tbdub` → 分片批跑（内存 20GiB 预算、块数按成片长度）→ `start` 恢复；SSH 命令一律 `> log 2>&1` 不用管道；失败残留 `rm -rf outputs` 全量重跑
4. 封面一条命令三尺寸默认齐出（34/43/916），crop-y=240、crop-y-43=240；**916 一律带 --mask-916**（遮盖 y≤240 片内标题带防同文双写，EP09 判例②闭环 2026-11-12；crop 方案裁后仅剩 1040 高补回必变形故用遮盖）；zai 视觉审 4 项×3 尺寸；大字按 §4 统一策略
5. 飞书交付双通道：≤25MB 消息直发（push-feishu.mjs 带附件）、>25MB 云盘 folder+链接；桌面发布包照放（~/Desktop/EP{{NN}}-发布包-日期/）
6. 发布登记：gap-analysis.json 加 EP{{NN}} 行，published_at 待 Jeffrey 发布后登记（**登记发布时刻必须核实真实发布时间——创作者中心快照时间戳，禁止拿报告时刻冒充**，EP08 判例）；观测点 48h/7d 用 task-guard add 登记（带时区 offset，due=发布时刻+N，脚本用 ~/miniconda3/bin/python）

## 6. 验收标准（可执行入口）

- `build-pubpk.py` 五文件包 PASS（script-review 双 SHA 绑定、cover_gate 三尺寸）
- 字幕语义+字形双门 PASS（record-review 留证）；WAV 词锚零差异；weigui CLEAR
- GPU 收据 sole_audio_source=与 WAV SHA 一致；full_decode PASS
- 封面 zai 审 4 项 PASS ×3 尺寸（含同文查重）
- git 锚定提交+push；飞书交付回执落盘 pubpk/
- STATUS.md 建批次卡片；work_state 开 ep{{nn}}-creation-{{日期}} 列表全程更新

## 7. 时间预算与监督

- 预算：制作全链目标 **≤{{4-8}}h**（EP09 实测 1.5h 全通，判例资产在手时按 4h 预算、新链路首跑 8h）；写稿双引擎 ~1.5h、GPU ~0.5h、字幕审阅 ~2h、出片交付 ~1.5h
- 超时处置：单环节超预算 2 倍 → 中期报告（飞书推 Jeffrey）再继续，不静默拖
- 监督：统一看门狗（laohan-watchdog，停滞>20min 飞书告警）+ notifyOnFinish；边界事件即时飞书推送（完成/卡住/超时/转人工）
- 完成即收窗：回执核对后 archive_agent + 台账 done + 监督注销

## 8. 控制面

- cwd：`/Users/hanzhmacbookair/Documents/laohan-laowai`
- 模型：claude/glm-5.3[1m]，modeId=bypassPermissions，thinkingOptionId=max（一次定死不改）
- 费用：仅既有 key（智谱/GPU 生产）；外发：飞书交付通道既有授权；新付费点停问 Jeffrey
- 回执格式：四态首行 + 关键产物路径 + 留证清单 + 未完成/未知项
