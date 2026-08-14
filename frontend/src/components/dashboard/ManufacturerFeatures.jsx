import React, { useState } from 'react';
import { useApi } from '../../api/hooks/useApi';
import { manufacturerApi } from '../../api/services/manufacturerApi';
import { DataTable } from '../ui/DataTable';
import { StatusPill } from '../ui/StatusPill';

export function ManufacturerDashboard() {
  const { data: overview, loading, error, refetch } = useApi('/manufacturer/overview');
  
  if (error) return <div style={{ color: 'var(--red)' }}>Error loading overview: {error.message}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--dashboard-heading)' }}>Control Tower</h1>
        <button onClick={refetch} style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '6px', background: 'var(--surface)', cursor: 'pointer' }}>Refresh Data</button>
      </div>

      {loading ? <div>Loading...</div> : overview && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--muted)', fontSize: '1rem' }}>Total Orders</h3>
            <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, color: 'var(--text)' }}>{overview.total_orders}</p>
          </div>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--muted)', fontSize: '1rem' }}>Active Production</h3>
            <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, color: 'var(--primary)' }}>{overview.active_orders}</p>
          </div>
          <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--muted)', fontSize: '1rem' }}>Completed</h3>
            <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, color: 'var(--green)' }}>{overview.completed_orders}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function Production() {
  const { data: orders, loading, error, refetch } = useApi('/manufacturer/orders');
  const [processing, setProcessing] = useState(null);

  const handleStart = async (orderId) => {
    if (!window.confirm("Commence production sequence?")) return;
    setProcessing(orderId);
    try {
      await manufacturerApi.startProduction(orderId);
      refetch();
    } catch (e) {
      alert("Error starting: " + (e.response?.data?.detail || e.message));
    } finally {
      setProcessing(null);
    }
  };

  const handleComplete = async (orderId) => {
    if (!window.confirm("Mark production as completed? This will increase finished goods inventory.")) return;
    setProcessing(orderId);
    try {
      await manufacturerApi.completeProduction(orderId);
      refetch();
    } catch (e) {
      alert("Error completing: " + (e.response?.data?.detail || e.message));
    } finally {
      setProcessing(null);
    }
  };

  const columns = [
    { key: 'order_id', header: 'Order ID', render: val => <strong>{val}</strong> },
    { key: 'sku', header: 'SKU' },
    { key: 'quantity', header: 'Qty' },
    { key: 'status', header: 'Production', render: val => <StatusPill status={val === 'STARTED' ? 'active' : val === 'COMPLETED' ? 'success' : 'pending'} text={val} /> },
    { key: 'qa_status', header: 'QA', render: val => <StatusPill status={val === 'PASSED' ? 'success' : val === 'FAILED' ? 'warning' : 'pending'} text={val} /> },
    { 
      key: 'actions', 
      header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {row.status === 'CREATED' && (
            <button disabled={processing === row.order_id} onClick={() => handleStart(row.order_id)} style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Start</button>
          )}
          {row.status === 'STARTED' && row.qa_status === 'PASSED' && (
            <button disabled={processing === row.order_id} onClick={() => handleComplete(row.order_id)} style={{ padding: '6px 12px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Complete</button>
          )}
        </div>
      )
    }
  ];

  if (error) return <div style={{ color: 'var(--red)' }}>Error: {error.message}</div>;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Production Floor</h2>
      <DataTable data={(orders || []).filter(o => o.status !== 'COMPLETED')} columns={columns} loading={loading} emptyMessage="No active production lines." />
    </div>
  );
}

export function AIForecast() {
  const { data: demand, loading, error } = useApi('/manufacturer/demand');
  
  const columns = [
    { key: 'order_code', header: 'External Order', render: val => <strong>{val}</strong> },
    { key: 'product_sku', header: 'SKU' },
    { key: 'quantity', header: 'Ordered Qty' },
    { key: 'retailer_name', header: 'Retailer' },
    { key: 'status', header: 'Status', render: val => <StatusPill status={val === 'DELIVERED' ? 'success' : 'pending'} text={val} /> }
  ];

  if (error) return <div style={{ color: 'var(--red)' }}>Error: {error.message}</div>;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Market Demand & Forecast</h2>
      <DataTable data={demand || []} columns={columns} loading={loading} emptyMessage="No demand records found." />
    </div>
  );
}

export function RawMaterialSourcing() {
  const { data: inventory, loading, error } = useApi('/manufacturer/inventory');

  const columns = [
    { key: 'sku', header: 'SKU', render: val => <strong>{val}</strong> },
    { key: 'name', header: 'Material / Product' },
    { key: 'available_stock', header: 'Available' },
    { key: 'reserved_stock', header: 'Reserved' },
    { key: 'in_transit', header: 'In Transit' },
    { key: 'reorder_point', header: 'Reorder Point' }
  ];

  if (error) return <div style={{ color: 'var(--red)' }}>Error: {error.message}</div>;

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Raw Material Inventory</h2>
      <DataTable data={inventory || []} columns={columns} loading={loading} emptyMessage="No inventory records found." />
    </div>
  );
}

