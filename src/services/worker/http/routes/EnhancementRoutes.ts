import { Express, Request, Response } from 'express';
import { EnhancementService } from '../../EnhancementService.js';
import { logger } from '../../../../utils/logger.js';

export class EnhancementRoutes {
  private app: Express;
  private enhancementService: EnhancementService;

  constructor(app: Express, enhancementService: EnhancementService) {
    this.app = app;
    this.enhancementService = enhancementService;
    this.registerRoutes();
  }

  private registerRoutes(): void {
    // ==================== Conversation Summaries ====================

    this.app.post('/api/conversation-summaries', this.createConversationSummary.bind(this));
    this.app.get('/api/conversation-summaries/session/:sessionId', this.getSummariesBySession.bind(this));
    this.app.get('/api/conversation-summaries/:id', this.getSummaryById.bind(this));
    this.app.get('/api/conversation-summaries', this.searchSummaries.bind(this));
    this.app.put('/api/conversation-summaries/:id', this.updateSummary.bind(this));
    this.app.delete('/api/conversation-summaries/:id', this.deleteSummary.bind(this));

    // ==================== Content Tags ====================

    this.app.post('/api/tags', this.createTag.bind(this));
    this.app.get('/api/tags/:id', this.getTagById.bind(this));
    this.app.get('/api/tags', this.getAllTags.bind(this));
    this.app.get('/api/tags/search/query', this.searchTags.bind(this));
    this.app.get('/api/tags/categories', this.getTagCategories.bind(this));
    this.app.put('/api/tags/:id', this.updateTag.bind(this));
    this.app.delete('/api/tags/:id', this.deleteTag.bind(this));

    // ==================== Conversation Tags ====================

    this.app.post('/api/conversation-tags', this.tagConversation.bind(this));
    this.app.get('/api/conversation-tags/:itemType/:itemId', this.getTagsForItem.bind(this));
    this.app.delete('/api/conversation-tags/:itemType/:itemId/:tagId', this.removeTag.bind(this));
    this.app.delete('/api/conversation-tags/:itemType/:itemId', this.removeAllTagsForItem.bind(this));

    // ==================== Analysis Tasks ====================

    this.app.post('/api/analysis-tasks', this.createAnalysisTask.bind(this));
    this.app.get('/api/analysis-tasks/:id', this.getAnalysisTaskById.bind(this));
    this.app.get('/api/analysis-tasks/session/:sessionId', this.getTasksBySession.bind(this));
    this.app.get('/api/analysis-tasks/pending', this.getPendingTasks.bind(this));
    this.app.post('/api/analysis-tasks/:id/start', this.startTask.bind(this));
    this.app.post('/api/analysis-tasks/:id/complete', this.completeTask.bind(this));
    this.app.post('/api/analysis-tasks/:id/fail', this.failTask.bind(this));
    this.app.post('/api/analysis-tasks/:id/retry', this.retryTask.bind(this));
    this.app.delete('/api/analysis-tasks/:id', this.deleteTask.bind(this));

    // ==================== Auto-tagging ====================

    this.app.post('/api/auto-tag', this.autoTagContent.bind(this));
    this.app.post('/api/generate-summary', this.generateSummary.bind(this));
  }

  // ==================== Conversation Summaries ====================

  private createConversationSummary(req: Request, res: Response): void {
    try {
      const { sdk_session_id, project, summary_type, content, keywords, key_points } = req.body;

      if (!sdk_session_id || !project || !content || !summary_type) {
        res.status(400).json({ error: 'Missing required fields: sdk_session_id, project, summary_type, content' });
        return;
      }

      const summary = this.enhancementService.createSummary({
        sdk_session_id,
        project,
        summary_type,
        content,
        keywords,
        key_points
      });

      res.status(201).json(summary);
    } catch (error: any) {
      logger.error('ENHANCEMENT', 'Failed to create conversation summary', {}, error.message);
      res.status(500).json({ error: error.message });
    }
  }

