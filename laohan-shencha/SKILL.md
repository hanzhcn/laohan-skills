---
name: laohan-shencha
version: 1.4.0
description: 深度联网核验器，验证技术文档的外部声明，或核验口播稿中可外部验证的事实主张。Use when 用户说"深度审查""老韩审查""联网审查""技术文档审查""核验口播事实"或要求对技术方案、部署脚本、配置文件、口播稿的事实主张进行查证；默认只审查，只有用户明确要求修复或工作流合同授权时才改文件，不做纯文风审查。
---

# Laohan Shencha（老韩深度审查）

## 核心原则

LLM 写技术文档时天然相信自己写的声明是对的。本 Skill 的唯一目的：**找出那些“看起来正确但实际是错的”声明，并在获得授权时修正。**

纯文字审查（表述矛盾、格式不统一）不是本 skill 的重点——那些靠文本比对就能发现。

## 模式与动作

先分别选择“核验对象”和“是否修改”，不要把二者混在一起：

- `TECH_CLAIMS`：默认模式，用于技术文档、脚本、配置和外部资源声明。
- `CONTENT_CLAIMS`：仅在真人口播工作流⑤或用户明确要求核验口播事实时使用。
- `AUDIT_ONLY`：用户说“审查、核验、看看有没有问题”时的默认动作，只出发现与证据，不改文件。
- `VERIFY_AND_FIX`：只有用户明确要求“修复、改掉”，或上游工作流合同明确授权修改时使用。

选择 `CONTENT_CLAIMS` 不等于降低事实标准，选择 `VERIFY_AND_FIX` 也不授权修改文风、方法论或与事实无关的内容。

## CONTENT_CLAIMS 模式（真人口播⑤）

输入是 `episodes/<slug>/01-口播稿.md`，输出固定为 `04-事实核验.md` 与 `04-事实主张.json`。报告开头必须含 `script_hash: <当前稿 SHA-256>`、`fact_check_status: CLEAR|REVISE_REQUIRED|BLOCKED`、`contradicted_count` 与 `unverifiable_count` frontmatter。claims JSON 必须含当前 script_hash、事实报告 SHA、每项外部主张的稳定 `claim_id`、原句、`SUPPORTED|INFERRED|CONTRADICTED|UNVERIFIABLE|OPINION` 结论及来源证据。能由来源直接读出的才写 `SUPPORTED`；从实现、多个来源或行为推导出的结论写 `INFERRED`，并提供非空 `inference_note`。个人经验、价值判断、比喻与行动建议标为 `OPINION`。

`04-事实主张.json` 最小结构：`schema_version: 1`、`script_sha256`、`fact_report_sha256`、`claims` 数组；每项至少含稳定 `claim_id`、`statement`、`verdict`、`evidence` 数组。每个证据项必须有稳定 `id`，并且二选一：外部证据写 `url`、`source_type`、`retrieved_at`；本期本地证据写 episode 内 `local_path` 与文件 `sha256`。两个 SHA 字段必须分别等于当前 `01-口播稿.md` 与 `04-事实核验.md` 的 SHA-256。无可核验主张时仍写空 `claims` 数组，不能省略文件或伪造来源。

1. 逐条编号提取主张，保留原句和所在行。
2. 每条优先找一手来源：机构官网/公告、原始研究、官方数据库、原采访或平台原帖；没有一手来源才用可靠二手报道，并注明。
3. 只能给出 `SUPPORTED`、`INFERRED`、`CONTRADICTED`、`UNVERIFIABLE`、`OPINION` 五种结论；没有来源不能写“基本正确”。`INFERRED` 可用于口播判断，但不能作为后续 PROOF beat 的直接事实证据。
4. `CONTRADICTED` 必须回②改；`UNVERIFIABLE` 必须删除、换成不带数字的谨慎表述，或标明这是个人判断。不得用“据说”遮盖。
5. 报告最少包含：主张 ID、原句、结论、来源链接、来源日期、建议改法。无可核验主张时也写明“0 条”，不能省略文件。

