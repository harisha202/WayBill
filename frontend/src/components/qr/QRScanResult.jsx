import React from 'react';

const QRScanResult = ({ data, timestamp }) => {
  if (!data) return null;

  const containerStyle = {
    backgroundColor: 'var(--bg, #f5f5f5)',
    border: '1px solid var(--border, #e0e0e0)',
    borderRadius: '8px',
    padding: '1rem',
    marginTop: '1rem',
    fontFamily: 'sans-serif'
  };

  return (
    <div style={containerStyle}>
      <h4 style={{ marginTop: 0, marginBottom: '0.75rem', color: 'var(--text, #333333)' }}>Parsed Secure Token</h4>
      
      <div style={{ 
        backgroundColor: '#ffffff', 
        padding: '0.75rem', 
        borderRadius: '6px',
        border: '1px solid var(--border, #e0e0e0)',
        fontFamily: 'monospace',
        wordBreak: 'break-all',
        fontSize: '0.875rem',
        color: 'var(--text, #333333)'
      }}>
        {data}
      </div>
      
      {timestamp && (
        <div style={{ 
          marginTop: '0.75rem', 
          fontSize: '0.75rem', 
          color: 'var(--text-secondary, #666666)',
          textAlign: 'right'
        }}>
          Scanned at: {new Date(timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default QRScanResult;
