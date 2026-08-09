import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { authApi } from './api/axiosInstance'
import {
  useAuthStore,
  selectAuthState,
  setUserSession,
  enterGuest,
  logout,
} from './store/useAuthStore'

import Homepage from './pages/Landing/Homepage'
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import GuestForm from './pages/Auth/GuestForm'
import RoleSelection from './pages/Auth/RoleSelection'
import FeedbackForm from './pages/Feedback/Feedbackform'
import WaybillRouter from './pages/WaybillRouter'
import { DEFAULT_PATH_BY_ROLE } from './components/layout/navConfig'

const ROLE_TO_API = {
  Admin: 'admin',
  Manufacturer: 'manufacturer',
  Transporter: 'transporter',
  Dealer: 'dealer',
  RetailShop: 'retail_shop',
}

const LOCATION_CHANGE_EVENT = 'waybill:location_change'



function normalizePath(pathname) {
  const normalized = String(pathname || '/').trim().toLowerCase()
  if (!normalized.startsWith('/')) return `/${normalized}`
  return normalized
}



function normalizeRole(role) {
  const map = {
    admin: 'Admin',
    manufacturer: 'Manufacturer',
    transporter: 'Transporter',
    dealer: 'Dealer',
    retail_shop: 'RetailShop',
  }
  return map[role] ?? role
}

function getCurrentPathSnapshot() {
  if (typeof window === 'undefined') {
    return '/'
  }
  return normalizePath(window.location.pathname)
}

function notifyLocationChange() {
  if (typeof window === 'undefined') {
    return
  }
  window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT))
}

function subscribeToLocationChanges(callback) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const handleChange = () => {
    const mapped = normalizePath(window.location.pathname)
    if (mapped !== window.location.pathname) {
      window.history.replaceState({}, '', mapped)
    }
    callback()
  }

  window.addEventListener('popstate', handleChange)
  window.addEventListener(LOCATION_CHANGE_EVENT, handleChange)
  return () => {
    window.removeEventListener('popstate', handleChange)
    window.removeEventListener(LOCATION_CHANGE_EVENT, handleChange)
  }
}

