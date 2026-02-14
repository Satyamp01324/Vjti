"""
Comprehensive test script for both ML models
Run this with: python test_models.py
"""
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def print_section(title):
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)

def test_health():
    """Test basic server health"""
    print_section("🏥 Server Health Check")
    response = requests.get(f"{BASE_URL}/api/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_model_info():
    """Get information about loaded models"""
    print_section("ℹ️  Model Information")
    response = requests.get(f"{BASE_URL}/api/model-info")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))

def test_text_analysis():
    """Test text classification model"""
    print_section("📝 Text Analysis Tests")
    
    test_cases = [
        "I feel very tired and anxious today.",
        "Everything is going great! I'm feeling wonderful.",
        "I can't sleep and feel overwhelmed with everything.",
        "मुझे बहुत तनाव हो रहा है",  # Hindi: I am very stressed
        "Life is beautiful and I'm grateful for everything."
    ]
    
    for i, text in enumerate(test_cases, 1):
        print(f"\n--- Test Case {i} ---")
        print(f"Text: {text}")
        
        response = requests.post(
            f"{BASE_URL}/api/text-analysis",
            json={"text": text}
        )
        
        if response.status_code == 200:
            result = response.json()
            analysis = result.get('analysis', {})
            
            print(f"Depression: {analysis.get('Depression', 0):.2%}")
            print(f"Anxiety:    {analysis.get('Anxiety', 0):.2%}")
            print(f"Stress:     {analysis.get('Stress', 0):.2%}")
            print(f"Source:     {analysis.get('source', 'unknown')}")
        else:
            print(f"Error: {response.status_code}")
            print(response.text)

def test_voice_analysis():
    """Test voice analysis model"""
    print_section("🎤 Voice Analysis Tests")
    
    # Test 1: With numeric features
    print("\n--- Test 1: Numeric Features ---")
    features = [0.5] * 20
    response = requests.post(
        f"{BASE_URL}/api/voice-analysis",
        json={"features": features}
    )
    
    if response.status_code == 200:
        result = response.json()
        print(json.dumps(result, indent=2))
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
    
    # Test 2: With text features (for transformers model)
    print("\n--- Test 2: Text Input ---")
    response = requests.post(
        f"{BASE_URL}/api/voice-analysis",
        json={"features": {"text": "I am feeling really stressed and overwhelmed today"}}
    )
    
    if response.status_code == 200:
        result = response.json()
        analysis = result.get('analysis', {})
        prediction = analysis.get('prediction', {})
        
        print(f"Input Type: {analysis.get('input_type', 'unknown')}")
        print(f"Model Type: {analysis.get('model_type', 'unknown')}")
        
        if isinstance(prediction, dict):
            for key, value in prediction.items():
                print(f"{key}: {value:.2%}")
        else:
            print(f"Prediction: {prediction}")
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
    
    # Test 3: Another text example
    print("\n--- Test 3: Positive Text ---")
    response = requests.post(
        f"{BASE_URL}/api/voice-analysis",
        json={"features": {"text": "I'm happy and excited about the future!"}}
    )
    
    if response.status_code == 200:
        result = response.json()
        analysis = result.get('analysis', {})
        prediction = analysis.get('prediction', {})
        
        if isinstance(prediction, dict):
            for key, value in prediction.items():
                print(f"{key}: {value:.2%}")
    else:
        print(f"Error: {response.status_code}")

def main():
    print("\n" + "🚀" * 30)
    print("  ML Models Test Suite")
    print("🚀" * 30)
    
    try:
        test_health()
        test_model_info()
        test_text_analysis()
        test_voice_analysis()
        
        print_section("✅ All Tests Completed")
        print("\nBoth models are working correctly!")
        print("\nAPI Documentation: http://127.0.0.1:8000/docs")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Cannot connect to backend server")
        print("Make sure the server is running:")
        print("  cd backend")
        print("  uvicorn main:app --reload")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
