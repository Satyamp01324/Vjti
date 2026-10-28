"""
SpoonSense Timetable & Commute Ingestion Module
================================================

Handles importing, parsing, normalizing, and structuring college class
timetables from ICS/iCalendar files or interactive weekly grids, as well
as managing commute configurations and effective per-day commute derivation.

Pure standard-library implementation with zero external dependencies
(no icalendar, no vobject).
"""

from __future__ import annotations

import re
from datetime import date, datetime, time, timedelta
from typing import Any, Dict, List, Optional, Tuple, Union

__all__ = [
    "parse_ics_file",
    "validate_ics_content",
    "blocks_from_grid",
    "compute_campus_hours_from_blocks",
    "build_commute_profile",
    "get_effective_commute",
    "merge_timetable_blocks",
    "generate_sample_ics",
    "DAY_NAMES",
    "ICS_DAY_MAP",
]

# ── Constants ─────────────────────────────────────────────────────────────────

# ISO-8601 weekday mapping: 0 = Monday ... 6 = Sunday
DAY_NAMES: Dict[int, str] = {
    0: "Monday",
    1: "Tuesday",
    2: "Wednesday",
    3: "Thursday",
    4: "Friday",
    5: "Saturday",
    6: "Sunday",
}

# RRULE BYDAY token to weekday integer
ICS_DAY_MAP: Dict[str, int] = {
    "MO": 0,
    "TU": 1,
    "WE": 2,
    "TH": 3,
    "FR": 4,
    "SA": 5,
    "SU": 6,
}

VALID_COMMUTE_MODES = {"crowded", "seated", "walk"}


# ── Helpers for ICS text parsing ─────────────────────────────────────────────

def _unfold_ics_lines(raw_text: str) -> List[str]:
    """
    Unfolds lines in RFC 5545 format.
    Lines that start with a space or tab are continuations of the previous line.
    """
    lines = raw_text.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    unfolded: List[str] = []
    for line in lines:
        if not line:
            continue
        if line[0] in (" ", "\t") and unfolded:
            unfolded[-1] += line[1:]
        else:
            unfolded.append(line)
    return unfolded


def _parse_ics_time(value: str) -> Optional[Tuple[Optional[date], time]]:
    """
    Parses ICS datetime strings such as:
      - 20261028T090000Z
      - 20261028T090000
      - 20261028 (all-day date, no time)
    Returns (date_obj, time_obj) or None if all-day or invalid.
    """
    clean_val = value.strip()
    # Check for date-only (all-day event)
    if "T" not in clean_val:
        return None  # All day event, skip for campus hours calculation

    # Strip trailing Z or timezone offset if present
    match = re.search(r"(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})", clean_val)
    if not match:
        return None

    y, m, d, hh, mm, ss = (int(x) for x in match.groups())
    try:
        dt_date = date(y, m, d)
        dt_time = time(hh, mm)
        return (dt_date, dt_time)
    except ValueError:
        return None


# ── Core Parser Functions ────────────────────────────────────────────────────

def validate_ics_content(ics_content: str) -> Tuple[bool, str]:
    """
    Validates if string content looks like a plausible iCalendar stream.
    Returns (is_valid, error_message).
    """
    if not ics_content or not ics_content.strip():
        return False, "ICS content is empty"

    if "BEGIN:VCALENDAR" not in ics_content:
        return False, "Missing BEGIN:VCALENDAR header"

    if "END:VCALENDAR" not in ics_content:
        return False, "Missing END:VCALENDAR footer"

    if "BEGIN:VEVENT" not in ics_content:
        return False, "No VEVENT components found in calendar"

    return True, ""


