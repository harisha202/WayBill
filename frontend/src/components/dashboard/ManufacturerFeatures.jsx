import React, { useState } from 'react';
import axios from 'axios';
import { useApi } from '../../api/hooks/useApi';
import { useAnalytics } from '../../api/hooks/useAnalytics';
import { manufacturerApi } from '../../api/services/manufacturerApi';
import { DataTable } from '../ui/DataTable';
import { StatusPill } from '../ui/StatusPill';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ComposedChart, ReferenceLine
} from 'recharts';

const MFG_COLORS = {
  // Dashboard - Blue/Cyan
  dashboard: { primary: '#2563EB', secondary: '#06B6D4', completed: '#059669', active: '#2563EB', pending: '#F59E0B' },
  // Production - Indigo/Blue
  production: { primary: '#4F46E5', secondary: '#6366F1', active: '#4F46E5', completed: '#059669', pending: '#F59E0B', failed: '#DC2626' },
  // Forecast - Purple/Indigo
  forecast: { actual: '#7C3AED', trend: '#4F46E5', sku: '#2563EB' },
  // Materials - Teal
  materials: { available: '#0D9488', reserved: '#2563EB', in_transit: '#06B6D4', at_risk: '#F59E0B', critical: '#DC2626', healthy: '#059669' },
  // Quality - Green/Emerald
  quality: { passed: '#059669', failed: '#DC2626', pending: '#F59E0B', defect: '#F97316' },
  // Financial - Emerald/Teal
  ledger: { value: '#16A34A', delivered: '#059669', dispatched: '#0D9488', pending: '#F59E0B', cost: '#64748B' },
};
const CHART_STYLE = { gridColor: 'rgba(148,163,184,0.15)', axisColor: '#94A3B8', tooltipBg: '#1E293B', tooltipText: '#F1F5F9', barRadius: 4 };

function MfgTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1E293B', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', padding: '10px 14px', fontSize: '0.8125rem', color: '#F1F5F9' }}>
      {label && <div style={{ marginBottom: 6, color: '#94A3B8', fontSize: '0.75rem' }}>{label}</div>}
      {payload.map((e, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: e.color || e.payload?.fill, display: 'inline-block' }} />
            {e.name}
          </span>
          <strong>{typeof e.value === 'number' ? e.value.toLocaleString() : e.value}</strong>
        </div>
      ))}
    </div>
  );
}

