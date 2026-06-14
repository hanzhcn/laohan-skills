#!/bin/bash
# runtime 红灯扫描：检测 skill 是否硬编码单一平台（Claude Code/Cursor/Codex）
# 用法：bash scripts/redlight-scan.sh [目标文件或目录，默认 SKILL.md + references/]
# 命中需人工确认是否在例外清单（frontmatter 触发词/标注章节/注释）

TARGET="${1:-SKILL.md references/}"
PATTERNS="在 Claude Code|Claude Code skill|Claude Code 用户|Cursor only|Codex 中|只在 Cursor|~/\.claude/skills/[a-z]|/plugin install"

echo "=== runtime 红灯扫描: $TARGET ==="
HITS=$(grep -rnE "$PATTERNS" $TARGET 2>/dev/null || true)
if [ -z "$HITS" ]; then
  echo "✅ 无红灯命中（runtime 中立）"
  exit 0
else
  COUNT=$(echo "$HITS" | grep -c . || true)
  echo "⚠️  命中 $COUNT 处，需人工确认是否在例外清单："
  echo "$HITS"
  echo ""
  echo "例外：frontmatter 触发词 / 明确标注的专属章节 / 注释说明"
  exit 1
fi
