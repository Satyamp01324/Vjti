"""
SpoonSense Demo Seed Profiles (FEAT-A3)
=======================================

Provides instant, zero-setup seed profiles for the Hackathon Judge Demonstration:
  • Aarav (Heavy Commute): 240m crowded suburban train, 9h campus -> 2.4 spoons (Stormy)
  • Meera (Walk to Campus): 20m walk, 9h campus -> 7.4 spoons (Sunny / Clear)

Both students share the exact same engineering timetable, demonstrating how
SpoonSense calculates capacity from physical reality rather than generic calendar slots.
"""

from __future__ import annotations

import datetime
from typing import Any, Dict
from core.timetable_parser import parse_ics_file, generate_sample_ics
from core.garden import GardenState


def get_vjti_timetable_blocks():
    """Returns standard VJTI Mumbai engineering timetable blocks."""
    ics_text = generate_sample_ics()
    return parse_ics_file(ics_text)


def seed_aarav_profile(store: Dict[str, Any], user_id: str = "aarav") -> Dict[str, Any]:
    """Seed Aarav's heavy-commute profile (FEAT-A3)."""
    blocks = get_vjti_timetable_blocks()

    # 1. Timetable
    store["timetables"][user_id] = blocks

    # 2. Commute: Kalyan -> Matunga (2 hours each way, crowded suburban local)
    store["commutes"][user_id] = {
        "minutes_each_way": 120,
        "mode": "crowded",
        "days_applicable": [0, 1, 2, 3, 4],
        "notes": "Central Line peak hour transit (Kalyan to Matunga)",
    }

    # 3. Tasks (with one task moved 3 times to trigger the anti-paralysis shrinker offer)
    store["tasks"][user_id] = [
        {
            "id": f"task_{user_id}_1",
            "task_id": f"task_{user_id}_1",
            "title": "Embedded Systems Lab Report",
            "task_type": "writing",
            "difficulty": "hard",
            "estimated_minutes": 90,
            "spoon_cost": 2.2,
            "due_date": (datetime.date.today() + datetime.timedelta(days=1)).isoformat(),
            "is_fixed_deadline": False,
            "status": "pending",
            "reshuffled_count": 3,
        },
        {
            "id": f"task_{user_id}_2",
            "task_id": f"task_{user_id}_2",
            "title": "Engineering Workshop Logbook",
            "task_type": "admin",
            "difficulty": "normal",
            "estimated_minutes": 30,
            "spoon_cost": 0.5,
            "due_date": (datetime.date.today() + datetime.timedelta(days=2)).isoformat(),
            "is_fixed_deadline": False,
            "status": "pending",
            "reshuffled_count": 0,
        },
        {
            "id": f"task_{user_id}_3",
            "task_id": f"task_{user_id}_3",
            "title": "Discrete Math Problem Set",
            "task_type": "problem_solving",
            "difficulty": "normal",
            "estimated_minutes": 60,
            "spoon_cost": 1.1,
            "due_date": (datetime.date.today() + datetime.timedelta(days=4)).isoformat(),
            "is_fixed_deadline": False,
            "status": "pending",
            "reshuffled_count": 1,
        },
    ]

    # 4. Cognitive Baseline & High-Fatigue Probe
    # 450ms vs 300ms baseline (+50% slower RT -> multiplier 0.7)
    store["baselines"][user_id] = {
        "baseline_rt": 300.0,
        "play_count": 5,
    }
    store["game_results"][user_id] = [
        {
            "median_rt": 450.0,
            "lapses": 2,
            "variability": 48.0,
            "switch_cost": 85.0,
            "multiplier": 0.7,
            "played_at": datetime.datetime.now().isoformat(),
        }
    ]

    # 5. Forgiving Garden
    store["gardens"][user_id] = GardenState(
        user_id=user_id,
        days_tended=8,
        total_xp=240,
        current_stage="bud",
        stage_label="Budding Plant",
        stage_emoji="🌿",
        last_active_date=(datetime.date.today() - datetime.timedelta(days=1)).isoformat(),
        is_hibernating=False,
    )

    # 6. Evening Check-in History
    store["evening_checkins"][user_id] = [
        {
            "date": (datetime.date.today() - datetime.timedelta(days=1)).isoformat(),
            "label_value": 2,
            "label_name": "Low Energy",
            "spoons_awarded": 0.5,
            "action": "checkin",
        }
    ]

    return {
        "status": "success",
        "persona": "aarav",
        "name": "Aarav Sharma",
        "description": "Heavy Commute Student (240m daily transit, 9h campus -> 2.4 spoons, Stormy)",
        "expected_live_spoons": 2.45,
        "expected_weather": "stormy",
        "commute_cost": 4.0,
        "campus_cost": 4.5,
        "user_id": user_id,
    }


