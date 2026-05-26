!define PRODUCT_NAME "视频号下载"
!define PRODUCT_VERSION "1.2.0"
!define PRODUCT_PUBLISHER "寒武纪AI"
!define PRODUCT_WEB "https://www.douyin.com/user/MS4wLjABAAAAH5yUDz1lRwM158jy-QNImv77MnxI7fcCyJDfciEdkvM"

!include "MUI2.nsh"

Name "视频号下载 — 寒武纪AI"
OutFile "视频号下载_Setup.exe"
InstallDir "$PROGRAMFILES\寒武纪AI\视频号下载"
RequestExecutionLevel admin
SetCompressor lzma

!define MUI_ICON "app.ico"
!define MUI_WELCOMEFINISHPAGE_BITMAP "${NSISDIR}\\Contrib\\Graphics\\Wizard\\orange.bmp"
!define MUI_BRANDINGTEXT "寒武纪AI"

; 欢迎页
!insertmacro MUI_PAGE_WELCOME
!define MUI_WELCOMEPAGE_TITLE "视频号下载 — 寒武纪AI"
!define MUI_WELCOMEPAGE_TEXT "一键下载微信视频号视频$\r$\n$\r$\n由 寒武纪AI 提供技术支持"

; 许可页
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"

; 安装目录页
!insertmacro MUI_PAGE_DIRECTORY

; 安装进度页
!insertmacro MUI_PAGE_INSTFILES

; 完成页
!define MUI_FINISHPAGE_TITLE "安装完成！"
!define MUI_FINISHPAGE_TEXT "双击桌面「视频号下载」启动$\r$\n打开微信→视频号→点视频即可下载"
!define MUI_FINISHPAGE_LINK "关注寒武纪AI → ${PRODUCT_WEB}"
!define MUI_FINISHPAGE_LINK_LOCATION "${PRODUCT_WEB}"
!insertmacro MUI_PAGE_FINISH

; 卸载页面
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "SimpChinese"

