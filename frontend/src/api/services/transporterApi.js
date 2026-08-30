import apiClient from '../axiosInstance';

export const transporterApi = {
    getTransporterOverview: async () => {
        const response = await apiClient.get('/tracking/overview');
        return response;
    },

    getShipments: async () => {
        const response = await apiClient.get('/tracking/shipments');
        return response;
    },

    getShipment: async (id) => {
        const response = await apiClient.get(`/tracking/shipments/${encodeURIComponent(id)}`);
        return response;
    },

    getFleet: async () => {
        const response = await apiClient.get('/tracking/fleet');
        return response;
    },

    getDrivers: async () => {
        const response = await apiClient.get('/tracking/drivers');
        return response;
    },

    reportIntervention: async (shipmentId, actionType, reason, severity) => {
        const response = await apiClient.post(`/tracking/shipments/${encodeURIComponent(shipmentId)}/interventions`, {
            action_type: actionType,
            reason,
            severity
        });
        return response;
    },

    getInterventions: async () => {
        const response = await apiClient.get('/tracking/interventions');
        return response;
    }
};
