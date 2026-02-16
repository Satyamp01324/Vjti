# Pipeline & Architecture Guide

## Backend Folder Structure

```
backend/
├── main.py                      # FastAPI app — all routes
├── requirements.txt
├── .env                         # SUPABASE_URL, SUPABASE_KEY, GROQ_API_KEY
│
├── core/                        # Core business logic
│   ├── __init__.py
│   ├── supabase_client.py       # Supabase client initialisation
│   ├── pipeline.py              # ★ Data pipeline (orchestrates everything)
│   ├── energy_flow.py           # Energy score calculation
│   └── voice_transcription.py   # Whisper / Groq transcription
│
├── models/                      # ML models
│   ├── __init__.py
│   ├── text_classification.py   # Clinical RoBERTa (Depression/Anxiety/Stress)
│   ├── voice_analysis.py        # Pickle-based voice model
│   └── artifacts/               # Serialised model weights
│       ├── model.pkl
│       └── tokenizer.pkl
│
├── tests/                       # Test & validation scripts
│   ├── test_pipeline.py         # ★ End-to-end pipeline test + seed data
│   ├── test_supabase.py
│   ├── test_models.py
│   ├── test_voice_input.py
│   ├── test_multilingual.py
│   ├── test_groq_key.py
│   ├── generate_test_audio.py
│   └── test_page.html
│
├── scripts/                     # Setup & utility scripts
│   ├── supabase_schema.sql      # ★ Full Supabase schema (run first!)
│   ├── supabase_queries.py      # ★ Manual Supabase CRUD queries
│   ├── setup_supabase_data.py
│   └── example_energy_integration.py
│
├── docs/                        # Markdown guides
│   ├── ENERGY_FLOW_GUIDE.md
│   ├── ENERGY_FLOW_README.md
│   └── VOICE_INPUT_GUIDE.md
│
└── audio_files/                 # Local audio uploads (dev only)
```

---

## Data Pipeline Flow

```
┌─────────────────────────────────────────────────────┐
│                    USER INPUT                       │
│         (text string  OR  audio file)               │
└────────────┬────────────────────┬───────────────────┘
             │                    │
     POST /api/analyze/text   POST /api/analyze/voice
             │                    │
             │            ┌───────▼────────┐
             │            │ 1. Transcribe  │  (Groq Whisper → local Whisper)
             │            │    audio→text  │
             │            └───────┬────────┘
             │                    │
             │            ┌───────▼────────┐
             │            │ 2. Upload MP3  │  → Supabase Storage bucket
             │            │    to storage  │     "audio-files"
             │            └───────┬────────┘
             │                    │
             ▼                    ▼
     ┌───────────────────────────────────────┐
     │ 3. Text Classification (Clinical ML)  │
     │    Depression  0.35                    │
     │    Anxiety     0.72                    │
     │    Stress      0.55                    │
     └───────────────────┬───────────────────┘
                         │
     ┌───────────────────▼───────────────────┐
     │ 4. Energy Flow Calculation             │
     │    classify levels → calc impacts →    │
     │    energy_score (0-100) →              │
     │    task recommendation                 │
     └───────────────────┬───────────────────┘
                         │
     ┌───────────────────▼───────────────────┐
     │ 5. Save to Supabase                   │
     │    → analysis_sessions table          │
     │    → energy_history table             │
     └───────────────────┬───────────────────┘
                         │
     ┌───────────────────▼───────────────────┐
     │ 6. Return JSON to Frontend            │
     └───────────────────────────────────────┘
```

---

## Data Sent to Frontend

### Text Pipeline Response (`POST /api/analyze/text`)

```json
{
  "status": "success",
  "session_id": "uuid-string",
  "input_text": "I feel tired and anxious",
  "analysis": {
    "depression": 0.35,
    "anxiety": 0.72,
    "stress": 0.55,
    "source": "local_model"
  },
  "energy_flow": {
    "energy_score": 37,
    "energy_category": "low_energy",
    "recommended_task_type": "light",
    "task_description": "You have low energy. Focus on rest...",
    "task_suggestions": ["Take breaks", "Light stretching", ...],
    "classified_levels": {
      "stress": "medium",
      "anxiety": "high",
      "depression": "low",
      "tone": "negative"
    },
    "impact_breakdown": {
      "stress_impact": -10,
      "anxiety_impact": -15,
      "depression_impact": 0,
      "tone_impact": -5,
      "total_impact": -30
    },
    "base_energy": 70
  },
  "persisted": true
}
```

### Voice Pipeline Response (`POST /api/analyze/voice`)

Same as above, plus:

```json
{
  "transcription": {
    "text": "transcribed text here",
    "language": "en",
    "language_name": "English",
    "method": "groq_whisper"
  },
  "audio_info": {
    "filename": "recording.webm",
    "content_type": "audio/webm",
    "size_bytes": 45000,
    "storage_url": "https://xxx.supabase.co/storage/v1/object/public/audio-files/uploads/abc.webm"
  }
}
```

### Query Endpoints

| Endpoint | Method | Returns |
|---|---|---|
| `/api/sessions?limit=20` | GET | Array of recent analysis sessions |
| `/api/sessions/{id}` | GET | Single session detail |
| `/api/energy-history?limit=50` | GET | Energy scores over time |
| `/api/energy-daily` | GET | Daily average energy scores |

---

## How to Connect Frontend ↔ Backend

