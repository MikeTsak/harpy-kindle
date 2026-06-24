import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';

export default function Boons() {
  const [boons, setBoons] = useState([]);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPaid, setShowPaid] = useState(false);

  // Form state
  const [fromSelect, setFromSelect] = useState('');
  const [fromCustom, setFromCustom] = useState('');
  const [toSelect, setToSelect] = useState('');
  const [toCustom, setToCustom] = useState('');
  const [level, setLevel] = useState('minor');
  const [desc, setDesc] = useState('');
  const [posting, setPosting] = useState(false);
  const [settling, setSettling] = useState(null);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBoons = () => {
    api.get('/boons').then(res => {
      const fetchedBoons = res.data.boons || [];
      setBoons(fetchedBoons);
      localStorage.setItem('harpy_boons_cache', JSON.stringify(fetchedBoons));
      setLoading(false);
    }).catch(err => {
      setError('FAILED TO FETCH BOON REGISTRY.');
      setLoading(false);
    });
  };

  const fetchRoster = () => {
    api.get('/camarilla/roster').then(res => {
      const rosterData = res.data.roster || [];
      setRoster(rosterData);
      localStorage.setItem('harpy_roster_cache', JSON.stringify(rosterData));
    }).catch(err => console.error('Failed to load roster:', err));
  };

  useEffect(() => {
    // Attempt cache load first
    const boonsCache = localStorage.getItem('harpy_boons_cache');
    if (boonsCache) {
      setBoons(JSON.parse(boonsCache));
      setLoading(false);
    }
    const rosterCache = localStorage.getItem('harpy_roster_cache');
    if (rosterCache) {
      setRoster(JSON.parse(rosterCache));
    }

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

  const handleSettleBoon = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to mark this boon as ${newStatus}?`)) return;
    setSettling(id);
    try {
      await api.patch(`/boons/${id}`, { status: newStatus });
      fetchBoons();
    } catch (err) {
      setError('FAILED TO UPDATE BOON STATUS.');
    } finally {
      setSettling(null);
    }
  };

  const filteredBoons = useMemo(() => {
    let q = searchQuery.trim().toLowerCase();
    
    let filtered = showPaid 
      ? boons.filter(b => (b.status || '').toLowerCase() === 'paid')
      : boons.filter(b => (b.status || '').toLowerCase() === 'owed');

    if (q) {
      filtered = filtered.filter(b => 
        (b.from_name || '').toLowerCase().includes(q) ||
        (b.to_name || '').toLowerCase().includes(q) ||
        (b.description || '').toLowerCase().includes(q) ||
        (b.level || '').toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [boons, searchQuery, showPaid]);

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

      <h3>[ {showPaid ? 'PAID RECORDS' : 'ACTIVE RECORDS'} ]</h3>

      {/* Search Bar & Toggle */}
      <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Search boons by name, level, or description..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, marginBottom: 0 }}
        />
        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input 
            type="checkbox" 
            checked={showPaid} 
            onChange={e => setShowPaid(e.target.checked)} 
            style={{ width: 'auto', marginBottom: 0 }}
          />
          Show Paid
        </label>
      </div>

      {loading && boons.length === 0 ? (
        <p>ACCESSING DATABASE...</p>
      ) : filteredBoons.length === 0 ? (
        <p>NO {showPaid ? 'PAID' : 'ACTIVE'} BOONS FOUND.</p>
      ) : (
        <div className="grid-menu" style={{ marginTop: '15px', marginBottom: '30px' }}>
          {filteredBoons.map(b => (
            <div key={b.id} className="card" style={{ paddingBottom: '10px' }}>
              <strong style={{ textDecoration: 'underline' }}>{String(b.level).toUpperCase()} BOON</strong>
              <span style={{ float: 'right' }}>[{String(b.status).toUpperCase()}]</span>
              <br/><br/>
              &gt; DEBTOR: {b.from_name}<br/>
              &gt; CREDITOR: {b.to_name}<br/>
              {b.description && <>&gt; NOTES: {b.description}<br/></>}
              
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                {(b.status || '').toLowerCase() === 'owed' ? (
                  <>
                    <button 
                      onClick={() => handleSettleBoon(b.id, 'paid')}
                      disabled={settling === b.id}
                      style={{ flex: 1, padding: '10px', fontSize: '16px' }}
                    >
                      SETTLE DEBT
                    </button>
                    <button 
                      onClick={() => handleSettleBoon(b.id, 'excused')}
                      disabled={settling === b.id}
                      style={{ flex: 1, padding: '10px', fontSize: '16px', background: '#eee', color: '#000' }}
                    >
                      EXCUSE DEBT
                    </button>
                  </>
                ) : (
                  <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: '#eee', color: '#555', border: '1px solid #ccc' }}>
                    ALREADY {String(b.status).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
