import React from 'react';

const QRVerificationStatus = ({ status, message }) => {
  if (!status) return null;

  const getStatusConfig = () => {
    switch (status.toLowerCase()) {
      case 'valid':
        return {
          color: 'var(--success, #28a745)',
          bgColor: 'var(--success-light, #d4edda)',
          borderColor: 'var(--success-border, #c3e6cb)',
          icon: '✓'
        };
      case 'invalid':
        return {
          color: 'var(--error, #dc3545)',
          bgColor: 'var(--error-light, #f8d7da)',
          borderColor: 'var(--error-border, #f5c6cb)',
          icon: '✗'
        };
      case 'tampered':
        return {
          color: 'var(--warning, #856404)',
          bgColor: 'var(--warning-light, #fff3cd)',
          borderColor: 'var(--warning-border, #ffeeba)',
          icon: '⚠'
        };
      case 'not found':
        return {
          color: 'var(--info, #0c5460)',
          bgColor: 'var(--info-light, #d1ecf1)',
          borderColor: 'var(--info-border, #bee5eb)',
          icon: '?'
        };
      default:
        return {
          color: 'var(--text, #333333)',
          bgColor: 'var(--bg, #e9ecef)',
          borderColor: 'var(--border, #dee2e6)',
          icon: 'i'
        };
    }
  };

  const config = getStatusConfig();

  const containerStyle = {
    backgroundColor: config.bgColor,
    color: config.color,
    border: `1px solid ${config.borderColor}`,
    borderRadius: '8px',
    padding: '1.25rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '1rem',
    fontFamily: 'sans-serif',
    marginBottom: '1rem'
  };

  return (
    <div style={containerStyle}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: config.color,
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: '1.25rem',
        flexShrink: 0
      }}>
        {config.icon}
      </div>
      <div>
        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem' }}>{status}</h3>
        <p style={{ margin: 0, opacity: 0.9 }}>{message}</p>
      </div>
    </div>
  );
};

export default QRVerificationStatus;
