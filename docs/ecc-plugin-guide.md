# ECC 插件安装维护完全指南

> 日期: 2026-10-21 | 基于 ECC (everything-claude-code) v2.2.3+

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

**仓库**: https://github.com/affaan-m/everything-claude-code

---

## 安装

```bash
# 1. 注册 ECC 市场（只需一次；已注册过可跳过）
claude plugins marketplace add affaan-m/everything-claude-code

# 2. 刷新市场索引
claude plugins marketplace update

# 3. 安装
claude plugins install ecc@ecc

# 4. 启用
claude plugins enable ecc@ecc

# 5. 重启 Claude Code 会话
```

> 用 `claude plugins marketplace list` 可确认市场是否已注册（ECC 的市场名显示为 `ecc`）。跳过第 1 步就安装会报 unknown marketplace。

安装后自动获得 agents、skills、commands、hooks。**但 rules 需要手动复制**（见下文）。

---

## Rules 分发

### 为什么需要手动复制

Claude Code 插件系统**不支持通过插件分发 rules**。这是上游限制。Rules 必须手动复制到 `~/.claude/rules/`。

### 复制步骤

```bash
# 定位 ECC 缓存目录（版本号会变）
ECC_ROOT=$(ls -td ~/.claude/plugins/cache/ecc/ecc/*/ | head -1)
echo "ECC 根目录: $ECC_ROOT"

# 放进独立子目录，更新时整体替换（~/.claude/rules 支持递归加载子目录）
mkdir -p ~/.claude/rules/ecc
rm -f ~/.claude/rules/ecc/*.md

# 复制通用规则，按需追加语言规则
cp "$ECC_ROOT"/rules/common/*.md ~/.claude/rules/ecc/
# 例如 Python：cp "$ECC_ROOT"/rules/python/*.md ~/.claude/rules/ecc/
```

### 为什么不用 symlink

ECC 缓存路径包含版本号：`~/.claude/plugins/cache/ecc/ecc/2.2.3/`。版本更新后路径变了，symlink 会断掉。

---

## Hooks 加载机制

### 三种注册方式

| 方式 | 加载时机 | 作用范围 |
|------|---------|----------|
| `hooks/hooks.json`（插件内） | 常驻 | 插件启用时始终生效 |
| `plugin.json` 内联 hooks 字段 | 常驻 | **已废弃**，会触发重复检测错误 |
| SKILL.md frontmatter | 技能激活时 | 仅当该 skill 被调用时生效 |

### 合并关系

`settings.json` 的 hooks 和插件的 `hooks/hooks.json` 是**合并关系**，不是覆盖。两者同时生效。

这意味着：**不要把插件 hooks 复制到 settings.json**，否则每个 hook 会被执行两次。

### 运行时控制

```bash
# 控制 hook 严格度
export ECC_HOOK_PROFILE=minimal|standard|strict

# 临时禁用特定 hook
export ECC_DISABLED_HOOKS=hook-id1,hook-id2
```

---

## 升级维护 6 步清单

每次 ECC 发布新版本后执行：

### 步骤 1: 刷新市场索引

```bash
# 市场未注册时先执行：claude plugins marketplace add affaan-m/everything-claude-code
claude plugins marketplace update
```

### 步骤 2: 更新插件

```bash
claude plugins update ecc@ecc
```

> **注意 plugin@marketplace 标识**：插件标识格式是 `plugin_name@marketplace_key`。用仓库地址添加市场时，marketplace key 取 marketplace.json 里的 `name`（ECC 为 `ecc`），插件名也是 `ecc`，所以完整标识是 `ecc@ecc`。如果你的 `~/.claude/plugins/known_marketplaces.json` 里 key 是别的值（旧版 CLI 或从其他来源注册过），命令中的后半段要换成该 key。
>
> 没有 `update --all` 命令，只能逐个更新。

### 步骤 3: 重新复制 rules

```bash
ECC_ROOT=$(ls -td ~/.claude/plugins/cache/ecc/ecc/*/ | head -1)

# 整体替换，避免旧版本规则残留
mkdir -p ~/.claude/rules/ecc
rm -f ~/.claude/rules/ecc/*.md
cp "$ECC_ROOT"/rules/common/*.md ~/.claude/rules/ecc/
# 如使用语言规则，同样重新复制：
# cp "$ECC_ROOT"/rules/python/*.md ~/.claude/rules/ecc/
```

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

**原因**: install.sh 是给纯手动安装用的。插件安装后只需手动复制 rules。

**解决**: 不要跑 install.sh。插件安装后按上面步骤复制 rules 即可。

### 坑 3: plugin.json 声明 hooks

**现象**: `Duplicate hook file detected` 错误。

**原因**: Claude Code 自动加载 `hooks/hooks.json`，在 plugin.json 中再声明会重复。

**解决**: plugin.json 中不要添加 hooks 字段。

### 坑 4: MCP 服务器过多

**现象**: 上下文窗口被大量 system prompt 占用。

**原因**: 每个启用的 MCP 服务器都在 system prompt 中占 token。

**解决**: 控制 5-8 个 MCP 服务器以内。ECC 提供 27 个 MCP 配置（`mcp-configs/mcp-servers.json`），只选择需要的启用。

---

## 关键文件路径

| 文件 | 路径 |
|------|------|
| 插件 plugin.json | `~/.claude/plugins/cache/ecc/ecc/<VERSION>/.claude-plugin/plugin.json` |
| 插件 hooks | `~/.claude/plugins/cache/ecc/ecc/<VERSION>/hooks/hooks.json` |
| 插件缓存 | `~/.claude/plugins/cache/ecc/ecc/<VERSION>/` |
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
- `hooks` 不需要声明，`hooks/hooks.json` 自动加载
- `rules` 不能通过插件分发

---

## 参考资源

- ECC 仓库: https://github.com/affaan-m/everything-claude-code
- Claude Code 插件系统官方文档: https://code.claude.com/docs/en/plugins
- ECC MCP 配置以实际插件版本为准：`~/.claude/plugins/cache/ecc/ecc/<VERSION>/mcp-configs/`
