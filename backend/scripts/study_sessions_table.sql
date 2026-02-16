-- ============================================================
-- Pipeline 3: Study Sessions Table & Policies (Idempotent Script)
-- Run this entire script in Supabase SQL Editor
-- ============================================================

-- 0. Ensure updated_at function exists (from previous schema)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Create Table (if not exists)
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  task_name TEXT DEFAULT 'Focus Session',
  planned_duration INTEGER DEFAULT 90,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'break', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,

  -- Time tracking
  focus_seconds INTEGER DEFAULT 0,
  break_seconds INTEGER DEFAULT 0,
  pause_count INTEGER DEFAULT 0,

  -- Detailed logs
  breaks_log JSONB DEFAULT '[]',
  pauses_log JSONB DEFAULT '[]',
  stats JSONB,

  -- Emotional integration
  emotional_start JSONB,
  emotional_end JSONB,
  energy_at_start INTEGER,
  energy_at_end INTEGER,

  -- AI Recovery Plan
  recovery_plan JSONB,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes (Uses IF NOT EXISTS where supported, otherwise safe to ignore errors or check)
CREATE INDEX IF NOT EXISTS idx_study_user ON study_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_study_started ON study_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_study_status ON study_sessions(status);

-- 3. Row Level Security (RLS)
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Allow all select on study_sessions" ON study_sessions;
DROP POLICY IF EXISTS "Allow all insert on study_sessions" ON study_sessions;
DROP POLICY IF EXISTS "Allow all update on study_sessions" ON study_sessions;
DROP POLICY IF EXISTS "Allow all delete on study_sessions" ON study_sessions;

-- Re-create policies
CREATE POLICY "Allow all select on study_sessions"
  ON study_sessions FOR SELECT USING (true);
CREATE POLICY "Allow all insert on study_sessions"
  ON study_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on study_sessions"
  ON study_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on study_sessions"
  ON study_sessions FOR DELETE USING (true);

-- 4. Triggers
DROP TRIGGER IF EXISTS set_study_updated_at ON study_sessions;

CREATE TRIGGER set_study_updated_at
  BEFORE UPDATE ON study_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA (Safe to run multiple times - just inserts new rows)
-- ============================================================

-- 1. A completed high-focus session from yesterday
INSERT INTO study_sessions (
    user_id, task_name, status, started_at, ended_at,
    focus_seconds, break_seconds, pause_count,
    energy_at_start, energy_at_end
) VALUES (
    'test-user', 'Deep Work: System Architecture', 'completed',
    NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '95 minutes',
    5100, 600, 1,
    75, 45
);

-- 2. A completed session from today (morning)
INSERT INTO study_sessions (
    user_id, task_name, status, started_at, ended_at,
    focus_seconds, break_seconds, pause_count,
    energy_at_start, energy_at_end
) VALUES (
    'test-user', 'Morning Algo Challenge', 'completed',
    NOW() - INTERVAL '5 hours', NOW() - INTERVAL '4 hours',
    3400, 200, 2,
    85, 70
);

-- 3. Another session from today (afternoon)
INSERT INTO study_sessions (
    user_id, task_name, status, started_at, ended_at,
    focus_seconds, break_seconds, pause_count,
    energy_at_start, energy_at_end
) VALUES (
    'test-user', 'React Component Refactoring', 'completed',
    NOW() - INTERVAL '2 hours', NOW() - INTERVAL '1 hour',
    3600, 0, 0,
    60, 50
);
