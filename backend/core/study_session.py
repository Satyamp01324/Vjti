"""
Pipeline 3 — Study Session Monitoring & Recovery Engine
Tracks focus time, breaks, pauses per user. Feeds into Pipeline 1 & 2
for emotional-aware recovery suggestions.

Flow:
  Timer Start → Track Focus/Breaks → End Session → Fetch Emotional State
  → Gemini AI Recovery Plan → Store Everything in Supabase
"""

import datetime
import json
import os
import uuid
from typing import Dict, List, Optional

from google import genai

from core.supabase_client import supabase
from core.cognitive_scheduler import fetch_emotional_state_from_db, get_mental_energy

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyBW8s01msW2J7Zn_YgqZ-Dy9OPUvsaOgYY")
_gemini = genai.Client(api_key=GEMINI_API_KEY)

# In-memory store for active sessions (production would use Redis)
_active_sessions: Dict[str, Dict] = {}


# ─────────────────────────────────────────────
# SESSION LIFECYCLE
# ─────────────────────────────────────────────
def start_session(user_id: str, task_name: str = "Focus Session", duration_minutes: int = 90) -> Dict:
    """Start a new study session, record emotional state at start."""
    session_id = str(uuid.uuid4())
    now = datetime.datetime.utcnow()
    emotional_state = fetch_emotional_state_from_db()
    energy = get_mental_energy(emotional_state)

    session = {
        "id": session_id,
        "user_id": user_id,
        "task_name": task_name,
        "planned_duration": duration_minutes,
        "started_at": now.isoformat(),
        "status": "active",  # active, paused, break, completed, abandoned
        "focus_seconds": 0,
        "break_seconds": 0,
        "pause_count": 0,
        "breaks": [],  # [{start, end, duration, type}]
        "pauses": [],  # [{start, end, duration}]
        "last_action_at": now.isoformat(),
        "last_action": "start",
        "emotional_state_at_start": {
            "depression": emotional_state.get("depression_level"),
            "anxiety": emotional_state.get("anxiety_level"),
            "stress": emotional_state.get("stress_level"),
            "tone": emotional_state.get("tone"),
            "energy_score": emotional_state.get("energy_score"),
        },
        "energy_at_start": energy.get("energy_level"),
    }

    _active_sessions[session_id] = session

    # Save to Supabase
    try:
        supabase.table("study_sessions").insert({
            "id": session_id,
            "user_id": user_id,
            "task_name": task_name,
            "planned_duration": duration_minutes,
            "started_at": now.isoformat(),
            "status": "active",
            "focus_seconds": 0,
            "break_seconds": 0,
            "pause_count": 0,
            "breaks_log": json.dumps([]),
            "emotional_start": json.dumps(session["emotional_state_at_start"]),
            "energy_at_start": energy.get("energy_level"),
        }).execute()
    except Exception as e:
        print(f"[study] DB insert error: {e}")

    return {
        "status": "success",
        "session_id": session_id,
        "task_name": task_name,
        "started_at": now.isoformat(),
        "emotional_state": session["emotional_state_at_start"],
        "energy_level": energy.get("energy_level"),
        "recommendation": energy.get("recommendation"),
    }


def pause_session(session_id: str) -> Dict:
    """Pause the timer — tracks pause count and duration."""
    session = _active_sessions.get(session_id)
    if not session:
        return {"status": "error", "error": "Session not found"}
    if session["status"] != "active":
        return {"status": "error", "error": f"Session is {session['status']}, cannot pause"}

    now = datetime.datetime.utcnow()
    last = datetime.datetime.fromisoformat(session["last_action_at"])
    focus_delta = (now - last).total_seconds()

    session["focus_seconds"] += focus_delta
    session["pause_count"] += 1
    session["pauses"].append({"start": now.isoformat(), "end": None, "duration": 0})
    session["status"] = "paused"
    session["last_action_at"] = now.isoformat()
    session["last_action"] = "pause"

    _sync_session_to_db(session)

    return {
        "status": "success",
        "session_status": "paused",
        "focus_seconds": int(session["focus_seconds"]),
        "pause_count": session["pause_count"],
    }


