---
name: laohan-yinse
description: 复刻博主声音资产工作流：同一博主优先复用已验模型，缺运行目录先恢复，首次缺模型才以CosyVoice3服务器微调首建。保护长期权重、参考音频/文本、配置和登记；用同一模型生成每期新配音。Use when 复刻博主、克隆音色、声音模型、voice clone、训练音色、数字人声音、给博主教声音、声音微调。
---

# laohan-yinse — 复刻博主声音模型（服务器微调）

## 使命与合同

**每个复刻博主一个专属声音模型，唯一方法 = pro6000 算力机 CosyVoice3 微调训练**（Jeffrey 2026-10-27 钉死：不走零样本）。声音模型是博主复刻的核心资产：数字人=形象克隆+口型驱动，声音来自 TTS——没有本人音色模型，出来的是"通用音色配这张脸"，瞬间违和。

硬性前置是**本博主已有训练、登记并验收的专属模型**，不是每期重新训练。同一博主/形象身份固定默认模型版本；换集数、稿件、服装、场景或参考情绪不换模型、不重训。不能跨博主混用，也不能把模型的历史接受当本期新WAV已通过整轨听审。

方法依据：`~/Documents/声音资产/Jeffrey/训练方法论.md` §3/§4/§6—8；整稿声音与口型衔接读 `数字人专属音色融合方法.md` 与 `laohanvideo/motion/mastery/DH-ROUTE.md`。复用数据、训练与听审方法，不复用Jeffrey个人权重、参考池或接受记录；本博主必须有自己的资产绑定。

这些是Jeffrey/Motion项目的方法参考；其v3-05、历史首单、主干接入/发布及提前候选授权不转移到本项目。当前创作者、验收人和制作状态按本项目合同/STATUS；Jeffrey是负责人及听看验收人，不是被选博主。

## 素材标准

| 项 | 要求 |
|---|---|
| 总量 | 目标8–10分钟净有效人声（按清洗后逐段时长统计，不以原视频容器时长代替） |
| 质量 | 单人清晰口播、领夹麦/近场；无明显 BGM/混响（BGM 混入训练=音色污染） |
| 格式 | 训练用24kHz单声道PCM16 WAV；原视频另存，不反复重采样 |
| 同源 | 与形象素材同一博主 |

## 数据铁律（源自训练方法论 v3.1 终版，codex 三轮审查——2026-10-28 三轮查漏补录）

1. **逐段人工校对**：音频与逐字文本 100% 对齐——ASR 原始输出**毒化训练**（Jeffrey 判例："手搓"被转"戳"致克隆失败）。SenseVoice 转录必须逐段过目校对，抽校不够
2. **防泄漏分组切分**：先按录音来源（视频条）去重分组，**同源段只进同一侧 split**（相邻/重叠内容跨 train/dev=cv 虚假乐观）——禁止随机 shuffle 9:1
3. **采样率统一 24000Hz mono**（conf 固定参数；上传前 `ffmpeg -ar 24000 -ac 1`）
4. **读法一致化**：数字/缩写/多音字写实际读法（英文：Dr./don't/年份等统一）
5. **宁缺毋滥**：口误、重复、语气词泛滥段剪掉
6. **训练期生产监控**：与生产 TTS 桥共卡，训练期监控生产延迟/错误率，超标暂停训练
7. 产物自检：特征三件套（utt2embedding.pt/spk2embedding.pt/utt2speech_token.pt）齐全、parquet ID 集合==wav.scp、记录实际进训练样本数与名义对账
8. num_workers=1（小数据防 shard 复制双倍曝光）；checkpoint 合并用官方 average_model（val_best 不稳降 --num）

## 验收（v3.1 口径修正，2026-10-28）

**验收 = A/B 对照 + Jeffrey 盲听**：原版（零样本）与微调版在相同参考/文本/固定采样下对照，查错漏字/重复/自然度/相似度，Jeffrey 盲听终审拍板。**F0 是辅助分布指标，不做窄区间硬门槛**（此前"F0 ±20Hz"口径作废——与真源冲突）。

记录并固定本次可控采样参数和随机种子；匿名化试听文件名、随机播放顺序并另存揭盲映射，听审后再揭盲。固定种子不保证跨版本/硬件逐样本确定；连续稳定性检查须有独立生成样本，不能反复播放同一WAV冒充。

