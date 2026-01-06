import { Database } from 'bun:sqlite';
import { logger } from '../../utils/logger.js';

interface Migration {
  version: number;
  up: (db: Database) => void;
  down?: (db: Database) => void;
}

export class MigrationRunner {
  private migrations: Map<number, Migration> = new Map();

  constructor(private db: Database) {
    this.registerMigrations();
  }

  private registerMigrations(): void {
    this.migrations.set(5, {
      version: 5,
      up: (db) => this.migrateAddWorkerPortColumn(db)
    });
    this.migrations.set(6, {
      version: 6,
      up: (db) => this.migrateAddPromptTrackingColumns(db)
    });
    this.migrations.set(7, {
      version: 7,
      up: (db) => this.migrateRemoveSessionSummariesUniqueConstraint(db)
    });
    this.migrations.set(8, {
      version: 8,
      up: (db) => this.migrateAddObservationHierarchicalFields(db)
    });
    this.migrations.set(9, {
      version: 9,
      up: (db) => this.migrateMakeObservationsTextNullable(db)
    });
    this.migrations.set(10, {
      version: 10,
      up: (db) => this.migrateCreateUserPromptsTable(db)
    });
    this.migrations.set(11, {
      version: 11,
      up: (db) => this.migrateEnsureDiscoveryTokensColumn(db)
    });
    this.migrations.set(12, {
      version: 12,
      up: (db) => this.migrateCreatePendingMessagesTable(db)
    });
    this.migrations.set(13, {
      version: 13,
      up: (db) => this.migrateCreateAiResponsesAndToolExecutionsTables(db)
    });
    this.migrations.set(14, {
      version: 14,
      up: (db) => this.migrateCreateConversationSummariesTable(db)
    });
    this.migrations.set(15, {
      version: 15,
      up: (db) => this.migrateCreateContentTagsTable(db)
    });
    this.migrations.set(16, {
      version: 16,
      up: (db) => this.migrateCreateConversationTagsTable(db)
    });
    this.migrations.set(17, {
      version: 17,
      up: (db) => this.migrateCreateAnalysisTasksTable(db)
    });
  }

  public runPendingMigrations(): void {
    const appliedVersions = this.db.prepare('SELECT version FROM schema_versions ORDER BY version').all() as { version: number }[];
    const maxApplied = appliedVersions.length > 0 ? Math.max(...appliedVersions.map(v => v.version)) : 0;

    for (const [version, migration] of this.migrations) {
      if (version > maxApplied) {
        try {
          logger.info('DB', `Running migration ${version}...`);
          migration.up(this.db);
          this.db.prepare('INSERT OR IGNORE INTO schema_versions (version, applied_at) VALUES (?, ?)').run(version, new Date().toISOString());
          logger.success('DB', `Migration ${version} applied successfully`);
        } catch (error: any) {
          logger.error('DB', `Migration ${version} failed`, {}, error.message);
          throw error;
        }
      }
    }
  }

  private migrateAddWorkerPortColumn(db: Database): void {
    const tableInfo = db.query('PRAGMA table_info(sdk_sessions)').all() as { name: string }[];
    const hasWorkerPort = tableInfo.some(col => col.name === 'worker_port');

    if (!hasWorkerPort) {
      db.run('ALTER TABLE sdk_sessions ADD COLUMN worker_port INTEGER');
      logger.info('DB', 'Added worker_port column to sdk_sessions table');
    }
  }

  private migrateAddPromptTrackingColumns(db: Database): void {
    const sessionsInfo = db.query('PRAGMA table_info(sdk_sessions)').all() as { name: string }[];
    if (!sessionsInfo.some(col => col.name === 'prompt_counter')) {
      db.run('ALTER TABLE sdk_sessions ADD COLUMN prompt_counter INTEGER DEFAULT 0');
      logger.info('DB', 'Added prompt_counter column to sdk_sessions table');
    }

    const observationsInfo = db.query('PRAGMA table_info(observations)').all() as { name: string }[];
    if (!observationsInfo.some(col => col.name === 'prompt_number')) {
      db.run('ALTER TABLE observations ADD COLUMN prompt_number INTEGER');
      logger.info('DB', 'Added prompt_number column to observations table');
    }

    const summariesInfo = db.query('PRAGMA table_info(session_summaries)').all() as { name: string }[];
    if (!summariesInfo.some(col => col.name === 'prompt_number')) {
      db.run('ALTER TABLE session_summaries ADD COLUMN prompt_number INTEGER');
      logger.info('DB', 'Added prompt_number column to session_summaries table');
    }
  }

