import React from 'react';

/**
 * AnalyticsCard — Card wrapper with loading/error/empty states.
 * Uses the existing design system tokens (--surface, --border, --text, --muted).
 */
export function AnalyticsCard({ title, subtitle, loading, error, isEmpty, emptyMessage, onRetry, height, actions, children, style }) {
  const cardStyle = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    minHeight: height ? `${height}px` : undefined,
    overflow: 'hidden',
    ...style
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
    gap: '0.5rem',
    flexShrink: 0
  };

  const contentStyle = {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    alignItems: 'stretch',
    flexDirection: 'column'
  };

  const stateStyle = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    color: 'var(--muted)',
    fontSize: '0.875rem',
    minHeight: '120px'
  };

  return (
    <div style={cardStyle}>
      {(title || actions) && (
        <div style={headerStyle}>
          <div>
            {title && (
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--dashboard-heading)', lineHeight: 1.3 }}>
                {title}
              </div>
            )}
            {subtitle && (
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                {subtitle}
              </div>
            )}
          </div>
          {actions && <div style={{ flexShrink: 0 }}>{actions}</div>}
        </div>
      )}

      <div style={contentStyle}>
        {loading && (
          <div style={stateStyle}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: '3px solid var(--border)', borderTopColor: 'var(--blue)',
              animation: 'spin 0.8s linear infinite'
            }} />
            <span>Loading data…</span>
          </div>
        )}
        {!loading && error && (
          <div style={{ ...stateStyle, color: 'var(--red)' }}>
            <span style={{ fontSize: '1.25rem' }}>⚠</span>
            <span style={{ color: 'var(--text)' }}>Failed to load</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center', maxWidth: '240px' }}>{error}</span>
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  marginTop: '0.5rem', padding: '0.35rem 0.85rem',
                  borderRadius: '6px', border: '1px solid var(--border)',
                  background: 'var(--bg)', color: 'var(--text)',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500
                }}
              >
                Retry
              </button>
            )}
          </div>
        )}
        {!loading && !error && isEmpty && (
          <div style={stateStyle}>
            <span style={{ fontSize: '1.5rem' }}>📊</span>
            <span>{emptyMessage || 'No data available'}</span>
          </div>
        )}
        {!loading && !error && !isEmpty && children}
      </div>
    </div>
  );
}