## 工作流（七步，含组装与参考池子步骤）

### 0. 先查登记：复用 / 恢复 / 首建

1. 按稳定博主身份查项目 `assets/voice-models/<博主>/voice-asset.json`（已有其他登记布局则沿真源索引，不另造冲突副本）。登记至少含默认模型ID/版本、权重路径/SHA与格式、底模/配置版本及SHA来源、参考WAV/逐字文本与SHA、风格选择、原验收依据、备份/运行位置和保护清单。日期目录或视频文件名不是模型身份，不按mtime或最高epoch猜默认版。
2. **已有可用模型 → 复用**：每次重新核身份及实际权重、参考音文、必需入口脚本/配置的SHA，与登记的可信版本逐项对照；旧的MATCH只是读取时快照，不是本次授权。缺文件或SHA不符即停在前置核对，不自动替换/重训。核齐后直接第7步合成本期新稿；不跑1–5的训练管线，不重新做“每期一个声音模型”，不自动升级默认模型。原模型验收保留原时间和范围，本期音频继续自己的质检/听审。
3. **已有备份但运行包缺失/迁机 → 恢复**：从已核备份与相同受信底模组装同一版本，记录新位置和SHA映射，实际加载及短句试合成后再做本期整稿。恢复目录/链接/推理格式不等于训练新模型；仅有训练checkpoint时另存推理件，不改原件。缺参考对、配置或备份损坏先找现有可信副本，无法恢复则报告阻塞，禁止自动重训或换基模。
4. **确为新博主且无既有模型 → 首建**：才执行1–6.5；既有模型升级/重训须记录已核缺陷、目标、负责人明确决定和新版本，原默认/回滚版继续保护。未验收候选先续其验收，不把“状态非ACCEPTED”直接当缺模型再训一遍。

本节为执行分流纪律，不冒称 `pipeline/train` 已实现自动模型发现。现有训练脚本只用于首建或明确批准的重训；每期调用前必须先完成本节核对。

### 1. 提取（本机 ffmpeg，逐条）

```bash
ffmpeg -n -i <视频>.mp4 -vn -ac 1 -ar 24000 -c:a pcm_s16le <博主>-<视频ID>-24k.wav
```

### 2. 质检

每条转录抽听（SenseVoice/whisper）确认纯人声；BGM 重/混响/多人的条目剔除。

### 3. 拼接训练主素材

先记录每条源视频的ID、音频路径、SHA和去重分组；训练切段保持来源ID，同源/重叠片段只进同一侧train/dev。下列拼接仅作主素材试听与归档，不能先拼接再丢失来源随机切分；训练按原来源分组切段。

```bash
for f in <博主>-*.wav; do case "$f" in *-full-*) continue;; esac; echo "file '$f'"; done > concat.txt
ffmpeg -y -f concat -safe 0 -i concat.txt -c copy <博主>-full-<总秒数>s.wav
```

### 4. 上传服务器并准备数据（pro6000-a）——2026-10-27 实战验证版

训练机：`ssh pro6000-a`（AutoDL RTX PRO 6000 Blackwell 96G，seetacloud 西部；生产算力机，跑 7 进程服务）。训练工作目录：`/root/autodl-tmp/cosyvoice-train/`（Jeffrey 先例 model-jeffrey-v3-05 在此）。

**切段（本机，按源视频分别处理）**：先按第3步的来源记录去重；重复/重叠来源归同一group_id，再分别对保留的源WAV切段，不能对已拼接full.wav盲切。ffmpeg silencedetect辅助定位静音，结合句边界切成约5–15秒：
```python
# 对每个保留的源WAV分别运行；full.wav只作试听归档
# ffmpeg -i <源视频ID>-24k.wav -af silencedetect=noise=-35dB:d=0.45 -f null -
# 静音中点/句界作候选切点，回听保留完整字头字尾；短段可与同源相邻句合并
# 长段找不到安全句界时回听重切或剔除，不按固定10秒硬切穿过单词
```
段命名 `<人名>_src<视频ID>_g<group_id>_s<起点毫秒>.wav`；`utt_id`保留对应来源/组信息。维护`source-map.tsv`记录源视频ID、源WAV路径/SHA、group_id、utt_id、源内起止时间和split；train/dev按group_id整组划分，生成两侧清单后核对组ID无交集。不能以历史Deborah的78段/483s训练成功代替本期来源与切分核验。

