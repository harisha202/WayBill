import React from 'react';

export const Logo = ({ style, className = '' }) => (
    <svg className={`waybill-logo ${className}`} style={style} width="100%" height="100%" viewBox="190 40 300 300" role="img">
        <title>Waybill final logo mark</title>
        <desc>A circular tracking seal with a slowly rotating dashed ring carrying three pulsing amber checkpoint nodes.</desc>

        <style>
          {`
            @keyframes floatMark { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
            @keyframes spinRing { to { transform: rotate(360deg); } }
            @keyframes nodePulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
            @keyframes coreGlow { 0%,100%{opacity:0.35;transform:scale(1)} 50%{opacity:0.15;transform:scale(1.18)} }
            @media (prefers-reduced-motion: no-preference) {
              .mark { animation: floatMark 3.4s ease-in-out infinite; }
              .ring { animation: spinRing 14s linear infinite; transform-origin: 340px 190px; }
              .node1 { animation: nodePulse 2.4s ease-in-out infinite; }
              .node2 { animation: nodePulse 2.4s ease-in-out infinite .5s; }
              .node3 { animation: nodePulse 2.4s ease-in-out infinite 1s; }
              .glow { animation: coreGlow 2.6s ease-in-out infinite; }
            }
          `}
        </style>
        <g className="mark">
            <circle cx="340" cy="190" r="130" fill="none" stroke="#0F6E56" strokeWidth="2"/>
            <g className="ring">
                <circle cx="340" cy="190" r="100" fill="none" stroke="#5DCAA5" strokeWidth="1.5" strokeDasharray="4 9"/>
                <circle className="node1" cx="340" cy="90" r="9" fill="#BA7517"/>
                <circle className="node2" cx="426.6" cy="240" r="9" fill="#BA7517"/>
                <circle className="node3" cx="253.4" cy="240" r="9" fill="#BA7517"/>
            </g>
            <circle className="glow" cx="340" cy="190" r="52" fill="#EF9F27"/>
            <path d="M310 148 H358 L376 166 V236 H310 Z" fill="#FAEEDA" stroke="#0F6E56" strokeWidth="1.5"/>
            <path d="M358 148 V166 H376 Z" fill="#9FE1CB" stroke="#0F6E56" strokeWidth="1.5"/>
            <line x1="320" y1="182" x2="366" y2="182" stroke="#B4B2A9" strokeWidth="2"/>
            <line x1="320" y1="194" x2="366" y2="194" stroke="#B4B2A9" strokeWidth="2"/>
            <path d="M320 210 L332 222 L358 198" fill="none" stroke="#0F6E56" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
    </svg>
);
