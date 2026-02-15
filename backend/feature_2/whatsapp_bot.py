"""
WhatsApp Bot for Cognitive-Aware Task Scheduler
Complete workflow: WhatsApp → Twilio → Backend → Gemini LLM → Google Calendar → WhatsApp Reply
"""

from flask import Flask, request
from twilio.rest import Client
from twilio.twiml.messaging_response import MessagingResponse
import os
import sys

# Import your existing scheduler functions
from main import (
    parse_natural_language_task,
    get_calendar_service,
    find_optimal_slot,
    create_deep_work_block,
    create_calendar_event,
    get_mental_energy,
    calculate_recovery_need,
    schedule_recovery_break,
    cognitive_state
)

app = Flask(__name__)

# ========================================
# TWILIO CONFIGURATION
# ========================================
TWILIO_ACCOUNT_SID = 'AC38bbfbc29ba15349202ef2d031e5669f'
TWILIO_AUTH_TOKEN = 'fcea51d66f7c1f1c547ed491b8bf3321'
TWILIO_WHATSAPP_NUMBER = 'whatsapp:+14155238886'  # Twilio sandbox number
YOUR_WHATSAPP_NUMBER = 'whatsapp:+919021935820'  # Your personal number

twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)


# ========================================
# MAIN WEBHOOK - RECEIVES WHATSAPP MESSAGES
# ========================================
@app.route('/whatsapp', methods=['POST'])
def whatsapp_webhook():
    """
    🧠 Complete Architecture Flow:
    1️⃣ User sends message on WhatsApp → "Finish Graph Theory today"
    2️⃣ Twilio receives message → Sends it to this endpoint
    3️⃣ Backend processes:
       - Sends text to Gemini (LLM)
       - Calculates cognitive load
       - Decides optimal time
       - Schedules event in Google Calendar
    4️⃣ Backend sends WhatsApp reply → "🔥 Deep Work scheduled tomorrow 9:00 AM"
    """
    
    # Get incoming message details
    incoming_msg = request.values.get('Body', '').strip()
    from_number = request.values.get('From', '')
    
    print(f"📱 Received WhatsApp message from {from_number}: {incoming_msg}")
    
    # Handle special commands
    if incoming_msg.lower() in ['help', 'commands']:
        send_help_message(from_number)
        return str(MessagingResponse())
    
    if incoming_msg.lower() == 'my tasks':
        send_task_list(from_number)
        return str(MessagingResponse())
    
    # Process the task scheduling request
    try:
        # STEP 1: Send to Gemini LLM for parsing
        print("🤖 Step 1: Sending to Gemini LLM...")
        task_data = parse_natural_language_task(incoming_msg)
        
        print(f"✅ Parsed: {task_data['task_name']}")
        print(f"   Category: {task_data['category']}")
        print(f"   Difficulty: {task_data['difficulty']}/10")
        print(f"   Cognitive Type: {task_data['cognitive_type']}")
        
        # STEP 2: Calculate cognitive load and energy
        print("⚡ Step 2: Calculating cognitive load and energy...")
        energy_state = get_mental_energy()
        
        # STEP 3: Check if recovery needed
        print("🔄 Step 3: Checking recovery needs...")
        needs_recovery, recovery_duration, recovery_type = calculate_recovery_need(
            task_data, energy_state
        )
        
        recovery_msg = ""
        if needs_recovery:
            print(f"⚠️  Recovery needed: {recovery_type} ({recovery_duration} min)")
            recovery_msg = f"\n⚠️ Recovery break added: {recovery_type} ({recovery_duration} min)"
        
        # STEP 4: Find optimal time slot
        print("🎯 Step 4: Finding optimal time slot...")
        service = get_calendar_service()
        start_time = find_optimal_slot(service, task_data, energy_state)
        
        # STEP 5: Create deep work structure
        print("🧠 Step 5: Creating deep work structure...")
        work_structure = create_deep_work_block(task_data, start_time)
        
        # STEP 6: Schedule on Google Calendar
        print("📅 Step 6: Scheduling on Google Calendar...")
        event_id, event_link = create_calendar_event(
            service, task_data, work_structure, start_time
        )
        
        # STEP 7: Update cognitive state
        cognitive_state.add_task(task_data)
        cognitive_state.update_fatigue(task_data['difficulty'])
        cognitive_state.add_deep_work_time(task_data['duration_minutes'])
        
        # STEP 8: Send WhatsApp confirmation
        print("📲 Step 7: Sending WhatsApp confirmation...")
        
        # Build response message
        emoji = get_task_emoji(task_data['difficulty'], task_data['category'])
        
        response_msg = f"{emoji} *Task Scheduled!*\n\n"
        response_msg += f"📋 *{task_data['task_name']}*\n"
        response_msg += f"📅 {start_time.strftime('%A, %B %d, %Y')}\n"
        response_msg += f"⏰ {start_time.strftime('%I:%M %p')}\n"
        response_msg += f"🎯 {task_data['category']}\n"
        response_msg += f"⚡ Difficulty: {task_data['difficulty']}/10\n"
        response_msg += f"⏱️ Duration: {task_data['duration_minutes']} min\n"
        
        # Add work structure info
        if len(work_structure['blocks']) > 1:
            response_msg += f"\n🧠 *Deep Work Structure:*\n"
            for i, block in enumerate(work_structure['blocks'], 1):
                if block['type'] == 'deep_work':
                    response_msg += f"  {i}. Focus: {block['duration']} min\n"
                else:
                    response_msg += f"  {i}. Break: {block['duration']} min\n"
        
        response_msg += recovery_msg
        response_msg += f"\n🔗 Calendar: {event_link}"
        response_msg += f"\n\n💪 Energy: {energy_state['energy_level']}/10"
        response_msg += f"\n🔥 Streak: {cognitive_state.current_focus_streak} tasks"
        
        # Send the message
        send_whatsapp_message(from_number, response_msg)
        
        print("✅ Task scheduled and notification sent!")
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        error_msg = f"❌ *Error scheduling task*\n\n"
        error_msg += f"Details: {str(e)}\n\n"
        error_msg += f"Please try again or type 'help' for commands."
        send_whatsapp_message(from_number, error_msg)
    
    return str(MessagingResponse())


