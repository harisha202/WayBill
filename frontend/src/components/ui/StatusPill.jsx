
import React from 'react';
export const StatusPill = ({ status }) => {
    let color = status.toLowerCase().includes('delay') ? '#dc2626' : '#0F6E56';
    return (
        <span style={{ 
            padding: '4px 10px', 
            borderRadius: '999px', 
            background: color, 
            color: 'white',
            fontWeight: '600',
            fontSize: '11px',
            textTransform: 'uppercase'
        }}>
            {status.replace('_', ' ')}
        </span>
    );
};
