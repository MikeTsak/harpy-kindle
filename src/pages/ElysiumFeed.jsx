import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';

export default function ElysiumFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [theme, setTheme] = useState('RUMOR');
  const [posting, setPosting] = useState(false);

  const fetchNews = () => {
    api.get('/news').then(res => {
      const newsItems = (res.data.items || [])
        .filter(i => i.type === 'news' || i.theme === 'RUMOR' || i.theme === 'ANNOUNCEMENT')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(newsItems);
      localStorage.setItem('harpy_elysium_cache', JSON.stringify(newsItems));
      setLoading(false);
    }).catch(err => {
      setError('CONNECTION SEVERED. UNABLE TO RETRIEVE LOGS.');
      setLoading(false);
    });
  };

  useEffect(() => {
    const cached = localStorage.getItem('harpy_elysium_cache');
    if (cached) {
      setItems(JSON.parse(cached));
      setLoading(false);
    }
    fetchNews();
  }, []);

  const handlePostRumor = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setPosting(true);
    setError(null);
    try {
      // Convert newlines to <br/> for compatibility with the main portal's HTML rendering
      const htmlBody = body.replace(/\n/g, '<br/>');
      
      await api.post('/news', {
        type: 'news',
        title: title,
        subtitle: '',
        body: htmlBody,
        theme: theme,
        journalist_name: theme === 'RUMOR' ? 'Unknown Whisperer' : 'Harpy Office',
        media_url: null
      });
      setTitle('');
      setBody('');
      fetchNews();
    } catch (err) {
      setError(err.response?.data?.error || 'FAILED TO TRANSMIT.');
    } finally {
      setPosting(false);
    }
  };

  const filteredItems = useMemo(() => {
    let filtered = items;
    
    // 1. Apply category filter
    if (categoryFilter === 'RUMORS') {
      filtered = filtered.filter(i => i.theme === 'RUMOR');
    } else if (categoryFilter === 'ANNOUNCEMENTS') {
      filtered = filtered.filter(i => i.theme === 'ANNOUNCEMENT');
    } else if (categoryFilter === 'NEWS') {
      filtered = filtered.filter(i => i.theme !== 'RUMOR' && i.theme !== 'ANNOUNCEMENT');
    }

    // 2. Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(i => 
        (i.title || '').toLowerCase().includes(q) ||
        (i.body || '').toLowerCase().includes(q) ||
        (i.theme || '').toLowerCase().includes(q)
      );
    }
    
    return filtered;
  }, [items, searchQuery, categoryFilter]);

  return (
    <div className="container">
      <h2>[ ELYSIUM COMMS LOG ]</h2>
      {error && <div className="error-message">ERROR: {error}</div>}

      {/* Broadcast Form */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3>[ TRANSMIT BROADCAST ]</h3>
        <form onSubmit={handlePostRumor} style={{ marginTop: '15px' }}>
          
          <label style={{ fontWeight: 'bold' }}>BROADCAST TYPE</label>
          <select 
            value={theme}
            onChange={e => setTheme(e.target.value)}
            style={{ fontWeight: 'bold' }}
          >
            <option value="RUMOR">UNVERIFIED RUMOR (Anonymous)</option>
            <option value="ANNOUNCEMENT">OFFICIAL ANNOUNCEMENT (Signed)</option>
          </select>

          <label style={{ fontWeight: 'bold' }}>SUBJECT / HEADLINE</label>
          <input 
            type="text" 
            placeholder={theme === 'RUMOR' ? "What's the whisper on the street?" : "Official Subject..."} 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
          />
          <label style={{ fontWeight: 'bold' }}>DETAILS</label>
          <textarea 
            placeholder="The details..." 
            value={body} 
            onChange={e => setBody(e.target.value)} 
            required
            rows={4}
            style={{ width: '100%', padding: '15px', fontSize: '20px', marginBottom: '15px', border: '2px solid var(--border-color)', borderRadius: '4px' }}
          />
          <button type="submit" disabled={posting} style={{ width: '100%', padding: '15px' }}>
            {posting ? 'TRANSMITTING...' : 'BROADCAST MESSAGE'}
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <select 
          value={categoryFilter} 
          onChange={e => setCategoryFilter(e.target.value)}
          style={{ flex: 1, marginBottom: 0, fontWeight: 'bold' }}
        >
          <option value="ALL">VIEW ALL TRANSMISSIONS</option>
          <option value="RUMORS">VIEW RUMORS ONLY</option>
          <option value="ANNOUNCEMENTS">VIEW ANNOUNCEMENTS ONLY</option>
          <option value="NEWS">VIEW PUBLIC NEWS ONLY</option>
        </select>
      </div>

      <input 
        type="text" 
        placeholder="Search comms log by subject or body text..." 
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{ marginBottom: '15px' }}
      />

      {loading && items.length === 0 ? (
        <p>DECRYPTING DATA PACKETS...</p>
      ) : filteredItems.length === 0 ? (
        <p>NO TRANSMISSIONS INTERCEPTED.</p>
      ) : (
        <div style={{ marginTop: '20px' }}>
          {filteredItems.map(item => {
            return (
              <div key={item.id} className="card" style={{ borderStyle: 'dashed' }}>
                <strong style={{ textDecoration: 'underline' }}>
                  {item.theme === 'RUMOR' ? 'UNVERIFIED RUMOR' : (item.theme || 'NEWS DECRYPTED').toUpperCase()}
                </strong>
                <br/>
                <em>T-STAMP: {new Date(item.created_at).toLocaleString('en-GB')}</em>
                {item.title && <><br/><br/><strong>SUBJ: {item.title}</strong></>}
                <br/><br/>
                <div dangerouslySetInnerHTML={{ __html: item.body }} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
