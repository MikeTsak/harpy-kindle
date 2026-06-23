import React, { useState, useEffect } from 'react';
import api from '../api';

export default function Boons() {
  const [boons, setBoons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Placeholder for fetching boons
    api.get('/boons').then(res => {
      setBoons(res.data.boons || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="container">
      <h2>BOON TRACKER</h2>
      {loading ? (
        <p>LOADING...</p>
      ) : boons.length === 0 ? (
        <p>NO BOONS RECORDED.</p>
      ) : (
        <div className="grid-menu">
          {boons.map(b => (
            <div key={b.id} className="card">
              <strong>{b.type.toUpperCase()} BOON</strong><br/>
              Owed by: {b.debtor_name}<br/>
              Owed to: {b.creditor_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
