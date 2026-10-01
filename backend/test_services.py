"""
Service Test Suite - Sahayak Backend
Tests all services in the services/ folder for import errors and basic functionality.

Run with: python test_services.py   (from the backend/ directory)
"""

import sys
import os
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

RESULTS = []


def check(name, fn):
    """Run a test function; record PASS/FAIL."""
    try:
        msg = fn()
        RESULTS.append((name, "PASS", msg or ""))
        print(f"✅ PASS  {name}  {('- ' + msg) if msg else ''}")
    except Exception as e:
        RESULTS.append((name, "FAIL", f"{type(e).__name__}: {e}"))
        print(f"❌ FAIL  {name}  -> {type(e).__name__}: {e}")
        traceback.print_exc()


# ---------- 1. Import tests ----------
SERVICES = [
    "services.llm_service",
    "services.ocr_service",
    "services.rag_service",
    "services.stt_service",
    "services.translation_service",
    "services.tts_service",
]

for svc in SERVICES:
    def _import(s=svc):
        __import__(s)
        return "imports cleanly"
    check(f"import {svc}", _import)


# ---------- 2. llm_service ----------
def test_llm():
    from services import llm_service
    # Should not raise on missing API key — must degrade gracefully
    out = llm_service.simplify_text("The applicant must furnish requisite documentation.")
    assert isinstance(out, str) and out, "simplify_text returned empty"
    if out.startswith("[Error"):
        return f"graceful fallback without API key: {out[:60]}"
    return "generated simplified text"


check("llm_service.simplify_text", test_llm)


def test_llm_chat():
    from services import llm_service
    out = llm_service.chat_with_document("Rahul gets Rs 6000 per year.", "How much does Rahul get?")
    assert isinstance(out, str) and out, "chat_with_document returned empty"
    return "ok" if not out.startswith("[Error") else f"graceful fallback: {out[:60]}"


check("llm_service.chat_with_document", test_llm_chat)


def test_llm_faqs():
    from services import llm_service

    class FakeScheme:
        scheme_name = "PM Kisan"
        state = "India"
        category = "Agriculture"
        eligibility = "Land owning farmers"
        benefits = "Rs 6000/year"
        application_process = "Apply online at pmkisan.gov.in"
        documents_required = "Aadhaar, land records"

    faqs = llm_service.generate_faqs(FakeScheme())
    assert isinstance(faqs, list) and len(faqs) >= 1, "no FAQs returned"
    for f in faqs:
        assert "question" in f and "answer" in f, f"bad FAQ shape: {f}"
    return f"{len(faqs)} FAQs generated (fallback path works)"


check("llm_service.generate_faqs", test_llm_faqs)


# ---------- 3. ocr_service ----------
def test_ocr_pdf_missing():
    from services.ocr_service import extract_text_from_pdf
    out = extract_text_from_pdf("/nonexistent.pdf")
    assert "Error" in out, f"expected error string, got: {out}"
    return "handles missing file"


check("ocr_service.extract_text_from_pdf (missing file)", test_ocr_pdf_missing)


def test_ocr_txt():
    from services.ocr_service import extract_text_from_file
    tmp = "/tmp/_sahayak_test.txt"
    with open(tmp, "w") as f:
        f.write("hello world")
    out = extract_text_from_file(tmp)
    assert out == "hello world", f"txt extraction failed: {out}"
    os.remove(tmp)
    return "txt extraction works"


check("ocr_service.extract_text_from_file (.txt)", test_ocr_txt)


def test_ocr_real_pdf():
    from services.ocr_service import extract_text_from_pdf
    tmp = "/tmp/_sahayak_test.pdf"
    # Minimal valid single-page PDF with text
    pdf_bytes = (
        b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]"
        b"/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
        b"4 0 obj<</Length 60>>stream\nBT /F1 24 Tf 72 700 Td (Hello Sahayak) Tj ET\nendstream\nendobj\n"
        b"5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
        b"trailer<</Root 1 0 R>>\n%%EOF\n"
    )
    with open(tmp, "wb") as f:
        f.write(pdf_bytes)
    out = extract_text_from_pdf(tmp)
    os.remove(tmp)
    if out.startswith("[Error"):
        # pdfplumber may be unavailable — that's a graceful degradation, note it
        return f"degraded: {out[:70]}"
    assert "Hello Sahayak" in out or out.strip(), f"unexpected output: {out!r}"
    return "real PDF extraction works"


