import React, { useContext, useState } from 'react';
import { AuthCtx } from '../../AuthContext';
import { useNavigate } from 'react-router-dom';
import SchreckNetBoot from './SchreckNetBoot';

export default function Login() {
  const { login, user } = useContext(AuthCtx);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [booting, setBooting] = useState(false);
  // Snapshot the user data we need for the boot screen at the moment of login
  const [bootUser, setBootUser] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const loggedIn = await login(email, password);
      // `user` in context may not have updated yet — read from context after
      // login() resolves (AuthContext calls loadMe() inside login()).
      // We grab what we need from context after the await.
      setBooting(true);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Called when the boot animation finishes (or is skipped)
  const handleBootDone = () => {
    navigate('/');
  };

  // Show the terminal boot screen after successful login
  if (booting) {
    // Pull character data from context (populated by loadMe inside login())
    const characterName  = user?.character?.name  || user?.display_name || 'UNKNOWN';
    const characterTitle = user?.character?.position || user?.character?.rank || 'KINDRED';

    return (
      <SchreckNetBoot
        characterName={characterName}
        characterTitle={characterTitle}
        onDone={handleBootDone}
      />
    );
  }

  return (
    <div className="container">
      <h1>Harpy Dashboard Login</h1>
      {error && <div className="error-message">ERROR: {error}</div>}
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email"><strong>EMAIL ADDRESS</strong></label>
          <input 
            id="email" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div>
          <label htmlFor="password"><strong>PASSWORD</strong></label>
          <input 
            id="password" 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '20px', fontSize: '24px' }}>
          {loading ? 'AUTHENTICATING...' : 'LOG IN'}
        </button>
      </form>
    </div>
  );
}
