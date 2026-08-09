import React from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';

import { SupplyChainDepth, SupplierRisk, ActivityLog } from '../components/dashboard/AdminFeatures';
import { ProductionControls, AIForecastChart } from '../components/dashboard/ManufacturerFeatures';
import { RouteOptimizer, LiveMapOverlay } from '../components/dashboard/TransporterFeatures';
import { InventoryManagement } from '../components/dashboard/InventoryFeatures';

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
        else if (currentPath.includes('tower')) content = <DefaultDashboardView role="Control Tower" />;
    }
    else if (role === 'Manufacturer') {
        if (currentPath.includes('production')) content = <ProductionControls />;
        else if (currentPath.includes('forecast')) content = <AIForecastChart />;
    }
    else if (role === 'Transporter') {
        if (currentPath.includes('routes')) content = <RouteOptimizer />;
        else if (currentPath.includes('map')) content = <LiveMapOverlay />;
    }
    else if (role === 'Dealer' || role === 'RetailShop') {
        if (currentPath.includes('inventory')) content = <InventoryManagement />;
    }

    return (
        <DashboardLayout role={role} userName={user?.name} onLogout={onLogout} onNavigate={onNavigate} currentPath={currentPath}>
            {content}
        </DashboardLayout>
    );
}
