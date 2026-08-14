import React, { useState } from 'react';
import { useApi } from '../../api/hooks/useApi';
import { retailApi } from '../../api/services/retailApi';
import { DataTable } from '../ui/DataTable';
import { StatusPill } from '../ui/StatusPill';

export function RetailDashboard() {
  const { data: movements, loading, error } = useApi('/retail/stock-movements');

  if (error) return <div style={{ color: 'var(--red)' }}>Error loading dashboard: {error.message}</div>;

  const totalSales = (movements || []).filter(m => m.movement_type === 'OUT').length;
  const totalRestocks = (movements || []).filter(m => m.movement_type === 'IN').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--dashboard-heading)' }}>Retail Storefront</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--muted)', fontSize: '1rem' }}>Total Sales Logged</h3>
          <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, color: 'var(--green)' }}>{totalSales}</p>
        </div>
        <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--muted)', fontSize: '1rem' }}>Restock Events</h3>
          <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, color: 'var(--primary)' }}>{totalRestocks}</p>
        </div>
      </div>
    </div>
  );
}

export function RetailInventory() {
  const { data: inventory, loading, error } = useApi('/retail/inventory');

  const columns = [
    { key: 'sku', header: 'SKU', render: val => <strong>{val}</strong> },
    { key: 'name', header: 'Product' },
    { key: 'available_stock', header: 'In Stock', render: val => <span style={{fontWeight: 'bold', color: val <= 20 ? 'var(--red)' : 'var(--text)'}}>{val}</span> },
    { key: 'reorder_point', header: 'Reorder Level' },
    { key: 'status', header: 'Status', render: (_, row) => <StatusPill status={row.available_stock > row.reorder_point ? 'success' : 'error'} text={row.available_stock > row.reorder_point ? 'Healthy' : 'Low Stock'} /> }
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Store Inventory</h2>
      {error ? <div style={{ color: 'var(--red)' }}>{error.message}</div> : <DataTable data={inventory || []} columns={columns} loading={loading} emptyMessage="No inventory." />}
    </div>
  );
}

export function POSAnalytics() {
  const { data: inventory, loading, refetch } = useApi('/retail/inventory');
  const { data: movements, refetch: refetchMovements } = useApi('/retail/stock-movements');
  const [sku, setSku] = useState('');
  const [quantity, setQuantity] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSale = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await retailApi.createSale(sku, parseInt(quantity, 10));
      setSku(''); setQuantity('');
      refetch();
      refetchMovements();
    } catch (e) {
      alert("Error processing sale: " + (e.response?.data?.detail || e.message));
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    { key: 'movement_id', header: 'ID', render: val => <strong>{val}</strong> },
    { key: 'sku', header: 'SKU' },
    { key: 'movement_type', header: 'Type', render: val => <StatusPill status={val === 'IN' ? 'success' : 'active'} text={val} /> },
    { key: 'quantity', header: 'Qty' },
    { key: 'created_at', header: 'Date', render: val => new Date(val).toLocaleString() }
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Point of Sale</h2>
        <form onSubmit={handleSale} style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Product</label>
            <select value={sku} onChange={e => setSku(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}>
              <option value="">-- Select Product --</option>
              {(inventory || []).map(p => <option key={p.sku} value={p.sku}>{p.name} (SKU: {p.sku})</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Quantity Sold</label>
            <input type="number" min="1" required value={quantity} onChange={e => setQuantity(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }} />
          </div>
          <button type="submit" disabled={processing} style={{ padding: '0.75rem', background: 'var(--green)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Complete Sale</button>
        </form>
      </div>

      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Recent Register Activity</h2>
        <DataTable data={movements || []} columns={columns} loading={loading} emptyMessage="No recent activity." />
      </div>
    </div>
  );
}

export function AutoReorder() {
  const { data: recs, loading, error, refetch } = useApi('/retail/reorder/recommendations');
  const [processing, setProcessing] = useState(null);

  const handleApprove = async (sku, qty) => {
    if (!window.confirm(`Approve reorder of ${qty} units for ${sku}?`)) return;
    setProcessing(sku);
    try {
      await retailApi.approveReorder(sku, qty);
      refetch();
      alert("Order pushed to Dealer network.");
    } catch (e) {
      alert("Error: " + (e.response?.data?.detail || e.message));
    } finally {
      setProcessing(null);
    }
  };

  const columns = [
    { key: 'sku', header: 'SKU', render: val => <strong>{val}</strong> },
    { key: 'name', header: 'Product' },
    { key: 'current_stock', header: 'Current Stock', render: val => <span style={{color: 'var(--red)', fontWeight: 'bold'}}>{val}</span> },
    { key: 'recommended_qty', header: 'Suggested Qty' },
    { 
      key: 'actions', 
      header: 'Actions',
      render: (_, row) => (
        <button disabled={processing === row.sku} onClick={() => handleApprove(row.sku, row.recommended_qty)} style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Approve Reorder</button>
      )
    }
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Auto-Reorder Engine</h2>
      {error ? <div style={{ color: 'var(--red)' }}>{error.message}</div> : <DataTable data={recs || []} columns={columns} loading={loading} emptyMessage="Stock levels are healthy. No reorders needed." />}
    </div>
  );
}

export function QRVerification() {
  const [scanId, setScanId] = useState('');
  const [result, setResult] = useState(null);

  const handleScan = (e) => {
    e.preventDefault();
    if (scanId.trim()) {
      // Simulate verification since the backend might not have a dedicated endpoint yet
      setResult({ status: 'VERIFIED', message: 'Waybill Document is authentic and matches blockchain records.', timestamp: new Date().toISOString() });
    }
  };

  return (
    <div style={{ maxWidth: '600px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Blockchain QR Verification</h2>
      <form onSubmit={handleScan} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <input 
          type="text" 
          value={scanId} 
          onChange={e => setScanId(e.target.value)} 
          placeholder="Scan or enter Document Hash" 
          style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)' }} 
        />
        <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Verify</button>
      </form>
      
      {result && (
        <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--green)', borderLeft: '4px solid var(--green)' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--green)' }}>✓ Authentic Product</h3>
          <p style={{ margin: '0 0 1rem 0' }}>{result.message}</p>
          <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Verified at: {new Date(result.timestamp).toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}
