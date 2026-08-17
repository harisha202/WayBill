import apiClient from '../axiosInstance';

export const retailApi = {
    getInventory: async () => {
        const response = await apiClient.get('/retail/inventory');
        return response.data;
    },

    createSale: async (sku, quantity) => {
        const response = await apiClient.post('/retail/sales', {
            sku,
            quantity
        });
        return response.data;
    },

    getStockMovements: async (sku = null) => {
        const url = sku ? `/retail/stock-movements?sku=${encodeURIComponent(sku)}` : '/retail/stock-movements';
        const response = await apiClient.get(url);
        return response.data;
    },

    getReorderRecommendations: async () => {
        const response = await apiClient.get('/retail/reorder/recommendations');
        return response.data;
    },

    approveReorder: async (sku, quantity) => {
        const response = await apiClient.post('/retail/reorder/approve', {
            sku,
            quantity
        });
        return response.data;
    },

    getAnalyticsDashboard: async (days = 30) => {
        const response = await apiClient.get(`/retail/analytics/dashboard?days=${days}`);
        return response.data;
    },

    getAnalyticsSales: async (days = 180) => {
        const response = await apiClient.get(`/retail/analytics/sales?days=${days}`);
        return response.data;
    },

    getAnalyticsInventoryDetail: async (days = 30) => {
        const response = await apiClient.get(`/retail/analytics/inventory-detail?days=${days}`);
        return response.data;
    },

    getAnalyticsReplenishment: async (days = 90) => {
        const response = await apiClient.get(`/retail/analytics/replenishment?days=${days}`);
        return response.data;
    },

    getAnalyticsWaybills: async (days = 90) => {
        const response = await apiClient.get(`/retail/analytics/waybills?days=${days}`);
        return response.data;
    },

    getAnalyticsTraceability: async () => {
        const response = await apiClient.get('/retail/analytics/traceability');
        return response.data;
    },

    getAnalyticsReceiving: async (days = 90) => {
        const response = await apiClient.get(`/retail/analytics/receiving?days=${days}`);
        return response.data;
    },

    getAnalyticsAlerts: async (days = 30) => {
        const response = await apiClient.get(`/retail/analytics/alerts?days=${days}`);
        return response.data;
    },

    getAnalyticsReports: async (days = 180) => {
        const response = await apiClient.get(`/retail/analytics/reports?days=${days}`);
        return response.data;
    },

    verifyWaybillTrust: async (waybillId) => {
        const response = await apiClient.get(`/waybills/${waybillId}/verify`);
        return response.data;
    }
};
