/**
 * Context Hook - SessionStart
 *
 * Pure HTTP client - calls worker to generate context.
 * This allows the hook to run under any runtime (Node.js or Bun) since it has no
 * native module dependencies.
 * 
 * Enhanced with unified error handling system for better reliability and debugging.
 */

import { stdin } from "process";
import { ensureWorkerRunning, getWorkerPort } from "../shared/worker-utils.js";
import { HOOK_TIMEOUTS } from "../shared/hook-constants.js";
import { logger } from "../utils/logger.js";
import { errorHandler, ErrorType, ErrorSeverity, ErrorAction } from "../utils/error-handler.js";
import { getProjectName } from "../utils/project-name.js";

export interface SessionStartInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  hook_event_name?: string;
}

async function contextHook(input?: SessionStartInput): Promise<string> {
  // Ensure worker is running before any other logic with enhanced error handling
  const workerResult = await errorHandler.wrapAsync(
    async () => await ensureWorkerRunning(),
    'HOOK',
    'ensureWorkerRunning',
    { sessionId: input?.session_id }
  );

  if (workerResult === null) {
    logger.warn('HOOK', 'Worker not available for context generation', {
      sessionId: input?.session_id,
      cwd: input?.cwd ?? process.cwd()
    });
    return ''; // Return empty context if worker unavailable
  }

  const cwd = input?.cwd ?? process.cwd();
  const project = getProjectName(cwd);
  const port = getWorkerPort();

  logger.debug('HOOK', 'Context generation request', {
    project,
    port,
    sessionId: input?.session_id,
    cwd
  });

  const url = `http://127.0.0.1:${port}/api/context/inject?project=${encodeURIComponent(project)}`;

  // Use standardized error handling for the entire operation
  const result = await errorHandler.wrapAsync(async () => {
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(HOOK_TIMEOUTS.DEFAULT),
      headers: {
        'User-Agent': 'mem-claude-context-hook',
        'X-Session-ID': input?.session_id || 'unknown'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Create standardized error for HTTP failures
      const httpError = errorHandler.handle(
        new Error(`HTTP ${response.status}: ${errorText}`),
        'HOOK',
        {
          hookName: 'context',
          operation: 'Context generation',
          project,
          port,
          sessionId: input?.session_id,
          statusCode: response.status,
          statusText: response.statusText,
          url
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

    const result = await response.text();
    logger.debug('HOOK', 'Context generation successful', {
      project,
      contextLength: result.length,
      sessionId: input?.session_id
    });
    
    return result.trim();
  }, 'HOOK', 'contextHook', {
    sessionId: input?.session_id,
    project,
    cwd,
    port
  });

  if (result === null) {
    logger.warn('HOOK', 'Context generation failed, returning empty context', {
      sessionId: input?.session_id,
      project
    });
    return ''; // Graceful degradation
  }

  return result;
}

// Entry Point - handle stdin/stdout
const forceColors = process.argv.includes("--colors");

if (stdin.isTTY || forceColors) {
  contextHook(undefined).then((text) => {
    logger.info('HOOK', text);
    process.exit(0);
  }).catch((error) => {
    logger.error('HOOK', 'Context hook failed in TTY mode', { error: error.message });
    logger.info('HOOK', ''); // Output empty context on failure
    process.exit(0); // Always exit successfully for context hooks
  });
} else {
  let input = "";
  stdin.on("data", (chunk) => (input += chunk));
  stdin.on("end", async () => {
    try {
      const parsed = input.trim() ? JSON.parse(input) : undefined;
      const text = await contextHook(parsed);

      logger.info('HOOK', 
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "SessionStart",
            additionalContext: text,
          },
        })
      );
      process.exit(0);
    } catch (error: any) {
      logger.error('HOOK', 'Context hook failed in pipeline mode', { 
        error: error.message,
        sessionId: input?.session_id 
      });
      // Output empty context on error to maintain compatibility
      logger.info('HOOK', 
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "SessionStart",
            additionalContext: "",
          },
        })
      );
      process.exit(0); // Always exit successfully for context hooks
    }
  });
}
