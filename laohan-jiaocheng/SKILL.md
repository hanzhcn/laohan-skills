---
name: laohan-jiaocheng
description: 教程路由器。输入关键词加载对应配置教程并按步骤引导安装。覆盖 5 个教程：claude-mem 跨会话记忆、CLAUDE.md 配置指南、Chrome Gemini 侧边栏修复、Claude Code + 智谱 GLM、ECC 插件安装维护。触发场景：(1) 用户说"教程""怎么配置""安装教程""怎么装"(2) 用户提到具体工具名如"claude-mem""ecc""glm""gemini侧边栏"。使用场景：初次配置工具时按步骤引导+验证。
argument-hint: [教程关键词，如 claude-mem / ecc / glm / gemini / claude-md]
---

# 老韩教程路由

根据关键词加载对应教程，按步骤引导用户完成配置，关键步骤验证结果。

## 路由表

| 关键词匹配 | 教程文件 | 一句话说明 |
|-----------|---------|-----------|
| "claude-mem"/"litellm"/"记忆"/"健忘" | `references/claude-mem-litellm.md` | claude-mem + LiteLLM 让 Claude Code 用国产模型实现跨会话记忆 |
| "CLAUDE.md"/"claude-md"/"配置指南"/"四个原则" | `references/claude-md-guide.md` | CLAUDE.md 四个核心原则（想清楚再动手/能50行别200行/只改该改的/目标驱动执行） |
| "gemini"/"侧边栏"/"chrome gemini" | `references/gemini-sidebar-fix.md` | Chrome Gemini 侧边栏国内修复（Mac + Windows 双平台） |
| "glm"/"智谱"/"claude-code-glm"/"国产模型" | `references/claude-code-glm.md` | Claude Code 接入智谱 GLM 作为后端 |
| "ecc"/"插件"/"everything-claude-code" | `references/ecc-plugin-guide.md` | ECC 插件安装、rules 分发、hooks 加载机制 |

## 执行逻辑

1. **匹配教程**：从用户输入提取关键词，按路由表确定目标教程
2. **加载教程**：读取 `references/<对应文件>.md` 全文
3. **分步引导**：将教程内容按步骤呈现，每步完成后用户确认再进入下一步
4. **验证**：关键步骤执行后验证结果（服务启动、配置生效、命令可用）
5. **完成**：输出配置总结 + 下一步建议

## 教程源与同步

教程源文件在 `~/Documents/laohan-skills/docs/` 维护。本 skill 的 `references/` 是同步副本。

**更新流程**：
1. 修改 `docs/*.md`（源文件）
2. `cp docs/*.md laohan-jiaocheng/references/`（同步）
3. 如有新教程，同步后更新本路由表
4. `git add && git commit && git push`

**同步检查**（每次使用时执行）：
- 验证 `references/` 下 5 个文件均存在
- 如文件缺失，提示先同步：`cd ~/Documents/laohan-skills && cp docs/*.md laohan-jiaocheng/references/`
