"""
Cognitive Scheduler Service
Extracted from feature_2/main.py and refactored as an API-friendly service.

Provides:
  - Natural language task parsing with cognitive type detection
  - Mental energy calculation (circadian rhythm aware)
  - Google Calendar integration for task scheduling
  - Deep work block structuring (Pomodoro-style)
  - Recovery cycle recommendations
  - Cognitive state tracking (fatigue, streaks, achievements)
  - AI-powered optimal time slot finding via Gemini
"""

import datetime
import os
import json
import re
import traceback
from typing import Dict, List, Tuple, Optional

from google import genai

try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from googleapiclient.discovery import build
    from google.auth.transport.requests import Request
    GOOGLE_CALENDAR_AVAILABLE = True
except Exception as e:
    GOOGLE_CALENDAR_AVAILABLE = False
    Credentials = None
    InstalledAppFlow = None
    build = None
    Request = None

from core.supabase_client import supabase

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────
SCOPES = ["https://www.googleapis.com/auth/calendar.events"]
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyBW8s01msW2J7Zn_YgqZ-Dy9OPUvsaOgYY")
COGNITIVE_STATE_FILE = os.path.join(os.path.dirname(__file__), "..", "cognitive_state.json")

# Gemini client
_gemini_client = genai.Client(api_key=GEMINI_API_KEY)


