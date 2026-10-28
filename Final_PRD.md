# SpoonSense: Product Requirements Document

A load-aware planner that forecasts a student's energy budget, checks it with a 20-second game, and shrinks tasks instead of shaming people.

- Document status: v2.0, full build specification
- Problem statement: Task paralysis and executive dysfunction support (Empathy / Intervention Friction / Ethical Proxy Tracking / Usability)
- Chosen track: Planner (primary), with a light Sequencer layer and an optional Observer layer
- Target user: Indian college students with heavy commutes and dense timetables
- Build target: PWA, hackathon MVP, followed by a validation pilot

---

## Table of contents

1. How to read this document
2. The problem, broken down into simple things
3. What we are building, in one page
4. Goals, non-goals, and success criteria
5. Judging rubric and how the product earns it
6. Personas
7. Product principles and language rules
8. Scope: MVP, Tier 2, roadmap
9. Signal stack
10. End-to-end user journeys
11. Functional requirements (by module)
12. The capacity model (spoons) in full detail
13. Game design and scoring specification
14. Task cost engine and planner logic
15. Micro-sequencer (LLM plus RAG) specification
16. Gamification without shame
17. Data model
18. System architecture and tech stack
19. API specification
20. Privacy, ethics, and safety
21. UX and UI specification
22. Notifications policy
23. Metrics and instrumentation
24. Pilot study design
25. Testing plan
26. Build plan and team split
27. Demo script and pitch outline
28. Risks and mitigations
29. Reuse versus change from the earlier PRD
30. Open questions
31. Glossary
32. Appendices

---

## 1. How to read this document

- Sections 2 to 5 explain what the problem is and what we are building. Read these first.
- Sections 6 to 10 explain who it is for and how it behaves from their side.
- Sections 11 to 16 are the build specification. Each requirement has an ID such as FR-TT-03 so you can reference it in tickets.
- Sections 17 to 19 are the technical design.
- Sections 20 to 23 cover ethics, UX, notifications, and measurement.
- Sections 24 to 28 cover validation, testing, planning, and risk.
- Priority labels used throughout:
  - P0 means must exist for the hackathon demo.
  - P1 means should exist if time allows.
  - P2 means optional, demo toggle, or post-hackathon.
- Numbers marked "illustrative" are starting values. They are not validated. They must be calibrated in the pilot, and the product must say so wherever it shows them.

---

## 2. The problem, broken down into simple things

### 2.1 The problem statement in plain words

- Many students struggle to start tasks even when they know the task matters. This is task paralysis.
- It is common with ADHD, autism, burnout, and plain overload. We do not need to know which one applies, and we must never guess.
- Normal productivity apps use streaks, red overdue badges, repeated reminders, and guilt. For someone already overloaded, that adds shame, and shame makes starting harder.
- The challenge: build something that notices indirect signs of paralysis and responds with low-effort help instead of more pressure.

### 2.2 What the problem statement actually asks for

Three possible tracks are offered. We may pick one or blend.

- Observer: use a webcam, blink rate, and gaze, processed locally, to notice signs of overload.
- Sequencer: use an LLM with retrieval to break an overwhelming task into tiny steps.
- Planner: use a "spoons" energy model to schedule a student's work around their capacity.

We blend, with the Planner as the spine:

- Planner is the spine because it acts before paralysis happens.
- Sequencer is the rescue tool for the moment a task already feels too big.
- Observer is optional, opt-in, and off by default, because it carries the most ethical risk.

### 2.3 What the judges score

- Empathy, 30%: does the product feel kind to someone who is struggling?
- Intervention Friction, 30%: is every interaction easy to do when you are overloaded?
- Ethical Proxy Tracking, 20%: do we track indirect signals responsibly, without diagnosing or surveilling?
- Usability, 20%: can a normal student use it without a tutorial?

Consequence: 60% of the score is about gentleness. Model accuracy is not on the rubric. We should spend effort on how the product feels and not on squeezing prediction accuracy.

### 2.4 The whole thing as six simple questions

What we have to develop is the answer to six questions, each of which becomes a module:

1. How much energy does this student probably have today?
   - Module: Context load model (timetable, commute, deadlines, carryover).
2. Is that estimate right for today, for this person?
   - Module: 20-second games compared against the person's own baseline.
3. What can they reasonably do with that energy?
   - Module: Task cost engine and capacity-sized planner.
4. What if a task still feels impossible?
   - Module: Micro-sequencer that shrinks the task into a tiny first step.
5. How do we keep them coming back without guilt?
   - Module: Forgiving garden, micro-win XP, energy weather, dopamine menu.
6. How do we do all of this without being creepy or clinical?
   - Module: Privacy-first design, visible reasoning, no diagnosis, export and delete.

### 2.5 The one-sentence product

SpoonSense tells a student how much energy their day can probably hold, double-checks with a 20-second game, and then fits the work to the energy instead of blaming the student for not fitting the work.

### 2.6 What a developer must build, as a checklist

- A way to bring in a timetable and commute details with almost no typing.
- A spoon calculation that turns context into a number and explains itself.
- Three tiny games that run in the browser and score against a personal baseline.
- A background signal collector for in-app behaviour such as idle time and snoozes.
- A one-tap evening check-in that records how the day felt.
- A task list where every task has a spoon cost.
- A planner that places tasks into days and hours based on capacity.
- A reshuffler that moves work when capacity drops and drafts a polite extension email when it cannot.
- A micro-sequencer that turns a task into steps using an LLM and a small retrieval corpus.
- A Google Calendar writer for capacity-sized blocks.
- A garden, XP, and weather layer that never punishes.
- A "why" panel for every inference.
- Settings for privacy, export, delete, reduced motion, and dark mode.
- Optional Tier 2 inputs behind explicit opt-in: smartwatch, voice, camera.

### 2.7 What we are deliberately not building

- No depression, anxiety, ADHD, or autism detection or labels.
- No emotion recognition from faces.
- No institution dashboard or any view that lets a college see individual data.
- No productivity scoring that ranks students.
- No notification spam, no overdue-red UI, no broken-streak messages.

---

## 3. What we are building, in one page

### 3.1 Product summary

SpoonSense is a progressive web app. Each day it does four things:

1. Forecast: it estimates the day's "spoons" from the timetable, commute, deadlines, and yesterday's spend.
2. Check: it offers a 20-second game and compares the result with the student's own baseline.
3. Fit: it sizes the day's tasks to the live spoon count and writes them into Google Calendar.
4. Shrink: when a task feels too big, it breaks the first step down until starting is easy.

### 3.2 The spoon idea

- A spoon is one unit of energy for tasks that need mental effort.
- A normal day starts with a budget of 12 spoons in our default model.
- Commuting, being on campus, deadlines, and yesterday's exhaustion consume spoons.
- What remains is what the student can spend on work, chores, and rest.
- Spoons are a planning metaphor, not a measurement of any medical quantity. The UI says so.

### 3.3 The USP

> Knows your energy budget before you wake up, checks it with a 20-second game instead of a questionnaire, and shrinks your tasks instead of shaming you.

Four differentiators:

1. Pre-emptive: forecasts tomorrow's capacity before paralysis happens.
2. Zero-question sensing: timetable data plus 20-second games, with optional watch, voice, and camera signals.
3. Capacity, not diagnosis: outputs spoons, never clinical labels.
4. Shrink, don't shame: forgiving streaks, automatic reshuffling, and micro-step sequencing.

### 3.4 Why this approach beats the obvious alternatives

- Versus questionnaires: questionnaires ask an overloaded person to describe their state in words, which is exactly what overload makes hard. Our games take about 20 seconds and need no articulation.
- Versus text or voice sentiment models: these tend to fail when someone is too overwhelmed to write or speak expressively, and clinical labels create ethical risk.
- Versus webcam-first tracking: gaze and blink are noisy proxies and feel like surveillance. We keep them optional.
- Versus classic to-do apps: those assume constant capacity. We assume capacity varies and plan around it.

### 3.5 Corrected assumptions from the earlier review

- Commute and schedule density predict load as a prior, a starting estimate. They predict risk and capacity, not actual stress. Two students with the same commute differ because of crowding, noise, and sleep, so the model must personalise.
- Games beat questionnaires for friction, but a poor game score can mean sleepy, distracted, or unmotivated. So we compare to the person's own baseline, combine more than one signal, and never call the output stress.
- A month-long study with 5 to 10 students is a good validation pilot. It is not a hackathon deliverable, and about 200 student-days is too little for a generalising ML model. We use a transparent weighted model plus per-user calibration, and present the pilot as evidence and roadmap.
- Face, voice, and smartwatch signals stay optional. Face emotion detection is scientifically weak and ethically risky, and it would cost points on Ethical Proxy Tracking.

---

## 4. Goals, non-goals, and success criteria

### 4.1 Product goals

- G1: Reduce the effort needed to start a task on a low-capacity day.
- G2: Give every student an honest, explainable estimate of their day's capacity.
- G3: Make daily check-ins take under one minute, and make them skippable without penalty.
- G4: Never produce a message that could make a struggling student feel judged.
- G5: Keep all sensitive processing on the device wherever feasible.

### 4.2 Hackathon goals

- H1: A working end-to-end demo of the Planner loop: import, forecast, game, plan, reshuffle.
- H2: A working micro-sequencer demo on a real task.
- H3: A visible "why" panel on every inference.
- H4: A clear privacy story that judges can verify in the UI.
- H5: A demo that shows two contrasting students (heavy commute versus light commute) getting different, sensible plans.

### 4.3 Non-goals

- NG1: Clinical accuracy. We are not a diagnostic or treatment tool.
- NG2: Training a generalising ML model within the hackathon.
- NG3: Replacing counselling or medical support.
- NG4: Employer, parent, or institution visibility into individual data.
- NG5: Native mobile apps in the first version.

### 4.4 Success criteria (hackathon)

- A judge can complete onboarding in under 3 minutes.
- A judge can complete one daily check-in in under 45 seconds, including the game.
- Skipping the game takes one tap and changes nothing negative on screen.
- Every spoon number on screen has a working "why" explanation.
- No screen contains diagnostic or clinical wording.
- The micro-sequencer returns a usable first step for at least 8 out of 10 test tasks in our own testing.

### 4.5 Success criteria (pilot, later)

- At least 70% of pilot participants still check in on day 14 without prompting.
- Median daily check-in time under 60 seconds.
- Participants rate the app's tone as "kind" or better in exit feedback.
- Report, with confidence intervals and honest caveats, how much variance in next-evening self-rated spoons is explained by context plus games under leave-one-student-out validation. We do not set a target figure in advance and we do not claim a number we have not measured.

