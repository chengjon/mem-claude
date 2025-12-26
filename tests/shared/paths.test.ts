/**
 * paths Tests
 *
 * Tests for path resolution utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as paths from '../../src/shared/paths.js';

describe('paths', () => {
  const originalHome = process.env.HOME;
  const originalDataDir = process.env.CLAUDE_MEM_DATA_DIR;

  beforeEach(() => {
    // Reset environment
    if (originalHome) {
      process.env.HOME = originalHome;
    }
    if (originalDataDir) {
      process.env.CLAUDE_MEM_DATA_DIR = originalDataDir;
    } else {
      delete process.env.CLAUDE_MEM_DATA_DIR;
    }
  });

  describe('DATA_DIR', () => {
    it('is a valid directory path', () => {
      expect(paths.DATA_DIR).toBeTruthy();
      expect(typeof paths.DATA_DIR).toBe('string');
      expect(paths.DATA_DIR.length).toBeGreaterThan(0);
    });

    it('contains mem-claude in path', () => {
      expect(paths.DATA_DIR).toContain('mem-claude');
    });

    it('is consistent across multiple accesses', () => {
      const dir1 = paths.DATA_DIR;
      const dir2 = paths.DATA_DIR;
      expect(dir1).toBe(dir2);
    });
  });

  describe('DB_PATH', () => {
    it('includes database filename', () => {
      expect(paths.DB_PATH).toContain('mem-claude.db');
    });

    it('is a valid file path', () => {
      expect(paths.DB_PATH).toBeTruthy();
      expect(typeof paths.DB_PATH).toBe('string');
      expect(paths.DB_PATH.endsWith('.db')).toBe(true);
    });

    it('is consistent across multiple accesses', () => {
      const path1 = paths.DB_PATH;
      const path2 = paths.DB_PATH;
      expect(path1).toBe(path2);
    });
  });

  describe('getPackageRoot()', () => {
    it('returns absolute path', () => {
      const root = paths.getPackageRoot();
      expect(root).toBeTruthy();
      expect(root.startsWith('/')).toBe(true);
    });

    it('returns valid string path', () => {
      const root = paths.getPackageRoot();
      expect(typeof root).toBe('string');
      expect(root.length).toBeGreaterThan(0);
    });
  });

  describe('getPackageCommandsDir()', () => {
    it('returns absolute path to commands directory', () => {
      const commandsDir = paths.getPackageCommandsDir();
      expect(commandsDir).toBeTruthy();
      expect(typeof commandsDir).toBe('string');
    });

    it('includes commands in path', () => {
      const commandsDir = paths.getPackageCommandsDir();
      expect(commandsDir).toContain('commands');
    });
  });

  describe('getProjectArchiveDir()', () => {
    it('returns archive directory for project', () => {
      const archiveDir = paths.getProjectArchiveDir('test-project');
      expect(archiveDir).toContain('test-project');
      expect(archiveDir).toContain('archives');
    });
  });

  describe('getWorkerSocketPath()', () => {
    it('returns socket path for session', () => {
      const socketPath = paths.getWorkerSocketPath(12345);
      expect(socketPath).toContain('worker-12345.sock');
    });
  });

  describe('getCurrentProjectName()', () => {
    it('returns a project name string', () => {
      const projectName = paths.getCurrentProjectName();
      expect(typeof projectName).toBe('string');
      expect(projectName.length).toBeGreaterThan(0);
    });
  });

  describe('createBackupFilename()', () => {
    it('creates timestamped backup filename', () => {
      const backupPath = paths.createBackupFilename('/test/data.json');
      expect(backupPath).toContain('/test/data.json.backup.');
      expect(backupPath).toMatch(/\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}/);
    });
  });

  describe('path resolution', () => {
    it('paths are consistent across multiple calls', () => {
      const dataDir1 = paths.DATA_DIR;
      const dataDir2 = paths.DATA_DIR;

      expect(dataDir1).toBe(dataDir2);
    });

    it('all paths are strings', () => {
      const allPaths = [
        paths.DATA_DIR,
        paths.DB_PATH,
        paths.getPackageRoot(),
        paths.getPackageCommandsDir()
      ];

      allPaths.forEach(path => {
        expect(typeof path).toBe('string');
        expect(path).toBeTruthy();
      });
    });
  });

  describe('edge cases', () => {
    it('handles project names with special characters', () => {
      const archiveDir = paths.getProjectArchiveDir('test-project with spaces');
      expect(archiveDir).toContain('test-project with spaces');
    });

    it('handles empty project name gracefully', () => {
      const archiveDir = paths.getProjectArchiveDir('');
      // Should still return a valid path structure
      expect(typeof archiveDir).toBe('string');
    });

    it('handles very long project names', () => {
      const longName = 'a'.repeat(200);
      const archiveDir = paths.getProjectArchiveDir(longName);
      expect(archiveDir).toContain(longName);
    });

    it('handles session IDs correctly', () => {
      const socket1 = paths.getWorkerSocketPath(0);
      const socket2 = paths.getWorkerSocketPath(999999);
      expect(socket1).toContain('worker-0.sock');
      expect(socket2).toContain('worker-999999.sock');
    });
  });
});
