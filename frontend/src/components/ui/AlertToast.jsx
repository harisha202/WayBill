
import React from 'react';
export const AlertToast = ({ message, type = 'info' }) => {
    const bg = type === 'alert' ? '#BA7517' : type === 'error' ? '#dc2626' : '#0F6E56';
    return (
        <div style={{
            position: 'fixed', bottom: '24px', right: '24px',
            background: bg, color: 'var(--text)', padding: '12px 24px',
            borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 9999
        }}>
            {message}
        </div>
    );
};