### 1. Frontend API Service

Import from `src/api.js`:

```jsx
import { analyzeText, analyzeVoice, getSessions, getEnergyHistory } from './api';

// Text analysis (auto-saves to Supabase)
const result = await analyzeText("I feel stressed today");
console.log(result.energy_flow.energy_score);  // 37

// Voice analysis
const result = await analyzeVoice(audioFile);
console.log(result.transcription.text);

// Read history
const { data } = await getSessions();
const { data: history } = await getEnergyHistory();
```

### 2. Realtime Subscriptions (optional)

```jsx
import { subscribeToSessions, subscribeToEnergyHistory } from './api';

// Live updates when new analysis is created
const unsub = subscribeToSessions((newSession) => {
  console.log('New session:', newSession.energy_score);
});

// Cleanup
unsub();
```

### 3. Environment Variables

**Backend** (`.env`):
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJhbGc...
GROQ_API_KEY=gsk_...              # optional, for faster transcription
```

**Frontend** (`.env`):
```
VITE_API_URL=http://127.0.0.1:8000
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## Supabase Setup (step by step)

### Step 1 — Create tables

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `backend/scripts/supabase_schema.sql`
3. Paste and click **Run**

This creates:
- `analysis_sessions` table (stores all metrics)
- `energy_history` table (for trend charts)
- `audio-files` storage bucket
- Views: `latest_sessions`, `daily_energy_avg`
- Row Level Security policies

### Step 2 — Seed test data

```bash
cd backend
# Option A: via pipeline (runs ML models)
python -m tests.test_pipeline

# Option B: direct insert (no ML needed)
python -m tests.test_pipeline --seed

# Option C: single manual row
python -m scripts.supabase_queries --insert
```

### Step 3 — Verify

```bash
python -m tests.test_pipeline --query
python -m scripts.supabase_queries
```

### Step 4 — Upload audio files

```bash
python -m scripts.supabase_queries --upload path/to/recording.mp3
```

---

## Supabase Tables Reference

### `analysis_sessions`

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `input_type` | text | `'text'` or `'voice'` |
| `input_text` | text | Original or transcribed text |
| `depression_score` | real | 0.0 – 1.0 |
| `anxiety_score` | real | 0.0 – 1.0 |
| `stress_score` | real | 0.0 – 1.0 |
| `stress_level` | text | `'high'` / `'medium'` / `'low'` |
| `anxiety_level` | text | `'high'` / `'medium'` / `'low'` |
| `depression_level` | text | `'high'` / `'medium'` / `'low'` |
| `tone` | text | `'positive'` / `'neutral'` / `'negative'` |
| `energy_score` | integer | 0 – 100 |
| `energy_category` | text | `'high_energy'` / `'medium_energy'` / `'low_energy'` |
| `recommended_task_type` | text | `'heavy'` / `'medium'` / `'light'` |
| `task_description` | text | Human-readable recommendation |
| `task_suggestions` | jsonb | Array of suggestion strings |
| `stress_impact` | integer | Impact value applied |
| `anxiety_impact` | integer | Impact value applied |
| `depression_impact` | integer | Impact value applied |
| `tone_impact` | integer | Impact value applied |
| `total_impact` | integer | Sum of all impacts |
| `audio_file_url` | text | Supabase Storage URL (voice only) |
| `audio_file_name` | text | Original filename |
| `audio_file_size` | integer | File size in bytes |
| `detected_language` | text | ISO 639-1 language code |
| `language_name` | text | e.g. "English", "Hindi" |
| `transcription_method` | text | `'groq_whisper'` or `'local_whisper'` |
| `created_at` | timestamptz | Auto-set |

### `energy_history`

| Column | Type | Description |
|---|---|---|
| `id` | bigserial | Primary key |
| `session_id` | UUID | FK → analysis_sessions |
| `energy_score` | integer | 0 – 100 |
| `energy_category` | text | Category at that point |
| `stress_level` | text | Level at that point |
| `anxiety_level` | text | Level at that point |
| `depression_level` | text | Level at that point |
| `tone` | text | Tone at that point |
| `recorded_at` | timestamptz | Auto-set |

### Storage Bucket: `audio-files`

Stores uploaded mp3/wav/webm files at path `uploads/{uuid}.{ext}`.
Public URL format: `https://{project}.supabase.co/storage/v1/object/public/audio-files/uploads/{file}`

---

## Running the Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Running the Frontend

```bash
cd frontend
npm install
npm run dev    # starts on http://localhost:5173
```

## API Quick Reference

| Endpoint | Method | Auto-saves? | Description |
|---|---|---|---|
| `/api/analyze/text` | POST | ✅ Yes | Text → analysis → energy → Supabase |
| `/api/analyze/voice` | POST | ✅ Yes | Audio → transcribe → analysis → energy → Supabase |
| `/api/sessions` | GET | — | List recent sessions |
| `/api/sessions/{id}` | GET | — | Get session detail |
| `/api/energy-history` | GET | — | Energy scores over time |
| `/api/energy-daily` | GET | — | Daily averages |
| `/api/text-analysis` | POST | ❌ No | Quick classification only |
| `/api/voice-analysis` | POST | ❌ No | Voice features only |
| `/api/energy-calculate` | POST | ❌ No | Manual energy calc |
| `/api/health` | GET | — | Health check |
| `/api/model-info` | GET | — | Model details |
