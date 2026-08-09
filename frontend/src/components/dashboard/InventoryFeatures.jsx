import React, { useState } from 'react';
import { DataTable } from '../ui/DataTable';

export function InventoryManagement() {
  const [inventory, setInventory] = useState([
    { sku: 'WB-001', name: 'Premium Widget', stock: 450, reorderPoint: 500, status: 'Low Stock' },
    { sku: 'WB-002', name: 'Standard Widget', stock: 1200, reorderPoint: 400, status: 'Healthy' },
    { sku: 'WB-003', name: 'Basic Component', stock: 50, reorderPoint: 200, status: 'Critical' },
  ]);

  const handleExport = () => {
    // Generate simple CSV
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
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="card-title" style={{ margin: 0 }}>Inventory & Reorder Levels</h2>
        <button className="primary-btn" onClick={handleExport}>Export to CSV</button>
      </div>
      <DataTable data={inventory} columns={columns} />
    </div>
  );
}
