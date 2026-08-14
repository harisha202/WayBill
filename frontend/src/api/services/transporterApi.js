import apiClient from '../axiosInstance';

export const transporterApi = {
    getTransporterOverview: async () => {
        const response = await apiClient.get('/tracking/overview');
        return response.data;
    },

    getShipments: async () => {
        const response = await apiClient.get('/tracking/shipments');
        return response.data;
    },

    getShipment: async (id) => {
        const response = await apiClient.get(`/tracking/shipments/${encodeURIComponent(id)}`);
        return response.data;
    },

    getFleet: async () => {
        const response = await apiClient.get('/tracking/fleet');
        return response.data;
    },

    getDrivers: async () => {
        const response = await apiClient.get('/tracking/drivers');
        return response.data;
    },

    reportIntervention: async (shipmentId, actionType, reason, severity) => {
        const response = await apiClient.post(`/tracking/shipments/${encodeURIComponent(shipmentId)}/interventions`, {
            action_type: actionType,
            reason,
            severity
        });
        return response.data;
    },

    getInterventions: async () => {
        const response = await apiClient.get('/tracking/interventions');
        return response.data;
    }
};
