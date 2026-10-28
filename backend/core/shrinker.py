"""
SpoonSense Task Shrinker & Anti-Paralysis Micro-Sequencer
==========================================================

Pure engine for:
  [FEAT-D1] Task Shrinker (LLM Micro-Sequencer)
  [FEAT-D2] Curated Coping Strategy RAG Corpus
  [FEAT-D3] "Smaller Please" Sub-Divider
  [FEAT-D4] Offline Rule-Based Sequencer Fallback
  [FEAT-D5] Ethical Guardrails & Crisis Redirection

The Shrinker transforms daunting multi-hour tasks into physically actionable
2-minute micro-steps that break executive function paralysis.

Hard Constraints (from PRD Section 15):
  - Step 1 ≤ 2 minutes and physically actionable ("open folder", "write name")
  - BANNED WORDS in system prompt: should, must, behind, late, fail, lazy
  - Every step includes empathetic "why this works" line
  - "Smaller please" halves step complexity up to 3 recursions
  - Offline fallback produces deterministic template steps without LLM
  - Crisis detection redirects to verified helplines, halts sequencing
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional

from core.spoon_engine import compute_task_cost, DEFAULT_DURATIONS, TASK_RATES, DIFFICULTY_MULTIPLIERS


# ── Coping Strategy RAG Corpus (FEAT-D2) ─────────────────────────────────────

COPING_STRATEGIES: List[Dict[str, Any]] = [
    # Two-Minute Rule
    {"id": "cs_01", "name": "Two-Minute Rule", "task_types": ["writing", "admin", "other"],
     "effort": "low", "situations": ["stuck", "procrastinating", "overwhelmed"],
     "text": "If a task takes less than 2 minutes, do it now. For bigger tasks, commit to just 2 minutes — momentum often carries you further.",
     "source": "David Allen, Getting Things Done"},
    {"id": "cs_02", "name": "Two-Minute Rule (Writing)", "task_types": ["writing"],
     "effort": "low", "situations": ["blank_page", "stuck"],
     "text": "Open the document and type literally anything — your name, the date, a question. The blank page is the enemy, not the writing.",
     "source": "Anne Lamott, Bird by Bird"},

    # Implementation Intentions (If-Then)
    {"id": "cs_03", "name": "If-Then Planning", "task_types": ["reading", "writing", "problem_solving"],
     "effort": "low", "situations": ["procrastinating", "distracted"],
     "text": "Set an 'if-then' plan: 'When I sit down at my desk, I will open the assignment file first.' This pre-commits your brain so decision fatigue doesn't stop you.",
     "source": "Peter Gollwitzer, Implementation Intentions"},

    # Body Doubling
    {"id": "cs_04", "name": "Body Doubling", "task_types": ["writing", "reading", "problem_solving"],
     "effort": "low", "situations": ["lonely", "unfocused", "stuck"],
     "text": "Work alongside someone (in person or on a video call). You don't need to talk — just the presence of another person doing work activates your focus circuits.",
     "source": "ADHD Research, Body Doubling Effect"},

    # Task Chunking
    {"id": "cs_05", "name": "Task Chunking", "task_types": ["writing", "problem_solving", "reading"],
     "effort": "medium", "situations": ["overwhelmed", "large_task"],
     "text": "Break the task into pieces small enough that each one feels boring-easy. If a chunk still feels heavy, it's not small enough yet.",
     "source": "Cognitive Load Theory"},
    {"id": "cs_06", "name": "First-Sentence Chunk", "task_types": ["writing"],
     "effort": "low", "situations": ["blank_page", "stuck"],
     "text": "Write just the first sentence. Not the best sentence — just any sentence. You can always delete it later, but it breaks the paralysis now.",
     "source": "Hemingway's Draft Method"},

    # Lowest-Hanging Fruit
    {"id": "cs_07", "name": "Lowest-Hanging Fruit", "task_types": ["admin", "other", "problem_solving"],
     "effort": "low", "situations": ["overwhelmed", "many_tasks"],
     "text": "Start with the easiest, fastest task on your list. Completing it creates a micro-win that fuels momentum for harder tasks.",
     "source": "Teresa Amabile, The Progress Principle"},

    # Sensory Friction Reduction
    {"id": "cs_08", "name": "Sensory Friction Reduction", "task_types": ["reading", "writing", "problem_solving"],
     "effort": "low", "situations": ["distracted", "noisy", "unfocused"],
     "text": "Remove one sensory distraction: put your phone in another room, close extra tabs, or put on noise-cancelling headphones. Reducing friction by even one layer helps.",
     "source": "James Clear, Atomic Habits (Environment Design)"},

    # Gentle Self-Talk
    {"id": "cs_09", "name": "Compassionate Self-Talk", "task_types": ["writing", "reading", "problem_solving", "admin", "other"],
     "effort": "low", "situations": ["self_critical", "stuck", "overwhelmed"],
     "text": "Replace 'I have to finish this' with 'I'm going to spend 5 minutes on this.' Self-compassion reduces anxiety and actually improves performance.",
     "source": "Kristin Neff, Self-Compassion Research"},
    {"id": "cs_10", "name": "Progress Over Perfection", "task_types": ["writing", "problem_solving"],
     "effort": "low", "situations": ["perfectionism", "stuck"],
     "text": "A messy draft you can edit is infinitely better than a perfect draft that doesn't exist. Give yourself permission to write badly.",
     "source": "Anne Lamott, Shitty First Drafts"},

    # Pomodoro-style
    {"id": "cs_11", "name": "Micro-Pomodoro", "task_types": ["reading", "writing", "problem_solving"],
     "effort": "low", "situations": ["unfocused", "fatigued"],
     "text": "Set a timer for 10 minutes (not 25). Work until it rings, then decide if you want to continue. Most people do.",
     "source": "Modified Pomodoro Technique"},

    # Movement Breaks
    {"id": "cs_12", "name": "Movement Micro-Break", "task_types": ["reading", "writing", "problem_solving"],
     "effort": "low", "situations": ["fatigued", "stuck", "restless"],
     "text": "Stand up, stretch for 30 seconds, take 3 deep breaths. Physical movement resets your prefrontal cortex and restores working memory.",
     "source": "John Ratey, Spark: Exercise and the Brain"},

    # Reward Bundling
    {"id": "cs_13", "name": "Temptation Bundling", "task_types": ["reading", "admin"],
     "effort": "low", "situations": ["unmotivated", "boring_task"],
     "text": "Pair the task with something enjoyable: study with your favorite tea, read the paper at your favorite cafe spot, or listen to ambient music while doing admin.",
     "source": "Katy Milkman, Temptation Bundling"},

    # Visualization
    {"id": "cs_14", "name": "Done-State Visualization", "task_types": ["writing", "problem_solving"],
     "effort": "low", "situations": ["overwhelmed", "stuck"],
     "text": "Spend 30 seconds imagining how you'll feel after completing just this one small step. The relief is real and motivating.",
     "source": "Gabriele Oettingen, Mental Contrasting"},

    # External Accountability
    {"id": "cs_15", "name": "Tiny Commitment", "task_types": ["writing", "reading", "problem_solving", "admin"],
     "effort": "low", "situations": ["procrastinating"],
     "text": "Tell one person (friend, study group) 'I'm going to open my assignment in the next 5 minutes.' External commitment activates social accountability without pressure.",
     "source": "Behavioral Economics, Commitment Devices"},
]


def retrieve_coping_strategies(
    task_type: str,
    situation: str = "stuck",
    top_k: int = 3,
) -> List[Dict[str, Any]]:
    """Retrieve the most relevant coping strategies using keyword matching.

    For MVP this uses simple keyword overlap scoring instead of vector
    embeddings. Production would use pgvector cosine similarity.

    Args:
        task_type: The task category (reading, writing, etc.).
        situation: User context keyword (stuck, overwhelmed, etc.).
        top_k: Number of strategies to return.

    Returns:
        Top-k ranked coping strategy entries.
    """
    scored = []
    for strategy in COPING_STRATEGIES:
        score = 0.0
        if task_type in strategy.get("task_types", []):
            score += 2.0
        if situation in strategy.get("situations", []):
            score += 3.0
        # Partial match on situation keywords
        for s in strategy.get("situations", []):
            if situation in s or s in situation:
                score += 1.0
        if score > 0:
            scored.append((score, strategy))

    scored.sort(key=lambda x: -x[0])
    return [s[1] for s in scored[:top_k]]


# ── Offline Rule-Based Sequencer (FEAT-D4) ────────────────────────────────────

OFFLINE_TEMPLATES: Dict[str, List[Dict[str, Any]]] = {
    "writing": [
        {"position": 1, "text": "Open the document file or create a new blank document.", "minutes": 2, "spoon_cost": 0.2,
         "why": "Starting is the hardest part. Just opening the document breaks paralysis."},
        {"position": 2, "text": "Type your name and today's date at the top.", "minutes": 1, "spoon_cost": 0.1,
         "why": "A tiny physical action signals your brain that work has begun."},
        {"position": 3, "text": "Write one bullet point summarizing what this assignment is about.", "minutes": 3, "spoon_cost": 0.3,
         "why": "One sentence is infinitely more than zero. Progress over perfection."},
        {"position": 4, "text": "List 3 section headings or key points you want to cover.", "minutes": 5, "spoon_cost": 0.5,
         "why": "Structure reduces overwhelm. You now have a map instead of a blank page."},
        {"position": 5, "text": "Write 2-3 rough sentences under the first heading.", "minutes": 8, "spoon_cost": 0.7,
         "why": "Momentum is building. These sentences don't need to be perfect."},
    ],
    "problem_solving": [
        {"position": 1, "text": "Open your code editor or notebook to a blank page.", "minutes": 2, "spoon_cost": 0.2,
         "why": "Getting the tool open is half the battle with coding paralysis."},
        {"position": 2, "text": "Read the problem statement or first requirement out loud.", "minutes": 2, "spoon_cost": 0.2,
         "why": "Reading aloud activates verbal processing and helps parse the problem."},
        {"position": 3, "text": "Write one line of pseudocode or a comment describing what the code needs to do.", "minutes": 3, "spoon_cost": 0.3,
         "why": "Comments before code reduces cognitive load. Think before you type."},
        {"position": 4, "text": "Write the function signature or class skeleton with placeholder names.", "minutes": 5, "spoon_cost": 0.5,
         "why": "Structure first, logic second. You've just created a scaffold."},
        {"position": 5, "text": "Implement just the simplest test case or first function body.", "minutes": 10, "spoon_cost": 0.9,
         "why": "One working piece builds confidence for the next."},
    ],
    "reading": [
        {"position": 1, "text": "Open the PDF, textbook, or article to the first page.", "minutes": 1, "spoon_cost": 0.1,
         "why": "Having the material visible in front of you removes the friction of 'finding it'."},
        {"position": 2, "text": "Read only the title, abstract, and section headings.", "minutes": 3, "spoon_cost": 0.2,
         "why": "Skimming structure gives your brain a roadmap before deep reading."},
        {"position": 3, "text": "Highlight or underline 1 sentence that seems important.", "minutes": 2, "spoon_cost": 0.2,
         "why": "Active marking keeps your brain engaged instead of passive scanning."},
        {"position": 4, "text": "Read the first full section or first 2 pages carefully.", "minutes": 8, "spoon_cost": 0.5,
         "why": "Deep reading a small chunk is more productive than skimming everything."},
        {"position": 5, "text": "Write 1 sentence summary of what you just read.", "minutes": 3, "spoon_cost": 0.3,
         "why": "Summarizing in your own words locks information into memory."},
    ],
    "admin": [
        {"position": 1, "text": "Open your email or the admin portal you need.", "minutes": 1, "spoon_cost": 0.1,
         "why": "The hardest part of admin tasks is starting them."},
        {"position": 2, "text": "Read the first item or form field that needs filling.", "minutes": 2, "spoon_cost": 0.1,
         "why": "One field at a time. Don't look at the whole form."},
        {"position": 3, "text": "Fill in just the personal info fields (name, ID, date).", "minutes": 3, "spoon_cost": 0.2,
         "why": "These require zero thinking — pure muscle memory progress."},
        {"position": 4, "text": "Complete or draft the core content of the form/email.", "minutes": 5, "spoon_cost": 0.3,
         "why": "You're past the friction point. The hard part is done."},
    ],
    "other": [
        {"position": 1, "text": "Sit in your study chair or workspace for 60 seconds.", "minutes": 1, "spoon_cost": 0.1,
         "why": "Physically being in the workspace primes your brain for work mode."},
        {"position": 2, "text": "Write down what you need to do in one sentence.", "minutes": 2, "spoon_cost": 0.2,
         "why": "Externalizing the task from your head onto paper reduces mental load."},
        {"position": 3, "text": "Do the single smallest action related to this task.", "minutes": 3, "spoon_cost": 0.2,
         "why": "Any forward movement counts. Perfection is not the goal right now."},
        {"position": 4, "text": "Spend 5 minutes working on it — set a timer.", "minutes": 5, "spoon_cost": 0.3,
         "why": "A time-bounded commitment removes the anxiety of an endless task."},
    ],
}


def offline_sequence(
    title: str,
    task_type: str,
    live_spoons: float = 6.0,
) -> Dict[str, Any]:
    """Generate a deterministic micro-step sequence without any LLM call.

    100% offline, zero network, deterministic output. Used as fallback when
    Gemini is unavailable or rate-limited.

    Args:
        title: Task title (used in step text personalization).
        task_type: reading, writing, problem_solving, admin, other.
        live_spoons: Current spoon budget (for step count limiting).

    Returns:
        Dict with ``steps`` list and ``strategy`` metadata.
    """
    template_key = task_type if task_type in OFFLINE_TEMPLATES else "other"
    raw_steps = OFFLINE_TEMPLATES[template_key]

    # Limit steps to fit within budget
    steps = []
    budget_remaining = live_spoons * 0.6  # Use 60% of budget for shrunk steps
    for step in raw_steps:
        if step["spoon_cost"] <= budget_remaining or len(steps) == 0:
            # Personalize step text with actual task title
            personalized = dict(step)
            if len(steps) == 0 and title:
                personalized["text"] = personalized["text"].replace(
                    "the document file", f"'{title}'"
                ).replace(
                    "the PDF, textbook, or article", f"'{title}'"
                ).replace(
                    "your code editor or notebook", f"the workspace for '{title}'"
                )
            steps.append(personalized)
            budget_remaining -= step["spoon_cost"]

    # Get relevant coping strategy
    strategies = retrieve_coping_strategies(task_type, "stuck", top_k=1)
    strategy_text = strategies[0]["text"] if strategies else "Starting small is the proven way to overcome paralysis."

    return {
        "steps": steps,
        "total_cost": round(sum(s["spoon_cost"] for s in steps), 2),
        "total_minutes": sum(s["minutes"] for s in steps),
        "strategy": strategy_text,
        "source": "offline_template",
        "task_title": title,
        "task_type": task_type,
    }


# ── "Smaller Please" Sub-Divider (FEAT-D3) ───────────────────────────────────

ATOMIC_ACTIONS: Dict[str, List[str]] = {
    "writing": [
        "Sit in your study chair for 60 seconds without opening the laptop.",
        "Open the laptop lid and wait for the screen to light up.",
        "Click on the document icon — just click, don't type yet.",
        "Place your fingers on the keyboard. Feel the keys.",
        "Type exactly one word. Any word.",
    ],
    "problem_solving": [
        "Sit at your desk and place your hands flat on the table.",
        "Open the code editor. Just look at the screen.",
        "Read one line of the problem statement. Just one line.",
        "Type a single comment: // I am here.",
        "Save the file. That's progress.",
    ],
    "reading": [
        "Pick up the book or open the PDF. Don't read yet.",
        "Look at the cover or title page for 10 seconds.",
        "Read just the title of the first section.",
        "Read one sentence. Any sentence on the page.",
        "Close your eyes and recall that one sentence.",
    ],
    "admin": [
        "Open the browser or app you need.",
        "Look at the first field. Just look.",
        "Type your name in the first field.",
        "Take a breath. You've started.",
    ],
    "other": [
        "Sit in your workspace for 30 seconds.",
        "Pick up the tool or material you need.",
        "Do the smallest physical action related to this task.",
        "Acknowledge you showed up. That counts.",
    ],
}


def subdivide_step(
    step_text: str,
    task_type: str,
    recursion_depth: int = 0,
    max_recursions: int = 3,
) -> Dict[str, Any]:
    """Halve step complexity into atomic sensory actions (FEAT-D3).

    Works up to 3 recursions. Each sub-step awards micro-win XP.

    Args:
        step_text: The step that still feels too hard.
        task_type: Task category for template selection.
        recursion_depth: Current recursion level (0-based).
        max_recursions: Maximum allowed recursions.

    Returns:
        Dict with ``sub_steps`` list and metadata.
    """
    if recursion_depth >= max_recursions:
        return {
            "sub_steps": [{
                "position": 1,
                "text": "Take one deep breath. You're here, and that's enough.",
                "minutes": 1,
                "spoon_cost": 0.05,
                "why": "Sometimes the bravest thing is simply being present. Rest is valid.",
            }],
            "recursion_depth": recursion_depth,
            "max_reached": True,
            "message": "You've reached the smallest possible step. Being present is enough.",
        }

    key = task_type if task_type in ATOMIC_ACTIONS else "other"
    atoms = ATOMIC_ACTIONS[key]

    # Select atoms based on recursion depth (deeper = simpler)
    start_idx = min(recursion_depth, len(atoms) - 2)
    selected = atoms[start_idx:start_idx + 3]

    sub_steps = []
    for i, atom in enumerate(selected):
        sub_steps.append({
            "position": i + 1,
            "text": atom,
            "minutes": 1,
            "spoon_cost": 0.05,
            "why": "This is small enough to do without thinking. Just the physical motion.",
        })

    return {
        "sub_steps": sub_steps,
        "recursion_depth": recursion_depth + 1,
        "max_reached": False,
        "original_step": step_text,
        "message": f"Here's something even smaller. Complete any one of these for a micro-win.",
    }


# ── Ethical Guardrails & Crisis Detection (FEAT-D5) ──────────────────────────

CRISIS_KEYWORDS = [
    "kill myself", "want to die", "suicide", "self harm", "self-harm",
    "end it all", "not worth living", "cutting myself", "hurting myself",
    "don't want to be alive", "overdose",
]

DIAGNOSTIC_KEYWORDS = [
    "do i have adhd", "am i depressed", "am i bipolar",
    "clinical depression", "diagnose me", "mental illness",
    "am i mentally ill", "psychiatric", "disorder",
    "do i have anxiety disorder", "am i autistic",
]

CRISIS_RESPONSE = {
    "type": "crisis_redirect",
    "message": "I hear you, and I want you to know that reaching out matters. You deserve support from someone who can truly help.",
    "helplines": [
        {"name": "Vandrevala Foundation", "number": "1860-2662-345", "available": "24/7", "type": "call"},
        {"name": "iCall (TISS)", "number": "9152987821", "available": "Mon-Sat 8am-10pm", "type": "call"},
        {"name": "AASRA", "number": "9820466726", "available": "24/7", "type": "call"},
        {"name": "Tele-MANAS", "number": "14416", "available": "24/7", "type": "call"},
    ],
    "steps": None,
    "halted": True,
}

DIAGNOSTIC_RESPONSE = {
    "type": "diagnostic_redirect",
    "message": "I'm not qualified to make clinical assessments, and I wouldn't want to give you inaccurate information. What I can tell you is that your campus counseling center can provide a proper, confidential evaluation — and reaching out to them is a sign of strength, not weakness.",
    "suggestion": "Your VJTI Student Wellness Center or any campus counselor can help with a proper assessment. Would you like help planning your study tasks instead?",
    "steps": None,
    "halted": False,
}

BANNED_WORDS = {"should", "must", "behind", "late", "fail", "lazy", "failure", "falling behind"}


def check_ethical_guardrails(user_note: str) -> Optional[Dict[str, Any]]:
    """Check user input for crisis signals or diagnostic requests.

    Args:
        user_note: The user's text input or note.

    Returns:
        Crisis or diagnostic redirect response, or None if clean.
    """
    if not user_note:
        return None

    lower = user_note.lower().strip()

    # Crisis detection (highest priority)
    for keyword in CRISIS_KEYWORDS:
        if keyword in lower:
            return dict(CRISIS_RESPONSE)

    # Diagnostic request detection
    for keyword in DIAGNOSTIC_KEYWORDS:
        if keyword in lower:
            return dict(DIAGNOSTIC_RESPONSE)

    return None


def sanitize_output(text: str) -> str:
    """Remove banned words from generated output.

    Replaces words like 'should', 'must', 'lazy' with empathetic alternatives.
    """
    replacements = {
        "should": "could",
        "must": "can",
        "behind": "working through",
        "late": "taking your time with",
        "fail": "learn from",
        "lazy": "resting",
        "failure": "learning experience",
        "falling behind": "moving at your pace",
    }
    result = text
    for banned, replacement in replacements.items():
        # Case-insensitive replacement preserving sentence position
        pattern = re.compile(re.escape(banned), re.IGNORECASE)
        result = pattern.sub(replacement, result)
    return result


# ── Gemini LLM Shrinker (FEAT-D1) ────────────────────────────────────────────

SHRINKER_SYSTEM_PROMPT = """You are SpoonSense's Anti-Paralysis Task Shrinker — a compassionate micro-sequencer for students with cognitive overload.

