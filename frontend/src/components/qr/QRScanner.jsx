import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const QRScanner = ({ onScan }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(null);
  const [manualValue, setManualValue] = useState('');
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const html5QrCodeRef = useRef(null);
  const scannerContainerId = useRef(`qr-reader-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    // Check available video devices
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length > 0) {
          setCameras(devices);
          setSelectedCameraId(devices[0].id);
        }
      })
      .catch((err) => {
        // Cameras not available or permission requested on start
      });

    return () => {
      // Cleanup on unmount
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current
            .stop()
            .then(() => html5QrCodeRef.current.clear())
            .catch(() => {});
        } else {
          try {
            html5QrCodeRef.current.clear();
          } catch (_) {}
        }
      }
    };
  }, []);

  const startCamera = async (cameraIdToUse) => {
    setCameraPermissionError(null);
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerContainerId.current);
      }

      const cameraId = cameraIdToUse || selectedCameraId || { facingMode: 'environment' };

      await html5QrCodeRef.current.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback
          stopCamera();
          if (onScan) {
            onScan(decodedText);
          }
        },
        (errorMessage) => {
          // Frame scan failure (ignore routine non-matches)
        }
      );
      setCameraActive(true);
    } catch (err) {
      console.warn('Camera start error:', err);
      setCameraPermissionError(
        err?.message?.includes('Permission')
          ? 'Camera permission was denied. Please allow camera access in your browser settings.'
          : `Unable to access video device: ${err?.message || 'No camera found'}`
      );
      setCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setCameraActive(false);
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualValue.trim()) return;
    stopCamera();
    if (onScan) {
      onScan(manualValue.trim());
    }
  };

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Viewport Box */}
      <div
        style={{
          width: '100%',
          backgroundColor: 'var(--surface, #1e293b)',
          border: '1px solid var(--border, #334155)',
          borderRadius: '12px',
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Real Video Scanner DOM Element */}
        <div
          id={scannerContainerId.current}
          style={{
            width: '100%',
            maxWidth: '360px',
            minHeight: cameraActive ? '260px' : '0px',
            borderRadius: '8px',
            overflow: 'hidden',
            display: cameraActive ? 'block' : 'none',
          }}
        />

        {!cameraActive && (
          <div
            style={{
              padding: '2rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.8rem',
              }}
            >
              📷
            </div>
            <strong style={{ color: 'var(--text, #f8fafc)', fontSize: '1rem' }}>
              Hardware QR Camera Scanner
            </strong>
            <p style={{ margin: 0, color: 'var(--muted, #94a3b8)', fontSize: '0.85rem', maxWidth: '320px' }}>
              Activate your camera to scan Waybill physical QR codes and cryptographic seals.
            </p>

            <button
              type="button"
              onClick={() => startCamera()}
              style={{
                marginTop: '0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--primary, #3b82f6)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem 1.25rem',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              🎥 Launch Camera Feed
            </button>
          </div>
        )}

        {cameraActive && (
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {cameras.length > 1 && (
              <select
                value={selectedCameraId}
                onChange={(e) => {
                  setSelectedCameraId(e.target.value);
                  stopCamera().then(() => startCamera(e.target.value));
                }}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '6px',
                  background: 'var(--bg, #0f172a)',
                  color: 'var(--text, #f8fafc)',
                  border: '1px solid var(--border, #334155)',
                  fontSize: '0.85rem',
                }}
              >
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label || `Camera ${c.id.slice(0, 5)}`}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={stopCamera}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '0.45rem 1rem',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              ⏹ Stop Camera
            </button>
          </div>
        )}

        {cameraPermissionError && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.85rem',
              textAlign: 'center',
              maxWidth: '360px',
            }}
          >
            ⚠️ {cameraPermissionError}
          </div>
        )}
      </div>

      {/* Manual Waybill Input / Fallback */}
      <form
        onSubmit={handleManualSubmit}
        style={{
          display: 'flex',
          gap: '0.5rem',
          width: '100%',
        }}
      >
        <input
          type="text"
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          placeholder="Paste Waybill ID (e.g. WAY-C9D39153) or raw seal payload"
          style={{
            flex: 1,
            padding: '0.7rem 1rem',
            background: 'var(--bg, #0f172a)',
            color: 'var(--text, #f8fafc)',
            border: '1px solid var(--border, #334155)',
            borderRadius: '8px',
            fontSize: '0.9rem',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '0.7rem 1.25rem',
            background: 'var(--primary, #3b82f6)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Verify Text
        </button>
      </form>
    </div>
  );
};

export default QRScanner;
