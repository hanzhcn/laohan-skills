# 镜头友好模式（laohan-chuangzuo 可选扩展，v1）

> 定位：只在 Step 4 写稿句式层叠加**倾向性偏好**的可选模式，默认关闭。不覆盖六步法、style.md/风格文件、Step 5 六关、humanizer-zh 与任何既有合同；对既有方法只加不删不改（rules/skills.md「已验证方法不得因审计被压缩」）。
> 启用条件（满足其一）：用户显式点名「镜头友好」；Episode 模式在决策 JSON 登记 `camera_friendly: true`。不启用时一切照旧。

## 为什么有这个模式

下游 MotionGit 模板出片（`motion/adapters/mk-adapter.py`）按语义模式分镜：开场主张→title、术语强调→keyword、真实数值对比→vs、清单要点→checklist、金句→quote、互动收尾→cta。写稿句式靠近这些形态时，「稿件→镜头」的映射接近确定式，自动化出片的语义正确率显著提高（依据：`motion/HANDOFF-WORKFLOW-INTEGRATION.md` §三.2/§三.3，方案经 codex 四审 PASS）。

## 四个句式偏好（倾向性，非硬规则）

1. **短主张**：关键节奏点写成 ≤15 字的独立短句（与 style.md「关键节奏点尽量≤15字」既有默认叠加，不是替换）
2. **成对对比句式**：对比内容写成对仗双实体句——「智谱归智谱，DeepSeek 归 DeepSeek」「与其排队等重置，不如多开一个窗口」
3. **清单句**：并列要点用「第一个/第二个/第三个」引导，每个要点独立成句、要点名前置（「第一个，目录隔离。」优于「目录隔离是第一个要点」）
4. **真实数字带单位**：可量化处写具体数字+单位（「十个模型窗口」「两个字母」），不写「很多/大量/不少」

## 两条结构偏好

- **金句独立成段**：quote_anchor 候选句独立成段（原句不被并入长段），方便下游按段提取
- **术语首现集中**：同一技术术语只在一段首次展开解释，之后用短称；便于 keyword 型镜头取词

## sidecar 契约 camera-friendly/v1

启用时默认额外产出 sidecar（正文照旧，只含口播文字）：

- Episode 模式：`02-创作工作稿/镜头结构.json`
- 独立模式：`output/<basename>.镜头结构.json`（与口播稿同 basename）

```json
{
  "contract": "camera-friendly/v1",
  "script_sha256": "<最终有效口播正文的 SHA256>",
  "paragraphs": [
    {"sha256": "<该段原文 SHA256>", "text": "段落原文全文（逐字）", "role": "opening|point|contrast|list|quote|cta"}
  ]
}
```

- `role` 是**语义提示**（opening 开场主张 / point 单要点 / contrast 对比 / list 清单 / quote 金句 / cta 互动收尾），不是模板控件名，更不是模板参数
- `text` 必须与正文段落**逐字一致**；下游适配器按归一化全文匹配，失配即拒绝整个 sidecar 并报错，不模糊容错（codex 预审 F08：绑定用段落全文/SHA，不用前缀）
- `script_sha256` 绑定最终口播正文；humanizer-zh（Step 5.5）或任何实质改稿后必须重出 sidecar（段落 SHA 会失配）
- sidecar **不含** props、视觉参数、时间码、镜头语言——模板表达归适配器与导演阶段（与 SKILL.md「visual_anchors 只给抽象理解任务」同一边界）
- sidecar 不进正文、不进创作决策.json、不进 validator 校验范围（validator 零改动）

## 与既有步骤的关系

- Step -1/0/1/2/3/5/5.5/6/7 全部照旧；本模式只在 Step 4 的句式选择上加偏好
- 触发本模式不改变字数下限政策、内容单位制、发布信息合同与任何机械门
- 若句式偏好与本题表达冲突（如故事型长句更自然），以表达为先，偏好让位——它们是倾向不是门槛
