import apiClient from '../axiosInstance';

export const manufacturerApi = {
    getOverview: async () => {
        const response = await apiClient.get('/manufacturer/overview');
        return response;
    },

    getProductionOrders: async () => {
        const response = await apiClient.get('/manufacturer/orders');
        return response;
    },

    getProductionOrder: async (id) => {
        const response = await apiClient.get(`/manufacturer/orders/${encodeURIComponent(id)}`);
        return response;
    },

    createProductionOrder: async (sku, quantity) => {
        const response = await apiClient.post('/manufacturer/orders', { sku, quantity });
        return response;
    },

    startProduction: async (id) => {
        const response = await apiClient.post(`/manufacturer/orders/${encodeURIComponent(id)}/start`);
        return response;
    },

    completeProduction: async (id) => {
        const response = await apiClient.post(`/manufacturer/orders/${encodeURIComponent(id)}/complete`);
        return response;
    },

    getRawMaterials: async () => {
        const response = await apiClient.get('/manufacturer/inventory');
        return response;
    },

    getQualityRecords: async () => {
        const response = await apiClient.get('/manufacturer/quality');
        return response;
    },

    createQualityInspection: async (orderId, passed, failed, defectType, notes) => {
        const response = await apiClient.post(`/manufacturer/orders/${encodeURIComponent(orderId)}/qa`, {
            passed,
            failed,
            defect_type: defectType,
            notes
        });
        return response;
    },

    getProductionIssues: async () => {
        const response = await apiClient.get('/manufacturer/issues');
        return response;
    },

    reportProductionIssue: async (entityType, entityId, issueType, severity, description) => {
        const response = await apiClient.post('/manufacturer/issues', {
            entity_type: entityType,
            entity_id: entityId,
            issue_type: issueType,
            severity,
            description
        });
        return response;
    },

    getManufacturerWaybills: async () => {
        const response = await apiClient.get('/manufacturer/waybills');
        return response;
    },

    dispatchManufacturedGoods: async (orderId, destination) => {
        const response = await apiClient.post(`/manufacturer/orders/${encodeURIComponent(orderId)}/dispatch`, {
            destination
        });
        return response;
    },

    getDemand: async () => {
        const response = await apiClient.get('/manufacturer/demand');
        return response;
    },

    getSuppliers: async () => {
        const response = await apiClient.get('/manufacturer/suppliers');
        return response;
    }
};
