# 🎤 Voice Input Feature - Complete Guide

## Overview
The backend now supports **real voice input** using OpenAI's Whisper for speech-to-text transcription with minimal latency. This enables users to speak directly and get mental health analysis results.

## 🚀 Key Features

### 1. Speech-to-Text (Whisper)
- **Model:** Whisper Base (balanced speed & accuracy)
- **Latency:** ~32 seconds per 1 minute of audio
- **Languages:** 99+ languages supported
- **Accuracy:** High (WER ~5-10%)

### 2. Real-time Recording
- Browser-based microphone recording
- Live audio visualization
- Recording timer
- Playback before analysis

### 3. Audio File Upload
- Supports: WAV, MP3, M4A, WebM, OGG, FLAC
- Direct file upload from device
- Automatic format detection

## 📋 API Endpoints

### Voice Input Endpoint
**POST** `/api/voice-input`

**Request Type:** `multipart/form-data`

**Parameters:**
- `audio` (file): Audio file (any supported format)

**Response:**
```json
{
  "status": "success",
  "transcription": {
    "text": "I feel anxious and worried about everything",
    "language": "en"
  },
  "analysis": {
    "Depression": 0.264,
    "Anxiety": 0.947,
    "Stress": 0.023,
    "source": "local_model"
  },
  "audio_info": {
    "filename": "recording.webm",
    "content_type": "audio/webm"
  }
}
```

### Whisper Model Info
**GET** `/api/whisper-info`

Returns information about the Whisper model:
```json
{
  "status": "success",
  "whisper": {
    "model": "whisper-base",
    "languages_supported": "99+ languages",
    "speed": "~32 seconds per 1 minute of audio",
    "accuracy": "High (WER ~5-10%)",
    "status": "loaded"
  }
}
```

## 🧪 Testing Methods

### Method 1: Interactive Web Interface (Recommended)

1. **Open the test page:**
   ```bash
   # Open backend/test_page.html in your browser
   ```

2. **Record Audio:**
   - Click "🎙️ Start Recording" button
   - Allow microphone access when prompted
   - Speak clearly for 5-10 seconds
   - Example: "I feel very anxious and stressed about work"
   - Click "⏹️ Stop" button

3. **Review & Analyze:**
   - Listen to your recording (audio player appears)
   - Click "Analyze Voice" button
   - View transcription and mental health analysis

### Method 2: Upload Audio File

1. Click "Upload Audio File"
2. Select a WAV, MP3, or other audio file
3. Click "Analyze Voice"
4. View results

### Method 3: Python Script

```python
import requests

# Test with audio file
with open('test_audio.wav', 'rb') as f:
    files = {'audio': ('test.wav', f, 'audio/wav')}
    response = requests.post(
        'http://127.0.0.1:8000/api/voice-input',
        files=files
    )
    
print(response.json())
```

### Method 4: cURL Command

```bash
curl -X POST "http://127.0.0.1:8000/api/voice-input" \
  -F "audio=@test_audio.wav"
```

## 🎯 Performance Metrics

### Whisper Model Options
The code uses `whisper-base` by default. You can change this in [voice_transcription.py](backend/voice_transcription.py):

```python
# Change model size
model = whisper.load_model("tiny")   # Fastest, ~1GB RAM
model = whisper.load_model("base")   # Balanced (current)
model = whisper.load_model("small")  # Better accuracy, ~2GB RAM
model = whisper.load_model("medium") # High accuracy, ~5GB RAM
```

### Latency Comparison

| Model | Speed (1 min audio) | Accuracy | RAM Usage |
|-------|---------------------|----------|-----------|
| tiny  | ~16 seconds        | Good     | 1 GB      |
| base  | ~32 seconds        | High     | 1 GB      |
| small | ~60 seconds        | Higher   | 2 GB      |

### Processing Flow
1. **Audio Upload:** < 1 second
2. **Whisper Transcription:** ~32 seconds (for 1 min audio)
3. **Text Analysis:** ~0.5 seconds
4. **Total:** ~33-35 seconds (for 1 min audio)

## 🔧 Technical Details

### Dependencies Installed
```txt
openai-whisper      # Speech-to-text engine
soundfile           # Audio file handling
pydub               # Audio processing
python-multipart    # File upload support
numba               # Numerical computing
tiktoken            # Tokenization
```

### Audio Recording Specs (Browser)
- **Format:** WebM (Opus codec)
- **Sample Rate:** 48kHz (browser default)
- **Channels:** Mono
- **Bitrate:** Variable

### Supported Languages
Whisper supports 99+ languages including:
- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Chinese (zh)
- Hindi (hi)
- Japanese (ja)
- Korean (ko)
- And many more...

