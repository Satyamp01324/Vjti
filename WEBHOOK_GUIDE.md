# Webhook Integration Guide

## Quick Setup

### 1. Start Your Backend
```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Test Locally
```bash
python test_webhook.py
```

## Webhook Endpoints

### `/api/webhook/message` (JSON)
General webhook for any bot platform (JSON format)

**Request:**
```json
{
  "message": "Schedule study algorithms tomorrow",
  "user_id": "optional_user_id",
  "phone_number": "+1234567890"
}
```

**Response:**
```json
{
  "status": "success",
  "response": "✅ Task Scheduled!\n📝 Study algorithms tomorrow\n⏰ Time: 09:00...",
  "data": { ... }
}
```

### `/api/webhook/twilio` (Form Data)
Twilio-specific webhook (accepts WhatsApp messages)

**Twilio sends:**
- `Body`: Message text
- `From`: User's phone (e.g., `whatsapp:+1234567890`)

**Returns:** TwiML response that Twilio sends back to user

## Connect to Twilio (3 Steps)

### Step 1: Expose Your Backend
Use ngrok to expose localhost:
```bash
ngrok http 8000
```
Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### Step 2: Configure Twilio
1. Go to Twilio Console → Messaging → Senders → WhatsApp Sandbox
2. Set webhook URL: `https://abc123.ngrok.io/api/webhook/twilio`
3. Method: `POST`
4. Save

### Step 3: Test
1. Send WhatsApp message to your Twilio sandbox number
2. Try: "Schedule study session tomorrow"
3. Bot responds with calendar link and schedule details

## Supported Commands

**Schedule Tasks:**
- "Schedule study algorithms tomorrow"
- "Add gym workout friday morning"
- "Plan meeting next week"

**Check Stats:**
- "show my stats"
- "what's my energy level"
- "how am i doing"

## Features

✅ **Auto-scheduling** - Finds optimal time based on cognitive energy
✅ **Natural language** - Understands "tomorrow", "friday", "next week"
✅ **Google Calendar** - Creates events automatically
✅ **Energy tracking** - Monitors fatigue and focus streaks
✅ **Stats queries** - Check progress via chat

## Data Flow

```
WhatsApp User → Twilio → /api/webhook/twilio → schedule_task()
                                              ↓
                         Cognitive Scheduler (feature_2)
                                              ↓
                         Google Calendar Event Created
                                              ↓
                         Response → Twilio → WhatsApp User
```

## Production Deployment

For permanent deployment:
1. Deploy backend to Railway/Render/Vercel
2. Get public URL (e.g., `https://yourapp.railway.app`)
3. Update Twilio webhook to: `https://yourapp.railway.app/api/webhook/twilio`
4. Done! No ngrok needed.

## Multi-User Support

Currently uses single Google Calendar token. For multi-user:
1. Store OAuth tokens in Supabase keyed by `user_id` or `phone_number`
2. Modify `cognitive_scheduler.py` to load token per user
3. Add user authentication flow

## Testing Without Twilio

Use curl or Postman:
```bash
curl -X POST http://localhost:8000/api/webhook/message \
  -H "Content-Type: application/json" \
  -d '{"message": "Schedule study tomorrow", "user_id": "test123"}'
```