---

## 5. Judging rubric and how the product earns it

### 5.1 Empathy (30%)

- The spoon framing treats low energy as a normal variable and not as a failing.
- Streaks never break. A missed day is frozen. A rest day counts as a win.
- Copy avoids "overdue", "failed", "behind", and "should".
- Extension-email drafts help students ask for help politely.
- Low-capacity days get less demanded of them, and the app says that plainly.

### 5.2 Intervention Friction (30%)

- Daily sensing takes about 40 seconds and is skippable.
- Evening label is one tap.
- A first step is as small as two minutes, such as "open the file".
- Reminders are soft and are never repeated for the same item.
- The most important action on any screen is a large, single button.

### 5.3 Ethical Proxy Tracking (20%)

- Games and scoring run on the client.
- Camera is off by default and processed locally if enabled.
- Voice is optional and analysed on the device only.
- Every inference has a visible "why" explanation and can be overridden.
- No diagnoses or labels.
- Export and delete are always available.
- Persistent low capacity triggers only a gentle suggestion to consider campus counselling, never an alert to anyone else.

### 5.4 Usability (20%)

- PWA that installs on a phone home screen.
- Large tap targets, minimum 48 px.
- Reduced-motion toggle, and a calm dark mode.
- One primary action per screen.
- No jargon, no tutorial required.

---

## 6. Personas

### 6.1 Aarav, the heavy-commute student

- Second-year engineering student.
- Travels about two hours each way on crowded trains.
- On campus 8:30 to 5:30 on Mondays, shorter days later in the week.
- Notices that he can focus in the morning but is wiped out by the evening.
- Pain point: apps schedule evening study blocks that he cannot meet, then flag him as behind.
- Needs: forecast of heavy days, evening tasks automatically lightened, polite extension drafts.

### 6.2 Meera, the light-commute student

- Same course and same timetable as Aarav, but lives ten minutes from campus.
- Has more spare capacity on the same day.
- Pain point: generic planners do not use her extra capacity well.
- Needs: bigger deep-work blocks placed where her energy is high, without guilt on lighter days.

### 6.3 Isha, the student who freezes at the start

- Knows what to do, cannot begin.
- Sits with a document open for long stretches.
- Pain point: reminders increase anxiety.
- Needs: soft "shrink it?" prompt after idle time, a two-minute first step, and no repeated nagging.

### 6.4 Rohan, the privacy-conscious student

- Distrusts apps that watch him.
- Will use the product only if he can see what is collected and delete it.
- Needs: a clear privacy page, camera off by default, export and delete.

### 6.5 Design implications from the personas

- Context matters as much as personality, so the model must use both commute and baseline.
- The same product must handle heavy and light days without moralising either.
- Privacy controls must be easy to find and easy to understand.

---

## 7. Product principles and language rules

### 7.1 Principles

1. Capacity before ambition: plan to what the student has, not to what they wish they had.
2. Shrink, never shame: when something is too big, make it smaller.
3. Skippable by default: every sensing step has a no-penalty skip.
4. Explain everything: no number without a reason the user can read.
5. User overrides always win: the user can set spoons manually at any time.
6. Own the uncertainty: show that estimates are estimates.
7. Rest is progress: rest days are valid outcomes, not gaps.
8. Local first: sensitive scoring stays on the device.
9. No clinical voice: never name conditions, never imply diagnosis.
10. One thing at a time: each screen asks for one decision.

### 7.2 Language rules (copy guide)

Words and phrases to avoid:

- overdue, late, behind, failed, missed, lazy, unproductive
- stressed, depressed, anxious, burnout (as a label of the person)
- "you should", "you must", "don't forget"
- streak broken, you lost your streak
- any claim to detect emotions

Words and phrases to prefer:

- "light day", "low battery", "recharge", "when you're ready"
- "want to shrink it?", "just step one?"
- "moved for you", "rescheduled for a lighter day"
- "your usual", "compared to your own pattern"
- "Rest is a W"

### 7.3 Tone examples

- Instead of "You missed 3 tasks": "Three things moved to Thursday, which looks lighter."
- Instead of "Your reaction time is slow": "Today looks a bit heavier than your usual."
- Instead of "Low energy detected": "Light mode today. Here's why."
- Instead of "Reminder: submit lab report": "When you have a moment, step one is opening the doc."

### 7.4 Copy review rule

Every string added to the product must be checked against 7.2 before merging. A copy checklist is included in Appendix C.

---
## 8. Scope: MVP, Tier 2, roadmap

### 8.1 MVP (hackathon, P0)

- Google sign-in.
- Timetable import (ICS upload, and manual weekly grid as fallback).
- Commute form (minutes each way, mode).
- Task and deadline entry.
- Spoon model with explanation panel.
- Pulse game with personal baseline.
- Skip button.
- Capacity-sized daily plan.
- Evening one-tap label.
- Micro-sequencer for a single task.
- Garden streak that never dies.
- Energy-weather forecast for the next 7 days.

### 8.2 Should-have (P1)

- Switch game and Pop Garden game.
- Google Calendar block writing.
- Auto-reshuffle with extension-email draft.
- Timetable photo parsing with Gemini vision.
- Idle-time prompt ("want to shrink it?").
- Dopamine menu.
- Micro-win XP.
- Data export and delete.

### 8.3 Optional (P2)

- Smartwatch sleep, resting heart rate, and HRV via Health Connect or HealthKit.
- Voice sentence with on-device prosody features.
- Camera blink and gaze during the game, with MediaPipe, opt-in.
- Body-doubling room.
- WhatsApp reminders.
- Campus counselling resource suggestion for persistent low capacity.

### 8.4 Roadmap (post-hackathon)

- Pilot study and model calibration.
- Per-user weight learning.
- Native wrappers for better background and watch integration.
- Accessibility audit with real users.
- Localisation to Hindi and Marathi.

### 8.5 Scope rule for the hackathon

If a P0 item is at risk, drop P1 and P2 items entirely. A smooth P0 demo scores higher than a broken P1 demo.

---

## 9. Signal stack

Signals are ordered cheapest first for the student.

### 9.1 Tier 1 (MVP)

- Timetable, commute minutes and mode, deadlines.
  - Effort: one-time setup.
  - Used for: the prior spoon estimate.
- Two 20-second games (Pulse and Switch), plus the easy Pop Garden.
  - Effort: about 40 seconds a day, skippable.
  - Used for: the live multiplier and the "can't think" versus "can't start" split.
- In-app behaviour: time-to-first-action, snoozes, repeated task reshuffling.
  - Effort: zero.
  - Used for: paralysis proxy and prompts.
- Evening one-tap "spoons left?".
  - Effort: one tap.
  - Used for: the only ground-truth label, and for carryover.

### 9.2 Tier 2 (optional, opt-in)

- Smartwatch sleep, resting heart rate, HRV via Health Connect or HealthKit.
  - Effort: zero if they own a watch.
- Voice: one spoken sentence, prosody features analysed on-device.
  - Effort: optional, a few seconds.
- Blink and gaze during the game, local MediaPipe.
  - Effort: optional opt-in.

### 9.3 What we do not use

- Face emotion classification.
- Text sentiment from free journalling.
- Social media, location history, or contacts.
- Any data from a third party about the student's health.

### 9.4 Signal confidence

- Each signal carries a confidence between 0 and 1.
- Prior from the timetable has a base confidence that rises as the model is calibrated.
- A single game result has low confidence, and the baseline needs several days.
- When confidence is low the UI says "rough estimate" and the multiplier is damped.

---

## 10. End-to-end user journeys

### 10.1 First run (about 3 minutes)

1. Welcome screen: one sentence about what the app does and a "Get started" button.
2. Sign in with Google.
3. Short privacy screen: what stays on the device, what is stored, what is never collected. One button: "Sounds fine".
4. Timetable import:
   - Upload an ICS file, or
   - Photograph the timetable and let the app parse it, or
   - Fill a simple weekly grid.
5. Commute form: minutes each way, mode (crowded, seated, walk), which days.
6. Assignments: paste a list or add tasks one by one.
7. Baseline game: play Pulse and Switch once, with a reminder that there are no wrong scores.
8. First forecast: today's spoons and the next 7 days of energy weather.
9. Done. The home screen shows one primary card.

### 10.2 Daily loop

1. Morning: forecast shown. The student may adjust it with a slider if it feels wrong.
2. Optional check: 20-second game, or "Skip, just use my schedule".
3. Plan: the day's tasks fit the live spoons. A short "why" line explains the day.
4. During the day: tasks are opened, completed, shrunk, or moved. Idle prompts are soft and appear at most once per task.
5. Evening: one tap on a spoon-level face. Garden is watered.
6. Night: tomorrow's forecast appears.

### 10.3 Low-capacity day

1. Live spoons come out low.
2. Home card says "Light mode today" with a one-line reason.
3. Heavy tasks are moved to a lighter day, with a short note.
4. One tiny step is suggested, such as "open the doc, write the title".
5. Pop Garden is offered as a calm off-ramp.
6. If a deadline cannot be moved, an extension-email draft is offered. Sending it is the student's choice.

### 10.4 Frozen at the start

1. A task is opened, and no action follows for 10 minutes (setting adjustable).
2. A soft prompt appears once: "Want to shrink it? Just step one?"
3. If accepted, the sequencer generates the smallest next step.
4. If declined, nothing else happens for this task today.

### 10.5 Skipped days

1. The student does not open the app.
2. The garden is auto-frozen and no message is sent.
3. When they return, the greeting is warm: "Welcome back. Your garden's fine."
4. Tasks that slipped are quietly moved forward. Nothing is labelled overdue.

### 10.6 Persistent low capacity

1. Live spoons stay below a low threshold for 7 or more days.
2. A single, gentle card appears: "It's been a heavy stretch. Campus counselling might be worth a look. No pressure."
3. The card can be dismissed permanently. It contains no clinical language.

---

## 11. Functional requirements

Format: ID, priority, requirement, then acceptance criteria.

### 11.1 Account and onboarding (AO)

**FR-AO-01 (P0): Google sign-in**
- The user can sign in with a Google account.
- Acceptance: after sign-in, a user record exists and the session persists on reload.

**FR-AO-02 (P0): Privacy summary before data entry**
- A one-screen summary is shown before any data is collected.
- It lists what stays on the device, what is stored, and what is never collected.
- Acceptance: the user cannot reach timetable import without passing this screen once.

**FR-AO-03 (P0): Anonymous mode**
- The user may use the app with local storage only and no account.
- Acceptance: all P0 features work except Calendar sync.

