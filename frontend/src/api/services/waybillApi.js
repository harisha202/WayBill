import apiClient from '../axiosInstance';

export const waybillApi = {
    getWaybill: async (waybillId) => {
        const response = await apiClient.get(`/waybills/${encodeURIComponent(waybillId)}`);
        return response.data;
    },

    verifyWaybill: async (waybillId, sealHash) => {
        const response = await apiClient.post(`/waybills/${encodeURIComponent(waybillId)}/verify`, {
            seal_hash: sealHash
        });
        return response.data;
    },
    
    receiveWaybill: async (waybillId, receivedQuantity) => {
        const response = await apiClient.post(`/waybills/${encodeURIComponent(waybillId)}/receive`, {
            received_quantity: receivedQuantity
        });
        return response.data;
    }
};
