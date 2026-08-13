import React from 'react';

const alertTypes = {
  critical: { color: '#ef4444', icon: '🔴', label: 'Critical' },
  warning: { color: '#f97316', icon: '🟠', label: 'Warning' },
  attention: { color: '#eab308', icon: '🟡', label: 'Attention' },
  resolved: { color: '#10b981', icon: '🟢', label: 'Resolved' }
};

const mockAlerts = [
  { id: 1, type: 'critical', title: 'Route Deviation Detected', message: 'Truck TRK-002 has significantly deviated from the planned route.', time: '10 mins ago' },
  { id: 2, type: 'warning', title: 'Supplier Delay', message: 'Supplier A reported a delay in delivering Raw Materials.', time: '1 hour ago' },
  { id: 3, type: 'attention', title: 'Low Inventory', message: 'Aluminum inventory is running low in Warehouse B.', time: '2 hours ago' },
  { id: 4, type: 'resolved', title: 'Payment Confirmed', message: 'Invoice INV-1002 has been successfully settled.', time: '5 hours ago' }
];

export default function AlertCenter() {
  return (
    <div style={{ padding: '24px', backgroundColor: 'var(--bg)', color: 'var(--text)', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 8px 0', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Alert Center
        </h1>
        <p style={{ color: 'var(--muted)', margin: 0 }}>Global notifications and active system alerts.</p>
      </header>

      <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr' }}>
        {mockAlerts.map(alert => {
          const typeInfo = alertTypes[alert.type];
          return (
            <div key={alert.id} style={{ display: 'flex', alignItems: 'flex-start', padding: '20px', backgroundColor: 'var(--surface)', borderRadius: '12px', border: `1px solid #334155`, borderLeft: `4px solid ${typeInfo.color}`, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ fontSize: '24px', marginRight: '16px' }}>
                {typeInfo.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', margin: 0, color: 'var(--dashboard-heading)' }}>{alert.title}</h3>
                  <span style={{ fontSize: '0.875rem', color: '#64748b' }}>{alert.time}</span>
                </div>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1rem', lineHeight: '1.5' }}>
                  {alert.message}
                </p>
              </div>
              <div style={{ marginLeft: '16px' }}>
                <span style={{ backgroundColor: 'var(--bg)', color: typeInfo.color, padding: '4px 12px', borderRadius: '16px', fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', border: `1px solid ${typeInfo.color}` }}>
                  {typeInfo.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
