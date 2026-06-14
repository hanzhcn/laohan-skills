---
name: laohan-skillcreator
version: 2.0
description: 创建、优化、评分 Claude Code agent skills 的元 skill（三位一体）。创建从构思到发布全流程；6 维量化评分（frontmatter/工作流/失败模式/检查点/具体性/反例）；迭代优化只保留涨分改动。Use when 用户说"创建skill""写一个skill""新建skill""改skill""优化skill""给skill打分""评分""评估skill质量""skill体检""review skill"或提到 skill 创建/优化/评分相关任何意图。
---

# laohan Skill 创建·优化·评分器

v2.0 三位一体：**创建** skill → **评分** skill → **优化** skill。融合 4 个来源最佳实践。

## 参考来源

融合 4 个来源（定期检查有无新 commit 可借鉴）：

1. **anthropics/skills · skill-creator**（https://github.com/anthropics/skills）
   - 借鉴：渐进式披露（metadata→body→bundled 三层）、并行 spawn with/baseline 对比、盲比较、description 优化器、从 transcript 找重复工作、更新保持原名
   - 核心理念：好的 skill 分三层渐进披露，不是一坨

2. **mattpocock/skills · write-a-skill**（https://github.com/mattpocock/skills）
   - 借鉴：Use when 触发精准、阶段门控、WRONG/RIGHT 反模式块、6 项极简检查清单、第三人称描述、scripts 判断标准
   - 核心理念：description 是 agent 看到的唯一东西，在与所有 installed skill 竞争

3. **thananon/9arm-skills · debug-mantra/post-mortem/scrutinize**（https://github.com/thananon/9arm-skills）
   - 借鉴：verbatim recitation（首次一次+逐字+silent apply）、硬门控措辞、refuse to draft、跨 skill offer 非自动、先质疑意图、cite or it didn't happen
   - 核心理念：不确定就停下来，每个 claim 要有引用

4. **alchaincyf/darwin-skill**（https://github.com/alchaincyf/darwin-skill）
   - 借鉴：9 维评分体系、反例黑名单 8 条、棘轮机制（git ratchet）、独立子 agent 复评、人在回路 5 阶段
   - 核心理念：skill 质量可量化，只保留有改进的改动（SkillLens 实证 LLM 自评仅 46.4% 准确率）

---

## 核心理念

四原则：

1. **description 决定生死** — 触发精准度是一切前提。Claude 倾向欠触发，description 要主动推销
2. **结构引导行为** — 好骨架比好指令有效
3. **精简优于完整** — 每个章节都要证明存在的价值
4. **质量可量化**（v2 新）— skill 不是写完即可，要能评分 + 迭代改进

---

## 创建流程

### Step 0 · 先质疑意图（硬门控，scrutinize 模式）

**新建前强制问三个问题，任何一问答 yes 就停下来不新建：**

1. 能不能**扩展现有 skill**？（读 `~/.agents/skills/` 和 `~/.claude/skills/` 找重叠/可扩展的）
2. 能不能**不建**？（做 nothing 行不行？手动一次性操作够不够？）
3. 确认必须新建 → 进入 Step 1

**如果 1 或 2 答 yes → 告诉用户替代方案（扩展哪个 skill / 为什么不必建），不新建。**

### Step 1 · 捕获意图

从对话提取（或问用户）：
1. 这个 skill 让 agent 能做什么？
2. 什么时候触发？（用户会说什么关键词/什么场景？）
3. 期望输出格式？
4. 是否需要 scripts/ 或 references/ 子目录？

用户说不清 → 停下来，列出不明确的部分，等补充。**不要猜。**

### Step 2 · 调研

确认 Step 0 的"不能扩展已有"结论（再扫一遍 `~/.agents/skills/`）。如发现可扩展 → 回 Step 0。
- **完成条件：** 确认新建并说明理由

### Step 3 · 写 SKILL.md

按下方骨架模板和写法规则。先判断极简还是完整骨架，再填。
- **完成条件：** frontmatter（name + version + description 含 "Use when"）+ 正文完整

