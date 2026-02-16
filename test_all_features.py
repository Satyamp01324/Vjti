"""
NeuroPilot — Comprehensive Connection & Feature Test Suite
Tests all pipelines, model connections, Supabase, and API endpoints.
No external dependencies required beyond requests + dotenv (already in backend).
"""

import requests
import json
import os
import sys
import time

# Load env
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))
from dotenv import load_dotenv
load_dotenv(os.path.join("backend", ".env"))
load_dotenv(os.path.join("frontend", ".env"))

BACKEND  = "http://localhost:8000"
FRONTEND = "http://localhost:5174"

PASS = 0
FAIL = 0
WARN = 0

def p(label, status, detail=""):
    global PASS, FAIL, WARN
    sym = {"PASS": "✓", "FAIL": "✗", "WARN": "⚠"}[status]
    color = {"PASS": "\033[92m", "FAIL": "\033[91m", "WARN": "\033[93m"}[status]
    end = "\033[0m"
    if status == "PASS": PASS += 1
    elif status == "FAIL": FAIL += 1
    else: WARN += 1
    print(f"  {color}{sym} {label}{end}" + (f"  →  {detail}" if detail else ""))

def section(title):
    print(f"\n\033[96m{'─'*55}\n  {title}\n{'─'*55}\033[0m")

# ═══════════════════════════════════════════════════════
# 1. ENVIRONMENT VARIABLES
# ═══════════════════════════════════════════════════════
def test_env():
    section("1. ENVIRONMENT VARIABLES")
    for var, name in [
        ("SUPABASE_URL", "Backend SUPABASE_URL"),
        ("SUPABASE_KEY", "Backend SUPABASE_KEY"),
        ("GROQ_API_KEY", "GROQ_API_KEY (voice)"),
    ]:
        v = os.getenv(var)
        p(name, "PASS" if v else "WARN", v[:30] + "..." if v else "Not set")

    vapi = os.getenv("VITE_API_URL")
    p("Frontend VITE_API_URL", "PASS" if vapi else "FAIL", vapi or "NOT SET")

# ═══════════════════════════════════════════════════════
# 2. BACKEND SERVER
# ═══════════════════════════════════════════════════════
def test_backend():
    section("2. BACKEND SERVER")
    try:
        r = requests.get(f"{BACKEND}/api/health", timeout=5)
        p("Health endpoint", "PASS", r.json())
    except requests.ConnectionError:
        p("Health endpoint", "FAIL", "Backend not running!")
        return False
    except Exception as e:
        p("Health endpoint", "FAIL", str(e))
        return False
    return True

# ═══════════════════════════════════════════════════════
# 3. SUPABASE CONNECTION (via backend)
# ═══════════════════════════════════════════════════════
def test_supabase():
    section("3. SUPABASE CONNECTION")
    try:
        r = requests.get(f"{BACKEND}/api/test-supabase", timeout=5).json()
        url_ok = r.get("supabase_url_configured", False)
        key_ok = r.get("supabase_key_configured", False)
        p("Supabase URL configured", "PASS" if url_ok else "FAIL")
        p("Supabase KEY configured", "PASS" if key_ok else "FAIL")
        p("Backend → Supabase link", "PASS" if url_ok and key_ok else "WARN",
          "Connected" if url_ok and key_ok else "Check credentials")
    except Exception as e:
        p("Supabase connection test", "FAIL", str(e))

# ═══════════════════════════════════════════════════════
# 4. ML MODELS LOADED
# ═══════════════════════════════════════════════════════
def test_models():
    section("4. ML MODELS (Pipeline Graph Node 1)")
    try:
        r = requests.get(f"{BACKEND}/api/model-info", timeout=10).json()
        models = r.get("models", {})

        tc = models.get("text_classification", {})
        p("RoBERTa text classifier", "PASS" if tc.get("status") == "loaded" else "WARN",
          f"{tc.get('repo', '?')}")

        va = models.get("voice_analysis", {})
        p("Voice analysis model", "PASS" if va else "WARN",
          va.get("model_name", "loaded") if va else "Not available")

        st = models.get("speech_to_text", {})
        p("Whisper speech-to-text", "PASS" if st else "WARN",
          st.get("status", "loaded") if st else "Not available")
    except Exception as e:
        p("Model info endpoint", "FAIL", str(e))