  private migrateRemoveSessionSummariesUniqueConstraint(db: Database): void {
    const summariesIndexes = db.query('PRAGMA index_list(session_summaries)').all() as { unique: number }[];
    const hasUniqueConstraint = summariesIndexes.some(idx => idx.unique === 1);

    if (!hasUniqueConstraint) return;

    logger.info('DB', 'Removing UNIQUE constraint from session_summaries.sdk_session_id...');

    db.run('BEGIN TRANSACTION');

    try {
      db.run(`
        CREATE TABLE session_summaries_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sdk_session_id TEXT NOT NULL,
          project TEXT NOT NULL,
          request TEXT,
          investigated TEXT,
          learned TEXT,
          completed TEXT,
          next_steps TEXT,
          files_read TEXT,
          files_edited TEXT,
          notes TEXT,
          prompt_number INTEGER,
          created_at TEXT NOT NULL,
          created_at_epoch INTEGER NOT NULL,
          FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
        )
      `);

      db.run(`
        INSERT INTO session_summaries_new
        SELECT id, sdk_session_id, project, request, investigated, learned,
               completed, next_steps, files_read, files_edited, notes,
               prompt_number, created_at, created_at_epoch
        FROM session_summaries
      `);

      db.run('DROP TABLE session_summaries');
      db.run('ALTER TABLE session_summaries_new RENAME TO session_summaries');

      db.run(`
        CREATE INDEX idx_session_summaries_sdk_session ON session_summaries(sdk_session_id);
        CREATE INDEX idx_session_summaries_project ON session_summaries(project);
        CREATE INDEX idx_session_summaries_created ON session_summaries(created_at_epoch DESC);
      `);

      db.run('COMMIT');
      logger.success('DB', 'Successfully removed UNIQUE constraint from session_summaries.sdk_session_id');
    } catch (error: any) {
      db.run('ROLLBACK');
      throw error;
    }
  }

  private migrateAddObservationHierarchicalFields(db: Database): void {
    const tableInfo = db.query('PRAGMA table_info(observations)').all() as { name: string }[];
    if (tableInfo.some(col => col.name === 'title')) return;

    logger.info('DB', 'Adding hierarchical fields to observations table...');

    db.run(`
      ALTER TABLE observations ADD COLUMN title TEXT;
      ALTER TABLE observations ADD COLUMN subtitle TEXT;
      ALTER TABLE observations ADD COLUMN facts TEXT;
      ALTER TABLE observations ADD COLUMN narrative TEXT;
      ALTER TABLE observations ADD COLUMN concepts TEXT;
      ALTER TABLE observations ADD COLUMN files_read TEXT;
      ALTER TABLE observations ADD COLUMN files_modified TEXT;
    `);

    logger.info('DB', 'Successfully added hierarchical fields to observations table');
  }

  private migrateMakeObservationsTextNullable(db: Database): void {
    const tableInfo = db.query('PRAGMA table_info(observations)').all() as { name: string; notnull: number }[];
    const textColumn = tableInfo.find(col => col.name === 'text');
    if (!textColumn || textColumn.notnull === 0) return;

    logger.info('DB', 'Making observations.text nullable...');

    db.run('BEGIN TRANSACTION');

    try {
      db.run(`
        CREATE TABLE observations_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sdk_session_id TEXT NOT NULL,
          project TEXT NOT NULL,
          text TEXT,
          type TEXT NOT NULL CHECK(type IN ('decision', 'bugfix', 'feature', 'refactor', 'discovery')),
          title TEXT,
          subtitle TEXT,
          facts TEXT,
          narrative TEXT,
          concepts TEXT,
          files_read TEXT,
          files_modified TEXT,
          prompt_number INTEGER,
          created_at TEXT NOT NULL,
          created_at_epoch INTEGER NOT NULL,
          FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
        )
      `);

      db.run(`
        INSERT INTO observations_new
        SELECT id, sdk_session_id, project, text, type, title, subtitle, facts,
               narrative, concepts, files_read, files_modified, prompt_number,
               created_at, created_at_epoch
        FROM observations
      `);

      db.run('DROP TABLE observations');
      db.run('ALTER TABLE observations_new RENAME TO observations');
      db.run('COMMIT');

      logger.info('DB', 'Successfully made observations.text nullable');
    } catch (error: any) {
      db.run('ROLLBACK');
      throw error;
    }
  }

  private migrateCreateUserPromptsTable(db: Database): void {
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    if (tables.some(t => t.name === 'user_prompts')) return;

    logger.info('DB', 'Creating user_prompts table...');

    db.run(`
      CREATE TABLE user_prompts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sdk_session_id TEXT NOT NULL,
        prompt_number INTEGER NOT NULL,
        prompt_text TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        timestamp_epoch INTEGER NOT NULL,
        FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
      )
    `);

    db.run('CREATE INDEX idx_user_prompts_session ON user_prompts(sdk_session_id)');
    db.run('CREATE INDEX idx_user_prompts_number ON user_prompts(sdk_session_id, prompt_number)');

    logger.info('DB', 'Successfully created user_prompts table');
  }

