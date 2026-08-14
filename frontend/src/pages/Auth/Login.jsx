import { useEffect, useRef, useState } from 'react'
import { Logo } from '../../components/ui/Logo'

function Login({ role, onSubmit, onBack }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const emailInputRef = useRef(null)
  const passwordInputRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await onSubmit?.({ username, email, companyName, password, role })
    } catch (err) {
      setError(err?.message ?? 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleLabel = () => ({ manufacturer: 'Manufacturer', transporter: 'Transporter', dealer: 'Dealer', retailshop: 'Retail Shop', admin: 'Admin' })[role?.toLowerCase()] || role

  const normalizedRole = String(role || '').toLowerCase()
  const isCompanyRequired = ['manufacturer', 'dealer', 'retailshop'].includes(normalizedRole)
  const isCompanySupported = isCompanyRequired

  return (
    <main className="standard-auth-container bg-theme-signin">
      <div className="standard-auth-card">
        
        <div className="standard-auth-header">
          <Logo style={{ width: 72, height: 72, margin: '0 auto 1rem auto', display: 'block' }} />
          <h2 className="standard-auth-title">Welcome Back</h2>
          <p className="standard-auth-subtitle">Sign in to your {getRoleLabel()} account</p>
        </div>

        <form onSubmit={handleSubmit} className="standard-auth-form" autoComplete="off">
          


          <div className="standard-auth-form-group">
            <label className="standard-auth-label">Username</label>
            <input type="text" className="standard-auth-input" placeholder="Enter your username" required value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>

          {isCompanySupported && (
            <div className="standard-auth-form-group">
              <label className="standard-auth-label">
                Company Name *
              </label>
              <input 
                type="text" 
                className="standard-auth-input" 
                placeholder="Enter company name" 
                required
                value={companyName} 
                onChange={(e) => setCompanyName(e.target.value)} 
              />
            </div>
          )}

          <div className="standard-auth-form-group">
            <label className="standard-auth-label">Email Address</label>
            <input ref={emailInputRef} type="email" className="standard-auth-input" placeholder="you@example.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="standard-auth-form-group">
            <label className="standard-auth-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input ref={passwordInputRef} type={showPass ? 'text' : 'password'} className="standard-auth-input" placeholder="Enter your password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {!!error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="submit" disabled={isLoading} className="standard-auth-btn-primary">
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            


            <button type="button" onClick={onBack} disabled={isLoading} className="standard-auth-btn-outline" style={{ border: 'none' }}>
              Back
            </button>
          </div>
          

        </form>
      </div>
    </main>
  )
}

export default Login

