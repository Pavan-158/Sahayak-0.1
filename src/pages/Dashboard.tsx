import { Link } from 'react-router-dom';
import { FileText, Landmark, MessageCircle, Mic, Bell, ArrowRight, Sparkles, Shield, Globe } from 'lucide-react';
import { schemes, states } from '../data/mockData';

export default function Dashboard() {
  const stats = [
    { label: 'Government Schemes', value: `${schemes.length}+`, icon: Landmark, color: 'text-saffron' },
    { label: 'States Covered', value: `${states.length}`, icon: Globe, color: 'text-green-india' },
    { label: 'Languages Supported', value: '11', icon: MessageCircle, color: 'text-navy' },
    { label: 'AI Models Used', value: '6', icon: Sparkles, color: 'text-purple-600' },
  ];

  const features = [
    {
      title: 'Document Simplifier',
      description: 'Upload any PDF or legal document and get a simplified explanation in your language with audio summary.',
      icon: FileText,
      link: '/document',
      color: 'from-orange-500 to-amber-500',
    },
    {
      title: 'Scheme Directory',
      description: 'Browse government schemes by state, check eligibility, and get step-by-step application guidance.',
      icon: Landmark,
      link: '/schemes',
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Ask Sahayak (AI Chat)',
      description: 'Ask questions about schemes or documents using text or voice. Get instant AI-powered answers.',
      icon: MessageCircle,
      link: '/chat',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      title: 'Personalized Alerts',
      description: 'Set up your profile and get notified about schemes you are eligible for based on your details.',
      icon: Bell,
      link: '/alerts',
      color: 'from-purple-500 to-pink-500',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-saffron/5 via-white to-green-india/5 py-16 md:py-24">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 bg-saffron rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-green-india rounded-full blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-saffron/10 rounded-full text-saffron text-sm font-medium mb-6">
              <Shield size={16} />
              <span>100% Free & Open Source • Runs Locally</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Your AI-Powered
              <span className="bg-gradient-to-r from-saffron to-green-india bg-clip-text text-transparent"> Civic Assistant</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              Understand government schemes, simplify legal documents, and get guidance in your local language — all powered by free AI models running on your machine.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/schemes" className="btn-primary inline-flex items-center justify-center gap-2 text-lg">
                <Landmark size={20} />
                Browse Schemes
              </Link>
              <Link to="/document" className="btn-outline inline-flex items-center justify-center gap-2 text-lg">
                <FileText size={20} />
                Simplify a Document
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="card text-center">
              <stat.icon size={28} className={`${stat.color} mx-auto mb-2`} />
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How Sahayak Helps You</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Four powerful modules designed to make government services accessible to every Indian citizen.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.title}
              to={feature.link}
              className="card group hover:scale-[1.02] transition-transform duration-200"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center flex-shrink-0`}>
                  <feature.icon size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-saffron transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                  <span className="inline-flex items-center gap-1 text-saffron text-sm font-medium mt-3 group-hover:gap-2 transition-all">
                    Explore <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Voice Feature Highlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-gradient-to-r from-navy to-navy-light rounded-2xl p-8 md:p-12 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm mb-4">
                <Mic size={16} />
                Voice-First Interaction
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Can't Read? Just Speak!
              </h2>
              <p className="text-white/80 mb-6">
                Sahayak supports voice input in multiple Indian languages. Just speak your question and get instant answers about schemes, eligibility, and application processes. Powered by OpenAI Whisper for accurate speech recognition.
              </p>
              <Link to="/chat" className="btn-primary inline-flex items-center gap-2">
                <Mic size={18} />
                Try Voice Chat
              </Link>
            </div>
            <div className="w-48 h-48 md:w-64 md:h-64 bg-white/10 rounded-full flex items-center justify-center">
              <div className="w-32 h-32 md:w-44 md:h-44 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
                <Mic size={48} className="text-white/80" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Built with Free & Open Source AI</h2>
          <p className="text-gray-600 text-sm mt-2">No paid APIs. Runs entirely on your local machine.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {['Google Gemini (Free)', 'AI4Bharat IndicTrans2', 'Indic Parler-TTS', 'OpenAI Whisper', 'FAISS', 'FastAPI', 'SQLite', 'pdfplumber'].map((tech) => (
            <span key={tech} className="px-4 py-2 bg-white rounded-full shadow-sm text-sm font-medium text-gray-700 border border-gray-100">
              {tech}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
