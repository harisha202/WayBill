import React, { useState } from 'react';

const DisputeCenter = () => {
  const [disputeType, setDisputeType] = useState('quantity'); // quantity, quality, price
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState([]);

  const handleFileUpload = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setEvidence([...evidence, e.target.files[0].name]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Dispute Filed:\nType: ${disputeType}\nEvidence: ${evidence.length} files`);
    setDescription('');
    setEvidence([]);
  };

  return (
    <div style={{
      background: 'var(--bg)',
      padding: '24px',
      borderRadius: '16px',
      color: 'var(--text)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 4px 0' }}>Dispute Resolution Center</h2>
        <p style={{ color: 'var(--muted)', margin: '0', fontSize: '0.95rem' }}>Log Quantity, Quality, or Price discrepancies and upload cryptographic evidence.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 350px',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Main Form */}
        <div style={{
          background: 'var(--bg)',
          borderRadius: '12px',
          border: '1px solid #1e293b',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--muted)' }}>Dispute Category</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                {['quantity', 'quality', 'price'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setDisputeType(type)}
                    style={{
                      background: disputeType === type ? '#1e40af' : 'var(--surface)',
                      color: disputeType === type ? '#fff' : 'var(--muted)',
                      border: `1px solid ${disputeType === type ? '#3b82f6' : 'var(--border)'}`,
                      padding: '12px',
                      borderRadius: '8px',
                      textTransform: 'capitalize',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--muted)' }}>Discrepancy Details</label>
              <textarea 
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the discrepancy..."
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid #334155',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  color: 'var(--text)',
                  fontSize: '0.95rem',
                  outline: 'none',
                  resize: 'vertical'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--muted)' }}>Upload Evidence (Photos, Sensor Logs)</label>
              <div style={{
                border: '2px dashed #334155',
                borderRadius: '8px',
                padding: '32px',
                textAlign: 'center',
                background: 'var(--surface-2)',
                cursor: 'pointer'
              }}
              onClick={() => document.getElementById('evidence-upload').click()}
              >
                <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📁</div>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Click to upload or drag and drop</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '4px' }}>PNG, JPG, PDF up to 10MB</div>
                <input 
                  type="file" 
                  id="evidence-upload" 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload}
                />
              </div>
              
              {evidence.length > 0 && (
                <div style={{ marginTop: '16px', display: 'grid', gap: '8px' }}>
                  {evidence.map((file, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'var(--surface)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid #334155'
                    }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--dashboard-heading)' }}>{file}</span>
                      <button type="button" onClick={() => setEvidence(evidence.filter((_, i) => i !== idx))} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              type="submit"
              disabled={!description.trim()}
              style={{
                background: description.trim() ? '#dc2626' : 'var(--border)',
                color: 'var(--text)',
                border: 'none',
                padding: '14px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: description.trim() ? 'pointer' : 'not-allowed',
                marginTop: '8px'
              }}
            >
              Lodge Formal Dispute
            </button>
          </form>
        </div>

        {/* Active Disputes Sidebar */}
        <div style={{ display: 'grid', gap: '16px' }}>
          <h3 style={{ fontSize: '1.1rem', margin: '0', color: 'var(--dashboard-heading)' }}>Active Trackers</h3>
          
          {[
            { id: 'DSP-8821', type: 'Quantity', status: 'Under Review', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
            { id: 'DSP-8804', type: 'Quality', status: 'Resolved', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' }
          ].map(d => (
            <div key={d.id} style={{
              background: 'var(--bg)',
              border: '1px solid #1e293b',
              borderRadius: '12px',
              padding: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>{d.id}</span>
                <span style={{ 
                  fontSize: '0.75rem', 
                  padding: '4px 8px', 
                  borderRadius: '999px',
                  background: d.bg,
                  color: d.color,
                  border: `1px solid ${d.color}`
                }}>
                  {d.status}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Type: <span style={{ color: 'var(--dashboard-heading)', textTransform: 'capitalize' }}>{d.type}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DisputeCenter;
