import React, { useState, useEffect, useMemo } from 'react';
import api from '../api';

export default function ElysiumFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchNews = () => {
    api.get('/news').then(res => {
      const newsItems = (res.data.items || [])
        .filter(i => i.type === 'news' || i.theme === 'RUMOR' || i.theme === 'ANNOUNCEMENT')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setItems(newsItems);
      setLoading(false);
    }).catch(err => {
      setError('CONNECTION SEVERED. UNABLE TO RETRIEVE LOGS.');
      setLoading(false);
    });
  };

  useEffect(() => {
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
        theme: 'RUMOR',
        journalist_name: 'Unknown Whisperer',
        media_url: null
      });
      setTitle('');
      setBody('');
      fetchNews();
    } catch (err) {
      setError(err.response?.data?.error || 'FAILED TO TRANSMIT RUMOR.');
    } finally {
      setPosting(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i => 
      (i.title || '').toLowerCase().includes(q) ||
      (i.body || '').toLowerCase().includes(q) ||
      (i.theme || '').toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  return (
    <div className="container">
      <h2>[ ELYSIUM COMMS LOG ]</h2>
      {error && <div className="error-message">ERROR: {error}</div>}

      {/* Rumor Form */}
      <div className="card" style={{ marginBottom: '30px' }}>
        <h3>[ TRANSMIT RUMOR ]</h3>
        <form onSubmit={handlePostRumor} style={{ marginTop: '15px' }}>
          <label style={{ fontWeight: 'bold' }}>SUBJECT / HEADLINE</label>
          <input 
            type="text" 
            placeholder="What's the whisper on the street?" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            required 
          />
          <label style={{ fontWeight: 'bold' }}>DETAILS</label>
          <textarea 
            placeholder="The juicy details..." 
            value={body} 
            onChange={e => setBody(e.target.value)} 
            required
            rows={4}
            style={{ width: '100%', padding: '15px', fontSize: '20px', marginBottom: '15px', border: '2px solid var(--border-color)', borderRadius: '4px' }}
          />
          <button type="submit" disabled={posting} style={{ width: '100%', padding: '15px' }}>
            {posting ? 'TRANSMITTING...' : 'BROADCAST RUMOR'}
          </button>
        </form>
      </div>

      <input 
        type="text" 
        placeholder="Search comms log by subject or body text..." 
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        style={{ marginBottom: '15px' }}
      />

      {loading ? (
        <p>DECRYPTING DATA PACKETS...</p>
      ) : filteredItems.length === 0 ? (
        <p>NO TRANSMISSIONS INTERCEPTED.</p>
      ) : (
        <div style={{ marginTop: '20px' }}>
          {filteredItems.map(item => {
            // Strip HTML tags for display on e-ink if it's HTML, or just dangerouslySetInnerHTML
            // Using dangerouslySetInnerHTML to properly display the <br/> tags
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
