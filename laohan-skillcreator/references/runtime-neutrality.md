# Runtime 适配性（跨 agent 中立）

skill 应 runtime 中立（Claude Code / Cursor / Codex / OpenClaw 都能装），不硬编码单一平台。

## 红灯模式（推送前扫描，命中需修复）

grep 这些 = 平台绑定（runtime 不中立）：
- `在 Claude Code` / `Claude Code skill` / `Claude Code 用户`
- `Cursor only` / `Codex 中` / `只在 Cursor`
- `~/.claude/skills/[a-z]`（硬编码 Claude Code 路径）
- `/plugin install`（特定平台命令）

## 例外（红灯命中但允许）

- frontmatter 的触发词（用户口语，可提平台名）
- 明确标注的 "## Claude Code 专属" 章节（限定范围）
- commit message / 注释里的说明

## 扫描方法

```bash
bash scripts/redlight-scan.sh
```

命中 > 0 且不在例外清单 → 优化流程强制 P0 修复（darwin runtime gate）。

## 修复方向

把硬编码路径/命令替换为通用描述：
- `~/.claude/skills/` → "你的 agent skills 目录"
- `在 Claude Code` → "在你的 agent 里"
- `/plugin install` → "按你的 agent 平台安装方式"
