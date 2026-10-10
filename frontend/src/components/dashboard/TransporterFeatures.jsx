import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { useAnalytics } from '../../api/hooks/useAnalytics';

import { transporterApi } from '../../api/services/transporterApi';
import { DataTable } from '../ui/DataTable';
import { StatusPill } from '../ui/StatusPill';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, ComposedChart,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { CHART_STYLE, SEMANTIC } from '../dashboard/analytics/chartColors';
const TRANSPORTER_MAP = { primary: '#8B5CF6' };

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl, iconUrl, shadowUrl
});

// ─── Shared Components ────────────────────────────────────────────────────────
const card = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'1.25rem 1.5rem' };
const chartLabel = { fontSize:'1rem', fontWeight:700, color:'var(--dashboard-heading)', margin:'0 0 0.35rem' };
const chartDesc = { fontSize:'0.78rem', color:'var(--muted)', margin:'0 0 1rem' };
// const sectionTitle = { fontSize:'0.8rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--muted)', marginBottom:'1rem' };

function DTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1E293B', border:'1px solid rgba(148,163,184,0.2)', borderRadius:'8px', padding:'10px 14px', fontSize:'0.8125rem', color:'#F1F5F9' }}>
      {label && <div style={{ marginBottom:6, color:'#94A3B8', fontSize:'0.75rem' }}>{label}</div>}
      {payload.map((e, i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:16 }}>
          <span style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background: e.color||e.payload?.fill, display:'inline-block' }} />
            {e.name}
          </span>
          <strong>{typeof e.value === 'number' ? e.value.toLocaleString() : e.value}</strong>
        </div>
      ))}
    </div>
  );
}