def parse_ics_file(ics_content: str) -> List[Dict[str, Any]]:
    """
    Parse an ICS / iCalendar string and extract recurring or single weekly class blocks.

    Returns a list of structured block dictionaries:
    [
        {
            "title": "Data Structures Lab",
            "weekday": 1,           # 0=Monday ... 6=Sunday
            "start_time": "09:00",  # HH:MM
            "end_time": "11:00",    # HH:MM
            "source": "ics",
            "raw_dtstart": "...",
            "raw_rrule": "..."
        },
        ...
    ]
    """
    if not ics_content:
        return []

    unfolded_lines = _unfold_ics_lines(ics_content)
    events: List[Dict[str, Any]] = []
    current_event: Optional[Dict[str, str]] = None

    for line in unfolded_lines:
        line_str = line.strip()
        if line_str == "BEGIN:VEVENT":
            current_event = {}
            continue
        elif line_str == "END:VEVENT":
            if current_event is not None:
                events.append(current_event)
                current_event = None
            continue

        if current_event is not None and ":" in line_str:
            key_part, val_part = line_str.split(":", 1)
            prop_name = key_part.split(";")[0].upper()
            # Store property and raw line info
            current_event[prop_name] = val_part
            if prop_name in ("DTSTART", "DTEND"):
                current_event[f"{prop_name}_RAW"] = line_str

    blocks: List[Dict[str, Any]] = []

    for ev in events:
        summary = ev.get("SUMMARY", "Class").strip()
        dtstart_val = ev.get("DTSTART")
        dtend_val = ev.get("DTEND")

        if not dtstart_val or not dtend_val:
            continue

        start_parsed = _parse_ics_time(dtstart_val)
        end_parsed = _parse_ics_time(dtend_val)

        if not start_parsed or not end_parsed:
            # Skip all-day events or unparseable formats
            continue

        st_date, st_time = start_parsed
        et_date, et_time = end_parsed

        # Format times as HH:MM
        start_str = f"{st_time.hour:02d}:{st_time.minute:02d}"
        end_str = f"{et_time.hour:02d}:{et_time.minute:02d}"

        # Sanity check: duration shouldn't exceed 8 hours for a normal class/lab
        st_mins = st_time.hour * 60 + st_time.minute
        et_mins = et_time.hour * 60 + et_time.minute
        duration_mins = et_mins - st_mins
        if duration_mins <= 0 or duration_mins > 480:
            continue

        rrule_val = ev.get("RRULE", "")
        weekdays_for_event: List[int] = []

        if rrule_val and "BYDAY=" in rrule_val:
            # Extract BYDAY=MO,WE,FR
            byday_match = re.search(r"BYDAY=([A-Z,]+)", rrule_val)
            if byday_match:
                days_tokens = byday_match.group(1).split(",")
                for tok in days_tokens:
                    tok_clean = tok.strip()
                    # Some RRULEs have prefixes like 1MO, 2TU - handle regex
                    clean_tok = re.sub(r"[^A-Z]", "", tok_clean)
                    if clean_tok in ICS_DAY_MAP:
                        weekdays_for_event.append(ICS_DAY_MAP[clean_tok])

        if not weekdays_for_event and st_date:
            # No recurrence rule, use the event date's weekday
            weekdays_for_event.append(st_date.weekday())

        for wd in weekdays_for_event:
            blocks.append({
                "title": summary,
                "weekday": wd,
                "start_time": start_str,
                "end_time": end_str,
                "source": "ics",
                "raw_dtstart": ev.get("DTSTART_RAW", dtstart_val),
                "raw_rrule": rrule_val or None,
            })

    return merge_timetable_blocks([], blocks)


