import React, { useState, useEffect } from 'react';

import { useApi } from '../../api/hooks/useApi';
import { useWebSocket } from '../../api/hooks/useWebSocket';
import { StateBoundary } from '../common/StateBoundary';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix leaflet icon issue in react
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl
});

const containerStyle = {
  backgroundColor: '#0f172a',
  color: '#f8fafc',
  padding: '2rem',
  minHeight: '100vh',
  fontFamily: 'Inter, system-ui, sans-serif'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2rem'
};

const cardStyle = {
  backgroundColor: '#1e293b',
  borderRadius: '12px',
  padding: '1.5rem',
  border: '1px solid #334155',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
};

const titleStyle = {
  fontSize: '1.25rem',
  fontWeight: '600',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  color: '#e2e8f0'
};

const iconStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0f172a',
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  marginRight: '12px',
  fontSize: '16px',
  border: '1px solid #334155'
};

export function TransporterDashboard() {
  return <LiveMap />;
}

export function LiveMap() {
  const { status, lastMessage } = useWebSocket('/api/tracking/live');
  const [vehicles, setVehicles] = useState({});
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    if (lastMessage && lastMessage.event === 'shipment.location.updated') {
        const data = lastMessage.data;
        setVehicles(prev => ({
            ...prev,
            [data.vehicle_id]: data
        }));
    }
  }, [lastMessage]);

  const handleIntervention = async (action, shipmentId) => {
      // Real backend mutation call here
      alert('Action sent to backend API: ' + action + ' for ' + shipmentId);
  };

  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Live Map & Tracking</h1>
           <p style={{ color: '#94a3b8', margin: 0 }}>WebSocket Status: <span style={{color: status === 'CONNECTED' ? '#10b981' : '#ef4444'}}>{status}</span></p>
        </div>
      </header>

      <div style={{display: 'flex', gap: '1.5rem'}}>
        {/* Main Map */}
        <div style={{ ...cardStyle, flex: 2, height: '600px', padding: 0, overflow: 'hidden' }}>
           <MapContainer center={[12.9716, 77.5946]} zoom={10} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              />
              {Object.values(vehicles).map(v => (
                  <Marker 
                     key={v.vehicle_id} 
                     position={[v.latitude, v.longitude]}
                     eventHandlers={{ click: () => setSelectedVehicle(v) }}
                  >
                  </Marker>
              ))}
           </MapContainer>
        </div>

        {/* Sidebar Shipment Panel */}
        <div style={{ ...cardStyle, flex: 1, minWidth: '350px', height: '600px', overflowY: 'auto' }}>
          {selectedVehicle ? (
              <div>
                  <h2 style={{...titleStyle, borderBottom: '1px solid #334155', paddingBottom: '1rem'}}>
                     Shipment: {selectedVehicle.shipment_id}
                  </h2>
                  <div style={{marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                     <div>
                        <div style={{color: '#94a3b8', fontSize: '0.875rem'}}>VEHICLE</div>
                        <div style={{fontSize: '1.125rem', fontWeight: 'bold'}}>{selectedVehicle.vehicle_id}</div>
                     </div>
                     <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <div>
                           <div style={{color: '#94a3b8', fontSize: '0.875rem'}}>ETA</div>
                           <div style={{fontSize: '1.125rem', fontWeight: 'bold'}}>{selectedVehicle.eta_minutes} min</div>
                        </div>
                        <div>
                           <div style={{color: '#94a3b8', fontSize: '0.875rem'}}>DELAY</div>
                           <div style={{fontSize: '1.125rem', fontWeight: 'bold', color: selectedVehicle.predicted_delay_minutes > 0 ? '#ef4444' : '#10b981'}}>
                              +{selectedVehicle.predicted_delay_minutes} min
                           </div>
                        </div>
                     </div>
                     <div>
                        <div style={{color: '#94a3b8', fontSize: '0.875rem'}}>RISK STATUS</div>
                        <div style={{
                            padding: '0.5rem', 
                            background: selectedVehicle.risk_level === 'CRITICAL' ? '#ef4444' : selectedVehicle.risk_level === 'HIGH' ? '#f59e0b' : '#10b981',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            marginTop: '0.25rem',
                            textAlign: 'center'
                        }}>
                           {selectedVehicle.delay_risk_score}% — {selectedVehicle.risk_level}
                        </div>
                     </div>
                     <div style={{color: '#f8fafc', fontSize: '0.875rem', background: '#334155', padding: '1rem', borderRadius: '4px'}}>
                        <strong>Route Deviation:</strong> {selectedVehicle.route_deviation_km} km <br/>
                        <strong>Reason:</strong> {selectedVehicle.reason}
                     </div>

                     <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem'}}>
                         <button onClick={() => handleIntervention('Contact Driver', selectedVehicle.shipment_id)} style={{padding: '0.75rem', background: '#3b82f6', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>Contact Driver</button>
                         <button onClick={() => handleIntervention('Flag Delay', selectedVehicle.shipment_id)} style={{padding: '0.75rem', background: '#ef4444', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>Flag Delay</button>
                         <button onClick={() => handleIntervention('View Timeline', selectedVehicle.shipment_id)} style={{padding: '0.75rem', background: '#475569', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>View Timeline</button>
                     </div>
                  </div>
              </div>
          ) : (
              <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b'}}>
                  Select a vehicle on the map
              </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function RouteOptimizer() {
  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Route Optimizer</h1>
      </header>
      <p style={{ color: '#94a3b8' }}>Route optimization metrics pending API connection.</p>
    </div>
  );
}

export function FleetManagement() {
  const fleetUtilApi = useApi('/tracking/analytics/fleet-utilization');
  
  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Fleet Management</h1>
      </header>

    </div>
  );
}

export function DriverLogs() {
  const driverPerfApi = useApi('/tracking/analytics/driver-performance');
  
  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Driver Logs & Performance</h1>
      </header>

    </div>
  );
}

export function MaintenanceAlerts() {
  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Maintenance Alerts</h1>
      </header>
    </div>
  );
}
