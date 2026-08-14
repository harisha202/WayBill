import React from 'react';
import { useApi } from '../../api/hooks/useApi';
import { DataTable } from '../ui/DataTable';
import { StatusPill } from '../ui/StatusPill';

export function DiscrepancyPanel() {
    const { data: discrepancies, loading, error } = useApi('/dealer/discrepancies');

    const columns = [
        { key: 'discrepancy_id', header: 'Discrepancy ID', render: (val) => <strong>{val.substring(0,8)}</strong> },
        { key: 'order_id', header: 'Order Code' },
        { key: 'sku', header: 'SKU' },
        { key: 'ordered_quantity', header: 'Ordered' },
        { key: 'received_quantity', header: 'Received' },
        { key: 'missing_quantity', header: 'Missing', render: (val) => <span style={{ color: 'var(--red)', fontWeight: 'bold' }}>{val}</span> },
        { key: 'status', header: 'Status', render: (val) => <StatusPill status={val === 'OPEN' ? 'warning' : 'active'} text={val} /> },
        { key: 'created_at', header: 'Date', render: (val) => new Date(val).toLocaleDateString() }
    ];

    return (
        <div style={{ padding: '2rem', fontFamily: 'var(--app-font-normal)' }}>
            <h2 style={{ fontSize: 'var(--text-section-title)', fontWeight: '700', marginBottom: '1rem', color: 'var(--dashboard-heading)' }}>
                Discrepancies & Backorders
            </h2>
            <p style={{ color: 'var(--muted)', marginBottom: '2rem' }}>
                Review missing items and pending backorders from partial receipts.
            </p>
            
            {error ? (
                <div style={{ color: 'var(--red)' }}>Error loading discrepancies: {error.message}</div>
            ) : (
                <DataTable 
                    data={discrepancies || []}
                    columns={columns}
                    loading={loading}
                    emptyMessage="No open discrepancies."
                />
            )}
        </div>
    );
}
