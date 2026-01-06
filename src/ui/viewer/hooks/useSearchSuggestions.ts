import { useState, useCallback, useEffect, useRef } from 'react';
import { API_ENDPOINTS } from '../constants/api';
import { uiLogger } from '../utils/ui-logger';
import type { ContentTag } from './useTags';

interface SafeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getSafeStorage(): SafeStorage | null {
  if (typeof window === 'undefined') return null;
  try {
    return {
      getItem: (key: string) => window.localStorage.getItem(key),
      setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
      removeItem: (key: string) => window.localStorage.removeItem(key)
    };
  } catch {
    return null;
  }
}

export interface SearchSuggestion {
  text: string;
  type: 'history' | 'popular' | 'tag' | 'file' | 'type';
  count?: number;
}

export interface UseSearchSuggestionsReturn {
  suggestions: SearchSuggestion[];
  isLoading: boolean;
  query: string;
  setQuery: (query: string) => void;
  getSuggestions: (input: string) => Promise<void>;
  clearSuggestions: () => void;
  addToHistory: (query: string) => void;
}

const SEARCH_HISTORY_KEY = 'mem-claude-search-history';
const MAX_HISTORY = 10;

export function useSearchSuggestions(): UseSearchSuggestionsReturn {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const historyRef = useRef<string[]>([]);
  const storageRef = useRef<SafeStorage | null>(null);

  useEffect(() => {
    storageRef.current = getSafeStorage();
    if (storageRef.current) {
      const saved = storageRef.current.getItem(SEARCH_HISTORY_KEY);
      if (saved) {
        try {
          historyRef.current = JSON.parse(saved);
        } catch {
          historyRef.current = [];
        }
      }
    }
  }, []);

  const saveHistory = useCallback(() => {
    if (storageRef.current) {
      try {
        storageRef.current.setItem(SEARCH_HISTORY_KEY, JSON.stringify(historyRef.current.slice(0, MAX_HISTORY)));
      } catch {
        // Ignore
      }
    }
  }, []);

  const getSuggestions = useCallback(async (input: string) => {
    setQuery(input);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!input.trim()) {
      const history = historyRef.current.slice(0, 5).map(q => ({ text: q, type: 'history' as const }));
      setSuggestions(history);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results: SearchSuggestion[] = [];

        if (input.length >= 2) {
          const tagResults = await fetch(`${API_ENDPOINTS.TAGS_SEARCH}?query=${encodeURIComponent(input)}&limit=3`)
            .then(r => r.json().catch(() => [])) as ContentTag[];

          for (const tag of tagResults.slice(0, 3)) {
            results.push({ text: tag.tag_name, type: 'tag', count: tag.usage_count });
          }

          const popularTypes = ['decision', 'bugfix', 'feature', 'refactor', 'discovery'];
          for (const type of popularTypes) {
            if (type.includes(input.toLowerCase())) {
              results.push({ text: `type:${type}`, type: 'type' });
            }
          }
        }

        const history = historyRef.current.filter(h =>
          h.toLowerCase().includes(input.toLowerCase())
        ).slice(0, 3).map(q => ({ text: q, type: 'history' as const }));

        setSuggestions([...history, ...results].slice(0, 8));
      } catch (err) {
        uiLogger.error('SEARCH', 'Failed to get suggestions:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);
  }, []);

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setQuery('');
  }, []);

  const addToHistory = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    const cleaned = searchQuery.trim().toLowerCase();
    const exists = historyRef.current.find(h => h.toLowerCase() === cleaned);
    if (exists) {
      historyRef.current = [exists, ...historyRef.current.filter(h => h.toLowerCase() !== cleaned)];
    } else {
      historyRef.current = [searchQuery.trim(), ...historyRef.current];
    }

    saveHistory();
  }, [saveHistory]);

  return {
    suggestions,
    isLoading,
    query,
    setQuery,
    getSuggestions,
    clearSuggestions,
    addToHistory
  };
}
