"""
SpoonSense Milestone 4 Task Shrinker & Anti-Paralysis Tests
============================================================

Tests for:
  • Curated Coping Strategy RAG Corpus (FEAT-D2)
  • Deterministic Offline Rule-Based Sequencer (FEAT-D4)
  • "Smaller Please" Atomic Sensory Sub-Divider (FEAT-D3)
  • Ethical Guardrails & Crisis Redirection (FEAT-D5)
  • Banned Words Output Sanitizer (FEAT-D1)
  • API Integration Endpoints (/api/sequence, /api/sequence/smaller, etc.)
"""

from __future__ import annotations

import os
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.shrinker import (
    COPING_STRATEGIES,
    OFFLINE_TEMPLATES,
    retrieve_coping_strategies,
    offline_sequence,
    subdivide_step,
    check_ethical_guardrails,
    sanitize_output,
    CRISIS_KEYWORDS,
    DIAGNOSTIC_KEYWORDS,
    CRISIS_RESPONSE,
    DIAGNOSTIC_RESPONSE,
    BANNED_WORDS,
)
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestCopingStrategies(unittest.TestCase):
    def test_retrieve_writing_stuck(self):
        results = retrieve_coping_strategies("writing", "stuck", top_k=3)
        self.assertGreater(len(results), 0)
        self.assertLessEqual(len(results), 3)
        # Should include relevant strategy names or content
        found_writing = any("writing" in s.get("task_types", []) for s in results)
        self.assertTrue(found_writing)

    def test_retrieve_with_unknown_type(self):
        # Even with obscure type, situation matches
        results = retrieve_coping_strategies("unknown_genre", "overwhelmed", top_k=2)
        self.assertIsInstance(results, list)

    def test_top_k_limit(self):
        results = retrieve_coping_strategies("reading", "distracted", top_k=1)
        self.assertEqual(len(results), 1)

    def test_strategy_corpus_structure(self):
        self.assertGreater(len(COPING_STRATEGIES), 10)
        for s in COPING_STRATEGIES:
            self.assertIn("id", s)
            self.assertIn("name", s)
            self.assertIn("text", s)
            self.assertIn("source", s)


class TestOfflineSequencer(unittest.TestCase):
    def test_writing_sequence(self):
        res = offline_sequence("Research Paper Draft", "writing", live_spoons=8.0)
        steps = res["steps"]
        self.assertGreater(len(steps), 0)
        self.assertLessEqual(steps[0]["minutes"], 2)  # Step 1 ≤ 2 minutes rule
        self.assertEqual(res["source"], "offline_template")
        self.assertIn("Research Paper Draft", steps[0]["text"])

    def test_problem_solving_sequence(self):
        res = offline_sequence("Bug Fix in Auth", "problem_solving", live_spoons=6.0)
        steps = res["steps"]
        self.assertGreater(len(steps), 0)
        self.assertLessEqual(steps[0]["minutes"], 2)

    def test_reading_sequence(self):
        res = offline_sequence("Operating Systems Ch 4", "reading", live_spoons=5.0)
        steps = res["steps"]
        self.assertGreater(len(steps), 0)
        self.assertLessEqual(steps[0]["minutes"], 2)

    def test_admin_sequence(self):
        res = offline_sequence("Hostel Fee Form", "admin", live_spoons=4.0)
        steps = res["steps"]
        self.assertGreater(len(steps), 0)
        self.assertLessEqual(steps[0]["minutes"], 2)

    def test_other_sequence(self):
        res = offline_sequence("Clean desk", "other", live_spoons=3.0)
        steps = res["steps"]
        self.assertGreater(len(steps), 0)
        self.assertLessEqual(steps[0]["minutes"], 2)

    def test_unknown_type_falls_back_to_other(self):
        res = offline_sequence("Something unknown", "xyz_nonexistent", live_spoons=6.0)
        self.assertGreater(len(res["steps"]), 0)

    def test_low_spoons_limits_steps(self):
        low_res = offline_sequence("Essay", "writing", live_spoons=1.0)
        high_res = offline_sequence("Essay", "writing", live_spoons=12.0)
        self.assertLessEqual(len(low_res["steps"]), len(high_res["steps"]))

    def test_total_cost_calculation(self):
        res = offline_sequence("Test Task", "writing", live_spoons=8.0)
        computed_cost = sum(s["spoon_cost"] for s in res["steps"])
        self.assertAlmostEqual(res["total_cost"], round(computed_cost, 2), places=1)


class TestSubdivider(unittest.TestCase):
    def test_basic_subdivide(self):
        res = subdivide_step("Read chapter 1", "reading", recursion_depth=0)
        self.assertFalse(res["max_reached"])
        self.assertEqual(res["recursion_depth"], 1)
        self.assertGreater(len(res["sub_steps"]), 0)
        # Check atomic sensory action properties
        for sub in res["sub_steps"]:
            self.assertLessEqual(sub["minutes"], 1)
            self.assertLessEqual(sub["spoon_cost"], 0.1)

    def test_recursion_depth_increments(self):
        res1 = subdivide_step("Write introduction", "writing", recursion_depth=1)
        self.assertEqual(res1["recursion_depth"], 2)
        self.assertFalse(res1["max_reached"])

    def test_max_recursion_reached(self):
        res = subdivide_step("Write introduction", "writing", recursion_depth=3, max_recursions=3)
        self.assertTrue(res["max_reached"])
        self.assertEqual(len(res["sub_steps"]), 1)
        self.assertIn("deep breath", res["sub_steps"][0]["text"].lower())

    def test_different_task_types(self):
        res_write = subdivide_step("Code feature", "problem_solving", recursion_depth=0)
        res_read = subdivide_step("Read notes", "reading", recursion_depth=0)
        self.assertNotEqual(res_write["sub_steps"][0]["text"], res_read["sub_steps"][0]["text"])


