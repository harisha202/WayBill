import React from 'react';

/**
 * AnalyticsSection — Implements the exact layout spec:
 *   Header → KPI Strip → Main (12/12) → Supporting Grid (6/12 + 6/12) → Wide (12/12) → Insight
 */
export function AnalyticsSection({ title, description, actions, kpis, main, supportingLeft, supportingRight, supportingWide, insight }) {
  return (
    <section className="analytics-section">
      <div className="analytics-section-header">
        <div>
          <h2 className="analytics-section-title">{title}</h2>
          {description && <p className="analytics-section-desc">{description}</p>}
        </div>
        {actions && <div className="analytics-section-actions">{actions}</div>}
      </div>

      {kpis && <div className="analytics-kpi-strip">{kpis}</div>}

      {main && <div className="analytics-main">{main}</div>}

      {(supportingLeft || supportingRight) && (
        <div className="analytics-supporting-grid">
          {supportingLeft && <div>{supportingLeft}</div>}
          {supportingRight && <div>{supportingRight}</div>}
        </div>
      )}

      {supportingWide && <div className="analytics-supporting-wide">{supportingWide}</div>}

      {insight && <div className="analytics-insight">{insight}</div>}
    </section>
  );
}

/**
 * KPICard — Simple KPI display card
 */
export function KPICard({ label, value, unit, trend, color, icon }) {
  return (
    <div className="analytics-kpi-card" style={{ borderTop: `3px solid ${color || 'var(--blue)'}` }}>
      <div className="analytics-kpi-icon">{icon}</div>
      <div className="analytics-kpi-value" style={{ color: color }}>
        {value !== undefined && value !== null ? value.toLocaleString() : '—'}{unit && <span className="analytics-kpi-unit">{unit}</span>}
      </div>
      <div className="analytics-kpi-label">{label}</div>
      {trend !== undefined && (
        <div className="analytics-kpi-trend" style={{ color: trend >= 0 ? 'var(--green)' : 'var(--red)' }}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </div>
      )}
    </div>
  );
}