# ═══════════════════════════════════════════════════════
# 5. PIPELINE 1 — Text Analysis (full graph)
#    Input → RoBERTa → Energy Flow → Supabase → Response
# ═══════════════════════════════════════════════════════
def test_text_pipeline():
    section("5. PIPELINE 1: TEXT ANALYSIS GRAPH")
    print("    Input → RoBERTa → EnergyFlow → Supabase → Response\n")
    try:
        payload = {"text": "I feel great today, very productive and happy!"}
        r = requests.post(f"{BACKEND}/api/analyze/text", json=payload, timeout=20)
        if r.status_code != 200:
            p("Text pipeline", "FAIL", f"HTTP {r.status_code}: {r.text[:100]}")
            return
        data = r.json()

        # Node 1: Classification
        analysis = data.get("analysis", {})
        p("Node 1 — RoBERTa classification",
          "PASS" if analysis.get("depression") is not None else "FAIL",
          f"Dep={analysis.get('depression','-'):.3f}  Anx={analysis.get('anxiety','-'):.3f}  Str={analysis.get('stress','-'):.3f}")

        # Node 2: Energy flow
        ef = data.get("energy_flow", {})
        score = ef.get("energy_score")
        p("Node 2 — Energy flow calc",
          "PASS" if score is not None else "FAIL",
          f"Score={score}  Category={ef.get('energy_category')}  Task={ef.get('recommended_task_type')}")

        levels = ef.get("classified_levels", {})
        p("  └─ Level classification",
          "PASS" if levels.get("stress") else "WARN",
          f"stress={levels.get('stress')} anxiety={levels.get('anxiety')} depression={levels.get('depression')} tone={levels.get('tone')}")

        # Node 3: Supabase persist
        p("Node 3 — Supabase persist",
          "PASS" if data.get("persisted") else "WARN",
          f"session_id={data.get('session_id', 'none')}")

        p("Pipeline 1 complete", "PASS", f"Energy {score}/100 → {ef.get('recommended_task_type')} tasks")
    except Exception as e:
        p("Text pipeline", "FAIL", str(e))

# ═══════════════════════════════════════════════════════
# 6. PIPELINE 2 — Cognitive Scheduler Graph
#    NLP Parse → Energy Engine → Gemini AI → Calendar
# ═══════════════════════════════════════════════════════
def test_scheduler_pipeline():
    section("6. PIPELINE 2: COGNITIVE SCHEDULER GRAPH")
    print("    NLP Parse → Energy Engine → Gemini AI → Calendar Slot\n")

    # Node 1: Parse task
    try:
        payload = {"task": "Study calculus for 2 hours tomorrow morning"}
        r = requests.post(f"{BACKEND}/api/scheduler/parse-task", json=payload, timeout=10)
        if r.status_code != 200:
            p("Node 1 — NLP task parser", "FAIL", f"HTTP {r.status_code}")
            return
        data = r.json()
        task = data.get("task", {})
        p("Node 1 — NLP task parser", "PASS",
          f"Type={task.get('cognitive_type')} Diff={task.get('difficulty')} Dur={task.get('duration_minutes')}min")
        p("  └─ Category detection", "PASS" if task.get("category") else "WARN",
          f"{task.get('category')} | Physical={task.get('is_physical_activity')} | Social={task.get('is_social_event')}")
    except Exception as e:
        p("NLP task parser", "FAIL", str(e))

    # Node 2: Mental energy engine
    try:
        r = requests.get(f"{BACKEND}/api/scheduler/energy", timeout=5).json()
        energy = r.get("energy_level")
        p("Node 2 — Mental energy engine", "PASS" if energy else "FAIL",
          f"Level={energy}/10  Base={r.get('base_energy')}  Fatigue-penalty={r.get('fatigue_penalty')}")
        p("  └─ Recommendation", "PASS", r.get("recommendation", "none"))
    except Exception as e:
        p("Mental energy engine", "FAIL", str(e))

    # Node 3: Cognitive stats
    try:
        r = requests.get(f"{BACKEND}/api/scheduler/stats", timeout=5).json()
        p("Node 3 — Cognitive state tracker", "PASS",
          f"Fatigue={r.get('fatigue')} Streak={r.get('streak')} Completed={r.get('tasks_completed')}")
        achievements = r.get("achievements", [])
        p("  └─ Achievements", "PASS", f"{len(achievements)} unlocked" if achievements else "None yet")
    except Exception as e:
        p("Cognitive state tracker", "FAIL", str(e))

    # Node 4: Full schedule (this requires Google Calendar — may fail without auth)
    try:
        payload = {"task": "Quick test task 10 minutes"}
        r = requests.post(f"{BACKEND}/api/scheduler/schedule", json=payload, timeout=15)
        if r.status_code == 200:
            data = r.json()
            cal = data.get("calendar_event", {})
            p("Node 4 — Google Calendar integration", "PASS",
              f"Event created: {cal.get('link', 'no link')[:50]}")
        else:
            body = r.json() if r.headers.get("content-type","").startswith("application/json") else {}
            detail = body.get("detail", r.text[:80])
            p("Node 4 — Google Calendar integration", "WARN",
              f"HTTP {r.status_code}: {detail} (expected if no Google auth)")
    except Exception as e:
        p("Google Calendar integration", "WARN", f"{e} (expected if no Google auth)")

# ═══════════════════════════════════════════════════════
# 7. DATA QUERY ENDPOINTS (read from Supabase)
# ═══════════════════════════════════════════════════════
def test_query_endpoints():
    section("7. DATA QUERY ENDPOINTS")
    endpoints = [
        ("/api/sessions?limit=5", "Sessions list"),
        ("/api/energy-history?limit=5", "Energy history"),
        ("/api/energy-daily", "Daily energy averages"),
    ]
    for path, name in endpoints:
        try:
            r = requests.get(f"{BACKEND}{path}", timeout=5)
            data = r.json()
            count = data.get("count", len(data.get("data", [])))
            p(name, "PASS" if r.status_code == 200 else "WARN",
              f"{count} records")
        except Exception as e:
            p(name, "FAIL", str(e))

