import React, { useState } from 'react';
import { useApi } from '../../api/hooks/useApi';
import { useAnalytics } from '../../api/hooks/useAnalytics';
import { dealerApi } from '../../api/services/dealerApi';
import { DataTable } from '../ui/DataTable';
import { StatusPill } from '../ui/StatusPill';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, FunnelChart, Funnel, LabelList,
  ScatterChart, Scatter, ZAxis, ComposedChart, ReferenceLine
} from 'recharts';
import {
  DEALER_ORDERS, DEALER_INVENTORY, DEALER_PARTNERS,
  DEALER_FINANCIAL, DEALER_DISPUTES, DEALER_BATCH,
  CHART_STYLE, SEMANTIC, getDealerStatusColor
} from '../dashboard/analytics/chartColors';

// ─── Shared Constants ─────────────────────────────────────────────────────────
const DONUT_COLORS = ['#2563EB','#0D9488','#7C3AED','#F59E0B','#059669','#F97316','#06B6D4','#DC2626'];

// ─── Shared Components ────────────────────────────────────────────────────────
function DTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#1E293B', border:'1px solid rgba(148,163,184,0.2)', borderRadius:'8px', padding:'10px 14px', fontSize:'0.8125rem', color:'#F1F5F9' }}>
      {label && <div style={{ marginBottom:6, color:'#94A3B8', fontSize:'0.75rem' }}>{label}</div>}
      {payload.map((e, i) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:16 }}>
          <span style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background: e.color||e.payload?.fill, display:'inline-block' }} />
            {e.name}
          </span>
          <strong>{typeof e.value === 'number' ? e.value.toLocaleString() : e.value}</strong>
        </div>
      ))}
    </div>
  );
}

const card = { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'1.25rem 1.5rem' };
const sectionTitle = { fontSize:'0.8rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--muted)', marginBottom:'1rem' };
const chartLabel = { fontSize:'1rem', fontWeight:700, color:'var(--dashboard-heading)', margin:'0 0 0.35rem' };
const chartDesc = { fontSize:'0.78rem', color:'var(--muted)', margin:'0 0 1rem' };

function FilterBar({ dateFrom, setDateFrom, dateTo, setDateTo, onApply, onClear, extra }) {
  return (
    <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center', marginBottom:'1.5rem' }}>
      <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
        style={{ padding:'0.4rem 0.75rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--bg)', color:'var(--text)', fontSize:'0.875rem' }} />
      <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
        style={{ padding:'0.4rem 0.75rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--bg)', color:'var(--text)', fontSize:'0.875rem' }} />
      {extra}
      <button onClick={onApply} style={{ padding:'0.4rem 1rem', background:'var(--primary)', color:'white', border:'none', borderRadius:6, cursor:'pointer', fontWeight:600, fontSize:'0.875rem' }}>Apply</button>
      <button onClick={onClear} style={{ padding:'0.4rem 0.75rem', background:'var(--surface)', color:'var(--text)', border:'1px solid var(--border)', borderRadius:6, cursor:'pointer', fontSize:'0.875rem' }}>Clear</button>
    </div>
  );
}

function KPIStrip({ items }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
      {items.map((k, i) => (
        <div key={i} style={{ ...card, padding:'1.1rem 1.25rem', borderTop:`3px solid ${k.color || DEALER_ORDERS.primary}` }}>
          <p style={{ margin:'0 0 0.25rem', fontSize:'0.72rem', color:'var(--muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em' }}>{k.label}</p>
          <p style={{ margin:'0 0 0.2rem', fontSize:'1.8rem', fontWeight:800, color: k.color || 'var(--text)', lineHeight:1 }}>{k.value?.toLocaleString?.() ?? k.value ?? '—'}</p>
          {k.sub && <p style={{ margin:0, fontSize:'0.72rem', color:'var(--muted)' }}>{k.sub}</p>}
        </div>
      ))}
    </div>
  );
}

