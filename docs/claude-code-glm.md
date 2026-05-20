# Claude Code + 智谱 GLM：国内大模型驱动 AI 编程助手

> 日期: 2026-05-20 | 基于 Claude Code 2.1.42+ 和智谱 GLM-5.1

---

## 原理

Claude Code 是 Anthropic 的官方 CLI 编程助手。它支持通过 `ANTHROPIC_BASE_URL` 环境变量将 API 请求转发到第三方兼容端点。

智谱提供了 Anthropic Messages API 兼容接口（`/api/anthropic`），因此 Claude Code 可以透明地将 GLM 作为后端使用。

```
Claude Code CLI
    ↓ (Anthropic Messages API)
智谱 GLM 兼容端点
    ↓
https://open.bigmodel.cn/api/anthropic
```

---

## 配置步骤

### 1. 前置条件

| 依赖 | 说明 |
|------|------|
| Claude Code | `~/.local/bin/claude`（官方安装），版本 ≥ 2.1.42 |
| 智谱 API Key | 到 https://open.bigmodel.cn 注册，购买 GLM Coding Plan 套餐 |

### 2. 配置环境变量

编辑 `~/.claude/settings.json`，在 `env` 字段中添加：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "你的智谱API Key",
    "ANTHROPIC_MODEL": "glm-5.1",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5.1",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5.1",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-5.1"
  }
}
```

**环境变量说明：**

| 变量 | 说明 |
|------|------|
| `ANTHROPIC_BASE_URL` | API 端点地址，智谱的 Anthropic 兼容接口 |
| `ANTHROPIC_AUTH_TOKEN` | 智谱 API Key（不是 `ANTHROPIC_API_KEY`，Claude Code 通过变量名区分认证方式） |
| `ANTHROPIC_MODEL` | 默认使用的模型 |
| `ANTHROPIC_DEFAULT_*_MODEL` | 将 opus/sonnet/haiku 别名映射到指定模型 |

> 如果 `settings.json` 中已有 `env` 字段，将上述变量合并进去，不要覆盖已有配置。

### 3. 启动 Claude Code

```bash
claude
```

首次连接时 Claude Code 会询问 "Do you want to use this API key?"，选择 **Yes**。

### 4. 验证

```bash
# 检查版本
claude --version

