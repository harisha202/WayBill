import React, { useState } from 'react';
import QRScanner from '../qr/QRScanner';
import QRScanResult from '../qr/QRScanResult';
import QRVerificationStatus from '../qr/QRVerificationStatus';

const QRVerification = ({ onVerificationComplete }) => {
  const [scanState, setScanState] = useState('scanning'); // scanning, processing, completed
  const [scannedData, setScannedData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleScan = async (data) => {
    if (!data) return;
    
    setScanState('processing');
    setScannedData(data);
    
    // Simulate verification logic
    setTimeout(() => {
      // Mock verification based on data content
      let status = 'Valid';
      let message = 'Secure token verified successfully.';
      
      if (data.includes('tamper')) {
        status = 'Tampered';
        message = 'Warning: Security seal may be compromised.';
      } else if (data.includes('invalid')) {
        status = 'Invalid';
        message = 'The scanned token is invalid or expired.';
      } else if (data.includes('notfound')) {
        status = 'Not Found';
        message = 'Waybill information not found in the system.';
      }
      
      const result = { status, message, timestamp: new Date().toISOString() };
      setVerificationResult(result);
      setScanState('completed');
      
      if (onVerificationComplete) {
        onVerificationComplete(data, result);
      }
    }, 1500);
  };

  const resetScan = () => {
    setScanState('scanning');
    setScannedData(null);
    setVerificationResult(null);
  };

  const containerStyle = {
    backgroundColor: 'var(--surface, #ffffff)',
    border: '1px solid var(--border, #e0e0e0)',
    borderRadius: '8px',
    padding: '1.5rem',
    fontFamily: 'sans-serif'
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ marginTop: 0, color: 'var(--text, #333333)' }}>Waybill QR Verification</h2>
      
      {scanState === 'scanning' && (
        <div>
          <p style={{ color: 'var(--text-secondary, #666666)', marginBottom: '1rem' }}>
            Scan the waybill QR code to verify its authenticity and current status.
          </p>
          <QRScanner onScan={handleScan} />
        </div>
      )}
      
      {scanState === 'processing' && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ 
            display: 'inline-block', 
            width: '40px', 
            height: '40px', 
            border: '4px solid var(--border, #e0e0e0)',
            borderTopColor: 'var(--primary, #0056b3)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ marginTop: '1rem', color: 'var(--text, #333333)' }}>Verifying secure token...</p>
        </div>
      )}
      
      {scanState === 'completed' && (
        <div>
          <QRVerificationStatus 
            status={verificationResult?.status} 
            message={verificationResult?.message} 
          />
          <QRScanResult data={scannedData} timestamp={verificationResult?.timestamp} />
          
          <button 
            onClick={resetScan}
            style={{
              marginTop: '1.5rem',
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'var(--primary, #0056b3)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '1rem',
              cursor: 'pointer',
              fontWeight: '500'
            }}
          >
            Scan Another Waybill
          </button>
        </div>
      )}
    </div>
  );
};

export default QRVerification;
