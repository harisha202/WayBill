import React from 'react';

const InventoryTable = ({ data = [] }) => {
  return (
    <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
      <h3 style={{ color: 'var(--text)', marginTop: 0 }}>Inventory Overview</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text)' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Item</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Ordered</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Received</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Available</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Reserved</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Sold</th>
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan="6" style={{ textAlign: 'center', padding: '16px' }}>No inventory data available</td></tr>
          ) : (
            data.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px' }}>{item.name}</td>
                <td style={{ padding: '8px' }}>{item.ordered}</td>
                <td style={{ padding: '8px' }}>{item.received}</td>
                <td style={{ padding: '8px' }}>{item.available}</td>
                <td style={{ padding: '8px' }}>{item.reserved}</td>
                <td style={{ padding: '8px' }}>{item.sold}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryTable;
