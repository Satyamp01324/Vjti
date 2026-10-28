import tempfile
import os
import time
from pathlib import Path
from typing import Optional
import json

# Try to import Whisper
try:
    import whisper
    WHISPER_AVAILABLE = True
    print("Loading Whisper model...")
    model = whisper.load_model("base")
    print("✓ Whisper model loaded successfully")
except Exception as e:
    WHISPER_AVAILABLE = False
    model = None
    print(f"ℹ Whisper not available locally: {e}. Falling back to Groq if configured.")

# Try to import Groq for faster transcription fallback
try:
    from groq import Groq
    GROQ_AVAILABLE = True
    # Initialize Groq client if API key is available
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    if GROQ_API_KEY:
        groq_client = Groq(api_key=GROQ_API_KEY)
        print("✓ Groq client initialized (fast transcription enabled)")
    else:
        groq_client = None
        print("⚠ Groq API key not found. Set GROQ_API_KEY for faster transcription.")
except ImportError:
    GROQ_AVAILABLE = False
    groq_client = None
    print("ℹ Groq not installed. Install 'groq' for faster transcription: pip install groq")

# Language code mapping (ISO 639-1 to full names)
LANGUAGE_NAMES = {
    "en": "English", "hi": "Hindi", "es": "Spanish", "fr": "French",
    "de": "German", "zh": "Chinese", "ja": "Japanese", "ko": "Korean",
    "ar": "Arabic", "ru": "Russian", "pt": "Portuguese", "it": "Italian",
    "nl": "Dutch", "pl": "Polish", "tr": "Turkish", "vi": "Vietnamese",
    "th": "Thai", "id": "Indonesian", "ms": "Malay", "tl": "Tagalog"
}

def transcribe_with_groq(audio_file_path: str, language: Optional[str] = None) -> dict:
    """
    Transcribe audio using Groq's Whisper API (faster, cloud-based)
    
    Args:
        audio_file_path: Path to audio file
        language: Optional language code (e.g., 'mr' for Marathi, 'hi' for Hindi)
    
    Returns:
        Dictionary with transcription results
    """
    try:
        if not groq_client:
            return None
        
        print(f"🚀 Using Groq for fast transcription...")
        
        with open(audio_file_path, "rb") as audio_file:
            # Groq Whisper API call with enhanced parameters
            params = {
                "file": (os.path.basename(audio_file_path), audio_file.read()),
                "model": "whisper-large-v3",
                "response_format": "verbose_json",  # Get detailed info
                "temperature": 0.0  # More deterministic output
            }
            
            # Add language hint if provided (helps with accuracy)
            if language:
                params["language"] = language
                print(f"   Language hint: {language}")
            
            transcription = groq_client.audio.transcriptions.create(**params)
        
        detected_lang = getattr(transcription, 'language', 'unknown')
        lang_name = LANGUAGE_NAMES.get(detected_lang, detected_lang.upper())
        
        print(f"✓ Groq transcription complete: {detected_lang} ({lang_name})")
        
        return {
            "text": transcription.text.strip(),
            "language": detected_lang,
            "language_name": lang_name,
            "method": "groq_whisper",
            "status": "success"
        }
    except Exception as e:
        print(f"⚠ Groq transcription failed: {e}")
        import traceback
        traceback.print_exc()
        return None

def transcribe_audio(audio_file_path: str, language: Optional[str] = None, use_groq: bool = True) -> dict:
    """
    Transcribe audio file to text using Whisper (with optional Groq fallback)
    
    Args:
        audio_file_path: Path to audio file (mp3, wav, m4a, webm, etc.)
        language: Optional language code (e.g., 'en', 'hi', 'es', 'mr')
        use_groq: Try Groq first for faster transcription (default: True)
    
    Returns:
        Dictionary with transcription results including detected language
    """
    try:
        # Verify file exists
        if not os.path.exists(audio_file_path):
            return {
                "error": f"Audio file not found: {audio_file_path}",
                "status": "error"
            }
        
        # Get file size
        file_size = os.path.getsize(audio_file_path)
        if file_size == 0:
            return {
                "error": "Audio file is empty",
                "status": "error"
            }
        
        print(f"Transcribing: {audio_file_path} ({file_size} bytes)")
        
        # 1. Validation: Check file size (ignore very small files < 1KB)
        if file_size < 1024:
            print(f"⚠ Audio file too small ({file_size} bytes), skipping transcription.")
            return {"text": "", "language": "unknown", "method": "skipped_too_small", "error": "Audio too short"}

        # 2. Try Groq (Cloud)
        if use_groq and groq_client:
            try:
                groq_result = transcribe_with_groq(audio_file_path, language)
                if groq_result:
                    return groq_result
            except Exception as e:
                 print(f"⚠ Groq failed: {e}, falling back to local Whisper...")
        
        # 3. Fallback: Local Whisper (CPU/GPU)
        print(f"🔄 Using local Whisper model...")
        
        # For better multilingual support, let Whisper auto-detect then transcribe
        if language:
            # If language specified, use it (more accurate)
            result = model.transcribe(
                audio_file_path, 
                language=language, 
                fp16=False,
                task="transcribe",  # Use transcribe, not translate
                temperature=0.0,  # More deterministic
                best_of=5,  # Try multiple decodings for better quality
                beam_size=5  # Use beam search for better accuracy
            )
        else:
            # Auto-detect language - Whisper supports 99+ languages
            result = model.transcribe(
                audio_file_path, 
                fp16=False,
                task="transcribe",
                verbose=False,
                temperature=0.0,
                best_of=5,
                beam_size=5
            )
        
        detected_lang = result.get("language", "unknown")
        lang_name = LANGUAGE_NAMES.get(detected_lang, detected_lang.upper())
        
        print(f"✓ Local Whisper transcription complete: {detected_lang} ({lang_name})")
        
        return {
            "text": result["text"].strip(),
            "language": detected_lang,
            "language_name": lang_name,
            "method": "local_whisper",
            "status": "success"
        }
    except FileNotFoundError as e:
        # Check if it's FFmpeg missing
        error_msg = str(e)
        if "No such file or directory" in error_msg or "[WinError 2]" in error_msg:
             print("❌ CRITICAL: FFmpeg not found. Please install FFmpeg and add it to PATH.")
             return {"text": "", "error": "ffmpeg_missing", "details": "Please install FFmpeg to enable voice features.", "status": "error"}
        raise e
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"❌ Transcription error: {e}")
        # Detect if it's an ffmpeg issue masked as general exception
        if "ffmpeg" in str(e).lower() or "winerror 2" in str(e).lower():
            return {"text": "", "error": "ffmpeg_missing", "details": "Please install FFmpeg to enable voice features.", "status": "error"}
        
        print(error_trace)
        return {
            "error": str(e),
            "traceback": error_trace,
            "status": "error"
        }

