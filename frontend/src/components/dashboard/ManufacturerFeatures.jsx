import React from 'react';

import { SettlementsTable } from './SettlementDashboard';
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

export function ManufacturerDashboard() {
  return <Production />;
}

export function Production() {
  const prodVsDemandApi = useApi('/manufacturer/analytics/production-vs-demand');
  const costApi = useApi('/manufacturer/analytics/production-cost');

  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Production Floor</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Capacity, Demand, and Pipeline</p>
      </header>


    </div>
  );
}

export function AIForecast() {
  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Demand Forecast</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>AI-driven manufacturing predictions</p>
      </header>
      <div style={gridStyle}>
        <div style={cardStyle}>
           <h2 style={titleStyle}><span style={iconStyle}>??</span> Forecast Model</h2>
           <p style={{color: '#94a3b8'}}>Forecast data integration pending</p>
        </div>
      </div>
    </div>
  );
}

export function RawMaterialSourcing() {
  const supplierRiskApi = useApi('/manufacturer/analytics/supplier-risk');
  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Sourcing & Materials</h1>
      </header>

    </div>
  );
}

export function QualityAssurance() {
  const qaStatsApi = useApi('/manufacturer/analytics/qa-stats');
  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Quality Assurance</h1>
      </header>

    </div>
  );
}

export function ManufacturerLedger() {
  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Manufacturer Ledger</h1>
      </header>
      <div style={{ gridColumn: '1 / -1' }}>
        <SettlementsTable />
      </div>
    </div>
  );
}
