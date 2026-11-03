# 成长系列字幕、全文Gemini与发布包方法修复

任务：LAOWAI-SUBTITLE-CONTENT-PACKAGE-20261104。唯一writer为Codex root 0de8c5f1-fd0e-4d4c-b512-165dce4b2f02；源仓main精确提交，保留他窗已集成7c6249c及其它资产。业务真源：`/Users/hanzhmacbookair/Documents/laowai/1chengzhang/STATUS.md`，证据目录为同项目 `docs/handoff/EP03_07_REBUILD_20261104/`。

实际改动：laohan-laowai与两个新引用统一完整口播/中文/三平台的Gemini独立成稿和融合，不允许成长项目SKIPPED进配音；自然讨论、真实证据与自然分段取代模板报数/履历/虚构评论。字幕生成、出片、建包使用同一个最终WAV/稿件/词锚/ASS/字体/工具绑定硬门，四文件用户包与内部母版证据分开。修过时链接、ASS路径和旧小红书强制分点口径。

本轮实证：五期Gemini.app最高实际档完整原稿、融合及原始ASR留存；音文技术均已闭合；03/04/06媒体技术与实际抽样视觉通过，04真实成片→建包→verify-existing→交付dry-run通过。其余媒体/正式云盘交付由业务任务接续，不提前宣称完成。76项回归通过，1个仅Linux /proc用例在macOS跳过。

复审先构造错WAV/ASS/报告、重叠/缺cue/截边、旧final、全文Gemini遗漏、危险路径、CFR跳时、云盘错owner/分页循环/重复token/失败信封等攻击，实际正反例与模型静态推演分开。GLM5.3 max、1800秒、128000输出五份有效审查分别在code-review、code-review-round2、content-review、review-round3、review-final；完整原文、调用metadata、候选文件manifest及逐条裁决在上述业务证据目录。最后一轮453.922秒/end_turn/VALIDATED/PASS，无阻断；建议按真实音频尾部/PCM补证或明确决定不增通用框架，见review-final/adjudication.json。模型未运行命令/听音/看图，不冒独立实测。

效率依据：句点拆配音造成缩写孤段→改完整语义段；ASR上下文歧义→保留raw、核差异段、精确未变PCM复用；末帧包截尾导致CFR补帧→只修适配器、保留全部上游守卫；远端只assemble回候选且成功后精确清可再生缓存。没有重训、换模型/机器、改变生产服务/权限或新增审批。

agents/claude入口均指向本源；宿主发现与本轮实际执行范围已核，未宣称所有宿主自动触发。连续听感、全片动态音素口型、真机与Jeffrey最终接受/平台发布均未代签。仅交付方法和真实执行证据，不保证流量或平台通过。最终提交/push身份由业务closeout.json记录。
