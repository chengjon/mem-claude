/**
 * useSearchTypes Hook
 *
 * Handles different search types for claude-mem viewer.
 * Provides API calls for the new search functionality with:
 * - Abort controller for race condition prevention
 * - Debouncing for performance
 * - FTS5 injection prevention
 * - Comprehensive error handling
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { Observation, Summary, UserPrompt } from '../types';
import { API_CONFIG, SEARCH_CONFIG, SearchFilters, SearchResult, SearchError, SearchType } from '../constants/config';

// Simple debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

export function useSearchTypes() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SearchError | null>(null);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());
  const searchSequenceRef = useRef(0);

  // Cleanup abort controllers on unmount
  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach(controller => controller.abort());
      abortControllersRef.current.clear();
    };
  }, []);

  /**
   * Validate search query for FTS5 injection prevention
   */
  const validateQuery = useCallback((query: string): { valid: boolean; error?: string } => {
    if (!query || query.trim().length === 0) {
      return { valid: true }; // Empty query is valid
    }

    // Check query length
    if (query.length > SEARCH_CONFIG.MAX_QUERY_LENGTH) {
      return { valid: false, error: 'Query too long' };
    }

    // Check for potentially dangerous FTS5 operators
    const dangerousPatterns = [
      /\bor\b/i,  // OR operator
      /\bnot\b/i, // NOT operator
      /NEAR\(/i,  // NEAR operator
      /\*/        // Wildcard
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        return { valid: false, error: 'Invalid search operator' };
      }
    }

    // Validate characters
    if (!SEARCH_CONFIG.FTS5_ALLOWED_PATTERN.test(query)) {
      return { valid: false, error: 'Invalid characters in query' };
    }

    return { valid: true };
  }, []);

  /**
   * Build endpoint URL based on search type and filters
   */
  const buildEndpoint = useCallback((
    searchType: SearchType,
    query: string,
    filters: SearchFilters
  ): string => {
    const params = new URLSearchParams();

    // Set base parameters
    if (query) params.set('query', query);
    if (filters.project) params.set('project', filters.project);
    if (filters.limit) params.set('limit', filters.limit.toString());
    if (filters.concepts?.length) params.set('concepts', filters.concepts.join(','));
    if (filters.files?.length) params.set('files', filters.files.join(','));
    if (filters.type) params.set('type', filters.type);

    // Determine endpoint based on search type
    switch (searchType) {
      case 'timeline':
        return `/api/timeline?${params.toString()}`;
      case 'decisions':
        return `/api/decisions?${params.toString()}`;
      case 'changes':
        return `/api/changes?${params.toString()}`;
      case 'how-it-works':
        return `/api/how-it-works?${params.toString()}`;
      case 'by-concept':
        if (query) {
          return `/api/search/by-concept?concept=${encodeURIComponent(query)}&limit=${filters.limit || SEARCH_CONFIG.DEFAULT_LIMIT}`;
        } else {
          return `/api/search/by-concept?limit=${filters.limit || SEARCH_CONFIG.DEFAULT_LIMIT}`;
        }
      case 'by-file':
        if (query) {
          return `/api/search/by-file?filePath=${encodeURIComponent(query)}&limit=${filters.limit || SEARCH_CONFIG.DEFAULT_LIMIT}`;
        } else {
          return `/api/search/by-file?limit=${filters.limit || SEARCH_CONFIG.DEFAULT_LIMIT}`;
        }
      case 'by-type':
        if (query) {
          return `/api/search/by-type?type=${encodeURIComponent(query)}&limit=${filters.limit || SEARCH_CONFIG.DEFAULT_LIMIT}`;
        } else {
          return `/api/search/by-type?limit=${filters.limit || SEARCH_CONFIG.DEFAULT_LIMIT}`;
        }
      case 'standard':
      default:
        return `/api/search?${params.toString()}`;
    }
  }, []);

  /**
   * Core search implementation with abort controller and sequence tracking
   */
  const searchImpl = useCallback(async (
    searchType: SearchType,
    query: string,
    filters: SearchFilters = {}
  ): Promise<SearchResult | null> => {
    // Increment sequence for race condition detection
    const currentSequence = ++searchSequenceRef.current;
    setIsLoading(true);
    setError(null);

    // Validate query
    const validation = validateQuery(query);
    if (!validation.valid) {
      const searchError: SearchError = {
        message: validation.error || 'Invalid query',
        code: 'INVALID_QUERY',
        isEmpty: !query || query.trim().length === 0
      };
      setError(searchError);
      setIsLoading(false);
      return null;
    }

    // Abort previous request for this search type
    const previousController = abortControllersRef.current.get(searchType);
    if (previousController) {
      previousController.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllersRef.current.set(searchType, controller);

    try {
      const endpoint = buildEndpoint(searchType, query, filters);
      const url = `${API_CONFIG.BASE_URL}${endpoint}`;

      console.log('[useSearchTypes] Fetching:', url, { sequence: currentSequence });

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });

      // Check if this search is still the latest
      if (currentSequence !== searchSequenceRef.current) {
        console.log('[useSearchTypes] Stale result ignored (sequence:', currentSequence, '!= latest:', searchSequenceRef.current, ')');
        return null;
      }

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform the response to match our expected format
      const result: SearchResult = {
        observations: data.observations || [],
        summaries: data.summaries || [],
        prompts: data.prompts || [],
        total: data.total || 0
      };

      setError(null);
      return result;

    } catch (err: any) {
      // Ignore abort errors
      if (err.name === 'AbortError') {
        console.log('[useSearchTypes] Search aborted (sequence:', currentSequence, ')');
        return null;
      }

      // Check if this error is for the latest search
      if (currentSequence === searchSequenceRef.current) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown search error';
        const searchError: SearchError = {
          message: errorMessage,
          code: 'SEARCH_ERROR',
          isEmpty: !query || query.trim().length === 0
        };
        setError(searchError);
        console.error('[useSearchTypes] Search error:', err);
      }
      return null;
    } finally {
      // Only clear loading state if this is still the latest search
      if (currentSequence === searchSequenceRef.current) {
        setIsLoading(false);
      }
      // Clean up abort controller
      if (currentSequence === searchSequenceRef.current) {
        abortControllersRef.current.delete(searchType);
      }
    }
  }, [validateQuery, buildEndpoint]);

  return {
    search: searchImpl,
    isLoading,
    error
  };
}
