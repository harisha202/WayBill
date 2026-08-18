import React, { useState } from 'react';
import {
  ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell,
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { useAnalytics } from '../../../api/hooks/useAnalytics';
import { AnalyticsCard } from './AnalyticsCard';
import { AnalyticsSection, KPICard } from './AnalyticsSection';
import {
  CONTROL_TOWER, SEMANTIC, RISK, INVENTORY_HEALTH, CHART_STYLE,
  getRiskColor, getInventoryHealthColor
} from './chartColors';

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="analytics-tooltip">
      {label && <div className="analytics-tooltip-label">{label}</div>}
      {payload.map((entry, i) => (
        <div key={i} className="analytics-tooltip-row">
          <span style={{ display:'flex', alignItems:'center', gap:'6px' }}>
            <span className="analytics-tooltip-dot" style={{ background: entry.color || entry.payload?.fill }} />
            {entry.name}
          </span>
          <strong>{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</strong>
        </div>
      ))}
    </div>
  );
}

function RangeBullet({ data: shipmentRisk }) {
  const totalShipments = (shipmentRisk || []).reduce((s,r)=>s+r.count,0);
  const criticalCount = (shipmentRisk || []).find(r=>r.level==='Critical')?.count || 0;
  const delayedCount = (shipmentRisk || []).find(r=>r.level==='Delayed')?.count || 0;
  const slaTarget = 95; 
  const actualPct = totalShipments > 0 ? Math.round(((totalShipments - criticalCount - delayedCount) / totalShipments) * 100) : 0;
  
  return (
    <div style={{ padding: '1.5rem 0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1rem', fontSize:'0.875rem' }}>
        <span style={{fontWeight:600,color:'var(--text)'}}>SLA Compliance (On-Time %)</span>
        <span style={{fontWeight:700, color: actualPct >= slaTarget ? SEMANTIC.success : SEMANTIC.critical}}>{actualPct}%</span>
      </div>
      <div style={{ position:'relative', height:'24px', borderRadius:'4px', background: RISK.critical, overflow:'hidden' }}>
        <div style={{ position:'absolute', left:0, top:0, height:'100%', width:'70%', background: RISK.delayed }} />
        <div style={{ position:'absolute', left:0, top:0, height:'100%', width:'85%', background: RISK.at_risk }} />
        <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${actualPct}%`, background: CONTROL_TOWER.primary, borderRadius:'4px', transition:'width 0.6s' }} />
        <div style={{ position:'absolute', left:`${slaTarget}%`, top:0, height:'100%', width:'2px', background:'white', opacity:0.9 }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.5rem', fontSize:'0.75rem', color:'var(--muted)' }}>
        <span>0%</span>
        <span style={{ color:'white', background: RISK.at_risk, padding:'1px 6px', borderRadius:'3px' }}>SLA Target: {slaTarget}%</span>
        <span>100%</span>
      </div>
      <div className="analytics-legend" style={{ justifyContent:'flex-start', marginTop:'0.75rem' }}>
        {[['Actual', CONTROL_TOWER.primary],['Warning Zone', RISK.at_risk],['Delayed Zone', RISK.delayed],['Critical Zone', RISK.critical]]
          .map(([name, color]) => (
            <div key={name} className="analytics-legend-item">
              <span className="analytics-legend-dot" style={{background:color}} />
              {name}
            </div>
          ))}
      </div>
    </div>
  );
}

function InventoryHeatmap({ items }) {
  if (!items?.length) return <div style={{color:'var(--muted)',textAlign:'center',padding:'2rem'}}>No inventory data</div>;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(48px,1fr))', gap:'4px', maxHeight:'280px', overflowY:'auto', padding:'0.5rem' }}>
      {items.map(item => (
        <div key={item.sku} title={`${item.name}: ${item.available_stock} units (${item.health})`}
          style={{
            aspectRatio:'1', borderRadius:'4px', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:'9px', fontWeight:600, color:'white', textAlign:'center', padding:'2px',
            cursor:'pointer', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
            background: getInventoryHealthColor(item.health),
            opacity: item.health === 'Healthy' ? 0.85 : 1
          }}
        >
          {item.sku?.slice(0,4)}
        </div>
      ))}
    </div>
  );
}

function MekkoChart({ items }) {
  if (!items?.length) return <div style={{color:'var(--muted)',padding:'1rem',textAlign:'center'}}>No inventory value data</div>;
  const groups = {};
  items.forEach(item => {
    if (!groups[item.health]) groups[item.health] = [];
    groups[item.health].push(item);
  });
  const healthOrder = ['Healthy', 'Low', 'Critical', 'Overstock'];
  const totalValue = items.reduce((s, i) => s + (i.available_stock || 0) * (i.price || 0), 0);
  if (totalValue === 0) return <div style={{color:'var(--muted)',padding:'1rem',textAlign:'center'}}>No inventory value data</div>;
  let xOffset = 0;
  return (
    <div style={{ overflowX:'auto', paddingTop:'1rem' }}>
      <svg width="100%" viewBox="0 0 800 200" preserveAspectRatio="none" style={{height:'200px'}}>
        {healthOrder.filter(h => groups[h]?.length).map(health => {
          const groupItems = groups[health] || [];
          const groupValue = groupItems.reduce((s, i) => s + (i.available_stock || 0) * (i.price || 0), 0);
          const groupWidth = (groupValue / totalValue) * 800;
          const baseColor = getInventoryHealthColor(health);
          const x = xOffset;
          xOffset += groupWidth;
          let yOffset = 0;
          return (
            <g key={health}>
              {groupItems.slice(0, 8).map((item, idx) => {
                const itemValue = (item.available_stock || 0) * (item.price || 0);
                const itemHeight = (itemValue / groupValue) * 180;
                const y = yOffset;
                yOffset += itemHeight;
                const opacity = 0.5 + (idx % 3) * 0.15;
                return (
                  <rect key={item.sku} x={x+1} y={y} width={Math.max(groupWidth-2, 0)} height={itemHeight}
                    fill={baseColor} opacity={opacity} rx="1">
                    <title>{item.name} ({item.health}): {item.available_stock} units</title>
                  </rect>
                );
              })}
              <text x={x + groupWidth/2} y={195} textAnchor="middle" fill="#94A3B8" fontSize="10">
                {health}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function ControlTower() {
  const [filters, setFilters] = useState({ dateFrom: '', dateTo: '', status: 'all' });
  const analytics = useAnalytics('/admin/analytics/control-tower', filters);
  const data = analytics.data || {};

  // Funnel Data
  const FUNNEL_STAGE_ORDER = ['created','confirmed','processing','dispatched','in_transit','delivered','completed'];
  const funnelData = (() => {
    const pipeline = data.order_pipeline || [];
    const stageMap = {};
    pipeline.forEach(p => { stageMap[p.stage?.toLowerCase().replace(/\s+/g,'_')] = p.count; });
    return FUNNEL_STAGE_ORDER.map((s, i) => ({
      name: s.replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase()),
      value: stageMap[s] || 0,
      fill: CONTROL_TOWER.stages?.[i] || CONTROL_TOWER.primary
    })).filter(d => d.value > 0);
  })();

  const completionRate = data.completion_rate || 0;
  const isRateSuccess = completionRate >= 80;

  const riskData = (data.shipment_risk || []).map(d => ({
    name: d.level, value: d.count, color: getRiskColor(d.level)
  }));

  const scatterData = (data.shipment_scatter || []).map(d => ({
    x: d.weight, y: d.delay_minutes, z: (d.risk_score || 0) * 10 + 5,
    isCritical: d.risk_score >= 0.8,
    name: d.id
  }));

  const sortedItems = [...(data.inventory_items || [])].sort((a,b) => {
    const priority = {Critical:0, Low:1, Overstock:2, Healthy:3};
    return (priority[a.health]??9) - (priority[b.health]??9);
  }).slice(0, 15);

  const getStatusColor = (status) => {
    const s = status.toLowerCase();
    if (s.includes('completed') || s.includes('delivered')) return SEMANTIC.success;
    if (s.includes('pending') || s.includes('created')) return CONTROL_TOWER.primary;
    if (s.includes('transit') || s.includes('dispatched')) return CONTROL_TOWER.secondary;
    return CHART_STYLE.colors[3];
  };

  const invBreakdown = data.inventory_health_breakdown || [];

  return (
    <div className="analytics-page">
      <div className="analytics-page-header">
        <h1 className="analytics-page-title">Control Tower</h1>
        <p className="analytics-page-subtitle">Operations, Orders, Shipments & Inventory Intelligence</p>
      </div>

      <div className="analytics-filter-bar" style={{marginBottom:'1.5rem', display:'flex', gap:'1rem'}}>
        <select className="analytics-filter-select" value={filters.status}
          onChange={e => setFilters(f => ({...f, status: e.target.value}))}>
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="in_transit">In Transit</option>
        </select>
        <input type="date" className="analytics-filter-select" value={filters.dateFrom}
          onChange={e => setFilters(f => ({...f, dateFrom: e.target.value}))} />
        <input type="date" className="analytics-filter-select" value={filters.dateTo}
          onChange={e => setFilters(f => ({...f, dateTo: e.target.value}))} />
        <button className="analytics-filter-select" onClick={analytics.refetch}
          style={{ cursor:'pointer', background:'var(--blue)', color:'white', border:'none', padding:'0.5rem 1rem', borderRadius:'4px' }}>Refresh</button>
      </div>

      <div className="analytics-kpi-strip" style={{marginBottom:'1.75rem', display:'flex', gap:'1rem', overflowX:'auto'}}>
        <KPICard label="Total Orders" value={data.kpis?.total_orders} icon="📦" color={CONTROL_TOWER.primary} />
        <KPICard label="Completed" value={data.kpis?.completed_orders} icon="✅" color={SEMANTIC.success} />
        <KPICard label="Completion Rate" value={data.kpis?.completion_rate} unit="%" icon="📈" color={CONTROL_TOWER.primary} />
        <KPICard label="At-Risk Shipments" value={data.kpis?.total_risk_shipments} icon="⚠️" color={SEMANTIC.warning} />
        <KPICard label="Critical Inventory" value={data.kpis?.critical_inventory} icon="🔴" color={SEMANTIC.critical} />
      </div>

      <hr className="analytics-divider" />

      {/* ORDER PIPELINE */}
      <AnalyticsSection
        title="Order Pipeline"
        description="Stage conversion and order throughput"
        main={
          <AnalyticsCard title="Pipeline Funnel" subtitle="Orders by stage" loading={analytics.loading} error={analytics.error} isEmpty={!funnelData.length} emptyMessage="No orders in pipeline" onRetry={analytics.refetch} height={520}>
            <ResponsiveContainer width="100%" height={420}>
              <FunnelChart>
                <Tooltip content={<ChartTooltip />} />
                <Funnel dataKey="value" data={funnelData} isAnimationActive={false}>
                  {funnelData.map((entry, i) => (
                    <Cell key={`cell-${i}`} fill={entry.fill} />
                  ))}
                  <LabelList dataKey="name" position="right" style={{ fill: '#94A3B8', fontSize: 12 }} />
                  <LabelList dataKey="value" position="center" style={{ fill: 'white', fontSize: 13, fontWeight: 600 }} />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </AnalyticsCard>
        }
        supportingLeft={
          <AnalyticsCard title="Order Throughput" subtitle="Created vs Completed over time" loading={analytics.loading} error={analytics.error} isEmpty={!(data.order_throughput?.length)} emptyMessage="No throughput data" onRetry={analytics.refetch} height={350}>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.order_throughput || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_STYLE.gridColor} />
                <XAxis dataKey="day" stroke={CHART_STYLE.textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => v?.slice(5)} />
                <YAxis stroke={CHART_STYLE.textColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="created" name="Created" stroke={CONTROL_TOWER.primary} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="completed" name="Completed" stroke={SEMANTIC.success} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </AnalyticsCard>
        }
        supportingRight={
          <AnalyticsCard title="Orders by Status" subtitle="Current status distribution" loading={analytics.loading} error={analytics.error} isEmpty={!(data.orders_by_status?.length)} emptyMessage="No status data" onRetry={analytics.refetch} height={350}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.orders_by_status || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={CHART_STYLE.gridColor} />
                <XAxis type="number" stroke={CHART_STYLE.textColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="status" type="category" stroke={CHART_STYLE.textColor} fontSize={12} tickLine={false} axisLine={false} width={100} />
                <Tooltip content={<ChartTooltip />} cursor={{fill: 'var(--hover)'}} />
                <Bar dataKey="count" name="Orders" isAnimationActive={false} radius={[0,4,4,0]}>
                  {(data.orders_by_status || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getStatusColor(entry.status)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </AnalyticsCard>
        }
        supportingWide={
          <AnalyticsCard title="Completion Rate" loading={analytics.loading} error={analytics.error} isEmpty={!data.kpis} onRetry={analytics.refetch} height={160}>
            <div style={{ padding: '1rem 0' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                <span style={{ fontWeight:600, fontSize:'0.875rem', color:'var(--text)' }}>Order Completion Rate</span>
                <span style={{ fontWeight:700, fontSize:'1.25rem', color: isRateSuccess ? SEMANTIC.success : CONTROL_TOWER.primary }}>
                  {completionRate}%
                </span>
              </div>
              <div style={{ height:'12px', borderRadius:'6px', background:'var(--border)', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.min(completionRate,100)}%`, borderRadius:'6px',
                  background: isRateSuccess ? SEMANTIC.success : CONTROL_TOWER.primary,
                  transition: 'width 0.6s ease' }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.35rem', fontSize:'0.75rem', color:'var(--muted)' }}>
                <span>{data.kpis?.completed_orders || 0} completed</span>
                <span>Target: 80%</span>
                <span>{data.kpis?.total_orders || 0} total</span>
              </div>
            </div>
          </AnalyticsCard>
        }
      />

      <hr className="analytics-divider" />

      {/* SHIPMENT RISK */}
      <AnalyticsSection
        title="Shipment Risk"
        description="Delivery risk levels and delayed shipments"
        main={
          <AnalyticsCard title="Risk Distribution" subtitle="Shipments by risk level" loading={analytics.loading} error={analytics.error} isEmpty={!riskData.length} emptyMessage="No shipment data" onRetry={analytics.refetch} height={480}>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={80} outerRadius={150} paddingAngle={2} isAnimationActive={false}>
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize:'1.5rem', fontWeight:'bold', fill:'var(--text)' }}>
                  {data.kpis?.total_risk_shipments || 0}
                </text>
                <text x="50%" y="56%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize:'0.875rem', fill:'var(--muted)' }}>
                  Total Risk
                </text>
              </PieChart>
            </ResponsiveContainer>
          </AnalyticsCard>
        }
        supportingLeft={
          <AnalyticsCard title="Risk Trend" subtitle="Shipment risks over time" loading={analytics.loading} error={analytics.error} isEmpty={!(data.risk_trend?.length)} emptyMessage="No risk trend data" onRetry={analytics.refetch} height={360}>
            <ResponsiveContainer width="100%" height={290}>
              <LineChart data={data.risk_trend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_STYLE.gridColor} />
                <XAxis dataKey="day" stroke={CHART_STYLE.textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => v?.slice(5)} />
                <YAxis stroke={CHART_STYLE.textColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="normal" name="Normal" stroke={RISK.normal} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="at_risk" name="At Risk" stroke={RISK.at_risk} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="delayed" name="Delayed" stroke={RISK.delayed} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="critical" name="Critical" stroke={RISK.critical} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </AnalyticsCard>
        }
        supportingRight={
          <AnalyticsCard title="Weight vs Delay" subtitle="Shipment properties scatter" loading={analytics.loading} error={analytics.error} isEmpty={!scatterData.length} emptyMessage="No scatter data" onRetry={analytics.refetch} height={360}>
            <ResponsiveContainer width="100%" height={290}>
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                <XAxis dataKey="x" type="number" name="Weight" stroke={CHART_STYLE.textColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="y" type="number" name="Delay (min)" stroke={CHART_STYLE.textColor} fontSize={12} tickLine={false} axisLine={false} />
                <ZAxis dataKey="z" type="number" range={[10, 100]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Scatter name="Critical" data={scatterData.filter(d => d.isCritical)} fill={RISK.critical} isAnimationActive={false} />
                <Scatter name="Normal" data={scatterData.filter(d => !d.isCritical)} fill={CONTROL_TOWER.secondary} isAnimationActive={false} />
              </ScatterChart>
            </ResponsiveContainer>
          </AnalyticsCard>
        }
        supportingWide={
          <AnalyticsCard title="SLA Compliance" loading={analytics.loading} error={analytics.error} isEmpty={!data.shipment_risk} onRetry={analytics.refetch} height={200}>
            <RangeBullet data={data.shipment_risk} rawData={data} />
          </AnalyticsCard>
        }
      />

      <hr className="analytics-divider" />

      {/* INVENTORY HEALTH */}
      <AnalyticsSection
        title="Inventory Health"
        description="Stock levels, demand trends and health composition"
        main={
          <AnalyticsCard title="Health Breakdown" subtitle="Items by health category" loading={analytics.loading} error={analytics.error} isEmpty={!invBreakdown.length} emptyMessage="No inventory breakdown data" onRetry={analytics.refetch} height={480}>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={invBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_STYLE.gridColor} />
                <XAxis dataKey="category" stroke={CHART_STYLE.textColor} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke={CHART_STYLE.textColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{fill: 'var(--hover)'}} />
                <Bar dataKey="count" name="Items" isAnimationActive={false} radius={[4,4,0,0]}>
                  {invBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getInventoryHealthColor(entry.category)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </AnalyticsCard>
        }
        supportingLeft={
          <AnalyticsCard title="Stock vs Demand" subtitle="Trend analysis" loading={analytics.loading} error={analytics.error} isEmpty={!(data.stock_demand_trend?.length)} emptyMessage="No trend data" onRetry={analytics.refetch} height={360}>
            <ResponsiveContainer width="100%" height={290}>
              <LineChart data={data.stock_demand_trend || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_STYLE.gridColor} />
                <XAxis dataKey="day" stroke={CHART_STYLE.textColor} fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => v?.slice(5)} />
                <YAxis stroke={CHART_STYLE.textColor} fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="demand" name="Demand" stroke={CONTROL_TOWER.secondary} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="stock" name="Total Stock" stroke={CONTROL_TOWER.primary} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </AnalyticsCard>
        }
        supportingRight={
          <AnalyticsCard title="Health Grid" subtitle="SKU view" loading={analytics.loading} error={analytics.error} isEmpty={!(data.inventory_items?.length)} emptyMessage="No SKU data" onRetry={analytics.refetch} height={360}>
            <InventoryHeatmap items={data.inventory_items} />
          </AnalyticsCard>
        }
        supportingWide={
          <AnalyticsCard title="Inventory Composition" subtitle="Value-based Mekko" loading={analytics.loading} error={analytics.error} isEmpty={!(data.inventory_items?.length)} emptyMessage="No inventory composition data" onRetry={analytics.refetch} height={280}>
            <MekkoChart items={data.inventory_items} />
          </AnalyticsCard>
        }
      />
      
      {/* Detail Table */}
      <div style={{ marginTop: '1.5rem', background: 'var(--card-bg)', borderRadius: '8px', padding: '1.5rem', border: '1px solid var(--border)' }}>
        <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text)' }}>Top Inventory Items by Risk</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--muted)' }}>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>SKU</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>Health</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, textAlign: 'right' }}>Stock</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, textAlign: 'right' }}>Reorder Pt</th>
                <th style={{ padding: '0.75rem 0.5rem', fontWeight: 600, textAlign: 'right' }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.length > 0 ? sortedItems.map((item, idx) => (
                <tr key={item.sku || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text)' }}>{item.sku}</td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text)' }}>{item.name}</td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span style={{ background: getInventoryHealthColor(item.health), color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>
                      {item.health}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text)', textAlign: 'right' }}>{item.available_stock}</td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--muted)', textAlign: 'right' }}>{item.reorder_point}</td>
                  <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text)', textAlign: 'right' }}>${(item.price || 0).toFixed(2)}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)' }}>No items found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
