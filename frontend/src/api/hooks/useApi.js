import { useState, useEffect } from 'react';
import api from '../axiosInstance';

// Enforces UI state machine: Loading -> Success -> Empty -> Error
export function useApi(endpoint, dependencies = []) {
    const [state, setState] = useState({
        data: null,
        loading: true,
        error: null,
        isEmpty: false
    });

    const fetchData = async () => {
        setState({ data: null, loading: true, error: null, isEmpty: false });
        try {
            const response = await api.get(endpoint);
            // axiosInstance already unpacks the response, so response is the payload directly
            const responseData = response?.data ?? response;
            
            // Determine if empty (null, empty array, or empty object)
            const isDataEmpty = 
                responseData === null || 
                responseData === undefined ||
                (Array.isArray(responseData) && responseData.length === 0) ||
                (typeof responseData === 'object' && Object.keys(responseData).length === 0);

            setState({
                data: responseData,
                loading: false,
                error: null,
                isEmpty: isDataEmpty
            });
        } catch (error) {
            setState({
                data: null,
                loading: false,
                error: error.message || 'An error occurred',
                isEmpty: false
            });
        }
    };

    useEffect(() => {
        fetchData();
    }, dependencies);

    return { ...state, refetch: fetchData };
}
