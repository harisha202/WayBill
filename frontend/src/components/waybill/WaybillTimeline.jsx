import React from 'react';

const WaybillTimeline = ({ currentState }) => {
  const states = [
    'Created',
    'Sealed',
    'Dispatched',
    'Custody Transfer',
    'Received',
    'Verified'
  ];

  const containerStyle = {
    backgroundColor: 'var(--surface, #ffffff)',
    color: 'var(--text, #333333)',
    border: '1px solid var(--border, #e0e0e0)',
    padding: '1.5rem',
    borderRadius: '8px',
    fontFamily: 'sans-serif'
  };

  const timelineStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    marginTop: '1rem'
  };

  const lineStyle = {
    position: 'absolute',
    top: '15px',
    left: '0',
    right: '0',
    height: '2px',
    backgroundColor: 'var(--border, #e0e0e0)',
    zIndex: 0
  };

  const activeIndex = states.indexOf(currentState);

  return (
    <div style={containerStyle}>
      <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>Tracking Timeline</h3>
      <div style={timelineStyle}>
        <div style={lineStyle}></div>
        {states.map((state, index) => {
          const isActive = index <= activeIndex;
          const isCurrent = index === activeIndex;
          
          return (
            <div key={state} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isActive ? 'var(--primary, #0056b3)' : 'var(--bg, #f5f5f5)',
                border: isActive ? '2px solid var(--primary, #0056b3)' : '2px solid var(--border, #e0e0e0)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                color: isActive ? '#ffffff' : 'var(--text-secondary, #666666)',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                boxShadow: isCurrent ? '0 0 0 4px rgba(0, 86, 179, 0.2)' : 'none'
              }}>
                {isActive ? '✓' : index + 1}
              </div>
              <div style={{ 
                fontSize: '0.75rem', 
                textAlign: 'center',
                color: isActive ? 'var(--text, #333333)' : 'var(--text-secondary, #666666)',
                fontWeight: isCurrent ? 'bold' : 'normal'
              }}>
                {state}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WaybillTimeline;
