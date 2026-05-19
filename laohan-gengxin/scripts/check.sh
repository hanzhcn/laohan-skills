#!/bin/bash
# laohan-gengxin 版本检查脚本
# 读取 tools.json，逐项检查已装版本和最新版本，输出 JSON 结果
# 用法: bash scripts/check.sh [references/tools.json路径]

set -euo pipefail

TOOLS_JSON="${1:-$(dirname "$0")/../references/tools.json}"
RESULTS="[]"

log() { echo "[$(date '+%H:%M:%S')] $*" >&2; }

check_one() {
  local id="$1" name="$2" check_cmd="$3" latest_cmd="$4"
  local installed="" latest="" status="unknown"

  installed=$(eval "$check_cmd" 2>/dev/null | tr -d '\n') || true
  latest=$(eval "$latest_cmd" 2>/dev/null | tr -d '\n') || true

  if [ -z "$installed" ]; then
    installed="not-found"
    status="not-found"
  elif [ -z "$latest" ]; then
    latest="unknown"
    status="check-failed"
  elif [ "$installed" = "$latest" ]; then
    status="latest"
  else
    status="outdated"
  fi

  python3 -c "
import json, sys
r = json.loads('$RESULTS')
r.append({
  'id': $id,
  'name': '''$name''',
  'installed': '''$installed''',
  'latest': '''$latest''',
  'status': '$status'
})
print(json.dumps(r))
" 2>/dev/null
}

# 读取 tools.json 并逐项检查
TOTAL=$(python3 -c "import json; print(len(json.load(open('$TOOLS_JSON'))))" 2>/dev/null || echo 0)

log "检查 $TOTAL 个工具..."

for i in $(seq 0 $((TOTAL - 1))); do
  id=$(python3 -c "import json; print(json.load(open('$TOOLS_JSON'))[$i]['id'])")
  name=$(python3 -c "import json; print(json.load(open('$TOOLS_JSON'))[$i]['name'])")
  check_cmd=$(python3 -c "import json; print(json.load(open('$TOOLS_JSON'))[$i]['check_cmd'])")
  latest_cmd=$(python3 -c "import json; print(json.load(open('$TOOLS_JSON'))[$i]['latest_cmd'])")

  log "[$id] $name ..."
  RESULTS=$(check_one "$id" "$name" "$check_cmd" "$latest_cmd")
done

echo "$RESULTS" | python3 -m json.tool 2>/dev/null || echo "$RESULTS"
log "检查完成"
