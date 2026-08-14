import React, { useState } from 'react';
import { TableSkeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

export const DataTable = ({ data, columns, loading = false, onRowClick, emptyMessage = "No records found.", searchable = true }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    if (loading) return <TableSkeleton cols={columns.length} />;
    
    // Generic search across all columns
    const filteredData = data?.filter(row => {
        if (!searchTerm || !searchable) return true;
        return Object.values(row).some(val => 
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );
    }) || [];

    if (!data || data.length === 0) return <EmptyState message={emptyMessage} />;

    return (
        <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            {searchable && (
                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fcfcfc' }}>
                    <input 
                        type="text" 
                        placeholder="Search records..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            fontSize: 'var(--text-body)',
                            width: '300px',
                            outline: 'none'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = 'var(--primary)';
                            e.target.style.boxShadow = '0 0 0 3px rgba(15, 110, 86, 0.15)';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = 'var(--border)';
                            e.target.style.boxShadow = 'none';
                        }}
                    />
                    <div style={{ fontSize: 'var(--text-meta)', color: 'var(--gray)', fontWeight: '500' }}>
                        Showing {filteredData.length} records
                    </div>
                </div>
            )}
            
            <div style={{ width: '100%', overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-body)' }}>
                    <thead>
                        <tr style={{ background: 'var(--bg-dark)', borderBottom: '1px solid var(--border)' }}>
                            {columns.map(c => (
                                <th key={c.key} style={{ 
                                    padding: '1rem 1.25rem', 
                                    color: 'var(--dashboard-heading)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    fontSize: 'var(--text-meta)',
                                    fontWeight: '700',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {c.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--gray)' }}>
                                    No records match your search.
                                </td>
                            </tr>
                        ) : (
                            filteredData.map((row, i) => (
                                <tr 
                                    key={i} 
                                    onClick={() => onRowClick && onRowClick(row)}
                                    style={{ 
                                        borderBottom: '1px solid var(--border)',
                                        cursor: onRowClick ? 'pointer' : 'default',
                                        transition: 'background 0.15s ease'
                                    }}
                                    onMouseOver={(e) => onRowClick && (e.currentTarget.style.background = 'var(--bg)')}
                                    onMouseOut={(e) => onRowClick && (e.currentTarget.style.background = 'transparent')}
                                >
                                    {columns.map(c => (
                                        <td key={c.key} style={{ padding: '1rem 1.25rem', color: 'var(--text)' }}>
                                            {c.render ? c.render(row[c.key], row) : row[c.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
