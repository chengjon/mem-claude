export interface Observation {
  id: number;
  sdk_session_id: string;
  project: string;
  type: string;
  title: string | null;
  subtitle: string | null;
  narrative: string | null;
  text: string | null;
  facts: string | null;
  concepts: string | null;
  files_read: string | null;
  files_modified: string | null;
  prompt_number: number | null;
  created_at: string;
  created_at_epoch: number;
}

export interface Summary {
  id: number;
  session_id: string;
  project: string;
  request?: string;
  investigated?: string;
  learned?: string;
  completed?: string;
  next_steps?: string;
  created_at_epoch: number;
}

export interface UserPrompt {
  id: number;
  claude_session_id: string;
  project: string;
  prompt_number: number;
  prompt_text: string;
  created_at_epoch: number;
}

export type FeedItem =
  | (Observation & { itemType: 'observation' })
  | (Summary & { itemType: 'summary' })
  | (UserPrompt & { itemType: 'prompt' });

export interface StreamEvent {
  type: 'initial_load' | 'new_observation' | 'new_summary' | 'new_prompt' | 'processing_status';
  observations?: Observation[];
  summaries?: Summary[];
  prompts?: UserPrompt[];
  projects?: string[];
  observation?: Observation;
  summary?: Summary;
  prompt?: UserPrompt;
  isProcessing?: boolean;
}

export interface Settings {
  CLAUDE_MEM_MODEL: string;
  CLAUDE_MEM_CONTEXT_OBSERVATIONS: string;
  CLAUDE_MEM_WORKER_PORT: string;
  CLAUDE_MEM_WORKER_HOST: string;

  // Token Economics Display
  CLAUDE_MEM_CONTEXT_SHOW_READ_TOKENS?: string;
  CLAUDE_MEM_CONTEXT_SHOW_WORK_TOKENS?: string;
  CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_AMOUNT?: string;
  CLAUDE_MEM_CONTEXT_SHOW_SAVINGS_PERCENT?: string;

  // Observation Filtering
  CLAUDE_MEM_CONTEXT_OBSERVATION_TYPES?: string;
  CLAUDE_MEM_CONTEXT_OBSERVATION_CONCEPTS?: string;

  // Display Configuration
  CLAUDE_MEM_CONTEXT_FULL_COUNT?: string;
  CLAUDE_MEM_CONTEXT_FULL_FIELD?: string;
  CLAUDE_MEM_CONTEXT_SESSION_COUNT?: string;

  // Feature Toggles
  CLAUDE_MEM_CONTEXT_SHOW_LAST_SUMMARY?: string;
  CLAUDE_MEM_CONTEXT_SHOW_LAST_MESSAGE?: string;
}

export interface WorkerStats {
  version?: string;
  uptime?: number;
  activeSessions?: number;
  sseClients?: number;
}

export interface DatabaseStats {
  size?: number;
  observations?: number;
  sessions?: number;
  summaries?: number;
}

export interface Stats {
  worker?: WorkerStats;
  database?: DatabaseStats;
}

export interface AiResponse {
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

export interface ToolExecution {
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

export type EnhancedFeedItem =
  | (Observation & { itemType: 'observation' })
  | (Summary & { itemType: 'summary' })
  | (UserPrompt & { itemType: 'prompt' })
  | (AiResponse & { itemType: 'ai_response' })
  | (ToolExecution & { itemType: 'tool_execution' });

export interface EnhancedStreamEvent {
  type: 'initial_load' | 'new_observation' | 'new_summary' | 'new_prompt' | 'new_ai_response' | 'new_tool_execution' | 'processing_status';
  observations?: Observation[];
  summaries?: Summary[];
  prompts?: UserPrompt[];
  aiResponses?: AiResponse[];
  toolExecutions?: ToolExecution[];
  projects?: string[];
  observation?: Observation;
  summary?: Summary;
  prompt?: UserPrompt;
  aiResponse?: AiResponse;
  toolExecution?: ToolExecution;
  isProcessing?: boolean;
}
