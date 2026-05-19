# 工具发现方法论文档

> 目的：每次检查时，用这套方法扫描全系统，与 tools.json 做差集，确保不遗漏。
> v2 | 2026-05-12 | 动态检测替代硬编码列表

## 采集源（6+2）

| # | 来源 | 命令 | 预期条目数 |
|---|------|------|-----------|
| 1 | npm global | `npm ls -g --json` | ~10 |
| 2 | brew formula | `brew list --formula --versions` | ~160（含编译依赖） |
| 3 | brew cask | `brew list --cask --versions`（fallback: `ls ~/Library/Casks/`） | ~5 |
| 4 | pip | `pip3 list --format=json` | ~140（含依赖库） |
| 5 | uv tool | `uv tool list` | ~2 |
| 6 | conda | `conda list --json` | ~440（含大量依赖） |
| 7 | 本地二进制 | `ls ~/.local/bin/` + `ls /usr/local/bin/` + `ls ~/.bun/bin/` | ~40 |
| 8 | Claude 生态 | `claude plugins list --json` + `npx skills ls -g` | ~10 |

> **注意**：brew/pip/conda 的原始输出包含大量编译依赖和被拉入的库，不是用户直接使用的工具。必须过滤。

## 过滤方法（v2：动态检测为主，静态兜底为辅）

### 第1层：动态检测（自动，无需维护）

| 来源 | 方法 | 说明 |
|------|------|------|
| brew | `comm -23 <(brew list --formula \| sort) <(brew leaves \| sort)` | `brew leaves` 列出用户主动安装的，其余都是自动拉入的依赖。137 条 |
| pip | `pip3 show <pkg>` → `Required-by` 字段 | Required-by 不为空 = 纯依赖库。107 条 |
| conda | 复用 pip 的 Required-by 结果 | conda 环境 pip 跟踪部分依赖关系 |

### 第2层：静态兜底（覆盖动态检测的盲区）

| 来源 | 盲区原因 | 兜底方法 |
|------|---------|---------|
| brew | `brew leaves` 检测不到的运行时（bash/node@22/python@3.*/ffmpeg-full/zsh-syntax-highlighting） | BREW_RUNTIME_DEPS 集合 |
| pip/conda | conda 环境中 Required-by 为空（pip 不跟踪 conda 安装的包的依赖关系） | PIP_CONDA_LIBS 集合（~50 条） |
| conda | C/C++ 库和基础设施（conda 独有） | CONDA_CPP_INFRA + CONDA_SELF 集合 |
| conda | Python 库（无 CLI 入口点的数据科学/后端库） | conda_known_libs 集合（~250 条） |
| local | 包管理器附带的非独立工具 | LOCAL_SKIP 集合 |

### 第3层：别名匹配

tools.json 中的名字和实际 CLI binary 名可能不同（如 "Claude Code" → `claude`，"huggingface-cli" → `hf`）。需要额外维护别名映射。

## 过滤流程

```
原始采集（~795条）
  │
  ├─ 第1步：与 tools.json 比对
  │   已收录的跳过（含别名匹配）
  │
  ├─ 第2步：动态过滤（brew leaves + pip Required-by）
  │   brew: ~137 自动依赖
  │   pip: ~107 纯依赖库
  │
  ├─ 第3步：静态兜底过滤
  │   BREW_RUNTIME_DEPS: ~6 条
  │   PIP_CONDA_LIBS: ~50 条
  │   CONDA_CPP_INFRA + CONDA_SELF: ~42 条
  │   conda_known_libs: ~250 条
  │   LOCAL_SKIP: ~30 条
  │
  └─ 输出：新发现列表（预期 <10 条，供用户确认）
```

## 验证方法

每次更新 tools.json 后，跑一次差集验证：

```bash
bash scripts/discover.sh references/tools.json
```

**预期结果**：新发现 <10 条，且全部是合理的用户工具候选项。

如果差集过大（>20 条），逐条判断：
1. 是用户直接使用的工具？→ 加入 tools.json
2. 是依赖库？→ 添加到对应的静态兜底集合
3. 不确定？→ 列出来让用户确认

## 已知盲区

1. **conda Required-by 不可靠**：conda 环境中 pip 不跟踪 conda 安装的包的依赖关系，导致 Required-by 为空。需要静态兜底列表补充。
2. **brew leaves 边界**：某些工具既是依赖又可能被用户直接使用（如 deno、llama.cpp），这些已在 tools.json 中收录所以不受影响。
3. **conda 已知库列表需定期维护**：新增的 Python 库可能不在 conda_known_libs 中，导致误报。

## 何时跑发现

- 每次执行 `/laohan-gengxin` 时自动跑一次 discover
- 安装新工具后手动跑一次 `bash scripts/discover.sh`
- 每月定期跑一次，捕获新装的或遗忘的工具
