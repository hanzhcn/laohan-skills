# ECC 插件安装维护完全指南

> 更新: 2026-10-28 | 最新发布 v2.2.3；rules 用法核对 main `25278e7d7b6cf6e6a4e7a6c8e10f14ff22f0eb5b`

---

## 概述

ECC (everything-claude-code) 是 Claude Code 最全面的功能增强插件，提供：

| 组件 | 数量 | 加载方式 |
|------|------|----------|
| Agents | 68 | 目录自动扫描（`agents/`） |
| Skills | 293 | plugin.json 声明目录（`skills/`） |
| Commands | 94 | plugin.json 声明目录（`commands/`，legacy command shims） |
| Hooks | 24 | `hooks/hooks.json`（常驻自动加载） |

> 计数以 v2.2.3 为准；上游主分支可能领先于发布版本，升级后以实际缓存目录为准。

**仓库**: https://github.com/affaan-m/ECC（旧地址会重定向）

---

## 安装

以下命令仅适用于完全未安装 ECC 的机器。当前官方 marketplace.json 的 `name` 和插件名均为 `ecc`，所以全新注册后使用 `ecc@ecc`。已有 ECC 时先读 `claude plugin list --json`，沿用实际 `plugin@marketplace` 和 scope；本机现有标识为 `ecc@everything-claude-code`、scope 为 `user`，跳过下列安装块，不另外安装 `ecc@ecc`。

```bash
# 1. 注册 ECC 市场（只需一次；已注册过可跳过）
claude plugins marketplace add affaan-m/ECC

# 2. 刷新市场索引
claude plugins marketplace update

# 3. 安装
claude plugins install ecc@ecc

# 4. 启用
claude plugins enable ecc@ecc

# 5. 重启 Claude Code 会话
```

> 用 `claude plugins marketplace list` 可确认市场是否已注册（ECC 的市场名显示为 `ecc`）。跳过第 1 步就安装会报 unknown marketplace。

安装后自动获得 agents、skills、commands、hooks。**但 rules 需要单独复制**（见下文）。插件本体只通过 Claude Code 插件更新；从同一已安装包同步 rules 是配套步骤，不是再装一套 ECC。

---

## Rules 分发

### 为什么需要手动复制

Claude Code 插件系统**不支持把包内 rules 自动加载为规则**。全局规则放 `~/.claude/rules/ecc/`，单个项目的规则放 `<项目>/.claude/rules/ecc/`。不要移动或修改插件缓存里的原件。

rules 是持续加入上下文的标准；skills 在任务需要时调用。ECC 官方建议从 `common` 加一个实际使用的语言/框架包起步。Claude 会递归发现 `.md`；没有 `paths` frontmatter 的规则启动时加载，目录名 `python/` 本身不表示只在 Python 任务生效。若需按文件匹配，应另行配置 `paths`，或使用项目范围。用户规则与项目规则保持一致，不能把目录层级当作强制覆盖机制。

### 复制步骤

```bash
# 示例针对 user scope：从安装登记获取唯一真实路径，不按 mtime 猜缓存
ECC_ROOT="$(python3 - <<'PY'
import json
from pathlib import Path
data = json.loads((Path.home() / '.claude/plugins/installed_plugins.json').read_text())
roots = [Path(row['installPath'])
         for key, rows in data.get('plugins', {}).items() if key.split('@', 1)[0] == 'ecc'
         for row in rows if row.get('scope') == 'user']
if len(roots) != 1 or not (roots[0] / 'rules/common').is_dir():
    raise SystemExit('无法定位唯一 user ECC；请检查 claude plugin list --json')
print(roots[0])
PY
)" || exit 1

# 新装示例；目标已有规则时先备份并比较，不能直接覆盖定制文件
mkdir -p ~/.claude/rules/ecc
cp -R "$ECC_ROOT/rules/common" ~/.claude/rules/ecc/
# 按实际技术栈选择一个，例如：
# cp -R "$ECC_ROOT/rules/typescript" ~/.claude/rules/ecc/
# cp -R "$ECC_ROOT/rules/python" ~/.claude/rules/ecc/
```

