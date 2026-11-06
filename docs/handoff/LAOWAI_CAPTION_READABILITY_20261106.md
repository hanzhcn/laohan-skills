# 成长系列中文字幕可读性修正（2026-11-06）

Jeffrey明确授权全面修规则、skills与脚本，只防后续生产、不重出既有视频。物理源仓main按本仓合同仅精确提交本任务文件并push；不新安装skills、不改全局规则/其他技能/客户端配置。

## 改动与接线

- laohan-laowai主入口及subtitle-validation/title-subtitle-layout/episode-execution/education-copy四份方法：保留自然标点、完整中文表达与关键语义；取代“省略边缘标点”的错误建议。
- 成长项目共享检查器是实际生成、post与五文件builder共同入口。prepare-review导出当前输入、逐条显示文本/时窗和无预裁决prompt；沿原一次模型审阅同时核断句、自然度、标点和双语对应，record-review验证实际调用并登记。旧scope/漏条/未决/过期拒绝；明显离线fixture拒绝，没有生产绕过参数。
- 14字内容预算不计标点；真实libass批量测量并逐句光学校正，既有字号、字形范围、全画面中轴容差不放宽。不加每期模型轮数；重复出口只跑本地校验。

## 证据与边界

完整证据在 `/Users/hanzhmacbookair/Documents/laowai/1chengzhang/docs/handoff/SUBTITLE_READABILITY_20261106/`：44项字幕主体测试通过，N1一行metadata根类型断言另过3项导入增量；4项package输入、真实16秒合成post→build→verify正反链通过。测试响应明确为离线fixture，不冒真实语义接受。

未参与实现的独立代码审查先构造旧policy/漏条/REVISE/坏ID/光学篡改/缺帧/字体漂移/导入副作用等反例，主体、F1、N1三次均APPROVE。GLM-5.3满配max/128000/1800静态对抗R1 340.486秒、R2 187.450秒均VALIDATED/end_turn/APPROVE，LOW F1（误导入fixture）与N1（非对象metadata报错）均按建议修复并实测；详细逐项裁决在review/adjudication.md。HTTP仅UNVERIFIED_CLI，不冒签实际HTTP200。

43屏合成prepare约10ms/generate约705ms、光学一个本地renderer批次；不把该夹具外推整期速度。原69项视频/WAV/ASS/JPEG资产字节与SHA未改。agents/claude技能路径已核同一物理源，只有文件发现证据，不冒全宿主自动触发、新片真实内容/听感/真机或用户接受。平台发布不在本轮范围。

本批源文件SHA、真实commit/push与远端main回读记录于成长项目同目录source-closeout.json，最终集成仍由成长项目独立核验。