def resume_session(session_id: str) -> Dict:
    """Resume from pause."""
    session = _active_sessions.get(session_id)
    if not session:
        return {"status": "error", "error": "Session not found"}
    if session["status"] != "paused":
        return {"status": "error", "error": f"Session is {session['status']}, cannot resume"}

    now = datetime.datetime.utcnow()
    last = datetime.datetime.fromisoformat(session["last_action_at"])
    pause_duration = (now - last).total_seconds()

    # Close the pause record
    if session["pauses"] and session["pauses"][-1]["end"] is None:
        session["pauses"][-1]["end"] = now.isoformat()
        session["pauses"][-1]["duration"] = pause_duration

    session["status"] = "active"
    session["last_action_at"] = now.isoformat()
    session["last_action"] = "resume"

    _sync_session_to_db(session)

    return {
        "status": "success",
        "session_status": "active",
        "pause_duration": int(pause_duration),
        "total_pause_count": session["pause_count"],
    }


def start_break(session_id: str, break_type: str = "short", custom_duration_seconds: int = 0) -> Dict:
    """Start a break — tracks break data. Types: short (5min), long (15min), micro (2min), custom."""
    session = _active_sessions.get(session_id)
    if not session:
        return {"status": "error", "error": "Session not found"}
    if session["status"] not in ("active",):
        return {"status": "error", "error": f"Session is {session['status']}, cannot start break"}

    now = datetime.datetime.utcnow()
    last = datetime.datetime.fromisoformat(session["last_action_at"])
    focus_delta = (now - last).total_seconds()

    session["focus_seconds"] += focus_delta
    durations = {"short": 300, "long": 900, "micro": 120}
    suggested_duration = custom_duration_seconds if custom_duration_seconds > 0 else durations.get(break_type, 300)
    actual_type = "custom" if custom_duration_seconds > 0 else break_type

    session["breaks"].append({
        "start": now.isoformat(),
        "end": None,
        "duration": 0,
        "type": actual_type,
        "suggested_duration": suggested_duration,
    })
    session["status"] = "break"
    session["last_action_at"] = now.isoformat()
    session["last_action"] = "break"

    _sync_session_to_db(session)

    return {
        "status": "success",
        "session_status": "break",
        "break_type": actual_type,
        "suggested_duration": suggested_duration,
        "breaks_taken": len(session["breaks"]),
        "focus_seconds_so_far": int(session["focus_seconds"]),
    }


def end_break(session_id: str) -> Dict:
    """End a break and resume focus."""
    session = _active_sessions.get(session_id)
    if not session:
        return {"status": "error", "error": "Session not found"}
    if session["status"] != "break":
        return {"status": "error", "error": f"Session is {session['status']}, not on break"}

    now = datetime.datetime.utcnow()
    last = datetime.datetime.fromisoformat(session["last_action_at"])
    break_duration = (now - last).total_seconds()

    session["break_seconds"] += break_duration
    if session["breaks"] and session["breaks"][-1]["end"] is None:
        session["breaks"][-1]["end"] = now.isoformat()
        session["breaks"][-1]["duration"] = break_duration

    session["status"] = "active"
    session["last_action_at"] = now.isoformat()
    session["last_action"] = "end_break"

    _sync_session_to_db(session)

    return {
        "status": "success",
        "session_status": "active",
        "break_duration": int(break_duration),
        "total_break_seconds": int(session["break_seconds"]),
    }


