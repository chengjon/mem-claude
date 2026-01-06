import { Database } from 'bun:sqlite';
import { logger } from '../../utils/logger.js';
import type {
  ConversationSummary,
  ContentTag,
  ConversationTag,
  AnalysisTask,
  CreateSummaryRequest,
  CreateTagRequest,
  CreateAnalysisTaskRequest,
  TagConversationRequest
} from '../../types/enhancement.js';

export class EnhancementService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  // ==================== Conversation Summaries ====================

  createSummary(request: CreateSummaryRequest): ConversationSummary {
    const now = new Date().toISOString();
    const nowEpoch = Date.now();

    const result = this.db.prepare(`
      INSERT INTO conversation_summaries (
        sdk_session_id, project, summary_type, content, keywords, key_points,
        summary_length, created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      request.sdk_session_id,
      request.project,
      request.summary_type,
      request.content,
      request.keywords || null,
      request.key_points || null,
      request.content.length,
      now,
      nowEpoch
    );

    const id = Number(result.lastInsertRowid);
    return this.getSummaryById(id)!;
  }

  getSummaryById(id: number): ConversationSummary | null {
    return this.db.prepare('SELECT * FROM conversation_summaries WHERE id = ?').get(id) as ConversationSummary | null;
  }

  getSummariesBySession(sessionId: string): ConversationSummary[] {
    return this.db.prepare(
      'SELECT * FROM conversation_summaries WHERE sdk_session_id = ? ORDER BY created_at_epoch DESC'
    ).all(sessionId) as ConversationSummary[];
  }

  searchSummaries(
    project?: string,
    query?: string,
    summary_type?: string,
    limit: number = 20,
    offset: number = 0
  ): ConversationSummary[] {
    let sql = 'SELECT * FROM conversation_summaries WHERE 1=1';
    const params: string[] = [];

    if (project) {
      sql += ' AND project = ?';
      params.push(project);
    }

    if (query) {
      sql += ' AND (content LIKE ? OR keywords LIKE ? OR key_points LIKE ?)';
      const likeQuery = `%${query}%`;
      params.push(likeQuery, likeQuery, likeQuery);
    }

    if (summary_type) {
      sql += ' AND summary_type = ?';
      params.push(summary_type);
    }

    sql += ' ORDER BY created_at_epoch DESC LIMIT ? OFFSET ?';
    params.push(limit.toString(), offset.toString());

    return this.db.prepare(sql).all(...params) as ConversationSummary[];
  }

  updateSummary(id: number, content: string): boolean {
    const now = new Date().toISOString();
    const nowEpoch = Date.now();

    const result = this.db.prepare(`
      UPDATE conversation_summaries
      SET content = ?, summary_length = ?, updated_at = ?, updated_at_epoch = ?
      WHERE id = ?
    `).run(content, content.length, now, nowEpoch, id);

    return result.changes > 0;
  }

  deleteSummary(id: number): boolean {
    const result = this.db.prepare('DELETE FROM conversation_summaries WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // ==================== Content Tags ====================

  createTag(request: CreateTagRequest): ContentTag {
    const now = new Date().toISOString();

    const result = this.db.prepare(`
      INSERT INTO content_tags (
        tag_name, tag_category, parent_tag_id, description, color_code, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      request.tag_name,
      request.tag_category || null,
      request.parent_tag_id || null,
      request.description || null,
      request.color_code || null,
      now
    );

    const id = Number(result.lastInsertRowid);
    return this.getTagById(id)!;
  }

  getTagById(id: number): ContentTag | null {
    return this.db.prepare('SELECT * FROM content_tags WHERE id = ?').get(id) as ContentTag | null;
  }

  getTagByName(name: string): ContentTag | null {
    return this.db.prepare('SELECT * FROM content_tags WHERE tag_name = ?').get(name) as ContentTag | null;
  }

  getAllTags(category?: string, limit: number = 100, offset: number = 0): ContentTag[] {
    let sql = 'SELECT * FROM content_tags';
    const params: string[] = [];

    if (category) {
      sql += ' WHERE tag_category = ?';
      params.push(category);
    }

    sql += ' ORDER BY usage_count DESC, tag_name ASC LIMIT ? OFFSET ?';
    params.push(limit.toString(), offset.toString());

    return this.db.prepare(sql).all(...params) as ContentTag[];
  }

  searchTags(query: string, limit: number = 20): ContentTag[] {
    return this.db.prepare(`
      SELECT * FROM content_tags
      WHERE tag_name LIKE ? OR description LIKE ?
      ORDER BY usage_count DESC
      LIMIT ?
    `).all(`%${query}%`, `%${query}%`, limit) as ContentTag[];
  }

  updateTagUsage(tagId: number): void {
    this.db.prepare(`
      UPDATE content_tags SET usage_count = usage_count + 1 WHERE id = ?
    `).run(tagId);
  }

  updateTag(id: number, updates: Partial<CreateTagRequest>): boolean {
    const fields: string[] = [];
    const params: string[] = [];

    if (updates.tag_name !== undefined) {
      fields.push('tag_name = ?');
      params.push(updates.tag_name);
    }
    if (updates.tag_category !== undefined) {
      fields.push('tag_category = ?');
      params.push(updates.tag_category);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      params.push(updates.description);
    }
    if (updates.color_code !== undefined) {
      fields.push('color_code = ?');
      params.push(updates.color_code);
    }

    if (fields.length === 0) return false;

    fields.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    const result = this.db.prepare(`UPDATE content_tags SET ${fields.join(', ')} WHERE id = ?`).run(...params);
    return result.changes > 0;
  }

  deleteTag(id: number): boolean {
    const result = this.db.prepare('DELETE FROM content_tags WHERE id = ?').run(id);
    return result.changes > 0;
  }

  getTagCategories(): string[] {
    const results = this.db.prepare(
      'SELECT DISTINCT tag_category FROM content_tags WHERE tag_category IS NOT NULL ORDER BY tag_category'
    ).all() as { tag_category: string }[];
    return results.map(r => r.tag_category);
  }

  // ==================== Conversation Tags ====================

  tagConversation(request: TagConversationRequest): number {
    const now = new Date().toISOString();
    const nowEpoch = Date.now();
    let taggedCount = 0;

    for (const tagId of request.tag_ids) {
      try {
        this.db.prepare(`
          INSERT INTO conversation_tags (
            sdk_session_id, item_type, item_id, tag_id, is_auto_generated, created_at, created_at_epoch
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          request.sdk_session_id,
          request.item_type,
          request.item_id,
          tagId,
          request.is_auto_generated ? 1 : 0,
          now,
          nowEpoch
        );
        this.updateTagUsage(tagId);
        taggedCount++;
      } catch (e) {
        // Ignore duplicate errors
      }
    }

    return taggedCount;
  }

  getTagsForItem(itemType: string, itemId: number): (ContentTag & { confidence_score: number; is_auto_generated: boolean })[] {
    return this.db.prepare(`
      SELECT ct.*, cvt.confidence_score, cvt.is_auto_generated
      FROM conversation_tags cvt
      JOIN content_tags ct ON cvt.tag_id = ct.id
      WHERE cvt.item_type = ? AND cvt.item_id = ?
      ORDER BY cvt.confidence_score DESC
    `).all(itemType, itemId) as (ContentTag & { confidence_score: number; is_auto_generated: boolean })[];
  }

  removeTag(itemType: string, itemId: number, tagId: number): boolean {
    const result = this.db.prepare(
      'DELETE FROM conversation_tags WHERE item_type = ? AND item_id = ? AND tag_id = ?'
    ).run(itemType, itemId, tagId);
    return result.changes > 0;
  }

  removeAllTagsForItem(itemType: string, itemId: number): boolean {
    const result = this.db.prepare(
      'DELETE FROM conversation_tags WHERE item_type = ? AND item_id = ?'
    ).run(itemType, itemId);
    return result.changes > 0;
  }

  // ==================== Analysis Tasks ====================

  createAnalysisTask(request: CreateAnalysisTaskRequest): AnalysisTask {
    const now = new Date().toISOString();
    const nowEpoch = Date.now();

    const result = this.db.prepare(`
      INSERT INTO analysis_tasks (
        sdk_session_id, task_type, priority, input_data, created_at, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      request.sdk_session_id,
      request.task_type,
      request.priority || 5,
      request.input_data ? JSON.stringify(request.input_data) : null,
      now,
      nowEpoch
    );

    const id = Number(result.lastInsertRowid);
    return this.getAnalysisTaskById(id)!;
  }

  getAnalysisTaskById(id: number): AnalysisTask | null {
    return this.db.prepare('SELECT * FROM analysis_tasks WHERE id = ?').get(id) as AnalysisTask | null;
  }

  getPendingTasks(limit: number = 10): AnalysisTask[] {
    return this.db.prepare(`
      SELECT * FROM analysis_tasks
      WHERE status = 'pending'
      ORDER BY priority DESC, created_at_epoch ASC
      LIMIT ?
    `).all(limit) as AnalysisTask[];
  }

  getTasksBySession(sessionId: string): AnalysisTask[] {
    return this.db.prepare(
      'SELECT * FROM analysis_tasks WHERE sdk_session_id = ? ORDER BY created_at_epoch DESC'
    ).all(sessionId) as AnalysisTask[];
  }

  startTask(taskId: number): boolean {
    const now = new Date().toISOString();

    const result = this.db.prepare(`
      UPDATE analysis_tasks
      SET status = 'processing', started_at = ?
      WHERE id = ? AND status = 'pending'
    `).run(now, taskId);

    return result.changes > 0;
  }

  completeTask(taskId: number, outputData: Record<string, unknown>): boolean {
    const now = new Date().toISOString();

    const result = this.db.prepare(`
      UPDATE analysis_tasks
      SET status = 'completed', output_data = ?, completed_at = ?
      WHERE id = ?
    `).run(JSON.stringify(outputData), now, taskId);

    return result.changes > 0;
  }

  failTask(taskId: number, errorMessage: string): boolean {
    const now = new Date().toISOString();

    const result = this.db.prepare(`
      UPDATE analysis_tasks
      SET status = 'failed', error_message = ?, retry_count = retry_count + 1, completed_at = ?
      WHERE id = ?
    `).run(errorMessage, now, taskId);

    return result.changes > 0;
  }

  retryTask(taskId: number): boolean {
    const result = this.db.prepare(`
      UPDATE analysis_tasks
      SET status = 'pending', started_at = NULL, completed_at = NULL
      WHERE id = ? AND status = 'failed' AND retry_count < max_retries
    `).run(taskId);

    return result.changes > 0;
  }

  deleteTask(taskId: number): boolean {
    const result = this.db.prepare('DELETE FROM analysis_tasks WHERE id = ?').run(taskId);
    return result.changes > 0;
  }

  // ==================== Auto-tagging ====================

  autoTagContent(content: string, existingTags: string[] = []): ContentTag[] {
    const contentLower = content.toLowerCase();
    const words = contentLower.split(/\s+/);
    const bigrams: string[] = [];

    for (let i = 0; i < words.length - 1; i++) {
      bigrams.push(`${words[i]} ${words[i + 1]}`);
    }

    const keywords = [...new Set([...words, ...bigrams])].filter(w => w.length > 3);

    const tagPatterns: Record<string, string[]> = {
      'bugfix': ['bug', 'fix', 'error', 'issue', 'problem', 'crash', 'fail', 'exception'],
      'feature': ['add', 'implement', 'new', 'create', 'introduce', 'feature', 'functionality'],
      'refactor': ['refactor', 'restructure', 'reorganize', 'rewrite', 'improve'],
      'decision': ['decision', 'choose', 'select', 'adopt', 'architecture', 'design'],
      'discovery': ['discover', 'find', 'learn', 'understand', 'explore', 'investigate'],
      'documentation': ['doc', 'comment', 'readme', 'documentation', 'explain'],
      'testing': ['test', 'spec', 'verify', 'validate', 'coverage', 'unit'],
      'optimization': ['optimize', 'performance', 'speed', 'efficient', 'cache', 'memory'],
      'security': ['security', 'auth', 'permission', 'access', 'token', 'secure'],
      'frontend': ['ui', 'react', 'component', 'css', 'html', 'browser', 'dom'],
      'backend': ['api', 'server', 'database', 'sql', 'endpoint', 'request'],
      'database': ['query', 'table', 'schema', 'migration', 'index', 'sqlite'],
      'api': ['endpoint', 'rest', 'graphql', 'http', 'request', 'response']
    };

    const matchedTags: ContentTag[] = [];

    for (const [tagName, patterns] of Object.entries(tagPatterns)) {
      const matches = patterns.filter(p => contentLower.includes(p));
      if (matches.length > 0) {
        const tag = this.getTagByName(tagName);
        if (tag && !existingTags.includes(tagName)) {
          matchedTags.push(tag);
        }
      }
    }

    return matchedTags;
  }

  // ==================== Summary Generation ====================

  generateAutoSummary(
    observations: Array<{ type: string; content: string; created_at: string }>,
    prompt?: string
  ): string {
    if (observations.length === 0) {
      return 'No observations recorded for this session.';
    }

    const typeCounts: Record<string, number> = {};
    const decisions: string[] = [];
    const changes: string[] = [];
    const discoveries: string[] = [];

    for (const obs of observations) {
      typeCounts[obs.type] = (typeCounts[obs.type] || 0) + 1;

      if (obs.type === 'decision') {
        decisions.push(obs.content.substring(0, 200));
      } else if (obs.type === 'change' || obs.type === 'bugfix') {
        changes.push(obs.content.substring(0, 200));
      } else if (obs.type === 'discovery') {
        discoveries.push(obs.content.substring(0, 200));
      }
    }

    let summary = `Session summary based on ${observations.length} observations.\n\n`;

    if (Object.keys(typeCounts).length > 0) {
      summary += 'Activity breakdown:\n';
      for (const [type, count] of Object.entries(typeCounts)) {
        summary += `  - ${type}: ${count}\n`;
      }
      summary += '\n';
    }

    if (decisions.length > 0) {
      summary += `Key decisions (${decisions.length}):\n`;
      decisions.slice(0, 3).forEach(d => {
        summary += `  - ${d}\n`;
      });
      summary += '\n';
    }

    if (changes.length > 0) {
      summary += `Changes made (${changes.length}):\n`;
      changes.slice(0, 3).forEach(c => {
        summary += `  - ${c}\n`;
      });
      summary += '\n';
    }

    if (discoveries.length > 0) {
      summary += `Discoveries (${discoveries.length}):\n`;
      discoveries.slice(0, 3).forEach(d => {
        summary += `  - ${d}\n`;
      });
    }

    if (prompt) {
      summary += `\nBased on: ${prompt}`;
    }

    return summary;
  }
}
