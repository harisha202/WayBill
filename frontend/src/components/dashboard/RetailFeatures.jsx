import React, { useState, useEffect } from 'react';
import { dealerApi } from '../../api/axiosInstance';
import { DataTable } from '../ui/DataTable';
import BarChart from '../charts/BarChart';
import StatusDonut from '../charts/StatusDonut';
import { WaybillDocumentViewer } from '../ui/WaybillDocumentViewer';

export function POSAnalytics() {
  const [salesData, setSalesData] = useState([]);

  useEffect(() => {
    // In a full implementation this would hit /api/inventory/sales-analytics
    setSalesData([
      { label: 'Youth (18-24)', value: 120 },
      { label: 'Adults (25-40)', value: 340 },
      { label: 'Middle Age (41-60)', value: 210 },
      { label: 'Seniors (60+)', value: 90 },
    ]);
  }, []);

  return (
    <div className="card" style={{ borderTop: '4px solid #059669' }}>
      <h2 className="card-title">POS Sales by Demographic</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Point-of-Sale analytics segmented by customer demographic.</p>
      <div style={{ height: '300px' }}>
        <BarChart 
          title="Sales by Demographic" 
          labels={salesData.map(d => d.label)} 
          data={salesData.map(d => d.value)} 
          color="#059669"
        />
      </div>
    </div>
  );
}

export function AutoReorderUI() {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    dealerApi.reorderRecommendations()
      .then(res => setRecommendations(res.items || []))
      .catch(err => {
        // Fallback for demo
        setRecommendations([
          { sku: 'WB-001', name: 'Premium Widget', current_stock: 45, recommended_qty: 150, urgency: 'High' },
          { sku: 'WB-003', name: 'Basic Component', current_stock: 12, recommended_qty: 50, urgency: 'Critical' },
        ]);
      });
  }, []);

  const handleApprove = (sku) => {
    alert(`Approved auto-reorder for ${sku}`);
    setRecommendations(recommendations.filter(r => r.sku !== sku));
  };

  const columns = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'Product' },
    { key: 'current_stock', header: 'Current Stock' },
    { key: 'recommended_qty', header: 'Recommended Reorder' },
    { key: 'urgency', header: 'Urgency', render: (val) => (
      <span style={{ color: val === 'Critical' ? '#dc2626' : '#BA7517', fontWeight: 'bold' }}>{val}</span>
    )},
    { key: 'action', header: 'Action', render: (_, row) => (
      <button className="primary-btn" style={{ padding: '4px 8px', fontSize: '0.8rem' }} onClick={() => handleApprove(row.sku)}>Approve</button>
    )}
  ];

  return (
    <div className="card" style={{ borderTop: '4px solid #059669' }}>
      <h2 className="card-title">AI Auto-Reorder Recommendations</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>AI-driven recommendations based on recent POS sales velocity.</p>
      {recommendations.length > 0 ? (
        <DataTable data={recommendations} columns={columns} />
      ) : (
        <p className="muted">All stock levels are healthy. No reorders needed.</p>
      )}
    </div>
  );
}

export function QRScanner() {
  const [scannedOrderCode, setScannedOrderCode] = useState(null);
  
  const handleSimulateScan = () => {
    const code = prompt("Simulating QR Scan. Enter an Order Code (e.g. ORD-xxx):", "ORD-1234");
    if (code) {
      setScannedOrderCode(code);
    }
  };

  const confirmReceipt = (waybill) => {
    dealerApi.retailReceiveOrder(waybill.order_id)
      .then(() => {
        alert("Product officially received and registered at Retail Storefront.");
        setScannedOrderCode(null);
      })
      .catch(e => alert("Failed to log retail receipt."));
  };

  return (
    <div className="card" style={{ borderTop: '4px solid #059669' }}>
      <h2 className="card-title">QR Scanner Verification</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Verify incoming product authenticity via Blockchain Ledger.</p>
      
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ width: '150px', height: '150px', background: '#f1f5f9', border: '2px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px' }}>
          <span style={{ fontSize: '3rem' }}>📱</span>
        </div>
        <div>
          <button className="primary-btn" onClick={handleSimulateScan}>Simulate Scan</button>
          <p className="muted" style={{ marginTop: '12px' }}>Scans the package's physical Waybill QR.</p>
        </div>
      </div>
      
      {scannedOrderCode && (
        <WaybillDocumentViewer 
          orderCode={scannedOrderCode}
          onClose={() => setScannedOrderCode(null)}
          onConfirm={confirmReceipt}
          confirmText="Confirm Retail Receipt"
        />
      )}
    </div>
  );
}

export function LedgerVerificationRate() {
  const chartData = [
    { label: 'Verified Authentic', value: 95, color: '#059669' },
    { label: 'Flagged / Counterfeit', value: 2, color: '#dc2626' },
    { label: 'Unregistered', value: 3, color: '#f59e0b' }
  ];

  return (
    <div className="card" style={{ borderTop: '4px solid #059669' }}>
      <h2 className="card-title">Ledger Verification Success Rate</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Blockchain verification outcomes for inbound products.</p>
      <div style={{ height: '300px' }}>
        <StatusDonut data={chartData} title="Authenticity Rate" />
      </div>
    </div>
  );
}
