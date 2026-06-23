import React, { useContext } from 'react';
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
  const { user, loading } = useContext(AuthCtx);
  
  if (loading) return <div className="container"><h2>LOADING...</h2></div>;
  if (!user) return <Navigate to="/login" replace />;
  
  // Optional: check if user is admin or harpy
  // if (user.role !== 'admin' && user.role !== 'harpy') return <div className="container">ACCESS DENIED</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ borderBottom: '2px solid var(--border-color)', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'var(--text-color)', fontWeight: 'bold', fontSize: '24px', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/img/pixel-logo.png" alt="Erebus Logo" style={{ height: '50px', imageRendering: 'pixelated' }} />
          EREBUS [HARPY NODE]
        </Link>
        <span style={{ fontWeight: 'bold' }}>{user.display_name?.toUpperCase()}</span>
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
