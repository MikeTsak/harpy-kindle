import React, { useState, useEffect, useMemo, useContext } from 'react';
import api from '../api';
import { AuthCtx } from '../AuthContext';

function checkIsHarpy(user) {
  if (!user) return false;
  if (user.role === 'admin' || user.role === 'courtuser') return true;

  const rawTitles = user.character?.camarilla_titles || user.character?.titles;
  let titles = [];
  if (Array.isArray(rawTitles)) {
    titles = rawTitles;
  } else if (typeof rawTitles === 'string' && rawTitles.trim()) {
    try {
      const parsed = JSON.parse(rawTitles);
      if (Array.isArray(parsed)) titles = parsed;
      else if (typeof parsed === 'string') titles = [parsed];
    } catch {
      titles = rawTitles.split(',').map(s => s.trim()).filter(Boolean);
    }
  }

  return titles.some(t => typeof t === 'string' && t.toLowerCase().includes('harpy'));
}

export default function Reputation() {
  const { user } = useContext(AuthCtx);
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [redListOnly, setRedListOnly] = useState(false);
  const [canManageStatus, setCanManageStatus] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const isHarpy = canManageStatus || checkIsHarpy(user);

  useEffect(() => {
    const cached = localStorage.getItem('harpy_roster_cache');
    if (cached) {
      try {
        setRoster(JSON.parse(cached));
        setLoading(false);
      } catch (err) {
        console.error('Failed to parse cached roster', err);
      }
    }

    // Fetch camarilla roster
    api.get('/camarilla/roster').then(res => {
      const data = res.data.roster || [];
      setRoster(data);
      if (res.data.is_harpy !== undefined) {
        setCanManageStatus(Boolean(res.data.is_harpy));
      }
      localStorage.setItem('harpy_roster_cache', JSON.stringify(data));
      setLoading(false);
    }).catch(err => {
      if (!cached) setError('ACCESS DENIED: INSUFFICIENT CLEARANCE');
      setLoading(false);
    });
  }, []);

  const handleUpdateStatus = async (member, targetStatus) => {
    const clamped = Math.max(0, Math.min(5, targetStatus));
    const current = typeof member.status === 'number' ? member.status : (parseInt(member.status, 10) || 0);
    if (clamped === current) return;

    const memberKey = `${member.type}:${member.id}`;
    const previousRoster = [...roster];
    const updatedRoster = roster.map(m => 
      (m.id === member.id && m.type === member.type) ? { ...m, status: clamped } : m
    );

    setRoster(updatedRoster);
    localStorage.setItem('harpy_roster_cache', JSON.stringify(updatedRoster));
    setUpdatingId(memberKey);
    setError(null);

    try {
      await api.patch('/camarilla/status', {
        id: member.id,
        type: member.type,
        status: clamped
      });
    } catch (err) {
      setRoster(previousRoster);
      localStorage.setItem('harpy_roster_cache', JSON.stringify(previousRoster));
      const errMsg = err.response?.data?.error || 'Failed to update status';
      setError(errMsg);
    } finally {
      setUpdatingId(null);
    }
  };

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

      <div className="card" style={{ padding: '10px 14px', marginBottom: '15px', fontWeight: 'bold' }}>
        {isHarpy 
          ? '[ CLEARANCE: HARPY STATUS UPDATER ACTIVE ]' 
          : '[ CLEARANCE: DIRECTORY READ ONLY ]'}
      </div>

      <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input 
          type="checkbox" 
          id="redListToggle"
          checked={redListOnly}
          onChange={e => setRedListOnly(e.target.checked)}
          style={{ width: '25px', height: '25px', cursor: 'pointer', marginBottom: 0 }}
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
          {filteredRoster.map(member => {
            const memberKey = `${member.type}:${member.id}`;
            const isUpdating = updatingId === memberKey;
            const currentStatus = typeof member.status === 'number' ? member.status : (parseInt(member.status, 10) || 0);
            const clampedStatus = Math.max(0, Math.min(5, currentStatus));

            return (
              <div 
                key={memberKey} 
                className="card" 
                style={{ borderLeft: member.is_bloodhunted ? '4px solid red' : '4px solid var(--border-color)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '24px', color: member.is_bloodhunted ? 'red' : 'inherit' }}>
                    {member.titles?.length > 0 ? `${member.titles[0]} ` : ''}{member.name}
                  </strong>
                  <span style={{ fontSize: '24px', letterSpacing: '2px' }}>
                    {"●".repeat(clampedStatus)}{"○".repeat(5 - clampedStatus)}
                  </span>
                </div>

                <div style={{ marginTop: '10px' }}>
                  &gt; CLAN: {member.clan || 'UNKNOWN'}<br/>
                  {member.titles?.length > 1 && <>&gt; TITLES: {member.titles.join(', ')}<br/></>}
                  {member.is_bloodhunted && <><strong style={{ color: 'red' }}>&gt; WARNING: ACTIVE BLOOD HUNT</strong><br/></>}
                </div>

                {isHarpy && (
                  <div style={{ marginTop: '15px', paddingTop: '12px', borderTop: '2px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <strong style={{ fontSize: '18px' }}>UPDATE STATUS:</strong>
                      <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                        {isUpdating ? 'UPDATING...' : `CURRENT: ${clampedStatus} OF 5`}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(member, clampedStatus - 1)}
                        disabled={isUpdating || clampedStatus <= 0}
                        style={{
                          flex: '1 1 90px',
                          minHeight: '48px',
                          padding: '10px 12px',
                          fontSize: '18px',
                          marginBottom: 0
                        }}
                      >
                        LOWER
                      </button>

                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'nowrap' }}>
                        {[0, 1, 2, 3, 4, 5].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleUpdateStatus(member, val)}
                            disabled={isUpdating}
                            style={{
                              width: '42px',
                              height: '48px',
                              minWidth: '42px',
                              minHeight: '48px',
                              padding: 0,
                              margin: 0,
                              fontSize: '18px',
                              fontWeight: clampedStatus === val ? 'bold' : 'normal',
                              backgroundColor: clampedStatus === val ? 'var(--text-color)' : 'var(--bg-color)',
                              color: clampedStatus === val ? 'var(--bg-color)' : 'var(--text-color)',
                              border: '2px solid var(--border-color)',
                              borderRadius: '4px'
                            }}
                          >
                            {val}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(member, clampedStatus + 1)}
                        disabled={isUpdating || clampedStatus >= 5}
                        style={{
                          flex: '1 1 90px',
                          minHeight: '48px',
                          padding: '10px 12px',
                          fontSize: '18px',
                          marginBottom: 0
                        }}
                      >
                        RAISE
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
