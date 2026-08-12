# 初始化依据

以当前官方文档和本机 `codex --help` 为配置语义的最终依据。下列材料用于解释为什么采用轻量基线，不作为版本锁定或命令替代。

- OpenAI, [How OpenAI uses Codex](https://openai.com/business/guides-and-resources/how-openai-uses-codex/): 将清晰 issue、`AGENTS.md`、环境与测试命令作为可复用 harness 的组成部分。
- OpenAI, [Running Codex safely](https://openai.com/index/running-codex-safely/): 使用 sandbox 与审批机制限制副作用；不要把权限边界当作效率障碍。
- OpenAI, [Harness engineering](https://openai.com/index/harness-engineering/): 用小而可维护的项目指令和可靠的验证环境提高 agent 的产出质量。
- Simon Willison, [Setting up a codebase for working with coding agents](https://simonwillison.net/2025/Oct/25/coding-agent-tips/): 优先自动化测试、开发服务器和高信息量失败输出；大量文档不是首要投资。

## 更新规则

更新本 Skill 的配置建议前，重新核对官方 Codex 文档、当前 CLI 帮助和至少两份原始使用材料。将平台事实、个人偏好和历史经验分开写；不要依据转载、营销清单或单一作者把任何插件、模型、MCP、权限策略设为默认值。