export function QualityAssurance() {
  const { data: qas, loading, error, refetch } = useApi('/manufacturer/quality');
  const { data: orders } = useApi('/manufacturer/orders');
  
  const [orderId, setOrderId] = useState('');
  const [passed, setPassed] = useState('');
  const [failed, setFailed] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await manufacturerApi.createQualityInspection(orderId, Number(passed), Number(failed), "Standard", "Visual Check");
      setOrderId(''); setPassed(''); setFailed('');
      refetch();
    } catch (e) {
      alert("QA Error: " + (e.response?.data?.detail || e.message));
    }
  };

  const columns = [
    { key: 'inspection_id', header: 'ID', render: val => <strong>{val}</strong> },
    { key: 'production_order_id', header: 'Order' },
    { key: 'quantity_passed', header: 'Passed', render: val => <span style={{color: 'var(--green)', fontWeight: 'bold'}}>{val}</span> },
    { key: 'quantity_failed', header: 'Failed', render: val => <span style={{color: val > 0 ? 'var(--red)' : 'var(--text)', fontWeight: 'bold'}}>{val}</span> },
    { key: 'status', header: 'Result', render: val => <StatusPill status={val === 'PASSED' ? 'success' : val === 'FAILED' ? 'error' : 'warning'} text={val} /> },
  ];

  const activeOrders = (orders || []).filter(o => o.status === 'STARTED');

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Log QA Result</h2>
        <form onSubmit={handleSubmit} style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'grid', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Production Batch</label>
            <select value={orderId} onChange={e => setOrderId(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }}>
              <option value="">-- Select Active Batch --</option>
              {activeOrders.map(o => <option key={o.order_id} value={o.order_id}>{o.order_id} (SKU: {o.sku})</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Units Passed</label>
            <input type="number" min="0" required value={passed} onChange={e => setPassed(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Units Failed</label>
            <input type="number" min="0" required value={failed} onChange={e => setFailed(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)' }} />
          </div>
          <button type="submit" style={{ padding: '0.75rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem' }}>Submit Inspection</button>
        </form>
      </div>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Inspection History</h2>
        {error ? <div style={{ color: 'var(--red)' }}>Error: {error.message}</div> : <DataTable data={qas || []} columns={columns} loading={loading} emptyMessage="No QA records." />}
      </div>
    </div>
  );
}

export function ManufacturerLedger() {
  const { data: orders, loading: oLoading, refetch } = useApi('/manufacturer/orders');
  const { data: waybills, loading: wLoading, error } = useApi('/manufacturer/waybills');
  const [processing, setProcessing] = useState(null);

  const handleDispatch = async (orderId) => {
    const dest = window.prompt("Enter Transporter ID destination (e.g. TR-100)");
    if (!dest) return;
    setProcessing(orderId);
    try {
      await manufacturerApi.dispatchManufacturedGoods(orderId, dest);
      refetch();
    } catch (e) {
      alert("Dispatch error: " + (e.response?.data?.detail || e.message));
    } finally {
      setProcessing(null);
    }
  };

  const dispatchableOrders = (orders || []).filter(o => o.status === 'COMPLETED');

  const columns = [
    { key: 'waybill_id', header: 'Waybill ID', render: val => <strong>{val}</strong> },
    { key: 'order_code', header: 'Order Ref' },
    { key: 'origin', header: 'Origin' },
    { key: 'destination', header: 'Destination' },
    { key: 'status', header: 'Status', render: val => <StatusPill status={val === 'DELIVERED' ? 'success' : 'active'} text={val} /> }
  ];

  return (
    <div style={{ display: 'grid', gap: '3rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Ready for Dispatch</h2>
        {dispatchableOrders.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'var(--surface)', borderRadius: '12px', border: '1px dashed var(--border)', color: 'var(--muted)' }}>
            No completed batches awaiting dispatch.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {dispatchableOrders.map(o => (
              <div key={o.order_id} style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <strong style={{ fontSize: '1.1rem' }}>{o.order_id}</strong>
                  <StatusPill status="success" text="COMPLETED" />
                </div>
                <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>SKU: {o.sku} • Qty: {o.quantity}</div>
                <button 
                  disabled={processing === o.order_id} 
                  onClick={() => handleDispatch(o.order_id)} 
                  style={{ width: '100%', padding: '0.75rem', background: 'var(--blue)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Create Waybill & Dispatch
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Financial & Waybill Ledger</h2>
        {error ? <div style={{ color: 'var(--red)' }}>Error: {error.message}</div> : <DataTable data={waybills || []} columns={columns} loading={wLoading} emptyMessage="No ledger records." />}
      </div>
    </div>
  );
}
