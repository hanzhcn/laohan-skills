# laohanAI产品 DH Cover 全系列经验归档（v2→v4，2026-09-04~09-06）

来源：`laohanAI/docs/DH_COVER_V2_BLOGGER_COMPOSITE_SLICE_20260904.md`、`DH_COVER_V2.1`（同文件§10）、`DH_COVER_V3 秋芝式整图叙事`（同文件§11）、`DH_COVER_V4_QIUZHI_QUALITY_SLICE_20260905.md`、`DH_COVER_TITLE_CONTRACT_FIX_20260904.md`。本文件为完整归档，SKILL.md只留条款。

## 产品演化主线（本机skill探索几乎重演，结论可直接引用）

| 版本 | 架构 | 结论 |
|---|---|---|
| v1(旧) | 45模板选3→单pass整图(img2img+identity)→VLM质检 | 中文大字不可靠/假人/非博主风 |
| v2 | 分层合成：AI无字背景+真人帧贴边压暗融边+Pillow程序字 | exactTitle 100%，但融合度天花板达不到秋芝式 |
| v2.1 | +Qwen-Image-Edit人物变体层（identity帧+中文变体指令） | 换装/换表情/换姿态可行，失败回落原始帧 |
| v3 | 秋芝式整图：identity帧+四段prompt（身份锁定+场景叙事+标题渲染+负面）img2img整图 | 融合度达标（人物入景+道具遮挡+统一光影）；Qwen-Image中文标题3/3逐字正确；人脸轻微AI重绘感=已知权衡 |
| v4 | 换Seedream 5.0 lite+身份分析前置+比例合同+表情张力+18字段QA门禁 | 当前最优（本skill 1.17已回流四点） |

## 标题合同细则（TITLE_CONTRACT_FIX，必须执行）

- 4–10字符；**至少一个汉字**；每字符为汉字或ASCII字母数字（内容必需的 AI/GPT/Codex/数字 合法；**纯英文标题拒**）。
- 极限词精确黑名单：最、第一、顶级、极品、绝对、百分百、国家级、世界级、唯一。
- 正例：「AI主战场已换人」(8)✓、「AI集体崩了真相」✓；反例：「别盯跑分了Agent才是主角」(14)✗、「全球最强的生意」(黑名单)✗。
- 生成尝试：一次原始+两次修正，重试必须携带失败原因。

## 场景叙事段护栏（v3/v4）

- sceneNarrative目标20—100字，硬上限200（超限=截断风险拒）；内容=场景+动作+道具+光影，必须与标题冲突类型差异化。
- 三候选差异化双维度：3个不同模板族 × 3种sceneId（stage舞台大屏 / handheld手持道具 / dramatic戏剧场景）。

## 人物变体层（v2.1）——"按文案换表情/换装"的成熟方案

Qwen-Image-Edit-2509 img2img，输入identity帧，中文变体指令标准句式：

> 保持画面中同一个人的面部完全不变：{identity_description}。只改变着装、表情和姿态：{personAction}。半身像，面向镜头，自然真实人像摄影质感，纯深灰色干净背景，均匀柔和布光。画面中不得出现任何文字、水印或第二个人。

- 用途：reference照片只有一种表情/服装时，先用变体层生成当期需要的表情/服装半身像，再进入后续生成。
- 变体失败回落原始帧；QA加samePerson对照参考帧。

## v2分层合成资产（柱子哥风env_photo的同类，结论互证）

- 布局目录：blogger-left（人左46%/字右上）/ blogger-right（人右46%/字左上）/ blogger-center（人居中62%/标题通栏）。
- 背景prompt基座：`Vertical 9:16 dark tech YouTuber-thumbnail background, moody studio, subtle neon accent ({accent}), soft rim light, clean negative space on the {side} for a person and big title text, subtle grid/circuit texture, high contrast, professional. Strictly no people, no faces, no hands, no text, no letters, no numbers, no logos, no watermarks.`（accent变体：electric blue/amber warm/crimson alert）
- 产品结论：分层合成融合度天花板达不到秋芝式（整图才能拿到人物入景+道具遮挡+统一光影）——与本机结论互证：env_photo适合柱子哥真实环境风；秋芝风必须整图。

## 字体与Provider

- APP标题字体：SmileySans-Oblique（OFL，亮黄+黑描边）——本机备选（现用思源黑体Heavy）。
- Provider A/B（v4实测）：Seedream 5.0 lite 65s/张胜出；Qwen-Image-Edit保真但退化（深色衣/弱动作/单蓝背景）；agnes超时弃。
