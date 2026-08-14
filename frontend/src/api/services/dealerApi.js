import apiClient from '../axiosInstance';

export const dealerApi = {
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
    }
};
