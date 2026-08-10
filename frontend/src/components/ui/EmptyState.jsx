import React from 'react';

export const EmptyState = ({ message = "No data available." }) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">📭</div>
      <p className="muted">{message}</p>
    </div>
  );
};
