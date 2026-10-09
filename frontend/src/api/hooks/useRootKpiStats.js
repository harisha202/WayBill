import { useState, useEffect, useCallback } from 'react';
import apiClient from '../axiosInstance';
import { normalizeRole } from '../../config/routes';

export function useRootKpiStats(role, isRootOverview) {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    if (!isRootOverview || !role) {
      setStats([]);
      return;
    }

    setLoading(true);
    setError(null);
    const norm = normalizeRole(role);

    try {
      if (norm === 'Admin') {
        const res = await apiClient.get('/admin/analytics/control-tower');
        const kpis = res?.data?.kpis || res?.kpis || {};
        const total = kpis.total_orders ?? 0;
        const completed = kpis.completed_orders ?? 0;
        const rate = kpis.completion_rate ?? 0;
        const risk = kpis.total_risk_shipments ?? 0;
        const stock = kpis.total_stock ?? 0;

        setStats([
          { label: 'Order Pipeline', value: total, trend: 0 },
          { label: 'Completed Orders', value: completed, trend: 0 },
          { label: 'Pipeline Completion Rate', value: `${rate}%`, trend: 0 },
          { label: 'Risk Shipments', value: risk, trend: 0 },
          { label: 'Total Stock Units', value: stock.toLocaleString(), trend: 0 },
        ]);
      } else if (norm === 'Manufacturer') {
        const res = await apiClient.get('/manufacturer/analytics/dashboard');
        const kpis = res?.data?.kpis || res?.kpis || {};
        const total = kpis.total_orders ?? 0;
        const active = kpis.active_orders ?? 0;
        const completed = kpis.completed_orders ?? 0;
        const totalQty = kpis.total_qty ?? 0;
        const compRate = kpis.completion_rate ?? 0;

        setStats([
          { label: 'Batch Work Orders', value: total, trend: 0 },
          { label: 'Active Production', value: active, trend: 0 },
          { label: 'Completed Batches', value: completed, trend: 0 },
          { label: 'Production Units', value: totalQty.toLocaleString(), trend: 0 },
          { label: 'Completion Rate', value: `${compRate}%`, trend: 0 },
        ]);
      } else if (norm === 'Transporter') {
        const [overviewRes, fleetRes] = await Promise.allSettled([
          apiClient.get('/tracking/analytics/overview'),
          apiClient.get('/tracking/fleet'),
        ]);

        const overview = overviewRes.status === 'fulfilled' ? (overviewRes.value?.data || overviewRes.value || {}) : {};
        const fleetData = fleetRes.status === 'fulfilled' ? (fleetRes.value?.data || fleetRes.value || []) : [];
        const fleetCount = Array.isArray(fleetData) ? fleetData.length : 0;

        const onTime = overview.onTimeCount ?? 0;
        const sla = overview.slaRate ?? 0;
        const delayed = overview.delayedCount ?? 0;
        const delayReasons = overview.delayReasons || [];
        const interventionsCount = delayReasons.reduce((acc, r) => acc + (r.count || 0), 0);

        setStats([
          { label: 'Active Fleet Vehicles', value: fleetCount, trend: 0 },
          { label: 'On-Time Deliveries', value: onTime, trend: 0 },
          { label: 'Delayed Shipments', value: delayed, trend: 0 },
          { label: 'Fleet SLA Rate', value: `${sla}%`, trend: 0 },
          { label: 'Interventions Logged', value: interventionsCount, trend: 0 },
        ]);
      } else if (norm === 'Dealer') {
        const res = await apiClient.get('/dealer/analytics/dashboard');
        const kpis = res?.kpis || res?.data?.kpis || {};
        const total = kpis.totalOrders ?? 0;
        const delivered = kpis.deliveredOrders ?? 0;
        const pending = kpis.pendingOrders ?? 0;
        const lowStock = kpis.lowStockProducts ?? 0;
        const fulfillRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

        setStats([
          { label: 'Pipeline Orders', value: total, trend: 0 },
          { label: 'Delivered Orders', value: delivered, trend: 0 },
          { label: 'Pending Orders', value: pending, trend: 0 },
          { label: 'Low Stock Alerts', value: lowStock, trend: 0 },
          { label: 'Fulfillment Rate', value: `${fulfillRate}%`, trend: 0 },
        ]);
      } else if (norm === 'RetailShop') {
        const [dashRes, invRes] = await Promise.allSettled([
          apiClient.get('/retail/analytics/dashboard'),
          apiClient.get('/retail/inventory'),
        ]);

        const data = dashRes.status === 'fulfilled' ? (dashRes.value?.data || dashRes.value || {}) : {};
        const inv = invRes.status === 'fulfilled' ? (invRes.value?.data || invRes.value || []) : [];
        const totalRev = data.totalRevenue ?? 0;
        const productSales = data.productSales || [];
        const unitsSold = productSales.reduce((acc, p) => acc + (p.sales || 0), 0);
        const skuCount = Array.isArray(inv) ? inv.length : (productSales.length || 0);
        const days = (data.trend || []).length || 1;
        const avgDaily = Math.round(totalRev / days);

        setStats([
          { label: 'Daily POS Sales', value: `₹${Number(avgDaily || 0).toLocaleString()}`, trend: 0 },
          { label: 'Total Revenue (30d)', value: `₹${Number(totalRev || 0).toLocaleString()}`, trend: 0 },
          { label: 'Units Sold', value: unitsSold.toLocaleString(), trend: 0 },
          { label: 'Active SKUs', value: skuCount, trend: 0 },
          { label: 'Sales Days Tracked', value: days, trend: 0 },
        ]);
      }
    } catch (err) {
      console.error('Failed to load root KPIs for role:', role, err);
      setError(err);
      // Fallback to honest 0 metrics instead of hardcoded numbers
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, [role, isRootOverview]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
}
