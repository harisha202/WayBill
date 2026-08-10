import React from 'react';
import BarChart from '../charts/BarChart';
import StatusDonut from '../charts/StatusDonut';
import LineChart from '../charts/LineChart';
import PipelineFunnel from '../charts/PipelineFunnel';

// Mock Data
const kpiData = [
  { label: 'Active Orders', value: '142', icon: '📦', color: '#3b82f6' },
  { label: 'Avg Fulfillment', value: '94%', icon: '⚡', color: '#10b981' },
  { label: 'Backorders', value: '12', icon: '⏳', color: '#f59e0b' },
  { label: 'Discrepancies', value: '3', icon: '⚠️', color: '#ef4444' },
];

const pipelineData = [
  { label: 'Created', count: 120 },
  { label: 'In Transit', count: 85 },
  { label: 'Dealer Received', count: 45 },
  { label: 'Retail Received', count: 10 }
];

const inventoryData = {
  labels: ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'],
  datasets: [
    {
      label: 'Inventory Level',
      data: [120, 80, 150, 40, 200],
      backgroundColor: '#3b82f6',
    },
    {
      label: 'Reorder Point',
      data: [50, 50, 100, 50, 150],
      backgroundColor: '#ef4444',
    }
  ]
};

const backorderTrend = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [{
    label: 'Backorders',
    data: [5, 8, 12, 4, 2, 7],
    borderColor: '#f59e0b',
    tension: 0.4
  }]
};

const discrepancyTrend = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [{
    label: 'Discrepancies',
    data: [1, 3, 2, 0, 4, 1],
    borderColor: '#ef4444',
    tension: 0.4
  }]
};

const supplierPerformance = {
  labels: ['On-time', 'Delayed', 'Damaged'],
  datasets: [{
    data: [85, 10, 5],
    backgroundColor: ['#10b981', '#f59e0b', '#ef4444']
  }]
};

const fulfillmentRate = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
  datasets: [{
    label: 'Fulfillment Rate (%)',
    data: [92, 94, 91, 96, 95, 98],
    borderColor: '#10b981',
    tension: 0.4
  }]
};

const marginData = {
  labels: ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'],
  datasets: [{
    label: 'Margin (%)',
    data: [15, 22, 18, 25, 20],
    backgroundColor: '#8b5cf6'
  }]
};

const mapShipments = [
  { id: 1, origin: 'Warehouse A', destination: 'Dealer HQ', status: 'In Transit', eta: '2 Hrs' },
  { id: 2, origin: 'Supplier X', destination: 'Dealer HQ', status: 'Delayed', eta: '1 Day' },
  { id: 3, origin: 'Warehouse B', destination: 'Dealer HQ', status: 'Arriving', eta: '30 Mins' }
];

const pendingOrders = [
  { id: 'ORD-1001', product: 'Product A', qty: 50, status: 'In Transit' },
  { id: 'ORD-1002', product: 'Product C', qty: 100, status: 'Shipped' },
  { id: 'ORD-1003', product: 'Product D', qty: 25, status: 'Processing' },
];

// Ledger Mock Data (INR)
const ledgerPurchaseCost = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr'],
  datasets: [{ label: 'Purchase Cost (₹)', data: [450000, 520000, 480000, 610000], borderColor: '#f59e0b', tension: 0.4 }]
};
const ledgerSalesRevenue = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr'],
  datasets: [{ label: 'Sales Revenue (₹)', data: [650000, 720000, 680000, 850000], backgroundColor: '#10b981' }]
};
const ledgerGrossMargin = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr'],
  datasets: [{ label: 'Gross Margin (₹)', data: [200000, 200000, 200000, 240000], backgroundColor: '#3b82f6' }]
};
const ledgerSupplierPayments = {
  labels: ['Supplier X', 'Supplier Y', 'Supplier Z'],
  datasets: [{ data: [300000, 150000, 50000], backgroundColor: ['#3b82f6', '#f59e0b', '#10b981'] }]
};
const ledgerDiscrepancyValue = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr'],
  datasets: [{ label: 'Discrepancy (₹)', data: [12000, 8000, 15000, 5000], borderColor: '#ef4444', tension: 0.4 }]
};
const ledgerBackorderValue = {
  labels: ['Product A', 'Product B', 'Product C'],
  datasets: [{ label: 'Backorder Value (₹)', data: [45000, 30000, 15000], backgroundColor: '#8b5cf6' }]
};

