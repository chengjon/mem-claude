import { useState, useEffect, useCallback } from 'react';
import { Stats } from '../types';
import { API_ENDPOINTS } from '../constants/api';
import { logError } from '../utils/hook-logger';

export function useStats() {
  const [stats, setStats] = useState<Stats>({});

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.STATS);
      const data = (await response.json()) as Stats;
      setStats(data);
    } catch (error) {
      logError('STATS', 'Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    // Load once on mount
    loadStats();
  }, [loadStats]);

  return { stats, refreshStats: loadStats };
}
