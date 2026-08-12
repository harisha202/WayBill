import React from 'react';

import { useApi } from '../../api/hooks/useApi';
import { StateBoundary } from '../common/StateBoundary';

const containerStyle = {
  backgroundColor: '#0f172a',
  color: '#f8fafc',
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

const cardStyle = {
  backgroundColor: '#1e293b',
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
  color: '#e2e8f0'
};

const iconStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0f172a',
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

export function RetailDashboard() {
  return <RetailInventory />;
}

export function RetailInventory() {
  const healthApi = useApi('/inventory/analytics/inventory-health');
  
  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Retail Inventory</h1>
      </header>

    </div>
  );
}

export function POSAnalytics() {
  const posApi = useApi('/inventory/analytics/pos-sales-trend');
  const forecastApi = useApi('/inventory/analytics/demand-forecast');
  
  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>POS & Sales Analytics</h1>
      </header>

    </div>
  );
}

export function AutoReorder() {
  const reorderApi = useApi('/inventory/analytics/auto-reorder');
  
  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>AI Auto-Reorder</h1>
      </header>
      <div style={gridStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>??</span> Reorder Recommendation</h2>
          <div style={chartContainerStyle}>
            <StateBoundary state={reorderApi} onRetry={reorderApi.refetch}>
               <div style={{color: '#f8fafc', padding: '1rem'}}>
                  <p><strong>SKU:</strong> {reorderApi.data?.sku}</p>
                  <p><strong>Recommended Qty:</strong> {reorderApi.data?.recommended_qty}</p>
                  <p><strong>Confidence:</strong> {reorderApi.data?.confidence}%</p>
                  <p style={{marginTop: '1rem', color: '#94a3b8'}}><em>Reason: {reorderApi.data?.reason}</em></p>
                  <button style={{marginTop: '2rem', padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', borderRadius: '4px', border: 'none', cursor: 'pointer'}}>Approve Order</button>
               </div>
            </StateBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QRVerification() {
  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>QR Verification</h1>
      </header>
    </div>
  );
}
