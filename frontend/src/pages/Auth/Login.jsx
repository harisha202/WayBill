import { useEffect, useRef, useState } from 'react'
import { Logo } from '../../components/ui/Logo'
import { authApi } from '../../api/axiosInstance'

function Login({ role, onSubmit, onBack }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMsg, setForgotMsg] = useState('')
  const [forgotError, setForgotError] = useState('')

  const emailInputRef = useRef(null)
  const passwordInputRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await onSubmit?.({ username: username.trim(), email: email.trim(), companyName: companyName.trim(), password, role })
    } catch (err) {
      setError(err?.message ?? 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    setForgotError('')
    setForgotMsg('')
    setForgotLoading(true)
    try {
      const res = await authApi.requestPasswordRecovery({
        email: forgotEmail.trim(),
        username: username.trim() || undefined,
        role: role?.toLowerCase()
      })
      setForgotMsg(res?.message || 'Password recovery request submitted. Please notify your Administrator to authorize the reset.')
    } catch (err) {
      setForgotError(err?.message || 'Failed to submit password recovery request.')
    } finally {
      setForgotLoading(false)
    }
  }

  const getRoleLabel = () => ({ manufacturer: 'Manufacturer', transporter: 'Transporter', dealer: 'Dealer', retailshop: 'Retail Shop', admin: 'Admin' })[role?.toLowerCase()] || role

  const normalizedRole = String(role || '').toLowerCase()
  const normalizedRoleKey = normalizedRole.replace(/[^a-z]/g, '')
  const isCompanyRequired = ['manufacturer', 'dealer', 'retailshop'].includes(normalizedRoleKey)
  const isCompanySupported = isCompanyRequired

  const roleAccessMap = {
    manufacturer: {
      text: 'Production Batch Orders, QA Inspections, Dispatch with Stock Tracking & Raw Material Sourcing.',
      bg: '#ffffff',
      border: '#ccfbf1',
      badgeBg: '#f0fdfa',
      badgeBorder: '#99f6e4',
      badgeColor: '#0f766e',
      textColor: '#334155'
    },
    transporter: {
      text: 'Live GPS Telematics, Route Optimizer, Fleet & Driver Logs, Vehicle Assignment.',
      bg: '#ffffff',
      border: '#dbeafe',
      badgeBg: '#eff6ff',
      badgeBorder: '#bfdbfe',
      badgeColor: '#1d4ed8',
      textColor: '#334155'
    },
    dealer: {
      text: 'Pipeline Orders, Inventory Receiving (with Discrepancy Detection & Backorders), Partner Network.',
      bg: '#ffffff',
      border: '#ede9fe',
      badgeBg: '#f5f3ff',
      badgeBorder: '#ddd6fe',
      badgeColor: '#6d28d9',
      textColor: '#334155'
    },
    retailshop: {
      text: 'POS Cash Register / Sales, Automated Reorder Approvals, QR Code Traceability, Inventory Analytics.',
      bg: '#ffffff',
      border: '#d1fae5',
      badgeBg: '#ecfdf5',
      badgeBorder: '#a7f3d0',
      badgeColor: '#047857',
      textColor: '#334155'
    }
  }

  const currentRoleAccess = roleAccessMap[normalizedRoleKey]

  return (
    <main className="standard-auth-container bg-theme-signin">
      <div className="standard-auth-card">
        
        <div className="standard-auth-header">
          <Logo style={{ width: 72, height: 72, margin: '0 auto 1rem auto', display: 'block' }} />
          <h2 className="standard-auth-title">Welcome Back</h2>
          <p className="standard-auth-subtitle">Sign in to your {getRoleLabel()} account</p>

          {normalizedRoleKey !== 'admin' && currentRoleAccess && (
            <div 
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: currentRoleAccess.bg,
                border: `1px solid ${currentRoleAccess.border}`,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                fontSize: '0.82rem',
                lineHeight: 1.5,
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span 
                  style={{
                    display: 'inline-block',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    background: currentRoleAccess.badgeBg,
                    color: currentRoleAccess.badgeColor,
                    border: `1px solid ${currentRoleAccess.badgeBorder}`
                  }}
                >
                  Access
                </span>
              </div>
              <span style={{ color: currentRoleAccess.textColor, fontWeight: 500 }}>
                {currentRoleAccess.text}
              </span>
            </div>
          )}
        </div>


        <form onSubmit={handleSubmit} className="standard-auth-form" autoComplete="on">
          
          <div className="standard-auth-form-group">
            <label htmlFor="login-username" className="standard-auth-label">Username</label>
            <input 
              id="login-username" 
              name="username" 
              type="text" 
              className="standard-auth-input" 
              placeholder="Enter your username" 
              required 
              autoComplete="username"
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
            />
          </div>

          <div className="standard-auth-form-group">
            <label htmlFor="login-companyname" className="standard-auth-label">
              Company Name *
            </label>
            <input 
              id="login-companyname"
              name="companyname"
              type="text" 
              className="standard-auth-input" 
              placeholder="Enter company name" 
              required
              autoComplete="organization"
              value={companyName} 
              onChange={(e) => setCompanyName(e.target.value)} 
            />
          </div>

          <div className="standard-auth-form-group">
            <label htmlFor="login-email" className="standard-auth-label">Email Address</label>
            <input 
              ref={emailInputRef} 
              id="login-email"
              name="emailaddress"
              type="email" 
              className="standard-auth-input" 
              placeholder="you@example.com" 
              required 
              autoComplete="email"
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          <div className="standard-auth-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="login-password" className="standard-auth-label">Password</label>
              {normalizedRole !== 'admin' && (
                <button 
                  type="button" 
                  onClick={() => { setShowForgotModal(true); setForgotEmail(email); setForgotMsg(''); setForgotError(''); }} 
                  style={{ background: 'none', border: 'none', color: 'var(--primary, #3b82f6)', fontSize: '0.78rem', cursor: 'pointer', padding: 0, fontWeight: 600 }}
                >
                  Forgot Password?
                </button>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                ref={passwordInputRef} 
                id="login-password"
                name="password"
                type={showPass ? 'text' : 'password'} 
                className="standard-auth-input" 
                placeholder="Enter your password" 
                required 
                autoComplete="current-password"
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
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

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
            <div style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.75rem', maxWidth: '440px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>Request Password Recovery</h3>
              <p style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5, margin: '0 0 1.25rem 0' }}>
                WayBill enforces centralized Admin-authorized security. Enter your registered email address to request a reset. Your administrator will verify your identity and authorize OTP verification.
              </p>

              {forgotMsg ? (
                <div>
                  <div style={{ padding: '0.75rem', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#15803d', fontSize: '0.85rem', marginBottom: '1.25rem', lineHeight: 1.4 }}>
                    {forgotMsg}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setShowForgotModal(false)} 
                    className="standard-auth-btn-primary" 
                    style={{ width: '100%', marginTop: 0 }}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit}>
                  <div className="standard-auth-form-group" style={{ marginBottom: '1rem' }}>
                    <label htmlFor="forgot-email" className="standard-auth-label" style={{ color: '#334155' }}>Account Email</label>
                    <input 
                      id="forgot-email"
                      name="emailaddress"
                      type="email" 
                      required 
                      autoComplete="email"
                      className="standard-auth-input" 
                      placeholder="Enter registered email" 
                      style={{ background: '#ffffff', color: '#0f172a', border: '1px solid #cbd5e1' }}
                      value={forgotEmail} 
                      onChange={(e) => setForgotEmail(e.target.value)} 
                    />
                  </div>


                  {forgotError && (
                    <div style={{ color: '#ef4444', fontSize: '0.82rem', marginBottom: '1rem' }}>
                      {forgotError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                    <button 
                      type="button" 
                      onClick={() => setShowForgotModal(false)} 
                      disabled={forgotLoading}
                      style={{ padding: '0.6rem 1rem', background: '#f8fafc', border: '1px solid #cbd5e1', color: '#334155', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500 }}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      disabled={forgotLoading}
                      className="standard-auth-btn-primary" 
                      style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', margin: 0, width: 'auto' }}
                    >
                      {forgotLoading ? 'Submitting...' : 'Request Authorization'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default Login


