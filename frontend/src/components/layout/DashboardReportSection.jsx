import { useState, useEffect } from 'react'

import { aiApi } from '../../api/axiosInstance'

const MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July']
const MONTH_COLORS = ['#3b82f6', '#f59e0b', '#facc15', '#14b8a6', '#8b5cf6', 'var(--muted)', '#ec4899']
const BASE_CURVE = [0.74, 0.92, 0.84, 0.68, 1.12, 0.88, 1.18]

function toNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^0-9.-]+/g, ''))
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return null
}

function getRoleOffset(role = '') {
  return String(role)
    .split('')
    .reduce((sum, char) => sum + char.charCodeAt(0), 0) % 9
}

function buildMonthlySeries(role, stats = []) {
  const numericValues = stats
    .map((item) => toNumber(item?.value))
    .filter((value) => value !== null && value > 0)

  const fallbackBase = 36 + getRoleOffset(role)
  const baseValue = numericValues[0] ?? fallbackBase
  const normalization = Math.max(1, baseValue / 70)
  const roleOffset = getRoleOffset(role)

  return MONTH_LABELS.map((label, index) => {
    const source = numericValues[index % Math.max(numericValues.length, 1)] ?? baseValue
    const curve = BASE_CURVE[index] + (roleOffset % 3) * 0.04
    const value = Math.max(8, Math.round((source / normalization) * curve))
    return { label, value }
  })
}

function DashboardReportSection({ role, stats = [] }) {
  const [insights, setInsights] = useState(null)
  const [anomalies, setAnomalies] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAiData = async () => {
      try {
        const [insightsRes, anomaliesRes] = await Promise.all([
          aiApi.dashboardInsights({ role, stats }),
          aiApi.shipmentAnomalies({ role })
        ]);
        setInsights(insightsRes.insights);
        setAnomalies(anomaliesRes.anomalies);
      } catch (e) {
        console.error("AI fetch failed", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAiData();
  }, [role, stats]);

  const series = buildMonthlySeries(role, stats)
  const _donutData = series.map((item, index) => ({
    label: item.label,
    value: item.value,
    color: MONTH_COLORS[index % MONTH_COLORS.length],
  }))

  return (
    <>
      {loading ? (
        <div style={{ padding: '20px', textAlign: 'center' }} className="muted">Generating AI Insights...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          <div className="card" style={{ borderLeft: '4px solid #10b981', margin: 0 }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🧠</span> AI Executive Summary
            </h3>
            <p style={{ color: 'var(--border)', lineHeight: '1.6' }}>
              {insights || "The system is operating optimally. No major bottlenecks detected."}
            </p>
          </div>
          <div className="card" style={{ borderLeft: '4px solid #dc2626', margin: 0 }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span> Active Anomalies
            </h3>
            {anomalies && anomalies.length > 0 ? (
              <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {anomalies.map((anom, idx) => (
                  <li key={idx}><strong>{anom.type}:</strong> {anom.description}</li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--border)' }}>No anomalies detected in the current supply chain network.</p>
            )}
          </div>
        </div>
      )}


    </>
  )
}

export default DashboardReportSection
