import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosInstance';
import { StatusPill } from '../ui/StatusPill';

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '1.25rem 1.5rem',
};

export function AdminAlertCenter() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/notifications?limit=100');
      const items = res?.items || res?.data?.items || res?.data || [];
      setAlerts(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error('Failed to load admin notifications', err);
      // Fallback to role notifications
      try {
        const fallback = await apiClient.get('/notifications/?limit=100');
        const items = fallback?.data || [];
        setAlerts(Array.isArray(items) ? items : []);
      } catch {
        setAlerts([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filtered = alerts.filter((item) => {
    const sev = String(item.severity || 'info').toUpperCase();
    if (severityFilter !== 'ALL' && sev !== severityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const matchTitle = (item.title || '').toLowerCase().includes(q);
      const matchMsg = (item.message || '').toLowerCase().includes(q);
      const matchUser = (item.user_id || '').toLowerCase().includes(q);
      if (!matchTitle && !matchMsg && !matchUser) return false;
    }
    return true;
  });

  const criticalCount = alerts.filter(a => String(a.severity || '').toUpperCase() === 'CRITICAL').length;
  const highCount = alerts.filter(a => String(a.severity || '').toUpperCase() === 'HIGH').length;
  const warningCount = alerts.filter(a => String(a.severity || '').toUpperCase() === 'WARNING').length;
  const infoCount = alerts.filter(a => String(a.severity || '').toUpperCase() === 'INFO').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--dashboard-heading)' }}>
            System-Wide Alert Center
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.875rem' }}>
            Omni-channel operational warnings, tamper alerts, dispatch delays, and security events across all supply chain actors
          </p>
        </div>
        <button
          onClick={fetchAlerts}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          🔄 Refresh Alerts
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ ...cardStyle, borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            Critical Alerts
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>
            {criticalCount}
          </div>
        </div>

        <div style={{ ...cardStyle, borderLeft: '4px solid #f97316' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            High Severity
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f97316' }}>
            {highCount}
          </div>
        </div>

        <div style={{ ...cardStyle, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            Warnings
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>
            {warningCount}
          </div>
        </div>

        <div style={{ ...cardStyle, borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            Informational Updates
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#3b82f6' }}>
            {infoCount}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ ...cardStyle, display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '240px' }}>
          <input
            type="text"
            placeholder="Search alerts by title, message, or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          />
        </div>

        <div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            style={{ padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="WARNING">Warning</option>
            <option value="INFO">Info</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <div style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)', color: 'var(--muted)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Severity</th>
              <th style={{ padding: '0.75rem 1rem' }}>Alert Title</th>
              <th style={{ padding: '0.75rem 1rem' }}>Message</th>
              <th style={{ padding: '0.75rem 1rem' }}>Target User/Role</th>
              <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  Loading system notifications...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  No notifications match the active filter. System health is optimal.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const sev = String(item.severity || 'info').toLowerCase();
                const pillStatus = sev === 'critical' || sev === 'high' ? 'danger' : sev === 'warning' ? 'warning' : 'info';
                return (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <StatusPill status={pillStatus} text={sev.toUpperCase()} />
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{item.title}</td>
                    <td style={{ padding: '0.75rem 1rem', maxWidth: '380px' }}>{item.message}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)' }}>{item.user_id || 'system'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)' }}>
                      {item.created_at ? new Date(item.created_at).toLocaleString() : 'Recent'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
