import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { findRoute, normalizeRole, getDefaultPathForRole } from '../config/routes';
import { useRootKpiStats } from '../api/hooks/useRootKpiStats';

// Admin feature components
import { ControlTower, SupplyChainDepth, SupplierRisk, ActivityLog, AdminLedger } from '../components/dashboard/AdminFeatures';
import { UserManagement } from '../components/dashboard/UserManagement';
import { AdminSettings } from '../components/dashboard/AdminSettings';
import { AdminAlertCenter } from '../components/dashboard/AdminAlertCenter';
import { AdminDisputeCenter } from '../components/dashboard/AdminDisputeCenter';

// Manufacturer feature components
import { ManufacturerDashboard, Production, AIForecast, RawMaterialSourcing, QualityAssurance, ManufacturerLedger } from '../components/dashboard/ManufacturerFeatures';
import { AlertCenter } from '../components/dashboard/AlertCenter';
import { DisputeCenter } from '../components/dashboard/DisputeCenter';
import { BatchTraceability } from '../components/dashboard/BatchTraceability';

// Transporter feature components
import { TransporterDashboard, LiveMap, RouteOptimizer, FleetManagement, DriverLogs, MaintenanceAlerts } from '../components/dashboard/TransporterFeatures';
import { TransporterLedger } from '../components/dashboard/TransporterLedger';

// Dealer feature components
import { DealerDashboard, Inventory as DealerInventory, OrderFulfillment, PartnerNetwork, DealerLedger, DealerAlertCenter, DealerDisputeCenter, DealerBatchTraceability } from '../components/dashboard/DealerFeatures';

// Retail feature components
import { 
    RetailDashboardOverview, 
    RetailSalesPOS, 
    RetailInventoryAnalytics, 
    RetailReplenishmentOrders, 
    RetailQRTraceability, 
    RetailAlertCenter, 
} from '../components/dashboard/RetailFeatures';
import { RetailFinancialLedger } from '../components/dashboard/RetailFinancialLedger';
import { RetailDisputeCenter } from '../components/dashboard/RetailDisputeCenter';

// Shared verification & traceability components
import { TraceabilityDashboard } from '../components/dashboard/TraceabilityFeatures';
import SealVerificationCenter from '../components/dashboard/SealVerificationCenter';

const COMPONENT_MAP = {
  // Admin
  ControlTower: ControlTower,
  UserManagement: UserManagement,
  SupplyChainDepth: SupplyChainDepth,
  SupplierRisk: SupplierRisk,
  ActivityLog: ActivityLog,
  AdminLedger: AdminLedger,
  AdminAlertCenter: AdminAlertCenter,
  AdminDisputeCenter: AdminDisputeCenter,
  AdminSettings: AdminSettings,

  // Manufacturer
  ManufacturerDashboard: ManufacturerDashboard,
  Production: Production,
  AIForecast: AIForecast,
  RawMaterialSourcing: RawMaterialSourcing,
  QualityAssurance: QualityAssurance,
  ManufacturerLedger: ManufacturerLedger,
  AlertCenter: AlertCenter,
  DisputeCenter: DisputeCenter,

  // Transporter
  TransporterDashboard: TransporterDashboard,
  LiveMap: LiveMap,
  RouteOptimizer: RouteOptimizer,
  FleetManagement: FleetManagement,
  DriverLogs: DriverLogs,
  MaintenanceAlerts: MaintenanceAlerts,
  TransporterLedger: TransporterLedger,
  TransporterAlertCenter: AdminAlertCenter,
  TransporterDisputeCenter: AdminDisputeCenter,

  // Dealer
  DealerDashboard: DealerDashboard,
  DealerInventory: DealerInventory,
  OrderFulfillment: OrderFulfillment,
  PartnerNetwork: PartnerNetwork,
  DealerLedger: DealerLedger,
  DealerAlertCenter: DealerAlertCenter,
  DealerDisputeCenter: DealerDisputeCenter,
  DealerBatchTraceability: DealerBatchTraceability,

  // Retail
  RetailDashboardOverview: RetailDashboardOverview,
  RetailInventoryAnalytics: RetailInventoryAnalytics,
  RetailSalesPOS: RetailSalesPOS,
  RetailQRTraceability: RetailQRTraceability,
  RetailReplenishmentOrders: RetailReplenishmentOrders,
  RetailFinancialLedger: RetailFinancialLedger,
  RetailAlertCenter: RetailAlertCenter,
  RetailDisputeCenter: RetailDisputeCenter,

  // Shared
  SealVerificationCenter: SealVerificationCenter,
  BatchTraceability: BatchTraceability,
  TraceabilityDashboard: TraceabilityDashboard,
};

const DefaultDashboardView = ({ role }) => (
    <div className="card">
        <h2 className="card-title">{role} Dashboard Overview</h2>
        <p className="muted">Select a feature from the navigation sidebar to view detailed controls.</p>
    </div>
);

export default function WaybillRouter({ user, role, isGuest, onLogout, onNavigate, currentPath }) {
    const normalizedRole = normalizeRole(role);
    const normalizedPath = String(currentPath || '').trim().toLowerCase();

    // Check if on root overview tab
    const isRootOverview = (
        normalizedPath === '/admin' || 
        normalizedPath === '/manufacturer' || 
        normalizedPath === '/transporter' || 
        normalizedPath === '/dealer' || 
        normalizedPath === '/retail' || 
        normalizedPath === '' || 
        normalizedPath === '/'
    );

    // Exact Canonical Route Resolution (Fix 2 & Fix 4)
    const matchedRoute = findRoute(normalizedRole, currentPath);

    let content = null;
    if (matchedRoute && COMPONENT_MAP[matchedRoute.componentKey]) {
        const ResolvedComponent = COMPONENT_MAP[matchedRoute.componentKey];
        content = <ResolvedComponent />;
    } else {
        // Fallback to role root component if route is unrecognized
        const defaultRoute = findRoute(normalizedRole, getDefaultPathForRole(normalizedRole));
        if (defaultRoute && COMPONENT_MAP[defaultRoute.componentKey]) {
            const FallbackComponent = COMPONENT_MAP[defaultRoute.componentKey];
            content = <FallbackComponent />;
        } else {
            content = <DefaultDashboardView role={role} />;
        }
    }

    // Dynamic Live Root KPIs (Fix 1: Zero hardcoding, real database metrics)
    const { stats: dynamicStats } = useRootKpiStats(normalizedRole, isRootOverview);

    return (
        <DashboardLayout 
            role={normalizedRole} 
            userName={user?.name} 
            onLogout={onLogout} 
            onNavigate={onNavigate} 
            currentPath={currentPath}
            stats={dynamicStats}
        >
            {content}
        </DashboardLayout>
    );
}
