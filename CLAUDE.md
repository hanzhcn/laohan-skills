# laohan-skills project rules

## Talking-head video workflow

真人口播动画采用三段候选协作架构：

- `laohan-daoyan/SKILL.md`：⑨语义导演，输出 beat sheet、EDL、source manifest 和 renderer brief。
- `laohan-sucai/SKILL.md`：⑩并行检索 Pexels、Pixabay、Coverr，并可把指定本地素材库优先加入候选池；记录 provider health、下载、抽帧和复核 BROLL_STOCK 候选素材。必须输出机器可读 素材清单.json，且只有 visually_verified 资产可进入⑪。Mixkit 仅手动补充，不爬虫。
- `laohan-donghua/SKILL.md`：⑪只按 EDL 实现、渲染、字幕末端合成和 QA；禁止固定 coverage、固定 scene 数、旧 student-kit 模板和逐步人工审批默认。
- `laohan-bianpai/SKILL.md`：全流程的唯一状态路由器；从 `laohanAI视频创作` 根目录运行，按 artifact + mechanical gate 报告唯一下一步。⑫—⑭在 laohan-yunying 定义前必须 BLOCKED。
- `laohan-cheat/SKILL.md`：只把 episode 接到上游 `cheat-on-content`，不能保留本地教程型评分公式。教程与观点内容必须分开 calibration lane；state 迁移只允许先 dry-run。
- `laohan-yunying/SKILL.md`：⑫—⑭的抖音运营编排器。发布准备要求 `bianpai check --require final`；真实发布仍必须 Jeffrey 确认。它保存 publish-record、数据快照和评论洞察，随后交给 upstream cheat-publish/retro；不自动发布、回复或改预测。
- ①的 experiment 必须预先声明合法 `metric_keys` 和 T+N 窗口；⑬只有匹配该窗口、播放与全部预注册指标非空的 `measurement_role: TARGET` 快照可完成，其他观测只能标 `CONTEXT`，不得被 retro 当作假设结论。
- `bianpai vendors` 写 schema 2 的 `FROZEN_ON_RESUME` vendor preflight，只冻结当时的 `UP_TO_DATE` 或审计过的 `READY_LOCAL_AHEAD`。新 episode 必须走 `sync-content-vendors.sh --new-episode`；更新可用、待安装、dirty、分叉、远端不可达或 lane schema 不匹配不得开工或伪写 READY。
- `platform-display-evidence.json` 是⑫可选的发布后展示核对；缺失不阻断，存在时必须绑定本期截图/导出、aweme、标题、封面 SHA、final SHA 和三项 MATCHED 人工结论。错绑记录必须使⑫未完成，绝不自动修正或伪造证据。
- ④ score 后只算 PARTIAL，最终盲预测 RECORDED 后才算 COMPLETE；production/final/full 不得接受 PENDING。⑧媒体/SRT、⑨时间轴/PROOF、⑪ workspace/handoff/qa-evidence 都由 workflow 机械 gate 验证。
- ③和⑤不能只凭当前稿 hash 通过：③的 `02-违规报告.md` 必须声明 `risk_status: CLEAR` 与 `unresolved_high_risk_count: 0`；⑤的 `04-深扫报告.md` 必须声明 `review_status: CLEAR` 与 `unresolved_issue_count: 0`，`04-事实核验.md` 必须声明 `fact_check_status: CLEAR`、`contradicted_count: 0`、`unverifiable_count: 0`。`laohan-bianpai`、`laohan-cheat`、`laohan-weigui`、`laohan-shencha` 必须一致拒绝不满足这些结论的 episode。
- ⑪不能把 ILLUSTRATIVE 变成固定圆环、轴线、卡片或配色。⑨必须在 EDL `visual.render_plan` 明确背景及每一层的坐标、尺寸、颜色、文字和动效；⑪只执行该计划，缺计划必须回⑨。
- ⑪ QA 的字幕安全区和有声审片结论必须来自独立 `qa-reviews/<renderer>.json`，绑定 candidate SHA、审阅者、时间及具体说明；任何命令行 PASS 都无效。每个 selected beat 均须有 entry/middle/exit 三帧证据。
- ⑧的实际字幕必须经过 `spoken-script-variance.json` 与当前稿的事实差异审阅。任何事实偏离都回②→⑤→④，⑨不得自行解释或继续生产；仅 `CLEAR`、事实偏离为零的当前记录可放行。
- bianpai `vendors` 成功后必须为本期写入绑定 runtime lock 的 `00-编排/vendor-preflight.json`；`status/next` 缺少或检测到漂移时只能 BLOCKED，不能隐式联网或继续路由。
- ⑤必须输出当前稿/事实报告绑定的 claim ledger。每个 PROOF beat 与 proof asset 都要绑定 `SUPPORTED claim_id` 和同源 evidence；只有 URL 或本地文件不能冒充该画面已证明口播事实。
- 配套 workflow 的唯一回归命令是 `cd ~/Documents/laohanAI视频创作 && node scripts/test-workflow-contracts.mjs`；修改被 `workflow-runtime-lock.json` 锁定的 skill 后必须同步更新内容 SHA，否则 bianpai 必须 BLOCKED。
- dbskill 不再由 `npx --all` 更新：完整 vendor 在 `~/Documents/dbskill`，并由 workflow 的 `sync-content-vendors.sh` fast-forward 后受管 symlink 到 Claude/Codex 通用 skills。视频 workflow 只固定调用 dbs-script-flow/dbs-resonate，条件调用 hook/ai-check/spread；其余能力见项目 `docs/dbskill-编排映射.md`。
- 三者当前为 candidate，真实 Remotion/HyperFrames 双试片及第二视频验证完成前，不得称为稳定或 accepted 方法。
- `laohan-xiazai` 的抖音主下载路线是移动端 UA 请求 `iesdouyin.com/share/video/<aweme_id>`，解析 `window._ROUTER_DATA` 后取 play_addr，并将 playwm 替换为 play；opencli 只做发现/元数据，不得冒充下载器。Apple Silicon 最高精度本地转录使用 MLX + 未量化 Whisper large-v3；不要使用会出现 NaN 或吞吐异常的 Torch MPS。项目级已验证 runtime/model 路径见 `~/Documents/laohanAI视频创作/CLAUDE.md` 第 24 条。

当前方法论真源：

`/Users/hanzhmacbookair/Documents/视频动画/talking-head-method-lab/`

处理真人口播动画时，先读该目录的 `METHOD.md`、`PILOT_BRIEF.md`、`TARGET_BEAT_SHEET.md` 和 `PRODUCTION_ORCHESTRATION.md`。不要恢复 `laohan-donghua v10` 的固定覆盖率、旧项目路径或模板规则。
