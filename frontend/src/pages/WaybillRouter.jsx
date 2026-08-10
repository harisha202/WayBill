import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';

import { SupplyChainDepth, SupplierRisk, BlockchainMonitor, ControlTower, GlobalCompliance } from '../components/dashboard/AdminFeatures';
import { ProductionControls, AIForecastChart, RawMaterialSourcing, QualityAssurance } from '../components/dashboard/ManufacturerFeatures';
import { RouteOptimizer, LiveMapOverlay, FleetManagement, DriverLogs, MaintenanceAlerts } from '../components/dashboard/TransporterFeatures';
import { InventoryManagement } from '../components/dashboard/InventoryFeatures';
import { OrderFulfillmentPipeline, PartnerNetwork } from '../components/dashboard/DealerFeatures';
import { POSAnalytics, AutoReorderUI, QRScanner, LedgerVerificationRate } from '../components/dashboard/RetailFeatures';

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
        else if (currentPath.includes('activity')) content = <BlockchainMonitor />;
        else if (currentPath.includes('compliance')) content = <GlobalCompliance />;
        else if (currentPath.includes('tower') || currentPath === '/admin') content = <ControlTower />;
    }
    else if (role === 'Manufacturer') {
        if (currentPath.includes('production')) content = <ProductionControls />;
        else if (currentPath.includes('forecast')) content = <AIForecastChart />;
        else if (currentPath.includes('sourcing')) content = <RawMaterialSourcing />;
        else if (currentPath.includes('assurance')) content = <QualityAssurance />;
    }
    else if (role === 'Transporter') {
        if (currentPath.includes('routes')) content = <RouteOptimizer />;
        else if (currentPath.includes('map')) content = <LiveMapOverlay />;
        else if (currentPath.includes('fleet')) content = <FleetManagement />;
        else if (currentPath.includes('logs')) content = <DriverLogs />;
        else if (currentPath.includes('maintenance')) content = <MaintenanceAlerts />;
        else if (currentPath === '/transporter') content = <LiveMapOverlay />;
    }
    else if (role === 'Dealer') {
        if (currentPath.includes('inventory')) content = <InventoryManagement />;
        else if (currentPath.includes('pipeline')) content = <OrderFulfillmentPipeline />;
        else if (currentPath.includes('network')) content = <PartnerNetwork />;
    }
    else if (role === 'RetailShop') {
        if (currentPath.includes('inventory')) content = <InventoryManagement />;
        else if (currentPath.includes('pos')) content = <POSAnalytics />;
        else if (currentPath.includes('reorder')) content = <AutoReorderUI />;
        else if (currentPath.includes('qr')) content = (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <QRScanner />
                <LedgerVerificationRate />
            </div>
        );
    }

    return (
        <DashboardLayout role={role} userName={user?.name} onLogout={onLogout} onNavigate={onNavigate} currentPath={currentPath}>
            {content}
        </DashboardLayout>
    );
}
