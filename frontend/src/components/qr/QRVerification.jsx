import React, { useState } from 'react';
import QRScanner from '../qr/QRScanner';
import QRScanResult from '../qr/QRScanResult';
import QRVerificationStatus from '../qr/QRVerificationStatus';
import { getAuthToken } from '../../store/useAuthStore';

const QRVerification = ({ onVerificationComplete }) => {
  const [scanState, setScanState] = useState('scanning'); // scanning, processing, completed
  const [scannedData, setScannedData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleScan = async (data) => {
    if (!data) return;
    
    setScanState('processing');
    setScannedData(data);
    
    try {
      let waybillId = '';
      let sealHash = '';
      
      const raw = String(data).trim();
      if (raw.startsWith('{')) {
        try {
          const parsed = JSON.parse(raw);
          waybillId = parsed.waybill_id || parsed.id || '';
          sealHash = parsed.seal_hash || parsed.sealHash || '';
        } catch {
          waybillId = raw;
        }
      } else {
        const [wbPart, sealPart] = raw.split('|');
        if (wbPart && sealPart) {
          waybillId = wbPart;
          sealHash = sealPart || '';
        } else {
          try {
            const url = new URL(raw);
            waybillId = url.searchParams.get('id') || url.pathname.split('/').filter(Boolean).pop() || raw;
            sealHash = url.searchParams.get('seal') || '';
          } catch {
            waybillId = raw;
          }
        }
      }

      const token = getAuthToken();
      const res = await fetch(`/api/waybills/${encodeURIComponent(waybillId.trim())}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          seal_hash: sealHash,
          idempotency_key: `qr-${waybillId}-${Date.now()}`,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Verification request failed');
      }

      const resData = await res.json();
      const resultData = resData.data || resData;
      
      const status = resultData.valid ? 'Valid' : 'Tampered';
      const message = resultData.reason || (resultData.valid ? 'Secure token verified successfully.' : 'Warning: Security seal may be compromised.');
      
      const result = { status, message, timestamp: new Date().toISOString() };
      setVerificationResult(result);
      setScanState('completed');
      
      if (onVerificationComplete) {
        onVerificationComplete(data, result);
      }
    } catch (err) {
      const result = { 
        status: 'Invalid', 
        message: err.message || 'The scanned token is invalid or expired.', 
        timestamp: new Date().toISOString() 
      };
      setVerificationResult(result);
      setScanState('completed');
      
      if (onVerificationComplete) {
        onVerificationComplete(data, result);
      }
    }
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
