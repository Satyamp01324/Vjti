"""
SpoonSense Capacity-Sized Day Planner & Reshuffler
====================================================

Pure-function engine for:
  [FEAT-C1] Task Cost Estimation (delegates to spoon_engine.compute_task_cost)
  [FEAT-C2] Capacity-Sized Day Planning Algorithm
  [FEAT-C3] Automatic Low-Capacity Reshuffler
  [FEAT-C4] Polite Extension-Email Generator
  [FEAT-C5] Rest as a First-Class Schedule Item

Zero I/O, zero side effects.  All state flows in via arguments and out via
return values so this module is trivially testable.

Planning Rules (from PRD Section 14):
  1. Planned Capacity = live_spoons × (1 - reserve), default reserve = 20%.
  2. Order pending tasks by earliest hard deadline, then by cost descending.
  3. Greedily fit tasks into earliest day with remaining capacity.
  4. Never schedule past 80 % of a day's capacity (the reserve is mandatory).
  5. Deep-work blocks target morning peak hours outside commute windows.

Reshuffler Rules (from PRD Section 14.5-14.6):
  • Triggers when live_spoons < planned_load × 0.8 (20 % shortfall).
  • Moves highest-cost, least-urgent *flexible* tasks to the nearest future
    day forecast > 6 spoons.
  • Never auto-moves tasks across a fixed external deadline.
  • If a task has been reshuffled ≥ 3 times, offers to "shrink it" instead.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import date, timedelta
from typing import Any, Dict, List, Optional, Tuple

from core.spoon_engine import (
    compute_task_cost,
    TASK_RATES,
    DIFFICULTY_MULTIPLIERS,
    DEFAULT_DURATIONS,
    DEFAULT_BUDGET,
)


# ── Constants ─────────────────────────────────────────────────────────────────

RESERVE_FRACTION: float = 0.20
"""Breathing room reserve: 20 % of daily capacity is protected from scheduling."""

REST_SPOON_CREDIT: float = 0.5
"""Spoons credited per 20-minute rest block (FEAT-C5)."""

DEEP_WORK_PEAK_START: int = 9   # 9 AM
DEEP_WORK_PEAK_END: int = 12    # 12 PM (noon)

RESHUFFLE_THRESHOLD: float = 0.80
"""Reshuffle triggers when live_spoons < planned_load × this fraction."""

SHRINK_OFFER_RESHUFFLE_COUNT: int = 3
"""Offer to micro-shrink a task after this many reshuffles."""


# ── Dataclasses ───────────────────────────────────────────────────────────────

@dataclass
class PlannedTask:
    """A task annotated with its computed spoon cost and scheduling metadata."""
    task_id: str
    title: str
    task_type: str = "other"
    difficulty: str = "normal"
    estimated_minutes: Optional[int] = None
    due_date: Optional[str] = None          # ISO date string or None
    is_fixed_deadline: bool = False         # Hard external deadline (prof submission)
    is_flexible: bool = True                # Can be reshuffled
    is_rest_block: bool = False             # Rest as first-class item (FEAT-C5)
    spoon_cost: float = 0.0
    scheduled_date: Optional[str] = None    # ISO date string after planning
    scheduled_slot: Optional[str] = None    # "morning" | "afternoon" | "evening"
    reshuffle_count: int = 0
    completed: bool = False
    status: str = "pending"                 # "pending" | "scheduled" | "reshuffled" | "completed" | "shrink_offered"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "title": self.title,
            "task_type": self.task_type,
            "difficulty": self.difficulty,
            "estimated_minutes": self.estimated_minutes,
            "due_date": self.due_date,
            "is_fixed_deadline": self.is_fixed_deadline,
            "is_flexible": self.is_flexible,
            "is_rest_block": self.is_rest_block,
            "spoon_cost": self.spoon_cost,
            "scheduled_date": self.scheduled_date,
            "scheduled_slot": self.scheduled_slot,
            "reshuffle_count": self.reshuffle_count,
            "completed": self.completed,
            "status": self.status,
        }


@dataclass
class DayPlan:
    """Scheduled plan for one day."""
    target_date: str                        # ISO date
    available_spoons: float                 # Live spoons for the day
    planned_capacity: float                 # available × (1 - reserve)
    reserved_spoons: float                  # Breathing room buffer
    total_planned_cost: float = 0.0
    remaining_capacity: float = 0.0
    tasks: List[PlannedTask] = field(default_factory=list)
    explanation: str = ""
    is_overloaded: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return {
            "target_date": self.target_date,
            "available_spoons": round(self.available_spoons, 1),
            "planned_capacity": round(self.planned_capacity, 1),
            "reserved_spoons": round(self.reserved_spoons, 1),
            "total_planned_cost": round(self.total_planned_cost, 2),
            "remaining_capacity": round(self.remaining_capacity, 2),
            "tasks": [t.to_dict() for t in self.tasks],
            "explanation": self.explanation,
            "is_overloaded": self.is_overloaded,
        }


@dataclass
class ReshuffleAction:
    """A single reshuffle movement."""
    task_id: str
    task_title: str
    from_date: str
    to_date: str
    reason: str
    reshuffle_count: int
    offer_shrink: bool = False
    toast_message: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "task_title": self.task_title,
            "from_date": self.from_date,
            "to_date": self.to_date,
            "reason": self.reason,
            "reshuffle_count": self.reshuffle_count,
            "offer_shrink": self.offer_shrink,
            "toast_message": self.toast_message,
        }


# ── Task Cost Estimation (FEAT-C1) ───────────────────────────────────────────

def estimate_task(
    task_id: str,
    title: str,
    task_type: str = "other",
    difficulty: str = "normal",
    estimated_minutes: Optional[int] = None,
    due_date: Optional[str] = None,
    is_fixed_deadline: bool = False,
    is_rest_block: bool = False,
) -> PlannedTask:
    """Create a PlannedTask with its spoon cost auto-computed.

    If ``is_rest_block`` is True, the task is a rest item (FEAT-C5) and its
    cost is *negative* (credits spoons back).

    Args:
        task_id: Unique identifier.
        title: Human-readable name.
        task_type: One of ``reading``, ``writing``, ``problem_solving``,
            ``admin``, ``micro_step``, ``other``.
        difficulty: ``easy``, ``normal``, ``hard``.
        estimated_minutes: Optional user estimate.
        due_date: ISO date string of deadline, or ``None``.
        is_fixed_deadline: Whether this is an immovable external deadline.
        is_rest_block: Whether this is a rest-as-schedule item (FEAT-C5).

    Returns:
        A ``PlannedTask`` with ``spoon_cost`` populated.
    """
    if is_rest_block:
        minutes = estimated_minutes or 20
        # +0.5 spoons per 20 minutes of rest
        cost = -round(REST_SPOON_CREDIT * (minutes / 20.0), 2)
    else:
        cost = compute_task_cost(estimated_minutes, task_type, difficulty)

    return PlannedTask(
        task_id=task_id,
        title=title,
        task_type=task_type,
        difficulty=difficulty,
        estimated_minutes=estimated_minutes,
        due_date=due_date,
        is_fixed_deadline=is_fixed_deadline,
        is_flexible=not is_fixed_deadline,
        is_rest_block=is_rest_block,
        spoon_cost=cost,
    )


# ── Day Planning Algorithm (FEAT-C2) ─────────────────────────────────────────

def _sort_key(task: PlannedTask) -> Tuple:
    """Sort by: earliest hard deadline first, then highest cost descending."""
    if task.due_date:
        return (0, task.due_date, -task.spoon_cost)
    return (1, "9999-99-99", -task.spoon_cost)


def _pick_slot(task: PlannedTask, day_tasks: List[PlannedTask]) -> str:
    """Choose the optimal time slot for a task.

    Heavy deep-work (cost ≥ 2.0 spoons) → morning peak hours.
    Admin / micro_step → afternoon.
    Rest blocks → any gap, preferring afternoon.
    """
    if task.is_rest_block:
        return "afternoon"
    if task.spoon_cost >= 2.0 and task.task_type in ("problem_solving", "writing"):
        # Check if morning is already heavy
        morning_load = sum(
            t.spoon_cost for t in day_tasks if t.scheduled_slot == "morning"
        )
        if morning_load < 4.0:
            return "morning"
        return "afternoon"
    if task.task_type in ("admin", "micro_step"):
        return "afternoon"
    # Default: fill morning first, then afternoon
    morning_count = sum(1 for t in day_tasks if t.scheduled_slot == "morning")
    if morning_count < 3:
        return "morning"
    return "afternoon"


def plan_day(
    available_spoons: float,
    tasks: List[PlannedTask],
    target_date: str,
    reserve: float = RESERVE_FRACTION,
) -> DayPlan:
    """Plan a single day's schedule within capacity constraints.

    Args:
        available_spoons: Today's live/forecast spoons.
        tasks: Tasks to attempt scheduling into this day.
        target_date: ISO date string.
        reserve: Fraction of capacity held as breathing room (default 20%).

    Returns:
        A ``DayPlan`` with scheduled tasks and remaining capacity.
    """
    planned_capacity = available_spoons * (1.0 - reserve)
    reserved_spoons = available_spoons * reserve

    plan = DayPlan(
        target_date=target_date,
        available_spoons=available_spoons,
        planned_capacity=round(planned_capacity, 2),
        reserved_spoons=round(reserved_spoons, 2),
    )

    # Sort tasks: deadline-first, then highest-cost
    sorted_tasks = sorted(tasks, key=_sort_key)
    budget_remaining = planned_capacity

    for task in sorted_tasks:
        if task.completed:
            continue

        effective_cost = task.spoon_cost  # Can be negative for rest blocks

        if effective_cost > 0 and effective_cost > budget_remaining:
            # Can't fit: mark overloaded but don't force it
            plan.is_overloaded = True
            continue

        # Schedule the task
        task.scheduled_date = target_date
        task.scheduled_slot = _pick_slot(task, plan.tasks)
        task.status = "scheduled"
        plan.tasks.append(task)
        budget_remaining -= effective_cost  # Subtracting negative adds capacity
        plan.total_planned_cost += max(0, effective_cost)

    plan.remaining_capacity = round(max(0, budget_remaining), 2)

    # Generate empathetic explanation
    plan.explanation = _generate_plan_explanation(plan)

    return plan


def plan_multi_day(
    day_forecasts: List[Dict[str, Any]],
    tasks: List[PlannedTask],
    reserve: float = RESERVE_FRACTION,
) -> List[DayPlan]:
    """Plan tasks across multiple days using greedy capacity-fit.

    Args:
        day_forecasts: List of dicts with ``date`` (str) and
            ``prior_spoons`` or ``estimated_spoons`` (float) for each day.
        tasks: All pending tasks to schedule.
        reserve: Breathing room fraction.

    Returns:
        List of ``DayPlan`` objects, one per forecast day.
    """
    sorted_tasks = sorted(tasks, key=_sort_key)
    plans: List[DayPlan] = []

    # Build initial capacity map
    day_caps: List[Dict[str, Any]] = []
    for fc in day_forecasts:
        d = fc.get("date", "")
        spoons = fc.get("prior_spoons", fc.get("estimated_spoons", 6.0))
        cap = spoons * (1.0 - reserve)
        day_caps.append({
            "date": d,
            "spoons": spoons,
            "capacity": cap,
            "remaining": cap,
            "tasks": [],
        })

    # Greedily assign each task to the earliest fitting day
    unscheduled = []
    for task in sorted_tasks:
        if task.completed:
            continue

        placed = False
        for dc in day_caps:
            # Respect deadlines: don't schedule past the due date
            if task.due_date and dc["date"] > task.due_date:
                break  # Past the deadline, stop looking

            if task.spoon_cost <= dc["remaining"] or task.is_rest_block:
                task.scheduled_date = dc["date"]
                task.scheduled_slot = _pick_slot(task, dc["tasks"])
                task.status = "scheduled"
                dc["tasks"].append(task)
                dc["remaining"] -= task.spoon_cost
                placed = True
                break

        if not placed:
            unscheduled.append(task)

    # Build DayPlan objects
    for dc in day_caps:
        plan = DayPlan(
            target_date=dc["date"],
            available_spoons=dc["spoons"],
            planned_capacity=round(dc["spoons"] * (1.0 - reserve), 2),
            reserved_spoons=round(dc["spoons"] * reserve, 2),
            total_planned_cost=round(
                sum(max(0, t.spoon_cost) for t in dc["tasks"]), 2
            ),
            remaining_capacity=round(max(0, dc["remaining"]), 2),
            tasks=dc["tasks"],
        )
        plan.explanation = _generate_plan_explanation(plan)
        plan.is_overloaded = plan.total_planned_cost > plan.planned_capacity
        plans.append(plan)

    return plans


def _generate_plan_explanation(plan: DayPlan) -> str:
    """Build a one-line human explanation for a day plan."""
    spoons = plan.available_spoons
    cost = plan.total_planned_cost
    remaining = plan.remaining_capacity

    if cost == 0:
        return "Rest day — no tasks scheduled. Your energy is fully available."

    ratio = cost / max(plan.planned_capacity, 0.1)

    if spoons < 3.0:
        mode = "Recovery mode"
        advice = "Only essentials are planned. Rest is your top priority."
    elif ratio > 0.9:
        mode = "Full capacity day"
        advice = "Your schedule is packed. Consider protecting your buffer."
    elif ratio > 0.6:
        mode = "Balanced day"
        advice = "Steady pace with room for surprises."
    else:
        mode = "Light mode"
        advice = "Plenty of breathing room today."

    task_count = len(plan.tasks)
    return f"{mode} — {task_count} task{'s' if task_count != 1 else ''} using {cost:.1f} of {plan.planned_capacity:.1f} plannable spoons. {advice}"


# ── Automatic Low-Capacity Reshuffler (FEAT-C3) ──────────────────────────────

def reshuffle(
    current_plan: DayPlan,
    future_forecasts: List[Dict[str, Any]],
    all_tasks: List[PlannedTask],
) -> Tuple[DayPlan, List[ReshuffleAction]]:
    """Detect overload and reshuffle tasks to lighter future days.

    Triggers when live spoons drop below planned load by ≥ 20 %.

    Args:
        current_plan: Today's plan (may be overloaded).
        future_forecasts: Upcoming days with ``date`` and ``prior_spoons``.
        all_tasks: Full task list (for tracking reshuffle counts).

    Returns:
        Tuple of (updated_plan, list_of_reshuffle_actions).
    """
    actions: List[ReshuffleAction] = []

    # Check if reshuffling is needed
    if not current_plan.is_overloaded and current_plan.total_planned_cost <= current_plan.planned_capacity:
        # Not overloaded
        budget_deficit = current_plan.total_planned_cost - current_plan.planned_capacity
        if budget_deficit <= 0:
            return current_plan, actions

    # Identify candidates: flexible tasks, sorted by highest cost, least urgent
    candidates = sorted(
        [t for t in current_plan.tasks if t.is_flexible and not t.completed and not t.is_rest_block],
        key=lambda t: (-t.spoon_cost, t.due_date or "9999-99-99"),
    )

    # Find lighter future days (forecast > 6 spoons)
    lighter_days = [
        f for f in future_forecasts
        if (f.get("prior_spoons", f.get("estimated_spoons", 0)) > 6.0)
    ]

    deficit = current_plan.total_planned_cost - current_plan.planned_capacity

    for task in candidates:
        if deficit <= 0:
            break  # No more reshuffling needed

        if not lighter_days:
            break  # No lighter days available

        # Find the nearest lighter day that doesn't violate the deadline
        target_day = None
        for ld in lighter_days:
            if task.due_date and ld["date"] >= task.due_date:
                continue  # Would cross a deadline
            target_day = ld
            break

        if target_day is None:
            continue  # Can't move this task

        old_date = task.scheduled_date
        task.scheduled_date = target_day["date"]
        task.reshuffle_count += 1
        task.status = "reshuffled"

        # Remove from current plan
        current_plan.tasks = [t for t in current_plan.tasks if t.task_id != task.task_id]
        current_plan.total_planned_cost = round(
            sum(max(0, t.spoon_cost) for t in current_plan.tasks), 2
        )

        offer_shrink = task.reshuffle_count >= SHRINK_OFFER_RESHUFFLE_COUNT

        # Friendly day name
        try:
            from datetime import datetime
            day_name = datetime.strptime(target_day["date"], "%Y-%m-%d").strftime("%A")
        except Exception:
            day_name = target_day["date"]

        toast = f'Moved "{task.title}" to {day_name}, which looks lighter.'
        reason = "Budget overload — reshuffled to a lighter day."

        if offer_shrink:
            toast += " This task has been moved a few times. Want to shrink it into a 2-minute step?"
            reason += " Shrink offer triggered (≥3 reshuffles)."

        action = ReshuffleAction(
            task_id=task.task_id,
            task_title=task.title,
            from_date=old_date or current_plan.target_date,
            to_date=target_day["date"],
            reason=reason,
            reshuffle_count=task.reshuffle_count,
            offer_shrink=offer_shrink,
            toast_message=toast,
        )
        actions.append(action)
        deficit -= task.spoon_cost

    # Recalculate
    current_plan.remaining_capacity = round(
        max(0, current_plan.planned_capacity - current_plan.total_planned_cost), 2
    )
    current_plan.is_overloaded = current_plan.total_planned_cost > current_plan.planned_capacity
    current_plan.explanation = _generate_plan_explanation(current_plan)

    return current_plan, actions


# ── Polite Extension-Email Generator (FEAT-C4) ───────────────────────────────

def generate_extension_email(
    student_name: str,
    course_name: str,
    assignment_title: str,
    original_due_date: str,
    proposed_new_date: str,
    professor_name: str = "Professor",
    reason_context: str = "",
) -> Dict[str, str]:
    """Generate a polite, professional extension request email.

    **Ethical Guardrail**: Never mentions medical claims, mental health
    diagnoses, or trauma. Frames the request strictly around academic
    workload and quality.

    Args:
        student_name: Full name of the student.
        course_name: E.g., "CS301 Database Systems".
        assignment_title: E.g., "Lab 3: ER Diagram".
        original_due_date: ISO date string.
        proposed_new_date: ISO date string.
        professor_name: Recipient name or "Professor".
        reason_context: Optional one-line context (e.g., "heavy week with 3 other submissions").

    Returns:
        Dict with ``subject``, ``body``, and ``recipient`` fields.
    """
    reason_line = ""
    if reason_context:
        reason_line = f"\n\nDue to {reason_context}, I want to ensure I submit work that reflects my best understanding of the material rather than rushing through it."
    else:
        reason_line = "\n\nI want to ensure I submit work that reflects my best understanding of the material rather than rushing through it."

    body = f"""Dear {professor_name},