def end_session(session_id: str) -> Dict:
    """
    End the study session. Calculates all stats, fetches emotional state,
    generates AI recovery plan, stores everything.
    """
    session = _active_sessions.get(session_id)
    if not session:
        return {"status": "error", "error": "Session not found"}

    now = datetime.datetime.utcnow()
    last = datetime.datetime.fromisoformat(session["last_action_at"])

    # Accumulate final focus or break time
    if session["status"] == "active":
        session["focus_seconds"] += (now - last).total_seconds()
    elif session["status"] == "break":
        session["break_seconds"] += (now - last).total_seconds()
        if session["breaks"] and session["breaks"][-1]["end"] is None:
            session["breaks"][-1]["end"] = now.isoformat()
            session["breaks"][-1]["duration"] = (now - last).total_seconds()
    elif session["status"] == "paused":
        if session["pauses"] and session["pauses"][-1]["end"] is None:
            session["pauses"][-1]["end"] = now.isoformat()
            session["pauses"][-1]["duration"] = (now - last).total_seconds()

    started = datetime.datetime.fromisoformat(session["started_at"])
    total_duration = (now - started).total_seconds()

    # Fetch current emotional state (after study)
    emotional_state_after = fetch_emotional_state_from_db()
    energy_after = get_mental_energy(emotional_state_after)

    # Generate AI Recovery Plan
    recovery_plan = _generate_recovery_plan(session, emotional_state_after, energy_after)

    # Build final stats
    stats = {
        "total_duration_seconds": int(total_duration),
        "focus_seconds": int(session["focus_seconds"]),
        "break_seconds": int(session["break_seconds"]),
        "pause_count": session["pause_count"],
        "breaks_taken": len(session["breaks"]),
        "focus_percentage": round((session["focus_seconds"] / max(total_duration, 1)) * 100, 1),
        "avg_focus_block": int(session["focus_seconds"] / max(len(session["breaks"]) + 1, 1)),
        "avg_break_duration": int(session["break_seconds"] / max(len(session["breaks"]), 1)) if session["breaks"] else 0,
        "energy_before": session.get("energy_at_start", 5),
        "energy_after": energy_after.get("energy_level", 5),
        "energy_change": energy_after.get("energy_level", 5) - session.get("energy_at_start", 5),
    }

    session["status"] = "completed"
    session["ended_at"] = now.isoformat()
    session["stats"] = stats
    session["recovery_plan"] = recovery_plan
    session["emotional_state_at_end"] = {
        "depression": emotional_state_after.get("depression_level"),
        "anxiety": emotional_state_after.get("anxiety_level"),
        "stress": emotional_state_after.get("stress_level"),
        "tone": emotional_state_after.get("tone"),
        "energy_score": emotional_state_after.get("energy_score"),
    }

    # Save to Supabase
    try:
        supabase.table("study_sessions").update({
            "ended_at": now.isoformat(),
            "status": "completed",
            "focus_seconds": int(session["focus_seconds"]),
            "break_seconds": int(session["break_seconds"]),
            "pause_count": session["pause_count"],
            "breaks_log": json.dumps(session["breaks"]),
            "pauses_log": json.dumps(session["pauses"]),
            "stats": json.dumps(stats),
            "emotional_end": json.dumps(session["emotional_state_at_end"]),
            "energy_at_end": energy_after.get("energy_level"),
            "recovery_plan": json.dumps(recovery_plan),
        }).eq("id", session_id).execute()
    except Exception as e:
        print(f"[study] DB update error: {e}")

    # Remove from active
    _active_sessions.pop(session_id, None)

    return {
        "status": "success",
        "session_id": session_id,
        "stats": stats,
        "emotional_before": session["emotional_state_at_start"],
        "emotional_after": session["emotional_state_at_end"],
        "recovery_plan": recovery_plan,
    }


def get_session_status(session_id: str) -> Dict:
    """Get current session status and live stats."""
    session = _active_sessions.get(session_id)
    
    # If not in memory, try to fetch from DB and construct a session object
    if not session:
        try:
            resp = supabase.table("study_sessions").select("*").eq("id", session_id).execute()
            if resp.data:
                db_session = resp.data[0]
                # Convert DB session to the format expected by the logic below
                emotional_start = json.loads(db_session.get("emotional_start") or "{}")
                session = {
                    "id": db_session["id"],
                    "user_id": db_session["user_id"],
                    "task_name": db_session["task_name"],
                    "planned_duration": db_session.get("planned_duration", 90),
                    "started_at": db_session["started_at"],
                    "status": db_session["status"],
                    "focus_seconds": db_session.get("focus_seconds", 0),
                    "break_seconds": db_session.get("break_seconds", 0),
                    "pause_count": db_session.get("pause_count", 0),
                    "breaks": json.loads(db_session.get("breaks_log") or "[]"),
                    "pauses": json.loads(db_session.get("pauses_log") or "[]"),
                    "last_action_at": db_session.get("updated_at") or db_session["started_at"], # Fallback
                    "emotional_state_at_start": emotional_start,
                    "energy_at_start": db_session.get("energy_at_start"),
                }
                
                # IMPORTANT: If active/break, we need to know the REAL last action time to calculate delta.
                # The DB 'updated_at' might be stale if the server restarted.
                # However, for a restored session, we might just have to trust the stored seconds 
                # OR if we assume the server was running, we'd use last_action_at. 
                # If the server crashed/restarted, 'active' time might be lost or overstated.
                # For now, let's assume 'updated_at' is the last checkpoint.
                # BUT 'updated_at' is generic. We need 'last_action_at' logic.
                # We'll rely on the client or just return what we have, 
                # but if it's 'active', we add (now - updated_at).
                
            else:
                 return {"status": "error", "error": "Session not found"}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    # Logic to calculate live stats (shared for memory & DB)
    now = datetime.datetime.utcnow()
    # Parse last_action_at (handle both string formats if needed, usually ISO)
    try:
        last = datetime.datetime.fromisoformat(session["last_action_at"].replace("Z", "+00:00"))
    except:
        last = now # Fallback

    elapsed = (now - last).total_seconds()

    live_focus = session["focus_seconds"]
    live_break = session["break_seconds"]
    
    # Only add elapsed if the status implies time is passing
    if session["status"] == "active":
        live_focus += elapsed
    elif session["status"] == "break":
        live_break += elapsed

    # Total duration since start
    try:
        started = datetime.datetime.fromisoformat(session["started_at"].replace("Z", "+00:00"))
        total = (now - started).total_seconds()
    except:
        total = live_focus + live_break # Fallback

    return {
        "status": "success",
        "session": {
            "id": session["id"],
            "session_status": session["status"],
            "task_name": session["task_name"],
            "planned_duration": session.get("planned_duration", 90),
            "focus_seconds": int(live_focus),
            "break_seconds": int(live_break),
            "total_seconds": int(total),
            "pause_count": session["pause_count"],
            "breaks_taken": len(session["breaks"]),
            "focus_percentage": round((live_focus / max(total, 1)) * 100, 1),
            "emotional_state": session.get("emotional_state_at_start", {}),
            "energy_at_start": session.get("energy_at_start"),
        },
    }


