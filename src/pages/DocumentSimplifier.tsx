import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, Volume2, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { languages } from '../data/mockData';
import AudioPlayer from '../components/AudioPlayer';
import { uploadDocument, simplifyDocument, chatWithDocument } from '../services/api';

interface Document {
  id: string;
  name: string;
  originalText: string;
  simplifiedText: string;
  language: string;
  status: 'uploaded' | 'simplifying' | 'simplified' | 'audio_ready';
  audioUrl?: string;
}

export default function DocumentSimplifier() {
  const [document, setDocument] = useState<Document | null>(null);
  const [selectedLang, setSelectedLang] = useState('en');
  const [loading, setLoading] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ role: string; content: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading('extracting');
    setError(null);

    try {
      // Real backend call: uploads the file and extracts text (PDF/OCR)
      const result = await uploadDocument(file);
      setDocument({
        id: result.id,
        name: result.filename,
        originalText: result.text_preview || '',
        simplifiedText: '',
        language: selectedLang,
        status: 'uploaded',
      });
    } catch (err: any) {
      setError(`Upload failed: ${err.message}. Is the backend running on port 8000?`);
    } finally {
      setLoading(null);
    }
  };

  const handleSimplify = async () => {
    if (!document) return;
    setLoading('simplifying');
    setError(null);

    try {
      // Real AI API call — the backend generates this response from the
      // uploaded document's actual text (Gemini / OpenAI-compatible API).
      const result = await simplifyDocument(document.id, selectedLang);
      setDocument({
        ...document,
        simplifiedText: result.simplified_text,
        language: result.language,
        status: 'simplified',
      });
    } catch (err: any) {
      setError(`Simplification failed: ${err.message}`);
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateAudio = () => {
    if (!document) return;
    // Audio is now available immediately via the AudioPlayer component
    // Just mark it as audio_ready to show the player
    setDocument({
      ...document,
      status: 'audio_ready',
    });
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !document || chatLoading) return;

    const question = chatInput.trim();
    const userMsg = { role: 'user', content: question };
    const history = chatMessages;
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    setError(null);

    try {
      // Real AI API call — answer is generated for THIS specific question
      const result = await chatWithDocument(document.id, question, history);
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.answer }]);
    } catch (err: any) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I couldn't answer that (${err.message}). Please make sure the backend is running.`,
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📄 Document Simplifier</h1>
        <p className="text-gray-600">Upload any legal document or PDF and get a simplified explanation in your language</p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload & Controls */}
        <div className="space-y-6">
          {/* Upload Area */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Upload Document</h2>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-saffron hover:bg-saffron/5 transition-all"
            >
              {loading === 'extracting' ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-saffron" size={40} />
                  <p className="text-gray-600">Extracting text from PDF...</p>
                </div>
              ) : document ? (
                <div className="flex flex-col items-center gap-3">
                  <CheckCircle className="text-green-500" size={40} />
                  <p className="font-medium text-gray-800">{document.name}</p>
                  <p className="text-sm text-gray-500">Click to upload a different file</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="text-gray-400" size={40} />
                  <p className="text-gray-600">Click to upload PDF or legal document</p>
                  <p className="text-sm text-gray-400">Supports PDF, images (with OCR)</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {/* Language & Actions */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Processing Options</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Language</label>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="input-field"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSimplify}
                  disabled={!document || loading !== null || document.status !== 'uploaded'}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading === 'simplifying' ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <FileText size={18} />
                  )}
                  Simplify with AI
                </button>

                <button
                  onClick={handleGenerateAudio}
                  disabled={!document || document.status !== 'simplified'}
                  className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Volume2 size={18} />
                  Enable Audio
                </button>
              </div>
            </div>
          </div>

          {/* Document History */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Documents</h2>
            <div className="space-y-2">
              {[
                { name: 'Property_Deed_2025.pdf', date: '2 hours ago', status: 'simplified' },
                { name: 'Court_Notice_HC.pdf', date: 'Yesterday', status: 'simplified' },
                { name: 'Rental_Agreement.pdf', date: '3 days ago', status: 'audio_ready' },
              ].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                      <p className="text-xs text-gray-400">{doc.date}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    doc.status === 'audio_ready' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {doc.status === 'audio_ready' ? '✓ Audio' : '✓ Simplified'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Simplified Text */}
          {document?.simplifiedText && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">✨ Simplified Explanation</h2>
                <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">AI Generated</span>
              </div>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                {document.simplifiedText}
              </div>
            </div>
          )}

          {/* Audio Player - Real TTS */}
          {document?.simplifiedText && (
            <div className="card">
              <h2 className="text-lg font-bold text-gray-800 mb-4">🔊 Listen to Summary</h2>
              <AudioPlayer
                text={document.simplifiedText}
                title="Document Audio Summary"
                language={document.language}
              />
              <p className="text-xs text-gray-500 mt-3">
                ✨ Powered by browser Text-to-Speech • Supports 11 Indian languages
              </p>
            </div>
          )}

          {/* Chat with Document */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <MessageCircle size={20} className="text-saffron" />
              Ask About This Document
            </h2>
            
            {document?.simplifiedText ? (
              <div className="space-y-3">
                <div className="max-h-60 overflow-y-auto space-y-3 mb-4">
                  {chatMessages.length === 0 && (
                    <div className="text-center py-4 text-gray-400 text-sm">
                      <AlertCircle size={24} className="mx-auto mb-2" />
                      Ask any question about this document
                    </div>
                  )}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] px-4 py-2 rounded-2xl text-sm bg-gray-100 text-gray-500 rounded-bl-none flex items-center gap-2">
                        <Loader2 className="animate-spin" size={14} /> Thinking...
                      </div>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                        msg.role === 'user'
                          ? 'bg-saffron text-white rounded-br-none'
                          : 'bg-gray-100 text-gray-700 rounded-bl-none'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                    placeholder="Ask anything about this document..."
                    disabled={chatLoading}
                    className="input-field flex-1"
                  />
                  <button onClick={handleChat} disabled={chatLoading} className="btn-primary px-4 disabled:opacity-50">
                    {chatLoading ? <Loader2 size={16} className="animate-spin" /> : 'Send'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <FileText size={32} className="mx-auto mb-2" />
                <p className="text-sm">Upload and simplify a document first to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
