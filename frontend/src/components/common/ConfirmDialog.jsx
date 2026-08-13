import React from 'react';

export default function ConfirmDialog({ 
  isOpen, 
  title, 
  message, 
  confirmLabel = "Confirm", 
  cancelLabel = "Cancel", 
  onConfirm, 
  onCancel, 
  isDanger = false,
  isSubmitting = false
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: 'var(--surface)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid var(--border)'
      }}>
        <h3 style={{ margin: '0 0 12px 0', color: 'var(--dashboard-heading)', fontSize: '1.25rem' }}>
          {title}
        </h3>
        <p style={{ margin: '0 0 24px 0', color: 'var(--dashboard-text)', lineHeight: '1.5' }}>
          {message}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            onClick={onCancel}
            disabled={isSubmitting}
            style={{
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm}
            disabled={isSubmitting}
            style={{
              padding: '8px 16px',
              backgroundColor: isDanger ? 'var(--danger)' : 'var(--primary)',
              color: 'var(--text)',
              border: 'none',
              borderRadius: '8px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
