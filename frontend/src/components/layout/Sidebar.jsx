import React, { useState } from 'react'
import { ROLE_LINKS } from './navConfig'
import { Logo } from '../ui/Logo'

function Sidebar({ role, activeLink = 'Dashboard', onNavigate }) {
  const links = ROLE_LINKS[role] ?? ['Dashboard']
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`nav-sidebar ${collapsed ? 'collapsed' : ''}`} style={{ 
      transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)', 
      width: collapsed ? '76px' : '260px',
      minWidth: collapsed ? '76px' : '260px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      background: 'var(--surface, #ffffff)',
      borderRight: '1px solid var(--border, #e2e8f0)',
      height: '100vh',
      zIndex: 40
    }}>
      <div className="brand-block" style={{ padding: collapsed ? '20px 10px' : '20px 16px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between', borderBottom: '1px solid var(--border, #e2e8f0)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Logo style={{ width: 34, height: 34, minWidth: 34 }} />
          {!collapsed && <p className="brand-name" style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text, #0f172a)' }}>WayBill</p>}
        </div>
        
        {!collapsed && (
          <button 
            type="button"
            onClick={() => setCollapsed(true)} 
            aria-label="Collapse sidebar navigation"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted, #94a3b8)', padding: '6px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            title="Collapse sidebar"
          >
            ◀
          </button>
        )}
      </div>

      {collapsed && (
        <button 
          type="button"
          onClick={() => setCollapsed(false)} 
          aria-label="Expand sidebar navigation"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--muted, #94a3b8)', padding: '10px', width: '100%', textAlign: 'center' }}
          title="Expand sidebar"
        >
          ▶
        </button>
      )}

      <nav className="nav-links" aria-label="Role navigation" style={{ flex: 1, padding: collapsed ? '12px 6px' : '12px 10px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', overflowX: 'hidden' }}>
        {links.map((link) => {
          const isActive = link === activeLink;
          const parts = String(link || '').trim().split(' ');
          const hasEmoji = parts[0] && parts[0].length <= 3 && !/^[A-Za-z0-9]/.test(parts[0]);
          const icon = hasEmoji ? parts[0] : '🔹';
          const title = hasEmoji ? parts.slice(1).join(' ') : link;

          return (
            <button
              key={link}
              type="button"
              className="nav-link"
              onClick={() => onNavigate?.(link)}
              aria-current={isActive ? 'page' : undefined}
              style={{
                background: isActive ? 'rgba(15, 110, 86, 0.08)' : 'transparent',
                borderLeft: isActive ? '3px solid #0f6e56' : '3px solid transparent',
                color: isActive ? '#0f6e56' : 'var(--muted, #475569)',
                padding: collapsed ? '10px 0' : '10px 14px',
                textAlign: collapsed ? 'center' : 'left',
                justifyContent: collapsed ? 'center' : 'flex-start',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.88rem',
                borderRadius: '0 8px 8px 0',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                whiteSpace: 'nowrap',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                cursor: 'pointer'
              }}
              title={collapsed ? title : ''}
            >
              <span style={{ fontSize: '1.15rem', minWidth: '24px', textAlign: 'center', flexShrink: 0 }}>
                {icon}
              </span>
              {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>}
            </button>
          )
        })}
      </nav>

      {/* Pinned role indicator */}
      <div style={{ 
        padding: collapsed ? '16px 8px' : '20px', 
        borderTop: '1px solid rgba(15,23,42,0.08)',
        background: 'rgba(15,23,42,0.02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'flex-start',
        gap: '12px'
      }}>
        <div style={{ 
          width: '36px', 
          height: '36px', 
          minWidth: '36px',
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          color: 'white',
          fontSize: '1rem'
        }}>
          {role ? role.charAt(0) : 'U'}
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#0f172a', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{role ?? 'Portal'}</p>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#475569', whiteSpace: 'nowrap' }}>Active Session</p>
          </div>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
