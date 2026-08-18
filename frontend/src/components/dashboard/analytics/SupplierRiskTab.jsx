import React, { useState } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ScatterChart, Scatter, ZAxis, Legend
} from 'recharts';
import { useAnalytics } from '../../../api/hooks/useAnalytics';
import { AnalyticsCard } from './AnalyticsCard';
import { AnalyticsSection, KPICard } from './AnalyticsSection';
import { SUPPLIER_RISK, SEMANTIC, RISK, CHART_STYLE, getRiskColor } from './chartColors';

function ChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="analytics-tooltip" style={{ background: 'var(--surface-overlay)', border: '1px solid var(--border-color)', padding: '0.75rem', borderRadius: '4px', color: 'var(--text-primary)' }}>
        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>{label || payload[0].payload.name || payload[0].payload.axis}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ color: entry.color || 'var(--text-secondary)', fontSize: '0.85rem' }}>
            {entry.name}: {entry.value}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function ViolinChart({ scores = [], selectedScore, color }) {
  if (!scores.length) return <div style={{color:'var(--muted)',textAlign:'center',padding:'2rem'}}>No score data</div>;
  
  // Build histogram bins (0 to 1 in 10 steps)
  const bins = Array.from({length:10}, (_,i) => ({ min: i*0.1, max: (i+1)*0.1, count: 0 }));
  scores.forEach(s => {
    const bi = Math.min(Math.floor(s * 10), 9);
    bins[bi].count++;
  });
  const maxCount = Math.max(...bins.map(b=>b.count), 1);
  
  const W = 600, H = 160;
  const binW = W / bins.length;
  
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem',fontSize:'0.75rem',color:'var(--muted)'}}>
        <span>Risk Score Distribution (higher = more risk)</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{height:`${H}px`}}>
        {bins.map((bin, i) => {
          const barH = (bin.count / maxCount) * (H - 40);
          const x = i * binW;
          const y = H - 30 - barH;
          const isOutlier = bin.min >= 0.8;
          const isSelected = selectedScore && selectedScore >= bin.min && selectedScore < bin.max;
          return (
            <g key={i}>
              {/* Mirror (violin shape) */}
              <rect x={x+2} y={y} width={binW-4} height={barH}
                fill={isOutlier ? (RISK?.critical || '#DC2626') : isSelected ? (SUPPLIER_RISK?.secondary || '#F97316') : color}
                rx="3" opacity={0.8} />
              <rect x={x+2} y={H-30} width={binW-4} height={barH * 0.4}
                fill={isOutlier ? (RISK?.critical || '#DC2626') : color} rx="3" opacity={0.3} />
              {/* Label */}
              <text x={x+binW/2} y={H-15} textAnchor="middle" fill="#94A3B8" fontSize="8">
                {Math.round(bin.min*100)}
              </text>
              {bin.count > 0 && (
                <text x={x+binW/2} y={y-4} textAnchor="middle" fill="#CBD5E1" fontSize="9" fontWeight="600">
                  {bin.count}
                </text>
              )}
            </g>
          );
        })}
        {/* Zero line */}
        <line x1={0} y1={H-30} x2={W} y2={H-30} stroke="#334155" strokeWidth={1} />
      </svg>
    </div>
  );
}