# ========================================
# HELPER FUNCTIONS
# ========================================

def send_whatsapp_message(to_number: str, message: str):
    """Send WhatsApp message via Twilio"""
    try:
        twilio_client.messages.create(
            from_=TWILIO_WHATSAPP_NUMBER,
            body=message,
            to=to_number
        )
        print(f"✅ WhatsApp message sent to {to_number}")
    except Exception as e:
        print(f"❌ Failed to send WhatsApp message: {e}")


def get_task_emoji(difficulty: int, category: str) -> str:
    """Get emoji based on task type"""
    if difficulty >= 8:
        return "🔥💎"  # Boss level
    elif difficulty >= 6:
        return "⚔️"  # Challenge
    elif category == "Deep Work":
        return "🧠"
    elif category == "Physical Activity":
        return "🏃"
    elif category == "Social Event":
        return "🎉"
    else:
        return "📚"


def send_help_message(to_number: str):
    """Send help/commands message"""
    help_msg = """🧠 *Cognitive Scheduler Bot*

*How to use:*
Just send your task in natural language!

*Examples:*
• "Study algorithms tomorrow"
• "Play cricket on Thursday"
• "Attend wedding on Saturday"
• "Finish assignment by Friday"

*Commands:*
• `my tasks` - View scheduled tasks
• `help` - Show this message

*Features:*
✅ AI-powered scheduling
✅ Cognitive load analysis
✅ Optimal time selection
✅ Auto recovery breaks
✅ Google Calendar sync

Just tell me what you need to do! 🚀"""
    
    send_whatsapp_message(to_number, help_msg)


def send_task_list(to_number: str):
    """Send list of upcoming tasks"""
    import datetime
    import pytz
    
    service = get_calendar_service()
    local_tz = pytz.timezone('Asia/Kolkata')
    now = datetime.datetime.now(local_tz)
    
    # Fetch upcoming events
    time_min = now.isoformat()
    time_max = (now + datetime.timedelta(days=7)).isoformat()
    
    events_result = service.events().list(
        calendarId='primary',
        timeMin=time_min,
        timeMax=time_max,
        maxResults=10,
        singleEvents=True,
        orderBy='startTime'
    ).execute()
    
    events = events_result.get('items', [])
    
    if not events:
        msg = "📅 *Your Schedule*\n\nNo upcoming tasks found.\n\nSend me a task to schedule!"
    else:
        msg = f"📅 *Your Upcoming Tasks*\n\n"
        for i, event in enumerate(events, 1):
            summary = event.get('summary', 'Untitled')
            start = event['start'].get('dateTime', event['start'].get('date'))
            start_time = datetime.datetime.fromisoformat(start.replace('Z', '+00:00')).astimezone(local_tz)
            
            msg += f"{i}. *{summary}*\n"
            msg += f"   📅 {start_time.strftime('%a, %b %d')}\n"
            msg += f"   ⏰ {start_time.strftime('%I:%M %p')}\n\n"
    
    send_whatsapp_message(to_number, msg)