**每段转录（本机）**：SenseVoice 批量；转录后**清洗噪声符号**（🎼😊 等表情要删，否则进训练文本污染），逐段对听并校正逐字文本后才写入训练text；抽校或裸ASR输出不能代替。

**数据目录结构（六件套，缺一训练必挂——三个坑全踩过）**：
```
data-<人名>/{train,dev}/     # 按来源视频分组，9:1为目标比例；同源/重叠段不跨split
  *.wav                     # 切段音频（与文本同目录）
  text            # 每行: <utt_id> <转录文本>
  utt2spk         # 每行: <utt_id> <说话人名>
  spk2utt         # 一行: <说话人名> <所有utt_id空格连>
  wav.scp         # 每行: <utt_id> <wav绝对路径>   ★坑1：缺它 extract_embedding 直接 FileNotFoundError
  instruct        # 每行: <utt_id> You are a helpful assistant.<|endofprompt|>   ★坑2：缺它训练 forward KeyError instruct_token（不是目录是文件）
  parquet/ + *.data.list  # ★不手写：管线 make_parquet_list 自动生成
```
打包上传：`tar czf data-<人名>.tar.gz data-<人名>/ && scp ... pro6000-a:/root/autodl-tmp/cosyvoice-train/`（mac tar 的 xattr 警告无害）。

`wav.scp`必须写**服务器解包后的真实绝对路径**；不能把Mac的`/Users/...`路径原样送入远端。上传后逐项核音频存在、24k/mono/PCM16、ID与source-map一致，并读取完整PCM帧核实声明时长，拒绝只有WAV头的截断文件，再进入特征提取。

### 5. 特征提取 + 微调训练（服务器，2026-10-27 实战验证配方）

**独立脚本模式（不改原 data/、配置与脚本）**：先只读核本机与远端当前版本，再复制 `pipeline.sh`/`train.sh` 为本博主专属文件；`conf/cosyvoice3.yaml`也复制为本任务配置，不直接改共享原件。逐项改并回读：

- pipeline和train两份脚本中的`D`都指向本博主服务器绝对数据目录。
- **pipeline中的train脚本调用**必须改到`train-<人名>.sh`；只改D/输出目录会继续调用旧`train.sh`、训练旧数据。
- train的`--config`、`--model_dir`、`--tensorboard_dir`、`--rdzv_id`和端口均绑定本任务；端口实际确认空闲，不把1235写死为永远可用。
- 每次训练尝试的权重和TensorBoard日志须可区分：日志使用独立运行目录并记入启动收据，或已有目录即STOP。不能只移走exp后复用旧tb目录；失败日志与权重一起留存，恢复另核训练器实际语义。
- 新副本保留`set -e`并启用`set -o pipefail`；旧脚本只有`set -e`时，`python ... | tail -1`会吞掉前级失败，不能照抄。每阶段另核特征三件套、parquet/ID与实际返回码，不能只看PIPELINE_DONE。
- 沿真实工具链验证路径与失败传播：Kaldi第二列可含空格，不能用无上限`split()`截断路径；parquet异步worker的失败须被主进程收取，或使用本任务同步写入器。启用`set -u`时先初始化可选`PYTHONPATH`再source配方，避免环境未设置时直接退出。第三方缺陷用任务专属副本修，不覆盖共享原件。
- `--config`显式指向已复制的`conf/cosyvoice3-<人名>.yaml`；回读实际学习率、epoch上限、scheduler、`padding.use_spk_embedding`与worker数，记录采用哪版基线及理由。不把共享配置、历史1e-5起点或耗时当新博主默认；用未见文本查泛化，发散/退化即停。

**开训前置（不启动GPU推理）**：按训练方法§4/§5核底模`--onnx_path`及`speech_tokenizer_v3.batch.onnx`存在，并与可信权重清单核SHA；记录当前venv的torch/torchaudio/deepspeed/onnxruntime版本。该方法锁定ORT 1.20.1的CPU路径：特征提取进程设`CUDA_VISIBLE_DEVICES=""`，检查脚本实际请求CPUExecutionProvider、CPU加载自检通过并回读会话`get_providers()`；仅打印`get_available_providers()`不能证明实际没走CUDA。失败停在准备阶段，不静默下载/安装、改共享源码或环境；首个本任务训练还须实际验证backward→step→保存→重载，不能只凭旧模型可推理登记兼容。

