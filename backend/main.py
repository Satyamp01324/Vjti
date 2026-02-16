"""
Let Go 3.0 — FastAPI Backend
All routes flow through the data pipeline so every analysis is
automatically persisted to Supabase.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import os

# Load environment variables first
load_dotenv()

# --- Imports from restructured packages ---
from core.supabase_client import supabase
from core.pipeline import (
    run_text_pipeline,
    run_voice_pipeline,
    get_session,
    get_recent_sessions,
    get_energy_history,
    get_daily_energy_averages,
)
from core.energy_flow import calculate_energy_score, get_task_recommendation
from models.text_classification import clinical_predict
from models.voice_analysis import voice_predict, get_model_info
from core.voice_transcription import get_model_info as get_whisper_info

# --- Auth & Cognitive Scheduler ---
from core import auth as auth_service
from core.cognitive_scheduler import (
    schedule_task,
    schedule_multiple_tasks,
    complete_task_api,
    get_cognitive_stats,
    get_energy as get_scheduler_energy,
    parse_natural_language_task,
    get_mental_energy,
    calculate_recovery_need,
    fetch_emotional_state_from_db,
)

# ============================================
# App & CORS
# ============================================
app = FastAPI(title="Let Go 3.0", version="2.0.0")

origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
    "null",
    "https://your-production-app.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# Request models
# ============================================
class TextRequest(BaseModel):
    text: str

class VoiceRequest(BaseModel):
    features: list | dict

class EnergyRequest(BaseModel):
    stress_level: str
    anxiety_level: str
    depression_level: str
    tone: str
    base_energy: int = 70

# --- Auth models ---
class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    user_id: str
    full_name: Optional[str] = None

# --- Scheduler models ---
class ScheduleTaskRequest(BaseModel):
    task: str

class ScheduleMultipleRequest(BaseModel):
    tasks: str

class CompleteTaskRequest(BaseModel):
    task_name: str
    actual_difficulty: int

# --- Study Session models (Pipeline 3) ---
class StartSessionRequest(BaseModel):
    user_id: str
    task_name: str = "Focus Session"
    duration_minutes: int = 90

class SessionActionRequest(BaseModel):
    session_id: str

class BreakRequest(BaseModel):
    session_id: str
    break_type: str = "short"  # short, long, micro, custom
    custom_duration_seconds: Optional[int] = 0


# ============================================
# HEALTH & INFO
# ============================================

@app.get("/")
def read_root():
    return {"message": "Hello from Let Go 3.0 Backend!"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "version": "2.0.0"}


@app.get("/api/model-info")
async def get_models_info():
    """Information about all loaded ML models."""
    try:
        return {
            "status": "success",
            "models": {
                "text_classification": {
                    "name": "clinical_roberta",
                    "source": "Hugging Face",
                    "repo": "GehrmanSparrow1711/clinical_roberta",
                    "categories": ["Depression", "Anxiety", "Stress"],
                    "status": "loaded",
                },
                "voice_analysis": get_model_info(),
                "speech_to_text": get_whisper_info(),
            },
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


# ============================================
# PIPELINE ENDPOINTS  (auto-persist to Supabase)
# ============================================

@app.post("/api/analyze/text")
async def pipeline_text(request: TextRequest):
    """
    **Primary text endpoint.**
    Runs the full pipeline:
      text → classification → energy flow → save to Supabase → response

    Response JSON keys sent to frontend:
      status, session_id, input_text, analysis, energy_flow, persisted
    """
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        result = run_text_pipeline(request.text)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/analyze/voice")
async def pipeline_voice(audio: UploadFile = File(...)):
    """
    **Primary voice endpoint.**
    Runs the full pipeline:
      audio → transcribe → classification → energy flow → save to Supabase → response

    Response JSON keys sent to frontend:
      status, session_id, transcription, analysis, energy_flow, audio_info, persisted
    """
    try:
        audio_bytes = await audio.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file")

        result = run_voice_pipeline(
            audio_bytes=audio_bytes,
            filename=audio.filename or "audio.webm",
            content_type=audio.content_type or "audio/webm",
        )

        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("error"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# QUERY ENDPOINTS  (read from Supabase)
# ============================================

@app.get("/api/sessions")
async def list_sessions(limit: int = 20):
    """Get recent analysis sessions (for dashboard/history)."""
    sessions = get_recent_sessions(limit)
    return {"status": "success", "data": sessions, "count": len(sessions)}


@app.get("/api/sessions/{session_id}")
async def get_session_detail(session_id: str):
    """Get a single session by ID."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"status": "success", "data": session}