# ─────────────────────────────────────────────
# EMOTIONAL STATE FROM DB (Pipeline 1 → Pipeline 2)
# ─────────────────────────────────────────────
def fetch_emotional_state_from_db() -> Dict:
    """
    Fetch the latest emotional analysis from Supabase.
    This bridges Pipeline 1 (text/voice analysis) → Pipeline 2 (scheduler).
    Returns depression, anxiety, stress levels + energy score from the most recent session.
    """
    default = {
        "has_data": False,
        "depression_score": 0.0, "anxiety_score": 0.0, "stress_score": 0.0,
        "depression_level": "low", "anxiety_level": "low", "stress_level": "low",
        "tone": "neutral", "energy_score": 70, "energy_category": "high_energy",
        "source": "default",
    }
    try:
        resp = (
            supabase.table("analysis_sessions")
            .select("*")
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if not resp.data:
            return default
        row = resp.data[0]
        return {
            "has_data": True,
            "depression_score": row.get("depression_score", 0.0) or 0.0,
            "anxiety_score": row.get("anxiety_score", 0.0) or 0.0,
            "stress_score": row.get("stress_score", 0.0) or 0.0,
            "depression_level": row.get("depression_level", "low") or "low",
            "anxiety_level": row.get("anxiety_level", "low") or "low",
            "stress_level": row.get("stress_level", "low") or "low",
            "tone": row.get("tone", "neutral") or "neutral",
            "energy_score": row.get("energy_score", 70) or 70,
            "energy_category": row.get("energy_category", "high_energy") or "high_energy",
            "source": "supabase",
            "session_id": row.get("id"),
            "input_text": row.get("input_text", ""),
            "created_at": row.get("created_at"),
        }
    except Exception as e:
        print(f"[scheduler] Could not fetch emotional state from DB: {e}")
        return default


# ─────────────────────────────────────────────
# COGNITIVE STATE (persistent)
# ─────────────────────────────────────────────
class CognitiveState:
    """Tracks fatigue, streaks, achievements, and task history."""

    def __init__(self):
        self.fatigue_counter = 0
        self.completed_tasks: list = []
        self.task_history: list = []
        self.current_focus_streak = 0
        self.total_deep_work_minutes = 0
        self.last_break_time: Optional[datetime.datetime] = None
        self.daily_streaks = 0
        self.total_tasks_completed = 0
        self.achievements: list = []
        self.energy_patterns: dict = {}
        self.load_state()

    # --- mutations --------------------------------------------------------
    def add_task(self, task_data: dict):
        entry = {**task_data, "timestamp": datetime.datetime.now().isoformat(), "status": "scheduled"}
        if "target_date" in entry and isinstance(entry["target_date"], datetime.datetime):
            entry["target_date"] = entry["target_date"].isoformat()
        self.task_history.append(entry)
        self.save_state()

    def complete_task(self, task_name: str, actual_difficulty: int):
        for task in self.task_history:
            if task["task_name"] == task_name and task.get("status") == "scheduled":
                task["status"] = "completed"
                task["completed_at"] = datetime.datetime.now().isoformat()
                task["actual_difficulty"] = actual_difficulty
                break
        self.completed_tasks.append(task_name)
        self.total_tasks_completed += 1
        self.current_focus_streak += 1
        new_achievements = self._check_achievements()
        self.save_state()
        return new_achievements

    def update_fatigue(self, difficulty: int):
        self.fatigue_counter += difficulty
        self.save_state()

    def reset_fatigue(self):
        self.fatigue_counter = 0
        self.last_break_time = datetime.datetime.now()
        self.save_state()

    def increment_streak(self):
        self.current_focus_streak += 1
        self.save_state()

    def add_deep_work_time(self, minutes: int):
        self.total_deep_work_minutes += minutes
        self.save_state()

    # --- queries ----------------------------------------------------------
    def get_state_summary(self) -> dict:
        return {
            "fatigue": self.fatigue_counter,
            "streak": self.current_focus_streak,
            "total_deep_work": self.total_deep_work_minutes,
            "tasks_completed": len(self.completed_tasks),
            "total_all_time": self.total_tasks_completed,
            "achievements_count": len(self.achievements),
            "achievements": self.achievements,
            "recent_tasks": self.task_history[-10:],
        }

    # --- achievements -----------------------------------------------------
    def _check_achievements(self) -> list:
        new = []
        if self.total_tasks_completed >= 10 and "First 10 Tasks" not in self.achievements:
            new.append("🎯 First 10 Tasks")
            self.achievements.append("First 10 Tasks")
        if self.current_focus_streak >= 5 and "5-Task Streak" not in self.achievements:
            new.append("🔥 5-Task Streak")
            self.achievements.append("5-Task Streak")
        if self.total_deep_work_minutes >= 300 and "5 Hours Deep Work" not in self.achievements:
            new.append("⏰ 5 Hours Deep Work")
            self.achievements.append("5 Hours Deep Work")
        return new

    # --- persistence ------------------------------------------------------
    def save_state(self):
        serializable_history = []
        for task in self.task_history:
            t = task.copy()
            if "target_date" in t and isinstance(t["target_date"], datetime.datetime):
                t["target_date"] = t["target_date"].isoformat()
            serializable_history.append(t)
        data = {
            "fatigue_counter": self.fatigue_counter,
            "completed_tasks": self.completed_tasks,
            "task_history": serializable_history,
            "current_focus_streak": self.current_focus_streak,
            "total_deep_work_minutes": self.total_deep_work_minutes,
            "last_break_time": self.last_break_time.isoformat() if self.last_break_time else None,
            "daily_streaks": self.daily_streaks,
            "total_tasks_completed": self.total_tasks_completed,
            "achievements": self.achievements,
            "energy_patterns": self.energy_patterns,
        }
        try:
            with open(COGNITIVE_STATE_FILE, "w") as f:
                json.dump(data, f, indent=2)
        except Exception:
            pass

    def load_state(self):
        if not os.path.exists(COGNITIVE_STATE_FILE):
            return
        try:
            with open(COGNITIVE_STATE_FILE, "r") as f:
                d = json.load(f)
            self.fatigue_counter = d.get("fatigue_counter", 0)
            self.completed_tasks = d.get("completed_tasks", [])
            self.task_history = d.get("task_history", [])
            self.current_focus_streak = d.get("current_focus_streak", 0)
            self.total_deep_work_minutes = d.get("total_deep_work_minutes", 0)
            self.daily_streaks = d.get("daily_streaks", 0)
            self.total_tasks_completed = d.get("total_tasks_completed", 0)
            self.achievements = d.get("achievements", [])
            self.energy_patterns = d.get("energy_patterns", {})
            lb = d.get("last_break_time")
            if lb:
                self.last_break_time = datetime.datetime.fromisoformat(lb)
        except Exception:
            pass


# Singleton
cognitive_state = CognitiveState()


# ─────────────────────────────────────────────
# NLP TASK PARSER
# ─────────────────────────────────────────────
def parse_natural_language_task(user_input: str) -> Dict:
    """Extract task details from natural language with day/date detection."""
    import pytz

    local_tz = pytz.timezone("Asia/Kolkata")
    now = datetime.datetime.now(local_tz)
    lower = user_input.lower()

    # --- Day detection ---
    target_date = None
    days_of_week = {
        "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
        "friday": 4, "saturday": 5, "sunday": 6,
    }
    for day_name, day_num in days_of_week.items():
        if day_name in lower:
            ahead = day_num - now.weekday()
            if ahead <= 0:
                ahead += 7
            target_date = now + datetime.timedelta(days=ahead)
            break

    if "tomorrow" in lower:
        target_date = now + datetime.timedelta(days=1)
    elif "today" in lower:
        target_date = now
    elif "next week" in lower:
        target_date = now + datetime.timedelta(days=7)

    # --- Activity detection ---
    physical_kw = ["cricket", "gym", "run", "jog", "exercise", "sport", "play", "workout", "yoga"]
    social_kw = ["wedding", "party", "meeting", "event", "attend", "ceremony", "resort"]
    analytical_kw = ["math", "calculus", "algorithm", "code", "programming", "physics", "chemistry"]
    creative_kw = ["write", "essay", "design", "draw", "create", "art", "compose"]
    memorization_kw = ["memorize", "learn", "vocabulary", "flashcard", "remember"]

    is_physical = any(k in lower for k in physical_kw)
    is_social = any(k in lower for k in social_kw)

    if is_social:
        cognitive_type, category, difficulty, preferred_time = "Social", "Social Event", 2, "Flexible"
    elif is_physical:
        cognitive_type, category, difficulty, preferred_time = "Physical", "Physical Activity", 3, "Morning"
    elif any(k in lower for k in analytical_kw):
        cognitive_type, category, difficulty, preferred_time = "Analytical", "Deep Work", 8, "Morning"
    elif any(k in lower for k in creative_kw):
        cognitive_type, category, difficulty, preferred_time = "Creative", "Deep Work", 6, "Afternoon"
    elif any(k in lower for k in memorization_kw):
        cognitive_type, category, difficulty, preferred_time = "Memorization", "Medium Focus", 5, "Flexible"
    else:
        cognitive_type, category, difficulty, preferred_time = "Problem-Solving", "Medium Focus", 5, "Flexible"

    # --- Duration ---
    match = re.search(r"(\d+)\s*hour", lower)
    if match:
        duration = int(match.group(1)) * 60
    else:
        duration = 120 if is_social else 45

    return {
        "task_name": user_input,
        "difficulty": difficulty,
        "duration_minutes": duration,
        "category": category,
        "subject_area": "General",
        "urgency": "Medium",
        "prerequisites": [],
        "cognitive_type": cognitive_type,
        "deadline": None,
        "deadline_text": None,
        "preferred_time_of_day": preferred_time,
        "requires_physical_space": is_physical or is_social,
        "is_physical_activity": is_physical,
        "target_date": target_date.isoformat() if target_date else None,
        "is_social_event": is_social,
    }


# ─────────────────────────────────────────────
# MENTAL ENERGY ENGINE (now uses DB emotional state)
# ─────────────────────────────────────────────
def get_mental_energy(emotional_state: Optional[Dict] = None) -> Dict:
    """
    Real-time mental bandwidth with circadian rhythm awareness
    AND emotional state from Pipeline 1 (depression/anxiety/stress from DB).
    """
    if emotional_state is None:
        emotional_state = fetch_emotional_state_from_db()

    now = datetime.datetime.now()
    hour = now.hour
    day_of_week = now.weekday()

    if 6 <= hour <= 9:
        base = 9
    elif 10 <= hour <= 12:
        base = 8
    elif 13 <= hour <= 14:
        base = 5
    elif 15 <= hour <= 17:
        base = 7
    elif 18 <= hour <= 20:
        base = 5
    elif 21 <= hour <= 23:
        base = 3
    else:
        base = 1

    fatigue_penalty = min(cognitive_state.fatigue_counter * 0.5, 4)
    weekend_bonus = 1 if day_of_week >= 5 else 0
    break_penalty = 0
    if cognitive_state.last_break_time:
        mins = (now - cognitive_state.last_break_time).total_seconds() / 60
        if mins > 90:
            break_penalty = 2

    # ── NEW: Emotional state penalty from DB ──
    emotional_penalty = 0.0
    if emotional_state.get("has_data"):
        dep = emotional_state.get("depression_score", 0)
        anx = emotional_state.get("anxiety_score", 0)
        stress = emotional_state.get("stress_score", 0)
        # High depression/anxiety/stress reduce available mental energy
        emotional_penalty = (dep * 2.5) + (anx * 1.5) + (stress * 1.0)
        emotional_penalty = min(emotional_penalty, 5)  # cap at 5

    final = max(1, base - fatigue_penalty + weekend_bonus - break_penalty - emotional_penalty)

    if final >= 8:
        rec = "🔥 Peak Performance – Tackle your hardest tasks now!"
    elif final >= 6:
        rec = "💪 Good Focus – Great time for challenging work"
    elif final >= 4:
        rec = "⚡ Moderate Energy – Medium difficulty tasks recommended"
    elif final >= 2:
        rec = "🌙 Low Energy – Consider light tasks or take a break"
    else:
        rec = "😴 Critical Low – Rest is essential for productivity"

    return {
        "energy_level": int(final),
        "base_energy": base,
        "fatigue_penalty": fatigue_penalty,
        "break_penalty": break_penalty,
        "emotional_penalty": round(emotional_penalty, 2),
        "emotional_state": {
            "depression": emotional_state.get("depression_level", "low"),
            "anxiety": emotional_state.get("anxiety_level", "low"),
            "stress": emotional_state.get("stress_level", "low"),
            "tone": emotional_state.get("tone", "neutral"),
            "db_energy_score": emotional_state.get("energy_score", 70),
            "from_db": emotional_state.get("has_data", False),
        },
        "recommendation": rec,
    }


# ─────────────────────────────────────────────
# RECOVERY CYCLE
# ─────────────────────────────────────────────
def calculate_recovery_need(task_data: Dict, energy_state: Dict) -> Dict:
    difficulty = task_data["difficulty"]
    fatigue = cognitive_state.fatigue_counter
    energy = energy_state["energy_level"]

    if fatigue > 15:
        return {"needs_recovery": True, "duration": 20, "type": "Long Break – Walk outside or stretch"}
    if fatigue > 10:
        return {"needs_recovery": True, "duration": 10, "type": "Medium Break – Step away from screen"}
    if energy <= 3:
        return {"needs_recovery": True, "duration": 15, "type": "Energy Recovery – Rest or light activity"}
    if difficulty >= 8 and energy <= 5:
        return {"needs_recovery": True, "duration": 10, "type": "Pre-task Recovery – Prepare for high difficulty"}
    return {"needs_recovery": False, "duration": 0, "type": ""}


# ─────────────────────────────────────────────
# DEEP WORK BLOCKS (Pomodoro-style)
# ─────────────────────────────────────────────
def create_deep_work_block(task_data: Dict, start_time: datetime.datetime) -> Dict:
    duration = task_data["duration_minutes"]
    if duration > 50:
        blocks, remaining, cur = [], duration, start_time
        while remaining > 0:
            bd = min(50, remaining)
            blocks.append({"start": cur.isoformat(), "end": (cur + datetime.timedelta(minutes=bd)).isoformat(), "type": "deep_work", "duration": bd})
            cur += datetime.timedelta(minutes=bd)
            remaining -= bd
            if remaining > 0:
                blocks.append({"start": cur.isoformat(), "end": (cur + datetime.timedelta(minutes=10)).isoformat(), "type": "micro_break", "duration": 10})
                cur += datetime.timedelta(minutes=10)
        return {"blocks": blocks, "total_time": duration + (len(blocks) // 2) * 10}
    else:
        return {
            "blocks": [{"start": start_time.isoformat(), "end": (start_time + datetime.timedelta(minutes=duration)).isoformat(), "type": "deep_work", "duration": duration}],
            "total_time": duration,
        }


# ─────────────────────────────────────────────
# GAMIFICATION
# ─────────────────────────────────────────────
def _emoji(difficulty: int, category: str) -> str:
    if difficulty >= 8:
        return "🔥💎"
    if difficulty >= 6:
        return "⚔️"
    if category == "Deep Work":
        return "🧠"
    if category == "Creative":
        return "🎨"
    return "📚"


# ─────────────────────────────────────────────
# GOOGLE CALENDAR HELPERS
# ─────────────────────────────────────────────
_TOKEN_PATH = os.path.join(os.path.dirname(__file__), "..", "feature_2", "token.json")
_CLIENT_SECRET_PATH = os.path.join(os.path.dirname(__file__), "..", "feature_2", "client_secret.json")


def _get_calendar_service():
    """Build a Google Calendar v3 service using stored OAuth2 credentials."""
    creds = None
    if os.path.exists(_TOKEN_PATH):
        creds = Credentials.from_authorized_user_file(_TOKEN_PATH, SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(_CLIENT_SECRET_PATH):
                raise RuntimeError(
                    "Google Calendar client_secret.json not found. "
                    "Place it in backend/feature_2/client_secret.json and run the CLI once to authorise."
                )
            flow = InstalledAppFlow.from_client_secrets_file(_CLIENT_SECRET_PATH, SCOPES)
            creds = flow.run_local_server(port=8080)
        with open(_TOKEN_PATH, "w") as f:
            f.write(creds.to_json())
    return build("calendar", "v3", credentials=creds)


def _event_color(category: str) -> str:
    return {"Deep Work": "11", "Medium Focus": "5", "Light Task": "10", "Creative": "9"}.get(category, "1")


# ─────────────────────────────────────────────
# AI HELPERS (Gemini) — now receives emotional state from DB
# ─────────────────────────────────────────────
def _ai_time_preferences(task_data: Dict, emotional_state: Optional[Dict] = None) -> Dict:
    emo_ctx = ""
    if emotional_state and emotional_state.get("has_data"):
        emo_ctx = f"""

USER'S CURRENT EMOTIONAL STATE (from latest analysis in database):
- Depression Level: {emotional_state.get('depression_level', 'low')} (score: {emotional_state.get('depression_score', 0):.2f})
- Anxiety Level: {emotional_state.get('anxiety_level', 'low')} (score: {emotional_state.get('anxiety_score', 0):.2f})
- Stress Level: {emotional_state.get('stress_level', 'low')} (score: {emotional_state.get('stress_score', 0):.2f})
- Overall Tone: {emotional_state.get('tone', 'neutral')}
- Current Energy Score: {emotional_state.get('energy_score', 70)}/100

IMPORTANT EMOTIONAL RULES:
- If depression is HIGH: avoid early morning scheduling, prefer gentle afternoon slots, reduce task intensity
- If anxiety is HIGH: avoid back-to-back scheduling, add buffer time, prefer familiar/comfortable time slots
- If stress is HIGH: space out tasks more, prefer low-pressure time windows, suggest breaks before/after
- If energy is LOW (<40): only schedule light tasks, prefer peak circadian hours
- If tone is NEGATIVE: prioritize self-care tasks, avoid overloading
"""

    prompt = f"""You are a cognitive scheduling expert. Given task details AND the user's emotional state, return optimal time preferences.

Task: {task_data['task_name']}
Difficulty: {task_data['difficulty']}/10
Duration: {task_data['duration_minutes']} min
Cognitive Type: {task_data.get('cognitive_type')}
Is Physical: {task_data.get('is_physical_activity', False)}
Preferred Time: {task_data.get('preferred_time_of_day', 'Flexible')}
{emo_ctx}
RULES:
- Physical activities → ONLY 6 AM – 10 PM
- Deep analytical → Morning 8-12 or afternoon 3-5 PM
- Creative → moderate-high energy periods
- Memorization → flexible
- ADAPT scheduling based on the user's emotional state above

Respond ONLY in JSON (no markdown):
{{"min_energy": <1-10>, "preferred_hours": [<hours>], "avoid_hours": [<hours>], "reasoning": "<brief, mention emotional adaptation>"}}
"""
    try:
        resp = _gemini_client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        text = resp.text.strip()
        if text.startswith("```"):
            text = text.split("```json")[-1].split("```")[0].strip() if "```json" in text else text.split("```")[1].split("```")[0].strip()
        return json.loads(text)
    except Exception:
        if task_data.get("is_physical_activity"):
            return {"min_energy": 5, "preferred_hours": list(range(6, 22)), "avoid_hours": list(range(22, 24)) + list(range(0, 6)), "reasoning": "Physical activity needs daylight"}
        if task_data["difficulty"] >= 8:
            return {"min_energy": 8, "preferred_hours": [8, 9, 10, 11, 15, 16, 17], "avoid_hours": [0, 1, 2, 3, 4, 5, 22, 23], "reasoning": "High difficulty needs peak energy"}
        return {"min_energy": 4, "preferred_hours": list(range(8, 22)), "avoid_hours": list(range(22, 24)) + list(range(0, 8)), "reasoning": "Flexible"}


def _predict_energy_at_hour(hour: int, fatigue: int) -> int:
    if 6 <= hour <= 9:
        base = 9
    elif 10 <= hour <= 12:
        base = 8
    elif 13 <= hour <= 14:
        base = 5
    elif 15 <= hour <= 17:
        base = 7
    elif 18 <= hour <= 20:
        base = 5
    elif 21 <= hour <= 23:
        base = 3
    else:
        base = 1
    return max(1, int(base - min(fatigue * 0.3, 4)))


def _score_slot(candidate, predicted_energy, task_data, workload_map, prefs, current_energy, offset) -> Dict:
    hour = candidate.hour
    if task_data.get("is_physical_activity") and (hour < 6 or hour >= 22):
        return {"score": 0, "reason": "Physical activity at inappropriate time"}
    score = predicted_energy
    reasons = []
    if hour in prefs.get("preferred_hours", []):
        score += 5
        reasons.append("Optimal time window")
    if hour in prefs.get("avoid_hours", []):
        score -= 5
        reasons.append("Suboptimal time")
    if offset <= 1 and current_energy >= prefs.get("min_energy", 4):
        score += 2
        reasons.append("Ready now")
    surr = sum(workload_map.get(candidate + datetime.timedelta(hours=h), 0) for h in [-1, 0, 1])
    if surr == 0:
        score += 3
        reasons.append("Clear schedule")
    return {"score": max(0, score), "reason": ", ".join(reasons) or "Available slot"}


# ─────────────────────────────────────────────
# SLOT FINDER
# ─────────────────────────────────────────────
def _analyze_workload(events, local_tz) -> Dict:
    wmap: Dict = {}
    for ev in events:
        s = ev["start"].get("dateTime")
        e = ev["end"].get("dateTime")
        if not s:
            continue
        es = datetime.datetime.fromisoformat(s.replace("Z", "+00:00")).astimezone(local_tz)
        ee = datetime.datetime.fromisoformat(e.replace("Z", "+00:00")).astimezone(local_tz)
        cur = es
        while cur < ee:
            hk = cur.replace(minute=0, second=0, microsecond=0)
            wmap[hk] = wmap.get(hk, 0) + 1
            cur += datetime.timedelta(hours=1)
    return wmap


def _find_optimal_slot(service, task_data: Dict, energy_state: Dict, emotional_state: Optional[Dict] = None) -> datetime.datetime:
    import pytz
    local_tz = pytz.timezone("Asia/Kolkata")
    now = datetime.datetime.now(local_tz)

    target_date_str = task_data.get("target_date")
    if target_date_str:
        target_date = datetime.datetime.fromisoformat(target_date_str).astimezone(local_tz) if isinstance(target_date_str, str) else target_date_str
        search_start = target_date.replace(hour=6, minute=0, second=0, microsecond=0)
        time_min = search_start.isoformat()
        time_max = target_date.replace(hour=23, minute=59, second=0, microsecond=0).isoformat()
        max_hours = 18
    else:
        search_start = now
        time_min = now.isoformat()
        time_max = (now + datetime.timedelta(hours=24)).isoformat()
        max_hours = 24

    events_result = service.events().list(
        calendarId="primary", timeMin=time_min, timeMax=time_max,
        singleEvents=True, orderBy="startTime",
    ).execute()
    events = events_result.get("items", [])
    wmap = _analyze_workload(events, local_tz)
    prefs = _ai_time_preferences(task_data, emotional_state)  # Pass emotional state to Gemini
    current_energy = energy_state["energy_level"]
    duration_needed = task_data["duration_minutes"]

    windows = []
    for off in range(max_hours):
        cand = search_start + datetime.timedelta(hours=off)
        cand = cand.replace(minute=0, second=0, microsecond=0)
        hour = cand.hour
        if target_date_str and cand.date() != search_start.date():
            continue
        if cand < now:
            continue
        if task_data.get("is_physical_activity") and (hour < 6 or hour >= 22):
            continue
        pref_time = task_data.get("preferred_time_of_day", "Flexible")
        if pref_time == "Morning" and not (6 <= hour < 12):
            continue
        if pref_time == "Afternoon" and not (12 <= hour < 17):
            continue
        if pref_time == "Evening" and not (17 <= hour < 22):
            continue
        if cand in wmap:
            continue
        free = True
        for m in range(0, duration_needed, 60):
            ch = (cand + datetime.timedelta(minutes=m)).replace(minute=0, second=0, microsecond=0)
            if ch in wmap:
                free = False
                break
        if not free:
            continue
        pe = _predict_energy_at_hour(hour, cognitive_state.fatigue_counter)
        if pe < prefs.get("min_energy", 1):
            continue
        sd = _score_slot(cand, pe, task_data, wmap, prefs, current_energy, off)
        windows.append({"start": cand, "score": sd["score"], "energy_score": pe, "reason": sd["reason"]})

    windows.sort(key=lambda x: x["score"], reverse=True)
    if windows:
        best = windows[0]
        return best["start"]
    # fallback
    cand = now + datetime.timedelta(minutes=10)
    cand = cand.replace(second=0, microsecond=0)
    for ev in events:
        es_str = ev["start"].get("dateTime")
        ee_str = ev["end"].get("dateTime")
        if not es_str:
            continue
        ev_s = datetime.datetime.fromisoformat(es_str.replace("Z", "+00:00")).astimezone(local_tz)
        ev_e = datetime.datetime.fromisoformat(ee_str.replace("Z", "+00:00")).astimezone(local_tz)
        if cand < ev_e and (cand + datetime.timedelta(minutes=duration_needed)) > ev_s:
            cand = ev_e + datetime.timedelta(minutes=5)
    return cand


# ─────────────────────────────────────────────
# CALENDAR EVENT CREATION
# ─────────────────────────────────────────────
def _create_calendar_event(service, task_data: Dict, work_structure: Dict, start_time: datetime.datetime):
    emoji = _emoji(task_data["difficulty"], task_data["category"])
    end_time = start_time + datetime.timedelta(minutes=work_structure["total_time"])

    desc = f"📚 {task_data['category']} – {task_data['cognitive_type']}\n"
    desc += f"⚡ Difficulty: {task_data['difficulty']}/10\n"
    desc += f"📖 Subject: {task_data['subject_area']}\n"
    desc += f"🎯 Urgency: {task_data['urgency']}\n\n⏱️ Work Structure:\n━━━━━━━━━━━━━━━━━━━━\n"
    for i, blk in enumerate(work_structure["blocks"], 1):
        if blk["type"] == "deep_work":
            desc += f"{i}. 🧠 DEEP WORK ({blk['duration']} min)\n"
        else:
            desc += f"{i}. ☕ BREAK ({blk['duration']} min)\n"
    desc += "\n💡 Tips:\n• Silence notifications\n• Close unnecessary tabs\n• Have water nearby\n"

    event = {
        "summary": f"{emoji} {task_data['task_name']}",
        "description": desc,
        "start": {"dateTime": start_time.isoformat(), "timeZone": "Asia/Kolkata"},
        "end": {"dateTime": end_time.isoformat(), "timeZone": "Asia/Kolkata"},
        "reminders": {"useDefault": False, "overrides": [{"method": "popup", "minutes": 5}, {"method": "popup", "minutes": 0}]},
        "colorId": _event_color(task_data["category"]),
    }
    created = service.events().insert(calendarId="primary", body=event).execute()
    return created.get("id"), created.get("htmlLink")


# ═════════════════════════════════════════════
# PUBLIC SERVICE API
# ═════════════════════════════════════════════

def schedule_task(user_input: str) -> Dict:
    """
    End-to-end: fetch emotional state from DB → parse → energy check → recovery →
    find slot (with emotional context for Gemini) → create event → update state.
    Returns a JSON-friendly dict with all details.
    """
    # Step 0: Fetch emotional state from DB (Pipeline 1 → Pipeline 2 bridge)
    emotional_state = fetch_emotional_state_from_db()
    print(f"[scheduler] Emotional state from DB: dep={emotional_state.get('depression_level')}, "
          f"anx={emotional_state.get('anxiety_level')}, stress={emotional_state.get('stress_level')}, "
          f"energy={emotional_state.get('energy_score')}, from_db={emotional_state.get('has_data')}")

    # Step 1: Parse task
    task_data = parse_natural_language_task(user_input)

    # Step 2: Get mental energy (now includes emotional state from DB)
    energy_state = get_mental_energy(emotional_state)

    # Step 3: Recovery check (now includes emotional state)
    recovery = calculate_recovery_need(task_data, energy_state)

    # Step 4: Find optimal slot (Gemini receives emotional context)
    service = _get_calendar_service()
    start_time = _find_optimal_slot(service, task_data, energy_state, emotional_state)

    # Step 5: Create work blocks and calendar event
    work_structure = create_deep_work_block(task_data, start_time)
    event_id, event_link = _create_calendar_event(service, task_data, work_structure, start_time)

    # Step 6: Update cognitive state
    cognitive_state.add_task(task_data)
    cognitive_state.update_fatigue(task_data["difficulty"])
    cognitive_state.increment_streak()
    cognitive_state.add_deep_work_time(task_data["duration_minutes"])

    return {
        "status": "success",
        "task": task_data,
        "energy": energy_state,
        "recovery": recovery,
        "emotional_context": {
            "from_db": emotional_state.get("has_data", False),
            "depression": emotional_state.get("depression_level"),
            "anxiety": emotional_state.get("anxiety_level"),
            "stress": emotional_state.get("stress_level"),
            "tone": emotional_state.get("tone"),
            "db_energy_score": emotional_state.get("energy_score"),
        },
        "scheduled_at": start_time.isoformat(),
        "work_structure": work_structure,
        "calendar_event": {"id": event_id, "link": event_link},
        "cognitive_state": cognitive_state.get_state_summary(),
    }


def schedule_multiple_tasks(user_input: str) -> Dict:
    """Parse and schedule multiple tasks from a single input string."""
    prompt = f"""Extract multiple tasks from this input: "{user_input}"
Respond in JSON (no markdown): {{"tasks": ["task 1", "task 2", ...]}}
If only one task, return array with one item."""

    try:
        resp = _gemini_client.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        text = resp.text.strip()
        if text.startswith("```"):
            text = text.split("```json")[-1].split("```")[0].strip() if "```json" in text else text.split("```")[1].split("```")[0].strip()
        tasks = json.loads(text).get("tasks", [user_input])
    except Exception:
        tasks = [user_input]

    results = []
    for t in tasks:
        try:
            r = schedule_task(t)
            results.append(r)
        except Exception as e:
            results.append({"status": "error", "task_input": t, "error": str(e)})

    return {"status": "success", "count": len(results), "results": results}


def complete_task_api(task_name: str, actual_difficulty: int) -> Dict:
    """Mark a task as complete and return new achievements."""
    new_achievements = cognitive_state.complete_task(task_name, actual_difficulty)
    return {
        "status": "success",
        "task_name": task_name,
        "new_achievements": new_achievements,
        "cognitive_state": cognitive_state.get_state_summary(),
    }


def get_cognitive_stats() -> Dict:
    return {"status": "success", **cognitive_state.get_state_summary()}


def get_energy() -> Dict:
    return {"status": "success", **get_mental_energy()}
