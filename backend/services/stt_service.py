"""
Speech-to-Text Service - OpenAI Whisper Integration
Transcribes audio in multiple Indian languages.
"""

import os
from typing import Optional

# Global Whisper model (loaded lazily)
_whisper_model = None

# Use whisper-small for speed on local machines
WHISPER_MODEL_NAME = "openai/whisper-small"


def load_whisper_model():
    """Load the Whisper model for speech recognition."""
    global _whisper_model
    
    if _whisper_model is not None:
        return
    
    try:
        import whisper
        
        print(f"Loading Whisper model: {WHISPER_MODEL_NAME}")
        _whisper_model = whisper.load_model("small")
        print("✅ Whisper model loaded successfully")
    except Exception as e:
        print(f"⚠️ Error loading Whisper: {e}")
        print("Speech-to-text will be unavailable")


def transcribe_audio(audio_path: str, language: Optional[str] = None) -> str:
    """
    Transcribe audio file to text using Whisper.
    
    Args:
        audio_path: Path to the audio file
        language: Optional language hint (auto-detected if None)
    
    Returns:
        Transcribed text
    """
    if not os.path.exists(audio_path):
        return "[Error: Audio file not found]"
    
    load_whisper_model()
    
    if _whisper_model is None:
        return "[Error: Whisper model not loaded]"
    
    try:
        # Transcribe with auto language detection
        result = _whisper_model.transcribe(
            audio_path,
            language=language,
            task="transcribe",
            fp16=False,  # Use FP32 for CPU
        )
        
        return result["text"].strip()
    except Exception as e:
        print(f"Transcription error: {e}")
        return f"[Transcription error: {str(e)}]"


def detect_language(audio_path: str) -> str:
    """
    Detect the language of an audio file.
    
    Args:
        audio_path: Path to the audio file
    
    Returns:
        Detected language code
    """
    load_whisper_model()
    
    if _whisper_model is None:
        return "unknown"
    
    try:
        # Load audio and detect language
        import whisper
        audio = whisper.load_audio(audio_path)
        audio = whisper.pad_or_trim(audio)
        mel = whisper.log_mel_spectrogram(audio).to(_whisper_model.device)
        
        _, probs = _whisper_model.detect_language(mel)
        detected_lang = max(probs, key=probs.get)
        
        return detected_lang
    except Exception as e:
        print(f"Language detection error: {e}")
        return "unknown"