**FR-AO-04 (P1): Resume onboarding**
- If onboarding is interrupted, the next open resumes at the last unfinished step.
- Acceptance: closing the tab mid-onboarding and reopening restores progress.

**FR-AO-05 (P0): Onboarding length**
- Onboarding must be completable in under 3 minutes with an ICS file.
- Acceptance: timed test with three users.

### 11.2 Timetable and commute (TT)

**FR-TT-01 (P0): ICS import**
- Parse an uploaded ICS file into weekly recurring events.
- Acceptance: a sample ICS with 20 events imports with correct weekdays and times.

**FR-TT-02 (P0): Manual weekly grid**
- A simple grid lets the user mark blocks of class time per day.
- Acceptance: a user can build a day in under 30 seconds.

**FR-TT-03 (P1): Photo parsing**
- The user uploads a photo of a timetable. Gemini vision extracts events.
- The extracted events are shown for confirmation, never silently accepted.
- Acceptance: user can edit any parsed event before saving.

**FR-TT-04 (P0): Commute form**
- Fields: minutes each way, mode (crowded, seated, walk), days applicable.
- Acceptance: values are saved and used by the spoon model within the same session.

**FR-TT-05 (P1): Per-day commute override**
- The user can mark a day as work-from-home or a different commute.
- Acceptance: the forecast for that day updates immediately.

**FR-TT-06 (P0): Campus hours derivation**
- Campus hours for a day are computed from first class start to last class end, plus commute buffer.
- Acceptance: for a 8:30 to 17:30 day the model reads 9 campus hours.

**FR-TT-07 (P1): Holiday and exam handling**
- The user can mark a day as holiday or exam. Holidays set campus hours to zero.
- Acceptance: marking a holiday sets the day's prior to the full budget minus carryover.

### 11.3 Tasks and deadlines (TK)

**FR-TK-01 (P0): Add task**
- Fields: title, due date (optional), estimated minutes (optional), type (reading, writing, problem solving, admin, other).
- Acceptance: a task can be added with just a title.

**FR-TK-02 (P0): Auto cost**
- If minutes are omitted, the app estimates a default from type.
- Acceptance: every task has a spoon cost shown as a small number.

**FR-TK-03 (P1): Paste import**
- The user pastes a block of text and the app proposes tasks.
- Acceptance: user confirms or edits proposed tasks before saving.

**FR-TK-04 (P0): Complete task**
- Completing a task shows a short, warm confirmation and waters the garden.
- Acceptance: no confetti when reduced motion is on.

**FR-TK-05 (P0): Task states**
- States: planned, in progress, shrunk, moved, done, parked.
- There is no "overdue" state.
- Acceptance: a task past its planned date moves to "moved" with a lighter-day suggestion.

**FR-TK-06 (P1): Park a task**
- The user can park a task with no date.
- Acceptance: parked tasks are not shown in daily plans but appear in a "Parked" list.

**FR-TK-07 (P0): Hard deadlines**
- A task can be marked as having a fixed external deadline.
- The planner may move planned dates but never silently moves the deadline.
- Acceptance: when a fixed deadline cannot be met, the extension-email draft is offered.

### 11.4 Spoon engine (SP)

**FR-SP-01 (P0): Prior spoon calculation**
- Compute prior spoons from budget, commute, campus hours, deadline pressure, and carryover.
- Acceptance: results match the worked examples in section 12.

**FR-SP-02 (P0): Live spoon calculation**
- Multiply prior by the probe multiplier when a game result exists.
- Acceptance: with no game result, live equals prior.

**FR-SP-03 (P0): Floor and ceiling**
- Live spoons are clamped between 1 and 12 in the UI.
- Acceptance: a calculation that would give negative values displays 1 and a short note.

**FR-SP-04 (P0): Manual override**
- A slider lets the user set today's spoons directly.
- Acceptance: overriding changes the plan and records the override as a data point.

**FR-SP-05 (P0): Why panel**
- Tapping the spoon number opens a panel listing each factor and its contribution.
- Acceptance: contributions sum to the displayed number.

**FR-SP-06 (P0): Forecast for 7 days**
- Show an expected spoon number and weather icon for each of the next 7 days.
- Acceptance: for days beyond tomorrow, no game data is used and the UI marks them as rough.

**FR-SP-07 (P1): Per-user calibration**
- Weights are adjusted slowly using the evening labels.
- Acceptance: after 7 labelled days, calibration offsets are visible in settings and can be reset.

**FR-SP-08 (P0): Uncertainty display**
- Each number is shown with a soft range, for example "about 5 to 6".
- Acceptance: the range widens when confidence is low.

### 11.5 Games (GM)

**FR-GM-01 (P0): Pulse game**
- 20-second reaction task, described in section 13.
- Acceptance: runs at 60 fps on a mid-range phone and records reaction times locally.

**FR-GM-02 (P1): Switch game**
- 30-second rule-switch sorting task.
- Acceptance: records switch cost and error count.

**FR-GM-03 (P1): Pop Garden**
- 20-second always-winning task that doubles as an off-ramp.
- Acceptance: the game cannot be failed.

**FR-GM-04 (P0): Skip button**
- A visible "Skip, just use my schedule" button on every game entry screen.
- Acceptance: skipping logs only "skipped" and applies no penalty or message.

**FR-GM-05 (P0): Baseline learning**
- Personal baseline from exponential moving average, using at least 3 plays before the multiplier activates.
- Acceptance: with fewer than 3 plays, the multiplier is 1.0 and the UI says "still learning your usual".

**FR-GM-06 (P0): Local scoring**
- Scoring runs entirely in the browser. Only the derived multiplier and summary are stored.
- Acceptance: network inspector shows no raw reaction times sent.

**FR-GM-07 (P0): Accessibility**
- Games must work with large targets, a reduced-motion mode, and without sound.
- Acceptance: tested with reduced motion enabled.

**FR-GM-08 (P1): Game cooldown**
- Each game can be played at most twice per day.
- Acceptance: the second play on a day replaces the first only if the user chooses.

### 11.6 Behaviour signals (BS)

**FR-BS-01 (P0): Time-to-first-action**
- Record the time between opening a planned task and the first meaningful action.
- Acceptance: stored per task as seconds.

**FR-BS-02 (P1): Idle prompt**
- If a task is open and idle beyond the threshold, show one soft prompt per task per day.
- Acceptance: a second prompt for the same task on the same day never appears.

**FR-BS-03 (P1): Snooze and reshuffle counts**
- Count snoozes and manual reshuffles per task.
- Acceptance: three or more reshuffles of the same task triggers the shrink offer, not a warning.

**FR-BS-04 (P0): Behaviour data scope**
- Only app-internal events are tracked. No keystroke, screen, or other-app monitoring.
- Acceptance: code review confirms no such listeners.

### 11.7 Evening check-in (EV)

**FR-EV-01 (P0): One-tap label**
- Five faces or battery icons. One tap stores a value from 0 to 4 as "spoons left".
- Acceptance: tapping once completes the check-in and shows a warm confirmation.

**FR-EV-02 (P0): Optional skip**
- The check-in has a visible close button, with no penalty.
- Acceptance: closing logs "skipped" and shows nothing negative.

**FR-EV-03 (P1): Optional one-line note**
- After the tap, an optional one-line note field appears, unpressured.
- Acceptance: the note is stored only on the device unless the user opts in to sync.

**FR-EV-04 (P0): Evening timing**
- The prompt appears at a user-chosen time, default 8 pm, and only once per day.
- Acceptance: closing the app and reopening does not re-prompt the same day.

### 11.8 Planner and reshuffle (PL)

**FR-PL-01 (P0): Capacity-sized daily plan**
- Fill the day with tasks whose total cost does not exceed live spoons minus a reserve.
- Acceptance: the sum of planned costs is at most 80% of live spoons by default.

**FR-PL-02 (P0): Rest reserve**
- Always keep a reserve of spoons unplanned. Default 20%.
- Acceptance: reserve is shown as "breathing room" in the UI.

**FR-PL-03 (P1): Auto-reshuffle**
- When live spoons fall below planned load, move the heaviest movable tasks to the next lighter day.
- Acceptance: moved tasks show a short note, and the user can undo with one tap.

**FR-PL-04 (P1): Extension-email draft**
- When a hard deadline cannot be met, generate a short, polite extension request.
- Acceptance: draft is editable, never auto-sent, and contains no health claims.

**FR-PL-05 (P0): Energy-time matching**
- Place heavier tasks earlier in the day on days with a morning energy peak.
- Acceptance: deep blocks are scheduled outside commute windows.

**FR-PL-06 (P1): Rest as a task**
- A rest block can be placed in the plan with a spoon gain.
- Acceptance: rest blocks add a small positive amount to the day's remaining spoons.

**FR-PL-07 (P0): Explanation line**
- Each daily plan has a one-line reason, for example "Light mode today because of a long commute and a slower game than usual."
- Acceptance: text is generated from the model's factors, not free-form.

### 11.9 Micro-sequencer (MS)

**FR-MS-01 (P0): Shrink a task**
- User taps "Shrink it" on any task. The sequencer returns 3 to 7 tiny steps.
- Acceptance: the first step takes no more than 2 minutes.

**FR-MS-02 (P0): One step at a time**
- Only the current step is shown prominently. Others are collapsed.
- Acceptance: the user can expand the list if desired.

**FR-MS-03 (P1): Retrieval of strategies**
- The sequencer retrieves relevant coping strategies from a curated corpus.
- Acceptance: each step may show a short "why this works" line sourced from the corpus.

**FR-MS-04 (P0): Safety rules**
- The sequencer never gives medical advice and never mentions diagnoses.
- Acceptance: a test set of adversarial prompts is handled as described in section 15.

**FR-MS-05 (P1): Regenerate smaller**
- If a step still feels too big, a "Smaller please" button replaces it with a smaller step.
- Acceptance: the new step is shorter than the previous one by estimated time.

**FR-MS-06 (P1): Micro-win credit**
- Completing any step credits XP.
- Acceptance: the credit is shown briefly and quietly.

### 11.10 Calendar (CL)

**FR-CL-01 (P1): Write blocks**
- With consent, create Google Calendar events for planned blocks.
- Acceptance: events are tagged "SpoonSense" and removable in one tap.

**FR-CL-02 (P1): Read-only mode**
- The user may choose to read their calendar for events only, and never write.
- Acceptance: settings include a read-only toggle.

**FR-CL-03 (P1): Soft reminders**
- Reminders on events default to none or a single soft one.
- Acceptance: no repeated reminder per event.

