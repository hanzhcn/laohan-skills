# v1.21 OPTIMIZE记录

- baseline：v1.20（Git见本commit父提交）。生图为手动环节：skill产出`cover-prompts.md`三条prompt后，由Jeffrey在链路外工具（Seedream系）手动生成三张成图。
- 用户目标：qiuzhi直接出图（2026-10-16 Jeffrey指示"好好学会image-use的用法，先优化使用方法，再接入，要严谨"）。半自动化：prompt合同不变，生图动作换成可执行CLI。
- 引擎选型：`image-use` v0.34.0（leeguooooo/image-use，走ChatGPT订阅codex后端，服务端模型`gpt-image-2-codex`）。对比过pi-codex-image-gen（需装Pi代理）、gpt-image-skill（12 commits早期）、宝玉codex-imagegen（本地未装引擎）、硅基流动（无reference能力）、智谱CogView（API余额新付费点）后选定；依据：ChatGPT订阅复用零新增付费点、参考图显式传递、392★/165 commits活跃维护、npx skills体系原生安装。宝玉系留作第二引擎备胎。
- 保留质量锚：03KV基线prompt措辞（`samples/baseline-cover-03-kv-prompt.txt`）不动；三尺寸/7逻辑入口/12复核判据/重采上限2次全部不降级；参考图仍为每期`reference/jeffrey-reference.jpg`合同真源。
- 已知行为差异（2026-10-16实测，全部写入SKILL.md）：①`--quality`/`--image-model`被codex后端服务端改写为auto，不传，以saved line实际值为准；②尺寸按比例就近出档（3:4→1086×1448、4:3→1448×1086、16:9→1672×941），需magick等比重采样补硬尺寸并记录；③gpt-image人物放大倾向（实测头部33%—35% vs prompt声明22%），`faceProminent`/`compositionIntegrated`判据从严并新增照片质感硬判；④无seed参数，重采规则从"修正prompt和seed"改为"修正prompt重新生成"。
- 接入前验证：5次真实生图实测（简化词×3：中文渲染/参考图人脸/16:9档位；基线措辞×2：3:4与4:3）。zai多模态逐项复核结论：中文标题零乱码（逐字核对）、身份特征7/7命中（痣/胡型/眼镜/刘海/脸型/肤色/神态）、基线措辞下头部为真实照片质感（毛孔/胡茬颗粒/真实发丝）。简化措辞会退化成3D卡通脸——生图必须用03KV基线photoreal措辞，此为硬要求。
- 验证命令：`node laohan-fengmianqiuzhi/tests/test-contract.mjs`（合同静态测试）。
- 回滚：git revert本commit即回到v1.20手动生图流程；image-use CLI独立于本skill，不影响其他工作流。
