"""
SpoonSense Milestone 1 API Integration Tests
=============================================

Tests the HTTP endpoints exposed in `backend/main.py`:
  • Timetable parsing (ICS & Grid)
  • Commute profile management
  • Day overrides
  • 7-Day energy weather forecast
  • Daily snapshot & manual override slider
"""

from __future__ import annotations

import os
import sys
from datetime import date

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_sample_ics_endpoint():
    response = client.get("/api/timetable/sample-ics")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "BEGIN:VCALENDAR" in data["sample_ics"]


def test_parse_ics_json():
    ics_text = """BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:Computer Networks
DTSTART;TZID=Asia/Kolkata:20261026T100000
DTEND;TZID=Asia/Kolkata:20261026T120000
RRULE:FREQ=WEEKLY;BYDAY=MO,WE
END:VEVENT
END:VCALENDAR"""
    response = client.post("/api/timetable/ics", json={"ics_content": ics_text})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["block_count"] == 2
    assert data["blocks"][0]["title"] == "Computer Networks"


def test_parse_manual_grid():
    grid = {
        "0": [{"start": "08:30", "end": "10:30", "title": "Calculus"}],
        "2": [{"start": "14:00", "end": "16:00", "title": "Physics Lab"}],
    }
    response = client.post("/api/timetable/grid", json={"grid": grid})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["block_count"] == 2


def test_timetable_save_and_get():
    blocks = [
        {"weekday": 0, "start_time": "08:30", "end_time": "10:30", "title": "Physics", "source": "manual"},
        {"weekday": 0, "start_time": "14:00", "end_time": "17:30", "title": "Workshop", "source": "manual"},
    ]
    # Save
    put_resp = client.put("/api/timetable", json={"user_id": "test_student_aarav", "blocks": blocks})
    assert put_resp.status_code == 200
    assert put_resp.json()["status"] == "success"

    # Get
    get_resp = client.get("/api/timetable/test_student_aarav")
    assert get_resp.status_code == 200
    assert len(get_resp.json()["blocks"]) == 2


def test_commute_save_and_get():
    payload = {
        "user_id": "test_student_aarav",
        "minutes_each_way": 120,
        "mode": "crowded",
        "days_applicable": [0, 1, 2, 3, 4],
    }
    put_resp = client.put("/api/commute", json=payload)
    assert put_resp.status_code == 200
    assert put_resp.json()["commute_profile"]["minutes_each_way"] == 120

    get_resp = client.get("/api/commute/test_student_aarav")
    assert get_resp.status_code == 200
    assert get_resp.json()["commute_profile"]["mode"] == "crowded"


def test_day_override():
    payload = {
        "user_id": "test_student_aarav",
        "override_type": "wfh",
        "value": {},
    }
    resp = client.put("/api/day-overrides/test_student_aarav/2026-10-28", json=payload)
    assert resp.status_code == 200
    assert resp.json()["override"]["override_type"] == "wfh"


def test_forecast_endpoint():
    resp = client.get("/api/forecast/test_student_aarav?start_date=2026-10-26")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    assert len(data["forecast"]) == 7
    # Verify forecast day structure
    f0 = data["forecast"][0]
    assert "target_date" in f0
    assert "prior_spoons" in f0
    assert "weather" in f0
    assert f0["weather"] in ["sunny", "partly_cloudy", "cloudy", "stormy"]


def test_today_snapshot_endpoint():
    resp = client.get("/api/me/snapshot/today/test_student_aarav?probe_rt=420&baseline_rt=300")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "success"
    snapshot = data["snapshot"]
    assert "live_spoons" in snapshot
    assert "prior_spoons" in snapshot
    assert "weather" in snapshot
    assert "factors" in snapshot
    assert len(snapshot["factors"]) >= 2  # Budget, commute, campus, etc.


def test_manual_override_slider():
    payload = {
        "user_id": "test_student_aarav",
        "spoons": 5.0,
        "target_date": date.today().isoformat(),
    }
    post_resp = client.post("/api/snapshot/override", json=payload)
    assert post_resp.status_code == 200
    assert post_resp.json()["manual_spoons"] == 5.0

    # Read back today snapshot to verify override is reflected
    get_resp = client.get(f"/api/me/snapshot/today/test_student_aarav")
    assert get_resp.status_code == 200
    assert get_resp.json()["snapshot"]["live_spoons"] == 5.0


def test_game_result_played_and_ema():
    # Submit 3 game results to complete calibration
    res1 = client.post("/api/games/result", json={"user_id": "test_game_user", "median_rt": 320.0, "lapses": 0, "variability": 20.0})
    assert res1.status_code == 200
    assert res1.json()["is_calibrating"] is True  # play_count = 1

    res2 = client.post("/api/games/result", json={"user_id": "test_game_user", "median_rt": 300.0, "lapses": 0, "variability": 15.0})
    assert res2.status_code == 200
    assert res2.json()["is_calibrating"] is True  # play_count = 2

    res3 = client.post("/api/games/result", json={"user_id": "test_game_user", "median_rt": 310.0, "lapses": 0, "variability": 18.0})
    assert res3.status_code == 200
    assert res3.json()["is_calibrating"] is False  # play_count = 3
    assert res3.json()["message"] == "Thanks. That helps me plan."

    # Check baseline endpoint
    b_resp = client.get("/api/games/baseline/test_game_user")
    assert b_resp.status_code == 200
    assert b_resp.json()["play_count"] == 3
    assert b_resp.json()["baseline_rt"] > 250


def test_game_result_skipped_zero_penalty():
    res = client.post("/api/games/result", json={"user_id": "test_game_user", "skipped": True})
    assert res.status_code == 200
    data = res.json()
    assert data["skipped"] is True
    assert data["probe_multiplier"] == 1.0
    assert data["message"] == "Thanks. That helps me plan."


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("🧪 RUNNING SPOONSENSE API INTEGRATION TESTS")
    print("=" * 70 + "\n")

    test_health_check()
    print("✓ test_health_check")
    test_sample_ics_endpoint()
    print("✓ test_sample_ics_endpoint")
    test_parse_ics_json()
    print("✓ test_parse_ics_json")
    test_parse_manual_grid()
    print("✓ test_parse_manual_grid")
    test_timetable_save_and_get()
    print("✓ test_timetable_save_and_get")
    test_commute_save_and_get()
    print("✓ test_commute_save_and_get")
    test_day_override()
    print("✓ test_day_override")
    test_forecast_endpoint()
    print("✓ test_forecast_endpoint")
    test_today_snapshot_endpoint()
    print("✓ test_today_snapshot_endpoint")
    test_manual_override_slider()
    print("✓ test_manual_override_slider")
    test_game_result_played_and_ema()
    print("✓ test_game_result_played_and_ema")
    test_game_result_skipped_zero_penalty()
    print("✓ test_game_result_skipped_zero_penalty")

    print("\n" + "=" * 70)
    print("🎉 ALL SPOONSENSE API INTEGRATION TESTS PASSED (12/12)!")
    print("=" * 70 + "\n")
