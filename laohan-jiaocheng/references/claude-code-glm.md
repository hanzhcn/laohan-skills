# Claude Code + 智谱 GLM：国内大模型驱动 AI 编程助手

> 日期: 2026-10-21 | 兼容 Claude Code 2.1.203+（当前最新 2.1.306）、智谱 GLM-5.2 / GLM-5.3 / GLM-4.7

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
| Claude Code | `~/.local/bin/claude`（官方安装），建议版本 ≥ 2.1.203（当前最新 2.1.306） |
| 智谱 API Key | 到 https://open.bigmodel.cn 注册，购买 GLM Coding Plan 套餐 |

### 2. 配置环境变量

编辑 `~/.claude/settings.json`，在 `env` 字段中添加：

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "你的智谱API Key",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5.2[1m]",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5.2[1m]",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.7",
    "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "1000000"
  }
}
```

**环境变量说明：**

| 变量 | 说明 |
|------|------|
| `ANTHROPIC_BASE_URL` | API 端点地址，智谱的 Anthropic 兼容接口 |
| `ANTHROPIC_AUTH_TOKEN` | 智谱 API Key（不是 `ANTHROPIC_API_KEY`，Claude Code 通过变量名区分认证方式） |
| `ANTHROPIC_DEFAULT_*_MODEL` | 将 opus/sonnet/haiku 别名映射到指定模型 |
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW` | 自动压缩窗口，按模型取值：`glm-5.4` 用 `512000`，glm-5.3 系与 `glm-5.2` 用 `1000000`（模型上下文都是 1M，`CLAUDE_CODE_MAX_CONTEXT_TOKENS` 仍为 `1000000`）。该环境变量是全局的，会压过逐模型设置，逐模型写法见「模型切换」节 |

> `glm-5.2[1m]` 的 `[1m]` 后缀用于开启 GLM 1M 上下文；若 Claude Code 提示模型不存在，先升级到最新版本。`glm-4.7` 作为 Haiku 档位承担轻量任务。

> 压缩窗口按模型取值：GLM-5.4 的上下文窗口是 1M，但通过 GLM Coding Plan 使用 GLM-5.4 时，智谱官方建议把客户端上下文窗口设为 `512000` tokens（原话是「建议」，为获得更好的编码效果）；glm-5.3 系与 `glm-5.2` 仍用 `1000000`。自动压缩在窗口减约 33K 处触发：1M 窗口约 967K，512K 窗口约 479K。

> 口径来源：智谱官方安装器 `@z_ai/coding-helper` 0.2.1（2026-11-23 发布）的模型表——`glm-5.4` 对应 512000，其余模型回退 1000000，并固定 `CLAUDE_CODE_MAX_CONTEXT_TOKENS` 为 1000000；国内文档 docs.bigmodel.cn 的 Coding Plan 页面同口径。国际站 docs.z.ai 同页目前仍写 `1000000`，两地文档不一致，按你所用站点的套餐选择。

> `glm-5.4` 的模型名不加 `[1m]` 后缀（国内端点会报模型不存在，`[1m]` 是 5.2/5.3 时代的写法）；国内端点默认即 1M 上下文。

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

# 启动后正常使用，模型名显示为 glm-5.2[1m] / glm-4.7
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

GLM 模型 ID（如 `glm-5.2[1m]`）不匹配 Claude Code 内置的模型模式匹配规则，Claude Code 可能无法自动识别模型支持的功能。

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
|------|------|
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
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5.3",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5.2[1m]",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.7"
  }
}
```

> `CLAUDE_CODE_AUTO_COMPACT_WINDOW` 是全局环境变量，对客户端里所有模型生效，并且会压过逐模型设置。想给不同模型配不同压缩窗口时，改用 settings.json 的 `modelSettings.<模型>.autoCompactWindow`（在 Claude Code 里执行 `/autocompact 512k` 会自动存到该字段，最小值 100000），此时不要设 `CLAUDE_CODE_AUTO_COMPACT_WINDOW`。按模型推荐值：`glm-5.4` 用 `512000`，glm-5.3 系与 `glm-5.2` 用 `1000000`。两处都不设时，Claude Code 用模型上下文窗口减约 33K 作为压缩点（1M 窗口约 967K，512K 窗口约 479K）。Claude Code 无法识别第三方端点背后的真实限制，别把窗口设得比模型实际窗口更大。

---

## 已知限制

| 限制 | 说明 |
|------|------|
| 功能检测降级 | GLM 模型 ID 不匹配 Claude Code 内置模式，需手动声明 `_SUPPORTED_CAPABILITIES` |
| Prompt Caching | GLM 端可能不完全支持 Anthropic 的 caching 协议 |
| 上下文窗口 | GLM 的上下文窗口与 Claude 原生模型不同；用 `CLAUDE_CODE_AUTO_COMPACT_WINDOW` 按实际窗口设置自动压缩阈值 |
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

建议使用 Claude Code 2.1.203 以上版本（当前最新 2.1.306）：

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
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "glm-5.2[1m]",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "glm-5.2[1m]",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "glm-4.7",
    "ANTHROPIC_DEFAULT_OPUS_MODEL_SUPPORTED_CAPABILITIES": "effort,xhigh_effort,thinking,adaptive_thinking",
    "ANTHROPIC_DEFAULT_SONNET_MODEL_SUPPORTED_CAPABILITIES": "effort,thinking,adaptive_thinking",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL_SUPPORTED_CAPABILITIES": "effort,thinking",
    "CLAUDE_CODE_AUTO_COMPACT_WINDOW": "1000000",
    "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
    "API_TIMEOUT_MS": "3000000",
    "BASH_DEFAULT_TIMEOUT_MS": "300000"
  },
  "alwaysThinkingEnabled": true,
  "effortLevel": "high",
  "showThinkingSummaries": true
}
```

> 上面的示例按 `glm-5.2[1m]` 写，`1000000` 对 GLM-5.2 成立。若改用 `glm-5.4`（国内端点模型名不带 `[1m]` 后缀），把三个 `ANTHROPIC_DEFAULT_*_MODEL` 换成 `glm-5.4`，并把 `CLAUDE_CODE_AUTO_COMPACT_WINDOW` 改为 `512000`。

> 需要按模型分别配置压缩窗口时，不要设 `CLAUDE_CODE_AUTO_COMPACT_WINDOW`（它会压过逐模型值），改用 settings.json 顶层的 `modelSettings`；在 Claude Code 里执行 `/autocompact 512k` 也会自动写入这里（最小值 100000）：

```json
{
  "modelSettings": {
    "glm-5.4": {
      "autoCompactWindow": 512000
    }
  }
}
```

---

## 参考资源

- 智谱官方 Claude Code 配置文档: https://docs.bigmodel.cn/cn/guide/develop/claude
- Claude Code 官方模型配置文档: https://code.claude.com/docs/en/model-config
- Claude Code 官方安装方式: `~/.local/bin/claude`（不要用 npm 安装）
- GitHub Issue — 第三方 Provider 支持: https://github.com/anthropics/claude-code/issues/52572
