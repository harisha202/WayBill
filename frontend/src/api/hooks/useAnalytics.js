import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../axiosInstance';

/**
 * useAnalytics - Shared filter-aware analytics hook.
 * All charts in a tab receive the same data object from one backend call.
 */
export function useAnalytics(endpoint, filters = {}, dependencies = []) {
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null,
    isEmpty: false
  });
  const abortRef = useRef(null);

  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.set('date_from', filters.dateFrom);
    if (filters.dateTo) params.set('date_to', filters.dateTo);
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.entityType && filters.entityType !== 'all') params.set('entity_type', filters.entityType);
    if (filters.supplierId) params.set('supplier_id', filters.supplierId);
    if (filters.sku) params.set('sku', filters.sku);
    if (filters.severity) params.set('severity', filters.severity);
    return params.toString();
  }, [filters.dateFrom, filters.dateTo, filters.status, filters.entityType, filters.supplierId, filters.sku, filters.severity]);

  const fetchData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const params = buildParams();
      const url = params ? `${endpoint}?${params}` : endpoint;
      const response = await api.get(url, { signal: controller.signal });
      const responseData = response?.data ?? response;
      const isEmpty =
        responseData === null ||
        responseData === undefined ||
        (Array.isArray(responseData) && responseData.length === 0) ||
        (typeof responseData === 'object' && Object.keys(responseData).length === 0);
      setState({ data: responseData, loading: false, error: null, isEmpty });
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      setState({ data: null, loading: false, error: err.message || 'Failed to load analytics data', isEmpty: false });
    }
  }, [endpoint, buildParams]);

  useEffect(() => {
    fetchData();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [endpoint, filters.dateFrom, filters.dateTo, filters.status, filters.entityType, filters.supplierId, filters.sku, filters.severity, ...dependencies]);

  return { ...state, refetch: fetchData };
}
