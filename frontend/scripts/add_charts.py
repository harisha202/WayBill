import os
import re

# 1. Update AdminFeatures.jsx
admin_file = r"c:\Users\91797\OneDrive\Desktop\WayBill\frontend\src\components\dashboard\AdminFeatures.jsx"
with open(admin_file, 'r', encoding='utf-8') as f:
    admin_content = f.read()

admin_charts = """
import BarChart from '../charts/BarChart';
import StatusDonut from '../charts/StatusDonut';

export function RevenueVsCostChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../../api/axiosInstance').then(({ adminApi }) => {
      adminApi.client.get('/admin/analytics/revenue-cost').then(res => setData(res.data.data)).catch(() => {}).finally(() => setLoading(false));
    });
  }, []);

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card" style={{ borderTop: '4px solid #1d4ed8' }}>
      <h2 className="card-title">Revenue vs Cost</h2>
      <div style={{ height: '300px' }}>
        <BarChart title="Financials" labels={data.map(d => d.month)} data={data.map(d => d.revenue)} color="#10b981" />
      </div>
    </div>
  );
}

export function OrderPipelineChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    import('../../api/axiosInstance').then(({ adminApi }) => {
      adminApi.client.get('/admin/analytics/order-pipeline').then(res => {
          setData(res.data.data.map(d => ({ label: d.status, value: d.count, color: '#3b82f6' })));
      }).catch(() => {}).finally(() => setLoading(false));
    });
  }, []);

  if (loading) return <div className="card">Loading...</div>;

  return (
    <div className="card" style={{ borderTop: '4px solid #1d4ed8' }}>
      <h2 className="card-title">Order Pipeline</h2>
      <div style={{ height: '300px' }}>
        <StatusDonut title="Orders" data={data} />
      </div>
    </div>
  );
}
"""
if "RevenueVsCostChart" not in admin_content:
    admin_content += admin_charts
    with open(admin_file, 'w', encoding='utf-8') as f: f.write(admin_content)


# 2. Update DealerFeatures.jsx
dealer_file = r"c:\Users\91797\OneDrive\Desktop\WayBill\frontend\src\components\dashboard\DealerFeatures.jsx"
with open(dealer_file, 'r', encoding='utf-8') as f:
    dealer_content = f.read()

dealer_charts = """
import BarChart from '../charts/BarChart';

export function BackorderTrendChart() {
  const [data, setData] = useState([]);
  useEffect(() => {
    import('../../api/axiosInstance').then(({ dealerApi }) => {
      dealerApi.client.get('/dealer/analytics/backorders').then(res => setData(res.data.data)).catch(() => {});
    });
  }, []);

  return (
    <div className="card" style={{ borderTop: '4px solid #f59e0b' }}>
      <h2 className="card-title">Backorder Trend</h2>
      <div style={{ height: '300px' }}>
        <BarChart title="Backorders" labels={data.map(d => d.day)} data={data.map(d => d.count)} color="#dc2626" />
      </div>
    </div>
  );
}

export function MarginChart() {
  const [data, setData] = useState([]);
  useEffect(() => {
    import('../../api/axiosInstance').then(({ dealerApi }) => {
      dealerApi.client.get('/dealer/analytics/margin').then(res => setData(res.data.data)).catch(() => {});
    });
  }, []);

  return (
    <div className="card" style={{ borderTop: '4px solid #f59e0b' }}>
      <h2 className="card-title">Margin (%)</h2>
      <div style={{ height: '300px' }}>
        <BarChart title="Margin" labels={data.map(d => d.month)} data={data.map(d => d.margin_pct)} color="#10b981" />
      </div>
    </div>
  );
}
"""
if "BackorderTrendChart" not in dealer_content:
    dealer_content += dealer_charts
    with open(dealer_file, 'w', encoding='utf-8') as f: f.write(dealer_content)

# 3. Update RetailFeatures.jsx
retail_file = r"c:\Users\91797\OneDrive\Desktop\WayBill\frontend\src\components\dashboard\RetailFeatures.jsx"
with open(retail_file, 'r', encoding='utf-8') as f:
    retail_content = f.read()

retail_charts = """
export function InventoryVsReorderChart() {
  const [data, setData] = useState([]);
  useEffect(() => {
    import('../../api/axiosInstance').then(({ inventoryApi }) => {
      inventoryApi.client.get('/inventory/analytics/inventory-reorder').then(res => setData(res.data.data)).catch(() => {});
    });
  }, []);

  return (
    <div className="card" style={{ borderTop: '4px solid #059669' }}>
      <h2 className="card-title">Inventory vs Reorder Point</h2>
      <div style={{ height: '300px' }}>
        <BarChart title="Stock Levels" labels={data.map(d => d.sku)} data={data.map(d => d.stock)} color="#3b82f6" />
      </div>
    </div>
  );
}
"""
if "InventoryVsReorderChart" not in retail_content:
    retail_content += retail_charts
    with open(retail_file, 'w', encoding='utf-8') as f: f.write(retail_content)

print("Frontend components added.")
