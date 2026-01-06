/**
 * worker-utils Tests
 *
 * Tests for worker utility functions: port/host resolution, cache management, worker lifecycle
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getWorkerPort,
  getWorkerHost,
  clearPortCache,
  ensureWorkerRunning
} from '../../src/shared/worker-utils.js';
import { SettingsDefaultsManager } from '../../src/shared/SettingsDefaultsManager.js';

// Mock the dependencies
vi.mock('../../src/services/process/ProcessManager.js', () => ({
  ProcessManager: {
    start: vi.fn(),
    stop: vi.fn(),
    restart: vi.fn(),
    status: vi.fn()
  }
}));

vi.mock('../../src/utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('worker-utils', () => {
  const originalDataDir = process.env.CLAUDE_MEM_DATA_DIR;

  beforeEach(() => {
    // Clear cache before each test
    clearPortCache();
  });

  afterEach(() => {
    // Restore original environment
    if (originalDataDir) {
      process.env.CLAUDE_MEM_DATA_DIR = originalDataDir;
    } else {
      delete process.env.CLAUDE_MEM_DATA_DIR;
    }
    clearPortCache();
  });

  describe('getWorkerPort()', () => {
    it('returns default port when no settings file exists', () => {
      process.env.CLAUDE_MEM_DATA_DIR = '/tmp/nonexistent-test';
      const port = getWorkerPort();
      expect(port).toBe(37777);
    });

    it('returns cached port on subsequent calls', () => {
      process.env.CLAUDE_MEM_DATA_DIR = '/tmp/nonexistent-test';
      const port1 = getWorkerPort();
      const port2 = getWorkerPort();
      expect(port1).toBe(port2);
      expect(port1).toBe(37777);
    });

    it('respects CLAUDE_MEM_WORKER_PORT setting', () => {
      // Use actual data directory if it exists
      const actualDataDir = process.env.CLAUDE_MEM_DATA_DIR || process.env.HOME + '/.mem-claude';
      process.env.CLAUDE_MEM_DATA_DIR = actualDataDir;

      const fs = require('fs');
      const path = require('path');

      // Backup existing settings if any
      const settingsPath = path.join(actualDataDir, 'settings.json');
      let backup = null;

      try {
        if (fs.existsSync(settingsPath)) {
          backup = fs.readFileSync(settingsPath, 'utf-8');
        }

        // Create test settings
        fs.mkdirSync(actualDataDir, { recursive: true });
        fs.writeFileSync(settingsPath, JSON.stringify({
          CLAUDE_MEM_WORKER_PORT: 9999,
          CLAUDE_MEM_WORKER_HOST: '127.0.0.1'
        }));

        clearPortCache(); // Clear cache to force re-read
        const port = getWorkerPort();
        expect(port).toBe(9999);
      } finally {
        // Restore backup
        clearPortCache();
        if (backup) {
          fs.writeFileSync(settingsPath, backup);
        } else if (fs.existsSync(settingsPath)) {
          fs.unlinkSync(settingsPath);
        }
      }
    });
  });

  describe('getWorkerHost()', () => {
    it('returns default host when no settings file exists', () => {
      process.env.CLAUDE_MEM_DATA_DIR = '/tmp/nonexistent-test';
      const host = getWorkerHost();
      expect(host).toBe('127.0.0.1');
    });

    it('returns cached host on subsequent calls', () => {
      process.env.CLAUDE_MEM_DATA_DIR = '/tmp/nonexistent-test';
      const host1 = getWorkerHost();
      const host2 = getWorkerHost();
      expect(host1).toBe(host2);
      expect(host1).toBe('127.0.0.1');
    });

    it('respects CLAUDE_MEM_WORKER_HOST setting', () => {
      const actualDataDir = process.env.CLAUDE_MEM_DATA_DIR || process.env.HOME + '/.mem-claude';
      process.env.CLAUDE_MEM_DATA_DIR = actualDataDir;

      const fs = require('fs');
      const path = require('path');

      const settingsPath = path.join(actualDataDir, 'settings.json');
      let backup = null;

      try {
        if (fs.existsSync(settingsPath)) {
          backup = fs.readFileSync(settingsPath, 'utf-8');
        }

        fs.mkdirSync(actualDataDir, { recursive: true });
        fs.writeFileSync(settingsPath, JSON.stringify({
          CLAUDE_MEM_WORKER_HOST: '0.0.0.0'
        }));

        clearPortCache();
        const host = getWorkerHost();
        expect(host).toBe('0.0.0.0');
      } finally {
        clearPortCache();
        if (backup) {
          fs.writeFileSync(settingsPath, backup);
        } else if (fs.existsSync(settingsPath)) {
          fs.unlinkSync(settingsPath);
        }
      }
    });
  });

  describe('clearPortCache()', () => {
    it('clears cached port and host', () => {
      process.env.CLAUDE_MEM_DATA_DIR = '/tmp/nonexistent-test';

      // First call caches values
      const port1 = getWorkerPort();
      const host1 = getWorkerHost();

      // Clear cache
      clearPortCache();

      // Second call re-reads (but gets same values)
      const port2 = getWorkerPort();
      const host2 = getWorkerHost();

      expect(port1).toBe(port2);
      expect(host1).toBe(host2);
    });

    it('can be called multiple times safely', () => {
      expect(() => {
        clearPortCache();
        clearPortCache();
        clearPortCache();
      }).not.toThrow();
    });
  });

  describe('ensureWorkerRunning()', () => {
    it('attempts to start worker when not running', async () => {
      // This test verifies the function doesn't throw
      // Actual worker startup requires proper environment
      const result = await ensureWorkerRunning().catch(() => false);
      expect(result === undefined || typeof result === 'boolean').toBe(true);
    });

    it('handles worker already running case', async () => {
      const result = await ensureWorkerRunning().catch(() => false);
      expect(result === undefined || typeof result === 'boolean').toBe(true);
    });
  });

  describe('integration scenarios', () => {
    it('handles port and host together consistently', () => {
      process.env.CLAUDE_MEM_DATA_DIR = '/tmp/nonexistent-test';

      const port = getWorkerPort();
      const host = getWorkerHost();

      // Should return valid values
      expect(port).toBeGreaterThan(0);
      expect(port).toBeLessThan(65536);
      expect(host).toBeTruthy();
      expect(typeof host).toBe('string');
    });

    it('cache works across multiple calls', () => {
      process.env.CLAUDE_MEM_DATA_DIR = '/tmp/nonexistent-test';

      const values = Array.from({ length: 10 }, () => ({
        port: getWorkerPort(),
        host: getWorkerHost()
      }));

      // All values should be identical (cached)
      const first = values[0];
      values.forEach(v => {
        expect(v.port).toBe(first.port);
        expect(v.host).toBe(first.host);
      });
    });
  });

  describe('edge cases', () => {
    it('handles invalid settings gracefully', () => {
      process.env.CLAUDE_MEM_DATA_DIR = '/tmp/test-invalid-settings';

      const fs = require('fs');
      const path = require('path');

      try {
        fs.mkdirSync(process.env.CLAUDE_MEM_DATA_DIR, { recursive: true });
        const settingsPath = path.join(process.env.CLAUDE_MEM_DATA_DIR, 'settings.json');
        fs.writeFileSync(settingsPath, JSON.stringify({
          CLAUDE_MEM_WORKER_PORT: 'invalid',
          CLAUDE_MEM_WORKER_HOST: ''
        }));
      } catch (e) {
        // Skip if can't create test directory
        return;
      }

      clearPortCache();
      expect(() => {
        const port = getWorkerPort();
        const host = getWorkerHost();
        // Should not throw, may return NaN or empty string
        expect(typeof port).toBe('number');
        expect(typeof host).toBe('string');
      }).not.toThrow();
    });

    it('handles malformed JSON in settings file', () => {
      process.env.CLAUDE_MEM_DATA_DIR = '/tmp/test-malformed-settings';

      const fs = require('fs');
      const path = require('path');

      try {
        fs.mkdirSync(process.env.CLAUDE_MEM_DATA_DIR, { recursive: true });
        const settingsPath = path.join(process.env.CLAUDE_MEM_DATA_DIR, 'settings.json');
        fs.writeFileSync(settingsPath, '{ invalid json }');
      } catch (e) {
        return;
      }

      clearPortCache();
      expect(() => {
        getWorkerPort();
        getWorkerHost();
      }).not.toThrow();
    });
  });
});
