
import React from 'react';
export const RiskBadge = ({ score }) => {
    let color = score > 75 ? '#dc2626' : score > 40 ? '#BA7517' : '#059669';
    let label = score > 75 ? 'High Risk' : score > 40 ? 'Medium Risk' : 'Low Risk';
    return (
        <span style={{ 
            padding: '4px 8px', 
            borderRadius: '12px', 
            background: color + '20', 
            color: color,
            fontWeight: 'bold',
            fontSize: '12px' 
        }}>
            {label} ({score})
        </span>
    );
};
