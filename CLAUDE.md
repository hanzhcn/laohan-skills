# laohan-skills project rules

## Talking-head video workflow

真人口播动画默认采用 CODEX_DIRECT + Remotion：

- ⑨—⑪由同一个 Codex 任务连续完成：完整观看 clean/SRT、写 direct brief 与按需 source manifest、直接实现 Remotion、渲染完整 candidate、完整观看并最多修三轮。`laohan-daoyan`、`laohan-donghua`、AST、双 renderer 与 proposal/extension/seal 只用于 Jeffrey 明确发起的 METHOD_LAB 或历史 episode。
- `laohan-sucai/SKILL.md`：⑩仅在 source manifest 有真实 PROOF/BROLL 请求时供应 provider/license/source/SHA 完整且 visually_verified 的本期素材；无请求标 not_applicable，不创建空素材任务。
- `laohan-bianpai/SKILL.md`：全流程的唯一状态路由器；从 `laohanAI视频创作` 根目录运行，按 artifact + mechanical gate 报告唯一下一步。⑫—⑭在 laohan-yunying 定义前必须 BLOCKED。
- episode 存在且通过 workflow `verify-episode-supersession.mjs` 的 `supersession-record.json` 时，bianpai 必须优先返回 `SUPERSEDED` 并拒绝 vendors/status/next/check；不得覆盖旧 executor lock 或把作废期迁移到新 runtime。
- `laohan-cheat/SKILL.md`：只把 episode 接到上游 `cheat-on-content`，不能保留本地教程型评分公式。教程与观点内容必须分开 calibration lane；state 迁移只允许先 dry-run。
- `laohan-yunying/SKILL.md`：⑫—⑭的抖音运营编排器。发布准备要求 `bianpai check --require final`；真实发布仍必须 Jeffrey 确认。它保存 publish-record、数据快照和评论洞察，随后交给 upstream cheat-publish/retro；不自动发布、回复或改预测。
- ①的 experiment 必须预先声明合法 `metric_keys` 和 T+N 窗口；⑬只有匹配该窗口、播放与全部预注册指标非空的 `measurement_role: TARGET` 快照可完成，其他观测只能标 `CONTEXT`，不得被 retro 当作假设结论。
- `bianpai vendors` 写 schema 3 的 `FROZEN_ON_RESUME` vendor preflight，冻结 `UP_TO_DATE|READY_LOCAL_AHEAD` 状态和 Cheat/dbskill 完整 HEAD SHA。`status/next` 只做本地 HEAD 对照；任一 HEAD 漂移或旧 schema 2 均 BLOCKED，不能猜填或静默迁移。新 episode 必须走 `sync-content-vendors.sh --new-episode` 并创建 `00-编排/executor-lock.json`；registry/runtime 漂移时进行中 schema 2 episode BLOCKED，不得刷新 preflight 静默换执行器。
- `platform-display-evidence.json` 是⑫可选的发布后展示核对；缺失不阻断，存在时必须绑定本期截图/导出、aweme、标题、封面 SHA、final SHA 和三项 MATCHED 人工结论。错绑记录必须使⑫未完成，绝不自动修正或伪造证据。
- ④ score 后只算 PARTIAL，最终盲预测 RECORDED 后才算 COMPLETE；production/final/full 不得接受 PENDING。⑧媒体/SRT、⑨时间轴/PROOF、⑪ workspace/handoff/qa-evidence 都由 workflow 机械 gate 验证。
- ③和⑤不能只凭当前稿 hash 通过：schema 2 的③还必须绑定未过期 ruleset review/expiry/scan 时间并写 `platform_guarantee: false`；⑤的 `04-深扫报告.md` 必须声明 `review_status: CLEAR` 与 `unresolved_issue_count: 0`，`04-事实核验.md` 必须声明 `fact_check_status: CLEAR`、`contradicted_count: 0`、`unverifiable_count: 0`。CONTENT_CLAIMS 在 AUTONOMOUS_RUN 不因通用 HIGH/CRITICAL 确认规则询问用户，而是回②最多三轮修订；不得伪 CLEAR。
- schema 2 NATIVE 不再用 EDL `visual.render_plan` 决定审美：⑨先写 semantic contract/art direction/parity plan/native challenge，再确定性编译 `animation-ast.json`；⑪的两个 proposal/extension 必须绑定 AST/proposal SHA、完整 state/transition 与 capability allow-list。旧 render_plan 仅保留 PARITY 兼容回归，不能作为表现上限。
- NATIVE 生产顺序必须是 proposal → `prepare-renderer-extension` → scaffold → native implementation → `seal-renderer-workspace` → base render → `apply-review-captions` → QA。未 seal workspace、renderer 内嵌字幕或缺 base/SRT/caption-style/candidate 哈希链都必须失败；Remotion/HyperFrames 的 base 都不得自行烧字幕。
- ⑪ QA 的字幕安全区和有声审片结论必须来自独立 `qa-reviews/<renderer>.json`，绑定 candidate SHA、审阅者、时间及具体说明；任何命令行 PASS 都无效。每个 selected beat 均须有 entry/middle/exit 三帧证据。
- ⑧的实际字幕必须经过 `spoken-script-variance.json` 与当前稿的事实差异审阅。任何事实偏离都回②→⑤→④，⑨不得自行解释或继续生产；仅 `CLEAR`、事实偏离为零的当前记录可放行。
- bianpai `vendors` 成功后必须为本期写入绑定 runtime lock 的 `00-编排/vendor-preflight.json`；`status/next` 缺少或检测到漂移时只能 BLOCKED，不能隐式联网或继续路由。
- ⑤必须输出当前稿/事实报告绑定的 claim ledger。每个 PROOF beat 与 proof asset 都要绑定 `SUPPORTED claim_id` 和同源 evidence；只有 URL 或本地文件不能冒充该画面已证明口播事实。
- 配套 workflow 的唯一回归命令是 `cd ~/Documents/laohanAI视频创作 && node scripts/test-workflow-contracts.mjs`；修改被 `workflow-runtime-lock.json` 锁定的 skill 后必须同步更新内容 SHA，否则 bianpai 必须 BLOCKED。
- dbskill 不再由 `npx --all` 更新：完整 vendor 在 `~/Documents/dbskill`，并由 workflow 的 `sync-content-vendors.sh` fast-forward 后受管 symlink 到 Claude/Codex 通用 skills。视频 workflow 只固定调用 dbs-script-flow/dbs-resonate，条件调用 hook/ai-check/spread；其余能力见项目 `docs/dbskill-编排映射.md`。
- ⑨ `laohan-daoyan` 为效果未证默认，⑩ `laohan-sucai` 的合同/降级路线已验证，⑪ `laohan-donghua` 只编排 Remotion/HyperFrames 技术可用默认对。真实本期试片和发布效果未完成前，不得称为 accepted 或效果最优方法。
- `laohan-xiazai` 的抖音下载按其 `references/douyin.md`：先用 `opencli douyin user-videos` 取得临时 `play_url` 并立即下载；opencli 失效才降级到移动端 UA + iesdouyin `_ROUTER_DATA`，再按文档后续降级。抖音不存在 YouTube/yt-dlp 路径。对标/cheat 批量文字转录用 MLX 未量化 large-v3；⑧停顿和词级时间真值用 whisper-timestamped large-v3。ASR-B01 证明 MLX 会合并静音间隔，不能替代⑧；不要使用会出现 NaN/吞吐异常的 Torch MPS。路径见 workflow `CLAUDE.md` 第24条。
- schema 2 的①由 `laohan-redian` 唯一主写 signals/candidates/source-health 与 `00-选题.*`；`laohan-douyinsousuo` 是可独立调用的 OpenCLI 只读取证 adapter，只写抖音证据，两者不合并、不做 programmatic skill-to-skill 调用。`screening_summary` 在同一个 candidates 文件内留下全部 signals→8—12 longlist（不足8个时全部）→短名单链路，不新增节点或第二套打分器。①至少比较两个候选，唯一 SELECTED 必须绑定 PRIMARY；平台可用时再绑定 PLATFORM_SIGNAL，平台预检/查询失败则 `platform_alignment` 与 `content_gap` 均可 `UNAVAILABLE`，不单独阻塞。当前 OpenCLI 1.8.6 的 `douyin search` 只有结果样本，`hashtag hot` 是全站热点，`hashtag search` 实测失败且 `hot --keyword` 不能可靠过滤，禁止反推搜索量、供给总量、增长或内容缺口。source health 仍覆盖 `DISCOVERY|DOUYIN_SEARCH|PRIMARY_PROOF` 并绑定本期结果 SHA；每个 metric key 都有正整数 T+N/DAY、方向、基线和抖音创作者中心来源。`opencli hackernews top` 是当前命令，禁止 `hackernews hot`。不得为①安装 TrendRadar/RSSHub/Obsei 或另一套浏览器/爬虫；外部项目只作设计参考。⑥的旧 skill 名保留兼容，但只产 prompt strategy；真实 image provider 与 selection evidence 必须另行登记，秋芝模板不是默认规律。
- 上游 Cheat 的 prediction anatomy 现统一为所有 calibration 阶段都写 7 组件、bucket、概率、中枢与反事实；cold-start 只降低 Confidence、拉平分布。工作流 `AUTONOMOUS_RUN` 可用 `Review Mode: AUTONOMOUS_AGENT_PROXY`，但不得伪造 Jeffrey 确认或用户覆盖。旧 `2026-07-12-native-method-real-run` 已在拍摄前 SUPERSEDED；当前生产期 `2026-07-16-codex-direct-production` 已真实完成①（92条发现信号、30条OpenCLI抖音关键词证据、3个候选，选中C01），唯一下一步是②写稿。

