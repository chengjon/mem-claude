export interface ConversationSummary {
  id: number;
  sdk_session_id: string;
  project: string;
  summary_type: 'auto' | 'manual' | 'ai_enhanced' | 'template';
  content: string;
  keywords: string | null;
  key_points: string | null;
  summary_length: number | null;
  confidence_score: number | null;
  ai_model: string | null;
  created_at: string;
  created_at_epoch: number;
  updated_at: string | null;
  updated_at_epoch: number | null;
}

export interface ContentTag {
  id: number;
  tag_name: string;
  tag_category: string | null;
  parent_tag_id: number | null;
  description: string | null;
  color_code: string | null;
  icon_name: string | null;
  usage_count: number;
  is_auto_generated: boolean;
  is_system_tag: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface ConversationTag {
  id: number;
  sdk_session_id: string;
  item_type: 'user_prompt' | 'ai_response' | 'observation' | 'summary';
  item_id: number;
  tag_id: number;
  confidence_score: number;
  is_auto_generated: boolean;
  created_by: string | null;
  created_at: string;
  created_at_epoch: number;
}

export interface AnalysisTask {
  id: number;
  sdk_session_id: string;
  task_type: 'summary_generation' | 'auto_tagging' | 'sentiment_analysis';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  priority: number;
  input_data: string | null;
  output_data: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  created_at: string;
  created_at_epoch: number;
  started_at: string | null;
  completed_at: string | null;
}

export interface CreateSummaryRequest {
  sdk_session_id: string;
  project: string;
  summary_type: 'auto' | 'manual' | 'ai_enhanced' | 'template';
  content: string;
  keywords?: string;
  key_points?: string;
}

export interface CreateTagRequest {
  tag_name: string;
  tag_category?: string;
  parent_tag_id?: number;
  description?: string;
  color_code?: string;
}

export interface CreateAnalysisTaskRequest {
  sdk_session_id: string;
  task_type: 'summary_generation' | 'auto_tagging' | 'sentiment_analysis';
  priority?: number;
  input_data?: Record<string, unknown>;
}

export interface TagConversationRequest {
  sdk_session_id: string;
  item_type: 'user_prompt' | 'ai_response' | 'observation' | 'summary';
  item_id: number;
  tag_ids: number[];
  is_auto_generated?: boolean;
}

export interface SearchSummariesRequest {
  project?: string;
  query?: string;
  summary_type?: string;
  limit?: number;
  offset?: number;
}

export interface SearchTagsRequest {
  query?: string;
  category?: string;
  limit?: number;
  offset?: number;
}

export interface AutoTagRequest {
  sdk_session_id: string;
  item_type: 'user_prompt' | 'ai_response' | 'observation' | 'summary';
  item_id: number;
  content: string;
}