function App() {
  const auth = useAuthStore(selectAuthState)
  const [screen, setScreen] = useState('home')
  const [pendingRole, setPendingRole] = useState('Admin')
  const [entryIntent, setEntryIntent] = useState('login')
  const [logoutFeedbackPrefill, setLogoutFeedbackPrefill] = useState(null)
  const currentPath = useSyncExternalStore(subscribeToLocationChanges, getCurrentPathSnapshot, () => '/')

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mapped = normalizePath(window.location.pathname)
    if (mapped !== window.location.pathname) {
      window.history.replaceState({}, '', mapped)
      notifyLocationChange()
    }
  }, [])

  const navigate = (path, { replace = false } = {}) => {
    if (typeof window === 'undefined') {
      return
    }
    const mapped = normalizePath(path)
    const current = window.location.pathname
    if (current !== mapped) {
      const fn = replace ? window.history.replaceState : window.history.pushState
      fn.call(window.history, {}, '', mapped)
      notifyLocationChange()
    }
  }

  const handleLogout = () => {
    const activeUser = auth.user
    const activeRole = auth.role

    setLogoutFeedbackPrefill({
      name: activeUser?.name || '',
      email: activeUser?.email || '',
      role: activeRole === 'RetailShop' ? 'Retail Shop' : activeRole || '',
      source: 'logout_form',
    })

    logout()
    setScreen('feedback')
    setEntryIntent('login')
    navigate('/feedback')
  }

  const openRoleSelection = (intent) => {
    setEntryIntent(intent)
    setPendingRole((previousRole) => (
      intent !== 'login' && previousRole === 'Admin' ? 'Manufacturer' : previousRole
    ))
    setScreen('role-selection')
  }

  

  useEffect(() => {
    if (!auth.role) return
    if (!auth.user && !auth.isGuest) return

    if (currentPath === '/') {
      const fallback = DEFAULT_PATH_BY_ROLE[auth.role] ?? '/'
      navigate(fallback, { replace: true })
      return
    }

    const mapped = normalizePath(currentPath)
    if (mapped !== currentPath) {
      navigate(mapped, { replace: true })
    }
  }, [auth.isGuest, auth.role, auth.user, currentPath, ])

  if (screen === 'feedback') {
    return (
      <FeedbackForm
        initialData={logoutFeedbackPrefill}
        onSubmitted={() => {
          setLogoutFeedbackPrefill(null)
          setScreen('home')
          navigate('/')
        }}
      />
    )
  }

  
  if ((auth.user && auth.role) || (auth.isGuest && auth.role)) {
    return (
      <WaybillRouter
        user={auth.user}
        role={auth.role}
        isGuest={auth.isGuest}
        onLogout={handleLogout}
        onNavigate={navigate}
        currentPath={currentPath}
      />
    )
  }
  
  if (false) {
    return (
      <main
 style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        Loading page...
      </main>
    )
  }

  if (screen === 'login') {
    return (
      <Login
        role={pendingRole}
        onBack={() => openRoleSelection('login')}
        onSignupClick={() => openRoleSelection('signup')}
        onGuestClick={() => openRoleSelection('guest')}
        onSubmit={async ({ email, password }) => {
          const data = await authApi.login({
            email,
            password,
            role: ROLE_TO_API[pendingRole],
          })

          const normalizedRole = normalizeRole(data.role)
          navigate(DEFAULT_PATH_BY_ROLE[normalizedRole] ?? '/', { replace: true })

          setUserSession({
            user: { ...data.user, token: data.access_token },
            role: normalizedRole,
          })
        }}
      />
    )
  }

  if (screen === 'signup') {
    return (
      <Signup
        role={pendingRole}
        onBack={() => setScreen('role-selection')}
        onLoginClick={() => {
          setEntryIntent('login')
          setScreen('login')
        }}
        onSubmit={async ({ name, email, password }) => {
          const data = await authApi.signup({
            name,
            email,
            password,
            role: ROLE_TO_API[pendingRole],
          })

          const normalizedRole = normalizeRole(data.role)
          navigate(DEFAULT_PATH_BY_ROLE[normalizedRole] ?? '/', { replace: true })

          setUserSession({
            user: { ...data.user, token: data.access_token },
            role: normalizedRole,
          })
        }}
      />
    )
  }

  if (screen === 'guest') {
    return (
      <GuestForm
        role={pendingRole}
        onBack={() => setScreen('role-selection')}
        onSubmit={async (guestData) => {
          const apiRole = ROLE_TO_API[guestData.role] || ROLE_TO_API[pendingRole] || 'dealer'
          const response = await authApi.guestEntry({
            name: guestData.user?.name || 'Guest User',
            email: guestData.user?.email || 'guest@example.com',
            company: guestData.user?.company || 'Guest Company',
            phone: guestData.user?.phone || 'N/A',
            role: apiRole,
          })

          if (response?.email_sent === false) {
            const warning = response?.email_error || 'Guest account was created, but the confirmation email could not be delivered.'
            const shouldContinue = window.confirm(`${warning}\n\nPress OK to continue as guest, or Cancel to stay on this form.`)
            if (!shouldContinue) {
              return
            }
          }

          enterGuest(guestData.role, guestData.user?.name)
          navigate(DEFAULT_PATH_BY_ROLE[guestData.role] ?? '/', { replace: true })
        }}
      />
    )
  }

  if (screen === 'role-selection') {
    return (
      <RoleSelection
        selectedRole={pendingRole}
        includeAdmin={entryIntent === 'login'}
        onBack={() => {
          setEntryIntent('login')
          setScreen('home')
        }}
        onSelectRole={(role) => {
          setPendingRole(role)
          if (entryIntent === 'signup') {
            setScreen('signup')
            return
          }

          if (entryIntent === 'guest') {
            setScreen('guest')
            return
          }

          setScreen('login')
        }}
      />
    )
  }

  return (
    <Homepage
      onGuestEntry={() => openRoleSelection('guest')}
      onLoginClick={() => openRoleSelection('login')}
      onSignupClick={() => openRoleSelection('signup')}
    />
  )
}

export default App
