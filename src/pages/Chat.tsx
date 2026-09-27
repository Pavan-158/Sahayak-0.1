import { useState, useRef, useEffect, useContext } from 'react';
import { Send, Mic, MicOff, Loader2, Volume2, Square, Plus, MessageSquare, Trash2, Menu, X, AlertCircle, Info } from 'lucide-react';
import { schemes, states } from '../data/mockData';
import { speak, stopSpeaking } from '../services/audioService';
import { 
  startListening, 
  stopListening, 
  isSpeechRecognitionAvailable,
  isLanguageSupportedForRecognition,
  isSecureContext
} from '../services/speechRecognition';
import { AppContext } from '../App';
import { 
  getAllChats, 
  getChat, 
  createNewChat, 
  saveMessages, 
  deleteChat, 
  getActiveChatId, 
  setActiveChatId,
  formatChatTime,
  type ChatSession,
  type ChatMessage 
} from '../services/chatStorage';

export default function Chat() {
  const { user } = useContext(AppContext);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [speakingMsgIdx, setSpeakingMsgIdx] = useState<number | null>(null);
  const [chatLang, setChatLang] = useState('en');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Welcome message - personalized if user has profile
  const getWelcomeMessage = (): ChatMessage => {
    if (user) {
      const stateName = states.find(s => s.code === user.state)?.name || user.state;
      return {
        role: 'assistant',
        content: `Namaste ${user.name}! 🙏\n\nI can see your profile:\n• Age: ${user.age}\n• State: ${stateName}\n• Occupation: ${user.occupation}\n• Income: ₹${user.income.toLocaleString()}/year\n\nI can now check your eligibility for schemes! Just ask me:\n• "Check my eligibility"\n• "What schemes am I eligible for?"\n• "Schemes for farmers" (or your occupation)\n\nOr I can help with:\n• Explaining legal documents in simple language\n• Guiding you through application processes\n• Answering questions in your preferred language (${user.language})\n\nWhat would you like to know?`,
        timestamp: Date.now(),
      };
    }
    
    return {
      role: 'assistant',
      content: 'Namaste! 🙏 I am Sahayak, your AI civic assistant. I can help you with:\n\n• Finding government schemes you are eligible for\n• Explaining legal documents in simple language\n• Guiding you through application processes\n• Answering questions about eligibility\n\n💡 **Tip:** Set up your profile first to get personalized scheme recommendations!\n\nYou can type your question or use the microphone to speak. I support multiple Indian languages!',
      timestamp: Date.now(),
    };
  };
  
  const WELCOME_MESSAGE = getWelcomeMessage();

  // Initialize: load chat history and active chat
  useEffect(() => {
    const history = getAllChats();
    setChatHistory(history);
    
    const activeId = getActiveChatId();
    if (activeId) {
      const chat = getChat(activeId);
      if (chat && chat.messages.length > 0) {
        setCurrentChatId(chat.id);
        setMessages(chat.messages);
      } else {
        handleNewChat();
      }
    } else {
      handleNewChat();
    }
  }, []);

  // Save messages whenever they change
  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      saveMessages(currentChatId, messages);
      setChatHistory(getAllChats());
    }
  }, [messages, currentChatId]);

  const handleNewChat = () => {
    stopSpeaking();
    setSpeakingMsgIdx(null);
    
    const newChat = createNewChat();
    setCurrentChatId(newChat.id);
    setMessages([WELCOME_MESSAGE]);
    setChatHistory(getAllChats());
    setSidebarOpen(false);
  };

  const handleSelectChat = (chatId: string) => {
    stopSpeaking();
    setSpeakingMsgIdx(null);
    
    const chat = getChat(chatId);
    if (chat) {
      setCurrentChatId(chat.id);
      setMessages(chat.messages);
      setActiveChatId(chat.id);
      setSidebarOpen(false);
    }
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (confirm('Delete this chat?')) {
      deleteChat(chatId);
      
      if (chatId === currentChatId) {
        const remaining = getAllChats();
        if (remaining.length > 0) {
          handleSelectChat(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
      
      setChatHistory(getAllChats());
    }
  };

  const handleSpeakMessage = (text: string, idx: number) => {
    if (speakingMsgIdx === idx) {
      stopSpeaking();
      setSpeakingMsgIdx(null);
    } else {
      stopSpeaking();
      setSpeakingMsgIdx(idx);
      speak(text, chatLang, undefined, () => setSpeakingMsgIdx(null), 0.9);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getAIResponse = (query: string): string => {
    const q = query.toLowerCase();
    
    if (q.includes('eligib') || q.includes('qualify') || q.includes('eligible') || q.includes('check my')) {
      if (!user) {
        return `I'd love to check your eligibility! However, I don't have your profile details yet.\n\nPlease set up your profile first by:\n1. Click on **Profile** in the navigation menu\n2. Fill in your details (age, income, state, occupation, etc.)\n3. Save your profile\n4. Come back here and ask me to check your eligibility again!\n\nOr you can go directly to **My Alerts** to see schemes matched for you.`;
      }
      
      const stateName = states.find(s => s.code === user.state)?.name || user.state;
      const matchedSchemes = schemes.filter(scheme => {
        const stateMatch = scheme.state_code === 'ALL' || scheme.state_code === user.state;
        const interestMatch = user.interests.some(interest => 
          scheme.category.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(scheme.category.toLowerCase())
        );
        const incomeMatch = user.income < 500000;
        const ageMatch = user.age >= 18 && user.age <= 65;
        
        return stateMatch && (interestMatch || incomeMatch || ageMatch);
      }).slice(0, 5);
      
      if (matchedSchemes.length === 0) {
        return `Based on your profile:\n\n👤 **Name:** ${user.name}\n🎂 **Age:** ${user.age}\n📍 **State:** ${stateName}\n💰 **Income:** ₹${user.income.toLocaleString()}/year\n\nI couldn't find schemes that match your criteria right now. Try updating your interests in your profile, or browse the **Scheme Directory** to explore more options!`;
      }
      
      return `Great! Based on your profile, here are schemes you're likely eligible for:\n\n👤 **Your Profile:**\n• Age: ${user.age}\n• State: ${stateName}\n• Income: ₹${user.income.toLocaleString()}/year\n• Occupation: ${user.occupation}\n\n🎯 **Matched Schemes (${matchedSchemes.length}):**\n\n${matchedSchemes.map(s => `• **${s.scheme_name}** (${s.state})\n  Category: ${s.category}\n  ${s.benefits.substring(0, 100)}...`).join('\n\n')}\n\n💡 **Next Steps:**\n• Click on any scheme to see full details\n• Check the **My Alerts** page for complete list with scores\n• Use the step tracker for application progress`;
    }
    
    if (q.includes('scheme') && (q.includes('farmer') || q.includes('agriculture') || q.includes('kisan'))) {
      const farmerSchemes = schemes.filter(s => s.category === 'Agriculture');
      return `Here are agriculture-related schemes for farmers:\n\n${farmerSchemes.map(s => `• **${s.scheme_name}** (${s.state})\n  ${s.benefits.substring(0, 100)}...`).join('\n\n')}\n\n${user ? `Based on your occupation (${user.occupation}), you might be eligible! Ask me to "check my eligibility".` : 'Would you like more details?'}`;
    }
    
    if (q.includes('health') || q.includes('medical') || q.includes('insurance') || q.includes('ayushman')) {
      const healthSchemes = schemes.filter(s => s.category === 'Healthcare');
      return `Here are healthcare schemes:\n\n${healthSchemes.map(s => `• **${s.scheme_name}** (${s.state})\n  Benefits: ${s.benefits.substring(0, 100)}...`).join('\n\n')}\n\n${user ? 'I can check your eligibility! Just ask "check my eligibility".' : 'Tell me your age, income, and state to check eligibility!'}`;
    }
    
    if (q.includes('women') || q.includes('girl') || q.includes('lady')) {
      const womenSchemes = schemes.filter(s => s.category.includes('Women'));
      return `Here are schemes for women:\n\n${womenSchemes.map(s => `• **${s.scheme_name}** (${s.state})\n  ${s.benefits.substring(0, 100)}...`).join('\n\n')}`;
    }
    
    if (q.includes('hello') || q.includes('hi') || q.includes('namaste') || q.includes('namaskar')) {
      const greeting = user ? `Namaste ${user.name}! 🙏` : 'Namaste! 🙏';
      return `${greeting} How can I help you today?`;
    }

    return `I can help you with:\n• 🏛️ Government Schemes\n• 📄 Document Simplification\n• 📊 Eligibility Check\n• 🗣️ Voice Interaction\n\nWhat would you like to know?`;
  };

  const handleSend = () => {
    if (!input.trim() || !currentChatId) return;
    
    const userMessage: ChatMessage = { 
      role: 'user', 
      content: input,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    
    setTimeout(() => {
      const response = getAIResponse(input);
      const assistantMessage: ChatMessage = { 
        role: 'assistant', 
        content: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsProcessing(false);
      scrollToBottom();
    }, 1000 + Math.random() * 1000);
  };

  const handleVoiceInput = async () => {
    if (isRecording) {
      stopListening();
      setIsRecording(false);
      setInterimTranscript('');
      return;
    }

    // Check prerequisites
    if (!isSecureContext()) {
      setSpeechError('⚠️ Voice input requires HTTPS. Please run the app locally with "npm run dev" or deploy with HTTPS.');
      setTimeout(() => setSpeechError(''), 10000);
      return;
    }

    if (!isSpeechRecognitionAvailable()) {
      setSpeechError('Speech recognition not supported. Please use Chrome or Edge browser.');
      setTimeout(() => setSpeechError(''), 8000);
      return;
    }

    if (!isLanguageSupportedForRecognition(chatLang)) {
      setSpeechError(`Language not supported for speech. Try English or Hindi.`);
      setTimeout(() => setSpeechError(''), 5000);
      return;
    }

    setSpeechError('');
    setInterimTranscript('');
    setIsRecording(true);

    const started = await startListening(
      chatLang,
      (text, isFinal) => {
        if (isFinal) {
          setInterimTranscript('');
          setIsRecording(false);
          
          const userMessage: ChatMessage = { 
            role: 'user', 
            content: text, 
            isVoice: true,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, userMessage]);
          
          setIsProcessing(true);
          setTimeout(() => {
            const response = getAIResponse(text);
            const assistantMessage: ChatMessage = {
              role: 'assistant',
              content: response,
              timestamp: Date.now()
            };
            setMessages(prev => [...prev, assistantMessage]);
            setIsProcessing(false);
            scrollToBottom();
          }, 1000);
        } else {
          setInterimTranscript(text);
        }
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setIsRecording(false);
        setInterimTranscript('');
        setSpeechError(error);
        setTimeout(() => setSpeechError(''), 8000);
      },
      () => {
        setIsRecording(false);
        setInterimTranscript('');
      }
    );

    if (!started) {
      setIsRecording(false);
      setSpeechError('Failed to start. Check microphone permissions.');
      setTimeout(() => setSpeechError(''), 5000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">💬 Ask Sahayak</h1>
          <p className="text-gray-600">Chat with AI about schemes, documents, and eligibility</p>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Voice Input Instructions */}
      {!isSecureContext() && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 mb-1">🎤 Voice Input Setup</p>
              <p className="text-sm text-amber-800 mb-2">
                Voice input requires a secure connection (HTTPS). To enable voice input:
              </p>
              <div className="bg-amber-100 rounded-lg p-3 text-xs text-amber-900 font-mono">
                <p className="mb-1">Run locally:</p>
                <code className="block bg-white px-2 py-1 rounded">npm run dev</code>
                <p className="mt-2">Then open: <strong>http://localhost:5173</strong></p>
              </div>
              <p className="text-xs text-amber-700 mt-2">
                ✅ You can still chat by typing below!
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-72 flex-shrink-0`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-20">
            <button
              onClick={handleNewChat}
              className="w-full p-4 bg-gradient-to-r from-saffron to-saffron-dark text-white font-semibold flex items-center justify-center gap-2 hover:from-saffron-dark hover:to-saffron transition-all"
            >
              <Plus size={20} />
              New Chat
            </button>

            <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
              {chatHistory.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-sm">
                  No chat history yet
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {chatHistory.map((chat) => (
                    <div
                      key={chat.id}
                      onClick={() => handleSelectChat(chat.id)}
                      className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors group ${
                        chat.id === currentChatId ? 'bg-saffron/5 border-l-4 border-saffron' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <MessageSquare size={14} className="text-gray-400 flex-shrink-0" />
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {chat.title}
                            </p>
                          </div>
                          <p className="text-xs text-gray-500">
                            {formatChatTime(chat.updatedAt)} • {chat.messages.length} messages
                          </p>
                        </div>
                        <button
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 card flex flex-col h-[600px]">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%]`}>
                  <div className={`px-4 py-3 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-saffron text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    {msg.isVoice && (
                      <span className="text-xs opacity-75 flex items-center gap-1 mb-1">
                        <Mic size={12} /> Voice input
                      </span>
                    )}
                    <div className="text-sm whitespace-pre-line">{msg.content}</div>
                  </div>
                  {msg.role === 'assistant' && (
                    <button 
                      onClick={() => handleSpeakMessage(msg.content, i)}
                      className={`mt-1 ml-2 transition-colors ${
                        speakingMsgIdx === i ? 'text-green-600' : 'text-gray-400 hover:text-saffron'
                      }`}
                    >
                      {speakingMsgIdx === i ? <Square size={14} /> : <Volume2 size={14} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <Loader2 size={16} className="animate-spin text-gray-500" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error Message */}
          {speechError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-red-800">{speechError}</span>
            </div>
          )}

          {/* Recording Indicator */}
          {isRecording && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-700">
                  🎤 Listening in {chatLang === 'en' ? 'English' : chatLang === 'hi' ? 'Hindi' : chatLang}...
                </span>
              </div>
              {interimTranscript && (
                <div className="mt-2 p-2 bg-white/60 rounded-lg">
                  <p className="text-sm text-gray-700 italic">"{interimTranscript}"</p>
                </div>
              )}
            </div>
          )}

          {/* Input Area */}
          <div className="flex items-end gap-2 pt-3 border-t">
            <button
              onClick={handleVoiceInput}
              title={isRecording ? 'Stop recording' : 'Click to speak'}
              className={`p-3 rounded-full transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-100 text-gray-600 hover:bg-saffron hover:text-white'
              }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question here..."
              rows={1}
              className="input-field resize-none flex-1"
            />
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className="btn-primary p-3 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
            {['Check my eligibility', 'Schemes for farmers', 'Health schemes', 'Women schemes'].map((q) => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="px-3 py-1.5 bg-gray-50 hover:bg-saffron/10 hover:text-saffron rounded-full text-xs font-medium text-gray-600 transition-all"
              >
                {q}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1.5">
              <Volume2 size={14} className="text-gray-400" />
              <select
                value={chatLang}
                onChange={(e) => setChatLang(e.target.value)}
                className="text-xs border rounded px-2 py-1 bg-white"
              >
                <option value="en">🔊 English</option>
                <option value="hi">🔊 हिंदी</option>
                <option value="ta">🔊 தமிழ்</option>
                <option value="te">🔊 తెలుగు</option>
                <option value="bn">🔊 বাংলা</option>
                <option value="mr">🔊 मराठी</option>
                <option value="gu">🔊 ગુજરાતી</option>
                <option value="kn">🔊 ಕನ್ನಡ</option>
                <option value="ml">🔊 മലയാളം</option>
                <option value="pa">🔊 ਪੰਜਾਬੀ</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
