# Runtime 适配性

Agent Skills 的核心是 `SKILL.md` + 按需资源，但 Claude Code、Codex、Cursor、OpenClaw 等宿主的 frontmatter 允许字段、安装目录、打包方式、子 agent 与工具能力不相同。目标是 **runtime-aware**，不是假设所有宿主完全中立。

## Profile

1. `portable`：跨宿主发布。frontmatter 只用目标规范的公共字段；安装、package、subagent 和 browser 等能力使用显式 capability branch。
2. `local`：只服务已知本机/仓库。允许 `~/Documents/...` 等稳定约定，但仍禁止 `/Users/<name>/...`、secret 和无声外部副作用。

评分前必须选 profile。未声明时按 `portable` 审查。

## 红灯

- 个人绝对路径：`/Users/<name>/...`；
- portable profile 中无 capability branch 的专属安装路径或命令；
- “仅限某 runtime”但 description 声称通用；
- 缺少能力时继续假装已执行。

明确标注的 runtime-specific 分支、frontmatter 触发词和用于说明的反例不是红灯。

## 验证

```bash
bash <laohan-skillcreator-dir>/scripts/redlight-scan.sh --profile portable <skill-dir>
bash <laohan-skillcreator-dir>/scripts/redlight-scan.sh --profile local <skill-dir>
```

脚本只能发现字面红灯，不能证明跨 runtime 可用。portable skill 还要在每个声称支持的宿主至少运行一个触发和一个执行样本；未跑的宿主标 `UNVERIFIED`。
