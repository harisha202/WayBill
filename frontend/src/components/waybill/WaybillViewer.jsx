import React from 'react';

const WaybillViewer = ({ waybill }) => {
  if (!waybill) return null;

  const {
    id,
    orderId,
    batchId,
    sku,
    quantity,
    currentCustodian,
    shipmentId,
    status
  } = waybill;

  const containerStyle = {
    backgroundColor: 'var(--surface, #ffffff)',
    color: 'var(--text, #333333)',
    border: '1px solid var(--border, #e0e0e0)',
    padding: '1rem',
    borderRadius: '8px',
    marginBottom: '1rem',
    fontFamily: 'sans-serif'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '1rem'
  };

  const labelStyle = {
    fontSize: '0.875rem',
    color: 'var(--text-secondary, #666666)',
    marginBottom: '0.25rem'
  };

  const valueStyle = {
    fontSize: '1rem',
    fontWeight: '500'
  };

  const Item = ({ label, value }) => (
    <div>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value || 'N/A'}</div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--border, #e0e0e0)', paddingBottom: '0.5rem' }}>Waybill Details</h3>
      <div style={gridStyle}>
        <Item label="Waybill ID" value={id} />
        <Item label="Order" value={orderId} />
        <Item label="Batch" value={batchId} />
        <Item label="SKU" value={sku} />
        <Item label="Quantity" value={quantity} />
        <Item label="Current Custodian" value={currentCustodian} />
        <Item label="Shipment" value={shipmentId} />
        <Item label="Status" value={status} />
      </div>
    </div>
  );
};

export default WaybillViewer;
