# Chrome Gemini 侧边栏强制开启指南（2026 国内修复版）

> 日期: 2026-05-20 | 作者: Jeffrey
>
> 适用: Chrome 120+ / Mac & Windows
>
> 问题: Chrome 内置 Gemini 侧边栏（`chrome://settings/ai`）在国内因地区限制无法显示，即使开了代理也会丢失。本脚本通过修改 Chrome 配置文件中的地区和资格字段来强制解锁。

---

## 原理

Chrome 通过 `Local State` 配置文件中的以下字段判断用户是否有 Gemini 资格：

| 字段 | 作用 |
|------|------|
| `variations_country` | 地区判断，只有 `us` 才开放 Gemini |
| `variations_permanent_consistency_country` | 地区一致性校验，防止被 Chrome 覆盖 |
| `is_glic_eligible` | Glic 引擎（Gemini 侧边栏）资格开关 |
| `enabled_labs_experiments` | Chrome flags，直接启用 Glic 相关功能 |

Chrome 每次更新或同步配置时可能重置这些字段，导致侧边栏消失。本脚本每次运行都会重新注入。

---

## Mac 版脚本

**前提**: Chrome 已完全退出（Cmd+Q）

```bash
cat << 'EOF' > fix_gemini_mac.py
import json, os, shutil
from pathlib import Path

config_path = Path.home() / "Library/Application Support/Google/Chrome/Local State"
backup_path = Path.home() / "Library/Application Support/Google/Chrome/Local State.bak"

def run():
    print("🚀 开始运行 Mac 版 Chrome Gemini 侧边栏修复脚本...")

    # 1. 检查 Chrome 是否还在运行
    chrome_running = os.popen('pgrep "Google Chrome"').read()
    if chrome_running:
        print("❌ 错误：检测到 Chrome 正在运行！")
        print("👉 请先按下 Cmd+Q 彻底退出浏览器，然后重新运行此脚本。")
        return

    # 2. 检查配置文件是否存在
    if not config_path.exists():
        print("❌ 找不到 Local State 配置文件。")
        print("💡 可能是全新安装的 Chrome。请先启动一次 Chrome，然后彻底关闭，再运行本脚本。")
        return

    # 3. 备份
    try:
        shutil.copy2(config_path, backup_path)
        print(f"📦 已备份至: {backup_path}")
    except Exception as e:
        print(f"❌ 备份失败: {e}")
        return

    # 4. 修改 JSON 配置
    with open(config_path, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except Exception as e:
            print(f"❌ 读取失败: {e}")
            return

    # 锁死美国地域
    data['variations_country'] = 'us'
    data['variations_permanent_consistency_country'] = 'us'

    # 开启 Glic 引擎资格
    data['is_glic_eligible'] = True

    # 激活 Glic 核心 Flags
    if 'browser' not in data:
        data['browser'] = {}
    if 'enabled_labs_experiments' not in data['browser']:
        data['browser']['enabled_labs_experiments'] = []

    flags = data['browser']['enabled_labs_experiments']
    essential_flags = [
        "glic@1",
        "glic-side-panel@1",
        "glic-unified-fre-screen@1",
        "glic-actor@1",
        "glic-entrypoint-variations@1"
    ]

    for flag in essential_flags:
        if flag not in flags:
            flags.append(flag)

    data['browser']['enabled_labs_experiments'] = flags

    # 5. 保存
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

    print("\n✅ 脚本执行成功！")
    print("⚠️ 最终激活步骤：")
    print("1. 确保全局美国（US）节点代理已开启")
    print("2. 启动 Chrome，地址栏输入 chrome://settings/languages")
    print("3. 将 English (United States) 设为显示语言")
    print("4. 移除其他非必要语言变体，重启浏览器")
    print("5. 如右上角未亮起图标，前往 chrome://settings/ai 确保 'Show Gemini at the top' 已开启")

if __name__ == "__main__":
    run()
EOF

python3 fix_gemini_mac.py
```

---

## Windows 版脚本

**前提**: 以管理员身份运行 PowerShell

