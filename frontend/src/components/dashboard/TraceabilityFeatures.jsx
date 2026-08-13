import React from 'react';

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

export function TraceabilityDashboard() {
  const custodyApi = useApi('/blockchain/analytics/chain-of-custody');
  const sealApi = useApi('/blockchain/analytics/seal-verification');
  const qrApi = useApi('/blockchain/analytics/qr-verification-rate');

  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Traceability & Compliance</h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Blockchain-backed Chain of Custody</p>
      </header>

      <div style={gridStyle}>
        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <h2 style={titleStyle}><span style={iconStyle}>??</span> Traceability Search</h2>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
             <input type="text" placeholder="Enter Waybill ID, Batch ID, or Hash..." style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', background: 'var(--bg)', border: '1px solid #334155', color: 'var(--text)' }} />
             <button style={{ padding: '0.75rem 1.5rem', background: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Search Blockchain</button>
             <button style={{ padding: '0.75rem 1.5rem', background: '#10b981', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>?? Scan QR</button>
          </div>
        </div>

        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <h2 style={titleStyle}><span style={iconStyle}>??</span> Chain of Custody Timeline</h2>
          <StateBoundary state={custodyApi} onRetry={custodyApi.refetch}>
            <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid #334155' }}>
              {(custodyApi.data || []).map((event, idx) => (
                 <div key={idx} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #334155' }}>
                    <p style={{ color: '#3b82f6', fontWeight: 'bold' }}>{event.actor} - {event.location}</p>
                    <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{event.time}</p>
                    <p style={{ color: '#10b981', fontSize: '0.875rem', fontFamily: 'monospace' }}>Hash: {event.hash}</p>
                 </div>
              ))}
            </div>
          </StateBoundary>
        </div>

        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>??</span> Seal Verification</h2>
          <div style={chartContainerStyle}>
            <StateBoundary state={sealApi} onRetry={sealApi.refetch}>
               <div style={{textAlign: 'center', padding: '2rem'}}>
                 <div style={{ fontSize: '4rem', color: sealApi.data?.valid ? '#10b981' : '#ef4444' }}>
                   {sealApi.data?.valid ? '? VALID' : '? INVALID'}
                 </div>
                 <p style={{ color: 'var(--muted)', marginTop: '1rem', fontFamily: 'monospace' }}>
                   Original: {sealApi.data?.original_hash}<br/>
                   Current: {sealApi.data?.current_hash}
                 </p>
               </div>
            </StateBoundary>
          </div>
        </div>


      </div>
    </div>
  );
}