  private migrateEnsureDiscoveryTokensColumn(db: Database): void {
    const tableInfo = db.query('PRAGMA table_info(observations)').all() as { name: string }[];
    if (tableInfo.some(col => col.name === 'discovery_tokens')) return;

    db.run('ALTER TABLE observations ADD COLUMN discovery_tokens TEXT');
  }

  private migrateCreatePendingMessagesTable(db: Database): void {
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    if (tables.some(t => t.name === 'pending_messages')) return;

    logger.info('DB', 'Creating pending_messages table...');

    db.run(`
      CREATE TABLE pending_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sdk_session_id TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
      )
    `);

    db.run('CREATE INDEX idx_pending_messages_session ON pending_messages(sdk_session_id)');

    logger.info('DB', 'Successfully created pending_messages table');
  }

  private migrateCreateAiResponsesAndToolExecutionsTables(db: Database): void {
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];

    if (!tables.some(t => t.name === 'ai_responses')) {
      logger.info('DB', 'Creating ai_responses table...');
      db.run(`
        CREATE TABLE ai_responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sdk_session_id TEXT NOT NULL,
          prompt_number INTEGER NOT NULL,
          response_text TEXT NOT NULL,
          created_at TEXT NOT NULL,
          created_at_epoch INTEGER NOT NULL,
          FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
        )
      `);
      db.run('CREATE INDEX idx_ai_responses_session ON ai_responses(sdk_session_id)');
    }