class TestEthicalGuardrails(unittest.TestCase):
    def test_crisis_detection(self):
        res = check_ethical_guardrails("I want to kill myself, I can't take this")
        self.assertIsNotNone(res)
        self.assertEqual(res["type"], "crisis_redirect")
        self.assertTrue(res["halted"])
        self.assertGreater(len(res["helplines"]), 0)

    def test_crisis_keywords_trigger(self):
        for kw in ["suicide", "end it all", "self harm", "overdose"]:
            res = check_ethical_guardrails(f"I feel like {kw}")
            self.assertIsNotNone(res)
            self.assertEqual(res["type"], "crisis_redirect")

    def test_diagnostic_detection(self):
        res = check_ethical_guardrails("Do I have ADHD or clinical depression?")
        self.assertIsNotNone(res)
        self.assertEqual(res["type"], "diagnostic_redirect")
        self.assertFalse(res["halted"])
        self.assertIn("counseling", res["message"].lower())

    def test_clean_input(self):
        self.assertIsNone(check_ethical_guardrails("I need to study for digital circuits"))
        self.assertIsNone(check_ethical_guardrails("Feeling a bit stuck with starting"))

    def test_empty_or_none(self):
        self.assertIsNone(check_ethical_guardrails(""))
        self.assertIsNone(check_ethical_guardrails(None))


class TestSanitizeOutput(unittest.TestCase):
    def test_replaces_should(self):
        self.assertEqual(sanitize_output("You should start now"), "You could start now")

    def test_replaces_must(self):
        self.assertEqual(sanitize_output("You must finish"), "You can finish")

    def test_replaces_lazy(self):
        self.assertEqual(sanitize_output("Don't be lazy"), "Don't be resting")

    def test_replaces_fail(self):
        self.assertEqual(sanitize_output("You will fail"), "You will learn from")

    def test_case_insensitive(self):
        self.assertEqual(sanitize_output("YOU MUST DO THIS"), "YOU can DO THIS")

    def test_clean_text_unchanged(self):
        text = "Open the notebook and jot down ideas."
        self.assertEqual(sanitize_output(text), text)


class TestShrinkerAPIIntegration(unittest.TestCase):
    def test_sequence_endpoint_offline_or_gemini(self):
        response = client.post("/api/sequence", json={
            "user_id": "test_user",
            "title": "Machine Learning Lab",
            "task_type": "problem_solving",
            "live_spoons": 6.0,
            "user_note": "Just feeling a bit stuck",
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("steps", data["sequence"])
        self.assertGreater(len(data["sequence"]["steps"]), 0)

    def test_sequence_crisis_redirect(self):
        response = client.post("/api/sequence", json={
            "user_id": "test_user",
            "title": "Exam Prep",
            "task_type": "reading",
            "live_spoons": 6.0,
            "user_note": "I want to kill myself, everything is too hard",
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "redirect")
        self.assertEqual(data["guardrail"]["type"], "crisis_redirect")
        self.assertTrue(data["guardrail"]["halted"])

    def test_sequence_diagnostic_redirect(self):
        response = client.post("/api/sequence", json={
            "user_id": "test_user",
            "title": "Study Time",
            "task_type": "reading",
            "live_spoons": 6.0,
            "user_note": "Do I have ADHD or a mental disorder?",
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "redirect")
        self.assertEqual(data["guardrail"]["type"], "diagnostic_redirect")

    def test_smaller_endpoint(self):
        response = client.post("/api/sequence/smaller", json={
            "user_id": "test_user",
            "step_text": "Write the introduction paragraph",
            "task_type": "writing",
            "recursion_depth": 0,
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertFalse(data["result"]["max_reached"])
        self.assertGreater(len(data["result"]["sub_steps"]), 0)

    def test_smaller_max_depth(self):
        response = client.post("/api/sequence/smaller", json={
            "user_id": "test_user",
            "step_text": "Sit in your chair",
            "task_type": "writing",
            "recursion_depth": 3,
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["result"]["max_reached"])

    def test_strategies_endpoint(self):
        response = client.get("/api/sequence/strategies/writing?situation=stuck&top_k=2")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertLessEqual(len(data["strategies"]), 2)

    def test_offline_explicit_endpoint(self):
        response = client.post("/api/sequence/offline", json={
            "user_id": "test_user",
            "title": "Math Assignment",
            "task_type": "problem_solving",
            "live_spoons": 5.0,
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["sequence"]["source"], "offline_template")

    def test_history_endpoint(self):
        # First ensure a sequence was added
        client.post("/api/sequence", json={
            "user_id": "history_test_user",
            "title": "History Check Task",
            "task_type": "reading",
            "live_spoons": 6.0,
            "user_note": "Simple start",
        })
        response = client.get("/api/sequence/history/history_test_user")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertGreater(len(data["history"]), 0)


if __name__ == "__main__":
    unittest.main()
