import { useEffect, useMemo, useState } from 'react'
import { connectNotificationSocket, disconnectNotificationSocket } from '../../api/socket'
import Sidebar from './Sidebar'
import UserMenu from '../navigation/UserMenu'
import StatCard from '../ui/StatCard'
import { PATH_BY_ROLE_LINK, SOCKET_USER_BY_ROLE } from './navConfig'
import { AskWaybillPanel } from '../ui/AskWaybillPanel'
import { Toaster, toast } from 'react-hot-toast'

const ROLE_COLORS = {
  Admin:        '#00fff7', // electric cyan
  Manufacturer: '#ffe600', // neon yellow
  Transporter:  '#7fff00', // acid green
  Dealer:       '#ff6b35', // hot orange
  RetailShop:   '#a78bfa', // deep violet
}

function formatNotificationTimestamp(value) {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return 'Live'
  }
  return parsed.toLocaleString()
}

function normalizeNotification(value) {
  if (!value || typeof value !== 'object') {
    return null
  }
  const id = String(value.id ?? '').trim()
  const title = String(value.title ?? '').trim()
  const message = String(value.message ?? '').trim()
  if (!id && !title && !message) {
    return null
  }
  const fallbackId = `local-${Date.now()}-${String(title || message || 'alert').slice(0, 24)}`
  return {
    id: id || fallbackId,
    title: title || 'Alert',
    message: message || '',
    severity: String(value.severity ?? 'info').toLowerCase(),
    timestamp: String(value.timestamp ?? ''),
    metadata: value.metadata ?? {},
    user_id: String(value.user_id ?? ''),
  }
}

