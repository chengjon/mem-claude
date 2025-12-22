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
  SEARCH_CONVERSATIONS: '/api/search-conversations', // 统一搜索用户对话和AI回复
  SETTINGS: '/api/settings',
  STATS: '/api/stats',
  PROCESSING_STATUS: '/api/processing-status',
  STREAM: '/stream',
} as const;