export function SupplierRiskTab() {
  const [filters, setFilters] = useState({ supplierId: '' });
  const [selectedIdx, setSelectedIdx] = useState(0);
  const analytics = useAnalytics('/admin/analytics/supplier-risk', filters);
  const data = analytics.data || {};
  const { loading, error, isEmpty } = analytics;

  const barData = [...(data.suppliers || [])]
    .sort((a,b) => b.overall_score - a.overall_score)
    .slice(0, 20)
    .map(s => ({
      name: s.name.length > 20 ? s.name.slice(0,18)+'...' : s.name,
      score: Math.round(s.overall_score * 100),
      risk_level: s.risk_level,
      on_time: s.on_time_pct
    }));

  const getBarColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return SEMANTIC?.success || '#059669';
      case 'medium': return RISK?.at_risk || '#F59E0B';
      case 'high': return RISK?.delayed || '#EA580C';
      case 'critical': return RISK?.critical || '#DC2626';
      default: return SUPPLIER_RISK?.primary || '#F59E0B';
    }
  };

  const selectedSupplier = data.suppliers?.[selectedIdx] || data.suppliers?.[0];
  const radarData = selectedSupplier ? [
    { axis: 'Financial', value: Math.round((selectedSupplier.financial_score||0.5) * 100), fullMark: 100 },
    { axis: 'Geopolitical', value: Math.round((selectedSupplier.geopolitical_score||0.5) * 100), fullMark: 100 },
    { axis: 'Operational', value: Math.round((selectedSupplier.operational_score||0.5) * 100), fullMark: 100 },
    { axis: 'Delivery', value: Math.round((selectedSupplier.delivery_score||0.5) * 100), fullMark: 100 },
    { axis: 'ESG', value: Math.round((selectedSupplier.esg_score||0.5) * 100), fullMark: 100 },
  ] : [];

  const scatterData = (data.suppliers || []).map(s => ({
    x: s.on_time_pct,
    y: Math.round(s.overall_score * 100),
    z: 30 + s.total_deliveries * 2,
    name: s.name,
    risk_level: s.risk_level
  }));
  
  const highRiskScatter = scatterData.filter(d => d.risk_level === 'high' || d.risk_level === 'critical');
  const normalScatter = scatterData.filter(d => d.risk_level !== 'high' && d.risk_level !== 'critical');

  return (
    <div className="analytics-tab-content">
      <AnalyticsSection title="Supplier Risk KPIs">
        <KPICard title="Total Suppliers" value={data.kpis?.total_suppliers || 0} />
        <KPICard title="Critical Suppliers" value={data.kpis?.critical_suppliers || 0} />
        <KPICard title="High Risk Suppliers" value={data.kpis?.high_risk || 0} />
        <KPICard title="Avg On-Time %" value={`${Math.round((data.kpis?.avg_on_time_pct || 0) * 100)}%`} />
      </AnalyticsSection>

      <AnalyticsSection title="Supplier Risk Overview">
        <AnalyticsCard title="Top At-Risk Suppliers" span={12} height={500} loading={loading} error={error} isEmpty={isEmpty}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={barData} margin={{ top: 20, right: 30, left: 40, bottom: 5 }} isAnimationActive={false}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE?.gridColor || '#334155'} horizontal={false} />
              <XAxis type="number" stroke={CHART_STYLE?.textColor || '#94A3B8'} />
              <YAxis dataKey="name" type="category" stroke={CHART_STYLE?.textColor || '#94A3B8'} width={120} />
              <Tooltip content={<ChartTooltip />} cursor={{fill: 'var(--hover-bg)'}} />
              <Bar dataKey="score" name="Overall Risk Score" isAnimationActive={false}>
                {barData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.risk_level)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </AnalyticsCard>
      </AnalyticsSection>

      <AnalyticsSection title="Supplier Drilldown">
        <AnalyticsCard title="Supplier Performance (Radar)" span={6} height={400} loading={loading} error={error} isEmpty={isEmpty}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData} isAnimationActive={false}>
              <PolarGrid stroke={CHART_STYLE?.gridColor || '#334155'} />
              <PolarAngleAxis dataKey="axis" stroke={CHART_STYLE?.textColor || '#94A3B8'} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke={CHART_STYLE?.textColor || '#94A3B8'} />
              <Radar name="Performance" dataKey="value" stroke={SUPPLIER_RISK?.secondary || '#F97316'} fill={SUPPLIER_RISK?.primary || '#F59E0B'} fillOpacity={0.25} isAnimationActive={false} />
              <Tooltip content={<ChartTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        </AnalyticsCard>

        <AnalyticsCard title="On-Time % vs Overall Risk" span={6} height={400} loading={loading} error={error} isEmpty={isEmpty}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }} isAnimationActive={false}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE?.gridColor || '#334155'} />
              <XAxis dataKey="x" type="number" name="On-Time %" stroke={CHART_STYLE?.textColor || '#94A3B8'} />
              <YAxis dataKey="y" type="number" name="Risk Score" stroke={CHART_STYLE?.textColor || '#94A3B8'} />
              <ZAxis dataKey="z" type="number" range={[10, 200]} name="Deliveries" />
              <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter name="Normal/Low Risk" data={normalScatter} fill={SUPPLIER_RISK?.primary || '#F59E0B'} isAnimationActive={false} />
              <Scatter name="High/Critical Risk" data={highRiskScatter} fill={RISK?.critical || '#DC2626'} isAnimationActive={false} />
            </ScatterChart>
          </ResponsiveContainer>
        </AnalyticsCard>
      </AnalyticsSection>

      <AnalyticsSection title="Risk Distribution">
        <AnalyticsCard title="Risk Score Density" span={12} height={320} loading={loading} error={error} isEmpty={isEmpty}>
          <ViolinChart scores={data.all_scores || []} selectedScore={selectedSupplier?.overall_score} color={SUPPLIER_RISK?.primary || '#F59E0B'} />
        </AnalyticsCard>
      </AnalyticsSection>
      
      {!isEmpty && !loading && (
        <AnalyticsSection title="Top Suppliers List">
          <div style={{width: '100%', overflowX: 'auto', background: 'var(--surface-bg)', borderRadius: '8px', padding: '1rem', border: '1px solid var(--border-color)'}}>
            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left'}}>
              <thead>
                <tr style={{borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)'}}>
                  <th style={{padding: '0.75rem'}}>Supplier</th>
                  <th style={{padding: '0.75rem'}}>Tier</th>
                  <th style={{padding: '0.75rem'}}>Risk Level</th>
                  <th style={{padding: '0.75rem'}}>Overall Score</th>
                  <th style={{padding: '0.75rem'}}>On-Time %</th>
                  <th style={{padding: '0.75rem'}}>Disputes</th>
                </tr>
              </thead>
              <tbody>
                {(data.suppliers || []).slice(0, 10).map((s, idx) => (
                  <tr key={s.supplier_id} style={{borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: selectedIdx === idx ? 'var(--hover-bg)' : 'transparent'}} onClick={() => setSelectedIdx(idx)}>
                    <td style={{padding: '0.75rem'}}>{s.name}</td>
                    <td style={{padding: '0.75rem'}}>{s.tier || '-'}</td>
                    <td style={{padding: '0.75rem'}}>
                      <span style={{padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', background: getRiskColor ? getRiskColor(s.risk_level) : (s.risk_level === 'critical' ? '#DC2626' : s.risk_level === 'high' ? '#EA580C' : '#F59E0B'), color: '#fff'}}>
                        {s.risk_level}
                      </span>
                    </td>
                    <td style={{padding: '0.75rem'}}>{Math.round(s.overall_score * 100)}</td>
                    <td style={{padding: '0.75rem'}}>{Math.round((s.on_time_pct || 0) * 100)}%</td>
                    <td style={{padding: '0.75rem'}}>{s.dispute_count || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnalyticsSection>
      )}
    </div>
  );
}
