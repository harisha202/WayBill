import React from 'react';

export const Logo = ({ style }) => (
    <svg width="40" height="25" viewBox="0 0 680 430" role="img" style={style}>
        <title>Waybill final logo mark</title>
        <desc>A circular tracking seal with a slowly rotating dashed ring carrying three pulsing amber checkpoint nodes.</desc>

        <g className="waybill-mark">
            <circle cx="340" cy="190" r="130" fill="none" stroke="#0F6E56" strokeWidth="2"/>
            <g className="waybill-ring">
                <circle cx="340" cy="190" r="100" fill="none" stroke="#5DCAA5" strokeWidth="1.5" strokeDasharray="4 9"/>
                <circle className="waybill-node1" cx="340" cy="90" r="9" fill="#BA7517"/>
                <circle className="waybill-node2" cx="426.6" cy="240" r="9" fill="#BA7517"/>
                <circle className="waybill-node3" cx="253.4" cy="240" r="9" fill="#BA7517"/>
            </g>
            <circle className="waybill-glow" cx="340" cy="190" r="52" fill="#EF9F27"/>
            <path d="M310 148 H358 L376 166 V236 H310 Z" fill="#FAEEDA" stroke="#0F6E56" strokeWidth="1.5"/>
            <path d="M358 148 V166 H376 Z" fill="#9FE1CB" stroke="#0F6E56" strokeWidth="1.5"/>
            <line x1="320" y1="182" x2="366" y2="182" stroke="#B4B2A9" strokeWidth="2"/>
            <line x1="320" y1="194" x2="366" y2="194" stroke="#B4B2A9" strokeWidth="2"/>
            <path d="M320 210 L332 222 L358 198" fill="none" stroke="#0F6E56" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
    </svg>
);
