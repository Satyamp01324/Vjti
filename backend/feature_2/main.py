import datetime
import os
import json
import re
from typing import Dict, List, Tuple
from google import genai
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from google.auth.transport.requests import Request
from plyer import notification

# -----------------------------
# CONFIG
# -----------------------------
SCOPES = ["https://www.googleapis.com/auth/calendar.events"]
GEMINI_API_KEY = "AIzaSyBW8s01msW2J7Zn_YgqZ-Dy9OPUvsaOgYY"
COGNITIVE_STATE_FILE = "cognitive_state.json"

# Configure Gemini API
client = genai.Client(api_key=GEMINI_API_KEY)

# Cognitive State Tracking (Enhanced with Persistence)
class CognitiveState:
    def __init__(self):
        self.fatigue_counter = 0
        self.completed_tasks = []
        self.task_history = []
        self.current_focus_streak = 0
        self.total_deep_work_minutes = 0
        self.last_break_time = None
        self.daily_streaks = 0
        self.total_tasks_completed = 0
        self.achievements = []
        self.energy_patterns = {}  # Learn personal energy patterns
        self.load_state()
        
    def add_task(self, task_data):
        self.task_history.append({
            **task_data,
            'timestamp': datetime.datetime.now().isoformat(),
            'status': 'scheduled'
        })
        self.save_state()
        
    def complete_task(self, task_name, actual_difficulty):
        """Mark task as complete and update stats"""
        for task in self.task_history:
            if task['task_name'] == task_name and task['status'] == 'scheduled':
                task['status'] = 'completed'
                task['completed_at'] = datetime.datetime.now().isoformat()
                task['actual_difficulty'] = actual_difficulty
                break
        
        self.completed_tasks.append(task_name)
        self.total_tasks_completed += 1
        self.current_focus_streak += 1
        self.check_achievements()
        self.save_state()
        
    def update_fatigue(self, difficulty):
        self.fatigue_counter += difficulty
        self.save_state()
        
    def reset_fatigue(self):
        self.fatigue_counter = 0
        self.last_break_time = datetime.datetime.now()
        self.save_state()
        
    def increment_streak(self):
        self.current_focus_streak += 1
        self.save_state()
        
    def add_deep_work_time(self, minutes):
        self.total_deep_work_minutes += minutes
        self.save_state()
        
    def check_achievements(self):
        """Check and unlock achievements"""
        new_achievements = []
        
        if self.total_tasks_completed >= 10 and "First 10 Tasks" not in self.achievements:
            new_achievements.append("🎯 First 10 Tasks")
            self.achievements.append("First 10 Tasks")
        
        if self.current_focus_streak >= 5 and "5-Task Streak" not in self.achievements:
            new_achievements.append("🔥 5-Task Streak")
            self.achievements.append("5-Task Streak")
        
        if self.total_deep_work_minutes >= 300 and "5 Hours Deep Work" not in self.achievements:
            new_achievements.append("⏰ 5 Hours Deep Work")
            self.achievements.append("5 Hours Deep Work")
        
        if new_achievements:
            for achievement in new_achievements:
                show_notification("Achievement Unlocked! 🏆", achievement)
        
        self.save_state()
    
    def get_state_summary(self):
        return {
            'fatigue': self.fatigue_counter,
            'streak': self.current_focus_streak,
            'total_deep_work': self.total_deep_work_minutes,
            'tasks_completed': len(self.completed_tasks),
            'total_all_time': self.total_tasks_completed,
            'achievements': len(self.achievements)
        }
    
    def save_state(self):
        """Save cognitive state to file"""
        # Convert task_history to JSON-serializable format
        serializable_history = []
        for task in self.task_history:
            task_copy = task.copy()
            # Convert datetime objects to ISO format strings
            if 'target_date' in task_copy and task_copy['target_date']:
                if isinstance(task_copy['target_date'], datetime.datetime):
                    task_copy['target_date'] = task_copy['target_date'].isoformat()
            serializable_history.append(task_copy)
        
        state_data = {
            'fatigue_counter': self.fatigue_counter,
            'completed_tasks': self.completed_tasks,
            'task_history': serializable_history,
            'current_focus_streak': self.current_focus_streak,
            'total_deep_work_minutes': self.total_deep_work_minutes,
            'last_break_time': self.last_break_time.isoformat() if self.last_break_time else None,
            'daily_streaks': self.daily_streaks,
            'total_tasks_completed': self.total_tasks_completed,
            'achievements': self.achievements,
            'energy_patterns': self.energy_patterns
        }
        
        with open(COGNITIVE_STATE_FILE, 'w') as f:
            json.dump(state_data, f, indent=2)
    
    def load_state(self):
        """Load cognitive state from file"""
        if os.path.exists(COGNITIVE_STATE_FILE):
            try:
                with open(COGNITIVE_STATE_FILE, 'r') as f:
                    state_data = json.load(f)
                
                self.fatigue_counter = state_data.get('fatigue_counter', 0)
                self.completed_tasks = state_data.get('completed_tasks', [])
                self.task_history = state_data.get('task_history', [])
                self.current_focus_streak = state_data.get('current_focus_streak', 0)
                self.total_deep_work_minutes = state_data.get('total_deep_work_minutes', 0)
                self.daily_streaks = state_data.get('daily_streaks', 0)
                self.total_tasks_completed = state_data.get('total_tasks_completed', 0)
                self.achievements = state_data.get('achievements', [])
                self.energy_patterns = state_data.get('energy_patterns', {})
                
                last_break = state_data.get('last_break_time')
                if last_break:
                    self.last_break_time = datetime.datetime.fromisoformat(last_break)
                
                print(f"📊 Loaded cognitive state: {self.total_tasks_completed} tasks completed, {len(self.achievements)} achievements")
            except Exception as e:
                print(f"⚠️  Could not load state: {e}")

cognitive_state = CognitiveState()


# -----------------------------
# NOTIFICATION SYSTEM
# -----------------------------
def show_notification(title: str, message: str):
    """Show desktop notification"""
    try:
        notification.notify(
            title=title,
            message=message,
            app_name="Cognitive Scheduler",
            timeout=10
        )
    except Exception as e:
        print(f"⚠️  Notification failed: {e}")


