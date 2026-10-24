# OPENCLAW-TO-NPX-20261024

用户要求把剩余4个共享技能通过npx安装，并彻底清理OpenClaw全局技能目录。

## 变更

- 使用已安装的skills CLI 1.7.4，将baidu-search、multi-search-engine、web-search、summarize安装为`~/.agents/skills/`中的实体；Claude入口统一桥接此共享目录。
- ClawHub当前返回409，因此由真实npx从保留原包的本地来源目录导入，锁文件记录`sourceType=local`。没有伪装为可远端自动更新，也没有升级第三方正文；仅summarize的安装名由中文规范回summarize，正文不变。
- 备份移出整个`~/.openclaw/skills`，包括7个实体目录及98个出口软链；不删除软链目标，不卸载OpenClaw应用、配置或workspace数据。
- laohan-xiazai 1.6.0→1.6.1：修正三条搜索兜底路径，移除搜索必须安装OpenClaw的错误前提；搜索优先级、方法、依赖与其余内容保持。当前视频registry/runtime-lock没有绑定本skill，未改锁。

## 验收与边界

- 真实隔离npx试装4项成功；全局npx安装4项及CLI生成的local锁均成功；既有其他锁条目保持。原始来源包保留，供追溯及本地重装。
- npx全局清单在限定universal范围、stdout直接保存为普通文件时完整返回，四项实际目录与local来源可核对。此前全宿主列表30秒超时、管道JSON截断均未算通过，失败回执保留。
- 5922个既有外部入口核对，批准的四项60个别名迁入共享目录；其余入口目标/内容保持（自有本skill批准正文修正除外）。
- Codex原生目录确认四项启用且路径为共享目录，其他技能启用/路径保持；cheat家族15项仍全部来自本源。
- 看板接口及浏览器：OpenClaw 0，npx 74，总550，健康告警不增；旧全局OpenClaw技能路径实际不存在。
- 自研skill旧路径真实红测退出1，修正后路径和四项目标可读检查通过；候选SHA与本次最终文件一致，git diff检查通过。
- 免费Magpie DeepSeek175秒无响应失败留档，随后免费Step实际HTTP200、actual step-5-preview、stop、非空APPROVE且无finding。没有收费回退。
- 不跑技能业务，不执行付费搜索或发布，不改内容项目数据；只证明安装、目录及引用接线正确，未宣称业务效果验证或旧会话上下文被重写。无部署，NOT_APPLICABLE。

本机完整证据与恢复映射在本次OpenClaw迁移npx审计目录；旧目录、旧入口字面值、锁与skill均可按journal恢复，拒绝覆盖后续变动。
