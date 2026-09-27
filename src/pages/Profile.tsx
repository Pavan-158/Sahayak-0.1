import { useState, useContext } from 'react';
import { Save, CheckCircle, User as UserIcon } from 'lucide-react';
import { AppContext, UserProfile } from '../App';
import { states, languages, occupations, interests } from '../data/mockData';

export default function Profile() {
  const { user, setUser } = useContext(AppContext);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<UserProfile>({
    name: user?.name || '',
    age: user?.age || 25,
    income: user?.income || 300000,
    state: user?.state || 'UP',
    occupation: user?.occupation || 'Farmer',
    interests: user?.interests || ['Agriculture', 'Healthcare'],
    language: user?.language || 'hi',
    gender: user?.gender || 'male',
    category: user?.category || 'general',
  });

  const toggleInterest = (interest: string) => {
    setForm(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  const handleSave = () => {
    setUser(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">👤 Your Profile</h1>
        <p className="text-gray-600">Set up your profile to get personalized scheme recommendations and eligibility alerts</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter your name"
              className="input-field"
            />
          </div>

          {/* Age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: parseInt(e.target.value) || 0 })}
              className="input-field"
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="input-field"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="input-field"
            >
              {states.map((state) => (
                <option key={state.code} value={state.code}>{state.name}</option>
              ))}
            </select>
          </div>

          {/* Income */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Annual Family Income (₹)</label>
            <input
              type="number"
              value={form.income}
              onChange={(e) => setForm({ ...form, income: parseInt(e.target.value) || 0 })}
              className="input-field"
            />
          </div>

          {/* Occupation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
            <select
              value={form.occupation}
              onChange={(e) => setForm({ ...form, occupation: e.target.value })}
              className="input-field"
            >
              {occupations.map((occ) => (
                <option key={occ} value={occ}>{occ}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input-field"
            >
              <option value="general">General</option>
              <option value="obc">OBC</option>
              <option value="sc">SC</option>
              <option value="st">ST</option>
              <option value="ews">EWS</option>
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Language</label>
            <select
              value={form.language}
              onChange={(e) => setForm({ ...form, language: e.target.value })}
              className="input-field"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Interests */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Areas of Interest</label>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <button
                key={interest}
                onClick={() => toggleInterest(interest)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  form.interests.includes(interest)
                    ? 'bg-saffron text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 flex items-center gap-4">
          <button onClick={handleSave} className="btn-primary flex items-center gap-2">
            <Save size={18} />
            Save Profile
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-green-600 text-sm">
              <CheckCircle size={16} />
              Profile saved successfully!
            </span>
          )}
        </div>
      </div>

      {/* Profile Preview */}
      {user && (
        <div className="card mt-6">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <UserIcon size={18} />
            Current Profile Summary
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-medium">{user.name || 'Not set'}</p>
            </div>
            <div>
              <p className="text-gray-500">Age</p>
              <p className="font-medium">{user.age}</p>
            </div>
            <div>
              <p className="text-gray-500">State</p>
              <p className="font-medium">{states.find(s => s.code === user.state)?.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Income</p>
              <p className="font-medium">₹{user.income.toLocaleString()}/year</p>
            </div>
            <div>
              <p className="text-gray-500">Occupation</p>
              <p className="font-medium">{user.occupation}</p>
            </div>
            <div>
              <p className="text-gray-500">Category</p>
              <p className="font-medium uppercase">{user.category}</p>
            </div>
            <div>
              <p className="text-gray-500">Language</p>
              <p className="font-medium">{languages.find(l => l.code === user.language)?.name}</p>
            </div>
            <div>
              <p className="text-gray-500">Interests</p>
              <p className="font-medium">{user.interests.join(', ')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
