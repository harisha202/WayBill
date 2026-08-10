import React from 'react';
import { BarChart, StatusDonut, LineChart, PipelineFunnel } from '../charts';

// Mock Data for the Retail Dashboard
const posSalesTrendData = [
  { label: 'Jan', value: 12000 },
  { label: 'Feb', value: 15000 },
  { label: 'Mar', value: 14000 },
  { label: 'Apr', value: 18000 },
  { label: 'May', value: 22000 },
];

const salesByProductData = [
  { label: 'Product A', value: 40 },
  { label: 'Product B', value: 30 },
  { label: 'Product C', value: 20 },
  { label: 'Product D', value: 10 },
];

const inventoryLevelData = [
  { label: 'Item 1', value: 120 },
  { label: 'Item 2', value: 80 },
  { label: 'Item 3', value: 45 },
  { label: 'Item 4', value: 200 },
];

const inventoryVsReorderData = [
  { label: 'Store 1', value: 80 },
  { label: 'Store 2', value: 50 },
  { label: 'Store 3', value: 120 },
];

const demandForecastData = [
  { label: 'May', value: 19000 },
  { label: 'Jun', value: 22000 },
  { label: 'Jul', value: 21000 },
];

const forecastVsActualData = [
  { label: 'Week 1', value: 95 },
  { label: 'Week 2', value: 98 },
  { label: 'Week 3', value: 92 },
];

const reorderRecommendationsData = [
  { label: 'Actionable', value: 60 },
  { label: 'Pending', value: 30 },
  { label: 'Ignored', value: 10 },
];

const qrVerificationRateData = [
  { label: 'Verified', value: 85 },
  { label: 'Failed', value: 15 },
];

const pipelineData = [
  { stage: 'Low Stock Detected', count: 150 },
  { stage: 'Auto-Reorder Generated', count: 120 },
  { stage: 'Approved by Manager', count: 100 },
  { stage: 'PO Sent to Supplier', count: 95 },
  { stage: 'Shipment Incoming', count: 90 },
];

// Ledger Mock Data (INR)
const ledgerRetailSalesRevenue = [
  { label: 'Jan', value: 850000 },
  { label: 'Feb', value: 920000 },
  { label: 'Mar', value: 880000 },
  { label: 'Apr', value: 1050000 },
];
const ledgerCogs = [
  { label: 'Jan', value: 500000 },
  { label: 'Feb', value: 550000 },
  { label: 'Mar', value: 520000 },
  { label: 'Apr', value: 600000 },
];
const ledgerRetailGrossMargin = [
  { label: 'Jan', value: 350000 },
  { label: 'Feb', value: 370000 },
  { label: 'Mar', value: 360000 },
  { label: 'Apr', value: 450000 },
];
const ledgerInventoryValue = [
  { label: 'Store 1', value: 1250000 },
  { label: 'Store 2', value: 980000 },
  { label: 'Store 3', value: 1450000 },
];
const ledgerReorderCost = [
  { label: 'Week 1', value: 45000 },
  { label: 'Week 2', value: 32000 },
  { label: 'Week 3', value: 58000 },
];
const ledgerProductProfitability = [
  { label: 'Prod A', value: 45 },
  { label: 'Prod B', value: 30 },
  { label: 'Prod C', value: 25 },
];

const containerStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: '24px',
  padding: '32px',
  backgroundColor: '#0f0f13', // Deep dark aesthetic
  color: '#ffffff',
  minHeight: '100vh',
  fontFamily: '"Inter", "Roboto", sans-serif',
};

const cardStyle = {
  backgroundColor: '#1c1c24',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid #2d2d3a',
  transition: 'transform 0.2s ease-in-out',
};

const titleStyle = {
  fontSize: '1.1rem',
  fontWeight: '600',
  marginBottom: '16px',
  color: '#e2e2e9',
  letterSpacing: '0.5px',
};

const kpiValueStyle = {
  fontSize: '2.8rem',
  fontWeight: '700',
  color: '#00e676', // vibrant green
  marginTop: '8px',
  lineHeight: '1.2',
};

