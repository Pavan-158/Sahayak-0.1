import { useState, useRef } from 'react';
import { Upload, FileText, Loader2, Volume2, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { languages } from '../data/mockData';
import AudioPlayer from '../components/AudioPlayer';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading('extracting');
    
    // Simulate PDF extraction
    setTimeout(() => {
      setDocument({
        id: 'doc-' + Date.now(),
        name: file.name,
        originalText: `NOTICE UNDER SECTION 138 OF NEGOTIABLE INSTRUMENTS ACT, 1881

To: Mr. Rajesh Kumar
Date: 15th January 2026

Subject: Demand Notice for Dishonour of Cheque

Dear Sir,

Under instruction from our client, M/s. Sharma Enterprises Pvt. Ltd., we hereby serve upon you this statutory notice under Section 138 of the Negotiable Instruments Act, 1881.

Our client had supplied goods worth Rs. 5,00,000/- (Rupees Five Lakhs Only) to your firm as per invoice No. SE/2025/1234 dated 1st December 2025. In discharge of the said liability, you issued Cheque No. 456789 dated 15th December 2025 drawn on State Bank of India, Main Branch, Delhi for Rs. 5,00,000/-.

The said cheque was presented for encashment but was returned dishonoured with the endorsement "Funds Insufficient" by the bank on 20th December 2025.

We hereby demand that you pay the said amount of Rs. 5,00,000/- to our client within 15 days from the receipt of this notice. Failing which, our client shall be constrained to initiate criminal proceedings against you under Section 138 of the Negotiable Instruments Act, which is punishable with imprisonment for a term which may extend to two years, or with fine which may extend to twice the amount of the cheque, or with both.`,
        simplifiedText: '',
        language: selectedLang,
        status: 'uploaded',
      });
      setLoading(null);
    }, 1500);
  };

  const handleSimplify = () => {
    if (!document) return;
    setLoading('simplifying');
    
    setTimeout(() => {
      setDocument({
        ...document,
        simplifiedText: `📋 **What This Document Says (Simple Version)**

Someone named Sharma Enterprises is saying that you (Rajesh Kumar) owe them ₹5,00,000 (5 lakh rupees) for goods they delivered to you.

**What happened:**
• You bought goods worth ₹5 lakhs from them
• You gave them a cheque (a bank payment paper) for ₹5 lakhs
• When they tried to cash the cheque, the bank said "Not enough money in the account"
• So the cheque "bounced" (was rejected by the bank)

**What they want:**
• They want you to pay them ₹5 lakhs within 15 days
• They are sending this as a formal legal warning

**What happens if you don't pay:**
• They can take you to court
• You could face up to 2 years in jail
• Or you might have to pay a fine up to ₹10 lakhs (double the amount)
• Or both jail AND fine

**What you should do:**
1. Talk to a lawyer immediately
2. Try to arrange the payment within 15 days
3. Or try to settle with Sharma Enterprises directly
4. Don't ignore this notice — it's a serious legal matter

⚠️ **Important:** This is a legal demand notice. Please consult a lawyer for proper advice.`,
        status: 'simplified',
      });
      setLoading(null);
    }, 2000);
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

  const handleChat = () => {
    if (!chatInput.trim()) return;
    
    const userMsg = { role: 'user', content: chatInput };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    
    setTimeout(() => {
      let response = '';
      if (chatInput.toLowerCase().includes('pay') || chatInput.toLowerCase().includes('money')) {
        response = 'Based on the document, you need to pay ₹5,00,000 to Sharma Enterprises within 15 days. If you cannot pay the full amount, consider negotiating a settlement or consulting a lawyer about payment options. Ignoring this notice could lead to criminal proceedings under Section 138 of the NI Act.';
      } else if (chatInput.toLowerCase().includes('jail') || chatInput.toLowerCase().includes('punishment')) {
        response = 'The punishment under Section 138 of the Negotiable Instruments Act can be: up to 2 years imprisonment, OR a fine up to twice the cheque amount (₹10 lakhs), OR both. However, this only applies if the case goes to court and you are found guilty. Many cases are settled before reaching court.';
      } else {
        response = 'Based on the document analysis: This is a legal demand notice under Section 138 of the Negotiable Instruments Act regarding a bounced cheque of ₹5,00,000. You have 15 days to make the payment. I recommend consulting a lawyer for specific legal advice. Would you like me to explain any specific part of this document?';
      }
      setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📄 Document Simplifier</h1>
        <p className="text-gray-600">Upload any legal document or PDF and get a simplified explanation in your language</p>
      </div>

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
                    placeholder="Ask about this document..."
                    className="input-field flex-1"
                  />
                  <button onClick={handleChat} className="btn-primary px-4">
                    Send
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
