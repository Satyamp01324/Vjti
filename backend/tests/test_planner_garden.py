"""
SpoonSense Milestone 3 Test Suite: Planner, Reshuffler, Garden, Evening Check-in
================================================================================
Comprehensive unit and API integration tests for:
  - FEAT-C1: Task Cost Estimation Engine
  - FEAT-C2: Capacity-Sized Day Planning Algorithm
  - FEAT-C3: Automatic Low-Capacity Reshuffler
  - FEAT-C4: Polite Extension-Email Generator
  - FEAT-C5: Rest as a First-Class Schedule Item
  - FEAT-E2: The Forgiving Garden (Streak That Never Wilts)
  - FEAT-E3: One-Tap Evening Check-in
  - FEAT-E4: Dopamine Menu (Off-Ramp Rest Drawer)
"""

import unittest
from datetime import date, timedelta
from fastapi.testclient import TestClient

from core.planner import (
    estimate_task,
    plan_day,
    plan_multi_day,
    reshuffle,
    generate_extension_email,
    create_rest_block,
    PlannedTask,
    DayPlan,
    ReshuffleAction,
    RESERVE_FRACTION,
    REST_SPOON_CREDIT,
)
from core.garden import (
    GardenState,
    EveningCheckin,
    compute_growth_stage,
    update_garden,
    check_hibernation,
    process_evening_checkin,
    process_evening_skip,
    get_dopamine_menu,
    engage_dopamine_item,
    GROWTH_STAGES,
    DEFAULT_DOPAMINE_ITEMS,
    EVENING_LABELS,
)
from main import app, _spoonsense_demo_store

client = TestClient(app)


class TestTaskCostEstimation(unittest.TestCase):
    """FEAT-C1: Task Cost Estimation tests."""

    def test_default_durations_applied(self):
        # Reading default 20m: 20 * 0.067 * 1.0 = 1.34 spoons
        t_read = estimate_task("1", "Read Chapter 4", task_type="reading")
        self.assertAlmostEqual(t_read.spoon_cost, 1.34, places=2)

        # Writing default 30m: 30 * 0.09 * 1.0 = 2.70 spoons
        t_write = estimate_task("2", "Draft Essay", task_type="writing")
        self.assertAlmostEqual(t_write.spoon_cost, 2.70, places=2)

        # Problem solving default 45m: 45 * 0.089 * 1.0 = 4.005 -> 4.0 spoons
        t_ps = estimate_task("3", "Math Set", task_type="problem_solving")
        self.assertAlmostEqual(t_ps.spoon_cost, 4.0, places=1)

        # Admin default 10m: 10 * 0.05 * 1.0 = 0.50 spoons
        t_admin = estimate_task("4", "Reply Email", task_type="admin")
        self.assertAlmostEqual(t_admin.spoon_cost, 0.50, places=2)

    def test_difficulty_multipliers(self):
        # 30m reading easy: 30 * 0.067 * 0.8 = 1.61 spoons
        t_easy = estimate_task("e1", "Easy Read", "reading", difficulty="easy", estimated_minutes=30)
        self.assertAlmostEqual(t_easy.spoon_cost, 1.61, places=2)

        # 30m reading hard: 30 * 0.067 * 1.2 = 2.41 spoons
        t_hard = estimate_task("h1", "Hard Read", "reading", difficulty="hard", estimated_minutes=30)
        self.assertAlmostEqual(t_hard.spoon_cost, 2.41, places=2)

    def test_micro_step_cost(self):
        # 2m micro step: 2 * 0.10 * 1.0 = 0.2 spoons
        t_micro = estimate_task("m1", "Open notebook", task_type="micro_step", estimated_minutes=2)
        self.assertAlmostEqual(t_micro.spoon_cost, 0.20, places=2)


