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

import ForecastChart from '../charts/ForecastChart';

export function AIForecastChart() {
  const [forecastData, setForecastData] = useState(null);

  useEffect(() => {
    manufacturerApi.aiForecast('100,120,130,125,140,150,160', 4)
      .then(res => setForecastData(res))
      .catch(() => setForecastData({ input: [100,120,130,125,140,150,160], forecast: [155, 162, 170, 175] }));
  }, []);

  if (!forecastData) return <p className="muted">Running SARIMA model...</p>;

  return (
    <div className="card">
      <h2 className="card-title">AI Demand Forecasting (SARIMA)</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Historical data vs AI predicted future demand (next {forecastData.forecast.length} periods).</p>
      
      <div style={{ height: '350px' }}>
        <ForecastChart 
          title="Demand Projection"
          data={[...forecastData.input, ...forecastData.forecast]}
          predictionStart={forecastData.input.length - 1}
        />
      </div>
    </div>
  );
}
