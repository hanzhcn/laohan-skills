---
name: laohan-yinse
description: 复刻博主声音模型工作流（硬性前置，唯一方法=服务器微调训练）。任何要复刻博主做数字人视频的，生成视频前必须先在 pro6000 算力机用 CosyVoice3 微调训练该博主的声音模型（8-10 分钟素材），训完拷回本地使用。覆盖：多条视频声音提取→质检→拼接训练素材→pro6000-a 服务器特征提取+微调训练→模型回迁注册→验收。Use when 复刻博主、克隆音色、声音模型、voice clone、训练音色、数字人声音、给博主教声音、声音微调。
---

# laohan-yinse — 复刻博主声音模型（服务器微调）

## 使命与合同

**每个复刻博主一个专属声音模型，唯一方法 = pro6000 算力机 CosyVoice3 微调训练**（Jeffrey 2026-10-27 钉死：不走零样本）。声音模型是博主复刻的核心资产：数字人=形象克隆+口型驱动，声音来自 TTS——没有本人音色模型，出来的是"通用音色配这张脸"，瞬间违和。

硬性流程：形象处理/视频生成之前，先完成声音模型训练与登记。一次建立、所有视频复用。

## 素材标准

| 项 | 要求 |
|---|---|
| 总量 | ≥8-10 分钟纯人声（多条原视频） |
| 质量 | 单人清晰口播、领夹麦/近场；无明显 BGM/混响（BGM 混入训练=音色污染） |
| 格式 | WAV 44.1kHz 单声道（提取时归一） |
| 同源 | 与形象素材同一博主 |

## 工作流（六步）

### 1. 提取（本机 ffmpeg，逐条）

```bash
ffmpeg -y -i <视频>.mp4 -vn -ac 1 -ar 44100 <博主>-<条目名>.wav
```

### 2. 质检

每条转录抽听（SenseVoice/whisper）确认纯人声；BGM 重/混响/多人的条目剔除。

### 3. 拼接训练主素材

```bash
for f in <博主>-*.wav; do echo "file '$f'"; done > concat.txt
ffmpeg -y -f concat -safe 0 -i concat.txt -c copy <博主>-full-<总秒数>s.wav
```

### 4. 上传服务器并准备数据（pro6000-a）

训练机：`ssh pro6000-a`（AutoDL RTX PRO 6000 Blackwell 96G，seetacloud 西部；生产算力机，跑 7 进程服务）。训练工作目录：`/root/autodl-tmp/cosyvoice-train/`（Jeffrey 先例 model-jeffrey-v3-05 在此）。

```bash
scp <博主>-full-*.wav pro6000-a:/root/autodl-tmp/cosyvoice-train/data/wav/
```

服务器上数据准备（判例实见）：切段 wav 放 `data/wav/`，命名 `<人名>_<来源>_<段号>_s<秒点>.wav`（Jeffrey 判例：`jeffrey_9878_b0_s31730.wav`，段长 3-15s）；每段配转录文本（SenseVoice/Paraformer 自动转写+人工抽校）。**data.list 不手写**——run.sh 的 prepare 阶段从切段 wav+文本生成 parquet 清单（`run.sh:69-70` 实见：`cat data/{...}/parquet/data.list > data/train.data.list`）。

### 5. 特征提取 + 微调训练（服务器）

```bash
# 特征提取（已有脚本：campplus embedding + speech_token，CPU 即可）
bash /root/autodl-tmp/cosyvoice-train/extract_features.sh
# 微调训练：CosyVoice3 官方 libritts 配方（底座 Fun-CosyVoice3-0.5B-2512）
cd /root/autodl-tmp/cosyvoice-train/CosyVoice/examples/libritts/cosyvoice3
bash run.sh --stage 1 --stop-stage 4   # UNVERIFIED：stage 边界与 Jeffrey v3.05 实际训练参数首跑核实回填
# 产出：model-<博主>-<版本>/CosyVoice-BlankEN/model.safetensors
```

### 完成证据（训练环节怎么算完成）

① data/{train,dev}/parquet 生成且 extract_features.sh 打印 EXTRACT_DONE；② `model-<博主>-<版本>/CosyVoice-BlankEN/model.safetensors` 文件产出并拷回本地；③ 验收三条（见第 6 步）全过并登记。任一不满足=未完成，不进形象/渲染阶段。

### 6. 模型回迁 + 登记 + 验收

- checkpoint 拷回本地项目 assets/voice-models/<博主>/（Jeffrey 惯例：服务器训完放本地）
- 登记表（项目内维护）：博主/建模日期/素材/模型路径/验收状态
- 验收三条：①固定测试句（英文+中文各一）与原声主观相似度 ≥8/10（Jeffrey 听审）②F0 基频域 ±20Hz ③连续 10 次生成无破音/吞字/漂移

## 反触发（不用本 skill 的场景）

- 只需临时试听/应急验证音色（走产品零样本）——已被 Jeffrey 禁止用于交付，不从这里走
- 真人实拍项目的音频处理（不涉及博主复刻）
- 训练服务器不可达且无替代 GPU——报告阻塞，不降级零样本冒充完成

## 失败路径

- 素材质检不过（BGM/混响）→ 换条或降噪后复检，不强行训练
- 训练中断 → run.sh 分 stage 重跑已完成跳过；产物缺失如实报未完成
- 验收相似度 <8/10 → 排查素材纯度/切段质量后重训，不降标准登记

## 红线

- 只训练**已决策复刻**的博主（复刻合规决策先行：起号期灰色可接受、商业化前换纯生成）
- 服务器操作限训练目录 `/root/autodl-tmp/cosyvoice-train/`，不碰生产 7 进程与 `/data/laohan/laohan-node`
- GPU 训练费用按既有授权，不新增付费点；AutoDL 关机后生产进程不自启（勿随意重启算力机）