def blocks_from_grid(grid: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    """
    Converts user manual weekly grid input into structured timetable blocks.
    grid structure:
      {
         "0": [{"start": "08:30", "end": "10:30", "title": "Physics"}],
         "1": [{"start": "09:00", "end": "11:00", "title": "DS Lab"}],
         ...
      }
    """
    blocks: List[Dict[str, Any]] = []
    if not grid:
        return blocks

    for day_key, block_list in grid.items():
        try:
            wd = int(day_key)
            if not 0 <= wd <= 6:
                continue
        except (ValueError, TypeError):
            continue

        for item in block_list or []:
            start = item.get("start") or item.get("start_time", "09:00")
            end = item.get("end") or item.get("end_time", "10:00")
            title = item.get("title", "Class").strip()

            # Normalise to HH:MM format
            if len(start) == 4 and start[1] == ":":
                start = "0" + start
            if len(end) == 4 and end[1] == ":":
                end = "0" + end

            blocks.append({
                "weekday": wd,
                "start_time": start,
                "end_time": end,
                "title": title,
                "source": "manual",
            })

    return merge_timetable_blocks([], blocks)


def compute_campus_hours_from_blocks(blocks: List[Dict[str, Any]], weekday: int) -> float:
    """
    Calculates total span of time on campus on a given weekday
    from the earliest class start to the latest class end.
    Returns hours as a float.
    """
    day_blocks = [b for b in blocks if b.get("weekday") == weekday]
    if not day_blocks:
        return 0.0

    earliest_mins = 24 * 60
    latest_mins = 0

    for b in day_blocks:
        st = b.get("start_time", "")
        et = b.get("end_time", "")
        try:
            sh, sm = (int(x) for x in st.split(":"))
            eh, em = (int(x) for x in et.split(":"))
            earliest_mins = min(earliest_mins, sh * 60 + sm)
            latest_mins = max(latest_mins, eh * 60 + em)
        except (ValueError, TypeError):
            continue

    if earliest_mins >= latest_mins:
        return 0.0

    total_hours = (latest_mins - earliest_mins) / 60.0
    return round(total_hours, 2)


def build_commute_profile(
    minutes_each_way: int,
    mode: str,
    days_applicable: Optional[List[int]] = None,
) -> Dict[str, Any]:
    """
    Validates and structures a student's commute profile.
    """
    mins = max(0, min(int(minutes_each_way), 480))
    clean_mode = mode.lower().strip() if mode else "seated"
    if clean_mode not in VALID_COMMUTE_MODES:
        clean_mode = "seated"

    if days_applicable is None:
        days_applicable = [0, 1, 2, 3, 4]  # Default Monday to Friday
    else:
        days_applicable = [d for d in days_applicable if 0 <= d <= 6]

    return {
        "minutes_each_way": mins,
        "mode": clean_mode,
        "days_applicable": days_applicable,
    }


def get_effective_commute(
    commute_profile: Dict[str, Any],
    day_overrides: List[Dict[str, Any]],
    weekday: int,
    target_date: Optional[Union[date, str]] = None,
) -> Tuple[float, str]:
    """
    Calculates effective round-trip commute minutes and mode for a specific day,
    taking into account day overrides (e.g. WFH, Holiday, Custom Commute).

    Returns:
      (total_round_trip_minutes, mode)
    """
    t_date_str = str(target_date) if target_date else None

    # Check for specific day overrides
    if t_date_str and day_overrides:
        for override in day_overrides:
            o_date = str(override.get("date", ""))
            if o_date == t_date_str:
                o_type = override.get("override_type", "").lower()
                if o_type in ("wfh", "holiday"):
                    return 0.0, "walk"
                elif o_type == "custom_commute":
                    val = override.get("value") or {}
                    mins = float(val.get("total_minutes", 0.0))
                    mode = val.get("mode", commute_profile.get("mode", "seated"))
                    return mins, mode

    # Default profile check: is this weekday applicable for regular commute?
    days_applicable = commute_profile.get("days_applicable", [0, 1, 2, 3, 4])
    if weekday in days_applicable:
        mins_each_way = float(commute_profile.get("minutes_each_way", 30))
        mode = commute_profile.get("mode", "seated")
        return mins_each_way * 2.0, mode

    return 0.0, "walk"


def merge_timetable_blocks(
    existing_blocks: List[Dict[str, Any]],
    new_blocks: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """
    Merges and deduplicates timetable blocks based on (weekday, start_time, end_time, title).
    Sorted by weekday ascending, start_time ascending.
    """
    seen = set()
    combined: List[Dict[str, Any]] = []

    for b in list(existing_blocks) + list(new_blocks):
        key = (
            b.get("weekday"),
            b.get("start_time"),
            b.get("end_time"),
            (b.get("title") or "").strip().lower(),
        )
        if key not in seen:
            seen.add(key)
            combined.append(b)

    combined.sort(key=lambda x: (x.get("weekday", 0), x.get("start_time", "00:00")))
    return combined


def generate_sample_ics() -> str:
    """
    Returns a sample RFC 5545 ICS string simulating an Indian engineering
    college timetable (VJTI Mumbai style: Monday-Friday classes & labs).
    """
    return """BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SpoonSense//College Timetable//EN
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:Engineering Physics
DTSTART;TZID=Asia/Kolkata:20261026T083000
DTEND;TZID=Asia/Kolkata:20261026T103000
RRULE:FREQ=WEEKLY;BYDAY=MO,WE
DESCRIPTION:Physics Lecture & Tutorial
END:VEVENT
BEGIN:VEVENT
SUMMARY:Applied Mathematics III
DTSTART;TZID=Asia/Kolkata:20261026T110000
DTEND;TZID=Asia/Kolkata:20261026T120000
RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR
END:VEVENT
BEGIN:VEVENT
SUMMARY:Engineering Workshop
DTSTART;TZID=Asia/Kolkata:20261026T140000
DTEND;TZID=Asia/Kolkata:20261026T173000
RRULE:FREQ=WEEKLY;BYDAY=MO
END:VEVENT
BEGIN:VEVENT
SUMMARY:Data Structures & Algorithms Lab
DTSTART;TZID=Asia/Kolkata:20261027T090000
DTEND;TZID=Asia/Kolkata:20261027T110000
RRULE:FREQ=WEEKLY;BYDAY=TU,TH
END:VEVENT
BEGIN:VEVENT
SUMMARY:Professional Communication
DTSTART;TZID=Asia/Kolkata:20261027T113000
DTEND;TZID=Asia/Kolkata:20261027T123000
RRULE:FREQ=WEEKLY;BYDAY=TU,FR
END:VEVENT
END:VCALENDAR"""
