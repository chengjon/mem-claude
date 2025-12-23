import { stdin } from 'process';
import { STANDARD_HOOK_RESPONSE } from './hook-response.js';
import { ensureWorkerRunning, getWorkerPort } from '../shared/worker-utils.js';
import { logger } from '../utils/logger.js';
import { errorHandler, ErrorType, ErrorSeverity, ErrorAction } from '../utils/error-handler.js';
import { getProjectName } from '../utils/project-name.js';

export interface UserPromptSubmitInput {
  session_id: string;
  cwd: string;
  prompt: string;
}

/**
 * New Hook Main Logic
 * 
 * Enhanced with unified error handling system for better reliability and debugging.
 */
async function newHook(input?: UserPromptSubmitInput): Promise<void> {
  if (!input) {
    throw new Error('newHook requires input');
  }

  const { session_id, cwd, prompt } = input;
  const project = getProjectName(cwd);

  // Ensure worker is running before any other logic with enhanced error handling
  const workerResult = await errorHandler.wrapAsync(
    async () => await ensureWorkerRunning(),
    'HOOK',
    'ensureWorkerRunning',
    { sessionId: session_id }
  );

  if (workerResult === null) {
    logger.warn('HOOK', 'Worker not available, skipping session initialization', {
      sessionId: session_id,
      project,
      cwd
    });
    console.log(STANDARD_HOOK_RESPONSE);
    return;
  }

  const port = getWorkerPort();

  // Initialize session via HTTP - handles DB operations and privacy checks
  let sessionDbId: number;
  let promptNumber: number;

  // First API call: Initialize session
  const initResult = await errorHandler.wrapAsync(async () => {
    const initResponse = await fetch(`http://127.0.0.1:${port}/api/sessions/init`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'claude-mem-new-hook',
        'X-Session-ID': session_id
      },
      body: JSON.stringify({
        claudeSessionId: session_id,
        project,
        prompt,
        cwd
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (!initResponse.ok) {
      const errorText = await initResponse.text();
      
      // Create standardized error for HTTP failures
      const httpError = errorHandler.handle(
        new Error(`HTTP ${initResponse.status}: ${errorText}`),
        'HOOK',
        {
          hookName: 'new',
          operation: 'Session initialization',
          project,
          port,
          sessionId: session_id,
          statusCode: initResponse.status,
          statusText: initResponse.statusText
        }
      );
      
      // Set appropriate action based on status code
      if (initResponse.status >= 500) {
        httpError.action = ErrorAction.RETRY;
      } else if (initResponse.status >= 400) {
        httpError.action = ErrorAction.ABORT;
      }
      
      throw httpError;
    }

    const result = await initResponse.json();
    logger.debug('HOOK', 'Session initialized successfully', {
      sessionId: session_id,
      sessionDbId: result.sessionDbId,
      promptNumber: result.promptNumber,
      project,
      skipped: result.skipped
    });
    
    return result;
  }, 'HOOK', 'newHook-sessionInit', {
    sessionId: session_id,
    project,
    cwd,
    promptLength: prompt.length
  });

  if (initResult === null) {
    logger.warn('HOOK', 'Session initialization failed, continuing anyway', {
      sessionId: session_id,
      project
    });
    console.log(STANDARD_HOOK_RESPONSE);
    return;
  }

  sessionDbId = initResult.sessionDbId;
  promptNumber = initResult.promptNumber;

  // Check if prompt was entirely private (worker performs privacy check)
  if (initResult.skipped && initResult.reason === 'private') {
    console.error(`[new-hook] Session ${sessionDbId}, prompt #${promptNumber} (fully private - skipped)`);
    console.log(STANDARD_HOOK_RESPONSE);
    return;
  }

  console.error(`[new-hook] Session ${sessionDbId}, prompt #${promptNumber}`);

  // Strip leading slash from commands for memory agent
  // /review 101 → review 101 (more semantic for observations)
  const cleanedPrompt = prompt.startsWith('/') ? prompt.substring(1) : prompt;

  // Second API call: Initialize SDK agent session
  const agentResult = await errorHandler.wrapAsync(async () => {
    const response = await fetch(`http://127.0.0.1:${port}/sessions/${sessionDbId}/init`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'User-Agent': 'claude-mem-new-hook',
        'X-Session-ID': session_id
      },
      body: JSON.stringify({ 
        userPrompt: cleanedPrompt, 
        promptNumber,
        sessionDbId,
        project 
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Create standardized error for HTTP failures
      const httpError = errorHandler.handle(
        new Error(`HTTP ${response.status}: ${errorText}`),
        'HOOK',
        {
          hookName: 'new',
          operation: 'SDK agent start',
          project,
          port,
          sessionId: String(sessionDbId),
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

    logger.debug('HOOK', 'SDK agent started successfully', {
      sessionDbId,
      promptNumber,
      project,
      cleanedPromptLength: cleanedPrompt.length
    });
    
    return true;
  }, 'HOOK', 'newHook-agentInit', {
    sessionId: session_id,
    sessionDbId,
    promptNumber,
    project,
    cleanedPromptLength: cleanedPrompt.length
  });

  if (agentResult === null) {
    logger.warn('HOOK', 'SDK agent initialization failed, but session was created', {
      sessionId: session_id,
      sessionDbId,
      project
    });
  }

  console.log(STANDARD_HOOK_RESPONSE);
}

// Entry Point
let input = '';
stdin.on('data', (chunk) => input += chunk);
stdin.on('end', async () => {
  const parsed = input ? JSON.parse(input) : undefined;
  await newHook(parsed);
});
