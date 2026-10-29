# laohan-laowai画质/居中与EP02经验定点修订

root唯一writer，main；基线0c4bb9405dede960a68662cc99503d1f820bf74e，Jeffrey明确要求两个问题写入规则和skills、补齐提速经验并盘点素材；没有当前EP02返工或再次发送授权。

变更：新增`quality-and-centering.md`，成长系列优先最高保真，严格要求留无损后期母版并核像素/时钟；兼容CRF14/slow发布衍生不得冒签无损。四轨以W/2排版、同时核墨迹/光学偏差，避UI先拆短，不默认左移。更新实际ASS样例的四轨x=360及52/29/72/34字号、左右对称Margin；替换CRF20/fast样例，历史CRF17明确退役。增加开工前素材/磁盘/解释器、短样冻结、GPU期字幕与Gemini并行、已授权客户端后备、远端assemble只回成品和阶段计时。顺手纠正本仓CLAUDE对已迁走治理脚本的相对路径/旧版本指针，无治理授权语义变更。

真实验证在成长项目`docs/handoff/EP02_LESSONS_20261030/`：第一份FFV1+AAC样例像素相同但MKV导致视频起点+43ms，保留FAILED_CLOCK_NOT_PIXELS；随后当前8-bit CRF0/MP4母版150帧与滤镜前参考逐帧像素hash/PTS均相同，A/V均0起，兼容衍生音频payload相同且像素hash显示有损。六条真实字形中轴偏差≤0.5px、字形界限与间距通过；旧x320/仅英文错位/光学偏移/居中超宽及低质量参数等定点情境已验。小样不是新EP02候选，也不代签下一期素材、手机/平台播放、上游整链无损或Jeffrey接受。

业务库存13条/1333.55秒，已用2、未用11；约90秒/720p优先/常驻双语标题与新素材门下，已验就绪0，蓝衣待筛0–1，不用总秒数算期数。旧EP02视频/ASS/WAV SHA未变。

GLM-5.3 max/128000/1800，实际336.2秒VALIDATED/end_turn/CLI成功，候选87744c72与内容45139b08，17项逻辑对抗/一致性核验PASS，未独立看图/听音。F1唯一LOW：旧“只回传116MB”已按其一句式建议改为必要成品、历史大小/耗时实测；未改方法/参数/模板，不另重跑GPU/媒体或长审。原结果、metadata、输入文件SHA与root逐项裁决保存在成长项目同名handoff。

redlight扫描器回归与local扫描、diff检查通过；agents/claude软链五文件同源，当前Codex技能目录实际列出agents入口，不存在额外.codex目录不冒缺功能；未另安装技能/自动触发验收。laohanvideo两个runtime文件均无laohan-laowai条目，不更新无关锁。提交/push与精确临时回收终态见成长项目`docs/handoff/EP02_LESSONS_20261030/closeout.json`，不是实际新片/手机/平台接受。
