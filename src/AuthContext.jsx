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
    // The session cookie is httpOnly — there's nothing for JS to check
    // before asking the server whether we're logged in, so always ask.
    loadMe();
  }, []);

  const login = async (email, password) => {
    await api.post('/auth/login', { email, password }); // server sets the httpOnly cookie
    await loadMe();
  };

  const logout = async () => {
    try {
      // Clears the httpOnly cookie server-side — JS can't clear it itself.
      await api.post('/auth/logout');
    } catch (e) {
      // Even if the request fails, drop the client-side session state below.
    }
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthCtx.Provider>
  );
}