保留 `ecc/common/`、`ecc/typescript/`、`ecc/python/` 目录结构。**禁止平铺 `rules/*/*.md`**：这些包有同名文件，会相互覆盖，还会破坏 `../common/` 引用。已有平铺旧副本需逐项核对：原样副本备份后迁移，定制版本保留或人工合并，不叠加重复加载。

本机 2026-10-28 核验：全局层有 5 份与当前插件 common 完全相同的平铺规则；`performance.md` 为同名不同内容，另有自研规则。该次只修教程，没有移动或覆盖生效规则；不能把没有完整 `ecc/common/` 目录等同于完全未加载规则。

### 为什么不用 symlink

Claude Code 支持规则 symlink，但 ECC 缓存路径含 marketplace 和版本号。固定链接不会自动指向新版本，旧缓存被清理后还可能悬空；因此这里用复制并在升级后核对同步。

---

## Hooks 加载机制

### 三种注册方式

| 方式 | 加载时机 | 作用范围 |
|------|---------|----------|
| `hooks/hooks.json`（插件内） | 常驻 | 插件启用时始终生效 |
| `plugin.json` 的 hooks 字段 | 常驻 | 宿主支持；当前 ECC 已用默认 hooks 文件，不要再次注册同一文件 |
| SKILL.md frontmatter | 技能激活时 | 仅当该 skill 被调用时生效 |

### 合并关系

`settings.json` 的 hooks 和插件的 `hooks/hooks.json` 是**合并关系**，不是覆盖。两者同时生效。

这意味着：**不要把插件 hooks 复制到 settings.json**，否则每个 hook 会被执行两次。

### 运行时控制

```bash
# 控制 hook 严格度（三选一：minimal / standard / strict，默认 standard）
export ECC_HOOK_PROFILE=standard

# 临时禁用特定 hook
export ECC_DISABLED_HOOKS=hook-id1,hook-id2
```

---

## 升级维护 6 步清单

每次 ECC 发布新版本后执行：

### 步骤 1: 刷新市场索引

```bash
# 市场未注册时先执行：claude plugins marketplace add affaan-m/ECC
claude plugins marketplace update
```

### 步骤 2: 更新插件

```bash
# 本机沿用已有安装；其他机器替换成清单中的实际标识及 scope
claude plugin update ecc@everything-claude-code --scope user
```

> **注意 plugin@marketplace 标识**：插件标识格式是 `plugin_name@marketplace_key`。用仓库地址添加市场时，marketplace key 取 marketplace.json 里的 `name`（ECC 为 `ecc`），插件名也是 `ecc`，所以完整标识是 `ecc@ecc`。如果你的 `~/.claude/plugins/known_marketplaces.json` 里 key 是别的值（旧版 CLI 或从其他来源注册过），命令中的后半段要换成该 key。
>
> 没有 `update --all` 命令，只能逐个更新。

### 步骤 3: 核对并同步 rules

重新执行上文的 `ECC_ROOT` 定位，读取升级后实际生效包；不要按版本字符串相同就推断源码相同。备份现有 rules，对已选包比较新增、修改和删除文件，再按 `ecc/common/` 加语言目录同步；简单复制会留下上游已删除的文件，因此还要核对清单。保留定制规则及自研文件，不全量删除 `~/.claude/rules/`，不叠加旧平铺副本。

插件更新不会自动更新这些副本；rules 从同一已安装插件取用，由人工或已授权维护任务同步。同步后新开会话，在 `/memory` 核对规则发现，在 `/context` 检查上下文占用；目录存在不等于规则已经加载，也不等于模型必然遵守。

### 步骤 4: 检查 settings.json 有无 ECC hooks 残留

```bash
# 查找可能残留的 ECC hook 名称
grep -E 'run-with-flags|session-start-bootstrap|plugin-hook-bootstrap' ~/.claude/settings.json
```

如果有，手动编辑 settings.json 删除这些 hook 条目。只保留你自己的自定义 hooks。

### 步骤 5: 清理旧脚本

```bash
# 检查 scripts 目录中是否有不再使用的脚本
ls ~/.claude/scripts/
```

