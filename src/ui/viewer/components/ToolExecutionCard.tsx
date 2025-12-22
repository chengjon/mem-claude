import React, { useState } from 'react';
import { ToolExecution } from '../types';
import { formatDate } from '../utils/formatters';

interface ToolExecutionCardProps {
  toolExecution: ToolExecution;
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

// Get file operation icon
function getFileOperationIcon(operation: string) {
  switch (operation) {
    case 'created':
      return '✨';
    case 'modified':
      return '📝';
    case 'read':
      return '📖';
    case 'deleted':
      return '🗑️';
    default:
      return '📄';
  }
}

// Get tool execution status styling
function getExecutionStatusStyle(success: boolean) {
  return success 
    ? { bg: '#059669', color: '#d1fae5' } // Green for success
    : { bg: '#dc2626', color: '#fecaca' }; // Red for failure
}

export function ToolExecutionCard({ toolExecution }: ToolExecutionCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const date = formatDate(toolExecution.created_at_epoch);

  // Parse tool data
  const toolInput = toolExecution.tool_input ? parseJsonSafely(toolExecution.tool_input) : null;
  const toolOutput = toolExecution.tool_output ? parseJsonSafely(toolExecution.tool_output) : null;

  // Parse file operations
  const filesCreated = toolExecution.files_created ? parseJsonSafely(toolExecution.files_created).map(stripProjectRoot) : [];
  const filesModified = toolExecution.files_modified ? parseJsonSafely(toolExecution.files_modified).map(stripProjectRoot) : [];
  const filesRead = toolExecution.files_read ? parseJsonSafely(toolExecution.files_read).map(stripProjectRoot) : [];
  const filesDeleted = toolExecution.files_deleted ? parseJsonSafely(toolExecution.files_deleted).map(stripProjectRoot) : [];

  const statusStyle = getExecutionStatusStyle(toolExecution.success);

  return (
    <div className="card tool-execution-card">
      <div className="card-header">
        <div className="card-header-left">
          <span 
            className="card-type execution-status"
            style={{ 
              backgroundColor: statusStyle.bg,
              color: statusStyle.color
            }}
          >
            {toolExecution.success ? '✓' : '✗'} {toolExecution.tool_name}
          </span>
          <span className="card-project">{toolExecution.project}</span>
          {toolExecution.tool_duration_ms && (
            <span className="execution-duration">
              ⏱️ {toolExecution.tool_duration_ms}ms
            </span>
          )}
        </div>
        <div className="card-header-right">
          <span className="meta-date">#{toolExecution.id} • {date}</span>
        </div>
      </div>

      <div className="card-content">
        {/* File Operations Summary */}
        {(filesCreated.length > 0 || filesModified.length > 0 || filesRead.length > 0 || filesDeleted.length > 0) && (
          <div className="file-operations-summary">
            <div className="file-ops-header">
              <span className="file-ops-title">📁 File Operations</span>
              <button
                className={`file-ops-toggle ${showFiles ? 'active' : ''}`}
                onClick={() => setShowFiles(!showFiles)}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
                <span>{showFiles ? 'Hide' : 'Show'} Files</span>
              </button>
            </div>

            {showFiles && (
              <div className="file-operations-list">
                {filesCreated.length > 0 && (
                  <div className="file-operation-group">
                    <span className="operation-label">{getFileOperationIcon('created')} Created:</span>
                    <div className="file-list">
                      {filesCreated.map((file, idx) => (
                        <span key={idx} className="file-tag created">{file}</span>
                      ))}
                    </div>
                  </div>
                )}

                {filesModified.length > 0 && (
                  <div className="file-operation-group">
                    <span className="operation-label">{getFileOperationIcon('modified')} Modified:</span>
                    <div className="file-list">
                      {filesModified.map((file, idx) => (
                        <span key={idx} className="file-tag modified">{file}</span>
                      ))}
                    </div>
                  </div>
                )}

                {filesRead.length > 0 && (
                  <div className="file-operation-group">
                    <span className="operation-label">{getFileOperationIcon('read')} Read:</span>
                    <div className="file-list">
                      {filesRead.map((file, idx) => (
                        <span key={idx} className="file-tag read">{file}</span>
                      ))}
                    </div>
                  </div>
                )}

                {filesDeleted.length > 0 && (
                  <div className="file-operation-group">
                    <span className="operation-label">{getFileOperationIcon('deleted')} Deleted:</span>
                    <div className="file-list">
                      {filesDeleted.map((file, idx) => (
                        <span key={idx} className="file-tag deleted">{file}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tool Details Toggle */}
        {(toolInput || toolOutput || toolExecution.error_message) && (
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
                {toolExecution.error_message && (
                  <div className="error-message">
                    <strong>Error:</strong>
                    <pre className="error-data">{toolExecution.error_message}</pre>
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
        <span className="meta-prompt">Prompt #{toolExecution.prompt_number}</span>
        {toolExecution.sdk_session_id && (
          <span className="meta-session">Session: {toolExecution.sdk_session_id.substring(0, 8)}...</span>
        )}
        {toolExecution.ai_response_id && (
          <span className="meta-response">AI Response #{toolExecution.ai_response_id}</span>
        )}
      </div>
    </div>
  );
}
