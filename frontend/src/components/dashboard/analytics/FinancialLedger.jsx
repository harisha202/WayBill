import React, { useState } from 'react';
import {
  ResponsiveContainer, ComposedChart, Line, Area, Bar, BarChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
  Treemap, ScatterChart, Scatter, ZAxis, ReferenceLine, LineChart
} from 'recharts';
import { useAnalytics } from '../../../api/hooks/useAnalytics';
import { AnalyticsCard } from './AnalyticsCard';
import { AnalyticsSection, KPICard } from './AnalyticsSection';
import { FINANCIAL, SEMANTIC, RISK, VERIFICATION, CHART_STYLE, getVerificationColor } from './chartColors';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="analytics-tooltip">
      {label && <div className="analytics-tooltip-label">{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className="analytics-tooltip-row">
          <span style={{display:'flex',alignItems:'center',gap:'6px'}}>
            <span className="analytics-tooltip-dot" style={{background:entry.color}} />
            {entry.name}
          </span>
          <strong>{typeof entry.value === 'number' ? entry.value.toLocaleString(undefined,{maximumFractionDigits:0}) : entry.value}</strong>
        </div>
      ))}
    </div>
  );
}

function WaterfallChart({ waterfall }) {
  if (!waterfall?.length) return <div style={{color:'var(--muted)',textAlign:'center',padding:'2rem'}}>No waterfall data</div>;
  
  const { wfData } = waterfall.reduce((acc, item) => {
    const base = item.type === 'revenue' ? 0 : Math.min(acc.running, acc.running + item.value);
    const barVal = Math.abs(item.value);
    const nextRunning = (item.type !== 'profit' && item.type !== 'negative') ? acc.running + item.value : acc.running;
    acc.wfData.push({
      name: item.name,
      base: Math.max(0, base),
      value: barVal,
      type: item.type,
      color: item.type === 'revenue' ? FINANCIAL.revenue
           : item.type === 'profit' ? FINANCIAL.profit
           : item.type === 'negative' ? SEMANTIC.critical
           : FINANCIAL.cost
    });
    acc.running = nextRunning;
    return acc;
  }, { running: 0, wfData: [] });
  
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={wfData} margin={{top:10,right:10,left:0,bottom:0}}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
        <XAxis dataKey="name" tick={{fill:'#94A3B8',fontSize:11}} />
        <YAxis tick={{fill:'#94A3B8',fontSize:11}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="base" stackId="wf" fill="transparent" isAnimationActive={false} />
        <Bar dataKey="value" stackId="wf" name="Amount" radius={[4,4,0,0]} isAnimationActive={false}>
          {wfData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Bar>
      </ComposedChart>
    </ResponsiveContainer>
  );
}

const CustomTreemapContent = ({ x, y, width, height, name, value, color }) => (
  <g>
    <rect x={x+1} y={y+1} width={width-2} height={height-2}
      fill={color} rx="4" style={{cursor:'pointer'}} />
    {width > 60 && height > 30 && (
      <>
        <text x={x+width/2} y={y+height/2-6} textAnchor="middle"
          fill="white" fontSize="11" fontWeight="600">
          {name}
        </text>
        <text x={x+width/2} y={y+height/2+10} textAnchor="middle" fill="rgba(255,255,255,0.8)" fontSize="9">
          {value >= 1000 ? `${(value/1000).toFixed(1)}k` : value.toFixed(0)}
        </text>
      </>
    )}
  </g>
);

function CostMekko({ monthly, costColors }) {
  if (!monthly?.length) return <div style={{color:'var(--muted)',padding:'1rem',textAlign:'center'}}>No monthly cost data</div>;
  const categories = ['Transportation','Warehouse','Handling','Procurement','Other'];
  const totals = monthly.map(m => categories.reduce((s,c) => s+(m[c]||0), 0));
  const grandTotal = totals.reduce((s,t)=>s+t,0);
  if (!grandTotal) return null;
  
  return (
    <div style={{overflowX:'auto'}}>
      <svg width="100%" viewBox="0 0 800 220" style={{height:'220px'}}>
        {monthly.slice(-6).map((m, mi) => {
          const monthTotal = totals[monthly.indexOf(m)] || 1;
          const colWidth = (monthTotal / grandTotal) * 800;
          const xStart = monthly.slice(-6).slice(0,mi).reduce((s,mm) => {
            const idx = monthly.indexOf(mm);
            return s + ((totals[idx]||0) / grandTotal) * 800;
          }, 0);
          let yOffset = 0;
          return (
            <g key={m.month}>
              {categories.map(cat => {
                const val = m[cat] || 0;
                const segH = (val / monthTotal) * 180;
                const y = yOffset;
                yOffset += segH;
                return (
                  <rect key={cat} x={xStart+1} y={y} width={colWidth-2} height={segH}
                    fill={costColors[cat]} opacity={0.85} rx="1">
                    <title>{m.month} - {cat}: {val.toFixed(0)}</title>
                  </rect>
                );
              })}
              <text x={xStart+colWidth/2} y={195} textAnchor="middle" fill="#94A3B8" fontSize="9">
                {m.month?.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function FinancialLedger() {
  const [filters, setFilters] = useState({ dateFrom:'', dateTo:'', entityType:'all' });
  const analytics = useAnalytics('/admin/analytics/financial', filters);
  const data = analytics.data || {};
  const { loading, error, isEmpty } = analytics;

  const COST_COLORS = {
    Transportation: FINANCIAL.transportation,
    Warehouse: FINANCIAL.warehouse,
    Handling: FINANCIAL.handling,
    Procurement: FINANCIAL.procurement,
    Other: FINANCIAL.other
  };

  // Section 1 Derived
  const marginScatter = (data.revenue_cost_trend || []).map(m => ({
    x: Math.round(m.revenue),
    y: m.margin,
    isLowMargin: m.margin < 15,
    isNegative: m.margin < 0,
    month: m.month
  }));
  const scatterNormal = marginScatter.filter(d => !d.isLowMargin && !d.isNegative);
  const scatterLow = marginScatter.filter(d => d.isLowMargin && !d.isNegative);
  const scatterNeg = marginScatter.filter(d => d.isNegative);

  const targetData = (data.revenue_cost_trend || []).map((m, i, arr) => ({
    month: m.month,
    actual: Math.round(m.revenue),
    target: i > 0 ? Math.round(arr[i-1].revenue * 1.05) : Math.round(m.revenue * 0.95),
    profit: Math.round(m.profit)
  })).map(d => ({
    ...d,
    color: d.actual >= d.target ? FINANCIAL.revenue : (d.actual >= d.target * 0.9 ? SEMANTIC.warning : SEMANTIC.critical)
  }));

  // Section 2 Derived
  const donutData = Object.entries(data.cost_totals || {}).map(([name, value]) => ({
    name, value, color: COST_COLORS[name] || SEMANTIC.neutral
  })).filter(d => d.value > 0);

  const treemapData = Object.entries(data.cost_totals || {})
    .filter(([,v])=>v>0)
    .map(([name,value]) => ({ name, value, color: COST_COLORS[name] }))
    .sort((a,b)=>b.value-a.value);

  // Section 3 Derived
  const verifData = (data.verification_summary || []).map(d => ({
    name: d.status, value: d.count, amount: d.amount,
    color: getVerificationColor(d.status)
  }));
  
  const totalTxns = (data.verification_summary || []).reduce((s,d)=>s+d.count,0);
  const verifiedCount = (data.verification_summary || []).find(d=>d.status==='Verified')?.count || 0;
  const slaTarget = 90; 
  const actualPct = totalTxns > 0 ? Math.round((verifiedCount / totalTxns) * 100) : 0;

  const entityBarData = (data.verification_by_entity || []).map(e => ({
    entity: e.entity,
    Verified: e.verified,
    Pending: e.total - e.verified,
    total: e.total
  }));

  return (
    <div className="analytics-page">
      <div className="analytics-page-header">
        <h1 className="analytics-page-title">Financial Ledger</h1>
        <p className="analytics-page-subtitle">Revenue, Cost, Profitability & Verification Intelligence</p>
      </div>

      <div className="analytics-filter-bar" style={{marginBottom:'1.5rem'}}>
        <select className="analytics-filter-select" value={filters.entityType}
          onChange={e => setFilters(f=>({...f,entityType:e.target.value}))}>
          <option value="all">All Entities</option>
          <option value="manufacturer">Manufacturers</option>
          <option value="transporter">Transporters</option>
          <option value="dealer">Dealers</option>
        </select>
        <input type="date" className="analytics-filter-select" value={filters.dateFrom}
          onChange={e=>setFilters(f=>({...f,dateFrom:e.target.value}))} />
        <input type="date" className="analytics-filter-select" value={filters.dateTo}
          onChange={e=>setFilters(f=>({...f,dateTo:e.target.value}))} />
        <button className="analytics-filter-select" onClick={analytics.refetch}
          style={{cursor:'pointer',background:FINANCIAL.primary,color:'white',border:'none'}}>Refresh</button>
      </div>

      <AnalyticsSection 
        title="Revenue vs Cost" 
        description="Financial performance trend"
        kpis={
          <>
            <KPICard label="Total Revenue" value={Math.round(data.kpis?.total_revenue || 0)} unit="" icon="💰" color={FINANCIAL.revenue} />
            <KPICard label="Total Cost" value={Math.round(data.kpis?.total_cost || 0)} icon="📦" color={FINANCIAL.cost} />
            <KPICard label="Net Profit" value={Math.round(data.kpis?.total_profit || 0)} icon="📈" color={data.kpis?.total_profit >= 0 ? FINANCIAL.profit : SEMANTIC.critical} />
            <KPICard label="Avg Margin" value={data.kpis?.avg_margin} unit="%" icon="📊" color={FINANCIAL.primary} />
          </>
        }
      >
        <div style={{display:'grid',gridTemplateColumns:'repeat(12, 1fr)',gap:'1.5rem'}}>
          <div style={{gridColumn:'span 12'}}>
            <AnalyticsCard title="Revenue, Cost & Profit" loading={loading} error={error} isEmpty={isEmpty} height={480}>
              <ResponsiveContainer width="100%" height={420}>
                <ComposedChart data={data.revenue_cost_trend || []} margin={{top:10,right:20,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                  <XAxis dataKey="month" tick={{fill:'#94A3B8',fontSize:11}} tickFormatter={v=>v?.slice(5)} />
                  <YAxis tick={{fill:'#94A3B8',fontSize:11}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconType="line" wrapperStyle={{fontSize:'12px',paddingTop:'8px'}} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" fill={FINANCIAL.revenue} stroke={FINANCIAL.revenue}
                    fillOpacity={CHART_STYLE.areaOpacity} strokeWidth={CHART_STYLE.strokeWidth} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="cost" name="Cost" stroke={FINANCIAL.cost}
                    strokeWidth={CHART_STYLE.strokeWidth} strokeDasharray="4 2" dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="profit" name="Profit" stroke={FINANCIAL.profit}
                    strokeWidth={CHART_STYLE.strokeWidth} dot={{r:3,fill:FINANCIAL.profit}} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </AnalyticsCard>
          </div>
          
          <div style={{gridColumn:'span 6'}}>
            <AnalyticsCard title="Profit Waterfall" loading={loading} error={error} isEmpty={isEmpty} height={380}>
              <WaterfallChart waterfall={data.waterfall} />
            </AnalyticsCard>
          </div>

          <div style={{gridColumn:'span 6'}}>
            <AnalyticsCard title="Revenue vs Margin" loading={loading} error={error} isEmpty={isEmpty} height={380}>
              <ResponsiveContainer width="100%" height={320}>
                <ScatterChart margin={{top:10,right:20,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                  <XAxis dataKey="x" type="number" name="Revenue" tick={{fill:'#94A3B8',fontSize:11}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v} />
                  <YAxis dataKey="y" type="number" name="Margin" tick={{fill:'#94A3B8',fontSize:11}} tickFormatter={v=>`${v}%`} />
                  <ZAxis dataKey="month" type="category" name="Month" />
                  <Tooltip content={<ChartTooltip />} cursor={{strokeDasharray: '3 3'}} />
                  <Scatter name="Healthy" data={scatterNormal} fill={FINANCIAL.primary} isAnimationActive={false} />
                  <Scatter name="Low Margin" data={scatterLow} fill={SEMANTIC.warning} isAnimationActive={false} />
                  <Scatter name="Negative" data={scatterNeg} fill={SEMANTIC.critical} isAnimationActive={false} />
                </ScatterChart>
              </ResponsiveContainer>
            </AnalyticsCard>
          </div>

          <div style={{gridColumn:'span 12'}}>
            <AnalyticsCard title="Actual vs Target Revenue" loading={loading} error={error} isEmpty={isEmpty} height={380}>
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={targetData} margin={{top:10,right:20,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                  <XAxis dataKey="month" tick={{fill:'#94A3B8',fontSize:11}} tickFormatter={v=>v?.slice(5)} />
                  <YAxis tick={{fill:'#94A3B8',fontSize:11}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{fontSize:'12px',paddingTop:'8px'}} />
                  <Bar dataKey="actual" name="Actual Revenue" isAnimationActive={false}>
                    {targetData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                  <Line type="step" dataKey="target" name="Target" stroke={FINANCIAL.secondary} strokeWidth={2} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </AnalyticsCard>
          </div>
        </div>
      </AnalyticsSection>

      <hr className="analytics-divider" />

      <AnalyticsSection title="Cost Breakdown" description="Cost composition and category analysis">
        <div style={{display:'grid',gridTemplateColumns:'repeat(12, 1fr)',gap:'1.5rem'}}>
          <div style={{gridColumn:'span 12'}}>
            <AnalyticsCard title="Cost Composition" loading={loading} error={error} isEmpty={isEmpty} height={480}>
              <ResponsiveContainer width="100%" height={420}>
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={90} outerRadius={160}
                    paddingAngle={2} isAnimationActive={false} label={({name,percent})=>`${name} ${(percent*100).toFixed(1)}%`}>
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{fontSize:'12px'}} />
                </PieChart>
              </ResponsiveContainer>
            </AnalyticsCard>
          </div>

          <div style={{gridColumn:'span 6'}}>
            <AnalyticsCard title="Cost Trend by Category" loading={loading} error={error} isEmpty={isEmpty} height={380}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={data.cost_breakdown_monthly || []} margin={{top:10,right:10,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                  <XAxis dataKey="month" tick={{fill:'#94A3B8',fontSize:11}} tickFormatter={v=>v?.slice(5)} />
                  <YAxis tick={{fill:'#94A3B8',fontSize:11}} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{fontSize:'12px'}} />
                  <Bar dataKey="Transportation" stackId="cost" fill={COST_COLORS.Transportation} name="Transportation" isAnimationActive={false} />
                  <Bar dataKey="Warehouse" stackId="cost" fill={COST_COLORS.Warehouse} name="Warehouse" isAnimationActive={false} />
                  <Bar dataKey="Handling" stackId="cost" fill={COST_COLORS.Handling} name="Handling" isAnimationActive={false} />
                  <Bar dataKey="Procurement" stackId="cost" fill={COST_COLORS.Procurement} name="Procurement" isAnimationActive={false} />
                  <Bar dataKey="Other" stackId="cost" fill={COST_COLORS.Other} name="Other" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsCard>
          </div>

          <div style={{gridColumn:'span 6'}}>
            <AnalyticsCard title="Cost Hierarchy" loading={loading} error={error} isEmpty={isEmpty} height={380}>
              <ResponsiveContainer width="100%" height={320}>
                <Treemap data={treemapData} dataKey="value" content={<CustomTreemapContent />} isAnimationActive={false}>
                  <Tooltip content={<ChartTooltip />} />
                </Treemap>
              </ResponsiveContainer>
            </AnalyticsCard>
          </div>

          <div style={{gridColumn:'span 12'}}>
            <AnalyticsCard title="Monthly Cost Distribution" loading={loading} error={error} isEmpty={isEmpty} height={320}>
              <CostMekko monthly={data.cost_breakdown_monthly} costColors={COST_COLORS} />
            </AnalyticsCard>
          </div>
        </div>
      </AnalyticsSection>

      <hr className="analytics-divider" />

      <AnalyticsSection title="Ledger Verification" description="Transaction verification status and SLA">
        <div style={{display:'grid',gridTemplateColumns:'repeat(12, 1fr)',gap:'1.5rem'}}>
          <div style={{gridColumn:'span 12'}}>
            <AnalyticsCard title="Verification Status" loading={loading} error={error} isEmpty={isEmpty} height={460}>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie data={verifData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={100} outerRadius={140}
                    paddingAngle={2} isAnimationActive={false}>
                    {verifData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{fontSize:'12px'}} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                    <tspan x="50%" dy="-10" fontSize="24" fontWeight="600" fill="#334155">{totalTxns}</tspan>
                    <tspan x="50%" dy="24" fontSize="12" fill="#64748B">Transactions</tspan>
                  </text>
                </PieChart>
              </ResponsiveContainer>
            </AnalyticsCard>
          </div>

          <div style={{gridColumn:'span 6'}}>
            <AnalyticsCard title="Verification Trend" loading={loading} error={error} isEmpty={isEmpty} height={380}>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={data.verification_trend || []} margin={{top:10,right:20,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                  <XAxis dataKey="month" tick={{fill:'#94A3B8',fontSize:11}} tickFormatter={v=>v?.slice(5)} />
                  <YAxis tick={{fill:'#94A3B8',fontSize:11}} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{fontSize:'12px'}} />
                  <Line type="monotone" dataKey="Verified" stroke={VERIFICATION.verified} strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="Pending" stroke={VERIFICATION.pending} strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="Disputed" stroke={VERIFICATION.disputed} strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="Failed" stroke={VERIFICATION.failed} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </AnalyticsCard>
          </div>

          <div style={{gridColumn:'span 6'}}>
            <AnalyticsCard title="SLA Compliance" loading={loading} error={error} isEmpty={isEmpty} height={380}>
              <div style={{padding:'2rem'}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:'8px'}}>
                  <span style={{color:'#64748B',fontSize:'14px'}}>Current Compliance</span>
                  <strong style={{fontSize:'16px',color:actualPct >= slaTarget ? FINANCIAL.revenue : SEMANTIC.warning}}>{actualPct}%</strong>
                </div>
                <div style={{height:'24px',background:'#F1F5F9',borderRadius:'12px',position:'relative',overflow:'hidden'}}>
                  <div style={{height:'100%',width:`${actualPct}%`,background:actualPct >= slaTarget ? FINANCIAL.revenue : (actualPct >= slaTarget - 10 ? SEMANTIC.warning : SEMANTIC.critical)}} />
                  <div style={{position:'absolute',top:0,bottom:0,left:`${slaTarget}%`,width:'4px',background:'#334155'}} title={`Target: ${slaTarget}%`} />
                </div>
                <div style={{display:'flex',justifyContent:'space-between',marginTop:'8px',fontSize:'12px',color:'#94A3B8'}}>
                  <span>0%</span>
                  <span>Target: {slaTarget}%</span>
                  <span>100%</span>
                </div>
                <div style={{marginTop:'2rem',fontSize:'13px',color:'#475569',textAlign:'center'}}>
                  {verifiedCount} verified out of {totalTxns} total transactions.
                </div>
              </div>
            </AnalyticsCard>
          </div>

          <div style={{gridColumn:'span 12'}}>
            <AnalyticsCard title="Verification by Entity" loading={loading} error={error} isEmpty={isEmpty} height={340}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={entityBarData} margin={{top:10,right:20,left:0,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                  <XAxis dataKey="entity" tick={{fill:'#94A3B8',fontSize:11}} />
                  <YAxis tick={{fill:'#94A3B8',fontSize:11}} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{fontSize:'12px'}} />
                  <Bar dataKey="Verified" stackId="v" fill={VERIFICATION.verified} isAnimationActive={false} />
                  <Bar dataKey="Pending" stackId="v" fill={VERIFICATION.pending} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </AnalyticsCard>
          </div>
          
          <div style={{gridColumn:'span 12'}}>
             <AnalyticsCard title="Entity Details" loading={loading} error={error} isEmpty={isEmpty}>
              <div style={{overflowX:'auto',padding:'1rem'}}>
                <table style={{width:'100%',borderCollapse:'collapse',textAlign:'left',fontSize:'13px'}}>
                  <thead>
                    <tr style={{borderBottom:'1px solid #E2E8F0'}}>
                      <th style={{padding:'12px 8px',color:'#475569'}}>Entity</th>
                      <th style={{padding:'12px 8px',color:'#475569',textAlign:'right'}}>Total Transactions</th>
                      <th style={{padding:'12px 8px',color:'#475569',textAlign:'right'}}>Verified</th>
                      <th style={{padding:'12px 8px',color:'#475569',textAlign:'right'}}>Pending/Other</th>
                      <th style={{padding:'12px 8px',color:'#475569',textAlign:'right'}}>Compliance %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entityBarData.map((e,i) => {
                      const pct = e.total ? Math.round((e.Verified/e.total)*100) : 0;
                      return (
                        <tr key={i} style={{borderBottom:'1px solid #F1F5F9'}}>
                          <td style={{padding:'12px 8px',fontWeight:'500'}}>{e.entity}</td>
                          <td style={{padding:'12px 8px',textAlign:'right'}}>{e.total.toLocaleString()}</td>
                          <td style={{padding:'12px 8px',textAlign:'right',color:VERIFICATION.verified}}>{e.Verified.toLocaleString()}</td>
                          <td style={{padding:'12px 8px',textAlign:'right',color:VERIFICATION.pending}}>{e.Pending.toLocaleString()}</td>
                          <td style={{padding:'12px 8px',textAlign:'right',fontWeight:'600',color:pct>=90?FINANCIAL.revenue:pct>=80?SEMANTIC.warning:SEMANTIC.critical}}>{pct}%</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </AnalyticsCard>
          </div>
        </div>
      </AnalyticsSection>
    </div>
  );
}
