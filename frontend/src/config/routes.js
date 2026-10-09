// Canonical Route and Navigation Registry for Waybill
// Single Source of Truth for Routing, Navigation, RBAC permissions, and API dependencies

export const ROLE_NORMALIZATION_MAP = {
  admin: 'Admin',
  Admin: 'Admin',
  manufacturer: 'Manufacturer',
  Manufacturer: 'Manufacturer',
  transporter: 'Transporter',
  Transporter: 'Transporter',
  dealer: 'Dealer',
  Dealer: 'Dealer',
  retail: 'RetailShop',
  retail_shop: 'RetailShop',
  retailshop: 'RetailShop',
  RetailShop: 'RetailShop',
  Retail: 'RetailShop',
};

export function normalizeRole(role) {
  if (!role) return 'Admin';
  return ROLE_NORMALIZATION_MAP[role] || ROLE_NORMALIZATION_MAP[String(role).toLowerCase()] || 'Admin';
}

export const CANONICAL_ROUTES = [
  // ─── ADMIN ROUTES ────────────────────────────────────────────────────────
  {
    role: 'Admin',
    path: '/admin',
    label: '🗼 Control Tower',
    icon: '🗼',
    componentKey: 'ControlTower',
    permission: 'admin.control_tower.view',
    apiDependency: '/api/admin/analytics/control-tower',
  },
  {
    role: 'Admin',
    path: '/admin/users',
    label: '👥 User Management',
    icon: '👥',
    componentKey: 'UserManagement',
    permission: 'admin.users.manage',
    apiDependency: '/api/admin/users',
  },
  {
    role: 'Admin',
    path: '/admin/depth',
    label: '🌳 Supply Chain Depth',
    icon: '🌳',
    componentKey: 'SupplyChainDepth',
    permission: 'admin.depth.view',
    apiDependency: '/api/admin/analytics/supply-chain',
  },
  {
    role: 'Admin',
    path: '/admin/risk',
    label: '⚠️ Supplier Risk',
    icon: '⚠️',
    componentKey: 'SupplierRisk',
    permission: 'admin.risk.view',
    apiDependency: '/api/admin/analytics/supplier-risk',
  },
  {
    role: 'Admin',
    path: '/admin/activity',
    label: '🔗 Activity Log',
    icon: '🔗',
    componentKey: 'ActivityLog',
    permission: 'admin.activity.view',
    apiDependency: '/api/admin/activity',
  },
  {
    role: 'Admin',
    path: '/admin/ledger',
    label: '💰 Financial Ledger',
    icon: '💰',
    componentKey: 'AdminLedger',
    permission: 'admin.ledger.view',
    apiDependency: '/api/admin/analytics/financial',
  },
  {
    role: 'Admin',
    path: '/admin/alerts',
    label: '🔔 Alert Center',
    icon: '🔔',
    componentKey: 'AdminAlertCenter',
    permission: 'admin.alerts.view',
    apiDependency: '/api/admin/notifications',
  },
  {
    role: 'Admin',
    path: '/admin/disputes',
    label: '⚖️ Dispute Center',
    icon: '⚖️',
    componentKey: 'AdminDisputeCenter',
    permission: 'admin.disputes.view',
    apiDependency: '/api/disputes',
  },
  {
    role: 'Admin',
    path: '/admin/verify',
    label: '✅ Seal Verification',
    icon: '✅',
    componentKey: 'SealVerificationCenter',
    permission: 'admin.verify.view',
    apiDependency: '/api/waybills',
  },
  {
    role: 'Admin',
    path: '/admin/batch',
    label: '📦 Batch Traceability',
    icon: '📦',
    componentKey: 'BatchTraceability',
    permission: 'admin.batch.view',
    apiDependency: '/api/blockchain/transactions',
  },
  {
    role: 'Admin',
    path: '/admin/settings',
    label: '⚙️ Admin Settings',
    icon: '⚙️',
    componentKey: 'AdminSettings',
    permission: 'admin.settings.manage',
    apiDependency: '/api/ai/document',
  },

  // ─── MANUFACTURER ROUTES ─────────────────────────────────────────────────
  {
    role: 'Manufacturer',
    path: '/manufacturer',
    label: '🏠 Dashboard',
    icon: '🏠',
    componentKey: 'ManufacturerDashboard',
    permission: 'manufacturer.dashboard.view',
    apiDependency: '/api/manufacturer/analytics/dashboard',
  },
  {
    role: 'Manufacturer',
    path: '/manufacturer/production',
    label: '⚙️ Production',
    icon: '⚙️',
    componentKey: 'Production',
    permission: 'manufacturer.production.manage',
    apiDependency: '/api/manufacturer/analytics/production',
  },
  {
    role: 'Manufacturer',
    path: '/manufacturer/forecast',
    label: '🤖 AI Forecast',
    icon: '🤖',
    componentKey: 'AIForecast',
    permission: 'manufacturer.forecast.view',
    apiDependency: '/api/manufacturer/analytics/forecast',
  },
  {
    role: 'Manufacturer',
    path: '/manufacturer/sourcing',
    label: '🪨 Raw Material Sourcing',
    icon: '🪨',
    componentKey: 'RawMaterialSourcing',
    permission: 'manufacturer.materials.view',
    apiDependency: '/api/manufacturer/analytics/materials',
  },
  {
    role: 'Manufacturer',
    path: '/manufacturer/assurance',
    label: '✅ Quality Assurance',
    icon: '✅',
    componentKey: 'QualityAssurance',
    permission: 'manufacturer.quality.view',
    apiDependency: '/api/manufacturer/analytics/quality',
  },
  {
    role: 'Manufacturer',
    path: '/manufacturer/ledger',
    label: '💰 Financial Ledger',
    icon: '💰',
    componentKey: 'ManufacturerLedger',
    permission: 'manufacturer.ledger.view',
    apiDependency: '/api/manufacturer/analytics/ledger',
  },
  {
    role: 'Manufacturer',
    path: '/manufacturer/alerts',
    label: '🔔 Alert Center',
    icon: '🔔',
    componentKey: 'AlertCenter',
    permission: 'manufacturer.alerts.view',
    apiDependency: '/api/manufacturer/analytics/alerts',
  },
  {
    role: 'Manufacturer',
    path: '/manufacturer/disputes',
    label: '⚖️ Dispute Center',
    icon: '⚖️',
    componentKey: 'DisputeCenter',
    permission: 'manufacturer.disputes.view',
    apiDependency: '/api/manufacturer/analytics/disputes',
  },
  {
    role: 'Manufacturer',
    path: '/manufacturer/batch',
    label: '📦 Batch Traceability',
    icon: '📦',
    componentKey: 'BatchTraceability',
    permission: 'manufacturer.batch.view',
    apiDependency: '/api/manufacturer/analytics/batch',
  },

  // ─── TRANSPORTER ROUTES ──────────────────────────────────────────────────
  {
    role: 'Transporter',
    path: '/transporter',
    label: '🏠 Dashboard',
    icon: '🏠',
    componentKey: 'TransporterDashboard',
    permission: 'transporter.dashboard.view',
    apiDependency: '/api/tracking/analytics/overview',
  },
  {
    role: 'Transporter',
    path: '/transporter/map',
    label: '📡 Live Map',
    icon: '📡',
    componentKey: 'LiveMap',
    permission: 'transporter.map.view',
    apiDependency: '/api/tracking/shipments',
  },
  {
    role: 'Transporter',
    path: '/transporter/routes',
    label: '🗺️ Route Optimizer',
    icon: '🗺️',
    componentKey: 'RouteOptimizer',
    permission: 'transporter.routes.view',
    apiDependency: '/api/route-optimizer/optimize',
  },
  {
    role: 'Transporter',
    path: '/transporter/fleet',
    label: '🚛 Fleet Management',
    icon: '🚛',
    componentKey: 'FleetManagement',
    permission: 'transporter.fleet.view',
    apiDependency: '/api/tracking/analytics/fleet',
  },
  {
    role: 'Transporter',
    path: '/transporter/logs',
    label: '📋 Driver Logs',
    icon: '📋',
    componentKey: 'DriverLogs',
    permission: 'transporter.logs.view',
    apiDependency: '/api/tracking/drivers',
  },
  {
    role: 'Transporter',
    path: '/transporter/maintenance',
    label: '🔧 Maintenance Alerts',
    icon: '🔧',
    componentKey: 'MaintenanceAlerts',
    permission: 'transporter.maintenance.view',
    apiDependency: '/api/tracking/analytics/drivers',
  },
  {
    role: 'Transporter',
    path: '/transporter/ledger',
    label: '💰 Financial Ledger',
    icon: '💰',
    componentKey: 'TransporterLedger',
    permission: 'transporter.ledger.view',
    apiDependency: '/api/tracking/analytics/overview',
  },
  {
    role: 'Transporter',
    path: '/transporter/alerts',
    label: '🔔 Alert Center',
    icon: '🔔',
    componentKey: 'TransporterAlertCenter',
    permission: 'transporter.alerts.view',
    apiDependency: '/api/notifications/my',
  },
  {
    role: 'Transporter',
    path: '/transporter/disputes',
    label: '⚖️ Dispute Center',
    icon: '⚖️',
    componentKey: 'TransporterDisputeCenter',
    permission: 'transporter.disputes.view',
    apiDependency: '/api/disputes',
  },

  // ─── DEALER ROUTES ───────────────────────────────────────────────────────
  {
    role: 'Dealer',
    path: '/dealer',
    label: '🏠 Dashboard',
    icon: '🏠',
    componentKey: 'DealerDashboard',
    permission: 'dealer.dashboard.view',
    apiDependency: '/api/dealer/analytics/dashboard',
  },
  {
    role: 'Dealer',
    path: '/dealer/inventory',
    label: '🏭 Inventory',
    icon: '🏭',
    componentKey: 'DealerInventory',
    permission: 'dealer.inventory.view',
    apiDependency: '/api/dealer/inventory',
  },
  {
    role: 'Dealer',
    path: '/dealer/pipeline',
    label: '📦 Order Fulfillment',
    icon: '📦',
    componentKey: 'OrderFulfillment',
    permission: 'dealer.orders.manage',
    apiDependency: '/api/dealer/orders/pipeline',
  },
  {
    role: 'Dealer',
    path: '/dealer/network',
    label: '🤝 Partner Network',
    icon: '🤝',
    componentKey: 'PartnerNetwork',
    permission: 'dealer.partners.view',
    apiDependency: '/api/dealer/analytics/partners-detail',
  },
  {
    role: 'Dealer',
    path: '/dealer/ledger',
    label: '💰 Financial Ledger',
    icon: '💰',
    componentKey: 'DealerLedger',
    permission: 'dealer.ledger.view',
    apiDependency: '/api/dealer/analytics/financial-detail',
  },
  {
    role: 'Dealer',
    path: '/dealer/alerts',
    label: '🔔 Alert Center',
    icon: '🔔',
    componentKey: 'DealerAlertCenter',
    permission: 'dealer.alerts.view',
    apiDependency: '/api/dealer/analytics/alerts-detail',
  },
  {
    role: 'Dealer',
    path: '/dealer/disputes',
    label: '⚖️ Dispute Center',
    icon: '⚖️',
    componentKey: 'DealerDisputeCenter',
    permission: 'dealer.disputes.view',
    apiDependency: '/api/dealer/analytics/disputes-detail',
  },
  {
    role: 'Dealer',
    path: '/dealer/batch',
    label: '📦 Batch Traceability',
    icon: '📦',
    componentKey: 'DealerBatchTraceability',
    permission: 'dealer.batch.view',
    apiDependency: '/api/dealer/analytics/batches-detail',
  },

  // ─── RETAIL SHOP ROUTES ──────────────────────────────────────────────────
  {
    role: 'RetailShop',
    path: '/retail',
    label: '🏠 Dashboard',
    icon: '🏠',
    componentKey: 'RetailDashboardOverview',
    permission: 'retail.dashboard.view',
    apiDependency: '/api/retail/analytics/dashboard',
  },
  {
    role: 'RetailShop',
    path: '/retail/inventory',
    label: '🏭 Inventory',
    icon: '🏭',
    componentKey: 'RetailInventoryAnalytics',
    permission: 'retail.inventory.view',
    apiDependency: '/api/retail/inventory',
  },
  {
    role: 'RetailShop',
    path: '/retail/pos',
    label: '🛒 POS Analytics',
    icon: '🛒',
    componentKey: 'RetailSalesPOS',
    permission: 'retail.pos.manage',
    apiDependency: '/api/retail/analytics/sales',
  },
  {
    role: 'RetailShop',
    path: '/retail/qr',
    label: '📱 QR Verification',
    icon: '📱',
    componentKey: 'RetailQRTraceability',
    permission: 'retail.qr.verify',
    apiDependency: '/api/retail/analytics/traceability',
  },
  {
    role: 'RetailShop',
    path: '/retail/reorder',
    label: '🤖 Auto-Reorder',
    icon: '🤖',
    componentKey: 'RetailReplenishmentOrders',
    permission: 'retail.reorder.manage',
    apiDependency: '/api/retail/reorder/recommendations',
  },
  {
    role: 'RetailShop',
    path: '/retail/ledger',
    label: '💰 Financial Ledger',
    icon: '💰',
    componentKey: 'RetailFinancialLedger',
    permission: 'retail.ledger.view',
    apiDependency: '/api/retail/analytics/reports',
  },
  {
    role: 'RetailShop',
    path: '/retail/alerts',
    label: '🔔 Alert Center',
    icon: '🔔',
    componentKey: 'RetailAlertCenter',
    permission: 'retail.alerts.view',
    apiDependency: '/api/retail/analytics/alerts',
  },
  {
    role: 'RetailShop',
    path: '/retail/disputes',
    label: '⚖️ Dispute Center',
    icon: '⚖️',
    componentKey: 'RetailDisputeCenter',
    permission: 'retail.disputes.view',
    apiDependency: '/api/disputes',
  },
  {
    role: 'RetailShop',
    path: '/retail/verify',
    label: '✅ Seal Verification',
    icon: '✅',
    componentKey: 'SealVerificationCenter',
    permission: 'retail.verify.view',
    apiDependency: '/api/waybills',
  },
  {
    role: 'RetailShop',
    path: '/retail/batch',
    label: '📦 Batch Traceability',
    icon: '📦',
    componentKey: 'BatchTraceability',
    permission: 'retail.batch.view',
    apiDependency: '/api/blockchain/transactions',
  },
];

