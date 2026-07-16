# 更新日志

所有重要变更都会记录在此文件中。

## [Unreleased] - 2026-07-17

### 变更

- **laohan-douyinsousuo** v3.0.0 — 删除 DrissionPage、cookie 注入、独立 Chrome profile 与项目脚本，改为只编排已安装的 OpenCLI；失败链固定为 adapter → trace/autofix → OpenCLI Browser Bridge。
- **laohan-xiazai** — 抖音关键词搜索移除 DrissionPage/Playwright 降级，统一回到 OpenCLI 成熟能力。

## [1.4.0] - 2026-06-14

### 新增

- **laohan-donghua** v9.0.0 — 口播稿 + 真人视频 → B-roll overlay 成片（Hyperframes，index.html + 一次 render 出片），技法库扩展至 10 种 + 3 个完整场景示例，face-wrapper 统一为 SIDE 策略

### 变更

- README badge 更新为 15 个 skill（内容创作板块补 donghua，8→9）

## [1.3.0] - 2026-05-28

### 新增

- **laohan-chuangzuo** 风格选择 — Step -1 强制选择写作风格（通用/教程型），风格文件自包含，`references/styles/` 目录自动发现

### 变更

- README badge 更新为 14 个 skill
- laohan-xiazai 搜索优先级更新（anysearch 首选）

## [1.2.0] - 2026-05-23

### 新增

- **laohan-douyinsousuo** — 抖音关键词搜索，采集视频数据按点赞排行
- **laohan-luping** — 录屏自动化（原 laohan-lupingcli），口播稿转录屏脚本（CLI+浏览器混合），ffmpeg 录物理屏幕 + tmux CLI 操作 + Playwright 浏览器操作 + 临时文件自动清理，输出 1080p MP4

### 变更

- README 中英文版更新为 14 个 skill 完整说明

## [1.1.0] - 2026-05-23

### 新增

- **laohan-weigui** — 抖音文案违规检测，7类扫描（引流/极限词/医疗/金融/低质/敏感/平台限制），结构化报告+替换建议

### 变更

- 合并 aihotjingxuan + hotdouyinai → **laohan-redian**（三路并行统一抓取）
- 合并 yuanchuang + luping + urlgaixie → **laohan-chuangzuo**（统一创作引擎）
- 新增 **laohan-skillcreator** 元技能（融合 Anthropic + Matt Pocock + 9arm 最佳实践）
- README 中英文版更新为 12 个 skill 完整说明

## [1.0.0] - 2026-05-21

### 首次发布

13 个 Claude Code / OpenClaw 技能，涵盖内容获取、创作、质量校准三大类别。

#### 内容获取（5个）
- **laohan-xiazai** — 从互联网获取内容一站式，覆盖 7+ 平台自动降级
- **laohan-aihotjingxuan** — AIHOT 精选页当日 AI 高价值内容抓取
- **laohan-hotdouyinai** — 抖音热榜 AI 内容筛选（6000+ 关键词）
- **laohan-urlgaixie** — 手动 URL 改写队列
- **laohan-shencha** — 技术文档深度联网审查

#### 内容创作（5个）
- **laohan-yuanchuang** — 热点转译原创选题
- **laohan-luping** — 录屏转口播稿完整流水线
- **laohan-notebooklm** — 口播稿一键生成幻灯片图片
- **laohan-fengmianqiuzhi** — Gemini 封面提示词生成（秋芝2046风格）
- **laohan-fenjingtishici** — 分镜图片提示词（FLUX/SDXL/Gemini）

#### 质量与工具（3个）
- **laohan-cheat** — 内容校准统一路由（6维评分+预测+复盘）
- **laohan-gengxin** — 工具版本检查与更新
- **laohan-jiaocheng** — 教程路由器（5个配置教程）

#### 文档
- README.md（中文）+ README.en.md（英文）
- 5 篇实战教程（docs/）
- MIT License

---

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/)。
