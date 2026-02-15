"""
Quick test script for webhook endpoints
Run this after starting the backend server
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_webhook():
    print("🧪 Testing Webhook Endpoints\n")
    
    # Test 1: Schedule a task
    print("1️⃣ Testing task scheduling...")
    payload = {
        "message": "Study algorithms tomorrow morning",
        "user_id": "test_user_123",
        "phone_number": "+1234567890"
    }
    
    response = requests.post(f"{BASE_URL}/api/webhook/message", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}\n")
    
    # Test 2: Check stats
    print("2️⃣ Testing stats query...")
    payload = {
        "message": "show me my stats",
        "user_id": "test_user_123"
    }
    
    response = requests.post(f"{BASE_URL}/api/webhook/message", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}\n")
    
    # Test 3: Twilio format
    print("3️⃣ Testing Twilio webhook format...")
    data = {
        "Body": "Schedule gym workout tomorrow evening",
        "From": "whatsapp:+1234567890"
    }
    
    response = requests.post(f"{BASE_URL}/api/webhook/twilio", data=data)
    print(f"Status: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}\n")

if __name__ == "__main__":
    try:
        test_webhook()
        print("✅ All tests completed!")
    except requests.exceptions.ConnectionError:
        print("❌ Error: Backend server not running!")
        print("Start it with: python -m uvicorn main:app --reload")
    except Exception as e:
        print(f"❌ Error: {e}")
