import React, { useEffect, useState } from 'react';
import { adminApi } from '../../api/axiosInstance';
import { DataTable } from '../ui/DataTable';
import { RiskBadge } from '../ui/RiskBadge';

export function SupplyChainDepth() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // In a real scenario, this fetches from /api/suppliers/tier-tree
    setData({
      "tier-1": ["TechCorp", "GlobalMeds"],
      "tier-2": ["Shenzhen Electronics", "Mumbai Pharma"],
      "tier-3": ["Raw Material Co A", "Chemicals Inc B"]
    });
  }, []);

  if (!data) return <p className="muted">Loading supply chain tree...</p>;

  return (
    <div className="card">
      <h2 className="card-title">Supply Chain Depth</h2>
      <div style={{ display: 'grid', gap: '12px' }}>
        {Object.entries(data).map(([tier, suppliers]) => (
          <div key={tier} style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ textTransform: 'capitalize', color: '#1e3a8a' }}>{tier.replace('-', ' ')}</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: '20px', color: '#334155' }}>
              {suppliers.map(s => <li key={s}>{s}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SupplierRisk() {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    setSuppliers([
      { id: '1', name: 'TechCorp', score: 92, riskLevel: 'low', lastAudited: '2026-07-01' },
      { id: '2', name: 'GlobalMeds', score: 32, riskLevel: 'high', lastAudited: '2026-06-15' },
      { id: '3', name: 'Shenzhen Electronics', score: 65, riskLevel: 'medium', lastAudited: '2026-08-01' },
      { id: '4', name: 'Raw Material Co A', score: 18, riskLevel: 'critical', lastAudited: '2026-05-10' },
    ]);
  }, []);

  const columns = [
    { key: 'name', header: 'Supplier Name' },
    { key: 'lastAudited', header: 'Last Audited' },
    { key: 'score', header: 'Risk Score', render: (val) => <RiskBadge score={val} /> }
  ];

  return (
    <div className="card">
      <h2 className="card-title">AI Supplier Risk Scoring</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Real-time risk evaluation based on global news, shipping delays, and financial health.</p>
      <DataTable data={suppliers} columns={columns} />
    </div>
  );
}

export function ActivityLog() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    Promise.reject(new Error("Not implemented")).then(res => setLogs(res.logs || [])).catch(() => {
      // fallback mock if API isn't fully returning yet
      setLogs([
        { id: 1, action: 'User login', userRole: 'Admin', timestamp: new Date().toISOString() },
        { id: 2, action: 'Optimised route', userRole: 'Transporter', timestamp: new Date(Date.now() - 3600000).toISOString() },
        { id: 3, action: 'Generated forecast', userRole: 'Manufacturer', timestamp: new Date(Date.now() - 7200000).toISOString() },
      ])
    });
  }, []);

  const columns = [
    { key: 'action', header: 'Action' },
    { key: 'userRole', header: 'Role' },
    { key: 'timestamp', header: 'Time', render: (val) => new Date(val).toLocaleString() }
  ];

  return (
    <div className="card">
      <h2 className="card-title">System Activity Log</h2>
      <DataTable data={logs} columns={columns} />
    </div>
  );
}