### Step 4 · 测试迭代

1. 放入 `~/.agents/skills/<name>/`，symlink 到 `~/.claude/skills/<name>`
2. **触发测试**：新开对话说触发词，确认加载该 skill
3. **反触发测试**：说相似但无关的词，确认不误触发
4. **执行测试**：实际跑流程，验证输出
5. **重复工作检查**：读执行 transcript，若每次生成相同辅助代码 → 提取到 scripts/
6. 不通过 → 回 Step 3 改 → 重新测试
7. 3 轮未过 → 停，可能是结构问题不是小补，重审核心理念

### Step 5 · 6 维自评 + 发布

1. 用下方 6 维评分卡自评（应 ≥80）
2. 🔴 **CHECKPOINT**：展示评分 + 安装清单 + 将推送的文件，**等用户说"推""确认""yes"再 push**

---

## SKILL.md 骨架模板

不是每个 skill 都需完整骨架。Matt Pocock 证明 3-5 行指令式 skill 合法——逻辑简单到一句话说清，直接写指令，别为"专业"加多余章节。

**判断标准**：单步、无复杂条件分支（简单回退除外）、无角色区分 → 极简。多步/有条件分支/多角色 → 完整骨架。

### 极简示例（5 行）

```markdown
---
name: caveman
version: 1.0
description: 极简回应模式，只输出关键信息。Use when 用户说"caveman mode""极简""少说废话""简短"。
---

所有回应控制在 3 句话以内。只给结论和关键依据，不解释过程。如果用户要求详细解释，恢复正常模式。
```

### 完整骨架模板（v2 升级）

```markdown
---
name: skill-name
version: 1.0
description: 一句话说清做什么。Use when 用户说"触发词1""触发词2""触发词3"或提到[相关场景]。  # ≤1024字符，3-8触发词，第三人称
---

# Skill 标题

一句话定位。

## 核心理念（复杂 skill 必加，简单可省）

为什么存在、遵循什么原则。先讲 why 再讲 how——比直接列步骤更有效。

## 工作流

### 1. [步骤名]
- 做什么
- **完成条件：** [怎么判断这步做完了]
- **🔴 CHECKPOINT：** [关键决策点，停下来等用户确认]（v2：显性标记，非"建议"措辞）
- **🛑 STOP：** [强制停止条件]

### 2. [步骤名]
- 做什么
- **失败处理（三段式 fallback，v2）：**

  | 触发条件 | 一线修复 | 仍失败兜底 |
  |---------|---------|-----------|
  | [X 失败] | [Y] | [Z] |

### 3. [步骤名]
- 做什么
- **涉及外部动作 → 🔴 等用户确认再执行**

## 操作规则

跨步骤常驻约束：

- [规则1]
- [规则2]
- 遇到 [异常] → [怎么处理]（不静默跳过）

## 不适用场景（refuse to draft 硬拒绝，v2 升级）

- 场景 A → 改用 [其他 skill]
- **缺 [必要输入 X] → 列出缺什么并停，不硬编、不猜**（9arm post-mortem 模式）

## 反模式（复杂 skill 必加，v2 从可选升级）

❌ 差：
"[反例]"

✅ 好：
"[正例]"

## 输出格式（可选）

# [标题模板]
## [章节1]
```

---

## 评分体系（6 维快速评分卡）

精简自 darwin 9 维（完整 9 维见 [references/scoring-rubric.md](references/scoring-rubric.md)）。给任何 skill 打分：

