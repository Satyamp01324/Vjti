-- =============================================================================
-- MASTER SUPABASE COMPLETE DATABASE SCHEMA
-- Execute this script in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 0. TRIGGER FUNCTIONS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.spoonsense_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. STORAGE BUCKET for audio files (mp3, wav, webm)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read access for audio files" ON storage.objects;
CREATE POLICY "Public read access for audio files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio-files');

DROP POLICY IF EXISTS "Allow audio upload" ON storage.objects;
CREATE POLICY "Allow audio upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audio-files');

DROP POLICY IF EXISTS "Allow audio delete" ON storage.objects;
CREATE POLICY "Allow audio delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'audio-files');

-- =============================================================================
-- 2. USERS PROFILE TABLE (Mirrors Supabase auth.users)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.users_profile (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on users_profile" ON public.users_profile;
CREATE POLICY "Allow all on users_profile"
  ON public.users_profile FOR ALL
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS set_users_profile_updated_at ON public.users_profile;
CREATE TRIGGER set_users_profile_updated_at
  BEFORE UPDATE ON public.users_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- 3. ANALYSIS SESSIONS (Text & Voice Analysis Pipeline)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  
  -- Input info
  input_type TEXT NOT NULL CHECK (input_type IN ('text', 'voice')),
  input_text TEXT,
  
  -- Transcription data (voice)
  detected_language TEXT,
  language_name TEXT,
  transcription_method TEXT,
  
  -- Audio file reference
  audio_file_url TEXT,
  audio_file_name TEXT,
  audio_file_size INTEGER,
  audio_content_type TEXT,
  
  -- Text analysis scores (0.0 to 1.0)
  depression_score REAL,
  anxiety_score REAL,
  stress_score REAL,
  analysis_source TEXT,
  
  -- Classified levels
  stress_level TEXT CHECK (stress_level IN ('high', 'medium', 'low')),
  anxiety_level TEXT CHECK (anxiety_level IN ('high', 'medium', 'low')),
  depression_level TEXT CHECK (depression_level IN ('high', 'medium', 'low')),
  tone TEXT CHECK (tone IN ('positive', 'neutral', 'negative')),
  
  -- Energy flow data
  base_energy INTEGER DEFAULT 70,
  energy_score INTEGER,
  energy_category TEXT CHECK (energy_category IN ('high_energy', 'medium_energy', 'low_energy')),
  recommended_task_type TEXT CHECK (recommended_task_type IN ('heavy', 'medium', 'light')),
  task_description TEXT,
  task_suggestions JSONB,
  
  -- Impact breakdown
  stress_impact INTEGER,
  anxiety_impact INTEGER,
  depression_impact INTEGER,
  tone_impact INTEGER,
  total_impact INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON public.analysis_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_input_type ON public.analysis_sessions(input_type);
CREATE INDEX IF NOT EXISTS idx_sessions_energy_category ON public.analysis_sessions(energy_category);

ALTER TABLE public.analysis_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on analysis_sessions" ON public.analysis_sessions;
CREATE POLICY "Allow all on analysis_sessions"
  ON public.analysis_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS set_sessions_updated_at ON public.analysis_sessions;
CREATE TRIGGER set_sessions_updated_at
  BEFORE UPDATE ON public.analysis_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- 4. ENERGY HISTORY
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.energy_history (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES public.analysis_sessions(id) ON DELETE CASCADE,
  energy_score INTEGER NOT NULL,
  energy_category TEXT,
  stress_level TEXT,
  anxiety_level TEXT,
  depression_level TEXT,
  tone TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_energy_recorded ON public.energy_history(recorded_at DESC);

ALTER TABLE public.energy_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on energy_history" ON public.energy_history;
CREATE POLICY "Allow all on energy_history"
  ON public.energy_history FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 5. STUDY SESSIONS (Deep Work & Cognitive Tracking)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  task_name TEXT DEFAULT 'Focus Session',
  planned_duration INTEGER DEFAULT 90,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'break', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  focus_seconds INTEGER DEFAULT 0,
  break_seconds INTEGER DEFAULT 0,
  pause_count INTEGER DEFAULT 0,

  breaks_log JSONB DEFAULT '[]',
  pauses_log JSONB DEFAULT '[]',
  stats JSONB,

  emotional_start JSONB,
  emotional_end JSONB,
  energy_at_start INTEGER,
  energy_at_end INTEGER,

  recovery_plan JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_user ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_started ON public.study_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_status ON public.study_sessions(status);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on study_sessions" ON public.study_sessions;
CREATE POLICY "Allow all on study_sessions"
  ON public.study_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

DROP TRIGGER IF EXISTS set_study_updated_at ON public.study_sessions;
CREATE TRIGGER set_study_updated_at
  BEFORE UPDATE ON public.study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- =============================================================================
-- 6. SPOONSENSE SCHEDULING TABLES
-- =============================================================================

-- 6.1 Timetable Blocks
CREATE TABLE IF NOT EXISTS public.timetable_blocks (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT        NOT NULL,
    weekday     INTEGER     NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    start_time  TIME        NOT NULL,
    end_time    TIME        NOT NULL,
    title       TEXT        DEFAULT '',
    source      TEXT        DEFAULT 'manual' CHECK (source IN ('ics', 'photo', 'manual')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT timetable_blocks_valid_time_range CHECK (end_time > start_time)
);
CREATE INDEX IF NOT EXISTS idx_timetable_blocks_user_weekday ON public.timetable_blocks (user_id, weekday);
ALTER TABLE public.timetable_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS timetable_blocks_dev_all ON public.timetable_blocks;
CREATE POLICY timetable_blocks_dev_all ON public.timetable_blocks FOR ALL USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS trg_timetable_blocks_updated_at ON public.timetable_blocks;
CREATE TRIGGER trg_timetable_blocks_updated_at BEFORE UPDATE ON public.timetable_blocks FOR EACH ROW EXECUTE FUNCTION public.spoonsense_set_updated_at();

-- 6.2 Commute Profiles
CREATE TABLE IF NOT EXISTS public.commute_profiles (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           TEXT        NOT NULL UNIQUE,
    minutes_each_way  INTEGER     NOT NULL DEFAULT 30 CHECK (minutes_each_way >= 0 AND minutes_each_way <= 480),
    mode              TEXT        NOT NULL DEFAULT 'seated' CHECK (mode IN ('crowded', 'seated', 'walk')),
    days_applicable   JSONB       NOT NULL DEFAULT '[0,1,2,3,4]'::jsonb,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.commute_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS commute_profiles_dev_all ON public.commute_profiles;
CREATE POLICY commute_profiles_dev_all ON public.commute_profiles FOR ALL USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS trg_commute_profiles_updated_at ON public.commute_profiles;
CREATE TRIGGER trg_commute_profiles_updated_at BEFORE UPDATE ON public.commute_profiles FOR EACH ROW EXECUTE FUNCTION public.spoonsense_set_updated_at();

-- 6.3 Day Overrides
CREATE TABLE IF NOT EXISTS public.day_overrides (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        TEXT        NOT NULL,
    date           DATE        NOT NULL,
    override_type  TEXT        NOT NULL CHECK (override_type IN ('holiday', 'wfh', 'exam', 'custom_commute')),
    value          JSONB       DEFAULT '{}'::jsonb,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT day_overrides_one_per_user_date UNIQUE (user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_day_overrides_user_date ON public.day_overrides (user_id, date);
ALTER TABLE public.day_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS day_overrides_dev_all ON public.day_overrides;
CREATE POLICY day_overrides_dev_all ON public.day_overrides FOR ALL USING (true) WITH CHECK (true);

-- 6.4 Tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           TEXT        NOT NULL,
    title             TEXT        NOT NULL,
    description       TEXT        DEFAULT '',
    task_type         TEXT        NOT NULL DEFAULT 'other' CHECK (task_type IN ('reading', 'writing', 'problem_solving', 'admin', 'other')),
    due_date          DATE,
    is_fixed_deadline BOOLEAN     DEFAULT FALSE,
    estimated_minutes INTEGER     DEFAULT 20 CHECK (estimated_minutes > 0 AND estimated_minutes <= 720),
    difficulty        TEXT        DEFAULT 'normal' CHECK (difficulty IN ('easy', 'normal', 'hard')),
    spoon_cost        REAL,
    state             TEXT        DEFAULT 'planned' CHECK (state IN ('planned', 'in_progress', 'shrunk', 'moved', 'done', 'parked')),
    planned_date      DATE,
    planned_slot      TEXT,
    moves_count       INTEGER     DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_user_state ON public.tasks (user_id, state);
CREATE INDEX IF NOT EXISTS idx_tasks_user_planned_date ON public.tasks (user_id, planned_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date ON public.tasks (user_id, due_date);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tasks_dev_all ON public.tasks;
CREATE POLICY tasks_dev_all ON public.tasks FOR ALL USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.spoonsense_set_updated_at();

-- 6.5 Task Steps
CREATE TABLE IF NOT EXISTS public.task_steps (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID        NOT NULL REFERENCES public.tasks (id) ON DELETE CASCADE,
    position    INTEGER     NOT NULL,
    text        TEXT        NOT NULL,
    minutes     INTEGER     DEFAULT 2,
    spoon_cost  REAL        DEFAULT 0.2,
    why_text    TEXT        DEFAULT '',
    state       TEXT        DEFAULT 'todo' CHECK (state IN ('todo', 'done')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_task_steps_task_id ON public.task_steps (task_id);
ALTER TABLE public.task_steps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS task_steps_dev_all ON public.task_steps;
CREATE POLICY task_steps_dev_all ON public.task_steps FOR ALL USING (true) WITH CHECK (true);

-- 6.6 Day Snapshots
CREATE TABLE IF NOT EXISTS public.day_snapshots (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT        NOT NULL,
    date            DATE        NOT NULL,
    prior_spoons    REAL,
    live_spoons     REAL,
    manual_override REAL,
    factors         JSONB       NOT NULL DEFAULT '[]'::jsonb,
    confidence      REAL        DEFAULT 0.4,
    weather         TEXT        DEFAULT 'partly_cloudy' CHECK (weather IN ('sunny', 'partly_cloudy', 'cloudy', 'stormy')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT day_snapshots_one_per_user_date UNIQUE (user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_day_snapshots_user_date ON public.day_snapshots (user_id, date);
ALTER TABLE public.day_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS day_snapshots_dev_all ON public.day_snapshots;
CREATE POLICY day_snapshots_dev_all ON public.day_snapshots FOR ALL USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS trg_day_snapshots_updated_at ON public.day_snapshots;
CREATE TRIGGER trg_day_snapshots_updated_at BEFORE UPDATE ON public.day_snapshots FOR EACH ROW EXECUTE FUNCTION public.spoonsense_set_updated_at();

-- 6.7 Game Results
CREATE TABLE IF NOT EXISTS public.game_results (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      TEXT        NOT NULL,
    date         DATE        NOT NULL,
    time_of_day  TEXT        DEFAULT 'morning' CHECK (time_of_day IN ('morning', 'afternoon', 'evening')),
    game         TEXT        NOT NULL CHECK (game IN ('pulse', 'switch', 'pop')),
    summary      JSONB       NOT NULL DEFAULT '{}'::jsonb,
    valid        BOOLEAN     DEFAULT TRUE,
    skipped      BOOLEAN     DEFAULT FALSE,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_game_results_user_date ON public.game_results (user_id, date);
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS game_results_dev_all ON public.game_results;
CREATE POLICY game_results_dev_all ON public.game_results FOR ALL USING (true) WITH CHECK (true);

-- 6.8 Evening Labels
CREATE TABLE IF NOT EXISTS public.evening_labels (
    id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id  TEXT        NOT NULL,
    date     DATE        NOT NULL,
    value    INTEGER     CHECK (value BETWEEN 0 AND 4),
    skipped  BOOLEAN     DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT evening_labels_one_per_user_date UNIQUE (user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_evening_labels_user_date ON public.evening_labels (user_id, date);
ALTER TABLE public.evening_labels ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS evening_labels_dev_all ON public.evening_labels;
CREATE POLICY evening_labels_dev_all ON public.evening_labels FOR ALL USING (true) WITH CHECK (true);

-- 6.9 Garden State
CREATE TABLE IF NOT EXISTS public.garden_state (
    user_id          TEXT        PRIMARY KEY,
    days_tended      INTEGER     DEFAULT 0,
    xp               INTEGER     DEFAULT 0,
    items            JSONB       DEFAULT '[]'::jsonb,
    last_checkin_date DATE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.garden_state ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS garden_state_dev_all ON public.garden_state;
CREATE POLICY garden_state_dev_all ON public.garden_state FOR ALL USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS trg_garden_state_updated_at ON public.garden_state;
CREATE TRIGGER trg_garden_state_updated_at BEFORE UPDATE ON public.garden_state FOR EACH ROW EXECUTE FUNCTION public.spoonsense_set_updated_at();

-- 6.10 Dopamine Items
CREATE TABLE IF NOT EXISTS public.dopamine_items (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    TEXT        NOT NULL,
    label      TEXT        NOT NULL,
    spoon_gain REAL        DEFAULT 0.3 CHECK (spoon_gain >= 0 AND spoon_gain <= 2.0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dopamine_items_user ON public.dopamine_items (user_id);
ALTER TABLE public.dopamine_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS dopamine_items_dev_all ON public.dopamine_items;
CREATE POLICY dopamine_items_dev_all ON public.dopamine_items FOR ALL USING (true) WITH CHECK (true);

-- 6.11 Items Table (Utility / Verification)
CREATE TABLE IF NOT EXISTS public.items (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS items_dev_all ON public.items;
CREATE POLICY items_dev_all ON public.items FOR ALL USING (true) WITH CHECK (true);

-- =============================================================================
-- 7. VIEWS FOR DASHBOARDS
-- =============================================================================
DROP VIEW IF EXISTS public.latest_sessions;
DROP VIEW IF EXISTS public.daily_energy_avg;

CREATE OR REPLACE VIEW public.latest_sessions
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  input_type,
  LEFT(input_text, 100) AS text_preview,
  depression_score,
  anxiety_score,
  stress_score,
  energy_score,
  energy_category,
  recommended_task_type,
  task_description,
  created_at
FROM public.analysis_sessions
ORDER BY created_at DESC
LIMIT 50;

CREATE OR REPLACE VIEW public.daily_energy_avg
WITH (security_invoker = true)
AS
SELECT
  DATE(recorded_at) AS date,
  ROUND(AVG(energy_score)) AS avg_energy,
  COUNT(*) AS session_count,
  MODE() WITHIN GROUP (ORDER BY energy_category) AS dominant_category
FROM public.energy_history
GROUP BY DATE(recorded_at)
ORDER BY date DESC;