class TestDayPlanningAlgorithm(unittest.TestCase):
    """FEAT-C2: Capacity-Sized Day Planning Algorithm tests."""

    def test_plan_day_respects_80_percent_ceiling(self):
        # Available spoons = 10.0 -> Plannable capacity = 8.0, Reserve = 2.0
        available = 10.0
        tasks = [
            estimate_task("t1", "Task 1", task_type="writing", estimated_minutes=40),  # 3.6 spoons
            estimate_task("t2", "Task 2", task_type="writing", estimated_minutes=40),  # 3.6 spoons
            estimate_task("t3", "Task 3", task_type="writing", estimated_minutes=40),  # 3.6 spoons -> would exceed 8.0!
        ]
        plan = plan_day(available, tasks, target_date="2026-10-28")

        self.assertEqual(plan.available_spoons, 10.0)
        self.assertEqual(plan.planned_capacity, 8.0)
        self.assertEqual(plan.reserved_spoons, 2.0)
        # Should fit 2 tasks (7.2 spoons <= 8.0), 3rd task shouldn't fit into plannable capacity
        self.assertEqual(len(plan.tasks), 2)
        self.assertAlmostEqual(plan.total_planned_cost, 7.2, places=2)
        self.assertTrue(plan.is_overloaded)  # An unplaced task tripped the flag

    def test_multi_day_greedy_capacity_fit(self):
        forecasts = [
            {"date": "2026-10-28", "prior_spoons": 6.0},  # plannable: 4.8
            {"date": "2026-10-29", "prior_spoons": 8.0},  # plannable: 6.4
        ]
        tasks = [
            estimate_task("t1", "Task 1", task_type="writing", estimated_minutes=40),  # 3.6 spoons
            estimate_task("t2", "Task 2", task_type="writing", estimated_minutes=40),  # 3.6 spoons (fits day 2)
        ]
        plans = plan_multi_day(forecasts, tasks)

        self.assertEqual(len(plans), 2)
        # Day 1 should have t1
        self.assertEqual(len(plans[0].tasks), 1)
        self.assertEqual(plans[0].tasks[0].task_id, "t1")
        # Day 2 should have t2
        self.assertEqual(len(plans[1].tasks), 1)
        self.assertEqual(plans[1].tasks[0].task_id, "t2")


class TestReshuffler(unittest.TestCase):
    """FEAT-C3: Low-Capacity Reshuffler tests."""

    def test_reshuffle_moves_flexible_tasks_to_lighter_days(self):
        today = "2026-10-28"
        t_heavy = estimate_task("th", "Heavy Project", task_type="problem_solving", estimated_minutes=90) # 8.01 spoons
        t_light = estimate_task("tl", "Quick Read", task_type="reading", estimated_minutes=15) # 1.0 spoons

        # Day plan with capacity 4.0, but loaded with 9.01 spoons (overloaded!)
        plan = DayPlan(
            target_date=today,
            available_spoons=5.0,
            planned_capacity=4.0,
            reserved_spoons=1.0,
            total_planned_cost=9.01,
            remaining_capacity=0.0,
            tasks=[t_heavy, t_light],
            is_overloaded=True,
        )

        future_forecasts = [
            {"date": "2026-10-29", "prior_spoons": 7.5},  # Lighter day (>6.0)
            {"date": "2026-10-30", "prior_spoons": 5.0},
        ]

        updated_plan, actions = reshuffle(plan, future_forecasts, [t_heavy, t_light])

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].task_id, "th")
        self.assertEqual(actions[0].to_date, "2026-10-29")
        self.assertIn("Heavy Project", actions[0].toast_message)
        # Plan now only contains t_light
        self.assertEqual(len(updated_plan.tasks), 1)
        self.assertEqual(updated_plan.tasks[0].task_id, "tl")

    def test_reshuffle_offers_shrink_after_3_moves(self):
        today = "2026-10-28"
        t = estimate_task("stubborn", "Draft Literature Review", task_type="writing", estimated_minutes=60)
        t.reshuffle_count = 2  # This reshuffle will make it 3!

        plan = DayPlan(
            target_date=today,
            available_spoons=3.0,
            planned_capacity=2.4,
            reserved_spoons=0.6,
            total_planned_cost=5.4,
            remaining_capacity=0.0,
            tasks=[t],
            is_overloaded=True,
        )

        future = [{"date": "2026-10-29", "prior_spoons": 8.0}]
        updated_plan, actions = reshuffle(plan, future, [t])

        self.assertEqual(len(actions), 1)
        self.assertEqual(actions[0].reshuffle_count, 3)
        self.assertTrue(actions[0].offer_shrink)
        self.assertIn("shrink it", actions[0].toast_message)

    def test_reshuffle_never_crosses_hard_deadline(self):
        today = "2026-10-28"
        deadline = "2026-10-29"
        # Task due tomorrow, cannot move to Friday
        t = estimate_task("urgent", "Urgent Submission", task_type="writing", due_date=deadline, is_fixed_deadline=False)
        t.spoon_cost = 6.0

        plan = DayPlan(
            target_date=today,
            available_spoons=4.0,
            planned_capacity=3.2,
            reserved_spoons=0.8,
            total_planned_cost=6.0,
            tasks=[t],
            is_overloaded=True,
        )

        # Only lighter day is 2026-10-30 (which is past the deadline 2026-10-29!)
        future = [{"date": "2026-10-30", "prior_spoons": 9.0}]
        updated_plan, actions = reshuffle(plan, future, [t])

        # Cannot move past deadline -> 0 actions taken
        self.assertEqual(len(actions), 0)


