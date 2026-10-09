import React, { useState, useEffect } from 'react';
import apiClient from '../../api/axiosInstance';
import { StatusPill } from '../ui/StatusPill';

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '1.25rem 1.5rem',
};

export function AdminDisputeCenter() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/disputes/?limit=100');
      const list = res?.data || res || [];
      setDisputes(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to load supply chain disputes', err);
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;

    setResolving(true);
    setFeedback(null);
    try {
      const disputeId = selectedDispute.dispute_id || selectedDispute.id;
      await apiClient.patch(`/disputes/${encodeURIComponent(disputeId)}/resolve`, {
        resolution_note: resolutionNote.trim() || 'Dispute reviewed and resolved by administrator.',
        status: 'RESOLVED',
      });

      setFeedback({ type: 'success', text: `Dispute ${disputeId} marked as RESOLVED.` });
      setSelectedDispute(null);
      setResolutionNote('');
      fetchDisputes();
    } catch (err) {
      setFeedback({ type: 'error', text: err?.response?.data?.detail || err?.message || 'Failed to resolve dispute.' });
    } finally {
      setResolving(false);
    }
  };

  const filtered = disputes.filter((d) => {
    if (statusFilter !== 'ALL' && (d.status || '').toUpperCase() !== statusFilter) return false;
    return true;
  });

  const openCount = disputes.filter(d => (d.status || '').toUpperCase() === 'OPEN').length;
  const underReviewCount = disputes.filter(d => (d.status || '').toUpperCase() === 'UNDER_REVIEW').length;
  const resolvedCount = disputes.filter(d => (d.status || '').toUpperCase() === 'RESOLVED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--dashboard-heading)' }}>
            Enterprise Dispute Management
          </h1>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.875rem' }}>
            Cross-tier reconciliation, receiving discrepancies, shortage claims, and contractual settlement resolutions
          </p>
        </div>
        <button
          onClick={fetchDisputes}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          🔄 Refresh Disputes
        </button>
      </div>

      {feedback && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          background: feedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${feedback.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: feedback.type === 'success' ? '#065f46' : '#991b1b',
          fontSize: '0.875rem',
        }}>
          {feedback.text}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div style={{ ...cardStyle, borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            Open Claims
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ef4444' }}>
            {openCount}
          </div>
        </div>

        <div style={{ ...cardStyle, borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            Under Review
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>
            {underReviewCount}
          </div>
        </div>

        <div style={{ ...cardStyle, borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            Resolved Claims
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#10b981' }}>
            {resolvedCount}
          </div>
        </div>

        <div style={{ ...cardStyle, borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.5rem' }}>
            Total Disputes
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text)' }}>
            {disputes.length}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ ...cardStyle, display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
        >
          <option value="ALL">All Disputes</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      {/* Disputes Table */}
      <div style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.02)', color: 'var(--muted)' }}>
              <th style={{ padding: '0.75rem 1rem' }}>Dispute ID</th>
              <th style={{ padding: '0.75rem 1rem' }}>Type</th>
              <th style={{ padding: '0.75rem 1rem' }}>Order / Waybill</th>
              <th style={{ padding: '0.75rem 1rem' }}>Description</th>
              <th style={{ padding: '0.75rem 1rem' }}>Status</th>
              <th style={{ padding: '0.75rem 1rem' }}>Resolution Note</th>
              <th style={{ padding: '0.75rem 1rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  Loading supply chain disputes...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
                  No disputes recorded for this filter.
                </td>
              </tr>
            ) : (
              filtered.map((d) => {
                const isResolved = (d.status || '').toUpperCase() === 'RESOLVED';
                return (
                  <tr key={d.dispute_id || d.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{d.dispute_id || d.id}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#ef4444' }}>
                      {d.mismatch_type || 'DISCREPANCY'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{d.order_id || d.waybill_id || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', maxWidth: '300px' }}>{d.description || '—'}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <StatusPill status={isResolved ? 'success' : 'warning'} text={d.status || 'OPEN'} />
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--muted)', maxWidth: '200px' }}>
                      {d.resolution_note || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      {!isResolved ? (
                        <button
                          onClick={() => { setSelectedDispute(d); setResolutionNote(''); }}
                          style={{
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            border: '1px solid #10b981',
                            background: 'rgba(16, 185, 129, 0.1)',
                            color: '#10b981',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                          }}
                        >
                          Resolve
                        </button>
                      ) : (
                        <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Closed</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Resolution Modal */}
      {selectedDispute && (
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
            maxWidth: '480px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 700 }}>
              Resolve Dispute {selectedDispute.dispute_id || selectedDispute.id}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginBottom: '1rem' }}>
              <strong>Category:</strong> {selectedDispute.mismatch_type}<br />
              <strong>Description:</strong> {selectedDispute.description}
            </p>
            <form onSubmit={handleResolve} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                  Resolution Summary / Note *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Credit note issued for 5 missing units after warehouse audit..."
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolving}
                  style={{ padding: '0.5rem 1.25rem', borderRadius: '6px', border: 'none', background: '#10b981', color: 'white', fontWeight: 600, cursor: 'pointer' }}
                >
                  {resolving ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
