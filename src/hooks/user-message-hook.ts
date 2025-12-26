/**
 * User Message Hook - SessionStart
 * Displays context information to the user via stderr
 *
 * This hook runs in parallel with context-hook to show users what context
 * has been loaded into their session. Uses stderr as the communication channel
 * since it's currently the only way to display messages in Claude Code UI.
 * 
 * Enhanced with unified error handling system for better reliability and debugging.
 */
import { basename } from "path";
import { ensureWorkerRunning, getWorkerPort } from "../shared/worker-utils.js";
import { HOOK_EXIT_CODES } from "../shared/hook-constants.js";
import { getWorkerRestartInstructions } from "../utils/error-messages.js";
import { logger } from "../utils/logger.js";
import { errorHandler, ErrorType, ErrorSeverity, ErrorAction } from "../utils/error-handler.js";

async function userMessageHook(): Promise<void> {
  const project = basename(process.cwd());

  // Ensure worker is running with enhanced error handling
  const workerResult = await errorHandler.wrapAsync(
    async () => await ensureWorkerRunning(),
    'HOOK',
    'ensureWorkerRunning',
    { project }
  );

  if (workerResult === null) {
    // Worker not available - show first-time setup message
    logger.debug('HOOK', 'Worker not available, showing first-time setup message', { project });
    showFirstTimeSetupMessage();
    return;
  }

  const port = getWorkerPort();

  // Fetch formatted context directly from worker API
  const contextResult = await errorHandler.wrapAsync(async () => {
    const response = await fetch(
      `http://127.0.0.1:${port}/api/context/inject?project=${encodeURIComponent(project)}&colors=true`,
      { 
        method: 'GET', 
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'mem-claude-user-message-hook',
          'X-Project': project
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      
      // Create standardized error for HTTP failures
      const httpError = errorHandler.handle(
        new Error(`HTTP ${response.status}: ${errorText}`),
        'HOOK',
        {
          hookName: 'user-message',
          operation: 'Context fetch',
          project,
          port,
          statusCode: response.status,
          statusText: response.statusText
        }
      );
      
      // For user message hook, we handle errors gracefully
      httpError.severity = ErrorSeverity.LOW;
      httpError.action = ErrorAction.IGNORE;
      
      throw httpError;
    }

    const output = await response.text();
    logger.debug('HOOK', 'Context fetched successfully for user display', {
      project,
      contextLength: output.length,
      port
    });
    
    return output;
  }, 'HOOK', 'userMessageHook', {
    project,
    port
  });

  if (contextResult === null) {
    // Context fetch failed - show first-time setup message
    logger.warn('HOOK', 'Context fetch failed, showing first-time setup message', { project });
    showFirstTimeSetupMessage();
    return;
  }

  // Display successful context message
  showContextLoadedMessage(contextResult, port, project);
}

function showContextLoadedMessage(context: string, port: number, project: string): void {
  logger.error('HOOK', 
    "\n\n📝 Claude-Mem Context Loaded\n" +
    "   ℹ️  Note: This appears as stderr but is informational only\n\n" +
    context +
    "\n\n💡 New! Wrap all or part of any message with <private> ... </private> to prevent storing sensitive information in your observation history.\n" +
    "\n💬 Community https://discord.gg/J4wttp9vDu" +
    `\n📺 Watch live in browser http://localhost:${port}/\n`
  );
}

function showFirstTimeSetupMessage(): void {
  // Context not available yet - likely first run or worker starting up
  logger.error('HOOK', `
---
🎉  Note: This appears under Plugin Hook Error, but it's not an error. That's the only option for
   user messages in Claude Code UI until a better method is provided.
---

⚠️  Claude-Mem: First-Time Setup

Dependencies are installing in the background. This only happens once.

💡 TIPS:
   • Memories will start generating while you work
   • Use /init to write or update your CLAUDE.md for better project context
   • Try /clear after one session to see what context looks like

Thank you for installing Claude-Mem!

This message was not added to your startup context, so you can continue working as normal.
`);
}

// Execute hook with error handling
try {
  await userMessageHook();
} catch (error: any) {
  // Log the error but don't crash - user message hook should always succeed
  logger.error('HOOK', 'User message hook failed, showing fallback message', {
    error: error.message,
    project: basename(process.cwd())
  });
  showFirstTimeSetupMessage();
}

process.exit(HOOK_EXIT_CODES.USER_MESSAGE_ONLY);