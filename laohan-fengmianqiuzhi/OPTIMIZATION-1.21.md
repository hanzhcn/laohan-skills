# v1.21 OPTIMIZE记录

- baseline：v1.20（Git见本commit父提交）。生图为手动环节：skill产出`cover-prompts.md`三条prompt后，由Jeffrey在链路外工具（Seedream系）手动生成三张成图。
- 用户目标：qiuzhi直接出图（2026-10-16 Jeffrey指示"好好学会image-use的用法，先优化使用方法，再接入，要严谨"）。半自动化：prompt合同不变，生图动作换成可执行CLI。
- 引擎选型：`image-use` v0.34.0（leeguooooo/image-use，走ChatGPT订阅codex后端，服务端模型`gpt-image-2-codex`）。对比过pi-codex-image-gen（需装Pi代理）、gpt-image-skill（12 commits早期）、宝玉codex-imagegen（本地未装引擎）、硅基流动（无reference能力）、智谱CogView（API余额新付费点）后选定；依据：ChatGPT订阅复用零新增付费点、参考图显式传递、392★/165 commits活跃维护、npx skills体系原生安装。宝玉系留作第二引擎备胎。
- 保留质量锚：03KV基线prompt措辞（`samples/baseline-cover-03-kv-prompt.txt`）不动；三尺寸/7逻辑入口/12复核判据/重采上限2次全部不降级；参考图仍为每期`reference/jeffrey-reference.jpg`合同真源。
- 已知行为差异（2026-10-16实测，全部写入SKILL.md）：①`--quality`/`--image-model`被codex后端服务端改写为auto，不传，以saved line实际值为准；②尺寸按比例就近出档（3:4→1086×1448、4:3→1448×1086、16:9→1672×941），需magick等比重采样补硬尺寸并记录；③gpt-image人物放大倾向（实测头部33%—35% vs prompt声明22%），`faceProminent`/`compositionIntegrated`判据从严并新增照片质感硬判；④无seed参数，重采规则从"修正prompt和seed"改为"修正prompt重新生成"。
- 接入前验证：5次真实生图实测（简化词×3：中文渲染/参考图人脸/16:9档位；基线措辞×2：3:4与4:3）。zai多模态逐项复核结论：中文标题零乱码（逐字核对）、身份特征7/7命中（痣/胡型/眼镜/刘海/脸型/肤色/神态）、基线措辞下头部为真实照片质感（毛孔/胡茬颗粒/真实发丝）。简化措辞会退化成3D卡通脸——生图必须用03KV基线photoreal措辞，此为硬要求。
- 验证性质声明：上述实测是**引擎能力验证，不是成品验收**——两张基线样张头部占比33%—35%超出合同16%—26%区间，按v1.21判据本身应判失败走重采，属预期（验证的是引擎上限能力而非过门成品）；16:9基线措辞、重采链路、硬尺寸成品与12判据完整走门留待下期真实封面流程闭环。"中文零乱码、身份7/7"仅为本批5样本观察，不外推稳定成功率。
- v1.21.1修复轮（codex跨模型审查，2026-10-16）：codex独立审查（变异测试+离线反例复现）报1 HIGH/4 MED/2 LOW，全部采纳修复：①HIGH——默认style/character资产会与当期`-i`抢4张附图上限致参考被丢或混旧脸（已复现），标准命令加`--no-style`+附图清单核验；②MED——`IMAGE_USE_CODEX_PROVIDER`可把`--backend codex`导向第三方relay致参考图外发，加`--codex-provider ""`显式锁定OAuth（argparse显式空值覆盖env default，源码L6011/L1239实证）；③MED——1672×941非精确16:9（差8/15056），等比只得1919×1080，容差规则定为≤0.1%比例偏差内允许像素对齐、超差拒收重采；④MED——测试词存在断言保护力弱（5种变异全过），补关键flag/尺寸值/重采上限断言；⑤LOW——"改写为auto"措辞修正（`--image-model`是无效杠杆非改成auto，quality=为服务端最终值）；⑥LOW——`noWatermark`限定可见水印，C2PA不可见来源标记不判失败不清除。codex另确认PASS：方法论零降级、照片质感硬判属强化非冲突、去seed合理、429停止规则正确、无凭据暴露路径、自用封面不违反上游ToS对外服务禁令。
- 验证命令：`node laohan-fengmianqiuzhi/tests/test-contract.mjs`（合同静态测试）。
- 回滚：git revert本commit即回到v1.20手动生图流程；image-use CLI独立于本skill，不影响其他工作流。
