import { useState, useEffect, useCallback } from 'react';
import { apiClient } from './api-client';

export interface Alert {
  id: number;
  projectId: string;
  projectName: string;
  type: 'overdue' | 'budget_limit';
  message: string;
  severity: 'warning' | 'critical';
  details: Record<string, unknown>;
}

export interface AlertsResponse {
  alerts: Alert[];
  count: number;
  timestamp: string;
}

// Fetch alerts
export async function fetchAlerts(): Promise<AlertsResponse> {
  return apiClient<AlertsResponse>('/api/alerts');
}

// Custom hook for polling alerts
export function useAlerts(pollingInterval = 60000) {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const result = await fetchAlerts();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Polling
  useEffect(() => {
    if (pollingInterval <= 0) return;

    const interval = setInterval(refresh, pollingInterval);
    return () => clearInterval(interval);
  }, [refresh, pollingInterval]);

  return {
    alerts: data?.alerts || [],
    count: data?.count || 0,
    loading,
    error,
    refresh,
  };
}

// Alert type labels
export const ALERT_TYPE_LABELS: Record<string, string> = {
  overdue: 'Overdue',
  budget_limit: 'Budget Alert',
};

// Severity colors
export const SEVERITY_COLORS: Record<string, string> = {
  warning: 'text-yellow-600 bg-yellow-50',
  critical: 'text-red-600 bg-red-50',
};