# 启动后正常使用，模型名显示为 glm-5.1
claude
```

---

## Thinking 模式配置

Claude Code 的 thinking（扩展思考）是核心推理能力。可通过以下方式配置：

### 全局配置

在 `~/.claude/settings.json` 中：

```json
{
  "alwaysThinkingEnabled": true,
  "effortLevel": "high",
  "showThinkingSummaries": true
}
```

### 环境变量控制

| 变量 | 说明 | 示例值 |
|------|------|--------|
| `MAX_THINKING_TOKENS` | 思考 token 上限 | `128000` |
| `CLAUDE_CODE_EFFORT_LEVEL` | 工作量级别 | `high` |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | 最大输出 token | `131072` |

### Effort Level 级别

| 级别 | 适用场景 |
|------|----------|
| `low` | 简单任务，低延迟 |
| `medium` | 成本敏感 |
| `high` | 平衡（推荐日常使用） |
| `xhigh` | 复杂架构决策 |
| `max` | 最深推理（仅当次会话） |

### Thinking 降级机制

GLM 模型 ID（如 `glm-5.1`）不匹配 Claude Code 内置的模型模式匹配规则，Claude Code 可能无法自动识别模型支持的功能。

可通过环境变量显式声明功能支持：

```json
{
  "env": {
    "ANTHROPIC_DEFAULT_OPUS_MODEL_SUPPORTED_CAPABILITIES": "effort,xhigh_effort,thinking,adaptive_thinking",
    "ANTHROPIC_DEFAULT_SONNET_MODEL_SUPPORTED_CAPABILITIES": "effort,thinking,adaptive_thinking",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL_SUPPORTED_CAPABILITIES": "effort,thinking"
  }
}
```

**可用能力值：**

| 值 | 说明 |
|-----|------|
| `effort` | 工作量级别 |
| `xhigh_effort` / `max_effort` | 高级工作量 |
| `thinking` | 扩展思考 |
| `adaptive_thinking` | 自适应推理 |
| `interleaved_thinking` | 工具调用间思考 |

### 会话内快捷键

| 快捷键 | 功能 |
--------|------|
| `Option+T` (macOS) / `Alt+T` (Linux/Windows) | 切换 thinking 开关 |
| `Ctrl+O` | 切换查看完整思考输出 |

---

## 辅助配置

### 禁用非必要流量

```json
{
  "env": {
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS": "1"
  }
}
```

### 超时配置

```json
{
  "env": {
    "API_TIMEOUT_MS": "3000000",
    "BASH_DEFAULT_TIMEOUT_MS": "300000"
  }
}
```

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `API_TIMEOUT_MS` | 600000 (10min) | API 请求超时，复杂任务可调高 |
| `BASH_DEFAULT_TIMEOUT_MS` | 120000 (2min) | Bash 命令默认超时 |

### Prompt Caching

如果 GLM 端不支持 Anthropic 的 prompt caching 协议，可禁用：

```json
{
  "env": {
    "DISABLE_PROMPT_CACHING": "1"
  }
}
```

---

## 模型切换

修改 `ANTHROPIC_DEFAULT_*_MODEL` 即可切换模型，重启 Claude Code 生效：

```json
{
  "env": {
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5.1",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.5-air"
  }
}
```

---

## 已知限制

| 限制 | 说明 |
|------|------|
| 功能检测降级 | GLM 模型 ID 不匹配 Claude Code 内置模式，需手动声明 `_SUPPORTED_CAPABILITIES` |
| Prompt Caching | GLM 端可能不完全支持 Anthropic 的 caching 协议 |
| 上下文窗口 | GLM 的上下文窗口与 Claude 原生模型不同，Claude Code 的上下文管理基于 200K 假设 |
| 模型路由透明度 | 智谱服务端做模型映射，界面显示的模型名与实际运行模型可能不同 |

---

## 常见问题

### 配置不生效

关闭所有 Claude Code 窗口，重新打开终端运行 `claude`。

### JSON 格式错误导致 Claude Code 无法启动

```bash
# 校验 JSON
python3 -c "import json; json.load(open('$HOME/.claude/settings.json'))" && echo "OK" || echo "JSON 错误"
```

### 彻底重置

```bash
# 备份后删除
mv ~/.claude/settings.json ~/.claude/settings.json.bak
# 重新启动 claude 会自动创建新的 settings.json
```

### 版本兼容

建议使用 Claude Code 2.1.42 以上版本：

```bash
claude --version  # 检查
claude update     # 更新
```

---

## 完整配置示例

以下是一个完整的 `~/.claude/settings.json` 示例（仅含 GLM 相关配置，其他配置保留）：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "你的智谱API Key",
    "ANTHROPIC_MODEL": "glm-5.1",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5.1",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5.1",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-5.1",
    "ANTHROPIC_DEFAULT_OPUS_MODEL_SUPPORTED_CAPABILITIES": "effort,xhigh_effort,thinking,adaptive_thinking",
    "ANTHROPIC_DEFAULT_SONNET_MODEL_SUPPORTED_CAPABILITIES": "effort,thinking,adaptive_thinking",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL_SUPPORTED_CAPABILITIES": "effort,thinking",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "API_TIMEOUT_MS": "3000000",
    "BASH_DEFAULT_TIMEOUT_MS": "300000"
  },
  "alwaysThinkingEnabled": true,
  "effortLevel": "high",
  "showThinkingSummaries": true
}
```

---

## 参考资源

- 智谱官方 Claude Code 配置文档: https://docs.bigmodel.cn/cn/guide/develop/claude
- Claude Code 官方模型配置文档: https://docs.claude.com/claude-code/model-config
- Claude Code 官方安装方式: `~/.local/bin/claude`（不要用 npm 安装）
- GitHub Issue — 第三方 Provider 支持: https://github.com/anthropics/claude-code/issues/52572
- 一键启动工具 glm-claude: https://github.com/alchaincyf/glm-claude