只有 `CONTRADICTED=0`、`UNVERIFIABLE=0` 且所有需要修改的句子已在当前稿处理后，才可写 `fact_check_status: CLEAR`；否则写 `REVISE_REQUIRED` 并准确计数。网络不可用、来源无法读取或无法完成核验时写 `BLOCKED`，不得用 hash 或“已出报告”代替结论。

CONTENT_CLAIMS 不评价钩子、节奏、共鸣或传播性；这些由 dbskill 诊断。它也不改变上游 Cheat 的 rubric。

原版模板、口头禅、比喻、冲突表达、个人判断和戏剧化场景不属于待消除的“安全风险”。只提取其中可外部核验的事实部分；表达方式本身不得因为无法引用来源而删除或降级。个人真实经历只有在冒充不存在的实测、数据或结果时才作为事实问题处理。

**AUTONOMOUS_RUN 边界：** CONTENT_CLAIMS 不执行下文通用“阶段3.5向用户逐项确认”。发现 `CONTRADICTED`/`UNVERIFIABLE` 时先写 `REVISE_REQUIRED`、精确原句/证据/建议改法并回②；编排器可在最多三轮内自主删改或降级措辞，再重跑③—⑤和④最终预测。只有来源访问、账号授权或事实本身必须由 Jeffrey 提供且三轮仍无法消解时才 `BLOCKED`。不得把常规 HIGH/CRITICAL 事实修订变成人工确认 gate，也不得为继续流程把问题写成 CLEAR。

**分级抽样（声明超 50 条时启用，节省 token）：** 高可信（官方 README 复制、环境变量名）→ 抽检 20%；中可信（版本号、参数值）→ 抽检 50%；低/未知可信（社区讨论、博客引用）→ 全部验证。声明数 ≤50 条时，逐条全量验证。纯类别常识且不影响观众判断的声明（如"PyTorch 是深度学习框架"）可跳过；版本号、推荐值、资源需求、端口或其他会改变操作结果的参数不是“常识”，必须按本规则核验。

## 五阶段审查流程

### 阶段 1：扫描 — 提取可验证声明

读取工作区所有相关文件，提取以下类型的声明：

**文件范围选择：** 优先扫描可执行脚本（.py/.sh/.ps1）、配置文件（.json/.yaml/.toml）、项目文档（README.md/workflows/）。纯散文/日记/日志类文件跳过。文件超 20 个时优先脚本+配置类。

**声明提取模式：**

- **GitHub 仓库**：`github\.com/[\w.-]+/[\w.-]+` → `github.com/xxx/yyy`
- **版本号**：`v?\d+\.\d+(\.\d+)*(?:-[.\w]+)?` → `PyTorch 2.7.1`
- **参数值**：`"?\w+"?\s*[:=]\s*"?[^\s,;"]+"?` → `blocks_to_swap=10`, `port: 3000`
- **API 端点**：`https?://[^\s]+\bapi[^\s]+` → `https://api.example.com/v1/chat`
- **CLI 命令**：`(?:^|[\s]+)(docker|npm|pip|python|git|curl|cargo|go)\s[^\n]+` → `docker compose up -d`
- **环境变量**：`\b[A-Z_]{3,}\b`（仅 .env/.sh/配置文件激活）→ `OPENAI_API_KEY`
- **文件路径**：`(?:/[\w.-]+)+/?` → `/etc/nginx/conf.d/`, `~/.config/`
- **端口号**：`:\d{2,5}(?:/\w+)?` → `:18789`, `:3000/api`
- **Docker 标签**：`[\w.-]+:[\w][\w.-]*` → `python:3.11-slim`
- **硬件需求**：`\d+\s*(GB|MB|GiB|MiB)\s*(VRAM|RAM|显存)` → `16GB VRAM`
- **文件大小**：`(?:~|大约|约|about)?\s*\d+\s*(KB|MB|GB|TB)` → `~10GB`
- **pip 安装**：`(?:pip3?|python\s+-m\s+pip|uv\s+pip)\s+install\s+\S+` → `pip install xxx`
- **npm 包**：`"(@?[\w@./-]+)":\s*"([^"]+)"` → `"next": "^14.2.0"`
- **CVE 编号**：`CVE-\d{4}-\d{4,}` → `CVE-2024-1234`
- **浏览器兼容**：`(Chrome|Safari|Firefox|Edge)\s*\d+` → `Chrome 90+`
- **git clone**：`git\s+clone\s+(?:--depth\s+\d+\s+)?\S+` → `git clone --depth 1 https://...`

