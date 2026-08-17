import React, { useState } from 'react';
import { useApi } from '../../api/hooks/useApi';
import { retailApi } from '../../api/services/retailApi';
import { DataTable } from '../ui/DataTable';
import { StatusPill } from '../ui/StatusPill';
import { AnalyticsSection } from './analytics/AnalyticsSection';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, LineChart, Line, ScatterChart, Scatter, ComposedChart, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, FunnelChart, Funnel, Sankey } from 'recharts';
import { RETAIL_SALES, RETAIL_INVENTORY, RETAIL_REVENUE, RETAIL_REPLENISHMENT, RETAIL_WAYBILL, RETAIL_TRACEABILITY, RETAIL_RECEIVING, RETAIL_RISK, getRetailStatusColor, SEMANTIC, CHART_STYLE } from './analytics/chartColors';

// ─── 1. DASHBOARD / OVERVIEW ────────────────────────────────────────────────
export function RetailDashboardOverview() {
    const { data, loading, error } = useApi('/retail/analytics/dashboard');

    if (error) return <div style={{color:'var(--red)'}}>{error.message}</div>;

    return (
        <AnalyticsSection title="Retail Dashboard" description="Overview of sales, revenue, and product performance.">
            {/* Main: Sales + Revenue Area Chart */}
            <div style={{ gridColumn: '1 / -1', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '450px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Sales & Revenue Trend</h3>
                {loading ? <div>Loading...</div> : (data?.trend?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data.trend}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                            <XAxis dataKey="day" stroke={CHART_STYLE.axisColor} />
                            <YAxis yAxisId="left" stroke={CHART_STYLE.axisColor} />
                            <YAxis yAxisId="right" orientation="right" stroke={CHART_STYLE.axisColor} />
                            <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                            <Legend />
                            <Area yAxisId="left" type="monotone" dataKey="revenue" fill={RETAIL_REVENUE.primary} stroke={RETAIL_REVENUE.primary} fillOpacity={0.3} name="Revenue ($)" />
                            <Line yAxisId="right" type="monotone" dataKey="sales" stroke={RETAIL_SALES.secondary} strokeWidth={2} name="Sales (Units)" dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No sales data available.</div>)}
            </div>

            {/* Supp 1: Product Sales Column */}
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Top Products by Sales</h3>
                {loading ? <div>Loading...</div> : (data?.productSales?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.productSales} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} horizontal={false} />
                            <XAxis type="number" stroke={CHART_STYLE.axisColor} />
                            <YAxis dataKey="sku" type="category" width={80} stroke={CHART_STYLE.axisColor} />
                            <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                            <Bar dataKey="sales" fill={RETAIL_SALES.primary} radius={[0, 4, 4, 0]} name="Units Sold" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No product sales data.</div>)}
            </div>

            {/* Supp 2: Revenue Donut */}
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Revenue Distribution</h3>
                {loading ? <div>Loading...</div> : (data?.productRevenue?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data.productRevenue} dataKey="revenue" nameKey="sku" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                                {data.productRevenue.map((entry, i) => (
                                    <Cell key={i} fill={[RETAIL_REVENUE.primary, RETAIL_REVENUE.secondary, RETAIL_REVENUE.trend, '#38BDF8'][i % 4]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `$${value}`} contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No revenue data.</div>)}
            </div>
        </AnalyticsSection>
    );
}

// ─── 2. SALES / POS ────────────────────────────────────────────────────────
export function RetailSalesPOS() {
    const { data: inventory, refetch: refetchInventory } = useApi('/retail/inventory');
    const { data: movements, refetch: refetchMovements } = useApi('/retail/stock-movements');
    const { data: analytics, loading, refetch: refetchAnalytics } = useApi('/retail/analytics/sales');
    
    const [sku, setSku] = useState('');
    const [quantity, setQuantity] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSale = async (e) => {
        e.preventDefault();
        setProcessing(true);
        try {
            await retailApi.createSale(sku, parseInt(quantity, 10));
            setSku(''); setQuantity('');
            refetchInventory(); refetchMovements(); refetchAnalytics();
            alert("Sale processed successfully.");
        } catch (e) {
            alert("Error processing sale: " + (e.response?.data?.detail || e.message));
        } finally {
            setProcessing(false);
        }
    };

    const columns = [
        { key: 'movement_id', header: 'ID', render: val => <strong title={val}>{String(val).substring(0,8)}...</strong> },
        { key: 'sku', header: 'SKU' },
        { key: 'movement_type', header: 'Type', render: val => <StatusPill status={val === 'IN' ? 'success' : 'active'} text={val} /> },
        { key: 'quantity', header: 'Qty' },
        { key: 'created_at', header: 'Date', render: val => new Date(val).toLocaleString() }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Point of Sale</h2>
                    <form onSubmit={handleSale} style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', display: 'grid', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Product</label>
                            <select value={sku} onChange={e => setSku(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                                <option value="">-- Select Product --</option>
                                {(inventory || []).map(p => <option key={p.sku} value={p.sku}>{p.name || p.sku} (SKU: {p.sku})</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>Quantity Sold</label>
                            <input type="number" min="1" required value={quantity} onChange={e => setQuantity(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                        </div>
                        <button type="submit" disabled={processing} style={{ padding: '0.75rem', background: 'var(--green)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Complete Sale</button>
                    </form>
                </div>

                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Recent Register Activity</h2>
                    <DataTable data={(movements || []).slice(0,5)} columns={columns} loading={!movements} emptyMessage="No recent activity." />
                </div>
            </div>

            <AnalyticsSection title="Sales Analytics" description="Analyze POS performance over time.">
                {/* Main: Monthly Volume Column */}
                <div style={{ gridColumn: '1 / -1', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '420px' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Monthly Sales Volume</h3>
                    {loading ? <div>Loading...</div> : (analytics?.monthly?.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.monthly}>
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                                <XAxis dataKey="month" stroke={CHART_STYLE.axisColor} />
                                <YAxis stroke={CHART_STYLE.axisColor} />
                                <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                                <Legend />
                                <Bar dataKey="volume" fill={RETAIL_SALES.primary} radius={[4, 4, 0, 0]} name="Units Sold" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No monthly sales data available.</div>)}
                </div>

                {/* Supp 1: Qty Line */}
                <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Daily Sales (Units)</h3>
                    {loading ? <div>Loading...</div> : (analytics?.dailyQty?.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.dailyQty}>
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                                <XAxis dataKey="day" stroke={CHART_STYLE.axisColor} />
                                <YAxis stroke={CHART_STYLE.axisColor} />
                                <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                                <Line type="monotone" dataKey="qty" stroke={RETAIL_SALES.qty} strokeWidth={2} dot={false} name="Units Sold" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No daily sales data.</div>)}
                </div>

                {/* Supp 2: Scatter */}
                <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Quantity vs Revenue</h3>
                    {loading ? <div>Loading...</div> : (analytics?.scatter?.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart>
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                                <XAxis type="number" dataKey="qty" name="Quantity" stroke={CHART_STYLE.axisColor} />
                                <YAxis type="number" dataKey="revenue" name="Revenue" stroke={CHART_STYLE.axisColor} />
                                <Tooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                                <Scatter name="Transactions" data={analytics.scatter} fill={RETAIL_SALES.secondary} />
                            </ScatterChart>
                        </ResponsiveContainer>
                    ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No transaction data.</div>)}
                </div>
            </AnalyticsSection>
        </div>
    );
}

// ─── 3. INVENTORY ────────────────────────────────────────────────────────
export function RetailInventoryAnalytics() {
    const { data: inventory, loading: invLoading } = useApi('/retail/inventory');
    const { data: analytics, loading } = useApi('/retail/analytics/inventory-detail');

    const columns = [
        { key: 'sku', header: 'SKU', render: val => <strong>{val}</strong> },
        { key: 'name', header: 'Product' },
        { key: 'available_stock', header: 'In Stock', render: (val, row) => <span style={{fontWeight: 'bold', color: val <= row.reorder_point ? 'var(--red)' : 'var(--text)'}}>{val}</span> },
        { key: 'reorder_point', header: 'Reorder Level' },
        { key: 'status', header: 'Status', render: (_, row) => <StatusPill status={row.available_stock > row.reorder_point ? 'success' : 'error'} text={row.available_stock > row.reorder_point ? 'Healthy' : 'Low Stock'} /> }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Store Inventory</h2>
                <DataTable data={inventory || []} columns={columns} loading={invLoading} emptyMessage="No inventory data available." />
            </div>

            <AnalyticsSection title="Inventory Health" description="Monitor stock movements and health alerts.">
                {/* Main: In/Out Stacked Column */}
                <div style={{ gridColumn: '1 / -1', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '420px' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Stock Movements (In vs Out)</h3>
                    {loading ? <div>Loading...</div> : (analytics?.inOut?.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.inOut}>
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                                <XAxis dataKey="day" stroke={CHART_STYLE.axisColor} />
                                <YAxis stroke={CHART_STYLE.axisColor} />
                                <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                                <Legend />
                                <Bar dataKey="stockIn" stackId="a" fill={RETAIL_INVENTORY.stockIn} name="Stock In" />
                                <Bar dataKey="stockOut" stackId="a" fill={RETAIL_INVENTORY.stockOut} name="Stock Out" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No movement data.</div>)}
                </div>

                {/* Supp 1: Level Trend */}
                <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Average Stock Level Trend</h3>
                    {loading ? <div>Loading...</div> : (analytics?.levelTrend?.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={analytics.levelTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                                <XAxis dataKey="day" stroke={CHART_STYLE.axisColor} />
                                <YAxis stroke={CHART_STYLE.axisColor} />
                                <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                                <Line type="monotone" dataKey="level" stroke={RETAIL_INVENTORY.level} strokeWidth={2} dot={false} name="Avg Stock" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No trend data.</div>)}
                </div>

                {/* Supp 2: Low Stock Lollipop (Bar) */}
                <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Low Stock Items</h3>
                    {loading ? <div>Loading...</div> : (analytics?.lowStock?.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.lowStock} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} horizontal={false} />
                                <XAxis type="number" stroke={CHART_STYLE.axisColor} />
                                <YAxis dataKey="sku" type="category" width={80} stroke={CHART_STYLE.axisColor} />
                                <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                                <Legend />
                                <Bar dataKey="current" fill={RETAIL_INVENTORY.lowStock} name="Current Stock" />
                                <Bar dataKey="reorder" fill={RETAIL_INVENTORY.primary} name="Reorder Point" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No low stock items.</div>)}
                </div>
            </AnalyticsSection>
        </div>
    );
}

// ─── 4. REPLENISHMENT / ORDERS ──────────────────────────────────────────────
export function RetailReplenishmentOrders() {
    const { data: recs, loading: recsLoading, refetch } = useApi('/retail/reorder/recommendations');
    const { data: analytics, loading } = useApi('/retail/analytics/replenishment');
    const [processing, setProcessing] = useState(null);

    const handleApprove = async (sku, qty) => {
        if (!window.confirm(`Approve reorder of ${qty} units for ${sku}?`)) return;
        setProcessing(sku);
        try {
            await retailApi.approveReorder(sku, qty);
            refetch();
            alert("Order pushed to Dealer network.");
        } catch (e) {
            alert("Error: " + (e.response?.data?.detail || e.message));
        } finally {
            setProcessing(null);
        }
    };

    const columns = [
        { key: 'sku', header: 'SKU', render: val => <strong>{val}</strong> },
        { key: 'name', header: 'Product' },
        { key: 'current_stock', header: 'Current Stock', render: val => <span style={{color: 'var(--red)', fontWeight: 'bold'}}>{val}</span> },
        { key: 'recommended_qty', header: 'Suggested Qty' },
        { 
            key: 'actions', 
            header: 'Actions',
            render: (_, row) => (
                <button disabled={processing === row.sku} onClick={() => handleApprove(row.sku, row.recommended_qty)} style={{ padding: '6px 12px', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Approve Reorder</button>
            )
        }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Auto-Reorder Engine</h2>
                <DataTable data={recs || []} columns={columns} loading={recsLoading} emptyMessage="Stock levels are healthy. No reorders needed." />
            </div>

            <AnalyticsSection title="Demand & Replenishment Analytics" description="Demand trends and stock health metrics.">
                {/* Main: Demand Trend Area */}
                <div style={{ gridColumn: '1 / -1', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '420px' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Demand Trend (Sales Volume)</h3>
                    {loading ? <div>Loading...</div> : (analytics?.demand?.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics.demand}>
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                                <XAxis dataKey="day" stroke={CHART_STYLE.axisColor} />
                                <YAxis stroke={CHART_STYLE.axisColor} />
                                <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                                <Area type="monotone" dataKey="demand" stroke={RETAIL_REPLENISHMENT.demand} fill={RETAIL_REPLENISHMENT.demand} fillOpacity={0.2} name="Units Demanded" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No demand data available.</div>)}
                </div>

                {/* Supp 1: Reorder Required Bar */}
                <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Products Requiring Reorder</h3>
                    {loading ? <div>Loading...</div> : (analytics?.reorders?.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.reorders} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} horizontal={false} />
                                <XAxis type="number" stroke={CHART_STYLE.axisColor} />
                                <YAxis dataKey="sku" type="category" width={80} stroke={CHART_STYLE.axisColor} />
                                <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                                <Bar dataKey="stock" fill={RETAIL_REPLENISHMENT.reorder} name="Current Stock" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No reorders required.</div>)}
                </div>

                {/* Supp 2: Bullet-style Composed Chart */}
                <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Stock vs Reorder Point</h3>
                    {loading ? <div>Loading...</div> : (analytics?.reorders?.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={analytics.reorders} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} horizontal={false} />
                                <XAxis type="number" stroke={CHART_STYLE.axisColor} />
                                <YAxis dataKey="sku" type="category" width={80} stroke={CHART_STYLE.axisColor} />
                                <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                                <Legend />
                                <Bar dataKey="reorderPoint" fill={RETAIL_REPLENISHMENT.primary} barSize={20} name="Reorder Target" />
                                <Scatter dataKey="stock" fill={RETAIL_REPLENISHMENT.stock} name="Current Stock" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>All stock healthy.</div>)}
                </div>
            </AnalyticsSection>
        </div>
    );
}

// ─── 5. WAYBILLS / SHIPMENTS ────────────────────────────────────────────────
export function RetailWaybillsShipments() {
    const { data: analytics, loading, error } = useApi('/retail/analytics/waybills');

    if (error) return <div style={{color:'var(--red)'}}>{error.message}</div>;

    return (
        <AnalyticsSection title="Shipments & Logistics" description="Track incoming orders and shipment risk.">
            {/* Main: Funnel Chart */}
            <div style={{ gridColumn: '1 / -1', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '420px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Shipment Lifecycle</h3>
                {loading ? <div>Loading...</div> : (analytics?.lifecycle?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <FunnelChart>
                            <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                            <Funnel dataKey="count" data={analytics.lifecycle} isAnimationActive>
                                {analytics.lifecycle.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={RETAIL_WAYBILL.stages[index % RETAIL_WAYBILL.stages.length]} />
                                ))}
                            </Funnel>
                        </FunnelChart>
                    </ResponsiveContainer>
                ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No shipment lifecycle data.</div>)}
            </div>

            {/* Supp 1: Incoming Volume */}
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Incoming Volume</h3>
                {loading ? <div>Loading...</div> : (analytics?.incoming?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.incoming}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                            <XAxis dataKey="day" stroke={CHART_STYLE.axisColor} />
                            <YAxis stroke={CHART_STYLE.axisColor} />
                            <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                            <Line type="monotone" dataKey="vol" stroke={RETAIL_WAYBILL.secondary} strokeWidth={2} name="Orders" />
                        </LineChart>
                    </ResponsiveContainer>
                ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No incoming volume data.</div>)}
            </div>

            {/* Supp 2: Risk Donut */}
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Shipment Risk</h3>
                {loading ? <div>Loading...</div> : (analytics?.riskDist?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={analytics.riskDist} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                                {analytics.riskDist.map((entry, i) => (
                                    <Cell key={i} fill={getRetailStatusColor(entry.status)} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No risk data available.</div>)}
            </div>
        </AnalyticsSection>
    );
}

// ─── 6. QR / TRACEABILITY ───────────────────────────────────────────────────
export function RetailQRTraceability() {
    const { data: analytics, loading } = useApi('/retail/analytics/traceability');
    const [scanId, setScanId] = useState('');
    const [result, setResult] = useState(null);
    const [processing, setProcessing] = useState(false);

    const handleScan = async (e) => {
        e.preventDefault();
        if (scanId.trim()) {
            setProcessing(true);
            try {
                const data = await retailApi.verifyWaybillTrust(scanId);
                if (data.success && data.data && data.data.is_valid) {
                    setResult({ 
                        status: 'VERIFIED', 
                        message: 'Waybill Document is authentic and matches blockchain records.', 
                        timestamp: new Date().toISOString(),
                        details: data.data 
                    });
                } else {
                    setResult({ status: 'FAILED', message: data.message || 'QR Verification failed or Waybill invalid.' });
                }
            } catch (err) {
                setResult({ status: 'FAILED', message: 'Could not connect to verification server.' });
            } finally {
                setProcessing(false);
            }
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ maxWidth: '600px' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem', color: 'var(--dashboard-heading)' }}>Blockchain QR Verification</h2>
                <form onSubmit={handleScan} style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                    <input type="text" value={scanId} onChange={e => setScanId(e.target.value)} placeholder="Scan or enter Document Hash" style={{ flex: 1, padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
                    <button type="submit" disabled={processing} style={{ padding: '0.75rem 1.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>{processing ? 'Verifying...' : 'Verify'}</button>
                </form>
                {result && (
                    <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: `1px solid ${result.status === 'VERIFIED' ? 'var(--green)' : 'var(--red)'}`, borderLeft: `4px solid ${result.status === 'VERIFIED' ? 'var(--green)' : 'var(--red)'}` }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: result.status === 'VERIFIED' ? 'var(--green)' : 'var(--red)' }}>
                            {result.status === 'VERIFIED' ? '✓ Authentic Product' : '✗ Verification Failed'}
                        </h3>
                        <p style={{ margin: '0 0 1rem 0' }}>{result.message}</p>
                        {result.timestamp && <div style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>Verified at: {new Date(result.timestamp).toLocaleString()}</div>}
                    </div>
                )}
            </div>

            <AnalyticsSection title="Supply Chain Traceability" description="Analyze product origin and custody events.">
                {/* Main: Flow Chart (Sankey) */}
                <div style={{ gridColumn: '1 / -1', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '420px' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Origin Tracing (Relationships)</h3>
                    {loading ? <div>Loading...</div> : (analytics?.sankey?.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <Sankey
                                data={{
                                    nodes: Array.from(new Set(analytics.sankey.flatMap(l => [l.source, l.target]))).map(name => ({name})),
                                    links: analytics.sankey.map(l => ({
                                        source: Array.from(new Set(analytics.sankey.flatMap(l => [l.source, l.target]))).indexOf(l.source),
                                        target: Array.from(new Set(analytics.sankey.flatMap(l => [l.source, l.target]))).indexOf(l.target),
                                        value: l.value
                                    }))
                                }}
                                node={{ stroke: 'var(--border)', strokeWidth: 2 }}
                                link={{ stroke: RETAIL_TRACEABILITY.primary }}
                                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                            >
                                <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                            </Sankey>
                        </ResponsiveContainer>
                    ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No trace data available.</div>)}
                </div>

                {/* Supp 1: Custody Timeline */}
                <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px', overflowY: 'auto' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Recent Custody Transfers</h3>
                    {loading ? <div>Loading...</div> : (analytics?.timeline?.length ? (
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {analytics.timeline.map((t, i) => (
                                <li key={i} style={{ borderBottom: '1px solid var(--border)', padding: '0.75rem 0' }}>
                                    <div style={{ fontWeight: 600 }}>{t.event_type} - {t.quantity} units</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>By: {t.actor_role} at {new Date(t.created_at).toLocaleString()}</div>
                                </li>
                            ))}
                        </ul>
                    ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No custody events found.</div>)}
                </div>

                {/* Supp 2: Batch Status */}
                <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                    <h3 style={{ margin: '0 0 1rem 0' }}>Batch Status Distribution</h3>
                    {loading ? <div>Loading...</div> : (analytics?.batchStatus?.length ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.batchStatus}>
                                <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                                <XAxis dataKey="status" stroke={CHART_STYLE.axisColor} />
                                <YAxis stroke={CHART_STYLE.axisColor} />
                                <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                                <Bar dataKey="count" fill={RETAIL_TRACEABILITY.batch} radius={[4, 4, 0, 0]} name="Batches" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No batch data available.</div>)}
                </div>
            </AnalyticsSection>
        </div>
    );
}

// ─── 7. RECEIVING ───────────────────────────────────────────────────────────
export function RetailReceiving() {
    const { data: analytics, loading } = useApi('/retail/analytics/receiving');

    return (
        <AnalyticsSection title="Receiving & Discrepancies" description="Monitor delivery accuracy and order fulfillment.">
            {/* Main: Clustered Column Ordered vs Received */}
            <div style={{ gridColumn: '1 / -1', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '420px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Ordered vs Received Quantity</h3>
                {loading ? <div>Loading...</div> : (analytics?.ordVsRec?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.ordVsRec}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                            <XAxis dataKey="order_code" stroke={CHART_STYLE.axisColor} />
                            <YAxis stroke={CHART_STYLE.axisColor} />
                            <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                            <Legend />
                            <Bar dataKey="ordered_quantity" fill={RETAIL_RECEIVING.ordered} name="Ordered" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="received_quantity" fill={RETAIL_RECEIVING.received} name="Received" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No receiving records found.</div>)}
            </div>

            {/* Supp 1: Variance Waterfall */}
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Quantity Variance</h3>
                {loading ? <div>Loading...</div> : (analytics?.variance?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.variance}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                            <XAxis dataKey="order" stroke={CHART_STYLE.axisColor} />
                            <YAxis stroke={CHART_STYLE.axisColor} />
                            <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                            <Bar dataKey="variance" fill={RETAIL_RECEIVING.discrepancy} name="Variance" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No variance data available.</div>)}
            </div>

            {/* Supp 2: Donut Status */}
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Receiving Status Distribution</h3>
                {loading ? <div>Loading...</div> : (analytics?.statusDist?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={analytics.statusDist} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                                {analytics.statusDist.map((entry, i) => (
                                    <Cell key={i} fill={getRetailStatusColor(entry.status)} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No receiving status data.</div>)}
            </div>
        </AnalyticsSection>
    );
}

// ─── 8. ALERTS / RAG ────────────────────────────────────────────────────────
export function RetailAlertCenter() {
    const { data: analytics, loading } = useApi('/retail/analytics/alerts');

    return (
        <AnalyticsSection title="Alerts & Risk" description="Monitor system anomalies and risk flags.">
            {/* Main: Severity Horizontal Bar */}
            <div style={{ gridColumn: '1 / -1', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '420px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Risk Severity Distribution</h3>
                {loading ? <div>Loading...</div> : (analytics?.severity?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.severity} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} horizontal={false} />
                            <XAxis type="number" stroke={CHART_STYLE.axisColor} />
                            <YAxis dataKey="severity" type="category" stroke={CHART_STYLE.axisColor} width={80} />
                            <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                            <Bar dataKey="count" name="Anomalies" radius={[0, 4, 4, 0]}>
                                {analytics.severity.map((entry, i) => (
                                    <Cell key={i} fill={getRetailStatusColor(entry.severity)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No risk data available.</div>)}
            </div>

            {/* Supp 1: Alert Trend */}
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Alerts Over Time</h3>
                {loading ? <div>Loading...</div> : (analytics?.trend?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.trend}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                            <XAxis dataKey="day" stroke={CHART_STYLE.axisColor} />
                            <YAxis stroke={CHART_STYLE.axisColor} />
                            <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                            <Line type="monotone" dataKey="count" stroke={RETAIL_RISK.AMBER} strokeWidth={2} name="Alerts" />
                        </LineChart>
                    </ResponsiveContainer>
                ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No trend data available.</div>)}
            </div>

            {/* Supp 2: Status Donut */}
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Alert Status</h3>
                {loading ? <div>Loading...</div> : (analytics?.status?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={analytics.status} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                                {analytics.status.map((entry, i) => (
                                    <Cell key={i} fill={getRetailStatusColor(entry.status)} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No alert status data.</div>)}
            </div>
        </AnalyticsSection>
    );
}

// ─── 9. REPORTS / ANALYTICS ─────────────────────────────────────────────────
export function RetailReports() {
    const { data: analytics, loading } = useApi('/retail/analytics/reports');

    return (
        <AnalyticsSection title="Executive Analytics" description="Consolidated view of performance metrics.">
            {/* Main: Composed Chart (Sales & Inventory) */}
            <div style={{ gridColumn: '1 / -1', background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '420px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Inventory & Sales Performance</h3>
                {loading ? <div>Loading...</div> : (analytics?.perf?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={analytics.perf}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} vertical={false} />
                            <XAxis dataKey="sku" stroke={CHART_STYLE.axisColor} />
                            <YAxis yAxisId="left" stroke={CHART_STYLE.axisColor} />
                            <YAxis yAxisId="right" orientation="right" stroke={CHART_STYLE.axisColor} />
                            <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                            <Legend />
                            <Bar yAxisId="left" dataKey="sales" fill={RETAIL_SALES.primary} name="Total Units Sold" radius={[4, 4, 0, 0]} />
                            <Line yAxisId="right" type="monotone" dataKey="inventory" stroke={RETAIL_INVENTORY.primary} strokeWidth={2} name="Current Stock" dot={false} />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No sales and inventory performance data.</div>)}
            </div>

            {/* Supp 1: Revenue Trend Line */}
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Revenue Trend</h3>
                {loading ? <div>Loading...</div> : (analytics?.revTrend?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analytics.revTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} />
                            <XAxis dataKey="day" stroke={CHART_STYLE.axisColor} />
                            <YAxis stroke={CHART_STYLE.axisColor} />
                            <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} />
                            <Line type="monotone" dataKey="revenue" stroke={RETAIL_REVENUE.primary} strokeWidth={2} name="Revenue ($)" dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No revenue data available.</div>)}
            </div>

            {/* Supp 2: Product Performance Bar */}
            <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', height: '380px' }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Top Products by Revenue</h3>
                {loading ? <div>Loading...</div> : (analytics?.prodPerf?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.prodPerf} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke={CHART_STYLE.gridColor} horizontal={false} />
                            <XAxis type="number" stroke={CHART_STYLE.axisColor} />
                            <YAxis dataKey="sku" type="category" width={80} stroke={CHART_STYLE.axisColor} />
                            <Tooltip contentStyle={{ backgroundColor: CHART_STYLE.tooltipBg, color: CHART_STYLE.tooltipText }} formatter={(value) => `$${value}`} />
                            <Bar dataKey="revenue" fill={RETAIL_REVENUE.trend} name="Total Revenue" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100%',color:'var(--muted)'}}>No product performance data.</div>)}
            </div>
        </AnalyticsSection>
    );
}
