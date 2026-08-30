let notificationSocket = null
let notificationReconnectTimer = null
let notificationDisconnectTimer = null
let notificationPingTimer = null
let notificationReconnectEnabled = true
let notificationLastConnectOptions = null
let notificationReconnectAttempts = 0
let notificationActiveUserId = null

const RECONNECT_DELAY_MS = Number(import.meta.env.VITE_GPS_SOCKET_RECONNECT_MS ?? 2500)
const MAX_RECONNECT_DELAY_MS = Number(import.meta.env.VITE_GPS_SOCKET_MAX_DELAY_MS ?? 15000)
const MAX_RECONNECT_ATTEMPTS = Number(
  import.meta.env.VITE_GPS_SOCKET_MAX_RETRIES ??
    (import.meta.env.DEV ? 8 : Number.POSITIVE_INFINITY),
)

const NOTIFICATION_PING_MS = Number(import.meta.env.VITE_NOTIFICATION_SOCKET_PING_MS ?? 20000)
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])

function isLocalhostPage() {
  return typeof window !== 'undefined' && LOCAL_HOSTS.has(window.location.hostname)
}

function toSocketUrl(httpUrl) {
  const normalized = String(httpUrl || '').trim()
  if (!normalized) {
    return ''
  }

  if (normalized.startsWith('ws://') || normalized.startsWith('wss://')) {
    return normalized
  }

  if (normalized.startsWith('http://')) {
    return `ws://${normalized.slice('http://'.length)}`
  }

  if (normalized.startsWith('https://')) {
    return `wss://${normalized.slice('https://'.length)}`
  }

  return normalized
}

function getConfiguredSocketBase() {
  const explicitBase =
    import.meta.env.VITE_SOCKET_BASE_URL ||
    import.meta.env.VITE_NOTIFICATION_SOCKET_BASE_URL ||
    ''

  if (String(explicitBase).trim()) {
    const normalizedExplicitBase = toSocketUrl(explicitBase).replace(/\/+$/, '')
    if (isLocalhostPage() && !import.meta.env.DEV) {
      return getLocalBackendSocketBase()
    }
    return normalizedExplicitBase
  }

  if (import.meta.env.DEV) {
    return getLocalBackendSocketBase()
  }

  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}`
  }

  return getLocalBackendSocketBase()
}

function getLocalBackendSocketUrl() {
  const backendTarget = import.meta.env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8000'
  const wsBase = toSocketUrl(backendTarget).replace(/\/+$/, '')
  return `${wsBase}/ws/gps?token=${getAuthToken()}`
}

function getLocalBackendSocketBase() {
  const backendTarget = import.meta.env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8000'
  return toSocketUrl(backendTarget).replace(/\/+$/, '')
}

function getAuthToken() {
  try {
    const raw = window.localStorage.getItem('gsc_auth_state')
    if (raw) return JSON.parse(raw).token || ''
  } catch {
    // ignore
  }
  return ''
}

function getDefaultSocketUrl() {
  const configuredBase = getConfiguredSocketBase()
  if (configuredBase) {
    return `${configuredBase}/ws/gps?token=${getAuthToken()}`
  }

  if (typeof window === 'undefined') {
    return `${getLocalBackendSocketBase()}/ws/gps?token=${getAuthToken()}`
  }

  if (import.meta.env.DEV || isLocalhostPage()) {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return `${getLocalBackendSocketBase()}/ws/gps?token=${getAuthToken()}`
    }
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/ws/gps?token=${getAuthToken()}`
}

