---
name: laohan-skillcreator
description: 创建、修改、优化 Claude Code agent skills。融合 skill-creator 结构规范 + Matt Pocock 触发精准度 + 9arm 结构化工作流写法。Use when 用户说"创建skill""写一个skill""新建skill""改skill""优化skill"或提到 skill 创建/修改相关的任何意图。
---

# laohan Skill 创建器

laohan 系列专属的 skill 创建标准。从构思到发布全流程。

## 参考来源

本 skill 融合了三个来源的最佳实践：

1. **anthropics/skills 的 skill-creator**
   - 仓库：https://github.com/anthropics/skills
   - 具体文件：`skill-creator/SKILL.md`（含 agents/、scripts/、eval-viewer/、references/ 子目录）
   - 本地残留副本：`~/Documents/deepflow2/skills/public/skill-creator/`（v2 完整版，33KB）
   - 借鉴点：多文件结构规范、pushy description 策略、评估思路（简化为轻量级测试迭代，不含完整评估流水线）
   - 核心理念：description 要"主动推销"自己，因为 Claude 倾向于欠触发（undertriggering），需要 description 主动匹配用户意图

2. **mattpocock/skills**
   - 仓库：https://github.com/mattpocock/skills
   - 核心文件：`write-a-skill/SKILL.md`（元技能，本 skill 最直接的参考）、`tdd/SKILL.md`、`diagnose/SKILL.md`（阶段门控示范）
   - 安装命令：`npx skills add mattpocock/skills -g -y`
   - 借鉴点："Use when" 触发精准度、阶段门控（Phase Gating）、反模式示例（WRONG/RIGHT 对比块）、参考仅限一层深度、篇幅拆分阈值（100/500行）、核心理念先行（Philosophy first）
   - 核心理念：description 是 Claude 决定加载哪个 skill 的唯一依据——它在与所有已安装 skill 竞争，必须赢

3. **thananon/9arm-skills**
   - 仓库：https://github.com/thananon/9arm-skills
   - 核心文件：`skills/engineering/debug-mantra/SKILL.md`（口诀植入示范）、`skills/engineering/post-mortem/SKILL.md`（跨 skill 组合示范）
   - 安装命令：`npx skills add thananon/9arm-skills -g -y`
   - 借鉴点：编号步骤 + 操作规则分离、口诀植入（verbatim recitation）、明确拒绝/门控条件、跨 skill 组合调用、反模式枚举
   - 核心理念：每个步骤都有硬停止条件，不确定就停下来而不是猜

定期检查三个仓库是否有新 commit，看是否有新的可借鉴技巧。

---

## 核心理念

本 skill 遵循三个原则：**description 决定生死**（触发精准度是一切的前提）、**结构引导行为**（好的骨架比好的指令更有效）、**精简优于完整**（每个章节都要证明自己存在的价值）。三个来源的技巧都服务于这三个原则。

---

## 创建流程

### 1. 捕获意图

从对话中提取（或直接问用户）：
1. 这个 skill 让 Claude 能做什么？
2. 什么时候该触发？（用户会说什么关键词/在什么场景下？）
3. 期望的输出格式是什么？
4. 是否需要 scripts/ 或 references/ 子目录？

如果对话中已包含这些信息，跳过提问直接确认即可。

### 2. 调研

如果现有 skill 有类似功能，先读它的 SKILL.md 看能否扩展而非新建。
检查 `~/.claude/skills/` 是否有重叠 skill。

### 3. 写 SKILL.md

按下面的骨架模板和规则写。先按骨架模板前的判断标准确定极简还是完整骨架，再填充。

### 4. 测试迭代

1. 放入 `~/.agents/skills/<skill-name>/`，symlink 到 `~/.claude/skills/<skill-name>`
2. **触发测试**：新开对话，说触发词，确认 Claude 加载了该 skill
3. **反触发测试**：说相似但无关的词，确认不会误触发
4. **执行测试**：实际运行 skill 流程，验证输出符合预期
5. **重复工作检查**：如果 Claude 每次执行都生成相同的辅助代码，提取到 scripts/
6. 不通过 → 回到第3步修改 → 重新测试
7. 如果 3 轮迭代仍未通过 → 停下来，可能是 SKILL.md 的结构有问题，不是小修补能解决的。重新审视核心理念和工作流设计

### 5. 发布

推送前先按安装清单的安全检查项确认，然后推送到 `~/Documents/laohan-skills/` 仓库 → `git push`。

---

## SKILL.md 骨架模板

不是每个 skill 都需要完整骨架。Matt Pocock 证明了 **3-5 行指令式 skill 完全合法**——如果一个 skill 的逻辑简单到一句话能说清，直接写指令，不要为了"看起来专业"而加多余的章节结构。

**判断标准**：单步、无分支、无角色区分 → 极简。多步、有条件分支、有多角色 → 完整骨架。

### 极简 skill 示例（5行）

