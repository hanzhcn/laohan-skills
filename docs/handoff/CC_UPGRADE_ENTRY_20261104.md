# CC-UPGRADE-ENTRY-20261104

本轮范围：Jeffrey 授权升级本机 Claude Code；Codex 当前正式版无变化。升级中发现 laohan-gengxin 缺实际入口验收说明，按自研 skill 发现缺陷即修的既有要求做最小文档修复。唯一 writer=root，源基线403a4d42d617c36681df3a84145ffddcfcf13e90，隔离分支 task/cc-upgrade-verification-20261104；审核通过前不改本机生效 skill。

## 已核真实反例与恢复

- 原入口 `~/.local/bin/claude` 为 Mach-O arm64 独立文件，实际输出2.1.314；不是包装脚本。原件已备份，来源和用途已核后才处理入口。
- 官方 `claude update` 警告该入口不是指向 versions/ 的软链，因此保持原入口不动；随后打印 Successfully updated，退出码0，并安装 `~/.local/share/claude/versions/2.1.317`。入口切换前以SHA256断言确认旧入口仍与2.1.314备份逐字相同；因此更新器成功不推出实际入口更新。
- 新版本先直接执行 --version、--help；codesign --verify --strict 成功，签名为 Anthropic PBC (Q6L2SF6YDW)，签名元数据列出 Developer ID Certification Authority 与 Apple Root CA。之后原子切换旧独立入口为已验新版本软链。
- 切换后从PATH实际解析入口执行 --version=2.1.317 (Claude Code)，--help返回0且存在Usage；settings.json SHA256不变；codex --version=codex-cli 0.166.0。
- 原入口并发漂移/设置漂移前置断言已在本轮执行，均无漂移；恢复分支代码未故障注入，不记演练通过。没有删除真实用户包装脚本，没有修改自动更新开关、凭据、模型、权限或重启在途会话。

## 方法修改与验证范围

只把“更新成功”收紧为实际调用入口版本和最小启动检查，同时保留包装脚本及用户配置保护；不增加自动扫描/更新范围。版本1.0.1。真实安装反例和恢复已执行；本文档不新建或宣称存在自动门禁。纯方法条款尚需GLM满配独立对抗审阅，结果与逐条裁决在后续补记。

未测：所有其他工具/操作系统、第三方包装脚本的真实替换、正常项目全套hooks/MCP及业务任务、应用内已运行会话是否使用新进程。它们不构成本次只升级本机原生CLI的已验范围。

## 升级验证原始摘要

```json
{
  "baseline": {
    "previous_version": "2.1.314 (Claude Code)",
    "entry": "/Users/hanzhmacbookair/.local/bin/claude",
    "backup": "/tmp/cc-upgrade-20261104-mlmapsyg/claude-2.1.314.backup",
    "backup_sha256": "21d6e7b9a6f07b4cfcb7df13760b3b72aa25e084e13a5354413382987ba832ed",
    "settings_sha256": "a7c61160cbe09c4593c00c7e2c032356790a3d412340ed6c2248b388723c87d1"
  },
  "verification": {
    "status": "upgraded_verified",
    "previous_version": "2.1.314 (Claude Code)",
    "current_version": "2.1.317 (Claude Code)",
    "selected_entry": "/Users/hanzhmacbookair/.local/bin/claude",
    "resolved_entry": "/Users/hanzhmacbookair/.local/share/claude/versions/2.1.317",
    "signature_verified": true,
    "signature_identity": [
      "Identifier=com.anthropic.claude-code",
      "Authority=Developer ID Application: Anthropic PBC (Q6L2SF6YDW)",
      "Authority=Developer ID Certification Authority",
      "Authority=Apple Root CA",
      "TeamIdentifier=Q6L2SF6YDW"
    ],
    "help_startup_probe": "passed",
    "settings_unchanged": true,
    "codex_version": "codex-cli 0.166.0",
    "backup": "/tmp/cc-upgrade-20261104-mlmapsyg/claude-2.1.314.backup"
  }
}
```
