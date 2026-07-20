# claude-mem + LiteLLM：用国产大模型驱动 Claude Code 跨会话记忆

> 版本: v3.1 | 日期: 2026-06-10 | 作者: laohanAI & Jeffrey
> 录制教学用，每一步都必须可复现
>
> 项目地址:
> - **claude-mem**: https://github.com/thedotmack/claude-mem — Claude Code 跨会话持久记忆
> - **LiteLLM**: https://github.com/BerriAI/litellm — 100+ LLM 统一 API 网关

---

## 零、执行流程（给 AI 助手读）

本教程按以下顺序执行，AI 助手严格按流程走，遇到 `[暂停]` 标记时停下来等用户操作。

```
步骤 0  环境检查          → AI 自动执行
步骤 1  安装 LiteLLM      → AI 自动执行
步骤 2  安装 claude-mem   → [暂停] 用户手动操作（交互式安装，AI 无法代替）
步骤 3  创建 config.yaml  → AI 自动执行
步骤 4  Patch URL         → AI 自动执行
步骤 5  配置 settings     → [暂停] AI 问用户要 API Key，然后自动写入
步骤 6  启动 LiteLLM      → AI 自动执行（用步骤5获取的 Key）
步骤 7  重启 worker       → AI 自动执行
验证    全部检查           → AI 自动执行
```

### 步骤 2 用户操作详情

AI 助手在这里暂停，告诉用户：

> "请在你的终端中运行 `npx claude-mem install`，安装过程会弹出交互提示，按以下方式选择："

| 序号 | 提示内容 | 用户选择 | 说明 |
|------|---------|---------|------|
| 1 | 选择 IDE | **Claude Code** | |
| 2 | Runtime 类型 | **worker**（直接回车） | 默认项，回车即可 |
| 3 | Provider | **openrouter** | 必须选这个，后续 patch 依赖此选项 |
| 4 | API Key | 输入 `sk-litellm-local` | 随便填的非空字符串，不填会报错 |
| 5 | Model | **直接回车**（默认） | 后面步骤 5 会覆盖 |

安装完成后，AI 助手继续执行步骤 3。

### API Key 获取时机

在步骤 5（配置 settings）时，AI 助手暂停并询问用户：

> "请提供你的大模型 API Key（至少需要一个）："
> - 智谱 API Key：到 https://open.bigmodel.cn 注册获取（Coding 套餐）
> - DeepSeek API Key：到 https://platform.deepseek.com 注册获取

用户提供 Key 后，AI 助手将其写入步骤 6 的环境变量中（`export ZAI_API_KEY=xxx`），Key **不会写入配置文件**（config.yaml 用的是 `os.environ/` 引用）。

---

## 一、方案原理

```
Claude Code 会话
    ↓ (PostToolUse hook)
claude-mem worker (端口 37700+UID%100，见下方说明)
    ↓ (OpenAI 格式 HTTP 请求)
LiteLLM Proxy (端口 4000)    ← 我们要改的就是这步的 URL
    ↓ (翻译成各家 API 协议)
DeepSeek / GLM-5.1 / 任意模型
```

**端口说明**: Worker 端口 = `37700 + (你的系统 UID % 100)`。macOS 典型 UID 501 → 端口 **37701**；Linux 典型 UID 1000 → 端口 **37700**。不确定时运行 `echo $((37700 + $(id -u) % 100))` 查看。也可在 settings.json 中通过 `CLAUDE_MEM_WORKER_PORT` 固定端口。下文用 `{PORT}` 表示你的实际端口。

**核心思路**: claude-mem 的 OpenRouter Provider 用标准 OpenAI `/v1/chat/completions` 格式请求。我们把它的目标 URL 从 `openrouter.ai` 改成本地 LiteLLM，LiteLLM 再翻译成 DeepSeek/GLM 的协议。

**可行性依据**:
- claude-mem 源码 `OpenRouterProvider.ts` 中 URL 是硬编码常量，编译后打包进 `worker-service.cjs`
- LiteLLM 支持 `zai/glm-5.1`（智谱）和 `openai/deepseek-v4-flash`（DeepSeek，通过 `openai/` 前缀透传模型名），暴露 OpenAI 兼容端点
- 请求格式（model、messages、temperature、max_tokens）完全一致

