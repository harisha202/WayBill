import React from 'react';
import { StatusPill } from '../ui/StatusPill';

const QRVerificationStatus = ({ verification, scanResult, onReset }) => {
    return (
        <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                {verification.is_valid ? (
                    <div style={{ color: 'var(--green)' }}>
                        <div style={{ fontSize: '4rem' }}>✅</div>
                        <h2 style={{ margin: '0.5rem 0' }}>Waybill Verified</h2>
                        <p style={{ margin: 0 }}>The cryptographic seal matches the blockchain ledger.</p>
                    </div>
                ) : (
                    <div style={{ color: 'var(--red)' }}>
                        <div style={{ fontSize: '4rem' }}>⚠️</div>
                        <h2 style={{ margin: '0.5rem 0' }}>Seal Verification Failed</h2>
                        <p style={{ margin: 0 }}>This waybill has been tampered with or is invalid.</p>
                        {verification.reason && <p style={{ fontSize: 'var(--text-meta)' }}>Reason: {verification.reason}</p>}
                    </div>
                )}
            </div>
            
            <div style={{ background: 'var(--bg-dark)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>Waybill ID:</strong> {scanResult?.split('|')[0]}</p>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>Current Custody:</strong> {verification.custody}</p>
                <p style={{ margin: '0 0 0.5rem 0' }}><strong>Status:</strong> <StatusPill status={verification.current_status || 'UNKNOWN'} text={verification.current_status || 'UNKNOWN'} /></p>
            </div>
            
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button onClick={onReset} style={{ padding: '0.75rem 2rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Scan Another
                </button>
            </div>
        </div>
    );
};

export default QRVerificationStatus;
