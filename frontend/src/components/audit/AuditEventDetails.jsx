import React from 'react';

const AuditEventDetails = ({ event }) => {
  if (!event) {
    return <div style={{ color: 'var(--text)' }}>Select an audit event to view details.</div>;
  }

  return (
    <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text)' }}>
      <h3 style={{ marginTop: 0 }}>Audit Event Details</h3>
      <div style={{ marginBottom: '16px' }}>
        <strong>Action:</strong> {event.what} on {event.entity} by {event.who} at {event.when}
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ padding: '12px', backgroundColor: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: '4px', color: '#721c24' }}>
          <h4 style={{ marginTop: 0 }}>Old Value</h4>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(event.oldValue, null, 2)}
          </pre>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#d4edda', border: '1px solid #c3e6cb', borderRadius: '4px', color: '#155724' }}>
          <h4 style={{ marginTop: 0 }}>New Value</h4>
          <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(event.newValue, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default AuditEventDetails;