**已知限制**:
- GLM-5 的 `enable_thinking` 推理模式无法通过 LiteLLM 激活（[Issue #25697](https://github.com/BerriAI/litellm/issues/25697)）
- 每次 claude-mem 更新后需要重新 patch，并同时检查 installed cache 与 marketplace plugin 两处 worker
- claude-mem 硬编码了 `temperature: 0.3`、`max_tokens: 4096`，不可配置（已通过 `drop_params: True` 兼容）

---

## 二、环境要求

| 依赖 | 最低版本 | 用途 | 检查命令 |
|------|---------|------|----------|
| Claude Code | 最新 | 主力 IDE | `claude --version` |
| Node.js | ≥20.0.0 | claude-mem 运行时（package.json 要求 ≥20） | `node --version` |
| Bun | 任意 | claude-mem worker 进程（缺失时安装器自动装） | `bun --version` |
| uv | 任意 | 向量搜索依赖（缺失时安装器自动装） | `uv --version` |
| SQLite 3 | 任意 | 持久化存储（通常系统自带） | `sqlite3 --version` |
| Python | ≥3.10 | LiteLLM | `python3 --version` |
| curl | 任意 | 测试 API | `curl --version` |

### 步骤 0: 环境检查（AI 助手先跑这个）

AI 助手在开始安装前，运行以下脚本检查所有依赖是否就绪：

```bash
echo "=== 环境检查 ==="
PASS=true

# Node.js
if command -v node &>/dev/null; then
  NODE_VER=$(node -v | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
  if [ "$NODE_MAJOR" -lt 20 ]; then
    echo "❌ Node.js: $NODE_VER (需要 ≥20.0.0)"
    PASS=false
  else
    echo "✅ Node.js: $NODE_VER"
  fi
else
  echo "❌ Node.js 未安装 → 需要安装: brew install node 或 nvm install 22"
  PASS=false
fi

# Bun
if command -v bun &>/dev/null; then
  echo "✅ Bun: $(bun --version)"
else
  echo "❌ Bun 未安装 → 需要安装: curl -fsSL https://bun.sh/install | bash"
  PASS=false
fi

# uv
if command -v uv &>/dev/null; then
  echo "✅ uv: $(uv --version)"
else
  echo "❌ uv 未安装 → 需要安装: brew install uv"
  PASS=false
fi

# Python
if command -v python3 &>/dev/null; then
  echo "✅ Python: $(python3 --version)"
else
  echo "❌ Python3 未安装 → 需要安装: brew install python"
  PASS=false
fi

# SQLite 3
if command -v sqlite3 &>/dev/null; then
  echo "✅ SQLite: $(sqlite3 --version | head -1)"
else
  echo "❌ SQLite3 未安装 → 通常系统自带，如缺失: brew install sqlite"
  PASS=false
fi

# curl
if command -v curl &>/dev/null; then
  echo "✅ curl: 已安装"
else
  echo "❌ curl 未安装"
  PASS=false
fi

# LiteLLM（如果已装则跳过步骤1）
if command -v litellm &>/dev/null; then
  echo "✅ LiteLLM: 已安装（跳过步骤 1）"
else
  echo "⚠️  LiteLLM 未安装 → 将在步骤 1 安装"
fi

echo ""
if $PASS; then
  echo "✅ 环境检查通过，可以开始安装"
else
  echo "❌ 环境检查未通过，请先安装缺失的依赖"
fi
```

---

## 三、安装步骤

### 步骤 1: 安装 LiteLLM

```bash
# 用 uv 安装（推荐，快）
uv tool install 'litellm[proxy]'

# 或用 pip
pip install 'litellm[proxy]'

# 验证
litellm --version
```

### 步骤 2: 安装 claude-mem（⚠️ 用户手动操作，选择方式见上方「步骤 2 用户操作详情」）

```bash
npx claude-mem install
```

安装完成后，AI 助手继续执行步骤 3。

安装完成后验证：

```bash
# 查看你的实际端口
PORT=$((37700 + $(id -u) % 100))
echo "你的 claude-mem 端口: $PORT"

# 检查 worker 状态
npx claude-mem status

# 健康检查（替换 $PORT 为上面输出的数字）
curl -s http://localhost:$PORT/api/health

# 浏览器打开 Web UI
open http://localhost:$PORT
```

### 步骤 3: 配置 LiteLLM

创建配置文件：

```bash
mkdir -p ~/.claude-mem/litellm
cat > ~/.claude-mem/litellm/config.yaml << 'EOF'
# LiteLLM 全局设置
litellm_settings:
  # 丢弃模型不支持的参数（如 temperature、max_tokens），
  # 避免 claude-mem 发出的参数被国产模型拒绝
  drop_params: True

model_list:
  # 智谱 GLM-5.1（Coding 套餐，专属端点）
  # Coding 端点: https://open.bigmodel.cn/api/coding/paas/v4（注意不是通用端点）
  # 通用端点: https://open.bigmodel.cn/api/paas/v4（非 Coding 场景用）
  - model_name: glm-5.1
    litellm_params:
      model: zai/glm-5.1
      api_base: https://open.bigmodel.cn/api/coding/paas/v4
      api_key: os.environ/ZAI_API_KEY

  # DeepSeek V4 Flash（便宜快速）
  # 使用 openai/ 前缀 + 显式 api_base，让 LiteLLM 直接透传模型名
  # 不用 deepseek/ 前缀，因为 deepseek-v4-flash 的原生支持 PR 未合并
  - model_name: deepseek-v4-flash
    litellm_params:
      model: openai/deepseek-v4-flash
      api_base: https://api.deepseek.com/v1
      api_key: os.environ/DEEPSEEK_API_KEY

  # DeepSeek V4 Pro（旗舰，75%折扣至 2026-05-31）
  - model_name: deepseek-v4-pro
    litellm_params:
      model: openai/deepseek-v4-pro
      api_base: https://api.deepseek.com/v1
      api_key: os.environ/DEEPSEEK_API_KEY
EOF
```

### 步骤 4: Patch claude-mem 的 OpenRouter URL（⚠️ 最关键一步）

**这是最关键的一步**。claude-mem 的 `worker-service.cjs` 硬编码了 `https://openrouter.ai/api/v1/chat/completions`，即使配置了本地 LiteLLM，请求仍会发到公网 OpenRouter。`sk-litellm-local` key 在公网会 401，导致 observation 写不进去——**这就是"新窗口上下文永远是同一批旧数据"的根因**。

```bash
# 修补两个可能的 worker 来源：installed cache + marketplace plugin。
# 只修 cache 会产生假阳性：cache 已 patched，但实际运行 worker 可能仍来自 marketplace。
python3 - <<'PY'
import json
from pathlib import Path

old = 'https://openrouter.ai/api/v1/chat/completions'
new = 'http://localhost:4000/v1/chat/completions'
paths = []

installed = Path.home() / '.claude/plugins/installed_plugins.json'
if installed.exists():
    data = json.loads(installed.read_text())
    item = data.get('plugins', {}).get('claude-mem@thedotmack', [{}])[0]
    install_path = item.get('installPath')
    if install_path:
        paths.append(Path(install_path) / 'scripts/worker-service.cjs')

paths.append(Path.home() / '.claude/plugins/marketplaces/thedotmack/plugin/scripts/worker-service.cjs')

seen = set()
for path in paths:
    if path in seen or not path.exists():
        continue
    seen.add(path)
    text = path.read_text()
    patched = text.replace(old, new)
    if patched != text:
        path.with_suffix(path.suffix + '.bak').write_text(text)
        path.write_text(patched)
    final = path.read_text()
    print(path)
    print('  openrouter=', final.count(old), 'localhost=', final.count(new))
PY

# 重启 worker（必须重启才能生效；也可等新会话 hook 自动拉起）
pkill -f "worker-service.cjs" || true
```

**持久化自动 patch 脚本**：当前个人环境使用 `~/.claude-mem/hooks/auto-patch.sh`，在 Claude Code `SessionStart` 自动执行。脚本应同时覆盖 installed cache 和 marketplace plugin 两处路径；无补丁需求时保持静默。

### 步骤 5: 配置 claude-mem Settings

编辑 `~/.claude-mem/settings.json`，确保包含以下字段（**与安装时生成的配置合并，不要全量替换**）：

```json
{
  "CLAUDE_MEM_PROVIDER": "openrouter",
  "CLAUDE_MEM_OPENROUTER_API_KEY": "sk-litellm-local",
  "CLAUDE_MEM_OPENROUTER_MODEL": "glm-5.1",
  "CLAUDE_MEM_MODE": "code--zh",
  "CLAUDE_MEM_OPENROUTER_MAX_CONTEXT_MESSAGES": "20",
  "CLAUDE_MEM_OPENROUTER_MAX_TOKENS": "100000",
  "CLAUDE_MEM_CONTEXT_OBSERVATIONS": "30",
  "CLAUDE_MEM_CHROMA_ENABLED": "true",
  "CLAUDE_MEM_LOG_LEVEL": "INFO"
}
```

**核心字段说明**:

| 字段 | 值 | 说明 |
|------|---|------|
| `CLAUDE_MEM_PROVIDER` | `openrouter` | 必须选这个（走 OpenAI 兼容协议） |
| `CLAUDE_MEM_OPENROUTER_API_KEY` | 任意非空字符串 | LiteLLM 本地不校验，但 claude-mem 检查非空 |
| `CLAUDE_MEM_OPENROUTER_MODEL` | `glm-5.1` | 对应 LiteLLM config.yaml 中的 model_name |
| `CLAUDE_MEM_MODE` | `code--zh` | 中文编码模式（其他: `code` 英文, `code--ja` 日文, `code--es` 西班牙文） |
| `CLAUDE_MEM_CONTEXT_OBSERVATIONS` | `30` | 会话开始时注入的历史观察数（默认 50，可调低节省 token） |
| `CLAUDE_MEM_OPENROUTER_MAX_CONTEXT_MESSAGES` | `20` | 每次调用发送的最大上下文消息数（控制 token 消耗） |
| `CLAUDE_MEM_OPENROUTER_MAX_TOKENS` | `100000` | 每次调用的最大 token 预算（上游模型会自行限制） |
| `CLAUDE_MEM_CHROMA_ENABLED` | `true` | 向量搜索（默认开启，需 uv 已安装） |
| `CLAUDE_MEM_LOG_LEVEL` | `INFO` | 日志级别（调试时可改为 `DEBUG`） |

**验证 settings.json 格式**（JSON 语法错误会导致 worker 启动失败）：

```bash
python3 -c "import json; json.load(open('$HOME/.claude-mem/settings.json'))" && echo "JSON 格式正确" || echo "JSON 格式错误，请检查"
```

**注意**: claude-mem 安装器会自动设置 `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`（写入 `~/.claude/settings.json` 的 env 字段），禁用 Claude Code 自带的 auto-memory，避免两套记忆系统冲突。这是正常行为。

### 步骤 6: 启动 LiteLLM Proxy

```bash
# 设置 API Key（按需选择）
export ZAI_API_KEY="你的智谱API Key"
export DEEPSEEK_API_KEY="你的DeepSeek API Key"

# 创建日志目录
mkdir -p ~/.claude-mem/logs

# 启动（后台运行，仅监听本地回环地址）
nohup litellm --config ~/.claude-mem/litellm/config.yaml --port 4000 --host 127.0.0.1 > ~/.claude-mem/logs/litellm.log 2>&1 &

# 记录 PID
echo $! > ~/.claude-mem/litellm.pid
echo "LiteLLM PID: $(cat ~/.claude-mem/litellm.pid)"
```

### 步骤 7: 重启 claude-mem Worker

```bash
# 停止旧 worker
npx claude-mem stop

# 等 2 秒
sleep 2

# 重启（hook 也会自动触发，但手动更可靠）
npx claude-mem start

# 验证
npx claude-mem status
```

---

## 四、验证清单

### 4.1 LiteLLM 可用性

```bash
# 测试 GLM-5.1
curl -s http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "glm-5.1",
    "messages": [{"role": "user", "content": "你好，回复OK即可"}],
    "temperature": 0.3,
    "max_tokens": 100
  }' | python3 -m json.tool

# 测试 DeepSeek V4 Flash
curl -s http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v4-flash",
    "messages": [{"role": "user", "content": "Hello, just reply OK"}],
    "temperature": 0.3,
    "max_tokens": 100
  }' | python3 -m json.tool
```

**预期**: 返回包含 `choices[0].message.content` 的 JSON。

### 4.2 Patch 验证

```bash
python3 - <<'PY'
import json
from pathlib import Path
old = 'https://openrouter.ai/api/v1/chat/completions'
new = 'http://localhost:4000/v1/chat/completions'
data = json.loads((Path.home() / '.claude/plugins/installed_plugins.json').read_text())
paths = [
    Path(data['plugins']['claude-mem@thedotmack'][0]['installPath']) / 'scripts/worker-service.cjs',
    Path.home() / '.claude/plugins/marketplaces/thedotmack/plugin/scripts/worker-service.cjs',
]
for path in paths:
    text = path.read_text()
    print(path)
    print('  openrouter=', text.count(old), 'localhost=', text.count(new))
PY
# 预期：两处都是 openrouter=0 / localhost=1
```

### 4.3 端到端验证

```bash
# 先确认你的端口
PORT=$((37700 + $(id -u) % 100))

# 1. 确认 LiteLLM 在跑
curl -s http://localhost:4000/health

# 2. 确认 claude-mem worker 在跑
curl -s http://localhost:$PORT/api/health

# 3. 打开 Claude Code，开始一次新会话
# 4. 执行一个简单操作（如 ls）
# 5. 查看 claude-mem 日志，确认 observation 已写入
tail -20 ~/.claude-mem/logs/claude-mem-$(date +%Y-%m-%d).log

# 6. 打开 Web UI 查看记忆流
open http://localhost:$PORT
```

### 4.4 核心组件验证

```bash
PORT=$((37700 + $(id -u) % 100))

# A. Hooks — 确认 6 个生命周期 hook 已注册
cat ~/.claude/plugins/marketplaces/thedotmack/plugin/hooks/hooks.json | python3 -m json.tool
# 预期: 看到 SessionStart、UserPromptSubmit、PreToolUse、PostToolUse、Stop、SessionEnd

# B. SQLite 数据库 — 确认建表成功
sqlite3 ~/.claude-mem/claude-mem.db "PRAGMA integrity_check;"
# 预期: ok

sqlite3 ~/.claude-mem/claude-mem.db "SELECT name FROM sqlite_master WHERE type='table';"
# 预期: 包含 observations、sessions 等表

# C. MCP 搜索工具 — 确认 API 端点可用
curl -s "http://localhost:$PORT/api/search?query=test&limit=5" | python3 -m json.tool
# 预期: 返回 JSON（初始可能为空列表，正常）

# C2. MCP 注册验证 — 确认 Claude Code 已加载 mcp-search
claude mcp list 2>/dev/null | grep mcp-search
# 预期: 看到 mcp-search 条目（插件 .mcp.json 自动注册，无需手动添加）
# 如果没有: 重启 Claude Code 会话后再次检查
# MCP 工具（search/timeline/get_observations）在会话中自动可用

# D. Chroma 向量搜索 — 确认未报错
grep -i "chroma" ~/.claude-mem/logs/worker-$(date +%Y-%m-%d).log | tail -5
# 如果看到 "Chroma not available" 或连接错误，不影响使用（降级为 SQLite FTS5）
# 确认 uv 已安装（Chroma 依赖）: which uv

# E. Viewer UI — 确认可访问
curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/
# 预期: 200
```

### 4.5 模型切换验证

改 `~/.claude-mem/settings.json` 中的 `CLAUDE_MEM_OPENROUTER_MODEL`：

```json
"CLAUDE_MEM_OPENROUTER_MODEL": "deepseek-v4-flash"
```

然后重启 worker，观察日志中的模型名称是否切换。

---

## 五、日常管理命令

### 启动

> **启动顺序**: 必须先启动 LiteLLM，再启动 claude-mem worker。Worker 启动后会立即尝试连接 LiteLLM，如果 LiteLLM 没就绪，worker 会报 OpenRouter API error。

```bash
# 1. 先启动 LiteLLM
nohup litellm --config ~/.claude-mem/litellm/config.yaml --port 4000 --host 127.0.0.1 > ~/.claude-mem/logs/litellm.log 2>&1 &
echo $! > ~/.claude-mem/litellm.pid

# 2. 再启动 claude-mem worker（或等 hook 自动触发）
npx claude-mem start
```

### 停止

```bash
# 停 claude-mem
npx claude-mem stop

# 停 LiteLLM
kill $(cat ~/.claude-mem/litellm.pid) 2>/dev/null
```

### 状态检查

```bash
# claude-mem 状态
npx claude-mem status

# LiteLLM 状态
curl -s http://localhost:4000/health

# 查看日志
tail -f ~/.claude-mem/logs/litellm.log
tail -f ~/.claude-mem/logs/worker-$(date +%Y-%m-%d).log
```

### 模型切换（无需重启 LiteLLM）

```bash
# 编辑 settings
vi ~/.claude-mem/settings.json
# 改 CLAUDE_MEM_OPENROUTER_MODEL: "glm-5.1" → "deepseek-v4-flash"

# 重启 worker
npx claude-mem stop && sleep 2 && npx claude-mem start
```

---

## 六、升级 claude-mem 后的维护

**⚠️ 每次升级后必须重新 patch，否则"上下文永远是旧的"问题会复现。**

```bash
# 方式 A: npx 更新（会覆盖 worker-service.cjs）
npx claude-mem install

# 方式 B: 插件管理器更新（同样会覆盖）
claude plugins update claude-mem@thedotmack

# 无论哪种方式，更新后立即重新 patch
~/.claude-mem/hooks/auto-patch.sh

# 检查 settings 是否被覆盖（偶尔会被重置）
grep "CLAUDE_MEM_PROVIDER" ~/.claude-mem/settings.json
grep "CLAUDE_MEM_OPENROUTER_MODEL" ~/.claude-mem/settings.json
```

---

## 七、已知风险与注意事项

> 本方案基于社区实践和源码分析，以下风险请提前了解。

### 7.1 claude-mem Token 消耗

claude-mem 每次 hook 触发都会调用 LLM 生成 observation。一次 Claude Code 会话可能触发数十次。使用国产模型（GLM-5.1 / DeepSeek V4 Flash）成本极低（每次 < ¥0.01），但仍需关注。

**建议**: 先用 `deepseek-v4-flash`（最便宜），确认稳定后再考虑 `glm-5.1` 或 `deepseek-v4-pro`。

### 7.2 进程管理

claude-mem worker 不会随系统自启动，只在 Claude Code 启动时通过 SessionStart hook 触发。LiteLLM 也不会自启动。

**建议**: 如果机器重启，需手动先启动 LiteLLM，再启动 Claude Code（触发 worker）。或将 LiteLLM 配置为 launchd 服务。

### 7.3 LiteLLM 参数兼容性

claude-mem 硬编码发送 `temperature: 0.3` 和 `max_tokens: 4096`。部分国产模型可能不支持这些参数或范围不同。`config.yaml` 中的 `drop_params: True` 已处理此问题——LiteLLM 会自动丢弃模型不支持的参数。

### 7.4 升级后 patch 失效

每次 `npx claude-mem install` 或 `claude plugins update claude-mem@thedotmack` 更新后，`worker-service.cjs` 会被覆盖，patch 失效。必须重新执行 `~/.claude-mem/hooks/auto-patch.sh`，并确认 installed cache 与 marketplace plugin 两处都已替换。**症状：升级后发现新窗口上下文永远是旧的 → 基本可以确定 patch 被覆盖了。**

### 7.5 GLM Coding 端点限制

Coding 端点 `https://open.bigmodel.cn/api/coding/paas/v4` 仅限 Coding 场景。如果需要通用场景（非 coding），需切换到通用端点 `https://open.bigmodel.cn/api/paas/v4`。

---

## 八、常见问题

### Q1: LiteLLM 报 401 Unauthorized

401 通常来自上游模型服务商（智谱/DeepSeek），不是 LiteLLM 本身。LiteLLM 本地不校验 `sk-litellm-local`，它只是透传到上游。所以 401 说明你的 API Key 无效或过期。

```bash
# 检查环境变量是否设置
echo $ZAI_API_KEY
echo $DEEPSEEK_API_KEY

# 直接测试上游 API（绕过 LiteLLM，定位是 Key 问题还是网络问题）
curl -s https://open.bigmodel.cn/api/coding/paas/v4/chat/completions \
  -H "Authorization: Bearer $ZAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"glm-5.1","messages":[{"role":"user","content":"hi"}]}'
```

### Q2: Patch 后 URL 长度不一致怎么办

原 URL: `https://openrouter.ai/api/v1/chat/completions`（45字符）
新 URL: `http://localhost:4000/v1/chat/completions`（41字符）

**sed 替换是字符串对字符串的，不影响二进制结构。** worker-service.cjs 是文本文件（JavaScript），sed 替换后内容正确即可。

**注意**: 教程中 `sed -i ''` 是 macOS 语法。Linux 用户请去掉 `''`，改为 `sed -i 's|...|...|g'`。

### Q3: LiteLLM 连不上智谱/DeepSeek

```bash
# 直接测试 API 连通性（Coding 端点）
curl -s https://open.bigmodel.cn/api/coding/paas/v4/chat/completions \
  -H "Authorization: Bearer $ZAI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"glm-5.1","messages":[{"role":"user","content":"hi"}]}'

curl -s https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer $DEEPSEEK_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"hi"}]}'
```

### Q4: claude-mem 日志显示 "OpenRouter API error" 或新窗口上下文永远是旧的

**这是最常见的问题，有两层原因：**

1. **LiteLLM 没启动**（`curl http://localhost:4000/health` 确认）。机器重启后 LiteLLM 不自启动。
2. **Patch 被覆盖**（更隐蔽）。升级 claude-mem 后 `worker-service.cjs` 被覆盖，请求又发到公网 OpenRouter，`sk-litellm-local` key 401。**症状：LiteLLM 明明在跑，但 observation 写不进去，上下文永远是同一批旧数据。**

```bash
# 一键诊断：installed cache 与 marketplace plugin 都应只有 localhost:4000，没有 openrouter.ai
python3 - <<'PY'
import json
from pathlib import Path

home = Path.home()
installed = json.loads((home / '.claude/plugins/installed_plugins.json').read_text())
install_path = Path(installed['plugins']['claude-mem@thedotmack'][0]['installPath'])
files = [
    install_path / 'scripts/worker-service.cjs',
    home / '.claude/plugins/marketplaces/thedotmack/plugin/scripts/worker-service.cjs',
]
for f in files:
    s = f.read_text()
    print(f'{f}: openrouter={s.count("https://openrouter.ai/api/v1/chat/completions")} localhost={s.count("http://localhost:4000/v1/chat/completions")}')
PY
# 预期: 两行都为 openrouter=0 localhost=1
# 如果看到 openrouter>0 → 重新执行 patch: ~/.claude-mem/hooks/auto-patch.sh
```

### Q5: 想切回 OpenRouter

不推荐切回。若确实要切回，不能只恢复 cache；需要同时恢复 installed cache 与 marketplace plugin 两处备份，否则运行中的 worker 可能仍走 localhost 或 OpenRouter，状态不一致。

```bash
python3 - <<'PY'
import json
from pathlib import Path

home = Path.home()
installed = json.loads((home / '.claude/plugins/installed_plugins.json').read_text())
install_path = Path(installed['plugins']['claude-mem@thedotmack'][0]['installPath'])
files = [
    install_path / 'scripts/worker-service.cjs',
    home / '.claude/plugins/marketplaces/thedotmack/plugin/scripts/worker-service.cjs',
]
for f in files:
    bak = Path(str(f) + '.bak')
    if not bak.exists():
        raise SystemExit(f'缺少备份: {bak}')
    f.write_text(bak.read_text())
    print(f'已恢复: {f}')
PY

# 改 settings
# CLAUDE_MEM_OPENROUTER_API_KEY: 你的真实 OpenRouter Key
# CLAUDE_MEM_OPENROUTER_MODEL: xiaomi/mimo-v2-flash:free
```

### Q6: MCP 搜索工具（search/timeline/get_observations）看不到

MCP 工具由插件的 `plugin/.mcp.json` 自动注册，不需要手动 `claude mcp add`。如果看不到：

1. 确认插件已安装: `ls ~/.claude/plugins/marketplaces/thedotmack/plugin/.mcp.json`
2. **重启 Claude Code 会话**（MCP 在会话启动时加载）
3. 确认 worker 在运行: `curl http://localhost:$((37700 + $(id -u) % 100))/api/health`
4. MCP server 是 stdio 类型，通过内部 HTTP 调用 worker API，所以 worker 必须先启动

### Q7: 端口 4000 已被占用

```bash
# 查看谁占用了 4000 端口
lsof -i :4000

# 解决方案 1: 杀掉占用进程
kill -9 $(lsof -ti :4000)

# 解决方案 2: 换端口（比如改为 4001）
# 启动时加 --port 4001
litellm --config ~/.claude-mem/litellm/config.yaml --port 4001 --host 127.0.0.1
# 同时 patch 脚本中的 4000 也要改为 4001，重新执行 patch
```

### Q8: 卸载

```bash
# 1. 卸载 claude-mem
npx claude-mem uninstall

# 2. 清理数据目录
rm -rf ~/.claude-mem

# 3. 清理 Claude Code settings 中的残留
# 手动编辑 ~/.claude/settings.json，删除:
#   - enabledPlugins 中的 claude-mem 条目
#   - env.CLAUDE_CODE_DISABLE_AUTO_MEMORY

# 4. 卸载 LiteLLM
uv tool uninstall litellm
# 或 pip uninstall litellm
```

---

## 十、文件清单

安装完成后，涉及的所有文件：

| 文件 | 说明 |
|------|------|
| `~/.claude/plugins/cache/thedotmack/claude-mem/<版本号>/` | claude-mem 插件缓存目录（版本号会变） |
| `~/.claude/plugins/cache/thedotmack/claude-mem/<版本号>/scripts/worker-service.cjs` | Worker 主进程（patch 目标） |
| `~/.claude/plugins/cache/thedotmack/claude-mem/<版本号>/scripts/worker-service.cjs.bak` | 备份（patch 脚本创建） |
| `~/.claude/plugins/marketplaces/thedotmack/plugin/hooks/hooks.json` | 6 个生命周期 hook |
| `~/.claude/plugins/cache/thedotmack/claude-mem/<版本号>/scripts/mcp-server.cjs` | MCP 搜索服务器 |
| `~/.claude/plugins/marketplaces/thedotmack/plugin/skills/mem-search/` | mem-search 技能 |
| `~/.claude/plugins/marketplaces/thedotmack/plugin/ui/viewer.html` | Web UI 查看器 |
| `~/.claude-mem/settings.json` | 所有配置 |
| `~/.claude-mem/claude-mem.db` | SQLite 数据库（observations/sessions） |
| `~/.claude-mem/chroma/` | Chroma 向量数据库（自动创建） |
| `~/.claude-mem/litellm/config.yaml` | LiteLLM 配置 |
| `~/.claude-mem/hooks/auto-patch.sh` | SessionStart 自动 patch 脚本，覆盖 installed cache 与 marketplace plugin 两处 worker |
| `~/.claude-mem/litellm.pid` | LiteLLM 进程 PID |
| `~/.claude-mem/logs/claude-mem-YYYY-MM-DD.log` | claude-mem 日志 |
| `~/.claude-mem/logs/litellm.log` | LiteLLM 日志 |

---

## 十一、架构速查图

```
                    ┌─────────────────┐
                    │  Claude Code    │
                    │  (你的终端)      │
                    └────────┬────────┘
                             │ PostToolUse hook
                             ▼
                    ┌─────────────────┐
                    │  claude-mem     │
                    │  worker:{PORT}  │
                    └────────┬────────┘
                             │ HTTP POST (OpenAI 格式)
                             │ ★ URL 已改为 localhost:4000
                             ▼
                    ┌─────────────────┐
                    │  LiteLLM Proxy  │
                    │  127.0.0.1:4000 │
                    └──┬──────────┬───┘
                       │          │
              ┌────────▼──┐  ┌───▼────────────┐
              │ 智谱 GLM         │  │ DeepSeek              │
              │ zai/glm-5.1      │  │ openai/deepseek-v4-flash│
              │ Coding端点        │  │ api.deepseek          │
              └────────────┘  └────────────────┘
```
