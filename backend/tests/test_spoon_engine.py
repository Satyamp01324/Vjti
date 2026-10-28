"""
SpoonSense Milestone 1 Test Suite
==================================

Unit tests for:
  1. `backend/core/spoon_engine.py`
  2. `backend/core/timetable_parser.py`

Verifies all mathematical models, boundary conditions, edge cases,
and worked examples from PRD v2.0 (Sections 11 & 12).
"""

from __future__ import annotations

import os
import sys
from datetime import date

# Ensure backend root is on Python module search path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.spoon_engine import (
    classify_weather,
    compute_7day_forecast,
    compute_campus_cost,
    compute_campus_hours,
    compute_carryover,
    compute_commute_cost,
    compute_confidence,
    compute_deadline_pressure,
    compute_full_day_snapshot,
    compute_live,
    compute_prior,
    compute_probe_multiplier,
    compute_range,
    compute_task_cost,
)
from core.timetable_parser import (
    blocks_from_grid,
    build_commute_profile,
    compute_campus_hours_from_blocks,
    generate_sample_ics,
    get_effective_commute,
    merge_timetable_blocks,
    parse_ics_file,
    validate_ics_content,
)


# ═══════════════════════════════════════════════════════════════════════════════
# 1. Commute Cost Tests
# ═══════════════════════════════════════════════════════════════════════════════
class TestCommuteCost:
    def test_commute_crowded_240min(self):
        """Aarav PRD Case: 240m crowded -> (240/30)*0.5*1.0 = 4.0 spoons"""
        assert compute_commute_cost(240, "crowded") == 4.0

    def test_commute_walk_20min(self):
        """Meera PRD Case: 20m walk -> (20/30)*0.5*0.3 = 0.1 spoons"""
        assert abs(compute_commute_cost(20, "walk") - 0.1) < 0.01

    def test_commute_zero(self):
        assert compute_commute_cost(0, "crowded") == 0.0

    def test_commute_invalid_mode_defaults_seated(self):
        result = compute_commute_cost(60, "flying")
        expected = (60 / 30) * 0.5 * 0.6  # 0.6
        assert abs(result - expected) < 0.01

    def test_commute_negative_minutes_clamped(self):
        assert compute_commute_cost(-10, "walk") == 0.0


# ═══════════════════════════════════════════════════════════════════════════════
# 2. Campus Cost Tests
# ═══════════════════════════════════════════════════════════════════════════════
class TestCampusCost:
    def test_campus_9_hours(self):
        """9 campus hours * 0.5 = 4.5 spoons"""
        assert compute_campus_cost(9.0) == 4.5

    def test_campus_3_hours(self):
        assert compute_campus_cost(3.0) == 1.5

    def test_campus_zero(self):
        assert compute_campus_cost(0.0) == 0.0

    def test_campus_negative_clamped(self):
        assert compute_campus_cost(-4.0) == 0.0


# ═══════════════════════════════════════════════════════════════════════════════
# 3. Campus Hours from Blocks
# ═══════════════════════════════════════════════════════════════════════════════
class TestCampusHours:
    def test_campus_hours_typical_day(self):
        """08:30 to 17:30 = 9.0 hours span"""
        blocks = [
            {"weekday": 0, "start_time": "08:30", "end_time": "10:30"},
            {"weekday": 0, "start_time": "14:00", "end_time": "17:30"},
        ]
        assert compute_campus_hours(blocks, 0) == 9.0

    def test_campus_hours_no_blocks(self):
        assert compute_campus_hours([], 0) == 0.0

    def test_campus_hours_wrong_weekday(self):
        blocks = [{"weekday": 1, "start_time": "09:00", "end_time": "11:00"}]
        assert compute_campus_hours(blocks, 0) == 0.0

    def test_campus_hours_single_block(self):
        blocks = [{"weekday": 2, "start_time": "10:00", "end_time": "12:00"}]
        assert compute_campus_hours(blocks, 2) == 2.0


