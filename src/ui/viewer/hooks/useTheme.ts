import { useState, useEffect } from 'react';
import { useState, useEffect } from 'react';

// Simple logger for client-side hooks
const hookLogger = {
  info: (component: string, message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${component}] ${message}`, data || '');
    }
  },
  error: (component: string, message: string, error?: any) => {
    console.error(`[${component}] ${message}`, error || '');
  }
};

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'claude-mem-theme';

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredPreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'system' || stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch (e) {
    hookLogger.warn('HOOK', 'Failed to read theme preference from localStorage:', e);
  }
  return 'system';
}

function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(getStoredPreference);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
    resolveTheme(getStoredPreference())
  );

  // Update resolved theme when preference changes
  useEffect(() => {
    const newResolvedTheme = resolveTheme(preference);
    setResolvedTheme(newResolvedTheme);
    document.documentElement.setAttribute('data-theme', newResolvedTheme);
  }, [preference]);

  // Listen for system theme changes when preference is 'system'
  useEffect(() => {
    if (preference !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setResolvedTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [preference]);

  const setThemePreference = (newPreference: ThemePreference) => {
    try {
      localStorage.setItem(STORAGE_KEY, newPreference);
      setPreference(newPreference);
    } catch (e) {
      hookLogger.warn('HOOK', 'Failed to save theme preference to localStorage:', e);
      // Still update the theme even if localStorage fails
      setPreference(newPreference);
    }
  };

  return {
    preference,
    resolvedTheme,
    setThemePreference
  };
}
