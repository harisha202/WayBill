import React, { useState } from 'react';
import { useApi } from '../../api/hooks/useApi';
import { useAnalytics } from '../../api/hooks/useAnalytics';
import { DataTable } from '../ui/DataTable';
import { StatusPill } from '../ui/StatusPill';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ComposedChart
} from 'recharts';

const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' };

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

function SankeyChart({ links }) {
  if (!links?.length) return <div style={{textAlign:'center',color:'var(--muted)',padding:'2rem'}}>No batch flow data</div>;
  
  const width = 800, height = 460, nodeW = 20, pad = 8;
  
  const nodeMap = {};
  links.forEach(l => {
    if (!nodeMap[l.source]) nodeMap[l.source] = { name: l.source, inflow: 0, outflow: 0, value: 0 };
    if (!nodeMap[l.target]) nodeMap[l.target] = { name: l.target, inflow: 0, outflow: 0, value: 0 };
    nodeMap[l.source].outflow += l.value;
    nodeMap[l.target].inflow += l.value;
  });
  
  const layers = { 'Production:': 0, 'QA:': 1, 'Dispatch:': 2 };
  const nodeList = Object.values(nodeMap).map(n => ({
    ...n,
    layer: Object.entries(layers).find(([k]) => n.name.startsWith(k))?.[1] ?? 1,
    value: Math.max(n.inflow, n.outflow)
  }));
  
  const layerX = [60, 340, 620];
  const byLayer = [0,1,2].map(l => nodeList.filter(n => n.layer === l));
  
  byLayer.forEach(group => {
    const total = group.reduce((s, n) => s + n.value, 0) || 1;
    let y = 40;
    group.forEach(n => {
      n.h = Math.max(20, ((n.value / total) * (height - 80)));
      n.y = y;
      n.x = layerX[n.layer];
      y += n.h + pad;
    });
  });
  
  const nodeColor = name => {
    if (name.includes('COMPLETED') || name.includes('PASSED') || name.includes('DELIVERED')) return '#059669';
    if (name.includes('FAILED')) return '#DC2626';
    if (name.includes('PENDING')) return '#F59E0B';
    if (name.includes('Production')) return '#4F46E5';
    if (name.includes('QA')) return '#7C3AED';
    if (name.includes('Dispatch')) return '#06B6D4';
    return '#64748B';
  };
  
  const nodeOffsets = {};
  nodeList.forEach(n => { nodeOffsets[n.name] = { src: 0, tgt: 0 }; });
  
  const linkPaths = links.map((l, i) => {
    const src = nodeList.find(n => n.name === l.source);
    const tgt = nodeList.find(n => n.name === l.target);
    if (!src || !tgt) return null;
    const srcTotal = src.value || 1;
    const tgtTotal = tgt.value || 1;
    const lh_src = (l.value / srcTotal) * src.h;
    const lh_tgt = (l.value / tgtTotal) * tgt.h;
    const y0 = src.y + nodeOffsets[l.source].src;
    const y1 = tgt.y + nodeOffsets[l.target].tgt;
    nodeOffsets[l.source].src += lh_src;
    nodeOffsets[l.target].tgt += lh_tgt;
    const mx = (src.x + nodeW + tgt.x) / 2;
    const path = `M${src.x + nodeW},${y0} C${mx},${y0} ${mx},${y1} ${tgt.x},${y1} L${tgt.x},${y1 + lh_tgt} C${mx},${y1 + lh_tgt} ${mx},${y0 + lh_src} ${src.x + nodeW},${y0 + lh_src} Z`;
    const color = nodeColor(l.source);
    return <path key={i} d={path} fill={color} opacity={0.5} />;
  }).filter(Boolean);
  
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {linkPaths}
      {nodeList.map(n => (
        <g key={n.name}>
          <rect x={n.x} y={n.y} width={nodeW} height={Math.max(n.h, 4)} fill={nodeColor(n.name)} rx={3} />
          <text x={n.x + (n.layer === 2 ? nodeW + 6 : -6)} y={n.y + Math.max(n.h, 4)/2}
            textAnchor={n.layer === 2 ? 'start' : 'end'}
            dominantBaseline="middle" fontSize={11} fill="var(--text)">
            {n.name.replace(/^(Production|QA|Dispatch): /, '')} ({n.value})
          </text>
        </g>
      ))}
    </svg>
  );
}

