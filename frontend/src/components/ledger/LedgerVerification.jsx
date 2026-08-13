import React, { useState } from 'react';

const LedgerVerification = ({ onVerify }) => {
  const [hash, setHash] = useState('');
  const [result, setResult] = useState(null);

  const handleVerify = () => {
    if (onVerify) {
      const isValid = onVerify(hash);
      setResult(isValid);
    } else {
      // Mock verification
      setResult(hash.trim().length > 10);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text)' }}>
      <h3 style={{ marginTop: 0 }}>Verify Seal/Hash</h3>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input 
          type="text" 
          placeholder="Enter Seal/Hash..." 
          value={hash} 
          onChange={(e) => setHash(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', flex: 1, fontFamily: 'monospace' }}
        />
        <button 
          onClick={handleVerify}
          style={{ padding: '8px 16px', backgroundColor: '#0056b3', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Verify
        </button>
      </div>
      {result !== null && (
        <div style={{ padding: '12px', borderRadius: '4px', backgroundColor: result ? '#d4edda' : '#f8d7da', color: result ? '#155724' : '#721c24', border: `1px solid ${result ? '#c3e6cb' : '#f5c6cb'}` }}>
          {result ? 'Hash verification successful. Data is authentic.' : 'Hash verification failed. Invalid seal.'}
        </div>
      )}
    </div>
  );
};

export default LedgerVerification;
