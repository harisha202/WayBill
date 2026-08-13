import React, { useState } from 'react'
import { ROLE_LINKS } from './navConfig'
import { Logo } from '../ui/Logo'

function Sidebar({ role, activeLink = 'Dashboard', onNavigate }) {
  const links = ROLE_LINKS[role] ?? ['Dashboard']
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`nav-sidebar ${collapsed ? 'collapsed' : ''}`} style={{ 
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
      width: collapsed ? '80px' : '380px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative'
    }}>
      <div className="brand-block" style={{ padding: collapsed ? '24px 12px' : '24px', display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Logo style={{ width: 40, height: 40, minWidth: 40 }} />
          {!collapsed && <p className="brand-name" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>WayBill</p>}
        </div>
        
        {!collapsed && (
          <button 
            onClick={() => setCollapsed(true)} 
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
          >
            ◀
          </button>
        )}
      </div>

      {collapsed && (
        <button 
          onClick={() => setCollapsed(false)} 
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '8px', width: '100%' }}
        >
          ▶
        </button>
      )}

      <nav className="nav-links" style={{ flex: 1, padding: collapsed ? '12px 8px' : '12px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {links.map((link) => {
          const isActive = link === activeLink;
          return (
            <button
              key={link}
              type="button"
              className="nav-link"
              onClick={() => onNavigate?.(link)}
              style={{
                background: isActive ? 'linear-gradient(90deg, rgba(15,23,42,0.05) 0%, transparent 100%)' : 'transparent',
                borderLeft: isActive ? '4px solid #0f172a' : '4px solid transparent',
                color: isActive ? '#0f172a' : '#475569',
                padding: collapsed ? '12px 0' : '12px 16px',
                textAlign: collapsed ? 'center' : 'left',
                justifyContent: collapsed ? 'center' : 'flex-start',
                fontWeight: isActive ? 600 : 400,
                borderRadius: '0 8px 8px 0',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                whiteSpace: 'nowrap'
              }}
              title={collapsed ? link : ''}
            >
              <span style={{ fontSize: '1.2rem', minWidth: '24px', textAlign: 'center' }}>
                {link === 'Dashboard' ? '📊' : link.includes('Risk') ? '⚠️' : link.includes('Forecast') ? '📈' : link.includes('Map') ? '🗺️' : link.includes('Inventory') ? '📦' : '🔹'}
              </span>
              {!collapsed && <span>{link}</span>}
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
