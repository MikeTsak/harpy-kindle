import React, { useState, useEffect } from 'react';

export default function Secrets() {
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState('ALL SECRETS SECURE');

  useEffect(() => {
    // Load from local storage on mount
    const saved = localStorage.getItem('harpy_secrets_ledger');
    if (saved) {
      setContent(saved);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setContent(val);
    setSaveStatus('SAVING...');
    
    // Save to local storage
    localStorage.setItem('harpy_secrets_ledger', val);
    
    // Debounce the "saved" indicator
    setTimeout(() => {
      setSaveStatus('ALL SECRETS SECURE');
    }, 1000);
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 160px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2>[ PRIVATE LEDGER ]</h2>
        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{saveStatus}</span>
      </div>
      
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{ marginBottom: '10px', fontSize: '14px' }}>
          * WARNING: This ledger is stored locally on this device. It is not synced to the Erebus network. Keep this device secure. *
        </p>
        <textarea 
          value={content}
          onChange={handleChange}
          placeholder="Jot down secrets, suspicions, and unverified intelligence here..."
          style={{ 
            flexGrow: 1, 
            width: '100%', 
            padding: '15px', 
            fontSize: '20px', 
            border: '2px solid var(--border-color)', 
            borderRadius: '4px',
            resize: 'none',
            fontFamily: 'inherit'
          }}
        />
      </div>
    </div>
  );
}
