import React, { useEffect, useState } from 'react';
import { suppliersApi, blockchainApi } from '../../api/axiosInstance';
import { DataTable } from '../ui/DataTable';
import { RiskBadge } from '../ui/RiskBadge';
import { WaybillDocumentViewer } from '../ui/WaybillDocumentViewer';

const TreeNode = ({ node }) => (
  <div className="tree-node-wrapper">
    <div className="tree-node-card">
      <div className="tree-node-name">{node.name}</div>
      <div className="tree-node-tier">{node.tier} Supplier</div>
    </div>
    {node.children && node.children.length > 0 && (
      <div className="tree-children">
        {node.children.map(child => <TreeNode key={child.supplier_id} node={child} />)}
      </div>
    )}
  </div>
);

export function SupplyChainDepth() {
  const [data, setData] = useState([]);

  useEffect(() => {
    suppliersApi.getTierTree()
      .then(res => {
        setData(res.data || []);
      })
      .catch(err => {
        console.error("Failed to fetch supply chain depth", err);
        setData([]);
      });
  }, []);

  if (!data || data.length === 0) return <p className="muted">Loading supply chain tree...</p>;

  return (
    <div className="card">
      <h2 className="card-title">Flagship Tier-Tree Diagram</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Complete visualization of your N-Tier supply chain depth.</p>
      <div className="supplier-tree-container">
        {data.map(rootNode => (
          <TreeNode key={rootNode.supplier_id} node={rootNode} />
        ))}
      </div>
    </div>
  );
}

export function SupplierRisk() {
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    suppliersApi.getTierTree()
      .then(res => {
        const allSuppliers = [];
        Object.values(res.data || {}).forEach(tierList => {
          tierList.forEach(s => {
            if (s.name && s.score) {
              allSuppliers.push({
                id: s.id,
                name: s.name,
                score: s.score,
                lastAudited: s.lastAudited || 'Recently'
              });
            }
          });
        });
        setSuppliers(allSuppliers);
      })
      .catch(err => console.error("Failed to fetch suppliers", err));
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
      {suppliers.length > 0 ? (
        <DataTable data={suppliers} columns={columns} />
      ) : (
        <p className="muted">No risk data available.</p>
      )}
    </div>
  );
}

export function BlockchainMonitor() {
  const [waybills, setWaybills] = useState([]);
  const [selectedWaybillId, setSelectedWaybillId] = useState(null);

  useEffect(() => {
    blockchainApi.getWaybills()
      .then(res => setWaybills(res.items || []))
      .catch(err => console.error(err));
  }, []);

  const columns = [
    { key: 'waybill_id', header: 'Waybill ID' },
    { key: 'order_id', header: 'Order' },
    { key: 'current_custodian', header: 'Custodian' },
    { key: 'status', header: 'Status' },
    { key: 'action', header: 'Action', render: (_, row) => (
      <button 
        className="primary-btn" 
        style={{ padding: '4px 8px', fontSize: '0.8rem' }}
        onClick={() => setSelectedWaybillId(row.waybill_id)}
      >
        View Document
      </button>
    )}
  ];

  return (
    <div className="card" style={{ borderTop: '4px solid #10b981' }}>
      <h2 className="card-title">Blockchain Document Monitor</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Network-wide ledger of active Waybill Documents and their custody state.</p>
      {waybills.length > 0 ? (
        <DataTable data={waybills} columns={columns} />
      ) : (
        <p className="muted">No waybill documents active.</p>
      )}

      {selectedWaybillId && (
        <WaybillDocumentViewer 
          waybillId={selectedWaybillId} 
          onClose={() => setSelectedWaybillId(null)} 
        />
      )}
    </div>
  );
}

export function ControlTower() {
  return (
    <div className="card" style={{ borderTop: '4px solid #1d4ed8' }}>
      <h2 className="card-title" style={{ color: '#1d4ed8' }}>Admin Control Tower</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Network-wide active alerts and critical bottlenecks requiring override authorization.</p>
      <div className="command-grid">
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-icon">⚠️</span>
            <span className="kpi-label">CRITICAL</span>
          </div>
          <div className="kpi-value">4</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-top">
            <span className="kpi-icon">🛂</span>
            <span className="kpi-label">PENDING</span>
          </div>
          <div className="kpi-value">12</div>
        </div>
      </div>
    </div>
  );
}

export function GlobalCompliance() {
  return (
    <div className="card">
      <h2 className="card-title">Global Compliance & Certifications</h2>
      <p className="muted" style={{ marginBottom: '16px' }}>Verification of ISO standards, emissions limits, and international trade holds.</p>
      <div className="data-table">
        <table style={{ width: '100%', textAlign: 'left' }}>
          <thead>
            <tr>
              <th>Region</th>
              <th>Status</th>
              <th>Last Checked</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>NA-East</td>
              <td><span className="pill active">Passed</span></td>
              <td>Today</td>
            </tr>
            <tr>
              <td>EU-Central</td>
              <td><span className="pill warning">Warning</span></td>
              <td>Today</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
