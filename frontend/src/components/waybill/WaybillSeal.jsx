import React from 'react';

const WaybillSeal = ({ sealStatus, hash, verificationStatus, timestamp }) => {
  const containerStyle = {
    backgroundColor: 'var(--surface, #ffffff)',
    color: 'var(--text, #333333)',
    border: '1px solid var(--border, #e0e0e0)',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontFamily: 'sans-serif'
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'intact':
      case 'verified':
      case 'valid':
        return 'var(--success, #28a745)';
      case 'broken':
      case 'tampered':
      case 'invalid':
        return 'var(--error, #dc3545)';
      default:
        return 'var(--text-secondary, #666666)';
    }
  };

  return (
    <div style={containerStyle}>
      <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border, #e0e0e0)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '0.5rem' }}>🔒</span> Digital Seal Information
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary, #666666)', fontWeight: '500' }}>Seal Status:</span>
          <span style={{ color: getStatusColor(sealStatus), fontWeight: 'bold' }}>{sealStatus || 'Unknown'}</span>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary, #666666)', fontWeight: '500' }}>Verification:</span>
          <span style={{ color: getStatusColor(verificationStatus), fontWeight: 'bold' }}>{verificationStatus || 'Pending'}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <span style={{ color: 'var(--text-secondary, #666666)', fontWeight: '500' }}>Cryptographic Hash:</span>
          <code style={{ 
            backgroundColor: 'var(--bg, #f5f5f5)', 
            padding: '0.5rem', 
            borderRadius: '4px',
            wordBreak: 'break-all',
            fontSize: '0.875rem',
            border: '1px solid var(--border, #e0e0e0)'
          }}>
            {hash || 'No hash generated'}
          </code>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary, #666666)', marginTop: '0.5rem' }}>
          <span>Timestamp:</span>
          <span>{timestamp || new Date().toISOString()}</span>
        </div>
      </div>
    </div>
  );
};

export default WaybillSeal;
