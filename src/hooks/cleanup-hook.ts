/**
 * Cleanup Hook - SessionEnd
 *
 * Pure HTTP client - sends data to worker, worker handles all database operations.
 * This allows the hook to run under any runtime (Node.js or Bun) since it has no
 * native module dependencies.
 * 
 * Enhanced with unified error handling system for better reliability and debugging.
 */

import { stdin } from 'process';
import { ensureWorkerRunning, getWorkerPort } from '../shared/worker-utils.js';
import { HOOK_TIMEOUTS } from '../shared/hook-constants.js';
import { logger } from '../utils/logger.js';
import { errorHandler, ErrorType, ErrorSeverity, ErrorAction } from '../utils/error-handler.js';

export interface SessionEndInput {
  session_id: string;
  reason: 'exit' | 'clear' | 'logout' | 'prompt_input_exit' | 'other';
}

/**
 * Cleanup Hook Main Logic - Fire-and-forget HTTP client
 */
async function cleanupHook(input?: SessionEndInput): Promise<void> {
  if (!input) {
    throw new Error('cleanup-hook requires input from Claude Code');
  }

  const { session_id, reason } = input;

  // Ensure worker is running before any other logic with enhanced error handling
  const workerResult = await errorHandler.wrapAsync(
    async () => await ensureWorkerRunning(),
    'HOOK',
    'ensureWorkerRunning',
    { sessionId: session_id, reason }
  );

  // Worker not available - log but continue (cleanup hook should be resilient)
  if (workerResult === null) {
    logger.debug('HOOK', 'Worker not available for session cleanup', {
      sessionId: session_id,
      reason
    });
    logger.info('HOOK', '{"continue": true, "suppressOutput": true}');
    process.exit(0);
    return;
  }

  const port = getWorkerPort();

  // Send cleanup notification with standardized error handling
  const result = await errorHandler.wrapAsync(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/api/sessions/complete`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'mem-claude-cleanup-hook',
        'X-Session-ID': session_id
      },
      body: JSON.stringify({
        claudeSessionId: session_id,
        reason,
        timestamp: new Date().toISOString()
      }),
      signal: AbortSignal.timeout(HOOK_TIMEOUTS.DEFAULT)
    });

    if (!response.ok) {
      // For cleanup hooks, non-2xx responses are non-fatal
      // Session might not exist or already be cleaned up
      const errorText = await response.text();
      
      logger.debug('HOOK', 'Session cleanup response indicates session not found', {
        sessionId: session_id,
        reason,
        statusCode: response.status,
        statusText: response.statusText
      });
      
      // Non-fatal error - session cleanup is best-effort
      const cleanupError = errorHandler.handle(
        new Error(`HTTP ${response.status}: ${errorText}`),
        'HOOK',
        {
          hookName: 'cleanup',
          operation: 'Session completion notification',
          sessionId: session_id,
          reason,
          port,
          statusCode: response.status,
          statusText: response.statusText
        }
      );
      
      // Mark as non-critical for cleanup operations
      cleanupError.severity = ErrorSeverity.LOW;
      cleanupError.action = ErrorAction.IGNORE;
      
      // Don't throw for cleanup operations - they're best-effort
      return null;
    }

    logger.debug('HOOK', 'Session cleanup notification sent successfully', {
      sessionId: session_id,
      reason,
      port
    });
    
    return true;
  }, 'HOOK', 'cleanupHook', {
    sessionId: session_id,
    reason,
    port
  });

  // Log cleanup result (success or failure is okay)
  if (result === null) {
    // Session not found or already cleaned up - this is expected
    logger.debug('HOOK', 'Session cleanup skipped (not found or already completed)', {
      sessionId: session_id,
      reason
    });
  } else {
    logger.debug('HOOK', 'Session cleanup completed successfully', {
      sessionId: session_id,
      reason
    });
  }

  logger.info('HOOK', '{"continue": true, "suppressOutput": true}');
  process.exit(0);
}

// Entry Point
if (stdin.isTTY) {
  // Running manually
  cleanupHook(undefined).catch((error) => {
    logger.error('HOOK', 'Cleanup hook failed in manual mode', { error: error.message });
    logger.info('HOOK', '{"continue": true, "suppressOutput": true}');
    process.exit(0);
  });
} else {
  let input = '';
  stdin.on('data', (chunk) => input += chunk);
  stdin.on('end', async () => {
    try {
      const parsed = input ? JSON.parse(input) : undefined;
      await cleanupHook(parsed);
    } catch (error: any) {
      logger.error('HOOK', 'Cleanup hook failed in pipeline mode', { 
        error: error.message,
        sessionId: input?.session_id 
      });
      // Always exit successfully for cleanup hooks
      logger.info('HOOK', '{"continue": true, "suppressOutput": true}');
      process.exit(0);
    }
  });
}
