import { useState, useEffect, useRef } from 'react';
import { X, Mic, Keyboard, Globe, Check } from 'lucide-react';
import { languages } from '../data/mockData';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string, language: string) => void;
  initialLanguage?: string;
  reason?: string;
}

// Common phrases in different Indian languages to help users
const PHRASE_SUGGESTIONS: Record<string, string[]> = {
  en: [
    'What schemes are available for farmers?',
    'Check my eligibility',
    'Tell me about health schemes',
    'How to apply for PM Kisan?',
  ],
  hi: [
    'किसानों के लिए क्या योजनाएं हैं?',
    'मेरी पात्रता जांचें',
    'स्वास्थ्य योजनाओं के बारे में बताएं',
    'मैं कैसे आवेदन करूं?',
  ],
  ta: [
    'விவசாயிகளுக்கான திட்டங்கள் என்ன?',
    'எனது தகுதியை சரிபார்க்கவும்',
    'சுகாதார திட்டங்களை பற்றி சொல்லுங்கள்',
  ],
  te: [
    'రైతుల కోసం ఏ పథకాలు ఉన్నాయి?',
    'నా అర్హతను తనిఖీ చేయండి',
    'ఆరోగ్య పథకాల గురించి చెప్పండి',
  ],
  bn: [
    'কৃষকদের জন্য কোন প্রকল্প আছে?',
    'আমার যোগ্যতা পরীক্ষা করুন',
    'স্বাস্থ্য প্রকল্প সম্পর্কে বলুন',
  ],
  mr: [
    'शेतकऱ्यांसाठी कोणत्या योजना आहेत?',
    'माझी पात्रता तपासा',
    'आरोग्य योजनांबद्दल सांगा',
  ],
  gu: [
    'ખેડૂતો માટે કઈ યોજનાઓ છે?',
    'મારી પાત્રતા ચકાસો',
    'આરોગ્ય યોજનાઓ વિશે જણાવો',
  ],
  kn: [
    'ರೈತರಿಗೆ ಯಾವ ಯೋಜನೆಗಳಿವೆ?',
    'ನನ್ನ ಅರ್ಹತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ',
  ],
  ml: [
    'കർഷകർക്ക് എന്തൊക്കെ പദ്ധതികളുണ്ട്?',
    'എന്റെ യോഗ്യത പരിശോധിക്കുക',
  ],
  pa: [
    'ਕਿਸਾਨਾਂ ਲਈ ਕੀ ਯੋਜਨਾਵਾਂ ਹਨ?',
    'ਮੇਰੀ ਯੋਗਤਾ ਦੀ ਜਾਂਚ ਕਰੋ',
  ],
};

export default function VoiceInputModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  initialLanguage = 'en',
  reason 
}: VoiceInputModalProps) {
  const [text, setText] = useState('');
  const [selectedLang, setSelectedLang] = useState(initialLanguage);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setText('');
      setSelectedLang(initialLanguage);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen, initialLanguage]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim(), selectedLang);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const suggestions = PHRASE_SUGGESTIONS[selectedLang] || PHRASE_SUGGESTIONS['en'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b bg-gradient-to-r from-saffron/5 to-green-india/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-saffron rounded-full flex items-center justify-center">
              <Keyboard size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Type in Your Language</h2>
              <p className="text-xs text-gray-600">
                {reason === 'http' 
                  ? 'Voice input needs HTTPS. Type your question instead!' 
                  : 'Type your question in any Indian language'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            <X size={20} />
          </button>
        </div>

        {/* Language Selector */}
        <div className="p-5 border-b">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Globe size={16} />
            Select your language:
          </label>
          <div className="flex flex-wrap gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setSelectedLang(lang.code)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedLang === lang.code
                    ? 'bg-saffron text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        {/* Text Input */}
        <div className="p-5">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              selectedLang === 'hi' ? 'यहाँ अपना सवाल लिखें...' :
              selectedLang === 'ta' ? 'உங்கள் கேள்வியை இங்கே எழுதவும்...' :
              selectedLang === 'te' ? 'మీ ప్రశ్నను ఇక్కడ టైప్ చేయండి...' :
              'Type your question here...'
            }
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-saffron focus:ring-2 focus:ring-saffron/20 outline-none resize-none text-lg"
            style={{
              fontFamily: selectedLang === 'en' ? 'inherit' : 'inherit',
            }}
          />
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>

        {/* Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="px-5 pb-3">
            <button
              onClick={() => setShowSuggestions(false)}
              className="text-xs text-gray-500 hover:text-gray-700 mb-2 flex items-center gap-1"
            >
              💡 Try these example phrases:
            </button>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((phrase, i) => (
                <button
                  key={i}
                  onClick={() => setText(phrase)}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-sm transition-colors"
                >
                  {phrase}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="p-5 border-t bg-gray-50">
          <button
            onClick={handleSubmit}
            disabled={!text.trim()}
            className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed py-3 text-lg"
          >
            <Check size={20} />
            Send Question
          </button>
          <p className="text-xs text-gray-500 text-center mt-2">
            Your question will be processed as voice input
          </p>
        </div>
      </div>
    </div>
  );
}
