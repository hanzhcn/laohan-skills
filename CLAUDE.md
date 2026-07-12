# laohan-skills project rules

## Talking-head video workflow

真人口播动画采用三段候选协作架构：

- `laohan-daoyan/SKILL.md`：⑨语义导演，输出 beat sheet、EDL、source manifest、animation brief、renderer-neutral AST、styleframe 与 animatic。
- `laohan-sucai/SKILL.md`：⑩并行检索 Pexels、Pixabay、Coverr，并可把指定本地素材库优先加入候选池；记录 provider health、下载、抽帧和复核 BROLL_STOCK 候选素材。必须输出机器可读 素材清单.json，且只有 visually_verified 资产可进入⑪。Mixkit 仅手动补充，不爬虫。
- `laohan-donghua/SKILL.md`：⑪只按 AST + approved native proposal/extension 实现、渲染、统一字幕后处理和 QA；禁止固定 coverage、固定 scene 数、旧 student-kit 模板和逐步人工审批默认。
- `laohan-bianpai/SKILL.md`：全流程的唯一状态路由器；从 `laohanAI视频创作` 根目录运行，按 artifact + mechanical gate 报告唯一下一步。⑫—⑭在 laohan-yunying 定义前必须 BLOCKED。
- episode 存在且通过 workflow `verify-episode-supersession.mjs` 的 `supersession-record.json` 时，bianpai 必须优先返回 `SUPERSEDED` 并拒绝 vendors/status/next/check；不得覆盖旧 executor lock 或把作废期迁移到新 runtime。
- `laohan-cheat/SKILL.md`：只把 episode 接到上游 `cheat-on-content`，不能保留本地教程型评分公式。教程与观点内容必须分开 calibration lane；state 迁移只允许先 dry-run。
- `laohan-yunying/SKILL.md`：⑫—⑭的抖音运营编排器。发布准备要求 `bianpai check --require final`；真实发布仍必须 Jeffrey 确认。它保存 publish-record、数据快照和评论洞察，随后交给 upstream cheat-publish/retro；不自动发布、回复或改预测。
- ①的 experiment 必须预先声明合法 `metric_keys` 和 T+N 窗口；⑬只有匹配该窗口、播放与全部预注册指标非空的 `measurement_role: TARGET` 快照可完成，其他观测只能标 `CONTEXT`，不得被 retro 当作假设结论。
- `bianpai vendors` 写 schema 2 的 `FROZEN_ON_RESUME` vendor preflight，只冻结当时的 `UP_TO_DATE` 或审计过的 `READY_LOCAL_AHEAD`。新 episode 必须走 `sync-content-vendors.sh --new-episode` 并创建 `00-编排/executor-lock.json`；registry/runtime 漂移时进行中 schema 2 episode BLOCKED，不得刷新 preflight 静默换执行器。
- `platform-display-evidence.json` 是⑫可选的发布后展示核对；缺失不阻断，存在时必须绑定本期截图/导出、aweme、标题、封面 SHA、final SHA 和三项 MATCHED 人工结论。错绑记录必须使⑫未完成，绝不自动修正或伪造证据。
- ④ score 后只算 PARTIAL，最终盲预测 RECORDED 后才算 COMPLETE；production/final/full 不得接受 PENDING。⑧媒体/SRT、⑨时间轴/PROOF、⑪ workspace/handoff/qa-evidence 都由 workflow 机械 gate 验证。
- ③和⑤不能只凭当前稿 hash 通过：schema 2 的③还必须绑定未过期 ruleset review/expiry/scan 时间并写 `platform_guarantee: false`；⑤的 `04-深扫报告.md` 必须声明 `review_status: CLEAR` 与 `unresolved_issue_count: 0`，`04-事实核验.md` 必须声明 `fact_check_status: CLEAR`、`contradicted_count: 0`、`unverifiable_count: 0`。CONTENT_CLAIMS 在 AUTONOMOUS_RUN 不因通用 HIGH/CRITICAL 确认规则询问用户，而是回②最多三轮修订；不得伪 CLEAR。
- schema 2 NATIVE 不再用 EDL `visual.render_plan` 决定审美：⑨先写 semantic contract/art direction/parity plan/native challenge，再确定性编译 `animation-ast.json`；⑪的两个 proposal/extension 必须绑定 AST/proposal SHA、完整 state/transition 与 capability allow-list。旧 render_plan 仅保留 PARITY 兼容回归，不能作为表现上限。
- ⑪ QA 的字幕安全区和有声审片结论必须来自独立 `qa-reviews/<renderer>.json`，绑定 candidate SHA、审阅者、时间及具体说明；任何命令行 PASS 都无效。每个 selected beat 均须有 entry/middle/exit 三帧证据。
- ⑧的实际字幕必须经过 `spoken-script-variance.json` 与当前稿的事实差异审阅。任何事实偏离都回②→⑤→④，⑨不得自行解释或继续生产；仅 `CLEAR`、事实偏离为零的当前记录可放行。
- bianpai `vendors` 成功后必须为本期写入绑定 runtime lock 的 `00-编排/vendor-preflight.json`；`status/next` 缺少或检测到漂移时只能 BLOCKED，不能隐式联网或继续路由。
- ⑤必须输出当前稿/事实报告绑定的 claim ledger。每个 PROOF beat 与 proof asset 都要绑定 `SUPPORTED claim_id` 和同源 evidence；只有 URL 或本地文件不能冒充该画面已证明口播事实。
- 配套 workflow 的唯一回归命令是 `cd ~/Documents/laohanAI视频创作 && node scripts/test-workflow-contracts.mjs`；修改被 `workflow-runtime-lock.json` 锁定的 skill 后必须同步更新内容 SHA，否则 bianpai 必须 BLOCKED。
- dbskill 不再由 `npx --all` 更新：完整 vendor 在 `~/Documents/dbskill`，并由 workflow 的 `sync-content-vendors.sh` fast-forward 后受管 symlink 到 Claude/Codex 通用 skills。视频 workflow 只固定调用 dbs-script-flow/dbs-resonate，条件调用 hook/ai-check/spread；其余能力见项目 `docs/dbskill-编排映射.md`。
- ⑨ `laohan-daoyan` 为效果未证默认，⑩ `laohan-sucai` 的合同/降级路线已验证，⑪ `laohan-donghua` 只编排 Remotion/HyperFrames 技术可用默认对。真实本期试片和发布效果未完成前，不得称为 accepted 或效果最优方法。
- `laohan-xiazai` 的抖音下载按其 `references/douyin.md`：先用 `opencli douyin user-videos` 取得临时 `play_url` 并立即下载；opencli 失效才降级到移动端 UA + iesdouyin `_ROUTER_DATA`，再按文档后续降级。抖音不存在 YouTube/yt-dlp 路径。对标/cheat 批量文字转录用 MLX 未量化 large-v3；⑧停顿和词级时间真值用 whisper-timestamped large-v3。ASR-B01 证明 MLX 会合并静音间隔，不能替代⑧；不要使用会出现 NaN/吞吐异常的 Torch MPS。路径见 workflow `CLAUDE.md` 第24条。
- schema 2 的①必须写 source health 和带 `PRIMARY|PLATFORM_SIGNAL|SECONDARY`、URL/time 的 evidence；`opencli hackernews top` 是当前命令，禁止 `hackernews hot`。⑥的旧 skill 名保留兼容，但只产 prompt strategy；真实 image provider 与 selection evidence 必须另行登记，秋芝模板不是默认规律。