function getDefaultSocketBase() {
  const configuredBase = getConfiguredSocketBase()
  if (configuredBase) {
    return configuredBase
  }

  if (typeof window === 'undefined') {
    return getLocalBackendSocketBase()
  }

  if (import.meta.env.DEV || isLocalhostPage()) {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return getLocalBackendSocketBase()
    }
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}`
}
function clearNotificationReconnectTimer() {
  if (notificationReconnectTimer) {
    clearTimeout(notificationReconnectTimer)
    notificationReconnectTimer = null
  }
}

function clearNotificationDisconnectTimer() {
  if (notificationDisconnectTimer) {
    clearTimeout(notificationDisconnectTimer)
    notificationDisconnectTimer = null
  }
}

function clearNotificationPingTimer() {
  if (notificationPingTimer) {
    clearInterval(notificationPingTimer)
    notificationPingTimer = null
  }
}

function parseSocketMessage(rawData) {
  if (typeof rawData !== 'string') {
    return rawData
  }
  try {
    return JSON.parse(rawData)
  } catch {
    return rawData
  }
}


function scheduleNotificationReconnect() {
  if (!notificationReconnectEnabled || notificationReconnectTimer || !notificationLastConnectOptions) {
    return
  }

  if (Number.isFinite(MAX_RECONNECT_ATTEMPTS) && notificationReconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    notificationReconnectEnabled = false
    return
  }

  notificationReconnectAttempts += 1
  const backoffMultiplier = Math.max(1, notificationReconnectAttempts)
  const delay = Math.min(RECONNECT_DELAY_MS * backoffMultiplier, MAX_RECONNECT_DELAY_MS)

  notificationReconnectTimer = setTimeout(() => {
    notificationReconnectTimer = null
    const options = notificationLastConnectOptions
    if (!options) return
    connectNotificationSocket(options.userId, options.handlers, { isReconnect: true })
  }, delay)
}


export function connectNotificationSocket(userId, { onMessage, onOpen, onClose } = {}, { isReconnect = false } = {}) {
  const normalizedUser = String(userId || '').trim()
  if (!normalizedUser) {
    return null
  }

  clearNotificationDisconnectTimer()
  notificationReconnectEnabled = true
  notificationLastConnectOptions = { userId: normalizedUser, handlers: { onMessage, onOpen, onClose } }
  if (!isReconnect) {
    notificationReconnectAttempts = 0
  }

  if (notificationActiveUserId && notificationActiveUserId !== normalizedUser) {
    try {
      notificationSocket?.close()
    } catch {
      // Ignore socket close errors.
    }
    notificationSocket = null
    notificationActiveUserId = null
    clearNotificationPingTimer()
    clearNotificationReconnectTimer()
  }

  if (
    notificationSocket &&
    (notificationSocket.readyState === WebSocket.OPEN || notificationSocket.readyState === WebSocket.CONNECTING)
  ) {
    return notificationSocket
  }

  const url = `${getDefaultSocketBase()}/ws/notifications/${encodeURIComponent(normalizedUser)}?token=${getAuthToken()}`
  try {
    notificationSocket = new WebSocket(url)
  } catch {
    scheduleNotificationReconnect()
    return null
  }

  notificationActiveUserId = normalizedUser

  notificationSocket.addEventListener('open', (event) => {
    clearNotificationReconnectTimer()
    notificationReconnectAttempts = 0
    clearNotificationPingTimer()
    notificationPingTimer = setInterval(() => {
      try {
        if (notificationSocket?.readyState === WebSocket.OPEN) {
          notificationSocket.send('ping')
        }
      } catch {
        // Ignore send errors; close handler will reconnect.
      }
    }, NOTIFICATION_PING_MS)
    if (onOpen) onOpen(event)
  })

  notificationSocket.addEventListener('message', (event) => {
    if (onMessage) onMessage(parseSocketMessage(event.data))
  })

  notificationSocket.addEventListener('close', (event) => {
    notificationSocket = null
    notificationActiveUserId = null
    clearNotificationPingTimer()
    if (onClose) onClose(event)
    scheduleNotificationReconnect()
  })

  notificationSocket.addEventListener('error', () => {
    try {
      notificationSocket?.close()
    } catch {
      // Ignore socket close errors.
    }
  })

  return notificationSocket
}

export function disconnectNotificationSocket() {
  notificationReconnectEnabled = false
  notificationLastConnectOptions = null
  notificationReconnectAttempts = 0
  clearNotificationReconnectTimer()
  clearNotificationPingTimer()

  if (!notificationSocket) {
    notificationActiveUserId = null
    clearNotificationDisconnectTimer()
    return
  }

  // Avoid rapid close/open churn when navigating between pages that re-mount the dashboard shell.
  // If a reconnect is requested quickly, the disconnect timer is cleared in connectNotificationSocket().
  clearNotificationDisconnectTimer()
  notificationDisconnectTimer = setTimeout(() => {
    try {
      notificationSocket?.close()
    } catch {
      // Ignore socket close errors.
    }
    notificationSocket = null
    notificationActiveUserId = null
    notificationDisconnectTimer = null
  }, 350)
}
