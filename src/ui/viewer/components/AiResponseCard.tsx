import React, { useState } from 'react';
import { AiResponse } from '../types';
import { formatDate } from '../utils/formatters';

interface AiResponseCardProps {
  aiResponse: AiResponse;
}

// Helper to strip project root from file paths
function stripProjectRoot(filePath: string): string {
  // Try to extract relative path by finding common project markers
  const markers = ['/Scripts/', '/src/', '/plugin/', '/docs/'];

  for (const marker of markers) {
    const index = filePath.indexOf(marker);
    if (index !== -1) {
      // Keep the marker and everything after it
      return filePath.substring(index + 1);
    }
  }

  // Fallback: if path contains project name, strip everything before it
  const projectIndex = filePath.indexOf('claude-mem/');
  if (projectIndex !== -1) {
    return filePath.substring(projectIndex + 'claude-mem/'.length);
  }

  // If no markers found, return basename or original path
  const parts = filePath.split('/');
  return parts.length > 3 ? parts.slice(-3).join('/') : filePath;
}

// Helper to parse JSON string safely
function parseJsonSafely(jsonStr: string | null): any[] {
  if (!jsonStr) return [];
  try {
    return JSON.parse(jsonStr);
  } catch {
    return [];
  }
}

export function AiResponseCard({ aiResponse }: AiResponseCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const date = formatDate(aiResponse.created_at_epoch);

  // Parse tool input/output if available
  const toolInput = aiResponse.tool_input ? parseJsonSafely(aiResponse.tool_input) : null;
  const toolOutput = aiResponse.tool_output ? parseJsonSafely(aiResponse.tool_output) : null;

  // Get response type styling
  const getResponseTypeStyle = (type: string) => {
    switch (type) {
      case 'assistant':
        return { bg: '#1e40af', color: '#dbeafe' }; // Blue
      case 'tool_result':
        return { bg: '#059669', color: '#d1fae5' }; // Green
      case 'error':
        return { bg: '#dc2626', color: '#fecaca' }; // Red
      default:
        return { bg: '#6b7280', color: '#f3f4f6' }; // Gray
    }
  };

  const typeStyle = getResponseTypeStyle(aiResponse.response_type);

  return (
    <div className="card ai-response-card">
      <div className="card-header">
        <div className="card-header-left">
          <span 
            className="card-type ai-response-type"
            style={{ 
              backgroundColor: typeStyle.bg,
              color: typeStyle.color
            }}
          >
            {aiResponse.response_type}
          </span>
          <span className="card-project">{aiResponse.project}</span>
          {aiResponse.tool_name && (
            <span className="tool-name">🤖 {aiResponse.tool_name}</span>
          )}
        </div>
        <div className="card-header-right">
          <span className="meta-date">#{aiResponse.id} • {date}</span>
        </div>
      </div>

      <div className="card-content">
        <div className="ai-response-text">
          {aiResponse.response_text}
        </div>

        {/* Tool Details Toggle */}
        {(toolInput || toolOutput || aiResponse.tool_name) && (
          <div className="tool-details-section">
            <button
              className={`tool-details-toggle ${showDetails ? 'active' : ''}`}
              onClick={() => setShowDetails(!showDetails)}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
              <span>Tool Details</span>
            </button>

            {showDetails && (
              <div className="tool-details-content">
                {aiResponse.tool_name && (
                  <div className="tool-info">
                    <strong>Tool:</strong> {aiResponse.tool_name}
                  </div>
                )}

                {toolInput && (
                  <div className="tool-input">
                    <strong>Input:</strong>
                    <pre className="tool-data">
                      {JSON.stringify(toolInput, null, 2)}
                    </pre>
                  </div>
                )}

                {toolOutput && (
                  <div className="tool-output">
                    <strong>Output:</strong>
                    <pre className="tool-data">
                      {JSON.stringify(toolOutput, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="card-meta">
        <span className="meta-prompt">Prompt #{aiResponse.prompt_number}</span>
        {aiResponse.sdk_session_id && (
          <span className="meta-session">Session: {aiResponse.sdk_session_id.substring(0, 8)}...</span>
        )}
      </div>
    </div>
  );
}
