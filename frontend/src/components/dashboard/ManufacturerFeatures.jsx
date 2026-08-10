import React from 'react';
import BarChart from '../charts/BarChart';
import StatusDonut from '../charts/StatusDonut';
import LineChart from '../charts/LineChart';
import PipelineFunnel from '../charts/PipelineFunnel';
import GaugeChart from '../charts/GaugeChart';

export function ManufacturerDashboard() {
  const kpis = [
    { label: 'Total Production', value: '14,230 Units', trend: '+5.2%' },
    { label: 'Active Orders', value: '342', trend: '+12%' },
    { label: 'Defect Rate', value: '0.8%', trend: '-0.2%' },
    { label: 'Avg Lead Time', value: '4.5 Days', trend: '-1.1 Days' }
  ];

  const productionVsDemandData = [
    { name: 'Jan', Production: 4000, Demand: 4400 },
    { name: 'Feb', Production: 3000, Demand: 3200 },
    { name: 'Mar', Production: 2000, Demand: 2400 },
    { name: 'Apr', Production: 2780, Demand: 2900 },
    { name: 'May', Production: 1890, Demand: 2100 },
    { name: 'Jun', Production: 2390, Demand: 2500 },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 8px 0', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Manufacturer Dashboard
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Real-time production, forecasting, and supply chain insights.</p>
      </header>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {kpis.map((kpi, idx) => (
          <div key={idx} style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ fontSize: '0.875rem', color: '#94a3b8', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f8fafc' }}>{kpi.value}</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: kpi.trend.startsWith('+') ? '#34d399' : '#f87171' }}>
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts CSS Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        {/* Production vs Demand */}
        <div style={{ gridColumn: 'span 8', backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#e2e8f0' }}>Production vs Demand</h2>
          <div style={{ height: '300px' }}>
            <LineChart data={productionVsDemandData} />
          </div>
        </div>

        {/* Capacity Utilization */}
        <div style={{ gridColumn: 'span 4', backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#e2e8f0' }}>Capacity Utilization</h2>
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GaugeChart value={82} label="Utilization" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function Production() {
  const pipelineData = [
    { stage: 'Raw Material', count: 5000 },
    { stage: 'Assembly', count: 3500 },
    { stage: 'Testing', count: 2000 },
    { stage: 'Packaging', count: 1800 },
    { stage: 'Ready for Shipping', count: 1500 },
  ];

  const orderFulfillmentData = [
    { name: 'Fulfilled', value: 320 },
    { name: 'Pending', value: 22 },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 8px 0', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Production
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Manufacturing pipeline and order fulfillment tracking.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        {/* Manufacturing Pipeline */}
        <div style={{ gridColumn: 'span 8', backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#e2e8f0' }}>Manufacturing Pipeline</h2>
          <div style={{ height: '350px' }}>
            <PipelineFunnel data={pipelineData} />
          </div>
        </div>

        {/* Order Fulfillment */}
        <div style={{ gridColumn: 'span 4', backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#e2e8f0' }}>Order Fulfillment</h2>
          <div style={{ height: '350px' }}>
            <StatusDonut data={orderFulfillmentData} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function AIForecast() {
  const forecastData = [
    { name: 'Jul', Forecast: 2600, Actual: 2550 },
    { name: 'Aug', Forecast: 2800, Actual: 2900 },
    { name: 'Sep', Forecast: 3100, Actual: 0 },
    { name: 'Oct', Forecast: 3400, Actual: 0 },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 8px 0', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          AI Forecast
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Demand forecast and predictions vs actuals.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        {/* Demand Forecast */}
        <div style={{ gridColumn: 'span 6', backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#e2e8f0' }}>Demand Forecast</h2>
          <div style={{ height: '300px' }}>
            <LineChart data={forecastData} />
          </div>
        </div>

        {/* Forecast vs Actual */}
        <div style={{ gridColumn: 'span 6', backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#e2e8f0' }}>Forecast vs Actual</h2>
          <div style={{ height: '300px' }}>
            <BarChart data={forecastData} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function RawMaterialSourcing() {
  const supplierData = [
    { name: 'Supplier A', Performance: 95 },
    { name: 'Supplier B', Performance: 88 },
    { name: 'Supplier C', Performance: 92 },
    { name: 'Supplier D', Performance: 78 },
  ];

  const inventoryData = [
    { name: 'Steel', value: 400 },
    { name: 'Aluminum', value: 300 },
    { name: 'Plastics', value: 300 },
    { name: 'Electronics', value: 200 },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 8px 0', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Raw Material Sourcing
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Inventory levels and supplier performance metrics.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        {/* Supplier Performance */}
        <div style={{ gridColumn: 'span 7', backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#e2e8f0' }}>Supplier Performance</h2>
          <div style={{ height: '250px' }}>
            <BarChart data={supplierData} />
          </div>
        </div>

        {/* Raw Material Inventory */}
        <div style={{ gridColumn: 'span 5', backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#e2e8f0' }}>Raw Material Inventory</h2>
          <div style={{ height: '250px' }}>
            <StatusDonut data={inventoryData} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function QualityAssurance() {
  const qaData = [
    { name: 'Pass', value: 98 },
    { name: 'Fail', value: 2 },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 8px 0', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Quality Assurance
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Quality control and pass/fail rates.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        {/* QA Pass/Fail */}
        <div style={{ gridColumn: 'span 12', backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#e2e8f0' }}>QA Pass/Fail</h2>
          <div style={{ height: '300px' }}>
            <StatusDonut data={qaData} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function ManufacturerLedger() {
  const productionCostData = [
    { name: 'Jan', Cost: 1200000 },
    { name: 'Feb', Cost: 1350000 },
    { name: 'Mar', Cost: 1100000 },
    { name: 'Apr', Cost: 1400000 },
  ];
  
  const rawMaterialCostData = [
    { name: 'Plastics', value: 400000 },
    { name: 'Steel', value: 600000 },
    { name: 'Electronics', value: 800000 },
  ];

  const supplierPaymentsData = [
    { name: 'Paid', value: 1500000 },
    { name: 'Pending', value: 300000 },
  ];

  const costPerBatchData = [
    { name: 'Batch A', Cost: 50000 },
    { name: 'Batch B', Cost: 52000 },
    { name: 'Batch C', Cost: 48000 },
    { name: 'Batch D', Cost: 51000 },
  ];

  const costPerUnitData = [
    { name: 'Week 1', Cost: 250 },
    { name: 'Week 2', Cost: 245 },
    { name: 'Week 3', Cost: 240 },
    { name: 'Week 4', Cost: 242 },
  ];
  
  const productionMarginData = [
    { name: 'Q1', Margin: 18 },
    { name: 'Q2', Margin: 21 },
    { name: 'Q3', Margin: 19 },
    { name: 'Q4', Margin: 22 },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 8px 0', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Manufacturer Ledger
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>Financial insights, cost tracking, and margins (in ₹).</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        {/* Production Cost */}
        <div style={{ gridColumn: 'span 6', backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#e2e8f0' }}>Production Cost (₹)</h2>
          <div style={{ height: '300px' }}>
            <LineChart data={productionCostData} />
          </div>
        </div>

        {/* Cost per Batch */}
        <div style={{ gridColumn: 'span 6', backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#e2e8f0' }}>Cost per Batch (₹)</h2>
          <div style={{ height: '300px' }}>
            <BarChart data={costPerBatchData} />
          </div>
        </div>

        {/* Raw Material Cost */}
        <div style={{ gridColumn: 'span 4', backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#e2e8f0' }}>Raw Material Cost (₹)</h2>
          <div style={{ height: '250px' }}>
            <StatusDonut data={rawMaterialCostData} />
          </div>
        </div>

        {/* Supplier Payments */}
        <div style={{ gridColumn: 'span 4', backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#e2e8f0' }}>Supplier Payments (₹)</h2>
          <div style={{ height: '250px' }}>
            <StatusDonut data={supplierPaymentsData} />
          </div>
        </div>

        {/* Cost per Unit & Margin */}
        <div style={{ gridColumn: 'span 4', backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#e2e8f0' }}>Cost per Unit (₹)</h2>
            <div style={{ height: '100px' }}>
              <LineChart data={costPerUnitData} />
            </div>
          </div>
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '16px', color: '#e2e8f0' }}>Production Margin (%)</h2>
            <div style={{ height: '100px' }}>
              <BarChart data={productionMarginData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SupplierScorecard() {
  const scorecardData = [
    { supplier: 'Supplier A', onTime: '98%', quality: '99%', priceStability: 'High', overall: 96 },
    { supplier: 'Supplier B', onTime: '85%', quality: '90%', priceStability: 'Medium', overall: 82 },
    { supplier: 'Supplier C', onTime: '92%', quality: '95%', priceStability: 'High', overall: 89 },
    { supplier: 'Supplier D', onTime: '78%', quality: '82%', priceStability: 'Low', overall: 65 },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#0f172a', color: '#f8fafc', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '0 0 8px 0', background: 'linear-gradient(90deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Supplier Scorecard
        </h1>
        <p style={{ color: '#94a3b8', margin: 0 }}>On-Time Delivery, Quality, and Price Stability metrics.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
        {scorecardData.map((data, idx) => (
          <div key={idx} style={{ gridColumn: 'span 6', backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0, color: '#e2e8f0' }}>{data.supplier}</h2>
              <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: data.overall >= 90 ? '#10b981' : data.overall >= 80 ? '#f59e0b' : '#ef4444' }}>
                {data.overall} <span style={{ fontSize: '0.875rem', color: '#94a3b8', fontWeight: 'normal' }}>Score</span>
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 8px 0' }}>On-Time</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#38bdf8' }}>{data.onTime}</div>
              </div>
              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 8px 0' }}>Quality</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#a855f7' }}>{data.quality}</div>
              </div>
              <div style={{ backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', textAlign: 'center', border: '1px solid #334155' }}>
                <div style={{ color: '#94a3b8', fontSize: '0.875rem', margin: '0 0 8px 0' }}>Price Stability</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: data.priceStability === 'High' ? '#10b981' : data.priceStability === 'Medium' ? '#f59e0b' : '#ef4444' }}>{data.priceStability}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
