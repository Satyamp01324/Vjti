# Pipeline 3: Study Session Monitoring & Recovery System

## Flow
```
DeepWorkMode Timer → Track Focus/Breaks/Pauses per user_id → Store in Supabase
                                    ↓
            Pipeline 1 (Emotional State from DB) + Pipeline 2 (Scheduler)
                                    ↓
            Recovery Suggestions (AI) → Visualizations (Before/After)
                                    ↓
            Per-Session Stats → Weekly Analysis → Recovery Cycle Insights
```

## Backend Changes

### 1. New Supabase Table: `study_sessions`
- id, user_id, started_at, ended_at, total_duration_seconds
- focus_time_seconds, break_time_seconds, pause_count
- breaks_taken (JSON array), session_status (active/completed/abandoned)
- emotional_state_at_start (JSON), emotional_state_at_end (JSON)
- energy_before, energy_after, recovery_plan (JSON)

### 2. New Backend Endpoints
- POST /api/study/start - Start a new study session
- POST /api/study/pause - Pause timer
- POST /api/study/resume - Resume timer
- POST /api/study/break - Start a break (tracks break data)
- POST /api/study/end - End session, calculate stats, get recovery
- GET  /api/study/session/:id - Get session details
- GET  /api/study/stats/today - Today's stats for user
- GET  /api/study/stats/weekly - Weekly analysis
- GET  /api/study/recovery-plan - AI recovery plan based on emotional state

### 3. Recovery Engine (uses Pipeline 1 + 2)
- Reads current emotional state from DB
- Calculates recovery needs based on session duration + emotional load
- Generates AI recovery plan via Gemini

## Frontend Changes

### 1. DeepWorkMode.jsx (Major Rewrite)
- Connect to backend for session tracking
- Track breaks, pauses, focus time
- Show real-time session stats (animated)
- Recovery button triggers AI suggestion
- GSAP + Framer Motion animations

### 2. RecoveryCycles.jsx (Major Rewrite)
- Fetch REAL data from DB (no more static data)
- Before/After recovery visualization
- Per-session breakdown
- Weekly analysis charts
- AI recovery plan from emotional state

### 3. CognitiveInsights.jsx (Enhancement)
- Connect to real DB data for energy timeline
- Real task distribution from study sessions
