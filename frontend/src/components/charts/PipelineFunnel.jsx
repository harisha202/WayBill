import React from 'react';

const PipelineFunnel = ({ steps = [], activeStep = 1 }) => {
  const defaultSteps = [
    { label: 'Lead', value: '1,204' },
    { label: 'Contact', value: '843' },
    { label: 'Meeting', value: '312' },
    { label: 'Proposal', value: '145' },
    { label: 'Closed', value: '68' }
  ];

  const funnelSteps = steps.length ? steps : defaultSteps;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      padding: '32px 16px',
      overflowX: 'auto'
    }}>
      {funnelSteps.map((step, index) => {
        const isActive = index === activeStep;
        const isPast = index < activeStep;
        const color = isActive ? '#0ea5e9' : (isPast ? '#0284c7' : '#334155');
        const textColor = isActive || isPast ? '#f8fafc' : '#94a3b8';
        const isLast = index === funnelSteps.length - 1;
        
        return (
          <React.Fragment key={index}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative',
              flex: 1,
              zIndex: 1,
              minWidth: '80px'
            }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: isActive || isPast ? '#0f172a' : '#1e293b',
                border: `2px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: textColor,
                fontWeight: '700',
                fontSize: '14px',
                marginBottom: '12px',
                boxShadow: isActive ? '0 0 16px rgba(14, 165, 233, 0.4)' : 'none',
                transition: 'all 0.3s ease'
              }}>
                {index + 1}
              </div>
              <div style={{
                color: textColor,
                fontSize: '13px',
                fontWeight: isActive ? '600' : '500',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}>
                {step.label || step}
              </div>
              {step.value && (
                <div style={{
                  color: '#94a3b8',
                  fontSize: '12px',
                  marginTop: '4px',
                  opacity: isActive || isPast ? 1 : 0.6,
                  fontWeight: '600',
                  backgroundColor: '#1e293b',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #334155'
                }}>
                  {step.value}
                </div>
              )}
            </div>
            
            {!isLast && (
              <div style={{
                flex: '1 1 auto',
                height: '3px',
                backgroundColor: isPast ? '#0ea5e9' : '#334155',
                marginTop: '-44px',
                minWidth: '32px',
                borderRadius: '2px',
                opacity: 0.7,
                transition: 'background-color 0.3s ease'
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default PipelineFunnel;
