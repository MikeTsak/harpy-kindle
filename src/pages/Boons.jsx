import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';

export default function Boons() {
  const [boons, setBoons] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form state
  const [fromSelect, setFromSelect] = useState('');
  const [fromCustom, setFromCustom] = useState('');
  const [toSelect, setToSelect] = useState('');
  const [toCustom, setToCustom] = useState('');
  const [level, setLevel] = useState('minor');
  const [desc, setDesc] = useState('');
  const [posting, setPosting] = useState(false);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBoons = () => {
    api.get('/boons').then(res => {
      setBoons(res.data.boons || []);
      setLoading(false);
    }).catch(err => {
      setError('FAILED TO FETCH BOON REGISTRY.');
      setLoading(false);
    });
  };

  const fetchRoster = () => {
    api.get('/camarilla/roster').then(res => {
      setRoster(res.data.roster || []);
    }).catch(err => console.error('Failed to load roster:', err));
  };

  useEffect(() => {
    fetchBoons();
    fetchRoster();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPosting(true);
    setError(null);
    
    const finalFromName = fromSelect === 'OTHER_CUSTOM' ? fromCustom : fromSelect;
    const finalToName = toSelect === 'OTHER_CUSTOM' ? toCustom : toSelect;
    
    if (!finalFromName || !finalToName) {
      setError('DEBTOR and CREDITOR names are required.');
      setPosting(false);
      return;
    }

    try {
      await api.post('/boons', {
        from_name: finalFromName,
        to_name: finalToName,
        level: level,
        status: 'owed',
        description: desc,
        from_id: null,
        to_id: null
      });
      setFromSelect('');
      setFromCustom('');
      setToSelect('');
      setToCustom('');
      setDesc('');
      fetchBoons();
    } catch (err) {
      setError(err.response?.data?.error || 'FAILED TO RECORD BOON.');
    } finally {
      setPosting(false);
    }
  };

  const filteredBoons = useMemo(() => {
    if (!searchQuery.trim()) return boons;
    const q = searchQuery.toLowerCase();
    return boons.filter(b => 
      (b.from_name || '').toLowerCase().includes(q) ||
      (b.to_name || '').toLowerCase().includes(q) ||
      (b.description || '').toLowerCase().includes(q) ||
      (b.level || '').toLowerCase().includes(q)
    );
  }, [boons, searchQuery]);

  return (
    <div className="container">
      <h2>BOON REGISTRY</h2>
      {error && <div className="error-message">ERROR: {error}</div>}

      {/* Boon Form */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3>[ RECORD NEW DEBT ]</h3>
        <form onSubmit={handleSubmit} style={{ marginTop: '15px' }}>
          
          <label style={{ fontWeight: 'bold' }}>DEBTOR (Owes)</label>
          <select 
            value={fromSelect} 
            onChange={e => setFromSelect(e.target.value)} 
            required
          >
            <option value="">-- SELECT KINDRED --</option>
            {roster.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
            <option value="OTHER_CUSTOM">NPC / Custom Name...</option>
          </select>
          {fromSelect === 'OTHER_CUSTOM' && (
            <input 
              type="text" 
              placeholder="Type NPC / Custom name..." 
              value={fromCustom} 
              onChange={e => setFromCustom(e.target.value)} 
              required 
            />
          )}

          <label style={{ fontWeight: 'bold' }}>CREDITOR (Is Owed)</label>
          <select 
            value={toSelect} 
            onChange={e => setToSelect(e.target.value)} 
            required
          >
            <option value="">-- SELECT KINDRED --</option>
            {roster.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
            <option value="OTHER_CUSTOM">NPC / Custom Name...</option>
          </select>
          {toSelect === 'OTHER_CUSTOM' && (
            <input 
              type="text" 
              placeholder="Type NPC / Custom name..." 
              value={toCustom} 
              onChange={e => setToCustom(e.target.value)} 
              required 
            />
          )}

          <label style={{ fontWeight: 'bold' }}>LEVEL</label>
          <select 
            value={level} 
            onChange={e => setLevel(e.target.value)} 
          >
            <option value="trivial">TRIVIAL</option>
            <option value="minor">MINOR</option>
            <option value="major">MAJOR</option>
            <option value="life">LIFE</option>
          </select>

          <label style={{ fontWeight: 'bold' }}>CIRCUMSTANCES / DESC</label>
          <input 
            type="text" 
            placeholder="Reason for debt..." 
            value={desc} 
            onChange={e => setDesc(e.target.value)} 
          />
          <button type="submit" disabled={posting} style={{ width: '100%', padding: '15px', marginTop: '10px' }}>
            {posting ? 'TRANSMITTING...' : 'COMMIT RECORD'}
          </button>
        </form>
      </div>

      <h3>[ ACTIVE RECORDS ]</h3>
      
      {/* Search Bar */}
      <input 
        type="text" 
        placeholder="Search boons by name, level, or description..." 
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{ marginBottom: '15px' }}
      />

      {loading ? (
        <p>ACCESSING DATABASE...</p>
      ) : filteredBoons.length === 0 ? (
        <p>NO RECORDS FOUND.</p>
      ) : (
        <div className="grid-menu" style={{ marginTop: '15px' }}>
          {filteredBoons.map(b => (
            <div key={b.id} className="card">
              <strong style={{ textDecoration: 'underline' }}>{String(b.level).toUpperCase()} BOON</strong>
              <span style={{ float: 'right' }}>[{String(b.status).toUpperCase()}]</span>
              <br/><br/>
              &gt; DEBTOR: {b.from_name}<br/>
              &gt; CREDITOR: {b.to_name}<br/>
              {b.description && <>&gt; NOTES: {b.description}<br/></>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
