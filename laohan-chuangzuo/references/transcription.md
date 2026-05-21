# 音频提取 + 语音转文字

录屏视频转口播稿的前置步骤：从视频中提取音频，然后转录为文字。

## Step 1：提取音频

```bash
ffmpeg -i "<视频路径>" -vn -acodec libmp3lame -q:a 2 "/tmp/录屏音频_$(date +%s).mp3" -y
```

## Step 2：语音转文字

三级降级，按优先级尝试：

### 优先级 1：硅基流动 API（免费，秒级）

```bash
curl -s -X POST "https://api.siliconflow.cn/v1/audio/transcriptions" \
  -H "Authorization: Bearer $SILICONFLOW_API_KEY" \
  -F "model=FunAudioLLM/SenseVoiceSmall" \
  -F "file=@<音频文件>" \
  -F "language=zh" -F "response_format=json"
```

中文优化，免费，需要 `$SILICONFLOW_API_KEY` 环境变量。

### 优先级 2：whisper-cli（本地快）

```bash
# mp3 先转 wav
ffmpeg -i "<mp3文件>" -ar 16000 -ac 1 -c:a pcm_s16le "/tmp/audio_$(date +%s).wav" -y

# 转录
whisper-cli --model /opt/homebrew/share/whisper.cpp/ggml-small.bin --language zh --no-timestamps --output-txt --output-file <prefix> <audio.wav>
```

注意：CLI 命令是 `whisper-cli`（不是 `whisper`，后者被 Python 版占用）。

### 优先级 3：Python whisper small（最准）

```python
import whisper
model = whisper.load_model("small")
result = model.transcribe("<音频文件>", language="zh")
print(result["text"])
```

速度最慢但准确率最高。

## 依赖

| 工具 | 用途 | 安装方式 |
|------|------|---------|
| ffmpeg | 音频提取和格式转换 | `brew install ffmpeg` |
| 硅基流动 API | 云端转录（优先） | 注册 siliconflow.cn，设置 `$SILICONFLOW_API_KEY` |
| whisper.cpp | 本地转录（备选1） | `brew install whisper.cpp` |
| openai-whisper | 本地转录（备选2） | `pip install openai-whisper` |
