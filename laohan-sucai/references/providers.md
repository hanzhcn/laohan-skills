# 素材源与申请入口

核对日期：2026-07-10。每次真实调用仍以 provider 返回的条款、限流 header 和页面为准。

| Provider | 自动 adapter | 环境变量 | 申请 / 文档 | 当前接入规则 |
|---|---|---|---|---|
| Pexels | 是 | PEXELS_API_KEY | https://www.pexels.com/api/documentation/ | 账号可即时申请 key；API 文档要求显著链接 Pexels，并尽量署名摄影师。 |
| Pixabay | 是 | PIXABAY_API_KEY | https://pixabay.com/api/docs/ | 注册后在 API 文档页可查看 key；展示搜索结果时要标明来源；API 默认 100 请求/60秒，结果须缓存24小时。 |
| Coverr | 是 | COVERR_API_KEY | https://coverr.co/developers | 免费 tier 50 calls/hour；API 文档要求 Coverr attribution。已纳入默认搜索，配置 key 后自动调用。 |
| Mixkit | 否 | 无 | https://mixkit.co/license/ | 未接入自动 adapter；不同素材类型有不同许可证，不能用爬虫假装稳定 API。仅允许手动补充并写入同一素材清单。 |

## 配置

把 key 写到本机 shell 环境，或复制 .env.example 为同目录私有 .env；脚本会自动读取后者。两者都不进仓库：

~~~bash
export PEXELS_API_KEY="..."
export PIXABAY_API_KEY="..."
export COVERR_API_KEY="..."
~~~

至少配置一个 provider 才能执行搜索。脚本并行查询已配置的远程 provider，单个 provider 失败、限流或无结果不会阻断其他 provider。

## 本地素材库

本地素材库没有 key。通过一次命令的 `--local-library "/绝对路径/素材库"`，或设置 `LAOHAN_LOCAL_BROLL_DIR`，把 MP4、MOV、MKV、M4V、WebM 纳入本次搜索。文件名与目录名用于候选召回，不能替代视觉复核；选中后复制到当前 episode 的 `10-素材/broll-assets/files/`。

## 许可与署名

素材清单会保留 provider、资产页、作者、许可参考页、访问日期和署名建议。自动下载不等于自动取得无限用途授权；发布前使用 素材清单.md 与 _credits.md 核对。