# -----------------------------
# GOOGLE AUTH
# -----------------------------
def get_calendar_service():
    creds = None
    if os.path.exists("token.json"):
        creds = Credentials.from_authorized_user_file("token.json", SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(
                "client_secret.json", SCOPES
            )
            creds = flow.run_local_server(port=8080)

        with open("token.json", "w") as token:
            token.write(creds.to_json())

    return build("calendar", "v3", credentials=creds)


# -----------------------------
# ENHANCED NLP TASK PARSER WITH REAL-TIME CONTEXT
# -----------------------------
def parse_natural_language_task(user_input: str) -> Dict:
    """Extract task details with smart day/date detection"""
    import pytz
    local_tz = pytz.timezone('Asia/Kolkata')
    now = datetime.datetime.now(local_tz)
    current_hour = now.hour

    lower_input = user_input.lower()

    # CRITICAL: Detect specific days mentioned
    target_date = None
    days_of_week = {
        'monday': 0, 'tuesday': 1, 'wednesday': 2, 'thursday': 3,
        'friday': 4, 'saturday': 5, 'sunday': 6
    }

    # Check if user mentioned a specific day
    for day_name, day_num in days_of_week.items():
        if day_name in lower_input:
            # Calculate next occurrence of this day
            current_day = now.weekday()
            days_ahead = day_num - current_day
            if days_ahead <= 0:  # Target day already passed this week
                days_ahead += 7
            target_date = now + datetime.timedelta(days=days_ahead)
            print(f"📅 Detected day: {day_name.capitalize()} → {target_date.strftime('%B %d, %Y')}")
            break

    # Check for relative dates
    if 'tomorrow' in lower_input:
        target_date = now + datetime.timedelta(days=1)
        print(f"📅 Detected: Tomorrow → {target_date.strftime('%B %d, %Y')}")
    elif 'today' in lower_input:
        target_date = now
        print(f"📅 Detected: Today → {target_date.strftime('%B %d, %Y')}")
    elif 'next week' in lower_input:
        target_date = now + datetime.timedelta(days=7)
        print(f"📅 Detected: Next week → {target_date.strftime('%B %d, %Y')}")

    # Detect physical activities
    physical_keywords = ['cricket', 'gym', 'run', 'jog', 'exercise', 'sport', 'play', 'workout', 'yoga']
    is_physical = any(keyword in lower_input for keyword in physical_keywords)

    # Detect social/event activities
    social_keywords = ['wedding', 'party', 'meeting', 'event', 'attend', 'ceremony', 'resort']
    is_social = any(keyword in lower_input for keyword in social_keywords)

    # Detect cognitive types
    analytical_keywords = ['math', 'calculus', 'algorithm', 'code', 'programming', 'physics', 'chemistry']
    creative_keywords = ['write', 'essay', 'design', 'draw', 'create', 'art', 'compose']
    memorization_keywords = ['memorize', 'learn', 'vocabulary', 'flashcard', 'remember']

    if is_social:
        cognitive_type = "Social"
        category = "Social Event"
        difficulty = 2
        preferred_time = "Flexible"
    elif is_physical:
        cognitive_type = "Physical"
        category = "Physical Activity"
        difficulty = 3
        preferred_time = "Morning"
    elif any(k in lower_input for k in analytical_keywords):
        cognitive_type = "Analytical"
        category = "Deep Work"
        difficulty = 8
        preferred_time = "Morning"
    elif any(k in lower_input for k in creative_keywords):
        cognitive_type = "Creative"
        category = "Deep Work"
        difficulty = 6
        preferred_time = "Afternoon"
    elif any(k in lower_input for k in memorization_keywords):
        cognitive_type = "Memorization"
        category = "Medium Focus"
        difficulty = 5
        preferred_time = "Flexible"
    else:
        cognitive_type = "Problem-Solving"
        category = "Medium Focus"
        difficulty = 5
        preferred_time = "Flexible"

    # Estimate duration
    if 'hour' in lower_input:
        import re
        match = re.search(r'(\d+)\s*hour', lower_input)
        duration = int(match.group(1)) * 60 if match else 60
    else:
        duration = 120 if is_social else 45

    return {
        "task_name": user_input,
        "difficulty": difficulty,
        "duration_minutes": duration,
        "category": category,
        "subject_area": "General",
        "urgency": "Medium",
        "prerequisites": [],
        "cognitive_type": cognitive_type,
        "deadline": None,
        "deadline_text": None,
        "preferred_time_of_day": preferred_time,
        "requires_physical_space": is_physical or is_social,
        "is_physical_activity": is_physical,
        "target_date": target_date,
        "is_social_event": is_social
    }




# -----------------------------
# MENTAL ENERGY ENGINE (Enhanced)
# -----------------------------
def get_mental_energy() -> Dict:
    """Calculate real-time mental bandwidth with circadian rhythm awareness"""
    now = datetime.datetime.now()
    hour = now.hour
    day_of_week = now.weekday()  # 0=Monday, 6=Sunday
    
    # Base energy by time of day (circadian rhythm)
    if 6 <= hour <= 9:
        base_energy = 9  # Peak morning energy
    elif 10 <= hour <= 12:
        base_energy = 8  # High focus window
    elif 13 <= hour <= 14:
        base_energy = 5  # Post-lunch dip
    elif 15 <= hour <= 17:
        base_energy = 7  # Afternoon recovery
    elif 18 <= hour <= 20:
        base_energy = 5  # Evening moderate
    elif 21 <= hour <= 23:
        base_energy = 3  # Late evening low
    else:
        base_energy = 1  # Night/early morning
    
    # Adjust for fatigue accumulation
    fatigue_penalty = min(cognitive_state.fatigue_counter * 0.5, 4)
    
    # Weekend bonus
    weekend_bonus = 1 if day_of_week >= 5 else 0
    
    # Calculate time since last break
    break_penalty = 0
    if cognitive_state.last_break_time:
        minutes_since_break = (now - cognitive_state.last_break_time).total_seconds() / 60
        if minutes_since_break > 90:
            break_penalty = 2
    
    final_energy = max(1, base_energy - fatigue_penalty + weekend_bonus - break_penalty)
    
    return {
        'energy_level': int(final_energy),
        'base_energy': base_energy,
        'fatigue_penalty': fatigue_penalty,
        'break_penalty': break_penalty,
        'recommendation': get_energy_recommendation(final_energy)
    }

def get_energy_recommendation(energy_level: float) -> str:
    """Provide contextual recommendations based on energy"""
    if energy_level >= 8:
        return "🔥 Peak Performance - Tackle your hardest tasks now!"
    elif energy_level >= 6:
        return "💪 Good Focus - Great time for challenging work"
    elif energy_level >= 4:
        return "⚡ Moderate Energy - Medium difficulty tasks recommended"
    elif energy_level >= 2:
        return "🌙 Low Energy - Consider light tasks or take a break"
    else:
        return "😴 Critical Low - Rest is essential for productivity"


# -----------------------------
# DEEP WORK GAMIFICATION ENGINE
# -----------------------------
def create_deep_work_block(task_data: Dict, start_time: datetime.datetime) -> Dict:
    """Structure task with Pomodoro-style deep work mechanics"""
    difficulty = task_data['difficulty']
    duration = task_data['duration_minutes']
    
    # Break duration into focused blocks
    if duration > 50:
        # Long task: Use 50-min work + 10-min break cycles
        work_blocks = []
        remaining = duration
        current_time = start_time
        
        while remaining > 0:
            block_duration = min(50, remaining)
            work_blocks.append({
                'start': current_time,
                'end': current_time + datetime.timedelta(minutes=block_duration),
                'type': 'deep_work',
                'duration': block_duration
            })
            current_time += datetime.timedelta(minutes=block_duration)
            remaining -= block_duration
            
            if remaining > 0:
                work_blocks.append({
                    'start': current_time,
                    'end': current_time + datetime.timedelta(minutes=10),
                    'type': 'micro_break',
                    'duration': 10
                })
                current_time += datetime.timedelta(minutes=10)
        
        return {'blocks': work_blocks, 'total_time': duration + (len(work_blocks) // 2) * 10}
    else:
        # Short task: Single focused block
        return {
            'blocks': [{
                'start': start_time,
                'end': start_time + datetime.timedelta(minutes=duration),
                'type': 'deep_work',
                'duration': duration
            }],
            'total_time': duration
        }

def get_gamification_emoji(difficulty: int, category: str) -> str:
    """Add motivational emojis based on task type"""
    if difficulty >= 8:
        return "🔥💎"  # Boss level
    elif difficulty >= 6:
        return "⚔️"  # Challenge
    elif category == "Deep Work":
        return "🧠"  # Brain work
    elif category == "Creative":
        return "🎨"  # Creative
    else:
        return "📚"  # Study


# -----------------------------
# DYNAMIC RECOVERY CYCLE ALGORITHM
# -----------------------------
def calculate_recovery_need(task_data: Dict, energy_state: Dict) -> Tuple[bool, int, str]:
    """Detect fatigue patterns and recommend recovery"""
    difficulty = task_data['difficulty']
    current_fatigue = cognitive_state.fatigue_counter
    energy_level = energy_state['energy_level']
    
    # Fatigue threshold detection
    needs_recovery = False
    recovery_duration = 0
    recovery_type = ""
    
    # High fatigue accumulation
    if current_fatigue > 15:
        needs_recovery = True
        recovery_duration = 20
        recovery_type = "Long Break - Walk outside or stretch"
    elif current_fatigue > 10:
        needs_recovery = True
        recovery_duration = 10
        recovery_type = "Medium Break - Step away from screen"
    elif energy_level <= 3:
        needs_recovery = True
        recovery_duration = 15
        recovery_type = "Energy Recovery - Rest or light activity"
    elif difficulty >= 8 and energy_level <= 5:
        needs_recovery = True
        recovery_duration = 10
        recovery_type = "Pre-task Recovery - Prepare for high difficulty"
    
    return needs_recovery, recovery_duration, recovery_type


# -----------------------------
# INTELLIGENT CALENDAR SCHEDULER
# -----------------------------
def cognitive_scheduler(user_input: str):
    """Main scheduling engine with cognitive optimization"""
    print("\n🧠 Analyzing your task with cognitive AI...\n")
    
    # Parse task
    task_data = parse_natural_language_task(user_input)
    print(f"📋 Task: {task_data['task_name']}")
    print(f"🎯 Category: {task_data['category']}")
    print(f"⚡ Difficulty: {task_data['difficulty']}/10")
    print(f"⏱️  Duration: {task_data['duration_minutes']} minutes")
    print(f"🧩 Type: {task_data['cognitive_type']}")
    print(f"🚨 Urgency: {task_data['urgency']}")
    
    # Check mental energy
    energy_state = get_mental_energy()
    print(f"\n💪 Current Energy Level: {energy_state['energy_level']}/10")
    print(f"💡 {energy_state['recommendation']}")
    print(f"📊 Fatigue Score: {cognitive_state.fatigue_counter}")
    
    # Check if recovery needed BEFORE scheduling
    needs_recovery, recovery_duration, recovery_type = calculate_recovery_need(task_data, energy_state)
    
    if needs_recovery:
        print(f"\n⚠️  Recovery Recommended: {recovery_type} ({recovery_duration} min)")
        print(f"   Reason: Fatigue={cognitive_state.fatigue_counter}, Energy={energy_state['energy_level']}")
        proceed = input("   Schedule recovery break first? (y/n): ").lower()
        if proceed == 'y':
            schedule_recovery_break(recovery_duration, recovery_type)
            cognitive_state.reset_fatigue()
            print("   ✅ Recovery break scheduled!")
    
    # Analyze calendar and find optimal time
    print("\n🔍 Analyzing your calendar and cognitive patterns...")
    service = get_calendar_service()
    
    # Check for existing workload
    import pytz
    local_tz = pytz.timezone('Asia/Kolkata')
    now = datetime.datetime.now(local_tz)
    
    events_result = service.events().list(
        calendarId='primary',
        timeMin=now.isoformat(),
        timeMax=(now + datetime.timedelta(hours=24)).isoformat(),
        singleEvents=True,
        orderBy='startTime'
    ).execute()
    
    existing_events = events_result.get('items', [])
    print(f"📅 Found {len(existing_events)} existing events in next 24 hours")
    
    # Calculate current workload
    total_scheduled_minutes = sum(
        (datetime.datetime.fromisoformat(e['end'].get('dateTime', '').replace('Z', '+00:00')) - 
         datetime.datetime.fromisoformat(e['start'].get('dateTime', '').replace('Z', '+00:00'))).total_seconds() / 60
        for e in existing_events if e['start'].get('dateTime')
    )
    print(f"⏰ Current workload: {int(total_scheduled_minutes)} minutes scheduled")
    
    # Find optimal slot
    start_time = find_optimal_slot(service, task_data, energy_state)
    
    # Create deep work structure
    work_structure = create_deep_work_block(task_data, start_time)
    
    # Schedule on calendar
    print(f"\n📅 Scheduling task at {start_time.strftime('%I:%M %p, %d %b %Y')}")
    event_id, event_link = create_calendar_event(service, task_data, work_structure, start_time)
    
    # Update cognitive state
    cognitive_state.add_task(task_data)
    cognitive_state.update_fatigue(task_data['difficulty'])
    cognitive_state.increment_streak()
    cognitive_state.add_deep_work_time(task_data['duration_minutes'])
    
    emoji = get_gamification_emoji(task_data['difficulty'], task_data['category'])
    print(f"\n✅ {emoji} Task scheduled successfully!")
    print(f"🔗 Event Link: {event_link}")
    
    # Show desktop notification
    show_notification(
        "Task Scheduled! 🎯",
        f"{task_data['task_name']} at {start_time.strftime('%I:%M %p')}"
    )
    
    print(f"\n📊 Updated Cognitive State:")
    state = cognitive_state.get_state_summary()
    print(f"   • Fatigue: {state['fatigue']}")
    print(f"   • Focus Streak: {state['streak']}")
    print(f"   • Tasks Completed: {state['tasks_completed']}")
    print(f"   • Total All-Time: {state['total_all_time']}")
    print(f"   • Deep Work Time: {state['total_deep_work']} min")
    print(f"   • Achievements: {state['achievements']}")
    
    # Show achievements if any
    if cognitive_state.achievements:
        print(f"\n🏆 Your Achievements:")
        for achievement in cognitive_state.achievements[-3:]:  # Show last 3
            print(f"   • {achievement}")


def find_optimal_slot(service, task_data: Dict, energy_state: Dict) -> datetime.datetime:
    """Find the OPTIMAL time slot based on cognitive load, energy, and calendar availability"""
    import pytz
    local_tz = pytz.timezone('Asia/Kolkata')
    now = datetime.datetime.now(local_tz)
    
    # CRITICAL: Check if user specified a target date (e.g., "on Thursday")
    target_date = task_data.get('target_date')
    
    if target_date:
        # User specified a day - search ONLY on that day
        print(f"🎯 Searching for slots on {target_date.strftime('%A, %B %d, %Y')}")
        time_min = target_date.replace(hour=6, minute=0, second=0, microsecond=0).isoformat()
        time_max = target_date.replace(hour=23, minute=59, second=0, microsecond=0).isoformat()
        search_start = target_date.replace(hour=6, minute=0, second=0, microsecond=0)
    else:
        # No specific day - search next 24 hours
        print(f"🔍 Searching for slots in next 24 hours")
        time_min = now.isoformat()
        time_max = (now + datetime.timedelta(hours=24)).isoformat()
        search_start = now
    
    events_result = service.events().list(
        calendarId='primary',
        timeMin=time_min,
        timeMax=time_max,
        singleEvents=True,
        orderBy='startTime'
    ).execute()
    
    events = events_result.get('items', [])
    
    # Build a workload map (how busy each hour is)
    workload_map = analyze_workload(events, search_start, local_tz)
    
    # Find optimal time windows based on cognitive requirements
    optimal_windows = find_cognitive_windows(
        search_start, 
        workload_map, 
        task_data,
        energy_state,
        local_tz
    )
    
    if not optimal_windows:
        # Fallback: schedule at next available slot on target day
        duration_needed = task_data['duration_minutes']
        return find_next_free_slot(events, search_start, duration_needed, local_tz)
    
    # Return the best window
    best_window = optimal_windows[0]
    print(f"\n🎯 Optimal Time Found:")
    print(f"   Date: {best_window['start'].strftime('%A, %B %d')}")
    print(f"   Time: {best_window['start'].strftime('%I:%M %p')}")
    print(f"   Reason: {best_window['reason']}")
    print(f"   Energy Match: {best_window['energy_score']}/10")
    
    return best_window['start']


def analyze_workload(events, now, local_tz) -> Dict:
    """Analyze existing calendar to understand workload density"""
    workload_map = {}
    
    for event in events:
        event_start_str = event['start'].get('dateTime')
        event_end_str = event['end'].get('dateTime')
        
        if not event_start_str:  # Skip all-day events
            continue
            
        event_start = datetime.datetime.fromisoformat(event_start_str.replace('Z', '+00:00')).astimezone(local_tz)
        event_end = datetime.datetime.fromisoformat(event_end_str.replace('Z', '+00:00')).astimezone(local_tz)
        
        # Mark hours as busy
        current = event_start
        while current < event_end:
            hour_key = current.replace(minute=0, second=0, microsecond=0)
            workload_map[hour_key] = workload_map.get(hour_key, 0) + 1
            current += datetime.timedelta(hours=1)
    
    return workload_map


def find_cognitive_windows(now, workload_map, task_data: Dict, energy_state, local_tz) -> List[Dict]:
    """Find time windows that match cognitive requirements using REAL-TIME AI analysis"""
    windows = []
    current_energy = energy_state['energy_level']
    
    difficulty = task_data['difficulty']
    duration_needed = task_data['duration_minutes']
    is_physical = task_data.get('is_physical_activity', False)
    preferred_time = task_data.get('preferred_time_of_day', 'Flexible')
    cognitive_type = task_data.get('cognitive_type', 'Problem-Solving')
    target_date = task_data.get('target_date')
    
    # Use AI to determine optimal time preferences with FULL context
    time_preferences = get_ai_time_preferences_with_context(task_data)
    
    # Determine search range
    if target_date:
        # Search only on the target date
        max_hours = 18  # 6 AM to 11 PM on target day
        start_search = target_date.replace(hour=6, minute=0, second=0, microsecond=0)
    else:
        # Search next 24 hours
        max_hours = 24
        start_search = now
    
    # Scan for optimal windows
    for hour_offset in range(max_hours):
        candidate = start_search + datetime.timedelta(hours=hour_offset)
        candidate = candidate.replace(minute=0, second=0, microsecond=0)
        hour = candidate.hour
        
        # If target_date specified, ensure we stay on that date
        if target_date and candidate.date() != target_date.date():
            continue
        
        # Skip if in the past
        if candidate < now:
            continue
        
        # CRITICAL: Filter out inappropriate times for physical activities
        if is_physical:
            # Physical activities: Only 6 AM - 10 PM
            if hour < 6 or hour >= 22:
                continue
        
        # Filter by preferred time of day
        if preferred_time == "Morning" and not (6 <= hour < 12):
            continue
        elif preferred_time == "Afternoon" and not (12 <= hour < 17):
            continue
        elif preferred_time == "Evening" and not (17 <= hour < 22):
            continue
        
        # Check if this hour is free
        if candidate in workload_map:
            continue  # Busy hour
        
        # Check if we have enough consecutive free time
        is_free = True
        for min_offset in range(0, duration_needed, 60):
            check_time = candidate + datetime.timedelta(minutes=min_offset)
            check_hour = check_time.replace(minute=0, second=0, microsecond=0)
            if check_hour in workload_map:
                is_free = False
                break
        
        if not is_free:
            continue
        
        # Calculate energy level at this time using AI
        predicted_energy = predict_energy_at_time(hour, cognitive_state.fatigue_counter)
        
        # Check if energy matches requirement
        if predicted_energy < time_preferences['min_energy']:
            continue
        
        # Calculate score using AI reasoning with FULL context
        score_data = calculate_slot_score_with_context(
            candidate, 
            predicted_energy, 
            task_data,
            workload_map,
            time_preferences,
            current_energy,
            hour_offset
        )
        
        windows.append({
            'start': candidate,
            'score': score_data['score'],
            'energy_score': predicted_energy,
            'reason': score_data['reason']
        })
    
    # Sort by score (best first)
    windows.sort(key=lambda x: x['score'], reverse=True)
    return windows


def get_ai_time_preferences_with_context(task_data: Dict) -> Dict:
    """Use AI to determine optimal time preferences with FULL task context"""
    prompt = f"""
    You are a cognitive scheduling expert with REAL-TIME awareness.
    
    Task Details:
    - Name: {task_data['task_name']}
    - Difficulty: {task_data['difficulty']}/10
    - Duration: {task_data['duration_minutes']} minutes
    - Cognitive Type: {task_data.get('cognitive_type', 'Unknown')}
    - Is Physical Activity: {task_data.get('is_physical_activity', False)}
    - Preferred Time: {task_data.get('preferred_time_of_day', 'Flexible')}
    
    CRITICAL RULES:
    1. Physical activities (cricket, gym, sports) → ONLY schedule 6 AM - 10 PM
    2. Deep analytical work → Morning (8-12) or late afternoon (3-5 PM)
    3. Creative work → When energy is moderate-high
    4. Memorization → Flexible timing
    
    Respond in EXACTLY this JSON format (no markdown):
    {{
        "min_energy": 1-10 (minimum energy level needed),
        "preferred_hours": [list of hours 0-23 that are best],
        "avoid_hours": [list of hours to AVOID],
        "reasoning": "brief explanation"
    }}
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )
        text = response.text.strip()
        
        if text.startswith("```json"):
            text = text.split("```json")[1].split("```")[0].strip()
        elif text.startswith("```"):
            text = text.split("```")[1].split("```")[0].strip()
        
        return json.loads(text)
    except:
        # Intelligent fallback based on task type
        if task_data.get('is_physical_activity'):
            return {
                "min_energy": 5,
                "preferred_hours": list(range(6, 22)),  # 6 AM - 10 PM
                "avoid_hours": list(range(22, 24)) + list(range(0, 6)),
                "reasoning": "Physical activity needs daylight hours"
            }
        elif task_data['difficulty'] >= 8:
            return {
                "min_energy": 8,
                "preferred_hours": [8, 9, 10, 11, 15, 16, 17],
                "avoid_hours": [0, 1, 2, 3, 4, 5, 22, 23],
                "reasoning": "High difficulty needs peak energy"
            }
        else:
            return {
                "min_energy": 4,
                "preferred_hours": list(range(8, 22)),
                "avoid_hours": list(range(22, 24)) + list(range(0, 8)),
                "reasoning": "Flexible scheduling"
            }


def calculate_slot_score_with_context(candidate, predicted_energy, task_data: Dict, workload_map, time_preferences, current_energy, hour_offset) -> Dict:
    """Calculate score for a time slot using AI reasoning with FULL context"""
    hour = candidate.hour
    
    prompt = f"""
    You are a cognitive scheduling optimizer with REAL-TIME context.
    
    Time Slot: {hour}:00 (hour of day)
    Predicted Energy: {predicted_energy}/10
    Current Energy: {current_energy}/10
    Hours from Now: {hour_offset}
    
    Task Context:
    - Name: {task_data['task_name']}
    - Difficulty: {task_data['difficulty']}/10
    - Cognitive Type: {task_data.get('cognitive_type')}
    - Is Physical: {task_data.get('is_physical_activity', False)}
    - Preferred Time: {task_data.get('preferred_time_of_day')}
    
    Preferred Hours: {time_preferences['preferred_hours']}
    Avoid Hours: {time_preferences.get('avoid_hours', [])}
    
    CRITICAL: If this is physical activity at night (10 PM - 6 AM), score MUST be 0.
    
    Consider:
    - Energy-difficulty match
    - Task type appropriateness for time of day
    - Circadian rhythm alignment
    - Immediate availability vs optimal timing
    
    Respond in EXACTLY this JSON format (no markdown):
    {{
        "score": 0-20 (higher is better, 0 if inappropriate time),
        "reason": "brief explanation"
    }}
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )
        text = response.text.strip()
        
        if text.startswith("```json"):
            text = text.split("```json")[1].split("```")[0].strip()
        elif text.startswith("```"):
            text = text.split("```")[1].split("```")[0].strip()
        
        result = json.loads(text)
        return result
    except:
        # Intelligent fallback scoring
        score = predicted_energy
        reasons = []
        
        # Check if time is appropriate for task type
        if task_data.get('is_physical_activity') and (hour < 6 or hour >= 22):
            return {"score": 0, "reason": "Physical activity at inappropriate time (night)"}
        
        if hour in time_preferences['preferred_hours']:
            score += 5
            reasons.append("Optimal time window")
        
        if hour in time_preferences.get('avoid_hours', []):
            score -= 5
            reasons.append("Suboptimal time")
        
        if hour_offset <= 1 and current_energy >= time_preferences['min_energy']:
            score += 2
            reasons.append("Ready now")
        
        surrounding_load = sum(workload_map.get(candidate + datetime.timedelta(hours=h), 0) for h in [-1, 0, 1])
        if surrounding_load == 0:
            score += 3
            reasons.append("Clear schedule")
        
        return {
            "score": max(0, score),
            "reason": ", ".join(reasons) if reasons else "Available slot"
        }


def predict_energy_at_time(hour: int, current_fatigue: int) -> int:
    """Predict energy level at a specific hour using AI"""
    prompt = f"""
    You are a cognitive energy predictor. Predict mental energy level for a student.
    
    Current Time Hour: {hour} (24-hour format)
    Current Fatigue Score: {current_fatigue} (0-20 scale, higher = more tired)
    
    Consider:
    - Circadian rhythm (morning peak, post-lunch dip, evening decline)
    - Fatigue accumulation impact
    - Typical student energy patterns
    
    Respond with ONLY a single number from 1-10 representing predicted energy level.
    No explanation, just the number.
    """
    
    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt
        )
        energy = int(response.text.strip())
        return max(1, min(10, energy))  # Clamp between 1-10
    except:
        # Fallback to rule-based
        if 6 <= hour <= 9:
            base = 9
        elif 10 <= hour <= 12:
            base = 8
        elif 13 <= hour <= 14:
            base = 5
        elif 15 <= hour <= 17:
            base = 7
        elif 18 <= hour <= 20:
            base = 5
        elif 21 <= hour <= 23:
            base = 3
        else:
            base = 1
        fatigue_penalty = min(current_fatigue * 0.3, 4)
        return max(1, int(base - fatigue_penalty))


def find_next_free_slot(events, now, duration_needed, local_tz) -> datetime.datetime:
    """Fallback: Find next available free slot"""
    candidate = now + datetime.timedelta(minutes=10)
    candidate = candidate.replace(second=0, microsecond=0)
    
    for event in events:
        event_start_str = event['start'].get('dateTime')
        event_end_str = event['end'].get('dateTime')
        
        if not event_start_str:
            continue
            
        event_start = datetime.datetime.fromisoformat(event_start_str.replace('Z', '+00:00')).astimezone(local_tz)
        event_end = datetime.datetime.fromisoformat(event_end_str.replace('Z', '+00:00')).astimezone(local_tz)
        
        # If candidate overlaps, move to after this event
        if candidate < event_end and (candidate + datetime.timedelta(minutes=duration_needed)) > event_start:
            candidate = event_end + datetime.timedelta(minutes=5)
    
    return candidate


def create_calendar_event(service, task_data: Dict, work_structure: Dict, start_time: datetime.datetime) -> Tuple[str, str]:
    """Create Google Calendar event with deep work structure"""
    emoji = get_gamification_emoji(task_data['difficulty'], task_data['category'])
    
    end_time = start_time + datetime.timedelta(minutes=work_structure['total_time'])
    
    # Build description with work blocks
    description = f"📚 {task_data['category']} - {task_data['cognitive_type']}\n"
    description += f"⚡ Difficulty: {task_data['difficulty']}/10\n"
    description += f"📖 Subject: {task_data['subject_area']}\n"
    description += f"🎯 Urgency: {task_data['urgency']}\n\n"
    description += "⏱️ Work Structure:\n"
    description += "━━━━━━━━━━━━━━━━━━━━\n"
    
    for i, block in enumerate(work_structure['blocks'], 1):
        if block['type'] == 'deep_work':
            description += f"{i}. 🧠 DEEP WORK ({block['duration']} min)\n"
            description += f"   Focus Mode: {task_data['cognitive_type']}\n"
        else:
            description += f"{i}. ☕ BREAK ({block['duration']} min)\n"
            description += f"   Stretch, hydrate, rest eyes\n"
    
    description += "\n💡 Tips:\n"
    description += "• Silence notifications\n"
    description += "• Close unnecessary tabs\n"
    description += "• Have water nearby\n"
    
    event = {
        'summary': f"{emoji} {task_data['task_name']}",
        'description': description,
        'start': {
            'dateTime': start_time.isoformat(),
            'timeZone': 'Asia/Kolkata',
        },
        'end': {
            'dateTime': end_time.isoformat(),
            'timeZone': 'Asia/Kolkata',
        },
        'reminders': {
            'useDefault': False,
            'overrides': [
                {'method': 'popup', 'minutes': 5},
                {'method': 'popup', 'minutes': 0},
            ],
        },
        'colorId': get_event_color(task_data['category']),
    }
    
    created_event = service.events().insert(calendarId='primary', body=event).execute()
    event_link = created_event.get('htmlLink')
    return created_event.get('id'), event_link


def get_event_color(category: str) -> str:
    """Assign color based on task category"""
    colors = {
        'Deep Work': '11',  # Red - High focus
        'Medium Focus': '5',  # Yellow - Moderate
        'Light Task': '10',  # Green - Easy
        'Creative': '9',  # Blue - Creative
    }
    return colors.get(category, '1')


def schedule_recovery_break(duration: int, break_type: str):
    """Schedule a recovery break on calendar"""
    service = get_calendar_service()
    import pytz
    local_tz = pytz.timezone('Asia/Kolkata')
    now = datetime.datetime.now(local_tz)
    start_time = now + datetime.timedelta(minutes=5)
    start_time = start_time.replace(second=0, microsecond=0)
    end_time = start_time + datetime.timedelta(minutes=duration)
    
    event = {
        'summary': f"🌿 Recovery Break - {break_type}",
        'description': f"Cognitive recovery period\nType: {break_type}",
        'start': {
            'dateTime': start_time.isoformat(),
            'timeZone': 'Asia/Kolkata',
        },
        'end': {
            'dateTime': end_time.isoformat(),
            'timeZone': 'Asia/Kolkata',
        },
        'colorId': '10',  # Green color for breaks
    }
    
    service.events().insert(calendarId='primary', body=event).execute()
    print(f"✅ Recovery break scheduled at {start_time.strftime('%I:%M %p')}")


# -----------------------------
# MULTI-TASK QUEUE SCHEDULER
# -----------------------------
def schedule_multiple_tasks(user_input: str):
    """Handle multiple tasks at once"""
    print("\n🧠 Analyzing multiple tasks with cognitive AI...\n")
    
    # Parse multiple tasks
    prompt = f"""
    Extract multiple tasks from this input: "{user_input}"
    
    Respond in EXACTLY this JSON format (no markdown):
    {{
        "tasks": [
            "task 1 description",
            "task 2 description",
            ...
        ]
    }}
    
    If only one task, return array with one item.
    """
    
    response = client.models.generate_content(
        model="gemini-3-flash-preview",
        contents=prompt
    )
    text = response.text.strip()
    
    if text.startswith("```json"):
        text = text.split("```json")[1].split("```")[0].strip()
    elif text.startswith("```"):
        text = text.split("```")[1].split("```")[0].strip()
    
    try:
        data = json.loads(text)
        tasks = data.get('tasks', [user_input])
    except:
        tasks = [user_input]
    
    if len(tasks) == 1:
        # Single task - use regular scheduler
        cognitive_scheduler(tasks[0])
        return
    
    print(f"📋 Found {len(tasks)} tasks to schedule\n")
    
    # Parse all tasks
    parsed_tasks = []
    for i, task in enumerate(tasks, 1):
        print(f"Analyzing task {i}/{len(tasks)}: {task}")
        task_data = parse_natural_language_task(task)
        parsed_tasks.append(task_data)
    
    # Sort by urgency and difficulty
    parsed_tasks.sort(key=lambda x: (
        {'High': 0, 'Medium': 1, 'Low': 2}[x['urgency']],
        -x['difficulty']
    ))
    
    print(f"\n📊 Scheduling order (by urgency & difficulty):")
    for i, task in enumerate(parsed_tasks, 1):
        print(f"  {i}. {task['task_name']} (Difficulty: {task['difficulty']}, Urgency: {task['urgency']})")
    
    # Schedule each task
    service = get_calendar_service()
    import pytz
    local_tz = pytz.timezone('Asia/Kolkata')
    last_end_time = datetime.datetime.now(local_tz)
    
    scheduled_events = []
    
    for i, task_data in enumerate(parsed_tasks, 1):
        print(f"\n{'='*60}")
        print(f"Scheduling Task {i}/{len(parsed_tasks)}: {task_data['task_name']}")
        print(f"{'='*60}")
        
        energy_state = get_mental_energy()
        
        # Check if recovery needed between tasks
        if i > 1:
            needs_recovery, recovery_duration, recovery_type = calculate_recovery_need(task_data, energy_state)
            if needs_recovery:
                print(f"⚠️  Auto-inserting recovery break: {recovery_type} ({recovery_duration} min)")
                last_end_time = schedule_recovery_break_at_time(recovery_duration, recovery_type, last_end_time, service)
                cognitive_state.reset_fatigue()
        
        # Find optimal slot (after last task)
        start_time = find_optimal_slot_after(service, task_data, energy_state, last_end_time)
        
        # Create deep work structure
        work_structure = create_deep_work_block(task_data, start_time)
        
        # Schedule
        event_id, event_link = create_calendar_event(service, task_data, work_structure, start_time)
        
        # Update state
        cognitive_state.add_task(task_data)
        cognitive_state.update_fatigue(task_data['difficulty'])
        cognitive_state.add_deep_work_time(task_data['duration_minutes'])
        
        scheduled_events.append({
            'task': task_data['task_name'],
            'time': start_time.strftime('%I:%M %p'),
            'link': event_link
        })
        
        last_end_time = start_time + datetime.timedelta(minutes=work_structure['total_time'])
        
        # Show notification
        show_notification(
            f"Task {i}/{len(parsed_tasks)} Scheduled ✅",
            f"{task_data['task_name']} at {start_time.strftime('%I:%M %p')}"
        )
    
    # Summary
    print(f"\n{'='*60}")
    print(f"✅ ALL {len(parsed_tasks)} TASKS SCHEDULED!")
    print(f"{'='*60}")
    for event in scheduled_events:
        print(f"  • {event['task']} at {event['time']}")
        print(f"    🔗 {event['link']}")
    
    print(f"\n📊 Updated Cognitive State:")
    state = cognitive_state.get_state_summary()
    print(f"   • Fatigue: {state['fatigue']}")
    print(f"   • Total Tasks: {state['total_all_time']}")
    print(f"   • Achievements: {state['achievements']}")


def find_optimal_slot_after(service, task_data: Dict, energy_state: Dict, after_time) -> datetime.datetime:
    """Find optimal slot after a specific time"""
    import pytz
    local_tz = pytz.timezone('Asia/Kolkata')
    
    # Look ahead from after_time
    time_min = after_time.isoformat()
    time_max = (after_time + datetime.timedelta(hours=24)).isoformat()
    
    events_result = service.events().list(
        calendarId='primary',
        timeMin=time_min,
        timeMax=time_max,
        singleEvents=True,
        orderBy='startTime'
    ).execute()
    
    events = events_result.get('items', [])
    workload_map = analyze_workload(events, after_time, local_tz)
    
    duration_needed = task_data['duration_minutes']
    difficulty = task_data['difficulty']
    
    # Find windows after the specified time
    optimal_windows = find_cognitive_windows(
        after_time, 
        workload_map, 
        task_data,
        energy_state,
        local_tz
    )
    
    if optimal_windows:
        return optimal_windows[0]['start']
    else:
        return find_next_free_slot(events, after_time, duration_needed, local_tz)


def schedule_recovery_break_at_time(duration: int, break_type: str, start_time, service):
    """Schedule recovery break at specific time"""
    end_time = start_time + datetime.timedelta(minutes=duration)
    
    event = {
        'summary': f"🌿 Recovery Break - {break_type}",
        'description': f"Cognitive recovery period\nType: {break_type}\n\n💡 Suggestions:\n• Walk outside\n• Stretch\n• Hydrate\n• Rest eyes",
        'start': {
            'dateTime': start_time.isoformat(),
            'timeZone': 'Asia/Kolkata',
        },
        'end': {
            'dateTime': end_time.isoformat(),
            'timeZone': 'Asia/Kolkata',
        },
        'colorId': '10',  # Green
    }
    
    service.events().insert(calendarId='primary', body=event).execute()
    return end_time


# -----------------------------
# ENHANCED COGNITIVE SCHEDULER
# -----------------------------


# -----------------------------
# MAIN ENTRY POINT
# -----------------------------
if __name__ == "__main__":
    print("="*60)
    print("🧠 COGNITIVE-AWARE TASK SCHEDULER")
    print("="*60)
    print("\nOptions:")
    print("1. Schedule single task")
    print("2. Schedule multiple tasks")
    print("3. View cognitive stats")
    print("4. Mark task as complete")
    
    choice = input("\nChoose option (1-4): ").strip()
    
    if choice == "1":
        user_task = input("\nEnter your task: ")
        cognitive_scheduler(user_task)
    
    elif choice == "2":
        user_tasks = input("\nEnter your tasks (describe all): ")
        schedule_multiple_tasks(user_tasks)
    
    elif choice == "3":
        print("\n📊 COGNITIVE STATE DASHBOARD")
        print("="*60)
        state = cognitive_state.get_state_summary()
        print(f"Fatigue Level: {state['fatigue']}/20")
        print(f"Current Streak: {state['streak']} tasks")
        print(f"Tasks Completed Today: {state['tasks_completed']}")
        print(f"Total All-Time: {state['total_all_time']}")
        print(f"Deep Work Time: {state['total_deep_work']} minutes")
        print(f"Achievements Unlocked: {state['achievements']}")
        
        if cognitive_state.achievements:
            print(f"\n🏆 Your Achievements:")
            for achievement in cognitive_state.achievements:
                print(f"   • {achievement}")
        
        print(f"\n📅 Recent Task History:")
        for task in cognitive_state.task_history[-5:]:
            status_emoji = "✅" if task.get('status') == 'completed' else "📋"
            print(f"   {status_emoji} {task['task_name']} - {task.get('status', 'scheduled')}")
    
    elif choice == "4":
        print("\n📋 Fetching your scheduled tasks from Google Calendar...")
        service = get_calendar_service()
        
        import pytz
        local_tz = pytz.timezone('Asia/Kolkata')
        now = datetime.datetime.now(local_tz)
        
        # Fetch events from calendar (past 7 days to future 7 days)
        time_min = (now - datetime.timedelta(days=7)).isoformat()
        time_max = (now + datetime.timedelta(days=7)).isoformat()
        
        events_result = service.events().list(
            calendarId='primary',
            timeMin=time_min,
            timeMax=time_max,
            singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        # Filter events created by this app (have emojis or specific markers)
        app_events = []
        for event in events:
            summary = event.get('summary', '')
            start = event.get('start', {}).get('dateTime')
            if start:
                start_time = datetime.datetime.fromisoformat(start.replace('Z', '+00:00')).astimezone(local_tz)
                # Check if event is in the future or recent past (within 24 hours)
                if start_time > now - datetime.timedelta(hours=24):
                    app_events.append({
                        'id': event['id'],
                        'summary': summary,
                        'start': start_time,
                        'link': event.get('htmlLink', ''),
                        'description': event.get('description', '')
                    })
        
        if not app_events:
            print("No scheduled tasks found in your calendar.")
            print("\n💡 Tip: Schedule a task first using option 1 or 2")
        else:
            print(f"\nFound {len(app_events)} scheduled tasks:\n")
            for i, event in enumerate(app_events, 1):
                time_str = event['start'].strftime('%I:%M %p, %b %d')
                status = "⏰ Upcoming" if event['start'] > now else "✅ Past"
                print(f"{i}. {event['summary']}")
                print(f"   {status} - {time_str}")
                print(f"   🔗 {event['link']}")
                print()
            
            # Ask if they want to mark one as complete
            mark_complete = input("Mark a task as complete? (y/n): ").lower()
            if mark_complete == 'y':
                try:
                    task_num = int(input("Which task number? "))
                    if 1 <= task_num <= len(app_events):
                        event = app_events[task_num - 1]
                        
                        # Validate difficulty rating
                        while True:
                            try:
                                rating = int(input(f"How difficult was it actually? (1-10): "))
                                if 1 <= rating <= 10:
                                    break
                                else:
                                    print("⚠️  Please enter a number between 1 and 10")
                            except ValueError:
                                print("⚠️  Please enter a valid number")
                        
                        # Extract task name (remove emoji)
                        task_name = event['summary']
                        
                        # Mark in cognitive state
                        cognitive_state.complete_task(task_name, rating)
                        
                        print(f"\n✅ Task marked as complete!")
                        print(f"🎉 Great job on completing: {task_name}")
                        
                        # Show notification
                        show_notification(
                            "Task Completed! 🎉",
                            f"{task_name} - Keep up the great work!"
                        )
                        
                        # Optionally delete from calendar
                        delete_cal = input("\nRemove from calendar? (y/n): ").lower()
                        if delete_cal == 'y':
                            service.events().delete(calendarId='primary', eventId=event['id']).execute()
                            print("✅ Removed from calendar")
                    else:
                        print("⚠️  Invalid task number")
                except ValueError:
                    print("⚠️  Please enter a valid number")
    
    else:
        print("Invalid option")


