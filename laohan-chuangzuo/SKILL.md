---
name: laohan-chuangzuo
description: 统一创作引擎，负责创作口播初稿（不含封面提示词，封面由 laohan-fengmianqiuzhi 独立产出；不含选题搜索，选题由工作流①前置用 laohan-redian/laohan-douyinsousuo 出大纲后以大纲模式喂入）。支持录屏视频(音频提取→转录)、URL队列(抓取→整理)、结构化大纲、原始文本、自由主题五种输入。其他 skill 的写作环节统一调用本 skill。Use when 用户说"写口播稿""帮我写""录屏转口播""视频转口播稿""写一篇""根据链接改写""改写文档"。
version: "1.6.0"
---

# 统一创作引擎

所有涉及口播稿写作统一调用本 skill。一份方法论，一个入口。

## 核心理念

一份方法论、一个入口——所有写作走同一个管线，避免不同入口产出质量参差不齐。素材先整理（Layer A/B）再写稿，确保口播稿建立在结构化理解之上，而非对原始素材的直接改写。

## 不适用场景

- 纯文本摘要/总结 → 用 summarize skill，不走创作流程
- 翻译 → 直接翻译，不需要口播稿格式
- 学术论文/技术文档写作 → 输出格式是口播稿，不适合正式文档

## 知识来源（唯一正本，symlink 到 OpenClaw workspace）

- **写作规则**：`references/style.md`（恢复 2026-07-11 前实战版本）。其中开场、转场、修辞、标题公式、场景密度、节奏、口头禅和模板均为已验证的默认方法；允许按本题增删或扩充，但不得以“防模板化”为由整体降级成可有可无的抽象建议
- **整理方法**：`references/skill.md` → `~/.openclaw/workspace-reviewer/knowledge/skill.md`（进宝 skill.md v3.5）
- **转录方法**：`references/transcription.md`（音频提取 + 语音转文字三级降级）
- **转译选题法**：`references/yuanchuang-method.md`（转译选题法 + 角度库 + 标题公式 + 数据基准）。本 skill 不再自带热点搜索；此方法供工作流①前置阶段复用——①用 laohan-redian/laohan-douyinsousuo 出选题后，按本文件规则生成大纲再喂入本 skill 大纲模式
- **写作风格目录**：`references/styles/`（每份 .md 是一种写作结构框架，Step -1 强制选择）

GitHub 上是实体文件（拷贝），本地用 symlink 自动同步。

## 输入模式

| 模式 | 输入 | 触发场景 | 内部处理 |
|------|------|----------|---------|
| 大纲模式 | 结构化大纲文件 | 工作流①前置产出 / 外部传入 | 跳过整理，从 Step 2 开始 |
| 素材模式 | 原始文本/转录稿 | 录屏转录后、URL抓取后 | 先 Layer A/B 整理，再写稿 |
| 自由模式 | 主题关键词 或 无输入 | 用户直接调用 | 先生成大纲→确认→写稿 |

## 前置处理（将各种输入转化为三种模式）

### Pre-A：录屏预处理

触发：用户提供了视频文件（mp4/mov 等）或说"录屏转口播""视频转口播稿"。

1. **提取音频**：`ffmpeg -i "<视频路径>" -vn -acodec libmp3lame -q:a 2 "/tmp/录屏音频_$(date +%s).mp3" -y`
2. **语音转文字**：三级降级（详见 `references/transcription.md`）
   - 硅基流动 API（免费，秒级）→ whisper-cli（本地快）→ Python whisper（最准）
3. 独立写作时转录结果保存为 `output/transcript-YYYY-MM-DD.md`；Episode 模式保存为 `episodes/<slug>/02-创作工作稿/transcript.md`，自动进入**素材模式**。

### Pre-B：URL 队列预处理

触发：用户说"根据链接改写""链接内容改写""改写文档"。

1. **读取队列**：独立写作检查 `<cwd>/url.md`；Episode 模式只检查 `episodes/<slug>/02-创作工作稿/url.md`，找第一个 `- [ ]` 且后面有 URL 的行
   - 没有待处理 → 告诉用户"队列为空"，结束
