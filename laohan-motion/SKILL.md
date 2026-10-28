---
name: laohan-motion
version: "1.0.0"
description: 数字人×Motion模板视频制作总入口（路线④）。从锁定口播稿到成片交付的全链编排：配音→同声口型→拼接→全库模板选型→导演→production-guard门链→异模型复核→交付。Use when 用户说"创作motion视频""做motion片""motion制作""数字人motion路线""走motion模板"或锁定稿后选择数字人×Motion模板路线。
---

# laohan-motion · 数字人×Motion模板制作入口

本skill是Motion正式路线的制作编排入口，**不是方法真源**。方法、门与合同只认视频项目内的现行文件；本skill与项目真源冲突时，以项目真源为准，并按laohan-skillcreator流程回本仓修订skill。

项目根固定：`/Users/hanzhmacbookair/Documents/laohanvideo`（下文相对路径均从此起算）。

## 触发与反触发

**触发**：创作/制作motion视频、motion路线出片、数字人×Motion模板、锁定稿后走Motion。

**反触发（分流到对应入口）**：
- 原生Remotion episode（真人横/竖屏、digital_human_portrait竖屏）→ laohan-bianpai / laohan-daoyan。Motion期不建 `episodes/<slug>`、不占原生在制期名额、不跑 `new-episode`/`production-route`/`orchestrate-step`/0—⑭回执与0号门。
- 历史AST、双renderer对照、恢复历史episode → laohan-donghua。
- 选题与写稿（未锁定稿）→ laohan-xuanti / laohan-chuangzuo；本skill从锁定稿起接。
- 声音模型训练（复刻博主音色）→ laohan-yinse；v3-05是老韩已训音色模型，其每期WAV由项目侧产出。
- 发布与运营（⑫—⑭）→ 两路共用，按四平台发布规格；Jeffrey手动点击发布。

## 开工必读（漂移自检，每次执行）

按序读取并核对存在；缺任一文件或内容明显改版（如stage清单变化）→ 停止并报告漂移，不凭记忆继续：

1. `motion/mastery/PIPELINE.md` — 命令与门链唯一真源
2. `motion/mastery/PRODUCTION-METHOD-V4.md` — 制作方法现行版
3. `motion/mastery/DH-ROUTE.md` §一A—一C — 声音/口型/拼接真源
4. `motion/mastery/delivery-requirements.json` — 用户画幅与质量要求真源（当前landscape 16:9；质量第一原则、无限用好模板是底线）
5. `motion/mastery/current-release.json` — helper与模板包身份/SHA（当前helper 1.0.0-rc.32；包T01—T06，版本以该文件为准）
6. `motion/mastery/pronunciations.json` — 发音表真源
7. `docs/工作区生产合同.md` §一 — Motion边界与凭据红线
8. `docs/视频生产入口与适配.md`「Motion正式路线接入」节 — 交接点/目录规范/分流/门豁免
9. `STATUS.md` 当前任务区 — 本期状态与在途工程（已存在同期工程先续接，不另起）

## 输入契约

- **锁定口播稿**：script-pool或episode候选经Jeffrey接受/锁定；未锁定→先回xuanti/chuangzuo链，不代写代锁。
- **显示稿与发音稿分开**：标识符按原名显示；`laohan-*`标识符按`pronunciations.json`中文读音（如laohan-sousuo读"老韩搜索"），未知项报未定，不按拉丁字母拼读。
- **交付要求只认delivery-requirements.json**：手机反馈、竖屏人物源、模板portrait能力都不是变更授权；只有Jeffrey明确新指令才更新该文件。
- **新稿必有新WAV**：每期v3-05合成整稿WAV并经Jeffrey整轨听感通过后绑定路径/SHA/采样数与接受记录；不消费历史162.68s音轨，不因模板自带TTS重念。

## 制作七步（骨架）

细节、失败处置与逐步输入输出见 `references/full-chain.md`。

| # | 步骤 | 执行位置 | 关键产物 |
|---|------|---------|---------|
| 1 | 文案定稿（锁定稿交接） | Mac | 冻结显示稿+发音稿 |
| 2 | 最终配音（v3-05合成，Jeffrey听感通过） | pro6000-a服务器GPU，Mac保存试听 | 本期WAV+SHA+接受记录 |
| 3 | 基础形象（合格素材复用优先；确需新素材走`motion/tools/dh-generate-clean.mjs`） | 本地/产品服务器 | 人物素材 |
| 4 | 同声口型（WAV驱动，`same-voice-local.py`分块+`run-same-voice-remote.py`推理） | pro6000-a GPU，Mac调度 | 口型分块+清单SHA |
| 5 | 画面拼接（裁核心帧、全局时钟拼合，Mac FFmpeg） | Mac | 完整人物画面，原WAV为唯一主声 |
| 6 | 导演与模板（声学对齐→全库选型→production-guard门链→plan/pilot/复核/render） | Mac本地 | 官方工程+参数+回执 |
| 7 | 混音与交付（check-delivery带--video→Jeffrey实际听看接受） | Mac | 成片+accepted-final登记 |

## 门链（命令形态；字段与argv细节以PIPELINE为准）

