def parse_natural_language_task(user_input: str) -> Dict:
    """Extract task details with smart day/date detection"""
    import pytz
    import datetime
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
    social_keywords = ['wedding', 'party', 'meeting', 'event', 'attend', 'ceremony']
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
        "target_date": target_date,  # NEW: Store the target date
        "is_social_event": is_social
    }
