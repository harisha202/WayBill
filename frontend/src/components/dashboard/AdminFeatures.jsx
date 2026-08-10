import React from 'react';
import BarChart from '../charts/BarChart';
import StatusDonut from '../charts/StatusDonut';
import LineChart from '../charts/LineChart';
import PipelineFunnel from '../charts/PipelineFunnel';
import NetworkGraph from '../charts/NetworkGraph';

const containerStyle = {
  backgroundColor: '#0f172a',
  color: '#f8fafc',
  padding: '2rem',
  minHeight: '100vh',
  fontFamily: 'Inter, system-ui, sans-serif'
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2rem'
};

const kpiGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '1.5rem',
  marginBottom: '2rem'
};

const cardStyle = {
  backgroundColor: '#1e293b',
  borderRadius: '12px',
  padding: '1.5rem',
  border: '1px solid #334155',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
};

const titleStyle = {
  fontSize: '1.25rem',
  fontWeight: '600',
  marginBottom: '1rem',
  display: 'flex',
  alignItems: 'center',
  color: '#e2e8f0'
};

const iconStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0f172a',
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  marginRight: '12px',
  fontSize: '16px',
  border: '1px solid #334155'
};

const chartContainerStyle = {
  height: '300px',
  width: '100%',
  position: 'relative'
};

