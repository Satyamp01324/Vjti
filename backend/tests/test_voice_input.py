"""
Test script for voice input API endpoint
"""
import requests
import os

API_BASE = "http://127.0.0.1:8000"

def test_voice_input_with_file(audio_file_path):
    """Test voice input with an audio file"""
    print("\n" + "="*60)
    print("🎤 Testing Voice Input API")
    print("="*60)
    
    if not os.path.exists(audio_file_path):
        print(f"\n❌ Audio file not found: {audio_file_path}")
        print("\nTo test:")
        print("1. Record a short audio clip (5-10 seconds)")
        print("2. Save it as 'test_audio.wav' or 'test_audio.mp3'")
        print("3. Place it in the backend folder")
        print("4. Run: python test_voice_input.py")
        return
    
    print(f"\n📁 Audio file: {audio_file_path}")
    print(f"📊 File size: {os.path.getsize(audio_file_path)} bytes")
    
    print("\n🔄 Sending audio to API...")
    
    try:
        with open(audio_file_path, 'rb') as f:
            files = {'audio': (os.path.basename(audio_file_path), f, 'audio/wav')}
            response = requests.post(f"{API_BASE}/api/voice-input", files=files)
        
        print(f"✅ Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            
            print("\n" + "="*60)
            print("📝 TRANSCRIPTION")
            print("="*60)
            print(f'Text: "{data["transcription"]["text"]}"')
            print(f'Language: {data["transcription"]["language"]}')
            
            print("\n" + "="*60)
            print("🧠 MENTAL HEALTH ANALYSIS")
            print("="*60)
            
            analysis = data["analysis"]
            for metric in ["Depression", "Anxiety", "Stress"]:
                if metric in analysis:
                    value = analysis[metric]
                    percentage = value * 100
                    level = "🔴 HIGH" if value > 0.5 else "🟡 MEDIUM" if value > 0.2 else "🟢 LOW"
                    print(f"{metric:12} {percentage:6.1f}%  {level}")
            
            print(f'\nSource: {analysis.get("source", "unknown")}')
            
        else:
            print(f"\n❌ Error: {response.status_code}")
            print(response.json())
    
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")

def test_with_sample_files():
    """Try to test with any audio files in the backend folder"""
    print("\n🔍 Searching for audio files...")
    
    audio_extensions = ['.wav', '.mp3', '.m4a', '.webm', '.ogg', '.flac']
    
    # Check multiple directories
    search_dirs = [
        os.path.dirname(os.path.abspath(__file__)),  # backend folder
        os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio_files'),  # audio_files subfolder
    ]
    
    audio_files = []
    for search_dir in search_dirs:
        if os.path.exists(search_dir):
            print(f"Checking: {search_dir}")
            for file in os.listdir(search_dir):
                if any(file.lower().endswith(ext) for ext in audio_extensions):
                    audio_files.append(os.path.join(search_dir, file))
    
    if audio_files:
        print(f"✓ Found {len(audio_files)} audio file(s)")
        for audio_file in audio_files:
            test_voice_input_with_file(audio_file)
    else:
        print("❌ No audio files found")
        print("\n📝 Instructions to test:")
        print("="*60)
        print("Option 1: Use the Web Interface (Recommended)")
        print("  1. Open the test page: backend/test_page.html")
        print("  2. Click 'Start Recording' button")
        print("  3. Speak for 5-10 seconds")
        print("     Example: 'I feel anxious and worried about everything'")
        print("  4. Click 'Stop' button")
        print("  5. Click 'Analyze Voice' button")
        print("\nOption 2: Add Test Audio Files")
        print("  1. Place audio files (.wav, .mp3, .webm) in:")
        print(f"     {os.path.join(os.path.dirname(os.path.abspath(__file__)), 'audio_files')}")
        print("  2. Run this script again: python backend/test_voice_input.py")
        print("="*60)

if __name__ == "__main__":
    # Try common test file names
    test_files = ["test_audio.wav", "test_audio.mp3", "audio.wav", "recording.wav"]
    
    found = False
    for test_file in test_files:
        if os.path.exists(test_file):
            test_voice_input_with_file(test_file)
            found = True
            break
    
    if not found:
        test_with_sample_files()
