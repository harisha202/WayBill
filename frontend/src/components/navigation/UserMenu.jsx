import Badge from '../ui/Badge'

function UserMenu({ userName, notifications = 0, onLogout, onOpenAlerts }) {
  const count = Number(notifications || 0)
  return (
    <div className="user-menu" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
      <button
        type="button"
        style={{ background: count ? '#dc2626' : 'var(--border)', color: 'var(--text)', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
        onClick={onOpenAlerts}
        disabled={!onOpenAlerts}
        title="Open alerts"
      >
        🔔 {count} Alerts
      </button>
      
      <button 
        type="button" 
        style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}
        onClick={() => alert('Profile settings coming soon')}
      >
        👤 {userName ?? 'User'}
      </button>

      <button 
        type="button" 
        style={{ background: 'transparent', color: 'var(--muted)', border: '1px solid #475569', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} 
        onClick={onLogout}
      >
        Logout
      </button>
    </div>
  )
}

export default UserMenu
