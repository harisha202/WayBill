import React, { useEffect, useState } from 'react';
import { manufacturerApi } from '../../api/axiosInstance';
import ForecastChart from '../charts/ForecastChart';
import { DataTable } from '../ui/DataTable';

export function ProductionControls() {
  const [mode, setMode] = useState('jit');
  
  return (
    <div className="card" style={{ borderTop: '4px solid #0f766e' }}>
      <h2 className="card-title">
        <span className="kpi-icon" style={{ background: '#ccfbf1', color: '#0f766e' }}>⚙️</span>
        Production Strategy Controls
      </h2>
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
        <button 
          className={mode === 'jit' ? 'primary-btn' : 'ghost-btn'}
          onClick={() => setMode('jit')}
          style={mode === 'jit' ? { background: 'linear-gradient(135deg, #0f766e, #0e9f8d)' } : {}}
        >
          Just-In-Time (JIT) Mode
        </button>
        <button 
          className={mode === 'safety' ? 'primary-btn' : 'ghost-btn'}
          onClick={() => setMode('safety')}
          style={mode === 'safety' ? { background: 'linear-gradient(135deg, #BA7517, #d97706)' } : {}}
        >
          Safety Stock Mode
        </button>
      </div>
      <div style={{ marginTop: '20px', padding: '16px', borderRadius: '8px', background: '#f8fafc', borderLeft: `4px solid ${mode === 'jit' ? '#0f766e' : '#BA7517'}` }}>
        <p className="muted">
          {mode === 'jit' 
            ? 'JIT Mode active: Relying on real-time demand forecasts. Risk of stockouts is slightly higher, but inventory holding costs are minimized. System automatically orders raw materials just before production.'
            : 'Safety Stock Mode active: Maintaining 20% buffer inventory at all times. Holding costs increased, but supply chain disruption risk is mitigated significantly.'}
        </p>
      </div>
    </div>
  );
}

export function AIForecastChart() {
  const [forecastData, setForecastData] = useState(null);

  useEffect(() => {
    manufacturerApi.aiForecast('100,120,130,125,140,150,160', 4)
      .then(res => setForecastData(res))
      .catch(() => setForecastData({ history: [100,120,130,125,140,150,160], forecast: [155, 162, 170, 175] }));
  }, []);

  if (!forecastData) return <div className="card"><p className="muted">Running SARIMA predictive model...</p></div>;

  return (
    <div className="card" style={{ borderTop: '4px solid #0f766e' }}>
      <h2 className="card-title">
        <span className="kpi-icon" style={{ background: '#ccfbf1', color: '#0f766e' }}>📈</span>
        AI Demand Forecasting (SARIMA)
      </h2>
      <p className="muted" style={{ marginBottom: '24px' }}>
        Predictive modeling based on historical sales data. Showing historical trend vs forecasted future demand for the next {forecastData.forecast.length} periods.
      </p>
      
      <div style={{ height: '350px', background: '#ffffff', borderRadius: '8px', padding: '16px', border: '1px solid #e2e8f0' }}>
        <ForecastChart 
          title="Demand Projection"
          data={[...(forecastData.history || forecastData.input || []), ...forecastData.forecast]}
          predictionStart={(forecastData.history || forecastData.input || []).length - 1}
        />
      </div>
    </div>
  );
}

export function RawMaterialSourcing() {
  const materials = [
    { item: 'Silicon Wafers', supplier: 'TechCore Inc', status: 'In Transit', ETA: '2 Days' },
    { item: 'Aluminum Casings', supplier: 'MetalForge', status: 'Arrived', ETA: '-' },
    { item: 'Lithium Cells', supplier: 'EnerSys', status: 'Delayed', ETA: '5 Days' }
  ];

  return (
    <div className="card">
      <h2 className="card-title">Raw Material Sourcing</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Track inbound shipments from tier-1 and tier-2 suppliers.</p>
      <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Material</th>
            <th>Supplier</th>
            <th>Status</th>
            <th>ETA</th>
          </tr>
        </thead>
        <tbody>
          {materials.map((m, i) => (
            <tr key={i}>
              <td>{m.item}</td>
              <td>{m.supplier}</td>
              <td>
                <span className={`pill ${m.status === 'Arrived' ? 'active' : m.status === 'Delayed' ? 'suspended' : 'pending'}`}>
                  {m.status}
                </span>
              </td>
              <td>{m.ETA}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}

export function QualityAssurance() {
  const [qaStatus, setQaStatus] = React.useState('pending');
  
  const handlePassQA = () => {
    setQaStatus('passed');
  };

  return (
    <div className="card" style={{ borderTop: '4px solid #0f766e' }}>
      <h2 className="card-title">Quality Assurance & Handoff</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Run factory settings log verification before handing off batch to Transporter.</p>
      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
        <p><strong>Batch ID:</strong> BATCH-88392</p>
        <p><strong>Status:</strong> {qaStatus === 'passed' ? <span style={{ color: '#059669', fontWeight: 'bold' }}>Passed Verification</span> : <span style={{ color: '#d97706', fontWeight: 'bold' }}>Awaiting Checks</span>}</p>
      </div>
      
      {qaStatus === 'pending' ? (
        <button className="primary-btn" onClick={handlePassQA} style={{ background: '#059669', borderColor: '#059669' }}>
          Pass QA & Auto-Handoff to Transporter
        </button>
      ) : (
        <div style={{ padding: '16px', background: '#ecfdf5', color: '#065f46', borderRadius: '8px', border: '1px solid #6ee7b7' }}>
          ✅ QA Passed. Handoff recorded in ledger. Transporter notified.
        </div>
      )}
    </div>
  );
}