| # | 维度 | 权重 | 评分标准 |
|---|------|------|---------|
| 1 | **frontmatter 质量** | 10 | name 规范；description 含做什么+Use when+3-8 触发词；≤1024 字符；**无"灵活应用/根据情况判断"等空话尾巴** |
| 2 | **工作流清晰度** | 20 | 编号步骤+明确完成条件+输入输出清晰 |
| 3 | **失败模式编码** ⭐ | 20 | 显式 if-then fallback（三段式表）；**只写正向不写失败分支扣 ≥3 分** |
| 4 | **检查点设计** ⭐ | 15 | 关键决策有 🔴/🛑 **显性标记**；仅"建议/如果...可以考虑"措辞不算 |
| 5 | **可执行具体性** ⭐ | 25 | 有具体参数/格式/示例可直接执行；**禁用"建议/可以考虑/根据情况/灵活把握/视情况而定"软化措辞**（完整黑名单见 references/blacklist-phrases.md，出现 ≥3 处扣 ≥3 分） |
| 6 | **反例黑名单** ⭐ | 10 | 有"不要做什么"章节；危险动作（rm/reset --hard/force push）显式列禁 |

**算分**：每维 1-10 分，总分 = Σ(维度分/10 × 权重)，满分 100。

**cite or it didn't happen（9arm）**：每个扣分必须引用 SKILL.md 具体行号或段落原文。不允许泛泛"这里不够好"。

**评分档位**：
- 85-100：可发布
- 70-84：需优化（找最低维改）
- <70：结构有问题，重审核心理念

---

## 优化流程

优化已有 skill（只改自研 laohan 系列；npx 第三方 fork 后改）：

### 1. 6 维评分（找最低维）
- 主 agent 打分结构维度（1-6）
- **扣分引行号**，输出评分卡 + 最弱维度

### 2. 改最低维度（一轮一维，darwin 反例第 5 条）
- 只改得分最低那一维，不动其他（多变量同变无法归因）
- 改完 git commit

### 3. 独立复评（darwin 反例第 1 条：不自评）
- **另起一个子 agent** 重新 6 维打分（避免"我刚改的肯定更好"乐观偏差，实证 46.4%）
- 新分 > 旧分 → 保留；否则 → `git revert HEAD`（**不用 reset --hard**）

### 4. 棘轮轻量版
- 改进才 commit，退步 revert，分数只升不降
- 单轮涨幅 < 1 分 → 停手（见好就收，不凑分堆冗余，darwin 反例第 3 条）

### 5. 深度优化路由（不在这做）
需要 dim8 实测（with_skill vs baseline 双跑）/ 棘轮多轮循环 / runtime 红灯 gate → **用 darwin-skill**（如已装 `npx skills add alchaincyf/darwin-skill`），或读 references/scoring-rubric.md 跑完整 9 维。

---

## 操作规则

创建/优化/评分全程约束：

- **保持精简**：写完逐条审查，删不影响输出的指令
- **Lazy creation**：有内容才建文件/目录，不先建空结构占位
- **通用化非过拟合**：不为单个用例做小众调整
- **解释 why**："因为 A 所以 B" 优于 "MUST 做 B"——LLM 聪明，给理由比硬规则有效（anthropics）
- **匹配目标用户语言**：laohan 系列默认中文，技术术语保留英文
- **更新保持原名**：installed 是 `research-helper` 就输出同名，不是 v2（anthropics）

### dim5 软化措辞黑名单（v2 新，darwin）

**禁用以下措辞**（出现 ≥3 处，dim5 扣 ≥3 分）：
- "建议" / "可以考虑" / "根据情况" / "灵活把握" / "视情况而定" / "酌情" / "适当"

改用具体指令："做 X"（祈使句 + 具体参数/示例）。完整禁用词表见 references/blacklist-phrases.md。

### 反例黑名单（v2 新，darwin 8 条精简）

创建/优化时禁止：
1. **不自评自改** — 同一 session 又改又评有乐观偏差；评分必须 spawn 独立子 agent
2. **不用 `git reset --hard`** 回滚 — 用 `git revert HEAD`
3. **不为凑分堆冗余** — 触顶（连续 2 轮 Δ<2 分）就停
4. **不跳过测试打分** — 没跑测试不算分
5. **一轮只改一维** — 多维同变无法归因
6. **不静默跳过异常** — fallback 失败必须先告知用户

---

