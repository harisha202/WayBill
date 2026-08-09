import { getAuthState, logout } from '../store/useAuthStore'
import { normalizeCurrencyString } from '../utils/currency'

// FastAPI routes are mounted under /api, so production base URLs should keep that suffix.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, '')
const ENABLE_DEMO_FALLBACK = String(import.meta.env.VITE_ENABLE_DEMO_FALLBACK || '').toLowerCase() === 'true'
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])
let runtimeApiBaseUrl = API_BASE_URL

function isLocalhostPage() {
  return typeof window !== 'undefined' && LOCAL_HOSTS.has(window.location.hostname)
}

function getLocalApiBaseUrl() {
  const explicitLocalBase = String(import.meta.env.VITE_LOCAL_API_BASE_URL || '').trim().replace(/\/+$/, '')
  if (explicitLocalBase) {
    return explicitLocalBase
  }

  const backendTarget = String(import.meta.env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8000')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/api$/, '')

  return `${backendTarget}/api`
}

function getLocalFallbackBaseUrl(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return ''
  }
  if (!isLocalhostPage() || !runtimeApiBaseUrl.startsWith('http')) {
    return ''
  }
  const localBase = getLocalApiBaseUrl()
  if (!localBase || localBase === runtimeApiBaseUrl) {
    return ''
  }
  return localBase
}

function buildUrl(path, baseUrl = runtimeApiBaseUrl) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

function shouldRetryWithLocalBackend(response, rawBody = '', contentType = '') {
  if (!response || response.ok) {
    return false
  }

  if ([502, 503, 504].includes(response.status)) {
    return true
  }

  return response.status >= 500 && looksLikeProxyConnectionFailure(rawBody, contentType)
}

async function safeReadText(response) {
  if (!response || response.bodyUsed) {
    return ''
  }
  try {
    return await response.text()
  } catch {
    return ''
  }
}

function tryParseJson(rawText) {
  if (!rawText) {
    return null
  }
  try {
    return JSON.parse(rawText)
  } catch {
    return null
  }
}

const DEFAULT_STATUS_MESSAGES = {
  400: 'Bad request. Please check your input and try again.',
  403: 'You do not have permission to perform this action.',
  404: 'Requested resource was not found.',
  409: 'This action conflicts with existing data.',
  422: 'Submitted data is invalid. Please review and try again.',
  429: 'Too many requests. Please wait and try again.',
  500: 'Server error. Please try again in a moment.',
  502: 'Gateway error. Please try again shortly.',
  503: 'Service is temporarily unavailable. Please try again shortly.',
}

function extractErrorMessage(value) {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'string') {
    return value.trim()
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = extractErrorMessage(item)
      if (nested) {
        return nested
      }
    }
    return ''
  }

  if (typeof value === 'object') {
    const direct =
      value.message ??
      value.detail ??
      value.error ??
      value.title ??
      value.msg ??
      value.reason

    const directMessage = extractErrorMessage(direct)
    if (directMessage) {
      return directMessage
    }

    if (Array.isArray(value.errors)) {
      const errorsMessage = extractErrorMessage(value.errors)
      if (errorsMessage) {
        return errorsMessage
      }
    }
  }

  return ''
}

function canUseRawErrorText(rawText, contentType, status) {
  const trimmed = String(rawText || '').trim()
  if (!trimmed) {
    return false
  }
  if (contentType.includes('text/html')) {
    return false
  }
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return false
  }
  if (status >= 500 && trimmed.length > 160) {
    return false
  }
  return true
}

function looksLikeProxyConnectionFailure(rawText = '', contentType = '') {
  const haystack = `${String(contentType || '').toLowerCase()}\n${String(rawText || '').toLowerCase()}`
  return (
    haystack.includes('ecconnrefused') ||
    haystack.includes('connect econnrefused') ||
    haystack.includes('proxy error') ||
    haystack.includes('http proxy error') ||
    haystack.includes('error occurred while trying to proxy') ||
    haystack.includes('failed to proxy') ||
    haystack.includes('target machine actively refused') ||
    haystack.includes('socket hang up') ||
    haystack.includes('econnreset') ||
    haystack.includes('enotfound') ||
    haystack.includes('eai_again') ||
    haystack.includes('fetch failed')
  )
}

