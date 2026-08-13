import React from 'react';

const DiscrepancyPanel = ({ data = [] }) => {
  return (
    <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
      <h3 style={{ color: 'var(--text)', marginTop: 0 }}>Discrepancy & Backorders</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Ordered</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Received</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Backorder Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '16px' }}>No discrepancies found</td></tr>
          ) : (
            data.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px' }}>{item.name}</td>
                <td style={{ padding: '8px' }}>{item.ordered}</td>
                <td style={{ padding: '8px' }}>{item.received}</td>
                <td style={{ padding: '8px', color: '#d9534f', fontWeight: 'bold' }}>{item.ordered - item.received}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DiscrepancyPanel;
