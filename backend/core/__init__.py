"""
Backend Core Package
"""

from .supabase_client import supabase

# SpoonSense Core Modules (pure, zero-dependency)
from . import spoon_engine
from . import timetable_parser

# Legacy / ML pipelines with graceful import fallback
try:
    from .energy_flow import (
        calculate_energy_score,
        get_task_recommendation,
        calculate_energy_from_analysis,
        classify_level,
        classify_tone,
    )
except ImportError:
    pass

try:
    from .voice_transcription import (
        transcribe_audio,
        transcribe_audio_bytes,
        get_model_info as get_whisper_info,
    )
except ImportError:
    pass

try:
    from .cognitive_scheduler import fetch_emotional_state_from_db
except ImportError:
    pass
