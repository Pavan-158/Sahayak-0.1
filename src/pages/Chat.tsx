import { useState, useRef, useEffect, useContext } from 'react';
import { Send, Mic, MicOff, Loader2, Volume2, Square, Plus, MessageSquare, Trash2, Menu, X, AlertCircle } from 'lucide-react';
import { schemes, states } from '../data/mockData';
import { speak, stopSpeaking } from '../services/audioService';
import { 
  startListening, 
  stopListening, 
  isSpeechRecognitionAvailable,
  isLanguageSupportedForRecognition 
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
        // Active chat is empty or doesn't exist, start new
        handleNewChat();
      }
    } else {
      // No active chat, start new
      handleNewChat();
    }
  }, []);

  // Save messages whenever they change
  useEffect(() => {
    if (currentChatId && messages.length > 0) {
      saveMessages(currentChatId, messages);
      // Refresh chat history to update titles
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
    setSidebarOpen(false); // Close sidebar on mobile
  };

  const handleSelectChat = (chatId: string) => {
    stopSpeaking();
    setSpeakingMsgIdx(null);
    
    const chat = getChat(chatId);
    if (chat) {
      setCurrentChatId(chat.id);
      setMessages(chat.messages);
      setActiveChatId(chat.id);
      setSidebarOpen(false); // Close sidebar on mobile
    }
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the chat
    
    if (confirm('Delete this chat?')) {
      deleteChat(chatId);
      
      // If deleted current chat, switch to another or create new
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
    
    // Check if user is asking about eligibility
    if (q.includes('eligib') || q.includes('qualify') || q.includes('eligible') || q.includes('check my')) {
      if (!user) {
        return `I'd love to check your eligibility! However, I don't have your profile details yet.\n\nPlease set up your profile first by:\n1. Click on **Profile** in the navigation menu\n2. Fill in your details (age, income, state, occupation, etc.)\n3. Save your profile\n4. Come back here and ask me to check your eligibility again!\n\nOr you can go directly to **My Alerts** to see schemes matched for you.`;
      }
      
      // User has profile - check eligibility based on their details
      const stateName = states.find(s => s.code === user.state)?.name || user.state;
      const matchedSchemes = schemes.filter(scheme => {
        // Check state match
        const stateMatch = scheme.state_code === 'ALL' || scheme.state_code === user.state;
        
        // Check category match with interests
        const interestMatch = user.interests.some(interest => 
          scheme.category.toLowerCase().includes(interest.toLowerCase()) ||
          interest.toLowerCase().includes(scheme.category.toLowerCase())
        );
        
        // Check income (rough heuristic)
        const incomeMatch = user.income < 500000;
        
        // Check age
        const ageMatch = user.age >= 18 && user.age <= 65;
        
        return stateMatch && (interestMatch || incomeMatch || ageMatch);
      }).slice(0, 5);
      
      if (matchedSchemes.length === 0) {
        return `Based on your profile:\n\n👤 **Name:** ${user.name}\n🎂 **Age:** ${user.age}\n📍 **State:** ${stateName}\n💰 **Income:** ₹${user.income.toLocaleString()}/year\n💼 **Occupation:** ${user.occupation}\n\nI couldn't find schemes that match your criteria right now. This could be because:\n• Your income might be above the limit for most schemes\n• The schemes in your state might have different eligibility criteria\n\nTry updating your interests in your profile, or browse the **Scheme Directory** to explore more options!`;
      }
      
      return `Great! Based on your profile, here are schemes you're likely eligible for:\n\n👤 **Your Profile:**\n• Age: ${user.age}\n• State: ${stateName}\n• Income: ₹${user.income.toLocaleString()}/year\n• Occupation: ${user.occupation}\n• Interests: ${user.interests.join(', ')}\n\n🎯 **Matched Schemes (${matchedSchemes.length}):**\n\n${matchedSchemes.map(s => `• **${s.scheme_name}** (${s.state})\n  Category: ${s.category}\n  ${s.benefits.substring(0, 100)}...\n  [View Details →](/schemes/${s.id})`).join('\n\n')}\n\n💡 **Next Steps:**\n• Click on any scheme to see full details and eligibility criteria\n• Check the **My Alerts** page for a complete list with eligibility scores\n• Use the step tracker to track your application progress`;
    }
    
    if (q.includes('scheme') && (q.includes('farmer') || q.includes('agriculture') || q.includes('kisan'))) {
      const farmerSchemes = schemes.filter(s => s.category === 'Agriculture');
      return `Here are some agriculture-related schemes for farmers:\n\n${farmerSchemes.map(s => `• **${s.scheme_name}** (${s.state})\n  ${s.benefits.substring(0, 100)}...`).join('\n\n')}\n\n${user ? `Based on your occupation (${user.occupation}), you might be eligible for these! Ask me to "check my eligibility" for more details.` : 'Would you like more details about any specific scheme?'}`;
    }
    
    if (q.includes('health') || q.includes('medical') || q.includes('insurance') || q.includes('ayushman')) {
      const healthSchemes = schemes.filter(s => s.category === 'Healthcare');
      return `Here are healthcare schemes available:\n\n${healthSchemes.map(s => `• **${s.scheme_name}** (${s.state})\n  Benefits: ${s.benefits.substring(0, 100)}...`).join('\n\n')}\n\n${user ? `I can check your eligibility for these based on your profile! Just ask me to "check my eligibility".` : 'I can help you check eligibility for any of these. Just tell me your age, income, and state!'}`;
    }
    
    if (q.includes('women') || q.includes('girl') || q.includes('lady')) {
      const womenSchemes = schemes.filter(s => s.category.includes('Women'));
      return `Here are schemes for women:\n\n${womenSchemes.map(s => `• **${s.scheme_name}** (${s.state})\n  ${s.benefits.substring(0, 100)}...`).join('\n\n')}\n\n${user && user.gender === 'female' ? `Based on your profile, you might be eligible for these! Ask me to "check my eligibility" to see which ones match.` : 'Would you like to know about eligibility for any of these?'}`;
    }
    
    if (q.includes('document') || q.includes('pdf') || q.includes('legal')) {
      return `I can help you with documents! Here's what I can do:\n\n📄 **Document Simplifier** - Upload any PDF or legal document and I'll:\n• Explain it in simple language (like explaining to a 10-year-old)\n• Translate it to your preferred Indian language\n• Generate an audio summary you can listen to\n• Answer any questions about the document\n\nGo to the "Document Simplifier" page to upload your document!`;
    }
    
    if (q.includes('hello') || q.includes('hi') || q.includes('namaste') || q.includes('namaskar')) {
      const greeting = user ? `Namaste ${user.name}! 🙏` : 'Namaste! 🙏';
      return `${greeting} How can I help you today? You can ask me about government schemes, upload documents for simplification, or check your eligibility for various programs.`;
    }
    
    if (q.includes('apply') || q.includes('application')) {
      return `I can guide you through the application process for any scheme! Here's how it works:\n\n1. **Choose a scheme** - Browse the Scheme Directory\n2. **Check eligibility** - I'll help you understand if you qualify\n3. **Step-by-step guide** - I'll break down the application process into simple steps\n4. **Track progress** - Mark steps as you complete them\n\nWhich scheme would you like to apply for?`;
    }

    const matchedScheme = schemes.find(s => 
      s.scheme_name.toLowerCase().includes(q) || 
      s.category.toLowerCase().includes(q)
    );
    
    if (matchedScheme) {
      return `I found a scheme that matches your query:\n\n**${matchedScheme.scheme_name}** (${matchedScheme.state})\n\n📋 **Category:** ${matchedScheme.category}\n💰 **Benefits:** ${matchedScheme.benefits.substring(0, 150)}...\n\n✅ **Eligibility:** ${matchedScheme.eligibility.substring(0, 150)}...\n\n${user ? `Would you like me to check your eligibility for this scheme? Just ask "check my eligibility".` : 'Would you like to see the full details, check your eligibility, or get the step-by-step application guide?'}`;
    }
    
    return `I understand you're asking about "${query}". Let me help you with that.\n\nI can assist you with:\n• 🏛️ **Government Schemes** - Browse by state, category, or check eligibility\n• 📄 **Document Simplification** - Upload PDFs for AI-powered explanation\n• 🗣️ **Voice Interaction** - Speak in your language\n• 📊 **Eligibility Check** - Get a score based on your profile\n\n${!user ? '💡 Tip: Set up your profile first to get personalized scheme recommendations!' : ''}\n\nCould you please be more specific about what you need help with?`;
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

  const handleVoiceInput = () => {
    if (isRecording) {
      // Stop listening
      stopListening();
      setIsRecording(false);
      setInterimTranscript('');
      return;
    }

    // Check if speech recognition is available
    if (!isSpeechRecognitionAvailable()) {
      setSpeechError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      setTimeout(() => setSpeechError(''), 5000);
      return;
    }

    // Check if selected language is supported
    if (!isLanguageSupportedForRecognition(chatLang)) {
      setSpeechError(`Speech recognition for this language is not supported. Try English or Hindi.`);
      setTimeout(() => setSpeechError(''), 5000);
      return;
    }

    // Clear previous errors
    setSpeechError('');
    setInterimTranscript('');
    setIsRecording(true);

    // Start listening with the selected language
    const started = startListening(
      chatLang,
      (text, isFinal) => {
        if (isFinal) {
          // Final transcription - send as message
          setInterimTranscript('');
          setIsRecording(false);
          
          const userMessage: ChatMessage = { 
            role: 'user', 
            content: text, 
            isVoice: true,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, userMessage]);
          
          // Get AI response
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
          // Interim result - show live transcription
          setInterimTranscript(text);
        }
      },
      (error) => {
        console.error('Speech recognition error:', error);
        setIsRecording(false);
        setInterimTranscript('');
        
        let errorMsg = 'Speech recognition failed. ';
        if (error === 'no-speech') {
          errorMsg += 'No speech was detected. Please try again.';
        } else if (error === 'audio-capture') {
          errorMsg += 'No microphone was found. Please check your microphone.';
        } else if (error === 'not-allowed') {
          errorMsg += 'Microphone access was denied. Please allow microphone access.';
        } else if (error === 'network') {
          errorMsg += 'Network error occurred. Please check your connection.';
        } else {
          errorMsg += `Error: ${error}`;
        }
        
        setSpeechError(errorMsg);
        setTimeout(() => setSpeechError(''), 5000);
      },
      () => {
        // Recognition ended
        setIsRecording(false);
        setInterimTranscript('');
      }
    );

    if (!started) {
      setIsRecording(false);
      setSpeechError('Failed to start speech recognition. Please try again.');
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
          <p className="text-gray-600">Chat with AI about schemes, documents, and eligibility — via text or voice</p>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex gap-4">
        {/* Sidebar - Chat History */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-72 flex-shrink-0`}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-20">
            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full p-4 bg-gradient-to-r from-saffron to-saffron-dark text-white font-semibold flex items-center justify-center gap-2 hover:from-saffron-dark hover:to-saffron transition-all"
            >
              <Plus size={20} />
              New Chat
            </button>

            {/* Chat List */}
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
                          title="Delete chat"
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

        {/* Main Chat Area */}
        <div className="flex-1 card flex flex-col h-[600px]">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>Start a conversation...</p>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`px-4 py-3 rounded-2xl ${
                      msg.role === 'user'
                        ? 'bg-saffron text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}>
                      {msg.isVoice && (
                        <span className="text-xs opacity-75 flex items-center gap-1 mb-1">
                          <Mic size={12} /> Voice input (transcribed)
                        </span>
                      )}
                      <div className="text-sm whitespace-pre-line">{msg.content}</div>
                    </div>
                    {msg.role === 'assistant' && (
                      <button 
                        onClick={() => handleSpeakMessage(msg.content, i)}
                        className={`mt-1 ml-2 transition-colors ${
                          speakingMsgIdx === i 
                            ? 'text-green-600 animate-pulse' 
                            : 'text-gray-400 hover:text-saffron'
                        }`}
                        title={speakingMsgIdx === i ? 'Stop speaking' : 'Listen to this message'}
                      >
                        {speakingMsgIdx === i ? <Square size={14} /> : <Volume2 size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Sahayak is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Speech Error */}
          {speechError && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-amber-800">{speechError}</span>
            </div>
          )}

          {/* Recording indicator with live transcription */}
          {isRecording && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-700">
                  🎤 Listening in {chatLang === 'en' ? 'English' : chatLang === 'hi' ? 'Hindi' : chatLang === 'ta' ? 'Tamil' : chatLang === 'te' ? 'Telugu' : chatLang === 'bn' ? 'Bengali' : chatLang === 'mr' ? 'Marathi' : chatLang === 'gu' ? 'Gujarati' : chatLang === 'kn' ? 'Kannada' : chatLang === 'ml' ? 'Malayalam' : chatLang === 'pa' ? 'Punjabi' : chatLang}...
                </span>
                <div className="flex-1 flex items-center justify-end gap-1">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-red-400 rounded-full animate-pulse"
                      style={{ height: `${10 + Math.random() * 16}px`, animationDelay: `${i * 0.15}s` }}
                    ></div>
                  ))}
                </div>
              </div>
              {interimTranscript && (
                <div className="mt-2 p-2 bg-white/60 rounded-lg">
                  <p className="text-sm text-gray-700 italic">
                    "{interimTranscript}"
                  </p>
                </div>
              )}
              {!interimTranscript && (
                <p className="text-xs text-red-600 mt-1">Speak now... (click mic to stop)</p>
              )}
            </div>
          )}

          {/* Input Area */}
          <div className="flex items-end gap-2 pt-3 border-t">
            <button
              onClick={handleVoiceInput}
              className={`p-3 rounded-full transition-all ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-100 text-gray-600 hover:bg-saffron hover:text-white'
              }`}
            >
              {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question or use voice..."
                rows={1}
                className="input-field resize-none"
              />
            </div>
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || isProcessing}
              className="btn-primary p-3 disabled:opacity-50"
            >
              <Send size={20} />
            </button>
          </div>

          {/* Quick actions + Language selector */}
          <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
            {['Schemes for farmers', 'Health schemes', 'Women schemes', 'How to apply?', 'Check my eligibility'].map((q) => (
              <button
                key={q}
                onClick={() => { setInput(q); }}
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
                title="Audio language for responses"
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
