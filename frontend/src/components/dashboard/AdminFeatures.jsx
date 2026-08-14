import React from 'react';

import { SettlementsTable, SettlementLifecycle, SettlementDashboard } from './SettlementDashboard';
import { useApi } from '../../api/hooks/useApi';
import { StateBoundary } from '../common/StateBoundary';

const containerStyle = {
  backgroundColor: 'var(--bg)',
  color: 'var(--text)',
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

const kpiGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2rem'
};

const cardStyle = {
  backgroundColor: 'var(--surface)',
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
  color: 'var(--dashboard-heading)'
};

const iconStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg)',
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  marginRight: '12px',
  fontSize: '16px',
  border: '1px solid #334155'
};

const chartContainerStyle = {
  height: '300px',
  width: '100%',
  position: 'relative'
};

export function ControlTower() {
  const statsApi = useApi('/admin/stats');
  
  const stats = statsApi.data || {};

  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Control Tower</h1>
          <p style={{ color: 'var(--muted)', margin: 0 }}>KPIs & Core Metrics Overview</p>
        </div>
        <button 
          onClick={() => window.location.href = '/admin/users'}
          style={{ background: 'var(--admin)', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <span>👥</span> User Management
        </button>
      </header>

      <StateBoundary state={statsApi} onRetry={statsApi.refetch}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {[
            { label: 'Active Orders', value: stats.active_orders || 0, icon: '📦', color: '#3b82f6' },
            { label: 'Active Shipments', value: stats.active_shipments || 0, icon: '🚛', color: '#10b981' },
            { label: 'In-Transit', value: stats.in_transit_shipments || 0, icon: '🚚', color: '#f59e0b' },
            { label: 'Delayed Shipments', value: stats.delayed_shipments || 0, icon: '⚠️', color: '#ef4444' },
            { label: 'Critical Risks', value: stats.critical_risks || 0, icon: '🔥', color: '#dc2626' },
            { label: 'Manufacturers', value: stats.active_manufacturers || 0, icon: '🏭', color: '#6366f1' },
            { label: 'Transporters', value: stats.active_transporters || 0, icon: '🚆', color: '#8b5cf6' },
            { label: 'Dealers', value: stats.active_dealers || 0, icon: '🏪', color: '#ec4899' },
            { label: 'Retail Shops', value: stats.active_retail_shops || 0, icon: '🛒', color: '#f43f5e' },
            { label: 'Inventory Alerts', value: stats.inventory_alerts || 0, icon: '📉', color: '#f97316' },
            { label: 'Pending Waybills', value: stats.pending_waybills || 0, icon: '📄', color: '#06b6d4' },
            { label: 'Discrepancies', value: stats.pending_discrepancies || 0, icon: '❌', color: '#f43f5e' }
          ].map((kpi, i) => (
            <div key={i} style={{ ...cardStyle, display: 'flex', alignItems: 'center', borderLeft: `4px solid ${kpi.color}` }}>
              <div style={{ fontSize: '2.5rem', marginRight: '1rem', color: kpi.color }}>{kpi.icon}</div>
              <div>
                <div style={{ color: 'var(--muted)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }}>{kpi.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{kpi.value}</div>
              </div>
            </div>
          ))}
        </div>
      </StateBoundary>
    </div>
  );
}

export function SupplyChainDepth() {
  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Supply Chain Depth</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Network Topology and Infrastructure</p>
      </header>

    </div>
  );
}

export function SupplierRisk() {
  const supplierRiskApi = useApi('/manufacturer/analytics/supplier-risk');

  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Supplier Risk</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Global Risk Assessment and Trends</p>
      </header>

    </div>
  );
}

export function ActivityLog() {
  const activityApi = useApi('/admin/activity-logs');
  const logs = activityApi.data?.logs || [];

  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Activity & Audit Log</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>System anomalies, user actions, and event tracking</p>
      </header>
      
      <StateBoundary state={activityApi} onRetry={activityApi.refetch}>
        <div style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Timestamp</th>
                <th style={thStyle}>User (ID)</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Entity</th>
                <th style={thStyle}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={tdStyle}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={tdStyle}>{log.user_id || 'System'}</td>
                    <td style={tdStyle}>{log.role || '-'}</td>
                    <td style={tdStyle}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '0.25rem', 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold',
                        backgroundColor: '#e0e7ff',
                        color: '#4f46e5'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={tdStyle}>{log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}</td>
                    <td style={tdStyle}>
                      <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap', color: 'var(--muted)' }}>
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </StateBoundary>
    </div>
  );
}

export function AdminLedger() {
  const profitTrendApi = useApi('/admin/analytics/profit-trend');
  const currencyApi = useApi('/blockchain/analytics/currency-exposure');

  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Admin Ledger</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Financial Overview & Accounting (in ?)</p>
      </header>
      
      <div style={gridStyle}>

        
        <div style={{ gridColumn: '1 / -1' }}>
          <SettlementLifecycle />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <SettlementsTable />
        </div>
      </div>
    </div>
  );
}

export { SettlementDashboard };
