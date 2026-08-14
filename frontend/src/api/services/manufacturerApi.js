import apiClient from '../axiosInstance';

export const manufacturerApi = {
    getOverview: async () => {
        const response = await apiClient.get('/manufacturer/overview');
        return response.data;
    },

    getProductionOrders: async () => {
        const response = await apiClient.get('/manufacturer/orders');
        return response.data;
    },

    getProductionOrder: async (id) => {
        const response = await apiClient.get(`/manufacturer/orders/${encodeURIComponent(id)}`);
        return response.data;
    },

    createProductionOrder: async (sku, quantity) => {
        const response = await apiClient.post('/manufacturer/orders', { sku, quantity });
        return response.data;
    },

    startProduction: async (id) => {
        const response = await apiClient.post(`/manufacturer/orders/${encodeURIComponent(id)}/start`);
        return response.data;
    },

    completeProduction: async (id) => {
        const response = await apiClient.post(`/manufacturer/orders/${encodeURIComponent(id)}/complete`);
        return response.data;
    },

    getRawMaterials: async () => {
        const response = await apiClient.get('/manufacturer/inventory');
        return response.data;
    },

    getQualityRecords: async () => {
        const response = await apiClient.get('/manufacturer/quality');
        return response.data;
    },

    createQualityInspection: async (orderId, passed, failed, defectType, notes) => {
        const response = await apiClient.post(`/manufacturer/orders/${encodeURIComponent(orderId)}/qa`, {
            passed,
            failed,
            defect_type: defectType,
            notes
        });
        return response.data;
    },

    getProductionIssues: async () => {
        const response = await apiClient.get('/manufacturer/issues');
        return response.data;
    },

    reportProductionIssue: async (entityType, entityId, issueType, severity, description) => {
        const response = await apiClient.post('/manufacturer/issues', {
            entity_type: entityType,
            entity_id: entityId,
            issue_type: issueType,
            severity,
            description
        });
        return response.data;
    },

    getManufacturerWaybills: async () => {
        const response = await apiClient.get('/manufacturer/waybills');
        return response.data;
    },

    dispatchManufacturedGoods: async (orderId, destination) => {
        const response = await apiClient.post(`/manufacturer/orders/${encodeURIComponent(orderId)}/dispatch`, {
            destination
        });
        return response.data;
    },

    getDemand: async () => {
        const response = await apiClient.get('/manufacturer/demand');
        return response.data;
    },

    getSuppliers: async () => {
        const response = await apiClient.get('/manufacturer/suppliers');
        return response.data;
    }
};
