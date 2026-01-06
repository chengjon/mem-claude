import { useState, useCallback, useEffect } from 'react';
import { API_ENDPOINTS } from '../constants/api';
import { uiLogger } from '../utils/ui-logger';

export interface ContentTag {
  id: number;
  tag_name: string;
  tag_category: string | null;
  parent_tag_id: number | null;
  description: string | null;
  color_code: string | null;
  usage_count: number;
  is_auto_generated: boolean;
  is_system_tag: boolean;
}

export interface CreateTagRequest {
  tag_name: string;
  tag_category?: string;
  parent_tag_id?: number;
  description?: string;
  color_code?: string;
}

export interface TagItemRequest {
  sdk_session_id: string;
  item_type: 'user_prompt' | 'ai_response' | 'observation' | 'summary';
  item_id: number;
  tag_ids: number[];
}

export interface UseTagsReturn {
  tags: ContentTag[];
  categories: string[];
  isLoading: boolean;
  error: string | null;
  loadTags: (category?: string) => Promise<void>;
  searchTags: (query: string) => Promise<ContentTag[]>;
  createTag: (tag: CreateTagRequest) => Promise<ContentTag | null>;
  updateTag: (id: number, updates: Partial<CreateTagRequest>) => Promise<boolean>;
  deleteTag: (id: number) => Promise<boolean>;
  tagItem: (request: TagItemRequest) => Promise<number>;
  autoTagContent: (content: string) => Promise<ContentTag[]>;
  getTagsForItem: (itemType: string, itemId: number) => Promise<ContentTag[]>;
  removeTag: (itemType: string, itemId: number, tagId: number) => Promise<boolean>;
  refreshCategories: () => Promise<void>;
}

export function useTags(): UseTagsReturn {
  const [tags, setTags] = useState<ContentTag[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTags = useCallback(async (category?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      params.append('limit', '100');

      const response = await fetch(`${API_ENDPOINTS.TAGS}?${params}`);
      if (!response.ok) throw new Error('Failed to load tags');
      const data = (await response.json()) as ContentTag[];
      setTags(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const searchTags = useCallback(async (query: string): Promise<ContentTag[]> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.TAGS_SEARCH}?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to search tags');
      return (await response.json()) as ContentTag[];
    } catch (err) {
      uiLogger.error('TAGS', 'Failed to search tags:', err);
      return [];
    }
  }, []);

  const createTag = useCallback(async (tag: CreateTagRequest): Promise<ContentTag | null> => {
    try {
      const response = await fetch(API_ENDPOINTS.TAGS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tag)
      });
      if (!response.ok) throw new Error('Failed to create tag');
      const newTag = (await response.json()) as ContentTag;
      setTags(prev => [...prev, newTag]);
      return newTag;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    }
  }, []);

  const updateTag = useCallback(async (id: number, updates: Partial<CreateTagRequest>): Promise<boolean> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.TAGS}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update tag');
      const updatedTag = (await response.json()) as ContentTag;
      setTags(prev => prev.map(t => t.id === id ? updatedTag : t));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, []);

  const deleteTag = useCallback(async (id: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.TAGS}/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete tag');
      setTags(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, []);

  const tagItem = useCallback(async (request: TagItemRequest): Promise<number> => {
    try {
      const response = await fetch(API_ENDPOINTS.CONVERSATION_TAGS, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });
      if (!response.ok) throw new Error('Failed to tag item');
      const result = (await response.json()) as { tagged_count?: number };
      return result.tagged_count || 0;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return 0;
    }
  }, []);

  const autoTagContent = useCallback(async (content: string): Promise<ContentTag[]> => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTO_TAG, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (!response.ok) throw new Error('Failed to auto-tag content');
      return (await response.json()) as ContentTag[];
    } catch (err) {
      uiLogger.error('TAGS', 'Failed to auto-tag content:', err);
      return [];
    }
  }, []);

  const getTagsForItem = useCallback(async (itemType: string, itemId: number): Promise<ContentTag[]> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.CONVERSATION_TAGS}/${itemType}/${itemId}`);
      if (!response.ok) throw new Error('Failed to get tags for item');
      return (await response.json()) as ContentTag[];
    } catch (err) {
      uiLogger.error('TAGS', 'Failed to get tags for item:', err);
      return [];
    }
  }, []);

  const removeTag = useCallback(async (itemType: string, itemId: number, tagId: number): Promise<boolean> => {
    try {
      const response = await fetch(`${API_ENDPOINTS.CONVERSATION_TAGS}/${itemType}/${itemId}/${tagId}`, {
        method: 'DELETE'
      });
      if (!response.ok && response.status !== 404) throw new Error('Failed to remove tag');
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  }, []);

  const refreshCategories = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.TAG_CATEGORIES);
      if (!response.ok) throw new Error('Failed to load categories');
      const data = (await response.json()) as string[];
      setCategories(data);
    } catch (err) {
      uiLogger.error('TAGS', 'Failed to load categories:', err);
    }
  }, []);

  useEffect(() => {
    loadTags();
    refreshCategories();
  }, [loadTags, refreshCategories]);

  return {
    tags,
    categories,
    isLoading,
    error,
    loadTags,
    searchTags,
    createTag,
    updateTag,
    deleteTag,
    tagItem,
    autoTagContent,
    getTagsForItem,
    removeTag,
    refreshCategories
  };
}
