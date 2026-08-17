import apiClient from '../axiosInstance';

export const dealerApi = {
    // ─── Existing CRUD ───────────────────────────────────────────────────────
    getInventory: async () => {
        const response = await apiClient.get('/dealer/inventory');
        return response.data;
    },

    getPipelineOrders: async () => {
        const response = await apiClient.get('/dealer/orders/pipeline');
        return response.data;
    },

    getRecentOrders: async () => {
        const response = await apiClient.get('/dealer/orders/recent');
        return response.data;
    },

    getAnalytics: async () => {
        const response = await apiClient.get('/dealer/analytics');
        return response.data;
    },

    receiveShipment: async (orderCode, receivedQuantity) => {
        const response = await apiClient.patch(`/dealer/orders/${orderCode}/receive`, {
            received_quantity: receivedQuantity
        });
        return response.data;
    },

    confirmRetailOrder: async (orderCode) => {
        const response = await apiClient.patch(`/dealer/orders/${orderCode}/confirm`);
        return response.data;
    },

    forwardOrderToManufacturer: async (orderCode, manufacturerId) => {
        const response = await apiClient.patch(`/dealer/orders/${orderCode}/dealer-order`, {
            manufacturer_id: manufacturerId
        });
        return response.data;
    },

    // ─── Analytics Endpoints ──────────────────────────────────────────────────
    getDashboardAnalytics: async (days = 30) => {
        const response = await apiClient.get(`/dealer/analytics/dashboard?days=${days}`);
        return response.data;
    },

    getInventoryAnalytics: async (days = 30) => {
        const response = await apiClient.get(`/dealer/analytics/inventory-detail?days=${days}`);
        return response.data;
    },

    getFulfillmentAnalytics: async (days = 30) => {
        const response = await apiClient.get(`/dealer/analytics/fulfillment-detail?days=${days}`);
        return response.data;
    },

    getPartnerAnalytics: async () => {
        const response = await apiClient.get('/dealer/analytics/partners-detail');
        return response.data;
    },

    getFinancialAnalytics: async (days = 90) => {
        const response = await apiClient.get(`/dealer/analytics/financial-detail?days=${days}`);
        return response.data;
    },

    getAlertsAnalytics: async () => {
        const response = await apiClient.get('/dealer/analytics/alerts-detail');
        return response.data;
    },

    getDisputesAnalytics: async () => {
        const response = await apiClient.get('/dealer/analytics/disputes-detail');
        return response.data;
    },

    getBatchAnalytics: async () => {
        const response = await apiClient.get('/dealer/analytics/batches-detail');
        return response.data;
    },
};
