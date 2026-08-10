import React from 'react';

const GaugeChart = ({ 
  value = 65, 
  min = 0, 
  max = 100, 
  label = 'Performance',
  color = '#10b981',
  size = 240 
}) => {
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  
  const thickness = size * 0.12;
  const radius = size / 2;
  const innerRadius = radius - thickness / 2;
  const circumference = Math.PI * innerRadius;
  const dashoffset = circumference * (1 - percentage / 100);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      padding: '24px 0'
    }}>
      <div style={{ position: 'relative', width: size, height: size / 2 }}>
        <svg width={size} height={size / 2} viewBox={`0 0 ${size} ${size / 2}`}>
          {/* Background track */}
          <path 
            d={`M ${thickness / 2} ${size / 2} A ${innerRadius} ${innerRadius} 0 0 1 ${size - thickness / 2} ${size / 2}`}
            fill="none"
            stroke="#1e293b"
            strokeWidth={thickness}
            strokeLinecap="round"
          />
          {/* Value track */}
          <path 
            d={`M ${thickness / 2} ${size / 2} A ${innerRadius} ${innerRadius} 0 0 1 ${size - thickness / 2} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={thickness}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>
        
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: 'translateY(20%)'
        }}>
          <div style={{
            fontSize: '32px',
            fontWeight: '700',
            color: '#f8fafc',
            lineHeight: '1',
            textShadow: `0 0 12px ${color}40`
          }}>
            {value}
          </div>
          <div style={{
            fontSize: '13px',
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginTop: '4px',
            fontWeight: '600'
          }}>
            {label}
          </div>
        </div>
      </div>
      
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        width: `${size * 0.85}px`,
        marginTop: '32px',
        color: '#64748b',
        fontSize: '12px',
        fontWeight: '600'
      }}>
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default GaugeChart;
