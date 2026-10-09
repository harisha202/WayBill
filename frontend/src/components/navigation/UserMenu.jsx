import { useState } from 'react'
import Badge from '../ui/Badge'
import ProfileModal from '../ui/ProfileModal'

function UserMenu({ userName, notifications = 0, onLogout, onOpenAlerts }) {
  const [profileOpen, setProfileOpen] = useState(false)
  const count = Number(notifications || 0)

  return (
    <>
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
          style={{ background: '#2563eb', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)' }}
          onClick={() => setProfileOpen(true)}
          title="View profile & account details"
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

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </>
  )
}

export default UserMenu
