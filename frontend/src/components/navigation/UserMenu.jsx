import Badge from '../ui/Badge'

function UserMenu({ userName, notifications = 0, onLogout, onOpenAlerts }) {
  const count = Number(notifications || 0)
  return (
    <div className="user-menu">
      <button
        type="button"
        className={`pill pill-button ${count ? 'pending' : ''}`}
        onClick={onOpenAlerts}
        disabled={!onOpenAlerts}
        aria-label="Open alerts"
        title="Open alerts"
      >
        {count} Alerts
      </button>
      <Badge label={userName ?? 'User'} variant="active" />
      <button type="button" className="subtle-btn" onClick={onLogout}>
        Logout
      </button>
    </div>
  )
}

export default UserMenu
