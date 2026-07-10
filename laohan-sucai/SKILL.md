---
name: laohan-sucai
version: "1.1.0-candidate"
description: B-roll 素材供应器。读取⑨导演的 source manifest，搜索、下载、抽帧并记录可授权现实素材；只有视觉复核通过的资产可交⑪动画生产。Use when 用户说配素材、找B-roll、补真实场景、下载素材、审核素材、进入⑩素材，或⑨导演将 beat 路由为 BROLL_STOCK。
---

# B-roll 素材供应器

只为已经判定为 BROLL_STOCK 的现实场景找素材。它不决定动画、不把库存素材伪装成事实、不合成视频。

## 输入与停止条件

正式入口是 09-导演/source-manifest.json 的 broll_requests，以及已批准的 PROOF_PUBLIC/PROOF_USER source_entries。每项 BROLL 必须有 beat_id、source_mode=BROLL_STOCK、visual_need 和 must_not_imply；PROOF 必须有 evidence.id。

🛑 STOP：没有 broll_requests 或请求不是 BROLL_STOCK 时，不搜索、不下载。没有 provider key 时只写出 `no_result` 与 `provider_errors`，不会发起搜索或下载。

## 命令

~~~bash
# 搜索候选：Pexels/Pixabay/Coverr 并行检索；至少配置一个 key
node scripts/sucai.mjs search --source 09-导演/source-manifest.json --out 10-素材

# 本地素材库优先参与；local 候选会复制到本 episode 后再抽帧
node scripts/sucai.mjs search --source 09-导演/source-manifest.json --out 10-素材 --local-library "/绝对路径/你的素材库"

# 下载一个候选，并生成缩略图供实际视觉检查
node scripts/sucai.mjs download --manifest 10-素材/素材清单.json --beat B01 --candidate pexels:123

# 先实际查看缩略图或 contact sheet，再记录判定
node scripts/sucai.mjs verify --manifest 10-素材/素材清单.json --beat B01 --candidate pexels:123 --verdict pass --reason "主体、构图和事实边界均匹配"

# 查看当前清单
node scripts/sucai.mjs report --manifest 10-素材/素材清单.json

# PROOF 只物化已批准证据；显式视觉确认后复制到本期并登记
node scripts/register-proof-asset.mjs episodes/<slug> B03 <proof-file> <thumb-file> --visually-verified
~~~

环境变量和官方申请入口见 references/providers.md。不要把 key 写入 SKILL.md、JSON、episode 或 Git。

## 工作流

1. 读取 broll_requests 的 query_terms；缺 query_terms 时只用 visual_need，记录搜索理由。
2. 若传入 --local-library 或 LAOHAN_LOCAL_BROLL_DIR，先把本地库加入候选来源；随后并行调用 Pexels、Pixabay、Coverr。Mixkit 不做自动抓取。
3. 记录每个 provider 的 status、candidate_count、elapsed_ms、rate_limits；单个 provider 的无 key、限流或失败不阻断其他 provider。
4. 写入 10-素材/素材清单.json、素材清单.md、_credits.md；素材清单必须记录当前 source_manifest_sha256，候选初始状态都是 candidate_unverified。
5. 下载选择的 candidate，使用 FFmpeg 抽帧；local candidate 先复制到本 episode。
6. 实际检查人物、动作、画幅、水印、错误文字、字幕安全区和 must_not_imply。
7. 只有 verify pass 才把 item 标为 visually_verified；selected candidate 必须在本期 `10-素材/broll-assets/` 内，含 local_path、thumb_path 与文件 SHA-256；⑪只读取这种资产。
8. PROOF 不进入库存搜索池。只把⑨已批准且绑定⑤ `SUPPORTED claim_id` 的同源 evidence 复制到 `10-素材/proof-assets/`，写 `proof-assets.json` 并绑定 claim ID、evidence ID、source URL、本地文件/缩略图 SHA 与 visually_verified；不重做事实判断。

## 失败处理

| 情况 | 动作 |
|---|---|
| 某 provider 无 key 或 API 失败 | 写 provider_errors，继续其他 provider |
| 本地素材库不存在或不可读 | 标 local provider error，继续远程 provider |
| 全部无候选 | 标 no_result，返回⑨重新判断，不凑素材 |
| 全部候选视觉不匹配 | 标 no_approved_candidate，修改检索词或手动补充，不得进入⑪ |
| 下载失败 | 标 download_failed，不改变其他候选 |
| 视觉不匹配 | verify reject，不能因文本相关就通过 |

## 禁止事项

- 不对整篇口播逐句配图；
- 不自动把 no_result 变成动画；
- 不把候选文本分数当视觉通过；
- 不把本地文件名命中当视觉通过；
- 不使用 Mixkit 爬虫或把库存素材当用户 proof；
- 不在本 skill 中裁切、烧字幕、渲染或发布。
