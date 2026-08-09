import React, { useState } from 'react';
import { DataTable } from '../ui/DataTable';

export function RouteOptimizer() {
  const [routes, setRoutes] = useState([
    { id: 'R1', stops: 4, estDistance: '120 km', originalTime: '3h 15m', optimizedTime: '2h 40m', savings: '18%' },
    { id: 'R2', stops: 6, estDistance: '240 km', originalTime: '5h 30m', optimizedTime: '4h 10m', savings: '24%' },
  ]);

  const [inputData, setInputData] = useState('Location A, Location B, Location C');

  const handleOptimize = () => {
    // Mock optimize call
    const numStops = inputData.split(',').length;
    setRoutes([
      ...routes, 
      { id: `R${routes.length + 1}`, stops: numStops, estDistance: `${numStops * 25} km`, originalTime: `${numStops}h 0m`, optimizedTime: `${numStops - 0.5}h 15m`, savings: '20%' }
    ]);
  };

  const columns = [
    { key: 'id', header: 'Route ID' },
    { key: 'stops', header: 'Stops' },
    { key: 'originalTime', header: 'Orig. Time' },
    { key: 'optimizedTime', header: 'Optimized' },
    { key: 'savings', header: 'Time Saved', render: (val) => <span style={{ color: '#059669', fontWeight: 'bold' }}>{val}</span> }
  ];

  return (
    <div className="card">
      <h2 className="card-title">AI Route Optimizer</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          placeholder="Enter comma-separated locations" 
          style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
        />
        <button className="primary-btn" onClick={handleOptimize}>Run Optimizer</button>
      </div>
      <DataTable data={routes} columns={columns} />
    </div>
  );
}

export function LiveMapOverlay() {
  return (
    <div className="card">
      <h2 className="card-title">Live Port & Traffic Congestion Map</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Real-time GPS tracking overlay mapped against global congestion APIs.</p>
      <div style={{ width: '100%', height: '300px', background: '#e2e8f0', borderRadius: '12px', position: 'relative', overflow: 'hidden' }}>
        {/* CSS Mock Map Grid */}
        <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {/* Mock Map Nodes */}
        <div style={{ position: 'absolute', top: '40%', left: '30%', width: 14, height: 14, background: '#0F6E56', borderRadius: '50%', boxShadow: '0 0 10px #0F6E56' }}></div>
        <div style={{ position: 'absolute', top: '41%', left: '32%', width: 100, height: 3, background: '#0F6E56', transform: 'rotate(15deg)', transformOrigin: '0 0' }}></div>
        
        <div style={{ position: 'absolute', top: '49%', left: '46%', width: 14, height: 14, background: '#BA7517', borderRadius: '50%', boxShadow: '0 0 10px #BA7517' }}></div>
        <div style={{ position: 'absolute', top: '46%', left: '49%', color: '#BA7517', fontSize: '11px', fontWeight: 'bold', background: 'white', padding: '2px 6px', borderRadius: '4px' }}>Congestion Detected</div>
      </div>
    </div>
  );
}
