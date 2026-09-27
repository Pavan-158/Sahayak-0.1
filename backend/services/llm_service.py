"""
LLM Service - Google Gemini API Integration (Free Tier)
Handles text simplification, chat, and FAQ generation.
"""

import os
import google.generativeai as genai
from typing import List, Dict

# Configure Gemini API (Free tier - no billing required)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_FREE_API_KEY_HERE")

def configure_gemini():
    """Configure the Gemini API client."""
    genai.configure(api_key=GEMINI_API_KEY)

def get_model():
    """Get the Gemini model instance."""
    configure_gemini()
    return genai.GenerativeModel('gemini-pro')

def simplify_text(text: str, level: str = "10-year-old") -> str:
    """
    Simplify complex text to a given reading level using Gemini.
    
    Args:
        text: The complex text to simplify
        level: Target reading level (default: "10-year-old")
    
    Returns:
        Simplified text
    """
    model = get_model()
    
    prompt = f"""You are a helpful assistant that explains complex government and legal documents 
in simple language that a {level} can understand. 

Please simplify the following text. Use:
- Simple words and short sentences
- Bullet points for lists
- Examples where helpful
- Bold for important terms
- Warning symbols (⚠️) for critical information

TEXT TO SIMPLIFY:
{text}

Provide the simplified version:"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"[Error simplifying text: {str(e)}]"


def chat_with_document(document_text: str, question: str) -> str:
    """
    Answer questions about a document using Gemini.
    
    Args:
        document_text: The document content
        question: User's question
    
    Returns:
        Answer to the question
    """
    model = get_model()
    
    prompt = f"""You are a helpful assistant that answers questions about documents.
Answer based ONLY on the information in the document below.
If the answer is not in the document, say so clearly.
Keep answers concise and in simple language.

DOCUMENT:
{document_text[:4000]}

QUESTION: {question}

ANSWER:"""

    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"[Error: {str(e)}]"


def generate_faqs(scheme) -> List[Dict[str, str]]:
    """
    Generate FAQs for a scheme using Gemini.
    
    Args:
        scheme: Scheme object with details
    
    Returns:
        List of FAQ dictionaries with 'question' and 'answer' keys
    """
    model = get_model()
    
    prompt = f"""Generate 5 frequently asked questions (FAQs) about this government scheme.
Each FAQ should have a question and a clear, helpful answer.
Focus on common concerns like eligibility, documents needed, how to apply, timelines, etc.

SCHEME NAME: {scheme.scheme_name}
STATE: {scheme.state}
CATEGORY: {scheme.category}
ELIGIBILITY: {scheme.eligibility}
BENEFITS: {scheme.benefits}
APPLICATION PROCESS: {scheme.application_process}

Format your response as:
Q1: [question]
A1: [answer]
Q2: [question]
A2: [answer]
...and so on for 5 FAQs."""

    try:
        response = model.generate_content(prompt)
        text = response.text
        
        # Parse FAQs
        faqs = []
        lines = text.strip().split('\n')
        current_q = None
        current_a = None
        
        for line in lines:
            line = line.strip()
            if line.startswith('Q') and ':' in line:
                if current_q and current_a:
                    faqs.append({"question": current_q, "answer": current_a})
                current_q = line.split(':', 1)[1].strip()
                current_a = None
            elif line.startswith('A') and ':' in line:
                current_a = line.split(':', 1)[1].strip()
            elif current_a is not None and line:
                current_a += " " + line
        
        if current_q and current_a:
            faqs.append({"question": current_q, "answer": current_a})
        
        return faqs[:5]
    except Exception as e:
        return [
            {"question": "How to apply?", "answer": f"Visit the official website or nearest CSC center. {scheme.application_process[:200]}"},
            {"question": "What documents are needed?", "answer": scheme.documents_required or "Please check the official website for document requirements."},
        ]
