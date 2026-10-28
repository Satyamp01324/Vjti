"""
SpoonSense Google Calendar Sync Tests (FEAT-G3)
================================================
Tests:
  • Two-way sync of planned blocks tagged [SpoonSense]
  • Reshuffle update logic without duplicate orphans
  • 1-Tap disconnect removing all blocks and revoking access
  • Read-only and auto-sync preference management
"""

from __future__ import annotations

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.calendar_sync import (
    get_sync_status,
    set_sync_preferences,
    sync_tasks_to_calendar,
    disconnect_calendar,
)
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestCalendarSyncCore(unittest.TestCase):
    def setUp(self):
        disconnect_calendar("cal_test_user")

    def test_sync_tasks_creates_blocks(self):
        tasks = [
            {"id": "t1", "title": "Math Problem Set", "estimated_minutes": 45, "spoon_cost": 1.2},
            {"id": "t2", "title": "Literature Reading", "estimated_minutes": 30, "spoon_cost": 0.8},
        ]
        res = sync_tasks_to_calendar("cal_test_user", tasks, "2026-10-28")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["synced_count"], 2)
        self.assertEqual(res["updated_count"], 0)

        # Status check
        status = get_sync_status("cal_test_user")
        self.assertTrue(status["connected"])
        self.assertEqual(status["synced_event_count"], 2)

    def test_reshuffle_updates_existing_events_without_duplicates(self):
        tasks = [
            {"id": "t1", "title": "Math Problem Set", "estimated_minutes": 45, "spoon_cost": 1.2},
        ]
        # First sync
        sync_tasks_to_calendar("cal_test_user", tasks, "2026-10-28")
        status1 = get_sync_status("cal_test_user")
        self.assertEqual(status1["synced_event_count"], 1)

        # Reshuffled sync on next day
        res2 = sync_tasks_to_calendar("cal_test_user", tasks, "2026-10-29")
        self.assertEqual(res2["synced_count"], 0)
        self.assertEqual(res2["updated_count"], 1)

        # Count must remain 1 — zero orphan duplicates!
        status2 = get_sync_status("cal_test_user")
        self.assertEqual(status2["synced_event_count"], 1)

    def test_one_tap_disconnect(self):
        tasks = [
            {"id": "t1", "title": "Physics Lab Draft", "estimated_minutes": 60, "spoon_cost": 1.5},
        ]
        sync_tasks_to_calendar("cal_test_user", tasks, "2026-10-28")
        self.assertTrue(get_sync_status("cal_test_user")["connected"])

        # Disconnect
        disc_res = disconnect_calendar("cal_test_user")
        self.assertEqual(disc_res["status"], "success")
        self.assertEqual(disc_res["deleted_count"], 1)

        # Verify zero lingering blocks
        status = get_sync_status("cal_test_user")
        self.assertFalse(status["connected"])
        self.assertEqual(status["synced_event_count"], 0)

    def test_preferences(self):
        set_sync_preferences("cal_test_user", read_only=True, auto_sync=False)
        status = get_sync_status("cal_test_user")
        self.assertTrue(status["read_only"])
        self.assertFalse(status["auto_sync"])


class TestCalendarSyncAPI(unittest.TestCase):
    def setUp(self):
        client.post("/api/calendar/disconnect", json={"user_id": "api_cal_user"})

    def test_api_status(self):
        res = client.get("/api/calendar/status/api_cal_user")
        self.assertEqual(res.status_code, 200)
        self.assertIn("connected", res.json())

    def test_api_sync_and_disconnect(self):
        sync_res = client.post("/api/calendar/sync", json={
            "user_id": "api_cal_user",
            "target_date": "2026-10-28",
            "tasks": [{"id": "task_abc", "title": "Embedded Systems Project", "estimated_minutes": 60, "spoon_cost": 1.8}],
        })
        self.assertEqual(sync_res.status_code, 200)
        self.assertEqual(sync_res.json()["synced_count"], 1)

        disc_res = client.post("/api/calendar/disconnect", json={"user_id": "api_cal_user"})
        self.assertEqual(disc_res.status_code, 200)
        self.assertEqual(disc_res.json()["deleted_count"], 1)


if __name__ == "__main__":
    unittest.main()
