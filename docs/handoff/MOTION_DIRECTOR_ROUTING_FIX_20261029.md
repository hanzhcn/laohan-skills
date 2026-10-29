# Motion导演入口补强（2026-10-29）

任务=C03-DIRECTOR-SKILL-20261029，owner/writer=Codex/root。Jeffrey反馈当前Token片模板选择与有效使用不如旧片。本轮只取证归因、修已证实的技能传递弱点，不生成新片或重复发布。隔离基线e039e50242a33d4525d2df1783d52cca5f1d64d9，分支fix/motion-director-20261029。

## 改动与边界

laohan-motion 1.1.4→1.1.5，仅SKILL.md与references/full-chain.md：把V4整段导演工作显式放回登记前；模板选择核当前版本与执行分支，原生演示不替MK签能力；落实对象/关系、人物主辅、素材和动作编舞；限制妨碍表达时换合法方案；复核区分可读性修复与表现力兑现、展开中途与完整状态。既有V4/PIPELINE仍是方法真源，命令、声学前置、全库选型、共同门、真实授权与旧否决处理未变。不加控件/转场/镜头配额或固定构图，不增新机械门。

旧导演要求没有丢，本片也确有全库比较、导演方案、真实动作及全片QA；本次主要是执行与效果把关不足，不能全归因skill，更不能拿通过门反驳用户。本轮补强只修文字入口显著性，当前片保持NEEDS_REWORK_USER_FEEDBACK。

## 对抗复核与负责人裁决

独立GLM-5.3，max/128000/1800，完整end_turn/VALIDATED，298.457秒；CLI未暴露HTTP，记UNVERIFIED_CLI，结论APPROVE_DOC_SCOPE。实际13项对抗检查，含声学前置被弱化、全库选型被豁免、形成第二真源、强制审美配额、伪造布局授权、静帧代签动态、误报撤回代签全片等攻击，均未证成。

六个文字情境实际返回：A拒绝用多控件/多样段代签整段讲解；B不因card/cut固定返工；C不以原生演示替MK签能力；D不得伪造user-requested；E可读性修复不等于表现力已证；F中途抽帧误报可撤回但不代签全片。仅文字执行选择，未实跑新harness或新片，不称端到端或A/B改善。

F1（概括行声学顺序）、F2（复盘间接引用）均MINOR非阻塞：完整6a/门链仍明确写参数前声学对齐，direct强制source_record/template_selection；V4可定位实际复盘。负责人核实后保持已审字节。F3确认选型回退无死循环。零阻塞finding。

已审SHA256：SKILL.md=330313d4055e59f3fee7e9698e7bdda037ee767fb7b146986362b55053901de3；full-chain.md=a9f24e99243d5c8f85f076f1240058e9691b9a6a21e3b5f4df36e136e0f8ec8d。提交前四个审查输入SHA复算一致，git diff --check通过。没有生产代码变更，不添加镜像实现的测试。

完整归因（GLM文字审、免费DeepSeek真实视频帧审、所有误报的完整展开帧反证）在视频仓docs/handoff/MOTION_DIRECTOR_SKILL_DIAGNOSIS_20261029.md。本机原答与裁决在视频工程motion/projects/20261028-token-zenyang-zhuanqian/qa/director-diagnosis-20261029/，正常Git/生效字节与清理终态以该目录closeout.json为准。不提交媒体、原始凭据或缓存。
