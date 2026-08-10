import React from 'react';

export const StatCard = ({ title, value, change, trend = 'up', icon, className = '' }) => (
  <div className={`ui-stat-card ${className}`}>
    <div className="ui-stat-header">
      <h3 className="ui-stat-title">{title}</h3>
      {icon && <span className="ui-stat-icon">{icon}</span>}
    </div>
    <div className="ui-stat-body">
      <span className="ui-stat-value">{value}</span>
      {change && (
        <span className={`ui-stat-change trend-${trend}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '−'} {change}
        </span>
      )}
    </div>
  </div>
);

export const StatusPill = ({ status, label, className = '' }) => {
  return (
    <span className={`ui-status-pill status-${status.toLowerCase()} ${className}`}>
      {label || status}
    </span>
  );
};

export const RiskBadge = ({ level, className = '' }) => {
  const levels = {
    low: { label: 'Low Risk', class: 'risk-low' },
    medium: { label: 'Medium Risk', class: 'risk-medium' },
    high: { label: 'High Risk', class: 'risk-high' },
    critical: { label: 'Critical Risk', class: 'risk-critical' }
  };
  const config = levels[level?.toLowerCase()] || levels.low;
  return (
    <span className={`ui-risk-badge ${config.class} ${className}`}>
      <span className="ui-risk-dot"></span>
      {config.label}
    </span>
  );
};

export const DataTable = ({ columns, data, onSort, placeholder = false, className = '' }) => (
  <div className={`ui-data-table-container ${className}`}>
    <table className="ui-data-table">
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i} onClick={() => onSort && onSort(col.key)} className={col.sortable ? 'sortable' : ''}>
              {col.label} {col.sortable && <span className="sort-icon">↕</span>}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((row, i) => (
            <tr key={i}>
              {columns.map((col, j) => (
                <td key={j}>{row[col.key]}</td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={columns.length} className="ui-table-empty">
              {placeholder ? 'Loading data...' : 'No data available'}
            </td>
          </tr>
        )}
      </tbody>
    </table>
    <div className="ui-pagination-placeholder">
      <button className="ui-btn-outline" disabled>Previous</button>
      <span>Page 1 of 10</span>
      <button className="ui-btn-outline">Next</button>
    </div>
  </div>
);

export const ChartCard = ({ title, children, action, className = '' }) => (
  <div className={`ui-chart-card ${className}`}>
    <div className="ui-chart-header">
      <h3 className="ui-chart-title">{title}</h3>
      {action && <div className="ui-chart-action">{action}</div>}
    </div>
    <div className="ui-chart-content">
      {children || <div className="ui-chart-placeholder">Chart Visualization</div>}
    </div>
  </div>
);

export const PageHeader = ({ title, subtitle, actions, className = '' }) => (
  <div className={`ui-page-header ${className}`}>
    <div className="ui-header-text">
      <h1 className="ui-header-title">{title}</h1>
      {subtitle && <p className="ui-header-subtitle">{subtitle}</p>}
    </div>
    {actions && <div className="ui-header-actions">{actions}</div>}
  </div>
);

export const FilterBar = ({ children, className = '' }) => (
  <div className={`ui-filter-bar ${className}`}>
    {children}
  </div>
);

export const Timeline = ({ events, className = '' }) => (
  <div className={`ui-timeline ${className}`}>
    {events.map((evt, i) => (
      <div key={i} className="ui-timeline-item">
        <div className="ui-timeline-dot"></div>
        <div className="ui-timeline-content">
          <div className="ui-timeline-time">{evt.time}</div>
          <div className="ui-timeline-title">{evt.title}</div>
          {evt.description && <div className="ui-timeline-desc">{evt.description}</div>}
        </div>
      </div>
    ))}
  </div>
);

export const Modal = ({ isOpen, onClose, title, children, footer, className = '' }) => {
  if (!isOpen) return null;
  return (
    <div className="ui-modal-overlay" onClick={onClose}>
      <div className={`ui-modal-content ${className}`} onClick={e => e.stopPropagation()}>
        <div className="ui-modal-header">
          <h2 className="ui-modal-title">{title}</h2>
          <button className="ui-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="ui-modal-body">
          {children}
        </div>
        {footer && <div className="ui-modal-footer">{footer}</div>}
      </div>
    </div>
  );
};

export const EmptyState = ({ icon, title, description, action, className = '' }) => (
  <div className={`ui-empty-state ${className}`}>
    {icon && <div className="ui-empty-icon">{icon}</div>}
    <h3 className="ui-empty-title">{title}</h3>
    {description && <p className="ui-empty-desc">{description}</p>}
    {action && <div className="ui-empty-action">{action}</div>}
  </div>
);

export const Skeleton = ({ type = 'rect', width = '100%', height = '20px', className = '' }) => (
  <div 
    className={`ui-skeleton skeleton-${type} ${className}`} 
    style={{ width, height }}
  ></div>
);

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger' }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} className="ui-confirm-dialog">
      <div className="ui-confirm-message">{message}</div>
      <div className="ui-confirm-actions">
        <button className="ui-btn-outline" onClick={onClose}>{cancelText}</button>
        <button className={`ui-btn-solid btn-${variant}`} onClick={() => { onConfirm(); onClose(); }}>{confirmText}</button>
      </div>
    </Modal>
  );
};
