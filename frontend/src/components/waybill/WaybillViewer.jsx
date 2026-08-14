import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { StatusPill } from '../ui/StatusPill';

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
    status,
    sender,
    receiver,
    transporter,
    driver,
    vehicle,
    seal,
    verificationStatus,
    timeline = []
  } = waybill;

  // Reconstruct QR string format: WAYBILL_ID|SEAL
  const qrString = `${id}|${seal || 'unsealed'}`;

  return (
    <div style={{
      background: 'white',
      color: 'black',
      maxWidth: '850px',
      margin: '0 auto',
      border: '1px solid #e2e8f0',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
          borderBottom: '2px solid #0f172a', 
          padding: '2rem', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'flex-start' 
      }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem 0', fontSize: '2.5rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', color: '#0f172a' }}>
            WAYBILL
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '1rem', fontWeight: 600 }}>ID: {id}</p>
          <div style={{ marginTop: '1rem' }}>
              <StatusPill status={status} />
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ background: '#f8fafc', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '4px', display: 'inline-block' }}>
            <QRCodeSVG value={qrString} size={100} level="M" />
          </div>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>SCAN TO VERIFY</p>
        </div>
      </div>

      {/* Main Info */}
      <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Left Column */}
        <div>
            <h3 style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem', margin: '0 0 1rem 0', fontSize: '0.875rem', textTransform: 'uppercase', color: '#475569' }}>Routing Information</h3>
            <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Sender</strong>
                <div style={{ fontSize: '1rem', fontWeight: 500 }}>{sender || 'Manufacturer'}</div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Receiver</strong>
                <div style={{ fontSize: '1rem', fontWeight: 500 }}>{receiver || 'Dealer Warehouse'}</div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Transporter</strong>
                <div style={{ fontSize: '1rem', fontWeight: 500 }}>{transporter || 'N/A'}</div>
                <div style={{ fontSize: '0.875rem', color: '#475569' }}>Driver: {driver || 'N/A'} | Vehicle: {vehicle || 'N/A'}</div>
            </div>
        </div>

        {/* Right Column */}
        <div>
            <h3 style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem', margin: '0 0 1rem 0', fontSize: '0.875rem', textTransform: 'uppercase', color: '#475569' }}>Consignment Details</h3>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '0.875rem', color: '#64748b' }}>Order ID</strong>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{orderId || 'N/A'}</div>
            </div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '0.875rem', color: '#64748b' }}>Shipment ID</strong>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{shipmentId || 'N/A'}</div>
            </div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '0.875rem', color: '#64748b' }}>SKU</strong>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{sku || 'N/A'}</div>
            </div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                <strong style={{ fontSize: '0.875rem', color: '#64748b' }}>Batch ID</strong>
                <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{batchId || 'N/A'}</div>
            </div>
            <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1' }}>
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>Total Quantity</strong>
                <div style={{ fontSize: '1rem', fontWeight: 700 }}>{quantity || 0} UNITS</div>
            </div>
        </div>
      </div>

      {/* Security & Timeline */}
      <div style={{ background: '#f8fafc', padding: '2rem', borderTop: '1px solid #e2e8f0' }}>
         <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.875rem', textTransform: 'uppercase', color: '#475569' }}>Security & Custody</h3>
         
         <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                 <div>
                     <strong style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Cryptographic Seal</strong>
                     <code style={{ fontSize: '0.875rem', color: '#0f172a', background: '#f1f5f9', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                         {seal || 'UNSEALED'}
                     </code>
                 </div>
                 <div>
                     <StatusPill status={verificationStatus || 'pending'} text={verificationStatus === 'verified' ? 'Seal Verified' : 'Pending Verification'} />
                 </div>
             </div>
             
             <div>
                 <strong style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase' }}>Current Custodian</strong>
                 <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#0f6e56' }}>{currentCustodian || 'Awaiting Dispatch'}</div>
             </div>
         </div>

         {/* Timeline */}
         {timeline && timeline.length > 0 && (
             <div>
                 <strong style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '1rem' }}>Custody Timeline</strong>
                 <div style={{ borderLeft: '2px solid #cbd5e1', paddingLeft: '1.5rem', marginLeft: '0.5rem' }}>
                     {timeline.map((event, idx) => (
                         <div key={idx} style={{ position: 'relative', marginBottom: '1.5rem' }}>
                             <div style={{ position: 'absolute', left: '-1.85rem', top: '0.2rem', width: '0.75rem', height: '0.75rem', background: '#3b82f6', borderRadius: '50%', border: '2px solid white' }}></div>
                             <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{event.action}</div>
                             <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{event.actor} &bull; {new Date(event.timestamp).toLocaleString()}</div>
                         </div>
                     ))}
                 </div>
             </div>
         )}
      </div>

    </div>
  );
};

export default WaybillViewer;
