
import React from 'react';
export const DataTable = ({ data, columns }) => {
    if (!data || data.length === 0) return <div>No data available</div>;
    const downloadCsv = () => {
        const header = columns.map(c => c.header).join(',');
        const rows = data.map(row => columns.map(c => row[c.key]).join(',')).join('\n');
        const csv = header + '\n' + rows;
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'export.csv';
        a.click();
    };
    return (
        <div style={{width: '100%', overflowX: 'auto'}}>
            <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '8px'}}>
                <button onClick={downloadCsv} style={{
                    padding: '6px 12px', background: '#0F6E56', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                }}>Export CSV</button>
            </div>
            <table style={{width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px'}}>
                <thead>
                    <tr style={{borderBottom: '2px solid #d9e2ef', color: '#0B1B2E'}}>
                        {columns.map(c => <th key={c.key} style={{padding: '12px 8px'}}>{c.header}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, i) => (
                        <tr key={i} style={{borderBottom: '1px solid #d9e2ef'}}>
                            {columns.map(c => <td key={c.key} style={{padding: '12px 8px'}}>{c.render ? c.render(row[c.key], row) : row[c.key]}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
