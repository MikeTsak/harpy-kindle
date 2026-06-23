import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';

export default function Reputation() {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [redListOnly, setRedListOnly] = useState(false);

  useEffect(() => {
    const cached = localStorage.getItem('harpy_roster_cache');
    if (cached) {
      setRoster(JSON.parse(cached));
      setLoading(false);
    }

    // Attempt to fetch camarilla roster
    api.get('/camarilla/roster').then(res => {
      const data = res.data.roster || [];
      setRoster(data);
      localStorage.setItem('harpy_roster_cache', JSON.stringify(data));
      setLoading(false);
    }).catch(err => {
      if (!cached) setError('ACCESS DENIED. INSUFFICIENT CLEARANCE.');
      setLoading(false);
    });
  }, []);

  const filteredRoster = useMemo(() => {
    let filtered = roster;
    
    if (redListOnly) {
      filtered = filtered.filter(m => m.is_bloodhunted);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(m => 
        (m.name || '').toLowerCase().includes(q) ||
        (m.clan || '').toLowerCase().includes(q) ||
        (m.titles || []).some(t => t.toLowerCase().includes(q))
      );
    }
    
    return filtered;
  }, [roster, searchQuery, redListOnly]);

  return (
    <div className="container">
      <h2>[ STATUS & REPUTATION DIRECTORY ]</h2>
      {error && <div className="error-message">ERROR: {error}</div>}

      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input 
          type="checkbox" 
          id="redListToggle"
          checked={redListOnly}
          onChange={e => setRedListOnly(e.target.checked)}
          style={{ width: '25px', height: '25px', cursor: 'pointer' }}
        />
        <label htmlFor="redListToggle" style={{ fontWeight: 'bold', fontSize: '20px', cursor: 'pointer', color: redListOnly ? 'red' : 'inherit' }}>
          SHOW RED LIST (BLOODHUNTED) ONLY
        </label>
      </div>

      <input 
        type="text" 
        placeholder="Search directory by name, clan, or title..." 
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{ marginBottom: '15px' }}
      />

      {loading && roster.length === 0 ? (
        <p>SCANNING DOMAIN RECORDS...</p>
      ) : filteredRoster.length === 0 ? (
        <p>NO KINDRED DETECTED.</p>
      ) : (
        <div style={{ marginTop: '20px' }}>
          {filteredRoster.map(member => (
            <div key={`${member.type}-${member.id}`} className="card" style={{ borderLeft: member.is_bloodhunted ? '4px solid red' : '4px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '24px', color: member.is_bloodhunted ? 'red' : 'inherit' }}>
                  {member.titles?.length > 0 ? `${member.titles[0]} ` : ''}{member.name}
                </strong>
                <span style={{ fontSize: '24px' }}>
                  {"●".repeat(member.status || 1)}{"○".repeat(5 - (member.status || 1))}
                </span>
              </div>
              <div style={{ marginTop: '10px' }}>
                &gt; CLAN: {member.clan || 'UNKNOWN'}<br/>
                {member.titles?.length > 1 && <>&gt; TITLES: {member.titles.join(', ')}<br/></>}
                {member.is_bloodhunted && <><strong style={{ color: 'red' }}>&gt; WARNING: ACTIVE BLOOD HUNT</strong><br/></>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
