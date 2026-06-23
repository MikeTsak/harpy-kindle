import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';

export default function Reputation() {
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Attempt to fetch camarilla roster
    api.get('/camarilla/roster').then(res => {
      setRoster(res.data.roster || []);
      setLoading(false);
    }).catch(err => {
      setError('ACCESS DENIED. INSUFFICIENT CLEARANCE.');
      setLoading(false);
    });
  }, []);

  const filteredRoster = useMemo(() => {
    if (!searchQuery.trim()) return roster;
    const q = searchQuery.toLowerCase();
    return roster.filter(m => 
      (m.name || '').toLowerCase().includes(q) ||
      (m.clan || '').toLowerCase().includes(q) ||
      (m.titles || []).some(t => t.toLowerCase().includes(q))
    );
  }, [roster, searchQuery]);

  return (
    <div className="container">
      <h2>[ STATUS & REPUTATION DIRECTORY ]</h2>
      {error && <div className="error-message">ERROR: {error}</div>}

      <input 
        type="text" 
        placeholder="Search directory by name, clan, or title..." 
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{ marginBottom: '15px' }}
      />

      {loading ? (
        <p>SCANNING DOMAIN RECORDS...</p>
      ) : filteredRoster.length === 0 ? (
        <p>NO KINDRED DETECTED.</p>
      ) : (
        <div style={{ marginTop: '20px' }}>
          {filteredRoster.map(member => (
            <div key={`${member.type}-${member.id}`} className="card" style={{ borderLeft: '4px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '24px' }}>
                  {member.titles?.length > 0 ? `${member.titles[0]} ` : ''}{member.name}
                </strong>
                <span style={{ fontSize: '24px' }}>
                  {"●".repeat(member.status || 1)}{"○".repeat(5 - (member.status || 1))}
                </span>
              </div>
              <div style={{ marginTop: '10px' }}>
                &gt; CLAN: {member.clan || 'UNKNOWN'}<br/>
                {member.titles?.length > 1 && <>&gt; TITLES: {member.titles.join(', ')}<br/></>}
                {member.is_bloodhunted && <>&gt; WARNING: ACTIVE BLOOD HUNT<br/></>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