class TestExtensionEmailGenerator(unittest.TestCase):
    """FEAT-C4: Polite Extension Email tests."""

    def test_generates_polite_academic_framed_email(self):
        email = generate_extension_email(
            student_name="Aarav Sharma",
            course_name="Database Systems (CS301)",
            assignment_title="Lab 3: Indexing & Query Optimization",
            original_due_date="2026-10-29",
            proposed_new_date="2026-10-31",
            professor_name="Prof. Kulkarni",
            reason_context="unforeseen transit disruption and project overlapping",
        )

        body = email["body"]
        self.assertIn("Dear Prof. Kulkarni", body)
        self.assertIn("Lab 3: Indexing & Query Optimization", body)
        self.assertIn("2026-10-31", body)
        self.assertIn("Aarav Sharma", body)
        # Ethical guardrail check: MUST NOT contain clinical/mental health diagnoses
        lower_body = body.lower()
        self.assertNotIn("depression", lower_body)
        self.assertNotIn("anxiety", lower_body)
        self.assertNotIn("adhd", lower_body)
        self.assertNotIn("mental health", lower_body)


class TestRestAsScheduleItem(unittest.TestCase):
    """FEAT-C5: Rest Blocks."""

    def test_rest_block_credits_spoons(self):
        rest = create_rest_block("r1", "20m Power Nap", minutes=20)
        self.assertTrue(rest.is_rest_block)
        # Cost is negative (credits 0.5 spoons)
        self.assertAlmostEqual(rest.spoon_cost, -0.5, places=2)


class TestForgivingGarden(unittest.TestCase):
    """FEAT-E2: The Forgiving Garden tests."""

    def test_garden_growth_stages_and_xp(self):
        garden = GardenState(user_id="test_user")
        self.assertEqual(garden.current_stage, "seed")

        # Action: login (+5 XP)
        garden = update_garden(garden, "login", today="2026-10-28")
        self.assertEqual(garden.total_xp, 5)
        self.assertEqual(garden.days_tended, 1)

        # Action: micro-step completion (+10 XP)
        garden = update_garden(garden, "micro_step", today="2026-10-28")
        self.assertEqual(garden.total_xp, 15)

        # Action: evening check-in (+15 XP) -> reaches 30 XP -> Sprout!
        garden = update_garden(garden, "evening_checkin", today="2026-10-28")
        self.assertEqual(garden.total_xp, 30)
        self.assertEqual(garden.current_stage, "sprout")
        self.assertEqual(garden.stage_label, "Little Sprout")

    def test_garden_never_wilts_or_dies_gentle_hibernation(self):
        garden = GardenState(
            user_id="absent_user",
            total_xp=200,
            days_tended=10,
            last_active_date="2026-10-01",
        )
        # Check hibernation 20 days later
        garden = check_hibernation(garden, today="2026-10-21")
        self.assertTrue(garden.is_hibernating)
        self.assertIn("gentle hibernation", garden.streak_message)
        self.assertEqual(garden.total_xp, 200)  # XP is 100% preserved

        # User returns!
        garden = update_garden(garden, "login", today="2026-10-21")
        self.assertFalse(garden.is_hibernating)
        self.assertIn("Welcome back", garden.welcome_back_message)
        self.assertEqual(garden.days_tended, 11)


class TestEveningCheckin(unittest.TestCase):
    """FEAT-E3: Evening Check-in tests."""

    def test_process_evening_checkin_success(self):
        checkin = process_evening_checkin("user_1", energy_level=2, optional_note="Tough lab, but finished it")
        self.assertEqual(checkin.energy_level, 2)
        self.assertEqual(checkin.label, "Steady")
        self.assertEqual(checkin.garden_xp_awarded, 15)
        self.assertFalse(checkin.skipped)

    def test_process_evening_skip_zero_penalty(self):
        checkin = process_evening_skip("user_1")
        self.assertTrue(checkin.skipped)
        self.assertEqual(checkin.garden_xp_awarded, 0)
        self.assertIn("valid", checkin.description.lower())