# ─────────────────────────────────────────────
# STATS & ANALYTICS
# ─────────────────────────────────────────────
def get_today_stats(user_id: str) -> Dict:
    """Get today's study statistics for a user."""
    today = datetime.date.today().isoformat()
    try:
        resp = (
            supabase.table("study_sessions")
            .select("*")
            .eq("user_id", user_id)
            .gte("started_at", today)
            .order("started_at", desc=True)
            .execute()
        )
        sessions = resp.data or []
    except Exception as e:
        print(f"[study] Stats error: {e}")
        sessions = []

    total_focus = sum(s.get("focus_seconds", 0) or 0 for s in sessions)
    total_breaks = sum(s.get("break_seconds", 0) or 0 for s in sessions)
    total_pauses = sum(s.get("pause_count", 0) or 0 for s in sessions)
    completed = [s for s in sessions if s.get("status") == "completed"]

    return {
        "status": "success",
        "date": today,
        "session_count": len(sessions),
        "completed_sessions": len(completed),
        "total_focus_seconds": total_focus,
        "total_break_seconds": total_breaks,
        "total_pause_count": total_pauses,
        "focus_hours": round(total_focus / 3600, 2),
        "avg_focus_per_session": int(total_focus / max(len(completed), 1)),
        "sessions": [
            {
                "id": s["id"],
                "task_name": s.get("task_name"),
                "started_at": s.get("started_at"),
                "status": s.get("status"),
                "focus_seconds": s.get("focus_seconds", 0),
                "break_seconds": s.get("break_seconds", 0),
                "pause_count": s.get("pause_count", 0),
                "energy_at_start": s.get("energy_at_start"),
                "energy_at_end": s.get("energy_at_end"),
            }
            for s in sessions
        ],
    }


