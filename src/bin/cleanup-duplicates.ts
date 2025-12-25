#!/usr/bin/env node
/**
 * Cleanup duplicate observations and summaries from the database
 * Keeps the earliest entry (MIN(id)) for each duplicate group
 */

import { SessionStore } from '../services/sqlite/SessionStore.js';
import { logger } from '../utils/logger.js';

function main() {
  logger.info('SYSTEM', 'Starting duplicate cleanup...\n');

  const db = new SessionStore();

  // Find and delete duplicate observations
  logger.info('SYSTEM', 'Finding duplicate observations...');

  const duplicateObsQuery = db['db'].prepare(`
    SELECT sdk_session_id, title, subtitle, type, COUNT(*) as count, GROUP_CONCAT(id) as ids
    FROM observations
    GROUP BY sdk_session_id, title, subtitle, type
    HAVING count > 1
  `);

  const duplicateObs = duplicateObsQuery.all() as Array<{
    sdk_session_id: string;
    title: string;
    subtitle: string;
    type: string;
    count: number;
    ids: string;
  }>;

  logger.info('SYSTEM', `Found ${duplicateObs.length} duplicate observation groups\n`);

  let deletedObs = 0;
  for (const dup of duplicateObs) {
    const ids = dup.ids.split(',').map(id => parseInt(id, 10));
    const keepId = Math.min(...ids);
    const deleteIds = ids.filter(id => id !== keepId);

    logger.info('SYSTEM', `Observation "${dup.title.substring(0, 60)}..."`);
    logger.info('SYSTEM', `  Found ${dup.count} copies, keeping ID ${keepId}, deleting ${deleteIds.length} duplicates`);

    // SECURITY: Use parameterized query to prevent SQL injection
    if (deleteIds.length > 0) {
      const placeholders = deleteIds.map(() => '?').join(',');
      const deleteStmt = db['db'].prepare(`DELETE FROM observations WHERE id IN (${placeholders})`);
      deleteStmt.run(...deleteIds);
      deletedObs += deleteIds.length;
    }
  }

  // Find and delete duplicate summaries
  logger.info('SYSTEM', '\n\nFinding duplicate summaries...');

  const duplicateSumQuery = db['db'].prepare(`
    SELECT sdk_session_id, request, completed, learned, COUNT(*) as count, GROUP_CONCAT(id) as ids
    FROM session_summaries
    GROUP BY sdk_session_id, request, completed, learned
    HAVING count > 1
  `);

  const duplicateSum = duplicateSumQuery.all() as Array<{
    sdk_session_id: string;
    request: string;
    completed: string;
    learned: string;
    count: number;
    ids: string;
  }>;

  logger.info('SYSTEM', `Found ${duplicateSum.length} duplicate summary groups\n`);

  let deletedSum = 0;
  for (const dup of duplicateSum) {
    const ids = dup.ids.split(',').map(id => parseInt(id, 10));
    const keepId = Math.min(...ids);
    const deleteIds = ids.filter(id => id !== keepId);

    logger.info('SYSTEM', `Summary "${dup.request.substring(0, 60)}..."`);
    logger.info('SYSTEM', `  Found ${dup.count} copies, keeping ID ${keepId}, deleting ${deleteIds.length} duplicates`);

    // SECURITY: Use parameterized query to prevent SQL injection
    if (deleteIds.length > 0) {
      const placeholders = deleteIds.map(() => '?').join(',');
      const deleteStmt = db['db'].prepare(`DELETE FROM session_summaries WHERE id IN (${placeholders})`);
      deleteStmt.run(...deleteIds);
      deletedSum += deleteIds.length;
    }
  }

  db.close();

  logger.info('SYSTEM', '\n' + '='.repeat(60));
  logger.success('SYSTEM', 'Cleanup Complete!');
  logger.info('SYSTEM', '='.repeat(60));
  logger.info('SYSTEM', `🗑️  Deleted: ${deletedObs} duplicate observations`);
  logger.info('SYSTEM', `🗑️  Deleted: ${deletedSum} duplicate summaries`);
  logger.info('SYSTEM', `🗑️  Total: ${deletedObs + deletedSum} duplicates removed`);
  logger.info('SYSTEM', '='.repeat(60));
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
