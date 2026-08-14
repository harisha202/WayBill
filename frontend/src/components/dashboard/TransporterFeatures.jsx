import React, { useState, useEffect } from 'react';
import { useApi } from '../../api/hooks/useApi';
import { useWebSocket } from '../../api/hooks/useWebSocket';
import { transporterApi } from '../../api/services/transporterApi';
import { DataTable } from '../ui/DataTable';
import { StatusPill } from '../ui/StatusPill';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl
});

export function TransporterDashboard() {
  const { data: overview, loading, error } = useApi('/tracking/overview');

  if (error) return <div style={{ color: 'var(--red)' }}>Error loading overview: {error.message}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--dashboard-heading)' }}>Logistics Control Tower</h1>
      </div>

      {loading ? <div>Loading...</div> : overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--muted)', fontSize: '1rem' }}>Total Active Shipments</h3>
            <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, color: 'var(--text)' }}>{overview.total_shipments}</p>
          </div>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--muted)', fontSize: '1rem' }}>In Transit</h3>
            <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, color: 'var(--blue)' }}>{overview.in_transit}</p>
          </div>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--muted)', fontSize: '1rem' }}>Delayed / High Risk</h3>
            <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, color: 'var(--red)' }}>{overview.delayed}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function LiveMap() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const getWsHost = () => {
    if (import.meta.env.VITE_DEV_PROXY_TARGET) {
       return import.meta.env.VITE_DEV_PROXY_TARGET.replace('http://', '').replace('https://', '');
    }
    return window.location.host;
  };
  const wsUrl = `${wsProtocol}//${getWsHost()}/api/tracking/live`;

  const { data: initialShipments, loading } = useApi('/tracking/shipments');
  const [vehicles, setVehicles] = useState({});
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    if (initialShipments) {
      const initial = {};
      initialShipments.forEach(s => {
        if (s.lat && s.lng) {
          initial[s.shipment_id] = s;
        }
      });
      setVehicles(initial);
    }
  }, [initialShipments]);

  const { status, lastMessage } = useWebSocket(wsUrl, (data) => {
     if (data.event === 'shipment.location.updated') {
         setVehicles(prev => ({
             ...prev,
             [data.data.shipment_id || data.data.vehicle_id]: data.data
         }));
     }
  });
  
  const handleIntervention = async (action, shipmentId) => {
      const reason = window.prompt(`Enter reason for ${action}:`);
      if (!reason) return;
      
      try {
          await transporterApi.reportIntervention(shipmentId, action, reason, "HIGH");
          alert('Intervention logged successfully.');
      } catch (e) {
          alert("Error logging intervention: " + (e.response?.data?.detail || e.message));
      }
  };

  if (loading) return <div>Loading live map data...</div>;

  return (
    <div>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
           <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--dashboard-heading)' }}>Live Map</h1>
           <p style={{ color: 'var(--muted)', margin: 0 }}>WebSocket Link: <span style={{color: status === 'LIVE' ? 'var(--green)' : 'var(--red)', fontWeight: 'bold'}}>{status}</span></p>
        </div>
      </header>

      <div style={{display: 'flex', gap: '1.5rem'}}>
        <div style={{ flex: 2, height: '600px', padding: 0, overflow: 'hidden', borderRadius: '12px', border: '1px solid var(--border)' }}>
           <MapContainer center={[12.9716, 77.5946]} zoom={5} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              />
              {Object.values(vehicles).map(v => (
                  <Marker 
                     key={v.shipment_id || v.vehicle_id} 
                     position={[v.lat, v.lng]}
                     eventHandlers={{ click: () => setSelectedVehicle(v) }}
                  >
                  </Marker>
              ))}
           </MapContainer>
        </div>

        <div style={{ flex: 1, minWidth: '350px', height: '600px', overflowY: 'auto', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          {selectedVehicle ? (
              <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, borderBottom: '1px solid var(--border)', paddingBottom: '1rem', margin: 0, color: 'var(--text)'}}>
                     Shipment: {selectedVehicle.shipment_id}
                  </h2>
                  <div style={{marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                     <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <div>
                           <div style={{color: 'var(--muted)', fontSize: '0.875rem'}}>VEHICLE</div>
                           <div style={{fontSize: '1.125rem', fontWeight: 'bold'}}>{selectedVehicle.vehicle_number || selectedVehicle.vehicle_id || 'N/A'}</div>
                        </div>
                        <div>
                           <div style={{color: 'var(--muted)', fontSize: '0.875rem'}}>STATUS</div>
                           <StatusPill status={selectedVehicle.status === 'IN_TRANSIT' ? 'active' : 'pending'} text={selectedVehicle.status || 'UNKNOWN'} />
                        </div>
                     </div>
                     <div>
                        <div style={{color: 'var(--muted)', fontSize: '0.875rem'}}>ORIGIN ➔ DESTINATION</div>
                        <div style={{fontSize: '1rem', fontWeight: 'bold'}}>{selectedVehicle.origin || 'Unknown'} ➔ {selectedVehicle.destination || 'Unknown'}</div>
                     </div>
                     <div>
                        <div style={{color: 'var(--text)', fontSize: '0.875rem', background: 'var(--bg)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--border)'}}>
                           <strong>Route Deviation:</strong> {selectedVehicle.route_deviation || 'None'} <br/>
                           <strong>Risk Score:</strong> {selectedVehicle.delay_risk_score || 0}
                        </div>
                     </div>

                     <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem'}}>
                         <button onClick={() => handleIntervention('CONTACT_DRIVER', selectedVehicle.shipment_id)} style={{padding: '0.75rem', background: 'var(--blue)', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>Contact Driver</button>
                         <button onClick={() => handleIntervention('FLAG_DELAY', selectedVehicle.shipment_id)} style={{padding: '0.75rem', background: 'var(--red)', color: 'white', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}}>Flag Risk</button>
                     </div>
                  </div>
              </div>
          ) : (
              <div style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)'}}>
                  Select a vehicle on the map
              </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function RouteOptimizer() {
  const { data: shipments, loading, error } = useApi('/tracking/shipments');

  const columns = [
    { key: 'shipment_id', header: 'Shipment', render: (val) => <strong>{val}</strong> },
    { key: 'order_code', header: 'Order Code' },
    { key: 'status', header: 'Status', render: (val) => <StatusPill status={val === 'IN_TRANSIT' ? 'active' : 'pending'} text={val} /> },
    { key: 'vehicle_number', header: 'Vehicle' },
    { key: 'origin', header: 'Origin' },
    { key: 'destination', header: 'Destination' },
    { key: 'delay_risk_score', header: 'Risk Score' },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Shipment Routes</h2>
      {error ? (
        <div style={{ color: 'var(--red)' }}>{error.message}</div>
      ) : (
        <DataTable data={shipments || []} columns={columns} loading={loading} emptyMessage="No active shipments." />
      )}
    </div>
  );
}

export function FleetManagement() {
  const { data: fleet, loading, error } = useApi('/tracking/fleet');

  const columns = [
    { key: 'truck_id', header: 'Registration', render: (val) => <strong>{val}</strong> },
    { key: 'model', header: 'Model' },
    { key: 'status', header: 'Status', render: (val) => <StatusPill status={val === 'AVAILABLE' ? 'success' : val === 'MAINTENANCE' ? 'error' : 'warning'} text={val} /> },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Fleet Status</h2>
      {error ? (
        <div style={{ color: 'var(--red)' }}>{error.message}</div>
      ) : (
        <DataTable data={fleet || []} columns={columns} loading={loading} emptyMessage="No vehicles in fleet." />
      )}
    </div>
  );
}

export function DriverLogs() {
  const { data: drivers, loading, error } = useApi('/tracking/drivers');

  const columns = [
    { key: 'driver_id', header: 'ID', render: (val) => <strong>{val}</strong> },
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status', render: (val) => <StatusPill status={val === 'ACTIVE' ? 'success' : 'warning'} text={val} /> },
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Driver Rosters</h2>
      {error ? (
        <div style={{ color: 'var(--red)' }}>{error.message}</div>
      ) : (
        <DataTable data={drivers || []} columns={columns} loading={loading} emptyMessage="No drivers registered." />
      )}
    </div>
  );
}

export function MaintenanceAlerts() {
  const { data: interventions, loading, error } = useApi('/tracking/interventions');

  const columns = [
    { key: 'intervention_id', header: 'ID', render: (val) => <strong>{val}</strong> },
    { key: 'shipment_id', header: 'Shipment' },
    { key: 'action_type', header: 'Action' },
    { key: 'reason', header: 'Reason' },
    { key: 'status', header: 'Status', render: (val) => <StatusPill status={val === 'OPEN' ? 'warning' : 'success'} text={val} /> },
    { key: 'created_at', header: 'Date', render: (val) => new Date(val).toLocaleDateString() }
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Interventions Log</h2>
      {error ? (
        <div style={{ color: 'var(--red)' }}>{error.message}</div>
      ) : (
        <DataTable data={interventions || []} columns={columns} loading={loading} emptyMessage="No interventions recorded." />
      )}
    </div>
  );
}
