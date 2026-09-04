import React, { useState } from 'react';

const QRScanner = ({ onScan }) => {
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [error, setError] = useState(null);
  const [manualValue, setManualValue] = useState('');

  const handleScanResult = (qrString) => {
    if (!qrString) return;
    setError(null);
    setIsCameraActive(false);
    if (onScan) onScan(qrString);
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: 'var(--bg, #f5f5f5)',
    border: '2px dashed var(--border, #ccc)',
    borderRadius: '12px',
    padding: '2rem',
    position: 'relative',
    overflow: 'hidden'
  };

  const scannerBoxStyle = {
    width: '250px',
    height: '250px',
    border: '3px solid var(--primary, #0056b3)',
    borderRadius: '16px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)'
  };

  const scanLineStyle = {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '4px',
    backgroundColor: 'var(--primary, #0056b3)',
    boxShadow: '0 0 10px 2px rgba(0, 86, 179, 0.5)',
    animation: 'scan 2s infinite linear'
  };



  return (
    <div style={{ width: '100%' }}>
      <style>
        {`
          @keyframes scan {
            0% { top: 0; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
          }
        `}
      </style>
      
      <div style={containerStyle}>
        {isCameraActive && (
          <>
            <div style={scannerBoxStyle}>
              <div style={scanLineStyle}></div>
              <span style={{ color: 'var(--text-secondary, #ffffff)', fontWeight: 'bold', zIndex: 10, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                Camera Feed
              </span>
            </div>
            <p style={{ marginTop: '1.5rem', color: 'var(--text, #333333)', fontWeight: '500' }}>
              Align QR code within the frame
            </p>
          </>
        )}
        
        {error && (
          <div style={{ marginTop: '1rem', color: 'red', textAlign: 'center' }}>
            <strong>Error:</strong> {error}
            <br />
            <button onClick={() => { setError(null); setIsCameraActive(true); }} style={{ marginTop: '0.5rem' }}>Retry</button>
          </div>
        )}
        
        {isCameraActive && (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!manualValue.trim()) {
                setError('Enter a waybill QR payload or waybill ID.');
                return;
              }
              handleScanResult(manualValue.trim());
            }}
            style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '420px' }}
          >
            <input
              value={manualValue}
              onChange={(event) => setManualValue(event.target.value)}
              placeholder="Waybill ID or QR payload"
              style={{ flex: 1, padding: '0.65rem', border: '1px solid var(--border, #ccc)', borderRadius: '4px' }}
            />
            <button type="submit" style={{ padding: '0.65rem 1rem' }}>
              Verify
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