2. **抓取内容**：根据平台自动选择方法（参考 laohan-xiazai 路由）
   - 抖音：移动端 UA → iesdouyin.com
   - B站：opencli bilibili
   - 其他：Jina Reader / agent-reach
3. 独立写作时内容保存为 `output/content-YYYY-MM-DD.md`；Episode 模式保存为 `episodes/<slug>/02-创作工作稿/content.md`，进入**素材模式**。
4. **完成后更新队列**：将 url.md 中对应行改为 `- [x] URL 关键词 ✅ YYYY-MM-DD`

## 环境检测

```
STYLE_FILE = 检测顺序：
  1. <当前工作目录>/templates/style.md      ← 用户定制版（优先）
  2. <skill安装目录>/references/style.md    ← 标准版（symlink 到 OpenClaw）

ACTIVE_STYLE_FILE = 通用风格时为 STYLE_FILE；教程型/其他风格时为 <skill安装目录>/references/styles/<选择>.md

ORGANIZE_FILE = <skill安装目录>/references/skill.md  ← 标准版（symlink 到 OpenClaw）

OUTPUT_DIR = 独立写作时 <当前工作目录>/output/；Episode 模式时 episodes/<slug>/02-创作工作稿/
```

## Episode 模式

当参数含 `--episode episodes/<slug>` 时，先读取 `00-选题.md` 和 `00-选题.json`，不得重新选择另一主题。中间整理和大纲写入 `episodes/<slug>/02-创作工作稿/`；最终定稿只能写 `episodes/<slug>/01-口播稿.md`。同时写 schema 2 `02-创作工作稿/创作决策.json`，它既是动笔前规划，也是落稿后的执行记录；最终必须绑定当前稿 SHA-256，不能靠旧决策给新稿放行。共享 `output/` 只允许用于非 workflow 的独立写作，不能作为 episode 输入或真值。

schema 2 至少包含：

- 与①一致的 `topic_thesis`、`hypothesis_id`、`content_form`、`audience`、`expected_audience_effect`；
- `input_mode`、`active_style_file`、`active_style_sha256`、`structure_tool`、`structure_rationale`、`expected_duration_seconds`；
- 非空数组 `fact_boundary`、`alternative_structures`、`unproven_assumptions`；
- Step 3 的 `argument_plan`：`opening_contract`、`reasoning_path`、`material_tradeoffs`、`shootable_expression`、`originality_and_citations`；
- 至少两项 `original_contributions`，每项写清新增判断及其观众价值；
- `execution_steps` 逐项记录 `step_minus_1`、`step_0`、`step_2`—`step_7` 为 `COMPLETED`，不适用的 Pre-A/B、Step 1/1.5 写 `SKIPPED` 及理由；
- `quality_checks` 的 `content_floor`、`originality`、`regex`、`style_boundary`、`ai_taste`、`technique_purpose` 均为 `PASS`，另有非空 `read_aloud_note`；
- 最终 `script_title`、`script_hash`、合法 `completed_at`。

任一改动改变 `01-口播稿.md` hash，都使②立即失效。错字或标点之外的实质改稿必须回 Step 3，重做规划、六关检查和试读，再写新的 schema 2 决策记录；不得只替换 hash。

## 执行清单（每步完成后打勾）

- [ ] Step -1: **风格选择（强制，不可跳过）**
- [ ] Pre-A/B: 前置处理（如需；Pre-C 热点转译已移除，搜索归工作流①）
- [ ] Step 0: 判断输入模式（大纲/素材/自由）
- [ ] Step 1: [素材模式] Layer A/B 整理
- [ ] Step 1.5: [自由模式] 生成大纲→用户确认
- [ ] Step 2: 选题确认（模式A/B选择+主题锁定）
- [ ] Step 3: 规划（原版12项，不可跳过；可以增加，不得无依据删减）
- [ ] Step 4: 写口播稿
- [ ] Step 5: 质量检查（6关）
- [ ] Step 6: 通过/重试
- [ ] Step 7: 输出口播初稿（封面提示词不在本 skill 范围，由独立 skill laohan-fengmianqiuzhi 在后续流程产出）
- [ ] Post-A: [可选] NotebookLM 幻灯片

