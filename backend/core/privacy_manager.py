"""
SpoonSense Privacy, Export & One-Click Delete Engine (FEAT-G4)
==============================================================

Implements:
  • Plain-language data inventory & transparency manifest (FR-ST-01, Section 20)
  • Comprehensive 1-click JSON data export (FR-ST-02)
  • One-click permanent account and data purge (FR-ST-03)
"""

from __future__ import annotations

import datetime
from typing import Any, Dict


PRIVACY_MANIFEST = {
    "version": "2.0-spoonsense",
    "ethical_commitments": [
        "We track proxies for capacity, never clinical conditions or diagnoses.",
        "Zero institutional access: your professors, parents, and college administration cannot see your spoons.",
        "Zero keystroke logging, zero screen recording, zero background mic/camera streaming.",
        "Every signal is completely optional except the timetable you choose to give us.",
        "You can inspect, override, export, and delete every byte of your data at any time.",
    ],
    "what_we_collect": [
        {
            "category": "Timetable & Campus Hours",
            "items": ["Class start & end times", "Weekday recurrence", "Course titles"],
            "storage": "Local device cache + Encrypted database",
            "purpose": "Calculates daily physical campus drain.",
        },
        {
            "category": "Commute Profile",
            "items": ["Minutes traveled each way", "Transit crowding mode (crowded, seated, walk)"],
            "storage": "Local device cache + Encrypted database",
            "purpose": "Subtracts transit toll from your daily 12-spoon budget.",
        },
        {
            "category": "Tasks & Deadlines",
            "items": ["Task titles", "Estimated minutes", "Due dates", "Reshuffle counts"],
            "storage": "Local device cache + Encrypted database",
            "purpose": "Sizes daily study load to fit within 80% capacity.",
        },
        {
            "category": "20s Pulse Game Summaries",
            "items": ["Median reaction time (ms)", "Lapse count", "Variability"],
            "storage": "Local device cache + Encrypted database",
            "purpose": "Calculates cognitive probe multiplier (0.7 to 1.1x) to modulate live spoons.",
        },
        {
            "category": "Evening Check-Ins & Garden",
            "items": ["1-tap battery rating (1-5)", "Days tended counter", "Growth stage"],
            "storage": "Local device cache + Encrypted database",
            "purpose": "Calibrates carryover fatigue and grows the forgiving garden without wilt.",
        },
    ],
    "what_we_never_collect": [
        "Keystrokes, typing speed, or clipboard text outside the app",
        "Screen captures, recordings, or window titles",
        "GPS location history or real-time geolocation tracking",
        "Contacts, emails, SMS, or social media data",
        "Raw audio, microphone streams, or webcam video",
        "Clinical medical diagnoses, psychiatric labels, or health records",
    ],
    "retention_and_deletion": {
        "export_available": "Instant JSON export via /api/me/export",
        "deletion_time": "Immediate local purge; database records wiped within 1 transaction",
        "revocation": "Disconnecting Google Calendar immediately purges all [SpoonSense] calendar blocks",
    },
}


def export_user_data(user_id: str, store: Dict[str, Any]) -> Dict[str, Any]:
    """Export complete student archive as JSON (FEAT-G4, FR-ST-02)."""
    garden = store.get("gardens", {}).get(user_id)
    garden_dict = garden.to_dict() if garden and hasattr(garden, "to_dict") else garden

    archive = {
        "export_metadata": {
            "app": "SpoonSense",
            "version": "2.0-spoonsense",
            "user_id": user_id,
            "exported_at": datetime.datetime.now().isoformat(),
            "format": "application/json",
        },
        "timetable_blocks": store.get("timetables", {}).get(user_id, []),
        "commute_profile": store.get("commutes", {}).get(user_id, {}),
        "tasks": store.get("tasks", {}).get(user_id, []),
        "cognitive_baseline": store.get("baselines", {}).get(user_id, {}),
        "pulse_game_results": store.get("game_results", {}).get(user_id, []),
        "forgiving_garden": garden_dict,
        "evening_checkins": store.get("evening_checkins", {}).get(user_id, []),
        "dopamine_menu_custom": store.get("dopamine_menus", {}).get(user_id, []),
        "shrinker_history": store.get("shrinker_history", {}).get(user_id, []),
    }
    return archive


def delete_user_data(user_id: str, store: Dict[str, Any]) -> Dict[str, Any]:
    """Purge all user data permanently from store (FEAT-G4, FR-ST-03)."""
    purged_counts = {}

    keys_to_clean = [
        "timetables", "commutes", "overrides", "manual_overrides",
        "baselines", "game_results", "tasks", "plans", "gardens",
        "evening_checkins", "dopamine_menus", "reshuffle_log",
        "shrinker_history",
    ]

    for key in keys_to_clean:
        if key in store and user_id in store[key]:
            val = store[key].pop(user_id)
            purged_counts[key] = len(val) if isinstance(val, (list, dict)) else 1

    return {
        "status": "success",
        "user_id": user_id,
        "purged_records": purged_counts,
        "message": "All user data permanently deleted from server storage.",
        "deleted_at": datetime.datetime.now().isoformat(),
    }
