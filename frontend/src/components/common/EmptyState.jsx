import React from 'react';

export default function EmptyState({ title = "No Data Found", message = "There is currently no data available for this section.", icon = "📭", actionLabel, onAction }) {
  return (
    <div style={{
      padding: '40px',
      textAlign: 'center',
      backgroundColor: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '8px' }}>{icon}</div>
      <h3 style={{ fontSize: '1.25rem', color: 'var(--dashboard-heading)', margin: 0, fontWeight: 600 }}>{title}</h3>
      <p style={{ color: 'var(--muted)', margin: 0, maxWidth: '400px' }}>{message}</p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: 'var(--primary)',
            color: 'var(--text)',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
