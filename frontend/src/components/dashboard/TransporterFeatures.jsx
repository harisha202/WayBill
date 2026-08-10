import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import StatusDonut from '../charts/StatusDonut';
import BarChart from '../charts/BarChart';
import LineChart from '../charts/LineChart';
import PipelineFunnel from '../charts/PipelineFunnel';

const truckIcon = L.divIcon({
  html: '<div style="font-size: 24px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5)); transform: scaleX(-1);">🚛</div>',
  className: 'truck-marker',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

const alertIcon = L.divIcon({
  html: '<div style="font-size: 24px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));">⚠️</div>',
  className: 'alert-marker',
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Mock Data
const kpiData = [
  { title: 'Active Transports', value: '1,245', icon: '🚛', trend: '+12%' },
  { title: 'On-Time Delivery', value: '94.2%', icon: '⏱️', trend: '+1.5%' },
  { title: 'Avg. Delay Risk', value: '18%', icon: '🛡️', trend: '-5%' },
  { title: 'Route Savings', value: '$45.2k', icon: '💰', trend: '+8%' }
];

const mockPipeline = [
  { label: 'Dispatched', value: 1245, color: '#3b82f6' },
  { label: 'In Transit', value: 890, color: '#f59e0b' },
  { label: 'Customs/Port', value: 320, color: '#ef4444' },
  { label: 'Delivered', value: 120, color: '#10b981' }
];

const mockFleetUtil = [
  { label: 'Active', value: 75, color: '#10b981' },
  { label: 'Idle', value: 15, color: '#64748b' },
  { label: 'Maintenance', value: 10, color: '#f59e0b' }
];

const mockRouteDeviation = [
  { label: 'On Route', value: 85, color: '#3b82f6' },
  { label: 'Minor Deviation', value: 10, color: '#f59e0b' },
  { label: 'Major Deviation', value: 5, color: '#ef4444' }
];

const mockEtaData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  data: [95, 98, 93, 105, 102, 90, 95] 
};

const mockDelayRiskTrend = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  data: [25, 22, 18, 15]
};

const mockDriverPerformance = [
  { label: 'Top 10%', value: 98 },
  { label: 'Average', value: 85 },
  { label: 'Bottom 10%', value: 65 }
];

const mockSavings = [
  { label: 'Fuel', value: 12000 },
  { label: 'Time', value: 8500 },
  { label: 'Maintenance', value: 4300 }
];

const mockGpsLocations = [
  { id: 'TRK-001', lat: 19.0760, lng: 72.8777, status: 'On-Time' },
  { id: 'TRK-002', lat: 18.5204, lng: 73.8567, status: 'Delayed' },
  { id: 'TRK-003', lat: 19.2183, lng: 72.9781, status: 'On-Time' }
];

const mockRiskLocations = [
  { id: 'RSK-1', lat: 19.1, lng: 72.9, risk: 'High', radius: 15000 },
  { id: 'RSK-2', lat: 18.6, lng: 73.8, risk: 'Medium', radius: 10000 }
];

// Ledger Mock Data (INR)
const ledgerTransportCost = { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'], data: [120000, 135000, 110000, 142000, 128000] };
const ledgerCostPerKm = { labels: ['Trk 1', 'Trk 2', 'Trk 3', 'Trk 4'], data: [24, 26, 22, 28] };
const ledgerFuelCost = { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], data: [15000, 12000, 18000, 14000] };
const ledgerRouteSavings = [
  { label: 'Optimized', value: 85000, color: '#10b981' },
  { label: 'Unoptimized', value: 35000, color: '#ef4444' }
];
const ledgerDelayPenalties = { labels: ['Q1', 'Q2', 'Q3', 'Q4'], data: [15000, 8000, 22000, 5000] };
const ledgerShipmentRevenue = { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'], data: [500000, 650000, 580000, 720000, 800000] };

export function TransporterDashboard() {
  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#f8fafc', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', alignContent: 'start' }}>
      {/* Header */}
      <div style={{ gridColumn: 'span 12', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ background: '#1e293b', padding: '8px', borderRadius: '8px', display: 'flex' }}>🏠</span>
          Transporter Dashboard
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Overview of transporter performance and key metrics.</p>
      </div>

      {/* KPI Cards */}
      {kpiData.map((kpi, i) => (
        <div key={i} style={{ gridColumn: 'span 3', background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '24px', background: '#0f172a', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>{kpi.icon}</span>
            <span style={{ color: kpi.trend.startsWith('+') ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: '14px', background: '#0f172a', padding: '4px 8px', borderRadius: '20px' }}>{kpi.trend}</span>
          </div>
          <div>
            <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f8fafc', marginBottom: '4px' }}>{kpi.value}</div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>{kpi.title}</div>
          </div>
        </div>
      ))}

      {/* ETA vs Actual */}
      <div style={{ gridColumn: 'span 8', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', height: '350px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '16px', margin: '0 0 16px 0' }}>ETA vs Actual</h2>
        <div style={{ flex: 1 }}>
          <LineChart labels={mockEtaData.labels} data={mockEtaData.data} color="#8b5cf6" />
        </div>
      </div>
      
      {/* Fleet Utilization */}
      <div style={{ gridColumn: 'span 4', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', height: '350px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '16px', margin: '0 0 16px 0' }}>Fleet Utilization</h2>
        <div style={{ flex: 1, position: 'relative' }}>
          <StatusDonut title="Fleet" data={mockFleetUtil} />
        </div>
      </div>

      {/* Ledger Charts (INR) */}
      <div style={{ gridColumn: 'span 12', marginTop: '20px' }}>
        <h2 style={{ fontSize: '20px', margin: '0 0 16px 0', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>Financial Ledger (₹)</h2>
      </div>

      <div style={{ gridColumn: 'span 4', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', height: '300px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 12px 0' }}>Transport Cost (₹)</h3>
        <div style={{ flex: 1 }}><LineChart labels={ledgerTransportCost.labels} data={ledgerTransportCost.data} color="#f59e0b" /></div>
      </div>
      <div style={{ gridColumn: 'span 4', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', height: '300px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 12px 0' }}>Cost per KM (₹)</h3>
        <div style={{ flex: 1 }}><BarChart labels={ledgerCostPerKm.labels} data={ledgerCostPerKm.data} color="#3b82f6" /></div>
      </div>
      <div style={{ gridColumn: 'span 4', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', height: '300px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 12px 0' }}>Fuel Cost (₹)</h3>
        <div style={{ flex: 1 }}><LineChart labels={ledgerFuelCost.labels} data={ledgerFuelCost.data} color="#ef4444" /></div>
      </div>
      <div style={{ gridColumn: 'span 4', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', height: '300px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 12px 0' }}>Route Savings (₹)</h3>
        <div style={{ flex: 1, position: 'relative' }}><StatusDonut title="Savings" data={ledgerRouteSavings} /></div>
      </div>
      <div style={{ gridColumn: 'span 4', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', height: '300px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 12px 0' }}>Delay Penalties (₹)</h3>
        <div style={{ flex: 1 }}><BarChart labels={ledgerDelayPenalties.labels} data={ledgerDelayPenalties.data} color="#ef4444" /></div>
      </div>
      <div style={{ gridColumn: 'span 4', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', height: '300px', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ fontSize: '14px', margin: '0 0 12px 0' }}>Shipment Revenue (₹)</h3>
        <div style={{ flex: 1 }}><LineChart labels={ledgerShipmentRevenue.labels} data={ledgerShipmentRevenue.data} color="#10b981" /></div>
      </div>
    </div>
  );
}

export function LiveMap() {
  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#f8fafc', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', alignContent: 'start' }}>
      <div style={{ gridColumn: 'span 12', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ background: '#1e293b', padding: '8px', borderRadius: '8px', display: 'flex' }}>📡</span>
          Live Map
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Live GPS tracking and delay risk map.</p>
      </div>

      <div style={{ gridColumn: 'span 12', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>📡 Live Fleet GPS Tracking</h2>
        <div style={{ flex: 1, minHeight: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }}>
          <MapContainer center={[19.0760, 72.8777]} zoom={7} attributionControl={false} style={{ width: '100%', height: '100%', zIndex: 0 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {mockGpsLocations.map(loc => (
              <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={truckIcon}>
                <Popup>
                  <strong style={{ color: '#0f172a' }}>{loc.id}</strong><br/>
                  <span style={{ color: loc.status === 'On-Time' ? '#10b981' : '#ef4444' }}>{loc.status}</span>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      <div style={{ gridColumn: 'span 12', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>⚠️ Regional Delay Risk Map</h2>
        <div style={{ height: '400px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155' }}>
          <MapContainer center={[18.8, 73.3]} zoom={7} attributionControl={false} style={{ width: '100%', height: '100%', zIndex: 0 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {mockRiskLocations.map(r => (
              <React.Fragment key={r.id}>
                <Circle center={[r.lat, r.lng]} radius={r.radius} pathOptions={{ color: r.risk === 'High' ? '#ef4444' : '#f59e0b', fillColor: r.risk === 'High' ? '#ef4444' : '#f59e0b', fillOpacity: 0.4 }} />
                <Marker position={[r.lat, r.lng]} icon={alertIcon}>
                  <Popup><strong style={{ color: '#0f172a' }}>{r.risk} Risk Area</strong></Popup>
                </Marker>
              </React.Fragment>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

export function RouteOptimizer() {
  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#f8fafc', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', alignContent: 'start' }}>
      <div style={{ gridColumn: 'span 12', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ background: '#1e293b', padding: '8px', borderRadius: '8px', display: 'flex' }}>🗺️</span>
          Route Optimizer
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Analytics for route optimization and deviation tracking.</p>
      </div>

      <div style={{ gridColumn: 'span 8', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', height: '350px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '16px', margin: '0 0 16px 0' }}>Route Optimization Savings</h2>
        <div style={{ flex: 1 }}>
          <BarChart title="Savings" labels={mockSavings.map(d => d.label)} data={mockSavings.map(d => d.value)} color="#10b981" />
        </div>
      </div>
      <div style={{ gridColumn: 'span 4', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', height: '350px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '16px', margin: '0 0 16px 0' }}>Route Deviation</h2>
        <div style={{ flex: 1, position: 'relative' }}>
          <StatusDonut title="Deviation" data={mockRouteDeviation} />
        </div>
      </div>
    </div>
  );
}

export function FleetManagement() {
  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#f8fafc', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', alignContent: 'start' }}>
      <div style={{ gridColumn: 'span 12', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ background: '#1e293b', padding: '8px', borderRadius: '8px', display: 'flex' }}>🚛</span>
          Fleet Management
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Monitor and analyze driver performance and fleet metrics.</p>
      </div>

      <div style={{ gridColumn: 'span 12', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', height: '350px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '16px', margin: '0 0 16px 0' }}>Driver Performance</h2>
        <div style={{ flex: 1 }}>
          <BarChart title="Performance" labels={mockDriverPerformance.map(d => d.label)} data={mockDriverPerformance.map(d => d.value)} color="#3b82f6" />
        </div>
      </div>
    </div>
  );
}

export function DriverLogs() {
  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#f8fafc', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', alignContent: 'start' }}>
      <div style={{ gridColumn: 'span 12', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ background: '#1e293b', padding: '8px', borderRadius: '8px', display: 'flex' }}>📋</span>
          Driver Logs
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>View detailed transport pipelines and statuses.</p>
      </div>

      <div style={{ gridColumn: 'span 12', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '18px', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>📊 Transport Pipeline</h2>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
          <PipelineFunnel data={mockPipeline} />
        </div>
      </div>
    </div>
  );
}

export function MaintenanceAlerts() {
  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#f8fafc', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', alignContent: 'start' }}>
      <div style={{ gridColumn: 'span 12', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ background: '#1e293b', padding: '8px', borderRadius: '8px', display: 'flex' }}>🔧</span>
          Maintenance Alerts
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Track delay risk trends and maintenance warnings.</p>
      </div>

      <div style={{ gridColumn: 'span 12', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155', padding: '20px', height: '350px', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '16px', margin: '0 0 16px 0' }}>Delay Risk Trend</h2>
        <div style={{ flex: 1 }}>
          <LineChart labels={mockDelayRiskTrend.labels} data={mockDelayRiskTrend.data} color="#ef4444" />
        </div>
      </div>
    </div>
  );
}

export function DriverScorecard() {
  const driverData = [
    { driver: 'Raj Kumar', routeCompliance: '98%', fuelEfficiency: '8.5 km/l', incidents: 0, overall: 96 },
    { driver: 'Amit Singh', routeCompliance: '85%', fuelEfficiency: '7.2 km/l', incidents: 2, overall: 78 },
    { driver: 'Vikram Das', routeCompliance: '95%', fuelEfficiency: '8.1 km/l', incidents: 0, overall: 92 },
    { driver: 'Suresh Patel', routeCompliance: '72%', fuelEfficiency: '6.5 km/l', incidents: 3, overall: 60 },
  ];

  return (
    <div style={{ padding: '24px', background: '#0f172a', minHeight: '100vh', color: '#f8fafc', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', alignContent: 'start', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ gridColumn: 'span 12', marginBottom: '8px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ background: '#1e293b', padding: '8px', borderRadius: '8px', display: 'flex' }}>🪪</span>
          Driver Scorecard
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Route Compliance, Fuel Efficiency, and Incident tracking.</p>
      </div>

      <div style={{ gridColumn: 'span 12', display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px' }}>
        {driverData.map((data, idx) => (
          <div key={idx} style={{ gridColumn: 'span 6', background: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#e2e8f0' }}>{data.driver}</h2>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: data.overall >= 90 ? '#10b981' : data.overall >= 80 ? '#f59e0b' : '#ef4444' }}>
                {data.overall} <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 'normal' }}>Score</span>
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 8px 0' }}>Route Compliance</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#38bdf8' }}>{data.routeCompliance}</div>
              </div>
              <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 8px 0' }}>Fuel Efficiency</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#a855f7' }}>{data.fuelEfficiency}</div>
              </div>
              <div style={{ background: '#0f172a', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 8px 0' }}>Incidents</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: data.incidents === 0 ? '#10b981' : data.incidents <= 2 ? '#f59e0b' : '#ef4444' }}>{data.incidents}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