export function ControlTower() {
  const orderPipelineData = [{ label: 'Pending', value: 120 }, { label: 'Processing', value: 80 }, { label: 'Shipped', value: 300 }, { label: 'Delivered', value: 450 }];
  const revenueVsCostData = { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'], data: [1000, 2000, 1500, 3000, 2500] };
  const onTimeDeliveryData = [{ label: 'On Time', value: 85 }, { label: 'Late', value: 15 }];
  const inventoryHealthData = { labels: ['Electronics', 'Apparel', 'Food'], data: [95, 60, 80] };
  const costBreakdownData = [{ label: 'Transport', value: 40 }, { label: 'Storage', value: 30 }, { label: 'Tariffs', value: 20 }, { label: 'Misc', value: 10 }];

  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Control Tower</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>KPIs & Core Metrics Overview</p>
      </header>

      {/* KPI Cards */}
      <div style={kpiGridStyle}>
        {[
          { label: 'Active Shipments', value: '1,245', icon: '🚢', color: '#3b82f6' },
          { label: 'Total Revenue', value: '$4.2M', icon: '💰', color: '#10b981' },
          { label: 'Critical Alerts', value: '12', icon: '⚠️', color: '#ef4444' },
          { label: 'Avg Delivery Time', value: '4.2 Days', icon: '⏱️', color: '#a855f7' }
        ].map((kpi, i) => (
          <div key={i} style={{ ...cardStyle, display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginRight: '1rem', color: kpi.color }}>{kpi.icon}</div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '500' }}>{kpi.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{kpi.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>📊</span> Order Pipeline</h2>
          <div style={chartContainerStyle}>
            <PipelineFunnel data={orderPipelineData} />
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>📈</span> Revenue vs Cost</h2>
          <div style={chartContainerStyle}>
            <BarChart labels={revenueVsCostData.labels} data={revenueVsCostData.data} color="#10b981" title="Revenue" />
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>🚚</span> On-Time Delivery</h2>
          <div style={chartContainerStyle}>
            <StatusDonut data={onTimeDeliveryData} title="Delivery Status" />
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>📦</span> Inventory Health</h2>
          <div style={chartContainerStyle}>
            <BarChart labels={inventoryHealthData.labels} data={inventoryHealthData.data} color="#3b82f6" title="Health %" />
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>💵</span> Cost Breakdown</h2>
          <div style={chartContainerStyle}>
            <StatusDonut data={costBreakdownData} title="Costs" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SupplyChainDepth() {
  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Supply Chain Depth</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Network Topology and Infrastructure</p>
      </header>
      <div style={gridStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>🔗</span> Supply-Chain Network Graph</h2>
          <div style={{ ...chartContainerStyle, backgroundColor: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
            <NetworkGraph />
          </div>
        </div>
      </div>
    </div>
  );
}

export function SupplierRisk() {
  const supplierRiskData = { labels: ['Supplier A', 'Supplier B', 'Supplier C'], data: [80, 45, 90] };
  const shipmentRiskTrendData = { labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], data: [10, 15, 5, 20] };

  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Supplier Risk</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Global Risk Assessment and Trends</p>
      </header>
      <div style={gridStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>🌍</span> Global Shipment Risk Map</h2>
          <div style={{ ...chartContainerStyle, backgroundColor: '#0f172a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
             <div style={{ color: '#64748b', fontStyle: 'italic' }}>Interactive Map Rendered Here</div>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>⚠️</span> Supplier Risk</h2>
          <div style={chartContainerStyle}>
            <BarChart labels={supplierRiskData.labels} data={supplierRiskData.data} color="#ef4444" title="Risk Score" />
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>📉</span> Shipment Risk Trend</h2>
          <div style={chartContainerStyle}>
            <LineChart labels={shipmentRiskTrendData.labels} data={shipmentRiskTrendData.data} color="#f59e0b" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ActivityLog() {
  const anomalyTrendData = { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], data: [2, 0, 5, 1, 3] };

  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Activity Log</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>System Anomalies and Event Tracking</p>
      </header>
      <div style={gridStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>🚨</span> Anomaly Trend</h2>
          <div style={chartContainerStyle}>
            <LineChart labels={anomalyTrendData.labels} data={anomalyTrendData.data} color="#ec4899" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminLedger() {
  const revenueVsCostData = { labels: ['Q1', 'Q2', 'Q3', 'Q4'], data: [500000, 750000, 600000, 900000] };
  const costByCategoryData = [{ label: 'Transport', value: 300000 }, { label: 'Storage', value: 150000 }, { label: 'Operations', value: 200000 }, { label: 'Salaries', value: 400000 }];
  const profitMarginData = { labels: ['Jan', 'Feb', 'Mar', 'Apr'], data: [15, 18, 16, 22] };
  const transportCostData = { labels: ['Air', 'Sea', 'Road', 'Rail'], data: [120000, 80000, 60000, 40000] };
  const supplierPaymentsData = [{ label: 'Paid', value: 850000 }, { label: 'Pending', value: 150000 }];
  const ledgerVerificationData = [{ label: 'Verified', value: 95 }, { label: 'Discrepancy', value: 5 }];
  const currencyExposureData = { labels: ['USD', 'EUR', 'GBP', 'JPY'], data: [40, 30, 20, 10] };

  return (
    <div style={containerStyle}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Admin Ledger</h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Financial Overview & Accounting (in ₹)</p>
      </header>
      
      <div style={gridStyle}>
        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>💰</span> Revenue vs Cost (₹)</h2>
          <div style={chartContainerStyle}>
            <BarChart labels={revenueVsCostData.labels} data={revenueVsCostData.data} color="#10b981" title="₹ Revenue/Cost" />
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>🥧</span> Cost by Category</h2>
          <div style={chartContainerStyle}>
            <StatusDonut data={costByCategoryData} title="Costs (₹)" />
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>📈</span> Profit/Margin Trend</h2>
          <div style={chartContainerStyle}>
            <LineChart labels={profitMarginData.labels} data={profitMarginData.data} color="#3b82f6" />
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>🚚</span> Transport Cost (₹)</h2>
          <div style={chartContainerStyle}>
            <BarChart labels={transportCostData.labels} data={transportCostData.data} color="#f59e0b" title="Transport (₹)" />
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>🧾</span> Supplier Payments</h2>
          <div style={chartContainerStyle}>
             <StatusDonut data={supplierPaymentsData} title="Payments (₹)" />
          </div>
        </div>
        
        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>✅</span> Ledger Verification</h2>
          <div style={chartContainerStyle}>
             <StatusDonut data={ledgerVerificationData} title="Status" />
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={titleStyle}><span style={iconStyle}>💱</span> Currency Exposure</h2>
          <div style={chartContainerStyle}>
            <BarChart labels={currencyExposureData.labels} data={currencyExposureData.data} color="#8b5cf6" title="Exposure %" />
          </div>
        </div>
      </div>
    </div>
  );
}