训练/合成均用任务专属启动器建立独立进程组，启动时记录真实PID/PGID、命令行、cwd、数据/配置/输出身份。停止前重新核实归属，无法核实则保留现场报告；只向已核本任务组发信号并确认退出，不按进程名、显存占用或未经核实的`$!`批量回收。

启动器须处理总截止及SIGINT/SIGTERM/SIGHUP并落真实终态；启动收据未写完/不可读/缺必要字段或身份不符时，也须依据父进程已知的自有PID/PGID回收、补记STOP及读取错误，不能用未验对象覆盖已知进程身份、漏写终态或把损坏收据算成功。SIGKILL/断电不可由finally保证回收。核训练器是否另开worker会话：当前torchrun子进程会`start_new_session`，外层组退出不证明worker退出。使用可验证的子组监督，或同组单rank入口，并对所用方式做无GPU进程夹具；真实首训仍须核全部成员与退出，不能将夹具冒作生产证明。

以下是Linux服务器上的人工核验步骤，不是已自动接线的收据系统：启动后先按本任务专属脚本绝对路径核到唯一实际执行者，再填`TASK_PID`和从真实进程读出的`TASK_PGID`，不直接将`$!`当组号。将下列成功查询的输出、时间与任务路径保存到本任务启动收据；停止前重复核对进程启动时间、命令/cwd及全组成员，发现生产/未知成员则不发信号：
```bash
set -e -o pipefail
ps -p "$TASK_PID" -o pid=,ppid=,pgid=,sid=,lstart=,args=
readlink -f "/proc/$TASK_PID/cwd"
ps -eo pid=,ppid=,pgid=,sid=,args= | awk -v task_pgid="$TASK_PGID" '$3 == task_pgid'
```
按已核归属停止后，重新成功查询同组成员为空才记组退出；查询报错或PID/启动时间已变不算退出证明。不记录凭据或含凭据参数；拿不到完整身份就保留现场，不猜进程号回收。

```bash
# 服务器上一键跑（特征提取CPU → parquet → GPU训练，自动串接）
nohup setsid bash /root/autodl-tmp/cosyvoice-train/pipeline-<人名>.sh > <人名>-train.log 2>&1 &
# 日志盯关键行：PIPELINE_DONE → "train start" → "Epoch N Step M" → TRAIN_DONE
```

- 底座：`Fun-CosyVoice3-0.5B-2512`（英文素材走其中 CosyVoice-BlankEN，对路）
- 训练入口：单卡`cosyvoice/bin/train.py --model llm --use_amp`，可用上述受控torchrun或同组单rank入口；读取本任务专属配置，不存在可直接照跑的共享“默认档”
- 历史速度记录：70段/8分钟数据曾为10–30分钟级；后来的60段/555s/14epoch约70分钟。两者条件不同，不能作为新博主固定预算；同一博主复用不重新计算训练耗时。
- GPU与生产TTS共卡，空闲显存不证明互不干扰。训练前记录生产基线，训练中按真源监控延迟/错误率，超阈值只暂停本次训练；不重启或结束生产服务。显存与吞吐只报本轮快照，历史16–20G占用不作保证。

**产物**：`exp/<人名>/llm/epoch_N_whole.pt`（含 epoch/step 元数据键——★坑3：直接 cp 当 llm.pt 用会 `Unexpected key(s): epoch, step` 加载失败，必须剥离）。

### 5.5 模型组装与合成验收（2026-10-27 实战验证）

