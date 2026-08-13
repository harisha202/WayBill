import React, { useState } from 'react';

const ReorderPanel = ({ onReorder }) => {
  const [item, setItem] = useState('');
  const [quantity, setQuantity] = useState('');

  const handleReorder = () => {
    if (onReorder) {
      onReorder({ item, quantity });
      setItem('');
      setQuantity('');
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--surface)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', color: 'var(--text)' }}>
      <h3 style={{ marginTop: 0 }}>Trigger Reorder</h3>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input 
          type="text" 
          placeholder="Item Name" 
          value={item} 
          onChange={(e) => setItem(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', flex: 1 }}
        />
        <input 
          type="number" 
          placeholder="Quantity" 
          value={quantity} 
          onChange={(e) => setQuantity(e.target.value)}
          style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--border)', backgroundColor: 'var(--bg)', color: 'var(--text)', width: '100px' }}
        />
      </div>
      <button 
        onClick={handleReorder}
        style={{ padding: '8px 16px', backgroundColor: '#0056b3', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
      >
        Submit Reorder
      </button>
    </div>
  );
};

export default ReorderPanel;
