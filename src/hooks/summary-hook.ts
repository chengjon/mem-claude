/**
 * Summary Hook - Stop
 *
 * Pure HTTP client - sends data to worker, worker handles all database operations
 * including privacy checks. This allows the hook to run under any runtime
 * (Node.js or Bun) since it has no native module dependencies.
 *
 * Transcript parsing stays in the hook because only the hook has access to
 * the transcript file path.
 * 
 * Enhanced with unified error handling system for better reliability and debugging.
 */

import { stdin } from 'process';
import { STANDARD_HOOK_RESPONSE } from './hook-response.js';
import { logger } from '../utils/logger.js';
import { ensureWorkerRunning, getWorkerPort } from '../shared/worker-utils.js';
import { HOOK_TIMEOUTS } from '../shared/hook-constants.js';
import { errorHandler, ErrorType, ErrorSeverity, ErrorAction } from '../utils/error-handler.js';
import { extractLastMessage } from '../shared/transcript-parser.js';

export interface StopInput {
  session_id: string;
  cwd: string;
  transcript_path: string;
}

/**
 * Summary Hook Main Logic - Fire-and-forget HTTP client
 */
async function summaryHook(input?: StopInput): Promise<void> {
  if (!input) {
    throw new Error('summaryHook requires input');
  }

  const { session_id, transcript_path, cwd } = input;

  // Ensure worker is running before any other logic with enhanced error handling
  const workerResult = await errorHandler.wrapAsync(
    async () => await ensureWorkerRunning(),
    'HOOK',
    'ensureWorkerRunning',
    { sessionId: session_id }
  );

  if (workerResult === null) {
    logger.warn('HOOK', 'Worker not available, skipping summary generation', {
      sessionId: session_id,
      cwd
    });
    console.log(STANDARD_HOOK_RESPONSE);
    return;
  }

  const port = getWorkerPort();

  // Validate required fields before processing
  if (!transcript_path) {
    throw new Error(`Missing transcript_path in Stop hook input for session ${session_id}`);
  }

  // Extract last user AND assistant messages from transcript
  const lastUserMessage = extractLastMessage(transcript_path, 'user');
  const lastAssistantMessage = extractLastMessage(transcript_path, 'assistant', true);

  logger.dataIn('HOOK', 'Stop: Requesting summary', {
    workerPort: port,
    hasLastUserMessage: !!lastUserMessage,
    hasLastAssistantMessage: !!lastAssistantMessage,
    sessionId: session_id,
    cwd
  });

  // Stop processing spinner function with enhanced error handling
  const stopSpinner = async () => {
    try {
      const spinnerResponse = await fetch(`http://127.0.0.1:${port}/api/processing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isProcessing: false }),
        signal: AbortSignal.timeout(2000)
      });
      
      if (!spinnerResponse.ok) {
        logger.warn('HOOK', 'Failed to stop spinner', { 
          status: spinnerResponse.status,
          sessionId: session_id 
        });
      } else {
        logger.debug('HOOK', 'Spinner stopped successfully', { sessionId: session_id });
      }
    } catch (error: any) {
      logger.warn('HOOK', 'Could not stop spinner', { 
        error: error.message,
        sessionId: session_id 
      });
    }
  };

  // Use standardized error handling for the main operation
  const result = await errorHandler.wrapAsync(async () => {
    // Send to worker - worker handles privacy check and database operations
    const response = await fetch(`http://127.0.0.1:${port}/api/sessions/summarize`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'claude-mem-summary-hook',
        'X-Session-ID': session_id
      },
      body: JSON.stringify({
        claudeSessionId: session_id,
        last_user_message: lastUserMessage,
        last_assistant_message: lastAssistantMessage,
        cwd: cwd
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
          hookName: 'summary',
          operation: 'Summary generation',
          sessionId: session_id,
          port,
          statusCode: response.status,
          statusText: response.statusText,
          hasUserMessage: !!lastUserMessage,
          hasAssistantMessage: !!lastAssistantMessage
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

    logger.debug('HOOK', 'Summary request sent successfully', {
      sessionId: session_id,
      hasUserMessage: !!lastUserMessage,
      hasAssistantMessage: !!lastAssistantMessage
    });
  }, 'HOOK', 'summaryHook', {
    sessionId: session_id,
    cwd,
    transcriptPath: transcript_path
  });

  // Stop spinner regardless of main operation result
  await stopSpinner();

  // If main operation failed, log and continue (fire-and-forget pattern)
  if (result === null) {
    logger.warn('HOOK', 'Summary generation failed, continuing anyway', {
      sessionId: session_id,
      cwd
    });
  }

  console.log(STANDARD_HOOK_RESPONSE);
}

// Entry Point
let input = '';
stdin.on('data', (chunk) => input += chunk);
stdin.on('end', async () => {
  const parsed = input ? JSON.parse(input) : undefined;
  await summaryHook(parsed);
});
