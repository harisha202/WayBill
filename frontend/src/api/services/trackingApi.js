import apiClient from '../axiosInstance';

export const trackingApi = {
    sendGpsPing: async (shipmentId, lat, lng, speed = 0, heading = 0) => {
        const response = await apiClient.post('/tracking/gps', {
            shipment_id: shipmentId,
            latitude: lat,
            longitude: lng,
            speed: speed,
            heading: heading
        });
        return response.data;
    }
};