# ═══════════════════════════════════════════════════════════════════════════════
# 4. Deadline Pressure Tests
# ═══════════════════════════════════════════════════════════════════════════════
class TestDeadlinePressure:
    def test_deadline_pressure_due_today(self):
        tasks = [{"due_date": date(2026, 10, 28), "spoon_cost": 2.0}]
        result = compute_deadline_pressure(tasks, date(2026, 10, 28))
        assert abs(result - 0.5) < 0.01

    def test_deadline_pressure_due_tomorrow(self):
        tasks = [{"due_date": date(2026, 10, 29), "spoon_cost": 2.0}]
        result = compute_deadline_pressure(tasks, date(2026, 10, 28))
        assert abs(result - 0.3) < 0.01

    def test_deadline_pressure_capped_at_2(self):
        """Many urgent tasks should cap at 2.0 (each contributes min(cost, 2.0) * 1.0 * 0.25 = 0.5)"""
        tasks = [
            {"due_date": date(2026, 10, 28), "spoon_cost": 4.0},
            {"due_date": date(2026, 10, 28), "spoon_cost": 4.0},
            {"due_date": date(2026, 10, 28), "spoon_cost": 4.0},
            {"due_date": date(2026, 10, 28), "spoon_cost": 4.0},
            {"due_date": date(2026, 10, 28), "spoon_cost": 4.0},
        ]
        result = compute_deadline_pressure(tasks, date(2026, 10, 28))
        assert result == 2.0

    def test_deadline_pressure_no_tasks(self):
        assert compute_deadline_pressure([], date(2026, 10, 28)) == 0.0

    def test_deadline_pressure_task_no_due_date(self):
        tasks = [{"due_date": None, "spoon_cost": 3.0}]
        assert compute_deadline_pressure(tasks, date(2026, 10, 28)) == 0.0

    def test_deadline_pressure_far_future_ignored(self):
        tasks = [{"due_date": date(2026, 11, 15), "spoon_cost": 3.0}]
        assert compute_deadline_pressure(tasks, date(2026, 10, 28)) == 0.0


# ═══════════════════════════════════════════════════════════════════════════════
# 5. Carryover Tests
# ═══════════════════════════════════════════════════════════════════════════════
class TestCarryover:
    def test_carryover_heavy_day(self):
        """Spend 8.5 -> 0.4 * (8.5 - 6) = 1.0"""
        assert abs(compute_carryover(8.5) - 1.0) < 0.01

    def test_carryover_light_day(self):
        """Spend 4.6 -> clamp to 0.0"""
        assert compute_carryover(4.6) == 0.0

    def test_carryover_with_low_evening_label(self):
        """Low label (0) nudges +0.5"""
        result = compute_carryover(8.5, evening_label=0)
        assert abs(result - 1.5) < 0.01

    def test_carryover_with_high_evening_label(self):
        """High label (4) nudges -0.5"""
        result = compute_carryover(8.5, evening_label=4)
        assert abs(result - 0.5) < 0.01

    def test_carryover_never_negative(self):
        assert compute_carryover(2.0, evening_label=4) == 0.0


# ═══════════════════════════════════════════════════════════════════════════════
# 6. Prior Spoon Calculation Tests (PRD Worked Examples)
# ═══════════════════════════════════════════════════════════════════════════════
class TestPriorSpoons:
    def test_aarav_monday_prior(self):
        """PRD Section 12.12: 12 - 4.0 - 4.5 = 3.5"""
        prior = compute_prior(12.0, 4.0, 4.5, 0.0, 0.0)
        assert abs(prior - 3.5) < 0.01

    def test_meera_monday_prior(self):
        """PRD Section 12.13: 12 - 0.1 - 4.5 = 7.4"""
        prior = compute_prior(12.0, 0.1, 4.5, 0.0, 0.0)
        assert abs(prior - 7.4) < 0.01

    def test_aarav_tuesday_forecast(self):
        """PRD Section 12.14: 12 - 4.0 - 1.5 - 1.0 = 5.5"""
        prior = compute_prior(12.0, 4.0, 1.5, 0.0, 1.0)
        assert abs(prior - 5.5) < 0.01

    def test_prior_can_go_negative(self):
        prior = compute_prior(12.0, 8.0, 6.0, 2.0, 1.0)
        assert prior < 0


