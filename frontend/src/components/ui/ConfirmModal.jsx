import React from 'react';

export const ConfirmModal = ({ 
    isOpen, 
    title, 
    message, 
    confirmText = "Confirm", 
    cancelText = "Cancel", 
    onConfirm, 
    onCancel, 
    isDestructive = false,
    loading = false
}) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                background: 'var(--surface)',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '450px',
                padding: '2rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: '1px solid var(--border)',
                animation: 'slideUp 0.2s ease-out forwards'
            }}>
                <style>{`
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
                
                <h2 style={{ 
                    fontSize: 'var(--text-section)', 
                    fontWeight: '700', 
                    color: 'var(--dashboard-heading)',
                    marginBottom: '0.75rem'
                }}>
                    {title}
                </h2>
                
                <p style={{ 
                    fontSize: 'var(--text-body)', 
                    color: 'var(--dashboard-text)',
                    lineHeight: '1.5',
                    marginBottom: '2rem'
                }}>
                    {message}
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                    <button 
                        onClick={onCancel}
                        disabled={loading}
                        style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            background: 'transparent',
                            color: 'var(--text)',
                            fontSize: 'var(--text-body)',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={loading}
                        style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: isDestructive ? 'var(--red)' : 'var(--primary)',
                            color: 'white',
                            fontSize: 'var(--text-body)',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {loading && (
                            <span style={{ 
                                width: '14px', 
                                height: '14px', 
                                border: '2px solid rgba(255,255,255,0.3)', 
                                borderTopColor: 'white', 
                                borderRadius: '50%', 
                                animation: 'spin 1s linear infinite' 
                            }} />
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
