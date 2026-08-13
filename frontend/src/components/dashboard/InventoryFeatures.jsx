import React, { useState, useEffect } from 'react';
import { inventoryApi, aiApi } from '../../api/axiosInstance';
import { DataTable } from '../ui/DataTable';

export function InventoryManagement() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jitMode, setJitMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const invRes = await inventoryApi.getInventory(0, 100);
        const items = invRes?.items || [];
        
        // Pass to AI for dynamic alerts
        let aiResult = {};
        try {
          aiResult = await aiApi.inventoryAlerts({ inventory_items: items });
        } catch (e) {
          console.error("AI alerts failed, using simple logic", e);
        }

        const enriched = items.map(item => {
          let status = 'Healthy';
          const skuAlerts = aiResult.alerts || [];
          const matchedAlert = skuAlerts.find(a => a.sku === item.sku);
          
          let currentReorderPoint = item.reorder_point || 0;
          if (jitMode) {
            // JIT Mode: run lean (lower reorder points)
            currentReorderPoint = Math.floor(currentReorderPoint * 0.5);
          } else {
            // Safety Stock Mode: standard buffer
            currentReorderPoint = Math.floor(currentReorderPoint * 1.2);
          }
          
          if (matchedAlert) {
            status = matchedAlert.severity === 'critical' ? 'Critical' : 'Low Stock';
          } else if (item.quantity <= currentReorderPoint) {
            status = 'Critical';
          }
          return {
            sku: item.sku,
            name: item.name,
            stock: item.quantity,
            reorderPoint: currentReorderPoint || 'N/A',
            status: status
          };
        });
        
        setInventory(enriched);
      } catch (err) {
        console.error("Failed to load inventory", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [jitMode]);

  const handleExport = () => {
    const headers = ['SKU,Name,Stock,Reorder Point,Status'];
    const rows = inventory.map(i => `${i.sku},${i.name},${i.stock},${i.reorderPoint},${i.status}`);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'Product Name' },
    { key: 'stock', header: 'Current Stock' },
    { key: 'reorderPoint', header: 'Reorder Point' },
    { key: 'status', header: 'Status', render: (val) => {
      let color = '#059669'; // Healthy
      if (val === 'Low Stock') color = '#BA7517';
      if (val === 'Critical') color = '#dc2626';
      return <span style={{ color, fontWeight: 'bold' }}>{val}</span>;
    }}
  ];

  return (
    <div className="card" style={{ borderTop: '4px solid #10b981' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="card-title" style={{ margin: 0 }}>
          <span className="kpi-icon" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--surface)", width: "28px", height: "28px", borderRadius: "6px", marginRight: "12px", fontSize: "14px", border: "1px solid #334155" }}>📦</span>
          Real-Time Master Inventory
        </h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'var(--text)', padding: '6px 12px', borderRadius: '20px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: !jitMode ? 'bold' : 'normal', color: !jitMode ? 'var(--bg)' : '#64748b' }}>Safety Stock</span>
            <div style={{ 
              position: 'relative', width: '40px', height: '20px', background: jitMode ? '#7c3aed' : 'var(--muted)', 
              borderRadius: '10px', transition: '0.3s' 
            }}>
              <div style={{ 
                position: 'absolute', top: '2px', left: jitMode ? '22px' : '2px', width: '16px', height: '16px', 
                background: 'white', borderRadius: '50%', transition: '0.3s' 
              }}></div>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: jitMode ? 'bold' : 'normal', color: jitMode ? '#7c3aed' : '#64748b' }}>JIT Mode</span>
            <input type="checkbox" style={{ display: 'none' }} checked={jitMode} onChange={(e) => setJitMode(e.target.checked)} />
          </label>
          <button className="primary-btn" onClick={handleExport}>Export to CSV</button>
        </div>
      </div>
      <p className="muted" style={{ marginBottom: '16px' }}>Real-time inventory levels integrated with AI to predict stockouts and recommend dynamic reorder points. Toggle JIT to run a leaner supply chain.</p>
      
      {loading ? (
        <p className="muted">Loading inventory and AI alerts...</p>
      ) : (
        <DataTable data={inventory} columns={columns} />
      )}
    </div>
  );
}
