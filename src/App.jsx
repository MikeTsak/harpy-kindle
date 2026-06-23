import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import AuthProvider, { AuthCtx } from './AuthContext';
import Login from './features/auth/Login';

// Placeholder Pages
import Dashboard from './pages/Dashboard';
import Boons from './pages/Boons';
import Reputation from './pages/Reputation';
import ElysiumFeed from './pages/ElysiumFeed';

function PrivateHarpyRoute({ children }) {
  const { user, loading } = useContext(AuthCtx);
  
  if (loading) return <div className="container"><h2>LOADING...</h2></div>;
  if (!user) return <Navigate to="/login" replace />;
  
  // Optional: check if user is admin or harpy
  // if (user.role !== 'admin' && user.role !== 'harpy') return <div className="container">ACCESS DENIED</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ borderBottom: '4px solid #000', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#000', fontWeight: 'bold', fontSize: '24px' }}>
          HARPY.NET
        </Link>
        <span style={{ fontWeight: 'bold' }}>{user.display_name?.toUpperCase()}</span>
      </header>
      <main style={{ flexGrow: 1 }}>
        {children}
      </main>
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
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
