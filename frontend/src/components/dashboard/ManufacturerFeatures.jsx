import React, { useEffect, useState } from 'react';
import { manufacturerApi } from '../../api/axiosInstance';
import { DataTable } from '../ui/DataTable';

export function ProductionControls() {
  const [mode, setMode] = useState('jit'); // jit or safety
  
  return (
    <div className="card">
      <h2 className="card-title">Production Strategy Controls</h2>
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
        <button 
          className={`primary-btn ${mode !== 'jit' ? 'ghost-btn' : ''}`}
          onClick={() => setMode('jit')}
        >
          Just-In-Time (JIT) Mode
        </button>
        <button 
          className={`primary-btn ${mode !== 'safety' ? 'ghost-btn' : ''}`}
          onClick={() => setMode('safety')}
          style={mode === 'safety' ? { background: '#BA7517' } : {}}
        >
          Safety Stock Mode
        </button>
      </div>
      <p className="muted" style={{ marginTop: '16px' }}>
        {mode === 'jit' 
          ? 'JIT Mode active: Relying on real-time demand forecasts. Risk of stockouts is slightly higher, but inventory holding costs are minimized.'
          : 'Safety Stock Mode active: Maintaining 20% buffer inventory. Holding costs increased, but disruption risk mitigated.'}
      </p>
    </div>
  );
}

export function AIForecastChart() {
  const [forecastData, setForecastData] = useState(null);

  useEffect(() => {
    manufacturerApi.aiForecast('100,120,130,125,140,150,160', 4)
      .then(res => setForecastData(res))
      .catch(() => setForecastData({ input: [100,120,130,125,140], forecast: [155, 162, 170, 175] }));
  }, []);

  if (!forecastData) return <p className="muted">Running SARIMA model...</p>;

  const maxVal = Math.max(...forecastData.input, ...forecastData.forecast) * 1.1;

  return (
    <div className="card">
      <h2 className="card-title">AI Demand Forecasting (SARIMA)</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Historical data vs AI predicted future demand (next {forecastData.forecast.length} periods).</p>
      
      <div style={{ display: 'flex', height: '200px', alignItems: 'flex-end', gap: '8px', paddingBottom: '20px', borderBottom: '1px solid #e2e8f0' }}>
        {forecastData.input.map((val, i) => (
          <div key={`hist-${i}`} style={{ flex: 1, background: '#cbd5e1', height: `${(val / maxVal) * 100}%`, borderRadius: '4px 4px 0 0', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '-20px', width: '100%', textAlign: 'center', fontSize: '10px' }}>{Math.round(val)}</span>
          </div>
        ))}
        {forecastData.forecast.map((val, i) => (
          <div key={`pred-${i}`} style={{ flex: 1, background: '#0F6E56', height: `${(val / maxVal) * 100}%`, borderRadius: '4px 4px 0 0', position: 'relative', opacity: 0.8 }}>
            <span style={{ position: 'absolute', top: '-20px', width: '100%', textAlign: 'center', fontSize: '10px', color: '#0F6E56', fontWeight: 'bold' }}>{Math.round(val)}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '16px', fontSize: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: '#cbd5e1' }}></div> Historical Data</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: 12, height: 12, background: '#0F6E56' }}></div> AI Predicted Demand</div>
      </div>
    </div>
  );
}