const mapContainerStyle = {
  flexGrow: 1, 
  backgroundColor: '#121218', 
  borderRadius: '12px', 
  display: 'flex', 
  alignItems: 'center', 
  justifyContent: 'center',
  border: '1px dashed #3f3f5a',
  overflow: 'hidden'
};

const Header = ({ title, description }) => (
  <div style={{ gridColumn: 'span 12', marginBottom: '16px' }}>
    <h1 style={{ 
      fontSize: '2.4rem', 
      margin: 0, 
      background: 'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)', 
      WebkitBackgroundClip: 'text', 
      WebkitTextFillColor: 'transparent',
      fontWeight: '800'
    }}>
      {title}
    </h1>
    <p style={{ color: '#9fa0b5', margin: '8px 0 0 0', fontSize: '1.1rem' }}>
      {description}
    </p>
  </div>
);

export const RetailDashboard = () => (
  <div style={containerStyle}>
    <Header title="Retail Dashboard" description="Overview of sales, performance, and key metrics." />
    
    <div style={{ ...cardStyle, gridColumn: 'span 3' }}>
      <h3 style={titleStyle}>Total Sales (Today)</h3>
      <div style={kpiValueStyle}>$24,500</div>
      <p style={{ color: '#00e676', fontSize: '0.95rem', marginTop: '12px', fontWeight: '500' }}>+12% vs Yesterday ↑</p>
    </div>
    <div style={{ ...cardStyle, gridColumn: 'span 3' }}>
      <h3 style={titleStyle}>Pending Reorders</h3>
      <div style={{ ...kpiValueStyle, color: '#ff9800' }}>34</div>
      <p style={{ color: '#9fa0b5', fontSize: '0.95rem', marginTop: '12px' }}>Requires manager approval</p>
    </div>
    <div style={{ ...cardStyle, gridColumn: 'span 3' }}>
      <h3 style={titleStyle}>Stockouts Prevented</h3>
      <div style={{ ...kpiValueStyle, color: '#00bcd4' }}>128</div>
      <p style={{ color: '#9fa0b5', fontSize: '0.95rem', marginTop: '12px' }}>This month</p>
    </div>
    <div style={{ ...cardStyle, gridColumn: 'span 3' }}>
      <h3 style={titleStyle}>QR Verification</h3>
      <div style={{ ...kpiValueStyle, color: '#b388ff' }}>98.5%</div>
      <p style={{ color: '#9fa0b5', fontSize: '0.95rem', marginTop: '12px' }}>Authentication success rate</p>
    </div>

    <div style={{ ...cardStyle, gridColumn: 'span 6', minHeight: '380px' }}>
      <h3 style={titleStyle}>POS Sales Trend</h3>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <LineChart data={posSalesTrendData} />
      </div>
    </div>
    
    <div style={{ ...cardStyle, gridColumn: 'span 6', minHeight: '380px' }}>
      <h3 style={titleStyle}>Revenue/Margin</h3>
      <div style={{ flexGrow: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#9fa0b5', fontSize: '1.1rem' }}>Revenue & Margin Analysis</p>
      </div>
    </div>

    {/* Financial Ledger (INR) */}
    <div style={{ gridColumn: 'span 12', marginTop: '24px', borderBottom: '1px solid #2d2d3a', paddingBottom: '8px' }}>
      <h2 style={{ fontSize: '1.8rem', margin: 0, color: '#e2e2e9', fontWeight: '700' }}>Financial Ledger (₹)</h2>
    </div>

    <div style={{ ...cardStyle, gridColumn: 'span 4', minHeight: '320px' }}>
      <h3 style={titleStyle}>Sales Revenue (₹)</h3>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <LineChart data={ledgerRetailSalesRevenue} />
      </div>
    </div>
    <div style={{ ...cardStyle, gridColumn: 'span 4', minHeight: '320px' }}>
      <h3 style={titleStyle}>Cost of Goods Sold (₹)</h3>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <BarChart data={ledgerCogs} />
      </div>
    </div>
    <div style={{ ...cardStyle, gridColumn: 'span 4', minHeight: '320px' }}>
      <h3 style={titleStyle}>Gross Margin (₹)</h3>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <LineChart data={ledgerRetailGrossMargin} />
      </div>
    </div>
    <div style={{ ...cardStyle, gridColumn: 'span 4', minHeight: '320px' }}>
      <h3 style={titleStyle}>Inventory Value (₹)</h3>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <BarChart data={ledgerInventoryValue} />
      </div>
    </div>
    <div style={{ ...cardStyle, gridColumn: 'span 4', minHeight: '320px' }}>
      <h3 style={titleStyle}>Reorder Cost (₹)</h3>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <LineChart data={ledgerReorderCost} />
      </div>
    </div>
    <div style={{ ...cardStyle, gridColumn: 'span 4', minHeight: '320px' }}>
      <h3 style={titleStyle}>Product Profitability (%)</h3>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <StatusDonut data={ledgerProductProfitability} />
      </div>
    </div>
  </div>
);

export const RetailInventory = () => (
  <div style={containerStyle}>
    <Header title="Retail Inventory" description="Live inventory levels and reorder point tracking." />
    
    <div style={{ ...cardStyle, gridColumn: 'span 6', minHeight: '340px' }}>
      <h3 style={titleStyle}>Inventory Level</h3>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <BarChart data={inventoryLevelData} />
      </div>
    </div>
    <div style={{ ...cardStyle, gridColumn: 'span 6', minHeight: '340px' }}>
      <h3 style={titleStyle}>Inventory vs Reorder Point</h3>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <LineChart data={inventoryVsReorderData} />
      </div>
    </div>
  </div>
);

export const POSAnalytics = () => (
  <div style={containerStyle}>
    <Header title="POS Analytics" description="Detailed insights on sales by product and demand forecasting." />
    
    <div style={{ ...cardStyle, gridColumn: 'span 4', minHeight: '340px' }}>
      <h3 style={titleStyle}>Sales by Product</h3>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <StatusDonut data={salesByProductData} />
      </div>
    </div>
    <div style={{ ...cardStyle, gridColumn: 'span 4', minHeight: '340px' }}>
      <h3 style={titleStyle}>Demand Forecast</h3>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <LineChart data={demandForecastData} />
      </div>
    </div>
    <div style={{ ...cardStyle, gridColumn: 'span 4', minHeight: '340px' }}>
      <h3 style={titleStyle}>Forecast vs Actual</h3>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <BarChart data={forecastVsActualData} />
      </div>
    </div>
  </div>
);

export const QRVerification = () => (
  <div style={containerStyle}>
    <Header title="QR Verification" description="Track QR verification rates and view the waybill verification history." />
    
    <div style={{ ...cardStyle, gridColumn: 'span 4', minHeight: '400px' }}>
      <h3 style={titleStyle}>QR Verification Rate</h3>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <StatusDonut data={qrVerificationRateData} />
      </div>
    </div>
    <div style={{ ...cardStyle, gridColumn: 'span 8', minHeight: '400px' }}>
      <h3 style={titleStyle}>Waybill Verification History</h3>
      <div style={mapContainerStyle}>
         <div style={{ textAlign: 'center' }}>
           <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4facfe" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '16px' }}>
             <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
             <polyline points="14 2 14 8 20 8"></polyline>
             <line x1="16" y1="13" x2="8" y2="13"></line>
             <line x1="16" y1="17" x2="8" y2="17"></line>
             <polyline points="10 9 9 9 8 9"></polyline>
           </svg>
           <div style={{ color: '#9fa0b5', fontSize: '1.1rem' }}>Verification History Log View</div>
         </div>
      </div>
    </div>
  </div>
);

export const AutoReorder = () => (
  <div style={containerStyle}>
    <Header title="Auto-Reorder" description="AI-driven auto-reorder recommendations and pipeline." />
    
    <div style={{ ...cardStyle, gridColumn: 'span 4', minHeight: '420px' }}>
      <h3 style={titleStyle}>Auto-Reorder Recommendations</h3>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <StatusDonut data={reorderRecommendationsData} />
      </div>
    </div>
    <div style={{ ...cardStyle, gridColumn: 'span 8', minHeight: '420px' }}>
      <h3 style={titleStyle}>Retail Reorder Pipeline</h3>
      <div style={{ flexGrow: 1, position: 'relative' }}>
        <PipelineFunnel data={pipelineData} />
      </div>
    </div>
  </div>
);
