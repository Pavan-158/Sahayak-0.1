import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, createContext } from 'react';
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

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const sessionId = 'demo-session-' + Date.now();

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
