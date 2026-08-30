import apiClient from '../axiosInstance';

export const dealerApi = {
    // ─── Existing CRUD ───────────────────────────────────────────────────────
    getInventory: async () => {
        const response = await apiClient.get('/dealer/inventory');
        return response;
    },

    getPipelineOrders: async () => {
        const response = await apiClient.get('/dealer/orders/pipeline');
        return response;
    },

    getRecentOrders: async () => {
        const response = await apiClient.get('/dealer/orders/recent');
        return response;
    },

    getAnalytics: async () => {
        const response = await apiClient.get('/dealer/analytics');
        return response;
    },

    receiveShipment: async (orderCode, receivedQuantity) => {
        const response = await apiClient.patch(`/dealer/orders/${orderCode}/receive`, {
            received_quantity: receivedQuantity
        });
        return response;
    },

    confirmRetailOrder: async (orderCode) => {
        const response = await apiClient.patch(`/dealer/orders/${orderCode}/confirm`);
        return response;
    },

    forwardOrderToManufacturer: async (orderCode, manufacturerId) => {
        const response = await apiClient.patch(`/dealer/orders/${orderCode}/dealer-order`, {
            manufacturer_id: manufacturerId
        });
        return response;
    },

    // ─── Analytics Endpoints ──────────────────────────────────────────────────
    getDashboardAnalytics: async (days = 30) => {
        const response = await apiClient.get(`/dealer/analytics/dashboard?days=${days}`);
        return response;
    },

    getInventoryAnalytics: async (days = 30) => {
        const response = await apiClient.get(`/dealer/analytics/inventory-detail?days=${days}`);
        return response;
    },

    getFulfillmentAnalytics: async (days = 30) => {
        const response = await apiClient.get(`/dealer/analytics/fulfillment-detail?days=${days}`);
        return response;
    },

    getPartnerAnalytics: async () => {
        const response = await apiClient.get('/dealer/analytics/partners-detail');
        return response;
    },

    getFinancialAnalytics: async (days = 90) => {
        const response = await apiClient.get(`/dealer/analytics/financial-detail?days=${days}`);
        return response;
    },

    getAlertsAnalytics: async () => {
        const response = await apiClient.get('/dealer/analytics/alerts-detail');
        return response;
    },

    getDisputesAnalytics: async () => {
        const response = await apiClient.get('/dealer/analytics/disputes-detail');
        return response;
    },

    getBatchAnalytics: async () => {
        const response = await apiClient.get('/dealer/analytics/batches-detail');
        return response;
    },
};
