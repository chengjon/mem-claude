/**
 * Save Hook - PostToolUse
 *
 * Pure HTTP client - sends data to worker, worker handles all database operations
 * including privacy checks. This allows the hook to run under any runtime
 * (Node.js or Bun) since it has no native module dependencies.
 */

import { stdin } from 'process';
import { STANDARD_HOOK_RESPONSE } from './hook-response.js';
import { logger } from '../utils/logger.js';
import { ensureWorkerRunning, getWorkerPort } from '../shared/worker-utils.js';
import { HOOK_TIMEOUTS } from '../shared/hook-constants.js';
import { errorHandler, ErrorType, ErrorSeverity, ErrorAction } from '../utils/error-handler.js';

export interface PostToolUseInput {
  session_id: string;
  cwd: string;
  tool_name: string;
  tool_input: any;
  tool_response: any;
}

/**
 * Save Hook Main Logic - Fire-and-forget HTTP client
 */
async function saveHook(input?: PostToolUseInput): Promise<void> {
  if (!input) {
    throw new Error('saveHook requires input');
  }

  const { session_id, cwd, tool_name, tool_input, tool_response } = input;

  // Ensure worker is running before any other logic
  const workerResult = await errorHandler.wrapAsync(
    async () => await ensureWorkerRunning(),
    'HOOK',
    'ensureWorkerRunning',
    { sessionId: session_id }
  );

  if (workerResult === null) {
    logger.warn('HOOK', 'Worker not available, skipping observation storage', {
      sessionId: session_id,
      toolName: tool_name
    });
    console.log(STANDARD_HOOK_RESPONSE);
    return;
  }

  const port = getWorkerPort();

  const toolStr = logger.formatTool(tool_name, tool_input);

  logger.dataIn('HOOK', `PostToolUse: ${toolStr}`, {
    workerPort: port
  });

  // Validate required fields before sending to worker
  if (!cwd) {
    throw new Error(`Missing cwd in PostToolUse hook input for session ${session_id}, tool ${tool_name}`);
  }

  // Use standardized error handling for the entire operation
  const result = await errorHandler.wrapAsync(async () => {
    // Send to worker - worker handles privacy check and database operations
    const response = await fetch(`http://127.0.0.1:${port}/api/sessions/observations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        claudeSessionId: session_id,
        tool_name,
        tool_input,
        tool_response,
        cwd
      }),
      signal: AbortSignal.timeout(HOOK_TIMEOUTS.DEFAULT)
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Create standardized error for HTTP failures
      const httpError = errorHandler.handle(
        new Error(`HTTP ${response.status}: ${errorText}`),
        'HOOK',
        {
          hookName: 'save',
          operation: 'Observation storage',
          toolName: tool_name,
          sessionId: session_id,
          port,
          statusCode: response.status,
          statusText: response.statusText
        }
      );
      
      // Set appropriate action based on status code
      if (response.status >= 500) {
        httpError.action = ErrorAction.RETRY;
      } else if (response.status >= 400) {
        httpError.action = ErrorAction.ABORT;
      }
      
      throw httpError;
    }

    logger.debug('HOOK', 'Observation sent successfully', { toolName: tool_name });
  }, 'HOOK', 'saveHook', {
    sessionId: session_id,
    toolName: tool_name,
    cwd
  });

  // If operation failed, log and continue (fire-and-forget pattern)
  if (result === null) {
    logger.warn('HOOK', 'Observation storage failed, continuing anyway', {
      sessionId: session_id,
      toolName: tool_name
    });
  }

  console.log(STANDARD_HOOK_RESPONSE);
}

// Entry Point
let input = '';
stdin.on('data', (chunk) => input += chunk);
stdin.on('end', async () => {
  const parsed = input ? JSON.parse(input) : undefined;
  await saveHook(parsed);
});
