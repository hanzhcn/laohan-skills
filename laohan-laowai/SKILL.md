---
name: laohan-laowai
description: 老外博主复刻→数字人→抖音视频全流程总控（含调用 laohan-yinse）。从"选一个外国博主"到"数字人视频发布"的端到端自动化流程：博主选型与资料包下载→声音模型（服务器微调，硬性前置，调 laohan-yinse）→形象素材处理（字幕检测/裁剪/硬门槛）→laohanagent API 全自动注册与渲染（零网页）→双语字幕后期→发布与流量复盘。Use when 复刻老外博主、数字人账号、老外数字人、复刻博主做视频、老外IP起号、数字人全流程、新博主资料包、数字人怎么生成。
---

# laohan-laowai — 老外博主复刻数字人全流程

## 使命与合同

**用老外的脸+外国独特教育/文化内容，做中国家长/观众共鸣的数字人爆款**。本 skill 是总控：七阶段端到端，全自动（API 直调，不上网页）。首个实战案例：`~/Documents/laowai/1chengzhang`（海思博士账号，Deborah 形象）——细节合同以该项目 docs/ 为准。

## 七阶段流程

### ① 博主选型与资料包

- 选型标准：教育者可信度 > 第一视角口播形态（talking head，非 vlog/skit/旁白）> 数据 > 类型差异
- 下载 5-8 条视频（laohan-xiazai：TikTok 用 yt-dlp 直下）+ info.json 元数据
- **口播形态逐帧验证**（抽帧+视觉模型确认正脸对镜头说话；抽帧落在无字幕间隙≠干净，必须多点验证）
- 合规决策先行：形象克隆+虚构新身份（绝不冒用真人姓名/履历）；起号期灰色可接受、商业化前换纯生成

### ② 声音模型（硬性前置，唯一方法=服务器微调）

**调用 skill `laohan-yinse`**：8-10 分钟素材 → pro6000-a 服务器 CosyVoice3 微调 → 模型回迁。视频生成前必须完成，否则声音违和。

### ③ 形象素材处理

- 硬门槛（laohanagent 官方）：竖版（高>宽）/短边≥720p/时长≥8s（推荐 30-60s，越长越好）/≤30fps/MP4/<200MB
- **字幕必须去除**（会被引擎复制进成片）：博主视频普遍带字幕 → 底部 crop 或换无字幕条；多点抽帧验证（首/中/尾/多段）
- 转码 h264；处理实录与判例参照项目 docs/dh-production-guide.md

### ④ API 资产注册（全自动，零网页）

```
POST /v1/dh/avatar-assets  ← 形象视频（处理后的母版）
POST /v1/dh/voice-assets   ← 音色（微调模型）
认证：Bearer <lease 令牌>
```

### ⑤ API 渲染（TTS→音频→驱动口型→成片）

```
文案（英文口播稿）→ stages 构造（buildCreationStages）
→ resolveCloudPlan 报价 → POST /v1/dh/render-jobs → 轮询产物 → 下载 raw
```

现成骨架：`~/Documents/laohanagent/scripts/e2e-lab-dh.mjs`（SCRIPT_FILE 喂文案原生支持）。管线本质：音色模型读文案生成完整音频 → 音频驱动形象循环素材口型（Duix/TBDub）。

### ⑥ 后期

- 字幕：**中文大在上、英文小在下**（同屏成对；目标语言 > 中文观众阅读优先级）
- BGM（低音量钢琴避让人声）+ **AI 生成标识（平台声明必勾）**
- 违规检测过 laohan-weigui；后期管线可接 laohanvideo（Remotion 出片）

### ⑦ 发布与复盘

- 抖音：养号 2-3 天再发；账号装修（人设简介前 3 行钩子）
- 数据：opencli douyin stats/videos 拉取；10 条内决策点（引流款 vs 人设款占比调整）

## 关键红线

1. 声音不走零样本（Jeffrey 钉死，唯一=服务器微调）
2. 全流程 API 自动化，不退回网页手动操作
3. 不冒充真实存在的人（虚构人设身份）
4. pro6000-a 是生产算力机：训练限 cosyvoice-train 目录，不碰生产进程
5. 数字人视频必带 AI 生成声明

## 素材资产清单（每个博主资料包标准结构）

```
assets/
  persona-candidates/  原始视频（形象候选）
  upload/              形象上传母版（无字幕/达标）
  voice-training/      声音素材（逐条 WAV + 拼接主素材）
  voice-models/        微调模型 checkpoint（服务器回迁）
  benchmark/           对标视频库+转录
docs/
  persona-*.md         人设卡     topic-library-*.md  选题库
  scripts-*.md         文案       account-setup.md    装修
```
