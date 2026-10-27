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
# 服务器上：长音频切段（每段 3-15s）+ 准备 data.list（wav路径|转录文本|spk）
# 转录文本可用 SenseVoice/Paraformer 对每段自动转写生成
# 数据落 data/{train,dev}/（9:1 分），list 文件 data/train.data.list、dev.data.list
```

### 5. 特征提取 + 微调训练（服务器）

```bash
# 特征提取（已有脚本 extract_features.sh：campplus embedding + speech_token）
bash /root/autodl-tmp/cosyvoice-train/extract_features.sh
# 微调训练：CosyVoice3 官方 libritts 配方（底座 Fun-CosyVoice3-0.5B-2512）
cd /root/autodl-tmp/cosyvoice-train/CosyVoice/examples/libritts/cosyvoice3 && bash run.sh --stage 1 --stop-stage 4
# 产出：model-<博主>-<版本>/CosyVoice-BlankEN/model.safetensors
```

首跑时核实 run.sh 实际 stage 边界与 Jeffrey 训练参数（v3.05 的实际命令历史），回填此处。

### 6. 模型回迁 + 登记 + 验收

- checkpoint 拷回本地项目 assets/voice-models/<博主>/（Jeffrey 惯例：服务器训完放本地）
- 登记表（项目内维护）：博主/建模日期/素材/模型路径/验收状态
- 验收三条：①固定测试句（英文+中文各一）与原声主观相似度 ≥8/10（Jeffrey 听审）②F0 基频域 ±20Hz ③连续 10 次生成无破音/吞字/漂移

## 红线

- 只训练**已决策复刻**的博主（复刻合规决策先行：起号期灰色可接受、商业化前换纯生成）
- 服务器操作限训练目录 `/root/autodl-tmp/cosyvoice-train/`，不碰生产 7 进程与 `/data/laohan/laohan-node`
- GPU 训练费用按既有授权，不新增付费点；AutoDL 关机后生产进程不自启（勿随意重启算力机）
