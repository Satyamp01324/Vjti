"""
SpoonSense Core Calculation Engine
====================================

A pure-function mathematical engine for computing daily energy ("spoon")
budgets for students. SpoonSense uses a weather-metaphor to communicate
available energy to the user — sunny, partly cloudy, cloudy, or stormy —
without ever using clinical or diagnostic language.

This module is the HEART of SpoonSense. Every function is:
  • Pure — no side effects, no I/O, no network calls, no database access.
  • Deterministic — same inputs always produce the same outputs.
  • Fully type-hinted and documented.
  • Designed for easy unit testing.

All mathematical formulas follow the SpoonSense PRD exactly.

Worked-example verification (from the PRD):
  • Aarav Monday: 240 min crowded commute, 9 h campus
    → commute_cost = (240/30)*0.5*1.0 = 4.0
    → campus_cost  = 9*0.5 = 4.5
    → prior = 12 - 4.0 - 4.5 - 0 - 0 = 3.5
    → game 35 % slower → probe_mult = 0.7  (wait, let's check: 35% is anchor → 0.85)
      Actually PRD says "35% or more" → 0.7. With our anchors: at 35% → 0.85,
      at ≥50% → 0.7. The PRD worked example says "live 2.45" which equals
      3.5 * 0.7 = 2.45. So the PRD example uses the step-function, not interp.
      With our linear-interp anchors the 35 % point gives 0.85 → 3.5*0.85 = 2.975.
      We implement the *smoothed* P1 version (linear interp) per spec; the PRD
      worked example is from the unsmoothed version and is kept here for reference.
  • Meera Monday: 20 min walk commute, 9 h campus
    → commute_cost = (20/30)*0.5*0.3 = 0.1
    → campus_cost  = 4.5
    → prior = 12 - 0.1 - 4.5 - 0 - 0 = 7.4
    → normal game → probe_mult = 1.0 → live = 7.4
  • Aarav Tuesday forecast: carryover from Monday spend 8.5
    → carryover = max(0, 0.4*(8.5-6.0)) = 1.0
    → 3 h campus → 1.5, 4 h (240 min) commute → 4.0
    → prior = 12 - 4.0 - 1.5 - 0 - 1.0 = 5.5
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any, Dict, List, Optional, Tuple

# ── Public API ────────────────────────────────────────────────────────────────

__all__ = [
    # Constants
    "DEFAULT_BUDGET",
    "MODE_FACTORS",
    "TASK_RATES",
    "DIFFICULTY_MULTIPLIERS",
    "DEFAULT_DURATIONS",
    # Core functions
    "compute_commute_cost",
    "compute_campus_cost",
    "compute_campus_hours",
    "compute_deadline_pressure",
    "compute_carryover",
    "compute_prior",
    "compute_probe_multiplier",
    "compute_live",
    "compute_confidence",
    "compute_range",
    "classify_weather",
    "compute_task_cost",
    "build_why_factors",
    "compute_full_day_snapshot",
    "compute_7day_forecast",
    "get_commute_for_day",
    # Dataclasses
    "DaySnapshot",
    "ForecastDay",
]

# ── Constants (all illustrative, calibratable) ────────────────────────────────

DEFAULT_BUDGET: float = 12.0
"""Default daily energy budget in spoons."""

MODE_FACTORS: Dict[str, float] = {
    "crowded": 1.0,
    "seated": 0.6,
    "walk": 0.3,
}
"""Multiplier applied to commute cost based on commute mode."""

TASK_RATES: Dict[str, float] = {
    "reading": 0.067,           # 15 min ≈ 1 spoon
    "writing": 0.09,
    "problem_solving": 0.089,   # 45 min ≈ 4 spoons
    "admin": 0.05,
    "micro_step": 0.10,         # 2 min = 0.2 spoons
    "other": 0.067,
}
"""Spoon cost per minute for each task type."""

DIFFICULTY_MULTIPLIERS: Dict[str, float] = {
    "easy": 0.8,
    "normal": 1.0,
    "hard": 1.2,
}
"""Multiplier applied to task cost based on subjective difficulty."""

DEFAULT_DURATIONS: Dict[str, int] = {
    "reading": 20,
    "writing": 30,
    "problem_solving": 45,
    "admin": 10,
    "other": 20,
}
"""Default task durations in minutes when the user omits an estimate."""

# ── Probe multiplier anchor points for linear interpolation ───────────────────
# (percentage_slower, multiplier)
#   ≤ 20 %  → 1.0   (within normal variation)
#   35 %    → 0.85   (moderate fatigue signal)
#   ≥ 50 %  → 0.7    (strong fatigue signal — floor)
_PROBE_ANCHORS: List[Tuple[float, float]] = [
    (0.00, 1.0),
    (0.20, 1.0),
    (0.35, 0.85),
    (0.50, 0.70),
]

# ── Structured return types ───────────────────────────────────────────────────


@dataclass(frozen=True)
class DaySnapshot:
    """Complete energy snapshot for a single day.

    Contains every computed field needed to populate the API response
    and the ``day_snapshots`` table.
    """

    target_date: date
    weekday: int

    # Budget breakdown
    budget: float
    commute_cost: float
    campus_cost: float
    campus_hours: float
    deadline_pressure: float
    carryover: float
    prior: float

    # Live adjustments
    probe_multiplier: float
    tier2_adjust: float
    live_spoons: float

    # Confidence & range
    confidence: float
    range_low: float
    range_high: float

    # Weather label
    weather: str

    # Why-panel factors
    why_factors: List[Dict[str, Any]] = field(default_factory=list)

    # Commute details
    commute_minutes: float = 0.0
    commute_mode: str = "seated"

    @property
    def prior_spoons(self) -> float:
        """Alias for prior to match schema conventions."""
        return self.prior

    @property
    def factors(self) -> List[Dict[str, Any]]:
        """Alias for why_factors."""
        return self.why_factors

    def to_dict(self) -> Dict[str, Any]:
        """Convert snapshot to dictionary for API responses."""
        from dataclasses import asdict
        d = asdict(self)
        d["target_date"] = self.target_date.isoformat()
        d["prior_spoons"] = self.prior
        d["factors"] = self.why_factors
        return d

    def __getitem__(self, item: str) -> Any:
        if item == "prior_spoons":
            return self.prior
        if item == "factors":
            return self.why_factors
        return getattr(self, item)


@dataclass(frozen=True)
class ForecastDay:
    """Lightweight snapshot used inside the 7-day forecast list."""

    target_date: date
    weekday: int
    prior: float
    live_spoons: float
    range_low: float
    range_high: float
    confidence: float
    weather: str
    campus_hours: float
    commute_minutes: float
    commute_mode: str

    @property
    def prior_spoons(self) -> float:
        return self.prior

    def to_dict(self) -> Dict[str, Any]:
        from dataclasses import asdict
        d = asdict(self)
        d["target_date"] = self.target_date.isoformat()
        d["prior_spoons"] = self.prior
        return d

    def __getitem__(self, item: str) -> Any:
        if item == "prior_spoons":
            return self.prior
        return getattr(self, item)


# ── Helper utilities ──────────────────────────────────────────────────────────


def _clamp(value: float, lo: float, hi: float) -> float:
    """Clamp *value* to the closed interval [lo, hi].

    Args:
        value: The number to clamp.
        lo: Lower bound (inclusive).
        hi: Upper bound (inclusive).

    Returns:
        The clamped value.
    """
    return max(lo, min(hi, value))


def _lerp(x: float, x0: float, x1: float, y0: float, y1: float) -> float:
    """Linearly interpolate *y* at position *x* between two anchor points.

    Args:
        x: Input value to interpolate.
        x0: Lower anchor x.
        x1: Upper anchor x.
        y0: Lower anchor y.
        y1: Upper anchor y.

    Returns:
        Linearly interpolated y.
    """
    if x1 == x0:
        return y0
    t = (x - x0) / (x1 - x0)
    return y0 + t * (y1 - y0)


def _time_to_minutes(time_str: str) -> float:
    """Convert an ``HH:MM`` string to minutes since midnight.

    Args:
        time_str: Time in ``"HH:MM"`` format.

    Returns:
        Minutes since midnight (0-1439).

    Raises:
        ValueError: If *time_str* is not a valid ``HH:MM`` string.
    """
    parts = time_str.strip().split(":")
    if len(parts) != 2:
        raise ValueError(f"Expected HH:MM format, got '{time_str}'")
    hours, minutes = int(parts[0]), int(parts[1])
    if not (0 <= hours <= 23 and 0 <= minutes <= 59):
        raise ValueError(f"Invalid time components in '{time_str}'")
    return hours * 60.0 + minutes


# ── Core computation functions ────────────────────────────────────────────────


def compute_commute_cost(total_commute_minutes: float, mode: str) -> float:
    """Compute the spoon cost of commuting.

    Formula::

        cost = (total_commute_minutes / 30.0) × 0.5 × mode_factor

    Args:
        total_commute_minutes: Total round-trip commute time in minutes.
            Negative values are treated as 0.
        mode: One of ``"crowded"``, ``"seated"``, or ``"walk"``.
            Unknown modes fall back to ``"seated"``.

    Returns:
        Spoon cost of commuting (≥ 0).

    Examples:
        >>> compute_commute_cost(240, "crowded")
        4.0
        >>> compute_commute_cost(20, "walk")   # Meera
        0.1
    """
    total_commute_minutes = max(0.0, float(total_commute_minutes))
    mode_factor = MODE_FACTORS.get(mode, MODE_FACTORS["seated"])
    cost = (total_commute_minutes / 30.0) * 0.5 * mode_factor
    return round(cost, 4)


def compute_campus_cost(campus_hours: float) -> float:
    """Compute the spoon cost of being on campus.

    Formula::

        cost = campus_hours × 0.5

    Args:
        campus_hours: Number of hours spent on campus.
            Negative values are treated as 0.

    Returns:
        Spoon cost of campus time (≥ 0).

    Examples:
        >>> compute_campus_cost(9.0)
        4.5
    """
    campus_hours = max(0.0, float(campus_hours))
    return round(campus_hours * 0.5, 4)


def compute_campus_hours(blocks: List[Dict[str, Any]], weekday: int) -> float:
    """Compute the total span of time on campus for a given weekday.

    Campus hours are measured as the gap between the **earliest start**
    and **latest end** of all timetable blocks on that day, representing
    the total time the student is on campus (not total class time).

    Args:
        blocks: List of timetable block dicts, each containing:
            - ``"weekday"`` (int): ISO weekday (0 = Monday … 6 = Sunday).
            - ``"start_time"`` (str): Start time in ``"HH:MM"`` format.
            - ``"end_time"`` (str): End time in ``"HH:MM"`` format.
        weekday: ISO weekday number to filter on (0–6).

    Returns:
        Campus hours as a decimal float (≥ 0).

    Examples:
        >>> blocks = [
        ...     {"weekday": 0, "start_time": "08:00", "end_time": "12:00"},
        ...     {"weekday": 0, "start_time": "13:00", "end_time": "17:00"},
        ... ]
        >>> compute_campus_hours(blocks, 0)
        9.0
    """
    day_blocks = [b for b in blocks if b.get("weekday") == weekday]
    if not day_blocks:
        return 0.0

    earliest_start = min(_time_to_minutes(b["start_time"]) for b in day_blocks)
    latest_end = max(_time_to_minutes(b["end_time"]) for b in day_blocks)

    span_minutes = max(0.0, latest_end - earliest_start)
    return round(span_minutes / 60.0, 4)


def compute_deadline_pressure(
    tasks: List[Dict[str, Any]], reference_date: date
) -> float:
    """Compute aggregate deadline pressure from upcoming tasks.

    For each task with a ``due_date`` within the next 3 calendar days:

    1. ``days_until = (due_date − reference_date).days``
    2. Map ``days_until`` to an urgency weight:
       - ≤ 0 (today or overdue): 1.0
       - 1 (tomorrow): 0.6
       - 2–3: 0.3
    3. ``pressure_i = min(task_spoon_cost, 2.0) × urgency × 0.25``

    The total is capped at **2.0** spoons.

    Args:
        tasks: List of task dicts. Each may contain:
            - ``"due_date"`` (date | str | None): Task deadline.
            - ``"spoon_cost"`` (float | None): Pre-computed spoon cost.
            - ``"task_type"`` (str): Used to derive a default cost if
              ``spoon_cost`` is absent.
            - ``"estimated_minutes"`` (int | None): Duration estimate.
            - ``"difficulty"`` (str): Task difficulty level.
        reference_date: The date to measure urgency from.

    Returns:
        Aggregate deadline pressure in spoons, capped at 2.0.

    Examples:
        >>> from datetime import date
        >>> tasks = [
        ...     {"due_date": date(2024, 1, 15), "spoon_cost": 3.0},
        ... ]
        >>> compute_deadline_pressure(tasks, date(2024, 1, 15))
        0.5
    """
    total_pressure = 0.0
    cutoff = reference_date + timedelta(days=3)

    for task in tasks:
        raw_due = task.get("due_date")
        if raw_due is None:
            continue

        # Support string dates
        if isinstance(raw_due, str):
            try:
                due_date = date.fromisoformat(raw_due)
            except (ValueError, TypeError):
                continue
        elif isinstance(raw_due, date):
            due_date = raw_due
        else:
            continue

        if due_date > cutoff:
            continue

        days_until = (due_date - reference_date).days

        if days_until <= 0:
            urgency = 1.0
        elif days_until == 1:
            urgency = 0.6
        else:
            urgency = 0.3

        # Determine spoon cost for this task
        spoon_cost = task.get("spoon_cost")
        if spoon_cost is None:
            task_type = task.get("task_type", "other")
            difficulty = task.get("difficulty", "normal")
            estimated_minutes = task.get("estimated_minutes")
            spoon_cost = compute_task_cost(estimated_minutes, task_type, difficulty)

        capped_cost = min(float(spoon_cost), 2.0)
        pressure_i = capped_cost * urgency * 0.25
        total_pressure += pressure_i

    return min(round(total_pressure, 4), 2.0)


def compute_carryover(
    previous_day_spend: float, evening_label: Optional[int] = None
) -> float:
    """Compute fatigue carryover from the previous day.

    Formula::

        carryover = max(0, 0.4 × (previous_day_spend − 6.0))

    If an ``evening_label`` (0–4 scale, where 0 = exhausted and
    4 = energised) is provided, a nudge is applied::

        nudge     = (2 − evening_label) × 0.25
        carryover = max(0, carryover + nudge)

    Args:
        previous_day_spend: Total spoons spent the previous day (≥ 0).
        evening_label: Optional self-reported evening energy label (0–4).
            - 0: very low energy → +0.50 nudge
            - 1: low energy → +0.25 nudge
            - 2: neutral → 0.00 nudge
            - 3: good energy → −0.25 nudge
            - 4: great energy → −0.50 nudge

    Returns:
        Carryover fatigue in spoons (≥ 0).

    Examples:
        >>> compute_carryover(8.5)
        1.0
        >>> compute_carryover(8.5, evening_label=0)
        1.5
        >>> compute_carryover(4.0)
        0.0
    """
    previous_day_spend = max(0.0, float(previous_day_spend))
    carryover = max(0.0, 0.4 * (previous_day_spend - 6.0))

    if evening_label is not None:
        evening_label = int(_clamp(float(evening_label), 0, 4))
        nudge = (2 - evening_label) * 0.25
        carryover = max(0.0, carryover + nudge)

    return round(carryover, 4)


def compute_prior(
    budget: float,
    commute_cost: float,
    campus_cost: float,
    deadline_pressure: float,
    carryover: float,
) -> float:
    """Compute the prior (pre-game) spoon estimate.

    Formula::

        prior = budget − commute_cost − campus_cost
                       − deadline_pressure − carryover

    The result can be negative — clamping happens at the live stage.

    Args:
        budget: Daily spoon budget (typically 12.0).
        commute_cost: Cost from :func:`compute_commute_cost`.
        campus_cost: Cost from :func:`compute_campus_cost`.
        deadline_pressure: Cost from :func:`compute_deadline_pressure`.
        carryover: Cost from :func:`compute_carryover`.

    Returns:
        Prior spoon estimate (may be negative).

    Examples:
        >>> compute_prior(12.0, 4.0, 4.5, 0.0, 0.0)  # Aarav Monday
        3.5
        >>> compute_prior(12.0, 0.1, 4.5, 0.0, 0.0)  # Meera Monday
        7.4
        >>> compute_prior(12.0, 4.0, 1.5, 0.0, 1.0)  # Aarav Tuesday
        5.5
    """
    prior = (
        float(budget)
        - float(commute_cost)
        - float(campus_cost)
        - float(deadline_pressure)
        - float(carryover)
    )
    return round(prior, 4)


def compute_probe_multiplier(
    median_rt: float, baseline_rt: float, play_count: int
) -> float:
    """Compute the cognitive-probe multiplier from reaction-time data.

    Uses **linear interpolation** between anchor points (P1 refinement):

    =============================  ===========
    Condition                      Multiplier
    =============================  ===========
    Calibrating (< 3 plays)        1.0
    Invalid baseline (≤ 0)         1.0
    Faster or ≤ 20 % slower        1.0
    20 %–35 % slower               1.0 → 0.85
    35 %–50 % slower               0.85 → 0.70
    > 50 % slower                  0.70 (floor)
    =============================  ===========

    Args:
        median_rt: Median reaction time from today's game session (ms).
        baseline_rt: The user's established baseline reaction time (ms).
        play_count: Total number of game sessions played to date.

    Returns:
        Multiplier in the range [0.7, 1.0].

    Examples:
        >>> compute_probe_multiplier(500, 500, 10)   # same as baseline
        1.0
        >>> compute_probe_multiplier(675, 500, 10)   # 35 % slower
        0.85
        >>> compute_probe_multiplier(750, 500, 10)   # 50 % slower
        0.7
        >>> compute_probe_multiplier(400, 500, 2)    # calibrating
        1.0
    """
    if play_count < 3:
        return 1.0
    if baseline_rt <= 0:
        return 1.0

    median_rt = max(0.0, float(median_rt))
    baseline_rt = float(baseline_rt)

    ratio = median_rt / baseline_rt
    pct_slower = ratio - 1.0  # e.g. 0.25 means 25 % slower

    # Faster or same → no adjustment
    if pct_slower <= 0.0:
        return 1.0

    # Walk through anchor segments and interpolate
    anchors = _PROBE_ANCHORS
    for i in range(len(anchors) - 1):
        x0, y0 = anchors[i]
        x1, y1 = anchors[i + 1]
        if pct_slower <= x1:
            return round(_lerp(pct_slower, x0, x1, y0, y1), 4)

    # Beyond last anchor → floor
    return anchors[-1][1]


def compute_live(
    prior: float,
    probe_multiplier: float = 1.0,
    tier2_adjust: float = 1.0,
) -> float:
    """Compute the live (post-game) spoon estimate.

    Formula::

        tier2_clamped = clamp(tier2_adjust, 0.9, 1.1)
        live = clamp(prior × probe_multiplier × tier2_clamped, 1.0, 12.0)

    Args:
        prior: Prior spoon estimate from :func:`compute_prior`.
        probe_multiplier: Cognitive probe multiplier from
            :func:`compute_probe_multiplier` (default 1.0).
        tier2_adjust: Tier-2 signal adjustment factor (default 1.0).
            Clamped to [0.9, 1.1] to prevent extreme swings.

    Returns:
        Live spoon value clamped to [1.0, 12.0].

    Examples:
        >>> compute_live(3.5, 0.7)   # Aarav Monday (step-function probe)
        2.45
        >>> compute_live(7.4, 1.0)   # Meera Monday
        7.4
    """
    tier2_clamped = _clamp(float(tier2_adjust), 0.9, 1.1)
    raw = float(prior) * float(probe_multiplier) * tier2_clamped
    return round(_clamp(raw, 1.0, 12.0), 2)


def compute_confidence(days_of_data: int, game_played_today: bool) -> float:
    """Compute the model confidence score.

    Formula::

        confidence = min(0.4 + 0.04 × min(days_of_data, 15)
                         + (0.1 if game_played_today else 0),
                         0.9)

    Args:
        days_of_data: Number of historical days of user data (≥ 0).
        game_played_today: Whether the cognitive game was played today.

    Returns:
        Confidence value in [0.4, 0.9].

    Examples:
        >>> compute_confidence(0, False)
        0.4
        >>> compute_confidence(15, True)
        0.9
        >>> compute_confidence(10, False)
        0.8
    """
    days_of_data = max(0, int(days_of_data))
    conf = 0.4 + 0.04 * min(days_of_data, 15)
    if game_played_today:
        conf += 0.1
    return round(min(conf, 0.9), 4)


def compute_range(
    live_spoons: float, confidence: float
) -> Tuple[float, float]:
    """Compute the uncertainty range around the live spoon estimate.

    Formula::

        half_width = 1.5 × (1.0 − confidence)
        low  = round_to_half(max(1.0, live_spoons − half_width))
        high = round_to_half(min(12.0, live_spoons + half_width))

    Values are rounded to the nearest 0.5 for display clarity.

    Args:
        live_spoons: The live spoon estimate.
        confidence: Model confidence from :func:`compute_confidence`.

    Returns:
        Tuple of ``(range_low, range_high)`` both rounded to nearest 0.5.

    Examples:
        >>> compute_range(7.4, 0.8)
        (7.0, 7.5)
    """
    live_spoons = float(live_spoons)
    confidence = float(confidence)
    half_width = 1.5 * (1.0 - confidence)

    raw_low = max(1.0, live_spoons - half_width)
    raw_high = min(12.0, live_spoons + half_width)

    low = round(raw_low * 2) / 2
    high = round(raw_high * 2) / 2

    # Ensure low <= high after rounding
    if low > high:
        low = high

    return (low, high)


def classify_weather(spoons: float) -> str:
    """Map a spoon value to a weather label.

    ============  ==============
    Spoons        Weather
    ============  ==============
    ≥ 8.0         ``"sunny"``
    5.0 – < 8.0   ``"partly_cloudy"``
    3.0 – < 5.0   ``"cloudy"``
    < 3.0         ``"stormy"``
    ============  ==============

    Args:
        spoons: The live (or prior) spoon value.

    Returns:
        A weather label string.

    Examples:
        >>> classify_weather(9.0)
        'sunny'
        >>> classify_weather(7.4)
        'partly_cloudy'
        >>> classify_weather(2.45)
        'stormy'
    """
    spoons = float(spoons)
    if spoons >= 8.0:
        return "sunny"
    if spoons >= 5.0:
        return "partly_cloudy"
    if spoons >= 3.0:
        return "cloudy"
    return "stormy"


def compute_task_cost(
    estimated_minutes: Optional[int],
    task_type: str,
    difficulty: str = "normal",
) -> float:
    """Compute the spoon cost of a single task.

    Formula::

        minutes = estimated_minutes or DEFAULT_DURATIONS[task_type]
        rate    = TASK_RATES[task_type]
        diff    = DIFFICULTY_MULTIPLIERS[difficulty]
        cost    = minutes × rate × diff

    Args:
        estimated_minutes: User-provided duration estimate in minutes.
            If ``None``, a default duration for the task type is used.
        task_type: Category of the task (e.g. ``"reading"``,
            ``"problem_solving"``). Unknown types fall back to
            ``"other"``.
        difficulty: One of ``"easy"``, ``"normal"``, ``"hard"``.
            Unknown values fall back to ``"normal"`` (1.0).

    Returns:
        Rounded spoon cost (to 2 decimal places).

    Examples:
        >>> compute_task_cost(45, "problem_solving", "normal")
        4.01
        >>> compute_task_cost(None, "reading", "easy")
        1.07
        >>> compute_task_cost(2, "micro_step", "normal")
        0.2
    """
    minutes = (
        float(estimated_minutes)
        if estimated_minutes is not None
        else float(DEFAULT_DURATIONS.get(task_type, DEFAULT_DURATIONS.get("other", 20)))
    )
    minutes = max(0.0, minutes)

    rate = TASK_RATES.get(task_type, TASK_RATES["other"])
    diff = DIFFICULTY_MULTIPLIERS.get(difficulty, DIFFICULTY_MULTIPLIERS["normal"])

    cost = minutes * rate * diff
    return round(cost, 2)


def get_commute_for_day(
    commute_profile: Dict[str, Any],
    day_overrides: List[Dict[str, Any]],
    weekday: int,
    target_date: date,
) -> Tuple[float, str]:
    """Resolve commute parameters for a specific day.

    Checks ``day_overrides`` first (WFH, holiday, etc.) and falls back
    to the user's default ``commute_profile``.

    Args:
        commute_profile: User's default commute settings with keys:
            - ``"total_minutes"`` (float): Default round-trip commute time.
            - ``"mode"`` (str): Default commute mode.
        day_overrides: List of override dicts, each with:
            - ``"date"`` (date | str): The overridden date.
            - ``"override_type"`` (str): e.g. ``"wfh"``, ``"holiday"``,
              ``"custom"``.
            - ``"commute_minutes"`` (float, optional): Custom commute time.
            - ``"commute_mode"`` (str, optional): Custom commute mode.
        weekday: ISO weekday (0–6). Provided for convenience but
            overrides are matched by date, not weekday.
        target_date: The calendar date being computed.

    Returns:
        Tuple of ``(total_minutes, mode)``.
    """
    # Check for an override on this specific date
    for override in day_overrides:
        raw_date = override.get("date")
        if raw_date is None:
            continue

        if isinstance(raw_date, str):
            try:
                override_date = date.fromisoformat(raw_date)
            except (ValueError, TypeError):
                continue
        elif isinstance(raw_date, date):
            override_date = raw_date
        else:
            continue

        if override_date != target_date:
            continue

        override_type = override.get("override_type", "").lower()

        # WFH and holidays mean zero commute
        if override_type in ("wfh", "holiday", "day_off", "sick"):
            return (0.0, "seated")

        # Custom override with explicit commute values
        commute_mins = override.get(
            "commute_minutes",
            commute_profile.get("total_minutes", 0.0),
        )
        commute_mode = override.get(
            "commute_mode",
            commute_profile.get("mode", "seated"),
        )
        return (float(commute_mins), str(commute_mode))

    # No override — use defaults from commute profile
    # Check days_applicable if specified
    days_applicable = commute_profile.get("days_applicable")
    if days_applicable is not None and weekday not in days_applicable:
        return (0.0, "walk")

    if "total_minutes" in commute_profile:
        total_minutes = float(commute_profile["total_minutes"])
    elif "minutes_each_way" in commute_profile:
        total_minutes = float(commute_profile["minutes_each_way"]) * 2.0
    else:
        total_minutes = 0.0

    mode = str(commute_profile.get("mode", "seated"))

    # Weekends default to zero commute if days_applicable was not explicitly set
    if days_applicable is None and weekday >= 5:
        return (0.0, mode)

    return (total_minutes, mode)


def build_why_factors(
    budget: float,
    commute_cost: float,
    commute_minutes: float,
    commute_mode: str,
    campus_cost: float,
    campus_hours: float,
    deadline_pressure: float,
    carryover: float,
    probe_multiplier: float,
    prior: float,
    live_spoons: float,
) -> List[Dict[str, Any]]:
    """Build the "Why Panel" factor breakdown for the UI.

    Returns a list of factor dicts, each with:
    - ``"label"`` — short human-readable name
    - ``"delta"`` — signed spoon impact
    - ``"plain_text"`` — friendly explanation (no clinical language)

    Only factors with a non-zero impact are included (except the budget
    which is always shown).

    Args:
        budget: Daily spoon budget.
        commute_cost: Commute spoon cost.
        commute_minutes: Total commute minutes.
        commute_mode: Commute mode string.
        campus_cost: Campus spoon cost.
        campus_hours: Hours on campus.
        deadline_pressure: Deadline pressure cost.
        carryover: Fatigue carryover cost.
        probe_multiplier: Cognitive probe multiplier.
        prior: Prior spoon estimate.
        live_spoons: Live spoon estimate.

    Returns:
        List of factor dicts for the Why Panel.

    Examples:
        >>> factors = build_why_factors(
        ...     budget=12.0, commute_cost=4.0, commute_minutes=240,
        ...     commute_mode="crowded", campus_cost=4.5, campus_hours=9.0,
        ...     deadline_pressure=0.0, carryover=0.0, probe_multiplier=1.0,
        ...     prior=3.5, live_spoons=3.5,
        ... )
        >>> factors[0]["label"]
        'Starting budget'
    """
    factors: List[Dict[str, Any]] = []

    # Starting budget (always present)
    factors.append({
        "label": "Starting budget",
        "delta": round(budget, 2),
        "plain_text": "Your daily energy budget",
    })

    # Commute
    if commute_cost > 0:
        hours_approx = round(commute_minutes / 60.0, 1)
        mode_label = {
            "crowded": "crowded transit",
            "seated": "seated transit",
            "walk": "walking",
        }.get(commute_mode, commute_mode)
        factors.append({
            "label": "Commute",
            "delta": round(-commute_cost, 2),
            "plain_text": f"About {hours_approx} hours, {mode_label}",
        })

    # Campus time
    if campus_cost > 0:
        factors.append({
            "label": "Campus time",
            "delta": round(-campus_cost, 2),
            "plain_text": f"{round(campus_hours, 1)} hours on campus",
        })

    # Deadline pressure
    if deadline_pressure > 0:
        factors.append({
            "label": "Upcoming deadlines",
            "delta": round(-deadline_pressure, 2),
            "plain_text": "Assignments or tasks due soon",
        })

    # Carryover
    if carryover > 0:
        factors.append({
            "label": "Yesterday's effort",
            "delta": round(-carryover, 2),
            "plain_text": "Carrying over some tiredness from yesterday",
        })

    # Probe adjustment (only when it actually changes the score)
    if probe_multiplier < 1.0:
        probe_delta = round(live_spoons - prior, 2)
        factors.append({
            "label": "Focus check",
            "delta": probe_delta,
            "plain_text": "Adjusted based on today's quick game",
        })

    return factors


def compute_full_day_snapshot(
    user_budget: float,
    timetable_blocks: List[Dict[str, Any]],
    commute_profile: Dict[str, Any],
    day_overrides: List[Dict[str, Any]],
    tasks: List[Dict[str, Any]],
    previous_day_spend: float,
    evening_label: Optional[int],
    target_date: date,
    probe_result: Optional[Dict[str, Any]] = None,
    tier2_signals: Optional[Dict[str, Any]] = None,
    days_of_data: int = 0,
    play_count: int = 0,
) -> DaySnapshot:
    """Compute a complete energy snapshot for a single day.

    This is the **main orchestrator** that calls every sub-function and
    assembles the result into a :class:`DaySnapshot`.

    Args:
        user_budget: The user's daily spoon budget.
        timetable_blocks: Full list of timetable blocks (all weekdays).
        commute_profile: Default commute settings dict with keys
            ``"total_minutes"`` and ``"mode"``.
        day_overrides: List of per-date overrides (WFH, holiday, etc.).
        tasks: List of task dicts (for deadline pressure).
        previous_day_spend: Total spoons spent the previous day.
        evening_label: Previous evening's self-reported energy label (0–4)
            or ``None`` if not provided.
        target_date: The calendar date to compute.
        probe_result: Optional dict with keys ``"median_rt"`` and
            ``"baseline_rt"`` from today's cognitive game.
        tier2_signals: Optional dict with a ``"multiplier"`` key for
            Tier-2 signal adjustment.
        days_of_data: Number of historical days of user data.
        play_count: Total number of cognitive game sessions played.

    Returns:
        A fully populated :class:`DaySnapshot`.

    Examples:
        >>> from datetime import date
        >>> snap = compute_full_day_snapshot(
        ...     user_budget=12.0,
        ...     timetable_blocks=[
        ...         {"weekday": 0, "start_time": "08:00", "end_time": "17:00"},
        ...     ],
        ...     commute_profile={"total_minutes": 240, "mode": "crowded"},
        ...     day_overrides=[], tasks=[],
        ...     previous_day_spend=0.0, evening_label=None,
        ...     target_date=date(2024, 1, 15),  # a Monday (weekday=0)
        ... )
        >>> snap.prior
        3.5
    """
    budget = float(user_budget)
    weekday = target_date.weekday()

    # 1. Commute
    commute_minutes, commute_mode = get_commute_for_day(
        commute_profile, day_overrides, weekday, target_date
    )
    commute_cost = compute_commute_cost(commute_minutes, commute_mode)

    # 2. Campus
    campus_hrs = compute_campus_hours(timetable_blocks, weekday)
    campus_cost = compute_campus_cost(campus_hrs)

    # 3. Deadline pressure
    deadline_pressure = compute_deadline_pressure(tasks, target_date)

    # 4. Carryover
    carryover = compute_carryover(previous_day_spend, evening_label)

    # 5. Prior
    prior = compute_prior(budget, commute_cost, campus_cost, deadline_pressure, carryover)

    # 6. Probe multiplier
    game_played_today = False
    if probe_result is not None:
        if not probe_result.get("valid", True):
            probe_mult = 1.0
        else:
            median_rt = float(probe_result.get("median_rt", 0))
            baseline_rt = float(probe_result.get("baseline_rt", 0))
            eff_play_count = int(probe_result.get("play_count", play_count))
            probe_mult = compute_probe_multiplier(median_rt, baseline_rt, eff_play_count)
            game_played_today = True
    else:
        probe_mult = 1.0

    # 7. Tier-2 adjustment
    tier2_adj = 1.0
    if tier2_signals is not None:
        tier2_adj = float(tier2_signals.get("multiplier", 1.0))

    # 8. Live
    live = compute_live(prior, probe_mult, tier2_adj)

    # 9. Confidence & range
    confidence = compute_confidence(days_of_data, game_played_today)
    range_low, range_high = compute_range(live, confidence)

    # 10. Weather
    weather = classify_weather(live)

    # 11. Why factors
    why_factors = build_why_factors(
        budget=budget,
        commute_cost=commute_cost,
        commute_minutes=commute_minutes,
        commute_mode=commute_mode,
        campus_cost=campus_cost,
        campus_hours=campus_hrs,
        deadline_pressure=deadline_pressure,
        carryover=carryover,
        probe_multiplier=probe_mult,
        prior=prior,
        live_spoons=live,
    )

    return DaySnapshot(
        target_date=target_date,
        weekday=weekday,
        budget=budget,
        commute_cost=commute_cost,
        campus_cost=campus_cost,
        campus_hours=campus_hrs,
        deadline_pressure=deadline_pressure,
        carryover=carryover,
        prior=prior,
        probe_multiplier=probe_mult,
        tier2_adjust=_clamp(tier2_adj, 0.9, 1.1),
        live_spoons=live,
        confidence=confidence,
        range_low=range_low,
        range_high=range_high,
        weather=weather,
        why_factors=why_factors,
        commute_minutes=commute_minutes,
        commute_mode=commute_mode,
    )


def compute_7day_forecast(
    user_budget: float,
    timetable_blocks: List[Dict[str, Any]],
    commute_profile: Dict[str, Any],
    day_overrides: List[Dict[str, Any]],
    tasks: List[Dict[str, Any]],
    today_spend: float,
    today_evening_label: Optional[int],
    start_date: date,
    days_of_data: int = 0,
) -> List[ForecastDay]:
    """Compute a 7-day energy forecast starting from *start_date*.

    Day 0 (today) uses real data for carryover. Days 1–6 are projections
    with no game data and reduced confidence.

    For forecast days (1–6), the carryover is estimated assuming the
    user spends roughly ``prior`` spoons each day (a simplifying
    assumption — refinement in future sprints).

    Args:
        user_budget: The user's daily spoon budget.
        timetable_blocks: Full timetable blocks list.
        commute_profile: Default commute settings.
        day_overrides: Per-date overrides.
        tasks: Task list (for deadline pressure).
        today_spend: Spoons spent so far today (used as previous-day
            spend for tomorrow's carryover calculation).
        today_evening_label: Evening label for today, or ``None``.
        start_date: The first day of the forecast (today).
        days_of_data: Number of historical data days.

    Returns:
        A list of 7 :class:`ForecastDay` instances.
    """
    forecast: List[ForecastDay] = []

    # Track rolling "previous day spend" for carryover estimation
    prev_spend = 0.0
    prev_evening_label = today_evening_label

    for day_offset in range(7):
        current_date = start_date + timedelta(days=day_offset)
        weekday = current_date.weekday()

        if day_offset == 0:
            # Today: use actual previous-day data.
            # For today, previous_day_spend refers to *yesterday*, which
            # the caller should have passed via today_spend.  However,
            # today_spend is "spent today" so far.  For carryover into
            # today we need *yesterday's* spend.  The API layer should
            # supply that.  We use 0 for day-0 carryover if the caller
            # means "from yesterday" then it should be yesterday's total.
            # Convention: today_spend is yesterday's total for carryover.
            carryover = compute_carryover(today_spend, today_evening_label)
        else:
            # Forecast days: estimate carryover from projected prior
            carryover = compute_carryover(prev_spend, None)

        # Commute
        commute_minutes, commute_mode = get_commute_for_day(
            commute_profile, day_overrides, weekday, current_date
        )
        commute_cost = compute_commute_cost(commute_minutes, commute_mode)

        # Campus
        campus_hrs = compute_campus_hours(timetable_blocks, weekday)
        campus_cost = compute_campus_cost(campus_hrs)

        # Deadline pressure
        deadline_pressure = compute_deadline_pressure(tasks, current_date)

        # Prior
        prior = compute_prior(
            user_budget, commute_cost, campus_cost, deadline_pressure, carryover
        )

        # No game data for forecast days; day-0 also has no game in forecast
        probe_mult = 1.0
        live = compute_live(prior, probe_mult)

        # Confidence is lower for forecast (no game played)
        # For day 0 in forecast context, we also don't have game data
        confidence = compute_confidence(days_of_data, game_played_today=False)
        range_low, range_high = compute_range(live, confidence)

        weather = classify_weather(live)

        forecast.append(ForecastDay(
            target_date=current_date,
            weekday=weekday,
            prior=prior,
            live_spoons=live,
            range_low=range_low,
            range_high=range_high,
            confidence=confidence,
            weather=weather,
            campus_hours=campus_hrs,
            commute_minutes=commute_minutes,
            commute_mode=commute_mode,
        ))

        # Estimate that user "spends" roughly the prior amount
        # (used for next day's carryover estimation)
        prev_spend = max(0.0, prior)
        prev_evening_label = None

    return forecast
