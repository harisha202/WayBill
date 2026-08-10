import React, { useState, useEffect } from 'react';
import { aiApi } from '../../api/axiosInstance';
import { DataTable } from '../ui/DataTable';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { connectGpsSocket, disconnectGpsSocket } from '../../api/socket';
import StatusDonut from '../charts/StatusDonut';
import BarChart from '../charts/BarChart';
import { WaybillDocumentViewer } from '../ui/WaybillDocumentViewer';

const truckIcon = L.divIcon({
  html: '<div style="font-size: 36px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); transform: scaleX(-1);">🚛</div>',
  className: 'truck-marker',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

export function RouteOptimizer() {
  const [routes, setRoutes] = useState([]);
  const [inputData, setInputData] = useState('Mumbai, Pune, Bangalore, Chennai');
  const [loading, setLoading] = useState(false);
  const [activeRouteId, setActiveRouteId] = useState(1);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const stopsArray = inputData.split(',').map(s => s.trim()).filter(s => s);
      const stopsPayload = stopsArray.map(s => ({ location: s }));
      const result = await aiApi.routeOptimizer({
        warehouse: stopsArray[0] || 'Origin',
        stops: stopsPayload,
        constraints: { prioritize: 'time' }
      });
      
      if (result) {
        setRoutes(prev => [
          { 
            id: `R${activeRouteId}`, 
            stops: result.optimized_route.length, 
            estDistance: `${result.total_distance_km} km`, 
            originalTime: `${(result.total_distance_km / 40).toFixed(1)}h`, 
            optimizedTime: `${result.estimated_time_hours}h`, 
            savings: '18%' 
          },
          ...prev
        ]);
        setActiveRouteId(activeRouteId + 1);
      }
    } catch (err) {
      console.error("Failed to optimize route", err);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { key: 'id', header: 'Route ID' },
    { key: 'stops', header: 'Stops' },
    { key: 'originalTime', header: 'Orig. Time' },
    { key: 'optimizedTime', header: 'Optimized' },
    { key: 'savings', header: 'Time Saved', render: (val) => <span style={{ color: '#059669', fontWeight: 'bold' }}>{val}</span> }
  ];

  return (
    <div className="card" style={{ borderTop: '4px solid #2563eb' }}>
      <h2 className="card-title">
        <span className="kpi-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>🗺️</span>
        AI Route Optimizer
      </h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Calculate optimal delivery sequences minimizing distance and predicting delays using AI.</p>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          type="text" 
          value={inputData}
          onChange={(e) => setInputData(e.target.value)}
          placeholder="Enter comma-separated locations (e.g. Mumbai, Pune, Bangalore)" 
          style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          disabled={loading}
        />
        <button 
          className="primary-btn" 
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
          onClick={handleOptimize}
          disabled={loading || !inputData}
        >
          {loading ? 'Optimizing...' : 'Run AI Optimizer'}
        </button>
      </div>
      
      {routes.length > 0 ? (
        <DataTable data={routes} columns={columns} />
      ) : (
        <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px' }}>
          <p className="muted">Enter locations and run the optimizer to generate a route plan.</p>
        </div>
      )}
    </div>
  );
}

export function LiveMapOverlay() {
  const [shipments, setShipments] = useState({});
  const [selectedWaybillOrder, setSelectedWaybillOrder] = useState(null);

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
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', borderTop: '4px solid #2563eb' }}>
      <h2 className="card-title">
        <span className="kpi-icon" style={{ background: '#dbeafe', color: '#2563eb' }}>📡</span>
        Live Port & Traffic Map
      </h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Real-time GPS tracking overlay for all active truck dispatch operations.</p>
      <div style={{ width: '100%', flex: 1, borderRadius: '8px', overflow: 'hidden', position: 'relative', zIndex: 0, minHeight: '400px', border: '1px solid #e2e8f0' }}>
        <MapContainer center={defaultCenter} zoom={5} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          {shipmentList.map(s => {
            // Generate some fake delay risk points based on lat/lng for congestion demo
            const riskScore = s.lat > 19 ? 80 : 20; // Just arbitrary logic for demo heatmap
            const isHighRisk = riskScore > 75;
            
            return (
              <React.Fragment key={s.shipment_id || s.id}>
                {isHighRisk && (
                  <Circle 
                    center={[s.lat, s.lng]} 
                    radius={5000} 
                    pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.3 }} 
                  />
                )}
                <Marker position={[s.lat, s.lng]} icon={truckIcon}>
                  <Popup>
                    <strong style={{ color: '#1e3a8a' }}>{s.shipment_id || s.id}</strong><br/>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Status: {s.status}</span><br/>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>Vehicle: {s.vehicle_number || 'N/A'}</span>
                    
                    {s.order_code && (
                      <div style={{ marginTop: '10px', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px', textAlign: 'center', background: '#f8fafc' }}>
                        <div style={{ fontSize: '24px' }}>🛡️</div>
                        <div style={{ fontSize: '10px', fontWeight: 'bold' }}>SEALED DOCUMENT</div>
                        <button 
                          onClick={() => setSelectedWaybillOrder(s.order_code)}
                          style={{ marginTop: '6px', background: 'transparent', border: 'none', color: '#2563eb', cursor: 'pointer', textDecoration: 'underline', fontSize: '11px' }}
                        >
                          View Official Waybill
                        </button>
                      </div>
                    )}
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
      
      {selectedWaybillOrder && (
        <WaybillDocumentViewer 
          orderCode={selectedWaybillOrder}
          onClose={() => setSelectedWaybillOrder(null)}
        />
      )}
    </div>
  );
}

export function FleetManagement() {
  const chartData = [
    { label: 'Active', value: 75, color: '#059669' },
    { label: 'Maintenance', value: 15, color: '#f59e0b' },
    { label: 'Idle', value: 10, color: '#64748b' }
  ];

  return (
    <div className="card" style={{ borderTop: '4px solid #2563eb' }}>
      <h2 className="card-title">Fleet Utilization</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Current status of all registered vehicles.</p>
      <div style={{ height: '300px' }}>
        <StatusDonut data={chartData} title="Fleet Status" />
      </div>
    </div>
  );
}

export function DriverLogs() {
  const chartData = {
    labels: ['John D.', 'Sarah W.', 'Mike T.', 'Anna K.', 'Tom H.'],
    datasets: [{
      label: 'On-Time Delivery %',
      data: [98, 95, 88, 99, 92],
      backgroundColor: '#2563eb'
    }]
  };

  return (
    <div className="card">
      <h2 className="card-title">Driver Performance</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>On-time delivery performance across the partner network.</p>
      <div style={{ height: '300px' }}>
        <BarChart data={chartData} title="On-Time %" />
      </div>
    </div>
  );
}

export function MaintenanceAlerts() {
  return (
    <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
      <h2 className="card-title" style={{ color: '#dc2626' }}>Maintenance Alerts</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Vehicles requiring immediate service.</p>
      <ul style={{ paddingLeft: '20px', color: '#334155' }}>
        <li style={{ marginBottom: '8px' }}><strong>Truck T-105:</strong> Engine temperature warning. Needs immediate check.</li>
        <li style={{ marginBottom: '8px' }}><strong>Truck T-220:</strong> Tire pressure low. Scheduled for service.</li>
        <li><strong>Truck T-089:</strong> Brake pad replacement required within 500 miles.</li>
      </ul>
    </div>
  );
}
