/**
 * TypeScript types for database query results
 * Provides type safety for bun:sqlite query results
 */

/**
 * Schema information from sqlite3 PRAGMA table_info
 */
export interface TableColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

/**
 * Index information from sqlite3 PRAGMA index_list
 */
export interface IndexInfo {
  seq: number;
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

/**
 * Table name from sqlite_master
 */
export interface TableNameRow {
  name: string;
}

/**
 * Schema version record
 */
export interface SchemaVersion {
  version: number;
}

/**
 * SDK Session database record
 */
export interface SdkSessionRecord {
  id: number;
  claude_session_id: string;
  sdk_session_id: string | null;
  project: string;
  user_prompt: string | null;
  started_at: string;
  started_at_epoch: number;
  completed_at: string | null;
  completed_at_epoch: number | null;
  status: 'active' | 'completed' | 'failed';
  worker_port?: number;
  prompt_counter?: number;
}

/**
 * Observation database record
 */
export interface ObservationRecord {
  id: number;
  sdk_session_id: string;
  project: string;
  text: string | null;
  type: 'decision' | 'bugfix' | 'feature' | 'refactor' | 'discovery' | 'change';
  created_at: string;
  created_at_epoch: number;
  title?: string;
  concept?: string;
  source_files?: string;
  prompt_number?: number;
  discovery_tokens?: number;
}

/**
 * Session Summary database record
 */
export interface SessionSummaryRecord {
  id: number;
  sdk_session_id: string;
  project: string;
  request: string | null;
  investigated: string | null;
  learned: string | null;
  completed: string | null;
  next_steps: string | null;
  created_at: string;
  created_at_epoch: number;
  prompt_number?: number;
  discovery_tokens?: number;
}

/**
 * User Prompt database record
 */
export interface UserPromptRecord {
  id: number;
  claude_session_id: string;
  prompt_number: number;
  prompt_text: string;
  created_at: string;
  created_at_epoch: number;
}

/**
 * Latest user prompt with session join
 */
export interface LatestPromptResult {
  id: number;
  claude_session_id: string;
  sdk_session_id: string;
  project: string;
  prompt_number: number;
  prompt_text: string;
  created_at_epoch: number;
}

/**
 * Observation with context (for time-based queries)
 */
export interface ObservationWithContext {
  id: number;
  sdk_session_id: string;
  project: string;
  text: string | null;
  type: string;
  created_at: string;
  created_at_epoch: number;
  title?: string;
  concept?: string;
  source_files?: string;
  prompt_number?: number;
  discovery_tokens?: number;
}

/**
 * AI Response database record
 */
export interface AiResponseRecord {
  id: number;
  claude_session_id: string;
  sdk_session_id: string | null;
  project: string;
  prompt_number: number;
  response_text: string;
  response_type: 'assistant' | 'tool_result' | 'error';
  tool_name: string | null;
  tool_input: string | null;
  tool_output: string | null;
  created_at: string;
  created_at_epoch: number;
}

/**
 * Tool execution database record
 */
export interface ToolExecutionRecord {
  id: number;
  ai_response_id: number | null;
  claude_session_id: string;
  sdk_session_id: string | null;
  project: string;
  prompt_number: number;
  tool_name: string;
  tool_input: string | null;
  tool_output: string | null;
  tool_duration_ms: number | null;
  files_created: string | null;
  files_modified: string | null;
  files_read: string | null;
  files_deleted: string | null;
  error_message: string | null;
  success: boolean;
  created_at: string;
  created_at_epoch: number;
}