---

## Step -1：风格选择（强制，不可跳过）

独立写作时在执行任何创作动作之前，必须让用户选择写作风格。不选择不执行。**Episode mode 例外**：先依据 `00-选题.md`/JSON 的受众、论点、干预和预期效果判断教程型或观点型，锁定 `ACTIVE_STYLE_FILE`，再用该文件选择结构工具；在 gate 真源 `02-创作工作稿/创作决策.json` 记录风格文件、选择理由、替代方案和待验证假设。Step 2 只复核该选择与大纲一致，不得重新选择。可同时写同名 `.md` 人类摘要，但它不代替 JSON。不得因等待风格选择而阻断已授权的 AUTONOMOUS_RUN。

执行方式：
1. 读取 `references/styles/` 目录下所有 `.md` 文件
2. 列出所有可用风格，格式如下：

```
请选择本次口播稿的写作风格：

1. 通用 — 观点型/热点评论/行业分析，使用 style.md 默认规则
2. 教程型（五层模型）— 工具教程/操作指南，使用完整五层结构、六要素、品牌层、结尾层和自检清单

请输入编号或名称。
```

3. **独立写作等待用户选择**。Episode mode 按上面的可追溯自主选择执行。
4. 用户选择后：
   - **通用**：直接使用 style.md 作为唯一规则，不加载额外风格文件
   - **教程型或其他**：读取对应的 `references/styles/<选择>.md` 作为自包含完整规则；不得只摘取其中的抽象结构而跳过语言、场景、节奏、品牌和自检方法
5. **默认不选**：没有"默认选项"，每次触发都必须选择。防止风格混用

**新增风格**：往 `references/styles/` 目录添加新 `.md` 文件即可，自动被发现。不需要修改本文件。

---

## Step 0：判断输入模式

检查输入参数：
- **大纲模式**：输入是 Markdown 文件，含 `## 核心论点` 或 `## 论证路径` 等大纲结构 → 跳到 Step 2
- **素材模式**：输入是长文本（转录稿/网页抓取内容），无大纲结构 → 执行 Step 1
- **自由模式**：无输入文件 或 只有主题关键词 → 执行 Step 1.5

## Step 1：素材模式 — Layer A/B 整理

读 `references/skill.md`（进宝 Layer A/B v3.5），对原始素材执行：

**Layer A（无损事实层）**：
1. 素材信息表（来源/标题/作者/日期/时长）
2. 黄金开局钩子（痛点场景+渴望结果+核心冲突）
3. 结构化模块（按逻辑拆分为独立模块，编号标注）
4. 断言台账（每个可验证的事实单独列出）

**Layer B（衍生加工层）**：
5. 可操作步骤提取（教程型素材必填，非教程型标注"不适用"）
6. 痛点映射（观众的真实痛点→素材能解决哪个）
7. 延伸思考（反常识发现、跨域连接、可执行收获）
8. 核心选题提炼（一句话主题+标题底子+裁剪建议）
9. 教程型质量预评分（模式A时执行，6维度打分）

独立写作时整理结果输出到 `output/organize-YYYY-MM-DD.md`；Episode 模式输出到 `episodes/<slug>/02-创作工作稿/organize.md`，进入 Step 2。

## Step 1.5：自由模式 — 生成大纲

无素材时，基于用户提供的主题（或交互询问）生成大纲：

```markdown
# [两句话标题，＜30字]

## 核心论点（一句话）
[全篇围绕这一个论点]

## 论证路径
1. [切入点]
2. [递进]
3. [收束]

## 关键素材/数据/场景
- [素材点1]
- [素材点2]

## 内容模式
[模式A 教程型 / 模式B 观点型]
```

