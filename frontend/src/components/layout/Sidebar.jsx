import { ROLE_LINKS } from './navConfig'
import { Logo } from '../ui/Logo'

function Sidebar({ role, activeLink = 'Dashboard', onNavigate }) {
  const links = ROLE_LINKS[role] ?? ['Dashboard']

  return (
    <aside className="nav-sidebar">
      <div className="brand-block">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Logo style={{ width: 44, height: 44 }} />
          <p className="brand-name" style={{ margin: 0 }}>WayBill</p>
        </div>
        <p className="brand-role">{role ?? 'Portal'}</p>
      </div>

      <nav className="nav-links">
        {links.map((link) => (
          <button
            key={link}
            type="button"
            className="nav-link"
            data-active={link === activeLink}
            onClick={() => onNavigate?.(link)}
          >
            {link}
          </button>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
