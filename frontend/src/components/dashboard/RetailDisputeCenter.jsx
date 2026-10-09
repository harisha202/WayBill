import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosInstance';
import { StatusPill } from '../ui/StatusPill';

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '1.25rem 1.5rem',
};

export function RetailDisputeCenter() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // New dispute form state
  const [orderId, setOrderId] = useState('');
  const [waybillId, setWaybillId] = useState('');
  const [mismatchType, setMismatchType] = useState('QUANTITY_MISMATCH');
  const [description, setDescription] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/disputes/');
      const list = res?.data || res || [];
      setDisputes(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load retail disputes', err);
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    setFeedbackMsg(null);
    try {
      await apiClient.post('/disputes/', {
        mismatch_type: mismatchType,
        description: description.trim(),
        order_id: orderId.trim() || undefined,
        waybill_id: waybillId.trim() || undefined,
      });

      setFeedbackMsg({ type: 'success', text: 'Dispute submitted successfully and routed to Admin & Dealer.' });
      setOrderId('');
      setWaybillId('');
      setDescription('');
      setShowModal(false);
      fetchDisputes();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err?.response?.data?.message || err?.message || 'Failed to submit dispute.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--dashboard-heading)' }}>
            Retail Dispute Center
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.875rem' }}>
            Report shipment shortages, damaged consignments, and tampered QR seals for immediate investigation
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            padding: '0.6rem 1.25rem',
            background: 'var(--red, #ef4444)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.875rem',
          }}
        >
          ⚠️ Raise Retail Dispute
        </button>
      </div>

      {feedbackMsg && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: feedbackMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${feedbackMsg.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: feedbackMsg.type === 'success' ? '#065f46' : '#991b1b',
          fontSize: '0.875rem',
        }}>
          {feedbackMsg.text}
        </div>
      )}

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={cardStyle}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            Total Disputes Filed
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
            {disputes.length}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            Open Discrepancies
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>
            {disputes.filter(d => (d.status || '').toUpperCase() === 'OPEN').length}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            Resolved
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
            {disputes.filter(d => (d.status || '').toUpperCase() === 'RESOLVED').length}
          </div>
        </div>
      </div>

      {/* Disputes Table */}
      <div style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)', color: 'var(--muted)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Dispute ID</th>
              <th style={{ padding: '0.75rem 1rem' }}>Discrepancy Type</th>
              <th style={{ padding: '0.75rem 1rem' }}>Related Order / Waybill</th>
              <th style={{ padding: '0.75rem 1rem' }}>Description</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Filed At</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  Loading retail disputes...
                </td>
              </tr>
            ) : disputes.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  No disputes on record. System is operating normally without shortages or discrepancies.
                </td>
              </tr>
            ) : (
              disputes.map((d) => (
                <tr key={d.dispute_id || d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{d.dispute_id || d.id}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#ef4444' }}>
                    {d.mismatch_type || 'DISCREPANCY'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {d.order_id || d.waybill_id || 'N/A'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', maxWidth: '300px' }}>
                    {d.description || '—'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <StatusPill status={(d.status || '').toUpperCase() === 'RESOLVED' ? 'success' : 'warning'} text={d.status || 'OPEN'} />
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)' }}>
                    {d.created_at ? new Date(d.created_at).toLocaleDateString() : 'Recent'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for raising dispute */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--surface)',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '2rem',
            width: '100%',
            maxWidth: '500px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 700 }}>
              Raise Receiving / Inventory Dispute
            </h2>
            <form onSubmit={handleRaiseDispute} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Discrepancy Category *
                </label>
                <select
                  value={mismatchType}
                  onChange={(e) => setMismatchType(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                >
                  <option value="QUANTITY_MISMATCH">Quantity Mismatch (Shortage/Excess)</option>
                  <option value="DAMAGED_GOODS">Damaged Goods in Consignment</option>
                  <option value="WRONG_ITEM">Wrong SKU / Product Shipped</option>
                  <option value="TAMPERED_SEAL">Tampered Physical or Digital Seal</option>
                  <option value="EXPIRED_BATCH">Expired or Near-Expiry Batch</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Order Code (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. ORD-2026-0042"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Waybill / Seal ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. WB-001 or Seal Hash"
                  value={waybillId}
                  onChange={(e) => setWaybillId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Detailed Description *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain the discrepancy observed upon receiving packages..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  {submitting ? 'Submitting...' : 'Submit Dispute'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
