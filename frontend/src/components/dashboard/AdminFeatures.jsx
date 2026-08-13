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
  const revenueCostApi = useApi('/admin/analytics/revenue-cost');
  const costBreakdownApi = useApi('/admin/analytics/cost-breakdown');
  const orderPipelineApi = useApi('/admin/analytics/order-pipeline');

  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Control Tower</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>KPIs & Core Metrics Overview</p>
      </header>

      {/* KPI Cards */}
      <StateBoundary state={statsApi} onRetry={statsApi.refetch}>
        <div style={kpiGridStyle}>
          {[
            { label: 'Active Shipments', value: statsApi.data?.active_shipments || 0, icon: '??', color: '#3b82f6' },
            { label: 'Total Revenue', value: '?' + (statsApi.data?.revenue || 0).toLocaleString(), icon: '??', color: '#10b981' },
            { label: 'Total Products', value: statsApi.data?.total_products || 0, icon: '??', color: '#f59e0b' },
            { label: 'Total Users', value: statsApi.data?.total_users || 0, icon: '??', color: '#a855f7' }
          ].map((kpi, i) => (
            <div key={i} style={{ ...cardStyle, display: 'flex', alignItems: 'center' }}>
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
  const anomalyTrendData = { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], data: [2, 0, 5, 1, 3] };

  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Activity Log</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>System Anomalies and Event Tracking</p>
      </header>

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