**可执行脚本中的外部资源引用自动提升一个严重度等级。** 脚本（.ps1/.py/.sh）里的文件名、URL、仓库 ID 写错会直接导致运行失败，比文档中的同名错误严重得多。

输出：按文件分组的声明清单，标注每条的验证方法和优先级。

### 阶段 2：联网验证 — 逐条查证

对每条声明使用对应验证方法。**必须实际查询，不能凭训练知识判断。**

验证工具优先级：
1. `gh repo view` / `gh api` — GitHub 仓库可用性，`gh api repos/{o}/{r}/releases/latest` 查最新发布
2. Web search — 官方文档、社区报告
3. Context7 — 库/框架的最新文档（注意 API 限流）
4. `curl -I {url}` — 快速检查 URL 可达性（HEAD 请求优先）
5. `npm view {pkg}` / `pip index versions {pkg}` / `brew info {fmla}` — 包管理器验证
6. Docker Hub API / HuggingFace API / PyPI JSON API — 镜像和模型验证
7. `gh auth status` — 先检查认证状态，再决定是否设 GH_TOKEN

**并行化：** 独立验证项优先并行工具调用；只有用户明确要求或宿主规则允许多 Agent 时才委派子 Agent。

**API 频率限制处理：**
- GitHub API 未认证：60 req/hr。设置 `GH_TOKEN` 或 `GITHUB_TOKEN` 环境变量可获得 5000 req/hr。
- HuggingFace API：`https://huggingface.co/api/models/{user}/{repo}` 查看模型信息，`/tree/main` 查看文件列表。
- PyPI API：`https://pypi.org/pypi/{package}/json` 获取版本信息。

**源冲突解决优先级：** 官方文档 > GitHub README > 官方 Wiki > 社区讨论 > 博客文章。当源冲突时，以优先级高的为准，在报告中注明冲突详情。

### 阶段 3：交叉比对 — 文档间一致性

检查同一参数/描述在不同文件中的表述是否一致：

- 数值参数（节点数、VRAM、版本号）
- 仓库 URL 和安装命令
- 硬件需求描述
- 步骤/流程描述

### 阶段 3.5：确认 — 向用户展示发现

本阶段只适用于通用技术文档审查。真人口播⑤的 CONTENT_CLAIMS 按上面的 AUTONOMOUS_RUN/REVIEW_GATED 合同处理，不在此重复询问。

- `AUDIT_ONLY`：展示发现、证据和最小修复建议，到此停止，不修改任何文件。
- `VERIFY_AND_FIX`：先列出准备修改的声明和证据；若修复会扩大用户指定范围、改变程序行为或需要产品判断，先确认。范围内的普通事实纠错可直接执行。
- `CONTENT_CLAIMS`：按本期运行模式和节点合同处理；不得额外增加一套确认门槛。

需要确认时使用以下格式：

```
### 发现 #1 [CRITICAL]
文件：xxx.py:42  原：`pip instal torch`  应为：`pip install torch`
证据：PyPI 官方文档 https://pypi.org/project/torch/
是否修复？[Y/n]（拒绝时标为"用户否决"，不修复但保留在报告中）
```

### 阶段 4：修复 — 仅限 VERIFY_AND_FIX

`AUDIT_ONLY` 跳过本阶段。`VERIFY_AND_FIX` 按严重度排序修复，每个严重度锚定到可检验的后果：

| 严重度 | 定义 | 示例 |
|-------|------|------|
| CRITICAL | 可证明会导致崩溃或异常 | 仓库不存在、命令语法错误、NameError |
| HIGH | 可证明会导致错误输出/行为 | 参数值错误、VRAM 估算偏差 >20% |
| MEDIUM | 信息不正确但不会改变系统行为 | 版本号过时、失效链接（若无人点击） |
| LOW | 功能正确但表述不精确 | 措辞不统一、格式差异 |

