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

FATAL_PATTERN='/Users/[^ /]+'
WARNING_PATTERN=''
if [[ "$PROFILE" == "portable" ]]; then
  WARNING_PATTERN='~/\.(claude|agents)/skills/[A-Za-z0-9_-]+|Claude Code only|仅限 Claude Code|Cursor only|只在 Cursor|/plugin install'
fi

echo "=== runtime 红灯扫描: profile=$PROFILE targets=${TARGETS[*]} ==="
FATAL_HITS=$(grep -rnE \
  --exclude='runtime-neutrality.md' \
  --exclude='blacklist-phrases.md' \
  --exclude='redlight-scan.sh' \
  --exclude='test-redlight-scan.sh' \
  -- "$FATAL_PATTERN" "${TARGETS[@]}" 2>/dev/null || true)

if [[ -n "$FATAL_HITS" ]]; then
  COUNT=$(printf '%s\n' "$FATAL_HITS" | grep -c . || true)
  echo "FAIL: 命中 $COUNT 处 fatal runtime 红灯："
  printf '%s\n' "$FATAL_HITS"
  exit 1
fi

if [[ -n "$WARNING_PATTERN" ]]; then
  WARNING_HITS=$(grep -rnE \
    --exclude='runtime-neutrality.md' \
    --exclude='blacklist-phrases.md' \
    --exclude='redlight-scan.sh' \
    --exclude='test-redlight-scan.sh' \
    -- "$WARNING_PATTERN" "${TARGETS[@]}" 2>/dev/null || true)
  if [[ -n "$WARNING_HITS" ]]; then
    COUNT=$(printf '%s\n' "$WARNING_HITS" | grep -c . || true)
    echo "WARN: 命中 $COUNT 处 portable 专属字面模式；人工确认是否已有 capability branch："
    printf '%s\n' "$WARNING_HITS"
  fi
fi

echo "PASS: 无 fatal runtime 红灯"
