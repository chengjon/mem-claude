import React, { useState } from 'react';
import type { ContentTag } from '../hooks/useTags';

interface TagBadgeProps {
  tag: ContentTag;
  onClick?: () => void;
  onRemove?: () => void;
  removable?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export function TagBadge({ tag, onClick, onRemove, removable = false, size = 'medium' }: TagBadgeProps) {
  const sizeClasses = {
    small: 'text-xs px-2 py-0.5',
    medium: 'text-sm px-2.5 py-1',
    large: 'text-base px-3 py-1.5'
  };

  const style = {
    backgroundColor: tag.color_code || '#6366f1',
    color: '#ffffff'
  };

  const content = (
    <span
      className={`inline-flex items-center rounded-full font-medium cursor-pointer ${sizeClasses[size]}`}
      style={style}
      onClick={onClick}
    >
      {tag.tag_name}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className="ml-1 hover:opacity-80"
        >
          ×
        </button>
      )}
    </span>
  );

  return content;
}

interface TagListProps {
  tags: ContentTag[];
  onTagClick?: (tag: ContentTag) => void;
  onTagRemove?: (tag: ContentTag) => void;
  removable?: boolean;
  maxVisible?: number;
}

export function TagList({ tags, onTagClick, onTagRemove, removable = false, maxVisible }: TagListProps) {
  const visibleTags = maxVisible ? tags.slice(0, maxVisible) : tags;
  const hiddenCount = tags.length - visibleTags.length;

  if (tags.length === 0) {
    return <span className="text-gray-400 text-sm">No tags</span>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {visibleTags.map(tag => (
        <TagBadge
          key={tag.id}
          tag={tag}
          onClick={() => onTagClick?.(tag)}
          onRemove={() => onTagRemove?.(tag)}
          removable={removable}
          size="small"
        />
      ))}
      {hiddenCount > 0 && (
        <span className="text-sm text-gray-500">+{hiddenCount} more</span>
      )}
    </div>
  );
}

interface TagManagerProps {
  sdkSessionId: string;
  itemType: 'user_prompt' | 'ai_response' | 'observation' | 'summary';
  itemId: number;
  availableTags: ContentTag[];
  onTagsChange?: () => void;
}

export function TagManager({ sdkSessionId, itemType, itemId, availableTags, onTagsChange }: TagManagerProps) {
  const [selectedTags, setSelectedTags] = useState<ContentTag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const loadItemTags = async () => {
    try {
      const response = await fetch(`/api/conversation-tags/${itemType}/${itemId}`);
      if (response.ok) {
        const tags = (await response.json()) as ContentTag[];
        setSelectedTags(tags);
      }
    } catch (err) {
      console.error('Failed to load item tags:', err);
    }
  };

  React.useEffect(() => {
    loadItemTags();
  }, [itemType, itemId]);

  const handleAddTag = async (tag: ContentTag) => {
    if (selectedTags.find(t => t.id === tag.id)) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/conversation-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sdk_session_id: sdkSessionId,
          item_type: itemType,
          item_id: itemId,
          tag_ids: [tag.id]
        })
      });

      if (response.ok) {
        setSelectedTags(prev => [...prev, tag]);
        onTagsChange?.();
      }
    } catch (err) {
      console.error('Failed to add tag:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTag = async (tag: ContentTag) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversation-tags/${itemType}/${itemId}/${tag.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSelectedTags(prev => prev.filter(t => t.id !== tag.id));
        onTagsChange?.();
      }
    } catch (err) {
      console.error('Failed to remove tag:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTags = searchQuery
    ? availableTags.filter(t =>
        t.tag_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !selectedTags.find(st => st.id === t.id)
      )
    : availableTags.filter(t => !selectedTags.find(st => st.id === t.id));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map(tag => (
          <TagBadge
            key={tag.id}
            tag={tag}
            removable
            onRemove={() => handleRemoveTag(tag)}
            size="small"
          />
        ))}
        <button
          onClick={() => setShowSelector(!showSelector)}
          className="text-sm text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded border border-indigo-200 hover:bg-indigo-50"
        >
          + Add Tag
        </button>
      </div>

      {showSelector && (
        <div className="border rounded-lg p-3 bg-white shadow-lg max-h-48 overflow-y-auto">
          <input
            type="text"
            placeholder="Search tags..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border rounded mb-2 text-sm"
          />
          <div className="flex flex-wrap gap-1.5">
            {filteredTags.slice(0, 10).map(tag => (
              <TagBadge
                key={tag.id}
                tag={tag}
                onClick={() => handleAddTag(tag)}
                size="small"
              />
            ))}
          </div>
          {filteredTags.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">No matching tags</p>
          )}
        </div>
      )}
    </div>
  );
}

interface AutoTagButtonProps {
  content: string;
  sdkSessionId: string;
  itemType: 'user_prompt' | 'ai_response' | 'observation' | 'summary';
  itemId: number;
  onTagsGenerated: (tags: ContentTag[]) => void;
}

export function AutoTagButton({ content, sdkSessionId, itemType, itemId, onTagsGenerated }: AutoTagButtonProps) {
  const [isAutoTagging, setIsAutoTagging] = useState(false);

  const handleAutoTag = async () => {
    setIsAutoTagging(true);
    try {
      const response = await fetch('/api/auto-tag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      if (response.ok) {
        const tags = (await response.json()) as ContentTag[];
        if (tags.length > 0) {
          await fetch('/api/conversation-tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sdk_session_id: sdkSessionId,
              item_type: itemType,
              item_id: itemId,
              tag_ids: tags.map((t: ContentTag) => t.id),
              is_auto_generated: true
            })
          });
          onTagsGenerated(tags);
        }
      }
    } catch (err) {
      console.error('Failed to auto-tag:', err);
    } finally {
      setIsAutoTagging(false);
    }
  };

  return (
    <button
      onClick={handleAutoTag}
      disabled={isAutoTagging}
      className="text-sm text-purple-600 hover:text-purple-800 px-2 py-0.5 rounded border border-purple-200 hover:bg-purple-50 disabled:opacity-50"
    >
      {isAutoTagging ? 'Analyzing...' : '✨ Auto-Tag'}
    </button>
  );
}
