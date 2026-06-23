import React from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  return (
    <div className="container">
      <h1>HARPY DASHBOARD</h1>
      <p style={{ marginBottom: '20px', fontWeight: 'bold' }}>Select a function below:</p>
      
      <div className="grid-menu">
        <Link to="/boons" style={{ textDecoration: 'none' }}>
          <button>
            <span>BOON TRACKER</span>
            <span>&rarr;</span>
          </button>
        </Link>
        
        <Link to="/reputation" style={{ textDecoration: 'none' }}>
          <button>
            <span>REPUTATION & STATUS</span>
            <span>&rarr;</span>
          </button>
        </Link>
        
        <Link to="/elysium" style={{ textDecoration: 'none' }}>
          <button>
            <span>ELYSIUM FEED</span>
            <span>&rarr;</span>
          </button>
        </Link>
      </div>
    </div>
  );
}
