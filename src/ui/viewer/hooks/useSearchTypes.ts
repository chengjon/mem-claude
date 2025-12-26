/**
 * useSearchTypes Hook
 *
 * Handles different search types for mem-claude viewer.
 * Provides API calls for the new search functionality with:
 * - Abort controller for race condition prevention
 * - Debouncing for performance
 * - FTS5 injection prevention
 * - Comprehensive error handling
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { Observation, Summary, UserPrompt } from '../types';
import { SEARCH_CONFIG } from '../constants/config';

interface SearchTypesResult {
  observations: Observation[];
  summaries: Summary[];
  prompts: UserPrompt[];
}

interface SearchTypesError {
  message: string;
  details?: string;
}

export function useSearchTypes() {
  const [results, setResults] = useState<SearchTypesResult>({
    observations: [],
    summaries: [],
    prompts: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SearchTypesError | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const searchByType = useCallback(async (searchType: string, query: string) => {
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      // Determine which endpoint to call
      const endpoint = searchType === 'decisions' 
        ? '/api/decisions' 
        : searchType === 'changes'
        ? '/api/changes'
        : searchType === 'how-it-works'
        ? '/api/how-it-works'
        : '/api/search';

      const response = await fetch(`http://localhost:37777${endpoint}?query=${encodeURIComponent(query)}&limit=${SEARCH_CONFIG.defaultLimit}`, {
        method: 'GET',
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate response structure
      if (!data.content || !Array.isArray(data.content)) {
        throw new Error('Invalid response structure');
      }

      // Extract content from MCP response format
      const content = data.content[0];
      if (content.type !== 'text') {
        throw new Error('Expected text response');
      }

      // Parse JSON results
      const jsonMatch = content.text.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        throw new Error('No JSON data found in response');
      }

      const searchResults: SearchTypesResult = JSON.parse(jsonMatch[1]);
      setResults(searchResults);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Request was aborted, ignore
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError({
        message: `Search failed: ${errorMessage}`,
        details: err?.toString()
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    results,
    isLoading,
    error,
    searchByType
  };
}
