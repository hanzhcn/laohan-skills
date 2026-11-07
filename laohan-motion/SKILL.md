---
name: laohan-motion
version: "2.0.0"
description: 老韩数字人×Motion视频的端到端入口。承接一句创作需求或在制任务，串联共同选题、LOCAL/Gemini全部文案双稿融合、本人形象、v3-05配音、同声口型、模板导演、真实动态样段、异模型复核、渲染与候选交付；按依赖并行与已验输入恢复。用户说“做motion视频”“从选题到成片”“继续motion制作”“motion提速”或锁稿后选Motion时使用。仅原生Remotion、声音训练或单独发布不走本链。
---

# laohan-motion · 从选题到候选成片

本机项目根：`~/Documents/laohanvideo`，先用当前STATUS核准确绝对路径；下文项目文件相对此根，`laohan-*/SKILL.md`指共享`~/.agents/skills/`中的入口。本skill为local配置，负责路由与执行节奏；合同、创作方法、Motion制作方法和命令仍各认现行真源，不另造renderer、状态机或自动质量保证。

## 先绑定本期，再选起点

先完整读全局AGENTS/DEV_RULES、项目AGENTS指定合同和STATUS全部当前任务区，匹配任务ID、准确目录、当前输入及剩余步骤；扫`docs/认知纠错记录.md`。不按日期最新目录猜任务，不重开已完成待看片的旧片。所有步骤遵守本期已获授权；“直到成片”授权内持续推进，不能冒写Jeffrey已亲自接受，已明确停工时补充素材来源不自动解除停工。

| 当前输入 | 接哪里 | 不做什么 |
|---|---|---|
| 只有方向或一句“做Motion视频” | 下表①共同选题，持续组织后续步骤 | 不要求用户先拿锁定稿来，不另开一套选题法 |
| 已选题、未锁稿 | 核本题研究/双方选题证据，补缺后走② | 不跳独立材料审阅或Gemini |
| 已锁稿 | 核来源/双稿融合/锁定身份后走③ | 同一已融合文字不重复重写；首次用于本期的旧稿仍按双引擎合同 |
| 在制、失败恢复或明确返修 | 按STATUS及当前回执定位首个未完成依赖 | 不重做未变已验声音/口型；不把旧批准换名复用 |

原生Remotion（含明确竖版数字人）分流`laohan-bianpai/laohan-daoyan`；声音训练分流`laohan-yinse`；单独发布分流`laohan-fabu`。Motion不建episode，不走原生new-episode/0—⑭/默认倍率；画幅只认`motion/mastery/delivery-requirements.json`及Jeffrey明确新指令。

只问流程、盘点或优化skill时按该请求回答/维护，不创建新期或启动配音、口型、渲染。

## 分阶段加载

下列真源在进入对应阶段前全文读取所列适用部分。一次已完整读过且仍在当前未压缩上下文、内容未变时不反复加载；启动/恢复/压缩、源变化或转阶段时按合同补读，哈希/摘要和另一模型的阅读不代替本人实读。缺文件先核真实路径、修本任务入口；仅暂停受影响步骤，不因无关资料缺失停整条链。

| 阶段 | 读什么 |
|---|---|
| 开始/恢复 | 上述共同必读；`docs/视频生产入口与适配.md`的Motion与选题接入；`docs/文档真源与状态.md`；`docs/HARNESS_COMPATIBILITY.md`命中宿主；交付要求 |
| ①选题、②写作 | `laohan-xuanti/SKILL.md`、`laohan-chuangzuo/SKILL.md`及其命中五步/六步方法；`../laohan-chuangzuo/references/dual-engine-gemini.md`本项目覆盖；四平台发布规格的文字约束 |
| ③声音/人物、④口型 | `motion/mastery/DH-ROUTE.md`§一A—一D、`pronunciations.json`；`~/Documents/声音资产/Jeffrey/数字人专属音色融合方法.md`；分块工具说明及真实help |
| ⑤模板/导演至⑦交付 | `motion/mastery/PRODUCTION-METHOD-V4.md`、`PIPELINE.md`、`current-release.json`、`QUALITY-SCORECARD-20261104.md`；所选原包分支公开契约，命中效果复盘与动态参考 |
| 具体命令/排障 | [制作执行细节](references/full-chain.md)、[门与字段](references/gates-and-checks.md)命中部分；仍以PIPELINE及本包argv为准 |

## 一条任务链

任务列表和唯一下一动作写STATUS对应任务，实际文件/命令/失败留本期qa；不再建第二份完成状态。下面是调度关系，不是放宽原步骤验收。

