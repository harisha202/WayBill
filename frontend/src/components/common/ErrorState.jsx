import React from 'react';

export default function ErrorState({ title = "Something went wrong", message = "An error occurred while fetching data from the server.", onRetry }) {
  return (
    <div style={{
      padding: '40px',
      textAlign: 'center',
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '12px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '12px'
    }}>
      <div style={{ fontSize: '48px', marginBottom: '8px' }}>⚠️</div>
      <h3 style={{ fontSize: '1.25rem', color: '#991b1b', margin: 0, fontWeight: 600 }}>{title}</h3>
      <p style={{ color: '#b91c1c', margin: 0, maxWidth: '400px' }}>{message}</p>
      
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            backgroundColor: '#ef4444',
            color: 'var(--text)',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.target.style.opacity = '0.9'}
          onMouseOut={(e) => e.target.style.opacity = '1'}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
