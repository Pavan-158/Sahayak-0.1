"""
Translation Service - AI4Bharat IndicTrans2 Integration
Supports translation between English and 11 Indian languages.
"""

from typing import Optional

# Supported languages for IndicTrans2
SUPPORTED_LANGUAGES = {
    "hi": "Hindi",
    "bn": "Bengali",
    "te": "Telugu",
    "mr": "Marathi",
    "ta": "Tamil",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "or": "Odia",
    "en": "English",
}

# Model name for IndicTrans2
MODEL_NAME = "ai4bharat/indictrans2-en-indic-1B"

# Global tokenizer and model (loaded lazily)
_tokenizer = None
_model = None


def load_model():
    """Load the IndicTrans2 model and tokenizer."""
    global _tokenizer, _model
    
    if _model is not None:
        return
    
    try:
        from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
        
        print(f"Loading IndicTrans2 model: {MODEL_NAME}")
        _tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
        _model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME, trust_remote_code=True)
        print("✅ IndicTrans2 model loaded successfully")
    except Exception as e:
        print(f"⚠️ Error loading IndicTrans2: {e}")
        print("Translation will use fallback (English only)")


def get_language_code(lang: str) -> str:
    """Get the IndicTrans2 language code."""
    lang_map = {
        "hi": "hin_Deva",
        "bn": "ben_Beng",
        "te": "tel_Telu",
        "mr": "mar_Deva",
        "ta": "tam_Taml",
        "gu": "guj_Gujr",
        "kn": "kan_Knda",
        "ml": "mal_Mlym",
        "pa": "pan_Guru",
        "or": "ori_Orya",
        "en": "eng_Latn",
    }
    return lang_map.get(lang, "eng_Latn")


def translate_text(text: str, source_lang: str = "en", target_lang: str = "hi") -> str:
    """
    Translate text between languages using IndicTrans2.
    
    Args:
        text: Text to translate
        source_lang: Source language code (e.g., "en")
        target_lang: Target language code (e.g., "hi")
    
    Returns:
        Translated text
    """
    if source_lang == target_lang:
        return text
    
    if target_lang == "en":
        return text  # Already in English
    
    load_model()
    
    if _model is None or _tokenizer is None:
        return f"[Translation unavailable - Model not loaded] {text}"
    
    try:
        import torch
        
        src_lang = get_language_code(source_lang)
        tgt_lang = get_language_code(target_lang)
        
        # Set the source language token
        _tokenizer.src_lang = src_lang
        
        # Tokenize
        inputs = _tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
        
        # Generate translation
        with torch.no_grad():
            generated_tokens = _model.generate(
                **inputs,
                forced_bos_token_id=_tokenizer.lang_code_to_id[tgt_lang],
                max_length=512,
            )
        
        # Decode
        translated = _tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]
        return translated
        
    except Exception as e:
        print(f"Translation error: {e}")
        return f"[Translation error] {text}"


def translate_batch(texts: list, source_lang: str = "en", target_lang: str = "hi") -> list:
    """Translate a batch of texts."""
    return [translate_text(text, source_lang, target_lang) for text in texts]