**FR-CL-04 (P1): Undo on moves**
- When the planner moves a block, the old event is updated and not duplicated.
- Acceptance: no duplicate events after a reshuffle.

### 11.11 Gamification (GA)

**FR-GA-01 (P0): Garden streak that never dies**
- See section 16.

**FR-GA-02 (P1): Micro-win XP**
- See section 16.

**FR-GA-03 (P0): Energy weather**
- See FR-SP-06 and section 16.

**FR-GA-04 (P1): Dopamine menu**
- See section 16.

**FR-GA-05 (P2): Body-doubling room**
- See section 16.

### 11.12 Settings and privacy (ST)

**FR-ST-01 (P0): Privacy page**
- A plain-language page lists every data type collected, where it is stored, and how to delete it.
- Acceptance: linked from settings and onboarding.

**FR-ST-02 (P1): Export**
- Export all user data as JSON.
- Acceptance: file downloads within 10 seconds for a 30-day account.

**FR-ST-03 (P1): Delete**
- Delete all user data with one confirmed action.
- Acceptance: server records are removed within 24 hours and local data immediately.

**FR-ST-04 (P0): Reduced motion**
- A toggle disables animation across the app.
- Acceptance: with the toggle on, no screen animates.

**FR-ST-05 (P0): Dark mode**
- Calm dark theme with sufficient contrast.
- Acceptance: contrast ratio at least 4.5 to 1 for body text.

**FR-ST-06 (P1): Notification settings**
- The user can turn off all notifications, or choose the evening prompt time.
- Acceptance: turning off notifications stops all push and WhatsApp messages.

**FR-ST-07 (P1): Threshold controls**
- The user can adjust the idle-prompt delay and the reserve percentage.
- Acceptance: changes apply on the next plan.

### 11.13 Optional Tier 2 (T2)

**FR-T2-01 (P2): Smartwatch import**
- With opt-in, read sleep duration, resting heart rate, and HRV from Health Connect or HealthKit.
- Acceptance: when no watch is present, the feature is hidden entirely.

**FR-T2-02 (P2): Voice sentence**
- The user records one spoken sentence. Prosody features are computed on the device. The audio is discarded.
- Acceptance: no audio leaves the device.

**FR-T2-03 (P2): Blink and gaze**
- With opt-in, MediaPipe runs locally during the game and records blink rate and gaze drift summaries.
- Acceptance: no video frames are stored or transmitted.

**FR-T2-04 (P2): Signal weight cap**
- Tier 2 signals can adjust the multiplier by at most ±10% in total.
- Acceptance: unit test confirms the cap.

**FR-T2-05 (P2): Easy off**
- Each Tier 2 input can be turned off, and its stored data deleted, in one tap.
- Acceptance: after deletion, the "why" panel no longer references that signal.

---
## 12. The capacity model (spoons) in full detail

### 12.1 Overview

- The model is transparent and additive. There is no black box.
- It has three layers: a prior from context, a live multiplier from the game, and an optional adjustment from Tier 2 signals.
- A personal baseline layer makes the game comparison fair for each student.

### 12.2 Prior spoons

```
prior = BUDGET - commute_cost - campus_cost - deadline_pressure - carryover
```

- BUDGET defaults to 12 spoons.
- All weights below are illustrative and must be calibrated in the pilot.

### 12.3 Commute cost

```
commute_cost = (total_commute_minutes / 30) * 0.5 * mode_factor
```

- total_commute_minutes is the sum of both directions for that day.
- mode_factor values (illustrative):
  - crowded: 1.0
  - seated: 0.6
  - walk: 0.3

### 12.4 Campus cost

```
campus_cost = campus_hours * 0.5
```

- campus_hours runs from first class start to last class end for that day.
- Holidays and work-from-home days use 0.

### 12.5 Deadline pressure

Deadline pressure is not defined in the earlier draft, so this PRD defines it.

```
for each task with a due date within the next 3 days:
    urgency = 1.0 if due today, 0.6 if due tomorrow, 0.3 if in 2 to 3 days
    pressure_i = min(task_cost, 2.0) * urgency * 0.25
deadline_pressure = min(sum(pressure_i), 2.0)
```

- This represents mental load from upcoming deadlines, not the cost of doing the work.
- The cap of 2.0 spoons stops a large pile of deadlines from zeroing the budget.
- Illustrative values; calibrate in the pilot.

### 12.6 Carryover

```
carryover = max(0, 0.4 * (previous_day_spend - 6))
```

- previous_day_spend is the previous day's commute plus campus cost plus completed task cost.
- The max(0, ...) clamp is added in this PRD so a light day does not create a bonus beyond the budget.
- If the evening label for the previous day exists, it can nudge carryover by up to ±0.5 spoon. A low label raises carryover and a high label lowers it.

### 12.7 Live spoons

```
live = clamp(prior * probe_multiplier * tier2_adjust, 1, 12)
```

- probe_multiplier comes from the game result, section 13.
- tier2_adjust is 1.0 when no Tier 2 signal is available, and is capped within 0.9 to 1.1.
- The lower clamp of 1 keeps the UI from ever showing zero.

### 12.8 Probe multiplier (illustrative)

- Reaction time within 20% of baseline: ×1.0
- Reaction time 20% to 35% slower than baseline: ×0.85
- Reaction time 35% or more slower: ×0.7
- Reaction time more than 15% faster than baseline: ×1.0 (we do not reward speed with extra spoons, because a faster reaction can reflect anxious arousal)
- Low-confidence baselines (fewer than 3 plays): ×1.0

Smoothing note: instead of hard step changes, the product may use linear interpolation between these anchor points so a result of +34% and +36% do not produce visibly different plans. This is a P1 refinement.

### 12.9 Personal baseline

```
baseline_t = alpha * today_median_rt + (1 - alpha) * baseline_{t-1}
alpha = 0.25
```

- Initialised from the first three plays.
- Only plays that were not interrupted are included.
- A device-change flag resets the baseline, because hardware changes timing.
- The baseline is shown to the user in plain words: "your usual".

### 12.10 Tier 2 adjustment (optional)

- Sleep under a user-set threshold: ×0.95 to ×0.9 depending on the shortfall.
- Resting heart rate or HRV far from the user's own average: a small adjustment within the same cap.
- Total adjustment never exceeds ±10%.
- Each adjustment is listed in the why panel.

### 12.11 Confidence and ranges

```
confidence = base_conf + 0.04 * min(days_of_data, 15) + (0.1 if game_played_today else 0)
```

- base_conf starts at 0.4 and is capped at 0.9.
- The displayed range is live ± (1.5 * (1 - confidence)) spoons, rounded to the nearest half.
- At low confidence the UI says "rough estimate".

### 12.12 Worked example: Aarav, Monday (corrected)

- Commute: 240 minutes crowded.
  - (240 / 30) * 0.5 * 1.0 = 4.0 spoons
- Campus: 9 hours.
  - 9 * 0.5 = 4.5 spoons
- Prior: 12 - 4.0 - 4.5 = 3.5 spoons (no deadline pressure or carryover in this simplified example)
- Pulse game at 6 pm: reaction time +35% over baseline.
  - multiplier ×0.7
- Live: 3.5 * 0.7 = 2.45, shown as about 2.4 to 2.5.

### 12.13 Worked example: Meera, Monday (corrected)

- Commute: 10-minute walk each way, 20 minutes total.
  - (20 / 30) * 0.5 * 0.3 = 0.1 spoon
- Campus: 9 hours.
  - 9 * 0.5 = 4.5 spoons
- Prior: 12 - 0.1 - 4.5 = 7.4 spoons
- Pulse game: normal, multiplier ×1.0
- Live: 7.4 spoons

Correction note: the earlier draft listed Meera's commute cost as 0.3 and her spoons left as 7.2. With the stated formula and 20 total minutes, the commute cost works out to 0.1, so her prior is 7.4. The arithmetic for Aarav in the earlier draft was already correct.

### 12.14 Worked example: forecast for Tuesday

- Monday spend for Aarav: commute 4.0 + campus 4.5 = 8.5.
- Carryover for Tuesday: 0.4 * (8.5 - 6) = 1.0.
- Tuesday classes 9 to 12: 3 campus hours = 1.5 spoons.
- Tuesday commute: 4.0 spoons.
- Forecast: 12 - 4.0 - 1.5 - 1.0 = 5.5 spoons, shown as "about 5 to 6".
- Meera, Tuesday: Monday spend is 0.1 + 4.5 = 4.6, so carryover is 0 (clamped). Campus 1.5, commute 0.1. Forecast 12 - 0.1 - 1.5 = 10.4, shown as about 10.

### 12.15 Weather mapping

- Sunny: live or forecast spoons 8 or above.
- Partly cloudy: 5 to under 8.
- Cloudy: 3 to under 5.
- Stormy: under 3.
- The names are metaphors, and the legend is shown once.

### 12.16 Why-panel contents

Each line is a factor with a signed number and a one-line plain explanation:

- "Starting budget: 12"
- "Commute (about 4 hours, crowded): -4.0"
- "Campus time (9 hours): -4.5"
- "Upcoming deadlines: -0.5"
- "Yesterday was heavy: -1.0"
- "Today's game was slower than your usual: ×0.7"
- "You adjusted this yourself: set to 5"

The visible total always equals the displayed spoon number.

### 12.17 What the model must never do

- Never output the word "stress".
- Never state or imply a condition.
- Never penalise the user for opting out of signals.
- Never hide an adjustment from the why panel.

### 12.18 Reference implementation (pseudocode)

```
function computePrior(day, user, tasks, history):
    commute = commuteCost(day.commuteMinutes, day.mode)
    campus = campusCost(day.campusHours)
    pressure = deadlinePressure(tasks, day.date)
    carry = carryover(history.previousDaySpend, history.eveningLabel)
    return BUDGET - commute - campus - pressure - carry

function computeLive(prior, probe, tier2):
    mult = probe.multiplier if probe.valid else 1.0
    adj = clamp(tier2.adjust, 0.9, 1.1)
    return clamp(prior * mult * adj, 1, 12)

function explain(parts):
    return list of {label, delta_or_multiplier, plain_text}
```

---

## 13. Game design and scoring specification

### 13.1 Shared rules

- Every game is 20 to 30 seconds.
- Every game starts with a one-line instruction and a single large Start button.
- Every game has a visible Skip button.
- No game can show "Game over", "Failed", or a red colour.
- Results are never shown as a grade. At most the screen says "Thanks. That helps me plan."
- Raw data stays on the device. Only the derived summary is stored.
- Games work with touch, mouse, and keyboard.
- Sound is off by default.

