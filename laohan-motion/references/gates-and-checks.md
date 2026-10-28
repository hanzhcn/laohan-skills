# 门链、检查器与分支要点

真源：`motion/mastery/PIPELINE.md`、`motion/mastery/current-release.json`、`motion/mastery/DELIVERY-CHECK-SPEC.md`。本文是执行浓缩，冲突时以真源为准。

## production-guard 六个 stage

| stage | 前置 | 检查/动作 | 产出 |
|---|---|---|---|
| direct | director.md+全部输入字段+template_selection（正式片） | 封存编排与输入摘要为新revision；核选型记录 | `.production-receipts/<记录>/` revision + `director_record`引用 |
| plan | 当前revision | 核revision/输入稳定→执行原包plan→快照官方plan初始字节 | plan成功回执 |
| pilot | kind=pilot记录（director_parent+source_excerpt） | 复用父编排正文、核同模板/分支/原始声音、逐样本核PCM | 样段渲染输出（仅qa/目录） |
| review-brief | 真实plan/preview+实际样段 | 生成完整复核任务brief+request，写回`pilot_review_request` | review bindings+`review_request` SHA |
| render | plan回执+pilot_review全样段覆盖 | 重核用户要求/编排/计划/预览/请求/样段字节→执行原包render | render bindings |
| delivery | final_review（whole_film_review） | 声源、动态样段、异模型与最终视频检查 | 交付回执 |

硬规则：快照/历史回执只追加；入口生成版本/顺序，不以mtime或自填时间证明事前；旧候选不补造登记；参数调整也重plan/预览/复核。

## production.json 必备字段（schema=laohan.motion-production/1）

`director`、`template_contract`（所选公开契约路径）、`director_assets`、`params/captions/script/asr/source_record/pronunciations/visual_reference/input_root`、原包`workflow`、`helper/template`路径与SHA、正式`output`；正式片另加`template_selection`。render期进`official_plan/official_preview/pilot_review`；delivery期进`final_review`。`speed=1`时与来源回执声音SHA必须相等。路径相对该记录；文件名不能替代字节绑定；除人物/声音/音乐外，段内及嵌套素材槽也绑定字节，动态样段须为可实际解码多帧视频。

## template-selection.json 要点（schema=laohan.motion-template-selection/1）

- `record`回指该production.json；`catalog`记录全库刷新状态（fresh/stale-fallback+可信快照`{path,sha256}`行）。
- 候选≥2（strip/casefold后身份唯一）各带非空理由；`recent_usage`从最近发布期真实生产记录派生并带`reference:{path,sha256}`。
- `selected`包SHA与实际template一致；同族复用必带`reuse_comparison`；`rejections`带理由。
- guard只做机械检查（存在性/身份/数量/引用/SHA），不评理由好坏、不算审美分、不强制选新模板。
- 全库刷新失败降级stale-fallback（沿用最后成功快照+note记原因）；无任何可信快照时只可继续构思，不得宣称完成全库选型。
- 2026-10-28前已封存revision的旧工程重放按封存时工具版本执行，不追溯补selection；返修旧片走新revision时补登记录。

## 异模型复核登记（schema=laohan.motion-visual-review/1）

字段：实际reviewer_model/implementer_model、decision=APPROVE、当前输入bindings、复核scope、findings_resolved、实际动态媒体samples、独立response路径/SHA。scope九项：subtitle-style、subtitle-breaks、action-sequence、semantic-content、viewer-comprehension、presenter-staging、pacing-hierarchy、sample-coverage（final另whole_film_review）。约束：不能编JSON冒充调用；response字节存在不证明模型来源或内容有效，负责人须核实际模型完整终态、原始结论并逐项裁决；完整scope+无明显错误不单独构成APPROVE；缺失/过期/同家族/静帧冒充动态拒绝。

## check-delivery.py（只读检查器）

