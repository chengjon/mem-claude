/**
 * API endpoint paths
 * Centralized to avoid magic strings scattered throughout the codebase
 */
export const API_ENDPOINTS = {
  OBSERVATIONS: '/api/observations',
  SUMMARIES: '/api/summaries',
  PROMPTS: '/api/prompts',
  AI_RESPONSES: '/api/ai-responses',
  TOOL_EXECUTIONS: '/api/tool-executions',
  SEARCH_CONVERSATIONS: '/api/search-conversations',
  SETTINGS: '/api/settings',
  STATS: '/api/stats',
  PROCESSING_STATUS: '/api/processing-status',
  STREAM: '/stream',
  CONVERSATION_SUMMARIES: '/api/conversation-summaries',
  TAGS: '/api/tags',
  TAGS_SEARCH: '/api/tags/search/query',
  TAG_CATEGORIES: '/api/tags/categories',
  CONVERSATION_TAGS: '/api/conversation-tags',
  AUTO_TAG: '/api/auto-tag',
  GENERATE_SUMMARY: '/api/generate-summary',
} as const;
