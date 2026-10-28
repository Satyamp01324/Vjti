-- =============================================================================
-- SpoonSense — PostgreSQL Schema Migration for Supabase
-- =============================================================================
-- Description:  Production-grade, idempotent schema for the SpoonSense
--               load-aware student energy planner.
--
-- Idempotency:  Uses CREATE TABLE IF NOT EXISTS, CREATE OR REPLACE FUNCTION,
--               DROP POLICY IF EXISTS, and CREATE INDEX IF NOT EXISTS so the
--               script can be re-run safely at any time.
--
-- Conventions:  • user_id is TEXT (matches Supabase auth.users.id::text)
--               • weekday 0 = Monday … 6 = Sunday (ISO-8601)
--               • All timestamps are TIMESTAMPTZ (UTC)
--               • Row Level Security is ENABLED on every table
--               • Development-open policies (allow all) are provided; swap for
--                 auth.uid()-based policies before going to production.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0. Shared trigger function: auto-update `updated_at` on row modification
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.spoonsense_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.spoonsense_set_updated_at()
    IS 'Trigger function that stamps updated_at = NOW() on every UPDATE.';


-- ===========================================================================
-- 1. timetable_blocks — Weekly recurring class schedule
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.timetable_blocks (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT        NOT NULL,
    weekday     INTEGER     NOT NULL CHECK (weekday BETWEEN 0 AND 6),
    start_time  TIME        NOT NULL,
    end_time    TIME        NOT NULL,
    title       TEXT        DEFAULT '',
    source      TEXT        DEFAULT 'manual'
                            CHECK (source IN ('ics', 'photo', 'manual')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT timetable_blocks_valid_time_range CHECK (end_time > start_time)
);

COMMENT ON TABLE public.timetable_blocks
    IS 'Weekly recurring class schedule blocks for a student.';

CREATE INDEX IF NOT EXISTS idx_timetable_blocks_user_weekday
    ON public.timetable_blocks (user_id, weekday);

-- RLS
ALTER TABLE public.timetable_blocks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS timetable_blocks_dev_all ON public.timetable_blocks;
CREATE POLICY timetable_blocks_dev_all
    ON public.timetable_blocks
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_timetable_blocks_updated_at ON public.timetable_blocks;
CREATE TRIGGER trg_timetable_blocks_updated_at
    BEFORE UPDATE ON public.timetable_blocks
    FOR EACH ROW
    EXECUTE FUNCTION public.spoonsense_set_updated_at();


-- ===========================================================================
-- 2. commute_profiles — Per-user commute configuration
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.commute_profiles (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           TEXT        NOT NULL UNIQUE,
    minutes_each_way  INTEGER     NOT NULL DEFAULT 30
                                  CHECK (minutes_each_way >= 0
                                         AND minutes_each_way <= 480),
    mode              TEXT        NOT NULL DEFAULT 'seated'
                                  CHECK (mode IN ('crowded', 'seated', 'walk')),
    days_applicable   JSONB       NOT NULL DEFAULT '[0,1,2,3,4]'::jsonb,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.commute_profiles
    IS 'Per-user commute configuration (one profile per user).';

-- RLS
ALTER TABLE public.commute_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS commute_profiles_dev_all ON public.commute_profiles;
CREATE POLICY commute_profiles_dev_all
    ON public.commute_profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_commute_profiles_updated_at ON public.commute_profiles;
CREATE TRIGGER trg_commute_profiles_updated_at
    BEFORE UPDATE ON public.commute_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.spoonsense_set_updated_at();


-- ===========================================================================
-- 3. day_overrides — Per-day exceptions (holiday, WFH, exam, custom commute)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.day_overrides (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        TEXT        NOT NULL,
    date           DATE        NOT NULL,
    override_type  TEXT        NOT NULL
                               CHECK (override_type IN (
                                   'holiday', 'wfh', 'exam', 'custom_commute'
                               )),
    value          JSONB       DEFAULT '{}'::jsonb,
    created_at     TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT day_overrides_one_per_user_date UNIQUE (user_id, date)
);

COMMENT ON TABLE public.day_overrides
    IS 'Per-day exceptions: holidays, WFH, exams, or custom commute overrides.';

CREATE INDEX IF NOT EXISTS idx_day_overrides_user_date
    ON public.day_overrides (user_id, date);

-- RLS
ALTER TABLE public.day_overrides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS day_overrides_dev_all ON public.day_overrides;
CREATE POLICY day_overrides_dev_all
    ON public.day_overrides
    FOR ALL
    USING (true)
    WITH CHECK (true);


-- ===========================================================================
-- 4. tasks — Student tasks with spoon costs
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.tasks (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           TEXT        NOT NULL,
    title             TEXT        NOT NULL,
    description       TEXT        DEFAULT '',
    task_type         TEXT        NOT NULL DEFAULT 'other'
                                  CHECK (task_type IN (
                                      'reading', 'writing', 'problem_solving',
                                      'admin', 'other'
                                  )),
    due_date          DATE,
    is_fixed_deadline BOOLEAN     DEFAULT FALSE,
    estimated_minutes INTEGER     DEFAULT 20
                                  CHECK (estimated_minutes > 0
                                         AND estimated_minutes <= 720),
    difficulty        TEXT        DEFAULT 'normal'
                                  CHECK (difficulty IN ('easy', 'normal', 'hard')),
    spoon_cost        REAL,
    state             TEXT        DEFAULT 'planned'
                                  CHECK (state IN (
                                      'planned', 'in_progress', 'shrunk',
                                      'moved', 'done', 'parked'
                                  )),
    planned_date      DATE,
    planned_slot      TEXT,
    moves_count       INTEGER     DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.tasks
    IS 'Student tasks with spoon costs, scheduling state, and move tracking.';

CREATE INDEX IF NOT EXISTS idx_tasks_user_state
    ON public.tasks (user_id, state);

CREATE INDEX IF NOT EXISTS idx_tasks_user_planned_date
    ON public.tasks (user_id, planned_date);

CREATE INDEX IF NOT EXISTS idx_tasks_user_due_date
    ON public.tasks (user_id, due_date);

-- RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tasks_dev_all ON public.tasks;
CREATE POLICY tasks_dev_all
    ON public.tasks
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.spoonsense_set_updated_at();


-- ===========================================================================
-- 5. task_steps — Micro-sequencer generated steps for a task
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.task_steps (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id     UUID        NOT NULL
                            REFERENCES public.tasks (id) ON DELETE CASCADE,
    position    INTEGER     NOT NULL,
    text        TEXT        NOT NULL,
    minutes     INTEGER     DEFAULT 2,
    spoon_cost  REAL        DEFAULT 0.2,
    why_text    TEXT        DEFAULT '',
    state       TEXT        DEFAULT 'todo'
                            CHECK (state IN ('todo', 'done')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.task_steps
    IS 'Micro-sequencer generated sub-steps for a parent task.';

CREATE INDEX IF NOT EXISTS idx_task_steps_task_id
    ON public.task_steps (task_id);

-- RLS
ALTER TABLE public.task_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS task_steps_dev_all ON public.task_steps;
CREATE POLICY task_steps_dev_all
    ON public.task_steps
    FOR ALL
    USING (true)
    WITH CHECK (true);


-- ===========================================================================
-- 6. day_snapshots — Daily spoon calculation snapshots
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.day_snapshots (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT        NOT NULL,
    date            DATE        NOT NULL,
    prior_spoons    REAL,
    live_spoons     REAL,
    manual_override REAL,
    factors         JSONB       NOT NULL DEFAULT '[]'::jsonb,
    confidence      REAL        DEFAULT 0.4,
    weather         TEXT        DEFAULT 'partly_cloudy'
                                CHECK (weather IN (
                                    'sunny', 'partly_cloudy', 'cloudy', 'stormy'
                                )),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT day_snapshots_one_per_user_date UNIQUE (user_id, date)
);

COMMENT ON TABLE public.day_snapshots
    IS 'Daily spoon budget snapshot with factors, confidence, and weather icon.';

CREATE INDEX IF NOT EXISTS idx_day_snapshots_user_date
    ON public.day_snapshots (user_id, date);

-- RLS
ALTER TABLE public.day_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS day_snapshots_dev_all ON public.day_snapshots;
CREATE POLICY day_snapshots_dev_all
    ON public.day_snapshots
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_day_snapshots_updated_at ON public.day_snapshots;
CREATE TRIGGER trg_day_snapshots_updated_at
    BEFORE UPDATE ON public.day_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION public.spoonsense_set_updated_at();


-- ===========================================================================
-- 7. game_results — 20-second game probe results (summaries only)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.game_results (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      TEXT        NOT NULL,
    date         DATE        NOT NULL,
    time_of_day  TEXT        DEFAULT 'morning'
                             CHECK (time_of_day IN (
                                 'morning', 'afternoon', 'evening'
                             )),
    game         TEXT        NOT NULL
                             CHECK (game IN ('pulse', 'switch', 'pop')),
    summary      JSONB       NOT NULL DEFAULT '{}'::jsonb,
    valid        BOOLEAN     DEFAULT TRUE,
    skipped      BOOLEAN     DEFAULT FALSE,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.game_results
    IS '20-second cognitive game probe results (summary metrics only).';

CREATE INDEX IF NOT EXISTS idx_game_results_user_date
    ON public.game_results (user_id, date);

-- RLS
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS game_results_dev_all ON public.game_results;
CREATE POLICY game_results_dev_all
    ON public.game_results
    FOR ALL
    USING (true)
    WITH CHECK (true);


-- ===========================================================================
-- 8. evening_labels — One-tap evening check-in
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.evening_labels (
    id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id  TEXT        NOT NULL,
    date     DATE        NOT NULL,
    value    INTEGER     CHECK (value BETWEEN 0 AND 4),
    skipped  BOOLEAN     DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT evening_labels_one_per_user_date UNIQUE (user_id, date)
);

COMMENT ON TABLE public.evening_labels
    IS 'Evening one-tap check-in: how many spoons (0-4) the student feels they have left.';

CREATE INDEX IF NOT EXISTS idx_evening_labels_user_date
    ON public.evening_labels (user_id, date);

-- RLS
ALTER TABLE public.evening_labels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS evening_labels_dev_all ON public.evening_labels;
CREATE POLICY evening_labels_dev_all
    ON public.evening_labels
    FOR ALL
    USING (true)
    WITH CHECK (true);


-- ===========================================================================
-- 9. garden_state — Forgiving garden (never dies)
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.garden_state (
    user_id          TEXT        PRIMARY KEY,
    days_tended      INTEGER     DEFAULT 0,
    xp               INTEGER     DEFAULT 0,
    items            JSONB       DEFAULT '[]'::jsonb,
    last_checkin_date DATE,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.garden_state
    IS 'Forgiving garden gamification state — never dies, only grows.';

-- RLS
ALTER TABLE public.garden_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS garden_state_dev_all ON public.garden_state;
CREATE POLICY garden_state_dev_all
    ON public.garden_state
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_garden_state_updated_at ON public.garden_state;
CREATE TRIGGER trg_garden_state_updated_at
    BEFORE UPDATE ON public.garden_state
    FOR EACH ROW
    EXECUTE FUNCTION public.spoonsense_set_updated_at();


-- ===========================================================================
-- 10. dopamine_items — User's personal rest activities
-- ===========================================================================
CREATE TABLE IF NOT EXISTS public.dopamine_items (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    TEXT        NOT NULL,
    label      TEXT        NOT NULL,
    spoon_gain REAL        DEFAULT 0.3
                           CHECK (spoon_gain >= 0 AND spoon_gain <= 2.0),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.dopamine_items
    IS 'User-curated list of personal rest / recharge activities with spoon recovery values.';

CREATE INDEX IF NOT EXISTS idx_dopamine_items_user
    ON public.dopamine_items (user_id);

-- RLS
ALTER TABLE public.dopamine_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS dopamine_items_dev_all ON public.dopamine_items;
CREATE POLICY dopamine_items_dev_all
    ON public.dopamine_items
    FOR ALL
    USING (true)
    WITH CHECK (true);


-- ===========================================================================
-- Done!  All 10 SpoonSense tables created with:
--   • Row Level Security enabled (development-open policies)
--   • updated_at triggers on all mutable tables
--   • Composite indexes for common query patterns
--   • CHECK constraints enforcing domain rules
--   • Table-level comments for documentation
-- ===========================================================================
