import { Logo } from '../../components/ui/Logo'
import ROLE_SELECTION_CONFIG from '../../config/ui/roleSelection.json'

function RoleLogo({ roleId }) {
  const normalized = String(roleId || '').trim().toLowerCase()
  const shared = {
    viewBox: '0 0 24 24',
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
    style: { width: '32px', height: '32px' }
  }
  const stroke = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

  if (normalized === 'admin') return <svg {...shared}><path {...stroke} d="M12 2l7 4v6c0 5-3 9-7 10C8 21 5 17 5 12V6l7-4z" /><path {...stroke} d="M9.5 12l1.8 1.8L14.8 10" /></svg>
  if (normalized === 'manufacturer') return <svg {...shared}><path {...stroke} d="M3 21V10l6 3v-3l6 3v-3l6 3v8H3z" /><path {...stroke} d="M7 21v-4" /><path {...stroke} d="M11 21v-4" /><path {...stroke} d="M15 21v-4" /></svg>
  if (normalized === 'transporter') return <svg {...shared}><path {...stroke} d="M3 17V7h11v10H3z" /><path {...stroke} d="M14 11h4l3 3v3h-7v-6z" /><path {...stroke} d="M7 17a2 2 0 1 0 0.01 0" /><path {...stroke} d="M18 17a2 2 0 1 0 0.01 0" /></svg>
  if (normalized === 'dealer') return <svg {...shared}><path {...stroke} d="M4 10h16l-1 10H5L4 10z" /><path {...stroke} d="M3 10l2-6h14l2 6" /><path {...stroke} d="M9 20v-6h6v6" /></svg>
  if (normalized === 'retailshop') return <svg {...shared}><path {...stroke} d="M6 6h15l-2 8H7L6 6z" /><path {...stroke} d="M6 6L5 3H3" /><path {...stroke} d="M9 20a1.5 1.5 0 1 0 0.01 0" /><path {...stroke} d="M18 20a1.5 1.5 0 1 0 0.01 0" /></svg>
  return null
}

function RoleSelection({ selectedRole, onSelectRole, onSelect, onBack, includeAdmin = true }) {
  const handleSelect = onSelectRole || onSelect
  const roles = Array.isArray(ROLE_SELECTION_CONFIG.roles) ? ROLE_SELECTION_CONFIG.roles : []
  const visibleRoles = includeAdmin ? roles : roles.filter(r => r.id !== 'Admin')

  return (
    <main className="standard-auth-container bg-theme-role">
      
      <div className="standard-auth-header">
        <Logo style={{ width: 72, height: 72, margin: '0 auto 1rem auto', display: 'block' }} />
        <h1 className="standard-auth-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{ROLE_SELECTION_CONFIG.title}</h1>
        <p className="standard-auth-subtitle" style={{ fontSize: '1.1rem' }}>{ROLE_SELECTION_CONFIG.subtitle}</p>
      </div>

      <div className="standard-role-grid">
        {visibleRoles.map(role => (
          <div 
            key={role.id}
            onClick={() => handleSelect?.(role.id)}
            className="standard-role-card"
            data-role={role.id.toLowerCase()}
          >
            <div className="icon-container" style={{ marginBottom: '1rem' }}>
              <RoleLogo roleId={role.id} />
            </div>
            <h3>{role.title}</h3>
            <p>{role.description}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '3rem' }}>
        <button onClick={onBack} className="standard-auth-btn-outline" style={{ border: 'none' }}>
          Back to Homepage
        </button>
      </div>

    </main>
  )
}

export default RoleSelection

