---
name: laohan-urlgaixie
description: 手动URL改写队列。从url.md读取待处理URL，触发OpenClaw管线（进宝→富贵）执行完整的视频内容改写流程。每次触发只处理1条。触发词：/laohan-urlgaixie
---

# URL改写队列

手动触发 OpenClaw 管线处理抖音视频。模拟旺财的触发动作，让进宝→富贵管线执行抓取→整理→写稿→封面全流程。

## 队列文件

`~/.openclaw/workspace-shared/urlgaixie/url.md`

## 流程

### Step 1：读取队列

读取 url.md，找第一个 `- [ ]` 且后面有 URL 的行。

- 没有 → 告诉用户"队列为空"，结束
- 有 → 提取 URL 和关键词，继续

### Step 2：抓取视频基本信息

用抖音移动端 UA 方法获取视频标题和博主信息（用于创建任务目录和 goal.md）。

```
curl -s -L -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X)" "https://www.iesdouyin.com/share/video/{video_id}" 
```

提取：视频标题、博主名。

### Step 3：创建任务目录

```
task_dir = ~/.openclaw/workspace-shared/tasks/task_YYYYMMDD_关键词/
```

创建目录 + goal.md：
```markdown
# 任务目标
- 标题：[视频标题]
- 链接：[URL]
- 平台：抖音
```

设置任务状态：
```bash
python3 -c "
import sys; sys.path.insert(0, '$HOME/.openclaw/workspace-shared')
from task_state import set_state, FETCHING
from pathlib import Path
set_state(Path('task_dir'), FETCHING)
"
```

### Step 4：触发进宝

```bash
openclaw agent --agent reviewer \
  --session-id reviewer-urlg-$(date +%s) \
  --thinking on \
  -m "虾2整理。必须使用以下任务目录（不可改名）：{task_dir}

处理以下视频：
- 平台：抖音
- 博主：{blogger_name}
- 标题：{video_title}
- URL：{url}

完成后执行 python3 knowledge/post_organize.py {task_dir}"
```

进宝会自动：抓取内容 → Layer A/B 整理 → post_organize.py → spawn 富贵 → 富贵写稿 + 封面提示词 → DM 用户。

### Step 5：等待管线完成

管线是异步的，需要等待：
- 进宝完成（organize_output.md 出现）→ 约 3-5 分钟
- 富贵完成（script.md 出现）→ 约 5-8 分钟
- 总计约 10-15 分钟

用 ScheduleWakeup 每 3 分钟检查一次 task_dir 中的文件状态。

### Step 6：质量检查

**标题检查：**
- 两段式（主题句+情绪句），≤30字
- 点名品牌/产品（如标题涉及具体产品，必须写明名称，禁止用"一个AI""一个工具"代替）
- 念出来顺嘴，像跟朋友发微信

**开头检查：**
- 固定第一句"你有没有这种感觉，"
- 具体品牌/产品名必须在开头出现（标题提了豆包/Claude，开头就得说豆包/Claude）
- 120字内完成开场
- 无AI化收束句（禁止"我拆了一圈这个逻辑""发现这事跟你想的完全反着来"等书面总结句，用"你仔细品品这事""你想想看"等口语化表达）
- 无Mad Libs填空句式

**内容检查：**
- 字数 400-800 字
- 固定结尾五件套（收束句+可操作步骤+诱饵+系列标签"寒武纪说AI"+告别语）

**封面提示词检查：**
- 文件存在且有内容
- 标题关键词与 script.md 标题一致

通过 → Step 7
不通过 → 修改 script.md（和封面提示词如有必要），再检查

### Step 7：更新队列状态

将 url.md 中对应行改为：
```
- [x] URL 关键词 ✅ YYYY-MM-DD
```

告知用户：完成情况 + 剩余队列数量。

## 执行清单

- [ ] Step 1: 读 url.md，找第一条待处理 URL
- [ ] Step 2: 抓取视频标题和博主信息
- [ ] Step 3: 创建任务目录 + goal.md + 设置状态
- [ ] Step 4: spawn 进宝触发 OpenClaw 管线
- [ ] Step 5: 等待管线完成
- [ ] Step 6: 质量检查 script.md + 封面提示词
- [ ] Step 7: 更新 url.md 状态
