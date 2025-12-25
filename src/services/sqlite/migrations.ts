import { Database } from 'bun:sqlite';
import { Migration } from './Database.js';
import { logger } from '../../utils/logger.js';

/**
 * Initial schema migration - creates all core tables
 */
export const migration001: Migration = {
  version: 1,
  up: (db: Database) => {
    // Sessions table - core session tracking
    db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        project TEXT NOT NULL,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        source TEXT NOT NULL DEFAULT 'compress',
        archive_path TEXT,
        archive_bytes INTEGER,
        archive_checksum TEXT,
        archived_at TEXT,
        metadata_json TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project);
      CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at_epoch DESC);
      CREATE INDEX IF NOT EXISTS idx_sessions_project_created ON sessions(project, created_at_epoch DESC);
    `);

    // Memories table - compressed memory chunks
    db.run(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        text TEXT NOT NULL,
        document_id TEXT UNIQUE,
        keywords TEXT,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        project TEXT NOT NULL,
        archive_basename TEXT,
        origin TEXT NOT NULL DEFAULT 'transcript',
        FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_memories_session ON memories(session_id);
      CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project);
      CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at_epoch DESC);
      CREATE INDEX IF NOT EXISTS idx_memories_project_created ON memories(project, created_at_epoch DESC);
      CREATE INDEX IF NOT EXISTS idx_memories_document_id ON memories(document_id);
      CREATE INDEX IF NOT EXISTS idx_memories_origin ON memories(origin);
    `);

    // Overviews table - session summaries (one per project)
    db.run(`
      CREATE TABLE IF NOT EXISTS overviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        project TEXT NOT NULL,
        origin TEXT NOT NULL DEFAULT 'claude',
        FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_overviews_session ON overviews(session_id);
      CREATE INDEX IF NOT EXISTS idx_overviews_project ON overviews(project);
      CREATE INDEX IF NOT EXISTS idx_overviews_created_at ON overviews(created_at_epoch DESC);
      CREATE INDEX IF NOT EXISTS idx_overviews_project_created ON overviews(project, created_at_epoch DESC);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_overviews_project_latest ON overviews(project, created_at_epoch DESC);
    `);

    // Diagnostics table - system health and debug info
    db.run(`
      CREATE TABLE IF NOT EXISTS diagnostics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        message TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'info',
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        project TEXT NOT NULL,
        origin TEXT NOT NULL DEFAULT 'system',
        FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_diagnostics_session ON diagnostics(session_id);
      CREATE INDEX IF NOT EXISTS idx_diagnostics_project ON diagnostics(project);
      CREATE INDEX IF NOT EXISTS idx_diagnostics_severity ON diagnostics(severity);
      CREATE INDEX IF NOT EXISTS idx_diagnostics_created ON diagnostics(created_at_epoch DESC);
    `);

    // Transcript events table - raw conversation events
    db.run(`
      CREATE TABLE IF NOT EXISTS transcript_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        project TEXT,
        event_index INTEGER NOT NULL,
        event_type TEXT,
        raw_json TEXT NOT NULL,
        captured_at TEXT NOT NULL,
        captured_at_epoch INTEGER NOT NULL,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id) ON DELETE CASCADE,
        UNIQUE(session_id, event_index)
      );

      CREATE INDEX IF NOT EXISTS idx_transcript_events_session ON transcript_events(session_id, event_index);
      CREATE INDEX IF NOT EXISTS idx_transcript_events_project ON transcript_events(project);
      CREATE INDEX IF NOT EXISTS idx_transcript_events_type ON transcript_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_transcript_events_captured ON transcript_events(captured_at_epoch DESC);
    `);

    logger.info('DB', '✅ Created all database tables successfully');
  },

  down: (db: Database) => {
    db.run(`
      DROP TABLE IF EXISTS transcript_events;
      DROP TABLE IF EXISTS diagnostics;
      DROP TABLE IF EXISTS overviews;
      DROP TABLE IF EXISTS memories;
      DROP TABLE IF EXISTS sessions;
    `);
  }
};

/**
 * Migration 002 - Add hierarchical memory fields (v2 format)
 */
