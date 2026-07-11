#!/bin/bash
set -euo pipefail

PROFILE="portable"
if [[ "${1:-}" == "--profile" ]]; then
  PROFILE="${2:-}"
  shift 2
fi
if [[ "$PROFILE" != "portable" && "$PROFILE" != "local" ]]; then
  echo "用法: bash scripts/redlight-scan.sh --profile portable|local [skill-dir ...]" >&2
  exit 2
fi

if [[ "$#" -eq 0 ]]; then
  TARGETS=("SKILL.md" "references")
else
  TARGETS=("$@")
fi

PATTERN='/Users/[^ /]+'
if [[ "$PROFILE" == "portable" ]]; then
  PATTERN+='|~/\.(claude|agents)/skills/[A-Za-z0-9_-]+|Claude Code only|仅限 Claude Code|Cursor only|只在 Cursor|/plugin install'
fi

echo "=== runtime 红灯扫描: profile=$PROFILE targets=${TARGETS[*]} ==="
HITS=$(grep -rnE \
  --exclude='runtime-neutrality.md' \
  --exclude='blacklist-phrases.md' \
  --exclude='redlight-scan.sh' \
  --exclude='test-redlight-scan.sh' \
  -- "$PATTERN" "${TARGETS[@]}" 2>/dev/null || true)

if [[ -z "$HITS" ]]; then
  echo "PASS: 无字面 runtime 红灯"
  exit 0
fi

COUNT=$(printf '%s\n' "$HITS" | grep -c . || true)
echo "FAIL: 命中 $COUNT 处字面红灯；修复、改用 local profile，或将必要专属行为改为显式 capability branch："
printf '%s\n' "$HITS"
exit 1
