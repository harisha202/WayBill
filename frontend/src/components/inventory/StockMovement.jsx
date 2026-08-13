import React from 'react';

const StockMovement = ({ movements = [] }) => {
  return (
    <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)' }}>
      <h3 style={{ color: 'var(--text)', marginTop: 0 }}>Stock Movement History</h3>
      <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
        {movements.length === 0 ? (
          <li style={{ color: 'var(--text)', padding: '8px 0' }}>No stock movements recorded</li>
        ) : (
          movements.map((movement, idx) => (
            <li key={idx} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)', color: 'var(--text)' }}>
              <div style={{ fontWeight: 'bold' }}>{movement.date} - {movement.type}</div>
              <div>Item: {movement.itemName} | Quantity: {movement.quantity} | Reason: {movement.reason}</div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default StockMovement;
