import React from 'react';

export const StatusPill = ({ status, text }) => {
    let bg = 'var(--gray)';
    let color = 'white';

    const normalizedStatus = String(status).toLowerCase();

    if (['active', 'delivered', 'passed', 'completed', 'success', 'verified'].includes(normalizedStatus)) {
        bg = 'var(--green)';
    } else if (['pending', 'in_transit', 'delayed', 'warning'].includes(normalizedStatus)) {
        bg = 'var(--yellow)';
    } else if (['critical', 'failed', 'blocked', 'tampered', 'error'].includes(normalizedStatus)) {
        bg = 'var(--red)';
    } else if (['in_production', 'info', 'processing'].includes(normalizedStatus)) {
        bg = 'var(--blue)';
    }

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 10px',
            borderRadius: '999px',
            backgroundColor: bg,
            color: color,
            fontSize: 'var(--text-meta)',
            fontWeight: '700',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
        }}>
            {text || status}
        </span>
    );
};
