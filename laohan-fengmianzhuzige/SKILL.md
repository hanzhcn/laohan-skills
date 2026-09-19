---
name: laohan-fengmianzhuzige
version: "1.1.0"
description: 完全对标柱子哥TzFilm封面体系的封面生成（基于96视频全量逐帧分析建立，独立于秋芝套）。电影海报式视觉母版+五元素brief+语义色token+版式族。Use when 工作流⑥明确选用zhuzige套、用户说"柱子哥封面""zhuzige封面"，或与 laohan-fengmianqiuzhi（秋芝套）按期切换时使用本skill。
---

# 柱子哥式封面直接生成

目标：复刻柱子哥TzFilm的封面方法论——用"电影海报式的一瞬间视觉冲突"承载本期最强钩子，生成3张排序9:16视觉母版，并为选中rank生成3张真实尺寸封面共享四平台7个逻辑入口。本skill与 `laohan-fengmianqiuzhi`（秋芝套）互为可切换双轨，分析真源：`laohanAI视频创作/对标视频库/柱子哥TzFilm-逐帧分析/柱子哥TzFilm-96视频完整分析报告.md`。

## 输入与边界

- 与秋芝套同合同：`episode-config.schema_version` 为4；身份reference或稿件绑定不满足时停止。
- 读取当前 `01-口播稿.md`、`12-发布/多平台发布内容.md`和锁定的抖音发布信息。
- 人物参考固定为本期 `05-封面/reference/jeffrey-reference.jpg`，作为 image reference 传给生图模型。
- ⑥生成3张9:16候选排序 `01 → 02 → 03`；默认01，Jeffrey改选后为新rank重新生成3张真实尺寸，旧rank不混用。
- 不在 prompt 中写"模仿某博主风格"，只使用本skill `references/zhuzige-cover-study.md` 的观察与版式族。

## 执行

### 1. 五元素封面brief（逐条落字后再写提示词）

1. **身份人物**：Jeffrey在画面中的位置（右侧或下1/3为默认）、半身占比、动作（讲解/托举/质疑/指向）、情绪角色；
2. **主题物件或场景**：与本期直接相关的一个强视觉物件或空间（产品设备/真实空间/象征场景），一个就够，不堆小卡片；
3. **主标题**：≤7字优先（不可压缩的产品名可放宽，最多两行），白/黄为主；
4. **语义色强调词**：按语义token选一——红#E04040=风险/警告/否定，黄#F5C518=结论/金额，绿#22C55E=收益/正确，蓝#3B82F6=科技/工具，紫#A855F7=AI/认知；
5. **英文眉题**（可选）：大写字距0.28em栏目感小字，不抢中文结论。

禁止"AI神器""效率翻倍"等空话；封面文字不得超出口播稿事实；同一条封面文字不重复关键词。

### 2. 从版式族选3个排序

五族（完整观察见 references/zhuzige-cover-study.md）：

- **A 电影海报式**（默认首选）：深黑/深蓝环境，真实主光+轮廓光，真人右/下半身，一个主题画面同屏，标题2-3行直给观点；
- **B 数字冲击式**：特大计数器/金额数字占半屏+人物反应，配"单价/时薪/粉丝数"类钩子；
- **C 证据墙式**：真实截图/卡片阵列+人物+红圈标注一个证据点；
- **D 对峙式**：左右双元素+中缝VS或对勾叉，配"对比/颠覆/争论"选题；
- **E 悬念钩子式**：强悬念画面+超大问句或断言，人物小占比入画。

三张必须来自不同族；排序按"口播钩子匹配度 → 手机缩略图辨识度 → 人物与主物件关系 → 与近期候选差异"。`01`必为最推荐。

### 3. 生成合同

与秋芝套一致：3张9:16母版 → 默认01（或Jeffrey改选rank）重构图生成 3:4（抖音竖/微信视号主页/小红书）、4:3（抖音横/微信视号分享/B站推荐）、16:9（B站主页）三张真实封面；三比例分别重新构图，不裁切适配。

### 4. 与开场首帧双轨

⑥平台封面图（本skill产物）与⑪成片开场首帧钩子（0秒双语字幕常驻+1秒内hook大字，见导演Prompt04/05）是两件事，都要做；封面帧与封面图可以同源（从成片hook段取帧重制），但独立生成质量更稳。封面帧永远取自clean后成片，禁止raw首帧。

## 生图执行层（2026-09-19实测：火山方舟直连）

- 端点：`POST https://ark.cn-beijing.volces.com/api/v3/images/generations`，key=`ARK_API_KEY`（本机~/.zshrc）。
- 模型：`doubao-seedream-5-0-lite-260128`（Jeffrey指定"Seedream 5.0-lite"的完整API id，**必须带日期后缀**，不带后缀的裸名会404；响应model字段回显为doubao-seedream-5-0-260128属正常路由归一化）。账号另可用：4-0-250828/4-0-20260415/5-0-260128/5-0-pro-260628。
- 尺寸红线：5.0要求**≥3686400像素**——9:16用`1440x2560`（4.0只要求≥921600）。出图后`sips -Z 1920`缩到1080x1920交付。
- 身份一致：`image: ["data:image/jpeg;base64,..."]`传身份参考图（先`sips -Z 1024`压到~160KB）。
- 中文渲染纪律：Seedream中文偶发错字（实测"诱饵"错成"诱间"）——**每张必须视觉复核标题文字，错字换seed（如42→77）并在prompt里强调"EXACTLY these characters...rendered perfectly"重roll**。
- 参数：`response_format:"url"`、`watermark:false`、固定`seed`保确定性；单张约30-40s。

## 每条提示词必须一次性描述

9:16画幅；Jeffrey身份/位置/表情/动作/服装；一个主题场景或物件；主标题与强调词的准确原文、断行、位置、颜色、粗黑描边；该族版式规律；禁止错字、多余文字、平台UI、水印、二维码、额外人物和无关装饰。

共用身份约束：

```text
Use the supplied portrait as the non-replaceable identity reference for Jeffrey. Preserve his recognizable face shape, glasses, short hair, moustache and goatee, chin mole, skin tone and age impression. Exactly one Jeffrey.
```
