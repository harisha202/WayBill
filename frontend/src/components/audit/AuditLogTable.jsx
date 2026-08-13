import React from 'react';

const AuditLogTable = ({ logs = [] }) => {
  return (
    <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
      <h3 style={{ color: 'var(--text)', marginTop: 0 }}>Audit Logs</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Who (User/System)</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>What (Action)</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Entity</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>When (Timestamp)</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Result</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 ? (
            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '16px' }}>No audit logs available</td></tr>
          ) : (
            logs.map((log, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px' }}>{log.who}</td>
                <td style={{ padding: '8px' }}>{log.what}</td>
                <td style={{ padding: '8px' }}>{log.entity}</td>
                <td style={{ padding: '8px' }}>{log.when}</td>
                <td style={{ padding: '8px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px', 
                    backgroundColor: log.result === 'Success' ? '#d4edda' : '#f8d7da', 
                    color: log.result === 'Success' ? '#155724' : '#721c24' 
                  }}>
                    {log.result}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AuditLogTable;
