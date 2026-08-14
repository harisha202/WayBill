/**
 * AdminFeatures.jsx
 *
 * Re-exports all Admin analytics tab components and preserves
 * the existing non-analytics features (ActivityLog, AdminLedger wrapper,
 * UserManagement, SettlementDashboard).
 *
 * Analytics tabs are now fully implemented in the analytics/ folder.
 * This file acts as the single import facade so WaybillRouter.jsx
 * does not need to change.
 */

// ─── NEW ANALYTICS TAB COMPONENTS ──────────────────────────────────────────────
export { ControlTower } from './analytics/ControlTower';
export { SupplyChainDepth } from './analytics/SupplyChainDepth';
export { SupplierRiskTab as SupplierRisk } from './analytics/SupplierRiskTab';
export { FinancialLedger as AdminLedger } from './analytics/FinancialLedger';

// ─── PRESERVED: ACTIVITY LOG ────────────────────────────────────────────────────
import React from 'react';
import { SettlementsTable, SettlementLifecycle, SettlementDashboard } from './SettlementDashboard';
import { useApi } from '../../api/hooks/useApi';
import { StateBoundary } from '../common/StateBoundary';

const containerStyle = {
  backgroundColor: 'var(--bg)',
  color: 'var(--text)',
  padding: '2rem',
  minHeight: '100vh',
  fontFamily: 'inherit'
};

const cardStyle = {
  backgroundColor: 'var(--surface)',
  borderRadius: '12px',
  padding: '1.5rem',
  border: '1px solid var(--border)',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  textAlign: 'left'
};

const thStyle = {
  padding: '0.75rem 1rem',
  color: 'var(--muted)',
  fontWeight: '600',
  borderBottom: '1px solid var(--border)',
  backgroundColor: 'var(--bg)',
  fontSize: '0.75rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em'
};

const tdStyle = {
  padding: '0.75rem 1rem',
  borderBottom: '1px solid var(--border)',
  fontSize: '0.8125rem'
};

export function ActivityLog() {
  const activityApi = useApi('/admin/activity-logs');
  const logs = activityApi.data?.logs || [];
  const [selectedLog, setSelectedLog] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const openModal = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  React.useEffect(() => {
    const handleRefresh = () => activityApi.refetch();
    window.addEventListener('activity_log_changed', handleRefresh);
    return () => window.removeEventListener('activity_log_changed', handleRefresh);
  }, [activityApi]);

  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.625rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: 'var(--dashboard-heading)' }}>
          Activity &amp; Audit Log
        </h1>
        <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.875rem' }}>
          System anomalies, user actions, and event tracking
        </p>
      </header>

      <StateBoundary state={activityApi} onRetry={activityApi.refetch}>
        <div style={{ ...cardStyle, padding: 0, overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Timestamp</th>
                <th style={thStyle}>User (ID)</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Entity</th>
                <th style={thStyle}>Details</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: 'var(--muted)' }}>
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id}>
                    <td style={tdStyle}>{new Date(log.timestamp).toLocaleString()}</td>
                    <td style={tdStyle}>{log.user_id || 'System'}</td>
                    <td style={tdStyle}>{log.role || '-'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        backgroundColor: 'rgba(79, 70, 229, 0.1)',
                        color: '#4f46e5'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={tdStyle}>{log.entity_type} {log.entity_id ? `(#${log.entity_id})` : ''}</td>
                    <td style={tdStyle}>
                      <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px', color: 'var(--muted)' }}>
                        {log.details ? JSON.stringify(log.details) : '-'}
                      </pre>
                    </td>
                    <td style={tdStyle}>
                      <button
                        style={{
                          fontSize: '0.75rem', background: 'var(--blue)', color: '#fff',
                          border: 'none', padding: '0.35rem 0.65rem', borderRadius: '6px', cursor: 'pointer'
                        }}
                        onClick={() => openModal(log)}
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </StateBoundary>

      {isModalOpen && selectedLog && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            ...cardStyle, width: '600px', maxWidth: '90vw',
            maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflowY: 'auto'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '1rem', color: 'var(--dashboard-heading)' }}>Audit Log Details</h3>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem' }}><strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toLocaleString()}</p>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem' }}><strong>User:</strong> {selectedLog.user_id || 'System'} ({selectedLog.role || '-'})</p>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem' }}><strong>Action:</strong> {selectedLog.action}</p>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.875rem' }}><strong>Entity:</strong> {selectedLog.entity_type} {selectedLog.entity_id ? `(#${selectedLog.entity_id})` : ''}</p>
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontWeight: 600, marginBottom: '0.5rem', fontSize: '0.875rem' }}>JSON Payload:</p>
              <pre style={{
                backgroundColor: 'var(--bg)', padding: '1rem', borderRadius: '6px',
                overflowX: 'auto', border: '1px solid var(--border)',
                color: 'var(--text)', fontSize: '0.8rem', margin: 0
              }}>
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <button
                style={{
                  padding: '0.5rem 1.25rem', borderRadius: '8px', border: 'none',
                  background: 'var(--blue)', color: 'white', cursor: 'pointer', fontWeight: 600
                }}
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { SettlementDashboard };
