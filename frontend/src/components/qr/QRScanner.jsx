import React, { useState } from 'react';
import axios from 'axios';

const QRScanner = ({ onScan }) => {
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleScanResult = async (qrString) => {
    if (!qrString) return;
    
    // Extract waybill_id: assumes format could be a URL like "https://domain.com/waybill/ID123" or just "ID123"
    let waybillId = qrString;
    try {
      const url = new URL(qrString);
      const parts = url.pathname.split('/');
      waybillId = parts[parts.length - 1];
    } catch (e) {
      // not a URL, use as is
    }

    setLoading(true);
    setError(null);
    setIsCameraActive(false);

    try {
      const response = await axios.post(`/api/waybill/${waybillId}/verify`, { seal_hash: '' });
      setResult(response.data);
      if (onScan) onScan(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
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
        
        {loading && <div style={{ marginTop: '1rem', color: 'var(--primary)' }}>Verifying...</div>}
        
        {error && (
          <div style={{ marginTop: '1rem', color: 'red', textAlign: 'center' }}>
            <strong>Error:</strong> {error}
            <br />
            <button onClick={() => { setError(null); setIsCameraActive(true); }} style={{ marginTop: '0.5rem' }}>Retry</button>
          </div>
        )}

        {result && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface, #fff)', border: '1px solid var(--border, #ccc)', borderRadius: '8px', width: '100%', maxWidth: '400px' }}>
            <h3 style={{ marginTop: 0, color: 'var(--primary)' }}>Verification Successful</h3>
            <p><strong>Waybill Info:</strong> {result.waybill_info || 'N/A'}</p>
            <p><strong>Batch:</strong> {result.batch || 'N/A'}</p>
            <p><strong>Product:</strong> {result.product || 'N/A'}</p>
            <p><strong>Custody Chain:</strong> {result.custody_chain || 'N/A'}</p>
            <button onClick={() => { setResult(null); setIsCameraActive(true); }} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px' }}>Scan Another</button>
          </div>
        )}
        
        {isCameraActive && !loading && (
          <button 
            onClick={() => handleScanResult('WAY-12345')} 
            style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
            Simulate Scan (WAY-12345)
          </button>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
