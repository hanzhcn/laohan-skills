# BGM不可听反馈的skill定点修复

2026-10-29，root。用户拒绝Easy Lemon初次试听为“根本听不见”，并追问skill音量依据。原示例volume0.10+5:1 duck，实际用0.12仍叠强压低；整体−18.59LUFS技术通过没有验证音乐存在感。本次改laohan-laowai/SKILL与performance-bgm：同窗/同声道分别测voice、music、duck后music；校准dB增益与复测，不用固定百分比；用户听不见即REVISE、不冒模型/峰值通过为听审。

源实现2c3d15df586c5264d6e63634302417ce873fb78d（基线64a48f12dc5b430ad4ca66ea3a8e93fea0f818d0）。可执行示例要求有限MUSIC_GAIN_DB和0–1 DUCK_MIX，共同stereo布局和正确18秒处理窗。原样脚本实际7项正反例（真实正例出片/解码、缺gain/duck、NaN、湿声越界、滤镜表达式、已有输出保SHA）通过；双宿主同源，无相关video runtime lock，不改无关锁或上游。

GLM-5.3 max/128000/1800一次382.678秒VALIDATED/end_turn，HTTP UNVERIFIED_CLI；15静态反例无阻断。F1补回LUFS/LRA/百分比不为全项目硬门的说明，shell和SKILL审后未改；F2无效参数诊断体验建议驳回，拒绝功能有效，不顺手重构。新试听456119c6433e72ccbf8c4e019ddba22f7a48315db82a3a9b033febba89b5de02已同名替换桌面BGM试听.mp4，旧2abc两处入Trash；原完整最终片a72d79e5和声音/参考不动，未发布或新训练/口型。

同声道下实测旧音乐比voice低21.85LU，新低9.56LU，预混music支路提高12.29dB；只属此片校准示例，不是学到对方的通用比例。新试听混音−18.43LUFS/−1.54dBTP、实际18.08秒/452帧，视频包相同、解码通过。没有新用户听感签认，GLM不能代听。完整证据在成长项目docs/handoff/EP01_BGM_LEVEL_20261029/；本次不改他窗STATUS，最终Git/本轮资源清理见该处closeout。
