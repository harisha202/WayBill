/**
 * WayBill Admin Analytics — Chart Color System
 * Single source of truth for all chart colors.
 * Maps to the existing CSS design tokens in index.css.
 */

// ─── GLOBAL SEMANTIC COLORS ──────────────────────────────────────────────────
// These map to the CSS variables defined in :root
export const SEMANTIC = {
  success:  '#059669', // --green  (Success / Active / Verified)
  warning:  '#F59E0B', // --yellow (Warning / Pending / At Risk)
  orange:   '#EA580C', // --orange (Elevated Risk / Disputed)
  critical: '#DC2626', // --red    (Critical / Failed)
  info:     '#2563EB', // --blue   (Information / In Progress)
  neutral:  '#94A3B8', // --gray   (Disabled / Unknown)
  muted:    '#64748B', // slate-500
  slate:    '#475569', // slate-600
};

// ─── TAB COLOR FAMILIES ───────────────────────────────────────────────────────

// 1. Control Tower — Blue / Cyan
export const CONTROL_TOWER = {
  primary:      '#2563EB', // Deep Blue
  secondary:    '#06B6D4', // Cyan
  tertiary:     '#60A5FA', // Blue-400
  quaternary:   '#38BDF8', // Sky-400
  light:        '#93C5FD', // Blue-300
  // Stage shades for funnel (darker → lighter as stages progress)
  stages: [
    '#1D4ED8', // Created      — Blue-700
    '#2563EB', // Confirmed    — Blue-600
    '#3B82F6', // Processing   — Blue-500
    '#60A5FA', // Dispatched   — Blue-400
    '#06B6D4', // In Transit   — Cyan-500
    '#38BDF8', // Delivered    — Sky-400
    '#059669', // Completed    — Green (semantic success)
  ],
};

// 2. Supply Chain Depth — Indigo / Purple
export const SUPPLY_CHAIN = {
  primary:    '#4F46E5', // Indigo-600
  secondary:  '#7C3AED', // Violet-600
  tertiary:   '#8B5CF6', // Violet-500
  quaternary: '#A78BFA', // Violet-400
  light:      '#C4B5FD', // Violet-300
  // Entity type colors
  supplier:     '#4F46E5', // Indigo
  manufacturer: '#7C3AED', // Purple
  transporter:  '#8B5CF6', // Violet
  dealer:       '#6366F1', // Indigo-500 (blue-violet)
  retail_shop:  '#A78BFA', // Light Violet
};

// 3. Supplier Risk — Amber / Orange
export const SUPPLIER_RISK = {
  primary:    '#F59E0B', // Amber-500
  secondary:  '#F97316', // Orange-500
  tertiary:   '#EA580C', // Orange-600
  quaternary: '#FDBA74', // Orange-300
  light:      '#FDE68A', // Amber-200
};

// 4. Financial Ledger — Green / Teal
export const FINANCIAL = {
  primary:    '#16A34A', // Green-600
  secondary:  '#0D9488', // Teal-600
  tertiary:   '#059669', // Emerald-600
  quaternary: '#4ADE80', // Green-400
  light:      '#6EE7B7', // Emerald-300
  // Semantic financial series (NEVER change these)
  revenue:    '#16A34A', // Green
  cost:       '#64748B', // Slate (neutral — cost is NOT red)
  profit:     '#059669', // Emerald
  // Cost categories (MUST be consistent across all periods)
  transportation: '#0D9488', // Teal
  procurement:    '#16A34A', // Green
  warehouse:      '#4B5563', // Slate-Blue-Green
  handling:       '#4ADE80', // Light Green
  other:          '#94A3B8', // Neutral Gray
};

// ─── SHIPMENT RISK STATUS COLORS ─────────────────────────────────────────────
// MUST use semantic colors — do NOT use blue/purple for risk severity
export const RISK = {
  normal:   '#059669', // Green
  at_risk:  '#F59E0B', // Amber
  delayed:  '#EA580C', // Orange
  critical: '#DC2626', // Red
};

// ─── INVENTORY HEALTH COLORS ──────────────────────────────────────────────────
export const INVENTORY_HEALTH = {
  healthy:   '#059669', // Green
  low:       '#F59E0B', // Amber
  critical:  '#DC2626', // Red
  overstock: '#2563EB', // Blue
};

// ─── LEDGER VERIFICATION COLORS ──────────────────────────────────────────────
export const VERIFICATION = {
  verified: '#16A34A', // Green
  pending:  '#F59E0B', // Amber
  disputed: '#EA580C', // Orange
  failed:   '#DC2626', // Red
};

// ─── CHART STYLE CONSTANTS ────────────────────────────────────────────────────
export const CHART_STYLE = {
  gridColor:     'rgba(148, 163, 184, 0.15)', // subtle grid lines
  axisColor:     '#94A3B8',                    // readable axis labels
  tooltipBg:     '#1E293B',                    // dark tooltip background
  tooltipText:   '#F1F5F9',                    // light tooltip text
  strokeWidth:   2,
  areaOpacity:   0.15,                         // subtle area fills
  barRadius:     4,                            // rounded bars
};

// ─── HELPER: get risk color by level string ───────────────────────────────────
export function getRiskColor(level) {
  const map = {
    'Normal':   RISK.normal,
    'At Risk':  RISK.at_risk,
    'Delayed':  RISK.delayed,
    'Critical': RISK.critical,
    'Low':      SEMANTIC.success,
    'Medium':   RISK.at_risk,
    'High':     RISK.delayed,
  };
  return map[level] || SEMANTIC.neutral;
}

// ─── HELPER: get verification color by status string ─────────────────────────
export function getVerificationColor(status) {
  const map = {
    'Verified': VERIFICATION.verified,
    'Pending':  VERIFICATION.pending,
    'Disputed': VERIFICATION.disputed,
    'Failed':   VERIFICATION.failed,
  };
  return map[status] || SEMANTIC.neutral;
}

// ─── HELPER: get inventory health color ──────────────────────────────────────
export function getInventoryHealthColor(health) {
  const map = {
    'Healthy':   INVENTORY_HEALTH.healthy,
    'Low':       INVENTORY_HEALTH.low,
    'Critical':  INVENTORY_HEALTH.critical,
    'Overstock': INVENTORY_HEALTH.overstock,
  };
  return map[health] || SEMANTIC.neutral;
}

// ─── HELPER: get supply chain entity color ────────────────────────────────────
export function getEntityColor(entityType) {
  const map = {
    'supplier':     SUPPLY_CHAIN.supplier,
    'manufacturer': SUPPLY_CHAIN.manufacturer,
    'transporter':  SUPPLY_CHAIN.transporter,
    'dealer':       SUPPLY_CHAIN.dealer,
    'retail_shop':  SUPPLY_CHAIN.retail_shop,
  };
  return map[entityType] || SEMANTIC.neutral;
}
