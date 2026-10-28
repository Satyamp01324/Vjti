"""
SpoonSense Forgiving Garden & Evening Check-in Engine
======================================================

Pure-function engine for:
  [FEAT-E2] The Forgiving Garden (Streak That Never Wilts)
  [FEAT-E3] One-Tap Evening Check-in
  [FEAT-E4] Dopamine Menu (Off-Ramp Rest Drawer)

Zero I/O, zero side effects.

Garden Rules (PRD Section 16.1):
  • The plant NEVER dies or wilts.
  • If user misses 3 days or 3 weeks, status is "Frozen in gentle hibernation".
  • Returning user sees: "Welcome back, we saved your spot in the garden."
  • Streak is labeled as "Days Tended", NEVER "Current Streak".
  • Growth actions: daily login, micro-step completion, resting, evening check-in.

Evening Check-in Rules (PRD Section 11.7):
  • 5 calm battery/face icons (0-4 spoons remaining).
  • One tap saves the result, waters the garden, closes immediately.
  • Optional unpressured 1-line note: "Anything that drained you today?"
  • Visible "Skip" button with zero penalty.
  • < 10 seconds to complete.

Dopamine Menu Rules (PRD Section 16.4):
  • User-curated list of low-friction enjoyable micro-activities.
  • Suggested when live spoons < 3.0.
  • Engaging awards +0.2 to +0.5 spoons and garden XP.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date, timedelta, datetime
from typing import Any, Dict, List, Optional


# ── Constants ─────────────────────────────────────────────────────────────────

GARDEN_XP_LOGIN: int = 5
GARDEN_XP_MICRO_STEP: int = 10
GARDEN_XP_REST: int = 8
GARDEN_XP_EVENING_CHECKIN: int = 15
GARDEN_XP_DOPAMINE_ITEM: int = 5
GARDEN_XP_GAME_PROBE: int = 10

# Growth stages and their XP thresholds
GROWTH_STAGES = [
    {"stage": "seed",       "min_xp": 0,    "label": "Tiny Seed",           "emoji": "🌱"},
    {"stage": "sprout",     "min_xp": 30,   "label": "Little Sprout",       "emoji": "🌿"},
    {"stage": "sapling",    "min_xp": 100,  "label": "Growing Sapling",     "emoji": "🪴"},
    {"stage": "budding",    "min_xp": 250,  "label": "Budding Plant",       "emoji": "🌺"},
    {"stage": "blooming",   "min_xp": 500,  "label": "Full Bloom",          "emoji": "🌸"},
    {"stage": "tree",       "min_xp": 1000, "label": "Mighty Tree",         "emoji": "🌳"},
    {"stage": "grove",      "min_xp": 2500, "label": "Peaceful Grove",      "emoji": "🌲"},
]

HIBERNATION_THRESHOLD_DAYS: int = 3
"""Days of inactivity before the garden enters gentle hibernation."""

# Default dopamine menu items (FEAT-E4)
DEFAULT_DOPAMINE_ITEMS = [
    {"id": "dop_1", "title": "5-minute walk outside",       "emoji": "🚶", "spoon_credit": 0.3, "minutes": 5},
    {"id": "dop_2", "title": "Make a cup of chai",          "emoji": "☕", "spoon_credit": 0.2, "minutes": 5},
    {"id": "dop_3", "title": "Listen to 1 favorite song",   "emoji": "🎵", "spoon_credit": 0.2, "minutes": 4},
    {"id": "dop_4", "title": "Light stretch",               "emoji": "🧘", "spoon_credit": 0.3, "minutes": 5},
    {"id": "dop_5", "title": "Water a plant",               "emoji": "🌱", "spoon_credit": 0.2, "minutes": 3},
    {"id": "dop_6", "title": "Doodle for 3 minutes",        "emoji": "🎨", "spoon_credit": 0.2, "minutes": 3},
    {"id": "dop_7", "title": "Look out the window",         "emoji": "🪟", "spoon_credit": 0.2, "minutes": 2},
    {"id": "dop_8", "title": "Deep breathing (box breath)",  "emoji": "🫁", "spoon_credit": 0.3, "minutes": 3},
]

# Evening check-in battery levels
EVENING_LABELS = [
    {"level": 0, "label": "Empty",     "emoji": "🪫", "description": "Completely spent — rest is the only priority."},
    {"level": 1, "label": "Low",       "emoji": "🔋", "description": "Running on fumes. You showed up, and that counts."},
    {"level": 2, "label": "Steady",    "emoji": "⚡", "description": "Got through the day at a sustainable pace."},
    {"level": 3, "label": "Good",      "emoji": "✨", "description": "Solid energy throughout. Nice rhythm today."},
    {"level": 4, "label": "Energized", "emoji": "🌟", "description": "High capacity day. You're in your element."},
]


# ── Dataclasses ───────────────────────────────────────────────────────────────

@dataclass
class GardenState:
    """Persistent garden state for a user."""
    user_id: str
    total_xp: int = 0
    days_tended: int = 0
    water_count: int = 0
    last_active_date: Optional[str] = None  # ISO date
    is_hibernating: bool = False
    current_stage: str = "seed"
    stage_label: str = "Tiny Seed"
    stage_emoji: str = "🌱"
    streak_message: str = ""
    welcome_back_message: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "total_xp": self.total_xp,
            "days_tended": self.days_tended,
            "water_count": self.water_count,
            "last_active_date": self.last_active_date,
            "is_hibernating": self.is_hibernating,
            "current_stage": self.current_stage,
            "stage_label": self.stage_label,
            "stage_emoji": self.stage_emoji,
            "streak_message": self.streak_message,
            "welcome_back_message": self.welcome_back_message,
            "growth_stages": GROWTH_STAGES,
        }


@dataclass
class EveningCheckin:
    """Result of a single evening check-in."""
    user_id: str
    checkin_date: str  # ISO date
    energy_level: int  # 0-4
    label: str
    emoji: str
    description: str
    optional_note: str = ""
    garden_xp_awarded: int = 0
    skipped: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "checkin_date": self.checkin_date,
            "energy_level": self.energy_level,
            "label": self.label,
            "emoji": self.emoji,
            "description": self.description,
            "optional_note": self.optional_note,
            "garden_xp_awarded": self.garden_xp_awarded,
            "skipped": self.skipped,
        }


# ── Garden Engine (FEAT-E2) ──────────────────────────────────────────────────

def compute_growth_stage(total_xp: int) -> Dict[str, str]:
    """Determine the growth stage based on accumulated XP."""
    current = GROWTH_STAGES[0]
    for stage in GROWTH_STAGES:
        if total_xp >= stage["min_xp"]:
            current = stage
        else:
            break
    return current


def update_garden(
    garden: GardenState,
    action: str,
    today: Optional[str] = None,
) -> GardenState:
    """Process a garden action and return updated state.

    The garden NEVER wilts. Missing days result in gentle hibernation,
    not punishment.

    Args:
        garden: Current garden state.
        action: One of ``login``, ``micro_step``, ``rest``, ``evening_checkin``,
            ``dopamine_item``, ``game_probe``.
        today: ISO date string (defaults to today).

    Returns:
        Updated ``GardenState``.
    """
    today_str = today or date.today().isoformat()

    # XP mapping
    xp_map = {
        "login": GARDEN_XP_LOGIN,
        "micro_step": GARDEN_XP_MICRO_STEP,
        "rest": GARDEN_XP_REST,
        "evening_checkin": GARDEN_XP_EVENING_CHECKIN,
        "dopamine_item": GARDEN_XP_DOPAMINE_ITEM,
        "game_probe": GARDEN_XP_GAME_PROBE,
    }
    xp_gain = xp_map.get(action, 5)

    # Check for hibernation / welcome back
    welcome_back = ""
    was_hibernating = garden.is_hibernating

    if garden.last_active_date:
        try:
            last_active = date.fromisoformat(garden.last_active_date)
            current = date.fromisoformat(today_str)
            days_away = (current - last_active).days

            if days_away >= HIBERNATION_THRESHOLD_DAYS:
                # Was hibernating, now returning
                welcome_back = "Welcome back — we saved your spot in the garden."
                if days_away >= 21:
                    welcome_back = "Welcome back after a long rest. Your garden waited patiently — no wilting, no judgment. Let's tend it together."
                elif days_away >= 7:
                    welcome_back = "Welcome back! Your garden was in gentle hibernation. Everything is just as you left it."
        except (ValueError, TypeError):
            pass

    # Update state
    garden.total_xp += xp_gain
    garden.water_count += 1 if action in ("rest", "evening_checkin", "dopamine_item") else 0
    garden.is_hibernating = False
    garden.welcome_back_message = welcome_back

    # Track days tended (only increment once per day)
    if garden.last_active_date != today_str:
        garden.days_tended += 1

    garden.last_active_date = today_str

    # Compute growth stage
    stage = compute_growth_stage(garden.total_xp)
    garden.current_stage = stage["stage"]
    garden.stage_label = stage["label"]
    garden.stage_emoji = stage["emoji"]

    # Streak message (always positive, never "broken")
    garden.streak_message = f"{garden.days_tended} days tended"

    return garden


def check_hibernation(
    garden: GardenState,
    today: Optional[str] = None,
) -> GardenState:
    """Check if the garden should enter hibernation.

    Called on garden read without an action. Sets hibernation flag but
    NEVER damages the plant.

    Returns:
        Updated ``GardenState`` with hibernation flag and message.
    """
    today_str = today or date.today().isoformat()

    if not garden.last_active_date:
        garden.is_hibernating = False
        garden.streak_message = "Plant your first seed today!"
        return garden

    try:
        last_active = date.fromisoformat(garden.last_active_date)
        current = date.fromisoformat(today_str)
        days_away = (current - last_active).days

        if days_away >= HIBERNATION_THRESHOLD_DAYS:
            garden.is_hibernating = True
            garden.streak_message = f"Frozen in gentle hibernation ({garden.days_tended} days tended total)"
        else:
            garden.is_hibernating = False
            garden.streak_message = f"{garden.days_tended} days tended"
    except (ValueError, TypeError):
        garden.is_hibernating = False
        garden.streak_message = f"{garden.days_tended} days tended"

    return garden


# ── Evening Check-in (FEAT-E3) ───────────────────────────────────────────────

def process_evening_checkin(
    user_id: str,
    energy_level: int,
    optional_note: str = "",
    today: Optional[str] = None,
) -> EveningCheckin:
    """Process a one-tap evening check-in.

    Takes < 10 seconds for the user. One tap on a battery icon (0-4),
    optional text note, done.

    Args:
        user_id: User identifier.
        energy_level: 0 (empty) to 4 (energized).
        optional_note: Optional unpressured one-line note.
        today: ISO date string.

    Returns:
        ``EveningCheckin`` result with garden XP awarded.
    """
    today_str = today or date.today().isoformat()
    level = max(0, min(4, energy_level))
    label_info = EVENING_LABELS[level]

    return EveningCheckin(
        user_id=user_id,
        checkin_date=today_str,
        energy_level=level,
        label=label_info["label"],
        emoji=label_info["emoji"],
        description=label_info["description"],
        optional_note=optional_note,
        garden_xp_awarded=GARDEN_XP_EVENING_CHECKIN,
        skipped=False,
    )


def process_evening_skip(
    user_id: str,
    today: Optional[str] = None,
) -> EveningCheckin:
    """Process a skipped evening check-in with ZERO penalty.

    The skip is valid and respected. No guilt, no broken streak.

    Returns:
        ``EveningCheckin`` with ``skipped=True`` and zero XP.
    """
    today_str = today or date.today().isoformat()

    return EveningCheckin(
        user_id=user_id,
        checkin_date=today_str,
        energy_level=-1,
        label="Skipped",
        emoji="💤",
        description="Skipping is valid. Rest well.",
        optional_note="",
        garden_xp_awarded=0,
        skipped=True,
    )


# ── Dopamine Menu (FEAT-E4) ──────────────────────────────────────────────────

def get_dopamine_menu(
    custom_items: Optional[List[Dict[str, Any]]] = None,
) -> List[Dict[str, Any]]:
    """Return the full dopamine menu with defaults and any custom items.

    Suggested when live spoons < 3.0.

    Args:
        custom_items: User-added items (appended after defaults).

    Returns:
        List of dopamine menu items with id, title, emoji, spoon_credit, minutes.
    """
    items = list(DEFAULT_DOPAMINE_ITEMS)
    if custom_items:
        for item in custom_items:
            items.append({
                "id": item.get("id", f"custom_{len(items)}"),
                "title": item.get("title", "Custom activity"),
                "emoji": item.get("emoji", "✨"),
                "spoon_credit": min(0.5, max(0.1, float(item.get("spoon_credit", 0.2)))),
                "minutes": int(item.get("minutes", 5)),
            })
    return items


def engage_dopamine_item(
    item_id: str,
    menu: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """Process engaging with a dopamine menu item.

    Awards spoon credit (+0.2 to +0.5) and garden XP.

    Args:
        item_id: The selected item's ID.
        menu: The full dopamine menu. Defaults to the default menu.

    Returns:
        Dict with the item details, spoon_credit, and garden_xp.
    """
    if menu is None:
        menu = DEFAULT_DOPAMINE_ITEMS

    item = next((i for i in menu if i["id"] == item_id), None)

    if item is None:
        # Fallback for unknown items
        return {
            "item_id": item_id,
            "title": "Quick break",
            "emoji": "✨",
            "spoon_credit": 0.2,
            "garden_xp": GARDEN_XP_DOPAMINE_ITEM,
            "message": "Nice break! Every pause counts.",
        }

    credit = item.get("spoon_credit", 0.2)
    return {
        "item_id": item_id,
        "title": item["title"],
        "emoji": item["emoji"],
        "spoon_credit": credit,
        "garden_xp": GARDEN_XP_DOPAMINE_ITEM,
        "message": f"Enjoy your {item['title'].lower()}. +{credit} spoons restored.",
    }