# ========================================
# SCHEDULED REMINDERS (Optional)
# ========================================

def send_task_reminder(phone_number: str, task_name: str, start_time):
    """Send reminder before task starts"""
    msg = f"⏰ *Reminder*\n\n"
    msg += f"Your task starts in 15 minutes!\n\n"
    msg += f"📋 {task_name}\n"
    msg += f"⏰ {start_time.strftime('%I:%M %p')}\n\n"
    msg += f"Get ready! 🚀"
    
    send_whatsapp_message(f"whatsapp:{phone_number}", msg)


# ========================================
# RUN SERVER WITH TUNNEL
# ========================================

if __name__ == '__main__':
    print("="*60)
    print("🤖 WhatsApp Cognitive Scheduler Bot")
    print("="*60)
    
    # Try localtunnel (no auth needed) or ngrok
    tunnel_url = None
    
    # Option 1: Try localtunnel (no signup needed)
    try:
        import subprocess
        import time
        import requests
        
        print("\n� Starting localtunnel (no signup needed)...")
        
        # Start localtunnel in background
        process = subprocess.Popen(
            ['npx', 'localtunnel', '--port', '5000'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        # Wait for URL
        time.sleep(3)
        
        # Try to get the URL from output
        for line in process.stdout:
            if 'your url is:' in line.lower():
                tunnel_url = line.split('is:')[-1].strip()
                break
        
        if not tunnel_url:
            # Fallback: try to read from localtunnel API
            tunnel_url = "https://your-subdomain.loca.lt"
            print("⚠️  Localtunnel started but couldn't get URL automatically")
            print("   Check the terminal output above for the URL")
        
    except Exception as e:
        print(f"⚠️  Localtunnel not available: {e}")
    
    # Option 2: Manual instructions
    if not tunnel_url:
        print("\n" + "="*60)
        print("📱 MANUAL SETUP (Choose one):")
        print("="*60)
        print("\n🔹 Option A: Use ngrok (requires signup)")
        print("   1. Sign up: https://dashboard.ngrok.com/signup")
        print("   2. Get authtoken: https://dashboard.ngrok.com/get-started/your-authtoken")
        print("   3. Run: ngrok config add-authtoken YOUR_TOKEN")
        print("   4. Run: ngrok http 5000")
        print("   5. Copy the https URL")
        
        print("\n🔹 Option B: Use localtunnel (no signup)")
        print("   1. Install: npm install -g localtunnel")
        print("   2. Run: lt --port 5000")
        print("   3. Copy the URL it gives you")
        
        print("\n🔹 Option C: Use serveo (easiest)")
        print("   1. Run: ssh -R 80:localhost:5000 serveo.net")
        print("   2. Copy the URL it gives you")
        
        print("\n" + "="*60)
        print("✅ Server starting on http://localhost:5000")
        print("📱 Webhook endpoint: /whatsapp")
        print("\nAfter getting your tunnel URL, set it in Twilio:")
        print("https://console.twilio.com/ → WhatsApp Sandbox → Webhook")
        print("="*60 + "\n")
    else:
        print(f"\n✅ Server starting on http://localhost:5000")
        print(f"🌐 Public URL: {tunnel_url}")
        print(f"\n📱 Webhook endpoint: {tunnel_url}/whatsapp")
        print("\n" + "="*60)
        print("⚠️  IMPORTANT: Copy the webhook URL above!")
        print("="*60)
        print("\n🔧 Next Steps:")
        print("1. Go to: https://console.twilio.com/")
        print("2. Navigate to: Messaging → Settings → WhatsApp Sandbox")
        print("3. Paste this URL in 'WHEN A MESSAGE COMES IN':")
        print(f"   {tunnel_url}/whatsapp")
        print("4. Click Save")
        print("\n📱 Then send WhatsApp to: +1 415 523 8886")
        print("   Message: 'Study algorithms tomorrow'")
        print("\n" + "="*60 + "\n")
    
    # Run Flask app
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)