export function BatchTraceability() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: analytics, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics('/manufacturer/analytics/batch', { 
    date_from: dateFrom, 
    date_to: dateTo 
  });

  const { data: ordersData, loading: ordersLoading } = useApi('/manufacturer/orders');

  const handleApply = () => {
    refetchAnalytics();
  };

  const handleClear = () => {
    setDateFrom('');
    setDateTo('');
  };

  const tableColumns = [
    { header: 'Order ID', accessor: 'order_id' },
    { header: 'Batch ID', accessor: 'batch_id' },
    { header: 'SKU', accessor: 'sku' },
    { header: 'Quantity', accessor: 'quantity' },
    { header: 'Status', accessor: (row) => <StatusPill status={row.status} /> },
    { header: 'QA Status', accessor: (row) => <StatusPill status={row.qa_status} /> },
    { header: 'Created At', accessor: (row) => new Date(row.created_at).toLocaleString() }
  ];

  const BATCH_COLORS = {
    CREATED: '#F59E0B',
    STARTED: '#2563EB',
    COMPLETED: '#059669'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Batch Traceability</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Track production batches from creation to delivery</p>
      </div>

      <div style={{ ...cardStyle, display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>Date From</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>Date To</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem' }}>
          <button onClick={handleApply} style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Apply</button>
          <button onClick={handleClear} style={{ padding: '0.5rem 1rem', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }}>Clear</button>
        </div>
      </div>

      {analyticsLoading ? (
        <div style={{ height: 120, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', marginBottom: '1.5rem' }}>Loading analytics...</div>
      ) : analyticsError ? (
        <div style={{ padding: '1rem', color: 'var(--red)', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', marginBottom: '1.5rem' }}>Unable to load analytics. <button onClick={refetchAnalytics} style={{ marginLeft: 8, cursor: 'pointer', color: 'var(--primary)', background: 'none', border: 'none', textDecoration: 'underline' }}>Retry</button></div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Total Batches</span>
              <span style={{ fontSize: '2rem', fontWeight: 600 }}>{analytics?.kpis?.total_batches || 0}</span>
            </div>
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Unique Batch IDs</span>
              <span style={{ fontSize: '2rem', fontWeight: 600 }}>{analytics?.kpis?.unique_batches || 0}</span>
            </div>
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Total Quantity</span>
              <span style={{ fontSize: '2rem', fontWeight: 600 }}>{analytics?.kpis?.total_qty || 0}</span>
            </div>
          </div>

          <div style={{ ...cardStyle, height: '520px' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Batch Flow Traceability</h3>
            <SankeyChart links={analytics?.sankey_links || []} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            <div style={{ ...cardStyle, height: '400px' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Batch Status</h3>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Tooltip content={<MfgTooltip />} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  <Pie data={analytics?.batch_status || []} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={2} isAnimationActive={false}>
                    {(analytics?.batch_status || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BATCH_COLORS[entry.status] || 'var(--primary)'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ ...cardStyle, height: '400px' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Volume Trend</h3>
              <ResponsiveContainer width="100%" height="90%">
                <ComposedChart data={analytics?.volume_trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<MfgTooltip />} />
                  <Legend />
                  <Bar yAxisId="right" dataKey="qty" name="Quantity" fill="#14B8A6" isAnimationActive={false} />
                  <Line yAxisId="left" type="monotone" dataKey="batch_count" name="Batches" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4, fill: '#4F46E5', strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      <div style={{ ...cardStyle }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Production Orders</h3>
        <DataTable data={ordersData || []} columns={tableColumns} loading={ordersLoading} />
      </div>
    </div>
  );
}
