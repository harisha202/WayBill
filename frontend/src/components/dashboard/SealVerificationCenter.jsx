import React, { useState } from 'react';

const SealVerificationCenter = () => {
  const [waybillId, setWaybillId] = useState('');
  const [sealHash, setSealHash] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'loading', 'verified', 'tampered', 'error'
  const [verifyResult, setVerifyResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!waybillId.trim() || !sealHash.trim()) return;
    setStatus('loading');
    setVerifyResult(null);
    setErrorMsg('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/waybills/${encodeURIComponent(waybillId.trim())}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ seal_hash: sealHash.trim() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Server error: ${res.status}`);
      }

      const data = await res.json();
      // Backend returns { valid: bool, current_status, custody, batch_id, sku, quantity, reason }
      const result = data.data || data;
      setVerifyResult(result);
      setStatus(result.valid ? 'verified' : 'tampered');
    } catch (err) {
      setErrorMsg(err.message || 'Unknown error');
      setStatus('error');
    }
  };

  const isTampered = status === 'tampered';
  const isVerified = status === 'verified';

  return (
    <div style={{
      background: 'var(--bg)',
      padding: '24px',
      borderRadius: '16px',
      color: 'var(--text)',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '4px' }}>Seal Verification Center</h2>
      <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '0.95rem' }}>
        Enter Waybill ID and Seal Hash to verify cryptographic seal and custody chain.
      </p>

      <div style={{
        background: 'var(--bg)',
        padding: '24px',
        borderRadius: '12px',
        border: '1px solid #1e293b',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px'
      }}>
        <form onSubmit={handleVerify} style={{ display: 'grid', gap: '12px' }}>
          <input
            type="text"
            placeholder="Waybill ID (e.g. WAY-8890ABCD)"
            value={waybillId}
            onChange={(e) => setWaybillId(e.target.value)}
            style={{
              background: 'var(--surface)',
              border: '1px solid #334155',
              padding: '12px 16px',
              borderRadius: '8px',
              color: 'var(--text)',
              fontSize: '1rem',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <input
            type="text"
            placeholder="Seal Hash (SHA-256 hex string)"
            value={sealHash}
            onChange={(e) => setSealHash(e.target.value)}
            style={{
              background: 'var(--surface)',
              border: '1px solid #334155',
              padding: '12px 16px',
              borderRadius: '8px',
              color: 'var(--text)',
              fontSize: '0.9rem',
              fontFamily: 'monospace',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading' || !waybillId.trim() || !sealHash.trim()}
            style={{
              background: status === 'loading' ? 'var(--border)' : '#0F6E56',
              color: 'var(--text)',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: (status === 'loading' || !waybillId.trim() || !sealHash.trim()) ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              width: '100%',
            }}
          >
            {status === 'loading' ? 'Verifying...' : 'Verify Seal'}
          </button>
        </form>
      </div>

      {status === 'error' && (
        <div style={{
          background: 'rgba(220, 38, 38, 0.1)',
          border: '1px solid #dc2626',
          padding: '16px 24px',
          borderRadius: '12px',
          color: '#f87171',
          marginBottom: '24px'
        }}>
          ⚠️ Verification failed: {errorMsg}
        </div>
      )}

      {(isVerified || isTampered) && verifyResult && (
        <div style={{ display: 'grid', gap: '24px' }}>
          <div style={{
            background: isTampered ? 'rgba(220, 38, 38, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: `1px solid ${isTampered ? '#dc2626' : '#10b981'}`,
            padding: '32px',
            borderRadius: '12px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              fontSize: '4rem',
              lineHeight: '1',
              filter: `drop-shadow(0 0 16px ${isTampered ? 'rgba(220,38,38,0.4)' : 'rgba(16,185,129,0.4)'})`
            }}>
              {isTampered ? '❌' : '✅'}
            </div>
            <h1 style={{
              fontSize: '2.5rem',
              fontWeight: '800',
              margin: '0',
              color: isTampered ? '#f87171' : '#34d399',
              letterSpacing: '0.05em'
            }}>
              {isTampered ? 'TAMPER DETECTED' : 'VERIFIED'}
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: '1.1rem', margin: '0' }}>
              {isTampered
                ? (verifyResult.reason || 'Security breach identified. Quarantine shipment immediately.')
                : 'All cryptographic checks passed. Shipment integrity confirmed.'}
            </p>
          </div>

          {/* Details panel */}
          <div style={{
            background: 'var(--bg)',
            borderRadius: '12px',
            border: '1px solid #1e293b',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #1e293b', background: 'var(--surface)' }}>
              <h3 style={{ margin: '0', fontSize: '1.1rem', fontWeight: '600' }}>Verification Details</h3>
            </div>
            <div style={{ padding: '0' }}>
              {[
                {
                  label: 'Cryptographic Seal',
                  desc: 'SHA-256 hash match against database record.',
                  pass: isVerified
                },
                {
                  label: 'Chain of Custody',
                  desc: `Current custodian: ${verifyResult.custody || 'Unknown'}`,
                  pass: isVerified
                },
                {
                  label: 'Waybill Status',
                  desc: `Status: ${verifyResult.current_status || 'Unknown'}`,
                  pass: isVerified
                },
                {
                  label: 'Product Info',
                  desc: verifyResult.sku
                    ? `SKU: ${verifyResult.sku} | Qty: ${verifyResult.quantity}`
                    : 'Not available',
                  pass: Boolean(verifyResult.sku)
                }
              ].map((check, idx) => (
                <div key={idx} style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '16px',
                  alignItems: 'center',
                  padding: '16px 24px',
                  borderBottom: idx === 3 ? 'none' : '1px solid #1e293b',
                  background: idx % 2 === 0 ? 'transparent' : 'var(--surface-2)'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: check.pass ? 'rgba(16, 185, 129, 0.2)' : 'rgba(220, 38, 38, 0.2)',
                    color: check.pass ? '#34d399' : '#f87171',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem'
                  }}>
                    {check.pass ? '✓' : '✗'}
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '600', color: 'var(--dashboard-heading)' }}>{check.label}</h4>
                    <p style={{ margin: '0', fontSize: '0.85rem', color: 'var(--muted)' }}>{check.desc}</p>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    background: check.pass ? '#064e3b' : '#7f1d1d',
                    color: check.pass ? '#a7f3d0' : '#fecaca',
                    border: `1px solid ${check.pass ? '#059669' : '#dc2626'}`
                  }}>
                    {check.pass ? 'VALID' : 'FAILED'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SealVerificationCenter;
