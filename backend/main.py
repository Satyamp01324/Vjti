"""
Let Go 3.0 — FastAPI Backend
All routes flow through the data pipeline so every analysis is
automatically persisted to Supabase.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

# ============================================
# App & CORS
# ============================================
app = FastAPI(title="Let Go 3.0", version="2.0.0")

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
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
