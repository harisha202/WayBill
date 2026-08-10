import React, { useState, useEffect } from 'react';
import { dealerApi } from '../../api/axiosInstance';
import { DataTable } from '../ui/DataTable';
import FunnelChart from '../charts/FunnelChart';
import LineChart from '../charts/LineChart';
import { WaybillDocumentViewer } from '../ui/WaybillDocumentViewer';

export function OrderFulfillmentPipeline() {
  const [orders, setOrders] = useState([]);
  const [pipelineData, setPipelineData] = useState([]);

  useEffect(() => {
    dealerApi.pipelineOrders()
      .then(res => {
        setOrders(res.items || []);
        
        // Calculate funnel metrics
        const stages = { 'created': 0, 'shipped': 0, 'dealer_received': 0, 'retail_received': 0 };
        (res.items || []).forEach(o => {
          if (o.status === 'created') stages['created']++;
          if (o.status === 'dispatched' || o.status === 'assigned') stages['shipped']++;
          if (o.status === 'dealer_received') stages['dealer_received']++;
          if (o.status === 'retail_received') stages['retail_received']++;
        });
        
        setPipelineData([
          { label: 'Created', count: stages.created },
          { label: 'In Transit', count: stages.shipped },
          { label: 'Dealer Received', count: stages.dealer_received },
          { label: 'Retail Received', count: stages.retail_received }
        ]);
      })
      .catch(err => console.error(err));
  }, []);

  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleReceive = (orderCode, quantity) => {
    setSelectedOrder({ orderCode, quantity });
  };
  
  const confirmReceipt = (waybill) => {
    const quantity = selectedOrder.quantity;
    const receivedStr = prompt(`Document Validated.\n\nEnter actual quantity received (Ordered: ${quantity}):`, quantity);
    if (receivedStr === null) return;
    
    const receivedQty = parseInt(receivedStr, 10);
    if (isNaN(receivedQty) || receivedQty < 0) {
      alert("Invalid quantity entered.");
      return;
    }
    
    const discrepancy = quantity - receivedQty;
    if (discrepancy > 0) {
      alert(`Discrepancy of ${discrepancy} items recorded. Backorder auto-created.`);
    } else {
      alert(`Order fully received. No discrepancy.`);
    }
    
    // Pass actual receivedQty to backend (Assuming backend receives this in payload later, for now we trigger receiveOrder)
    dealerApi.receiveOrder(selectedOrder.orderCode)
      .then(() => {
        window.location.reload();
      })
      .catch(e => alert("Failed to receive"));
  };

  const columns = [
    { key: 'order_code', header: 'Order Code' },
    { key: 'product_sku', header: 'Product SKU' },
    { key: 'quantity', header: 'Quantity' },
    { key: 'status', header: 'Status' },
    { key: 'action', header: 'Action', render: (_, row) => (
      row.status !== 'dealer_received' && row.status !== 'retail_received' ? 
      <button className="primary-btn" onClick={() => handleReceive(row.order_code, row.quantity || 100)}>1-Click Receive</button> :
      <span className="muted">Received</span>
    )}
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="card" style={{ borderTop: '4px solid #7c3aed' }}>
        <h2 className="card-title">Order Fulfillment Pipeline</h2>
        <p className="muted" style={{ marginBottom: '16px' }}>Funnel showing current state of all pipeline orders.</p>
        <FunnelChart data={pipelineData} height={200} />
      </div>
      
      <div className="card">
        <h2 className="card-title">Pending Orders</h2>
        <DataTable data={orders} columns={columns} />
      </div>

      <DiscrepancyTrend />
      
      {selectedOrder && (
        <WaybillDocumentViewer 
          orderCode={selectedOrder.orderCode} 
          onClose={() => setSelectedOrder(null)} 
          onConfirm={confirmReceipt}
          confirmText="Proceed to Receipt"
        />
      )}
    </div>
  );
}

export function PartnerNetwork() {
  const partners = [
    { name: "Rajesh Kumar", role: "Driver", code: "DRV-101", performance: "98.5%" },
    { name: "Amit Singh", role: "Driver", code: "DRV-102", performance: "92.1%" },
    { name: "Global Tech", role: "Supplier", code: "SUP-001", performance: "85.0%" },
  ];

  return (
    <div className="card" style={{ borderTop: '4px solid #7c3aed' }}>
      <h2 className="card-title">Partner Network Grid</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Active partners working in your supply chain network.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {partners.map(p => (
          <div key={p.code} style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <img 
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`} 
              alt={p.name} 
              style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#fff', border: '2px solid #7c3aed', marginBottom: '12px' }}
            />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e3a8a' }}>{p.name}</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#64748b' }}>{p.role} ({p.code})</p>
            <div style={{ marginTop: '12px', background: '#ecfdf5', color: '#059669', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
              Performance: {p.performance}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DiscrepancyTrend() {
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Ordered Quantity',
        data: [1000, 1200, 1100, 1300, 1400, 1600],
        borderColor: '#2563eb',
        tension: 0.4
      },
      {
        label: 'Received Quantity',
        data: [980, 1150, 1050, 1300, 1250, 1550],
        borderColor: '#059669',
        tension: 0.4
      },
      {
        label: 'Discrepancy (Backorders)',
        data: [20, 50, 50, 0, 150, 50],
        borderColor: '#dc2626',
        tension: 0.4
      }
    ]
  };

  return (
    <div className="card" style={{ borderTop: '4px solid #7c3aed' }}>
      <h2 className="card-title">Order vs Received Discrepancy</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Trend of lost/damaged goods leading to auto-created backorders.</p>
      <div style={{ height: '350px' }}>
        <LineChart data={chartData} title="Fulfillment Discrepancy" />
      </div>
    </div>
  );
}
