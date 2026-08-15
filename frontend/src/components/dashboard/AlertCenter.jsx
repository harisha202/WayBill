import React, { useState } from 'react';
import { useApi } from '../../api/hooks/useApi';
import { useAnalytics } from '../../api/hooks/useAnalytics';
import { DataTable } from '../ui/DataTable';
import { StatusPill } from '../ui/StatusPill';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';

const cardStyle = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '1.25rem' };

const SEVERITY_COLORS = {
  CRITICAL: '#DC2626',
  HIGH: '#F97316',
  MEDIUM: '#F59E0B',
  LOW: '#2563EB'
};

const STATUS_COLORS = {
  OPEN: '#DC2626',
  ACKNOWLEDGED: '#F59E0B',
  RESOLVED: '#059669'
};

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

export function AlertCenter() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');

  const { data: analytics, loading: analyticsLoading, error: analyticsError, refetch: refetchAnalytics } = useAnalytics('/manufacturer/analytics/alerts', { 
    date_from: dateFrom, 
    date_to: dateTo, 
    severity: severityFilter === 'All' ? undefined : severityFilter 
  });

  const { data: issuesData, loading: issuesLoading } = useApi('/manufacturer/issues');

  const handleApply = () => {
    refetchAnalytics();
  };

  const handleClear = () => {
    setDateFrom('');
    setDateTo('');
    setSeverityFilter('All');
  };

  const issuesTableColumns = [
    { header: 'Issue ID', accessor: 'issue_id' },
    { header: 'Entity Type', accessor: 'entity_type' },
    { header: 'Issue Type', accessor: 'issue_type' },
    { header: 'Severity', accessor: (row) => <StatusPill status={row.severity} color={SEVERITY_COLORS[row.severity] || 'gray'} /> },
    { header: 'Status', accessor: (row) => <StatusPill status={row.status} color={STATUS_COLORS[row.status] || 'gray'} /> },
    { header: 'Created At', accessor: (row) => new Date(row.created_at).toLocaleString() }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1.5rem' }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 600, margin: '0 0 0.5rem 0' }}>Alert Center</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Monitor and manage operational alerts</p>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 500 }}>Severity</label>
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', width: '150px' }}>
            <option value="All">All</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="LOW">LOW</option>
          </select>
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
              <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Total Alerts</span>
              <span style={{ fontSize: '2rem', fontWeight: 600 }}>{analytics?.kpis?.total || 0}</span>
            </div>
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Critical Alerts</span>
              <span style={{ fontSize: '2rem', fontWeight: 600, color: SEVERITY_COLORS.CRITICAL }}>{analytics?.kpis?.critical || 0}</span>
            </div>
            <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Open Alerts</span>
              <span style={{ fontSize: '2rem', fontWeight: 600, color: STATUS_COLORS.OPEN }}>{analytics?.kpis?.open || 0}</span>
            </div>
          </div>

          <div style={{ ...cardStyle, height: '480px' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Alerts by Severity</h3>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={analytics?.by_severity || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="severity" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<MfgTooltip />} />
                <Bar dataKey="count" isAnimationActive={false}>
                  {(analytics?.by_severity || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[entry.severity] || 'var(--primary)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem' }}>
            <div style={{ ...cardStyle, height: '380px' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Alert Trend</h3>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={analytics?.trend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<MfgTooltip />} />
                  <Line type="monotone" dataKey="count" name="Alerts" stroke="#DC2626" strokeWidth={3} dot={{ r: 4, fill: '#DC2626', strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ ...cardStyle, height: '380px' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Alerts by Status</h3>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Tooltip content={<MfgTooltip />} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                  <Pie data={analytics?.by_status || []} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={2} isAnimationActive={false}>
                    {(analytics?.by_status || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || 'var(--primary)'} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      <div style={{ ...cardStyle }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.125rem' }}>Issue Records</h3>
        <DataTable data={issuesData || []} columns={issuesTableColumns} loading={issuesLoading} />
      </div>
    </div>
  );
}
