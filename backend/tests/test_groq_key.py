"""
Test Groq API key validity
"""
import os
from dotenv import load_dotenv

load_dotenv()

def test_groq_key():
    """Test if Groq API key is valid"""
    try:
        from groq import Groq
        
        api_key = os.getenv("GROQ_API_KEY")
        
        if not api_key:
            print("❌ GROQ_API_KEY not found in .env file")
            return False
        
        print(f"✓ Found API key: {api_key[:10]}...{api_key[-4:]}")
        print(f"  Length: {len(api_key)} characters")
        
        # Try to initialize client
        client = Groq(api_key=api_key)
        
        # Test with a simple API call (list models)
        print("\n🔍 Testing API key...")
        models = client.models.list()
        
        print("✅ Groq API key is VALID!")
        print(f"\n📋 Available models: {len(models.data)}")
        for model in models.data[:5]:  # Show first 5
            print(f"   - {model.id}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Groq API key test FAILED:")
        print(f"   Error: {e}")
        print("\n💡 Solutions:")
        print("   1. Check if the API key is correct")
        print("   2. Generate a new key at https://console.groq.com")
        print("   3. Make sure there are no extra spaces in .env file")
        print("   4. Ensure the key hasn't expired")
        return False

if __name__ == "__main__":
    print("="*70)
    print("🔑 GROQ API KEY VALIDATION")
    print("="*70)
    
    test_groq_key()
    
    print("\n" + "="*70)
    print("\n💡 If the key is invalid:")
    print("   1. Go to https://console.groq.com")
    print("   2. Sign in / Create account (free)")
    print("   3. Go to API Keys section")
    print("   4. Create new API key")
    print("   5. Copy and update GROQ_API_KEY in backend/.env")
    print("   6. Restart the server")