### 13.2 Pulse (20 seconds): attention and reaction

What it measures: reaction time, lapses, and variability, compared with the person's own baseline.

Mechanics:

- A calm circle sits on the screen.
- At random intervals between 1.5 and 4 seconds, the circle changes shade.
- The player taps as soon as they notice the change.
- Approximately 6 to 8 trials fit in 20 seconds.

Scoring:

- Reaction time: time from stimulus to tap, in milliseconds.
- Anticipation: taps under 100 ms are discarded as guesses.
- Lapse: no tap within 1000 ms. Lapses are counted separately.
- Summary values: median RT, lapse count, and RT variability (median absolute deviation).
- Today's median is compared with the baseline to produce the percentage change used in section 12.8.

Edge cases:

- Fewer than 4 valid trials: the result is marked invalid and ignored.
- A tab visibility change during the game invalidates the game.
- Frame drops above a threshold flag the result as low confidence.

### 13.3 Switch (30 seconds): flexibility and task switching

What it measures: switch cost, perseveration, and errors.

Mechanics:

- Coloured shapes appear one at a time.
- At first, the player sorts by colour into left or right.
- After several items, a gentle cue changes the rule to sort by shape.
- The rule changes a few times.

Scoring:

- Switch cost: average RT on the first two items after a rule change minus average RT on the other items.
- Perseveration: number of items sorted by the old rule right after a change.
- Errors: wrong sorts overall.
- Summary: switch cost relative to the personal baseline.

Notes:

- Errors never produce a red flash or a negative sound.
- The result feeds a secondary multiplier, applied only as a nudge, and never alone.

### 13.4 Pop Garden (20 seconds): engagement and off-ramp

What it measures: willingness to play, tap rate, and engagement, not performance.

Mechanics:

- Soft bubbles float up. Tapping pops them and grows a small plant.
- It is impossible to lose.
- It ends with a quiet, positive message.

Scoring:

- Number of taps and whether the player started at all.
- Compared with the player's own norm, a very low engagement is one weak signal for "can't start today".

Dual use:

- When capacity is low, the app offers Pop Garden as a calm reward.
- Playing it is never required.

### 13.5 Separating "can't think" from "can't start"

This is a hypothesis to test in the pilot, not a claim.

- If Pulse and Switch results are worse than baseline but Pop Garden engagement is normal, the signal pattern suggests "slow thinking today". The plan favours light, structured tasks.
- If Pulse and Switch are normal but Pop Garden engagement and time-to-first-action are low, the pattern suggests "hard to start today". The plan favours micro-steps and body-doubling.
- If everything is low, the plan goes to light mode and rest.
- We never say these labels to the user. The plan is shaped by them and explained in neutral terms.

### 13.6 How games are chosen each day

- Default: Pulse only (20 seconds).
- Optional: Pulse then Switch (50 seconds) on days the user chooses.
- Pop Garden appears when the plan is light, or the user opens it.
- The user can set "never ask me for games" and the app uses the schedule only.

### 13.7 Anti-gaming and noise

- Practice effects: the first 3 plays count as baseline learning, and the app does not apply a multiplier until then.
- Device differences: input latency varies across devices. The baseline is per device.
- Time-of-day effects: a baseline is kept for morning and evening separately once enough plays exist.
- Caffeine, illness, and sleep effects are not modelled. The why panel says "this reflects today only".

### 13.8 Storage

- Raw trial arrays are kept in memory only during the game.
- Stored per play: date, time of day, game name, median RT, lapse count, variability, validity flag, confidence flag.

---

## 14. Task cost engine and planner logic

### 14.1 Task cost table (illustrative)

- A 2-minute step costs 0.2 spoon.
- 15 minutes of reading costs 1 spoon.
- A 45-minute deep block costs 4 spoons.

General formula:

```
cost = minutes * rate(type) * difficulty
rate(reading) = 0.067 spoon/min      (15 min ≈ 1)
rate(writing) = 0.09 spoon/min
rate(problem_solving) = 0.089 spoon/min   (45 min ≈ 4)
rate(admin) = 0.05 spoon/min
rate(micro_step) = 0.1 spoon/min     (2 min = 0.2)
difficulty in {0.8 easy, 1.0 normal, 1.2 hard}
```

- Rates are illustrative and are calibrated using task completion and evening labels in the pilot.
- Users can edit the cost of any task. The edit becomes a data point.

### 14.2 Default durations

- If no duration is given, defaults come from task type: reading 20, writing 30, problem solving 45, admin 10, other 20 minutes.

### 14.3 Planner algorithm

Inputs: live spoons for each day in the window, tasks, fixed deadlines, preferences.

Steps:

1. Compute available capacity for each day as live_spoons × (1 - reserve).
2. Sort tasks by earliest fixed deadline, then by cost descending.
3. For each task, find the best day on or before its deadline where capacity remains.
4. Prefer days with higher forecast spoons for higher-cost tasks.
5. Split tasks over 4 spoons into multiple blocks if allowed.
6. If no day fits, mark the task as needing attention and offer extension-email draft and shrink options.
7. Output a day-by-day plan with a one-line reason.

### 14.4 Intra-day scheduling

- Place heavy tasks in the highest-energy window outside commute and class time.
- Default morning peak for most students, adjustable.
- Place light tasks after commute or in low windows.
- Leave a buffer of at least 10 minutes between blocks.
- Never place tasks during the user's marked rest time.

### 14.5 Reshuffle triggers

- Live spoons fall below planned load by 20% or more.
- The user marks a task as "too heavy".
- The user adds a new fixed-deadline task that no longer fits.

### 14.6 Reshuffle behaviour

- Move the least urgent, highest-cost tasks first.
- Prefer the next day with forecast above 6 spoons.
- Never move a task across a fixed deadline.
- Show a calm note: "Moved Thursday's lab draft to Wednesday, which looks lighter."
- Offer one-tap undo.
- Do not move the same task more than twice without asking the user whether to shrink it.

### 14.7 Extension-email draft

When a hard deadline cannot be met within capacity:

- Offer a short email with polite wording.
- Include the course, the assignment, a proposed new date, and thanks.
- Never include health claims, diagnoses, or detailed personal reasons unless the user types them.
- The draft is shown for editing and copied or opened in the mail app. It is never sent automatically.

Example structure:

- Greeting with the instructor's name.
- A one-line request for a short extension and a specific new date.
- A line showing willingness to share partial work earlier.
- A thank-you.

### 14.8 Rest as a first-class item

- The plan can include rest blocks.
- Rest blocks gain a small number of spoons, for example +0.5 for 20 minutes.
- Dopamine-menu items can be suggested as rest.
- Taking a rest block earns a garden reward.

### 14.9 Planner outputs

- A day plan list with task, estimated time, spoon cost, and reason.
- A "breathing room" indicator showing unplanned reserve.
- A short, plain explanation line.

---

## 15. Micro-sequencer (LLM plus RAG) specification

### 15.1 Purpose

Turn a task that feels too big into a very small first step, and then a handful of steps, in a calm voice.

### 15.2 Inputs

- Task title and optional description.
- Task type and any due date.
- Current live spoons (so steps can be smaller when capacity is low).
- Optional user note such as "I don't know where to start".
- Retrieved strategy snippets from the corpus.

### 15.3 Outputs

- Between 3 and 7 steps.
- Each step has: text, estimated minutes, spoon cost, optional "why this works" line.
- The first step is at most 2 minutes and concrete, for example "Open the file and type the title".
- Output is JSON conforming to a schema, validated before display.

### 15.4 RAG corpus

Documents (short, plain-language, hand-written or paraphrased from public guidance, with no clinical claims):

- Two-minute rule.
- Implementation intentions ("when X happens, I will do Y").
- Body doubling.
- Task chunking.
- Starting with the easiest visible piece.
- Setting a timer for a very short work burst.
- Reducing the environment's friction (open the file first, set out materials).
- Reward after small steps.
- Gentle self-talk examples.

Each document is a short passage with tags: task_type, effort_level, situation.

Corpus size: roughly 30 to 60 passages for the MVP.

### 15.5 Retrieval

- Embed passages using an embedding model supported by the chosen stack.
- Retrieve the top 3 passages by similarity to a query built from task type and the user's note.
- Provide passages to the LLM as context with instruction to adapt, not copy.

### 15.6 Prompt design (outline)

System instructions:

- You help a student who may be overwhelmed start a task.
- Be calm, concrete, and brief.
- Never mention medical, mental health, or diagnostic terms.
- The first step must take 2 minutes or less and must be physically concrete.
- Never use words such as should, must, behind, or late.
- Return only JSON matching the schema.

User content: the task, capacity, retrieved passages.

### 15.7 Guardrails

- Output validation: JSON schema, step count, first-step duration, banned-words check.
- If validation fails, retry once with a stricter instruction, then fall back to a rule-based template.
- Adversarial inputs (for example "tell me what disorder I have") are answered with a gentle redirect and a pointer to professional support, without diagnosing.
- Self-harm statements trigger a short, kind message encouraging the user to contact a trusted person or local support services, and the sequencer does not continue the task flow. The exact helpline resources should be reviewed by the team before launch for the user's region.
- Prompts and outputs are not used for training by the app.

### 15.8 Rule-based fallback

If the LLM is unavailable:

- A template library returns steps by task type, for example for writing: open file, write the title, write one sentence, list three points.
- This keeps the demo working offline.

### 15.9 Latency and cost

- Target response under 4 seconds.
- Show a calm loading state with no spinner motion in reduced-motion mode.
- Cache results per task so reopening does not re-call the model.

### 15.10 "Smaller please"

- A button asks for a smaller step.
- The sequencer is called again with the previous step and the instruction to halve it.
- After three shrinks, the final step is something like "Open the file" or "Sit at your desk for 1 minute".

---

## 16. Gamification without shame

### 16.1 Garden streak

- A plant grows when the student checks in, completes a micro-step, or takes a rest block.
- The plant never dies.
- A missed day is automatically frozen. The garden does not wilt.
- Rest days count: "Rest is a W".
- The streak counter is described as "days tended" and is never reset.
- Users who return after a long break see a warm greeting and no reference to the gap.

### 16.2 Micro-win XP

- Examples: opened the doc, wrote the title, completed a 2-minute step.
- XP is shown briefly and quietly.
- XP is not compared across users and there is no leaderboard.
- XP unlocks garden items, which are purely decorative.

### 16.3 Energy weather

- A 7-day strip with weather icons based on forecast spoons.
- Used for planning, not for judgement.
- A short legend appears once.
- Days with changed forecasts after a new deadline are updated quietly.