## Skill 维护

- `laohan-skillcreator` v2.2 先区分 `CREATE|AUDIT|SURGICAL_FIX|OPTIMIZE|UPSTREAM_REFRESH`。明确错误和原版恢复默认走最小修复，不强加评分、blind judge 或全量 held-out；只有效果优化或复杂/高影响创建才冻结 baseline 并做 held-out。修改该 Skill 自身或更新方法时先运行 `bash laohan-skillcreator/scripts/check-upstreams.sh`，只选择性吸收上游有效变化并更新来源 commit。
- 失败分支、checkpoint、反例和危险黑名单必须与 skill 的真实失败面/副作用成比例；不为静态分加假人工 gate、不可能 fallback 或无关危险操作。
- 创建或优化 skill 不隐含 install/package/push/publish 授权。runtime profile 先选 `portable|local`；运行 `bash laohan-skillcreator/scripts/test-redlight-scan.sh` 验证扫描器，字面专属路径只作 warning，由人工判断 capability branch；个人绝对路径仍 fatal。portable 声称还要在每个宣称支持的宿主实测，未测标 `UNVERIFIED`。
- `laohan-shencha` v1.4 先选 `TECH_CLAIMS|CONTENT_CLAIMS`，再选 `AUDIT_ONLY|VERIFY_AND_FIX`。普通“审查/核验”默认只出证据，不自动改文件；只有明确修复授权或工作流合同才修改，且不得借事实核验压缩文风、模板和创作方法。

当前方法论真源：

`/Users/hanzhmacbookair/Documents/laohanAI视频创作/docs/动画效果方法论.md`、`docs/动画生产接口规格.md` 与项目内 `animation-method/`。旧 `/Users/hanzhmacbookair/Documents/视频动画/` 只作历史实验/反例/待迁移证据，未经当前合同重验不得作为 runtime 或方法真源。不要恢复 `laohan-donghua v10` 的固定覆盖率、旧项目路径或模板规则。