| 节点 | 做什么 | 主要技能/工具 | 产物或边界 |
|---|---|---|---|
| ① 共同选题 | 实时研究、同一中立候选包，LOCAL/Gemini独立排序，我整合；按原合同完成独立选题/材料审阅 | xuanti、Gemini、现有topic检查 | 选题裁决、来源、材料交接；用户仅要候选时停在候选 |
| ② 全部文案 | 双方各写口播、标题、四平台正文/标签、封面及已知画面文字，我融合；六步法/Sepia/内容审校核最终稿 | chuangzuo、双引擎方法、现有script检查 | 完整双原稿、逐项融合、显示稿/发音稿及锁定记录 |
| ③ 真实输入 | 昂贵生成前实看唯一允许目录的本人原片；合成本期v3-05完整WAV，核发音与漏重词 | 合同§五、专属音色方法 | 原片路径/SHA、最终WAV路径/SHA/采样数；听感状态按DH-ROUTE |
| ④ 口型与准备 | 最终WAV驱动现有分块runner；可并行本地声学对齐、模板研究和已融合封面制作 | same-voice-local、run-same-voice-remote、align-source、封面skill | 完整人物、接缝/时钟与词源；共享GPU和TTS输入串行 |
| ⑤ 模板与导演 | 全库轻刷新、A能力实证、整段内容编舞；真实素材/时间齐后direct，B节拍预估后plan→preview→动态样段 | V4、PIPELINE、production-guard、score-timeline | 所选分支的真实表达、当前revision与样段；不靠快切凑动作 |
| ⑥ 规划终点 | review-brief携完整目标/输入/实际动态，异模型对抗审后负责人裁决；通过才全片render | guard、独立复核通道 | 绑定本期样段的pilot_review与渲染回执 |
| ⑦ 结果与交付 | 核实际MP4、C完整视觉复看和独立结果对抗；delivery/check-delivery后核三封面/四平台文案/字幕，交本地候选包 | guard、检查器、现有交付入口 | human_review有真实结论、工程deliveries+桌面副本/SHA；Jeffrey接受、发布另记 |

首次完整执行按[依赖、恢复与计时](references/execution-map.md)调度；命令细节按full-chain，不能把本表当成已完成证据。

## 提速的执行约束

- **身份和输入先核**：人物仅按生产合同§五的唯一目录及排除项实看，不用seed/公共人物；原片复制与派生要可追溯。新稿必有本期新WAV；已有同一已验WAV/人物的视觉返修才复用。
- **文字成批，保持独立**：默认把Gemini组织为“候选比较”和“已知全部文案”两批，资料相同、双方稿互不泄露；不限制为两次调用。新增文字补对应双稿，缺项`BLOCKED_GEMINI`，不得锁定或交付缺稿部分。融合后立即实测各平台字数/标签等约束，避免末尾重写。
- **只并行无依赖、无共享写入的工作**：口型生成期间可做不消费其未完成输出的本地准备；正式导演登记必须等真实输入齐。TTS共享输入、GPU、同一record/instance/cache写入不并发；子agent按DEV_RULES§10分工监督，不复制执行者。
- **复用绑定，局部恢复**：先看已有成功回执/实际输入及版本，按合同重跑受影响下游；机械通过不缓存实际观看、听感或接受。未变输入不反复重合成，失败/未知/过期回执不复用。
- **审查集中在有效终点**：制作保留规划样段与整片结果对抗；普通确定性动作不逐个另开审查。①的selection_review/material_review仍在原前置完成，可按原合同同批审，不能用共同作者Gemini代独立者或移到写作后补签。发现本轮阻断立即修复；同批修复冻结后按现行门验证与正常提交，不叠加无新变化的全量测试。

## 质量与门不能省

- 模板选择必须落实“本段讲清什么→哪些对象/素材怎样持续变化”；对照所选版本/分支的真实动态、人物关系与原设计字幕，不能用控件清单、缩字、删槽或统一卡片代替表现力。全库轻筛不等于全库深审；每个入围候选的8—15秒能力样段及评分卡A/B/C仍按现行规格完成。
- B在plan前用当前production.params执行`score-timeline.py --stage plan`，写明段内变化点与静止问题的实际修法；C在交付前实看每段首中尾原尺寸帧、1倍速全片和阿杜同类段，记录实际能力/未验边界，`human_review.verdict`为空不交。按同一revision保留selection→delivery→outcome，未发布不编outcome；命令及判据见full-chain与现行质量尺子。
- 单段/全片最长无变化间隔≤5秒的要求与现行质量尺子保持；score-timeline是advisory，不冒新增机械门或审美保证。原尺寸/动态/连续复看各记真实范围，静帧不能代动态，工具误报回原媒体裁决。
- 全部plan/render/delivery经production-guard，pilot有自己的direct/plan/preview；参数变化重plan/预览/复核，声音/素材/契约/编排变化先新revision。原包只读，官方read/new/setup/doctor/prepare/preview不用套guard。
- 独立复核须实际访问材料、先对抗再常规审核，保留完整原答并逐条裁决；优先GLM→codex→Magpie免费DeepSeek→官方DS，跳过同家族、禁guiji，满配及费用按全局合同。Gemini共同创作不代替独立复核。

## 完成与不完成

工程`motion/projects/<日期-slug>/`保留真实输入、director/production、原答、失败与有效QA；稿件真源按项目接入规范引用，媒体与凭据不入代码Git。候选及清单在工程`deliveries/`，桌面只是同SHA副本。

“制作交付完成”=本期必需内容/来源/动态/独立复核与实际成片检查完整、候选包逐项回读、STATUS记清未验范围；不要求冒写Jeffrey接受。只有真实接受才登记accepted-final；无本期授权不上传、发布、回复或对外发送。缺必要环节只报实际阶段与下一动作，不以文件存在、机械PASS或模型赞成代签。

本任务远端中间物回收、恢复资产保留与正常Git收尾按项目合同执行，不扩到历史或他人目录。发现自有skill/方法的真实缺口当轮回真源修正并验证；不把生产问题积压，也不为假设扩张平台。提速只报告实际计时与已验范围，未做新片不得称速度已提升。
