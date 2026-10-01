"""
Sahayak - AI-Powered Civic Tech Platform for Indian Citizens
Main FastAPI Application

Run with: uvicorn main:app --reload --port 8000
"""

import os
import uuid
import asyncio
from typing import Optional, List
from datetime import datetime

from fastapi import FastAPI, UploadFile, File, HTTPException, Form, Query
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database.db import get_db, init_db
from database.models import Scheme, UserProfile, UserProgress, DocumentRecord
from services.llm_service import simplify_text, chat_with_document, generate_faqs
from services import ai_service
from services.translation_service import translate_text
from services.tts_service import generate_audio
from services.stt_service import transcribe_audio
from services.ocr_service import extract_text_from_pdf
from services.rag_service import RAGPipeline

# Initialize FastAPI app
app = FastAPI(
    title="Sahayak API",
    description="AI-Powered Civic Tech Platform for Indian Citizens",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
os.makedirs("uploads", exist_ok=True)
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Global RAG pipeline (initialized lazily)
rag_pipeline: Optional[RAGPipeline] = None

# ==================== STARTUP ====================

@app.on_event("startup")
async def startup():
    """Initialize database and services on startup."""
    await init_db()
    global rag_pipeline
    rag_pipeline = RAGPipeline()
    print("✅ Sahayak API started successfully!")
    print("📍 Docs: http://localhost:8000/docs")

# ==================== PYDANTIC MODELS ====================

class ProfileCreate(BaseModel):
    name: str
    age: int
    income: float
    state: str
    occupation: str
    interests: List[str]
    language: str = "en"
    gender: str = "male"
    category: str = "general"

class ProgressUpdate(BaseModel):
    session_id: str
    scheme_id: str
    step_number: int
    is_completed: bool

class EligibilityRequest(BaseModel):
    profile: ProfileCreate
    scheme_id: str

class ChatRequest(BaseModel):
    message: str
    document_id: Optional[str] = None
    history: Optional[List[dict]] = None  # prior turns: [{role, content}]

# ==================== DOCUMENT MODULE ====================

@app.post("/api/document/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a PDF and extract text."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    doc_id = str(uuid.uuid4())
    file_ext = os.path.splitext(file.filename)[1].lower()
    file_path = f"uploads/{doc_id}{file_ext}"
    
    # Save file
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Extract text
    try:
        if file_ext == ".pdf":
            text = extract_text_from_pdf(file_path)
        elif file_ext in (".txt", ".md"):
            # Plain text — read directly, no OCR needed
            from services.ocr_service import extract_text_from_file
            text = extract_text_from_file(file_path)
        else:
            # OCR for images
            from services.ocr_service import extract_text_from_image
            text = extract_text_from_image(file_path)
    except Exception as e:
        text = f"[Error extracting text: {str(e)}]"
    
    # Save to database
    db = await get_db()
    doc_record = DocumentRecord(
        id=doc_id,
        filename=file.filename,
        file_path=file_path,
        extracted_text=text,
        created_at=datetime.utcnow()
    )
    db.add(doc_record)
    await db.commit()
    
    return {
        "id": doc_id,
        "filename": file.filename,
        "text_length": len(text),
        "text_preview": text[:500] if text else "No text extracted",
    }

@app.post("/api/document/{doc_id}/simplify")
async def simplify_document(
    doc_id: str,
    language: str = Query(default="en", description="Target language code"),
    level: str = Query(default="10-year-old", description="Reading level for the explanation"),
):
    """Simplify document text using a live AI API (Gemini / OpenAI-compatible)."""
    db = await get_db()
    doc = db.get(DocumentRecord, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Simplify with the AI model, based on this document's actual text
    simplified = simplify_text(doc.extracted_text, level=level)
    
    # Translate if needed
    if language != "en":
        simplified = translate_text(simplified, source_lang="en", target_lang=language)
    
    # Update record
    doc.simplified_text = simplified
    doc.target_language = language
    await db.commit()
    
    return {
        "id": doc_id,
        "simplified_text": simplified,
        "language": language,
        "provider": ai_service.active_provider(),
    }

@app.post("/api/document/{doc_id}/audio")
async def generate_document_audio(
    doc_id: str,
    language: str = Query(default="hi", description="Language for audio")
):
    """Generate audio summary of document using Indic Parler-TTS."""
    db = await get_db()
    doc = db.get(DocumentRecord, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    text_to_speak = doc.simplified_text or doc.extracted_text
    
    # Generate audio
    audio_path = f"uploads/{doc_id}_audio.wav"
    saved_path = generate_audio(text_to_speak, audio_path, language=language)
    audio_file = os.path.basename(saved_path) if saved_path else os.path.basename(audio_path)
    
    return {
        "id": doc_id,
        "audio_url": f"/uploads/{audio_file}",
        "language": language,
    }

@app.post("/api/document/{doc_id}/chat")
async def chat_document(doc_id: str, request: ChatRequest):
    """RAG-powered Q&A on the document. The answer is generated by the AI API
    for the specific question asked (never a canned response)."""
    db = await get_db()
    doc = db.get(DocumentRecord, doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Empty message")
    
    # Use RAG pipeline to retrieve context relevant to THIS question,
    # then generate an answer with the live LLM API.
    global rag_pipeline
    if rag_pipeline:
        rag_pipeline.add_document(doc_id, doc.extracted_text)
        answer = rag_pipeline.query(request.message, doc_id, history=request.history)
    else:
        answer = chat_with_document(doc.extracted_text, request.message, history=request.history)
    
    return {
        "question": request.message,
        "answer": answer,
        "document_id": doc_id,
        "provider": ai_service.active_provider(),
    }

@app.get("/api/document/history")
async def get_document_history():
    """List past document uploads."""
    db = await get_db()
    docs = db.query(DocumentRecord).order_by(DocumentRecord.created_at.desc()).all()
    
    return [
        {
            "id": doc.id,
            "filename": doc.filename,
            "created_at": doc.created_at.isoformat(),
            "has_simplified": bool(doc.simplified_text),
            "language": doc.target_language or "en",
        }
        for doc in docs
    ]

# ==================== SCHEME DIRECTORY ====================

@app.get("/api/states")
async def get_states():
    """List all available states."""
    db = await get_db()
    states = db.query(Scheme.state, Scheme.state_code).distinct().all()
    
    return [
        {"code": state[1], "name": state[0]}
        for state in states
        if state[0]
    ]

@app.get("/api/schemes/state/{state_code}")
async def get_schemes_by_state(
    state_code: str,
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=50),
    category: Optional[str] = None,
):
    """Get paginated schemes for a state."""
    db = await get_db()
    query = db.query(Scheme)
    
    if state_code != "ALL":
        query = query.filter(
            (Scheme.state_code == state_code) | (Scheme.state_code == "ALL")
        )
    
    if category:
        query = query.filter(Scheme.category == category)
    
    total = query.count()
    schemes = query.offset((page - 1) * limit).limit(limit).all()
    
    return {
        "schemes": [
            {
                "id": s.id,
                "scheme_name": s.scheme_name,
                "state": s.state,
                "level": s.level,
                "category": s.category,
                "benefits": s.benefits[:150] + "..." if s.benefits else "",
            }
            for s in schemes
        ],
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit,
    }

@app.get("/api/schemes/{scheme_id}")
async def get_scheme_detail(
    scheme_id: str,
    language: Optional[str] = None,
):
    """Get full details of a scheme with optional translation."""
    db = await get_db()
    scheme = db.get(Scheme, scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    
    result = {
        "id": scheme.id,
        "scheme_name": scheme.scheme_name,
        "state": scheme.state,
        "level": scheme.level,
        "category": scheme.category,
        "eligibility": scheme.eligibility,
        "benefits": scheme.benefits,
        "application_process": scheme.application_process,
        "documents_required": scheme.documents_required,
        "official_link": scheme.official_link,
    }
    
    # Translate if language specified
    if language and language != "en":
        for field in ["eligibility", "benefits", "application_process"]:
            if result[field]:
                result[field] = translate_text(result[field], "en", language)
        result["language"] = language
    
    return result

@app.get("/api/schemes/{scheme_id}/audio")
async def get_scheme_audio(
    scheme_id: str,
    language: str = Query(default="hi"),
):
    """Generate audio summary of a scheme."""
    db = await get_db()
    scheme = db.get(Scheme, scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    
    # Create summary text
    summary = f"""
    {scheme.scheme_name} is a {scheme.level.lower()} level scheme in {scheme.state}.
    Category: {scheme.category}.
    Benefits: {scheme.benefits}
    Eligibility: {scheme.eligibility}
    """
    
    # Translate if needed
    if language != "en":
        summary = translate_text(summary, "en", language)
    
    # Generate audio
    audio_path = f"uploads/scheme_{scheme_id}_{language}.wav"
    saved_path = generate_audio(summary, audio_path, language=language)
    audio_file = os.path.basename(saved_path) if saved_path else os.path.basename(audio_path)
    
    return {
        "scheme_id": scheme_id,
        "audio_url": f"/uploads/{audio_file}",
        "language": language,
    }

@app.get("/api/schemes/{scheme_id}/faqs")
async def get_scheme_faqs(scheme_id: str):
    """Generate FAQs for a scheme using Gemini."""
    db = await get_db()
    scheme = db.get(Scheme, scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    
    faqs = generate_faqs(scheme)
    return {"scheme_id": scheme_id, "faqs": faqs}

@app.get("/api/schemes/{scheme_id}/steps")
async def get_scheme_steps(scheme_id: str):
    """Parse application process into steps."""
    db = await get_db()
    scheme = db.get(Scheme, scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    
    # Parse steps from application_process
    raw_steps = scheme.application_process.split('\n')
    steps = []
    for step in raw_steps:
        step = step.strip()
        if step:
            # Remove numbering if present
            import re
            step = re.sub(r'^\d+[\.\)]\s*', '', step)
            steps.append(step)
    
    return {
        "scheme_id": scheme_id,
        "steps": steps,
        "total_steps": len(steps),
    }

# ==================== ELIGIBILITY SCORE ====================

@app.post("/api/schemes/eligibility-score")
async def get_eligibility_score(request: EligibilityRequest):
    """Calculate eligibility score for a user profile against a scheme."""
    db = await get_db()
    scheme = db.get(Scheme, request.scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    
    profile = request.profile
    score = 50  # Base score
    matched_criteria = []
    unmatched_criteria = []
    
    # State matching
    if scheme.state_code == "ALL" or scheme.state_code == profile.state:
        score += 15
        matched_criteria.append("State criteria met")
    else:
        score -= 20
        unmatched_criteria.append("Not in eligible state")
    
    # Income check (simplified heuristic)
    if profile.income < 300000:
        score += 15
        matched_criteria.append("Income within eligible range")
    elif profile.income > 800000:
        score -= 10
        unmatched_criteria.append("Income may exceed limit")
    else:
        matched_criteria.append("Income likely within range")
    
    # Age check
    if 18 <= profile.age <= 65:
        score += 10
        matched_criteria.append("Age is within eligible range")
    else:
        score -= 10
        unmatched_criteria.append("Age may not meet criteria")
    
    # Occupation matching
    if profile.occupation == "Farmer" and scheme.category == "Agriculture":
        score += 15
        matched_criteria.append("Perfect for farmers")
    if profile.occupation == "Student" and scheme.category == "Education":
        score += 15
        matched_criteria.append("Perfect for students")
    
    # Category (reservation) bonus
    if profile.category in ["sc", "st", "obc"] and scheme.category == "Education":
        score += 10
        matched_criteria.append("Reservation benefit applicable")
    
    # Gender matching
    if profile.gender == "female" and "Women" in scheme.category:
        score += 10
        matched_criteria.append("Scheme designed for women")
    
    # Clamp score
    score = max(0, min(100, score))
    
    # Generate explanation
    if score >= 75:
        explanation = "You have a very good chance of being eligible for this scheme. Please verify all criteria and apply!"
    elif score >= 50:
        explanation = "You may be eligible for this scheme. Some criteria need verification."
    else:
        explanation = "You may not fully meet the eligibility criteria. Please check the requirements carefully."
    
    return {
        "score": score,
        "matched_criteria": matched_criteria,
        "unmatched_criteria": unmatched_criteria,
        "explanation": explanation,
    }

# ==================== USER PROFILE ====================

@app.post("/api/user/profile")
async def create_update_profile(profile: ProfileCreate, session_id: str = Query(default="default")):
    """Create or update user profile."""
    db = await get_db()
    
    existing = db.query(UserProfile).filter(UserProfile.session_id == session_id).first()
    
    if existing:
        existing.name = profile.name
        existing.age = profile.age
        existing.income = profile.income
        existing.state = profile.state
        existing.occupation = profile.occupation
        existing.interests = ",".join(profile.interests)
        existing.language = profile.language
        existing.gender = profile.gender
        existing.category = profile.category
    else:
        new_profile = UserProfile(
            session_id=session_id,
            name=profile.name,
            age=profile.age,
            income=profile.income,
            state=profile.state,
            occupation=profile.occupation,
            interests=",".join(profile.interests),
            language=profile.language,
            gender=profile.gender,
            category=profile.category,
        )
        db.add(new_profile)
    
    await db.commit()
    return {"status": "saved", "session_id": session_id}

@app.get("/api/user/alerts/{session_id}")
async def get_user_alerts(session_id: str):
    """Get personalized scheme alerts for user."""
    db = await get_db()
    profile = db.query(UserProfile).filter(UserProfile.session_id == session_id).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Please create a profile first.")
    
    # Get all schemes
    all_schemes = db.query(Scheme).all()
    interests = profile.interests.split(",") if profile.interests else []
    
    matched = []
    for scheme in all_schemes:
        score = 50
        
        # State
        if scheme.state_code == "ALL" or scheme.state_code == profile.state:
            score += 15
        
        # Interest match
        for interest in interests:
            if interest.lower() in scheme.category.lower():
                score += 10
                break
        
        # Income
        if profile.income < 500000:
            score += 10
        
        # Age
        if 18 <= profile.age <= 65:
            score += 5
        
        score = max(0, min(100, score))
        
        if score >= 50:
            matched.append({
                "id": scheme.id,
                "scheme_name": scheme.scheme_name,
                "state": scheme.state,
                "category": scheme.category,
                "score": score,
                "benefits": scheme.benefits[:100] + "..." if scheme.benefits else "",
            })
    
    matched.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "session_id": session_id,
        "total_matches": len(matched),
        "schemes": matched[:20],
    }

# ==================== PROGRESS TRACKER ====================

@app.post("/api/progress/track")
async def track_progress(update: ProgressUpdate):
    """Save user progress for a scheme."""
    db = await get_db()
    
    existing = db.query(UserProgress).filter(
        UserProgress.session_id == update.session_id,
        UserProgress.scheme_id == update.scheme_id,
        UserProgress.step_number == update.step_number,
    ).first()
    
    if existing:
        existing.is_completed = update.is_completed
    else:
        progress = UserProgress(
            session_id=update.session_id,
            scheme_id=update.scheme_id,
            step_number=update.step_number,
            is_completed=update.is_completed,
        )
        db.add(progress)
    
    await db.commit()
    return {"status": "saved"}

@app.get("/api/progress/{session_id}/{scheme_id}")
async def get_progress(session_id: str, scheme_id: str):
    """Get user progress for a scheme."""
    db = await get_db()
    progress = db.query(UserProgress).filter(
        UserProgress.session_id == session_id,
        UserProgress.scheme_id == scheme_id,
    ).all()
    
    return {
        "session_id": session_id,
        "scheme_id": scheme_id,
        "steps": [
            {
                "step_number": p.step_number,
                "is_completed": p.is_completed,
            }
            for p in progress
        ],
    }

# ==================== VOICE INPUT ====================

@app.post("/api/voice/transcribe")
async def transcribe_voice(file: UploadFile = File(...)):
    """Transcribe audio file using Whisper."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No audio file provided")
    
    # Save audio file
    file_ext = os.path.splitext(file.filename)[1] or ".wav"
    audio_path = f"uploads/voice_{uuid.uuid4()}{file_ext}"
    
    content = await file.read()
    with open(audio_path, "wb") as f:
        f.write(content)
    
    # Transcribe
    text = transcribe_audio(audio_path)
    
    # Clean up
    os.remove(audio_path)
    
    return {
        "transcription": text,
        "language": "auto-detected",
    }

# ==================== HEALTH CHECK ====================

@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "Sahayak API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }

# ==================== SERVE FRONTEND ====================

@app.get("/")
async def serve_frontend():
    """Serve the frontend application."""
    frontend_path = os.path.join("static", "index.html")
    if os.path.exists(frontend_path):
        return FileResponse(frontend_path)
    return {"message": "Sahayak API is running. Frontend not found in static/ directory."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