const FilterBar = ({ dateFrom, setDateFrom, dateTo, setDateTo, refetchAnalytics }) => (
  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
    <input type='date' value={dateFrom} onChange={e => setDateFrom(e.target.value)}
      style={{ padding: '0.4rem 0.75rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.875rem' }} />
    <input type='date' value={dateTo} onChange={e => setDateTo(e.target.value)}
      style={{ padding: '0.4rem 0.75rem', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--bg)', color: 'var(--text)', fontSize: '0.875rem' }} />
    <button onClick={refetchAnalytics} style={{ padding: '0.4rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>Apply</button>
    <button onClick={() => { setDateFrom(''); setDateTo(''); }} style={{ padding: '0.4rem 0.75rem', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }}>Clear</button>
  </div>
);

export function ManufacturerDashboard() {
  const { data: overview, loading, error, refetch } = useApi('/manufacturer/overview');
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics('/manufacturer/analytics/dashboard', { dateFrom, dateTo });

  if (error) return <div style={{ color: 'var(--red)' }}>Error loading overview: {error.message}</div>;

  const kpis = analyticsData?.kpis || {};
  const outputTrend = analyticsData?.output_trend || [];
  const byStatus = analyticsData?.by_status || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--dashboard-heading)' }}>Control Tower</h1>
        <button onClick={() => { refetch(); refetchAnalytics(); }} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface)', cursor: 'pointer' }}>Refresh Data</button>
      </div>

      <FilterBar dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} refetchAnalytics={refetchAnalytics} />

      {analyticsLoading ? (
        <div style={{ height: 120, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', marginBottom: '2rem' }}>Loading analytics...</div>
      ) : analyticsError ? (
        <div style={{ padding: '1rem', color: 'var(--red)', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: '1.5rem' }}>Unable to load analytics. <button onClick={refetchAnalytics} style={{ marginLeft: 8, cursor: 'pointer', color: 'var(--primary)', background: 'none', border: 'none', textDecoration: 'underline' }}>Retry</button></div>
      ) : analyticsData ? (
        <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Orders</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{kpis.total_orders || 0}</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Orders</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{kpis.active_orders || 0}</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Completed Orders</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{kpis.completed_orders || 0}</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Completion Rate</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{typeof kpis.completion_rate === 'number' ? kpis.completion_rate.toFixed(1) : '0.0'}%</p>
            </div>
          </div>

          {/* Main chart */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Output Trend</p>
            <ResponsiveContainer width="100%" height={480}>
              <AreaChart data={outputTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStarted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={MFG_COLORS.dashboard.primary} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={MFG_COLORS.dashboard.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={MFG_COLORS.dashboard.completed} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={MFG_COLORS.dashboard.completed} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                <XAxis dataKey="day" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<MfgTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area isAnimationActive={false} type="monotone" dataKey="started_qty" name="Started Qty" stroke={MFG_COLORS.dashboard.primary} fillOpacity={1} fill="url(#colorStarted)" />
                <Area isAnimationActive={false} type="monotone" dataKey="completed_qty" name="Completed Qty" stroke={MFG_COLORS.dashboard.completed} fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Supporting row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Orders by Status</p>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={byStatus} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                  <XAxis dataKey="status" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<MfgTooltip />} />
                  <Bar isAnimationActive={false} dataKey="count" name="Count" radius={[CHART_STYLE.barRadius, CHART_STYLE.barRadius, 0, 0]}>
                    {byStatus.map((entry, index) => {
                      let color = MFG_COLORS.dashboard.pending;
                      if (entry.status === 'STARTED') color = MFG_COLORS.dashboard.active;
                      if (entry.status === 'COMPLETED') color = MFG_COLORS.dashboard.completed;
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Order Distribution</p>
              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <Pie
                    isAnimationActive={false}
                    data={[
                      { name: 'Completed', value: kpis.completed_orders || 0, color: MFG_COLORS.dashboard.completed },
                      { name: 'Active', value: kpis.active_orders || 0, color: MFG_COLORS.dashboard.active },
                      { name: 'Created', value: (kpis.total_orders || 0) - (kpis.completed_orders || 0) - (kpis.active_orders || 0), color: MFG_COLORS.dashboard.pending }
                    ].filter(d => d.value > 0)}
                    cx="50%" cy="50%" innerRadius={80} outerRadius={120}
                    dataKey="value" stroke="none"
                  >
                    {([
                      { name: 'Completed', value: kpis.completed_orders || 0, color: MFG_COLORS.dashboard.completed },
                      { name: 'Active', value: kpis.active_orders || 0, color: MFG_COLORS.dashboard.active },
                      { name: 'Created', value: (kpis.total_orders || 0) - (kpis.completed_orders || 0) - (kpis.active_orders || 0), color: MFG_COLORS.dashboard.pending }
                    ]).filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<MfgTooltip />} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? <div>Loading...</div> : overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--muted)', fontSize: '1rem' }}>Total Orders</h3>
            <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, color: 'var(--text)' }}>{overview.total_orders}</p>
          </div>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--muted)', fontSize: '1rem' }}>Active Production</h3>
            <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, color: 'var(--primary)' }}>{overview.active_orders}</p>
          </div>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--muted)', fontSize: '1rem' }}>Completed</h3>
            <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, color: 'var(--green)' }}>{overview.completed_orders}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function Production() {
  const { data: orders, loading, error, refetch } = useApi('/manufacturer/orders');
  const [processing, setProcessing] = useState(null);
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics('/manufacturer/analytics/production', { dateFrom, dateTo });
  
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  const downloadCSV = async (type) => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const response = await axios.get(`/api/manufacturer/reports/export?type=${type}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const url = URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `waybill_${type}_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setDownloadError('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  const handleStart = async (orderId) => {
    if (!window.confirm("Commence production sequence?")) return;
    setProcessing(orderId);
    try {
      await manufacturerApi.startProduction(orderId);
      refetch();
      refetchAnalytics();
    } catch (e) {
      alert("Error starting: " + (e.response?.data?.detail || e.message));
    } finally {
      setProcessing(null);
    }
  };

  const handleComplete = async (orderId) => {
    if (!window.confirm("Mark production as completed? This will increase finished goods inventory.")) return;
    setProcessing(orderId);
    try {
      await manufacturerApi.completeProduction(orderId);
      refetch();
      refetchAnalytics();
    } catch (e) {
      alert("Error completing: " + (e.response?.data?.detail || e.message));
    } finally {
      setProcessing(null);
    }
  };

  const columns = [
    { key: 'order_id', header: 'Order ID', render: val => <strong>{val}</strong> },
    { key: 'sku', header: 'SKU' },
    { key: 'quantity', header: 'Qty' },
    { key: 'status', header: 'Production', render: val => <StatusPill status={val === 'STARTED' ? 'active' : val === 'COMPLETED' ? 'success' : 'pending'} text={val} /> },
    { key: 'qa_status', header: 'QA', render: val => <StatusPill status={val === 'PASSED' ? 'success' : val === 'FAILED' ? 'warning' : 'pending'} text={val} /> },
    { 
      key: 'actions', 
      header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {row.status === 'CREATED' && (
            <button disabled={processing === row.order_id} onClick={() => handleStart(row.order_id)} style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Start</button>
          )}
          {row.status === 'STARTED' && row.qa_status === 'PASSED' && (
            <button disabled={processing === row.order_id} onClick={() => handleComplete(row.order_id)} style={{ padding: '6px 12px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Complete</button>
          )}
        </div>
      )
    }
  ];

  if (error) return <div style={{ color: 'var(--red)' }}>Error: {error.message}</div>;

  const ganttData = (analyticsData?.gantt_data || []).slice(0, 15).map((d, i) => {
    const start = d.start_date ? new Date(d.start_date).getTime() : new Date(d.created_at).getTime();
    const end = d.end_date ? new Date(d.end_date).getTime() : new Date().getTime();
    const duration = Math.max((end - start) / (1000 * 60 * 60 * 24), 0.1); // min 0.1 days to show up
    return { ...d, duration, index: i };
  });

  const stackedStatus = analyticsData?.status_qa_stacked || [];
  const qtyTrend = analyticsData?.qty_trend || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--dashboard-heading)' }}>Production Floor</h2>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {downloadError && <span style={{ color: 'red', fontSize: '0.8rem' }}>{downloadError}</span>}
          <button onClick={() => downloadCSV('production')} disabled={downloading} style={{ padding: '0.45rem 1rem', border: '1px solid var(--primary)', borderRadius: 6, background: 'var(--primary)', color: 'white', cursor: 'pointer', fontSize: '0.85rem' }}>
            {downloading ? 'Downloading...' : '⬇ Download CSV'}
          </button>
        </div>
      </div>
      
      <FilterBar dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} refetchAnalytics={refetchAnalytics} />

      {analyticsLoading ? (
        <div style={{ height: 120, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', marginBottom: '2rem' }}>Loading analytics...</div>
      ) : analyticsError ? (
        <div style={{ padding: '1rem', color: 'var(--red)', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: '1.5rem' }}>Unable to load analytics. <button onClick={refetchAnalytics} style={{ marginLeft: 8, cursor: 'pointer', color: 'var(--primary)', background: 'none', border: 'none', textDecoration: 'underline' }}>Retry</button></div>
      ) : analyticsData ? (
        <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* Main chart */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Production Timeline (Recent Orders)</p>
            <ResponsiveContainer width="100%" height={480}>
              <BarChart layout="vertical" data={ganttData} margin={{ top: 10, right: 10, left: 40, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} horizontal={false} />
                <XAxis type="number" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="order_id" type="category" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<MfgTooltip />} cursor={{fill: 'transparent'}} />
                <Bar isAnimationActive={false} dataKey="duration" name="Duration (Days)" radius={[0, CHART_STYLE.barRadius, CHART_STYLE.barRadius, 0]}>
                  {ganttData.map((entry, index) => {
                    let color = MFG_COLORS.production.pending;
                    if (entry.status === 'STARTED') color = MFG_COLORS.production.active;
                    if (entry.status === 'COMPLETED') color = MFG_COLORS.production.completed;
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Supporting row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Orders by Status & QA</p>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={stackedStatus} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                  <XAxis dataKey="status" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<MfgTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar isAnimationActive={false} dataKey="PENDING" stackId="a" name="Pending QA" fill={MFG_COLORS.production.pending} />
                  <Bar isAnimationActive={false} dataKey="PASSED" stackId="a" name="Passed QA" fill={MFG_COLORS.quality.passed} />
                  <Bar isAnimationActive={false} dataKey="FAILED" stackId="a" name="Failed QA" fill={MFG_COLORS.quality.failed} radius={[CHART_STYLE.barRadius, CHART_STYLE.barRadius, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Production Trend (Qty)</p>
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={qtyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                  <XAxis dataKey="day" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<MfgTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Line isAnimationActive={false} type="monotone" dataKey="started" name="Started Qty" stroke={MFG_COLORS.production.active} strokeWidth={2} dot={false} />
                  <Line isAnimationActive={false} type="monotone" dataKey="completed" name="Completed Qty" stroke={MFG_COLORS.production.completed} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}

      <DataTable data={(orders || []).filter(o => o.status !== 'COMPLETED')} columns={columns} loading={loading} emptyMessage="No active production lines." />
    </div>
  );
}

export function AIForecast() {
  const { data: demand, loading, error } = useApi('/manufacturer/demand');
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics('/manufacturer/analytics/forecast', { dateFrom, dateTo });

  const columns = [
    { key: 'order_code', header: 'External Order', render: val => <strong>{val}</strong> },
    { key: 'product_sku', header: 'SKU' },
    { key: 'quantity', header: 'Ordered Qty' },
    { key: 'retailer_name', header: 'Retailer' },
    { key: 'status', header: 'Status', render: val => <StatusPill status={val === 'DELIVERED' ? 'success' : 'pending'} text={val} /> }
  ];

  if (error) return <div style={{ color: 'var(--red)' }}>Error: {error.message}</div>;

  const kpis = analyticsData?.kpis || {};
  const demandTrend = analyticsData?.demand_trend || [];
  const demandBySku = analyticsData?.demand_by_sku || [];
  const historicalTrend = analyticsData?.historical_trend || [];

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Market Demand Analysis</h2>
      
      <FilterBar dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} refetchAnalytics={refetchAnalytics} />

      {analyticsLoading ? (
        <div style={{ height: 120, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', marginBottom: '2rem' }}>Loading analytics...</div>
      ) : analyticsError ? (
        <div style={{ padding: '1rem', color: 'var(--red)', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: '1.5rem' }}>Unable to load analytics. <button onClick={refetchAnalytics} style={{ marginLeft: 8, cursor: 'pointer', color: 'var(--primary)', background: 'none', border: 'none', textDecoration: 'underline' }}>Retry</button></div>
      ) : analyticsData ? (
        <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Demand Orders</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{kpis.total_orders || 0}</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Demand Qty</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{kpis.total_demand || 0}</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Unique SKUs</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{kpis.unique_skus || 0}</p>
            </div>
          </div>

          {/* Main chart */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Demand Trend</p>
            <ResponsiveContainer width="100%" height={480}>
              <AreaChart data={demandTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={MFG_COLORS.forecast.actual} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={MFG_COLORS.forecast.actual} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                <XAxis dataKey="day" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<MfgTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Area isAnimationActive={false} type="monotone" dataKey="demand_qty" name="Actual Demand" stroke={MFG_COLORS.forecast.actual} fillOpacity={1} fill="url(#colorDemand)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Supporting row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Demand by SKU</p>
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={demandBySku} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                  <XAxis dataKey="sku" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<MfgTooltip />} />
                  <Bar isAnimationActive={false} dataKey="demand_qty" name="Demand Qty" fill={MFG_COLORS.forecast.sku} radius={[CHART_STYLE.barRadius, CHART_STYLE.barRadius, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Historical Trend</p>
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={historicalTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                  <XAxis dataKey="week" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<MfgTooltip />} />
                  <Line isAnimationActive={false} type="monotone" dataKey="demand_qty" name="Demand Qty" stroke={MFG_COLORS.forecast.trend} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}

      <DataTable data={demand || []} columns={columns} loading={loading} emptyMessage="No demand records found." />
    </div>
  );
}

export function RawMaterialSourcing() {
  const { data: inventory, loading, error } = useApi('/manufacturer/inventory');

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics('/manufacturer/analytics/materials', { dateFrom, dateTo });

  const columns = [
    { key: 'sku', header: 'SKU', render: val => <strong>{val}</strong> },
    { key: 'name', header: 'Material / Product' },
    { key: 'available_stock', header: 'Available' },
    { key: 'reserved_stock', header: 'Reserved' },
    { key: 'in_transit', header: 'In Transit' },
    { key: 'reorder_point', header: 'Reorder Point' }
  ];

  if (error) return <div style={{ color: 'var(--red)' }}>Error: {error.message}</div>;

  const kpis = analyticsData?.kpis || {};
  const stockItems = (analyticsData?.stock_items || []).slice(0, 15);
  const stockMovements = analyticsData?.stock_movements || [];
  const hasMovements = !!analyticsData?.has_movements;
  
  const riskColorMap = {
    'Healthy': MFG_COLORS.materials.healthy,
    'At Risk': MFG_COLORS.materials.at_risk,
    'Critical': MFG_COLORS.materials.critical
  };

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Raw Material Inventory</h2>

      <FilterBar dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} refetchAnalytics={refetchAnalytics} />

      {analyticsLoading ? (
        <div style={{ height: 120, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', marginBottom: '2rem' }}>Loading analytics...</div>
      ) : analyticsError ? (
        <div style={{ padding: '1rem', color: 'var(--red)', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: '1.5rem' }}>Unable to load analytics. <button onClick={refetchAnalytics} style={{ marginLeft: 8, cursor: 'pointer', color: 'var(--primary)', background: 'none', border: 'none', textDecoration: 'underline' }}>Retry</button></div>
      ) : analyticsData ? (
        <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total SKUs</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{kpis.total_skus || 0}</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>At Risk</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{kpis.at_risk || 0}</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Critical</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{kpis.critical || 0}</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estimated Value</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>${(kpis.total_value || 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Main chart */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Top Risk Materials</p>
            <ResponsiveContainer width="100%" height={480}>
              <BarChart data={stockItems} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                <XAxis dataKey="sku" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<MfgTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Bar isAnimationActive={false} dataKey="available" stackId="a" name="Available" fill={MFG_COLORS.materials.available} />
                <Bar isAnimationActive={false} dataKey="reserved" stackId="a" name="Reserved" fill={MFG_COLORS.materials.reserved} />
                <Bar isAnimationActive={false} dataKey="in_transit" stackId="a" name="In Transit" fill={MFG_COLORS.materials.in_transit} radius={[CHART_STYLE.barRadius, CHART_STYLE.barRadius, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Supporting row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>{hasMovements ? 'Stock Movements' : 'Stock vs Reorder Point'}</p>
              <ResponsiveContainer width="100%" height={380}>
                {hasMovements ? (
                  <LineChart data={stockMovements} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                    <XAxis dataKey="day" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<MfgTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Line isAnimationActive={false} type="monotone" dataKey="stock_in" name="Stock In" stroke={MFG_COLORS.materials.available} strokeWidth={2} dot={false} />
                    <Line isAnimationActive={false} type="monotone" dataKey="stock_out" name="Stock Out" stroke={MFG_COLORS.materials.critical} strokeWidth={2} dot={false} />
                  </LineChart>
                ) : (
                  <BarChart data={stockItems} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                    <XAxis dataKey="sku" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<MfgTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Bar isAnimationActive={false} dataKey="available" name="Available Stock" fill={MFG_COLORS.materials.available} radius={[CHART_STYLE.barRadius, CHART_STYLE.barRadius, 0, 0]} />
                    <Line isAnimationActive={false} type="stepAfter" dataKey="reorder_point" name="Reorder Point" stroke={MFG_COLORS.materials.at_risk} strokeWidth={2} dot={false} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Risk Heatmap</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '8px', height: '380px', alignContent: 'start', overflowY: 'auto' }}>
                {(analyticsData?.stock_items || []).map((item, idx) => (
                  <div key={idx} title={`${item.sku}: ${item.name} (${item.risk})`} style={{
                    aspectRatio: '1',
                    borderRadius: '4px',
                    background: riskColorMap[item.risk] || MFG_COLORS.materials.healthy,
                    cursor: 'help'
                  }} />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <DataTable data={inventory || []} columns={columns} loading={loading} emptyMessage="No inventory records found." />
    </div>
  );
}

export function QualityAssurance() {
  const { data: qas, loading, error, refetch } = useApi('/manufacturer/quality');
  const { data: orders } = useApi('/manufacturer/orders');
  
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics('/manufacturer/analytics/quality', { dateFrom, dateTo });

  const [orderId, setOrderId] = useState('');
  const [passed, setPassed] = useState('');
  const [failed, setFailed] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await manufacturerApi.createQualityInspection(orderId, Number(passed), Number(failed), "Standard", "Visual Check");
      setOrderId(''); setPassed(''); setFailed('');
      refetch();
      refetchAnalytics();
    } catch (e) {
      alert("QA Error: " + (e.response?.data?.detail || e.message));
    }
  };

  const columns = [
    { key: 'inspection_id', header: 'ID', render: val => <strong>{val}</strong> },
    { key: 'production_order_id', header: 'Order' },
    { key: 'quantity_passed', header: 'Passed', render: val => <span style={{color: 'var(--green)', fontWeight: 'bold'}}>{val}</span> },
    { key: 'quantity_failed', header: 'Failed', render: val => <span style={{color: val > 0 ? 'var(--red)' : 'var(--text)', fontWeight: 'bold'}}>{val}</span> },
    { key: 'status', header: 'Result', render: val => <StatusPill status={val === 'PASSED' ? 'success' : val === 'FAILED' ? 'error' : 'warning'} text={val} /> },
  ];

  const activeOrders = (orders || []).filter(o => o.status === 'STARTED');

  const kpis = analyticsData?.kpis || {};
  const passFailTrend = analyticsData?.pass_fail_trend || [];
  const defectPareto = analyticsData?.defect_pareto || [];
  const resultDonut = analyticsData?.result_donut || [];

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Quality Assurance</h2>

      <FilterBar dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} refetchAnalytics={refetchAnalytics} />

      {analyticsLoading ? (
        <div style={{ height: 120, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', marginBottom: '2rem' }}>Loading analytics...</div>
      ) : analyticsError ? (
        <div style={{ padding: '1rem', color: 'var(--red)', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: '1.5rem' }}>Unable to load analytics. <button onClick={refetchAnalytics} style={{ marginLeft: 8, cursor: 'pointer', color: 'var(--primary)', background: 'none', border: 'none', textDecoration: 'underline' }}>Retry</button></div>
      ) : analyticsData ? (
        <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Inspected</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{kpis.total_inspected || 0}</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pass Rate</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{typeof kpis.pass_rate === 'number' ? kpis.pass_rate.toFixed(1) : '0.0'}%</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Defect Rate</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{typeof kpis.defect_rate === 'number' ? kpis.defect_rate.toFixed(1) : '0.0'}%</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Inspections</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{(kpis.total_passed || 0) + (kpis.total_failed || 0)}</p>
            </div>
          </div>

          {/* Main chart */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Pass/Fail Trend</p>
            <ResponsiveContainer width="100%" height={500}>
              <LineChart data={passFailTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                <XAxis dataKey="day" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<MfgTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                <Line isAnimationActive={false} type="monotone" dataKey="passed" name="Passed" stroke={MFG_COLORS.quality.passed} strokeWidth={2} dot={false} />
                <Line isAnimationActive={false} type="monotone" dataKey="failed" name="Failed" stroke={MFG_COLORS.quality.failed} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Supporting row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Defect Pareto</p>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={defectPareto} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                  <XAxis dataKey="defect_type" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip content={<MfgTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar isAnimationActive={false} yAxisId="left" dataKey="count" name="Count" fill={MFG_COLORS.quality.defect} radius={[CHART_STYLE.barRadius, CHART_STYLE.barRadius, 0, 0]} />
                  <Line isAnimationActive={false} yAxisId="right" type="monotone" dataKey="cumulative_pct" name="Cumulative %" stroke={MFG_COLORS.quality.pending} strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Inspection Results</p>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    isAnimationActive={false}
                    data={resultDonut}
                    cx="50%" cy="50%" innerRadius={80} outerRadius={120}
                    dataKey="count" stroke="none"
                  >
                    {resultDonut.map((entry, index) => {
                      let color = MFG_COLORS.quality.pending;
                      if (entry.status === 'PASSED') color = MFG_COLORS.quality.passed;
                      if (entry.status === 'FAILED') color = MFG_COLORS.quality.failed;
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip content={<MfgTooltip />} />
                  <Legend iconType="circle" />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '1.5rem', fontWeight: 'bold', fill: 'var(--text)' }}>
                    {typeof kpis.pass_rate === 'number' ? kpis.pass_rate.toFixed(1) : '0.0'}%
                  </text>
                  <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '0.8rem', fill: 'var(--muted)' }}>
                    Pass Rate
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Log QA Result</h2>
          <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Production Batch</label>
              <select value={orderId} onChange={e => setOrderId(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}>
                <option value="">-- Select Active Batch --</option>
                {activeOrders.map(o => <option key={o.order_id} value={o.order_id}>{o.order_id} (SKU: {o.sku})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Units Passed</label>
              <input type="number" min="0" required value={passed} onChange={e => setPassed(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Units Failed</label>
              <input type="number" min="0" required value={failed} onChange={e => setFailed(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }} />
            </div>
            <button type="submit" style={{ padding: '0.75rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>Submit Inspection</button>
          </form>
        </div>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Inspection History</h2>
          {error ? <div style={{ color: 'var(--red)' }}>Error: {error.message}</div> : <DataTable data={qas || []} columns={columns} loading={loading} emptyMessage="No QA records." />}
        </div>
      </div>
    </div>
  );
}

export function ManufacturerLedger() {
  const { data: orders, loading: oLoading, refetch } = useApi('/manufacturer/orders');
  const { data: waybills, loading: wLoading, error } = useApi('/manufacturer/waybills');
  const [processing, setProcessing] = useState(null);

  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics('/manufacturer/analytics/ledger', { dateFrom, dateTo });

  const handleDispatch = async (orderId) => {
    const dest = window.prompt("Enter Transporter ID destination (e.g. TR-100)");
    if (!dest) return;
    setProcessing(orderId);
    try {
      await manufacturerApi.dispatchManufacturedGoods(orderId, dest);
      refetch();
      refetchAnalytics();
    } catch (e) {
      alert("Dispatch error: " + (e.response?.data?.detail || e.message));
    } finally {
      setProcessing(null);
    }
  };

  const dispatchableOrders = (orders || []).filter(o => o.status === 'COMPLETED');

  const columns = [
    { key: 'waybill_id', header: 'Waybill ID', render: val => <strong>{val}</strong> },
    { key: 'order_code', header: 'Order Ref' },
    { key: 'origin', header: 'Origin' },
    { key: 'destination', header: 'Destination' },
    { key: 'status', header: 'Status', render: val => <StatusPill status={val === 'DELIVERED' ? 'success' : 'active'} text={val} /> }
  ];

  const kpis = analyticsData?.kpis || {};
  const waterfall = analyticsData?.waterfall || [];
  const waybillComposition = analyticsData?.waybill_composition || [];
  const dispatchTrend = analyticsData?.dispatch_trend || [];

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Financial & Waybill Ledger</h2>

      <FilterBar dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} refetchAnalytics={refetchAnalytics} />

      {analyticsLoading ? (
        <div style={{ height: 120, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', marginBottom: '2rem' }}>Loading analytics...</div>
      ) : analyticsError ? (
        <div style={{ padding: '1rem', color: 'var(--red)', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: '1.5rem' }}>Unable to load analytics. <button onClick={refetchAnalytics} style={{ marginLeft: 8, cursor: 'pointer', color: 'var(--primary)', background: 'none', border: 'none', textDecoration: 'underline' }}>Retry</button></div>
      ) : analyticsData ? (
        <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Waybills</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{kpis.total_waybills || 0}</p>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 0.25rem', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Delivered</p>
              <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>{kpis.delivered || 0}</p>
            </div>
          </div>

          {/* Main chart */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
            <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Production Value Waterfall</p>
            <ResponsiveContainer width="100%" height={480}>
              <BarChart data={waterfall} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                <XAxis dataKey="name" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<MfgTooltip />} />
                <Bar isAnimationActive={false} dataKey="value" name="Value" radius={[CHART_STYLE.barRadius, CHART_STYLE.barRadius, 0, 0]}>
                  {waterfall.map((entry, index) => {
                    let color = MFG_COLORS.ledger.pending;
                    if (entry.name === 'STARTED') color = MFG_COLORS.ledger.dispatched;
                    if (entry.name === 'COMPLETED') color = MFG_COLORS.ledger.delivered;
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Supporting row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Waybill Composition</p>
              <ResponsiveContainer width="100%" height={380}>
                <PieChart>
                  <Pie
                    isAnimationActive={false}
                    data={waybillComposition}
                    cx="50%" cy="50%" innerRadius={80} outerRadius={120}
                    dataKey="count" stroke="none"
                  >
                    {waybillComposition.map((entry, index) => {
                      let color = MFG_COLORS.ledger.pending;
                      if (entry.status === 'DELIVERED') color = MFG_COLORS.ledger.delivered;
                      if (entry.status === 'DISPATCHED') color = MFG_COLORS.ledger.dispatched;
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip content={<MfgTooltip />} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' }}>
              <p style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text)' }}>Dispatch Trend</p>
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={dispatchTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                  <XAxis dataKey="day" stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={CHART_STYLE.axisColor} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<MfgTooltip />} />
                  <Line isAnimationActive={false} type="monotone" dataKey="dispatches" name="Dispatches" stroke={MFG_COLORS.ledger.dispatched} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gap: '3rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Ready for Dispatch</h2>
          {dispatchableOrders.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface)', borderRadius: '12px', border: '1px dashed var(--border)', color: 'var(--muted)' }}>
              No completed batches awaiting dispatch.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {dispatchableOrders.map(o => (
                <div key={o.order_id} style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <strong style={{ fontSize: '1.1rem' }}>{o.order_id}</strong>
                    <StatusPill status="success" text="COMPLETED" />
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>SKU: {o.sku} • Qty: {o.quantity}</div>
                  <button 
                    disabled={processing === o.order_id} 
                    onClick={() => handleDispatch(o.order_id)} 
                    style={{ width: '100%', padding: '0.75rem', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Create Waybill & Dispatch
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Ledger Records</h2>
          {error ? <div style={{ color: 'var(--red)' }}>Error: {error.message}</div> : <DataTable data={waybills || []} columns={columns} loading={wLoading} emptyMessage="No ledger records." />}
        </div>
      </div>
    </div>
  );
}