function LoadingCard({ height = 360 }) {
  return (
    <div style={{ ...card, height, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid var(--border)', borderTopColor:'var(--blue)', animation:'spin 0.8s linear infinite' }} />
      <span style={{ color:'var(--muted)', fontSize:'0.875rem' }}>Loading data…</span>
    </div>
  );
}

function ErrorCard({ msg, height = 200 }) {
  return (
    <div style={{ ...card, height, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
      <span style={{ color:'var(--text)', fontWeight:600 }}>Failed to load</span>
      <span style={{ color:'var(--muted)', fontSize:'0.78rem' }}>{msg}</span>
    </div>
  );
}

function EmptyCard({ msg, height = 200 }) {
  return (
    <div style={{ ...card, height, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, color:'var(--muted)' }}>
      <span style={{ fontSize:'0.875rem', textAlign:'center', maxWidth:280 }}>{msg || 'No data available.'}</span>
    </div>
  );
}

// ─── 1. Transport Overview (Dashboard) ───────────────────────────────────────
export function TransporterDashboard() {
  const { data, loading, error } = useAnalytics('/tracking/analytics/overview');
  const { data: volumeData, loading: volumeLoading } = useAnalytics('/tracking/analytics/shipments');
  const { data: fleetData, loading: fleetLoading } = useAnalytics('/tracking/analytics/fleet');

  if (error) return <ErrorCard msg={error.message} />;

  const slaRate = data?.slaRate || 0;
  const delayed = data?.delayedCount || 0;
  const onTime = data?.onTimeCount || 0;
  const reasons = data?.delayReasons || [];

  const volumeTrend = volumeData?.volumeTrend || [];
  const fleetStatus = fleetData?.status || [];
  const fleetUtil = fleetData?.utilization || [];

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 1.5rem 0', color: 'var(--dashboard-heading)' }}>Transport Overview</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ ...card, borderTop:`3px solid ${TRANSPORTER_MAP.primary}` }}>
          <p style={{ margin:'0 0 0.25rem', fontSize:'0.72rem', color:'var(--muted)', fontWeight:700, textTransform:'uppercase' }}>On Time Deliveries</p>
          <p style={{ margin:0, fontSize:'2rem', fontWeight:800, color: TRANSPORTER_MAP.primary }}>{onTime}</p>
        </div>
        <div style={{ ...card, borderTop:`3px solid ${SEMANTIC.critical}` }}>
          <p style={{ margin:'0 0 0.25rem', fontSize:'0.72rem', color:'var(--muted)', fontWeight:700, textTransform:'uppercase' }}>Delayed / At Risk</p>
          <p style={{ margin:0, fontSize:'2rem', fontWeight:800, color: SEMANTIC.critical }}>{delayed}</p>
        </div>
        <div style={{ ...card, borderTop:`3px solid ${SEMANTIC.success}` }}>
          <p style={{ margin:'0 0 0.25rem', fontSize:'0.72rem', color:'var(--muted)', fontWeight:700, textTransform:'uppercase' }}>SLA Compliance Rate</p>
          <p style={{ margin:0, fontSize:'2rem', fontWeight:800, color: SEMANTIC.success }}>{slaRate}%</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'1.5rem' }}>
        {/* Left Column: Shipment Volume Trend & Fleet Utilization Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Primary Chart: Shipment Volume Trend */}
          <div style={{ ...card, height: 280, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <p style={chartLabel}>Shipment Volume Trend</p>
                <p style={{ ...chartDesc, margin: 0 }}>Daily dispatched consignment counts and logistics flow</p>
              </div>
              <span style={{ padding: '0.25rem 0.65rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(139, 92, 246, 0.12)', color: TRANSPORTER_MAP.primary, border: '1px solid rgba(139, 92, 246, 0.25)', textTransform: 'uppercase' }}>
                DAILY VOLUME
              </span>
            </div>
            {volumeLoading ? <LoadingCard height={200} /> : volumeTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={volumeTrend} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={TRANSPORTER_MAP.primary} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={TRANSPORTER_MAP.primary} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: CHART_STYLE.axisColor }} />
                  <YAxis tick={{ fontSize: 11, fill: CHART_STYLE.axisColor }} />
                  <Tooltip content={<DTooltip />} />
                  <Area type="monotone" dataKey="shipments" name="Shipments" stroke={TRANSPORTER_MAP.primary} strokeWidth={2.5} fillOpacity={1} fill="url(#volGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                No historical shipment volume records available.
              </div>
            )}
          </div>

          {/* Secondary Chart: Fleet Utilization & Capacity Breakdown */}
          <div style={{ ...card, height: 265, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <div>
                <p style={chartLabel}>Fleet Utilization &amp; Availability</p>
                <p style={{ ...chartDesc, margin: 0 }}>Vehicle operational distribution and active load capacity</p>
              </div>
              <span style={{ padding: '0.25rem 0.65rem', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.12)', color: SEMANTIC.success, border: '1px solid rgba(16, 185, 129, 0.25)', textTransform: 'uppercase' }}>
                ACTIVE FLEET
              </span>
            </div>
            {fleetLoading ? <LoadingCard height={180} /> : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1rem', height: 185, alignItems: 'center' }}>
                {fleetStatus.length > 0 ? (
                  <ResponsiveContainer width="100%" height={175}>
                    <PieChart>
                      <Pie data={fleetStatus} cx="50%" cy="50%" innerRadius="45%" outerRadius="75%" dataKey="count" nameKey="status" paddingAngle={3}>
                        {fleetStatus.map((e, i) => (
                          <Cell key={i} fill={e.status === 'AVAILABLE' || e.status === 'OPERATIONAL' ? SEMANTIC.success : e.status === 'MAINTENANCE' || e.status === 'IN_SHOP' ? SEMANTIC.critical : SEMANTIC.warning} />
                        ))}
                      </Pie>
                      <Tooltip content={<DTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>No status data</div>
                )}

                {fleetUtil.length > 0 ? (
                  <ResponsiveContainer width="100%" height={175}>
                    <BarChart data={fleetUtil.slice(0, 5)} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                      <XAxis dataKey="truckId" tick={{ fontSize: 9, fill: CHART_STYLE.axisColor }} />
                      <YAxis tick={{ fontSize: 10, fill: CHART_STYLE.axisColor }} />
                      <Tooltip content={<DTooltip />} />
                      <Bar dataKey="loadPercent" name="Load %" fill={TRANSPORTER_MAP.primary} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>No utilization data</div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column: Delay Reasons & SLA Gauge */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
            {/* Supp 1: Delay Reasons */}
            <div style={{ ...card, height: 280, display: 'flex', flexDirection: 'column' }}>
                <p style={chartLabel}>Delay Risk Factors</p>
                <p style={{ ...chartDesc, margin: '0 0 0.5rem 0' }}>Breakdown of identified route delay factors</p>
                {loading ? <LoadingCard height={180} /> : reasons.length > 0 ? (
                  <ResponsiveContainer width="100%" height={190}>
                    <BarChart data={reasons} layout="vertical" margin={{ left: 10, right: 10 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="reason" type="category" tick={{ fontSize:11, fill:CHART_STYLE.axisColor }} width={100} />
                        <Tooltip content={<DTooltip />} />
                        <Bar dataKey="count" fill={SEMANTIC.critical} radius={[0,3,3,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                    Reason not recorded in database.
                  </div>
                )}
            </div>
            {/* Supp 2: SLA Gauge */}
            <div style={{ ...card, height: 265, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <p style={chartLabel}>SLA Delivery Compliance</p>
                <p style={{ ...chartDesc, margin: '0 0 1rem 0' }}>Fleet performance against contractual 95% SLA target</p>
                <div style={{ padding:'0.5rem 0', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                    <div style={{ position:'relative', width:'100%', height:28, background:'var(--bg)', borderRadius:14, overflow:'hidden', border: '1px solid var(--border)' }}>
                        <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${Math.min(100, Math.max(0, slaRate))}%`, background: slaRate >= 90 ? SEMANTIC.success : SEMANTIC.warning, transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ marginTop:'0.75rem', display:'flex', justifyContent:'space-between', width:'100%', fontSize:'0.82rem', color:'var(--muted)' }}>
                        <span>0%</span>
                        <span style={{ fontWeight:700, color:'var(--text)' }}>{slaRate}% (Target: 95%)</span>
                        <span>100%</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dedicated Full 3/4 Viewport Live Map ────────────────────────────────────
export function LiveMap() {
  const { data: shipmentsData, loading, error, refetch } = useAnalytics('/tracking/shipments');
  const [shipments, setShipments] = useState([]);
  const [selectedShipment, setSelectedShipment] = useState(null);

  useEffect(() => {
    const list = Array.isArray(shipmentsData?.data || shipmentsData) ? (shipmentsData?.data || shipmentsData) : [];
    setShipments(list);
  }, [shipmentsData]);

  // Live telematics refresh interval (5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof refetch === 'function') refetch();
    }, 5000);
    return () => clearInterval(timer);
  }, [refetch]);

  const activeShipment = selectedShipment || shipments[0] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--dashboard-heading)' }}>
            Live Geospatial Fleet Telematics
          </h1>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
            Real-time GPS tracking, active waypoint telemetry, ETA forecasting, and cargo load weights.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '0.35rem 0.85rem', borderRadius: '6px', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 700, fontSize: '0.8rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
            LIVE TELEMATICS ACTIVE
          </span>
        </div>
      </div>

      {/* Main 3/4 Page Map Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 3fr) minmax(300px, 1fr)', gap: '1.25rem', height: '75vh', minHeight: '620px' }}>
        {/* Map Container (Takes 3/4 of the width & full 75vh height) */}
        <div style={{ ...card, padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <MapContainer center={[20.5937, 78.9629]} zoom={5} style={{ height: '100%', width: '100%', zIndex: 1 }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {shipments
              .filter(s => s.lat != null && s.lng != null && !isNaN(Number(s.lat)) && !isNaN(Number(s.lng)))
              .map((s, idx) => {
                const lat = Number(s.lat);
                const lng = Number(s.lng);
                const weightDisplay = s.weight ? `${Number(s.weight).toLocaleString()} kg` : 'Weight not recorded';
                const delayDisplay = s.predicted_delay_minutes ? `${s.predicted_delay_minutes} min delay` : 'On Schedule';
                return (
                  <Marker 
                    key={s.shipment_id || idx} 
                    position={[lat, lng]}
                    eventHandlers={{
                      click: () => setSelectedShipment(s)
                    }}
                  >
                    <Popup>
                      <div style={{ padding: '6px', fontSize: '0.85rem', color: '#1E293B', minWidth: '190px' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '4px', marginBottom: '6px', color: '#0F172A' }}>
                          🚚 {s.shipment_id}
                        </div>
                        <div style={{ display: 'grid', gap: '3px' }}>
                          <div><strong>Route:</strong> {s.origin || 'Warehouse'} ➔ {s.destination || 'Hub'}</div>
                          <div><strong>Status:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>{s.status || 'IN_TRANSIT'}</span></div>
                          <div><strong>Cargo Weight:</strong> {weightDisplay}</div>
                          <div><strong>ETA:</strong> {s.eta || s.planned_eta || 'ETA unavailable'}</div>
                          <div><strong>Delay Risk:</strong> {delayDisplay}</div>
                          <div><strong>Risk Score:</strong> {s.delay_risk_score != null ? `${s.delay_risk_score}/100` : '0/100'}</div>
                          {s.vehicle_number && <div><strong>Vehicle Plate:</strong> {s.vehicle_number}</div>}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
          </MapContainer>
        </div>

        {/* Live Telemetry Sidebar */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--dashboard-heading)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Active Fleet Radar ({shipments.length})
          </h3>

          {/* Shipment selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
            {shipments.map((s, idx) => {
              const isSelected = activeShipment?.shipment_id === s.shipment_id;
              return (
                <div
                  key={s.shipment_id || idx}
                  onClick={() => setSelectedShipment(s)}
                  style={{
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                    background: isSelected ? 'rgba(59,130,246,0.1)' : 'var(--bg)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? 'var(--primary)' : 'var(--text)' }}>
                      {s.shipment_id}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {s.origin || 'Origin'} ➔ {s.destination || 'Destination'}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: s.predicted_delay_minutes > 15 ? '#ef4444' : '#10b981' }}>
                    {s.predicted_delay_minutes ? `+${s.predicted_delay_minutes}m` : 'On Time'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Selected Shipment Telemetry Detail */}
          {activeShipment ? (
            <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>Selected Telemetry</span>
                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, background: 'rgba(59,130,246,0.15)', color: 'var(--primary)' }}>
                  {activeShipment.status || 'IN_TRANSIT'}
                </span>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text)' }}>
                {activeShipment.shipment_id}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.8rem' }}>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>CARGO WEIGHT</div>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>{activeShipment.weight ? `${Number(activeShipment.weight).toLocaleString()} kg` : 'Weight not recorded'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>ESTIMATED ETA</div>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>{activeShipment.eta || activeShipment.planned_eta || 'ETA unavailable'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>PREDICTED DELAY</div>
                  <div style={{ fontWeight: 700, color: activeShipment.predicted_delay_minutes ? '#ef4444' : '#10b981' }}>
                    {activeShipment.predicted_delay_minutes ? `${activeShipment.predicted_delay_minutes} mins` : '0 mins (On Time)'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>DELAY RISK SCORE</div>
                  <div style={{ fontWeight: 700, color: (activeShipment.delay_risk_score || 0) > 30 ? '#ef4444' : '#10b981' }}>
                    {activeShipment.delay_risk_score != null ? activeShipment.delay_risk_score : 0} / 100
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>VEHICLE ASSIGNED</div>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>{activeShipment.vehicle_number || 'Unassigned'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.72rem' }}>ROUTE DEVIATION</div>
                  <div style={{ fontWeight: 700, color: 'var(--text)' }}>{activeShipment.route_deviation || 'LOW'}</div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>
              No active shipments detected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 2. Real Route Optimizer (Fix 5) ──────────────────────────────────────────
export function RouteOptimizer() {
  const [shipments, setShipments] = useState([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState('');
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [optimizationResult, setOptimizationResult] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const fetchShipments = async () => {
    setLoadingShipments(true);
    try {
      const res = await axios.get('/api/route-optimizer/shipments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const list = res.data?.data || res.data || [];
      setShipments(Array.isArray(list) ? list : []);
      if (list.length > 0 && !selectedShipmentId) {
        setSelectedShipmentId(list[0].shipment_id);
      }
    } catch (e) {
      console.error('Failed to load optimizable shipments', e);
    } finally {
      setLoadingShipments(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const activeShipment = shipments.find(s => s.shipment_id === selectedShipmentId) || shipments[0];

  const handleOptimize = async () => {
    if (!activeShipment) return;
    setOptimizing(true);
    setStatusMessage(null);

    // City coordinates dictionary for realistic calculation
    const CITY_COORDS = {
      'Bangalore': { lat: 12.9716, lng: 77.5946 },
      'Chennai': { lat: 13.0827, lng: 80.2707 },
      'Mumbai': { lat: 19.0760, lng: 72.8777 },
      'Delhi': { lat: 28.6139, lng: 77.2090 },
      'Pune': { lat: 18.5204, lng: 73.8567 },
      'Hyderabad': { lat: 17.3850, lng: 78.4867 },
      'Kolkata': { lat: 22.5726, lng: 88.3639 },
      'Ahmedabad': { lat: 23.0225, lng: 72.5714 }
    };

    const originName = activeShipment.origin || 'Bangalore';
    const destName = activeShipment.destination || 'Chennai';
    const originCoords = CITY_COORDS[originName] || { lat: activeShipment.lat || 12.9716, lng: activeShipment.lng || 77.5946 };
    const destCoords = CITY_COORDS[destName] || { lat: 13.0827, lng: 80.2707 };

    try {
      const res = await axios.post('/api/route-optimizer/optimize', {
        shipment_id: activeShipment.shipment_id,
        current_location: originCoords,
        destination: destCoords
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setOptimizationResult(res.data?.data || null);
    } catch (err) {
      setStatusMessage({ type: 'error', text: err?.response?.data?.message || err?.message || 'Failed to optimize route' });
    } finally {
      setOptimizing(false);
    }
  };

  const handleApplyRoute = async () => {
    if (!activeShipment || !optimizationResult) return;
    setApplying(true);
    setStatusMessage(null);

    try {
      await axios.post('/api/route-optimizer/apply', {
        shipment_id: activeShipment.shipment_id,
        distance_km: optimizationResult.distance_after,
        eta_hours: optimizationResult.time_after,
        estimated_cost: optimizationResult.cost_after,
        risk_score: optimizationResult.risk_after,
        notes: `Optimized route applied via Route Optimizer. Distance saved: ${optimizationResult.distance_before - optimizationResult.distance_after} km.`
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setStatusMessage({
        type: 'success',
        text: `Optimized route successfully applied to shipment ${activeShipment.shipment_id}. Database updated and driver notified.`
      });
      fetchShipments();
    } catch (err) {
      setStatusMessage({ type: 'error', text: err?.response?.data?.message || err?.message || 'Failed to apply route' });
    } finally {
      setApplying(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--dashboard-heading)' }}>
            🗺️ Fleet Route Optimizer
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.875rem' }}>
            Multi-constraint AI route solver balancing payload weight, vehicle capacity, fuel economy, and transit delay risks
          </p>
        </div>
      </div>

      {statusMessage && (
        <div style={{
          padding: '0.75rem 1.25rem',
          borderRadius: '8px',
          background: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${statusMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: statusMessage.type === 'success' ? '#065f46' : '#991b1b',
          fontSize: '0.875rem',
          fontWeight: 600
        }}>
          {statusMessage.text}
        </div>
      )}

      {/* Shipment Selection & Constraints */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        <div style={card}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Select Active Consignment</h3>
          {loadingShipments ? (
            <p style={{ color: 'var(--muted)' }}>Loading active fleet consignments...</p>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                Active Consignment
              </label>
              <select
                value={selectedShipmentId}
                onChange={(e) => {
                  setSelectedShipmentId(e.target.value);
                  setOptimizationResult(null);
                }}
                style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', marginBottom: '1.25rem' }}
              >
                {shipments.map(s => (
                  <option key={s.shipment_id} value={s.shipment_id}>
                    {s.shipment_id} ({s.origin || 'Bangalore'} → {s.destination || 'Chennai'})
                  </option>
                ))}
              </select>

              {activeShipment && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Vehicle Plate:</span>
                    <strong>{activeShipment.vehicle_number || 'KA-01-AB-1234'}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Payload Weight:</span>
                    <strong>{Number(activeShipment.weight || 1250).toLocaleString()} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Vehicle Capacity:</span>
                    <strong>{Number(activeShipment.truck_capacity || 25000).toLocaleString()} kg</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Current Load:</span>
                    <strong>{activeShipment.current_load_percent || 78.5}%</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Current Deviation:</span>
                    <span style={{ color: activeShipment.route_deviation === 'OPTIMIZED_MINIMAL_RISK' ? '#10b981' : 'var(--muted)' }}>
                      {activeShipment.route_deviation || 'STANDARD'}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={handleOptimize}
                disabled={optimizing || !activeShipment}
                style={{
                  width: '100%',
                  marginTop: '1.5rem',
                  padding: '0.75rem',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                {optimizing ? 'Calculating Optimal Corridors...' : '⚡ Calculate AI Optimized Route'}
              </button>
            </div>
          )}
        </div>

        {/* Route Optimization Analytics & Recommendations */}
        <div style={card}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Route Recommendation Engine</h3>
          {!optimizationResult ? (
            <div style={{ height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🗺️</div>
              <p style={{ margin: 0, fontWeight: 600 }}>Select a shipment and click "Calculate AI Optimized Route"</p>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem' }}>The engine factors in road congestion, vehicle payload, and transit cost</p>
            </div>
          ) : (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Distance</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.25rem' }}>
                    {optimizationResult.distance_after} km
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem', fontWeight: 600 }}>
                    -{(optimizationResult.distance_before - optimizationResult.distance_after).toFixed(1)} km saved
                  </div>
                </div>

                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Transit ETA</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
                    {optimizationResult.time_after} hrs
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem', fontWeight: 600 }}>
                    -{(optimizationResult.time_before - optimizationResult.time_after).toFixed(1)} hrs faster
                  </div>
                </div>

                <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Fuel & Cost</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>
                    ₹{optimizationResult.cost_after.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem', fontWeight: 600 }}>
                    ₹{optimizationResult.money_saved.toLocaleString()} ({optimizationResult.percentage_saved.toFixed(0)}%) saved
                  </div>
                </div>

                <div style={{ background: 'rgba(139, 92, 246, 0.08)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Delay Risk</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#8b5cf6', marginTop: '0.25rem' }}>
                    {(optimizationResult.risk_after * 100).toFixed(0)}%
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.2rem', fontWeight: 600 }}>
                    Down from {(optimizationResult.risk_before * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Waypoints & Stops breakdown */}
              <div style={{ background: 'var(--bg)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text)' }}>
                  📍 Recommended Corridor Waypoints:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--muted)', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{activeShipment.origin || 'Bangalore'} (Depot)</span>
                  <span>➔</span>
                  <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                    Express Bypass Hub ({optimizationResult.optimized_path?.[1]?.lat || '13.02'}°, {optimizationResult.optimized_path?.[1]?.lng || '78.93'}°)
                  </span>
                  <span>➔</span>
                  <span style={{ fontWeight: 600, color: 'var(--text)' }}>{activeShipment.destination || 'Chennai'} (Distribution Facility)</span>
                </div>
              </div>

              {/* Apply Route Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button
                  onClick={handleApplyRoute}
                  disabled={applying}
                  style={{
                    padding: '0.75rem 1.75rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  {applying ? 'Applying Route...' : '✓ Apply Route to Shipment'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ─── 3. Fleet Management ─────────────────────────────────────────────────────
export function FleetManagement() {
  const { data, loading, error } = useAnalytics('/tracking/analytics/fleet');
  const statusDist = data?.status || [];
  const util = data?.utilization || [];
  const scatter = data?.ageVsCost || [];

  return (
    <div>
      <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 1.5rem 0', color: 'var(--dashboard-heading)' }}>Fleet Management</h1>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
        {/* Main: Donut Status */}
        <div style={card}>
            <p style={chartLabel}>Fleet Availability Status</p>
            <p style={chartDesc}>Current status of all registered vehicles.</p>
            {loading ? <LoadingCard height={300} /> : (
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={statusDist} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" dataKey="count" nameKey="status" paddingAngle={2}>
                            {statusDist.map((e, i) => (
                                <Cell key={i} fill={e.status === 'AVAILABLE' ? SEMANTIC.success : e.status === 'MAINTENANCE' ? SEMANTIC.critical : SEMANTIC.warning} />
                            ))}
                        </Pie>
                        <Tooltip content={<DTooltip />} />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            )}
        </div>
        {/* Supp 1: Stacked Bar Utilization */}
        <div style={card}>
            <p style={chartLabel}>Vehicle Utilization (Hours)</p>
            <p style={chartDesc}>Active vs Idle vs Maintenance hours for top vehicles.</p>
            {loading ? <LoadingCard height={300} /> : (
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={util}>
                        <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                        <XAxis dataKey="truckId" tick={{ fontSize:10, fill:CHART_STYLE.axisColor }} />
                        <YAxis tick={{ fontSize:10, fill:CHART_STYLE.axisColor }} />
                        <Tooltip content={<DTooltip />} />
                        <Legend />
                        <Bar dataKey="activeHours" stackId="a" fill={TRANSPORTER_MAP.primary} name="Active" />
                        <Bar dataKey="idleHours" stackId="a" fill="var(--border)" name="Idle" />
                        <Bar dataKey="maintenanceHours" stackId="a" fill={SEMANTIC.critical} name="Maintenance" />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
      </div>
      
      {/* Supp 2: Scatter age vs cost */}
      <div style={card}>
          <p style={chartLabel}>Vehicle Age vs. Maintenance Cost</p>
          <p style={chartDesc}>Identifying vehicles that are too expensive to maintain. X = Age (Months), Y = Cost (₹).</p>
          {loading ? <LoadingCard height={300} /> : (
              <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                      <XAxis type="number" dataKey="ageMonths" name="Age (Months)" tick={{ fontSize:11, fill:CHART_STYLE.axisColor }} />
                      <YAxis type="number" dataKey="maintenanceCost" name="Cost (₹)" tick={{ fontSize:11, fill:CHART_STYLE.axisColor }} />
                      <Tooltip content={<DTooltip />} cursor={{strokeDasharray: '3 3'}} />
                      <Scatter data={scatter} fill={SEMANTIC.warning} />
                  </ScatterChart>
              </ResponsiveContainer>
          )}
      </div>
    </div>
  );
}

// ─── 4. Fleet Maintenance Alerts (Fix 7) ──────────────────────────────────────
export function MaintenanceAlerts() {
  const { data: driverAnalytics, loading: analyticsLoading } = useAnalytics('/tracking/analytics/drivers');
  const [fleet, setFleet] = useState([]);
  const [loadingFleet, setLoadingFleet] = useState(true);

  const fetchFleet = async () => {
    try {
      const res = await axios.get('/api/tracking/fleet', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const list = res.data?.data || res.data || [];
      setFleet(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load fleet maintenance records', e);
    } finally {
      setLoadingFleet(false);
    }
  };

  useEffect(() => {
    fetchFleet();
  }, []);

  const issues = driverAnalytics?.issues || [];

  const attentionTrucks = fleet.filter(t => t.maintenance_status !== 'OPERATIONAL');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--dashboard-heading)' }}>
          🔧 Vehicle Maintenance Alerts
        </h1>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.875rem' }}>
          Real-time vehicle health monitoring, scheduled shop service, and mechanical interventions
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ ...card, borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            Operational Vehicles
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
            {fleet.filter(t => t.maintenance_status === 'OPERATIONAL').length} / {fleet.length}
          </div>
        </div>

        <div style={{ ...card, borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            In Shop / Out of Service
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>
            {fleet.filter(t => t.maintenance_status === 'IN_SHOP').length}
          </div>
        </div>

        <div style={{ ...card, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            Inspection Due
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>
            {fleet.filter(t => t.maintenance_status === 'INSPECTION_DUE').length}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Vehicles needing attention */}
        <div style={card}>
          <p style={chartLabel}>Vehicles Requiring Service</p>
          <p style={chartDesc}>Trucks flagged for maintenance check or shop repair.</p>
          {loadingFleet ? (
            <p style={{ color: 'var(--muted)' }}>Loading fleet data...</p>
          ) : attentionTrucks.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>All vehicles are currently operating within nominal service parameters.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem 0' }}>Plate #</th>
                  <th style={{ padding: '0.5rem 0' }}>Model</th>
                  <th style={{ padding: '0.5rem 0' }}>Status</th>
                  <th style={{ padding: '0.5rem 0' }}>Current Load</th>
                </tr>
              </thead>
              <tbody>
                {attentionTrucks.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.6rem 0', fontWeight: 600 }}>{t.plate_number}</td>
                    <td style={{ padding: '0.6rem 0', color: 'var(--muted)' }}>{t.model}</td>
                    <td style={{ padding: '0.6rem 0' }}>
                      <StatusPill status={t.maintenance_status === 'IN_SHOP' ? 'danger' : 'warning'} text={t.maintenance_status} />
                    </td>
                    <td style={{ padding: '0.6rem 0' }}>{t.current_load_percent || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Issue / Intervention Breakdown */}
        <div style={card}>
          <p style={chartLabel}>Fleet Maintenance Issues Breakdown</p>
          <p style={chartDesc}>Reported vehicle and driver intervention types.</p>
          {analyticsLoading ? <LoadingCard height={240} /> : issues.length === 0 ? (
            <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              No mechanical or route interventions logged.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={issues}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                <XAxis dataKey="type" tick={{ fontSize: 10, fill: CHART_STYLE.axisColor }} />
                <YAxis tick={{ fontSize: 10, fill: CHART_STYLE.axisColor }} />
                <Tooltip content={<DTooltip />} />
                <Bar dataKey="count" fill={SEMANTIC.critical} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 5. Driver Logs (Fix 7) ───────────────────────────────────────────────────
export function DriverLogs() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/tracking/drivers', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const list = res.data?.data || res.data || [];
      setDrivers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error('Failed to load driver roster', e);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const avgScore = drivers.length ? Math.round(drivers.reduce((acc, d) => acc + (d.performance_score || 0), 0) / drivers.length) : 0;
  const avgOnTime = drivers.length ? Math.round(drivers.reduce((acc, d) => acc + (d.on_time_percent || 0), 0) / drivers.length) : 0;
  const incidentFree = drivers.filter(d => (d.incident_count || 0) === 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--dashboard-heading)' }}>
          📋 Driver Logs &amp; Safety Compliance
        </h1>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.875rem' }}>
          Active commercial driver rosters, licensing, on-time performance scores, and incident audit records
        </p>
      </div>

      {/* Driver Performance KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={card}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            Active Commercial Drivers
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
            {drivers.length}
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            Avg Driver Performance Score
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6' }}>
            {avgScore} / 100
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            Fleet On-Time Delivery Rate
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
            {avgOnTime}%
          </div>
        </div>

        <div style={card}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            Incident-Free Drivers
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
            {incidentFree} / {drivers.length}
          </div>
        </div>
      </div>

      {/* Driver Roster Table */}
      <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)', color: 'var(--muted)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Driver Name</th>
              <th style={{ padding: '0.75rem 1rem' }}>Commercial License ID</th>
              <th style={{ padding: '0.75rem 1rem' }}>Contract Type</th>
              <th style={{ padding: '0.75rem 1rem' }}>Performance Score</th>
              <th style={{ padding: '0.75rem 1rem' }}>On-Time Rate</th>
              <th style={{ padding: '0.75rem 1rem' }}>Incident Count</th>
              <th style={{ padding: '0.75rem 1rem' }}>Safety Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  Loading driver roster...
                </td>
              </tr>
            ) : drivers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  No driver profiles registered in fleet management.
                </td>
              </tr>
            ) : (
              drivers.map(d => (
                <tr key={d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem' }}>
                        {d.name.charAt(0)}
                      </div>
                      <span>{d.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                    {d.license_id}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{d.contract_type}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: d.performance_score >= 90 ? '#10b981' : '#f59e0b' }}>
                    {d.performance_score}/100
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {d.on_time_percent}%
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: d.incident_count > 0 ? '#ef4444' : 'var(--text)' }}>
                    {d.incident_count}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <StatusPill status={d.incident_count === 0 ? 'success' : 'warning'} text={d.incident_count === 0 ? 'CLEAN' : 'FLAGGED'} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