```bash
# ① 仅首建/恢复时组装；复用分支不运行本块。PM=已核底座权重根
cd /root/autodl-tmp/cosyvoice-train  # 下方exp/与model-相对路径以此为根
PM=/root/autodl-tmp/laohan/weights/cosyvoice3/Fun-CosyVoice3-0.5B-2512
VOICE_CAND=/root/autodl-tmp/cosyvoice-train/model-<人名>-v1
test ! -e "$VOICE_CAND" || exit 1  # 只建新候选，禁止嵌套cp或覆盖已有模型
# 前置已核这些共享依赖的可信SHA；只链接、只读，不复制底模或链接底模llm.pt。
for VOICE_DEP in CosyVoice-BlankEN campplus.onnx cosyvoice3.yaml flow.pt hift.pt speech_tokenizer_v3.onnx speech_tokenizer_v3.batch.onnx; do
  test -e "$PM/$VOICE_DEP" || exit 2
done
mkdir "$VOICE_CAND" || exit 2
for VOICE_DEP in CosyVoice-BlankEN campplus.onnx cosyvoice3.yaml flow.pt hift.pt speech_tokenizer_v3.onnx speech_tokenizer_v3.batch.onnx; do
  ln -s "$PM/$VOICE_DEP" "$VOICE_CAND/$VOICE_DEP" || exit 2
done
# ② 剥离元数据键后存 llm.pt（坑3修复）
/root/autodl-tmp/cosyvoice-train/venv/bin/python -c "import torch; sd=torch.load('exp/<人名>/llm/epoch_N_whole.pt',map_location='cpu',weights_only=True); sd.pop('epoch',None); sd.pop('step',None); torch.save(sd,'model-<人名>-v1/llm.pt')"
# ③ 合成验收：先按下文准备本任务脚本，再用已核解释器和工作目录执行
cd /root/autodl-tmp/cosyvoice-train/CosyVoice
PYTHONPATH="$PWD" setsid /root/autodl-tmp/cosyvoice-train/venv/bin/python /root/autodl-tmp/cosyvoice-train/synth-<人名>.py
```

训练使用真源的checkpoint评估/平均方法；记录实际所选epoch或average_model输入，不机械挑某个历史epoch。上面剥离元数据的示例仅适用于已选择的`epoch_N_whole.pt`；使用官方平均产物时先核其格式，不重复假定元数据存在。

**合成脚本必须先准备和核对，不能假设存在通用`synth.py`。** 2026-10-28远端核实：只有任务专用`synth_deborah.py`/`synth_ep01.py`；前者首chunk后`break`，不能复制其截断逻辑。新脚本按第7步完整收集分块，明确本博主MODEL_DIR、已校对REF_WAV/REF_TEXT、目标文本与独立输出路径；可参考`synth_ep01.py`的拼接方式，但不得直接运行其Deborah硬编码。解释器/文件缺失只阻本步骤，不静默安装环境或换生产入口。

- 合成产物 SYNTH_DONE 后 scp 回本地，按上文“验收”节做同条件A/B并交 Jeffrey 盲听；日志成功不等于接受
- 模型回迁：归档选定专属权重及其格式、必要配置/底模版本、参考池WAV/逐字文本、合成入口和原验收登记；底模复用受信单份，不搬整套环境或全量检查点。仅有一个pt文件不算完整可恢复声音资产。

### 完成证据（训练环节怎么算完成）

① 特征/parquet实际成功、ID/数量核对通过，不能只凭PIPELINE_DONE日志；② 已选微调权重在完整候选model_dir真实加载、试合成，并拷回本地assets/voice-models/<博主>/核SHA；③ 第6步引用的同条件A/B、Jeffrey盲听及稳定性检查通过并登记。任一不满足=模型未完成，不交整稿配音/口型渲染；不阻断只读素材筛查。

### 6. 模型回迁 + 登记 + 验收

- checkpoint 拷回本地项目 assets/voice-models/<博主>/（Jeffrey 惯例：服务器训完放本地）
- 在项目登记 `voice-asset.json`：博主身份/默认模型ID及版本/建模来源/模型路径、格式与SHA/底模与配置/参考池/原验收状态和证据/运行与备份位置/保护清单。已选版与回滚版分开标明，不能把每期新WAV当新模型登记。
- 验收只引用上文“验收”节：同参考/文本/采样设置的原版与微调版A/B，Jeffrey盲听确认相似度、自然度和错漏字；连续10次生成检查无破音/吞字/漂移。F0仅记录辅助分布，不作±20Hz硬门槛；记录实际听审结论与样音，不将机械指标替代接受。

### 6.5 参考池与风格选择（2026-10-28 补录，源自 Jeffrey 声音方法 v2.2）

