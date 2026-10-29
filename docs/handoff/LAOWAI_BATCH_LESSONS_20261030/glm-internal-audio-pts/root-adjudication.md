# 内部音频时钟增量逐项裁决

GLM-5.3 max/128000/1800完整end_turn/APPROVE附验证收尾，实际224.131秒。静态范围，不代实际媒体。

- F1/P1：FIX_VERIFIED。root对五集全部10条final/master直接跑相邻AAC帧PTS、首解码0、有效末包结束=D、音频流与容器D；audio-internal-clock-audit-final.json。独立对四修复集12条mix/master/final实测同样通过，旧gap/内部突变拒绝。
- F2/P2：FIX_VERIFIED。独立results.json完整视频payload逐字节SHA均new=old=dry；root另对8条视频全部packet PTS/DTS/duration/size/flags逐项相等，见audio-fix-video-packet-clock-identity.json；04最终整文件仍d5e5b066…，阴性对照未重编码。原视觉/帧差候选时间保留，未重标新跑。
- F3/P3：FIX_VERIFIED，同时更正静态误读。precheck.metrics是ffmpeg对新AAC读入的测量pass的input_i/input_tp，来自mix-clock-v2-measure.log；不是编码前配方自报。GLM把其output_*误当目标/编码前值，相关推断不采信。独立又直接实测当前final I/TP分别03 −18.70/−1.50，05 −18.43/−2.24，06 −18.48/−2.23，07 −18.12/−2.16，均满足本项目工程目标TP≤−1.5；不是平台统一硬上限声明。
- F4：PCM参照SHA/实际解码样本已由独立38文件manifest与results精确登记，同图asplit共源；可选AAC残差相关度不作为额外阻断，不冒已跑。
- F5：主观听感/全片连续视听、用户与平台接受仍未代签，按用户持续委派由root裁决技术候选，不再推回Jeffrey听英语。静态回执不能新增用户听审等待。
- F6：960×k仅事实观察，未证根因属于具体FFmpeg版本/某滤镜；GLM“播放呈现无声/尾部内容被剪”属未听的推断，本轮不冒已听见或已证明声学现象。

最终媒体身份：audio-clock-fix-v2-media.json、final-asset-identities.json。未改WAV/GPU/视频/字幕，仅修音频；04不返工。独立窄增量于原UTC22:33:48总截止内22:32:36结束，子进程0。