export const migration002: Migration = {
  version: 2,
  up: (db: Database) => {
    // Add new columns for hierarchical memory structure
    db.run(`
      ALTER TABLE memories ADD COLUMN title TEXT;
      ALTER TABLE memories ADD COLUMN subtitle TEXT;
      ALTER TABLE memories ADD COLUMN facts TEXT;
      ALTER TABLE memories ADD COLUMN concepts TEXT;
      ALTER TABLE memories ADD COLUMN files_touched TEXT;
    `);

    // Create indexes for the new fields to improve search performance
    db.run(`
      CREATE INDEX IF NOT EXISTS idx_memories_title ON memories(title);
      CREATE INDEX IF NOT EXISTS idx_memories_concepts ON memories(concepts);
    `);

    logger.info('DB', '✅ Added hierarchical memory fields to memories table');
  },

  down: (_db: Database) => {
    // Note: SQLite doesn't support DROP COLUMN in all versions
    // In production, we'd need to recreate the table without these columns
    // For now, we'll just log a warning
    logger.info('DB', '⚠️  Warning: SQLite ALTER TABLE DROP COLUMN not fully supported');
    logger.info('DB', '⚠️  To rollback, manually recreate the memories table');
  }
};

/**
 * Migration 003 - Add streaming_sessions table for real-time session tracking
 */
export const migration003: Migration = {
  version: 3,
  up: (db: Database) => {
    // Streaming sessions table - tracks active SDK compression sessions
    db.run(`
      CREATE TABLE IF NOT EXISTS streaming_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claude_session_id TEXT UNIQUE NOT NULL,
        sdk_session_id TEXT,
        project TEXT NOT NULL,
        title TEXT,
        subtitle TEXT,
        user_prompt TEXT,
        started_at TEXT NOT NULL,
        started_at_epoch INTEGER NOT NULL,
        updated_at TEXT,
        updated_at_epoch INTEGER,
        completed_at TEXT,
        completed_at_epoch INTEGER,
        status TEXT NOT NULL DEFAULT 'active'
      );

      CREATE INDEX IF NOT EXISTS idx_streaming_sessions_claude_id ON streaming_sessions(claude_session_id);
      CREATE INDEX IF NOT EXISTS idx_streaming_sessions_sdk_id ON streaming_sessions(sdk_session_id);
      CREATE INDEX IF NOT EXISTS idx_streaming_sessions_project ON streaming_sessions(project);
      CREATE INDEX IF NOT EXISTS idx_streaming_sessions_status ON streaming_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_streaming_sessions_started ON streaming_sessions(started_at_epoch DESC);
    `);

    logger.info('DB', '✅ Created streaming_sessions table for real-time session tracking');
  },

  down: (db: Database) => {
    db.run(`
      DROP TABLE IF EXISTS streaming_sessions;
    `);
  }
};

/**
 * Migration 004 - Add SDK agent architecture tables
 * Implements the refactor plan for hook-driven memory with SDK agent synthesis
 */
