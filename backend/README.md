# 🇮🇳 Sahayak - AI-Powered Civic Tech Platform

> **Your AI Assistant for Understanding Government Schemes & Legal Documents**

Sahayak is a complete civic tech web application that helps Indian citizens understand government schemes, simplify legal documents, and navigate application processes — all in their local language. Built entirely with **free, open-source AI models** that run locally.

---

## 🌟 Features

### 1. 📄 Document Simplifier
- Upload any PDF or legal document
- Get AI-powered simplified explanation (like explaining to a 10-year-old)
- Audio summary in your preferred Indian language
- RAG-powered Q&A about the document
- OCR support for scanned documents

### 2. 🏛️ State-wise Scheme Directory
- Browse 100+ government schemes by state
- Filter by category (Agriculture, Healthcare, Education, etc.)
- Detailed eligibility criteria
- Step-by-step application guidance
- Audio summaries in local languages
- AI-generated FAQs

### 3. 👤 Personalized Alert Profiles
- Create your profile (age, income, state, occupation, interests)
- Get matched with schemes you're eligible for
- Eligibility score with confidence level
- Matched/unmatched criteria breakdown

### 4. 🗣️ Voice-First Interaction
- Speak your question in any Indian language
- Powered by OpenAI Whisper for accurate transcription
- Get instant AI-powered answers

### 5. 📊 Step-by-Step Application Tracker
- Track your progress through application steps
- Mark steps as completed
- Visual progress bar

### 6. 💬 AI Chatbot
- Ask anything about schemes or documents
- Context-aware responses using RAG
- Quick-action buttons for common queries

---

## 🛠️ Tech Stack

| Component | Technology | Notes |
|-----------|-----------|-------|
| **Backend** | Python 3.10+, FastAPI | Async, high-performance |
| **Frontend** | React, Tailwind CSS | Modern, responsive UI |
| **Database** | SQLite + SQLAlchemy | Lightweight, no setup needed |
| **LLM** | Google Gemini (Free tier) | No paid API required |
| **Translation** | AI4Bharat IndicTrans2 | 11 Indian languages |
| **TTS** | Indic Parler-TTS | Indian language speech |
| **STT** | OpenAI Whisper (small) | Fast local transcription |
| **OCR** | pdfplumber + EasyOCR | PDF & image text extraction |
| **Vector DB** | FAISS | Fast similarity search |
| **RAG** | Custom pipeline | Document Q&A |

---

## 📁 Project Structure

```
sahayak/
├── frontend/                    # React Frontend (this build)
│   ├── src/
│   │   ├── App.tsx             # Main app with routing
│   │   ├── components/         # Shared components
│   │   │   └── Layout.tsx      # Navigation & layout
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx   # Home page
│   │   │   ├── DocumentSimplifier.tsx
│   │   │   ├── SchemeDirectory.tsx
│   │   │   ├── SchemeDetail.tsx
│   │   │   ├── Profile.tsx
│   │   │   ├── Chat.tsx
│   │   │   └── Alerts.tsx
│   │   └── data/
│   │       └── mockData.ts     # Demo data
│   └── package.json
│
├── backend/                     # Python FastAPI Backend
│   ├── main.py                 # FastAPI app, all endpoints
│   ├── requirements.txt        # Python dependencies
│   ├── database/
│   │   ├── db.py              # SQLite setup
│   │   └── models.py          # SQLAlchemy models
│   ├── services/
│   │   ├── llm_service.py     # Gemini API integration
│   │   ├── translation_service.py  # IndicTrans2
│   │   ├── tts_service.py     # Indic Parler-TTS
│   │   ├── stt_service.py     # Whisper
│   │   ├── ocr_service.py     # OCR integration
│   │   └── rag_service.py     # FAISS RAG pipeline
│   ├── scripts/
│   │   └── load_schemes.py    # Load CSV into SQLite
│   ├── data/
│   │   └── schemes.csv        # Scheme data
│   └── uploads/               # Uploaded files & audio
│
└── README.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+** (for frontend development)
- **pip** (Python package manager)
- **Google Gemini API Key** (Free - get from https://makersuite.google.com/app/apikey)

### Backend Setup

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Set up environment variables
export GEMINI_API_KEY="your-free-api-key-here"
# Or create a .env file:
echo "GEMINI_API_KEY=your-free-api-key-here" > .env

# 5. Load scheme data into database
python scripts/load_schemes.py

# 6. Start the backend server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
API docs at `http://localhost:8000/docs`

