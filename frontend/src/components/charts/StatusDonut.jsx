import { Doughnut } from 'react-chartjs-2'
import './chartSetup'

function StatusDonut({ title = 'Distribution', data = [] }) {
  const normalized = data
    .map((item) => ({
      label: item.label,
      value: Number(item.value ?? 0),
      color: item.color ?? '#0ea5e9',
    }))
    .filter((item) => Number.isFinite(item.value) && item.value >= 0)
  const total = normalized.reduce((sum, item) => sum + item.value, 0)
  const segments = normalized

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
      {!total && <p style={{ margin: 0, color: '#64748b' }}>No chart data</p>}
      {!!total && (
        <>
          <div style={{ position: 'relative', width: '100%', maxWidth: 220, height: 220, margin: '0 auto' }}>
            <Doughnut
              data={{
                labels: normalized.map((item) => item.label),
                datasets: [
                  {
                    data: normalized.map((item) => item.value),
                    backgroundColor: normalized.map((item) => item.color),
                    borderColor: '#0f172a',
                    borderWidth: 2,
                    hoverOffset: 6,
                    spacing: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                  legend: { display: false },
                },
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'grid',
                placeItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>Total</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>{total}</div>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
            {segments.map((item) => (
              <div
                key={item.label}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13 }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, display: 'inline-block' }}
                  />
                {item.label}
                </span>
                <strong>{((item.value / total) * 100).toFixed(1)}%</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default StatusDonut
