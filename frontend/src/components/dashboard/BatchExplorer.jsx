import React, { useState } from 'react';

const BatchExplorer = () => {
  const [batchId, setBatchId] = useState('LOT-992-ALPHA');
  
  const nodes = [
    {
      stage: 'Raw Material',
      entity: 'AgroCorp Supplies',
      location: 'Mombasa, Kenya',
      date: '2026-08-01 08:00',
      status: 'Verified',
      hash: '0x8f...3a1c',
      details: ['Quality Assayed: Grade A', 'Quantity: 5000 kg']
    },
    {
      stage: 'Manufacturing',
      entity: 'Global Processing Inc.',
      location: 'Nairobi, Kenya',
      date: '2026-08-03 14:30',
      status: 'Verified',
      hash: '0x2b...99df',
      details: ['Processing Yield: 94%', 'QC Check: Passed']
    },
    {
      stage: 'Logistics / Transit',
      entity: 'Swift Logistics',
      location: 'Nairobi to Kampala',
      date: '2026-08-05 09:15',
      status: 'In Transit',
      hash: '0x5c...e421',
      details: ['Temperature Maintained: 4°C', 'GPS Handshake Verified']
    },
    {
      stage: 'Retail Hub',
      entity: 'Kampala Central Markets',
      location: 'Kampala, Uganda',
      date: 'Pending',
      status: 'Awaiting',
      hash: '---',
      details: ['Expected Arrival: 2026-08-08']
    }
  ];

  return (
    <div style={{
      background: '#0b1121',
      padding: '24px',
      borderRadius: '16px',
      color: '#f8fafc',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 4px 0' }}>Batch Explorer</h2>
          <p style={{ color: '#94a3b8', margin: '0', fontSize: '0.95rem' }}>Immutable traceability from origin to destination.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input 
            type="text" 
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              padding: '8px 16px',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '0.9rem',
              outline: 'none',
              width: '200px'
            }}
          />
          <button style={{
            background: '#0F6E56',
            color: '#fff',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}>Trace</button>
        </div>
      </div>

      <div style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '12px',
        padding: '32px',
        position: 'relative'
      }}>
        {/* Vertical Line */}
        <div style={{
          position: 'absolute',
          left: '47px',
          top: '40px',
          bottom: '40px',
          width: '2px',
          background: '#334155',
          zIndex: 0
        }} />

        <div style={{ display: 'grid', gap: '32px', position: 'relative', zIndex: 1 }}>
          {nodes.map((node, idx) => (
            <div key={idx} style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr',
              gap: '24px',
              alignItems: 'start'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: node.status === 'Verified' ? '#0F6E56' : node.status === 'In Transit' ? '#3b82f6' : '#1e293b',
                border: `4px solid #0f172a`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: '0.8rem',
                boxShadow: '0 0 0 1px #334155'
              }}>
                {node.status === 'Verified' ? '✓' : idx + 1}
              </div>

              <div style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: '1fr 200px',
                gap: '24px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h3 style={{ margin: '0', fontSize: '1.1rem', color: '#e2e8f0' }}>{node.stage}</h3>
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: node.status === 'Verified' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(148, 163, 184, 0.1)',
                      color: node.status === 'Verified' ? '#34d399' : '#94a3b8',
                      border: `1px solid ${node.status === 'Verified' ? '#10b981' : '#475569'}`
                    }}>{node.status}</span>
                  </div>
                  
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '12px' }}>
                    <strong style={{ color: '#cbd5e1' }}>{node.entity}</strong> • {node.location}
                  </div>

                  <div style={{ display: 'grid', gap: '4px' }}>
                    {node.details.map((detail, dIdx) => (
                      <div key={dIdx} style={{ fontSize: '0.85rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#0F6E56' }}>▪</span> {detail}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '2px' }}>Timestamp</div>
                    <div style={{ fontSize: '0.9rem', color: '#e2e8f0', fontWeight: '500' }}>{node.date}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '2px' }}>TxHash</div>
                    <div style={{ 
                      fontSize: '0.85rem', 
                      color: '#3b82f6', 
                      fontFamily: 'monospace',
                      background: 'rgba(59, 130, 246, 0.1)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      display: 'inline-block'
                    }}>{node.hash}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BatchExplorer;