Your job: Transform a daunting task into a sequence of tiny, physically actionable micro-steps that break executive function paralysis.

ABSOLUTE RULES:
1. Step 1 MUST be ≤ 2 minutes and physically actionable (e.g., "Open Google Docs", "Write your name at the top").
2. NEVER use these words: should, must, behind, late, fail, lazy, failure, falling behind.
3. Every step includes a warm "why" explanation grounded in behavioral science.
4. Keep total steps between 3 and 6.
5. Each step has: position (int), text (str), minutes (int), spoon_cost (float), why (str).
6. spoon_cost per step should be 0.1 to 1.0 spoons.
7. Tone: warm, encouraging, zero judgment. You are a supportive study buddy, not a drill sergeant.
8. Respond ONLY with valid JSON matching this schema:
{{
  "steps": [
    {{"position": 1, "text": "...", "minutes": 2, "spoon_cost": 0.2, "why": "..."}}
  ]
}}

CONTEXT:
- The student's current cognitive energy budget is {live_spoons} spoons (out of 12).
- Lower spoons = simpler, shorter steps.
- If spoons < 3, limit to 3 steps max and keep each under 5 minutes.

COPING STRATEGIES TO GROUND YOUR ADVICE:
{strategies}
"""


async def shrink_task_with_gemini(
    title: str,
    task_type: str,
    live_spoons: float,
    user_note: str = "",
) -> Dict[str, Any]:
    """Call Gemini API to generate personalized micro-step sequence.

    Falls back to offline_sequence() on any error.

    Args:
        title: Task title.
        task_type: Task category.
        live_spoons: Current spoon budget.
        user_note: Optional user context ("I feel stuck").

    Returns:
        Dict with steps, metadata, and source ("gemini" or "offline_fallback").
    """
    # Ethical guardrails first
    guardrail = check_ethical_guardrails(user_note)
    if guardrail:
        return guardrail

    # Retrieve relevant coping strategies
    situation = "stuck"
    if user_note:
        note_lower = user_note.lower()
        if "overwhelm" in note_lower:
            situation = "overwhelmed"
        elif "distract" in note_lower:
            situation = "distracted"
        elif "blank" in note_lower or "start" in note_lower:
            situation = "blank_page"
        elif "boring" in note_lower or "motivat" in note_lower:
            situation = "unmotivated"

    strategies = retrieve_coping_strategies(task_type, situation, top_k=3)
    strategy_text = "\n".join(
        f"- {s['name']}: {s['text']} (Source: {s['source']})"
        for s in strategies
    )

    # Build prompt
    system_prompt = SHRINKER_SYSTEM_PROMPT.format(
        live_spoons=live_spoons,
        strategies=strategy_text,
    )

    user_prompt = f'Task: "{title}" (Type: {task_type})\n'
    if user_note:
        user_prompt += f'Student says: "{user_note}"\n'
    user_prompt += f"Current energy: {live_spoons} spoons out of 12.\n"
    user_prompt += "Generate the micro-step sequence as JSON."

    try:
        from google import genai

        api_key = os.environ.get("GEMINI_API_KEY", "")
        if not api_key:
            raise ValueError("No GEMINI_API_KEY")

        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_prompt,
            config=genai.types.GenerateContentConfig(
                system_instruction=system_prompt,
                temperature=0.7,
                max_output_tokens=1024,
            ),
        )

        raw_text = response.text.strip()

        # Extract JSON from response (may be wrapped in ```json blocks)
        json_match = re.search(r'\{[\s\S]*\}', raw_text)
        if json_match:
            parsed = json.loads(json_match.group())
        else:
            raise ValueError("No JSON found in Gemini response")

        steps = parsed.get("steps", [])
        if not steps:
            raise ValueError("Empty steps array")

        # Sanitize banned words from all step text
        for step in steps:
            step["text"] = sanitize_output(step.get("text", ""))
            step["why"] = sanitize_output(step.get("why", ""))

        return {
            "steps": steps,
            "total_cost": round(sum(s.get("spoon_cost", 0.2) for s in steps), 2),
            "total_minutes": sum(s.get("minutes", 2) for s in steps),
            "strategy": strategies[0]["text"] if strategies else "",
            "source": "gemini",
            "task_title": title,
            "task_type": task_type,
        }

    except Exception as e:
        print(f"[shrinker] Gemini call failed ({e}), falling back to offline templates")
        result = offline_sequence(title, task_type, live_spoons)
        result["source"] = "offline_fallback"
        result["fallback_reason"] = str(e)
        return result
