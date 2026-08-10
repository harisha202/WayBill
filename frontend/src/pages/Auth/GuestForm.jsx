import { useState } from 'react'
import { createGuestWithDetails } from '../../auth/guestAccess'
import { Logo } from '../../components/ui/Logo'

function GuestForm({ role, onSubmit, onBack }) {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', phone: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (field) => (event) => setFormData((prev) => ({ ...prev, [field]: event.target.value }))

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await onSubmit?.(createGuestWithDetails(formData, role))
    } catch (submitError) {
      setError(submitError?.message ?? 'Guest access failed')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleLabel = () => ({ manufacturer: 'Manufacturer', transporter: 'Transporter', dealer: 'Dealer', retailshop: 'Retail Shop', admin: 'Admin' })[role?.toLowerCase()] || role

  return (
    <main className="standard-auth-container bg-theme-guest">
      <div className="standard-auth-card">
        
        <div className="standard-auth-header">
          <Logo style={{ width: 72, height: 72, margin: '0 auto 1rem auto', display: 'block' }} />
          <h2 className="standard-auth-title">Guest Access</h2>
          <p className="standard-auth-subtitle">Explore the {getRoleLabel()} dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="standard-auth-form" autoComplete="off">
          <div className="standard-auth-form-group">
            <label className="standard-auth-label">Full Name</label>
            <input type="text" className="standard-auth-input" placeholder="John Doe" required value={formData.name} onChange={handleChange('name')} />
          </div>

          <div className="standard-auth-form-group">
            <label className="standard-auth-label">Email Address</label>
            <input type="email" className="standard-auth-input" placeholder="john@example.com" required value={formData.email} onChange={handleChange('email')} />
          </div>

          <div className="standard-auth-form-group">
            <label className="standard-auth-label">Company Name</label>
            <input type="text" className="standard-auth-input" placeholder="Acme Corporation" required value={formData.company} onChange={handleChange('company')} />
          </div>

          <div className="standard-auth-form-group">
            <label className="standard-auth-label">Phone Number</label>
            <input type="tel" className="standard-auth-input" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange('phone')} />
          </div>

          {!!error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button type="submit" disabled={isLoading} className="standard-auth-btn-primary">
              {isLoading ? 'Processing...' : 'Continue as Guest'}
            </button>
            <button type="button" onClick={onBack} disabled={isLoading} className="standard-auth-btn-outline">
              Back to Roles
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default GuestForm