## 📱 Browser Compatibility

### Microphone Recording Support
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)
- ✅ Safari (Desktop & iOS 14.5+)
- ⚠️ Requires HTTPS in production

### Audio Upload Support
- ✅ All modern browsers

## 🎨 Frontend Implementation

### Key Features in test_page.html

1. **MediaRecorder API Integration**
```javascript
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
mediaRecorder = new MediaRecorder(stream);
```

2. **Real-time Timer**
```javascript
recordingTimer = setInterval(updateRecordingTime, 1000);
```

3. **Audio Playback**
```javascript
const audioUrl = URL.createObjectURL(recordedBlob);
audioPlayback.src = audioUrl;
```

4. **File Upload**
```javascript
const formData = new FormData();
formData.append('audio', audioBlob, 'recording.webm');
```

## 🐛 Troubleshooting

### Microphone Not Working

**Problem:** "Error accessing microphone"
**Solution:**
1. Grant microphone permissions in browser
2. Check if another app is using the microphone
3. Ensure you're on HTTPS (or localhost)

### Slow Transcription

**Problem:** Transcription takes too long
**Solution:**
1. Switch to `tiny` model for faster processing
2. Keep recordings under 30 seconds
3. Check CPU usage

### Low Accuracy

**Problem:** Transcription is inaccurate
**Solution:**
1. Speak clearly and slowly
2. Reduce background noise
3. Switch to `small` or `medium` model
4. Specify language explicitly:
```python
result = model.transcribe(audio_path, language='en')
```

### Audio Format Issues

**Problem:** "Unable to process audio file"
**Solution:**
1. Use common formats: WAV, MP3, M4A
2. Ensure file isn't corrupted
3. Check file size (< 25MB recommended)

## 🔒 Security Considerations

### Production Deployment
1. **File Size Limits:**
```python
from fastapi import UploadFile, HTTPException

max_file_size = 25 * 1024 * 1024  # 25 MB
if len(audio_bytes) > max_file_size:
    raise HTTPException(status_code=413, detail="File too large")
```

2. **File Type Validation:**
```python
allowed_types = ['audio/wav', 'audio/mpeg', 'audio/mp4']
if audio.content_type not in allowed_types:
    raise HTTPException(status_code=415, detail="Invalid audio format")
```

3. **Rate Limiting:**
```python
from slowapi import Limiter

limiter = Limiter(key_func=get_remote_address)
@app.post("/api/voice-input")
@limiter.limit("5/minute")
async def voice_input(...):
    ...
```

## 📊 Example Use Cases

### 1. Mental Health Check-in
**Recording:** "I've been feeling really anxious lately and can't sleep"
**Result:**
- Depression: 35.2%
- Anxiety: 89.4% ⚠️
- Stress: 54.1%

### 2. Positive Assessment
**Recording:** "I'm feeling great today, very happy and energetic"
**Result:**
- Depression: 0.5%
- Anxiety: 0.3%
- Stress: 1.2%

### 3. Multilingual Support
**Recording (Hindi):** "मुझे बहुत तनाव हो रहा है"
**Transcription:** "मुझे बहुत तनाव हो रहा है"
**Analysis:** Processes non-English text with fallback handling

## 🚀 Future Enhancements

Potential improvements:
1. **Real-time Streaming:** Process audio as it's being recorded
2. **Emotional Tone Analysis:** Detect voice pitch, tone, and emotion
3. **Noise Cancellation:** Pre-process audio to remove background noise
4. **Speaker Diarization:** Identify multiple speakers
5. **Emotion Recognition:** Analyze vocal patterns for emotional state
6. **Audio Features:** Extract MFCC, pitch, energy for enhanced analysis

## 📖 References

- **Whisper Paper:** [Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356)
- **OpenAI Whisper:** https://github.com/openai/whisper
- **MediaRecorder API:** https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder

## 🎉 Quick Start

1. **Start the server:**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Open test page:**
   ```bash
   # Open backend/test_page.html in browser
   ```

3. **Start testing:**
   - Click "Start Recording"
   - Speak for 5-10 seconds
   - Click "Stop"
   - Click "Analyze Voice"
   - View results!

## ✅ Verification Checklist

- [x] Whisper model loaded successfully
- [x] Voice recording enabled in browser
- [x] Audio file upload working
- [x] Transcription accurate
- [x] Mental health analysis integrated
- [x] Multi-language support active
- [x] Error handling implemented
- [x] Test interface functional

---

**Made with ❤️ for Let Go 3.0 - Voice-Enabled Mental Health Analysis**