async function request(path, { method = 'GET', data, headers = {}, responseType = 'json' } = {}) {
  const auth = getAuthState()
  const requestHeaders = {
    ...headers,
  }

  if (auth.token) {
    requestHeaders.Authorization = `Bearer ${auth.token}`
  }

  if (data !== undefined && !requestHeaders['Content-Type']) {
    requestHeaders['Content-Type'] = 'application/json'
  }

  const requestUrl = buildUrl(path)
  const fallbackBaseUrl = getLocalFallbackBaseUrl(path)
  const fallbackUrl = fallbackBaseUrl ? buildUrl(path, fallbackBaseUrl) : ''
  let response
  let fallbackTried = false
  try {
    response = await fetch(requestUrl, {
      method,
      headers: requestHeaders,
      body: data !== undefined ? JSON.stringify(data) : undefined,
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw error
    }
    if (fallbackUrl) {
      try {
        fallbackTried = true
        response = await fetch(fallbackUrl, {
          method,
          headers: requestHeaders,
          body: data !== undefined ? JSON.stringify(data) : undefined,
        })
        runtimeApiBaseUrl = fallbackBaseUrl
      } catch (fallbackError) {
        if (fallbackError?.name === 'AbortError') {
          throw fallbackError
        }
      }
    }
    if (response) {
      // Continue into the standard non-OK handling below.
    } else {
      const connectionHint = runtimeApiBaseUrl.startsWith('http')
        ? runtimeApiBaseUrl
        : `backend via ${runtimeApiBaseUrl} (dev proxy)`
      throw new Error(`Cannot reach server (${connectionHint}). Make sure backend is running.`)
    }
  }

  if (response.status === 401) {
    if (auth.token && !auth.isGuest) {
      logout()
      throw new Error('Session expired. Please login again.')
    }
    throw new Error('Unauthorized')
  }

  if (!response.ok) {
    let message = DEFAULT_STATUS_MESSAGES[response.status] || `Request failed with status ${response.status}`
    let rawBody = await safeReadText(response)
    let contentType = response.headers.get('content-type') || ''

    if (!fallbackTried && fallbackUrl && shouldRetryWithLocalBackend(response, rawBody, contentType)) {
      try {
        const fallbackResponse = await fetch(fallbackUrl, {
          method,
          headers: requestHeaders,
          body: data !== undefined ? JSON.stringify(data) : undefined,
        })
        fallbackTried = true
        if (fallbackResponse.ok) {
          runtimeApiBaseUrl = fallbackBaseUrl
          response = fallbackResponse
          rawBody = await safeReadText(response)
          contentType = response.headers.get('content-type') || ''
        } else {
          response = fallbackResponse
          rawBody = await safeReadText(response)
          contentType = response.headers.get('content-type') || ''
          runtimeApiBaseUrl = fallbackBaseUrl
        }
      } catch (fallbackError) {
        if (fallbackError?.name === 'AbortError') {
          throw fallbackError
        }
      }
    }

    if (response.ok) {
      if (responseType === 'blob') {
        return response.blob()
      }

      if (responseType === 'text') {
        return rawBody || safeReadText(response)
      }

      if (response.status === 204) {
        return null
      }

      if (contentType.includes('application/json')) {
        const payload = tryParseJson(rawBody)
        if (payload !== null) {
          return payload
        }
        return rawBody || null
      }

      return rawBody || safeReadText(response)
    }

    if (rawBody) {
      if (response.status >= 500 && looksLikeProxyConnectionFailure(rawBody, contentType)) {
        const connectionHint = runtimeApiBaseUrl.startsWith('http')
          ? runtimeApiBaseUrl
          : `backend via ${runtimeApiBaseUrl} (dev proxy)`
        message = `Cannot reach server (${connectionHint}). Make sure backend is running.`
      } else if (contentType.includes('application/json')) {
        const payload = tryParseJson(rawBody)
        if (payload) {
          const extractedMessage = extractErrorMessage(payload)
          if (extractedMessage) {
            message = extractedMessage
          }
        } else {
          if (canUseRawErrorText(rawBody, contentType, response.status)) {
            message = rawBody.trim()
          }
        }
      } else {
        if (canUseRawErrorText(rawBody, contentType, response.status)) {
          message = rawBody.trim()
        }
      }
    }
    const requestError = new Error(message)
    requestError.status = response.status
    throw requestError
  }

  if (responseType === 'blob') {
    return response.blob()
  }

  if (responseType === 'text') {
    return safeReadText(response)
  }

  if (response.status === 204) {
    return null
  }

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const rawBody = await safeReadText(response)
    const payload = tryParseJson(rawBody)
    if (payload !== null) {
      return payload
    }
    return rawBody || null
  }

  return safeReadText(response)
}

