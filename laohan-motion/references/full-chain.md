# 制作七步全链（细节参考）

真源：`motion/mastery/DH-ROUTE.md` §一A—一C + §一B表格、`motion/mastery/PRODUCTION-METHOD-V4.md`、`motion/mastery/PIPELINE.md`。本文是执行浓缩，冲突时以真源为准。

## 第1步 文案定稿

- 输入：script-pool候选或episode候选，经Jeffrey接受/锁定。
- 产出：冻结显示稿（正文仅口播，不夹导演提示）+ 发音稿（由`motion/mastery/pronunciations.json`替换标识符读音得到，全文必须匹配；残留未映射`laohan-*`在合成对齐前及计划入口报红）。
- 模型辅助写作不冒充已验收；稿件改动使下游决策/事实/评分绑定失效，按实际输入重做。

## 第2步 最终配音（v3-05）

- 已训练v3-05音色结合风格参考合成整稿，下载WAV；**Jeffrey整轨听感通过后**绑定路径/SHA/采样数与接受记录。
- 执行位置：pro6000-a服务器GPU合成，Mac保存和试听。
- 每期必有新WAV；用户明确授权先出候选时记本次授权及听审PENDING，不能登记为最终已验收。
- 产品默认声音引擎实测淘汰（AI感），产品音轨仅作对齐参考永不入成片。

## 第3步 基础形象

- 已有合格形象素材直接复用（如老韩形象-0923），无需产品订单；不把产品原TTS当最终声音。
- 确需新素材：`motion/tools/dh-generate-clean.mjs`（关标题/字幕/卡片/弹字/BGM；报价PUT→确认POST四字段→轮询→下载核验；幂等四步：opId先落盘→报价落盘核对→确认→异常同opId恢复查询，未知/运行中禁新建）。旧`dh-generate.mjs`已退役。
- 凭证A路：Jeffrey真账号lease，取凭证须在真 a.hanzhenhua.com 标签执行；凭据零入档。

## 第4步 同声口型（WAV驱动）

- 工具：`motion/tools/same-voice-local.py`（Mac分块）+ `motion/tools/run-same-voice-remote.py`（pro6000新隔离目录逐块推理）；参数与清单字段见`motion/tools/README-same-voice.md`及`--help`。
- 流程：Mac从本期原WAV与真实形象生成分块 → pro6000推理 → 回传分块+源范围+上下文+SHA留档。
- 默认preflight；显式run才调GPU；恢复需显式resume并核已有输出；不重用旧稿固定采样数。
- 输入与清单SHA不符、核心帧不连续、时钟不一致均停止。

## 第5步 画面拼接与原声保留

- Mac本地FFmpeg：下载分块→按清单裁掉上下文重叠、保留核心帧→按全局源时间拼成完整人物画面。
- 完整WAV继续作为最终主声；分块AAC弃用、不拼作最终音轨；不默认再导出换声中间片。
- 历史实测数据（15分块/162.68s/25fps人物）不是后续稿件固定配方。

## 第6步 导演与模板（核心，Mac本地）

### 6a 声学对齐（写参数前）
```sh
python3 motion/tools/align-source.py --audio 实际候选声音.wav --spoken-script 发音稿.txt --out 全新词源目录
```
- 本机已验stable-ts 2.19.1环境（Whisper large-v3）；回执绑定声音、未经改写的声学记录、发音稿和生产工具快照。
- `--phrases`给保留全文的语义短语、`--windows`给有真实来源的局部搜索区间；每个最终边界由实际音频注意力DTW产生，短语内没有逐字时钟，不冒称逐字扫色。
- 零时长或未对齐内容报红，不能改JSON或补时；`speed=1`且声音SHA必须与正式记录一致；物理变速另存来源不在此二次换速。

### 6b 导演与登记（--stage direct）
- 写参数前完成本期`director.md`（V4第2条：受众/表达目标、锁定整稿与发音稿、最终声音/真实时轴、人物及可用素材、反馈/画幅/事实边界、模板版本/分支与可回看动态参考；准确路径+来源回执或SHA索引）。
- 同一`production.json`提供`director`、`template_contract`、`director_assets`（可用素材名→路径，可空）及`script/asr/source_record/pronunciations/visual_reference/helper/template/workflow`；正式片另有`template_selection`（全库选型，direct缺失即拒绝）。
- `--stage direct`封存编排和输入摘要至`.production-receipts/<记录名>/`新revision；锁是每条记录进程锁，并发BUSY。

