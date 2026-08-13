import React from 'react';

const LedgerTable = ({ entries = [] }) => {
  return (
    <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', overflowX: 'auto' }}>
      <h3 style={{ color: 'var(--text)', marginTop: 0 }}>Ledger Transactions</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text)', minWidth: '800px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Transaction ID</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Order ID</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Shipment ID</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Waybill ID</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Amount (Currency)</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Timestamp</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
            <th style={{ padding: '8px', textAlign: 'left' }}>Seal/Hash</th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr><td colSpan="9" style={{ textAlign: 'center', padding: '16px' }}>No ledger entries available</td></tr>
          ) : (
            entries.map((entry, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px' }}>{entry.transactionId}</td>
                <td style={{ padding: '8px' }}>{entry.orderId}</td>
                <td style={{ padding: '8px' }}>{entry.shipmentId}</td>
                <td style={{ padding: '8px' }}>{entry.waybillId}</td>
                <td style={{ padding: '8px' }}>{entry.amount} ({entry.currency})</td>
                <td style={{ padding: '8px' }}>{entry.type}</td>
                <td style={{ padding: '8px' }}>{entry.timestamp}</td>
                <td style={{ padding: '8px' }}>{entry.status}</td>
                <td style={{ padding: '8px', fontFamily: 'monospace', fontSize: '12px' }}>{entry.hash}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default LedgerTable;
