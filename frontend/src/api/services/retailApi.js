import apiClient from '../axiosInstance';

export const retailApi = {
    getInventory: async () => {
        const response = await apiClient.get('/retail/inventory');
        return response;
    },

    createSale: async (sku, quantity) => {
        const response = await apiClient.post('/retail/sales', {
            sku,
            quantity
        });
        return response;
    },

    getStockMovements: async (sku = null) => {
        const url = sku ? `/retail/stock-movements?sku=${encodeURIComponent(sku)}` : '/retail/stock-movements';
        const response = await apiClient.get(url);
        return response;
    },

    getReorderRecommendations: async () => {
        const response = await apiClient.get('/retail/reorder/recommendations');
        return response;
    },

    approveReorder: async (sku, quantity) => {
        const response = await apiClient.post('/retail/reorder/approve', {
            sku,
            quantity
        });
        return response;
    },

    rejectReorder: async (sku, reason = 'Retailer rejected reorder recommendation') => {
        const response = await apiClient.post('/retail/reorder/reject', {
            sku,
            reason
        });
        return response;
    },

    getAnalyticsDashboard: async (days = 30) => {
        const response = await apiClient.get(`/retail/analytics/dashboard?days=${days}`);
        return response;
    },

    getAnalyticsSales: async (days = 180) => {
        const response = await apiClient.get(`/retail/analytics/sales?days=${days}`);
        return response;
    },

    getAnalyticsInventoryDetail: async (days = 30) => {
        const response = await apiClient.get(`/retail/analytics/inventory-detail?days=${days}`);
        return response;
    },

    getAnalyticsReplenishment: async (days = 90) => {
        const response = await apiClient.get(`/retail/analytics/replenishment?days=${days}`);
        return response;
    },

    getAnalyticsWaybills: async (days = 90) => {
        const response = await apiClient.get(`/retail/analytics/waybills?days=${days}`);
        return response;
    },

    getAnalyticsTraceability: async () => {
        const response = await apiClient.get('/retail/analytics/traceability');
        return response;
    },

    getAnalyticsReceiving: async (days = 90) => {
        const response = await apiClient.get(`/retail/analytics/receiving?days=${days}`);
        return response;
    },

    getAnalyticsAlerts: async (days = 30) => {
        const response = await apiClient.get(`/retail/analytics/alerts?days=${days}`);
        return response;
    },

    getAnalyticsReports: async (days = 180) => {
        const response = await apiClient.get(`/retail/analytics/reports?days=${days}`);
        return response;
    },

    verifyWaybillTrust: async (waybillId) => {
        const response = await apiClient.get(`/waybills/${waybillId}/verify`);
        return response;
    }
};
