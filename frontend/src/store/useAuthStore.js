import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'gsc_auth_state'

const defaultState = {
  user: null,
  role: null,
  isGuest: false,
  token: null,
  entryMethod: null,
}

function normalizeDisplayName(name, fallback = 'User') {
  const text = String(name || '').trim()
  if (!text) {
    return fallback
  }
  return text.toLowerCase().startsWith('default ') ? text.slice(8).trim() : text
}

function normalizeUser(user) {
  if (!user || typeof user !== 'object') {
    return user
  }
  return {
    ...user,
    name: normalizeDisplayName(user.name, 'User'),
  }
}

function readPersistedState() {
  if (typeof window === 'undefined') {
    return defaultState
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultState
    }

    const parsed = JSON.parse(raw)
    if (parsed?.token) {
      if (!window.localStorage.getItem('token')) {
        window.localStorage.setItem('token', parsed.token)
      }
      if (!window.localStorage.getItem('waybill_token')) {
        window.localStorage.setItem('waybill_token', parsed.token)
      }
    }
    return {
      ...defaultState,
      ...parsed,
      user: normalizeUser(parsed?.user),
    }
  } catch {
    return defaultState
  }
}

let authState = readPersistedState()
const listeners = new Set()

function persistState() {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(authState))
    if (authState?.token) {
      window.localStorage.setItem('token', authState.token)
      window.localStorage.setItem('waybill_token', authState.token)
    } else {
      window.localStorage.removeItem('token')
      window.localStorage.removeItem('waybill_token')
    }
  } catch {
    // Ignore storage errors in restricted environments.
  }
}

function emitChange() {
  for (const listener of listeners) {
    listener()
  }
}

function setAuthState(next) {
  authState = typeof next === 'function' ? next(authState) : next
  persistState()
  emitChange()
}

function subscribe(listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getAuthState() {
  return authState
}

export function getAuthToken() {
  if (authState?.token) return authState.token
  if (typeof window !== 'undefined') {
    return (
      window.localStorage.getItem('token') ||
      window.localStorage.getItem('waybill_token') ||
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}')?.token ||
      ''
    )
  }
  return ''
}

export const selectAuthState = (state) => state

export function useAuthStore(selector = selectAuthState) {
  return useSyncExternalStore(
    subscribe,
    () => selector(authState),
    () => selector(defaultState),
  )
}

export function setUserSession({ user, role, token, access_token, accessToken, entryMethod = 'login' } = {}) {
  const resolvedToken = token ?? access_token ?? accessToken ?? user?.token ?? null
  setAuthState({
    user: normalizeUser(user || null),
    role: role || null,
    isGuest: false,
    token: resolvedToken,
    entryMethod: entryMethod,
  })
}

export function enterGuest(role = 'Guest', name = 'Guest User') {
  setAuthState({
    user: {
      name: normalizeDisplayName(name || 'Guest User', 'Guest User'),
      email: 'guest@example.com',
      isGuest: true,
    },
    role: role || 'Guest',
    isGuest: true,
    token: null,
    entryMethod: 'guest',
  })
}

export function logout() {
  setAuthState(defaultState)
}