export const migration004: Migration = {
  version: 4,
  up: (db: Database) => {
    // SDK sessions table - tracks SDK streaming sessions
    db.run(`
      CREATE TABLE IF NOT EXISTS sdk_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claude_session_id TEXT UNIQUE NOT NULL,
        sdk_session_id TEXT UNIQUE,
        project TEXT NOT NULL,
        user_prompt TEXT,
        started_at TEXT NOT NULL,
        started_at_epoch INTEGER NOT NULL,
        completed_at TEXT,
        completed_at_epoch INTEGER,
        status TEXT CHECK(status IN ('active', 'completed', 'failed')) NOT NULL DEFAULT 'active'
      );

      CREATE INDEX IF NOT EXISTS idx_sdk_sessions_claude_id ON sdk_sessions(claude_session_id);
      CREATE INDEX IF NOT EXISTS idx_sdk_sessions_sdk_id ON sdk_sessions(sdk_session_id);
      CREATE INDEX IF NOT EXISTS idx_sdk_sessions_project ON sdk_sessions(project);
      CREATE INDEX IF NOT EXISTS idx_sdk_sessions_status ON sdk_sessions(status);
      CREATE INDEX IF NOT EXISTS idx_sdk_sessions_started ON sdk_sessions(started_at_epoch DESC);
    `);

    // Observation queue table - tracks pending observations for SDK processing
    db.run(`
      CREATE TABLE IF NOT EXISTS observation_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sdk_session_id TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        tool_input TEXT NOT NULL,
        tool_output TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        processed_at_epoch INTEGER,
        FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_observation_queue_sdk_session ON observation_queue(sdk_session_id);
      CREATE INDEX IF NOT EXISTS idx_observation_queue_processed ON observation_queue(processed_at_epoch);
      CREATE INDEX IF NOT EXISTS idx_observation_queue_pending ON observation_queue(sdk_session_id, processed_at_epoch);
    `);

    // Observations table - stores extracted observations (what SDK decides is important)
    db.run(`
      CREATE TABLE IF NOT EXISTS observations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sdk_session_id TEXT NOT NULL,
        project TEXT NOT NULL,
        text TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('decision', 'bugfix', 'feature', 'refactor', 'discovery')),
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_observations_sdk_session ON observations(sdk_session_id);
      CREATE INDEX IF NOT EXISTS idx_observations_project ON observations(project);
      CREATE INDEX IF NOT EXISTS idx_observations_type ON observations(type);
      CREATE INDEX IF NOT EXISTS idx_observations_created ON observations(created_at_epoch DESC);
    `);

    // Session summaries table - stores structured session summaries
    db.run(`
      CREATE TABLE IF NOT EXISTS session_summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sdk_session_id TEXT UNIQUE NOT NULL,
        project TEXT NOT NULL,
        request TEXT,
        investigated TEXT,
        learned TEXT,
        completed TEXT,
        next_steps TEXT,
        files_read TEXT,
        files_edited TEXT,
        notes TEXT,
        created_at TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_session_summaries_sdk_session ON session_summaries(sdk_session_id);
      CREATE INDEX IF NOT EXISTS idx_session_summaries_project ON session_summaries(project);
      CREATE INDEX IF NOT EXISTS idx_session_summaries_created ON session_summaries(created_at_epoch DESC);
    `);

    logger.info('DB', '✅ Created SDK agent architecture tables');
  },

  down: (db: Database) => {
    db.run(`
      DROP TABLE IF EXISTS session_summaries;
      DROP TABLE IF EXISTS observations;
      DROP TABLE IF EXISTS observation_queue;
      DROP TABLE IF EXISTS sdk_sessions;
    `);
  }
};

/**
 * Migration 005 - Remove orphaned tables
 * Drops streaming_sessions (superseded by sdk_sessions)
 * Drops observation_queue (superseded by Unix socket communication)
 */
export const migration005: Migration = {
  version: 5,
  up: (db: Database) => {
    // Drop streaming_sessions - superseded by sdk_sessions in migration004
    // This table was from v2 architecture and is no longer used
    db.run(`DROP TABLE IF EXISTS streaming_sessions`);

    // Drop observation_queue - superseded by Unix socket communication
    // Worker now uses sockets instead of database polling for observations
    db.run(`DROP TABLE IF EXISTS observation_queue`);

    logger.info('DB', '✅ Dropped orphaned tables: streaming_sessions, observation_queue');
  },

  down: (db: Database) => {
    // Recreate tables if needed (though they should never be used)
    db.run(`
      CREATE TABLE IF NOT EXISTS streaming_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        claude_session_id TEXT UNIQUE NOT NULL,
        sdk_session_id TEXT,
        project TEXT NOT NULL,
        title TEXT,
        subtitle TEXT,
        user_prompt TEXT,
        started_at TEXT NOT NULL,
        started_at_epoch INTEGER NOT NULL,
        updated_at TEXT,
        updated_at_epoch INTEGER,
        completed_at TEXT,
        completed_at_epoch INTEGER,
        status TEXT NOT NULL DEFAULT 'active'
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS observation_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sdk_session_id TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        tool_input TEXT NOT NULL,
        tool_output TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        processed_at_epoch INTEGER,
        FOREIGN KEY(sdk_session_id) REFERENCES sdk_sessions(sdk_session_id) ON DELETE CASCADE
      )
    `);

    logger.info('DB', '⚠️  Recreated streaming_sessions and observation_queue (for rollback only)');
  }
};

/**
 * Migration 006 - Add FTS5 full-text search tables
 * Creates virtual tables for fast text search on observations and session_summaries
 */
