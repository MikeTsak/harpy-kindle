import React, { createContext, useEffect, useState } from 'react';
import api from './api';

export const AuthCtx = createContext(null);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      const { data } = await api.get('/auth/me');
      let character = null;
      try {
        const charRes = await api.get('/characters/me');
        character = charRes.data.character;
      } catch (err) {}
      setUser({ ...data.user, character });
    } catch { 
      setUser(null); 
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    if (localStorage.getItem('token')) {
      loadMe();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token); 
    await loadMe();
  };

  const logout = () => { 
    localStorage.removeItem('token'); 
    setUser(null); 
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}