const http = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, data, options) => request(path, { ...options, method: 'POST', data }),
  put: (path, data, options) => request(path, { ...options, method: 'PUT', data }),
  patch: (path, data, options) => request(path, { ...options, method: 'PATCH', data }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}

export const authApi = {
  post: http.post,
  get: http.get,
  login: (payload) =>
    http.post('/auth/login', payload, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }),
  signup: (payload) => http.post('/auth/signup', payload),
  guestEntry: (payload) => http.post('/auth/guest-entry', payload),
  submitFeedback: (payload) => http.post('/auth/feedback', payload),
}

export const adminApi = {
  stats: () => http.get('/admin/stats'),
  aiForecast: (history, periods) =>
      http.get(`/admin/ai-forecast?history=${encodeURIComponent(history)}&horizon=${periods}`),
  analytics: (timeRange = '30d') => http.get(`/admin/analytics?range=${encodeURIComponent(timeRange)}`),
  blockchainTransactions: () => http.get('/admin/blockchain/transactions'),
  verifyBlockchainTransaction: (txHash) => http.post('/admin/blockchain/verify', { txHash }),
  generateReport: (payload) => http.post('/admin/reports/generate', payload, { responseType: 'blob' }),
}

export const manufacturerApi = {
  products: () => http.get('/manufacturer/products'),
  aiForecast: (history, periods) =>
      http.get(`/manufacturer/ai-forecast?history=${encodeURIComponent(history)}&horizon=${periods}`),
  analytics: () => http.get('/manufacturer/analytics'),
  batches: () => http.get('/manufacturer/batches'),
  createBatchForOrder: (orderCode, payload) =>
    http.patch(`/manufacturer/orders/${encodeURIComponent(orderCode)}/create-batch`, payload),
  assignTransporter: (orderCode, payload) =>
    http.patch(`/manufacturer/orders/${encodeURIComponent(orderCode)}/assign-transporter`, payload),
}

export const trackingApi = {
  liveGps: () => http.get('/tracking/live-gps'),
  analytics: (timeRange = '7d') => http.get(`/tracking/analytics?range=${encodeURIComponent(timeRange)}`),
  updateOrderStage: (orderCode, payload) =>
    http.patch(`/tracking/orders/${encodeURIComponent(orderCode)}/stage`, payload),
  updateShipmentLocation: (shipmentId, payload) =>
    http.patch(`/tracking/shipments/${encodeURIComponent(shipmentId)}`, payload),
}

export const inventoryApi = {
  getInventory: (skip = 0, limit = 100) => http.get(`/inventory?skip=${skip}&limit=${limit}`),
  salesAnalytics: (timeRange = 'week') => http.get(`/inventory/sales-analytics?range=${encodeURIComponent(timeRange)}`),
  sellProduct: (payload) => http.post('/inventory/sales', payload),
}

export const dealerApi = {
  recentOrders: () => http.get('/dealer/orders/recent'),
  orderTrends: () => http.get('/dealer/orders/trends'),
  lowStockAlerts: () => http.get('/dealer/low-stock'),
  inventory: () => http.get('/dealer/inventory'),
  arrivals: () => http.get('/dealer/arrivals'),
  analytics: (timeRange = '30d') => http.get(`/dealer/analytics?range=${encodeURIComponent(timeRange)}`),
  pipelineOrders: () => http.get('/dealer/orders/pipeline'),
  createRetailOrder: (payload) => http.post('/dealer/orders/retail', payload),
  confirmOrder: (orderCode) => http.patch(`/dealer/orders/${encodeURIComponent(orderCode)}/confirm`, {}),
  forwardOrderToManufacturer: (orderCode, payload = {}) =>
    http.patch(`/dealer/orders/${encodeURIComponent(orderCode)}/dealer-order`, payload),
  receiveOrder: (orderCode) => http.patch(`/dealer/orders/${encodeURIComponent(orderCode)}/receive`, {}),
  retailReceiveOrder: (orderCode) =>
    http.patch(`/dealer/orders/${encodeURIComponent(orderCode)}/retail-receive`, {}),
  reorderRecommendations: (days = 30) =>
    http.get(`/dealer/reorder-recommendations?days=${encodeURIComponent(days)}`),
}

export const blockchainApi = {
  journey: (productSku) => http.get(`/blockchain/journey/${encodeURIComponent(productSku)}`),
  qr: (productSku) => http.get(`/blockchain/qr/${encodeURIComponent(productSku)}`),
  journeySummary: (productSku) => http.get(`/blockchain/journey-summary/${encodeURIComponent(productSku)}`),
  verify: (payload) => http.post('/blockchain/verify', payload),
}