// Helper Lookups
export function getRoutesForRole(role) {
  const norm = normalizeRole(role);
  return CANONICAL_ROUTES.filter((r) => r.role === norm);
}

export function findRoute(role, path) {
  if (!path) return null;
  const norm = normalizeRole(role);
  const cleanPath = String(path).trim().toLowerCase();

  // 1. Exact match for specific role
  const match = CANONICAL_ROUTES.find(
    (r) => r.role === norm && r.path.toLowerCase() === cleanPath
  );
  if (match) return match;

  // 2. Exact match root alias if path is '/'
  if (cleanPath === '/' || cleanPath === '') {
    return CANONICAL_ROUTES.find((r) => r.role === norm);
  }

  return null;
}

export function getDefaultPathForRole(role) {
  const norm = normalizeRole(role);
  const first = CANONICAL_ROUTES.find((r) => r.role === norm);
  return first ? first.path : '/admin';
}

export function getNavLinksForRole(role) {
  return getRoutesForRole(role).map((r) => r.label);
}

export function getPathForRoleLink(role, linkLabel) {
  const norm = normalizeRole(role);
  const match = CANONICAL_ROUTES.find(
    (r) => r.role === norm && r.label === linkLabel
  );
  return match ? match.path : getDefaultPathForRole(role);
}

