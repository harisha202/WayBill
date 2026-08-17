import sys

code_to_add = """
// ─── RETAIL SHOP COLOR PALETTES ─────────────────────────────────────────────

export const RETAIL_SALES = {
  primary: '#2563EB', // Blue
  secondary: '#4F46E5', // Indigo
  tertiary: '#6366F1', // Violet
  revenue: '#16A34A', // Green
  qty: '#38BDF8', // Sky
  trend: '#2563EB'
};

export const RETAIL_INVENTORY = {
  primary: '#0D9488', // Teal
  secondary: '#06B6D4', // Cyan
  stockIn: '#0D9488',
  stockOut: '#2563EB',
  level: '#06B6D4',
  lowStock: '#F59E0B' // Amber
};

export const RETAIL_REVENUE = {
  primary: '#2563EB', // Blue
  secondary: '#059669', // Green
  trend: '#0D9488', // Teal
  bar: '#3B82F6'
};

export const RETAIL_REPLENISHMENT = {
  primary: '#F59E0B', // Amber
  secondary: '#F97316', // Orange
  demand: '#F59E0B',
  reorder: '#DC2626', // Red
  stock: '#0D9488'
};

export const RETAIL_WAYBILL = {
  primary: '#4F46E5', // Indigo
  secondary: '#2563EB', // Blue
  stages: ['#1D4ED8','#2563EB','#4F46E5','#6366F1','#06B6D4','#059669']
};

export const RETAIL_TRACEABILITY = {
  primary: '#7C3AED', // Purple
  secondary: '#8B5CF6',
  manufacturer: '#7C3AED',
  batch: '#A78BFA',
  waybill: '#4F46E5',
  transporter: '#8B5CF6',
  dealer: '#2563EB',
  retail: '#06B6D4'
};

export const RETAIL_RECEIVING = {
  primary: '#0D9488', // Teal
  secondary: '#2563EB', // Blue
  ordered: '#94A3B8', // Slate
  received: '#0D9488',
  discrepancy: '#DC2626',
  partial: '#F59E0B'
};

export const RETAIL_RISK = {
  GREEN: '#059669',
  AMBER: '#F59E0B',
  RED: '#DC2626',
  NEUTRAL: '#94A3B8'
};

export function getRetailStatusColor(status) {
  const map = {
    // Inventory
    'HEALTHY': '#059669',
    'LOW STOCK': '#F59E0B',
    'CRITICAL': '#DC2626',
    'REORDER': '#F97316',
    // Receiving
    'RECEIVED': '#059669',
    'PARTIALLY_DELIVERED': '#F59E0B',
    'DELIVERED': '#0D9488',
    'DISCREPANCY': '#DC2626',
    // Pipeline
    'CREATED': '#1D4ED8',
    'CONFIRMED': '#2563EB',
    'DISPATCHED': '#6366F1',
    'IN TRANSIT': '#06B6D4',
    // Risk
    'HIGH': '#DC2626',
    'MEDIUM': '#F59E0B',
    'LOW': '#059669',
    // Anomalies
    'OPEN': '#DC2626',
    'ACKNOWLEDGED': '#F59E0B',
    'RESOLVED': '#059669'
  };
  return map[String(status || '').toUpperCase().replace(/ /g, '_')] || '#94A3B8';
}
"""

with open(r'c:\Users\91797\OneDrive\Desktop\WayBill\frontend\src\components\dashboard\analytics\chartColors.js', 'a', encoding='utf-8') as f:
    f.write(code_to_add)

print("Retail colors added successfully.")