export function DealerDashboard() {
  return (
    <div className="dashboard-container" style={{
      padding: '24px',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 700, color: '#f8fafc' }}>Dealer Dashboard</h1>
        <p style={{ color: '#94a3b8', margin: '8px 0 0' }}>Real-time overview of your supply chain and inventory.</p>
      </header>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {kpiData.map((kpi, index) => (
          <div key={index} style={{
            backgroundColor: '#1e293b',
            padding: '24px',
            borderRadius: '16px',
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: `${kpi.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              marginRight: '16px',
              border: `1px solid ${kpi.color}40`
            }}>
              {kpi.icon}
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>{kpi.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px'
      }}>
        
        {/* Order Pipeline */}
        <div style={{ gridColumn: 'span 8', backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600 }}>Order Pipeline</h2>
          <div style={{ height: '300px' }}>
            <PipelineFunnel data={pipelineData} />
          </div>
        </div>

        {/* Margin by Product */}
        <div style={{ gridColumn: 'span 4', backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600 }}>Margin by Product</h2>
          <div style={{ height: '300px' }}>
            <BarChart data={marginData} />
          </div>
        </div>

        {/* Dealer Pipeline (Pending Orders) */}
        <div style={{ gridColumn: 'span 12', backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600 }}>Dealer Pipeline (Active Orders)</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
                  <th style={{ padding: '12px' }}>Order ID</th>
                  <th style={{ padding: '12px' }}>Product</th>
                  <th style={{ padding: '12px' }}>Quantity</th>
                  <th style={{ padding: '12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingOrders.map(order => (
                  <tr key={order.id} style={{ borderBottom: '1px solid #334155' }}>
                    <td style={{ padding: '12px', color: '#f8fafc' }}>{order.id}</td>
                    <td style={{ padding: '12px', color: '#f8fafc' }}>{order.product}</td>
                    <td style={{ padding: '12px', color: '#f8fafc' }}>{order.qty}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        backgroundColor: order.status === 'In Transit' ? '#3b82f620' : '#10b98120',
                        color: order.status === 'In Transit' ? '#3b82f6' : '#10b981'
                      }}>{order.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Ledger (INR) */}
        <div style={{ gridColumn: 'span 12', marginTop: '16px', borderBottom: '1px solid #334155', paddingBottom: '8px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f8fafc' }}>Financial Ledger (₹)</h2>
        </div>

        <div style={{ gridColumn: 'span 4', backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: 600 }}>Purchase Cost (₹)</h3>
          <div style={{ height: '250px' }}><LineChart data={ledgerPurchaseCost} /></div>
        </div>
        <div style={{ gridColumn: 'span 4', backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: 600 }}>Sales Revenue (₹)</h3>
          <div style={{ height: '250px' }}><BarChart data={ledgerSalesRevenue} /></div>
        </div>
        <div style={{ gridColumn: 'span 4', backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: 600 }}>Gross Margin (₹)</h3>
          <div style={{ height: '250px' }}><BarChart data={ledgerGrossMargin} /></div>
        </div>
        <div style={{ gridColumn: 'span 4', backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: 600 }}>Supplier Payments (₹)</h3>
          <div style={{ height: '250px' }}><StatusDonut data={ledgerSupplierPayments} /></div>
        </div>
        <div style={{ gridColumn: 'span 4', backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: 600 }}>Discrepancy Value (₹)</h3>
          <div style={{ height: '250px' }}><LineChart data={ledgerDiscrepancyValue} /></div>
        </div>
        <div style={{ gridColumn: 'span 4', backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: 600 }}>Backorder Value (₹)</h3>
          <div style={{ height: '250px' }}><BarChart data={ledgerBackorderValue} /></div>
        </div>
      </div>
    </div>
  );
}

export function Inventory() {
  return (
    <div className="dashboard-container" style={{
      padding: '24px',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 700, color: '#f8fafc' }}>Inventory</h1>
        <p style={{ color: '#94a3b8', margin: '8px 0 0' }}>Manage and track your inventory levels.</p>
      </header>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px'
      }}>
        {/* Inventory vs Reorder Point */}
        <div style={{ gridColumn: 'span 12', backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600 }}>Inventory vs Reorder Point</h2>
          <div style={{ height: '300px' }}>
            <BarChart data={inventoryData} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function OrderFulfillment() {
  return (
    <div className="dashboard-container" style={{
      padding: '24px',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 700, color: '#f8fafc' }}>Order Fulfillment</h1>
        <p style={{ color: '#94a3b8', margin: '8px 0 0' }}>Monitor fulfillment metrics and trends.</p>
      </header>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px'
      }}>
        {/* Fulfillment Rate */}
        <div style={{ gridColumn: 'span 12', backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600 }}>Fulfillment Rate</h2>
          <div style={{ height: '300px' }}>
            <LineChart data={fulfillmentRate} />
          </div>
        </div>
        
        {/* Backorder Trend */}
        <div style={{ gridColumn: 'span 6', backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600 }}>Backorder Trend</h2>
          <div style={{ height: '300px' }}>
            <LineChart data={backorderTrend} />
          </div>
        </div>

        {/* Discrepancy Trend */}
        <div style={{ gridColumn: 'span 6', backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600 }}>Discrepancy Trend</h2>
          <div style={{ height: '300px' }}>
            <LineChart data={discrepancyTrend} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PartnerNetwork() {
  return (
    <div className="dashboard-container" style={{
      padding: '24px',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      minHeight: '100vh',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 700, color: '#f8fafc' }}>Partner Network</h1>
        <p style={{ color: '#94a3b8', margin: '8px 0 0' }}>Overview of supplier and dealer network.</p>
      </header>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '24px'
      }}>
        {/* Supplier Performance */}
        <div style={{ gridColumn: 'span 6', backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600 }}>Supplier Performance</h2>
          <div style={{ height: '300px' }}>
            <StatusDonut data={supplierPerformance} />
          </div>
        </div>

        {/* Dealer Map (Incoming Shipments) */}
        <div style={{ gridColumn: 'span 6', backgroundColor: '#1e293b', padding: '24px', borderRadius: '16px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '16px', fontWeight: 600 }}>Dealer Map (Incoming)</h2>
          <div style={{ flex: 1, backgroundColor: '#0f172a', borderRadius: '8px', padding: '16px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {mapShipments.map((shipment) => (
                <div key={shipment.id} style={{
                  padding: '12px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: '#f8fafc' }}>{shipment.origin}</span>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      backgroundColor: shipment.status === 'Delayed' ? '#ef444420' : (shipment.status === 'Arriving' ? '#10b98120' : '#3b82f620'),
                      color: shipment.status === 'Delayed' ? '#ef4444' : (shipment.status === 'Arriving' ? '#10b981' : '#3b82f6')
                    }}>{shipment.status}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: '#94a3b8' }}>
                    <span>To: {shipment.destination}</span>
                    <span>ETA: {shipment.eta}</span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '16px', height: '150px', backgroundColor: '#334155', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', border: '1px dashed #475569' }}>
              🗺️ Map View 
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

