const INR_LOCALE = 'en-IN'
const INR_CURRENCY = 'INR'

export function parseAmount(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  const normalized = String(value ?? '').replace(/[^0-9.-]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatINR(
  value,
  { minimumFractionDigits = 0, maximumFractionDigits = 2 } = {},
) {
  const amount = Number(value)
  const safeAmount = Number.isFinite(amount) ? amount : 0
  return safeAmount.toLocaleString(INR_LOCALE, {
    style: 'currency',
    currency: INR_CURRENCY,
    minimumFractionDigits,
    maximumFractionDigits,
  })
}

function detectFractionDigits(value) {
  const decimalMatch = String(value).match(/\.(\d+)/)
  return decimalMatch ? Math.min(decimalMatch[1].length, 2) : 0
}

export function normalizeCurrencyString(value) {
  if (typeof value !== 'string') {
    return value
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return value
  }

  if (!/^[+-]?\s*(?:(?:USD\s*)?\$|INR|Rs\.?|₹)/i.test(trimmed)) {
    return value
  }

  const withoutSymbol = trimmed
    .replace(/USD|INR|Rs\.?|₹/gi, '')
    .replace(/\$/g, '')
    .replace(/\s+/g, '')
    .trim()

  if (!/^-?\d[\d,]*(?:\.\d+)?$/.test(withoutSymbol)) {
    return value
  }

  const parsed = parseAmount(withoutSymbol)
  const fractionDigits = detectFractionDigits(withoutSymbol)
  return formatINR(parsed, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}