```sh
# plan前
PATH="/opt/homebrew/bin:$PATH" python3 motion/tools/check-delivery.py \
  --params 本期参数.json --captions 本期实际字幕文件 --script 冻结纯口播稿.txt \
  --asr 原ASR.json --input-root 本期实际素材目录
# 交付前：同命令加 --video 实际成片.mp4
```

- 检查：用户画幅（layout/timeline.layout/brief.layout，冲突拒绝静默择一）、字幕全文与冻结稿、词跨度对应、units词锚、字幕不超视频轨、显示文本字面对拍（只忽略换行）与语音侧口径分开。
- 原ASR同音错误用`--corrections`（结构见PIPELINE；只支持归一化后等长局部替换）。
- 已登记统一变速用`--speed`换算原ASR轴一次。
- 返回`MACHINE_CHECKS_PASSED_NOT_ACCEPTANCE`只证明本次覆盖的确定性事实；字号/美化/语义断句/烧录/连续口型/听感仍需实际复看。
- 多消费槽歧义/未支持结构→记UNVERIFIED沿原包公开校验，不为过检查改分支或删槽。
- 检查器只输出stdout；留证在已有执行记录中另存工程外新文件。

## 分支与命令差异（以current-release.json+所选包公开契约为准）

- 官方制作链（本机个人包）：new → setup/doctor → check-params → plan → 实际审阅 → prepare → 实际preview/动态检查 → render；已有缓存doctor、缺缓存才setup。
- **motion-kit（T01—T05）**：`--workflow motion-kit`；cache传不带`-kit`的基名；prepare用字面量`@vault`及`--inputs @vault`（不是路径）；整句`s/e/text`字幕；审阅=plan/review.json+project/preview.json的reviewed键。
- **poster-kit（T06）**：顶层timeline文件用`--workflow poster-kit --timeline <文件>`；媒体相对该文件；check-params/plan读`--timeline`；prepare/preview/render用`--timeline @vault --plan ...`；独立缓存；计划审阅=extension-plan/host-plan.json，预览审阅=extension-preview/preview-review.json，render另带`--preview-review`；公开`captions[].units`接实际ASR词记录。
- **原生组**：各包自己的schema与字幕合同（如T01 `captions.nativeContract`的t0/t1/zh/en/highlight.units词时间扫色；T04原生`subtitleLanguage`自槽；T06原生t0/t1/zh/en/highlight）；native人物脸窗是导入720×1280帧坐标。
- 分支不能混排（T04原生与components不同时轴混排是真实包边界）；不复制一个包的字段到另一个包。
- 原包只读：先读随包入口、所选分支guide/schema、素材/时间/音频说明；缺省按本包`ifMissing`合同处理；权利按模板与素材许可分别判断。

## 口播beats与控件cue

两者分开：前者保留真实完整句及区间；后者只按本实例公开`plan/spec.json`中`controls[control].cues.count/meaning`等实际角色设置。不能把所有ASR句起点填进每种控件，也不靠塞多余cue清掉长停留提示。

## 环境与工具事实

- 生产命令统一`PATH="/opt/homebrew/bin:$PATH"`；本机Node22/Conda Python3.13/FFmpeg。
- helper/包SHA只认current-release.json与本期实核；固定官网更新检查`https://motiongit.com/assets/motion-runtimes/latest.json`（查询失败只记未确认；查到新版≠旧版失效，不热替换）。
- 官网通用教程/GitHub样板/个人包可能属不同版本族，不能按同名互换输入或验收。
- Motion原包与原生Remotion是两条路线：不调用`digital_human_portrait`/`motion_explainer`、不套用固定舞台/小窗默认/默认倍率。

## 与主干（原生Remotion）的边界

- 交接点：锁定稿→`motion/projects/<日期-slug>/`，登记稿件/声音/口型/导演/交付身份及SHA；交接记录落工程目录或STATUS对应任务区。
- 豁免：new-episode/production-route/orchestrate-step/0—⑭回执/0号门/episode归档要求。
- 共用门照常：发布信息+#AI新星计划、违规检测、候选接受与发布授权、远程算力产物纪律、Git纪律；⑫—⑭发布/运营两路共用。
