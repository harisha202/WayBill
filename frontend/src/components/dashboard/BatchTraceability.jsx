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

function BatchFlowPipeline({ links }) {
  if (!links?.length) {
    return (
      <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '3rem 1rem' }}>
        No batch flow data available.
      </div>
    );
  }

  // Aggregate counts per stage and status
  const stages = {
    production: { title: '1. Production Stage', icon: '⚙️', color: '#3b82f6', items: {} },
    qa: { title: '2. QA Inspection Stage', icon: '🔍', color: '#8b5cf6', items: {} },
    dispatch: { title: '3. Dispatch & Custody', icon: '📦', color: '#10b981', items: {} },
  };

  links.forEach(l => {
    // Sourced entries
    const parseNode = (str, isSource) => {
      const parts = str.split(': ');
      const stageKey = parts[0]?.trim().toLowerCase();
      const statusName = parts[1]?.trim() || str;
      return { stageKey, statusName };
    };

    const src = parseNode(l.source, true);
    const tgt = parseNode(l.target, false);

    if (src.stageKey === 'production') {
      stages.production.items[src.statusName] = (stages.production.items[src.statusName] || 0) + (l.value || 0);
    }
    if (tgt.stageKey === 'qa') {
      stages.qa.items[tgt.statusName] = (stages.qa.items[tgt.statusName] || 0) + (l.value || 0);
    }
    if (tgt.stageKey === 'dispatch') {
      stages.dispatch.items[tgt.statusName] = (stages.dispatch.items[tgt.statusName] || 0) + (l.value || 0);
    }
  });

  const getStatusTheme = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('COMPLETED') || s.includes('PASSED') || s.includes('SEALED') || s.includes('DELIVERED')) {
      return { bg: 'rgba(16, 185, 129, 0.12)', border: '#10b981', color: '#10b981', badgeBg: '#10b981' };
    }
    if (s.includes('STARTED') || s.includes('IN_TRANSIT')) {
      return { bg: 'rgba(59, 130, 246, 0.12)', border: '#3b82f6', color: '#3b82f6', badgeBg: '#3b82f6' };
    }
    if (s.includes('PENDING') || s.includes('PARTIALLY')) {
      return { bg: 'rgba(245, 158, 11, 0.12)', border: '#f59e0b', color: '#f59e0b', badgeBg: '#f59e0b' };
    }
    if (s.includes('FAILED') || s.includes('REJECTED')) {
      return { bg: 'rgba(239, 68, 68, 0.12)', border: '#ef4444', color: '#ef4444', badgeBg: '#ef4444' };
    }
    return { bg: 'rgba(148, 163, 184, 0.12)', border: '#94a3b8', color: '#94a3b8', badgeBg: '#64748b' };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%', height: '100%' }}>
      {/* 3-Column Pipeline Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', alignItems: 'stretch' }}>
        {Object.entries(stages).map(([key, stage], colIdx) => {
          const itemsList = Object.entries(stage.items);
          const stageTotal = itemsList.reduce((acc, [, val]) => acc + val, 0);

          return (
            <div 
              key={key} 
              style={{
                background: 'var(--bg)',
                border: `1px solid var(--border)`,
                borderRadius: '10px',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                position: 'relative'
              }}
            >
              {/* Stage Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>{stage.icon}</span>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text)' }}>{stage.title}</strong>
                </div>
                <span 
                  style={{ 
                    padding: '0.2rem 0.6rem', 
                    borderRadius: '12px', 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    background: `${stage.color}20`, 
                    color: stage.color, 
                    border: `1px solid ${stage.color}40` 
                  }}
                >
                  {stageTotal} Total
                </span>
              </div>

              {/* Status List Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
                {itemsList.length > 0 ? (
                  itemsList.map(([statusName, count]) => {
                    const theme = getStatusTheme(statusName);
                    const pct = stageTotal > 0 ? Math.round((count / stageTotal) * 100) : 0;

                    return (
                      <div
                        key={statusName}
                        style={{
                          background: 'var(--surface)',
                          border: `1px solid ${theme.border}40`,
                          borderLeft: `4px solid ${theme.border}`,
                          borderRadius: '8px',
                          padding: '0.85rem 1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.5rem',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', letterSpacing: '0.02em' }}>
                            {statusName}
                          </span>
                          <span 
                            style={{ 
                              padding: '0.2rem 0.65rem', 
                              borderRadius: '6px', 
                              fontSize: '0.82rem', 
                              fontWeight: 800, 
                              background: theme.bg, 
                              color: theme.color, 
                              border: `1px solid ${theme.border}50` 
                            }}
                          >
                            {count} {count === 1 ? 'Batch' : 'Batches'}
                          </span>
                        </div>

                        {/* Progress Share Bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                          <div style={{ flex: 1, height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: theme.border, borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 600, minWidth: '32px', textAlign: 'right' }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    No batches in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
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

          <div style={{ ...cardStyle, minHeight: '380px', height: 'auto' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.125rem', fontWeight: 700, color: 'var(--dashboard-heading)' }}>
              Batch Flow Traceability
            </h3>
            <BatchFlowPipeline links={analytics?.sankey_links || []} />
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