所有plan/render/delivery必须经共同入口，直接调helper是显式旁路、不登记门通过：

```sh
# ① 声学对齐（写参数前；真实Whisper large-v3对齐+来源回执）
python3 motion/tools/align-source.py --audio 实际候选声音.wav --spoken-script 发音稿.txt --out 全新词源目录

# ②—⑥ 共同制作入口（--record指向本期production.json）
python3 motion/tools/production-guard.py --record 本期/production.json --stage direct    # 登记编排+全库选型，封存revision
python3 motion/tools/production-guard.py --record 本期/production.json --stage plan  -- node 已核helper.mjs run 实际.motion 原包plan其余参数
python3 motion/tools/production-guard.py --record 本期/pilot.production.json --stage pilot -- node ... render ...   # 独立kind=pilot记录
python3 motion/tools/production-guard.py --record 本期/production.json --stage review-brief --sample 本期/qa/样段A.mp4 [--sample 样段B.mp4]
python3 motion/tools/production-guard.py --record 本期/production.json --stage render -- node ... render ...
python3 motion/tools/production-guard.py --record 本期/production.json --stage delivery

# 画幅/字幕只读检查：plan前一次；交付前同命令加 --video 实际成片.mp4
PATH="/opt/homebrew/bin:$PATH" python3 motion/tools/check-delivery.py \
  --params 本期参数.json --captions 本期字幕 --script 冻结纯口播稿.txt \
  --asr 原ASR.json --input-root 本期素材目录
```

顺序硬约束：正式plan必须引用direct登记的当前revision；首次动态样段先pilot独立登记（避免审核自依赖）；真实plan/preview+实际样段齐备后先review-brief生成完整复核任务，异模型复核通过才render；render/delivery重核全部bindings；参数/素材/声音/编排任何变化→新revision→重新plan/预览/复核，旧回执不补签。

## 模板全库选型（正式片direct前置，强制）

四步：**全库刷新→候选比较→按需取得并验证→确认或重选**。`production.json`提供`template_selection`指向本期`template-selection.json`（schema=`laohan.motion-template-selection/1`）。要点：从本稿提取必须完成的视觉任务→全catalog轻量筛2—4个入围候选（本地与库外同池，各带"本稿哪段需要什么→模板哪项能力承担→依据→待验证"理由）；选中不在本地按官方流程下载验签登记current-release；同族复用必须写`reuse_comparison`与最强异族备选比较；否决项记`rejections`理由。不从本机已装包惯性重复，作者免费公开分发模板包视为已有下载授权（2026-10-28 Jeffrey指令）。字段细节见PIPELINE「模板全库选型」节。

## 异模型复核与验收

- review-brief生成完整复核任务（真源=`motion/mastery/VISUAL-REVIEW-BRIEF.md`），连同样段交异模型实际观看，不能只转发文件路径。
- 复核模型按全局优先级：GLM→codex→Magpie免费DeepSeek→官方ds（禁guiji；与实现者同家族被guard拒绝）；调用满配不降思考档。
- review schema=`laohan.motion-visual-review/1`，scope九项：subtitle-style/subtitle-breaks/action-sequence/semantic-content/viewer-comprehension/presenter-staging/pacing-hierarchy/sample-coverage，final另有whole_film_review。pilot_review必须覆盖请求中全部样段。
- 负责人逐项裁决后登记；不编JSON冒充调用；原REVISE不得改写。
- Jeffrey实际接受才算final；机械PASS（`MACHINE_CHECKS_PASSED_NOT_ACCEPTANCE`）≠接受。

## 红线

- **不自动发布**；发布=Jeffrey手动点击。Motion期发布预填按现行实践：工程`deliveries/accepted-final.json`登记+真实Chrome预填+页面回读。
- `motion/runs/`、媒体原件、凭据不入git；原包只读、不私改、不手拆保护核心。
- 凭据零入档；Motion标识疑似泄露按合同§一处置（停调用、记录、账号持有人官网撤销），不擅自换Key。
- 线上产品代码不动；产品侧只读；服务器成片回传本地并登记SHA后，同批删该任务chunk与preprocess缓存（批量删非本任务产物先跨模型复核）。
- 物理变速另建候选派生（人物/原声同倍率保音高，字幕/词界/时点统一换算一次），原速输入不覆盖；`speed=1`时声音SHA必须相等。
- Motion期豁免的门只限原生Remotion链；共用门照常：发布信息与#AI新星计划、违规检测、候选接受与发布授权、远程算力纪律、Git纪律。

## 输出与完成证据

- 工程目录：`motion/projects/YYYYMMDD-<slug>/`（production.json、director.md、inputs/、qa/、references/、instance/、`deliveries/`子目录）。
- 候选/定稿成片与manifest/qa回执归工程`deliveries/`子目录；输入、最终参数、官方工程及QA归工程目录。
- STATUS.md登记本期制作状态；接受记录=工程`deliveries/accepted-final.json`。
- 完成证据链：来源回执（align-source）→direct revision回执→plan成功回执→pilot样段→review-brief请求+异模型response→render bindings→delivery final_review→check-delivery(--video)通过→Jeffrey接受登记。缺环不称完成。