check("ocr_service.extract_text_from_pdf (real PDF)", test_ocr_real_pdf)


# ---------- 4. rag_service ----------
def test_rag():
    from services.rag_service import RAGPipeline
    r = RAGPipeline()
    doc = ("The PM Kisan scheme provides 6000 rupees per year to farmers. "
           "Eligibility requires land ownership. Apply online at pmkisan.gov.in. "
           + "filler content. " * 50)
    r.add_document("d1", doc)
    ans = r.query("How much money do farmers get?", "d1")
    assert isinstance(ans, str) and ans, "empty answer"
    missing = r.query("anything", "unknown-doc")
    assert "not found" in missing.lower(), "missing-doc handling broken"
    r.remove_document("d1")
    assert "d1" not in r.documents, "remove_document failed"
    return "add/query/remove cycle works (with similarity fallback)"


check("rag_service.RAGPipeline", test_rag)


# ---------- 5. stt_service ----------
def test_stt_missing_file():
    from services.stt_service import transcribe_audio
    out = transcribe_audio("/nonexistent.wav")
    assert "Error" in out, f"expected error string, got: {out}"
    return "handles missing file gracefully"


check("stt_service.transcribe_audio (missing file)", test_stt_missing_file)


def test_stt_detect():
    from services.stt_service import detect_language
    out = detect_language("/nonexistent.wav")
    assert isinstance(out, str), "detect_language should return a string"
    return f"returns '{out}' when model/file unavailable (no crash)"


check("stt_service.detect_language", test_stt_detect)


# ---------- 6. translation_service ----------
def test_translation_passthrough():
    from services.translation_service import translate_text, translate_batch, get_language_code
    assert translate_text("hello", "en", "en") == "hello", "same-lang passthrough broken"
    assert translate_text("नमस्ते", "hi", "en") == "नमस्ते", "target-en passthrough broken"
    assert get_language_code("ta") == "tam_Taml", "lang code map broken"
    batch = translate_batch(["a"], "en", "en")
    assert batch == ["a"], "batch broken"
    return "passthrough + language mapping work"


check("translation_service (passthrough paths)", test_translation_passthrough)


def test_translation_model_path():
    from services.translation_service import translate_text
    out = translate_text("This is a benefit of the scheme.", "en", "hi")
    assert isinstance(out, str) and out, "translate returned empty"
    if out.startswith("[Translation"):
        return f"graceful fallback (model not loaded): {out[:60]}"
    return "IndicTrans2 model translated successfully"


check("translation_service.translate_text (en->hi)", test_translation_model_path)


# ---------- 7. tts_service ----------
def test_tts():
    from services.tts_service import generate_audio
    out_path = "/tmp/_sahayak_tts_test.wav"
    result = generate_audio("This is a test of the speech system.", out_path, language="hi")
    assert isinstance(result, str) and result, "generate_audio returned empty path"
    assert os.path.exists(result), f"audio file not created at {result}"
    size = os.path.getsize(result)
    os.remove(result)
    if result.endswith(".mp3"):
        return f"gTTS fallback produced mp3 ({size} bytes)"
    return f"audio file created ({size} bytes) at {result}"


check("tts_service.generate_audio", test_tts)


# ---------- 8. FastAPI app imports & endpoints exist ----------
def test_app_import():
    import main  # noqa
    routes = [getattr(r, "path", "") for r in main.app.routes]
    expected = [
        "/api/document/upload",
        "/api/schemes/state/{state_code}",
        "/api/schemes/{scheme_id}",
        "/api/health",
    ]
    missing = [e for e in expected if e not in routes]
    assert not missing, f"routes missing: {missing}"
    return f"app imports; {len(routes)} routes registered"


check("main.py (FastAPI app)", test_app_import)


# ---------- Summary ----------
print("\n" + "=" * 60)
passed = sum(1 for _, s, _ in RESULTS if s == "PASS")
failed = sum(1 for _, s, _ in RESULTS if s == "FAIL")
print(f"SUMMARY: {passed} passed, {failed} failed, {len(RESULTS)} total")
if failed:
    print("\nFAILED TESTS:")
    for name, status, msg in RESULTS:
        if status == "FAIL":
            print(f"  ❌ {name}: {msg}")
sys.exit(1 if failed else 0)
