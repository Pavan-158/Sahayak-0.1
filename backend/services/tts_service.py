"""
Text-to-Speech Service - AI4Bharat Indic Parler-TTS Integration
Generates audio in Indian languages.
"""

import os
from typing import Optional

# Global TTS pipeline (loaded lazily)
_tts_pipeline = None

# Supported voices for different languages
LANGUAGE_VOICES = {
    "hi": "hindi_female",
    "bn": "bengali_female",
    "te": "telugu_female",
    "mr": "marathi_female",
    "ta": "tamil_female",
    "gu": "gujarati_female",
    "kn": "kannada_female",
    "ml": "malayalam_female",
    "pa": "punjabi_female",
    "or": "odia_female",
    "en": "english_female",
}


def load_tts_model():
    """Load the Indic Parler-TTS model."""
    global _tts_pipeline
    
    if _tts_pipeline is not None:
        return
    
    try:
        from transformers import pipeline as hf_pipeline
        
        print("Loading Indic Parler-TTS model...")
        # Note: Adjust model name based on actual available model
        _tts_pipeline = hf_pipeline(
            "text-to-speech",
            model="ai4bharat/indic-parler-tts",
            device=-1,  # CPU
        )
        print("✅ Indic Parler-TTS loaded successfully")
    except Exception as e:
        print(f"⚠️ Error loading TTS model: {e}")
        print("Using fallback TTS (gTTS)")


def generate_audio(text: str, output_path: str, language: str = "hi") -> str:
    """
    Generate audio from text using Indic Parler-TTS.
    
    Args:
        text: Text to convert to speech
        output_path: Path to save the audio file
        language: Target language code
    
    Returns:
        Path to the generated audio file
    """
    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    
    # Truncate text if too long (TTS models have limits)
    max_chars = 500
    if len(text) > max_chars:
        text = text[:max_chars] + "..."
    
    load_tts_model()
    
    if _tts_pipeline is not None:
        try:
            # Generate speech (Parler-TTS outputs wav)
            result = _tts_pipeline(text)

            # Ensure the file we write matches the requested .wav output path
            wav_path = output_path if output_path.endswith(".wav") else output_path + ".wav"
            import soundfile as sf
            sf.write(wav_path, result["audio"], samplerate=result["sampling_rate"])
            return wav_path
        except Exception as e:
            print(f"TTS generation error: {e}")
    
    # Fallback: Use gTTS (Google Text-to-Speech) for basic TTS
    try:
        from gtts import gTTS
        
        lang_map = {
            "hi": "hi", "bn": "bn", "te": "te", "mr": "mr",
            "ta": "ta", "gu": "gu", "kn": "kn", "ml": "ml",
            "pa": "pa", "or": "or", "en": "en",
        }
        
        tts = gTTS(text=text, lang=lang_map.get(language, "en"), slow=False)
        # gTTS outputs mp3 — write directly to an .mp3 path so the returned
        # path always exists (previously saving mp3 content to a .wav path
        # produced a corrupt/missing file).
        mp3_path = os.path.splitext(output_path)[0] + ".mp3"
        tts.save(mp3_path)
        return mp3_path
    except ImportError:
        pass
    except Exception as e:
        print(f"gTTS fallback error: {e}")
    
    # Final fallback: Create a silent audio file
    try:
        import numpy as np
        import wave
        
        wav_path = output_path if output_path.endswith(".wav") else output_path + ".wav"
        # Create 1 second of silence
        sample_rate = 16000
        duration = 1
        samples = np.zeros(sample_rate * duration, dtype=np.int16)
        
        with wave.open(wav_path, 'w') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(samples.tobytes())
        
        return wav_path
    except Exception as e:
        print(f"Silent audio fallback error: {e}")
        return ""
