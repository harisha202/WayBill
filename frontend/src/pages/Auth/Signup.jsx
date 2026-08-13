import { useState } from 'react'
import { authApi } from '../../api/axiosInstance'
import { Logo } from '../../components/ui/Logo'

function Signup({ role, onSubmit, onBack, onLoginClick }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState('')
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return 'Password must be at least 8 characters long'
    if (!/[A-Z]/.test(pwd)) return 'Password must contain at least one uppercase letter'
    if (!/[a-z]/.test(pwd)) return 'Password must contain at least one lowercase letter'
    if (!/[0-9]/.test(pwd)) return 'Password must contain at least one number'
    if (!/[!@#$%^&*]/.test(pwd)) return 'Password must contain at least one special character (!@#$%^&*)'
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!name.trim()) return setError('Please enter your full name')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError('Please enter a valid email address')
    
    const pwdErr = validatePassword(password)
    if (pwdErr) return setError(pwdErr)
    if (password !== confirmPassword) return setError('Passwords do not match')

    setIsLoading(true)
    try {
      await authApi.post('/auth/send-otp', { email, name })
      setShowOtpModal(true)
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to send OTP')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setOtpError('')
    const otpString = otp.join('')
    if (otpString.length !== 6) return setOtpError('Please enter a valid 6-digit OTP')
    setIsVerifyingOtp(true)
    try {
      await authApi.post('/auth/verify-otp', { email, otp: otpString })
      await onSubmit?.({ name, email, password, role })
    } catch (err) {
      setOtpError(err?.response?.data?.detail || err?.message || 'Invalid OTP')
    } finally {
      setIsVerifyingOtp(false)
    }
  }

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[value.length - 1]
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    if (value && index < 5) {
      const nextInput = document.getElementById(otp- + (index + 1))
      if (nextInput) nextInput.focus()
    }
  }

  const getRoleLabel = () => ({ manufacturer: 'Manufacturer', transporter: 'Transporter', dealer: 'Dealer', retailshop: 'Retail Shop', admin: 'Admin' })[role?.toLowerCase()] || role

  if (showOtpModal) {
    return (
      <main className="standard-auth-container bg-theme-otp">
        <div className="standard-auth-card">
          <div className="standard-auth-header">
            <Logo style={{ width: 72, height: 72, margin: '0 auto 1rem auto', display: 'block' }} />
            <h2 className="standard-auth-title">Verify OTP</h2>
            <p className="standard-auth-subtitle">We sent a 6-digit code to {email}</p>
          </div>
          
          <form onSubmit={handleVerifyOtp} className="standard-auth-form">
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
              {otp.map((digit, idx) => (
                <input key={idx} id={otp- + idx} type="text" maxLength={1} value={digit} onChange={(e) => handleOtpChange(idx, e.target.value)}
                  style={{ width: '40px', height: '50px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 600, border: '1px solid #334155', borderRadius: '6px', outline: 'none', background: 'var(--bg)', color: 'var(--text)' }}
                  onFocus={(e) => e.target.select()}
                />
              ))}
            </div>
            {!!otpError && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{otpError}</div>}
            
            <button type="submit" disabled={isVerifyingOtp} className="standard-auth-btn-primary">
              {isVerifyingOtp ? 'Verifying...' : 'Complete Signup'}
            </button>
            <button type="button" onClick={() => setShowOtpModal(false)} className="standard-auth-btn-outline" style={{ marginTop: '0.5rem', border: 'none' }}>
              Back to Sign Up
            </button>
          </form>
        </div>
      </main>
    )
  }

  return (
    <main className="standard-auth-container bg-theme-signup">
      <div className="standard-auth-card">
        
        <div className="standard-auth-header">
          <Logo style={{ width: 72, height: 72, margin: '0 auto 1rem auto', display: 'block' }} />
          <h2 className="standard-auth-title">Create Account</h2>
          <p className="standard-auth-subtitle">Sign up as {getRoleLabel()}</p>
        </div>

        <form onSubmit={handleSubmit} className="standard-auth-form" autoComplete="off">
          <div className="standard-auth-form-group">
            <label className="standard-auth-label">Full Name</label>
            <input type="text" className="standard-auth-input" required placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="standard-auth-form-group">
            <label className="standard-auth-label">Email</label>
            <input type="email" className="standard-auth-input" required placeholder="your.email@example.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="standard-auth-form-group">
            <label className="standard-auth-label">Create Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPassword ? 'text' : 'password'} className="standard-auth-input" required placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
            <p style={{ fontSize: '0.65rem', color: '#64748b', margin: '0.25rem 0 0 0' }}>Must contain: 8+ characters, uppercase, lowercase, number, special character</p>
          </div>

          <div className="standard-auth-form-group">
            <label className="standard-auth-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showConfirmPassword ? 'text' : 'password'} className="standard-auth-input" required placeholder="Re-enter your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}>{showConfirmPassword ? 'Hide' : 'Show'}</button>
            </div>
          </div>

          {!!error && <div style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button type="submit" disabled={isLoading} className="standard-auth-btn-primary">
              {isLoading ? 'Processing...' : 'Sign Up'}
            </button>
            <button type="button" onClick={onLoginClick} disabled={isLoading} className="standard-auth-btn-outline" style={{ border: 'none' }}>
              Log in
            </button>
            <button type="button" onClick={onBack} disabled={isLoading} className="standard-auth-btn-outline" style={{ border: 'none', marginTop: '-0.25rem' }}>
              Back to Roles
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}

export default Signup

