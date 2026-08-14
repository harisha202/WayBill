import React, { useState } from 'react';
import { useApi } from '../../api/hooks/useApi';
import { dealerApi } from '../../api/services/dealerApi';
import { DataTable } from '../ui/DataTable';
import { StatusPill } from '../ui/StatusPill';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export function DealerDashboard() {
  const { data: analytics, loading, error } = useApi('/dealer/analytics');

  if (error) return <div style={{ color: 'var(--red)' }}>Error loading analytics: {error.message}</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--dashboard-heading)' }}>Dealer Operations Hub</h1>
      </div>

      {loading ? <div>Loading...</div> : analytics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          {analytics.orderStatus.map((stat, i) => (
             <div key={i} style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
               <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--muted)', fontSize: '1rem' }}>{stat.label}</h3>
               <p style={{ fontSize: '2.5rem', margin: 0, fontWeight: 800, color: stat.color }}>{stat.value}</p>
             </div>
          ))}
        </div>
      )}

      {analytics && (
        <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 1.5rem 0', color: 'var(--text)' }}>Sales Trend (Units)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={(analytics.revenue || []).map((val, i) => ({ day: i+1, value: val }))}>
                <XAxis dataKey="day" stroke="var(--muted)" />
                <YAxis stroke="var(--muted)" />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

export function Inventory() {
  const { data: inventory, loading, error } = useApi('/dealer/inventory');

  const columns = [
    { key: 'sku', header: 'SKU', render: val => <strong>{val}</strong> },
    { key: 'productName', header: 'Product Name' },
    { key: 'category', header: 'Category' },
    { key: 'currentStock', header: 'Stock Available', render: val => <span style={{fontWeight: 'bold'}}>{val}</span> },
    { key: 'minStock', header: 'Min Level' },
    { key: 'stockStatus', header: 'Status', render: val => <StatusPill status={val === 'In Stock' ? 'success' : val === 'Low Stock' ? 'warning' : 'error'} text={val} /> }
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Warehouse Inventory</h2>
      {error ? <div style={{ color: 'var(--red)' }}>{error.message}</div> : <DataTable data={(inventory && inventory.items) || []} columns={columns} loading={loading} emptyMessage="No inventory." />}
    </div>
  );
}

export function OrderFulfillment() {
  const { data: pipeline, loading, error, refetch } = useApi('/dealer/orders/pipeline');
  const [processing, setProcessing] = useState(null);

  const handleReceive = async (orderCode) => {
    const qtyStr = window.prompt("Enter received quantity:");
    if (!qtyStr) return;
    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty)) return alert("Invalid quantity");

    setProcessing(orderCode);
    try {
      await dealerApi.receiveShipment(orderCode, qty);
      refetch();
    } catch (e) {
      alert("Error: " + (e.response?.data?.detail || e.message));
    } finally {
      setProcessing(null);
    }
  };

  const handleForward = async (orderCode) => {
    const mfg = window.prompt("Enter Manufacturer ID (e.g. manufacturer):", "manufacturer");
    if (!mfg) return;
    
    setProcessing(orderCode);
    try {
      await dealerApi.forwardOrderToManufacturer(orderCode, mfg);
      refetch();
    } catch (e) {
      alert("Error: " + (e.response?.data?.detail || e.message));
    } finally {
      setProcessing(null);
    }
  };

  const columns = [
    { key: 'orderCode', header: 'Order Ref', render: val => <strong>{val}</strong> },
    { key: 'retailer', header: 'Retailer' },
    { key: 'productSku', header: 'SKU' },
    { key: 'quantity', header: 'Qty' },
    { key: 'currentStage', header: 'Stage', render: val => <StatusPill status="active" text={val || 'Unknown'} /> },
    { key: 'status', header: 'Status' },
    { 
      key: 'actions', 
      header: 'Actions',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {row.status === 'dispatched' && (
             <button disabled={processing === row.orderCode} onClick={() => handleReceive(row.orderCode)} style={{ padding: '6px 12px', background: 'var(--green)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Receive Stock</button>
          )}
          {row.status === 'pending' && row.currentStage === 'retail_ordered' && (
             <button disabled={processing === row.orderCode} onClick={() => handleForward(row.orderCode)} style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Forward to Mfg</button>
          )}
        </div>
      )
    }
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Order Fulfillment Pipeline</h2>
      {error ? <div style={{ color: 'var(--red)' }}>{error.message}</div> : <DataTable data={(pipeline && pipeline.items) || []} columns={columns} loading={loading} emptyMessage="No orders in pipeline." />}
    </div>
  );
}

export function PartnerNetwork() {
  const { data: recent, loading, error } = useApi('/dealer/orders/recent');

  const columns = [
    { key: 'orderId', header: 'Order', render: val => <strong>{val}</strong> },
    { key: 'retailer', header: 'Retail Partner' },
    { key: 'amount', header: 'Value' },
    { key: 'date', header: 'Date' },
    { key: 'status', header: 'Status', render: val => <StatusPill status={val === 'Delivered' ? 'success' : 'pending'} text={val} /> }
  ];

  return (
    <div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Retail Partners & Recent Activity</h2>
      {error ? <div style={{ color: 'var(--red)' }}>{error.message}</div> : <DataTable data={(recent && recent.orders) || []} columns={columns} loading={loading} emptyMessage="No recent partner activity." />}
    </div>
  );
}