# ═══════════════════════════════════════════════════════════════════════════════
# 7. Probe Multiplier & Live Spoons Tests
# ═══════════════════════════════════════════════════════════════════════════════
class TestProbeAndLiveSpoons:
    def test_probe_calibrating(self):
        """< 3 plays -> 1.0"""
        assert compute_probe_multiplier(350, 300, play_count=2) == 1.0

    def test_probe_within_20_percent(self):
        assert compute_probe_multiplier(330, 300, play_count=5) == 1.0

    def test_probe_exactly_35_percent_slower(self):
        result = compute_probe_multiplier(405, 300, play_count=5)
        assert abs(result - 0.85) < 0.02

    def test_probe_50_percent_slower(self):
        result = compute_probe_multiplier(450, 300, play_count=5)
        assert abs(result - 0.70) < 0.02

    def test_probe_faster_than_baseline(self):
        """No speed reward per PRD"""
        assert compute_probe_multiplier(250, 300, play_count=5) == 1.0

    def test_live_aarav_with_game(self):
        """3.5 * 0.7 = 2.45"""
        live = compute_live(3.5, probe_multiplier=0.7)
        assert abs(live - 2.45) < 0.01

    def test_live_floor_at_1(self):
        live = compute_live(-3.0, probe_multiplier=0.7)
        assert live == 1.0

    def test_live_ceiling_at_12(self):
        live = compute_live(15.0, probe_multiplier=1.0)
        assert live == 12.0

    def test_live_tier2_clamped(self):
        live = compute_live(10.0, probe_multiplier=1.0, tier2_adjust=0.5)
        assert abs(live - 9.0) < 0.01


# ═══════════════════════════════════════════════════════════════════════════════
# 8. Confidence, Range & Weather
# ═══════════════════════════════════════════════════════════════════════════════
class TestConfidenceAndWeather:
    def test_confidence_new_user(self):
        assert abs(compute_confidence(0, False) - 0.4) < 0.01

    def test_confidence_with_game(self):
        assert abs(compute_confidence(0, True) - 0.5) < 0.01

    def test_confidence_max_cap(self):
        assert compute_confidence(30, True) <= 0.9

    def test_weather_sunny(self):
        assert classify_weather(8.0) == "sunny"
        assert classify_weather(12.0) == "sunny"

    def test_weather_partly_cloudy(self):
        assert classify_weather(5.0) == "partly_cloudy"
        assert classify_weather(7.9) == "partly_cloudy"

    def test_weather_cloudy(self):
        assert classify_weather(3.0) == "cloudy"
        assert classify_weather(4.9) == "cloudy"

    def test_weather_stormy(self):
        assert classify_weather(2.9) == "stormy"
        assert classify_weather(1.0) == "stormy"


# ═══════════════════════════════════════════════════════════════════════════════
# 9. Task Cost Tests
# ═══════════════════════════════════════════════════════════════════════════════
class TestTaskCost:
    def test_task_cost_reading_15min(self):
        cost = compute_task_cost(15, "reading", "normal")
        assert abs(cost - 1.0) < 0.05

    def test_task_cost_problem_solving_45min_hard(self):
        cost = compute_task_cost(45, "problem_solving", "hard")
        assert abs(cost - 4.81) < 0.1

    def test_task_cost_micro_step(self):
        cost = compute_task_cost(2, "micro_step", "normal")
        assert abs(cost - 0.2) < 0.01


# ═══════════════════════════════════════════════════════════════════════════════
# 10. Timetable Parser & Commute Ingestion Tests
# ═══════════════════════════════════════════════════════════════════════════════
class TestTimetableParser:
    def test_parse_sample_ics(self):
        ics_text = generate_sample_ics()
        is_valid, err = validate_ics_content(ics_text)
        assert is_valid is True

        blocks = parse_ics_file(ics_text)
        assert len(blocks) >= 5
        # Verify weekday bounds
        for b in blocks:
            assert 0 <= b["weekday"] <= 6
            assert ":" in b["start_time"]
            assert ":" in b["end_time"]

    def test_parse_empty_ics(self):
        blocks = parse_ics_file("")
        assert blocks == []

    def test_blocks_from_grid(self):
        grid = {
            "0": [{"start": "08:30", "end": "10:30", "title": "Physics"}],
            "1": [{"start": "09:00", "end": "11:00", "title": "DS Lab"}],
        }
        blocks = blocks_from_grid(grid)
        assert len(blocks) == 2
        assert blocks[0]["weekday"] == 0
        assert blocks[0]["source"] == "manual"

    def test_campus_hours_from_blocks(self):
        blocks = [
            {"weekday": 0, "start_time": "08:30", "end_time": "10:30"},
            {"weekday": 0, "start_time": "14:00", "end_time": "17:30"},
        ]
        hours = compute_campus_hours_from_blocks(blocks, 0)
        assert hours == 9.0

    def test_commute_effective_wfh(self):
        profile = {"minutes_each_way": 120, "mode": "crowded", "days_applicable": [0, 1, 2, 3, 4]}
        overrides = [{"date": "2026-10-28", "override_type": "wfh"}]
        mins, mode = get_effective_commute(profile, overrides, 2, "2026-10-28")
        assert mins == 0.0
        assert mode == "walk"

    def test_commute_effective_normal(self):
        profile = {"minutes_each_way": 120, "mode": "crowded", "days_applicable": [0, 1, 2, 3, 4]}
        mins, mode = get_effective_commute(profile, [], 0, "2026-10-26")
        assert mins == 240.0
        assert mode == "crowded"

    def test_commute_effective_weekend(self):
        profile = {"minutes_each_way": 120, "mode": "crowded", "days_applicable": [0, 1, 2, 3, 4]}
        mins, mode = get_effective_commute(profile, [], 5, "2026-10-31")
        assert mins == 0.0