def seed_meera_profile(store: Dict[str, Any], user_id: str = "meera") -> Dict[str, Any]:
    """Seed Meera's light-commute profile (FEAT-A3)."""
    blocks = get_vjti_timetable_blocks()

    # 1. Timetable (Identical to Aarav)
    store["timetables"][user_id] = blocks

    # 2. Commute: Hostel near Five Gardens -> VJTI (10 min walk each way)
    store["commutes"][user_id] = {
        "minutes_each_way": 10,
        "mode": "walk",
        "days_applicable": [0, 1, 2, 3, 4],
        "notes": "Short 10-minute tree-lined walk from hostel",
    }

    # 3. Tasks (Capacity for deep focus blocks)
    store["tasks"][user_id] = [
        {
            "id": f"task_{user_id}_1",
            "task_id": f"task_{user_id}_1",
            "title": "Embedded Systems Lab Report",
            "task_type": "writing",
            "difficulty": "hard",
            "estimated_minutes": 90,
            "spoon_cost": 2.2,
            "due_date": (datetime.date.today() + datetime.timedelta(days=2)).isoformat(),
            "is_fixed_deadline": False,
            "status": "pending",
            "reshuffled_count": 0,
        },
        {
            "id": f"task_{user_id}_2",
            "task_id": f"task_{user_id}_2",
            "title": "Read Operating Systems Chapter 5",
            "task_type": "reading",
            "difficulty": "normal",
            "estimated_minutes": 45,
            "spoon_cost": 0.7,
            "due_date": (datetime.date.today() + datetime.timedelta(days=3)).isoformat(),
            "is_fixed_deadline": False,
            "status": "pending",
            "reshuffled_count": 0,
        },
        {
            "id": f"task_{user_id}_3",
            "task_id": f"task_{user_id}_3",
            "title": "Algorithm Complexity Proofs",
            "task_type": "problem_solving",
            "difficulty": "normal",
            "estimated_minutes": 60,
            "spoon_cost": 1.1,
            "due_date": (datetime.date.today() + datetime.timedelta(days=4)).isoformat(),
            "is_fixed_deadline": False,
            "status": "pending",
            "reshuffled_count": 0,
        },
    ]

    # 4. Cognitive Baseline & Fresh Morning Probe
    # 305ms vs 300ms baseline (normal reaction time -> multiplier 1.0)
    store["baselines"][user_id] = {
        "baseline_rt": 300.0,
        "play_count": 5,
    }
    store["game_results"][user_id] = [
        {
            "median_rt": 305.0,
            "lapses": 0,
            "variability": 22.0,
            "switch_cost": 40.0,
            "multiplier": 1.0,
            "played_at": datetime.datetime.now().isoformat(),
        }
    ]

    # 5. Forgiving Garden
    store["gardens"][user_id] = GardenState(
        user_id=user_id,
        days_tended=12,
        total_xp=420,
        current_stage="shrub",
        stage_label="Young Shrub",
        stage_emoji="🪴",
        last_active_date=datetime.date.today().isoformat(),
        is_hibernating=False,
    )

    # 6. Evening Check-in History
    store["evening_checkins"][user_id] = [
        {
            "date": (datetime.date.today() - datetime.timedelta(days=1)).isoformat(),
            "label_value": 4,
            "label_name": "Good Capacity",
            "spoons_awarded": 0.2,
            "action": "checkin",
        }
    ]

    return {
        "status": "success",
        "persona": "meera",
        "name": "Meera Patel",
        "description": "Walk-to-Campus Student (20m daily walk, 9h campus -> 7.4 spoons, Sunny)",
        "expected_live_spoons": 7.4,
        "expected_weather": "sunny",
        "commute_cost": 0.1,
        "campus_cost": 4.5,
        "user_id": user_id,
    }
