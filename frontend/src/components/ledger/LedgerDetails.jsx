import React from 'react';

const LedgerDetails = ({ details }) => {
  if (!details) {
    return <div style={{ color: 'var(--text)' }}>Select a transaction to view details.</div>;
  }

  return (
    <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text)' }}>
      <h3 style={{ marginTop: 0 }}>Transaction Details</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div><strong>Transaction ID:</strong> {details.transactionId}</div>
        <div><strong>Status:</strong> {details.status}</div>
        <div><strong>Order ID:</strong> {details.orderId}</div>
        <div><strong>Shipment ID:</strong> {details.shipmentId}</div>
        <div><strong>Amount:</strong> {details.amount} {details.currency}</div>
        <div><strong>Type:</strong> {details.type}</div>
        <div><strong>Timestamp:</strong> {details.timestamp}</div>
      </div>
      <div style={{ marginTop: '16px', wordBreak: 'break-all' }}>
        <strong>Seal/Hash:</strong> <span style={{ fontFamily: 'monospace' }}>{details.hash}</span>
      </div>
    </div>
  );
};

export default LedgerDetails;