def get_weekly_stats(user_id: str) -> Dict:
    """Get weekly study analysis with daily breakdown."""
    week_ago = (datetime.date.today() - datetime.timedelta(days=7)).isoformat()
    try:
        resp = (
            supabase.table("study_sessions")
            .select("*")
            .eq("user_id", user_id)
            .gte("started_at", week_ago)
            .eq("status", "completed")
            .order("started_at")
            .execute()
        )
        sessions = resp.data or []
    except Exception as e:
        print(f"[study] Weekly stats error: {e}")
        sessions = []

    # Group by day
    daily = {}
    for s in sessions:
        day = s.get("started_at", "")[:10]
        if day not in daily:
            daily[day] = {"focus": 0, "breaks": 0, "sessions": 0, "pauses": 0, "energy_avg": []}
        daily[day]["focus"] += s.get("focus_seconds", 0) or 0
        daily[day]["breaks"] += s.get("break_seconds", 0) or 0
        daily[day]["sessions"] += 1
        daily[day]["pauses"] += s.get("pause_count", 0) or 0
        if s.get("energy_at_start"):
            daily[day]["energy_avg"].append(s["energy_at_start"])

    daily_breakdown = []
    for day, d in sorted(daily.items()):
        avg_energy = round(sum(d["energy_avg"]) / max(len(d["energy_avg"]), 1), 1) if d["energy_avg"] else 0
        daily_breakdown.append({
            "date": day,
            "focus_minutes": round(d["focus"] / 60, 1),
            "break_minutes": round(d["breaks"] / 60, 1),
            "sessions": d["sessions"],
            "pauses": d["pauses"],
            "avg_energy": avg_energy,
        })

    total_focus = sum(d["focus"] for d in daily.values())
    total_sessions = sum(d["sessions"] for d in daily.values())

    return {
        "status": "success",
        "period": f"{week_ago} to {datetime.date.today().isoformat()}",
        "total_focus_hours": round(total_focus / 3600, 2),
        "total_sessions": total_sessions,
        "daily_breakdown": daily_breakdown,
        "best_day": max(daily_breakdown, key=lambda x: x["focus_minutes"])["date"] if daily_breakdown else None,
        "avg_daily_focus_minutes": round(total_focus / 60 / max(len(daily), 1), 1),
    }


# ─────────────────────────────────────────────
# AI RECOVERY ENGINE (Pipeline 1+2+3 bridge)
# ─────────────────────────────────────────────
def _generate_recovery_plan(session: Dict, emotional_state: Dict, energy: Dict) -> Dict:
    """Generate an AI recovery plan based on session data + emotional state."""
    focus_mins = int(session["focus_seconds"] / 60)
    break_mins = int(session["break_seconds"] / 60)
    pause_count = session["pause_count"]
    breaks_taken = len(session["breaks"])

    prompt = f"""You are a cognitive recovery expert. Based on this study session data AND the user's emotional state, create a personalized recovery plan.

STUDY SESSION DATA:
- Task: {session['task_name']}
- Focus Time: {focus_mins} minutes
- Break Time: {break_mins} minutes
- Pauses (interruptions): {pause_count}
- Breaks Taken: {breaks_taken}
- Energy at Start: {session.get('energy_at_start', 'unknown')}/10
- Energy Now: {energy.get('energy_level', 'unknown')}/10

EMOTIONAL STATE (from mental health analysis):
- Depression: {emotional_state.get('depression_level', 'unknown')} (score: {emotional_state.get('depression_score', 0):.2f})
- Anxiety: {emotional_state.get('anxiety_level', 'unknown')} (score: {emotional_state.get('anxiety_score', 0):.2f})
- Stress: {emotional_state.get('stress_level', 'unknown')} (score: {emotional_state.get('stress_score', 0):.2f})
- Tone: {emotional_state.get('tone', 'neutral')}
- Current Energy Score: {emotional_state.get('energy_score', 70)}/100

RECOVERY RULES:
- High focus + high stress → longer recovery with calming activities
- Many pauses → suggest environment changes or shorter focus blocks
- Low energy at end → suggest physical recovery (walk, stretch)
- High depression → gentle, self-compassionate recovery activities
- High anxiety → grounding exercises, breathing techniques

Respond ONLY in JSON (no markdown):
{{
  "recovery_score": <0-100 how much recovery is needed>,
  "urgency": "<low|medium|high|critical>",
  "summary": "<1 sentence summary>",
  "activities": [
    {{"name": "<activity>", "duration_minutes": <int>, "impact": "<high|medium|low>", "category": "<physical|mental|breathing|social|creative>", "description": "<brief>"}},
    ...max 4 activities
  ],
  "next_session_advice": "<when and how to approach next focus session>",
  "emotional_insight": "<insight connecting emotional state to study performance>"
}}"""

    try:
        resp = _gemini.models.generate_content(model="gemini-2.0-flash", contents=prompt)
        text = resp.text.strip()
        if text.startswith("```"):
            text = text.split("```json")[-1].split("```")[0].strip() if "```json" in text else text.split("```")[1].split("```")[0].strip()
        return json.loads(text)
    except Exception as e:
        print(f"[study] Recovery plan AI error: {e}")
        # Fallback
        urgency = "high" if focus_mins > 90 or pause_count > 5 else "medium" if focus_mins > 45 else "low"
        return {
            "recovery_score": min(100, focus_mins + pause_count * 5),
            "urgency": urgency,
            "summary": f"After {focus_mins}min of focus with {pause_count} interruptions, recovery is recommended.",
            "activities": [
                {"name": "Box Breathing", "duration_minutes": 5, "impact": "high", "category": "breathing", "description": "4-4-4-4 breathing pattern to calm the nervous system"},
                {"name": "Light Stretching", "duration_minutes": 10, "impact": "medium", "category": "physical", "description": "Gentle full-body stretches to release tension"},
                {"name": "Mindful Walk", "duration_minutes": 15, "impact": "high", "category": "physical", "description": "Short walk focusing on surrounding sounds and sensations"},
            ],
            "next_session_advice": f"Wait at least {max(15, focus_mins // 3)} minutes before next session.",
            "emotional_insight": "Consider your emotional state when planning your next focus block.",
        }