只保留 settings.json 中 hooks 引用的脚本。

### 步骤 6: 重启生效

```bash
# 重启 Claude Code 会话
exit  # 退出当前会话
claude  # 重新启动
```

---

## 常见坑与解决方案

### 坑 1: Hooks 重复执行

**现象**: 同一个 hook 被执行两次，`CLAUDE_PLUGIN_ROOT` 解析错误。

**原因**: `install.sh` 旧版会把 `hooks/hooks.json` 的内容复制到 `settings.json`。Claude Code 会同时加载两者的 hooks，导致重复执行。

**解决**: settings.json 只放自定义 hooks，ECC hooks 由插件自动加载。

### 坑 2: 跑了 install.sh

**现象**: 安装插件后又跑 `./install.sh --profile full`，导致技能重复、rules 冲突。

**原因**: 插件本体和完整手工安装是两条路径，叠加会产生重复。当前插件路径只另外同步所选 rules。

**解决**: 不要跑 install.sh。插件安装后按上面步骤复制 rules 即可。

### 坑 3: plugin.json 声明 hooks

**现象**: `Duplicate hook file detected` 错误。

**原因**: 当前 ECC 已由默认目录加载 `hooks/hooks.json`，再次指向同一文件可能触发重复检测；这不表示宿主不支持 manifest hooks 字段。

**解决**: plugin.json 中不要添加 hooks 字段。

### 坑 4: MCP 服务器过多

**现象**: 上下文窗口被大量 system prompt 占用。

**原因**: 每个启用的 MCP 服务器都在 system prompt 中占 token。

**解决**: 控制 5-8 个 MCP 服务器以内。ECC 提供 34 个 MCP 配置（`mcp-configs/mcp-servers.json`），只选择需要的启用。

---

## 关键文件路径

| 文件 | 路径 |
|------|------|
| 插件 plugin.json | `<实际 installPath>/.claude-plugin/plugin.json` |
| 插件 hooks | `<实际 installPath>/hooks/hooks.json` |
| 插件缓存 | `~/.claude/plugins/cache/<marketplace>/ecc/<VERSION>/`，以安装登记为准 |
| 已安装插件信息 | `~/.claude/plugins/installed_plugins.json` |
| 用户配置 | `~/.claude/settings.json` |
| 用户 rules | `~/.claude/rules/` |
| MCP 配置库 | 插件缓存目录下 `mcp-configs/mcp-servers.json` |

---

## 插件管理命令速查

```bash
# 查看已安装
claude plugins list [--json]

# 查看市场可用
claude plugins list --json --available

# 刷新市场索引
claude plugins marketplace update

# 更新插件
claude plugins update <plugin>

# 卸载
claude plugins uninstall <plugin> -y

# 启用/禁用
claude plugins enable <plugin>
claude plugins disable <plugin>

# 清理无用依赖
claude plugins prune [-y]

# 验证插件结构
claude plugins validate <path>
```

**注意**: 非交互模式必须加 `-y`（如 `uninstall` 和 `prune`）。

---

## plugin.json 结构参考

```json
{
  "name": "ecc",
  "version": "2.2.3",
  "skills": ["./skills/"],
  "commands": ["./commands/"],
  "mcpServers": {}
}
```

注意：
- `agents` 不需要声明，目录自动扫描
- 当前 ECC 的 `hooks` 不需要再次声明，`hooks/hooks.json` 自动加载；宿主也支持 manifest hooks 配置
- 包内 `rules` 不自动生效，需单独放进 Claude 的 rules 目录

---

## 参考资源

- ECC 当前安装说明: https://github.com/affaan-m/ECC#claude-code-details
- ECC rules 结构与复制说明: https://github.com/affaan-m/ECC/blob/main/rules/README.md
- Claude Code 规则加载与 paths: https://code.claude.com/docs/en/memory#organize-rules-with-clauderules
- Claude Code 插件系统官方文档: https://code.claude.com/docs/en/plugins
- ECC MCP 配置以实际插件版本为准：`<实际 installPath>/mcp-configs/`
