"""
Simple script to display FastAPI webhook info
Uses the existing FastAPI backend (main.py) with integrated cognitive scheduler
"""

import subprocess
import time
import requests
import sys

print("\n" + "="*70)
print("🚀 FASTAPI COGNITIVE SCHEDULER + WHATSAPP BOT")
print("="*70)

# Check if backend is running
try:
    response = requests.get("http://localhost:8000/api/health", timeout=2)
    if response.status_code == 200:
        print("\n✅ Backend is already running!")
        health_data = response.json()
        print(f"   Status: {health_data.get('status')} | Version: {health_data.get('version')}")
    backend_running = True
except:
    print("\n⚠️  Backend not running. Starting it now...")
    backend_running = False

# Check for ngrok
try:
    tunnels_response = requests.get("http://localhost:4040/api/tunnels", timeout=2)
    tunnels = tunnels_response.json()
    https_url = None
    for tunnel in tunnels.get('tunnels', []):
        if tunnel.get('proto') == 'https':
            https_url = tunnel.get('public_url')
            break
    
    if https_url:
        print("\n✅ Ngrok tunnel is active!")
        print(f"   Public URL: {https_url}")
        ngrok_running = True
    else:
        ngrok_running = False
except:
    print("\n⚠️  Ngrok not running.")
    ngrok_running = False

print("\n" + "="*70)
print("📋 YOUR WEBHOOK URLs")
print("="*70)

if ngrok_running and https_url:
    print(f"\n🔗 Twilio Webhook URL (COPY THIS):")
    print(f"   {https_url}/api/webhook/twilio")
    print(f"\n🔗 Generic JSON Webhook:")
    print(f"   {https_url}/api/webhook/message")
else:
    print("\n⚠️  Ngrok not active. Run these commands:")
    print("   1. cd D:\\hackathons\\Vjti\\Vjti")
    print("   2. .\\ngrok\\ngrok.exe http 8000")

print("\n" + "="*70)
print("⚙️  TWILIO CONFIGURATION STEPS")
print("="*70)
print("\n1. Go to: https://console.twilio.com/")
print("2. Messaging → Try it Out → Try WhatsApp")
print("3. Click 'Sandbox Settings'")
print("4. In 'WHEN A MESSAGE COMES IN' field, paste:")
if ngrok_running and https_url:
    print(f"\n   {https_url}/api/webhook/twilio")
else:
    print("\n   <YOUR_NGROK_URL>/api/webhook/twilio")
print("\n5. Method: POST")
print("6. Click Save")

print("\n" + "="*70)
print("📱 TEST YOUR BOT")
print("="*70)
print("\nSend a WhatsApp message to your Twilio sandbox number")
print("\nTry these commands:")
print("  • 'Schedule study algorithms tomorrow'")
print("  • 'Add gym workout friday morning'")
print("  • 'show my stats'")
print("  • 'what's my energy level'")

print("\n" + "="*70)
print("🔍 USEFUL LINKS")
print("="*70)
print(f"\n📊 Ngrok Dashboard:  http://localhost:4040")
print(f"📚 API Docs:         http://localhost:8000/docs")
print(f"❤️  Backend Health:   http://localhost:8000/api/health")

print("\n" + "="*70)

# If backend not running, offer to start it
if not backend_running:
    print("\n⚠️  Would you like to start the backend now? (Ctrl+C to cancel)")
    time.sleep(2)
    print("\n🚀 Starting FastAPI backend...")
    print("="*70 + "\n")
    subprocess.run([
        sys.executable, "-m", "uvicorn", 
        "main:app", 
        "--reload", 
        "--host", "0.0.0.0", 
        "--port", "8000"
    ], cwd="../")
else:
    print("\n✅ Everything is ready! Configure Twilio and start testing!")
    print("="*70 + "\n")