- 合成不裸用单条参考：从博主切段中挑**多对参考（不同情绪/风格：如坚定教学/温柔安抚/兴奋）**建参考池，合成时选风格参考驱动韵律（Jeffrey 判例：7 对参考池+默认"兴奋"风格）
- 风格选择登记进项目（每个博主的默认风格一次定稳）
- Jeffrey个人的“兴奋B”只属其个人接受记录，不自动成为新博主默认；参考音频与逐字文本也须逐对校准。
- 权重、参考对、配置、必要合成入口和登记共同构成跨期资产。参考WAV即使位于训练 `data/`/`segments/` 内也受保护；清理前应归档并更新实际合成绑定，不得只留权重删参考。当前只有一对已用参考时如实登记，不伪造多风格参考池完成。

### 7. 整稿合成（交付给口型链的最终 WAV——laohan-laowai ⑤ 的输入契约）

**本期文本绑定**：从当前项目STATUS/INDEX找到本期定稿，记录源稿路径/SHA及本期内容/事实/违规审阅状态，再仅导出口播正文为任务专属`spoken.txt`并记SHA；不得把Markdown标题、中文对照表或制作说明一起送TTS。远端任务脚本显式读取本次上传的`spoken.txt`绝对路径，传输后核同SHA；启动前回读本期源稿/口播导出/模型/参考绑定。旧`synth_ep01.py`和`ep01-script.txt`不因同名集数而成为默认输入。

例：成长项目当前保留的是`docs/scripts/ep01-chores.md`，仅其“英文口播”区是待合成正文；其中北京两年/一万家庭等旧身份说法仍须按本期人设与事实审阅确认。保留稿件不等于新博主可直接照念，不在声音步骤擅改履历或自动视为已批准。

```python
# 服务器 CosyVoice 仓内跑（PYTHONPATH=$PWD）；长文分 chunk 返回必须 torch.cat 拼接（★坑：只取首 chunk=截断）
speech = torch.cat([c["tts_speech"] for c in cv.inference_zero_shot(全文案, prompt, REF_WAV, stream=False)], dim=-1)
torchaudio.save(out, speech, cv.sample_rate)
```
下载回Mac后统一转24kHz单声道PCM16（口型链硬要求，此步由本skill交付时完成）：
```bash
ffmpeg -y -i <整稿>.wav -ar 24000 -ac 1 -c:a pcm_s16le <整稿>-24k.wav
```
- `inference_zero_shot`是当前CosyVoice的推理方法名，已训练模型仍通过它消费参考音频；禁止的是跳过本博主微调而用基模冒充交付。基模仅作同条件A/B对照，不因函数名误换路线。
- **长稿分段**：>300 字/词按自然段分次合成再拼（过长语调衰减——Jeffrey 经验值）；逐段收齐所有chunk，任一非空正文段返回零块即失败，不用全篇非空掩盖漏段
- **响度门**：不预设达标——先测 `ffmpeg -af loudnorm=print_format=summary -f null -` 再按合同决定归一
- **听感门是硬门**：完整 WAV 必须 Jeffrey 整轨听审通过后才能进口型推理（禁止跳过听审直接出片）
- 完成证据：整稿逐段核对文案，确认所有分块完整拼接、无缺句/重复/截尾，记录实测时长与采样数；不套用固定英文词/秒作为验收。Jeffrey整轨听审通过并绑定SHA后才交口型链。
- **本地备份核对**：回迁模型登记 SHA；重用时先核对备份 SHA 一致（损坏报告勿用，防备份腐坏）
- **备份≠完整运行目录**：完整恢复还需受信底模、配置、参考WAV/文本、合成入口与登记；迁机重组后实际加载并试合成，不重新训练；**不得覆盖官方底模原件**。本期最终WAV仍须按原有听感/完整性要求另验。
- **GPU 共卡纪律**：合成前核显存>10G；卡>5分钟或生产报错，按第5步启动收据核验并仅停止本任务进程组，确认退出后另定时段；严禁动生产服务，不盲重试

## 反触发（不用本 skill 的场景）

- 仅作同条件A/B的基模基线：允许作为本skill验收的一侧，不是正式声音交付；不因此自动调用产品零样本，不交口型链
- 真人实拍项目的音频处理（不涉及博主复刻）
- 训练服务器不可达且无替代 GPU——报告阻塞，不降级零样本冒充完成