## 不适用场景（refuse to draft，v2 升级为硬拒绝）

- 创建 Claude Code **agent**（agent ≠ skill）→ 手动写 agent 配置
- 非 Claude Code 平台插件 → 本 skill 只适用 SKILL.md 格式
- 修改 **npx 第三方 skill** → fork 后新建（`npx skills update` 覆盖原地改动）
- **缺必要输入**（用户说不清要做什么）→ **列出缺什么并停**，不硬编、不猜（9arm refuse to draft）

---

## 写法规则

### Frontmatter

```yaml
---
name: skill-name          # kebab-case，与目录名一致
version: 1.0
description: 功能描述。Use when 触发场景列举。  # ≤1024字符，第三人称
---
```

**description 是 agent 决定加载哪个 skill 的唯一依据**（mattpocock）。必须含：
1. 功能描述（一句话做什么）
2. "Use when" + 3-8 个触发词（用户会说的自然语言，不只技术术语）
3. 第三人称（mattpocock）
4. 如有竞争 skill，明确区分

### 正文写法

| 规则 | 说明 |
|------|------|
| 篇幅控制 | <100 行单文件；100-500 考虑拆 references/；>500 必须拆（SKILL.md 只留工作流+规则）|
| 核心理念先行 | 3 步以上 skill 在工作流前加核心理念章节（先 why 后 how）|
| 工作流+操作规则分离 | 工作流=步骤序列；操作规则=跨步骤约束，独立章节 |
| 阶段门控 | 关键步骤间硬停止："如果无法确定 X → 停下来" / 🔴 CHECKPOINT / 🛑 STOP |
| 反模式 WRONG/RIGHT | 核心规则用对比块（❌差/✅好）|
| 口诀植入（verbatim） | 核心纪律用口诀：**首次响应输出一次、逐字不改写、用户说跳过则不输出但仍 silent apply**（9arm debug-mantra）|
| 输出格式 | 用模板定义，不给模糊指令 |
| 降级级联 | 多方案用严格优先级（依次尝试），非菜单 |
| 跨 skill 调用 | 完成后 **offer** 衔接另一个 skill（不自动 handoff，9arm post-mortem）|
| 写作原则 | 祈使句 + 具体例子 + 不用 ALL CAPS ALWAYS/NEVER + 内容创作类定义语气 |
| scripts/ 判断 | 确定性操作/重复生成的相同代码/需显式错误处理 → scripts（mattpocock）|
| references/ 判断 | 平台专属方法/长模板/不需每次加载的背景知识 → references（仅一层深）|

> **渐进式披露（anthropics）**：metadata（常驻）→ SKILL.md body（触发加载）→ bundled resources（按需）。SKILL.md 别一坨塞完，重的拆 references/scripts。

### 6 项极简自检清单（创建后快速过，mattpocock）

- [ ] description 含 Use when + 触发词
- [ ] SKILL.md < 100 行（或 >500 已拆 references）
- [ ] 无时效信息（具体日期/版本号除非必要）
- [ ] 术语一致
- [ ] 有具体例子
- [ ] references 仅一层深

---

## 安装清单

创建/优化完成后：

- [ ] SKILL.md 写好，frontmatter 含 name + version + description（含 Use when）
- [ ] 目录在 `~/.agents/skills/<name>/`
- [ ] symlink: `ln -s ~/.agents/skills/<name> ~/.claude/skills/<name>`（自研 skill 用 symlink→git仓库，见 rules/skills.md v1.3）
- [ ] 触发测试通过
- [ ] 反触发测试通过
- [ ] 执行测试通过
- [ ] 重复工作检查（无每次生成的相同辅助代码）
- [ ] **6 维自评 ≥80**（v2 新）
- [ ] runtime 红灯扫描通过（`bash scripts/redlight-scan.sh`，无硬编码平台绑定路径）
- [ ] 推送安全检查（无硬编码绝对路径、无内部昵称、无 API key）
- [ ] 复制到 laohan-skills 仓库（自研）+ git push
