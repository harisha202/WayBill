import React from 'react';

const mockSettlements = [];

const getStatusStyle = (status) => {
  switch (status) {
    case 'PAID': return { bg: '#10b98120', text: '#10b981' };
    case 'PENDING': return { bg: '#f59e0b20', text: '#f59e0b' };
    case 'PARTIAL': return { bg: '#3b82f620', text: '#3b82f6' };
    case 'DISPUTED': return { bg: '#ef444420', text: '#ef4444' };
    default: return { bg: '#64748b20', text: '#64748b' };
  }
};

export function SettlementsTable({ gridColumn = 'span 12' }) {
  return (
    <div style={{ gridColumn, backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600, color: 'var(--text)' }}>Recent Settlements</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: 'var(--muted)' }}>
              <th style={{ padding: '12px' }}>Settlement ID</th>
              <th style={{ padding: '12px' }}>Order ID</th>
              <th style={{ padding: '12px' }}>Amount (₹)</th>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {mockSettlements.map(settlement => {
              const statusStyle = getStatusStyle(settlement.status);
              return (
                <tr key={settlement.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '12px', color: 'var(--text)' }}>{settlement.id}</td>
                  <td style={{ padding: '12px', color: 'var(--muted)' }}>{settlement.orderId}</td>
                  <td style={{ padding: '12px', color: 'var(--text)', fontWeight: 500 }}>{settlement.amount}</td>
                  <td style={{ padding: '12px', color: 'var(--muted)' }}>{settlement.date}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.text
                    }}>
                      {settlement.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SettlementLifecycle({ gridColumn = 'span 12' }) {
  return (
    <div style={{ gridColumn, backgroundColor: 'var(--surface)', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600, color: 'var(--text)' }}>Settlement Lifecycle</h2>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', backgroundColor: 'var(--bg)', borderRadius: '12px', border: '1px solid #334155' }}>
        {['Order Placed', 'Invoice Generated', 'Payment Received', 'Settlement Complete'].map((step, index) => (
          <React.Fragment key={index}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 1 }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', 
                backgroundColor: index < 3 ? '#10b98120' : '#3b82f620',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                border: `2px solid ${index < 3 ? '#10b981' : '#3b82f6'}`,
                color: index < 3 ? '#10b981' : '#3b82f6', fontWeight: 'bold'
              }}>
                {index + 1}
              </div>
              <span style={{ color: 'var(--dashboard-heading)', fontSize: '0.875rem', fontWeight: 500, textAlign: 'center' }}>{step}</span>
            </div>
            {index < 3 && (
              <div style={{ flex: 1, height: '2px', backgroundColor: index < 2 ? '#10b981' : 'var(--border)', margin: '0 -20px', position: 'relative', top: '-12px', zIndex: 0 }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function SettlementDashboard() {
  return (
    <div style={{
      padding: '24px',
      backgroundColor: 'var(--bg)',
      color: 'var(--text)',
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 700, color: 'var(--text)' }}>Finance & Settlements</h1>
        <p style={{ color: 'var(--muted)', margin: '8px 0 0' }}>Track Invoices and Settlements lifecycle.</p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px'
      }}>
        <SettlementsTable gridColumn="span 12" />
        <SettlementLifecycle gridColumn="span 12" />
      </div>
    </div>
  );
}
