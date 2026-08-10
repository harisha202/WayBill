import React, { useState, useEffect } from 'react';
import { blockchainApi } from '../../api/axiosInstance';
import { StatusPill } from './StatusPill';

export function WaybillDocumentViewer({ orderCode, waybillId, onClose, onConfirm, confirmText = "Confirm Document" }) {
  const [waybill, setWaybill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchWaybill = async () => {
      setLoading(true);
      try {
        let res;
        if (waybillId) {
          res = await blockchainApi.getWaybillById(waybillId);
        } else if (orderCode) {
          res = await blockchainApi.getWaybillByOrder(orderCode);
        } else {
          throw new Error("Must provide orderCode or waybillId");
        }
        setWaybill(res);
      } catch (err) {
        console.error("Failed to load Waybill Document:", err);
        setError("Document not found or inaccessible.");
      } finally {
        setLoading(false);
      }
    };
    fetchWaybill();
  }, [orderCode, waybillId]);

  if (loading) {
    return (
      <div className="waybill-modal-overlay">
        <div className="waybill-modal-content loading">
          <div className="spinner"></div>
          <p>Retrieving Blockchain Document...</p>
        </div>
      </div>
    );
  }

  if (error || !waybill) {
    return (
      <div className="waybill-modal-overlay">
        <div className="waybill-modal-content error">
          <button className="close-btn" onClick={onClose}>×</button>
          <div style={{ color: '#dc2626', fontSize: '2rem', marginBottom: '16px' }}>⚠</div>
          <h3>Waybill Document Unavailable</h3>
          <p className="muted">{error}</p>
        </div>
      </div>
    );
  }

  // Determine seal color based on status
  let sealColor = '#f59e0b'; // pending/amber
  let sealIcon = '⏳';
  if (waybill.status === 'verified' || waybill.status === 'delivered') {
    sealColor = '#10b981'; // green
    sealIcon = '✓';
  } else if (waybill.status === 'disputed') {
    sealColor = '#dc2626'; // red
    sealIcon = '×';
  }

  return (
    <div className="waybill-modal-overlay" onClick={onClose}>
      <div className="waybill-modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="waybill-header">
          <div className="waybill-title">
            <h2>Official Waybill Document</h2>
            <div className="waybill-meta">
              <span>ID: {waybill.waybill_id}</span>
              <span>•</span>
              <span>Order: {waybill.order_id}</span>
              <span>•</span>
              <span><StatusPill status={waybill.status} /></span>
            </div>
          </div>
          
          <div className="waybill-seal" style={{ borderColor: sealColor, color: sealColor }}>
            <div className="seal-icon">{sealIcon}</div>
            <div className="seal-text">SEALED</div>
            <div className="seal-hash">{waybill.seal_hash?.substring(0, 8)}...</div>
          </div>
        </div>

        <div className="waybill-body">
          <div className="waybill-details-grid">
            <div className="detail-group">
              <label>SKU</label>
              <div>{waybill.sku}</div>
            </div>
            <div className="detail-group">
              <label>Quantity</label>
              <div>{waybill.quantity} Units</div>
            </div>
            <div className="detail-group">
              <label>Batch ID</label>
              <div>{waybill.batch_id}</div>
            </div>
            <div className="detail-group">
              <label>Current Custodian</label>
              <div style={{ fontWeight: 600 }}>{waybill.current_custodian}</div>
            </div>
          </div>

          <div className="waybill-timeline-section">
            <h3>Chain of Custody</h3>
            <div className="custody-timeline">
              {waybill.custody_chain?.map((step, idx) => (
                <div key={idx} className="timeline-step">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="step-header">
                      <strong>{step.role}</strong>
                      <span className="step-time">{new Date(step.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="step-custodian">{step.custodian}</div>
                    <div className="step-hash">Tx: {step.hash}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="waybill-footer">
          <div className="qr-container">
            {waybill.qr_code ? (
              <img src={waybill.qr_code} alt="Waybill QR Code" width="100" height="100" />
            ) : (
              <div className="qr-placeholder">No QR</div>
            )}
            <div className="qr-label">Scan to Verify</div>
          </div>
          <div className="auth-stamp">
            <p>Secured by WayBill Blockchain</p>
            <p className="muted">Last Updated: {new Date(waybill.updated_at).toLocaleString()}</p>
            {onConfirm && (
              <button 
                className="primary-btn" 
                style={{ marginTop: '12px', width: '100%' }}
                onClick={() => onConfirm(waybill)}
              >
                {confirmText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