  private getSummaryById(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      const summary = this.enhancementService.getSummaryById(id);

      if (!summary) {
        res.status(404).json({ error: 'Summary not found' });
        return;
      }

      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private getSummariesBySession(req: Request, res: Response): void {
    try {
      const { sessionId } = req.params;
      const summaries = this.enhancementService.getSummariesBySession(sessionId);
      res.json(summaries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private searchSummaries(req: Request, res: Response): void {
    try {
      const { project, query, summary_type, limit, offset } = req.query;

      const summaries = this.enhancementService.searchSummaries(
        project as string,
        query as string,
        summary_type as string,
        limit ? parseInt(limit as string) : 20,
        offset ? parseInt(offset as string) : 0
      );

      res.json(summaries);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private updateSummary(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      const { content } = req.body;

      if (!content) {
        res.status(400).json({ error: 'Content is required' });
        return;
      }

      const success = this.enhancementService.updateSummary(id, content);

      if (!success) {
        res.status(404).json({ error: 'Summary not found' });
        return;
      }

      res.json(this.enhancementService.getSummaryById(id));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private deleteSummary(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      const success = this.enhancementService.deleteSummary(id);

      if (!success) {
        res.status(404).json({ error: 'Summary not found' });
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== Content Tags ====================

  private createTag(req: Request, res: Response): void {
    try {
      const { tag_name, tag_category, parent_tag_id, description, color_code } = req.body;

      if (!tag_name) {
        res.status(400).json({ error: 'tag_name is required' });
        return;
      }

      const tag = this.enhancementService.createTag({
        tag_name,
        tag_category,
        parent_tag_id,
        description,
        color_code
      });

      res.status(201).json(tag);
    } catch (error: any) {
      logger.error('ENHANCEMENT', 'Failed to create tag', {}, error.message);
      res.status(500).json({ error: error.message });
    }
  }

  private getTagById(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      const tag = this.enhancementService.getTagById(id);

      if (!tag) {
        res.status(404).json({ error: 'Tag not found' });
        return;
      }

      res.json(tag);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private getAllTags(req: Request, res: Response): void {
    try {
      const { category, limit, offset } = req.query;

      const tags = this.enhancementService.getAllTags(
        category as string,
        limit ? parseInt(limit as string) : 100,
        offset ? parseInt(offset as string) : 0
      );

      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private searchTags(req: Request, res: Response): void {
    try {
      const { query, limit } = req.query;

      if (!query) {
        res.status(400).json({ error: 'query parameter is required' });
        return;
      }

      const tags = this.enhancementService.searchTags(
        query as string,
        limit ? parseInt(limit as string) : 20
      );

      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private getTagCategories(req: Request, res: Response): void {
    try {
      const categories = this.enhancementService.getTagCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private updateTag(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      const { tag_name, tag_category, description, color_code } = req.body;

      const success = this.enhancementService.updateTag(id, {
        tag_name,
        tag_category,
        description,
        color_code
      });

      if (!success) {
        res.status(404).json({ error: 'Tag not found' });
        return;
      }

      res.json(this.enhancementService.getTagById(id));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private deleteTag(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      const success = this.enhancementService.deleteTag(id);

      if (!success) {
        res.status(404).json({ error: 'Tag not found' });
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== Conversation Tags ====================

  private tagConversation(req: Request, res: Response): void {
    try {
      const { sdk_session_id, item_type, item_id, tag_ids, is_auto_generated } = req.body;

      if (!sdk_session_id || !item_type || !item_id || !tag_ids || !Array.isArray(tag_ids)) {
        res.status(400).json({ error: 'Missing required fields: sdk_session_id, item_type, item_id, tag_ids' });
        return;
      }

      const count = this.enhancementService.tagConversation({
        sdk_session_id,
        item_type,
        item_id,
        tag_ids,
        is_auto_generated
      });

      res.status(201).json({ tagged_count: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private getTagsForItem(req: Request, res: Response): void {
    try {
      const { itemType, itemId } = req.params;
      const tags = this.enhancementService.getTagsForItem(itemType, parseInt(itemId));
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private removeTag(req: Request, res: Response): void {
    try {
      const { itemType, itemId, tagId } = req.params;
      const success = this.enhancementService.removeTag(itemType, parseInt(itemId), parseInt(tagId));

      if (!success) {
        res.status(404).json({ error: 'Tag association not found' });
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private removeAllTagsForItem(req: Request, res: Response): void {
    try {
      const { itemType, itemId } = req.params;
      const success = this.enhancementService.removeAllTagsForItem(itemType, parseInt(itemId));

      if (!success) {
        res.status(404).json({ error: 'No tags found for item' });
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== Analysis Tasks ====================

  private createAnalysisTask(req: Request, res: Response): void {
    try {
      const { sdk_session_id, task_type, priority, input_data } = req.body;

      if (!sdk_session_id || !task_type) {
        res.status(400).json({ error: 'Missing required fields: sdk_session_id, task_type' });
        return;
      }

      const task = this.enhancementService.createAnalysisTask({
        sdk_session_id,
        task_type,
        priority,
        input_data
      });

      res.status(201).json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private getAnalysisTaskById(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      const task = this.enhancementService.getAnalysisTaskById(id);

      if (!task) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.json(task);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private getTasksBySession(req: Request, res: Response): void {
    try {
      const { sessionId } = req.params;
      const tasks = this.enhancementService.getTasksBySession(sessionId);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private getPendingTasks(req: Request, res: Response): void {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const tasks = this.enhancementService.getPendingTasks(limit);
      res.json(tasks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private startTask(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      const success = this.enhancementService.startTask(id);

      if (!success) {
        res.status(400).json({ error: 'Task cannot be started (may already be processing or not pending)' });
        return;
      }

      res.json(this.enhancementService.getAnalysisTaskById(id));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private completeTask(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      const { output_data } = req.body;

      if (!output_data) {
        res.status(400).json({ error: 'output_data is required' });
        return;
      }

      const success = this.enhancementService.completeTask(id, output_data);

      if (!success) {
        res.status(400).json({ error: 'Task cannot be completed' });
        return;
      }

      res.json(this.enhancementService.getAnalysisTaskById(id));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private failTask(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      const { error_message } = req.body;

      if (!error_message) {
        res.status(400).json({ error: 'error_message is required' });
        return;
      }

      const success = this.enhancementService.failTask(id, error_message);

      if (!success) {
        res.status(400).json({ error: 'Task cannot be marked as failed' });
        return;
      }

      res.json(this.enhancementService.getAnalysisTaskById(id));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private retryTask(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      const success = this.enhancementService.retryTask(id);

      if (!success) {
        res.status(400).json({ error: 'Task cannot be retried (may have exceeded max retries or not in failed state)' });
        return;
      }

      res.json(this.enhancementService.getAnalysisTaskById(id));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private deleteTask(req: Request, res: Response): void {
    try {
      const id = parseInt(req.params.id);
      const success = this.enhancementService.deleteTask(id);

      if (!success) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }

      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  // ==================== Auto-tagging ====================

  private autoTagContent(req: Request, res: Response): void {
    try {
      const { content, existing_tags } = req.body;

      if (!content) {
        res.status(400).json({ error: 'content is required' });
        return;
      }

      const tags = this.enhancementService.autoTagContent(content, existing_tags || []);
      res.json(tags);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  private generateSummary(req: Request, res: Response): void {
    try {
      const { observations, prompt } = req.body;

      if (!observations || !Array.isArray(observations)) {
        res.status(400).json({ error: 'observations array is required' });
        return;
      }

      const summary = this.enhancementService.generateAutoSummary(observations, prompt);
      res.json({ summary });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}