### 16.4 Dopamine menu

- A personal list of restful or enjoyable activities written by the user, for example short walk, a favourite song, a snack, stretching.
- Suggested at low capacity, one at a time.
- Starter suggestions are provided, and the user can edit or remove them.
- Activities have small spoon gains that the user may adjust.

### 16.5 Body-doubling room (P2)

- A silent co-working timer where friends join the same room.
- No chat by default, just a presence indicator.
- A start and stop control, and a 25-minute default.
- No tracking of who stayed or left.
- Rooms are invite-only.

### 16.6 Rewards that are always safe

- No loss mechanics.
- No countdown timers on rewards.
- No social comparison.
- No messages that imply the user let someone down.

---

## 17. Data model

### 17.1 Principles

- Store the minimum needed.
- Separate identifiers from content.
- Local-first for sensitive items.
- Everything is exportable and deletable.

### 17.2 Entities

**User**
- id (uuid)
- created_at
- auth_provider
- settings (json)
- consent_flags (json)
- baseline_summary (json)
- anonymous (boolean)

**TimetableBlock**
- id, user_id
- weekday (0 to 6)
- start_time, end_time
- title
- source (ics, photo, manual)

**CommuteProfile**
- id, user_id
- minutes_each_way
- mode (crowded, seated, walk)
- days_applicable (array)

**DayOverride**
- id, user_id, date
- type (holiday, wfh, exam, custom_commute)
- value (json)

**Task**
- id, user_id
- title, description
- type
- due_date (nullable)
- is_fixed_deadline (boolean)
- estimated_minutes
- difficulty
- spoon_cost
- state (planned, in_progress, shrunk, moved, done, parked)
- planned_date, planned_slot
- moves_count

**TaskStep**
- id, task_id
- position
- text
- minutes
- spoon_cost
- why_text
- state (todo, done)

**DaySnapshot**
- id, user_id, date
- prior_spoons
- live_spoons
- manual_override (nullable)
- factors (json: the why-panel lines)
- confidence
- weather

**GameResult**
- id, user_id, date, time_of_day
- game (pulse, switch, pop)
- summary (json: median_rt, lapses, variability, switch_cost, taps)
- valid (boolean)
- skipped (boolean)

**BehaviourEvent**
- id, user_id, date
- type (first_action_latency, idle_prompt_shown, idle_prompt_accepted, snooze, reshuffle)
- task_id (nullable)
- value (numeric)

**EveningLabel**
- id, user_id, date
- value (0 to 4)
- note (nullable, local only unless the user opts in)
- skipped (boolean)

**GardenState**
- user_id
- days_tended
- xp
- items (json)
- last_checkin_date

**CalendarLink**
- user_id
- scope (read_only, read_write)
- event_ids (json mapping)

**DopamineItem**
- id, user_id, label, spoon_gain

**Tier2Signal** (P2)
- id, user_id, date
- type (sleep, rhr, hrv, voice, gaze)
- summary (json)

### 17.3 What stays on the device only

- Raw game trial data.
- Evening notes unless opted in.
- Voice audio, and any camera frames.
- Baseline details unless the user opts into sync.

### 17.4 Retention

- Default retention is 12 months of daily summaries.
- Delete on request removes all records within 24 hours.
- Pilot data uses anonymised IDs, separate storage, and a signed consent form.

### 17.5 Anonymisation for the pilot

- Replace names and emails with random IDs.
- Do not store raw timetable titles, which can identify courses and people. Store only block start and end times.
- No institution access to any data.

---

## 18. System architecture and tech stack

### 18.1 High-level design

- Client (PWA): all UI, game logic, scoring, baseline, the spoon calculation, and the planner run in the browser.
- Backend: authentication, sync, Calendar integration, LLM calls, and storage.
- LLM service: Gemini for sequencing, timetable photo parsing, and email drafts.
- Storage: Supabase (Postgres) for synced data.
- Optional notification channel: WhatsApp via a provider, behind opt-in.

### 18.2 Why compute on the client

- Privacy: raw signals never leave the device.
- Latency: games and scoring need real-time responsiveness.
- Offline: the app still plans without a connection.

### 18.3 Suggested stack

- Frontend: React or Next.js, TypeScript, Tailwind for styling, a service worker for PWA behaviour.
- State: a lightweight store such as Zustand.
- Local storage: IndexedDB.
- Games: plain Canvas or DOM with requestAnimationFrame for timing, using performance.now().
- Backend: Next.js API routes or a small Node service. Supabase for auth, Postgres, and row-level security.
- LLM: Gemini via server-side calls only. API keys never ship to the client.
- Retrieval: a small vector table in Postgres (pgvector) or an in-memory index for the MVP corpus.
- Calendar: Google Calendar API with OAuth, minimum scopes.
- ICS parsing: a maintained ICS library.
- Optional: MediaPipe for gaze and blink, a Web Audio pipeline for prosody features.

### 18.4 Module boundaries

- spoon-engine: pure functions, fully unit-tested, no UI.
- game-engine: game logic and scoring, no network.
- planner: pure functions given capacities and tasks.
- sequencer-client: calls the server route, validates output, falls back to templates.
- sync: moves summaries between local and server.
- ui: screens and components.

### 18.5 Deployment

- Frontend and API on a standard hosting platform with HTTPS.
- Environment variables for keys, never committed.
- Row-level security so users can only read their own rows.

### 18.6 Offline behaviour

- The app opens and plans offline.
- Sequencer falls back to templates offline.
- Sync resumes when the connection returns, with last-write-wins on settings and merge on events.

### 18.7 Performance targets

- First load under 3 seconds on a mid-range phone on 4G.
- Game frame timing stable at 60 fps.
- Plan generation under 200 ms for a 30-task list.

---

## 19. API specification

All endpoints require authentication unless stated. Request and response bodies are JSON.

### 19.1 Auth and user

- POST /api/auth/google: exchange the Google token for a session.
- GET /api/me: return profile and settings.
- PATCH /api/me/settings: update settings.
- POST /api/me/export: return a JSON export.
- DELETE /api/me: delete the account and data.

### 19.2 Timetable and commute

- POST /api/timetable/ics: upload an ICS file, return parsed blocks for confirmation.
- POST /api/timetable/photo: upload an image, return parsed blocks for confirmation (P1).
- PUT /api/timetable: save confirmed blocks.
- PUT /api/commute: save the commute profile.
- PUT /api/day-overrides/:date: set an override.

### 19.3 Tasks

- GET /api/tasks
- POST /api/tasks
- PATCH /api/tasks/:id
- DELETE /api/tasks/:id
- POST /api/tasks/import-text: propose tasks from pasted text (P1).

### 19.4 Capacity and planning

- GET /api/forecast?from=DATE&days=7: returns snapshots with factors.
- POST /api/snapshot: save a day snapshot (summary only).
- POST /api/plan: generate a plan for a date range, returns the plan and reasons.
- POST /api/plan/reshuffle: run a reshuffle, returns changes and an undo token.
- POST /api/plan/undo: undo using the token.

### 19.5 Games and signals

- POST /api/games/result: store the summary of a play (no raw trials).
- POST /api/behaviour: store behaviour events in batches.
- POST /api/evening: store the evening label.

### 19.6 Sequencer

- POST /api/sequence: input task and context, returns validated steps.
- POST /api/sequence/smaller: input a step, returns a smaller replacement.
- POST /api/email-draft: input course, assignment, proposed date, returns a draft.

### 19.7 Calendar

- POST /api/calendar/connect: start OAuth with the chosen scope.
- POST /api/calendar/sync: write planned blocks.
- DELETE /api/calendar/blocks: remove all SpoonSense events.

### 19.8 Garden

- GET /api/garden
- POST /api/garden/tend: record a tending action.

### 19.9 Error handling rules

- Errors return a short, calm message and a code.
- No error text blames the user.
- Failed LLM calls fall back to templates silently where possible.
- Rate limiting is applied, and responses explain it kindly.

### 19.10 Example payloads

Sequence request:

```
{
  "task": { "title": "Write DBMS lab report", "type": "writing" },
  "liveSpoons": 2.4,
  "note": "I don't know where to start"
}
```

Sequence response:

```
{
  "steps": [
    { "text": "Open the lab report file", "minutes": 1, "spoon": 0.1, "why": "Starting is the hardest part." },
    { "text": "Type the title and your name", "minutes": 2, "spoon": 0.2, "why": "A tiny win." },
    { "text": "Write one sentence about what the lab did", "minutes": 3, "spoon": 0.3, "why": "One sentence is enough for now." }
  ]
}
```

---
## 20. Privacy, ethics, and safety

### 20.1 Ethical stance

- We track proxies for capacity, not conditions.
- Every signal is optional except the schedule the student gives us.
- The student can see, override, export, and delete anything.
- We would rather under-claim than over-claim.

### 20.2 What we collect, in plain words

- Timetable blocks and commute details the user enters.
- Tasks the user adds.
- Summaries of games (not raw taps).
- App-internal behaviour events such as time to first action.
- One-tap evening labels.
- Optional Tier 2 summaries, only with opt-in.

### 20.3 What we never collect

- Keystrokes, screenshots, or activity outside the app.
- Location history.
- Contacts, messages, or social media.
- Raw video, raw audio, or face images.
- Any diagnosis or health record.

### 20.4 Consent model

- A short privacy screen at first run, in plain language.
- Separate, specific consent for Calendar access, notifications, and every Tier 2 signal.
- Consent can be withdrawn at any time in settings, and withdrawal deletes that signal's data if the user chooses.
- No dark patterns. Declining never blocks core features.

### 20.5 Camera, voice, and wearables

- Off by default.
- Local processing only. No frames, audio, or biometric streams are transmitted.
- A clear indicator is shown whenever the camera or microphone is active.
- Disclosure that these signals are weak proxies and may be wrong.

### 20.6 No diagnosis rule

- The product never names or implies ADHD, autism, depression, anxiety, or burnout as something the user has.
- The earlier PRD's clinical text classifier is dropped or hidden.
- The earlier burnout index is reused only as a "load trend", defined as a rolling average of live spoons compared with the user's own history.

### 20.7 Persistent low capacity

- If live spoons stay in the lowest band for 7 or more days, show one gentle card suggesting campus counselling or a trusted person.
- No notifications to third parties, no automatic referrals, no institution access.
- The user can dismiss it permanently.
- The team should check the resource wording and contact details for the student's institution before launch.

### 20.8 Safety escalation

