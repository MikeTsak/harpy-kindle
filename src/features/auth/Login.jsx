import React, { useContext, useState } from 'react';
import { AuthCtx } from '../../AuthContext';

export default function Login() {
  const { login } = useContext(AuthCtx);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

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
