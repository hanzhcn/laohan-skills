# 厨房妈妈交接时发现的声音skill定点修正

日期：2026-10-28。主项目为 `/Users/hanzhmacbookair/Documents/laowai/1chengzhang`，原窗口 `246384da-5302-4e14-8f0d-26bc131fa0c9`，接收方Codex `920ba3db-3204-4dcb-8d02-698fee4456e6`。

## 范围与依据

本轮按Jeffrey“自研skill遇到已证实问题即改”的既有要求做SURGICAL_FIX，只修改 `laohan-yinse/SKILL.md`。实现家族GPT；独立首审家族DeepSeek。基线commit `bb366d5a5abcb448c327815e33208457b6ea9577`，最终文件SHA256 `a6c8e2fb8eb8b51904d5c1f08adb96f8450aee0936a3c88e75ba8f74fc11ffed`。

真源为本机 `Documents/声音资产/Jeffrey/训练方法论.md` §3.2（按来源去重分组、再切段、同组不跨split）/ §6（同条件A/B与Jeffrey盲听，F0仅辅助），及 `数字人专属音色融合方法.md` Step3整轨听审。

## 已修及检查边界

- 清除第6步仍将F0±20Hz作为验收硬门的残留，统一引用A/B、Jeffrey盲听，保留稳定性检查与样音记录。
- 主素材拼接仅供试听/归档；训练按去重后的原视频分别切段。源ID/组ID保留在utt_id，`source-map.tsv`记录源WAV/SHA、源内区间、分组与split，核train/dev组ID无交集。
- 数据步骤明确逐段对听校正后才写text，裸ASR或抽校不能代替。
- 删除“英文7–8词/秒”的无依据整稿验收，改为逐段完整性、实测时长/采样数、整轨听审和SHA绑定。
- 旧“六步”标题改为实际七步，验收/失败/完成入口引用同一口径。

修改前3项定点静态反例均FAIL，修改后7项静态检查PASS，`git diff --check`通过。它们证明文本冲突和缺口已修，不证明执行者实际按组切分、音质、稳定性、听感或新片效果。未运行训练、合成、生产GPU、安装或视频交付；既有agents软链接指向本仓源文件，源文本修改已可见，不冒称进行了运行时效果验收。

## 跨模型首审与裁决

本轮实时调用已安装Magpie插件的 `liveModels`，上游 `/v3/config` 明确给 `workbuddy-ai/deepseek-v4.1-flash` 标记 `free=true, rate=0`；相邻SG型号为付费，未使用。固定入口为本机 `/v1/chat/completions`，没有auto或收费回退，reasoning_effort=max。

- 首审：HTTP200，实际response_model=`deepseek-v4.1-flash`，finish_reason=`stop`，非空完整JSON，66.127秒。候选SHA为 `78aa17e7d92d08dfadbf31f6639230076886d634e639500cbc6d5630890e6bf4`，结论CHANGES_REQUIRED。
- 唯一finding `SRC-GROUP-01`：第3步虽保来源，第4步仍切full.wav且段名无源ID，分组无法追溯。**接受并修复**，现第4步明确逐源切段、去重合组、源映射与split组ID交集检查。拼接示例只供试听归档，不被用于训练数据。
- 修复后增量：沿首次开始时预注册的180秒总截止，剩余14.075秒发起增量请求，至08:52:24Z超时。只取得TimeoutError，未取得完整有效正文/终态，**不能登记增量APPROVE**。本机已中止请求，不推断上游是否继续计算，不自动重试或切付费。

完整去凭据回执：[证据目录](laowai-voice-fix-20261028/)。仅保存模型最终答复、HTTP/终态/输入hash与usage，不保存凭据、思维链或上游完整payload。

## 接续

源码修正和首审finding裁决已完成，**最终候选增量复核仍PENDING**。下次实际制作厨房妈妈前，先按新任务预算复核上述最终SHA的来源分组修正，然后执行逐源数据准备；不能拿本轮静态PASS当声音或模型接受。主项目进度仍以其STATUS P1为准。

本仓按AGENTS指定main精确提交/push；最终commit及远端事实用 `git log -1` / `git status` 回读，不填不存在的自引用commit。生产渲染、发布和用户接受均未执行。