- If the user types language indicating self-harm into any free-text field, the app shows a short, supportive message with a prompt to reach a trusted person or a local helpline.
- Helpline numbers should be verified by the team for the user's region before launch. We do not hard-code unverified numbers.
- The app does not try to assess risk or counsel.

### 20.9 Fairness and bias

- Baselines are personal, so we do not compare students with each other.
- We do not assume a particular commute is "bad". The user's own data drives the numbers.
- Reaction-time tasks can disadvantage some users (motor differences, older devices). The skip button and the schedule-only mode keep the product usable.
- Test the games with users who have different devices and abilities.

### 20.10 Transparency features

- Why panel on every number.
- A "what the app knows about me" page.
- An easy override on every inference.
- A short changelog explaining model changes.

### 20.11 Data protection

- Encryption in transit and at rest.
- Row-level security on stored data.
- API keys only on the server.
- Minimal logs, with no personal content in logs.
- Compliance note: the team should review applicable Indian data protection requirements for a product handling student data before any public launch. This PRD does not assert legal compliance.

### 20.12 Honest claims in public materials

- Say "context plus games help estimate planning capacity".
- Do not say "detects stress", "detects ADHD", or "improves mental health".
- Describe the pilot as a validation effort and report results as measured.

---

## 21. UX and UI specification

### 21.1 Design principles

- One primary action per screen.
- Large, forgiving tap targets (minimum 48 by 48 px).
- Calm colours, low contrast between decorative elements, high contrast for text.
- Short sentences. No jargon.
- No red, no alarm sounds, no countdown anxiety.
- Everything reversible.

### 21.2 Visual system

- Colour palette: soft neutrals with muted green, blue, and warm accents.
- Dark mode: deep blue-grey, not pure black, with 4.5 to 1 minimum text contrast.
- Typography: a clean sans-serif, 16 px minimum for body text, generous line spacing.
- Iconography: simple rounded icons.
- Motion: gentle fades and small growth animations, all disabled by reduced motion.

### 21.3 Screen inventory

1. Welcome
2. Privacy summary
3. Timetable import
4. Commute form
5. Tasks entry
6. First baseline game
7. Home (today)
8. Why panel (sheet)
9. Game entry (with skip)
10. Pulse, Switch, Pop Garden screens
11. Today's plan
12. Task detail with Shrink
13. Micro-step view
14. Week forecast
15. Garden
16. Evening check-in
17. Dopamine menu
18. Settings
19. Privacy and data
20. Counselling card (conditional)
21. Extension-email draft sheet

### 21.4 Home screen

- Top: greeting and today's date.
- Centre: one large card showing the live spoons, a weather icon, and a one-line reason.
- Below: "Your next small thing" with one task or step and a big Start button.
- Quiet links: "Play a 20-second check" and "Why this number?".
- A small garden icon in the corner.

Example home copy:

- "Light mode today. About 2 to 3 spoons."
- "Long commute, and today's check was a bit slower than your usual."
- Button: "Start: open the doc"

### 21.5 Game entry screen

- A short line: "A 20-second check helps me plan your day."
- Big button: "Start".
- Smaller button, equal visibility: "Skip, just use my schedule".
- No timer shown before starting.

### 21.6 Plan screen

- A vertical list of today's items.
- Each item shows a title, a small spoon number, and an estimated time.
- A "breathing room" bar at the bottom shows unplanned capacity.
- Long-press or a menu offers: Move, Shrink, Park.
- No red markers for any state.

### 21.7 Shrink flow

1. Tap "Shrink it" on a task.
2. A short loading state with calm text.
3. The first step appears large: "Open the lab report file".
4. Buttons: "Done" and "Smaller please".
5. Remaining steps are behind a quiet "See all steps" link.

### 21.8 Evening check-in

- Screen text: "How many spoons are left?"
- Five large icons from an empty battery to a full battery.
- One tap saves and shows "Thanks. Rest well."
- A tiny close button in a corner.

### 21.9 Week forecast

- A strip of 7 weather icons with day names.
- Tap a day to see its why panel and a plan summary.
- Footer note: "These are rough estimates and will update."

### 21.10 Garden

- A simple illustrated plant that grows with tending.
- Items unlock through XP.
- Text always uses "days tended" and never "streak".
- A rest day shows a small sleeping icon.

### 21.11 Settings

- Profile and sign-in.
- Timetable and commute.
- Games (on or off, which games).
- Notifications (on or off, evening time).
- Calendar (off, read-only, read-write).
- Optional signals (watch, voice, camera) with individual toggles.
- Reduced motion, dark mode, text size.
- Privacy and data: view, export, delete.

### 21.12 Accessibility

- Support screen readers with labelled controls.
- Support dynamic text sizes.
- Provide non-colour indicators for weather and states.
- Keyboard navigation for all features.
- No flashing content.
- Captions and text alternatives for any audio.
- Game instructions shown as text, and optionally read aloud.

### 21.13 Empty and error states

- Empty tasks: "Nothing here. A quiet day is fine."
- No timetable: "Add your timetable when you're ready. I can still help with tasks."
- Network error: "I can't reach the server. Your plan still works offline."
- Calendar failure: "Couldn't update your calendar. Nothing was lost."

### 21.14 Microcopy samples

- Welcome: "Plan around your energy, not against it."
- Skip: "Skip, just use my schedule."
- Completed: "Nice. One small thing done."
- Moved: "Moved for you. Thursday looks lighter."
- Return after gap: "Welcome back. Your garden's fine."
- Low capacity: "A light day. Here's one tiny step, if you want it."
- Rest: "Rest is a W."

---

## 22. Notifications policy

### 22.1 Principles

- Fewer is better.
- Never repeat the same reminder.
- Never use urgency language.
- Always easy to turn off.

### 22.2 Allowed notifications

- Evening check-in invitation, once per day, at the user's chosen time.
- A single soft reminder for an event the user chose to be reminded about.
- A gentle morning forecast, off by default.

### 22.3 Not allowed

- Reminders about overdue items.
- Streak warnings.
- Repeated pings for the same item.
- Messages that compare the user with others.

### 22.4 Channels

- In-app prompts are the default.
- Push notifications for PWA, opt-in.
- WhatsApp (P2), opt-in, with a clear stop command.

### 22.5 Frequency limits

- At most two notifications a day in total, and by default only one.
- No notifications between 10 pm and 7 am by default.
- After three ignored notifications in a row, the app stops sending them and asks once whether to turn them off.

### 22.6 Idle prompt rules

- Shown only inside the app.
- Once per task per day.
- Phrased as an offer.
- Dismissing never leads to a follow-up.

---

## 23. Metrics and instrumentation

### 23.1 Principles

- Measure the product, not the person.
- Aggregate wherever possible.
- Local analytics by default in the hackathon build.

### 23.2 Product metrics

- Onboarding completion time.
- Daily check-in time (median).
- Game skip rate (informational, never framed as bad).
- Percentage of plans accepted without changes.
- Number of shrink uses per active user per week.
- First-step completion rate after shrinking.
- Retention at day 7 and day 14 in the pilot.

### 23.3 Model quality metrics (pilot)

- Correlation between predicted spoons and next-evening label.
- Error of predicted versus labelled spoons.
- Comparison: prior only versus prior plus games, to test whether games add value.
- Leave-one-student-out performance.

### 23.4 Experience metrics

- Tone rating from exit survey.
- Perceived effort per check-in.
- Perceived privacy comfort.

### 23.5 Guardrail metrics

- Number of copy strings flagged against the banned-words list (should be zero).
- Number of notifications sent per user per day (should stay at or below the cap).
- Number of times the user had to look for the skip button (observed in tests).

### 23.6 Reporting rules

- Report uncertainty, sample size, and limits.
- Do not claim causation from correlation.
- Do not present the pilot as clinical evidence.

---

## 24. Pilot study design

### 24.1 Purpose

Validate whether context plus games explain next-evening self-rated spoons, and gather feedback on tone and friction. This is not part of the hackathon deliverable.

### 24.2 Participants

- 5 to 10 students.
- 4 weeks of use.
- Signed informed consent, anonymised IDs, delete on request, and no institution access.
- Participants can withdraw at any time with their data removed.
- The team should check whether an ethics review or institutional approval is required before recruiting.

### 24.3 Data

- Timetable blocks (times only), commute, daily game metrics, behaviour events, and one-tap evening labels.

### 24.4 Model approach

- Start with the transparent weighted model.
- Fit ridge regression or gradient boosting with a per-student intercept to estimate how much additional signal exists.
- Evaluate by leave-one-student-out cross-validation.

### 24.5 Sample size reality

- About 200 student-days is too small for a model that generalises broadly.
- We therefore treat results as exploratory and report wide uncertainty.

### 24.6 Claims

- Acceptable: "Context plus games explain X% of next-evening self-rated spoons in this small sample."
- Not acceptable: "We detect stress", or any statement about conditions.

### 24.7 Qualitative feedback

- Weekly one-question check-in about tone.
- Exit interview on friction, privacy comfort, and what felt off.

### 24.8 Risks in the pilot

- Self-report noise in the evening label.
- Participants dropping out during busy weeks.
- Practice effects in the games.
- Participants who feel observed.
- Mitigations: a simple label, reminders that skipping is fine, a clear privacy page, and an easy exit.

---

## 25. Testing plan

### 25.1 Unit tests

- Spoon engine: each formula with the worked examples in section 12.
- Clamp behaviour at the lower and upper bounds.
- Deadline pressure cap.
- Carryover clamp.
- Baseline EMA update.
- Planner: capacity filling, reserve, fixed deadlines, reshuffle limits.
- Cost engine: task type rates.
- Banned-words check on all generated text.

### 25.2 Game tests

- Timing accuracy using performance.now().
- Trial validity rules (anticipation, lapse, minimum trials).
- Visibility change handling.
- Reduced-motion mode.

### 25.3 Integration tests

- Import ICS then forecast.
- Play Pulse then live spoons change.
- Skip then no change and no negative message.
- Reshuffle then Calendar update without duplicates.
- Export and delete flows.

### 25.4 Sequencer tests

- Test set of at least 20 tasks across types.
- Check: first step at most 2 minutes, step count 3 to 7, no banned words, valid JSON.
- Adversarial prompts: diagnosis requests, self-harm statements, off-topic requests, prompt injection inside a task title.
- Fallback templates produce valid output with the LLM disabled.

### 25.5 Usability tests

- Five users complete onboarding and a first day.
- Observe: time taken, hesitation points, whether the skip is found, how the tone is perceived.
- Accessibility pass with a screen reader and large text.

### 25.6 Ethics and copy review

- Review all strings against section 7.2.
- Review privacy page for accuracy against actual behaviour.
- Verify no raw game data or media leaves the device (network inspection).