# ═══════════════════════════════════════════════════════════════════════════════
# 11. End-to-End Aarav vs Meera Integration
# ═══════════════════════════════════════════════════════════════════════════════
class TestEndToEndContrast:
    def test_aarav_vs_meera_contrast(self):
        """
        Verify the core differentiator from Section 27.1:
        Same timetable (9h campus Monday), Aarav has 240m crowded commute -> ~2.4 live spoons (Stormy)
        Meera has 20m walk -> ~7.4 live spoons (Partly Cloudy / Sunny)
        """
        mon_blocks = [
            {"weekday": 0, "start_time": "08:30", "end_time": "10:30"},
            {"weekday": 0, "start_time": "14:00", "end_time": "17:30"},
        ]

        # Aarav: Monday
        aarav_commute = {"minutes_each_way": 120, "mode": "crowded", "days_applicable": [0, 1, 2, 3, 4]}
        aarav_snap = compute_full_day_snapshot(
            user_budget=12.0,
            timetable_blocks=mon_blocks,
            commute_profile=aarav_commute,
            day_overrides=[],
            tasks=[],
            previous_day_spend=0.0,
            evening_label=None,
            target_date=date(2026, 10, 26),
            probe_result={"valid": True, "median_rt": 450, "baseline_rt": 300, "play_count": 5},
        )
        assert aarav_snap["prior_spoons"] == 3.5
        assert aarav_snap["live_spoons"] <= 2.5
        assert aarav_snap["weather"] == "stormy"

        # Meera: Monday
        meera_commute = {"minutes_each_way": 10, "mode": "walk", "days_applicable": [0, 1, 2, 3, 4]}
        meera_snap = compute_full_day_snapshot(
            user_budget=12.0,
            timetable_blocks=mon_blocks,
            commute_profile=meera_commute,
            day_overrides=[],
            tasks=[],
            previous_day_spend=0.0,
            evening_label=None,
            target_date=date(2026, 10, 26),
            probe_result={"valid": True, "median_rt": 310, "baseline_rt": 300, "play_count": 5},
        )
        assert abs(meera_snap["prior_spoons"] - 7.4) < 0.05
        assert abs(meera_snap["live_spoons"] - 7.4) < 0.05
        assert meera_snap["weather"] == "partly_cloudy"


if __name__ == "__main__":
    import inspect

    passed = 0
    failed = 0
    errors = []

    print("\n" + "=" * 70)
    print("🧪 RUNNING SPOONSENSE MILESTONE 1 TEST SUITE")
    print("=" * 70 + "\n")

    current_module = sys.modules[__name__]
    for name, obj in inspect.getmembers(current_module, inspect.isclass):
        if name.startswith("Test"):
            print(f"▶ {name}")
            instance = obj()
            for method_name in dir(instance):
                if method_name.startswith("test_"):
                    test_fn = getattr(instance, method_name)
                    try:
                        test_fn()
                        passed += 1
                        print(f"   ✓ {method_name}")
                    except Exception as e:
                        failed += 1
                        errors.append((f"{name}.{method_name}", str(e)))
                        print(f"   ✗ {method_name}: {e}")

    print("\n" + "=" * 70)
    print(f"RESULTS: {passed} PASSED, {failed} FAILED")
    print("=" * 70)

    if failed > 0:
        print("\nErrors encountered:")
        for fn_name, err in errors:
            print(f" - {fn_name}: {err}")
        sys.exit(1)
    else:
        print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")
        sys.exit(0)

