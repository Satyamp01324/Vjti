-- ============================================================
-- Quick Fix for View Security Issues
-- Run this in Supabase SQL Editor to resolve SECURITY DEFINER warnings
-- ============================================================

-- Drop existing views that have SECURITY DEFINER
DROP VIEW IF EXISTS latest_sessions CASCADE;
DROP VIEW IF EXISTS daily_energy_avg CASCADE;

-- Recreate with SECURITY INVOKER (uses querying user's permissions + RLS)
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

-- Verify the fix
SELECT 
  schemaname,
  viewname,
  viewowner,
  -- Check if security_invoker option is set
  pg_catalog.obj_description(
    (schemaname || '.' || viewname)::regclass::oid,
    'pg_class'
  ) as description
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('latest_sessions', 'daily_energy_avg');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Views updated successfully with security_invoker = true';
  RAISE NOTICE 'The SECURITY DEFINER warnings should now be resolved';
END $$;
