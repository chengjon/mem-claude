import { useState, useCallback, useRef } from 'react';
import { Observation, Summary, UserPrompt, AiResponse, ToolExecution } from '../types';
import { UI } from '../constants/ui';
import { API_ENDPOINTS } from '../constants/api';
import { logError } from '../utils/hook-logger';

interface PaginationState {
  isLoading: boolean;
  hasMore: boolean;
}

type DataType = 'observations' | 'summaries' | 'prompts' | 'aiResponses' | 'toolExecutions';
type DataItem = Observation | Summary | UserPrompt | AiResponse | ToolExecution;

function usePaginationFor(
  endpoint: string,
  dataType: DataType,
  currentFilter: string,
  keywords?: string[],
  logic?: 'AND' | 'OR',
  includeToolCalls?: boolean,
  observationType?: string
) {
  const [state, setState] = useState<PaginationState>({
    isLoading: false,
    hasMore: true
  });

  const offsetRef = useRef(0);
  const lastFilterRef = useRef(currentFilter);
  const lastKeywordsRef = useRef(keywords);
  const lastIncludeToolCallsRef = useRef(includeToolCalls);
  const lastObservationTypeRef = useRef(observationType);
  const stateRef = useRef(state);

  const loadMore = useCallback(async (): Promise<DataItem[]> => {
    const filterChanged = lastFilterRef.current !== currentFilter;
    const keywordsChanged = JSON.stringify(lastKeywordsRef.current) !== JSON.stringify(keywords);
    const toolCallsChanged = lastIncludeToolCallsRef.current !== includeToolCalls;
    const typeChanged = lastObservationTypeRef.current !== observationType;

    if (filterChanged || keywordsChanged || toolCallsChanged || typeChanged) {
      offsetRef.current = 0;
      lastFilterRef.current = currentFilter;
      lastKeywordsRef.current = keywords;
      lastIncludeToolCallsRef.current = includeToolCalls;
      lastObservationTypeRef.current = observationType;

      const newState = { isLoading: false, hasMore: true };
      setState(newState);
      stateRef.current = newState;
    }

    if (!filterChanged && !keywordsChanged && !toolCallsChanged && !typeChanged && (stateRef.current.isLoading || !stateRef.current.hasMore)) {
      return [];
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const params = new URLSearchParams({
        offset: offsetRef.current.toString(),
        limit: UI.PAGINATION_PAGE_SIZE.toString()
      });

      if (currentFilter) {
        params.append('project', currentFilter);
      }

      if (keywords && keywords.length > 0) {
        params.append('keywords', keywords.join(','));
        params.append('logic', logic || 'AND');
      }

      if (includeToolCalls) {
        params.append('includeToolCalls', 'true');
      }

      if (observationType) {
        params.append('type', observationType);
      }

      const response = await fetch(`${endpoint}?${params}`);

      if (!response.ok) {
        throw new Error(`Failed to load ${dataType}: ${response.statusText}`);
      }

      const data = (await response.json()) as { items: DataItem[], hasMore: boolean };

      setState(prev => ({
        ...prev,
        isLoading: false,
        hasMore: data.hasMore
      }));

      offsetRef.current += UI.PAGINATION_PAGE_SIZE;

      return data.items;
    } catch (error) {
      logError('PAGINATION', `Failed to load ${dataType}:`, error);
      setState(prev => ({ ...prev, isLoading: false }));
      return [];
    }
  }, [currentFilter, keywords, logic, includeToolCalls, observationType, endpoint, dataType]);

  return {
    ...state,
    loadMore
  };
}

/**
 * Hook for paginating observations with optional keyword filtering and other filters
 */
export function usePagination(
  currentFilter: string, 
  keywords?: string[], 
  logic?: 'AND' | 'OR',
  includeToolCalls?: boolean,
  observationType?: string
) {
  const observations = usePaginationFor(API_ENDPOINTS.OBSERVATIONS, 'observations', currentFilter, undefined, undefined, includeToolCalls, observationType);
  const summaries = usePaginationFor(API_ENDPOINTS.SUMMARIES, 'summaries', currentFilter);
  const prompts = usePaginationFor(API_ENDPOINTS.PROMPTS, 'prompts', currentFilter);
  const aiResponses = usePaginationFor(API_ENDPOINTS.AI_RESPONSES, 'aiResponses', currentFilter, keywords, logic);
  const toolExecutions = usePaginationFor(API_ENDPOINTS.TOOL_EXECUTIONS, 'toolExecutions', currentFilter);

  return {
    observations,
    summaries,
    prompts,
    aiResponses,
    toolExecutions
  };
}
