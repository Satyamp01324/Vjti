-- ============================================================
-- Supabase Complete Schema for Mental Health Analysis Pipeline
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ============================================================

-- ============================================================
-- 1. STORAGE BUCKET for audio files (mp3, wav, etc.)
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-files', 'audio-files', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to audio files
CREATE POLICY "Public read access for audio files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio-files');

-- Allow authenticated and anon insert
CREATE POLICY "Allow audio upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audio-files');

-- Allow delete
CREATE POLICY "Allow audio delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'audio-files');


-- ============================================================
-- 2. ANALYSIS SESSIONS - main table linking all data
-- ============================================================
CREATE TABLE IF NOT EXISTS analysis_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Input info
  input_type TEXT NOT NULL CHECK (input_type IN ('text', 'voice')),
  input_text TEXT,                          -- original or transcribed text
  
  -- Transcription data (for voice input)
  detected_language TEXT,
  language_name TEXT,
  transcription_method TEXT,               -- 'groq_whisper' or 'local_whisper'
  
  -- Audio file reference
  audio_file_url TEXT,                     -- Supabase Storage URL
  audio_file_name TEXT,
  audio_file_size INTEGER,
  audio_content_type TEXT,
  
  -- Text analysis results (Depression/Anxiety/Stress probabilities 0-1)
  depression_score REAL,
  anxiety_score REAL,
  stress_score REAL,
  analysis_source TEXT,                    -- 'local_model' or 'groq_fallback_language'
  
  -- Classified levels (high/medium/low)
  stress_level TEXT CHECK (stress_level IN ('high', 'medium', 'low')),
  anxiety_level TEXT CHECK (anxiety_level IN ('high', 'medium', 'low')),
  depression_level TEXT CHECK (depression_level IN ('high', 'medium', 'low')),
  tone TEXT CHECK (tone IN ('positive', 'neutral', 'negative')),
  
  -- Energy flow data
  base_energy INTEGER DEFAULT 70,
  energy_score INTEGER,                    -- final calculated energy (0-100)
  energy_category TEXT CHECK (energy_category IN ('high_energy', 'medium_energy', 'low_energy')),
  recommended_task_type TEXT CHECK (recommended_task_type IN ('heavy', 'medium', 'light')),
  task_description TEXT,
  task_suggestions JSONB,                  -- array of suggestion strings
  
  -- Impact breakdown
  stress_impact INTEGER,
  anxiety_impact INTEGER,
  depression_impact INTEGER,
  tone_impact INTEGER,
  total_impact INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON analysis_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_input_type ON analysis_sessions(input_type);
CREATE INDEX IF NOT EXISTS idx_sessions_energy_category ON analysis_sessions(energy_category);


-- ============================================================
-- 3. ENERGY HISTORY - track energy over time (for charts)
-- ============================================================
CREATE TABLE IF NOT EXISTS energy_history (
  id BIGSERIAL PRIMARY KEY,
  session_id UUID REFERENCES analysis_sessions(id) ON DELETE CASCADE,
  energy_score INTEGER NOT NULL,
  energy_category TEXT,
  stress_level TEXT,
  anxiety_level TEXT,
  depression_level TEXT,
  tone TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_energy_recorded ON energy_history(recorded_at DESC);


-- ============================================================
-- 4. ROW LEVEL SECURITY (open for development, tighten for prod)
-- ============================================================
ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE energy_history ENABLE ROW LEVEL SECURITY;

-- Development policies (allow all operations)
CREATE POLICY "Allow all select on analysis_sessions"
  ON analysis_sessions FOR SELECT USING (true);
CREATE POLICY "Allow all insert on analysis_sessions"
  ON analysis_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on analysis_sessions"
  ON analysis_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on analysis_sessions"
  ON analysis_sessions FOR DELETE USING (true);

CREATE POLICY "Allow all select on energy_history"
  ON energy_history FOR SELECT USING (true);
CREATE POLICY "Allow all insert on energy_history"
  ON energy_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all delete on energy_history"
  ON energy_history FOR DELETE USING (true);


-- ============================================================
-- 5. HELPER FUNCTION: auto-update updated_at on row change
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON analysis_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- 6. USEFUL VIEWS for frontend dashboards
-- ============================================================

-- Drop old views if they exist (to remove SECURITY DEFINER)
DROP VIEW IF EXISTS latest_sessions;
DROP VIEW IF EXISTS daily_energy_avg;

-- Latest session summary (SECURITY INVOKER = uses caller's permissions)
CREATE OR REPLACE VIEW latest_sessions
WITH (security_invoker = true)
AS
SELECT
  id,
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
FROM analysis_sessions
ORDER BY created_at DESC
LIMIT 50;

-- Daily energy averages (for trend charts)
CREATE OR REPLACE VIEW daily_energy_avg
WITH (security_invoker = true)
AS
SELECT
  DATE(recorded_at) AS date,
  ROUND(AVG(energy_score)) AS avg_energy,
  COUNT(*) AS session_count,
  MODE() WITHIN GROUP (ORDER BY energy_category) AS dominant_category
FROM energy_history
GROUP BY DATE(recorded_at)
ORDER BY date DESC;


-- ============================================================
-- 7. SEED DATA (optional, for testing)
-- ============================================================
-- INSERT INTO analysis_sessions (
--   input_type, input_text, depression_score, anxiety_score, stress_score,
--   stress_level, anxiety_level, depression_level, tone,
--   energy_score, energy_category, recommended_task_type,
--   task_description
-- ) VALUES (
--   'text', 'I feel very tired and anxious today.',
--   0.3, 0.7, 0.5,
--   'medium', 'high', 'low', 'negative',
--   35, 'low_energy', 'light',
--   'You have low energy. Focus on rest, light activities, and self-care.'
-- );