独立写作时输出到 `output/outline-YYYY-MM-DD.md`；Episode 模式输出到 `episodes/<slug>/02-创作工作稿/outline.md`。展示确认后再进入 Step 2。

## Step 2：选题确认（动笔前必须完成，不可跳过）

1. **复核内容模式**：按下列信号确认 Step -1 已锁定的模式 A（教程型）或模式 B（观点型）及 `ACTIVE_STYLE_FILE`；若与①证据冲突，回 Step -1 重选并在决策 JSON 留痕
   - 选 A 信号：涉及具体工具/操作/配置/流程/对比测试
   - 选 B 信号：行业观点/新闻/深度思考/人物故事
2. **锁定主题**：大纲/整理结果中的一句话主题 = 全篇锚点，不准自换
3. **判断素材类型**：对照 `ACTIVE_STYLE_FILE` 内的素材适配规则；该文件没有专用表时，按 Step 1 的 Layer A/B 证据类型记录，不另外加载 style.md
4. **黄金开局钩子**：锁定痛点场景+渴望结果+核心冲突
5. **（教程型专用）可操作步骤清单**：模式 A 时从素材中提取观众能跟着做的步骤

## Step 3：规划（不写稿，不可跳过）

以 Step 2 锁定的论点为锚，恢复原版12项规划。它们是经过实战验证的默认模板，可以在本题上增加，但无具体理由不得删除：

1. **一句话论点**
2. **内容模式 + 素材类型**
3. **教程型操作步骤规划**：步骤骨架，标注每步使用的真实素材或来源
4. **核心主题贯穿规划**：标题关键词和核心概念在正文中的落点
5. **精华筛选**：必须包含、选择性包含、跳过的内容与理由
6. **场景规划**：至少1个核心生活场景、动作链和代入式互动点
7. **改写策略**：comprehensive（默认）/ angle / structure / depth
8. **目标读者、预期效果与待验证假设**：与①及 `创作决策.json` 一致
9. **技法选配**：骨架 #1—#4、反常识钩子、#15/#18/#19、横向对比及动态技法；若删去原版默认技法，记录具体原因
10. **结构错位方案**：原序与叙述序，避免照搬素材结构
11. **金句/比喻处理**：保留引用或替换；替换不得弱于原版冲击力
12. **增量点与事实边界**：至少2处独立判断，同时标清来源、待⑤核验主张和不能伪装成亲测的内容

## Step 4：写口播稿

按规划写稿。硬性要求：

- **原版开场默认**：通用模式优先使用“你有没有这种感觉，”并在5秒内给锚点；教程型按其完整规则选择专用钩子。只有本题存在更强的实证开场时才替换，并在 `创作决策.json` 记录理由
- 第一行 `# 标题`（≤30字，模式A「动词+工具/场景+结果」，模式B「主题句+情绪句」）
- 严格执行 `ACTIVE_STYLE_FILE` 的完整方法；原版模板是默认基线，不因重复使用就自动判坏

**写稿时同步自检：**
- 关键节奏点尽量≤15字，短句比例以原版60%为默认目标；复杂事实边界允许长句
- 转场优先使用原版转场句式库，禁“首先/其次/最后”式说明书结构
- 标点：冒号→逗号，双引号→「」，「---」做句末停顿
- #19“是不是有点意思”按原版3—5次目标自然融入；若本题语气不适合可减少并记录原因
- 至少4种原版“废话感”元素，保持真人口播呼吸感
- 节奏按原版快慢交替：开头拉满→缓冲→加速→缓冲→结尾加速→减速

## Step 5：质量检查

**E. 内容底线（命中 = 不通过）：**
- 核心论点、关键证据和必要边界均已覆盖；素材覆盖度以原版≥80%为默认目标
- 有明确反常识论点或足够强的结果演示
- 结尾行动号召源自素材中的可执行精华
- 标题核心词在正文形成持续记忆点，原版≥5处作为默认目标
- 核心主题贯穿全文，无偏离段落
- 至少1个核心生活场景，并有代入式互动或动作链
- 全文至少有一句离开本期经历、判断或边界就不能成立的具体表达；纯中性说明书不通过
- 教程型默认350—1200字（约1.5—5分钟）；超出时在 `创作决策.json` 说明原因

