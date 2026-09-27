import { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Bell, MapPin, ArrowRight, UserPlus, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { AppContext } from '../App';
import { schemes, states } from '../data/mockData';

export default function Alerts() {
  const { user } = useContext(AppContext);

  const matchedSchemes = useMemo(() => {
    if (!user) return [];
    
    return schemes
      .map(scheme => {
        let score = 50; // base score
        const matched: string[] = [];
        const unmatched: string[] = [];

        // State matching
        if (scheme.state_code === 'ALL' || scheme.state_code === user.state) {
          score += 15;
          matched.push('State criteria met');
        } else {
          score -= 20;
          unmatched.push('Not in eligible state');
        }

        // Category matching based on interests
        const interestMatch = user.interests.some(i => 
          scheme.category.toLowerCase().includes(i.toLowerCase()) ||
          i.toLowerCase().includes(scheme.category.toLowerCase())
        );
        if (interestMatch) {
          score += 15;
          matched.push('Matches your interests');
        }

        // Income check
        if (user.income < 500000) {
          score += 10;
          matched.push('Income within eligible range');
        } else if (user.income > 800000) {
          score -= 10;
          unmatched.push('Income may exceed limit');
        }

        // Age check
        if (user.age >= 18 && user.age <= 65) {
          score += 5;
          matched.push('Age is eligible');
        }

        // Occupation matching
        if (user.occupation === 'Farmer' && scheme.category === 'Agriculture') {
          score += 15;
          matched.push('Perfect for your occupation');
        }
        if (user.occupation === 'Student' && scheme.category === 'Education') {
          score += 15;
          matched.push('Perfect for students');
        }

        // Category bonus
        if (user.category !== 'general' && scheme.category === 'Education') {
          score += 10;
          matched.push('Reservation benefit applicable');
        }

        score = Math.max(0, Math.min(100, score));

        return { ...scheme, score, matched, unmatched };
      })
      .filter(s => s.score >= 50)
      .sort((a, b) => b.score - a.score);
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="card max-w-md mx-auto">
          <div className="w-16 h-16 bg-saffron/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus size={32} className="text-saffron" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Up Your Profile</h2>
          <p className="text-gray-600 mb-6">
            Create your profile to get personalized scheme recommendations based on your age, income, state, and interests.
          </p>
          <Link to="/profile" className="btn-primary inline-flex items-center gap-2">
            <UserPlus size={18} />
            Create Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🔔 Personalized Alerts</h1>
        <p className="text-gray-600">
          Schemes matched for you based on your profile ({user.name || 'User'} from {states.find(s => s.code === user.state)?.name})
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card text-center">
          <TrendingUp size={24} className="text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">{matchedSchemes.length}</div>
          <p className="text-sm text-gray-500">Schemes Matched</p>
        </div>
        <div className="card text-center">
          <CheckCircle size={24} className="text-saffron mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">
            {matchedSchemes.filter(s => s.score >= 75).length}
          </div>
          <p className="text-sm text-gray-500">High Match (75%+)</p>
        </div>
        <div className="card text-center">
          <Bell size={24} className="text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-800">
            {matchedSchemes.filter(s => s.score >= 75).length}
          </div>
          <p className="text-sm text-gray-500">New Recommendations</p>
        </div>
      </div>

      {/* Matched Schemes */}
      {matchedSchemes.length > 0 ? (
        <div className="space-y-4">
          {matchedSchemes.map((scheme) => (
            <Link
              key={scheme.id}
              to={`/schemes/${scheme.id}`}
              className="card group hover:border-saffron/30 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Score */}
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0 ${
                  scheme.score >= 75 ? 'bg-green-100 text-green-700' :
                  scheme.score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {scheme.score}%
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-saffron transition-colors">
                        {scheme.scheme_name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <MapPin size={14} />
                        {scheme.state} • {scheme.category}
                      </div>
                    </div>
                    <ArrowRight size={20} className="text-gray-300 group-hover:text-saffron transition-colors" />
                  </div>

                  <p className="text-sm text-gray-600 mt-2 line-clamp-1">{scheme.benefits}</p>

                  {/* Match criteria */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {scheme.matched.slice(0, 3).map((m, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                        <CheckCircle size={10} />
                        {m}
                      </span>
                    ))}
                    {scheme.unmatched.slice(0, 2).map((m, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-red-50 text-red-600 rounded-full">
                        <AlertCircle size={10} />
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Bell size={40} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No matches found</h3>
          <p className="text-gray-600">Try updating your interests or profile to find more schemes</p>
        </div>
      )}

      {/* Profile info */}
      <div className="card mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">Based on your profile:</h3>
            <p className="text-sm text-gray-600 mt-1">
              {user.age} years old • {user.occupation} • {states.find(s => s.code === user.state)?.name} • ₹{user.income.toLocaleString()}/year • Interests: {user.interests.join(', ')}
            </p>
          </div>
          <Link to="/profile" className="btn-outline text-sm">
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