```markdown
---
name: caveman
description: 极简回应模式，只输出关键信息。Use when 用户说"caveman mode""极简""少说废话""简短"。
---

所有回应控制在 3 句话以内。只给结论和关键依据，不解释过程。如果用户要求详细解释，恢复正常模式。
```

### 完整骨架模板

以下骨架列出所有可用章节。实际 skill 只需包含相关的——标了"可选"的不加也行，不要为了"完整"而填空。

```markdown
---
name: skill-name
description: 一句话说清做什么。Use when 用户说"触发词1""触发词2""触发词3"或提到[相关场景]。
---

# Skill 标题

一句话定位。

## 核心理念（可选，复杂 skill 必加）

为什么这个 skill 存在、它遵循什么原则。
先告诉 Claude "为什么"，再告诉它"怎么做"——这比直接列步骤更能引导正确行为。

## 工作流

### 1. [步骤名]
- 做什么
- **完成条件：** [怎么判断这步做完了]
- **如果无法确定 X → 停下来，明确告诉用户缺什么，不要跳过**

### 2. [步骤名]
- 做什么
- **完成条件：** [怎么判断这步做完了]

### 3. [步骤名]
- 做什么
- **涉及外部动作时 → 等用户确认再执行**

## 操作规则

跨步骤的常驻约束，独立于工作流步骤：

- [规则1]
- [规则2]
- 遇到 [异常情况] → [怎么处理]

## 不适用场景

- [场景 A] → 改用 [其他 skill] 或直接告诉用户
- 缺少 [必要输入] → 列出缺少项，不硬编

## 输出格式

# [标题模板]
## [章节1]
## [章节2]

## 反模式（可选，核心规则处加）

❌ 差：
"反例"

✅ 好：
"正例"
```

## 目录结构

```
skill-name/
├── SKILL.md           # 必须，主体指令
├── references/        # 可选，超长内容拆分（仅一层深度）
│   └── platform-x.md
└── scripts/           # 可选，确定性操作脚本
    └── helper.py
```

不要创建 assets/、evals/、agents/ 等子目录——laohan 系列不需要。

---

## Frontmatter 规则

```yaml
---
name: skill-name          # kebab-case，与目录名一致
description: 功能描述。Use when 触发场景列举。
---
```

### description 写法（最关键）

**description 是 Claude 决定是否加载该 skill 的唯一依据。** 它在与所有已安装 skill 竞争——必须赢。Claude 倾向于欠触发，所以 description 要"主动推销"自己。

必须包含两部分：

1. **功能描述**（一句话说清做什么）
2. **"Use when" 触发条件**（列举具体触发词和场景）

```
好的 description:
从互联网拿内容一站式（7+平台自动降级）。Use when 用户说"下载""帮我抓""读一下这个链接"或提到抖音/B站/YouTube等平台名。

差的 description:
下载工具
```

规则：
- 上限 1024 字符
- "Use when" 后列举 3-8 个常见触发词
- 包含用户可能说的自然语言，不只是技术术语
- 如果 skill 之间有竞争关系，在 description 里明确区分

---

## 正文写法规则

### 篇幅控制

| 行数 | 策略 |
|------|------|
| < 100 行 | 单文件即可 |
| 100-500 行 | 考虑拆 references/ |
| > 500 行 | 必须拆，SKILL.md 只保留工作流和规则 |

元 skill（如本 skill）因使用频率低、每次需全量参考，可例外保持单文件。

拆分时在 SKILL.md 中明确指向：详见 [references/douyin.md](references/douyin.md) 的抓取方法。
参考文件仅限一层深度——不要 references/ 下面再嵌套子目录。

### 核心理念先行

复杂 skill（3步以上）在工作流之前加"核心理念"章节。

这比在工作流中穿插解释更有效——先告诉 Claude 为什么这样做，让它带着理解执行步骤，而不是机械地走流程。简单 skill（1-2步）不需要。

### 工作流 + 操作规则分离

工作流是步骤序列，操作规则是跨步骤的常驻约束——两者是独立章节：

- **工作流**：编号步骤，每步有完成条件和门控
- **操作规则**：独立章节，放在工作流之后，包含"不要做X""遇到Y做Z"等全局约束

不要把操作规则写在某个步骤内部——它们应该在任何步骤中都生效。

### 阶段门控

关键步骤之间加硬停止条件——不确定就停下来，不要猜：

```markdown
### 2. 执行
- **如果无法确定 X → 停下来明确告诉用户缺什么，不要跳过**
```

门控写法：
- "如果无法确定 X → 停下来，说出来"
- "不要在步骤 N 完成前进入步骤 N+1"
- "缺少 Y → 列出来，等用户补充"

### 明确拒绝条件

定义 skill 什么时候不该触发或该拒绝执行：

```markdown
## 不适用场景
- 场景 A → 改用其他 skill 或直接告诉用户
- 缺少必要输入 X → 列出缺少项，不硬编
```

### 人为干预门