export const migration006: Migration = {
  version: 6,
  up: (db: Database) => {
    // FTS5 virtual table for observations
    // Note: This assumes the hierarchical fields (title, subtitle, etc.) already exist
    // from the inline migrations in SessionStore constructor
    db.run(`
      CREATE VIRTUAL TABLE IF NOT EXISTS observations_fts USING fts5(
        title,
        subtitle,
        narrative,
        text,
        facts,
        concepts,
        content='observations',
        content_rowid='id'
      );
    `);

    // Populate FTS table with existing data
    db.run(`
      INSERT INTO observations_fts(rowid, title, subtitle, narrative, text, facts, concepts)
      SELECT id, title, subtitle, narrative, text, facts, concepts
      FROM observations;
    `);

    // Triggers to keep observations_fts in sync
    db.run(`
      CREATE TRIGGER IF NOT EXISTS observations_ai AFTER INSERT ON observations BEGIN
        INSERT INTO observations_fts(rowid, title, subtitle, narrative, text, facts, concepts)
        VALUES (new.id, new.title, new.subtitle, new.narrative, new.text, new.facts, new.concepts);
      END;

      CREATE TRIGGER IF NOT EXISTS observations_ad AFTER DELETE ON observations BEGIN
        INSERT INTO observations_fts(observations_fts, rowid, title, subtitle, narrative, text, facts, concepts)
        VALUES('delete', old.id, old.title, old.subtitle, old.narrative, old.text, old.facts, old.concepts);
      END;

      CREATE TRIGGER IF NOT EXISTS observations_au AFTER UPDATE ON observations BEGIN
        INSERT INTO observations_fts(observations_fts, rowid, title, subtitle, narrative, text, facts, concepts)
        VALUES('delete', old.id, old.title, old.subtitle, old.narrative, old.text, old.facts, old.concepts);
        INSERT INTO observations_fts(rowid, title, subtitle, narrative, text, facts, concepts)
        VALUES (new.id, new.title, new.subtitle, new.narrative, new.text, new.facts, new.concepts);
      END;
    `);

    // FTS5 virtual table for session_summaries
    db.run(`
      CREATE VIRTUAL TABLE IF NOT EXISTS session_summaries_fts USING fts5(
        request,
        investigated,
        learned,
        completed,
        next_steps,
        notes,
        content='session_summaries',
        content_rowid='id'
      );
    `);

    // Populate FTS table with existing data
    db.run(`
      INSERT INTO session_summaries_fts(rowid, request, investigated, learned, completed, next_steps, notes)
      SELECT id, request, investigated, learned, completed, next_steps, notes
      FROM session_summaries;
    `);

    // Triggers to keep session_summaries_fts in sync
    db.run(`
      CREATE TRIGGER IF NOT EXISTS session_summaries_ai AFTER INSERT ON session_summaries BEGIN
        INSERT INTO session_summaries_fts(rowid, request, investigated, learned, completed, next_steps, notes)
        VALUES (new.id, new.request, new.investigated, new.learned, new.completed, new.next_steps, new.notes);
      END;

      CREATE TRIGGER IF NOT EXISTS session_summaries_ad AFTER DELETE ON session_summaries BEGIN
        INSERT INTO session_summaries_fts(session_summaries_fts, rowid, request, investigated, learned, completed, next_steps, notes)
        VALUES('delete', old.id, old.request, old.investigated, old.learned, old.completed, old.next_steps, old.notes);
      END;

      CREATE TRIGGER IF NOT EXISTS session_summaries_au AFTER UPDATE ON session_summaries BEGIN
        INSERT INTO session_summaries_fts(session_summaries_fts, rowid, request, investigated, learned, completed, next_steps, notes)
        VALUES('delete', old.id, old.request, old.investigated, old.learned, old.completed, old.next_steps, old.notes);
        INSERT INTO session_summaries_fts(rowid, request, investigated, learned, completed, next_steps, notes)
        VALUES (new.id, new.request, new.investigated, new.learned, new.completed, new.next_steps, new.notes);
      END;
    `);

    logger.info('DB', '✅ Created FTS5 virtual tables and triggers for full-text search');
  },

  down: (db: Database) => {
    db.run(`
      DROP TRIGGER IF EXISTS observations_au;
      DROP TRIGGER IF EXISTS observations_ad;
      DROP TRIGGER IF EXISTS observations_ai;
      DROP TABLE IF EXISTS observations_fts;

      DROP TRIGGER IF EXISTS session_summaries_au;
      DROP TRIGGER IF EXISTS session_summaries_ad;
      DROP TRIGGER IF EXISTS session_summaries_ai;
      DROP TABLE IF EXISTS session_summaries_fts;
    `);
  }
};

