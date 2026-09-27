import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, MapPin, CheckCircle, Circle, Clock, ExternalLink, FileText, Star, TrendingUp, AlertTriangle } from 'lucide-react';
import { schemes, languages } from '../data/mockData';
import { AppContext } from '../App';
import AudioPlayer from '../components/AudioPlayer';

export default function SchemeDetail() {
  const { id } = useParams();
  const { user } = useContext(AppContext);
  const scheme = schemes.find((s) => s.id === id);
  
  const [selectedLang, setSelectedLang] = useState('en');
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [eligibilityScore, setEligibilityScore] = useState<{ score: number; matched: string[]; unmatched: string[]; explanation: string } | null>(null);
  const [loadingScore, setLoadingScore] = useState(false);
  const [faqs, setFaqs] = useState<{ q: string; a: string }[]>([]);

  useEffect(() => {
    if (scheme) {
      // Parse steps from application_process
      const steps = scheme.application_process.split('\n').filter(s => s.trim());
      
      // Mock FAQs
      setFaqs([
        { q: 'What is the last date to apply?', a: 'Applications are accepted on a rolling basis. However, it is recommended to apply as early as possible as funds are limited.' },
        { q: 'Can I apply if I am from another state?', a: scheme.state === 'All India' ? 'Yes, this is a central scheme available to all Indian citizens regardless of state.' : `This scheme is specific to ${scheme.state}. Residents of other states may not be eligible.` },
        { q: 'How long does it take to process?', a: 'Typically 30-45 days after submission of complete documents. You can track status online or at the concerned office.' },
      ]);
    }
  }, [scheme]);

  if (!scheme) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Scheme Not Found</h2>
        <Link to="/schemes" className="btn-primary mt-4 inline-block">Back to Schemes</Link>
      </div>
    );
  }

  const steps = scheme.application_process.split('\n').filter(s => s.trim()).map(s => s.replace(/^\d+\.\s*/, ''));
  const documents = scheme.documents_required.split(',').map(d => d.trim());

  // Build a spoken summary of the scheme
  const schemeSummary = scheme ? `${scheme.scheme_name}. This is a ${scheme.level} level scheme in ${scheme.state}, under the ${scheme.category} category. Benefits: ${scheme.benefits}. Eligibility: ${scheme.eligibility}. To apply: ${scheme.application_process.replace(/\n/g, '. ')}` : '';

  const toggleStep = (index: number) => {
    setCompletedSteps(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const checkEligibility = () => {
    setLoadingScore(true);
    setTimeout(() => {
      setEligibilityScore({
        score: 72,
        matched: ['Age is within eligible range', 'Residence criteria met', 'Category criteria met'],
        unmatched: ['Income may exceed limit', 'Some documents pending'],
        explanation: 'Based on your profile, you have a good chance of being eligible. However, please verify income criteria and ensure all documents are ready.',
      });
      setLoadingScore(false);
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <Link to="/schemes" className="inline-flex items-center gap-2 text-gray-600 hover:text-saffron mb-6 transition-colors">
        <ArrowLeft size={18} />
        Back to Schemes
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-xs px-2 py-1 bg-saffron/10 text-saffron rounded-full font-medium">
                  {scheme.category} • {scheme.level}
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-3">{scheme.scheme_name}</h1>
                <div className="flex items-center gap-2 text-gray-500 mt-2">
                  <MapPin size={16} />
                  <span>{scheme.state}</span>
                </div>
              </div>
            </div>

            {/* Audio Player - Real TTS */}
            <div className="mt-4">
              <AudioPlayer
                text={schemeSummary}
                title={`Listen: ${scheme.scheme_name}`}
                language={selectedLang}
              />
            </div>
          </div>

          {/* Benefits */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Star size={20} className="text-saffron" />
              Benefits
            </h2>
            <p className="text-gray-700 leading-relaxed">{scheme.benefits}</p>
          </div>

          {/* Eligibility */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <FileText size={20} className="text-green-india" />
              Eligibility Criteria
            </h2>
            <p className="text-gray-700 leading-relaxed">{scheme.eligibility}</p>
            
            {/* Eligibility Score */}
            {user && (
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={checkEligibility}
                  disabled={loadingScore}
                  className="btn-secondary flex items-center gap-2"
                >
                  {loadingScore ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <TrendingUp size={18} />
                  )}
                  Check My Eligibility
                </button>

                {eligibilityScore && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                        eligibilityScore.score >= 70 ? 'bg-green-100 text-green-700' :
                        eligibilityScore.score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {eligibilityScore.score}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">Eligibility Score</p>
                        <p className="text-sm text-gray-600">{eligibilityScore.explanation}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-green-700 mb-2">✓ Criteria Met:</p>
                        {eligibilityScore.matched.map((m, i) => (
                          <p key={i} className="text-sm text-gray-600 flex items-center gap-1">
                            <CheckCircle size={14} className="text-green-500" /> {m}
                          </p>
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-700 mb-2">✗ Criteria Not Met:</p>
                        {eligibilityScore.unmatched.map((m, i) => (
                          <p key={i} className="text-sm text-gray-600 flex items-center gap-1">
                            <AlertTriangle size={14} className="text-red-400" /> {m}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Application Steps */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={20} className="text-blue-500" />
              How to Apply — Step by Step
            </h2>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={index}
                  onClick={() => toggleStep(index)}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                    completedSteps.includes(index)
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {completedSteps.includes(index) ? (
                      <CheckCircle size={22} className="text-green-500" />
                    ) : (
                      <Circle size={22} className="text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${completedSteps.includes(index) ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                      Step {index + 1}: {step}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Progress: {completedSteps.length}/{steps.length} steps completed
              </p>
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${(completedSteps.length / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Documents Required */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-800 mb-3">📋 Documents Required</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {documents.map((doc, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <FileText size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-700">{doc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-3">Quick Info</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Level</dt>
                <dd className="font-medium text-gray-800">{scheme.level}</dd>
              </div>
              <div>
                <dt className="text-gray-500">State</dt>
                <dd className="font-medium text-gray-800">{scheme.state}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Category</dt>
                <dd className="font-medium text-gray-800">{scheme.category}</dd>
              </div>
            </dl>
            <a
              href={scheme.official_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 w-full btn-primary flex items-center justify-center gap-2"
            >
              <ExternalLink size={16} />
              Official Website
            </a>
          </div>

          {/* FAQs */}
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-3">❓ FAQs</h3>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <details key={i} className="group">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-saffron transition-colors">
                    {faq.q}
                  </summary>
                  <p className="text-sm text-gray-600 mt-2 pl-4 border-l-2 border-saffron/30">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>

          {/* Related Schemes */}
          <div className="card">
            <h3 className="font-bold text-gray-800 mb-3">Related Schemes</h3>
            <div className="space-y-2">
              {schemes
                .filter(s => s.id !== scheme.id && (s.category === scheme.category || s.state_code === scheme.state_code))
                .slice(0, 3)
                .map(s => (
                  <Link
                    key={s.id}
                    to={`/schemes/${s.id}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <p className="text-sm font-medium text-gray-700">{s.scheme_name}</p>
                    <p className="text-xs text-gray-400">{s.state}</p>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
