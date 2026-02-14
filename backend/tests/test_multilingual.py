"""
Test multilingual voice transcription with different languages
"""
import requests
import os
import json
from pathlib import Path

API_URL = "http://127.0.0.1:8000"

def test_multilingual_transcription():
    """
    Test voice transcription with multiple languages
    """
    print("\n" + "="*70)
    print("🌍 MULTILINGUAL VOICE TRANSCRIPTION TEST")
    print("="*70)
    
    # Find all audio files
    audio_dir = Path(__file__).parent / "audio_files"
    if not audio_dir.exists():
        print(f"❌ Audio directory not found: {audio_dir}")
        return
    
    audio_files = list(audio_dir.glob("*.mp3")) + list(audio_dir.glob("*.wav")) + list(audio_dir.glob("*.webm"))
    
    if not audio_files:
        print("❌ No audio files found in audio_files folder")
        print("\n💡 Tip: Generate test audio files:")
        print("   python generate_test_audio.py")
        return
    
    print(f"\n✓ Found {len(audio_files)} audio file(s)")
    
    # Test each file
    results_by_language = {}
    
    for audio_file in audio_files:
        print("\n" + "─"*70)
        print(f"📁 Testing: {audio_file.name}")
        print("─"*70)
        
        try:
            # Send request
            with open(audio_file, 'rb') as f:
                files = {'audio': (audio_file.name, f, 'audio/mpeg')}
                response = requests.post(f"{API_URL}/api/voice-input", files=files)
            
            if response.status_code == 200:
                result = response.json()
                transcription = result.get('transcription', {})
                
                # Handle both formats
                if isinstance(transcription, dict):
                    text = transcription.get('text', '')
                    language = transcription.get('language', 'unknown')
                    language_name = transcription.get('language_name', language)
                    method = transcription.get('method', 'unknown')
                else:
                    text = transcription
                    language = 'unknown'
                    language_name = 'Unknown'
                    method = 'unknown'
                
                # Group by language
                if language not in results_by_language:
                    results_by_language[language] = []
                
                results_by_language[language].append({
                    'file': audio_file.name,
                    'text': text,
                    'language_name': language_name,
                    'method': method,
                    'analysis': result.get('analysis', {})
                })
                
                # Display result
                method_emoji = '🚀' if 'groq' in method else '💻'
                method_label = 'Groq (Fast)' if 'groq' in method else 'Local Whisper'
                
                print(f"✅ Transcribed successfully")
                print(f"   🌍 Language: {language_name} ({language})")
                print(f"   {method_emoji} Method: {method_label}")
                print(f"   📝 Text: \"{text[:80]}{'...' if len(text) > 80 else ''}\"")
                
                # Show analysis
                analysis = result.get('analysis', {})
                print(f"   🧠 Analysis:")
                for metric in ['Depression', 'Anxiety', 'Stress']:
                    if metric in analysis:
                        value = analysis[metric] * 100
                        print(f"      {metric}: {value:.1f}%")
                
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"   {response.json()}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    # Summary by language
    if results_by_language:
        print("\n" + "="*70)
        print("📊 SUMMARY BY LANGUAGE")
        print("="*70)
        
        for lang, results in results_by_language.items():
            lang_name = results[0]['language_name']
            print(f"\n🌍 {lang_name} ({lang}): {len(results)} file(s)")
            for r in results:
                method_emoji = '🚀' if 'groq' in r['method'] else '💻'
                print(f"   {method_emoji} {r['file']}: \"{r['text'][:60]}...\"")
    
    print("\n" + "="*70)
    print("✅ Multilingual testing complete!")
    print("="*70)

def check_groq_status():
    """Check if Groq API is enabled"""
    try:
        response = requests.get(f"{API_URL}/api/model-info")
        if response.status_code == 200:
            info = response.json()
            whisper_info = info.get('whisper_model', {})
            
            print("\n" + "="*70)
            print("🔧 TRANSCRIPTION CONFIGURATION")
            print("="*70)
            
            if whisper_info.get('groq_enabled'):
                print("✅ Groq API: ENABLED (10x faster transcription)")
                print(f"   Model: {whisper_info.get('groq_model', 'whisper-large-v3')}")
                print(f"   Speed: {whisper_info.get('groq_speed', '2-5 seconds/minute')}")
            else:
                print("⚠️  Groq API: DISABLED")
                print(f"   Note: {whisper_info.get('groq_note', 'Set GROQ_API_KEY for faster transcription')}")
                print("   Get free API key: https://console.groq.com")
            
            print(f"\n💻 Local Whisper: {whisper_info.get('local_model', 'whisper-base')}")
            print(f"   Languages: {whisper_info.get('languages_supported', '99+')}")
            print(f"   Speed: {whisper_info.get('speed', '~32 seconds/minute')}")
            print(f"   Auto-detection: {whisper_info.get('auto_language_detection', True)}")
            
    except Exception as e:
        print(f"⚠️  Could not check Groq status: {e}")

if __name__ == "__main__":
    # Check configuration first
    check_groq_status()
    
    # Run multilingual tests
    test_multilingual_transcription()
    
    print("\n💡 Tips:")
    print("   - To enable Groq (10x faster), set GROQ_API_KEY in .env file")
    print("   - Get free API key from: https://console.groq.com")
    print("   - Test with different languages to verify accuracy")
    print("   - See MULTILINGUAL_GUIDE.md for full documentation")
