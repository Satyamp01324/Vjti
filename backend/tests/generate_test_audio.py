"""
Generate test audio files for voice input testing
This script creates simple audio files with text-to-speech
"""
import os

def create_test_audio_with_gtts():
    """Create test audio files using Google Text-to-Speech"""
    try:
        from gtts import gTTS
        
        test_cases = [
            ("I feel very anxious and worried about everything", "anxious_voice.mp3"),
            ("I'm so happy and excited about life", "happy_voice.mp3"),
            ("I feel stressed and overwhelmed with work", "stressed_voice.mp3"),
            ("मुझे बहुत चिंता हो रही है", "hindi_voice.mp3"),
        ]
        
        audio_dir = os.path.join(os.path.dirname(__file__), 'audio_files')
        os.makedirs(audio_dir, exist_ok=True)
        
        print("Creating test audio files...")
        for text, filename in test_cases:
            filepath = os.path.join(audio_dir, filename)
            
            # Detect language
            lang = 'hi' if any('\u0900' <= char <= '\u097F' for char in text) else 'en'
            
            tts = gTTS(text=text, lang=lang, slow=False)
            tts.save(filepath)
            print(f"✓ Created: {filename} - '{text}'")
        
        print(f"\n✅ Test audio files created in: {audio_dir}")
        print("\nTo test:")
        print("1. Run: python backend/test_voice_input.py")
        print("2. Or upload files in the web interface (backend/test_page.html)")
        
        return True
    except ImportError:
        print("❌ gTTS not installed. Install with: pip install gtts")
        return False

def create_test_audio_with_pyttsx3():
    """Create test audio files using pyttsx3 (offline TTS)"""
    try:
        import pyttsx3
        
        test_cases = [
            ("I feel very anxious and worried about everything", "anxious_voice.wav"),
            ("I'm so happy and excited about life", "happy_voice.wav"),
            ("I feel stressed and overwhelmed with work", "stressed_voice.wav"),
        ]
        
        audio_dir = os.path.join(os.path.dirname(__file__), 'audio_files')
        os.makedirs(audio_dir, exist_ok=True)
        
        engine = pyttsx3.init()
        
        print("Creating test audio files...")
        for text, filename in test_cases:
            filepath = os.path.join(audio_dir, filename)
            engine.save_to_file(text, filepath)
            print(f"✓ Queued: {filename} - '{text}'")
        
        engine.runAndWait()
        
        print(f"\n✅ Test audio files created in: {audio_dir}")
        print("\nTo test:")
        print("1. Run: python backend/test_voice_input.py")
        print("2. Or upload files in the web interface (backend/test_page.html)")
        
        return True
    except ImportError:
        print("❌ pyttsx3 not installed. Install with: pip install pyttsx3")
        return False
    except Exception as e:
        print(f"❌ Error with pyttsx3: {e}")
        return False

def main():
    print("="*70)
    print("Test Audio Generator")
    print("="*70)
    
    print("\nThis script creates sample audio files for testing voice input.\n")
    print("Choose a method:")
    print("1. gTTS (Google TTS - needs internet, better quality)")
    print("2. pyttsx3 (Offline TTS - no internet needed)")
    print("3. Skip - I'll record my own audio\n")
    
    choice = input("Enter choice (1/2/3): ").strip()
    
    if choice == '1':
        print("\nUsing Google TTS...")
        if not create_test_audio_with_gtts():
            print("\nFalling back to pyttsx3...")
            create_test_audio_with_pyttsx3()
    elif choice == '2':
        print("\nUsing pyttsx3...")
        if not create_test_audio_with_pyttsx3():
            print("\nPlease install: pip install pyttsx3")
    else:
        print("\n📝 Instructions for recording your own audio:")
        print("="*70)
        print("Option 1: Use Web Interface (Easiest)")
        print("  1. Open backend/test_page.html in your browser")
        print("  2. Click 'Start Recording' and speak")
        print("  3. Click 'Stop' then 'Analyze Voice'")
        print("\nOption 2: Add Audio Files Manually")
        audio_dir = os.path.join(os.path.dirname(__file__), 'audio_files')
        print(f"  Place .wav, .mp3, or .webm files in:")
        print(f"  {audio_dir}")
        print("="*70)

if __name__ == "__main__":
    main()