I hope this message finds you well. I am writing regarding the upcoming submission for {assignment_title} in {course_name}, currently due on {original_due_date}.{reason_line}

I would like to respectfully request a brief extension until {proposed_new_date}. This additional time would allow me to deliver a more thorough and well-considered submission.

I completely understand if this is not possible and am happy to discuss alternative arrangements. Thank you for your time and consideration.

Warm regards,
{student_name}"""

    subject = f"Extension Request — {assignment_title} ({course_name})"

    return {
        "subject": subject,
        "body": body.strip(),
        "recipient": professor_name,
        "student_name": student_name,
        "course_name": course_name,
        "assignment_title": assignment_title,
        "original_due_date": original_due_date,
        "proposed_new_date": proposed_new_date,
    }


# ── Rest-Block Helper (FEAT-C5) ──────────────────────────────────────────────

def create_rest_block(
    rest_id: str,
    title: str = "Rest & Recharge",
    minutes: int = 20,
) -> PlannedTask:
    """Create a rest block that credits spoons back when completed.

    +0.5 spoons per 20 minutes. Rest blocks are first-class schedule items
    with soothing aesthetics (handled in frontend).

    Args:
        rest_id: Unique identifier.
        title: E.g., "20m power nap", "Walk outside", "Listen to music".
        minutes: Duration in minutes.

    Returns:
        A ``PlannedTask`` with negative spoon cost (energy credit).
    """
    return estimate_task(
        task_id=rest_id,
        title=title,
        task_type="admin",
        difficulty="easy",
        estimated_minutes=minutes,
        is_rest_block=True,
    )
