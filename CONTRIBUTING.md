# 贡献指南

感谢你对 laohan-skills 的关注！欢迎提交新 Skill、修复 Bug 或改进文档。

## 快速开始

1. Fork 本仓库
2. 创建分支：`git checkout -b feature/your-skill-name`
3. 提交更改
4. 发起 Pull Request

## Skill 结构规范

每个 Skill 是一个独立目录，包含 `SKILL.md`（必须）和可选的子目录：

```
laohan-你的skill名/
├── SKILL.md              ← 必须，定义 skill 的行为
├── references/           ← 可选，参考资料
├── scripts/              ← 可选，辅助脚本
└── assets/               ← 可选，静态资源
```

### SKILL.md 格式

```markdown
---
name: laohan-你的skill名
description: 一句话描述功能。包含使用场景和触发词。
---

# Skill 标题

## 使用
/skill-name [参数]

## 执行流程
（详细步骤）
```

**关键要求**：
- `name` 必须以 `laohan-` 开头
- `description` 要包含触发场景和触发词，方便 Claude Code 自动匹配
- 不包含硬编码绝对路径（用 `~` 或相对路径）
- 不包含 API key 或敏感信息
- SKILL.md 控制在 500 行以内

## 提交前检查

- [ ] `SKILL.md` 有 frontmatter（name + description）
- [ ] 无硬编码绝对路径（`/Users/xxx`）
- [ ] 无 API key / token / 密码
- [ ] 已在本地 Claude Code 中测试触发

## Bug 报告

提交 Issue 时请包含：
- 触发方式（自然语言 or `/skill-name`）
- 期望行为 vs 实际行为
- Claude Code 版本（`claude --version`）
- 操作系统（macOS / Linux / Windows）

## License

提交的贡献将按 MIT 协议发布。
