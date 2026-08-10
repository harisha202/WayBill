import React, { useState, useEffect } from 'react';
import { blockchainApi } from '../../api/axiosInstance';
import { StatusPill } from './StatusPill';
import { QRCodeSVG } from 'qrcode.react';

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
      <div style={styles.overlay}>
        <div style={{...styles.modal, ...styles.center}}>
          <div className="spinner" style={styles.spinner}></div>
          <p style={styles.text}>Retrieving Blockchain Document...</p>
        </div>
      </div>
    );
  }

  if (error || !waybill) {
    return (
      <div style={styles.overlay}>
        <div style={{...styles.modal, ...styles.center}}>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
          <div style={{ color: '#dc2626', fontSize: '2.5rem', marginBottom: '16px' }}>⚠</div>
          <h3 style={styles.heading}>Waybill Document Unavailable</h3>
          <p style={styles.mutedText}>{error}</p>
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

  // Financial dummy defaults if not present
  const transportCost = waybill.financials?.transport || 1500;
  const handlingCost = waybill.financials?.handling || 300;
  const storageCost = waybill.financials?.storage || 200;
  const totalCost = transportCost + handlingCost + storageCost;
  const ledgerStatus = waybill.financials?.status || 'SETTLED';
  const ledgerHash = waybill.financials?.hash || '0x4f8a...9c21';

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>×</button>
        
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.mainTitle}>Official Waybill Document</h2>
            <div style={styles.metaRow}>
              <span style={styles.metaTag}>ID: {waybill.waybill_id}</span>
              <span style={styles.dot}>•</span>
              <span style={styles.metaTag}>Order: {waybill.order_id}</span>
              <span style={styles.dot}>•</span>
              <StatusPill status={waybill.status} />
            </div>
          </div>
          
          <div style={{ ...styles.seal, borderColor: sealColor, color: sealColor }}>
            <div style={styles.sealIcon}>{sealIcon}</div>
            <div style={styles.sealText}>SEALED</div>
            <div style={styles.sealHash}>{waybill.seal_hash?.substring(0, 8) || '0x1A2B'}...</div>
          </div>
        </div>

        <div style={styles.body}>
          
          {/* PRODUCT INFO */}
          <div style={styles.sectionBlock}>
            <h3 style={styles.sectionTitle}>Product Details</h3>
            <div style={styles.grid2}>
              <div style={styles.detailBox}>
                <label style={styles.label}>SKU</label>
                <div style={styles.value}>{waybill.sku || 'N/A'}</div>
              </div>
              <div style={styles.detailBox}>
                <label style={styles.label}>Quantity</label>
                <div style={styles.value}>{waybill.quantity || 0} Units</div>
              </div>
              <div style={styles.detailBox}>
                <label style={styles.label}>Batch ID</label>
                <div style={styles.value}>{waybill.batch_id || 'N/A'}</div>
              </div>
              <div style={styles.detailBox}>
                <label style={styles.label}>Current Custodian</label>
                <div style={styles.highlightValue}>{waybill.current_custodian || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div style={styles.grid2Layout}>
            {/* CUSTODY CHAIN */}
            <div style={styles.sectionBlock}>
              <h3 style={styles.sectionTitle}>Chain of Custody</h3>
              <div style={styles.timeline}>
                {waybill.custody_chain?.length > 0 ? waybill.custody_chain.map((step, idx) => (
                  <div key={idx} style={styles.timelineStep}>
                    <div style={styles.timelineMarker}></div>
                    <div style={styles.timelineContent}>
                      <div style={styles.stepHeader}>
                        <strong style={styles.stepRole}>{step.role}</strong>
                        <span style={styles.stepTime}>{new Date(step.timestamp).toLocaleString()}</span>
                      </div>
                      <div style={styles.stepCustodian}>{step.custodian}</div>
                      <div style={styles.stepHash}>Tx: {step.hash}</div>
                    </div>
                  </div>
                )) : (
                  <div style={styles.mutedText}>No custody records found.</div>
                )}
              </div>
            </div>

            {/* FINANCIAL LEDGER */}
            <div style={styles.sectionBlock}>
              <h3 style={styles.sectionTitle}>Financial Ledger</h3>
              <div style={styles.ledgerBox}>
                <div style={styles.ledgerRow}>
                  <span style={styles.ledgerLabel}>Transport</span>
                  <span style={styles.ledgerValue}>₹ {transportCost.toLocaleString()}</span>
                </div>
                <div style={styles.ledgerRow}>
                  <span style={styles.ledgerLabel}>Handling</span>
                  <span style={styles.ledgerValue}>₹ {handlingCost.toLocaleString()}</span>
                </div>
                <div style={styles.ledgerRow}>
                  <span style={styles.ledgerLabel}>Storage</span>
                  <span style={styles.ledgerValue}>₹ {storageCost.toLocaleString()}</span>
                </div>
                <div style={{ ...styles.ledgerRow, ...styles.ledgerTotal }}>
                  <span style={styles.ledgerLabelTotal}>Total</span>
                  <span style={styles.ledgerValueTotal}>₹ {totalCost.toLocaleString()}</span>
                </div>
              </div>
              
              <div style={styles.ledgerMeta}>
                <div style={styles.ledgerMetaRow}>
                  <span style={styles.metaLabel}>Status:</span> 
                  <span style={styles.metaSuccess}>{ledgerStatus}</span>
                </div>
                <div style={styles.ledgerMetaRow}>
                  <span style={styles.metaLabel}>Hash:</span> 
                  <span style={styles.metaHash}>{ledgerHash}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={styles.footer}>
          <div style={styles.qrContainer}>
            {waybill.waybill_id ? (
              <div style={styles.qrWrapper}>
                <QRCodeSVG value={`https://waybill.network/verify?id=${waybill.waybill_id}`} size={70} fgColor="#e2e8f0" bgColor="transparent" />
              </div>
            ) : (
              <div style={styles.qrPlaceholder}>No QR</div>
            )}
            <div style={styles.qrLabel}>Scan to Verify</div>
          </div>
          
          <div style={styles.authStamp}>
            <p style={styles.authText}>Secured by WayBill Blockchain</p>
            <p style={styles.authSubText}>Last Updated: {new Date(waybill.updated_at || Date.now()).toLocaleString()}</p>
            {onConfirm && (
              <button 
                style={styles.confirmBtn}
                onClick={() => onConfirm(waybill)}
                onMouseOver={(e) => e.target.style.background = '#0e9f8d'}
                onMouseOut={(e) => e.target.style.background = 'linear-gradient(135deg, #0f766e, #0e9f8d)'}
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

const styles = {
  overlay: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(2, 6, 23, 0.8)',
    backdropFilter: 'blur(6px)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    color: '#e2e8f0',
    fontFamily: 'system-ui, sans-serif'
  },
  modal: {
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '850px',
    maxHeight: '90vh',
    overflowY: 'auto',
    position: 'relative',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    display: 'flex',
    flexDirection: 'column',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    padding: '40px',
  },
  closeBtn: {
    position: 'absolute',
    top: '16px',
    right: '20px',
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    fontSize: '28px',
    cursor: 'pointer',
    lineHeight: 1,
    zIndex: 10,
  },
  header: {
    padding: '30px 40px',
    borderBottom: '1px solid #1e293b',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    background: 'linear-gradient(to right, #0f172a, #1e293b)',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
  },
  mainTitle: {
    margin: '0 0 12px 0',
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: '-0.02em',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.9rem',
    color: '#94a3b8',
    flexWrap: 'wrap',
  },
  metaTag: {
    background: 'rgba(255,255,255,0.05)',
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid #334155',
    fontWeight: '500',
    color: '#e2e8f0'
  },
  dot: {
    color: '#475569',
  },
  seal: {
    width: '90px',
    height: '90px',
    border: '3px dashed',
    borderRadius: '50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotate(-12deg)',
    background: 'rgba(15, 23, 42, 0.4)',
    boxShadow: 'inset 0 0 15px rgba(0,0,0,0.5)',
  },
  sealIcon: {
    fontSize: '1.8rem',
    lineHeight: 1,
    marginBottom: '2px',
  },
  sealText: {
    fontSize: '0.65rem',
    fontWeight: '800',
    letterSpacing: '0.15em',
  },
  sealHash: {
    fontSize: '0.55rem',
    fontFamily: 'monospace',
    marginTop: '4px',
    opacity: 0.8,
  },
  body: {
    padding: '30px 40px',
    display: 'flex',
    flexDirection: 'column',
    gap: '30px',
  },
  sectionBlock: {
    background: '#1e293b',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #334155',
  },
  sectionTitle: {
    margin: '0 0 20px 0',
    fontSize: '1.15rem',
    fontWeight: '600',
    color: '#f1f5f9',
    borderBottom: '1px solid #334155',
    paddingBottom: '12px',
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '20px',
  },
  grid2Layout: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  detailBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#94a3b8',
    fontWeight: '600',
  },
  value: {
    fontSize: '1.05rem',
    color: '#f8fafc',
    fontWeight: '500',
  },
  highlightValue: {
    fontSize: '1.05rem',
    color: '#38bdf8',
    fontWeight: '600',
  },
  timeline: {
    position: 'relative',
    paddingLeft: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  timelineStep: {
    position: 'relative',
  },
  timelineMarker: {
    position: 'absolute',
    left: '-28px',
    top: '4px',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: '#38bdf8',
    border: '3px solid #1e293b',
    boxShadow: '0 0 0 1px #334155',
  },
  timelineContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  stepHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  stepRole: {
    fontSize: '0.9rem',
    color: '#f1f5f9',
    fontWeight: '600',
  },
  stepTime: {
    fontSize: '0.75rem',
    color: '#94a3b8',
  },
  stepCustodian: {
    fontSize: '0.95rem',
    color: '#cbd5e1',
  },
  stepHash: {
    fontSize: '0.75rem',
    fontFamily: 'monospace',
    color: '#10b981',
    background: 'rgba(16, 185, 129, 0.1)',
    padding: '4px 8px',
    borderRadius: '6px',
    alignSelf: 'flex-start',
    border: '1px solid rgba(16, 185, 129, 0.2)',
  },
  ledgerBox: {
    background: '#0f172a',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
    border: '1px solid #334155',
  },
  ledgerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
    color: '#cbd5e1',
  },
  ledgerTotal: {
    marginTop: '8px',
    paddingTop: '12px',
    borderTop: '1px dashed #334155',
  },
  ledgerLabel: {
    color: '#94a3b8',
  },
  ledgerValue: {
    fontFamily: 'monospace',
    fontWeight: '500',
  },
  ledgerLabelTotal: {
    color: '#f8fafc',
    fontWeight: '700',
    fontSize: '1.05rem',
  },
  ledgerValueTotal: {
    color: '#10b981',
    fontWeight: '700',
    fontSize: '1.1rem',
    fontFamily: 'monospace',
  },
  ledgerMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '0 8px',
  },
  ledgerMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.8rem',
  },
  metaLabel: {
    color: '#94a3b8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  metaSuccess: {
    color: '#10b981',
    fontWeight: '700',
    background: 'rgba(16, 185, 129, 0.1)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  metaHash: {
    color: '#64748b',
    fontFamily: 'monospace',
  },
  footer: {
    padding: '24px 40px',
    borderTop: '1px solid #1e293b',
    background: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: '16px',
    borderBottomRightRadius: '16px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  qrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  qrWrapper: {
    background: '#1e293b',
    padding: '8px',
    borderRadius: '8px',
    border: '1px solid #334155',
  },
  qrPlaceholder: {
    width: '70px',
    height: '70px',
    background: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.8rem',
    color: '#64748b',
    borderRadius: '8px',
    border: '1px dashed #475569',
  },
  qrLabel: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    fontWeight: '500',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  authStamp: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },
  authText: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '600',
    color: '#e2e8f0',
  },
  authSubText: {
    margin: 0,
    fontSize: '0.8rem',
    color: '#64748b',
  },
  confirmBtn: {
    marginTop: '16px',
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #0f766e, #0e9f8d)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.95rem',
    cursor: 'pointer',
    transition: 'background 0.2s, transform 0.1s',
    boxShadow: '0 4px 12px rgba(15, 118, 110, 0.3)',
  },
  spinner: {
    border: '3px solid rgba(255,255,255,0.1)',
    borderTop: '3px solid #38bdf8',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    marginBottom: '16px',
  },
  text: {
    color: '#94a3b8',
    fontSize: '1.1rem',
  },
  heading: {
    margin: '0 0 8px 0',
    fontSize: '1.5rem',
    color: '#f8fafc',
  },
  mutedText: {
    color: '#64748b',
    fontSize: '1rem',
  }
};