### Frontend Setup (Development)

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Build for production
npm run build
```

### Quick Demo (Frontend Only)

The frontend works standalone with mock data for demo purposes:

```bash
npm install
npm run build
# Open dist/index.html in a browser
```

---

## 📡 API Endpoints

### Document Module
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/document/upload` | Upload PDF/image |
| POST | `/api/document/{id}/simplify` | Simplify with AI |
| POST | `/api/document/{id}/audio` | Generate audio summary |
| POST | `/api/document/{id}/chat` | RAG Q&A on document |
| GET | `/api/document/history` | List past uploads |

### Scheme Directory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/states` | List all states |
| GET | `/api/schemes/state/{code}` | Schemes by state |
| GET | `/api/schemes/{id}` | Scheme details |
| GET | `/api/schemes/{id}/audio` | Audio summary |
| GET | `/api/schemes/{id}/faqs` | AI-generated FAQs |
| GET | `/api/schemes/{id}/steps` | Application steps |

### User & Eligibility
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/user/profile` | Create/update profile |
| GET | `/api/user/alerts/{session_id}` | Personalized alerts |
| POST | `/api/schemes/eligibility-score` | Eligibility score |

### Progress & Voice
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/progress/track` | Save step progress |
| GET | `/api/progress/{session_id}/{scheme_id}` | Get progress |
| POST | `/api/voice/transcribe` | Transcribe audio |

---

## 🌐 Supported Languages

| Code | Language | Code | Language |
|------|----------|------|----------|
| hi | हिंदी (Hindi) | ta | தமிழ் (Tamil) |
| bn | বাংলা (Bengali) | gu | ગુજરાતી (Gujarati) |
| te | తెలుగు (Telugu) | kn | ಕನ್ನಡ (Kannada) |
| mr | मराठी (Marathi) | ml | മലയാളം (Malayalam) |
| pa | ਪੰਜਾਬੀ (Punjabi) | or | ଓଡ଼ିଆ (Odia) |
| en | English | | |

---

## 🔑 Getting a Free Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and set it as `GEMINI_API_KEY` environment variable

**Note:** The free tier includes 60 requests per minute — more than enough for a demo!

---

## 📊 Model Details

| Model | Size | Purpose | RAM Required |
|-------|------|---------|-------------|
| Gemini Pro | Cloud | Text simplification, chat | 0 (API) |
| IndicTrans2-1B | 1B params | Translation | ~4 GB |
| Indic Parler-TTS | ~1B params | Text-to-speech | ~4 GB |
| Whisper Small | 244M params | Speech-to-text | ~2 GB |
| FAISS | - | Vector search | ~1 GB |
| Sentence Transformers | 133M params | Embeddings | ~1 GB |

**Total RAM for full local operation: ~12 GB** (Gemini runs in cloud)

---

## 🎯 For Tech Expo Demo

### Quick Demo Flow:
1. **Show Dashboard** → Explain the platform
2. **Upload a PDF** → Show document simplification
3. **Browse Schemes** → Filter by state, show details
4. **Check Eligibility** → Create profile, show matched schemes
5. **Voice Chat** → Speak a question, get answer
6. **Audio Summary** → Play scheme summary in Hindi

### Hardware Requirements for Demo:
- Laptop with 8GB+ RAM
- Internet connection (for Gemini API)
- Microphone (for voice input)
- Speakers (for audio output)

---

## 📝 License

This project is open-source and free to use for educational purposes.

## 🙏 Acknowledgments

- **AI4Bharat** - For IndicTrans2 and Indic Parler-TTS
- **Google** - For free Gemini API access
- **OpenAI** - For Whisper model
- **Government of India** - For scheme data
- **FastAPI** - For the amazing web framework

---

## 📞 Support

For issues or questions about this project, please open an issue on the repository.

**Built with ❤️ for Indian Citizens**