    if (!tables.some(t => t.name === 'tool_executions')) {
      logger.info('DB', 'Creating tool_executions table...');
      db.run(`
        CREATE TABLE tool_executions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sdk_session_id TEXT NOT NULL,
          prompt_number INTEGER NOT NULL,
          tool_name TEXT NOT NULL,
          tool_input TEXT,
          tool_output TEXT,
          duration_ms INTEGER,
          created_at TEXT NOT NULL,
          created_at_epoch INTEGER NOT NULL,
          FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
        )
      `);
      db.run('CREATE INDEX idx_tool_executions_session ON tool_executions(sdk_session_id)');
      db.run('CREATE INDEX idx_tool_executions_tool ON tool_executions(tool_name)');
    }
  }

  private migrateCreateConversationSummariesTable(db: Database): void {
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    if (tables.some(t => t.name === 'conversation_summaries')) return;

    logger.info('DB', 'Creating conversation_summaries table...');

    db.run(`
      CREATE TABLE conversation_summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sdk_session_id TEXT NOT NULL,
        project TEXT NOT NULL,
        summary_type TEXT CHECK(summary_type IN ('auto', 'manual', 'ai_enhanced', 'template')) NOT NULL DEFAULT 'auto',
        content TEXT NOT NULL,
        keywords TEXT,
        key_points TEXT,
        summary_length INTEGER,
        confidence_score REAL,
        ai_model TEXT,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        updated_at TEXT,
        updated_at_epoch INTEGER,
        FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
      )
    `);

    db.run('CREATE INDEX idx_conversation_summaries_session ON conversation_summaries(sdk_session_id)');
    db.run('CREATE INDEX idx_conversation_summaries_project ON conversation_summaries(project)');
    db.run('CREATE INDEX idx_conversation_summaries_type ON conversation_summaries(summary_type)');
    db.run('CREATE INDEX idx_conversation_summaries_created ON conversation_summaries(created_at_epoch DESC)');

    logger.info('DB', 'Successfully created conversation_summaries table');
  }

  private migrateCreateContentTagsTable(db: Database): void {
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    if (tables.some(t => t.name === 'content_tags')) return;

    logger.info('DB', 'Creating content_tags table...');

    db.run(`
      CREATE TABLE content_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tag_name TEXT UNIQUE NOT NULL,
        tag_category TEXT,
        parent_tag_id INTEGER,
        description TEXT,
        color_code TEXT,
        icon_name TEXT,
        usage_count INTEGER DEFAULT 0,
        is_auto_generated BOOLEAN DEFAULT 1,
        is_system_tag BOOLEAN DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        FOREIGN KEY(parent_tag_id) REFERENCES content_tags(id)
      )
    `);

    db.run('CREATE INDEX idx_content_tags_category ON content_tags(tag_category)');
    db.run('CREATE INDEX idx_content_tags_parent ON content_tags(parent_tag_id)');
    db.run('CREATE INDEX idx_content_tags_usage ON content_tags(usage_count DESC)');

    db.run(`
      CREATE VIRTUAL TABLE content_tags_fts USING fts5(
        tag_name, description,
        content='content_tags',
        content_rowid='id'
      )
    `);

    db.run(`
      CREATE TRIGGER content_tags_ai AFTER INSERT ON content_tags BEGIN
        INSERT INTO content_tags_fts(rowid, tag_name, description)
        VALUES (new.id, new.tag_name, new.description);
      END;
    `);

    logger.info('DB', 'Successfully created content_tags table');

    const defaultTags = [
      { name: 'bugfix', category: 'type', description: 'Bug fixes and repairs', color: '#ef4444' },
      { name: 'feature', category: 'type', description: 'New features and functionality', color: '#22c55e' },
      { name: 'refactor', category: 'type', description: 'Code refactoring', color: '#3b82f6' },
      { name: 'decision', category: 'type', description: 'Architecture decisions', color: '#a855f7' },
      { name: 'discovery', category: 'type', description: 'Findings and discoveries', color: '#f59e0b' },
      { name: 'documentation', category: 'type', description: 'Documentation updates', color: '#06b6d4' },
      { name: 'testing', category: 'type', description: 'Tests and QA', color: '#ec4899' },
      { name: 'optimization', category: 'type', description: 'Performance optimizations', color: '#84cc16' },
      { name: 'security', category: 'type', description: 'Security improvements', color: '#ef4444' },
      { name: 'frontend', category: 'area', description: 'Frontend related', color: '#8b5cf6' },
      { name: 'backend', category: 'area', description: 'Backend related', color: '#6366f1' },
      { name: 'database', category: 'area', description: 'Database related', color: '#14b8a6' },
      { name: 'api', category: 'area', description: 'API related', color: '#f97316' }
    ];

    const now = new Date().toISOString();
    for (const tag of defaultTags) {
      try {
        db.run(
          'INSERT INTO content_tags (tag_name, tag_category, description, color_code, is_auto_generated, is_system_tag, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          tag.name, tag.category, tag.description, tag.color, 1, 1, now
        );
      } catch (e) {
        // Ignore duplicate errors
      }
    }

    logger.info('DB', 'Added default content tags');
  }

  private migrateCreateConversationTagsTable(db: Database): void {
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    if (tables.some(t => t.name === 'conversation_tags')) return;

    logger.info('DB', 'Creating conversation_tags table...');

    db.run(`
      CREATE TABLE conversation_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sdk_session_id TEXT NOT NULL,
        item_type TEXT CHECK(item_type IN ('user_prompt', 'ai_response', 'observation', 'summary')) NOT NULL,
        item_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        confidence_score REAL DEFAULT 1.0,
        is_auto_generated BOOLEAN DEFAULT 1,
        created_by TEXT,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        FOREIGN KEY(tag_id) REFERENCES content_tags(id) ON DELETE CASCADE,
        FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
      )
    `);

    db.run('CREATE INDEX idx_conversation_tags_session ON conversation_tags(sdk_session_id)');
    db.run('CREATE INDEX idx_conversation_tags_item ON conversation_tags(item_type, item_id)');
    db.run('CREATE INDEX idx_conversation_tags_tag ON conversation_tags(tag_id)');
    db.run('CREATE INDEX idx_conversation_tags_created ON conversation_tags(created_at_epoch DESC)');

    logger.info('DB', 'Successfully created conversation_tags table');
  }

  private migrateCreateAnalysisTasksTable(db: Database): void {
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    if (tables.some(t => t.name === 'analysis_tasks')) return;

    logger.info('DB', 'Creating analysis_tasks table...');

    db.run(`
      CREATE TABLE analysis_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sdk_session_id TEXT NOT NULL,
        task_type TEXT CHECK(task_type IN ('summary_generation', 'auto_tagging', 'sentiment_analysis')) NOT NULL,
        status TEXT CHECK(status IN ('pending', 'processing', 'completed', 'failed')) NOT NULL DEFAULT 'pending',
        priority INTEGER DEFAULT 5,
        input_data TEXT,
        output_data TEXT,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        started_at TEXT,
        completed_at TEXT,
        FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
      )
    `);

    db.run('CREATE INDEX idx_analysis_tasks_status ON analysis_tasks(status)');
    db.run('CREATE INDEX idx_analysis_tasks_priority ON analysis_tasks(priority)');
    db.run('CREATE INDEX idx_analysis_tasks_session ON analysis_tasks(sdk_session_id)');
    db.run('CREATE INDEX idx_analysis_tasks_type ON analysis_tasks(task_type)');

    logger.info('DB', 'Successfully created analysis_tasks table');
  }
}