### 阶段 5：出报告

输出格式：

```
## 审查报告

### 统计
- 总声明数：X
- 已验证：X
- 有问题：X（CRITICAL: X / HIGH: X / MEDIUM: X / LOW: X）
- 已修复：X

### 发现的问题
| 文件 | 行 | 原值 | 应为 | 证据来源 | 严重度 | 状态 |
|------|-----|------|------|---------|--------|------|
| ... | ... | ... | ... | ... | ... | 已修/待定/用户否决 |

### 仍需实际验证的项
（需要实际运行环境才能确认的项目）
```

## 关键注意事项

1. **不信任训练知识**：即使是"常识性"的参数值，也要联网验证。模型训练数据有时效性。
2. **验证仓库可用性**：仓库被删除/私有化/改名（如 `user/repo` 突然 404）只有实际查询才能发现，静态分析检测不到。
3. **参数值查官方源**：blocks_to_swap 的推荐值、VRAM 需求，以官方 README/文档为准，不以博客为准。
4. **跨文档同步**：修了一处参数，必须检查所有引用该参数的文件是否也需要更新。
5. **标注不确定项**：无法通过网络验证的（如需要实际硬件测试），在报告中明确标注。
6. **迭代审查**：阶段 4 修复完成后，回到阶段 1 重新扫描修复过的文件，确认修复没有引入新错误。最多迭代 2 轮。
7. **覆盖范围透明**：资源有限时按后果优先核验脚本、配置和高影响声明；报告必须写清已核验、未核验和抽样范围，不能把部分覆盖说成全面完成。
8. **不设机械查询上限**：来源冲突时继续查到能给出结论，或明确标为 `UNVERIFIABLE`/`BLOCKED`。只有任务预算耗尽、外部访问失败或缺少用户信息时才停止；通用审查如实写 `PARTIAL`/`BLOCKED`，CONTENT_CLAIMS 按节点合同写 `BLOCKED`，不能因为没发现严重问题就跳过剩余范围后声称完成。

## 适用项目类型

本 skill 是**外部资源验证器**，不是代码审查器。它验证 URL、版本号、包名、文件路径等可联网查证的外部声明。**无法检测**：未定义变量、类型错误、逻辑缺陷、缺少导入等代码级 bug。

适用场景：
- AI 模型部署方案（ComfyUI、LoRA 训练、推理服务）
- 基础设施配置（Docker、K8s、CI/CD）
- 依赖版本密集的技术项目
- 多文档维护的项目（指南 + 脚本 + 工作流）
- Web 应用后端、移动应用、数据库架构等任何引用外部资源的技术项目

## 审查反模式（不应标记为问题）

以下场景在特定项目环境中是**正常的**，不应标记：
1. **包管理器版本命名空间差异**：brew/apt/pip/npm 各有独立版本号体系，同一个工具在不同包管理器中版本号不同是正常的，不要交叉对比标记"过时"。
2. **平台/环境特定参数**：某些 CLI 参数依赖本地环境（如浏览器 cookie、硬件特定 flag），在其他 OS 上不可用是设计如此，不是错误。
3. **故意使用 shell=True**：某些脚本为了路径展开必须用 `shell=True`，不是安全漏洞。结合上下文判断而非机械标记。
4. **私有/内部包**：内部 npm/pip/cargo 包可能无法在公共注册表中查到，标记为"未公开"而非"不存在"。
5. **文档化的已知问题**：代码注释或文档中已标注"404"/"暂停"/"已废弃"/"TODO"的条目是有意记录，不是待修复的错误。
6. **长时间操作的大超时设置**：音视频处理、大文件下载等操作的超时设置（如 300s+）是必要的，不要按常规 RPC 标准"优化"缩短。
7. **平台特定标准路径**：各 OS 有标准安装路径（macOS `/opt/homebrew`、Linux `/usr/local`、Windows `C:\Program Files`），不应交叉标记。
8. **区域镜像/代理**：`pypi.tuna.tsinghua.edu.cn`、`ghproxy.com` 等是合法镜像，不应标记为"非官方"。
