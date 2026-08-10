import os

# 1. Backend APIs for Tracking/Transporter Analytics
tracking_file = r"c:\Users\91797\OneDrive\Desktop\WayBill\backend\app\api\tracking.py"
with open(tracking_file, 'r', encoding='utf-8') as f:
    tracking_content = f.read()

tracking_analytics = """
@router.get("/analytics/route-cost")
def get_route_cost(payload: dict = Depends(require_roles(UserRole.admin, UserRole.transporter))):
    data = [
        {"route": "Mumbai - Delhi", "before": 12000, "after": 9500},
        {"route": "Chennai - Blr", "before": 4500, "after": 3800},
        {"route": "Delhi - Pune", "before": 14000, "after": 11000}
    ]
    return APIResponse(success=True, data=data)

@router.get("/analytics/fleet-utilization")
def get_fleet_utilization(payload: dict = Depends(require_roles(UserRole.admin, UserRole.transporter))):
    data = [
        {"status": "Active", "count": 24},
        {"status": "Idle", "count": 6},
        {"status": "Maintenance", "count": 2}
    ]
    return APIResponse(success=True, data=data)

@router.get("/analytics/delay-risk")
def get_delay_risk(payload: dict = Depends(require_roles(UserRole.admin, UserRole.transporter))):
    data = [
        {"risk_level": "Low", "count": 15},
        {"risk_level": "Medium", "count": 7},
        {"risk_level": "High", "count": 2}
    ]
    return APIResponse(success=True, data=data)
"""
if "/analytics/route-cost" not in tracking_content:
    with open(tracking_file, 'a', encoding='utf-8') as f:
        f.write("\n" + tracking_analytics)

# 2. Frontend React Components
transporter_file = r"c:\Users\91797\OneDrive\Desktop\WayBill\frontend\src\components\dashboard\TransporterFeatures.jsx"
with open(transporter_file, 'r', encoding='utf-8') as f:
    transporter_content = f.read()

transporter_charts = """
import BarChart from '../charts/BarChart';
import StatusDonut from '../charts/StatusDonut';

export function RouteCostChart() {
  const [data, setData] = useState([]);
  useEffect(() => {
    import('../../api/axiosInstance').then(({ trackingApi }) => {
      trackingApi.client.get('/tracking/analytics/route-cost').then(res => setData(res.data.data)).catch(() => {});
    });
  }, []);
  return (
    <div className="card" style={{ borderTop: '4px solid #2563eb' }}>
      <h2 className="card-title">Route Cost Optimization</h2>
      <div style={{ height: '300px' }}>
        <BarChart title="Cost Saving" labels={data.map(d => d.route)} data={data.map(d => d.before - d.after)} color="#10b981" />
      </div>
    </div>
  );
}

export function FleetUtilizationChart() {
  const [data, setData] = useState([]);
  useEffect(() => {
    import('../../api/axiosInstance').then(({ trackingApi }) => {
      trackingApi.client.get('/tracking/analytics/fleet-utilization').then(res => {
          setData(res.data.data.map(d => ({ label: d.status, value: d.count, color: d.status === 'Active' ? '#3b82f6' : '#9ca3af' })));
      }).catch(() => {});
    });
  }, []);
  return (
    <div className="card" style={{ borderTop: '4px solid #2563eb' }}>
      <h2 className="card-title">Fleet Utilization</h2>
      <div style={{ height: '300px' }}>
        <StatusDonut title="Fleet" data={data} />
      </div>
    </div>
  );
}

export function DelayRiskChart() {
  const [data, setData] = useState([]);
  useEffect(() => {
    import('../../api/axiosInstance').then(({ trackingApi }) => {
      trackingApi.client.get('/tracking/analytics/delay-risk').then(res => {
          setData(res.data.data.map(d => ({ label: d.risk_level, value: d.count, color: d.risk_level === 'Low' ? '#10b981' : d.risk_level === 'Medium' ? '#f59e0b' : '#ef4444' })));
      }).catch(() => {});
    });
  }, []);
  return (
    <div className="card" style={{ borderTop: '4px solid #2563eb' }}>
      <h2 className="card-title">Delay Risk Distribution</h2>
      <div style={{ height: '300px' }}>
        <StatusDonut title="Risk" data={data} />
      </div>
    </div>
  );
}
"""
if "RouteCostChart" not in transporter_content:
    with open(transporter_file, 'w', encoding='utf-8') as f:
        f.write(transporter_charts + "\n" + transporter_content)

print("Transporter scripts created.")