class TestDopamineMenu(unittest.TestCase):
    """FEAT-E4: Dopamine Menu tests."""

    def test_default_menu_contains_starter_items(self):
        menu = get_dopamine_menu()
        self.assertGreaterEqual(len(menu), 5)
        titles = [i["title"] for i in menu]
        self.assertTrue(any("walk" in t.lower() for t in titles))
        self.assertTrue(any("chai" in t.lower() for t in titles))

    def test_engage_dopamine_item_restores_spoons(self):
        result = engage_dopamine_item("dop_1")
        self.assertEqual(result["item_id"], "dop_1")
        self.assertGreater(result["spoon_credit"], 0.0)
        self.assertEqual(result["garden_xp"], 5)


class TestMilestone3FastAPIEndpoints(unittest.TestCase):
    """API Integration Tests for Milestone 3."""

    def setUp(self):
        _spoonsense_demo_store["tasks"]["test_api_user"] = []
        _spoonsense_demo_store["gardens"]["test_api_user"] = GardenState(user_id="test_api_user")

    def test_add_and_get_tasks_api(self):
        resp = client.post("/api/tasks", json={
            "user_id": "test_api_user",
            "title": "Build Parser",
            "task_type": "writing",
            "difficulty": "normal",
            "estimated_minutes": 30,
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["task"]["spoon_cost"], 2.7)

        # Fetch tasks
        get_resp = client.get("/api/tasks/test_api_user")
        self.assertEqual(get_resp.status_code, 200)
        self.assertEqual(get_resp.json()["task_count"], 1)

    def test_add_rest_block_api(self):
        resp = client.post("/api/tasks/rest-block", json={
            "user_id": "test_api_user",
            "title": "Afternoon Chai & Walk",
            "minutes": 20,
        })
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["rest_block"]["spoon_cost"], -0.5)

    def test_plan_day_api(self):
        # Add task first
        client.post("/api/tasks", json={
            "user_id": "test_api_user",
            "title": "Study OS",
            "task_type": "reading",
            "estimated_minutes": 20,
        })
        resp = client.post("/api/plan/today", json={
            "user_id": "test_api_user",
            "target_date": "2026-10-28",
        })
        self.assertEqual(resp.status_code, 200)
        plan = resp.json()["plan"]
        self.assertIn("plannable", plan["explanation"].lower())

    def test_extension_email_api(self):
        resp = client.post("/api/plan/extension-email", json={
            "student_name": "Meera Patel",
            "course_name": "Microprocessors",
            "assignment_title": "Assembly Lab 2",
            "original_due_date": "2026-10-29",
            "proposed_new_date": "2026-10-31",
            "professor_name": "Prof. Rao",
        })
        self.assertEqual(resp.status_code, 200)
        email = resp.json()["email"]
        self.assertIn("Prof. Rao", email["body"])
        self.assertIn("Assembly Lab 2", email["subject"])

    def test_garden_and_evening_checkin_api(self):
        # Evening check-in
        resp = client.post("/api/evening/checkin", json={
            "user_id": "test_api_user",
            "energy_level": 3,
            "optional_note": "Great productive afternoon",
        })
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["checkin"]["label"], "Good")

        # Get garden
        g_resp = client.get("/api/garden/test_api_user")
        self.assertEqual(g_resp.status_code, 200)
        self.assertGreater(g_resp.json()["garden"]["total_xp"], 0)

    def test_dopamine_menu_api(self):
        # Get menu
        resp = client.get("/api/dopamine/menu/test_api_user")
        self.assertEqual(resp.status_code, 200)
        menu = resp.json()["menu"]
        self.assertGreater(len(menu), 0)

        # Engage item
        engage_resp = client.post("/api/dopamine/engage", json={
            "user_id": "test_api_user",
            "item_id": menu[0]["id"],
        })
        self.assertEqual(engage_resp.status_code, 200)
        self.assertIn("spoon_credit", engage_resp.json()["result"])


if __name__ == "__main__":
    unittest.main()