### 6c plan（官方命令经入口）
```sh
python3 motion/tools/production-guard.py --record 本期/production.json --stage plan -- \
  node 已核helper.mjs run 实际.motion 原包plan其余参数
```
- 正式plan必须引用direct登记的当前revision；缺失/编排输入变化/旧revision冒用均拒绝。
- plan成功且输入稳定后入口签成功回执（官方plan初始字节快照；poster-kit的host-plan顶层`reviewed`由false改true是唯一允许语义差异）。
- MK审阅=plan/review.json与project/preview.json既有reviewed键；先读完整报告和实际预览再设置，不创建旁路审核文件。

### 6d pilot（首次动态样段）
```sh
python3 motion/tools/production-guard.py --record 本期/pilot.production.json --stage pilot -- node ... render ...
```
- 独立`kind=pilot`记录：提供`director_parent`（本期正式编排回执path/SHA）+`source_excerpt`（真实完整声音的逐样本片段：原文件路径/SHA、start_sample/end_sample，入口实际核PCM）。
- 复用父编排正文、核同模板/分支与原始声音；样段另做真实声学对齐/字幕/正式plan/preview；输出仅允许本期`qa/`或原包`instance/qa/`，不能称整片交付。
- 样段按实际短片时钟编排；不能给全长时间轴加范围后假定字段自动换轴。

### 6e review-brief（完整效果复核任务）
```sh
python3 motion/tools/production-guard.py --record 本期/production.json --stage review-brief \
  --sample 本期/qa/样段A.mp4 --sample 本期/qa/样段B.mp4
```
- 样段选择原则（V4）：由整片尚未证明的关键表达风险选择，保留用户已认可部分，优先验证最弱或能力未证实处；样段准入=可实际解码的mp4/mov/webm。
- 入口原样带入用户要求、封存导演、完整稿/参数与样段身份，生成只追加brief+request，`pilot_review_request`写回生产记录；最新请求在`review-current.json`，补样后旧记录/旧批准不放行。
- 将brief连同可实际访问的视频交异模型（按全局优先级，同家族拒绝）；补充真实时点/观看尺度允许，不能把质量目标预先改非阻塞。
- pilot_review须覆盖请求中全部样段；schema见gates参考。

### 6f render
```sh
python3 motion/tools/production-guard.py --record 本期/production.json --stage render -- node ... render ...
```
- 核对来源回执/编排revision/plan成功回执/pilot_review请求与样段字节；新素材/声音/契约/编排变化先新revision再plan；新plan用新官方输出路径，旧输出/失败保留。

### 6g delivery
```sh
python3 motion/tools/production-guard.py --record 本期/production.json --stage delivery
```
- 绑定`final_review`（含whole_film_review并绑定当前video）；继续执行声源、动态样段、异模型与最终视频检查。

## 第7步 混音与交付

- 最终混音消费原WAV、合法BGM和SFX；配乐须许可与来源明确（内置配乐/已认可曲目复用/本包官方选曲流程`music-prepare`按需）；返修已认可视频保留已认可配乐除非本次要求更换。
- plan前+交付前各跑一次`check-delivery.py`（交付前带`--video`），见gates参考。
- 完整解码/帧数、首末词、原声与最终混音、字幕和人物时钟、实际字体/动效/配乐分别核查；连续播放/人耳能力如实记录。
- Jeffrey实际听看接受→登记工程`deliveries/accepted-final.json`；发布预填=真实Chrome预填+页面回读。
- 用户否决即在STATUS.md登记，原件保留为失败证据。

## 已验素材复用规则

- 已验WAV→同WAV驱动口型→分段裁核心帧合并：方法保持不变；已有同SHA素材重做视觉时复用配音和口型，不重跑服务器。
- 诊断图放工程外（实例被预览哈希绑定，不能往内加图）。
- 已验工程同版本按需复用；缓存必须匹配所选包/版本/分支；新包先doctor核现有匹配缓存，需要setup用全新路径（setup拒绝覆盖已存在缓存≠doctor失败）。

## 常见失败处置

- **guard拒绝（BUSY/revision过期/绑定缺失）**：按报错补对应环节，不改JSON补时、不倒填历史。
- **Node长JSON输出截断**：给该次Motion命令及子进程显式继承`NODE_OPTIONS="--require <绝对路径>/motion/assets/runtimes/node-stdio-overlay/blocking-stdio.cjs"`；只在本次命令环境设置，不全局注入。
- **视觉工具失败**：负责人核替代观看/异模型通道；已知额度耗尽不盲试；仍无法实际观看→登记UNVERIFIED并停受影响定稿/整片渲染，继续不依赖它的工作；不以静帧或特批冒称动态通过。
- **工具拒绝多字幕槽**：若原包公开合同能唯一确定消费关系，保留原输入沿官方校验并核真实消费槽，记录工具未核范围；不能确定先补核受影响输入，不删槽/换分支求绿。
