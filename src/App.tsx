import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, createContext, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DocumentSimplifier from './pages/DocumentSimplifier';
import SchemeDirectory from './pages/SchemeDirectory';
import SchemeDetail from './pages/SchemeDetail';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Alerts from './pages/Alerts';

export interface UserProfile {
  name: string;
  age: number;
  income: number;
  state: string;
  occupation: string;
  interests: string[];
  language: string;
  gender: string;
  category: string;
}

interface AppContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  sessionId: string;
}

export const AppContext = createContext<AppContextType>({
  user: null,
  setUser: () => {},
  sessionId: 'demo-session',
});

const PROFILE_STORAGE_KEY = 'sahayak_user_profile';

function App() {
  // Load profile from localStorage on mount
  const [user, setUserState] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Error loading profile:', e);
      return null;
    }
  });
  
  const sessionId = 'demo-session-' + Date.now();

  // Wrapper for setUser that also saves to localStorage
  const setUser = (newUser: UserProfile | null) => {
    setUserState(newUser);
    try {
      if (newUser) {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(newUser));
      } else {
        localStorage.removeItem(PROFILE_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Error saving profile:', e);
    }
  };

  return (
    <AppContext.Provider value={{ user, setUser, sessionId }}>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="document" element={<DocumentSimplifier />} />
            <Route path="schemes" element={<SchemeDirectory />} />
            <Route path="schemes/:id" element={<SchemeDetail />} />
            <Route path="profile" element={<Profile />} />
            <Route path="chat" element={<Chat />} />
            <Route path="alerts" element={<Alerts />} />
          </Route>
        </Routes>
      </Router>
    </AppContext.Provider>
  );
}

export default App;