## 失败路径

- 既有模型/参考缺失或SHA不符 → 先恢复可信副本，恢复不了只停本步骤；不得以再次训练、换基模或清除旧登记掩盖丢失。
- 素材质检不过（BGM/混响）→ 换条或降噪后复检，不强行训练
- 训练中断 → 保存本任务退出/数据/配置/特征/权重现场，核专属pipeline/train与训练器实际支持的恢复语义，再登记明确恢复入口；不能假定共享`run.sh`会跳过阶段，不编造续跑参数。无可验证续跑机制则登记新的训练阶段并保留旧产物，不覆盖后冒称续跑成功
- A/B或Jeffrey盲听未通过 → 排查素材纯度、分组、切段/文本及风格参考，按已核原因决定重合成或重训；不凭F0或日志代替接受、不降标准登记

## 红线

- 每个博主一个明确默认声音模型版本，后续出片优先复用；重训/换默认版必须另有明确决定。每期收尾不得删除已选/回滚权重、参考对、配置、合成入口及证据，也不得先删运行副本再验证备份。详细逐项清理顺序遵循项目存储规则与 laohan-laowai 的保护节；无完整依赖核对即保留。
- 只训练**已决策复刻**的博主（复刻合规决策先行：**需 Jeffrey 逐博主明确决策并留证**；商业化前必须切纯生成形象）
- 服务器操作限训练目录 `/root/autodl-tmp/cosyvoice-train/`，不碰生产 7 进程与 `/data/laohan/laohan-node`
- GPU 训练费用按既有授权，不新增付费点；AutoDL 关机后生产进程不自启（勿随意重启算力机）

## 训练执行判例（2026-10-29 kb78769 首跑实测）

- **推理加载前剥 epoch/step 键**：训练存的 checkpoint 含 `epoch`/`step` 元数据键，CosyVoice3 AutoModel strict load 直接拒（Unexpected key(s)）；推理包 llm.pt 必须是剥过的版本（训练原件保留，另存剥离副本绑定 SHA）
- 上述组装仅首次/恢复时需要；同一已选推理权重跨期复用，不随新稿重复训练或另建默认模型。
- **retention wrapper 必须在链上**：`single_worker.py train_with_retention.py train.py`（曾漏接中间层导致检查点堆积）；pt/yaml成对登记，当前 `retained_names` 只保留latest+best2（按验证集损失去重最多三份；本项目dev/CV同义），不因init身份额外永久保留。是否在保留集合中以真实函数和记录为准；受控save路径将init的loss设为None。已选模型/回滚版先独立归档保护，不交训练retention删除最后可恢复副本。
- **60段555s/14epoch 单卡约70分钟**是本次条件下记录，不保证下次耗时；同卡训练互抢会严重拖慢并增加存储压力。开训前核GPU活动及其他工作线，不能据此把参数或70分钟定死；同一博主复用不含重新训练。
- 验证集损失（dev/CV）每epoch记录，本次ep13=3.8033；检查点数量按实际retained_names集合核对，不根据历史目录大小推导永久保留名额或新任务预算。
- 本次曾处理 sample.pkl/file cache，**不是通用清理授权**：仅在任务终结、无恢复/组装消费者且有释放证据时逐项处理；不自动制造内存压力、不清全局缓存、不以清cache绕过RAM门。按项目guard与唯一writer流程核对，详见laohan-laowai保护节。
- 远端非交互 shell 无 python3；launch_voice.py 是唯一受控入口（receipt 进程组绑定，超时 SIGKILL 整组）
- **campplus说话人相似度仅作A/B辅助比较**（底模自带campplus.onnx，fbank80→onnx→余弦；本次8段参考跨5源）。它不证明自然度、错漏字或真实听感，不能代替项目约定的模型验收、本期整轨听审及成片接受；历史具名委派的裁决只按其原范围引用，不自动批准新WAV。
- 转写污染教训：spoken文本导出要精确锚定“英文口播”标题后的引用块，避免文档说明混入TTS。本次ASR回转识别到了此类污染，不保证覆盖所有污染；仍须按当前授权逐段核对音文并完成本期验收。