@app.get("/api/energy-history")
async def energy_history(limit: int = 50):
    """Get energy score history for trend charts."""
    history = get_energy_history(limit)
    return {"status": "success", "data": history, "count": len(history)}


@app.get("/api/energy-daily")
async def energy_daily():
    """Get daily average energy scores (for line/bar charts)."""
    averages = get_daily_energy_averages()
    return {"status": "success", "data": averages}


# ============================================
# STANDALONE ENDPOINTS (no auto-persist)
# ============================================

@app.post("/api/text-analysis")
async def analyze_text(request: TextRequest):
    """Classify text without saving to Supabase."""
    try:
        if not request.text or not request.text.strip():
            raise HTTPException(status_code=400, detail="Text cannot be empty")
        result = clinical_predict(request.text)
        return {"status": "success", "input_text": request.text, "analysis": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/voice-analysis")
async def analyze_voice(request: VoiceRequest):
    """Analyze voice features without saving to Supabase."""
    try:
        if not request.features:
            raise HTTPException(status_code=400, detail="Features cannot be empty")
        result = voice_predict(request.features)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("error"))
        return {"status": "success", "analysis": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/energy-calculate")
async def calculate_energy(request: EnergyRequest):
    """Calculate energy score from manual levels (no persistence)."""
    try:
        energy_result = calculate_energy_score(
            stress_level=request.stress_level,
            anxiety_level=request.anxiety_level,
            depression_level=request.depression_level,
            tone=request.tone,
            base_energy=request.base_energy,
        )
        task_rec = get_task_recommendation(energy_result["final_energy_score"])
        return {
            "status": "success",
            "energy_flow": {**energy_result, "task_recommendation": task_rec},
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================
# SUPABASE CONNECTION TEST
# ============================================

@app.get("/api/test-supabase")
async def test_supabase():
    """Quick connectivity check."""
    try:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        return {
            "supabase_url_configured": bool(url),
            "supabase_key_configured": bool(key),
            "message": "OK" if url and key else "Set SUPABASE_URL and SUPABASE_KEY in .env",
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


# ============================================
# AUTH ENDPOINTS (Supabase Auth + users_profile)
# ============================================

@app.post("/api/auth/register")
async def register(request: RegisterRequest):
    """Register a new user. Creates Supabase Auth entry + users_profile row."""
    if not request.email or not request.password:
        raise HTTPException(status_code=400, detail="Email and password are required.")
    if len(request.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    result = auth_service.register(request.email, request.password, request.full_name)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["error"])
    return result


@app.post("/api/auth/login")
async def login(request: LoginRequest):
    """Authenticate a user and return session tokens."""
    if not request.email or not request.password:
        raise HTTPException(status_code=400, detail="Email and password are required.")
    result = auth_service.login(request.email, request.password)
    if result["status"] == "error":
        raise HTTPException(status_code=401, detail=result["error"])
    return result


@app.get("/api/auth/profile/{user_id}")
async def get_profile(user_id: str):
    """Fetch a user's profile from users_profile."""
    result = auth_service.get_profile(user_id)
    if result["status"] == "error":
        raise HTTPException(status_code=404, detail=result["error"])
    return result


@app.put("/api/auth/profile")
async def update_profile(request: ProfileUpdateRequest):
    """Update a user's profile in users_profile."""
    result = auth_service.update_profile(request.user_id, request.full_name)
    if result["status"] == "error":
        raise HTTPException(status_code=400, detail=result["error"])
    return result


# ============================================
# COGNITIVE SCHEDULER ENDPOINTS (feature_2)
# ============================================

@app.post("/api/scheduler/parse-task")
async def api_parse_task(request: ScheduleTaskRequest):
    """Parse a natural-language task description without scheduling it."""
    try:
        parsed = parse_natural_language_task(request.task)
        energy = get_mental_energy()
        recovery = calculate_recovery_need(parsed, energy)
        return {"status": "success", "task": parsed, "energy": energy, "recovery": recovery}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/scheduler/schedule")
async def api_schedule_task(request: ScheduleTaskRequest):
    """
    Schedule a single task end-to-end:
      parse → energy check → find optimal slot → create Google Calendar event.
    """
    try:
        result = schedule_task(request.task)
        if result.get("status") == "error":
            raise HTTPException(status_code=500, detail=result.get("error"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/scheduler/schedule-multiple")
async def api_schedule_multiple(request: ScheduleMultipleRequest):
    """Schedule multiple tasks parsed from a single description."""
    try:
        result = schedule_multiple_tasks(request.tasks)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/scheduler/complete-task")
async def api_complete_task(request: CompleteTaskRequest):
    """Mark a task as complete and update cognitive state."""
    try:
        if not 1 <= request.actual_difficulty <= 10:
            raise HTTPException(status_code=400, detail="actual_difficulty must be 1-10")
        result = complete_task_api(request.task_name, request.actual_difficulty)
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/scheduler/stats")
async def api_cognitive_stats():
    """Get current cognitive state: fatigue, streak, achievements, recent tasks."""
    return get_cognitive_stats()


@app.get("/api/scheduler/energy")
async def api_scheduler_energy():
    """Get current mental energy level with circadian-rhythm + emotional state context."""
    return get_scheduler_energy()


@app.get("/api/scheduler/emotional-state")
async def api_emotional_state():
    """Get user's latest emotional state from DB (Pipeline 1 → Pipeline 2 bridge)."""
    state = fetch_emotional_state_from_db()
    return {"status": "success", "emotional_state": state}


# ============================================
# PIPELINE 3: STUDY SESSION ENDPOINTS
# ============================================
from core.study_session import (
    start_session, pause_session, resume_session,
    start_break, end_break, end_session,
    get_session_status, get_today_stats, get_weekly_stats,
    get_recovery_plan,
    get_current_session,
)

@app.post("/api/study/start")
async def api_start_session(request: StartSessionRequest):
    """Start a new study/focus session."""
    return start_session(request.user_id, request.task_name, request.duration_minutes)

@app.get("/api/study/current/{user_id}")
async def api_current_session(user_id: str):
    """Get the current active/paused/break session for the user."""
    return get_current_session(user_id)

@app.post("/api/study/pause")
async def api_pause_session(request: SessionActionRequest):
    """Pause the current study session."""
    return pause_session(request.session_id)

@app.post("/api/study/resume")
async def api_resume_session(request: SessionActionRequest):
    """Resume a paused study session."""
    return resume_session(request.session_id)

@app.post("/api/study/break")
async def api_start_break(request: BreakRequest):
    """Start a break during a study session."""
    return start_break(request.session_id, request.break_type, request.custom_duration_seconds)

@app.post("/api/study/end-break")
async def api_end_break(request: SessionActionRequest):
    """End a break and resume focus."""
    return end_break(request.session_id)

@app.post("/api/study/end")
async def api_end_session(request: SessionActionRequest):
    """End a study session. Returns stats + AI recovery plan."""
    return end_session(request.session_id)

@app.get("/api/study/session/{session_id}")
async def api_session_status(session_id: str):
    """Get current session status and live stats."""
    return get_session_status(session_id)

@app.get("/api/study/stats/today/{user_id}")
async def api_today_stats(user_id: str):
    """Get today's study stats for a user."""
    return get_today_stats(user_id)

@app.get("/api/study/stats/weekly/{user_id}")
async def api_weekly_stats(user_id: str):
    """Get weekly study analysis with daily breakdown."""
    return get_weekly_stats(user_id)

@app.get("/api/study/recovery-plan/{user_id}")
async def api_recovery_plan(user_id: str):
    """Get AI recovery plan based on emotional state + recent sessions."""
    return get_recovery_plan(user_id)
