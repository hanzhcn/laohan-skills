---
name: laohan-luping
description: 录屏视频转口播稿的完整工作流。输入一段电脑录屏视频（mp4），自动完成音频提取→语音转文字→结构化整理→口播稿写作→封面提示词生成。使用场景：(1) 用户有录屏视频想做口播 (2) 用户说"录屏转口播""录屏素材写稿""视频转口播稿" (3) 用户提供了录屏/屏幕录制视频文件并要求写口播稿。触发词：/laohan-luping。输出到 ~/.openclaw/workspace-shared/tasks/task_YYYYMMDD_中文关键词/
---

# 录屏转口播稿（laohan-luping）

把一段即兴录屏讲解视频，转化为老韩风格的高质量口播稿 + 封面提示词。

## 使用

```
/laohan-luping <视频文件路径>
```

## 完整流程

### Step 0：初始化

1. 从视频文件名提取主题关键词
2. 创建任务目录：
   ```
   ~/.openclaw/workspace-shared/tasks/task_YYYYMMDD_中文关键词/
   ```
3. 写入 `goal.md`：标题、视频路径、说明

### Step 1：提取音频

```bash
ffmpeg -i "<视频路径>" -vn -acodec libmp3lame -q:a 2 "/tmp/录屏音频_$(date +%s).mp3" -y
```

### Step 2：语音转文字

优先级：
1. 硅基流动 API（免费，快）：
   ```bash
   curl -s -X POST "https://api.siliconflow.cn/v1/audio/transcriptions" \
     -H "Authorization: Bearer $SILICONFLOW_API_KEY" \
     -F "model=FunAudioLLM/SenseVoiceSmall" \
     -F "file=@<音频文件>" \
     -F "language=zh" -F "response_format=json"
   ```
2. whisper-cli（本地快）：
   ```bash
   whisper-cli --model /opt/homebrew/share/whisper.cpp/ggml-small.bin --language zh --no-timestamps --output-txt --output-file <prefix> <audio.wav>
   ```
3. Python whisper small（最准）

转录结果保存为 `task_dir/source.md`

### Step 3：结构化整理（虾2进宝工作流）

读取 `references/organize-skill.md`（skill.md v3.4 Layer A/B 结构模板），按模板整理 `source.md` → `organize_output.md`

**必须包含的字段：**
- 素材基础信息（标题/作者/时长/目标观众）
- 黄金开局钩子（痛点场景 + 渴望结果 + 核心冲突）
- 结构化内容模块（每个含：时间坐标/核心观点/论证链路/关键证据/核心原话）
- 断言台账（≥3条）
- Layer B：受众痛点映射 + 跨域延伸（含反常识发现）+ 可执行精华收获
- 核心选题提炼（一句话主题 ≤15字 + 标题底子 + 模块映射 + 裁剪建议）

### Step 4：选题确认（动笔前必答）

读完 organize_output.md 后，回答以下问题（不跳过）：

1. 确认主题：adopt organize_output 第3节的一句话主题
2. 判断素材类型：技术解读 / 人物访谈 / 新闻盘点 / 悬念推理 → 选择对应开场/结构/结尾
3. 黄金开局钩子的三个锚点：痛点场景 / 渴望结果 / 核心冲突
4. 裁剪建议
5. 读者看完最想分享的一句话 = 全篇论点
6. 论点锚定

### Step 5：规划（不写稿）

读取 `references/writer-style.md`（老韩口播风格 v3.1），输出 11 项规划：

1. 一句话论点
2. 素材类型判断 + 对应结构
3. 核心主题贯穿规划（标题关键词出现≥5个位置）
4. Layer 精华筛选（必含/选择含/跳过）
5. 场景规划（1个核心生活场景 + 代入式互动点）
6. 改写策略（comprehensive/angle/structure/depth）
7. 目标读者
8. 技法选配（#1-#4核心骨架 + 反常识钩子 + #15回环呼应 + #18框架命名 + #19签名互动 + 横向对比 + 3-4条动态技法，总计≥7条）
9. 结构错位方案（与原稿重合度<60%）
10. 金句/比喻处理清单
11. 老韩增量点（≥2处新信息/新视角/新类比）

规划保存为 `task_dir/plan.md`

### Step 6：执行改写

按 style.md 写口播稿，硬性要求：

