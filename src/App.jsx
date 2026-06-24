import React, { useContext, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import AuthProvider, { AuthCtx } from './AuthContext';
import Login from './features/auth/Login';

// Pages
import Dashboard from './pages/Dashboard';
import Boons from './pages/Boons';
import Reputation from './pages/Reputation';
import ElysiumFeed from './pages/ElysiumFeed';
import Domains from './pages/Domains';
import Secrets from './pages/Secrets';

function PrivateHarpyRoute({ children }) {
  const { user, loading, logout } = useContext(AuthCtx);
  const [menuOpen, setMenuOpen] = useState(false);
  
  if (loading) return <div className="container"><h2>LOADING...</h2></div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ borderBottom: '2px solid var(--border-color)', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-color)', fontWeight: 'bold', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/img/bw-kindle-logo.png" alt="Erebus Logo" style={{ height: '70px', imageRendering: 'pixelated' }} />
          EREBUS [HARPY NODE]
        </Link>
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ fontWeight: 'bold', background: 'none', border: 'none', color: 'var(--text-color)', fontSize: '20px', cursor: 'pointer', textDecoration: 'underline', padding: '10px' }}
          >
            {(user.character?.name || user.display_name || '').split(' ')[0].toUpperCase()} ▼
          </button>
          {menuOpen && (
            <div className="card" style={{ position: 'absolute', right: 0, top: '100%', padding: '10px', zIndex: 100, minWidth: '150px', marginTop: '10px' }}>
              <button 
                onClick={() => { setMenuOpen(false); logout(); }}
                style={{ width: '100%', padding: '15px' }}
              >
                LOG OUT
              </button>
            </div>
          )}
        </div>
      </header>
      <main style={{ flexGrow: 1, paddingBottom: '40px' }}>
        {children}
      </main>
      <footer style={{ borderTop: '2px solid var(--border-color)', padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
        --- [ NODE OPERATOR: GIANNAKIS ] ---
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateHarpyRoute><Dashboard /></PrivateHarpyRoute>} />
          <Route path="/boons" element={<PrivateHarpyRoute><Boons /></PrivateHarpyRoute>} />
          <Route path="/reputation" element={<PrivateHarpyRoute><Reputation /></PrivateHarpyRoute>} />
          <Route path="/elysium" element={<PrivateHarpyRoute><ElysiumFeed /></PrivateHarpyRoute>} />
          <Route path="/domains" element={<PrivateHarpyRoute><Domains /></PrivateHarpyRoute>} />
          <Route path="/secrets" element={<PrivateHarpyRoute><Secrets /></PrivateHarpyRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
