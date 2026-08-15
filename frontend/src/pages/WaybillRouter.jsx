import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';

import { ControlTower, SupplyChainDepth, SupplierRisk, ActivityLog, AdminLedger } from '../components/dashboard/AdminFeatures';
import { UserManagement } from '../components/dashboard/UserManagement';
import { AdminSettings } from '../components/dashboard/AdminSettings';
import { ManufacturerDashboard, Production, AIForecast, RawMaterialSourcing, QualityAssurance, ManufacturerLedger } from '../components/dashboard/ManufacturerFeatures';
import { AlertCenter } from '../components/dashboard/AlertCenter';
import { DisputeCenter } from '../components/dashboard/DisputeCenter';
import { BatchTraceability } from '../components/dashboard/BatchTraceability';
import { TransporterDashboard, LiveMap, RouteOptimizer, FleetManagement, DriverLogs, MaintenanceAlerts } from '../components/dashboard/TransporterFeatures';
import { DealerDashboard, Inventory, OrderFulfillment, PartnerNetwork } from '../components/dashboard/DealerFeatures';
import { RetailDashboard, RetailInventory, POSAnalytics, QRVerification, AutoReorder } from '../components/dashboard/RetailFeatures';
import { TraceabilityDashboard } from '../components/dashboard/TraceabilityFeatures';

const DefaultDashboardView = ({ role }) => (
    <div className="card">
        <h2 className="card-title">{role} Dashboard Overview</h2>
        <p className="muted">Select a feature from the sidebar to view detailed analytics and controls.</p>
    </div>
);

export default function WaybillRouter({ user, role, isGuest, onLogout, onNavigate, currentPath }) {
    let content = <DefaultDashboardView role={role} />;

    if (role === 'admin' || role === 'Admin') {
        if (currentPath.includes('depth')) content = <SupplyChainDepth />;
        else if (currentPath.includes('risk')) content = <SupplierRisk />;
        else if (currentPath.includes('activity')) content = <ActivityLog />;
        else if (currentPath.includes('ledger')) content = <AdminLedger />;
        else if (currentPath.includes('users')) content = <UserManagement />;
        else if (currentPath.includes('settings')) content = <AdminSettings />;
        else content = <ControlTower />;
    }
    else if (role === 'manufacturer' || role === 'Manufacturer') {
        if (currentPath.includes('production')) content = <Production />;
        else if (currentPath.includes('forecast')) content = <AIForecast />;
        else if (currentPath.includes('sourcing')) content = <RawMaterialSourcing />;
        else if (currentPath.includes('assurance')) content = <QualityAssurance />;
        else if (currentPath.includes('ledger')) content = <ManufacturerLedger />;
        else if (currentPath.includes('alerts')) content = <AlertCenter />;
        else if (currentPath.includes('disputes')) content = <DisputeCenter />;
        else if (currentPath.includes('batch')) content = <BatchTraceability />;
        else content = <ManufacturerDashboard />;
    }
    else if (role === 'transporter' || role === 'Transporter') {
        if (currentPath.includes('routes')) content = <RouteOptimizer />;
        else if (currentPath.includes('map')) content = <LiveMap />;
        else if (currentPath.includes('fleet')) content = <FleetManagement />;
        else if (currentPath.includes('logs')) content = <DriverLogs />;
        else if (currentPath.includes('maintenance')) content = <MaintenanceAlerts />;
        else if (currentPath.includes('ledger') || currentPath === '/transporter') content = <TransporterDashboard />;
    }
    else if (role === 'dealer' || role === 'Dealer') {
        if (currentPath.includes('inventory')) content = <Inventory />;
        else if (currentPath.includes('pipeline')) content = <OrderFulfillment />;
        else if (currentPath.includes('network')) content = <PartnerNetwork />;
        else if (currentPath.includes('ledger') || currentPath === '/dealer') content = <DealerDashboard />;
    }
    else if (role === 'retail_shop' || role === 'RetailShop') {
        if (currentPath.includes('inventory')) content = <RetailInventory />;
        else if (currentPath.includes('pos')) content = <POSAnalytics />;
        else if (currentPath.includes('reorder')) content = <AutoReorder />;
        else if (currentPath.includes('qr')) content = <QRVerification />;
        else if (currentPath.includes('ledger') || currentPath === '/retail') content = <RetailDashboard />;
    }
    else if (role === 'Traceability') {
        content = <TraceabilityDashboard />;
    }

    return (
        <DashboardLayout role={role} userName={user?.name} onLogout={onLogout} onNavigate={onNavigate} currentPath={currentPath}>
            {content}
        </DashboardLayout>
    );
}