def get_recovery_plan(user_id: str) -> Dict:
    """Get a recovery plan based on current emotional state + recent sessions."""
    emotional_state = fetch_emotional_state_from_db()
    energy = get_mental_energy(emotional_state)

    # Build a mock session from recent data
    today = datetime.date.today().isoformat()
    try:
        resp = (
            supabase.table("study_sessions")
            .select("*")
            .eq("user_id", user_id)
            .gte("started_at", today)
            .order("started_at", desc=True)
            .limit(1)
            .execute()
        )
        last_session = resp.data[0] if resp.data else None
    except Exception:
        last_session = None

    if last_session:
        session_data = {
            "task_name": last_session.get("task_name", "Recent session"),
            "focus_seconds": last_session.get("focus_seconds", 0) or 0,
            "break_seconds": last_session.get("break_seconds", 0) or 0,
            "pause_count": last_session.get("pause_count", 0) or 0,
            "breaks": json.loads(last_session.get("breaks_log", "[]") or "[]"),
            "energy_at_start": last_session.get("energy_at_start", 5),
        }
    else:
        session_data = {
            "task_name": "No recent session",
            "focus_seconds": 0, "break_seconds": 0, "pause_count": 0,
            "breaks": [], "energy_at_start": 5,
        }

    plan = _generate_recovery_plan(session_data, emotional_state, energy)
    return {
        "status": "success",
        "emotional_state": {
            "depression": emotional_state.get("depression_level"),
            "anxiety": emotional_state.get("anxiety_level"),
            "stress": emotional_state.get("stress_level"),
            "tone": emotional_state.get("tone"),
            "energy_score": emotional_state.get("energy_score"),
        },
        "current_energy": energy.get("energy_level"),
        "recovery_plan": plan,
    }


# ─────────────────────────────────────────────
# HELPER
# ─────────────────────────────────────────────
def _sync_session_to_db(session: Dict):
    """Sync active session state to Supabase."""
    try:
        supabase.table("study_sessions").update({
            "status": session["status"],
            "focus_seconds": int(session["focus_seconds"]),
            "break_seconds": int(session["break_seconds"]),
            "pause_count": session["pause_count"],
            "breaks_log": json.dumps(session["breaks"]),
            "pauses_log": json.dumps(session.get("pauses", [])),
        }).eq("id", session["id"]).execute()
    except Exception as e:
        print(f"[study] DB sync error: {e}")


def get_current_session(user_id: str) -> Dict:
    """Check if the user has an active/paused/break session and return it."""
    # 1. Check in-memory first
    for sess in _active_sessions.values():
        if sess["user_id"] == user_id and sess["status"] in ("active", "paused", "break"):
            return get_session_status(sess["id"])

    # 2. Check DB
    try:
        resp = (
            supabase.table("study_sessions")
            .select("*")
            .eq("user_id", user_id)
            .in_("status", ["active", "paused", "break"])
            .order("started_at", desc=True)
            .limit(1)
            .execute()
        )
        if resp.data:
            # Rehydrate into memory if needed
            session_data = resp.data[0]
            session_id = session_data["id"]
            
            # Use get_session_status logic to calculate live times
            # But we need basic rehydration logic here or rely on get_session_status to handle DB fallback
            # get_session_status handles DB fallback!
            return get_session_status(session_id)
            
    except Exception as e:
        print(f"[study] get_current_session error: {e}")

    return {"status": "success", "session": None}
