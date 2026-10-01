"""
Unified AI Service - routes document simplification and Q&A to a real LLM API.

Priority order:
1. Google Gemini (GEMINI_API_KEY) via google-generativeai SDK
2. OpenAI-compatible chat-completions API (OPENAI_API_KEY, optional OPENAI_BASE_URL / OPENAI_MODEL)
3. Local extractive fallback (last resort, clearly labelled as offline)

All functions return text generated *per request* — the prompt always contains
the user's actual question/text, so different questions get different answers.
"""

import os
from typing import Optional

# ---------------------------------------------------------------------------
# Provider availability
# ---------------------------------------------------------------------------

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_BASE_URL = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

try:
    import google.generativeai as genai
    GENAI_AVAILABLE = True
except ImportError:
    genai = None
    GENAI_AVAILABLE = False


def _valid_key(key: str) -> bool:
    return bool(key) and key not in ("YOUR_FREE_API_KEY_HERE", "your-api-key", "sk-...")


def gemini_available() -> bool:
    return GENAI_AVAILABLE and _valid_key(GEMINI_API_KEY)


def openai_available() -> bool:
    return _valid_key(OPENAI_API_KEY)


def ai_available() -> bool:
    """True if at least one real LLM provider is configured."""
    return gemini_available() or openai_available()


def active_provider() -> str:
    if gemini_available():
        return "gemini"
    if openai_available():
        return "openai"
    return "offline-fallback"


# ---------------------------------------------------------------------------
# Core generation
# ---------------------------------------------------------------------------

def generate(prompt: str, temperature: float = 0.3) -> Optional[str]:
    """Send a prompt to the best available LLM provider. Returns None on failure."""
    if gemini_available():
        try:
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-1.5-flash"))
            response = model.generate_content(
                prompt,
                generation_config={"temperature": temperature},
            )
            text = getattr(response, "text", None)
            if text and text.strip():
                return text.strip()
        except Exception as e:
            print(f"[ai_service] Gemini error: {e}")

    if openai_available():
        try:
            import requests
            resp = requests.post(
                f"{OPENAI_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {OPENAI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": OPENAI_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": temperature,
                },
                timeout=60,
            )
            resp.raise_for_status()
            data = resp.json()
            text = data["choices"][0]["message"]["content"]
            if text and text.strip():
                return text.strip()
        except Exception as e:
            print(f"[ai_service] OpenAI-compatible error: {e}")

    return None


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------

SIMPLIFY_SYSTEM = (
    "You are a helpful assistant that explains complex government and legal "
    "documents in simple language that a {level} can understand.\n"
    "Use:\n"
    "- Simple words and short sentences\n"
    "- Bullet points for lists\n"
    "- Examples where helpful\n"
    "- Bold for important terms\n"
    "- Warning symbols for critical information\n"
    "Base your explanation ONLY on the provided document text."
)


def simplify_prompt(text: str, level: str = "10-year-old") -> str:
    return (
        SIMPLIFY_SYSTEM.format(level=level)
        + "\n\nTEXT TO SIMPLIFY:\n"
        + text[:12000]
        + "\n\nProvide the simplified version:"
    )


def chat_prompt(document_text: str, question: str, history: Optional[list] = None) -> str:
    convo = ""
    if history:
        lines = []
        for msg in history[-6:]:
            role = "User" if msg.get("role") == "user" else "Assistant"
            lines.append(f"{role}: {str(msg.get('content', ''))[:500]}")
        convo = "CONVERSATION SO FAR:\n" + "\n".join(lines) + "\n\n"

    return (
        "You are a helpful assistant that answers questions about documents.\n"
        "Answer based ONLY on the information in the document below.\n"
        "If the answer is not in the document, say so clearly.\n"
        "Keep answers concise and in simple language.\n"
        "Always answer the specific question that was just asked.\n\n"
        "DOCUMENT:\n" + document_text[:8000] + "\n\n"
        + convo
        + "QUESTION: " + question
        + "\n\nANSWER:"
    )


# ---------------------------------------------------------------------------
# Offline extractive fallback (last resort only)
# ---------------------------------------------------------------------------

def _extractive_answer(document_text: str, question: str) -> str:
    """Return document passages ranked by word overlap with the question."""
    stop = {"what", "when", "where", "who", "why", "how", "is", "are", "the", "a",
            "an", "to", "of", "in", "on", "for", "and", "or", "do", "does", "did",
            "you", "i", "my", "me", "it", "this", "that", "will", "can", "should"}
    q_words = {w.strip(".,?!\"'()").lower() for w in question.split()} - stop

    sentences = [s.strip() for s in document_text.replace("\n", " ").split(".") if s.strip()]
    scored = []
    for s in sentences:
        overlap = len(q_words & {w.strip(".,?!\"'()").lower() for w in s.split()})
        if overlap:
            scored.append((overlap, s))
    scored.sort(key=lambda x: -x[0])

    if scored:
        best = ". ".join(s for _, s in scored[:3])
        return (
            "⚠️ AI is offline (no GEMINI_API_KEY / OPENAI_API_KEY configured), "
            "so here are the most relevant parts of the document for your question"
            " (" + question + "):\n\n" + best + "."
        )
    return (
        "⚠️ AI is offline (no GEMINI_API_KEY / OPENAI_API_KEY configured). "
        "I could not find a passage matching your question in this document. "
        "Please configure an API key to enable full AI answers."
    )
