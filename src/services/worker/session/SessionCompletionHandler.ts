/**
 * Session Completion Handler
 *
 * Consolidates session completion logic to eliminate duplication across
 * three different completion endpoints (DELETE, POST by DB ID, POST by Claude ID).
 *
 * All completion flows follow the same pattern:
 * 1. Process any remaining pending messages
 * 2. Delete session from SessionManager (aborts SDK agent)
 * 3. Mark session complete in database
 * 4. Broadcast session completed event
 */

import { SessionManager } from '../SessionManager.js';
import { DatabaseManager } from '../DatabaseManager.js';
import { SessionEventBroadcaster } from '../events/SessionEventBroadcaster.js';
import { logger } from '../../../utils/logger.js';
import type { PersistentPendingMessage } from '../../sqlite/PendingMessageStore.js';

export class SessionCompletionHandler {
  constructor(
    private sessionManager: SessionManager,
    private dbManager: DatabaseManager,
    private eventBroadcaster: SessionEventBroadcaster
  ) {}

  /**
   * Process all pending messages for a session before completion
   * This ensures observations and summaries are generated even if the SDK agent exited early
   */
  private async processPendingMessages(sessionDbId: number): Promise<void> {
    const pendingStore = this.sessionManager.getPendingMessageStore();
    const pendingMessages = pendingStore.getAllPending(sessionDbId);

    if (pendingMessages.length === 0) {
      return;
    }

    logger.info('SESSION', `Processing ${pendingMessages.length} pending messages before completion`, {
      sessionId: sessionDbId,
      messageTypes: [...new Set(pendingMessages.map((m: PersistentPendingMessage) => m.message_type))]
    });

    for (const msg of pendingMessages) {
      if (msg.message_type === 'observation' && msg.tool_name && msg.tool_response) {
        try {
          const store = this.dbManager.getSessionStore();
          const dbSession = store.getSessionById(sessionDbId);

          if (!dbSession) {
            logger.warn('SESSION', `Session not found for pending message`, {
              sessionId: sessionDbId,
              messageId: msg.id
            });
            continue;
          }

          let toolOutput = '';
          try {
            const response = JSON.parse(msg.tool_response || '{}');
            toolOutput = response.stdout || response.stderr || JSON.stringify(response);
          } catch {
            toolOutput = msg.tool_response || '';
          }

          const observation = {
            type: 'change' as const,
            title: `Tool: ${msg.tool_name}`,
            subtitle: toolOutput.substring(0, 100),
            facts: [],
            narrative: toolOutput,
            concepts: [],
            files_read: [],
            files_modified: []
          };

          store.storeObservation(
            dbSession.claude_session_id,
            dbSession.project,
            observation,
            msg.prompt_number || undefined,
            0
          );

          pendingStore.markProcessed(msg.id);

          logger.info('SESSION', `Processed pending observation`, {
            sessionId: sessionDbId,
            tool: msg.tool_name,
            observationId: msg.id
          });
        } catch (error) {
          logger.error('SESSION', 'Failed to process pending observation', {
            sessionId: sessionDbId,
            messageId: msg.id
          }, error as Error);
        }
      } else if (msg.message_type === 'summarize') {
        pendingStore.markProcessed(msg.id);
        logger.info('SESSION', `Skipped pending summarize message`, {
          sessionId: sessionDbId,
          messageId: msg.id
        });
      }
    }
  }

  async completeByDbId(sessionDbId: number): Promise<void> {
    await this.processPendingMessages(sessionDbId);
    await this.sessionManager.deleteSession(sessionDbId);
    this.dbManager.markSessionComplete(sessionDbId);
    this.eventBroadcaster.broadcastSessionCompleted(sessionDbId);
  }

  async completeByClaudeId(claudeSessionId: string): Promise<boolean> {
    const store = this.dbManager.getSessionStore();
    const session = store.findActiveSDKSession(claudeSessionId);

    if (!session) {
      // Check if there are pending messages for this session
      // Query the database directly to find any session with this claude_session_id
      const stmt = store.db.prepare(`
        SELECT id FROM sdk_sessions WHERE claude_session_id = ? LIMIT 1
      `);
      const dbSession = stmt.get(claudeSessionId) as { id: number } | undefined;
      if (dbSession) {
        logger.info('SESSION', `Found completed session with potential orphaned messages`, {
          claudeSessionId,
          sessionId: dbSession.id
        });
        await this.processPendingMessages(dbSession.id);
      }
      return false;
    }

    await this.completeByDbId(session.id);
    return true;
  }
}
