import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import api from '../api';

// Map Imports
import L from 'leaflet';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import domainsRaw from '../data/Domains.json';

const DIVISION_NAMES = {
  1: 'Pagkrati', 2: 'Zografou/Kaisarianh', 3: 'Exarxia', 4: 'Boula', 5: 'Ampelokhpoi',
  6: 'Kalithea', 7: 'Petralona', 8: 'Plaka', 9: 'Keramikos', 10: 'Tauros, Agios Ioannis Rentis',
  11: 'Thiseio', 12: 'Mosxato', 13: 'Palaio Faliro', 14: 'Nea Smyrnh', 15: 'Agios Dhmhtrios',
  16: 'Neos Kosmos', 17: 'Nea Penteli, Melissia', 18: 'Kolonaki, Lykabhtos', 19: 'Peristeri',
  20: 'Aigaleo', 21: 'Petroupolh, Ilion, Agioi Anargyroi, Kamatero', 22: 'Ellhniko, Argyroupolh',
  23: 'Psyxiko, Neo Psyxiko', 24: 'Attikh', 25: 'Kypselh', 26: 'Galatsi', 27: 'Khfisia, Nea Erythraia',
  28: 'Alimos', 29: 'Marousi, Peykh', 30: 'Hrakleio, Metamorfosi, Lykobrysh', 31: 'Xalandri, Brilissia',
  32: 'Perama, Keratsini', 33: 'Pathsia', 34: 'Kolonos, Sepolia', 35: 'Xolargos, Agia Paraskeyh',
  36: 'Katexakh', 37: 'Nea Philadepfia', 38: 'Hlioupolh, Byronas', 39: 'Athina', 40: 'Psyrh',
  41: 'Ymuttos', 42: 'Parnitha', 43: 'Peiraias, Neo Faliro', 44: 'Xaidari',
  45: 'Korydallos, Nikaia, Agia Barbara', 46: 'Glyfada', 47: 'Gkyzh', 48: 'Eleysina', 49: 'Aspropirgos'
};

export default function Domains() {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    // Attempt to load from cache first
    const cached = localStorage.getItem('harpy_domains_cache');
    if (cached) {
      setClaims(JSON.parse(cached));
      setLoading(false);
    }

    // Fetch fresh data
    api.get('/domain-claims').then(res => {
      const claimsData = res.data.claims || [];
      setClaims(claimsData);
      localStorage.setItem('harpy_domains_cache', JSON.stringify(claimsData));
      setLoading(false);
    }).catch(err => {
      console.error(err);
      if (!cached) setError('FAILED TO FETCH DOMAIN REGISTRY.');
      setLoading(false);
    });
  }, []);

  const claimByDiv = useMemo(() => new Map(claims.map(c => [Number(c.division), c])), [claims]);

  const allDivisions = useMemo(() => {
    const divs = [];
    for (let i = 1; i <= 49; i++) {
      divs.push({
        number: i,
        name: DIVISION_NAMES[i] || `Division ${i}`,
        claim: claimByDiv.get(i) || null
      });
    }
    return divs;
  }, [claimByDiv]);

  const filteredDivisions = useMemo(() => {
    if (!searchQuery.trim()) return allDivisions;
    const q = searchQuery.toLowerCase();
    return allDivisions.filter(d => 
      String(d.number).includes(q) ||
      d.name.toLowerCase().includes(q) ||
      (d.claim && d.claim.owner_name && d.claim.owner_name.toLowerCase().includes(q))
    );
  }, [allDivisions, searchQuery]);

  // --- Map Logic ---
  const { geoJsonData } = useMemo(() => {
    if (!domainsRaw || !Array.isArray(domainsRaw.features)) return { geoJsonData: null };
    const features = domainsRaw.features.map((f, i) => {
      const divisionNumber = f?.properties?.division != null ? Number(f.properties.division) : (i + 1);
      const divisionName = f?.properties?.name || DIVISION_NAMES[divisionNumber] || `Division ${divisionNumber}`;
      return { ...f, properties: { ...f?.properties, __division: divisionNumber, __name: divisionName } };
    });
    return { geoJsonData: { ...domainsRaw, features } };
  }, []);

  const mapStyle = useCallback((feature) => {
    const n = feature?.properties?.__division;
    const claim = claimByDiv.get(n);
    // Use high contrast solid borders for E-ink, and shading based on claim ownership
    return {
      color: '#000000',
      weight: 2,
      opacity: 1,
      fillColor: claim ? (claim.color || '#555555') : '#ffffff',
      fillOpacity: claim ? 0.8 : 0.1,
      dashArray: claim ? '' : '4',
    };
  }, [claimByDiv]);

  const onEachFeature = useCallback((feature, layer) => {
    const n = feature?.properties?.__division;
    const name = feature?.properties?.__name;
    const claim = claimByDiv.get(n);
    
    layer.bindPopup(
      `<strong>Division ${n}: ${name}</strong><br/>` +
      `Owner: ${claim ? claim.owner_name : 'UNCLAIMED'}`
    );
  }, [claimByDiv]);

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 160px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>[ TERRITORY DIRECTORY ]</h2>
        <button 
          onClick={() => setShowMap(!showMap)}
          style={{ width: 'auto', padding: '10px 20px', marginBottom: '0' }}
        >
          {showMap ? 'SHOW TEXT LIST' : 'SHOW MAP'}
        </button>
      </div>
      
      {error && <div className="error-message">ERROR: {error}</div>}

      {showMap ? (
        <div style={{ flexGrow: 1, marginTop: '20px', border: '4px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden', minHeight: '500px' }}>
          {geoJsonData ? (
            <MapContainer
              center={[37.9838, 23.7275]} // Athens
              zoom={11}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap'
              />
              <GeoJSON
                data={geoJsonData}
                style={mapStyle}
                onEachFeature={onEachFeature}
              />
            </MapContainer>
          ) : (
            <div style={{ padding: '20px' }}>ERROR LOADING MAP DATA.</div>
          )}
        </div>
      ) : (
        <>
          <input 
            type="text" 
            placeholder="Search by division number, name, or owner..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ marginBottom: '15px', marginTop: '15px' }}
          />

          {loading && claims.length === 0 ? (
            <p>ACCESSING LAND REGISTRY...</p>
          ) : (
            <div style={{ marginTop: '10px' }}>
              {filteredDivisions.map(div => (
                <div key={div.number} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '22px' }}>
                      #{div.number} - {div.name}
                    </strong>
                    {div.claim && (
                      <span style={{ 
                        display: 'inline-block', 
                        width: '20px', 
                        height: '20px', 
                        backgroundColor: div.claim.color || '#000',
                        border: '2px solid var(--border-color)',
                        borderRadius: '50%'
                      }}></span>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '10px', fontSize: '20px' }}>
                    &gt; OWNER: {div.claim ? <strong>{div.claim.owner_name}</strong> : 'UNCLAIMED'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