### 25.7 Acceptance checklist for demo

- Onboarding under 3 minutes.
- Check-in under 45 seconds.
- Why panel works on every number.
- Skip works everywhere.
- Shrink returns a first step in under 4 seconds or falls back.
- Reduced motion works.
- No clinical words anywhere.

---

## 26. Build plan and team split

### 26.1 Suggested order

1. Timetable import, commute form, and the spoon model.
2. Pulse game, then the capacity-sized task planner.
3. Micro-sequencer (Gemini plus a small RAG corpus).
4. Garden streak and energy-weather forecast.
5. Switch and Pop Garden games, then the evening one-tap.
6. Optional tiers (watch, voice) as a demo toggle.

### 26.2 Suggested workstreams

- Workstream A, core logic: spoon engine, planner, cost engine, unit tests.
- Workstream B, games and client: Pulse, Switch, Pop Garden, scoring, baseline.
- Workstream C, sequencer and backend: Gemini integration, RAG corpus, validation, fallback, Calendar.
- Workstream D, UX and content: screens, copy, accessibility, privacy page, demo script.

If the team is small, one person can cover two workstreams. Avoid splitting A and D across too many people, because the copy and model need to agree.

### 26.3 Milestones (adjust to the actual hackathon length)

- M1: Spoon engine and import working with test data.
- M2: Home screen with why panel, Pulse game, and live spoons.
- M3: Planner producing a day plan, evening check-in, garden.
- M4: Sequencer working with fallback.
- M5: Polish, accessibility, privacy page, demo rehearsal.

### 26.4 Cut list if time runs out (cut in this order)

1. Body-doubling room, WhatsApp, Tier 2.
2. Photo parsing.
3. Calendar writing (keep read-only or skip).
4. Switch game.
5. Dopamine menu.
6. Pop Garden (keep as a simple placeholder if possible).

Never cut: skip button, why panel, no-diagnosis copy, reduced motion, export and delete in the privacy page (even if the buttons are basic).

### 26.5 Seed data for the demo

- Two profiles: Aarav and Meera with the timetables and commutes in section 12.
- A set of 8 sample tasks across types.
- A baseline history of 7 days so multipliers work immediately.
- A prepared ICS file.

---

## 27. Demo script and pitch outline

### 27.1 Three-minute demo flow

1. The problem (20 seconds): productivity apps punish overloaded students and add shame.
2. Setup (20 seconds): import a timetable and commute in seconds.
3. Same timetable, two students (40 seconds): Aarav's Monday gives about 2.4 spoons and Meera's about 7.4. The plans differ, and the why panel shows exactly why.
4. The 20-second game (25 seconds): play Pulse, then show Skip with no penalty.
5. Reshuffle (25 seconds): Aarav's lab draft moves to a lighter day and an extension-email draft appears.
6. Shrink (25 seconds): a large task becomes "open the file".
7. Garden and weather (15 seconds): the plant never dies, and the week forecast appears.
8. Privacy (10 seconds): show the privacy page, no-diagnosis stance, export and delete.

### 27.2 Pitch outline

- Slide 1: the problem and who feels it.
- Slide 2: why current tools fail (shame loops).
- Slide 3: our idea, spoons, in one picture.
- Slide 4: how it works (context, game, plan, shrink).
- Slide 5: demo.
- Slide 6: rubric mapping (empathy, friction, ethics, usability).
- Slide 7: ethics and privacy in practice.
- Slide 8: validation pilot and roadmap.
- Slide 9: what we need and the ask.

### 27.3 Likely judge questions and honest answers

- "Is this accurate?" It is a transparent estimate, not a measurement. We show the reasons, let users override, and plan to validate in a pilot.
- "Why not a camera?" Cameras are weak proxies and feel invasive. We offer it as an opt-in, local-only extra.
- "Does it diagnose?" No. It reports planning capacity and never names conditions.
- "What if the game score is bad because the student is just bored?" Possible. That is why the game only adjusts the plan modestly, compares to the student's own baseline, and can be skipped or overridden.
- "How is this different from a calendar app?" Calendars assume constant capacity. We forecast capacity and adapt the plan.
- "What about data?" Scoring is local, we collect summaries only, and everything is exportable and deletable.

---

## 28. Risks and mitigations

### 28.1 Product risks

- Risk: students feel the game is another test.
  - Mitigation: calm framing, skip button, never show grades.
- Risk: estimates feel wrong.
  - Mitigation: manual override, ranges, calibration, why panel.
- Risk: too many features dilute the demo.
  - Mitigation: strict P0 focus and a cut list.

### 28.2 Technical risks

- Risk: LLM output invalid or slow.
  - Mitigation: schema validation, retry, rule-based fallback, caching.
- Risk: Calendar API issues.
  - Mitigation: read-only mode and a manual copy option.
- Risk: timing inaccuracies on low-end devices.
  - Mitigation: per-device baselines, validity checks.
- Risk: ICS or photo parsing errors.
  - Mitigation: always show parsed events for confirmation.

### 28.3 Ethical risks

- Risk: the product is read as diagnostic.
  - Mitigation: copy rules, no clinical labels, reviewed claims.
- Risk: students who need real help rely on the app.
  - Mitigation: gentle counselling suggestion, clear statement that the app is not a medical tool.
- Risk: data misuse.
  - Mitigation: minimal collection, local scoring, no institution access, export and delete.

### 28.4 Research risks

- Risk: small pilot gives noisy results.
  - Mitigation: honest reporting, exploratory framing.
- Risk: self-report bias.
  - Mitigation: simple labels and qualitative checks.

---

## 29. Reuse versus change from the earlier PRD

Reuse and re-skin as spoons:

- Energy engine, circadian curve, scheduler, Google Calendar integration, Gemini, recovery plans, streaks, WhatsApp, PWA, Supabase.

Drop or hide:

- Clinical RoBERTa depression and anxiety labels, because clinical labelling is a rubric risk.

Move to optional Tier 2:

- Voice analysis (Whisper). It also fails exactly when a person is too overwhelmed to articulate how they feel, which is why the schedule-plus-games approach is the primary path.

Reuse and rename:

- Burnout index becomes "load trend".

New to build:

- Timetable parser, context-load model, three games, spoon-cost task engine, RAG micro-sequencer, forgiving garden.

---

## 30. Open questions

- What is the right default budget (12 spoons) for different students? To be tested in the pilot.
- Should the morning and evening baselines be separate from day one?
- Which languages should be supported first?
- Is an ethics review needed before the pilot at our institution?
- How should the app behave for students without smartphones or with shared devices?
- What is the best way to present uncertainty without causing more anxiety?
- Should the evening label scale be 0 to 4 or a simpler 3 states?
- Which verified campus counselling resources should the card link to?

---

## 31. Glossary

- Spoon: a unit of energy for effortful tasks, used as a planning metaphor.
- Prior: the starting capacity estimate from context.
- Live spoons: capacity after the game and optional signals.
- Baseline: a student's own typical game performance.
- Probe: a short game used to check capacity.
- Carryover: the effect of yesterday's load on today.
- Deadline pressure: mental load from upcoming deadlines.
- Why panel: a screen explaining each factor behind a number.
- Shrink: break a task into very small steps.
- Off-ramp: a calm activity offered at low capacity.
- Load trend: a rolling view of spoons over time.
- Proxy signal: an indirect indicator, not a direct measure.
- RAG: retrieval-augmented generation.
- PWA: progressive web app.

---

## 32. Appendices

### Appendix A: Parameter table (illustrative, all to be calibrated)

- BUDGET: 12 spoons
- Commute: 0.5 spoon per 30 minutes × mode factor (crowded 1.0, seated 0.6, walk 0.3)
- Campus: 0.5 spoon per hour
- Carryover: 0.4 × max(0, previous day spend − 6)
- Deadline pressure: capped at 2.0
- Probe multiplier: ×1.0 within 20% of baseline, ×0.85 at 20 to 35% slower, ×0.7 at 35% or more slower
- Baseline EMA alpha: 0.25
- Tier 2 total adjustment cap: ±10%
- Plan reserve: 20%
- Idle prompt delay: 10 minutes
- Evening prompt default: 8 pm

### Appendix B: Task cost rates (illustrative)

- Reading: 0.067 spoon per minute
- Writing: 0.09 spoon per minute
- Problem solving: 0.089 spoon per minute
- Admin: 0.05 spoon per minute
- Micro-step: 0.1 spoon per minute

### Appendix C: Copy checklist

Before merging any string:

- Does it avoid overdue, late, behind, failed, lazy?
- Does it avoid "should" and "must"?
- Does it avoid clinical or emotional labels?
- Is it one short sentence where possible?
- Does it offer, not demand?
- Does it leave an easy way out?
- Would it be okay to read when exhausted?

### Appendix D: Sequencer JSON schema (outline)

- steps: array of 3 to 7 objects
  - text: string
  - minutes: number, first step at most 2
  - spoon: number
  - why: string, optional
- Validation: reject if banned words appear, if the first step exceeds 2 minutes, or if the count is outside range.

### Appendix E: Sample extension-email draft

Subject: Request for a short extension on the DBMS lab report

Hello Professor [Name],

I'm working on the DBMS lab report and would like to ask for a short extension to [new date]. I can share the parts I've finished by [earlier date] if that helps.

Thank you for considering this.

Regards,
[Name]

### Appendix F: Sample seed tasks for the demo

- DBMS lab report (writing, due Thursday, fixed deadline)
- Read chapter on normalisation (reading, 30 minutes)
- Operating Systems problem set (problem solving, 45 minutes)
- Email the club about the event (admin, 10 minutes)
- Prepare viva notes (writing, 40 minutes)
- Watch a lecture recording (reading, 30 minutes)
- Submit fee form (admin, 10 minutes)
- Start mini-project outline (writing, 30 minutes)

### Appendix G: Definition of done for the hackathon

- All P0 requirements pass their acceptance criteria.
- The demo script runs end to end without errors.
- The privacy page matches actual behaviour.
- No banned words appear in the UI.
- The team can answer the likely judge questions in section 27.3.

### Appendix H: Change log versus the earlier PRD draft

- Converted all tables to lists.
- Defined deadline pressure, which was undefined in the earlier draft.
- Added a zero clamp to carryover.
- Corrected Meera's commute cost to 0.1 and her Monday spoons to 7.4.
- Added confidence, ranges, and a baseline procedure.
- Added full requirement IDs with acceptance criteria.
- Added data model, API, architecture, testing, and demo plan.
- Added safety escalation and ethics-review notes.
