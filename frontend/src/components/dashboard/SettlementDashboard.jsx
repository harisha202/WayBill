import React from 'react';

const mockSettlements = [
  { id: 'SET-2001', orderId: 'ORD-1001', amount: '₹45,000', date: '2023-10-25', status: 'PAID' },
  { id: 'SET-2002', orderId: 'ORD-1002', amount: '₹1,20,000', date: '2023-10-26', status: 'PENDING' },
  { id: 'SET-2003', orderId: 'ORD-1003', amount: '₹85,000', date: '2023-10-27', status: 'PARTIAL' },
  { id: 'SET-2004', orderId: 'ORD-1004', amount: '₹15,000', date: '2023-10-28', status: 'DISPUTED' },
  { id: 'SET-2005', orderId: 'ORD-1005', amount: '₹55,000', date: '2023-10-29', status: 'PAID' },
];

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
    <div style={{ gridColumn, backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600, color: '#f8fafc' }}>Recent Settlements</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
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
                  <td style={{ padding: '12px', color: '#f8fafc' }}>{settlement.id}</td>
                  <td style={{ padding: '12px', color: '#94a3b8' }}>{settlement.orderId}</td>
                  <td style={{ padding: '12px', color: '#f8fafc', fontWeight: 500 }}>{settlement.amount}</td>
                  <td style={{ padding: '12px', color: '#94a3b8' }}>{settlement.date}</td>
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
    <div style={{ gridColumn, backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600, color: '#f8fafc' }}>Settlement Lifecycle</h2>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155' }}>
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
              <span style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500, textAlign: 'center' }}>{step}</span>
            </div>
            {index < 3 && (
              <div style={{ flex: 1, height: '2px', backgroundColor: index < 2 ? '#10b981' : '#334155', margin: '0 -20px', position: 'relative', top: '-12px', zIndex: 0 }} />
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
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 700, color: '#f8fafc' }}>Finance & Settlements</h1>
        <p style={{ color: '#94a3b8', margin: '8px 0 0' }}>Track Invoices and Settlements lifecycle.</p>
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