/**
 * Migration 007 - Add discovery_tokens column for ROI metrics
 * Tracks token cost of discovering/creating each observation and summary
 */
export const migration007: Migration = {
  version: 7,
  up: (db: Database) => {
    // Add discovery_tokens to observations table
    db.run(`ALTER TABLE observations ADD COLUMN discovery_tokens INTEGER DEFAULT 0`);

    // Add discovery_tokens to session_summaries table
    db.run(`ALTER TABLE session_summaries ADD COLUMN discovery_tokens INTEGER DEFAULT 0`);

    logger.info('DB', '✅ Added discovery_tokens columns for ROI tracking');
  },

  down: (db: Database) => {
    // Note: SQLite doesn't support DROP COLUMN in all versions
    // In production, would need to recreate tables without these columns
    logger.info('DB', '⚠️  Warning: SQLite ALTER TABLE DROP COLUMN not fully supported');
    logger.info('DB', '⚠️  To rollback, manually recreate the observations and session_summaries tables');
  }
};

/**
 * Migration 008 - Add index health check utility
 * Creates a validation function to verify all indexes exist and are functioning
 */
export const migration008: Migration = {
  version: 8,
  up: (db: Database) => {
    // This migration doesn't alter schema, but validates existing indexes
    // It will run on every startup to ensure database health

    const expectedIndexes = [
      // Sessions indexes
      'idx_sessions_project',
      'idx_sessions_created_at',
      'idx_sessions_project_created',

      // Memories indexes
      'idx_memories_session',
      'idx_memories_project',
      'idx_memories_created_at',
      'idx_memories_project_created',
      'idx_memories_document_id',
      'idx_memories_origin',
      'idx_memories_title',
      'idx_memories_concepts',

      // SDK sessions indexes
      'idx_sdk_sessions_claude_id',
      'idx_sdk_sessions_sdk_id',
      'idx_sdk_sessions_project',
      'idx_sdk_sessions_status',
      'idx_sdk_sessions_started',

      // Observations indexes
      'idx_observations_sdk_session',
      'idx_observations_project',
      'idx_observations_type',
      'idx_observations_created',

      // Session summaries indexes
      'idx_session_summaries_sdk_session',
      'idx_session_summaries_project',
      'idx_session_summaries_created',
    ];

    // Check each expected index
    const query = db.query("SELECT name FROM sqlite_master WHERE type='index' AND name=?");
    let missingIndexes: string[] = [];

    for (const indexName of expectedIndexes) {
      const result = query.get(indexName) as { name: string } | undefined;
      if (!result) {
        missingIndexes.push(indexName);
      }
    }

    if (missingIndexes.length > 0) {
      logger.warn('DB', '⚠️  Missing indexes detected:', missingIndexes.join(', '));

      // Recreate missing indexes
      for (const indexName of missingIndexes) {
        try {
          if (indexName.startsWith('idx_sessions_')) {
            if (indexName === 'idx_sessions_project') {
              db.run('CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project)');
            } else if (indexName === 'idx_sessions_created_at') {
              db.run('CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at_epoch DESC)');
            } else if (indexName === 'idx_sessions_project_created') {
              db.run('CREATE INDEX IF NOT EXISTS idx_sessions_project_created ON sessions(project, created_at_epoch DESC)');
            }
          } else if (indexName.startsWith('idx_memories_')) {
            if (indexName === 'idx_memories_session') {
              db.run('CREATE INDEX IF NOT EXISTS idx_memories_session ON memories(session_id)');
            } else if (indexName === 'idx_memories_project') {
              db.run('CREATE INDEX IF NOT EXISTS idx_memories_project ON memories(project)');
            } else if (indexName === 'idx_memories_created_at') {
              db.run('CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at_epoch DESC)');
            } else if (indexName === 'idx_memories_project_created') {
              db.run('CREATE INDEX IF NOT EXISTS idx_memories_project_created ON memories(project, created_at_epoch DESC)');
            } else if (indexName === 'idx_memories_document_id') {
              db.run('CREATE INDEX IF NOT EXISTS idx_memories_document_id ON memories(document_id)');
            } else if (indexName === 'idx_memories_origin') {
              db.run('CREATE INDEX IF NOT EXISTS idx_memories_origin ON memories(origin)');
            } else if (indexName === 'idx_memories_title') {
              db.run('CREATE INDEX IF NOT EXISTS idx_memories_title ON memories(title)');
            } else if (indexName === 'idx_memories_concepts') {
              db.run('CREATE INDEX IF NOT EXISTS idx_memories_concepts ON memories(concepts)');
            }
          } else if (indexName.startsWith('idx_sdk_sessions_')) {
            if (indexName === 'idx_sdk_sessions_claude_id') {
              db.run('CREATE INDEX IF NOT EXISTS idx_sdk_sessions_claude_id ON sdk_sessions(claude_session_id)');
            } else if (indexName === 'idx_sdk_sessions_sdk_id') {
              db.run('CREATE INDEX IF NOT EXISTS idx_sdk_sessions_sdk_id ON sdk_sessions(sdk_session_id)');
            } else if (indexName === 'idx_sdk_sessions_project') {
              db.run('CREATE INDEX IF NOT EXISTS idx_sdk_sessions_project ON sdk_sessions(project)');
            } else if (indexName === 'idx_sdk_sessions_status') {
              db.run('CREATE INDEX IF NOT EXISTS idx_sdk_sessions_status ON sdk_sessions(status)');
            } else if (indexName === 'idx_sdk_sessions_started') {
              db.run('CREATE INDEX IF NOT EXISTS idx_sdk_sessions_started ON sdk_sessions(started_at_epoch DESC)');
            }
          } else if (indexName.startsWith('idx_observations_')) {
            if (indexName === 'idx_observations_sdk_session') {
              db.run('CREATE INDEX IF NOT EXISTS idx_observations_sdk_session ON observations(sdk_session_id)');
            } else if (indexName === 'idx_observations_project') {
              db.run('CREATE INDEX IF NOT EXISTS idx_observations_project ON observations(project)');
            } else if (indexName === 'idx_observations_type') {
              db.run('CREATE INDEX IF NOT EXISTS idx_observations_type ON observations(type)');
            } else if (indexName === 'idx_observations_created') {
              db.run('CREATE INDEX IF NOT EXISTS idx_observations_created ON observations(created_at_epoch DESC)');
            }
          } else if (indexName.startsWith('idx_session_summaries_')) {
            if (indexName === 'idx_session_summaries_sdk_session') {
              db.run('CREATE INDEX IF NOT EXISTS idx_session_summaries_sdk_session ON session_summaries(sdk_session_id)');
            } else if (indexName === 'idx_session_summaries_project') {
              db.run('CREATE INDEX IF NOT EXISTS idx_session_summaries_project ON session_summaries(project)');
            } else if (indexName === 'idx_session_summaries_created') {
              db.run('CREATE INDEX IF NOT EXISTS idx_session_summaries_created ON session_summaries(created_at_epoch DESC)');
            }
          }

          logger.info('DB', `✅ Recreated missing index: ${indexName}`);
        } catch (error) {
          logger.error('DB', `❌ Failed to recreate index ${indexName}:`, error);
        }
      }
    } else {
      logger.info('DB', '✅ All expected database indexes are present');
    }

    // Verify FTS5 virtual tables
    const ftsQuery = db.query("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%_fts'");
    const ftsTables = ftsQuery.all() as { name: string }[];
    const expectedFtsTables = ['observations_fts', 'session_summaries_fts'];

    for (const tableName of expectedFtsTables) {
      const exists = ftsTables.some(t => t.name === tableName);
      if (!exists) {
        logger.warn('DB', `⚠️  Missing FTS5 table: ${tableName}`);
      } else {
        // Verify FTS table has data in sync
        const syncCheck = db.query(`
          SELECT (SELECT COUNT(*) FROM ${tableName.replace('_fts', '')}) as total,
                 (SELECT COUNT(*) FROM ${tableName}) as indexed
        `).get() as { total: number, indexed: number };

        if (syncCheck.total !== syncCheck.indexed) {
          logger.warn('DB', `⚠️  FTS sync issue in ${tableName}: ${syncCheck.indexed}/${syncCheck.total} rows indexed`);
        } else {
          logger.info('DB', `✅ FTS5 table ${tableName} is in sync (${syncCheck.total} rows)`);
        }
      }
    }

    logger.info('DB', '✅ Database health check completed');
  },

  down: (_db: Database) => {
    logger.info('DB', '⚠️  Rollback: No schema changes to undo in migration008');
  }
};

/**
 * All migrations in order
 */
export const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
  migration006,
  migration007,
  migration008
];