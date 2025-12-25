import { useState, useEffect, useCallback } from 'react';
import { Stats } from '../types';
import { API_ENDPOINTS } from '../constants/api';

// Simple logger for client-side hooks
const hookLogger = {
  error: (component: string, message: string, error?: any) => {
    console.error(`[${component}] ${message}`, error || '');
  }
};

export function useStats() {
  const [stats, setStats] = useState<Stats>({});

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.STATS);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      hookLogger.error('STATS', 'Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    // Load once on mount
    loadStats();
  }, [loadStats]);

  return { stats, refreshStats: loadStats };
}