function LoadingCard({ height = 360 }) {
  return (
    <div style={{ ...card, height, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12 }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid var(--border)', borderTopColor:'var(--blue)', animation:'spin 0.8s linear infinite' }} />
      <span style={{ color:'var(--muted)', fontSize:'0.875rem' }}>Loading data…</span>
    </div>
  );
}

function ErrorCard({ msg, onRetry, height = 200 }) {
  return (
    <div style={{ ...card, height, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8 }}>
      <span style={{ fontSize:'1.5rem' }}>⚠️</span>
      <span style={{ color:'var(--text)', fontWeight:600 }}>Failed to load</span>
      <span style={{ color:'var(--muted)', fontSize:'0.78rem', textAlign:'center', maxWidth:260 }}>{msg}</span>
      {onRetry && <button onClick={onRetry} style={{ marginTop:6, padding:'0.35rem 0.9rem', borderRadius:6, border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text)', cursor:'pointer', fontSize:'0.8rem' }}>Retry</button>}
    </div>
  );
}

function EmptyCard({ msg, height = 200 }) {
  return (
    <div style={{ ...card, height, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, color:'var(--muted)' }}>
      <span style={{ fontSize:'1.75rem' }}>📊</span>
      <span style={{ fontSize:'0.875rem', textAlign:'center', maxWidth:280 }}>{msg || 'No data available.'}</span>
    </div>
  );
}

// ─── Custom: Low-Stock Lollipop ───────────────────────────────────────────────
function LollipopChart({ items }) {
  if (!items?.length) return <EmptyCard msg="No inventory data for low-stock chart." height={320} />;
  const maxVal = Math.max(...items.map(i => Math.max(i.currentStock, i.reorderPoint, 1)));
  return (
    <div style={{ overflowY:'auto', maxHeight:400 }}>
      {items.map((item, idx) => {
        const pct = val => `${Math.min(100, (val / maxVal) * 100).toFixed(1)}%`;
        const color = item.isCritical ? DEALER_INVENTORY.critical : item.isLow ? DEALER_INVENTORY.low : DEALER_INVENTORY.healthy;
        return (
          <div key={idx} style={{ marginBottom:'1rem', paddingBottom:'0.75rem', borderBottom:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.3rem' }}>
              <span style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text)' }}>{item.name}</span>
              <span style={{ fontSize:'0.75rem', fontWeight:700, color }}>{item.currentStock} units</span>
            </div>
            <div style={{ position:'relative', height:10, background:'var(--bg)', borderRadius:5, overflow:'hidden' }}>
              {/* Safety Stock zone */}
              <div style={{ position:'absolute', left:0, top:0, height:'100%', width:pct(item.safetyStock), background:'rgba(220,38,38,0.15)', borderRight:'1px dashed #DC2626' }} />
              {/* Reorder Point zone */}
              <div style={{ position:'absolute', left:0, top:0, height:'100%', width:pct(item.reorderPoint), background:'rgba(245,158,11,0.15)', borderRight:'1px dashed #F59E0B' }} />
              {/* Current stock bar */}
              <div style={{ position:'absolute', left:0, top:0, height:'100%', width:pct(item.currentStock), background:color, borderRadius:5, transition:'width 0.5s' }} />
            </div>
            <div style={{ display:'flex', gap:12, marginTop:'0.25rem', fontSize:'0.7rem', color:'var(--muted)' }}>
              <span style={{ color:'#DC2626' }}>Safety: {item.safetyStock}</span>
              <span style={{ color:'#F59E0B' }}>Reorder: {item.reorderPoint}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Custom: Waterfall Chart ──────────────────────────────────────────────────
function WaterfallChart({ data }) {
  if (!data?.length) return <EmptyCard msg="No financial ledger records found for dealer entity." height={320} />;
  const max = Math.max(...data.map(d => Math.abs(d.amount)), 1);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
      {data.map((item, i) => {
        const isPos = item.amount >= 0;
        const pct = Math.abs(item.amount) / max * 100;
        return (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
            <span style={{ fontSize:'0.78rem', color:'var(--text)', minWidth:120, textAlign:'right' }}>{item.label}</span>
            <div style={{ flex:1, height:28, background:'var(--bg)', borderRadius:4, overflow:'hidden', position:'relative' }}>
              <div style={{ position:'absolute', [isPos?'left':'right']:0, top:0, height:'100%', width:`${pct}%`, background: isPos ? DEALER_FINANCIAL.inflow : DEALER_FINANCIAL.outflow, borderRadius:4, transition:'width 0.5s' }} />
            </div>
            <span style={{ fontSize:'0.8rem', fontWeight:700, color: isPos ? DEALER_FINANCIAL.inflow : DEALER_FINANCIAL.outflow, minWidth:90, textAlign:'right' }}>
              {isPos ? '+' : ''}₹{Math.abs(item.amount).toLocaleString()}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Custom: Partner Network SVG ──────────────────────────────────────────────
function PartnerNetworkDiagram({ retailers = [], manufacturers = [], transporters = [] }) {
  const W = 720, H = 420, cx = W / 2, cy = H / 2, nodeR = 28;
  const nodes = [];
  // Dealer center
  nodes.push({ id:'Dealer', x: cx, y: cy, color: DEALER_PARTNERS.dealer, label:'Dealer', type:'dealer' });
  // Manufacturers left
  manufacturers.slice(0, 3).forEach((m, i) => {
    const total = Math.min(manufacturers.length, 3);
    const angle = -Math.PI / 3 + (i * Math.PI / 3) / Math.max(total - 1, 1);
    nodes.push({ id: m.id, x: cx - 220 + Math.cos(angle) * 30, y: cy + Math.sin(angle) * 110 * (i - 1), color: DEALER_PARTNERS.manufacturer, label: String(m.id).replace('_',' ').slice(0,12), count: m.orderCount, type:'manufacturer' });
  });
  // Transporters top
  transporters.slice(0, 2).forEach((t, i) => {
    nodes.push({ id: t.id, x: cx - 80 + i * 160, y: 60, color: DEALER_PARTNERS.transporter, label: String(t.id).slice(0,12), count: t.orderCount, type:'transporter' });
  });
  // Retailers right
  retailers.slice(0, 4).forEach((r, i) => {
    const y = 80 + i * ((H - 120) / Math.max(retailers.slice(0,4).length - 1, 1));
    nodes.push({ id: r.name, x: cx + 210, y, color: DEALER_PARTNERS.retailer, label: String(r.name).slice(0,14), count: r.orderCount, type:'retailer' });
  });

  const dealerNode = nodes[0];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', maxHeight:420, overflow:'visible' }}>
      {/* Edges */}
      {nodes.slice(1).map((n, i) => (
        <line key={i} x1={dealerNode.x} y1={dealerNode.y} x2={n.x} y2={n.y}
          stroke={n.color} strokeOpacity={0.35} strokeWidth={Math.max(1, Math.min(5, (n.count||1) / 3))} />
      ))}
      {/* Nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={i === 0 ? 38 : nodeR} fill={n.color} fillOpacity={0.15} stroke={n.color} strokeWidth={2} />
          <text x={n.x} y={n.y} textAnchor="middle" dominantBaseline="middle" fill={n.color} fontSize={i===0?13:11} fontWeight={700}>{i===0?'DEALER':n.type.slice(0,3).toUpperCase()}</text>
          <text x={n.x} y={n.y + (i===0?52:38)} textAnchor="middle" fill="var(--text)" fontSize={10} fontWeight={600}>{n.label}</text>
          {n.count && <text x={n.x} y={n.y + 50} textAnchor="middle" fill="var(--muted)" fontSize={9}>{n.count} orders</text>}
        </g>
      ))}
      {/* Legend */}
      {[['Manufacturer', DEALER_PARTNERS.manufacturer],['Transporter', DEALER_PARTNERS.transporter],['Retailer', DEALER_PARTNERS.retailer]].map(([lbl,clr],i) => (
        <g key={i} transform={`translate(${16 + i * 130}, ${H - 20})`}>
          <circle r={6} fill={clr} fillOpacity={0.3} stroke={clr} strokeWidth={1.5} />
          <text x={12} y={4} fill="var(--muted)" fontSize={10}>{lbl}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── Custom: Custody Timeline ─────────────────────────────────────────────────
function CustodyTimeline({ events }) {
  if (!events?.length) return <EmptyCard msg="No custody events found. Events are created when waybills are received." height={300} />;
  return (
    <div style={{ overflowY:'auto', maxHeight:380 }}>
      {events.map((ev, i) => (
        <div key={i} style={{ display:'flex', gap:'0.75rem', paddingBottom:'0.75rem', marginBottom:'0.75rem', borderBottom:'1px solid var(--border)' }}>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:20 }}>
            <div style={{ width:12, height:12, borderRadius:'50%', background: DEALER_BATCH.primary, border:'2px solid var(--surface)', flexShrink:0 }} />
            {i < events.length - 1 && <div style={{ width:2, flex:1, background:'var(--border)', marginTop:2 }} />}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <span style={{ fontWeight:600, fontSize:'0.82rem', color:'var(--text)' }}>{ev.eventType}</span>
              <span style={{ fontSize:'0.7rem', color:'var(--muted)' }}>{String(ev.timestamp).slice(0,16)}</span>
            </div>
            <div style={{ fontSize:'0.75rem', color:'var(--muted)', marginTop:2 }}>
              {ev.from !== '—' && <><span style={{ color: DEALER_BATCH.manufacturer }}>{ev.from}</span> → </>}
              <span style={{ color: DEALER_BATCH.dealer }}>{ev.to}</span>
              {ev.sku && <span style={{ marginLeft:8, fontSize:'0.7rem', background:'var(--bg)', padding:'1px 6px', borderRadius:4 }}>{ev.sku}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Custom: Bullet / Target Chart ───────────────────────────────────────────
function BulletFulfillment({ rate, total, fulfilled }) {
  const target = 80; // 80% fulfillment SLA target
  const color = rate >= target ? SEMANTIC.success : rate >= 60 ? SEMANTIC.warning : SEMANTIC.critical;
  return (
    <div style={{ padding:'1rem 0' }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.75rem' }}>
        <div>
          <p style={{ margin:'0 0 0.2rem', fontSize:'0.75rem', color:'var(--muted)', fontWeight:600, textTransform:'uppercase' }}>Fulfillment Rate</p>
          <p style={{ margin:0, fontSize:'2.25rem', fontWeight:800, color, lineHeight:1 }}>{rate}%</p>
        </div>
        <div style={{ textAlign:'right' }}>
          <p style={{ margin:'0 0 0.2rem', fontSize:'0.75rem', color:'var(--muted)' }}>Target</p>
          <p style={{ margin:0, fontSize:'1.5rem', fontWeight:700, color:'var(--muted)' }}>{target}%</p>
        </div>
      </div>
      {/* Bullet track */}
      <div style={{ position:'relative', height:24, borderRadius:6, background:'rgba(220,38,38,0.12)', overflow:'hidden' }}>
        <div style={{ position:'absolute', left:0, top:0, height:'100%', width:'75%', background:'rgba(245,158,11,0.2)' }} />
        <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${rate}%`, background:color, borderRadius:6, transition:'width 0.7s cubic-bezier(.4,0,.2,1)' }} />
        <div style={{ position:'absolute', left:`${target}%`, top:0, height:'100%', width:2, background:'rgba(255,255,255,0.7)' }} />
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.4rem', fontSize:'0.72rem', color:'var(--muted)' }}>
        <span>0%</span>
        <span style={{ color:'var(--text)', fontWeight:600 }}>SLA Target: {target}%</span>
        <span>100%</span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginTop:'1.25rem' }}>
        {[['Total Orders', total, DEALER_ORDERS.primary], ['Fulfilled', fulfilled, SEMANTIC.success]].map(([l,v,c],i) => (
          <div key={i} style={{ background:'var(--bg)', borderRadius:8, padding:'0.75rem', textAlign:'center' }}>
            <p style={{ margin:'0 0 0.2rem', fontSize:'0.7rem', color:'var(--muted)', fontWeight:600, textTransform:'uppercase' }}>{l}</p>
            <p style={{ margin:0, fontSize:'1.5rem', fontWeight:800, color:c }}>{v?.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 1. DEALER DASHBOARD ─────────────────────────────────────────────────────
export function DealerDashboard() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data, loading, error, refetch } = useAnalytics('/dealer/analytics/dashboard', { dateFrom, dateTo });

  const kpis = data?.kpis || {};
  const funnel = data?.pipelineFunnel || [];
  const volumeTrend = data?.volumeTrend || [];
  const scatter = data?.valueScatter || [];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.6rem', fontWeight:800, margin:0, color:'var(--dashboard-heading)' }}>Dealer Operations Hub</h1>
        <button onClick={refetch} style={{ padding:'0.45rem 1rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--surface)', cursor:'pointer', fontSize:'0.85rem' }}>↻ Refresh</button>
      </div>
      <FilterBar dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} onApply={refetch} onClear={() => { setDateFrom(''); setDateTo(''); }} />

      {/* KPI Strip */}
      {!loading && !error && (
        <KPIStrip items={[
          { label:'Total Orders', value: kpis.totalOrders, color: DEALER_ORDERS.primary },
          { label:'Delivered / Received', value: kpis.deliveredOrders, color: SEMANTIC.success },
          { label:'Pending', value: kpis.pendingOrders, color: SEMANTIC.warning },
          { label:'Low Stock Products', value: kpis.lowStockProducts, color: SEMANTIC.critical },
        ]} />
      )}

      {/* MAIN: Order Pipeline Funnel — 12/12 */}
      {loading ? <LoadingCard height={460} /> : error ? <ErrorCard msg={error} onRetry={refetch} height={460} /> : (
        <div style={{ ...card, marginBottom:'1.5rem' }}>
          <p style={chartLabel}>Order Pipeline Funnel</p>
          <p style={chartDesc}>Live order count across each stage in the fulfillment pipeline, from retail order placement to delivery.</p>
          {funnel.length === 0 ? <EmptyCard msg="No orders exist yet. Orders will appear here once placed by retail partners." height={380} /> : (
            <div style={{ height:400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip content={<DTooltip />} />
                  <Funnel dataKey="count" data={funnel} isAnimationActive>
                    {funnel.map((entry, index) => (
                      <Cell key={index} fill={DEALER_ORDERS.stages[index % DEALER_ORDERS.stages.length]} />
                    ))}
                    <LabelList dataKey="label" position="right" style={{ fill:'var(--text)', fontSize:13, fontWeight:600 }} />
                    <LabelList dataKey="count" position="center" style={{ fill:'white', fontSize:12, fontWeight:700 }} />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Supporting: 2-column grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
        {/* Supporting 1: Order Volume Trend (Area Chart) */}
        {loading ? <LoadingCard height={380} /> : error ? <ErrorCard msg={error} height={380} /> : (
          <div style={card}>
            <p style={chartLabel}>Order Volume Over Time</p>
            <p style={chartDesc}>Daily order count over the selected period. Each bar = one day's orders placed.</p>
            {volumeTrend.length === 0 ? <EmptyCard msg="No order volume data for the selected period." height={300} /> : (
              <div style={{ height:300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={volumeTrend}>
                    <defs>
                      <linearGradient id="dealerVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={DEALER_ORDERS.primary} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={DEALER_ORDERS.primary} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                    <XAxis dataKey="day" tick={{ fontSize:11, fill:CHART_STYLE.axisColor }} tickFormatter={v => v?.slice(5)} />
                    <YAxis tick={{ fontSize:11, fill:CHART_STYLE.axisColor }} />
                    <Tooltip content={<DTooltip />} />
                    <Area type="monotone" dataKey="orders" name="Orders" stroke={DEALER_ORDERS.primary} strokeWidth={2} fill="url(#dealerVolumeGrad)" dot={{ r:3 }} activeDot={{ r:5 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Supporting 2: Order Value vs Age (Scatter) */}
        {loading ? <LoadingCard height={380} /> : error ? <ErrorCard msg={error} height={380} /> : (
          <div style={card}>
            <p style={chartLabel}>Order Value vs. Order Age</p>
            <p style={chartDesc}>Each dot is an order. X = days since placed, Y = total order value (₹). Identify slow, high-value orders.</p>
            {scatter.length === 0 ? <EmptyCard msg="No order value data available. Ensure products have prices set." height={300} /> : (
              <div style={{ height:300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                    <XAxis type="number" dataKey="ageDays" name="Age (Days)" tick={{ fontSize:11, fill:CHART_STYLE.axisColor }} label={{ value:'Days Old', position:'insideBottom', offset:-2, fill:CHART_STYLE.axisColor, fontSize:11 }} />
                    <YAxis type="number" dataKey="value" name="Value (₹)" tick={{ fontSize:11, fill:CHART_STYLE.axisColor }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <ZAxis type="number" dataKey="quantity" range={[30, 180]} />
                    <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const d = payload[0]?.payload || {};
                      return (
                        <div style={{ background:'#1E293B', border:'1px solid rgba(148,163,184,0.2)', borderRadius:8, padding:'10px 14px', fontSize:'0.8rem', color:'#F1F5F9' }}>
                          <div style={{ color:'#94A3B8', marginBottom:4 }}>{d.orderCode}</div>
                          <div>Value: <strong>₹{Number(d.value).toLocaleString()}</strong></div>
                          <div>Age: <strong>{d.ageDays} days</strong></div>
                          <div>Qty: <strong>{d.quantity}</strong></div>
                          <div>Status: <strong>{d.status}</strong></div>
                        </div>
                      );
                    }} />
                    <Scatter name="Orders" data={scatter} fill={DEALER_ORDERS.secondary} fillOpacity={0.6} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 2. INVENTORY ─────────────────────────────────────────────────────────────
export function Inventory() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data: analyticsData, loading: aLoading, error: aError, refetch } = useAnalytics('/dealer/analytics/inventory-detail', { dateFrom, dateTo });
  const { data: inventory, loading: iLoading, error: iError } = useApi('/dealer/inventory');

  const movTrend = analyticsData?.trend || [];
  const lowStock = analyticsData?.lowStock || [];
  const items = inventory?.items || [];

  const columns = [
    { key:'sku', header:'SKU', render: v => <strong style={{ fontSize:'0.8rem' }}>{v}</strong> },
    { key:'productName', header:'Product' },
    { key:'category', header:'Category' },
    { key:'currentStock', header:'Stock', render: v => <span style={{ fontWeight:700 }}>{v}</span> },
    { key:'minStock', header:'Min Level' },
    { key:'unitPrice', header:'Unit Price', render: v => `₹${Number(v).toLocaleString()}` },
    { key:'stockStatus', header:'Status', render: v => <StatusPill status={v==='In Stock'?'success':v==='Low Stock'?'warning':'error'} text={v} /> },
  ];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.6rem', fontWeight:800, margin:0, color:'var(--dashboard-heading)' }}>Warehouse Inventory</h1>
        <button onClick={refetch} style={{ padding:'0.45rem 1rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--surface)', cursor:'pointer', fontSize:'0.85rem' }}>↻ Refresh</button>
      </div>
      <FilterBar dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} onApply={refetch} onClear={() => { setDateFrom(''); setDateTo(''); }} />

      {/* MAIN: Stock Movements Stacked Bar — 12/12 */}
      <div style={{ ...card, marginBottom:'1.5rem' }}>
        <p style={chartLabel}>Stock In vs. Stock Out</p>
        <p style={chartDesc}>Weekly stock movement volumes. Shows goods received (Stock In), dispatched (Stock Out) and adjustments tracked in the stock_movements log.</p>
        {aLoading ? <div style={{ height:420, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)' }}>Loading…</div> : aError ? <ErrorCard msg={aError} onRetry={refetch} height={420} /> : movTrend.length === 0 ? (
          <EmptyCard msg="No stock movement records found. Stock movements are created automatically when orders are received or dispatched." height={380} />
        ) : (
          <div style={{ height:420 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movTrend} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize:11, fill:CHART_STYLE.axisColor }} />
                <YAxis tick={{ fontSize:11, fill:CHART_STYLE.axisColor }} />
                <Tooltip content={<DTooltip />} />
                <Legend wrapperStyle={{ fontSize:12, paddingTop:8 }} />
                <Bar dataKey="stockIn" name="Stock In" stackId="a" fill={DEALER_INVENTORY.stockIn} radius={[0,0,0,0]} />
                <Bar dataKey="stockOut" name="Stock Out" stackId="a" fill={DEALER_INVENTORY.stockOut} radius={[0,0,0,0]} />
                <Bar dataKey="adjustment" name="Adjustment" stackId="a" fill={DEALER_INVENTORY.adjustment} radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Supporting Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
        {/* Supporting 1: Inventory Level Trend */}
        <div style={card}>
          <p style={chartLabel}>Inventory Level Snapshot</p>
          <p style={chartDesc}>Current stock levels per product, ordered from lowest. Products below reorder point shown in amber/red.</p>
          {aLoading ? <div style={{ height:360, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'var(--muted)' }}>Loading…</span></div> : (
            lowStock.length === 0 ? <EmptyCard msg="No products found in database." height={300} /> : (
              <div style={{ height:360 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lowStock} layout="vertical" margin={{ left:10, right:20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize:10, fill:CHART_STYLE.axisColor }} />
                    <YAxis type="category" dataKey="sku" tick={{ fontSize:10, fill:CHART_STYLE.axisColor }} width={70} />
                    <Tooltip content={<DTooltip />} />
                    <Bar dataKey="currentStock" name="Current Stock" radius={[0,4,4,0]}>
                      {lowStock.map((item, i) => (
                        <Cell key={i} fill={item.isCritical ? DEALER_INVENTORY.critical : item.isLow ? DEALER_INVENTORY.low : DEALER_INVENTORY.healthy} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )
          )}
        </div>

        {/* Supporting 2: Low Stock Lollipop */}
        <div style={card}>
          <p style={chartLabel}>Low-Stock Detail</p>
          <p style={chartDesc}>Current stock vs. reorder point vs. safety stock. Red zone = below safety stock. Amber = needs reorder.</p>
          {aLoading ? <div style={{ height:360, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'var(--muted)' }}>Loading…</span></div> : <LollipopChart items={lowStock} />}
        </div>
      </div>

      {/* Full Inventory Table */}
      <div style={card}>
        <p style={{ ...sectionTitle, marginBottom:'0.75rem' }}>Full Product Inventory</p>
        {iError ? <div style={{ color:'var(--red)' }}>{iError}</div> : (
          <DataTable data={items} columns={columns} loading={iLoading} emptyMessage="No inventory records found." />
        )}
      </div>
    </div>
  );
}

// ─── 3. ORDER FULFILLMENT ─────────────────────────────────────────────────────
export function OrderFulfillment() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data: analyticsData, loading: aLoading, error: aError, refetch: refetchAnalytics } = useAnalytics('/dealer/analytics/fulfillment-detail', { dateFrom, dateTo });
  const { data: pipeline, loading: pLoading, error: pError, refetch: refetchPipeline } = useApi('/dealer/orders/pipeline');
  const [processing, setProcessing] = useState(null);

  const funnel = analyticsData?.funnel || [];
  const performance = analyticsData?.performance || [];
  const rate = analyticsData?.fulfillmentRate ?? 0;
  const totalOrders = analyticsData?.totalOrders ?? 0;
  const fulfilledOrders = analyticsData?.fulfilledOrders ?? 0;

  const handleReceive = async (orderCode) => {
    const qtyStr = window.prompt('Enter received quantity:');
    if (!qtyStr) return;
    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty)) return alert('Invalid quantity');
    setProcessing(orderCode);
    try {
      await dealerApi.receiveShipment(orderCode, qty);
      refetchPipeline(); refetchAnalytics();
    } catch (e) { alert('Error: ' + (e.response?.data?.detail || e.message)); }
    finally { setProcessing(null); }
  };

  const handleForward = async (orderCode) => {
    const mfg = window.prompt('Enter Manufacturer ID:', 'manufacturer');
    if (!mfg) return;
    setProcessing(orderCode);
    try {
      await dealerApi.forwardOrderToManufacturer(orderCode, mfg);
      refetchPipeline(); refetchAnalytics();
    } catch (e) { alert('Error: ' + (e.response?.data?.detail || e.message)); }
    finally { setProcessing(null); }
  };

  const columns = [
    { key:'orderCode', header:'Order Ref', render: v => <strong style={{ fontSize:'0.8rem' }}>{v}</strong> },
    { key:'retailer', header:'Retailer' },
    { key:'productSku', header:'SKU' },
    { key:'quantity', header:'Qty' },
    { key:'amount', header:'Value', render: v => `₹${Number(v).toLocaleString()}` },
    { key:'currentStage', header:'Stage', render: v => <StatusPill status="active" text={String(v||'').replace(/_/g,' ')} /> },
    { key:'status', header:'Status', render: v => <StatusPill status={v?.includes('receive')||v?.includes('deliver')?'success':v==='pending'?'warning':'active'} text={String(v||'').replace(/_/g,' ')} /> },
    { key:'actions', header:'Actions', render: (_, row) => (
      <div style={{ display:'flex', gap:'0.4rem' }}>
        {row.status === 'dispatched' && <button disabled={processing === row.orderCode} onClick={() => handleReceive(row.orderCode)} style={{ padding:'4px 10px', background:SEMANTIC.success, color:'white', border:'none', borderRadius:4, cursor:'pointer', fontWeight:600, fontSize:'0.78rem' }}>Receive</button>}
        {row.status === 'pending' && row.currentStage === 'retail_ordered' && <button disabled={processing === row.orderCode} onClick={() => handleForward(row.orderCode)} style={{ padding:'4px 10px', background:DEALER_ORDERS.primary, color:'white', border:'none', borderRadius:4, cursor:'pointer', fontWeight:600, fontSize:'0.78rem' }}>Forward</button>}
      </div>
    )},
  ];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.6rem', fontWeight:800, margin:0, color:'var(--dashboard-heading)' }}>Order Fulfillment Pipeline</h1>
        <button onClick={() => { refetchAnalytics(); refetchPipeline(); }} style={{ padding:'0.45rem 1rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--surface)', cursor:'pointer', fontSize:'0.85rem' }}>↻ Refresh</button>
      </div>
      <FilterBar dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} onApply={refetchAnalytics} onClear={() => { setDateFrom(''); setDateTo(''); }} />

      {/* MAIN: Fulfillment Funnel */}
      {aLoading ? <LoadingCard height={460} /> : aError ? <ErrorCard msg={aError} onRetry={refetchAnalytics} height={460} /> : (
        <div style={{ ...card, marginBottom:'1.5rem' }}>
          <p style={chartLabel}>Fulfillment Stage Funnel</p>
          <p style={chartDesc}>Orders grouped by their current pipeline stage. Wider = more orders at that stage. Shows where bottlenecks are forming.</p>
          {funnel.length === 0 ? <EmptyCard msg="No order stage data yet. Orders will populate this funnel as they progress through the pipeline." height={380} /> : (
            <div style={{ height:420 }}>
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip content={<DTooltip />} />
                  <Funnel dataKey="count" data={funnel} isAnimationActive>
                    {funnel.map((entry, index) => <Cell key={index} fill={DEALER_ORDERS.stages[index % DEALER_ORDERS.stages.length]} />)}
                    <LabelList dataKey="label" position="right" style={{ fill:'var(--text)', fontSize:12, fontWeight:600 }} />
                    <LabelList dataKey="count" position="center" style={{ fill:'white', fontSize:12, fontWeight:700 }} />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Supporting Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
        {/* Supporting 1: Orders + Fulfillment Time Composed Chart */}
        <div style={card}>
          <p style={chartLabel}>Orders & Fulfillment Time</p>
          <p style={chartDesc}>Daily order count (bars) vs. average fulfillment days (line). Tracks throughput and speed over time.</p>
          {aLoading ? <div style={{ height:360, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'var(--muted)' }}>Loading…</span></div> : performance.length === 0 ? (
            <EmptyCard msg="No performance data for the selected date range." height={300} />
          ) : (
            <div style={{ height:360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={performance}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                  <XAxis dataKey="day" tick={{ fontSize:10, fill:CHART_STYLE.axisColor }} tickFormatter={v => v?.slice(5)} />
                  <YAxis yAxisId="left" tick={{ fontSize:10, fill:CHART_STYLE.axisColor }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize:10, fill:CHART_STYLE.axisColor }} unit="d" />
                  <Tooltip content={<DTooltip />} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Bar yAxisId="left" dataKey="total" name="Total Orders" fill={DEALER_ORDERS.primary} fillOpacity={0.7} radius={[3,3,0,0]} />
                  <Bar yAxisId="left" dataKey="fulfilled" name="Fulfilled" fill={SEMANTIC.success} fillOpacity={0.7} radius={[3,3,0,0]} />
                  <Line yAxisId="right" type="monotone" dataKey="avgDays" name="Avg Days" stroke={SEMANTIC.warning} strokeWidth={2} dot={{ r:3 }} connectNulls />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Supporting 2: Bullet / Target Chart */}
        <div style={card}>
          <p style={chartLabel}>Fulfillment Rate vs. SLA Target</p>
          <p style={chartDesc}>Actual fulfillment rate compared to the 80% SLA target. Based on orders with confirmed dealer_received_at timestamp.</p>
          {aLoading ? <div style={{ height:360, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'var(--muted)' }}>Loading…</span></div> : (
            <BulletFulfillment rate={rate} total={totalOrders} fulfilled={fulfilledOrders} />
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div style={card}>
        <p style={{ ...sectionTitle, marginBottom:'0.75rem' }}>Active Order Pipeline</p>
        {pError ? <div style={{ color:'var(--red)' }}>{pError}</div> : (
          <DataTable data={pipeline?.items || []} columns={columns} loading={pLoading} emptyMessage="No orders in pipeline." />
        )}
      </div>
    </div>
  );
}

// ─── 4. PARTNER NETWORK ───────────────────────────────────────────────────────
export function PartnerNetwork() {
  const { data, loading, error, refetch } = useAnalytics('/dealer/analytics/partners-detail', {});
  const { data: recent, loading: rLoading } = useApi('/dealer/orders/recent');

  const retailers = data?.retailers || [];
  const manufacturers = data?.manufacturers || [];
  const transporters = data?.transporters || [];

  const recentColumns = [
    { key:'orderId', header:'Order', render: v => <strong style={{ fontSize:'0.8rem' }}>{v}</strong> },
    { key:'retailer', header:'Retail Partner' },
    { key:'amount', header:'Value' },
    { key:'date', header:'Date' },
    { key:'status', header:'Status', render: v => <StatusPill status={v==='Delivered'||v==='Retail Received'?'success':'pending'} text={v} /> },
  ];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.6rem', fontWeight:800, margin:0, color:'var(--dashboard-heading)' }}>Partner Network</h1>
        <button onClick={refetch} style={{ padding:'0.45rem 1rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--surface)', cursor:'pointer', fontSize:'0.85rem' }}>↻ Refresh</button>
      </div>

      {/* MAIN: Network Diagram — 12/12 */}
      {loading ? <LoadingCard height={500} /> : error ? <ErrorCard msg={error} onRetry={refetch} height={500} /> : (
        <div style={{ ...card, marginBottom:'1.5rem' }}>
          <p style={chartLabel}>Supply Chain Relationship Map</p>
          <p style={chartDesc}>Live relationship diagram showing Dealer connections to Manufacturers (upstream), Transporters (logistics), and Retail Partners (downstream). Node size = order volume.</p>
          {retailers.length === 0 && manufacturers.length === 0 ? (
            <EmptyCard msg="No partner relationship data found. Relationships are derived from order connections in the database." height={400} />
          ) : (
            <div style={{ width:'100%', minHeight:420 }}>
              <PartnerNetworkDiagram retailers={retailers} manufacturers={manufacturers} transporters={transporters} />
            </div>
          )}
        </div>
      )}

      {/* Supporting Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
        {/* Supporting 1: Retailer Rank Bar */}
        <div style={card}>
          <p style={chartLabel}>Top Retail Partners by Order Volume</p>
          <p style={chartDesc}>Horizontal ranking of retail partners ordered by total number of orders placed through the dealer.</p>
          {loading ? <div style={{ height:360, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'var(--muted)' }}>Loading…</span></div> : retailers.length === 0 ? (
            <EmptyCard msg="No retail partner order data available." height={300} />
          ) : (
            <div style={{ height:360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={retailers} layout="vertical" margin={{ left:20, right:20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:10, fill:CHART_STYLE.axisColor }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:CHART_STYLE.axisColor }} width={90} tickFormatter={v => v.length > 14 ? v.slice(0,13)+'…' : v} />
                  <Tooltip content={<DTooltip />} />
                  <Bar dataKey="orderCount" name="Orders" fill={DEALER_PARTNERS.retailer} radius={[0,4,4,0]}>
                    {retailers.map((_, i) => <Cell key={i} fill={`${DEALER_PARTNERS.retailer}${Math.max(50, 255 - i * 25).toString(16)}`} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Supporting 2: Partner Volume vs Quantity Scatter */}
        <div style={card}>
          <p style={chartLabel}>Partner Volume vs. Total Quantity</p>
          <p style={chartDesc}>Scatter of retail partners — X = order count, Y = total units ordered. Identifies high-volume, high-quantity partners.</p>
          {loading ? <div style={{ height:360, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'var(--muted)' }}>Loading…</span></div> : retailers.length === 0 ? (
            <EmptyCard msg="No partner data for scatter chart." height={300} />
          ) : (
            <div style={{ height:360 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                  <XAxis type="number" dataKey="orderCount" name="Order Count" tick={{ fontSize:10, fill:CHART_STYLE.axisColor }} label={{ value:'Orders', position:'insideBottom', offset:-2, fill:CHART_STYLE.axisColor, fontSize:10 }} />
                  <YAxis type="number" dataKey="totalQuantity" name="Total Units" tick={{ fontSize:10, fill:CHART_STYLE.axisColor }} />
                  <Tooltip cursor={{ strokeDasharray:'3 3' }} content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload || {};
                    return (
                      <div style={{ background:'#1E293B', border:'1px solid rgba(148,163,184,0.2)', borderRadius:8, padding:'8px 12px', fontSize:'0.8rem', color:'#F1F5F9' }}>
                        <div style={{ color:'#94A3B8', marginBottom:4 }}>{d.name}</div>
                        <div>Orders: <strong>{d.orderCount}</strong></div>
                        <div>Units: <strong>{d.totalQuantity}</strong></div>
                      </div>
                    );
                  }} />
                  <Scatter name="Partners" data={retailers} fill={DEALER_PARTNERS.primary} fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders Table */}
      <div style={card}>
        <p style={{ ...sectionTitle, marginBottom:'0.75rem' }}>Recent Partner Orders</p>
        <DataTable data={recent?.orders || []} columns={recentColumns} loading={rLoading} emptyMessage="No recent partner activity." />
      </div>
    </div>
  );
}

// ─── 5. DEALER LEDGER ─────────────────────────────────────────────────────────
export function DealerLedger() {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const { data, loading, error, refetch } = useAnalytics('/dealer/analytics/financial-detail', { dateFrom, dateTo });

  const revenueTrend = data?.revenueTrend || [];
  const categories = data?.categories || [];
  const waterfall = data?.waterfall || [];
  const totalRevenue = data?.totalRevenue || 0;
  const hasLedger = data?.hasLedgerData;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.6rem', fontWeight:800, margin:0, color:'var(--dashboard-heading)' }}>Financial Ledger</h1>
        <button onClick={refetch} style={{ padding:'0.45rem 1rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--surface)', cursor:'pointer', fontSize:'0.85rem' }}>↻ Refresh</button>
      </div>
      <FilterBar dateFrom={dateFrom} setDateFrom={setDateFrom} dateTo={dateTo} setDateTo={setDateTo} onApply={refetch} onClear={() => { setDateFrom(''); setDateTo(''); }} />

      {!loading && !error && (
        <KPIStrip items={[
          { label:'Total Revenue', value:`₹${Number(totalRevenue).toLocaleString()}`, color: DEALER_FINANCIAL.revenue },
          { label:'Order Months', value: revenueTrend.length, color: DEALER_ORDERS.primary },
          { label:'Ledger Entries', value: waterfall.length, color: hasLedger ? SEMANTIC.success : SEMANTIC.neutral, sub: hasLedger ? 'From financial_ledger' : 'No ledger data for dealer' },
          { label:'Tx Categories', value: categories.length, color: DEALER_FINANCIAL.profit },
        ]} />
      )}

      {/* MAIN: Revenue Area+Line — 12/12 */}
      {loading ? <LoadingCard height={460} /> : error ? <ErrorCard msg={error} onRetry={refetch} height={460} /> : (
        <div style={{ ...card, marginBottom:'1.5rem' }}>
          <p style={chartLabel}>Revenue Over Time</p>
          <p style={chartDesc}>Monthly gross revenue derived from orders × product prices. Line shows order count per month. Real data from orders + products join.</p>
          {revenueTrend.length === 0 ? <EmptyCard msg="No revenue data found. Revenue is calculated from order quantities × product unit prices." height={380} /> : (
            <div style={{ height:420 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={revenueTrend}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={DEALER_FINANCIAL.revenue} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={DEALER_FINANCIAL.revenue} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                  <XAxis dataKey="month" tick={{ fontSize:11, fill:CHART_STYLE.axisColor }} />
                  <YAxis yAxisId="left" tick={{ fontSize:11, fill:CHART_STYLE.axisColor }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize:11, fill:CHART_STYLE.axisColor }} />
                  <Tooltip content={<DTooltip />} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke={DEALER_FINANCIAL.revenue} strokeWidth={2} fill="url(#revenueGrad)" />
                  <Line yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke={DEALER_ORDERS.primary} strokeWidth={2} dot={{ r:4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Supporting Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
        {/* Supporting 1: Waterfall */}
        <div style={card}>
          <p style={chartLabel}>Financial Inflow / Outflow</p>
          <p style={chartDesc}>Transaction breakdown from the financial_ledger table for entity_type = dealer. Shows inflow (green) and outflow (red) by transaction type.</p>
          {loading ? <div style={{ height:320 }} /> : !hasLedger ? (
            <EmptyCard msg="No financial ledger entries found for dealer entity. Ledger records are created when financial transactions are processed." height={280} />
          ) : <WaterfallChart data={waterfall} />}
        </div>

        {/* Supporting 2: Category Donut */}
        <div style={card}>
          <p style={chartLabel}>Transaction Category Breakdown</p>
          <p style={chartDesc}>Distribution of ledger event types from ledger_records. Shows which stage of the supply chain drives the most transactions.</p>
          {loading ? <div style={{ height:320, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'var(--muted)' }}>Loading…</span></div> : categories.length === 0 ? (
            <EmptyCard msg="No ledger record categories found." height={280} />
          ) : (
            <div style={{ height:320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categories} cx="50%" cy="50%" innerRadius="45%" outerRadius="70%" dataKey="value" nameKey="label" paddingAngle={3}>
                    {categories.map((_, i) => <Cell key={i} fill={DEALER_FINANCIAL.category[i % DEALER_FINANCIAL.category.length]} />)}
                  </Pie>
                  <Tooltip content={<DTooltip />} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 6. DEALER ALERT CENTER ───────────────────────────────────────────────────
export function DealerAlertCenter() {
  const { data, loading, error, refetch } = useAnalytics('/dealer/analytics/alerts-detail', {});

  const severityBar = data?.severityBar || [];
  const statusDonut = data?.statusDonut || [];
  const trend = data?.trend || [];
  const recent = data?.recent || [];
  const total = data?.totalAlerts || 0;

  const recentColumns = [
    { key:'entity_type', header:'Type', render: v => <StatusPill status="active" text={String(v||'').toUpperCase()} /> },
    { key:'entity_id', header:'Entity ID', render: v => <span style={{ fontFamily:'monospace', fontSize:'0.8rem' }}>{v}</span> },
    { key:'type', header:'Alert Type' },
    { key:'severity', header:'Severity', render: v => <span style={{ fontWeight:700, color: getDealerStatusColor(v) }}>{String(v||'').toUpperCase()}</span> },
    { key:'status', header:'Status', render: v => <StatusPill status={v==='resolved'?'success':v==='acknowledged'?'warning':'error'} text={v} /> },
    { key:'explanation', header:'Detail' },
  ];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.6rem', fontWeight:800, margin:0, color:'var(--dashboard-heading)' }}>Alert Center</h1>
        <button onClick={refetch} style={{ padding:'0.45rem 1rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--surface)', cursor:'pointer', fontSize:'0.85rem' }}>↻ Refresh</button>
      </div>

      {!loading && !error && (
        <KPIStrip items={[
          { label:'Total Alerts', value: total, color: total > 0 ? SEMANTIC.critical : SEMANTIC.success },
          { label:'Critical (RED)', value: severityBar.find(s => s.rag === 'RED')?.count || 0, color: '#DC2626' },
          { label:'Attention (AMBER)', value: severityBar.find(s => s.rag === 'AMBER')?.count || 0, color: '#F59E0B' },
          { label:'Healthy (GREEN)', value: severityBar.find(s => s.rag === 'GREEN')?.count || 0, color: '#059669' },
        ]} />
      )}

      {/* MAIN: RAG Severity Bar — 12/12 */}
      {loading ? <LoadingCard height={420} /> : error ? <ErrorCard msg={error} onRetry={refetch} height={420} /> : (
        <div style={{ ...card, marginBottom:'1.5rem' }}>
          <p style={chartLabel}>Risk Severity (RAG)</p>
          <p style={chartDesc}>Alerts grouped by RAG severity from the anomalies table. GREEN = healthy, AMBER = attention required, RED = critical action needed. Risk is assigned by the backend — not decorative.</p>
          {severityBar.every(s => s.count === 0) ? <EmptyCard msg="No anomaly records found in the database. Alerts are generated automatically by the risk detection system when issues are detected." height={340} /> : (
            <div style={{ height:380 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={severityBar} layout="vertical" margin={{ left:20, right:40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:11, fill:CHART_STYLE.axisColor }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize:12, fill:CHART_STYLE.axisColor }} width={160} />
                  <Tooltip content={<DTooltip />} />
                  <Bar dataKey="count" name="Alerts" radius={[0,6,6,0]}>
                    {severityBar.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Supporting Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
        {/* Supporting 1: Alert Trend Line */}
        <div style={card}>
          <p style={chartLabel}>Alert Volume Over Time</p>
          <p style={chartDesc}>Daily anomaly count over the past 14 days. Rising trend may indicate system or supply chain stress.</p>
          {loading ? <div style={{ height:340, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'var(--muted)' }}>Loading…</span></div> : trend.length === 0 ? (
            <EmptyCard msg="No historical alert trend data available." height={280} />
          ) : (
            <div style={{ height:340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                  <XAxis dataKey="day" tick={{ fontSize:10, fill:CHART_STYLE.axisColor }} tickFormatter={v => v?.slice(5)} />
                  <YAxis tick={{ fontSize:10, fill:CHART_STYLE.axisColor }} />
                  <Tooltip content={<DTooltip />} />
                  <Line type="monotone" dataKey="count" name="Alerts" stroke={SEMANTIC.critical} strokeWidth={2} dot={{ r:4, fill:SEMANTIC.critical }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Supporting 2: Status Donut */}
        <div style={card}>
          <p style={chartLabel}>Alert Status Distribution</p>
          <p style={chartDesc}>Donut breakdown of anomaly status: Open (needs action), Acknowledged, Resolved. Data from the anomalies table status column.</p>
          {loading ? <div style={{ height:340, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'var(--muted)' }}>Loading…</span></div> : statusDonut.length === 0 ? (
            <EmptyCard msg="No alert status data found." height={280} />
          ) : (
            <div style={{ height:340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusDonut} cx="50%" cy="50%" innerRadius="45%" outerRadius="70%" dataKey="value" nameKey="label" paddingAngle={3}>
                    {statusDonut.map((entry, i) => (
                      <Cell key={i} fill={getDealerStatusColor(entry.label) || DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<DTooltip />} />
                  <Legend wrapperStyle={{ fontSize:11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Recent Alerts Table */}
      <div style={card}>
        <p style={{ ...sectionTitle, marginBottom:'0.75rem' }}>Recent Anomalies</p>
        <DataTable data={recent} columns={recentColumns} loading={loading} emptyMessage="No anomaly records found. The risk detection system will populate this when issues are detected." />
      </div>
    </div>
  );
}

// ─── 7. DEALER DISPUTE CENTER ─────────────────────────────────────────────────
export function DealerDisputeCenter() {
  const { data, loading, error, refetch } = useAnalytics('/dealer/analytics/disputes-detail', {});

  const byType = data?.byType || [];
  const lifecycle = data?.lifecycle || [];
  const trend = data?.trend || [];
  const recent = data?.recent || [];
  const total = data?.totalDisputes || 0;

  const disputeColumns = [
    { key:'dispute_id', header:'Dispute ID', render: v => <strong style={{ fontFamily:'monospace', fontSize:'0.8rem' }}>{v}</strong> },
    { key:'mismatch_type', header:'Type', render: v => <StatusPill status="warning" text={String(v||'').replace(/_/g,' ')} /> },
    { key:'order_id', header:'Order' },
    { key:'waybill_id', header:'Waybill' },
    { key:'status', header:'Status', render: v => {
      const s = String(v||'').toUpperCase();
      return <StatusPill status={s==='RESOLVED'||s==='CLOSED'?'success':s==='UNDER_REVIEW'?'warning':'error'} text={v} />;
    }},
    { key:'description', header:'Description' },
    { key:'created_at', header:'Created', render: v => String(v||'').slice(0,10) },
  ];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.6rem', fontWeight:800, margin:0, color:'var(--dashboard-heading)' }}>Dispute Center</h1>
        <button onClick={refetch} style={{ padding:'0.45rem 1rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--surface)', cursor:'pointer', fontSize:'0.85rem' }}>↻ Refresh</button>
      </div>

      {!loading && !error && (
        <KPIStrip items={[
          { label:'Total Disputes', value: total, color: total > 0 ? DEALER_DISPUTES.primary : SEMANTIC.success },
          { label:'Open', value: lifecycle.find(s => s.stage === 'OPEN')?.count || 0, color: DEALER_DISPUTES.OPEN },
          { label:'Under Review', value: lifecycle.find(s => s.stage === 'UNDER_REVIEW')?.count || 0, color: DEALER_DISPUTES.UNDER_REVIEW },
          { label:'Resolved', value: lifecycle.find(s => s.stage === 'RESOLVED')?.count || 0, color: DEALER_DISPUTES.RESOLVED },
        ]} />
      )}

      {/* MAIN: Horizontal Bar by Mismatch Type — 12/12 */}
      {loading ? <LoadingCard height={420} /> : error ? <ErrorCard msg={error} onRetry={refetch} height={420} /> : (
        <div style={{ ...card, marginBottom:'1.5rem' }}>
          <p style={chartLabel}>Disputes by Mismatch Type</p>
          <p style={chartDesc}>Horizontal ranking of dispute categories from the disputes table. Identifies which types of mismatches occur most frequently.</p>
          {byType.length === 0 ? <EmptyCard msg="No dispute records found in the database. Disputes are created when discrepancies are detected during order receiving." height={340} /> : (
            <div style={{ height:Math.max(300, byType.length * 52 + 80) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byType} layout="vertical" margin={{ left:20, right:40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize:11, fill:CHART_STYLE.axisColor }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize:12, fill:CHART_STYLE.axisColor }} width={140} />
                  <Tooltip content={<DTooltip />} />
                  <Bar dataKey="count" name="Disputes" radius={[0,6,6,0]}>
                    {byType.map((_, i) => <Cell key={i} fill={i === 0 ? DEALER_DISPUTES.critical : i === 1 ? DEALER_DISPUTES.secondary : DEALER_DISPUTES.primary} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Supporting Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'1.5rem' }}>
        {/* Supporting 1: Dispute Trend */}
        <div style={card}>
          <p style={chartLabel}>Dispute Trend Over Time</p>
          <p style={chartDesc}>Daily dispute creation count for the past 14 days. A rising trend signals recurring supply chain issues.</p>
          {loading ? <div style={{ height:340, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'var(--muted)' }}>Loading…</span></div> : trend.length === 0 ? (
            <EmptyCard msg="No dispute trend data available yet." height={280} />
          ) : (
            <div style={{ height:340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                  <XAxis dataKey="day" tick={{ fontSize:10, fill:CHART_STYLE.axisColor }} tickFormatter={v => v?.slice(5)} />
                  <YAxis tick={{ fontSize:10, fill:CHART_STYLE.axisColor }} />
                  <Tooltip content={<DTooltip />} />
                  <Line type="monotone" dataKey="count" name="Disputes" stroke={DEALER_DISPUTES.primary} strokeWidth={2} dot={{ r:4, fill:DEALER_DISPUTES.primary }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Supporting 2: Lifecycle Funnel */}
        <div style={card}>
          <p style={chartLabel}>Dispute Lifecycle Funnel</p>
          <p style={chartDesc}>Disputes by lifecycle stage: Open → Under Review → Resolved → Closed. Shows how many disputes are moving through the resolution process.</p>
          {loading ? <div style={{ height:340, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'var(--muted)' }}>Loading…</span></div> : lifecycle.length === 0 ? (
            <EmptyCard msg="No dispute lifecycle data. Stages are tracked in the disputes table status column." height={280} />
          ) : (
            <div style={{ height:340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <Tooltip content={<DTooltip />} />
                  <Funnel dataKey="count" data={lifecycle} isAnimationActive>
                    {lifecycle.map((entry, i) => (
                      <Cell key={i} fill={getDealerStatusColor(entry.stage) || DONUT_COLORS[i]} />
                    ))}
                    <LabelList dataKey="label" position="right" style={{ fill:'var(--text)', fontSize:12, fontWeight:600 }} />
                    <LabelList dataKey="count" position="center" style={{ fill:'white', fontSize:12, fontWeight:700 }} />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Disputes Table */}
      <div style={card}>
        <p style={{ ...sectionTitle, marginBottom:'0.75rem' }}>Recent Disputes</p>
        <DataTable data={recent} columns={disputeColumns} loading={loading} emptyMessage="No disputes on record. Disputes are auto-created when receiving discrepancies exceed the allowed threshold." />
      </div>
    </div>
  );
}

// ─── 8. DEALER BATCH TRACEABILITY ─────────────────────────────────────────────
function BatchSankey({ links }) {
  if (!links?.length) return <EmptyCard msg="No batch flow data found. Sankey links are built from batches connected to orders, shipments, and custody events." height={420} />;
  const W = 880, H = 460, nodeW = 18, pad = 6;
  const nodeMap = {};
  links.forEach(l => {
    if (!nodeMap[l.source]) nodeMap[l.source] = { name: l.source, inflow:0, outflow:0, value:0, type: l.type };
    if (!nodeMap[l.target]) nodeMap[l.target] = { name: l.target, inflow:0, outflow:0, value:0, type: '' };
    nodeMap[l.source].outflow += l.value;
    nodeMap[l.target].inflow += l.value;
  });
  const allNodes = Object.values(nodeMap).map(n => ({ ...n, value: Math.max(n.inflow, n.outflow) }));
  const isDealer = n => n.name === 'Dealer';
  const isSource = n => n.inflow === 0 && !isDealer(n);
  const isSink = n => n.outflow === 0 && !isDealer(n);
  const leftNodes = allNodes.filter(n => isSource(n));
  const centerNodes = allNodes.filter(n => isDealer(n));
  const rightNodes = allNodes.filter(n => isSink(n));
  const layerX = [80, W/2-nodeW/2, W-80-nodeW];
  const getColor = (type) => ({
    manufacturer: DEALER_BATCH.manufacturer,
    transporter: DEALER_BATCH.transporter,
    retailer: DEALER_BATCH.retailer,
    flow: DEALER_BATCH.primary,
  }[type] || DEALER_BATCH.primary);
  const assignY = (nodes, totalH) => {
    const total = nodes.reduce((s,n) => s+n.value,0) || 1;
    let y = 40;
    nodes.forEach(n => { n.h = Math.max(18, ((n.value/total) * (totalH-80))); n.y = y; y += n.h + pad; });
  };
  assignY(leftNodes, H); assignY(centerNodes, H); assignY(rightNodes, H);
  leftNodes.forEach((n,i) => { n.x = layerX[0]; });
  centerNodes.forEach(n => { n.x = layerX[1]; });
  rightNodes.forEach(n => { n.x = layerX[2]; });
  const nodeById = Object.fromEntries([...leftNodes,...centerNodes,...rightNodes].map(n => [n.name,n]));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', maxHeight:460, overflow:'visible' }}>
      {links.map((l, i) => {
        const s = nodeById[l.source], t = nodeById[l.target];
        if (!s || !t) return null;
        const sx = s.x + nodeW, sy = s.y + (s.h||20)/2;
        const tx = t.x, ty = t.y + (t.h||20)/2;
        const mx = (sx+tx)/2;
        return (
          <path key={i} d={`M${sx},${sy} C${mx},${sy} ${mx},${ty} ${tx},${ty}`}
            stroke={getColor(l.type)} strokeOpacity={0.3}
            strokeWidth={Math.max(2, Math.min(20, (l.value||1)*2))} fill="none" />
        );
      })}
      {[...leftNodes,...centerNodes,...rightNodes].map((n, i) => {
        const color = isDealer(n) ? DEALER_BATCH.dealer : getColor(n.type);
        return (
          <g key={i}>
            <rect x={n.x} y={n.y} width={nodeW} height={Math.max(n.h||20, 18)} rx={3} fill={color} />
            <text x={n.x + (isDealer(n) ? nodeW/2 : n.outflow===0 ? nodeW+6 : -(nodeW+6))} y={n.y+(n.h||20)/2}
              textAnchor={isDealer(n) ? 'middle' : n.outflow===0 ? 'start' : 'end'}
              dominantBaseline="middle" fill="var(--text)" fontSize={11} fontWeight={600}>{n.name.slice(0,16)}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function DealerBatchTraceability() {
  const { data, loading, error, refetch } = useAnalytics('/dealer/analytics/batches-detail', {});

  const statusDist = data?.statusDistribution || [];
  const flowLinks = data?.flowLinks || [];
  const custodyEvents = data?.custodyEvents || [];
  const totalBatches = data?.totalBatches || 0;

  const batchColors = DEALER_BATCH.statusColors;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.6rem', fontWeight:800, margin:0, color:'var(--dashboard-heading)' }}>Batch Traceability</h1>
        <button onClick={refetch} style={{ padding:'0.45rem 1rem', border:'1px solid var(--border)', borderRadius:6, background:'var(--surface)', cursor:'pointer', fontSize:'0.85rem' }}>↻ Refresh</button>
      </div>

      {!loading && !error && (
        <KPIStrip items={[
          { label:'Total Batches', value: totalBatches, color: DEALER_BATCH.primary },
          { label:'Custody Events', value: custodyEvents.length, color: DEALER_BATCH.transporter },
          { label:'Flow Connections', value: flowLinks.length, color: DEALER_BATCH.retailer },
          { label:'Status Types', value: statusDist.length, color: DEALER_BATCH.manufacturer },
        ]} />
      )}

      {/* MAIN: Sankey Flow — 12/12 */}
      {loading ? <LoadingCard height={520} /> : error ? <ErrorCard msg={error} onRetry={refetch} height={520} /> : (
        <div style={{ ...card, marginBottom:'1.5rem' }}>
          <p style={chartLabel}>Batch Supply Chain Flow</p>
          <p style={chartDesc}>Sankey-style flow showing real batch movement: Manufacturer → (Transporter) → Dealer → Retail Partner. Width = order volume. Built from batches + orders + custody_events.</p>
          <BatchSankey links={flowLinks} />
          <div style={{ display:'flex', gap:'1.5rem', marginTop:'0.75rem', flexWrap:'wrap' }}>
            {[['Manufacturer', DEALER_BATCH.manufacturer],['Transporter', DEALER_BATCH.transporter],['Dealer', DEALER_BATCH.dealer],['Retailer', DEALER_BATCH.retailer]].map(([l,c]) => (
              <div key={l} style={{ display:'flex', alignItems:'center', gap:6, fontSize:'0.78rem', color:'var(--muted)' }}>
                <span style={{ width:12, height:12, borderRadius:2, background:c, display:'inline-block' }} />
                {l}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supporting Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
        {/* Supporting 1: Custody Timeline */}
        <div style={card}>
          <p style={chartLabel}>Custody Chain Timeline</p>
          <p style={chartDesc}>Chronological log of custody handoff events from the custody_events table. Shows who received what, and when, with linked waybill and SKU.</p>
          {loading ? <div style={{ height:400, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'var(--muted)' }}>Loading…</span></div> : (
            <CustodyTimeline events={custodyEvents} />
          )}
        </div>

        {/* Supporting 2: Batch Status Column */}
        <div style={card}>
          <p style={chartLabel}>Batch Status Distribution</p>
          <p style={chartDesc}>Column chart of batch counts by status from the batches table. Shows how many batches are in each stage of the production-to-delivery lifecycle.</p>
          {loading ? <div style={{ height:400, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ color:'var(--muted)' }}>Loading…</span></div> : statusDist.length === 0 ? (
            <EmptyCard msg="No batch records found. Batches are created by Manufacturers in response to Dealer orders." height={320} />
          ) : (
            <div style={{ height:400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                  <XAxis dataKey="status" tick={{ fontSize:11, fill:CHART_STYLE.axisColor }} />
                  <YAxis tick={{ fontSize:11, fill:CHART_STYLE.axisColor }} />
                  <Tooltip content={<DTooltip />} />
                  <Bar dataKey="count" name="Batches" radius={[6,6,0,0]}>
                    {statusDist.map((entry, i) => (
                      <Cell key={i} fill={getDealerStatusColor(entry.status) || batchColors[i % batchColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