**E2. 教程型专用（模式 A 时执行）：**
- 有 ≥1 个明确操作步骤
- 有操作前后对比
- 标题含工具名+动作词
- 结尾恢复资源钩子、收藏引导、互动引导和行动式结尾；资源必须真实存在，不能虚构

**D. 原创性检查（命中 = 不通过）：**
- 老韩增量 ≥2 处，无空泛总结
- 引用原话 ≤2 处，伪装成自己的 → 不通过
- 「我实测」类声明可溯源到素材

**A. 正则检查（命中 = 不通过）：**
- 模板连接词：首先/其次/总而言之/综上所述
- AI 填充：值得注意的是/毋庸置疑/显而易见
- 空洞大词：至关重要/开创性的/赋能/抓手/赛道（非比喻）
- 禁词：意味着什么|本质上|换句话说|不可否认|不难发现|作为一个|让我们|不妨|试想一下|值得一提的是

**B. 禁区检查**（禁用词+禁用标点+禁用结构，按 `ACTIVE_STYLE_FILE` 的自检规则）

**B2. AI味检查（命中 = 不通过）：**
- 体制化开头：不可否认/众所周知/在当今的时代/随着...的发展
- 空心强化：真正地/不得不说/坦率地说
- 三连排比：连续 3+ 相同句式
- 冒号堆砌：一段内 >3 个「：」后接列表
- 过度总结：由此可见/这充分说明/这告诉我们
- 假设复数："我们都知道"/"每个人都会"（应用"你"单数）

**C. 技法检查：**
- 骨架 #1—#4 全部体现
- 反常识钩子或结果演示构成全文核心吸引力
- #15 回环呼应：结尾照应开头
- #18 框架命名：使用时形成可复述名称
- #19 签名互动：“是不是有点意思”按3—5次目标检查
- 横向对比至少1次
- 技法总计以原版≥7条为默认目标
- 废话感以原版≥4种为默认目标
- 任何删减都写入 `创作决策.json`，说明为什么删后效果更好；没有证据时保留原版

## Step 6：通过/重试

- ✅ 全部通过 → Step 7
- ❌ 不通过 → 第1次重试换角度，第2次重试换结构，仍不通过回 Step 3 重新规划（最多2轮）

## Step 7：输出口播初稿

1. 独立写作时口播稿写入 `output/script-YYYY-MM-DD.md`；Episode 模式写入 `episodes/<slug>/01-口播稿.md`。
2. Episode 模式对最终文件计算 SHA-256，把最终标题、hash、Step -1—7 状态、六关结论和试读说明写回 schema 2 `创作决策.json`。没有这一步，写稿只算草稿，不算②完成。

❌ 差：用户否掉旧稿后直接重写 `01-口播稿.md`，沿用旧决策和旧质量结论。

✅ 好：实质改稿回到 Step 3，重新说明论证、取舍、可拍表达和原创增量，跑完六关与试读，再用新 hash 封口。

> 封面提示词不在本 skill 范围。chuangzuo 的职责止于「确定来源 + 创作口播初稿」。封面由独立 skill `laohan-fengmianqiuzhi` 在后续流程（违规检查、校准评分通过、标题锁定后）单独产出。

---

## Post-A：NotebookLM 幻灯片（可选，用户要求时执行）

用户要求生成幻灯片时，基于 script.md 用 NotebookLM 生成 PNG 图片：

1. `mkdir -p <script.md所在目录>/slides`
2. `cp script.md <script.md所在目录>/slides/script.md`
3. `nlm notebook create "<标题>PPT"`
4. `nlm source add NOTEBOOK_ID --file <script.md所在目录>/slides/script.md`
5. `echo "y" | nlm slides create NOTEBOOK_ID --language zh-CN --length default`
6. 轮询等待 completed（30秒间隔，最多20轮）
7. `nlm download slide-deck --notebook NOTEBOOK_ID -o <script.md所在目录>/slides/<标题>.pdf`
8. `pdftoppm -png -r 200 <script.md所在目录>/slides/<标题>.pdf <script.md所在目录>/slides/slide`

