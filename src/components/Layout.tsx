import { Outlet, Link, useLocation } from 'react-router-dom';
import { Menu, X, FileText, Landmark, User, MessageCircle, Bell, Home } from 'lucide-react';
import { useState } from 'react';

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/document', label: 'Document Simplifier', icon: FileText },
    { path: '/schemes', label: 'Schemes', icon: Landmark },
    { path: '/alerts', label: 'My Alerts', icon: Bell },
    { path: '/chat', label: 'Ask Sahayak', icon: MessageCircle },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-orange-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-saffron to-green-india rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Sahayak</h1>
                <p className="text-xs text-gray-500 -mt-1">Your Civic AI Assistant</p>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? 'bg-saffron/10 text-saffron'
                      : 'text-gray-600 hover:text-saffron hover:bg-gray-50'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive(item.path)
                    ? 'bg-saffron/10 text-saffron'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-bold mb-2">Sahayak</h3>
              <p className="text-gray-400 text-sm">
                AI-powered platform helping Indian citizens understand government schemes and legal documents in their local language.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">Powered By</h3>
              <ul className="text-gray-400 text-sm space-y-1">
                <li>🤖 Google Gemini (Free Tier)</li>
                <li>🗣️ AI4Bharat IndicTrans2</li>
                <li>🔊 Indic Parler-TTS</li>
                <li>👂 OpenAI Whisper</li>
                <li>🔍 FAISS Vector Search</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-2">For Tech Expo 2026</h3>
              <p className="text-gray-400 text-sm">
                100% Free & Open Source. Runs entirely on local machine. No paid APIs required.
              </p>
              <div className="mt-3 flex gap-2">
                <span className="px-2 py-1 bg-green-900/50 text-green-300 text-xs rounded">Python</span>
                <span className="px-2 py-1 bg-blue-900/50 text-blue-300 text-xs rounded">FastAPI</span>
                <span className="px-2 py-1 bg-purple-900/50 text-purple-300 text-xs rounded">React</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-500 text-sm">
            © 2026 Sahayak — Made with ❤️ for Indian Citizens
          </div>
        </div>
      </footer>
    </div>
  );
}