def transcribe_audio_bytes(audio_bytes: bytes, filename: str = "audio.wav") -> dict:
    """
    Transcribe audio from bytes
    
    Args:
        audio_bytes: Audio file content as bytes
        filename: Original filename (for format detection)
    
    Returns:
        Dictionary with transcription results
    """
    tmp_path = None
    try:
        if not audio_bytes or len(audio_bytes) == 0:
            return {
                "error": "Audio bytes are empty",
                "status": "error"
            }
        
        # Get file extension
        suffix = Path(filename).suffix
        if not suffix:
            # Default to .webm for browser recordings
            suffix = ".webm"
        
        print(f"Creating temp file with suffix: {suffix}, size: {len(audio_bytes)} bytes")
        
        # Create temporary file with explicit directory
        temp_dir = tempfile.gettempdir()
        fd, tmp_path = tempfile.mkstemp(suffix=suffix, dir=temp_dir)
        
        print(f"Temp file created: {tmp_path}")
        
        # Write audio bytes to file
        try:
            os.write(fd, audio_bytes)
            os.close(fd)
        except Exception as e:
            os.close(fd)
            raise e
        
        # Verify file was written
        if not os.path.exists(tmp_path):
            return {
                "error": f"Failed to create temp file: {tmp_path}",
                "status": "error"
            }
        
        actual_size = os.path.getsize(tmp_path)
        print(f"Temp file size: {actual_size} bytes")
        
        if actual_size == 0:
            return {
                "error": "Temp file is empty after writing",
                "status": "error"
            }
        
        # Small delay to ensure file is fully written (Windows issue)
        time.sleep(0.1)
        
        # Transcribe the temporary file
        result = transcribe_audio(tmp_path)
        return result
        
    except Exception as e:
        import traceback
        error_msg = str(e)
        traceback_str = traceback.format_exc()
        print(f"Error in transcribe_audio_bytes: {error_msg}")
        print(traceback_str)
        return {
            "error": error_msg,
            "traceback": traceback_str,
            "temp_file": tmp_path if tmp_path else "not created",
            "status": "error"
        }
    finally:
        # Clean up temporary file
        if tmp_path and os.path.exists(tmp_path):
            try:
                # Small delay before deletion (Windows issue)
                time.sleep(0.1)
                os.unlink(tmp_path)
                print(f"Cleaned up temp file: {tmp_path}")
            except Exception as e:
                print(f"Warning: Could not delete temp file {tmp_path}: {e}")

def get_model_info():
    """Get information about the loaded Whisper model and available services"""
    info = {
        "local_model": "whisper-base",
        "languages_supported": "99+ languages (auto-detected)",
        "speed": "~32 seconds per 1 minute of audio (local)",
        "accuracy": "High (WER ~5-10%)",
        "status": "loaded",
        "multilingual": True,
        "auto_language_detection": True
    }
    
    # Add Groq info if available
    if groq_client:
        info["groq_enabled"] = True
        info["groq_model"] = "whisper-large-v3"
        info["groq_speed"] = "~2-5 seconds per 1 minute of audio (cloud)"
    else:
        info["groq_enabled"] = False
        info["groq_note"] = "Set GROQ_API_KEY for 10x faster transcription"
    
    return info

def detect_language_from_audio(audio_file_path: str) -> dict:
    """
    Detect language from audio without full transcription
    
    Args:
        audio_file_path: Path to audio file
    
    Returns:
        Dictionary with detected language info
    """
    try:
        # Use Whisper to detect language (quick operation)
        audio = whisper.load_audio(audio_file_path)
        audio = whisper.pad_or_trim(audio)
        mel = whisper.log_mel_spectrogram(audio).to(model.device)
        _, probs = model.detect_language(mel)
        detected_lang = max(probs, key=probs.get)
        confidence = probs[detected_lang]
        
        return {
            "language": detected_lang,
            "language_name": LANGUAGE_NAMES.get(detected_lang, detected_lang),
            "confidence": float(confidence),
            "status": "success"
        }
    except Exception as e:
        return {
            "error": str(e),
            "status": "error"
        }

# Test function
if __name__ == "__main__":
    print("\n" + "="*60)
    print("Testing Whisper Transcription")
    print("="*60)
    print("\nWhisper model loaded and ready!")
    print("\nTo test with an actual audio file:")
    print("  result = transcribe_audio('path/to/audio.wav')")
    print("  print(result)")
