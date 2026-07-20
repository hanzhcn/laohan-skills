try
	-- 清理可能存在的 root 属主 app.log（旧版 admin 启动残留会挡住启动）
	do shell script "rm -f $HOME/.local/bin/app.log 2>/dev/null" with administrator privileges
	-- 后台启动 wx_video_download
	do shell script "nohup $HOME/.local/bin/wx_video_download > /tmp/weixin-video.log 2>&1 &" with administrator privileges
	delay 4
	try
		set pid to do shell script "pgrep -f wx_video_download | head -1"
		if pid is not "" then
			display dialog "✅ 启动成功！" & return & return & "打开微信 -> 视频号 -> 点视频即可下载" & return & return & "服务在后台运行，可关闭此窗口" buttons {"好"} default button 1 with title "视频号下载 - laohanAI"
		else
			display dialog "❌ 启动失败" & return & return & "查看日志：/tmp/weixin-video.log" buttons {"好"} default button 1 with title "视频号下载"
		end if
	on error
		display dialog "❌ 启动失败" & return & return & "查看日志：/tmp/weixin-video.log" buttons {"好"} default button 1 with title "视频号下载"
	end try
on error errMsg
	display dialog "错误：" & errMsg buttons {"好"} default button 1 with title "视频号下载"
end try
