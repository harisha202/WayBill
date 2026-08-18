import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ZAxis, Cell, ReferenceLine
} from 'recharts';
import { useAnalytics } from '../../../api/hooks/useAnalytics';
import { AnalyticsCard } from './AnalyticsCard';
import { AnalyticsSection, KPICard } from './AnalyticsSection';
import { SUPPLY_CHAIN, SEMANTIC, RISK, CHART_STYLE, getEntityColor } from './chartColors';

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

function ForceNetwork({ data, onNodeClick }) {
  const nodes = data?.nodes || [];
  const edges = data?.edges || [];
  
  const [positions, setPositions] = useState({});
  const [selectedNode, setSelectedNode] = useState(null);
  const animRef = useRef(null);

  // Initialize positions in a circle by entity_type
  useEffect(() => {
    if (!nodes.length) return;
    const W = 800, H = 480;
    const cx = W/2, cy = H/2;
    const typeGroups = {};
    nodes.forEach(n => {
      if (!typeGroups[n.entity_type]) typeGroups[n.entity_type] = [];
      typeGroups[n.entity_type].push(n.id);
    });
    const types = Object.keys(typeGroups);
    const pos = {};
    types.forEach((type, ti) => {
      const groupAngle = (ti / types.length) * Math.PI * 2;
      const radius = 160 + (types.length > 3 ? 40 : 0);
      const gcx = cx + radius * Math.cos(groupAngle);
      const gcy = cy + radius * Math.sin(groupAngle);
      typeGroups[type].forEach((id, i) => {
        const a = (i / typeGroups[type].length) * Math.PI * 2;
        const r = 50;
        pos[id] = {
          x: gcx + r * Math.cos(a) + (Math.random()-0.5)*20,
          y: gcy + r * Math.sin(a) + (Math.random()-0.5)*20,
          vx: 0, vy: 0
        };
      });
    });
    setPositions(pos);
  }, [data]);

  // Run simple spring simulation
  useEffect(() => {
    if (!Object.keys(positions).length || !nodes.length) return;
    let pos = {...positions};
    let frames = 0;
    const _edgeSet = new Set(edges.map(e => `${e.source}-${e.target}`));

    function tick() {
      const W = 800, H = 480;
      const next = {};
      nodes.forEach(n => {
        next[n.id] = { ...pos[n.id], vx: (pos[n.id]?.vx||0)*0.85, vy: (pos[n.id]?.vy||0)*0.85 };
      });

      // Repulsion
      nodes.forEach((a, i) => {
        nodes.forEach((b, j) => {
          if (i >= j) return;
          const pa = pos[a.id] || {x:W/2,y:H/2};
          const pb = pos[b.id] || {x:W/2,y:H/2};
          const dx = pa.x - pb.x, dy = pa.y - pb.y;
          const dist = Math.max(Math.sqrt(dx*dx+dy*dy), 1);
          const force = 1800 / (dist*dist);
          if (next[a.id]) { next[a.id].vx += (dx/dist)*force; next[a.id].vy += (dy/dist)*force; }
          if (next[b.id]) { next[b.id].vx -= (dx/dist)*force; next[b.id].vy -= (dy/dist)*force; }
        });
      });

      // Attraction for edges
      edges.slice(0,50).forEach(e => {
        const pa = pos[e.source] || {x:W/2,y:H/2};
        const pb = pos[e.target] || {x:W/2,y:H/2};
        const dx = pb.x - pa.x, dy = pb.y - pa.y;
        const dist = Math.max(Math.sqrt(dx*dx+dy*dy),1);
        const target = 120;
        const force = (dist - target) * 0.05;
        if (next[e.source]) { next[e.source].vx += (dx/dist)*force; next[e.source].vy += (dy/dist)*force; }
        if (next[e.target]) { next[e.target].vx -= (dx/dist)*force; next[e.target].vy -= (dy/dist)*force; }
      });

      // Center gravity
      nodes.forEach(n => {
        if (!next[n.id]) return;
        next[n.id].vx += (W/2 - (pos[n.id]?.x||W/2)) * 0.008;
        next[n.id].vy += (H/2 - (pos[n.id]?.y||H/2)) * 0.008;
        next[n.id].x = Math.max(20, Math.min(W-20, (pos[n.id]?.x||W/2) + next[n.id].vx));
        next[n.id].y = Math.max(20, Math.min(H-20, (pos[n.id]?.y||H/2) + next[n.id].vy));
      });

      pos = next;
      frames++;
      if (frames < 60) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setPositions(next);
      }
    }
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [data, positions]);

  if (!nodes.length) return <div style={{color:'var(--muted)',textAlign:'center',padding:'2rem'}}>No network data</div>;

  const nodeRadius = (n) => n.entity_type === 'supplier' ? 8 : 10;
  const nodeColor = (n) => {
    if (n.risk_score >= 0.8) return RISK.critical;
    if (n.risk_score >= 0.6) return RISK.at_risk;
    return getEntityColor ? getEntityColor(n.entity_type) : '#4F46E5';
  };

  return (
    <div style={{ position:'relative' }}>
      <svg width="100%" viewBox="0 0 800 480" style={{ display:'block', maxHeight:'480px' }}>
        <defs>
          <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#475569" />
          </marker>
        </defs>
        {/* Edges */}
        {edges.slice(0,60).map((e, i) => {
          const ps = positions[e.source], pt = positions[e.target];
          if (!ps || !pt) return null;
          const strokeW = Math.max(1, Math.min(4, e.value / 5));
          return (
            <line key={i} x1={ps.x} y1={ps.y} x2={pt.x} y2={pt.y}
              stroke="#334155" strokeWidth={strokeW} opacity={0.5}
              markerEnd="url(#arrowhead)" />
          );
        })}
        {/* Nodes */}
        {nodes.map(n => {
          const p = positions[n.id];
          if (!p) return null;
          const r = nodeRadius(n);
          const color = nodeColor(n);
          const isSelected = selectedNode === n.id;
          return (
            <g key={n.id} onClick={() => setSelectedNode(isSelected ? null : n.id)} style={{cursor:'pointer'}}>
              <circle cx={p.x} cy={p.y} r={isSelected ? r+3 : r}
                fill={color} stroke={isSelected ? 'white' : 'rgba(255,255,255,0.2)'}
                strokeWidth={isSelected ? 2 : 1} opacity={0.9} />
              {isSelected && (
                <text x={p.x} y={p.y-r-4} textAnchor="middle" fill="#CBD5E1" fontSize="9" fontWeight="600">
                  {n.company || n.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="analytics-legend" style={{display:'flex', justifyContent:'flex-start', flexWrap:'wrap', gap:'0.75rem', marginTop:'0.75rem'}}>
        {[
          ['Supplier', SUPPLY_CHAIN?.supplier || '#4F46E5'],
          ['Manufacturer', SUPPLY_CHAIN?.manufacturer || '#7C3AED'],
          ['Transporter', SUPPLY_CHAIN?.transporter || '#8B5CF6'],
          ['Dealer', SUPPLY_CHAIN?.dealer || '#6366F1'],
          ['Retail Shop', SUPPLY_CHAIN?.retail_shop || '#A78BFA'],
          ['Critical', RISK?.critical || '#DC2626'],
          ['High Risk', RISK?.at_risk || '#F59E0B']
        ].map(([label, color]) => (
          <div key={label} className="analytics-legend-item" style={{display:'flex', alignItems:'center', fontSize:'0.8rem'}}>
            <span className="analytics-legend-dot" style={{background:color, width:'8px', height:'8px', borderRadius:'50%', marginRight:'4px', display:'inline-block'}} />
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

function SimpleSankey({ flows = [], nodes = [] }) {
  if (!flows.length) return <div style={{color:'var(--muted)',textAlign:'center',padding:'2rem'}}>No flow data</div>;
  const W = 500, H = 320;
  // Get unique sources and targets
  const sources = [...new Set(flows.map(f => f.source))];
  const targets = [...new Set(flows.map(f => f.target))];
  const maxVal = Math.max(...flows.map(f => f.value), 1);
  
  // Node lookup
  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n.name || n.company || n.id; });
  
  const colW = W / 3;
  const srcH = H / Math.max(sources.length, 1);
  const tgtH = H / Math.max(targets.length, 1);

  return (
    <div style={{overflowX:'auto'}}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{height:`${H}px`, maxHeight:'320px'}}>
        {flows.slice(0,15).map((flow, i) => {
          const si = sources.indexOf(flow.source);
          const ti = targets.indexOf(flow.target);
          const sy = si * srcH + srcH/2;
          const ty = ti * tgtH + tgtH/2;
          const thickness = Math.max(2, (flow.value / maxVal) * 20);
          const isHighValue = flow.value === Math.max(...flows.map(f=>f.value));
          const color = isHighValue ? (SUPPLY_CHAIN?.tertiary || '#3730A3') : (i < 5 ? (SUPPLY_CHAIN?.primary || '#4F46E5') : (SUPPLY_CHAIN?.secondary || '#6366F1'));
          return (
            <g key={i}>
              <path
                d={`M ${colW*0.8} ${sy} C ${colW*1.5} ${sy}, ${colW*1.5} ${ty}, ${colW*2.2} ${ty}`}
                fill="none" stroke={color} strokeWidth={thickness} opacity={0.6}
              />
            </g>
          );
        })}
        {/* Source labels */}
        {sources.slice(0,8).map((s, i) => (
          <text key={s} x={colW*0.75} y={i*srcH+srcH/2+4} textAnchor="end"
            fill="#94A3B8" fontSize="9" fontWeight="500">
            {(nodeMap[s] || s).slice(0,12)}
          </text>
        ))}
        {/* Target labels */}
        {targets.slice(0,8).map((t, i) => (
          <text key={t} x={colW*2.25} y={i*tgtH+tgtH/2+4} textAnchor="start"
            fill="#94A3B8" fontSize="9" fontWeight="500">
            {(nodeMap[t] || t).slice(0,12)}
          </text>
        ))}
      </svg>
    </div>
  );
}

function SparklineCard({ entityId, chartData, index }) {
  const colors = [
    SUPPLY_CHAIN?.primary || '#4F46E5', 
    SUPPLY_CHAIN?.secondary || '#6366F1', 
    SUPPLY_CHAIN?.tertiary || '#3730A3',
    SUPPLY_CHAIN?.quaternary || '#818CF8', 
    SUPPLY_CHAIN?.light || '#C7D2FE', 
    '#818CF8'
  ];
  const color = colors[index % colors.length];
  const values = chartData.map(d => d.count);
  const max = Math.max(...values, 1);
  const W = 120, H = 40;
  const pts = values.map((v, i) => `${(i/(values.length-1||1))*W},${H - (v/max)*H*0.9}`).join(' ');
  return (
    <div style={{ background:'var(--bg)', borderRadius:'8px', padding:'0.75rem', minWidth:'140px' }}>
      <div style={{ fontSize:'0.7rem', color:'var(--muted)', marginBottom:'0.35rem', fontWeight:500 }}>
        Entity {String(entityId).slice(-4)}
      </div>
      <svg width={W} height={H}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" />
        <circle cx={(values.length-1)/(values.length-1||1)*W} cy={H-(values[values.length-1]/max)*H*0.9}
          r="3" fill={color} />
      </svg>
      <div style={{ fontSize:'0.75rem', color, fontWeight:700 }}>{values[values.length-1] || 0} orders</div>
    </div>
  );
}

export function SupplyChainDepth() {
  const [filters] = useState({});
  const analytics = useAnalytics('/admin/analytics/supply-chain', filters);
  const data = analytics.data || {};
  const { loading, error, isEmpty } = analytics;
  
  const nodes = data.nodes || [];
  const edges = data.edges || [];
  const flows = data.sankey_flows || [];
  
  const bubbleData = (data.partner_bubbles || []).map(p => ({
    x: Math.round(p.delivery_score * 100),
    y: Math.round(p.risk_score * 100),
    z: Math.max(p.order_count * 3, 10),
    name: p.name,
    isHighRisk: p.risk_score >= 0.7
  }));

  return (
    <div className="analytics-tab-content">
      <AnalyticsSection title="Supply Chain Depth KPIs">
        <KPICard title="Total Nodes" value={data.kpis?.total_nodes || 0} />
        <KPICard title="Total Edges" value={data.kpis?.total_edges || 0} />
        <KPICard title="Total Suppliers" value={data.kpis?.total_suppliers || 0} />
        <KPICard title="Active Flows" value={data.kpis?.active_flows || 0} />
      </AnalyticsSection>

      <AnalyticsSection title="Supply Chain Network">
        <AnalyticsCard title="Force-Directed Network" span={12} height={560} loading={loading} error={error} isEmpty={isEmpty}>
          <ForceNetwork data={data} />
        </AnalyticsCard>
      </AnalyticsSection>

      <AnalyticsSection title="Flows & Volumes">
        <AnalyticsCard title="Value Chain Flow" span={6} height={400} loading={loading} error={error} isEmpty={isEmpty}>
          <SimpleSankey flows={flows} nodes={nodes} />
        </AnalyticsCard>

        <AnalyticsCard title="Partner Volume vs Risk" span={6} height={400} loading={loading} error={error} isEmpty={isEmpty}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }} isAnimationActive={false}>
              <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE?.gridColor || '#334155'} />
              <XAxis dataKey="x" type="number" name="Delivery Score" stroke={CHART_STYLE?.textColor || '#94A3B8'} />
              <YAxis dataKey="y" type="number" name="Risk Score" stroke={CHART_STYLE?.textColor || '#94A3B8'} />
              <ZAxis dataKey="z" type="number" range={[10, 200]} name="Order Count" />
              <Tooltip content={<ChartTooltip />} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Partners" data={bubbleData} isAnimationActive={false}>
                {bubbleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.isHighRisk ? (RISK?.critical || '#DC2626') : (SUPPLY_CHAIN?.primary || '#4F46E5')} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </AnalyticsCard>
      </AnalyticsSection>

      <AnalyticsSection title="Micro Activity">
        <AnalyticsCard title="Entity Sparklines" span={12} height={280} loading={loading} error={error} isEmpty={isEmpty}>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'0.75rem' }}>
            {(data.micro_charts || []).map((mc, i) => (
              <SparklineCard key={mc.entity_id} entityId={mc.entity_id} chartData={mc.data} index={i} />
            ))}
            {!(data.micro_charts?.length) && (
              <div style={{color:'var(--muted)',padding:'1rem'}}>No activity data available</div>
            )}
          </div>
        </AnalyticsCard>
      </AnalyticsSection>
    </div>
  );
}
