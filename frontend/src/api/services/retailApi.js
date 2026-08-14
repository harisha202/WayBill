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
    }
};
