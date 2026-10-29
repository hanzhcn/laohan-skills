# EP05/06 增量对抗复审（无工具·纯静态）

**范围确认**：仅审三项——(1) EP05/06 AAC时长60/80ms超出的-t修复；(2) EP06 TP -0.93→重混原WAV改TP=-2.2；(3) EP05字幕意群19→17（11字完整否定并入同一中英时窗）。不重开CFR/代码/06/07英文与平台copy，不代签听感/动态/平台项。

## 一、五项推翻尝试

**A. 「仅输入atrim等于输出时长」——推翻成功（该命题不成立）**
反例即随卷证据：EP06输入侧已按真实素材时长取料，audio-output-duration-audit.json仍显示audio_stream 23.80 vs expected 23.72（delta 0.08s）。机制自洽：loudnorm动态模式192kHz内处理+AAC priming/remainder可在尾部多出约2–4帧，输入atrim管不到编码器尾部。修复后证据：EP06 v2回执容器Duration 23.72（=593帧@25fps整），解码至23.70；EP05回执`final_streams_and_container_duration_32_24: true`（806帧=32.24×25整）。结论：**-t为必要项，非冗余；修复有效**。

**B. 「AAC请求TP等于输出TP」——推翻成功**
双向反例：EP06修前请求-1.5实测-0.93（+0.57dB过冲，主张级证据，工件未随卷但机制可信）；EP05请求-1.5实测-2.3（反向偏低0.8dB）。有损编码后TP只能实测。修复验证：v2 log对**解码后AAC**在192kHz下实测input_tp -2.19、input_i -18.46——低于-1.5名义限留0.69dB余量，且与EP05(-2.3)族内一致。从**原WAV**重混而非二次loudnorm，避免双重动态归一，方向正确。**修复有效**。

**C. 「时间修正会改视频payload」——推翻成功（EP05有直接工件；EP06未测，见下）**
EP05：`dry_to_final_video_payload_equal: true`、`post_lossless_all_806_pixel_and_pts_rows_equal: true`、master与reference framehash同SHA（758f70…）、PTS全整除25、repeat复用依据明示"audio-only correction不改video packet"。同剪同窗、只动音频轨，逻辑上无视频重编码必要。**EP06 v2无对应payload工件，判未测**，归入root身份核验必查项。

**D. 「旧测量可以套新AAC」——推翻成功**
每个AAC是新派生（配方明文）。本增量行为正确：EP06 v2重新实测（-18.46/-2.19）而非套用修前值；EP05 metrics标注method为"full actual input interval"，是对自身final-aac的实测而非沿用。**无违规复用**。

**E. 「语义精简变纵容孩子」——推翻成功**
subtitle-lines.json第11条：「接纳情绪不等于纵容行为」（恰11字）/"Accepting a feeling doesn't mean accepting every action."——情绪/行为区分的否定结构完整保留；上下文第3条"keep the limit"、第9条「我不会让你打人」"I won't let you hit"显式守住边界，封住"every"量化词的语义缝隙。违规扫描JX类明确"未把接纳情绪等同无边界"，0项未解决高风险；规则集2027-01-09前有效。 cues=17=JSON条目数（逐条核过）=19-2（两意群并一），ass_sha256与outputs内subtitles.ass一致；`inputs_unchanged: true`佐证未动ASR/WAV/GPU；视觉抽查含20.4s完整否定帧，无裁切/重叠。**精简是压缩表述而非放弃边界**。

## 二、交叉一致性核验（通过）

806=32.24×25 ✓；593=23.72×25 ✓；v2解码音量17744KiB≈23.66s与time 23.70吻合 ✓；人声-音乐差8.8 LU与分轨-21.1/-29.9吻合 ✓；回执保持listening/platform/jeffrey/independent全false，未冒签 ✓；字幕再生成与-t修复同次完成（回执即修后状态，否则32.24布尔自相矛盾），时序自洽。

## 三、明说未测/无工件字段

1. **EP06 v2视频payload同一性**：无framehash/逐包比对工件（EP05有）——鉴于本增量已发生"配方有、执行漏用"先例，此项不可默认，列为root核验必查。
2. **audit JSON未再生成**：EP06条目仍为修前23.80，EP05整条缺席；修后流级duration探针工件缺（EP06仅容器级23.72）。
3. EP05修前60ms与EP06修前-0.93dBTP的原始测量未随卷，属主张级证据（方向与机制自洽，不影响修后判定）。
4. 连续听感、音画连续验收、平台预审、Jeffrey接受：维持未测，符合"不冒签"要求。

## 四、裁决

**APPROVE_INCREMENT_SCOPE**

**Finding**（非阻断，随卷移交root）：五项推翻尝试全部成立，三项修复在静态证据内闭合——EP06修后23.72/593帧、实测TP -2.19≤-1.5留0.69dB余量、I=-18.46与族内一致；EP05全流32.24、17 cues、11字否定同窗生成、英文/WAV/ASR未动。附条件：root吸收前须补(1) EP06 v2视频payload同一性核验，(2) 重出含EP05/06修后流级条目的duration审计；EP05/06修前数值以主张级记录存档。听感与平台签署继续留在remaining，本裁决不覆盖。