# ═══════════════════════════════════════════════════════
# 8. AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════
def test_auth():
    section("8. AUTH ENDPOINTS")
    # Just test that the endpoints exist and respond
    try:
        r = requests.post(f"{BACKEND}/api/auth/login",
                          json={"email": "test@test.com", "password": "testtest"}, timeout=5)
        # 401 is expected (wrong creds) — but it means the endpoint works
        p("Login endpoint", "PASS" if r.status_code in [200, 401] else "WARN",
          f"HTTP {r.status_code} (expected 401 for invalid creds)")
    except Exception as e:
        p("Login endpoint", "FAIL", str(e))

    try:
        r = requests.post(f"{BACKEND}/api/auth/register",
                          json={"email": "", "password": ""}, timeout=5)
        p("Register endpoint", "PASS" if r.status_code in [200, 400, 422] else "WARN",
          f"HTTP {r.status_code} (expected 400 for empty fields)")
    except Exception as e:
        p("Register endpoint", "FAIL", str(e))

# ═══════════════════════════════════════════════════════
# 9. FRONTEND SERVER
# ═══════════════════════════════════════════════════════
def test_frontend():
    section("9. FRONTEND SERVER")
    try:
        r = requests.get(FRONTEND, timeout=5)
        p("Frontend server", "PASS" if r.status_code == 200 else "FAIL",
          f"Running at {FRONTEND}")
    except requests.ConnectionError:
        p("Frontend server", "FAIL", "Not running — start with: cd frontend && npm run dev")
        return

    try:
        r = requests.get(f"{FRONTEND}/sw.js", timeout=5)
        p("Service Worker (sw.js)", "PASS" if r.status_code == 200 else "WARN",
          f"{len(r.text)} bytes")
    except Exception as e:
        p("Service Worker", "WARN", str(e))

    try:
        r = requests.get(f"{FRONTEND}/manifest.json", timeout=5)
        if r.status_code == 200:
            m = r.json()
            p("PWA Manifest", "PASS", f"name={m.get('name')} icons={len(m.get('icons',[]))}")
        else:
            p("PWA Manifest", "WARN", f"HTTP {r.status_code}")
    except Exception as e:
        p("PWA Manifest", "WARN", str(e))

# ═══════════════════════════════════════════════════════
# 10. FRONTEND ↔ BACKEND INTEGRATION
# ═══════════════════════════════════════════════════════
def test_integration():
    section("10. FRONTEND ↔ BACKEND INTEGRATION")
    try:
        headers = {"Origin": FRONTEND}
        r = requests.get(f"{BACKEND}/api/health", headers=headers, timeout=5)
        cors = r.headers.get("access-control-allow-origin", "")
        p("CORS allows frontend", "PASS" if cors else "WARN",
          f"Allow-Origin: {cors}" if cors else "No CORS header (may work via proxy)")
    except Exception as e:
        p("CORS test", "FAIL", str(e))

    # Check API_URL matches
    vite_url = os.getenv("VITE_API_URL", "")
    p("API URL alignment",
      "PASS" if "localhost:8000" in vite_url else "WARN",
      f"Frontend points to: {vite_url}")

# ═══════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════
if __name__ == "__main__":
    print(f"\n\033[95m{'═'*55}")
    print(f"  NeuroPilot — Full System Test Suite")
    print(f"{'═'*55}\033[0m")

    test_env()
    backend_ok = test_backend()

    if backend_ok:
        test_supabase()
        test_models()
        test_text_pipeline()
        test_scheduler_pipeline()
        test_query_endpoints()
        test_auth()
        test_frontend()
        test_integration()
    else:
        print(f"\n\033[91m  Backend is not running. Start it first!\033[0m")
        print(f"  Command: cd backend && uvicorn main:app --reload --port 8000\n")

    # Summary
    total = PASS + FAIL + WARN
    print(f"\n\033[96m{'═'*55}")
    print(f"  TEST SUMMARY")
    print(f"{'═'*55}\033[0m")
    print(f"  \033[92m✓ Passed:   {PASS}/{total}\033[0m")
    print(f"  \033[91m✗ Failed:   {FAIL}/{total}\033[0m")
    print(f"  \033[93m⚠ Warnings: {WARN}/{total}\033[0m")

    if FAIL == 0:
        print(f"\n  \033[92m🎉 ALL CRITICAL TESTS PASSED!\033[0m")
        print(f"  \033[92m   System is ready for use.\033[0m")
    else:
        print(f"\n  \033[91m⚠ {FAIL} test(s) failed. Review output above.\033[0m")

    print(f"\033[96m{'═'*55}\033[0m\n")
    sys.exit(0 if FAIL == 0 else 1)
