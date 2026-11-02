# 独立对抗复核（范围限定：本轮ASR解释器路径事实 + 官方cache argv事实）

执行方式声明：只读裁决，不改规则、不执行任何命令；不重开封面单像素窄语义（已另有双模对抗，本轮不扩）。以下所有"实测/exit0/红字"均指实现者侧留证，本复核**零独立执行**，采信与存疑分开标注。

## 一、ADVERSARIAL_ATTEMPTS

### A组 解释器路径修正

**A1 绝对路径移植性反例**：把`$HOME/...`换成`/Users/hanzhmacbookair/...`，换用户账号/迁机后文档即死，比原写法更脆。
- 判定：**不推翻**。项目根本就固定为该绝对路径（SKILL既定约定），非本轮新增回归；跨机已显式声明UNVERIFIED；且文档保留"执行前先核解释器可运行且能导入，缺环境停止"预检门，路径腐化会在预检被截获，不产生静默错误。

**A2 realpath悬空反例**：新解释器realpath解析到`miniconda3/bin/python3.13`，即venv悬于conda安装之上，conda侧变动会静默断链；且与"旧审查误写Miniforge已更正"表面张力（realpath恰是conda系）。
- 判定：**不推翻，登记风险**。Miniforge误写是prompt层面对旧diff路径的错误命名，与本realpath（miniconda3，另一发行版）属不同层面，erratum自洽；文档未固化realpath或torch/stable_whisper版本号，断链由预检门兜底。此项不必写入文档。

**A3 import≠端到端反例**：仅证import不证align-source.py可真跑；且"旧缓存解释器已失效"只有断言。
- 材料支持：新侧有`align-r8.log`+`source-r8/source.json`实际运行工件（实现者侧）。**未实跑**：本复核未验证任一侧。
- 判定：**不推翻**。即使旧env实际仍存活，指向已验证env亦无害；文档正确性不依赖旧路径死亡的直接工件。该工件缺失是全部证据链中权重最低一项，仅留痕。

**A4 "仅token_step100→400"反例**：delta文件若以旧版官方脚本为基准，"仅一行diff"可能掩盖基准漂移；且delta内容本轮未出示。
- 判定：**不推翻文档**。该事实**未写入任何文档改动**（三份现行全文均无token_step字样），producer身份由回执的工具快照SHA机制绑定；docs只保留"真实large-v3+注意力DTW+不冒称逐字"的既有真表述，未随修正扩入producer细节——这是正确的范围克制。

**A5 残留清扫核对**：所供三份现行全文中已无`Library/Caches`旧路径，三处镜像（PIPELINE正文两行+引言、SKILL ①命令、full-chain 6a）逐字一致，与`old_path_clear_in_three_changed_active_entries`相符。**开放项**：本复核无法grep全仓，V4/DH-ROUTE/README等其它文件是否仍含旧路径未见证据；不属本轮三文件改动范围，留痕不阻塞。

### B组 cache argv修正

**B1 顺序反例**：若真实语法是operation后选项（`... setup --cache X`），则"放在operation之前"指导反向。
- 材料支持：实现者实测setup之后argparse拒绝、公共区且setup之前成功、preview/render同基名成功，红/绿留于本期工程。**本复核未实跑**。
- 判定：不推翻；且该句限定在"复用本机T01/T04时"，前导另有"实际命令参数以所选包公开契约为准"总则。

**B2 "preview成功可能只是忽略flag"反例**：公共位`--cache`若被preview静默容忍，成功不证语法，只证恢复流程有效。
- 判定：**不推翻**。setup位（flag必有效）exit0独立支撑放置规则；preview/render成功支撑恢复流程本身。但注意"`--cache <基名>`是run公共参数"这一定性是观察归纳，"等operation"外推到doctor/prepare未经实测——文档有总则兜底，留痕。

**B3 guard argv一致性反例**：共同入口若拒绝公共位额外flag，则文档化的放置会在guarded render被拒。
- 材料支持："4样段**共同**render exit0"——即经共同入口成功，直接覆盖此反例。✓

**B4 doctor误诊反例**：T02 preview失败若另有原因（非缓存），教训与恢复流程是否误导。
- 判定：**不推翻**。"dependencies-verified不代替实际preview成功"是单向加严（保守方向错误无害）；恢复流程保留原失败、不覆盖旧缓存、全新基名，与既有"setup拒绝覆盖已存在缓存≠doctor失败"bullet语义一致，即使误诊操作面仍安全。

**B5 `-kit`后缀普适性反例**：poster-kit独立缓存/其它包可能无此后缀。
- 判定：**不推翻**。该句位于MK/T01/T04复用段内，未升为通用律；T06"另用独立缓存"条目仍在。措辞"实际依赖缓存会附该后缀"作为本包实测观察成立。

## 二、扩大授权/放宽门/真源冲突核查

- **ASR来源**：引擎纪律逐字保留（预检、缺环境停止、不静默换引擎或安装）；large-v3/DTW/"不冒称逐字扫色"表述零改动；无任何引擎降级入档。
- **动态审核/交付门**：diff零接触review-brief、pilot_review/final_review schema、argv一致性表、check-delivery；full-chain只指回PIPELINE不复制新语义（单一真源纪律✓）。
- **授权面**：全新基名恢复用的是官方setup，本就是不经guard的官方命令域，且条件有界（preview明确报依赖缓存不匹配）；未触碰下载授权、凭证、helper字节。
- **历史纪律**：旧review原样保留+erratum另记、原失败与日志保留、不覆盖旧缓存——与"回执只追加、不改写历史"一致。SKILL 1.1.5→1.1.6与内容变更对应。

## 三、材料支持 vs 未实跑（明确分列）

**材料支持（实现者工件，本复核采信未复跑）**：新解释器import及版本、r8实际对齐log与source.json、producer SHA复算与delta文件存在、T02 doctor/preview不一致、新基名setup exit0+全部预览+4样段共同render exit0、argparse顺序红。

**未实跑/开放**：本复核零执行；跨机（已声明UNVERIFIED✓）；全包实跑（明确未claim✓）；旧路径死亡直接工件缺失；全仓其它文件旧路径残留未证；`--cache`在doctor/prepare位有效性；`--cache`相对project路径的精确位置（工作argv记于本期工程，文档表述较宽）。

## 四、遗留观察（不阻塞，供下轮留痕）

1. 旧解释器"已失效"建议未来补一个直接失败工件，闭合证据不对称。
2. "等operation"与"run公共参数"定性宜持续绑定到实跑过的操作集合，新包版本变更时按公开契约复核。
3. venv→miniconda3依赖链建议在环境巡检项中留意（预检门已兜底）。

## 结论

两组修正均有实现者侧实跑工件支撑、范围克制（producer细节与cache教训均未越界写入通用规则）、方向保守（只加严不加宽）、三镜像与真源逐字一致、无门放宽与授权扩大；所有反例或被材料直接覆盖，或落入文档既有预检/契约总则兜底，无一推翻修正。

**APPROVE_DOC_SCOPE**
