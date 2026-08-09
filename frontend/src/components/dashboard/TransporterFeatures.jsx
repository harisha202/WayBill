import React, { useState, useEffect } from 'react';
import { DataTable } from '../ui/DataTable';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { connectGpsSocket, disconnectGpsSocket } from '../../api/socket';

const truckIcon = L.divIcon({
  html: '<div style="font-size: 36px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); transform: scaleX(-1);">🚛</div>',
  className: 'truck-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

export function RouteOptimizer() {
  const [routes, setRoutes] = useState([
    { id: 'R1', stops: 4, estDistance: '120 km', originalTime: '3h 15m', optimizedTime: '2h 40m', savings: '18%' },
    { id: 'R2', stops: 6, estDistance: '240 km', originalTime: '5h 30m', optimizedTime: '4h 10m', savings: '24%' },
  ]);

  const [inputData, setInputData] = useState('Location A, Location B, Location C');

  const handleOptimize = () => {
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
  const [shipments, setShipments] = useState({});

  useEffect(() => {
    connectGpsSocket({
      onMessage: (data) => {
        if (data && data.type === 'gps:update' && data.shipments) {
          setShipments(data.shipments);
        }
      }
    });

    return () => {
      disconnectGpsSocket();
    };
  }, []);

  const shipmentList = Object.values(shipments).filter(s => s.lat != null && s.lng != null);
  const defaultCenter = [19.0760, 72.8777]; // Mumbai

  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <h2 className="card-title">Live Port & Traffic Congestion Map</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Real-time GPS tracking overlay mapped against global congestion APIs.</p>
      <div style={{ width: '100%', flex: 1, borderRadius: '12px', overflow: 'hidden', position: 'relative', zIndex: 0, minHeight: '500px' }}>
        <MapContainer center={defaultCenter} zoom={5} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {shipmentList.map(s => (
            <Marker key={s.shipment_id || s.id} position={[s.lat, s.lng]} icon={truckIcon}>
              <Popup>
                <strong>{s.shipment_id || s.id}</strong><br/>
                Status: {s.status}<br/>
                Vehicle: {s.vehicle_number || 'N/A'}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
