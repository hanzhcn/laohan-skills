#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCAN="$ROOT/scripts/redlight-scan.sh"
FIXTURE="$(mktemp -d)"
trap 'rm -rf "$FIXTURE"' EXIT

printf 'input: /Users/example/private/file\n' > "$FIXTURE/absolute.md"
if bash "$SCAN" --profile portable "$FIXTURE/absolute.md" >/dev/null 2>&1; then
  echo "FAIL: portable 应拒绝个人绝对路径" >&2
  exit 1
fi
if bash "$SCAN" --profile local "$FIXTURE/absolute.md" >/dev/null 2>&1; then
  echo "FAIL: local 也应拒绝个人绝对路径" >&2
  exit 1
fi

printf 'install: ~/.claude/skills/demo\n' > "$FIXTURE/runtime-path.md"
if bash "$SCAN" --profile portable "$FIXTURE/runtime-path.md" >/dev/null 2>&1; then
  echo "FAIL: portable 应拒绝无分支的 runtime 专属安装路径" >&2
  exit 1
fi
bash "$SCAN" --profile local "$FIXTURE/runtime-path.md" >/dev/null

bash "$SCAN" --profile portable "$ROOT" >/dev/null
echo "PASS redlight scan regression"