Section "安装"
  SetOutPath $INSTDIR

  File "wx_video_download.exe"
  File "SunnyRoot.cer"
  File "config.yaml"

  ; 先添加 Windows Defender 排除项（在复制文件之前）
  ExecWait `powershell -Command "Add-MpPreference -ExclusionPath '$INSTDIR'" 2>$PLUGINSDIR\defender.log`

  ; 安装 CA 证书
  ExecWait 'certutil -addstore Root "$INSTDIR\SunnyRoot.cer"'

  ; 验证 exe 是否存活（没被 Defender 立即隔离）
  IfFileExists "$INSTDIR\wx_video_download.exe" +3 0
    MessageBox MB_ICONSTOP|MB_OK "安装失败：wx_video_download.exe 被杀毒软件拦截。$\r$\n$\r$\n请手动操作：$\r$\n1. 打开 Windows 安全中心$\r$\n2. 病毒和威胁防护 → 管理设置$\r$\n3. 排除项 → 添加文件夹：$INSTDIR$\r$\n4. 重新运行此安装程序"
    Quit

  ; 创建启动脚本
  FileOpen $0 "$INSTDIR\启动.bat" w
  FileWrite $0 '@echo off$\r$\n'
  FileWrite $0 'chcp 65001 >nul$\r$\n'
  FileWrite $0 'title 视频号下载 — 寒武纪AI$\r$\n'
  FileWrite $0 '$\r$\n'
  FileWrite $0 'echo =============================$\r$\n'
  FileWrite $0 'echo   视频号下载 by 寒武纪AI$\r$\n'
  FileWrite $0 'echo =============================$\r$\n'
  FileWrite $0 'echo.$\r$\n'
  FileWrite $0 '$\r$\n'
  ; 检查 exe 是否存在
  FileWrite $0 'if not exist "%~dp0wx_video_download.exe" ($\r$\n'
  FileWrite $0 '  echo [错误] wx_video_download.exe 已被删除（通常被杀毒软件隔离）$\r$\n'
  FileWrite $0 '  echo.$\r$\n'
  FileWrite $0 '  echo 正在请求管理员权限恢复文件...$\r$\n'
  FileWrite $0 '  net session >NUL 2>&1$\r$\n'
  FileWrite $0 '  if %errorLevel% neq 0 ($\r$\n'
  FileWrite $0 `    powershell -Command "Start-Process '%~f0' -Verb RunAs"$\r$\n`
  FileWrite $0 '    exit /b$\r$\n'
  FileWrite $0 '  )$\r$\n'
  FileWrite $0 '  echo 以管理员身份恢复中...$\r$\n'
  FileWrite $0 `  powershell -Command "Add-MpPreference -ExclusionPath '%~dp0'" 2>NUL$\r$\n`
  FileWrite $0 `  powershell -Command "Invoke-WebRequest -Uri 'https://github.com/hanzhcn/wx_channels_download/releases/download/v260524/wx_video_download_v260524_windows_amd64.zip' -OutFile '%TEMP%\wx.zip'"$\r$\n`
  FileWrite $0 `  powershell -Command "Expand-Archive -Path '%TEMP%\wx.zip' -DestinationPath '%TEMP%\wx_tmp' -Force"$\r$\n`
  FileWrite $0 '  copy "%TEMP%\wx_tmp\wx_video_download.exe" "%~dp0wx_video_download.exe" >NUL$\r$\n'
  FileWrite $0 '  del /q "%TEMP%\wx.zip" 2>NUL$\r$\n'
  FileWrite $0 '  rmdir /s /q "%TEMP%\wx_tmp" 2>NUL$\r$\n'
  FileWrite $0 '  if not exist "%~dp0wx_video_download.exe" ($\r$\n'
  FileWrite $0 '    echo 恢复失败。请手动操作：$\r$\n'
  FileWrite $0 '    echo   1. Windows安全中心 -> 病毒防护 -> 排除项 -> 添加文件夹：%~dp0$\r$\n'
  FileWrite $0 '    echo   2. 重新安装：https://github.com/hanzhcn/laohan-skills/releases$\r$\n'
  FileWrite $0 '    pause$\r$\n'
  FileWrite $0 '    exit /b 1$\r$\n'
  FileWrite $0 '  )$\r$\n'
  FileWrite $0 '  echo 恢复成功！$\r$\n'
  FileWrite $0 ')$\r$\n'
  FileWrite $0 '$\r$\n'
  ; 检查是否已在运行
  FileWrite $0 'tasklist | findstr "wx_video_download" >NUL 2>&1$\r$\n'
  FileWrite $0 'if %errorLevel% equ 0 ($\r$\n'
  FileWrite $0 '  echo 已在运行中，打开微信 -> 视频号 -> 点视频即可下载$\r$\n'
  FileWrite $0 '  pause$\r$\n'
  FileWrite $0 '  exit /b 0$\r$\n'
  FileWrite $0 ')$\r$\n'
  FileWrite $0 '$\r$\n'
  ; 启动（用 start /b 确保 exe 不会立即退出）
  FileWrite $0 'echo 启动视频号下载代理...$\r$\n'
  FileWrite $0 'start "" "%~dp0wx_video_download.exe"$\r$\n'
  FileWrite $0 'echo 等待服务启动...$\r$\n'
  FileWrite $0 'timeout /t 3 >nul$\r$\n'
  ; 验证是否真的跑起来了
  FileWrite $0 'tasklist | findstr "wx_video_download" >NUL 2>&1$\r$\n'
  FileWrite $0 'if %errorLevel% equ 0 ($\r$\n'
  FileWrite $0 '  echo.$\r$\n'
  FileWrite $0 '  echo =============================$\r$\n'
  FileWrite $0 '  echo   启动成功！$\r$\n'
  FileWrite $0 '  echo   打开微信 -> 视频号 -> 点视频即可下载$\r$\n'
  FileWrite $0 '  echo =============================$\r$\n'
  FileWrite $0 '  echo.$\r$\n'
  FileWrite $0 ') else ($\r$\n'
  FileWrite $0 '  echo.$\r$\n'
  FileWrite $0 '  echo =============================$\r$\n'
  FileWrite $0 '  echo   启动失败！$\r$\n'
  FileWrite $0 '  echo =============================$\r$\n'
  FileWrite $0 '  echo.$\r$\n'
  FileWrite $0 '  echo 可能原因：$\r$\n'
  FileWrite $0 '  echo   1. 被 Windows Defender 拦截$\r$\n'
  FileWrite $0 '  echo      -> 打开 Windows 安全中心 -> 病毒防护 -> 排除项$\r$\n'
  FileWrite $0 `     -> 添加文件夹：'%~dp0'$\r$\n`
  FileWrite $0 '  echo   2. 端口 2022/2023 被占用$\r$\n'
  FileWrite $0 '  echo      -> 关闭其他代理软件$\r$\n'
  FileWrite $0 '  echo   3. 权限不足$\r$\n'
  FileWrite $0 '  echo      -> 右键以管理员身份运行$\r$\n'
  FileWrite $0 '  echo.$\r$\n'
  FileWrite $0 ')$\r$\n'
  FileWrite $0 'echo.$\r$\n'
  FileWrite $0 'echo 关注寒武纪AI 获取更多AI工具$\r$\n'
  FileWrite $0 'pause$\r$\n'
  FileClose $0

  ; 桌面快捷方式
  CreateShortCut "$DESKTOP\视频号下载.lnk" "$INSTDIR\启动.bat" "" "$INSTDIR\wx_video_download.exe" 0

  ; 开始菜单
  CreateDirectory "$SMPROGRAMS\寒武纪AI"
  CreateShortCut "$SMPROGRAMS\寒武纪AI\视频号下载.lnk" "$INSTDIR\启动.bat"
  CreateShortCut "$SMPROGRAMS\寒武纪AI\卸载.lnk" "$INSTDIR\uninstall.exe"

  WriteUninstaller "$INSTDIR\uninstall.exe"

  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayName" "视频号下载 — 寒武纪AI"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "Publisher" "寒武纪AI"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "UninstallString" "$INSTDIR\uninstall.exe"
SectionEnd

Section "Uninstall"
  ExecWait "taskkill /f /im wx_video_download.exe"
  ExecWait 'certutil -delstore Root SunnyNet'
  ExecWait `powershell -Command "Remove-MpPreference -ExclusionPath '$INSTDIR'"`

  Delete "$INSTDIR\wx_video_download.exe"
  Delete "$INSTDIR\SunnyRoot.cer"
  Delete "$INSTDIR\config.yaml"
  Delete "$INSTDIR\启动.bat"
  Delete "$INSTDIR\uninstall.exe"
  RMDir /r "$INSTDIR"

  Delete "$DESKTOP\视频号下载.lnk"
  Delete "$SMPROGRAMS\寒武纪AI\视频号下载.lnk"
  Delete "$SMPROGRAMS\寒武纪AI\卸载.lnk"
  RMDir "$SMPROGRAMS\寒武纪AI"

  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
SectionEnd