function formatMetadataValue(value) {
  if (value == null || value === '') {
    return '—'
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function resolveTargetTab(item, role) {
  if (!item) return null;
  const title = (item.title || '').toLowerCase();
  const msg = (item.message || '').toLowerCase();
  const meta = item.metadata || {};
  const entityType = String(meta.entity_type || meta.type || '').toLowerCase();

  // Role-specific routing logic
  if (role === 'Transporter') {
    if (title.includes('maintenance') || msg.includes('maintenance') || entityType.includes('maintenance') || entityType.includes('truck')) {
      return { path: '/transporter/maintenance', label: '🔧 Maintenance Alerts' };
    }
    if (title.includes('route') || title.includes('optimize') || msg.includes('route')) {
      return { path: '/transporter/routes', label: '🗺️ Route Optimizer' };
    }
    if (title.includes('driver') || msg.includes('driver')) {
      return { path: '/transporter/logs', label: '📋 Driver Logs' };
    }
    if (title.includes('fleet') || msg.includes('fleet') || msg.includes('vehicle')) {
      return { path: '/transporter/fleet', label: '🚛 Fleet Management' };
    }
    if (title.includes('dispute') || msg.includes('dispute')) {
      return { path: '/transporter/disputes', label: '⚖️ Dispute Center' };
    }
    if (title.includes('delay') || title.includes('gps') || title.includes('telematics') || title.includes('shipment') || msg.includes('shipment')) {
      return { path: '/transporter/map', label: '📡 Live Map' };
    }
    return { path: '/transporter/alerts', label: '🔔 Alert Center' };
  }

  if (role === 'Admin') {
    if (title.includes('dispute') || msg.includes('dispute')) {
      return { path: '/admin/disputes', label: '⚖️ Dispute Center' };
    }
    if (title.includes('seal') || title.includes('verify') || msg.includes('seal')) {
      return { path: '/admin/verify', label: '✅ Seal Verification' };
    }
    if (title.includes('batch') || msg.includes('batch')) {
      return { path: '/admin/batch', label: '📦 Batch Traceability' };
    }
    if (title.includes('user') || msg.includes('user') || title.includes('permission')) {
      return { path: '/admin/users', label: '👥 User & Role Management' };
    }
    return { path: '/admin/alerts', label: '🔔 Alert Center' };
  }

  if (role === 'Manufacturer') {
    if (title.includes('quality') || title.includes('qa') || msg.includes('quality')) {
      return { path: '/manufacturer/assurance', label: '✅ Quality Assurance' };
    }
    if (title.includes('batch') || msg.includes('batch')) {
      return { path: '/manufacturer/batch', label: '📦 Batch Traceability' };
    }
    if (title.includes('material') || title.includes('sourcing') || msg.includes('supplier')) {
      return { path: '/manufacturer/sourcing', label: '🪨 Raw Material Sourcing' };
    }
    if (title.includes('dispute') || msg.includes('dispute')) {
      return { path: '/manufacturer/disputes', label: '⚖️ Dispute Center' };
    }
    return { path: '/manufacturer/alerts', label: '🔔 Alert Center' };
  }

  if (role === 'Dealer') {
    if (title.includes('arrival') || title.includes('inbound') || msg.includes('arrival')) {
      return { path: '/dealer/arrivals', label: '🚚 Inbound Consignments' };
    }
    if (title.includes('order') || msg.includes('order')) {
      return { path: '/dealer/orders', label: '📑 Order Management' };
    }
    if (title.includes('stock') || title.includes('inventory') || msg.includes('inventory')) {
      return { path: '/dealer/inventory', label: '📦 Stock Management' };
    }
    if (title.includes('dispute') || msg.includes('dispute')) {
      return { path: '/dealer/disputes', label: '⚖️ Dispute Center' };
    }
    return { path: '/dealer/alerts', label: '🔔 Alert Center' };
  }

  if (role === 'RetailShop' || role === 'retail_shop' || role === 'retail') {
    if (title.includes('inventory') || title.includes('stock') || msg.includes('stock')) {
      return { path: '/retail/inventory', label: '📦 Stock & Reorder' };
    }
    if (title.includes('pos') || title.includes('sale') || msg.includes('sale')) {
      return { path: '/retail/pos', label: '💳 Point of Sale' };
    }
    if (title.includes('dispute') || msg.includes('dispute')) {
      return { path: '/retail/disputes', label: '⚖️ Dispute Center' };
    }
    return { path: '/retail/alerts', label: '🔔 Alert Center' };
  }

  return null;
}

function AlertsDrawer({ open, items = [], onClose, role, onNavigate, onResolveAlert }) {
  const [selectedItemId, setSelectedItemId] = useState('')

  if (!open) return null

  const selectedItem =
    items.find((item) => item.id === selectedItemId) ??
    items[0] ??
    null
  const detailEntries = Object.entries(selectedItem?.metadata || {}).filter(([, value]) => value !== undefined)
  const targetTab = resolveTargetTab(selectedItem, role)

  return (
    <div className="alerts-drawer-overlay" role="dialog" aria-modal="true" aria-label="Alerts">
      <div className="alerts-drawer">
        <div className="alerts-drawer-header">
          <div>
            <div className="alerts-drawer-title">Alerts &amp; Notifications</div>
            <div className="muted" style={{ fontSize: 12 }}>
              {items.length ? `${items.length} active notification(s)` : 'No alerts yet.'}
            </div>
          </div>
          <button type="button" className="subtle-btn" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="alerts-drawer-body">
          {!items.length && (
            <div className="card" style={{ margin: 0, padding: '24px 16px', textAlign: 'center' }}>
              <p className="muted" style={{ margin: 0, fontSize: '0.875rem' }}>
                All notifications resolved. No active alerts.
              </p>
            </div>
          )}

          {!!items.length && (
            <div className="alerts-box card" style={{ margin: 0 }}>
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="alerts-box-item"
                  onClick={() => setSelectedItemId(item.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    background: selectedItem?.id === item.id ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                    border: selectedItem?.id === item.id ? '1px solid rgba(59, 130, 246, 0.28)' : '1px solid transparent',
                    borderRadius: 12,
                    cursor: 'pointer',
                  }}
                >
                  <div className="alerts-box-head">
                    <strong className="alerts-box-title">{item.title}</strong>
                    <span className={`alerts-chip alerts-chip--${item.severity || 'info'}`}>
                      {String(item.severity || 'info').toUpperCase()}
                    </span>
                  </div>
                  {!!item.message && <div className="alerts-box-message">{item.message}</div>}
                  <div className="alerts-box-meta muted">{formatNotificationTimestamp(item.timestamp)}</div>
                </button>
              ))}
            </div>
          )}

          {!!selectedItem && (
            <div className="card alerts-detail-card" style={{ marginTop: 16 }}>
              <div className="alerts-box-head">
                <div className="alerts-section-heading">
                  <span className="alerts-section-icon" aria-hidden="true">i</span>
                  <strong className="alerts-box-title">Alert Details</strong>
                </div>
              </div>
              <div className="alerts-detail-hero">
                <div className="alerts-detail-kicker muted">Selected update</div>
                <div className="alerts-detail-title">{selectedItem.title}</div>
                <div className="alerts-detail-message">
                  {selectedItem.message || 'No extra message details were provided for this alert.'}
                </div>
                <div className="alerts-box-meta muted" style={{ marginTop: 10 }}>
                  {formatNotificationTimestamp(selectedItem.timestamp)}
                </div>
              </div>

              {/* Action Buttons: Navigate to Respective Tab & Resolve Alert */}
              <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {targetTab && onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigate(targetTab.path);
                    }}
                    style={{
                      flex: 1,
                      minWidth: '140px',
                      padding: '8px 14px',
                      background: 'var(--primary, #3b82f6)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <span>➔ Open {targetTab.label.split(' ')[1] || 'Tab'}</span>
                  </button>
                )}
                {onResolveAlert && (
                  <button
                    type="button"
                    onClick={() => onResolveAlert(selectedItem.id)}
                    style={{
                      flex: targetTab ? '0 0 auto' : 1,
                      padding: '8px 14px',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#059669',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4
                    }}
                  >
                    <span>✓ Resolve</span>
                  </button>
                )}
              </div>

              {!!detailEntries.length && (
                <div style={{ marginTop: 14 }}>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Related details</div>
                  <div className="alerts-detail-grid">
                    {detailEntries.map(([key, value]) => (
                      <div key={key} className="alerts-detail-row">
                        <strong className="alerts-detail-key">{key.replace(/_/g, ' ')}</strong>
                        <span className="alerts-detail-value">{formatMetadataValue(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        className="alerts-drawer-scrim"
        aria-label="Close alerts"
        onClick={onClose}
      />
    </div>
  )
}

function getLinkForPath(role, path) {
  const linkMap = PATH_BY_ROLE_LINK[role]
  if (!linkMap || !path) {
    return 'Dashboard'
  }

  const normalizedPath = String(path).toLowerCase()
  const match = Object.entries(linkMap).find(([, value]) => String(value).toLowerCase() === normalizedPath)
  return match?.[0] ?? 'Dashboard'
}

function DashboardLayout({
  role,
  userName,
  onLogout,
  onNavigate,
  currentPath = '',
  themeClass = '',
  stats = [],
  notifications = 0,
  children,
}) {
  const [activeLink, setActiveLink] = useState(() => getLinkForPath(role, currentPath))
  const [notificationItems, setNotificationItems] = useState([])
  const [alertsOpen, setAlertsOpen] = useState(false)
  const socketUserId = SOCKET_USER_BY_ROLE[role]
  const notificationCount = notificationItems.length

  const enrichedStats = useMemo(
    () =>
      stats.map((item, index) => ({
        ...item,
        sparkline: item.sparkline ?? Array.from({ length: 7 }, (_, i) => {
            const base = (typeof item.value === 'number') ? item.value : 100;
            return base * (0.8 + (Math.sin(index + i * 2) * 0.2));
        }),
        color: item.color ?? ROLE_COLORS[role] ?? '#0f766e',
      })),
    [role, stats],
  )

  useEffect(() => {
    setActiveLink(getLinkForPath(role, currentPath))
  }, [role, currentPath])

  useEffect(() => {
    setAlertsOpen(false)
    setNotificationItems([])
  }, [socketUserId])

  const handleResolveAlert = (alertId) => {
    setNotificationItems((prev) => prev.filter((item) => item.id !== alertId))
    toast.success('Alert marked as resolved')
  }

  useEffect(() => {
    if (!socketUserId) {
      return undefined
    }

    connectNotificationSocket(socketUserId, {
      onMessage: (payload) => {
        if (!payload || typeof payload !== 'object') return
        if (payload.type === 'notification:init' && Array.isArray(payload.items)) {
          const normalized = payload.items.map(normalizeNotification).filter(Boolean)
          setNotificationItems(normalized)
          return
        }
        if (payload.type === 'notification') {
          const next = normalizeNotification(payload)
          if (next) {
            const target = resolveTargetTab(next, role)
            toast(
              (t) => (
                <div
                  style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 2 }}
                  onClick={() => {
                    toast.dismiss(t.id)
                    if (target && onNavigate) {
                      onNavigate(target.path)
                    } else {
                      setAlertsOpen(true)
                    }
                  }}
                >
                  <strong style={{ fontSize: '0.85rem' }}>{next.title}</strong>
                  <span style={{ fontSize: '0.78rem', opacity: 0.9 }}>{next.message || 'Click to view and resolve'}</span>
                  {target && (
                    <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 600, marginTop: 2 }}>
                      ➔ View in {target.label}
                    </span>
                  )}
                </div>
              ),
              {
                icon: next.severity === 'high' || next.severity === 'critical' ? '⚠️' : 'ℹ️',
                duration: 6000,
              }
            )
            setNotificationItems((items) => {
              const deduped = items.filter((item) => item.id !== next.id)
              return [next, ...deduped].slice(0, 50)
            })
          }
        }
      },
    })

    return () => {
      disconnectNotificationSocket()
    }
  }, [socketUserId, role, onNavigate])

  const handleNavigate = (link) => {
    const path = PATH_BY_ROLE_LINK[role]?.[link]
    if (path && onNavigate) {
      setActiveLink(link)
      onNavigate(path)
      return
    }
    setActiveLink(link)
  }

  const roleClass = role ? `role-${String(role).toLowerCase()}` : ''
  const shellClassName = ['dashboard-shell', roleClass, themeClass].filter(Boolean).join(' ')

  const normalizedPath = String(currentPath || '').trim().toLowerCase()
  const normalizedLink = String(activeLink || '').trim().toLowerCase()

  // Only display overview KPI command-grid and AI summary report on the root Control Tower / Dashboard overview
  const isMainOverview = (
    normalizedPath === '/admin' || 
    normalizedPath === '/manufacturer' || 
    normalizedPath === '/transporter' || 
    normalizedPath === '/dealer' || 
    normalizedPath === '/retail' || 
    normalizedPath === '' || 
    normalizedPath === '/' ||
    normalizedLink.includes('control tower') ||
    normalizedLink === 'dashboard' ||
    normalizedLink === '🏠 dashboard'
  )

  const shouldShowCommandGrid = isMainOverview && !!enrichedStats.length

  const roleDisplay = (role === 'RetailShop' || role === 'retail_shop' || role === 'retail') ? 'Retail Shop' : role;
  const linkParts = String(activeLink || 'Dashboard').trim().split(' ');
  const hasIcon = linkParts[0] && linkParts[0].length <= 3 && !/^[A-Za-z0-9]/.test(linkParts[0]);
  const activeTitle = hasIcon ? linkParts.slice(1).join(' ') : (activeLink || 'Dashboard');

  return (
    <div className={shellClassName}>
      <Sidebar role={role} activeLink={activeLink} onNavigate={handleNavigate} />
      <section className="dashboard-main">
        <header className="topbar">
          <div>
            <nav aria-label="Breadcrumb" className="topbar-breadcrumb" style={{ fontSize: '0.78rem', color: 'var(--muted, #64748b)', fontWeight: 500, marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>WayBill</span>
              <span aria-hidden="true" style={{ opacity: 0.5 }}>/</span>
              <span>{roleDisplay}</span>
              <span aria-hidden="true" style={{ opacity: 0.5 }}>/</span>
              <span style={{ color: 'var(--text, #0f172a)', fontWeight: 600 }}>{activeTitle}</span>
            </nav>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text, #0f172a)', letterSpacing: '-0.01em' }}>
              {activeTitle}
            </h2>
          </div>
          <UserMenu
            userName={userName}
            notifications={notificationCount}
            onLogout={onLogout}
            onOpenAlerts={() => setAlertsOpen(true)}
          />
        </header>

        <main className="dashboard-content">
          {shouldShowCommandGrid && (
            <section className="command-grid">
              {enrichedStats.map((item, index) => (
                <StatCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  trend={item.trend}
                  sparkline={item.sparkline}
                  color={item.color}
                  icon={item.icon}
                  index={index}
                />
              ))}
            </section>
          )}
          {children}
        </main>
      </section>
      <AlertsDrawer
        open={alertsOpen}
        items={notificationItems}
        onClose={() => setAlertsOpen(false)}
        role={role}
        onNavigate={onNavigate}
        onResolveAlert={handleResolveAlert}
      />
      <AskWaybillPanel />
      <Toaster position="top-right" />
    </div>
  )
}

export default DashboardLayout
