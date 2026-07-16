---
name: laohan-douyinsousuo
description: 抖音关键词搜索与选题分析。Use when 用户说"抖音搜索""搜一下抖音""抖音上搜""抖音关于""抖音上有什么""douyin搜索"或提到"在抖音搜""抖音的xxx情况""抖音里xxx排行"。
version: "3.0.0"
---

# 抖音搜索

这是工作流里的抖音搜索编排接口。只使用宿主已安装且已登录的 OpenCLI，不自带爬虫、浏览器、cookie 复制、独立 profile 或 Python runtime。

## 输入

- `query`：必填，搜索关键词。
- `limit`：可选，1—30，默认 30。
- `episode`：可选，本期 `episodes/<slug>` 路径；只允许写 `00-抖音搜索证据.md`，不得写 `00-选题.md`。

## 执行

### 1. 预检

```bash
opencli doctor
opencli douyin whoami -f json
```

必须同时满足 Browser Bridge 可连接、`logged_in=true`。否则直接报告 `BLOCKED`，不要抽取或复制 Chrome cookie，也不要安装新工具。

### 2. 搜索

```bash
opencli douyin search "$QUERY" --limit "$LIMIT" -f json
```

结果必须是 JSON 数组，并逐条保留 OpenCLI 返回的 `rank`、`desc`、`author`、`url` 及可用互动字段。不要按缺失字段重排，也不要把 OpenCLI 的结果顺序描述成“按点赞排行”。

### 3. 失败降级

按顺序执行，成功即停：

1. 同一命令加 `--trace retain-on-failure`，使用 OpenCLI autofix 修复现有 adapter；总尝试最多 3 次。
2. 若 `opencli doctor` 仍正常但 adapter 持续失败，使用 `opencli browser douyin-search bind` 绑定用户当前已登录的抖音标签页，仅做读取和取证。执行浏览器降级前说明会操作当前标签页。
3. 仍失败则报告 `BLOCKED`，记录失败层级和原始错误，不得临时安装 DrissionPage、Playwright、浏览器或自制爬虫。

## 输出与判断

先展示搜索健康状态和实际返回条数，再展示结果表：

| # | 作者 | 点赞 | 标题 | 链接 |
|---|------|------|------|------|
| 1 | author | likes/不可用 | desc | url |

- 互动字段缺失或返回 `0` 时写“不可用/未验证”，不得断言真实互动为零。
- 返回空数组时写 `EMPTY_OR_FIELD_UNAVAILABLE`；不能据此断言抖音上没有相关内容。
- 事实性结论必须回到原视频或权威来源核验；搜索结果只能作为发现证据。
- 用户要求选题分析时，再总结内容类型、重复角度和差异化机会；不得补造搜索结果未提供的事实。
- 指定 `episode` 时，把关键词、执行时间、OpenCLI 健康状态、实际条数、命令和结果摘要写入本期 `00-抖音搜索证据.md`。

## 边界

- 下载视频、博主作品列表：用 `/laohan-xiazai`。
- 评论、发布、账号运营：用 `/laohan-yunying` 或对应 OpenCLI adapter。
- 禁止 DrissionPage、`browser_cookie3` cookie 注入、独立 user-data-dir、额外 Chrome/Chromium、后台自动发布或回复。