涉及外部动作（发布内容、调用 API、写入关键文件）时，先展示将执行的操作，等用户确认再执行：

```markdown
### 5. 发布
- 展示将发布的内容和目标
- **等用户说"发""确认""yes"后再执行**
```

### 反模式示例

重要规则用 WRONG/RIGHT 对比块，比纯文字更清晰：

```markdown
❌ 差（模糊）：
"AI工具推荐"

✅ 好（动词+工具+结果）：
"3步用Claude Code创建自定义Skill，告别重复劳动"
```

### 口诀植入

如果 skill 有核心纪律需要每次强调，用 verbatim 格式——Claude 输出这段话时会"锚定"自己的行为：

> **口诀：** 每次执行前先确认：1) 输入格式正确 2) 输出目标明确 3) 不跳步骤

规则：
- 口诀只输出一次（首次响应），不在会话中途重复
- 用户说"跳过口诀"→ 不输出但仍然遵守规则

### 输出格式

用模板定义输出，不给模糊指令：

```markdown
## 输出格式
# [标题]
## 概要
## 正文
## 下一步
```

模板要克制——只在真正增加价值的部分加模板，不要为了"看起来完整"而填充每个段落。

### 降级级联（可选）

如果 skill 涉及多方案选择（如多平台抓取），用严格优先级而非菜单：

```markdown
## 降级策略
1. 方案A（最快）→ 失败时
2. 方案B（较慢）→ 失败时
3. 方案C（兜底）
```

不是"选一个"，而是"从上到下依次尝试"。

### 跨 skill 调用（可选）

如果 skill 完成后自然衔接另一个 skill，在正文中注明：

```markdown
## 下一步
完成后可触发 `/laohan-notebooklm <script.md>` 生成幻灯片。
```

### 写作原则

- 用祈使句（"做 X"而非"你应该做 X"）
- 解释 why（"因为 A，所以做 B"优于"MUST 做 B"）
- 给具体例子（Input/Output 对）
- 不用 ALL CAPS 的 ALWAYS/NEVER——改用自然的因果解释
- 匹配目标用户语言，laohan 系列默认中文，技术术语保留英文
- 不确定是否需要的功能，标注"可选"
- **通用化而非过拟合**：测试发现问题时，不要针对单个测试用例做过于小众的调整——改了让一个场景通过但其他场景变差，不是好修改
- **保持精简**：每个指令都要产生价值。写完后逐条审查——删掉不影响输出的指令。如果一条规则删了 Claude 仍然做对，那它就不该存在
- **Lazy creation**：只在有内容要写时才创建文件和目录——不要先建空结构"占位"
- **内容创作类 skill 需定义语气**：如果 skill 输出面向读者的内容（口播稿、标题、文案），用具体规则定义语气（如"不用'众所周知'开头""不用感叹号"），而不是笼统说"口语化"

---

## 何时用 scripts/

把确定性操作写成脚本：
- 格式转换、数据验证、文件处理
- 每次 Claude 都会重新生成的相同代码
- 需要精确控制的步骤（如 API 调用参数）

**判断标准**：如果测试中发现 Claude 每次执行都生成几乎一样的辅助代码，那应该提取到 scripts/——省 token、提可靠性。

## 何时用 references/

把参考内容拆出去：
- 平台专属方法（如各平台抓取规则）
- 长模板或配置示例
- 不需要每次都加载的背景知识

---

## 安装清单

创建完成后按此清单操作：

- [ ] SKILL.md 写好，frontmatter 含 name + description（含 "Use when"）
- [ ] 目录在 ~/.agents/skills/<skill-name>/
- [ ] symlink: ln -s ~/.agents/skills/<skill-name> ~/.claude/skills/<skill-name>
- [ ] 触发测试通过（说触发词能加载 skill）
- [ ] 反触发测试通过（说相似无关词不误触发）
- [ ] 执行测试通过（输出符合预期）
- [ ] 重复工作检查（无每次生成的相同辅助代码）
- [ ] 推送安全检查（无硬编码绝对路径、无内部昵称、无 API key）
- [ ] 复制到 ~/Documents/laohan-skills/<skill-name>/
- [ ] git push

## 改造已有 skill

当需要优化现有 skill 时，重点检查：

1. **description 是否有 "Use when"** — 没有，加
2. **SKILL.md 是否超过 500 行** — 超了，拆 references/
3. **是否有核心理念章节** — 3步以上的 skill 必加
4. **工作流是否有编号步骤 + 独立的操作规则** — 没有或混在一起，重构
5. **关键步骤是否有门控条件** — 没有，加硬停止
6. **是否有不适用场景** — 没有，加拒绝条件
7. **输出格式是否用模板定义** — 没有，加
8. **是否解释了 why** — 没有，补
9. **核心规则是否有反模式示例** — 加 WRONG/RIGHT 对比块
10. **涉及外部动作是否有人为干预门** — 没有，加确认步骤
11. **涉及多方案选择是否有降级级联** — 没有，加优先级级联（非菜单）
