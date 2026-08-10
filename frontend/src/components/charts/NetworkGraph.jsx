import React from 'react';

const NetworkGraph = ({ nodes = [] }) => {
  const defaultNodes = [
    { id: '1', label: 'Supplier', role: 'source', metric: '100%', color: '#10b981' },
    { id: '2', label: 'Manufacturer', role: 'hub', metric: '94%', color: '#3b82f6' },
    { id: '3', label: 'Transporter', role: 'transit', metric: '91%', color: '#f59e0b' },
    { id: '4', label: 'Retailer', role: 'dest', metric: '88%', color: '#8b5cf6' }
  ];

  const graphNodes = nodes.length ? nodes : defaultNodes;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0',
      padding: '24px 16px',
      width: '100%'
    }}>
      {graphNodes.map((node, i) => {
        const isLast = i === graphNodes.length - 1;
        const color = node.color || '#3b82f6';
        
        return (
          <div key={node.id} style={{ display: 'flex', alignItems: 'stretch' }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginRight: '20px',
              minWidth: '24px'
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#0f172a',
                border: `3px solid ${color}`,
                boxShadow: `0 0 12px ${color}60`,
                zIndex: 2,
                marginTop: '16px'
              }} />
              {!isLast && (
                <div style={{
                  width: '2px',
                  flex: 1,
                  backgroundColor: '#334155',
                  margin: '4px 0 -16px 0',
                  zIndex: 1
                }} />
              )}
            </div>
            
            <div style={{
              flex: 1,
              backgroundColor: '#1e293b',
              padding: '16px 20px',
              borderRadius: '12px',
              border: '1px solid #334155',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: isLast ? '0' : '16px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'default'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ color: '#f8fafc', fontWeight: '600', fontSize: '15px' }}>
                  {node.label}
                </div>
                {node.role && (
                  <div style={{ 
                    color: color, 
                    fontSize: '12px', 
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontWeight: '700',
                    opacity: 0.9
                  }}>
                    {node.role}
                  </div>
                )}
              </div>
              
              {node.metric && (
                <div style={{ 
                  backgroundColor: '#0f172a',
                  color: '#e2e8f0', 
                  fontSize: '14px', 
                  fontWeight: '600',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: '1px solid #334155'
                }}>
                  {node.metric}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default NetworkGraph;
