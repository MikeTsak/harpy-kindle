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
    return allDivisions.filter(d => {
      const ownerName = d.claim ? (d.claim.is_abaton ? 'abaton' : (d.claim.live_name || d.claim.owner_name || 'claimed')) : '';
      return String(d.number).includes(q) ||
        d.name.toLowerCase().includes(q) ||
        ownerName.toLowerCase().includes(q);
    });
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
    // B&W e-ink friendly styling
    return {
      color: '#000000',
      weight: claim ? 3 : 1,
      opacity: 1,
      fillColor: '#000000',
      fillOpacity: claim ? (claim.is_abaton ? 0.6 : 0.2) : 0.05,
      dashArray: claim ? '' : '4 4',
    };
  }, [claimByDiv]);

  const onEachFeature = useCallback((feature, layer) => {
    const n = feature?.properties?.__division;
    const name = feature?.properties?.__name;
    const claim = claimByDiv.get(n);
    
    const ownerName = claim ? (claim.is_abaton ? 'ABATON' : (claim.live_name || claim.owner_name || 'CLAIMED')) : 'UNCLAIMED';

    layer.bindPopup(
      `<strong>Division ${n}: ${name}</strong><br/>` +
      `Owner: ${ownerName}`
    );

    if (claim) {
      layer.bindTooltip(ownerName, { permanent: true, direction: 'center', className: 'domain-tooltip-claimed' });
    } else {
      layer.bindTooltip(String(n), { permanent: true, direction: 'center', className: 'domain-tooltip-unclaimed' });
    }
  }, [claimByDiv]);

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 'calc(100vh - 160px)' }}>
      <style>{`
        .domain-tooltip-claimed {
          background-color: #ffffff !important;
          border: 2px solid #000000 !important;
          color: #000000 !important;
          font-weight: bold !important;
          font-size: 14px !important;
          text-transform: uppercase;
          border-radius: 4px;
          text-shadow: none;
        }
        .domain-tooltip-unclaimed {
          background: transparent !important;
          border: none !important;
          color: #555555 !important;
          font-weight: bold !important;
          font-size: 12px !important;
          box-shadow: none !important;
          text-shadow: 1px 1px 0 #fff, -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff;
        }
      `}</style>
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
              style={{ height: '500px', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; CARTO'
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
              {filteredDivisions.map(div => {
                const isClaimed = !!div.claim;
                const ownerName = isClaimed 
                  ? (div.claim.is_abaton ? 'ABATON' : (div.claim.live_name || div.claim.owner_name || 'CLAIMED')) 
                  : 'UNCLAIMED';

                return (
                  <div key={div.number} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '22px' }}>
                        #{div.number} - {div.name}
                      </strong>
                      {isClaimed && (
                        <span style={{ fontWeight: 'bold', border: '2px solid black', padding: '2px 8px', fontSize: '14px' }}>
                          {div.claim.is_abaton ? 'ABATON' : 'CLAIMED'}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ marginTop: '10px', fontSize: '20px' }}>
                      &gt; OWNER: <strong>{ownerName}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
