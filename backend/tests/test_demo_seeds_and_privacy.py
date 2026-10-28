"""
SpoonSense Milestone 5 Tests: Demo Seeds (FEAT-A3) & Privacy/Export/Delete (FEAT-G4)
=====================================================================================
"""

from __future__ import annotations

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.demo_seeds import seed_aarav_profile, seed_meera_profile
from core.privacy_manager import PRIVACY_MANIFEST, export_user_data, delete_user_data
from fastapi.testclient import TestClient
from main import app, _spoonsense_demo_store

client = TestClient(app)


class TestDemoSeeds(unittest.TestCase):
    def test_aarav_seed(self):
        res = seed_aarav_profile(_spoonsense_demo_store, "aarav_test")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["commute_cost"], 4.0)
        self.assertEqual(res["campus_cost"], 4.5)
        self.assertAlmostEqual(res["expected_live_spoons"], 2.45, places=1)
        self.assertEqual(res["expected_weather"], "stormy")

        # Verify store updated
        self.assertIn("aarav_test", _spoonsense_demo_store["timetables"])
        self.assertIn("aarav_test", _spoonsense_demo_store["commutes"])
        self.assertEqual(_spoonsense_demo_store["commutes"]["aarav_test"]["minutes_each_way"], 120)

    def test_meera_seed(self):
        res = seed_meera_profile(_spoonsense_demo_store, "meera_test")
        self.assertEqual(res["status"], "success")
        self.assertEqual(res["commute_cost"], 0.1)
        self.assertEqual(res["campus_cost"], 4.5)
        self.assertEqual(res["expected_live_spoons"], 7.4)
        self.assertEqual(res["expected_weather"], "sunny")

        # Verify same timetable count as Aarav
        aarav_count = len(_spoonsense_demo_store["timetables"]["aarav_test"])
        meera_count = len(_spoonsense_demo_store["timetables"]["meera_test"])
        self.assertEqual(aarav_count, meera_count)

    def test_api_seed_endpoints(self):
        res_aarav = client.post("/api/demo/seed/aarav")
        self.assertEqual(res_aarav.status_code, 200)
        self.assertEqual(res_aarav.json()["persona"], "aarav")

        res_meera = client.post("/api/demo/seed/meera")
        self.assertEqual(res_meera.status_code, 200)
        self.assertEqual(res_meera.json()["persona"], "meera")

        res_invalid = client.post("/api/demo/seed/unknown_person")
        self.assertEqual(res_invalid.status_code, 400)


class TestPrivacyExportDelete(unittest.TestCase):
    def setUp(self):
        seed_aarav_profile(_spoonsense_demo_store, "privacy_user")

    def test_privacy_manifest(self):
        self.assertIn("version", PRIVACY_MANIFEST)
        self.assertGreater(len(PRIVACY_MANIFEST["what_we_collect"]), 0)
        self.assertGreater(len(PRIVACY_MANIFEST["what_we_never_collect"]), 0)
        # Verify banned concepts not collected
        banned = any("keystroke" in s.lower() for s in PRIVACY_MANIFEST["what_we_never_collect"])
        self.assertTrue(banned)

    def test_export_user_data(self):
        archive = export_user_data("privacy_user", _spoonsense_demo_store)
        self.assertEqual(archive["export_metadata"]["user_id"], "privacy_user")
        self.assertGreater(len(archive["timetable_blocks"]), 0)
        self.assertGreater(len(archive["tasks"]), 0)
        self.assertIn("forgiving_garden", archive)

    def test_delete_user_data(self):
        del_res = delete_user_data("privacy_user", _spoonsense_demo_store)
        self.assertEqual(del_res["status"], "success")
        # Ensure user removed from store
        self.assertNotIn("privacy_user", _spoonsense_demo_store["timetables"])
        self.assertNotIn("privacy_user", _spoonsense_demo_store["commutes"])
        self.assertNotIn("privacy_user", _spoonsense_demo_store["tasks"])

    def test_api_export_and_delete(self):
        # Seed for API test
        client.post("/api/demo/seed/meera", json={"user_id": "api_del_user"})

        # Export check
        exp_res = client.get("/api/me/export/api_del_user")
        self.assertEqual(exp_res.status_code, 200)
        self.assertEqual(exp_res.json()["export_metadata"]["user_id"], "api_del_user")

        # Delete check
        del_res = client.delete("/api/me/api_del_user")
        self.assertEqual(del_res.status_code, 200)
        self.assertEqual(del_res.json()["status"], "success")

        # Manifest check
        man_res = client.get("/api/me/privacy-manifest")
        self.assertEqual(man_res.status_code, 200)
        self.assertIn("ethical_commitments", man_res.json())


if __name__ == "__main__":
    unittest.main()
