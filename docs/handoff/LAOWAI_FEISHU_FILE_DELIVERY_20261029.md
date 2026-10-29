# 飞书大文件原片交付：定点修复

2026-10-29，root。源候选9880b5dbd286c6a86cd55505c83d47e6f1bed99e，仅laohan-laowai交付节新增两条。正式片38,850,428字节超过机器人30MB限制，两种MB口径均超限。既有脚本附件失败可能exit0，原生本地附件嵌入post.files，不能误判重发。

真实入口使用已登录飞书客户端同一github每日推送会话发送原文件一次；消息om_x100b6100808ac4b0ce39099faaa2dd5及资源回下载HTTP200，SHA9c46fb91652985073b5a0ca6b72d7294310af9d1e499776c36bd156a81df7efa与本地一致。没有改共享脚本、压缩原片、扩大收件或公开文件。

独立GLM-5.3满配max/128000/1800，一次87.784秒VALIDATED/end_turn，CLI HTTP=UNVERIFIED_CLI。静态对抗覆盖：卡片成功但附件失败、post.files与重复发送、压缩冒原片、客户端失效与目标/公开越界、发送冒手机/听感接受，PASS无finding。模型仅检查给定文本和证据，没有独立操作客户端、调用API或听片。30MB口径与条件回下载两观察无需修改，本期已实际回下载核对完整SHA。

完整命令、原脚本核对、模型原文/元数据/裁决、媒体与真实飞书回执：[成长交付](/Users/hanzhmacbookair/Documents/laowai/1chengzhang/docs/handoff/EP01_BGM_FULL_FEISHU_20261029/README.md)。两宿主同源已核，本次不改无关运行锁。手机打开与听感接受待用户实际看片，不能从SHA或静态模型通过推断。最终Git以成长项目本轮closeout为准。