- 固定开场白：「你有没有这种感觉，」（8字固定）
- 5秒内给锚点（结论/反直觉观点/愣住的事实）
- 开场≤120字
- 第一行 `# 标题`（＜30字，两段式）
- 短句比例≥60%，关键节奏点≤15字
- 标题关键词正文≥5次
- 每个核心论点后有场景或互动
- 转场用转场句式库，禁"首先其次最后"
- 冒号→逗号，双引号→「」
- #19 签名互动「是不是有点意思」3-5次
- ≥4种废话感元素（不出现在开场和告别语）
- 节奏快慢交替

口播稿保存为 `task_dir/script.md`

### Step 7：质量检查（六关）

**E. 内容底线**（命中任一 = 不通过）：
- Layer A 覆盖<80% / 无反常识 / 无可执行收获 / 标题关键词<5次 / 偏离主题 / 无生活场景

**D. 二创脱敏**（最高优先级。注：教程型（模式 A）天然不存在二创痕迹问题，按步骤教学的内容可跳过此检查）：
- 结构重合>60%（非信息密集型）/ 替换比喻更弱 / 老韩增量<2 / 整段搬运>3句

**A. 正则检查**：
- 禁模板连接词、AI填充、夸大意义、模糊归因、标题党、通用结尾、空洞大词
- 禁词：意味着什么/本质上/换句话说/不可否认/综上所述/值得注意的是/赋能/抓手/赛道/壁垒/痛点

**B. 禁区**：禁用词 + 冒号→逗号 + 双引号→「」 + 禁"首先其次最后"

**B2. AI味**：禁体制化开头/空心强化/三连排比/冒号堆砌/过度总结/假设复数

**C. 技法**：核心骨架#1-#4全含 + 反常识钩子 + #15回环 + #18框架命名(≥3次) + #19签名互动(3-5次) + 横向对比(≥1次) + 动态技法(3-4条) = 总计≥7条

不通过则重写（最多2轮）。

### Step 8：封面提示词

读取 `~/.agents/skills/laohan-fengmianqiuzhi/SKILL.md`（封面提示词生成规则），基于 script.md 生成封面提示词。

从 script.md 第一行提取标题，生成 3 种风格 × 3 种比例 = 9 个 Gemini 提示词。

输出到：
```
{task_dir}/<标题>_prompts.md（与 script.md 同级）
```

### Step 9：幻灯片图片素材（NotebookLM）

读取 `~/.agents/skills/laohan-notebooklm/SKILL.md`（NotebookLM 幻灯片生成规则），基于 script.md 生成幻灯片图片。

1. 从 script.md 路径提取标题（`task_YYYYMMDD_` 后面部分，下划线转空格）
2. `mkdir -p ~/Desktop/<标题>_slides`
3. `cp script.md ~/Desktop/<标题>_slides/script.md`
4. 创建笔记本：`nlm notebook create "<标题>PPT"`
5. 上传口播稿原文：`nlm source add NOTEBOOK_ID --file ~/Desktop/<标题>_slides/script.md`
6. 触发生成：`echo "y" | nlm slides create NOTEBOOK_ID --language zh-CN --length default`
7. 后台轮询+下载+转图片（轮询间隔30秒，最多20轮；下载重试3次；`pdftoppm -png -r 200` 转 PNG）

输出到：
```
~/Desktop/<标题>_slides/
├── script.md
├── <标题>.pdf
├── slide-01.png
├── slide-02.png
└── ...
```

### Step 10：输出汇总

最终产出文件清单：

| 文件 | 说明 |
|------|------|
| `task_dir/goal.md` | 任务目标 |
| `task_dir/source.md` | 原始转录文本 |
| `task_dir/organize_output.md` | Layer A/B 结构化素材 |
| `task_dir/plan.md` | 规划文档 |
| `task_dir/script.md` | 口播稿 |
| `task_dir/<标题>_prompts.md` | 封面提示词 |
| `~/Desktop/<标题>_slides/slide-*.png` | 幻灯片图片素材（剪映用） |

## 依赖

- ffmpeg：音频提取
- 硅基流动 API（$SILICONFLOW_API_KEY）或 whisper-cli：语音转文字
- nlm CLI v0.5.25 + poppler：NotebookLM 幻灯片生成
- style.md / skill.md / 封面规则：references 目录下

## 参考文件加载时机

| 文件 | 何时读取 |
|------|---------|
| `references/organize-skill.md` | Step 3 整理时 |
| `references/writer-style.md` | Step 5-6 写稿时 |
| `~/.agents/skills/laohan-fengmianqiuzhi/SKILL.md` | Step 8 封面时 |
| `~/.agents/skills/laohan-notebooklm/SKILL.md` | Step 9 幻灯片时 |
