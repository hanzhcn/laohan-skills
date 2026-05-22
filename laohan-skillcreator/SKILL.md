---
name: laohan-skillcreator
description: 创建、修改、优化 Claude Code agent skills。融合 skill-creator 结构规范 + Matt Pocock 触发精准度 + 9arm 结构化工作流写法。Use when 用户说"创建skill""写一个skill""新建skill""改skill""优化skill"或提到 skill 创建/修改相关的任何意图。
---

# laohan Skill 创建器

laohan 系列专属的 skill 创建标准。从构思到发布全流程。

## 创建流程

### 1. 捕获意图

从对话中提取（或直接问用户）：
1. 这个 skill 让 Claude 能做什么？
2. 什么时候该触发？（用户会说什么关键词/在什么场景下？）
3. 期望的输出格式是什么？
4. 是否需要 scripts/ 或 references/ 子目录？

### 2. 调研

如果现有 skill 有类似功能，先读它的 SKILL.md 看能否扩展而非新建。
检查 `~/.claude/skills/` 是否有重叠 skill。

### 3. 写 SKILL.md

按下面的模板和规则写。

### 4. 安装测试

1. 放入 `~/.agents/skills/<skill-name>/`
2. symlink 到 `~/.claude/skills/<skill-name>`
3. 测试触发：新开对话，说触发词，看 Claude 是否加载该 skill
4. 测试执行：实际运行 skill 流程，验证输出符合预期

### 5. 发布

推送到 `~/Documents/laohan-skills/` 仓库 → `git push`。

---

## SKILL.md 结构

```
skill-name/
├── SKILL.md           # 必须，主体指令
├── references/        # 可选，超长内容拆分
│   └── platform-x.md
└── scripts/           # 可选，确定性操作脚本
    └── helper.py
```

不要创建 assets/、evals/、agents/ 等子目录——laohan 系列不需要。

## Frontmatter 规则

```yaml
---
name: skill-name          # kebab-case，与目录名一致
description: 功能描述。Use when 触发场景列举。
---
```

### description 写法（最关键）

description 是 Claude 决定是否加载该 skill 的唯一依据。必须包含两部分：

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

## SKILL.md 正文写法

### 篇幅控制

| 行数 | 策略 |
|------|------|
| < 100 行 | 单文件即可 |
| 100-300 行 | 考虑拆 references/ |
| > 300 行 | 必须拆，SKILL.md 只保留工作流和规则 |

拆分时在 SKILL.md 中明确指向：详见 [references/douyin.md](references/douyin.md) 的抓取方法。

### 工作流写法

用编号步骤 + 操作规则：

```markdown
## 工作流

### 1. 收集信息
- 做什么
- 怎么判断完成

### 2. 执行
- 做什么

### 操作规则
- 不要做 X
- 遇到 Y 时做 Z
```

### 口诀植入（可选）

如果 skill 有核心纪律需要每次强调，用 verbatim 格式：

> **口诀：** 每次执行前先确认：1) 输入格式正确 2) 输出目标明确 3) 不跳步骤

### 输出格式

用模板定义输出，不给模糊指令：

```markdown
## 输出格式
必须使用以下模板：
# [标题]
## 概要
## 正文
## 下一步
```

### 写作原则

- 用祈使句（"做 X"而非"你应该做 X"）
- 解释 why（"因为 A，所以做 B"优于"MUST 做 B"）
- 给具体例子（Input/Output 对）
- 不用 ALL CAPS 的 ALWAYS/NEVER——改用自然的因果解释
- 中文为主，技术术语保留英文

## 何时用 scripts/

把确定性操作写成脚本：
- 格式转换、数据验证、文件处理
- 每次 Claude 都会重新生成的相同代码
- 需要精确控制的步骤（如 API 调用参数）

脚本省 token、提可靠性。

## 何时用 references/

把参考内容拆出去：
- 平台专属方法（如各平台抓取规则）
- 长模板或配置示例
- 不需要每次都加载的背景知识

## 安装清单

创建完成后按此清单操作：

- [ ] SKILL.md 写好，frontmatter 含 name + description（含 "Use when"）
- [ ] 目录在 ~/.agents/skills/<skill-name>/
- [ ] symlink: ln -s ~/.agents/skills/<skill-name> ~/.claude/skills/<skill-name>
- [ ] 触发测试通过（说触发词能加载 skill）
- [ ] 执行测试通过（输出符合预期）
- [ ] 复制到 ~/Documents/laohan-skills/<skill-name>/
- [ ] git push

## 改造已有 skill

当需要优化现有 skill 时，重点检查：

1. **description 是否有 "Use when"** — 没有，加
2. **SKILL.md 是否超过 300 行** — 超了，拆 references/
3. **工作流是否有编号步骤 + 操作规则** — 没有，重构
4. **输出格式是否用模板定义** — 没有，加
5. **是否解释了 why** — 没有，补
