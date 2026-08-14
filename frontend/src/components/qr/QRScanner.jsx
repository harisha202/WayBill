import React, { useState } from 'react';

const QRScanner = ({ onScan }) => {
  const [isCameraActive, setIsCameraActive] = useState(true);

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
        {isCameraActive ? (
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
        ) : (
          <div style={{ height: '250px', display: 'flex', alignItems: 'center' }}>
            <p>Camera inactive</p>
          </div>
        )}
      </div>


    </div>
  );
};

export default QRScanner;
