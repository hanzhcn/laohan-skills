#!/usr/bin/env bash
# 采集 Codex 初始化基线；不修改配置，doctor的网络探测按当前CLI与已有授权。
# 仅列配置字段存在性；Doctor使用脱敏JSON，分享前仍审阅输出。
set -u
failures=0

section() {
  printf '\n## %s\n' "$1"
}

run() {
  local label="$1"
  shift
  printf '\n### %s\n' "$label"
  if "$@"; then
    return 0
  else
    local rc=$?
    printf '[check failed: exit=%s; audit incomplete]\n' "$rc" >&2
    failures=$((failures + 1))
  fi
  return 0
}

if [ -n "${CODEX_HOME:-}" ]; then
  code_home="$CODEX_HOME"
elif [ -n "${HOME:-}" ]; then
  code_home="$HOME/.codex"
else
  code_home=""
fi

if [ "$#" -gt 0 ]; then
  if [ "$#" -ne 2 ] || [ "$1" != '--config-root' ] || [ ! -d "$2" ]; then
    printf 'Usage: audit-codex-init.sh [--config-root <existing absolute directory>]\n' >&2
    exit 2
  fi
  case "$2" in
    /*) code_home="$2" ;;
    *) printf 'ERROR: --config-root must be absolute\n' >&2; exit 2 ;;
  esac
fi

section 'Codex executable'
run 'codex --version' codex --version
run 'codex --strict-config doctor --json' codex --strict-config doctor --json

section 'Configuration files'
if [ -n "$code_home" ]; then
  printf 'Config inventory root: %s (does not override the CLI runtime config)\n' "$code_home"
  for file in "$code_home/config.toml" "$code_home"/*.config.toml; do
    [ -f "$file" ] || continue
    printf '%s\n' "$file"
    run 'configuration field inventory' awk '
      /^[[:space:]]*(approval_policy|sandbox_mode|model_reasoning_effort|web_search)[[:space:]]*=/ {
        sub(/[[:space:]]*=.*/, " = <configured; inspect runtime>"); print "  " $0; next
      }
      /^\[projects\./ { print "  project trust entry present"; next }
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
  run 'git status --short' git -C "$git_root" status --short
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

if [ "$failures" -ne 0 ]; then
  printf '\nAudit incomplete: %s required check(s) failed; see original exits above.\n' "$failures" >&2
  exit 1
fi
printf '\nAudit collection complete; command exits passed, project acceptance remains separate.\n'