## Skill 维护

- `laohan-skillcreator` v2.1 的 6/9 维分只是静态诊断，不是发布或接受证明。改动前冻结 runtime/model/tools/样本/指标，一轮修一个可检验的行为假设；确定性 skill 用独立机械 verifier + held-out，主观 skill 用 blind judge + held-out，不退化后才本地 commit。
- 失败分支、checkpoint、反例和危险黑名单必须与 skill 的真实失败面/副作用成比例；不为静态分加假人工 gate、不可能 fallback 或无关危险操作。
- 创建或优化 skill 不隐含 install/package/push/publish 授权。runtime profile 先选 `portable|local`；运行 `bash laohan-skillcreator/scripts/test-redlight-scan.sh` 验证扫描器，portable 声称还要在每个宣称支持的宿主实测，未测标 `UNVERIFIED`。

当前方法论真源：

`/Users/hanzhmacbookair/Documents/laohanAI视频创作/docs/动画效果方法论.md`、`docs/动画生产接口规格.md` 与项目内 `animation-method/`。旧 `/Users/hanzhmacbookair/Documents/视频动画/` 只作历史实验/反例/待迁移证据，未经当前合同重验不得作为 runtime 或方法真源。不要恢复 `laohan-donghua v10` 的固定覆盖率、旧项目路径或模板规则。