export function getLinkForRolePath(role, path) {
  const found = findRoute(role, path);
  if (found) return found.label;
  const def = CANONICAL_ROUTES.find((r) => r.role === normalizeRole(role));
  return def ? def.label : '🏠 Dashboard';
}

// Map for backwards compatibility with navConfig exports
export const ROLE_LINKS = {
  Admin: getNavLinksForRole('Admin'),
  Manufacturer: getNavLinksForRole('Manufacturer'),
  Transporter: getNavLinksForRole('Transporter'),
  Dealer: getNavLinksForRole('Dealer'),
  RetailShop: getNavLinksForRole('RetailShop'),
};

export const PATH_BY_ROLE_LINK = {
  Admin: Object.fromEntries(getRoutesForRole('Admin').map((r) => [r.label, r.path])),
  Manufacturer: Object.fromEntries(getRoutesForRole('Manufacturer').map((r) => [r.label, r.path])),
  Transporter: Object.fromEntries(getRoutesForRole('Transporter').map((r) => [r.label, r.path])),
  Dealer: Object.fromEntries(getRoutesForRole('Dealer').map((r) => [r.label, r.path])),
  RetailShop: Object.fromEntries(getRoutesForRole('RetailShop').map((r) => [r.label, r.path])),
};

export const SOCKET_USER_BY_ROLE = {
  Admin: 'admin',
  Manufacturer: 'manufacturer',
  Transporter: 'transporter',
  Dealer: 'dealer',
  RetailShop: 'retail_shop',
};

export const DEFAULT_PATH_BY_ROLE = {
  Admin: '/admin',
  Manufacturer: '/manufacturer',
  Transporter: '/transporter',
  Dealer: '/dealer',
  RetailShop: '/retail',
};
