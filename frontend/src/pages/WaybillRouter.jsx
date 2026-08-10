import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';

import { ControlTower, SupplyChainDepth, SupplierRisk, ActivityLog, AdminLedger } from '../components/dashboard/AdminFeatures';
import { ManufacturerDashboard, Production, AIForecast, RawMaterialSourcing, QualityAssurance, ManufacturerLedger } from '../components/dashboard/ManufacturerFeatures';
import { TransporterDashboard, LiveMap, RouteOptimizer, FleetManagement, DriverLogs, MaintenanceAlerts } from '../components/dashboard/TransporterFeatures';
import { DealerDashboard, Inventory, OrderFulfillment, PartnerNetwork } from '../components/dashboard/DealerFeatures';
import { RetailDashboard, RetailInventory, POSAnalytics, QRVerification, AutoReorder } from '../components/dashboard/RetailFeatures';

const DefaultDashboardView = ({ role }) => (
    <div className="card">
        <h2 className="card-title">{role} Dashboard Overview</h2>
        <p className="muted">Select a feature from the sidebar to view detailed analytics and controls.</p>
    </div>
);

export default function WaybillRouter({ user, role, isGuest, onLogout, onNavigate, currentPath }) {
    let content = <DefaultDashboardView role={role} />;

    if (role === 'Admin') {
        if (currentPath.includes('depth')) content = <SupplyChainDepth />;
        else if (currentPath.includes('risk')) content = <SupplierRisk />;
        else if (currentPath.includes('activity')) content = <ActivityLog />;
        else if (currentPath.includes('ledger')) content = <AdminLedger />;
        else if (currentPath.includes('tower') || currentPath === '/admin') content = <ControlTower />;
    }
    else if (role === 'Manufacturer') {
        if (currentPath.includes('production')) content = <Production />;
        else if (currentPath.includes('forecast')) content = <AIForecast />;
        else if (currentPath.includes('sourcing')) content = <RawMaterialSourcing />;
        else if (currentPath.includes('assurance')) content = <QualityAssurance />;
        else if (currentPath.includes('ledger')) content = <ManufacturerLedger />;
        else if (currentPath === '/manufacturer') content = <ManufacturerDashboard />;
    }
    else if (role === 'Transporter') {
        if (currentPath.includes('routes')) content = <RouteOptimizer />;
        else if (currentPath.includes('map')) content = <LiveMap />;
        else if (currentPath.includes('fleet')) content = <FleetManagement />;
        else if (currentPath.includes('logs')) content = <DriverLogs />;
        else if (currentPath.includes('maintenance')) content = <MaintenanceAlerts />;
        else if (currentPath.includes('ledger') || currentPath === '/transporter') content = <TransporterDashboard />;
    }
    else if (role === 'Dealer') {
        if (currentPath.includes('inventory')) content = <Inventory />;
        else if (currentPath.includes('pipeline')) content = <OrderFulfillment />;
        else if (currentPath.includes('network')) content = <PartnerNetwork />;
        else if (currentPath.includes('ledger') || currentPath === '/dealer') content = <DealerDashboard />;
    }
    else if (role === 'RetailShop') {
        if (currentPath.includes('inventory')) content = <RetailInventory />;
        else if (currentPath.includes('pos')) content = <POSAnalytics />;
        else if (currentPath.includes('reorder')) content = <AutoReorder />;
        else if (currentPath.includes('qr')) content = <QRVerification />;
        else if (currentPath.includes('ledger') || currentPath === '/retail') content = <RetailDashboard />;
    }

    return (
        <DashboardLayout role={role} userName={user?.name} onLogout={onLogout} onNavigate={onNavigate} currentPath={currentPath}>
            {content}
        </DashboardLayout>
    );
}