```powershell
# Chrome Gemini 侧边栏修复脚本 (Windows)

# 1. 强制关闭 Chrome（防止文件被占用）
$chromeProcesses = Get-Process chrome -ErrorAction SilentlyContinue
if ($chromeProcesses) {
    Write-Host "⚠️ 检测到 Chrome 正在运行，正在强制关闭..." -ForegroundColor Yellow
    Stop-Process -Name chrome -Force
    Start-Sleep -Seconds 1
}

# 2. 定位路径
$configPath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Local State"
$backupPath = "$env:LOCALAPPDATA\Google\Chrome\User Data\Local State.bak"

# 3. 检查配置文件是否存在
if (-not (Test-Path $configPath)) {
    Write-Host "❌ 找不到 Local State 配置文件。" -ForegroundColor Red
    Write-Host "💡 可能是全新安装。请先启动一次 Chrome，关闭后重新运行。" -ForegroundColor Yellow
    Exit
}

# 4. 备份
Copy-Item $configPath $backupPath -Force
Write-Host "📦 已备份至: $backupPath" -ForegroundColor Gray

# 5. 读取并解析 JSON
$jsonContent = Get-Content $configPath -Raw -Encoding UTF8 | ConvertFrom-Json

# 6. 注入地域锁与资格凭证
$jsonContent.variations_country = "us"
$jsonContent.variations_permanent_consistency_country = "us"
$jsonContent | Add-Member -NotePropertyName "is_glic_eligible" -NotePropertyValue $true -Force

# 安全初始化 browser 字典
if (-not $jsonContent.browser) {
    $jsonContent | Add-Member -NotePropertyName "browser" -NotePropertyValue @{} -Force
}
if (-not $jsonContent.browser.enabled_labs_experiments) {
    $jsonContent.browser | Add-Member -NotePropertyName "enabled_labs_experiments" -NotePropertyValue @() -Force
}

$flags = $jsonContent.browser.enabled_labs_experiments
$targetFlags = @(
    "glic@1",
    "glic-side-panel@1",
    "glic-unified-fre-screen@1",
    "glic-actor@1",
    "glic-entrypoint-variations@1"
)

foreach ($f in $targetFlags) {
    if ($f -notin $flags) { $flags += $f }
}
$jsonContent.browser.enabled_labs_experiments = $flags

# 7. 写回（无 BOM UTF8，防止 Chrome 读取乱码）
$finalJson = $jsonContent | ConvertTo-Json -Depth 100
[IO.File]::WriteAllText($configPath, $finalJson)

Write-Host "`n✅ 脚本执行成功！" -ForegroundColor Green
Write-Host "⚠️ 最终激活步骤：" -ForegroundColor Yellow
Write-Host "1. 确保全局美国（US）节点代理已开启"
Write-Host "2. 启动 Chrome，地址栏输入 chrome://settings/languages"
Write-Host "3. 将 English (United States) 设为显示语言"
Write-Host "4. 移除其他非必要语言变体，重启浏览器"
Write-Host "5. 如右上角未亮起图标，前往 chrome://settings/ai 确保 'Show Gemini at the top' 已开启"
```

---

## 手动激活步骤（脚本运行后必做）

1. **开启美国代理** — 必须是美国节点，其他地区不行
2. **设置 Chrome 语言** — `chrome://settings/languages` → 将 English (United States) 设为显示语言
3. **清理语言列表** — 移除其他非必要语言变体，确保美式英语最优先
4. **重启 Chrome** — 完全关闭后重新打开
5. **检查 AI 设置** — `chrome://settings/ai` → 确保 "Show Gemini at the top" 已开启

## 验证成功

- 浏览器右上角出现 Gemini 图标（星星状）
- 点击图标可打开侧边栏 AI 助手
- `chrome://settings/ai` 页面显示 Gemini 相关开关

## 侧边栏再次丢失怎么办

Chrome 更新或配置同步可能导致字段被重置。重新运行脚本即可修复。

---

## 常见问题

### Q: 运行后还是没有 Gemini？

按顺序检查：
1. VPN 是否连接美国节点
2. Chrome 语言是否已改为 English (United States)
3. 是否完全重启了 Chrome（不是刷新页面）
4. Chrome 版本是否 120+
5. `chrome://settings/ai` 中开关是否开启

### Q: 脚本报错找不到 Local State？

Chrome 从未启动过，需要先打开一次 Chrome 让它创建配置文件。

### Q: 每次更新 Chrome 都要重新跑脚本？

是的，Chrome 更新可能重置 `variations_country` 等字段。建议把脚本保存到桌面，丢失时双击运行。

### Q: Mac 上脚本报 Chrome 正在运行？

必须用 **Cmd+Q** 彻底退出，不是点红色关闭按钮。关闭后等 2 秒再运行脚本。

### Q: Windows 上脚本报文件被占用？

脚本会自动强制关闭 Chrome。如果仍然报错，打开任务管理器手动结束所有 `chrome.exe` 进程。

---

## 相关项目

- [wlzh/gemini-in-chrome-enabler](https://github.com/wlzh/gemini-in-chrome-enabler) — 更完整的方案（递归 is_glic_eligible + macOS defaults 持久化 + 动态版本检测）