输出到 `<script.md所在目录>/slides/slide-*.png`

依赖：nlm CLI v0.5.25 + poppler

## 输出路径

```
output/
├── transcript-YYYY-MM-DD.md    ← Pre-A 录屏转录结果
├── content-YYYY-MM-DD.md       ← Pre-B URL 抓取内容
├── organize-YYYY-MM-DD.md      ← Step 1 整理结果（素材模式）
├── outline-YYYY-MM-DD.md       ← Step 1.5 大纲（自由模式/热点模式）
├── script-YYYY-MM-DD.md        ← Step 7 口播初稿（本 skill 唯一终产物）
└── (cover-prompts 不在此产出，由 laohan-fengmianqiuzhi 独立 skill 后续生成)
```

如果 `output/` 不存在，自动创建。

Episode 模式的完整中间产物固定为：

```
episodes/<slug>/
├── 01-口播稿.md
└── 02-创作工作稿/
    ├── 创作决策.json
    ├── 创作决策.md       ← 可选人类摘要
    ├── transcript.md
    ├── content.md
    ├── organize.md
    └── outline.md
```

Episode 模式禁止读取或写入共享 `output/`。

## 依赖

| 依赖 | 用途 | 安装方式 |
|------|------|---------|
| ffmpeg | 音频提取（Pre-A） | `brew install ffmpeg` |
| 硅基流动 API Key | 语音转文字（Pre-A，优先） | 注册 siliconflow.cn |
| whisper.cpp | 本地语音转文字（Pre-A，备选） | `brew install whisper.cpp` |
| nlm CLI + poppler | NotebookLM 幻灯片（Post-A） | `pip install notebooklm-mcp-cli && brew install poppler` |

Pre-A/B 按需依赖，不使用对应模式时无需安装。

## 触发方式

```bash
# 录屏模式（传入视频文件）
/laohan-chuangzuo /path/to/recording.mp4
"把这个录屏视频转成口播稿"

# URL 队列模式
"根据链接改写""链接内容改写""改写文档"

# 大纲模式（传入大纲文件；选题搜索归工作流①）
/laohan-chuangzuo output/outline-YYYY-MM-DD.md

# Episode 模式（00-选题已锁定）
/laohan-chuangzuo --episode episodes/<slug>

# 素材模式（传入原始文本文件）
/laohan-chuangzuo output/transcript.md
/laohan-chuangzuo output/content.md

# 自由模式（直接触发或给主题）
/laohan-chuangzuo
/laohan-chuangzuo "Claude Code 配置技巧"
"帮我写""写口播稿"
```

## 注意事项

- style.md 和教程型风格文件是经过实战验证的默认方法论，不是仅供参考的候选摘要。Episode 合同只能增加真源、事实和落盘约束，不能覆盖或删除其创作方法
- **风格文件**（`references/styles/`）是完全自包含的写作规范，每次创作前必须选择一个风格。通用模式无额外文件，直接用 style.md；其他模式只读对应风格文件
- skill.md 是唯一的整理方法来源，Layer A/B 规则以该文件为准
- 转译选题法详见 `references/yuanchuang-method.md`（转译案例+角度库+标题公式+数据基准）。本 skill 不自带热点搜索；该文件供工作流①前置阶段复用
- 转录技术详见 `references/transcription.md`（音频提取+三级降级）
- 二创脱敏规则（style.md 第十节）：素材来自他人内容时执行；自由模式（原创主题）跳过
- 本 skill 不负责选题搜索（那是工作流①阶段的职责，用 laohan-redian + laohan-douyinsousuo 出大纲后喂入）
- 本 skill 不负责平台特定下载（那是 laohan-xiazai 的职责）
