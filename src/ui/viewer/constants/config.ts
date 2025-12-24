/**
 * Viewer Configuration Constants
 * Centralized configuration for the React viewer UI
 */

// API Configuration
export const API_CONFIG = {
  // Worker service configuration
  // Uses window globals set by HTML template or defaults
  // NOTE: process.env is replaced by esbuild at build time, not available at runtime
  get WORKER_HOST(): string {
    if (typeof window !== 'undefined' && (window as any).CLAUDE_MEM_WORKER_HOST) {
      return (window as any).CLAUDE_MEM_WORKER_HOST;
    }
    // Fallback to default (localhost for development)
    return 'localhost';
  },

  get WORKER_PORT(): string {
    if (typeof window !== 'undefined' && (window as any).CLAUDE_MEM_WORKER_PORT) {
      return (window as any).CLAUDE_MEM_WORKER_PORT;
    }
    // Fallback to default port
    return '37777';
  },

  get BASE_URL(): string {
    const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
    return `${protocol}//${this.WORKER_HOST}:${this.WORKER_PORT}`;
  }
} as const;

// Search Configuration
export const SEARCH_CONFIG = {
  // Pagination limits
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,

  // Debounce timing (ms)
  SEARCH_DEBOUNCE_MS: 300,

  // Cache TTL (ms)
  CACHE_TTL_MS: 30000,

  // Maximum keywords for search
  MAX_KEYWORDS: 10,

  // FTS5 allowed characters pattern
  FTS5_ALLOWED_PATTERN: /^[a-zA-Z0-9\s\-_\.@:,]+$/,

  // Maximum query length
  MAX_QUERY_LENGTH: 500
} as const;

// UI Configuration
export const UI_CONFIG = {
  // Pagination sizes
  INITIAL_PAGE_SIZE: 20,
  LOAD_MORE_BATCH_SIZE: 20,

  // Loading indicators
  MIN_LOADING_TIME_MS: 500,
  MAX_LOADING_TIME_MS: 10000,

  // Animation durations
  TRANSITION_DURATION_MS: 200,

  // Debounce times
  INPUT_DEBOUNCE_MS: 300,
  SCROLL_DEBOUNCE_MS: 100
} as const;

// Type Definitions
export type SearchType = 'standard' | 'timeline' | 'decisions' | 'changes' | 'how-it-works' | 'by-concept' | 'by-file' | 'by-type';

export interface SearchFilters {
  project?: string;
  limit?: number;
  concepts?: string[];
  files?: string[];
  type?: string;
}

export interface SearchResult {
  observations: any[];
  summaries: any[];
  prompts: any[];
  total: number;
}

export interface SearchError {
  message: string;
  code?: string;
  isEmpty?: boolean;
}
