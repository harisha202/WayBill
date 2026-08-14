import React from 'react';

export function StateBoundary({ state, emptyMessage = 'No data available.', onRetry, children }) {
  const baseStyle = {
    width: '100%',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    borderRadius: '8px',
    padding: '2rem'
  };

  if (state.loading) {
    return (
      <div style={{ ...baseStyle, backgroundColor: 'var(--bg)' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          border: '3px solid var(--border)', borderTopColor: 'var(--blue)',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>Loading data…</span>
      </div>
    );
  }

  if (state.error) {
    return (
      <div style={{ ...baseStyle, backgroundColor: 'var(--bg)', border: '1px solid var(--border)' }}>
        <span style={{ fontSize: '1.5rem' }}>⚠</span>
        <span style={{ color: 'var(--red)', fontWeight: 600 }}>Error loading data</span>
        <span style={{ color: 'var(--muted)', fontSize: '0.8rem', textAlign: 'center' }}>{state.error}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '0.4rem 1rem', borderRadius: '6px',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', cursor: 'pointer', fontWeight: 500, fontSize: '0.85rem'
            }}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  if (state.isEmpty) {
    return (
      <div style={{ ...baseStyle, backgroundColor: 'var(--bg)' }}>
        <span style={{ fontSize: '1.5rem' }}>📊</span>
        <span style={{ color: 'var(--muted)' }}>{emptyMessage}</span>
      </div>
    );
  }

  return <>{children}</>;
}
