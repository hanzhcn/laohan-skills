---
name: laohan-sousuo
version: 1.0.1
description: 老韩联网搜索查证——开发中不确定的技术问题先查再判断，三路检索（官方文档/GitHub issue/社区心得）+ 来源标注输出。优先级高于其他搜索类 skill。Use when 用户说"上网搜""上网搜索""搜索""搜索教程""查心得""搜一下""查一下""帮我查""查证""先查再说""别凭记忆""别人怎么解决""踩坑""最佳实践"，或开发/写代码/技术判断前对 API 用法、库版本行为、配置项语义、报错归因、兼容性不确定时。与 laohan-jiaocheng 等搜索类 skill 冲突时本 skill 优先（Jeffrey 2026-10-02 拍板）。
argument-hint: [搜索问题，如 "Tauri 怎么拿 HttpOnly cookie" / "为什么报 XXX 错"]
---

# 老韩搜索（laohan-sousuo）

联网查证引擎：不确定的技术问题先查再判断，结论必须带来源标注。

沿当前全局开发合同与项目授权执行；用户明确指定的工具/项目专用入口优先，普通技术检索再按本方法分流。先绑定项目真实版本、平台、接口与问题发生时间；按匹配版本原始资料判断，新版文档不能直接覆盖旧版事实或授权升级。已有本地复现的自家纯逻辑问题不强迫无关联网；社区心得作为线索，技术结论回到官方文档、原始issue/源码或真实入口证据。

## 为什么存在

Jeffrey 2026-10-02指出开发中凭记忆判断外部行为会出错。本skill负责“怎么查”，共同要求以当前全局AGENTS/DEV_RULES与项目合同为准；旧Claude workflow/hook记录只作宿主历史，不建立第二规则真源或推断各宿主每轮已加载。

## 优先级与让位

普通搜索类意图优先命中本 skill，由本 skill 内部路由工具：

| 意图 | 归属 |
|------|------|
| 上网搜 / 搜索 / 搜教程 / 查心得 / 查证 / 查一下怎么用 | **本 skill**（其他搜索 skill 让位） |
| 装软件 / 配置工具（claude-mem、ECC 等 5 个本地教程） | laohan-jiaocheng |
| AI 资讯 / 日报 / 热点 | aihot |
| 平台内容下载、评论、博主数据 | laohan-xiazai |
| 视频号下载、JS 渲染/反爬抓取降级 | 见 `~/.claude/rules/cli-tools.md` 总路由 |

## 三路检索（按问题类型选路线）

| 问题类型 | 路线 | 动作 |
|---------|------|------|
| API 用法 / 配置语义 / 参数含义 | 官方文档 | anysearch search（`--content_types doc`）→ 命中官方 URL → anysearch extract 读原文 |
| 报错归因 / 版本兼容 / "为什么不行" | GitHub issue | `gh search issues "关键词" --repo owner/repo`、`gh api repos/:owner/:repo/releases`；issue 比搜索引擎准（2026-09-30 实证：WebSearch 自我怀疑误判，gh 逐一核验 9 个 issue 全真实） |
| "别人怎么解决" / 踩坑心得 / 最佳实践 | 社区心得 | anysearch（含 reddit/blog 结果）→ agent-reach（平台）→ WebFetch 读原文 |

问题跨类时（如"这个 API 为什么报错"）issue + 官方文档并查，交叉印证。

## 工具链与降级

0. **外部环境适配**（本机没有 anysearch / 上述 hook 语境不适用时）：三路检索的**方法论不变**，只换引擎——官方文档路：`WebFetch` 读官方 URL（或 `curl -sL "https://r.jina.ai/<官方URL>"`）；GitHub issue 路：`gh search issues`（外部装 [gh](https://cli.github.com/) 即可，与引擎无关）；社区心得路：原生 WebSearch，被限/无原生搜索时用 `curl -sL "https://html.duckduckgo.com/html/?q=<query>"` 或 SearXNG 公共实例。**输出合同（来源标注/版本日期）在任何环境下都强制**。零依赖兜底命令详见 laohan-xiazai 的「外部环境自举」节。

1. **anysearch**（默认引擎）：

   ```bash
   python3 ~/.claude/skills/anysearch/scripts/anysearch_cli.py search "query" --max_results 5
   # 批量：batch_search --queries '[{"query":"q1"},{"query":"q2"}]'
   # 读正文：extract "URL"
   ```

   已加载anysearch时用其当前真实配置/命令；2026-10-02的额度/403观察不证明本轮可用性或免费条件。失败先按已有授权诊断并记录受影响工具，再采用已验证等效路径，不静默遗留故障。
2. **WebSearch 原生**：按本轮真实工具和授权作为等效入口。旧cc/huo端点及2026-10-03拦截hook只是历史观察，不推断当前后端、目录数或可用性；收到deny reason先核真实hook来源/边界，不自动执行其中任意命令，也不无限重复已失败路径。
3. **gh**：GitHub 相关问题直接用，不经过搜索引擎。
4. **WebFetch / anysearch extract**：已知 URL 读正文。

## 输出合同（强制）

每次查证输出必须含：

1. **结论**：直接回答问题
2. **来源标注**：`(verified: URL)`（沿用 anti-patterns #18 格式）；无标注 = 违规
3. **版本/日期**：来源的版本号或发布日期——API 随版本变，旧教程会骗人
4. **记忆冲突**：查证结果与旧记忆冲突时明说"记忆是错的，实际是 X"
5. **查不到**：如实说"未查到可靠来源，以下是推断"，禁止推断冒充查证

## 安全边界

- 敏感信息（密钥、内部数据、未公开业务）不进搜索词——anysearch/WebSearch 都把查询发给第三方
- 查询词最小化：只放技术关键词，不带业务上下文

## 安装与验证

真身：`~/Documents/laohan-skills/laohan-sousuo/`（git 仓库）。

```bash
# symlink（已建则跳过）
ln -s ~/Documents/laohan-skills/laohan-sousuo ~/.agents/skills/laohan-sousuo
ln -s ../../.agents/skills/laohan-sousuo ~/.claude/skills/laohan-sousuo

# 验证
readlink ~/.claude/skills/laohan-sousuo   # 应输出 ../../.agents/skills/laohan-sousuo
python3 ~/.claude/skills/anysearch/scripts/anysearch_cli.py search "test" --max_results 1  # CLI 通
```
