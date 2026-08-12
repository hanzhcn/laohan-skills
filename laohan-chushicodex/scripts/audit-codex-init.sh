#!/usr/bin/env bash
# 只读采集 Codex 初始化基线；不联网、不写入、不读取配置中的密钥字段或转储完整环境。
# 输出包含本机路径、codex doctor 摘要和 Git 工作树状态；分享前审阅输出。
set -u

section() {
  printf '\n## %s\n' "$1"
}

run() {
  local label="$1"
  shift
  printf '\n### %s\n' "$label"
  if "$@"; then
    return 0
  fi
  printf '[command returned non-zero; inspect the output above]\n'
  return 0
}

if [ -n "${CODEX_HOME:-}" ]; then
  code_home="$CODEX_HOME"
elif [ -n "${HOME:-}" ]; then
  code_home="$HOME/.codex"
else
  code_home=""
fi

section 'Codex executable'
run 'codex --version' codex --version
run 'codex doctor' codex doctor

section 'Configuration files'
if [ -n "$code_home" ]; then
  printf 'CODEX_HOME: %s\n' "$code_home"
  for file in "$code_home/config.toml" "$code_home"/*.config.toml; do
    [ -f "$file" ] || continue
    printf '%s\n' "$file"
    awk '
      /^[[:space:]]*(approval_policy|sandbox_mode|model_reasoning_effort|web_search)[[:space:]]*=/ { print "  " $0; next }
      /^\[projects\./ { print "  " $0; next }
    ' "$file"
  done
else
  printf 'CODEX_HOME: unavailable (CODEX_HOME and HOME are unset)\n'
fi

section 'Instruction files'
if [ -n "$code_home" ] && [ -f "$code_home/AGENTS.md" ]; then
  printf 'Global: %s\n' "$code_home/AGENTS.md"
else
  printf 'Global: not found\n'
fi

if git_root=$(git rev-parse --show-toplevel 2>/dev/null); then
  printf 'Project root: %s\n' "$git_root"
  for file in "$git_root/AGENTS.md" "$git_root/CLAUDE.md"; do
    [ -f "$file" ] && printf 'Found: %s\n' "$file"
  done
  printf 'Working tree:\n'
  git -C "$git_root" status --short
else
  printf 'Project root: not a Git repository\n'
fi

section 'Project reproducibility signals'
if [ -n "${git_root:-}" ]; then
  for file in package.json pnpm-lock.yaml package-lock.json yarn.lock bun.lockb Cargo.toml Cargo.lock pyproject.toml poetry.lock requirements.txt go.mod go.sum Gemfile.lock; do
    [ -f "$git_root/$file" ] && printf 'Found: %s\n' "$file"
  done
else
  printf 'Skipped: no Git project root\n'
fi

printf '\nAudit complete. Inspect findings before changing configuration.\n'
