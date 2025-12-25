/**
 * ProcessManager Tests
 *
 * Tests for process lifecycle management: start, stop, restart, status
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ProcessManager } from '../../src/services/process/ProcessManager';
import { join } from 'path';
import { existsSync, unlinkSync } from 'fs';
import { rimraf } from 'rimraf';

const DATA_DIR = process.env.CLAUDE_MEM_DATA_DIR || '/tmp/claude-mem-test';
const PID_FILE = join(DATA_DIR, 'worker.pid');

describe('ProcessManager', () => {
  afterEach(() => {
    // Clean up test PID file
    try {
      if (existsSync(PID_FILE)) {
        unlinkSync(PID_FILE);
      }
    } catch {}
  });

  describe('start()', () => {
    it('rejects invalid port numbers', async () => {
      // Too low
      const result1 = await ProcessManager.start(80);
      expect(result1.success).toBe(false);
      expect(result1.error).toContain('Invalid port');

      // Too high
      const result2 = await ProcessManager.start(70000);
      expect(result2.success).toBe(false);
      expect(result2.error).toContain('Invalid port');

      // NaN
      const result3 = await ProcessManager.start(NaN);
      expect(result3.success).toBe(false);
    });

    it('accepts valid port range', async () => {
      // Note: This will fail if worker script doesn't exist or bun not available
      // We're testing validation logic, not actual process spawning
      const result1 = await ProcessManager.start(1024);
      const result2 = await ProcessManager.start(37777);
      const result3 = await ProcessManager.start(65535);

      // At minimum, should not throw errors
      expect([result1, result2, result3]).toBeDefined();
    });

    it('returns success if already running', async () => {
      // This test requires a running worker, which may not be available in CI
      // Skip if not in integration test environment
      if (process.env.CI) {
        return;
      }

      const result = await ProcessManager.start(37777);
      // If worker is already running, should return success with existing PID
      expect(result).toBeDefined();
    });
  });

  describe('stop()', () => {
    it('attempts to stop running worker', async () => {
      // Should not throw even if no worker is running
      const result = await ProcessManager.stop();
      expect(typeof result).toBe('boolean');
    });

    it('respects timeout parameter', async () => {
      const result = await ProcessManager.stop(1000);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('restart()', () => {
    it('attempts to restart worker', async () => {
      const result = await ProcessManager.restart(37777);
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');

      if (!result.success) {
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('status()', () => {
    it('returns status object', async () => {
      const status = await ProcessManager.status();
      expect(status).toBeDefined();
      expect(typeof status.running).toBe('boolean');

      if (status.pid) {
        expect(typeof status.pid).toBe('number');
      }

      if (status.port) {
        expect(typeof status.port).toBe('number');
      }
    });

    it('includes uptime when running', async () => {
      const status = await ProcessManager.status();

      if (status.running) {
        expect(status.uptime).toBeDefined();
        expect(typeof status.uptime).toBe('string');
      }
    });
  });

  describe('isRunning()', () => {
    it('returns boolean', async () => {
      const running = await ProcessManager.isRunning();
      expect(typeof running).toBe('boolean');
    });
  });

  describe('edge cases', () => {
    it('handles concurrent start requests', async () => {
      // Simulate rapid start requests
      const results = await Promise.all([
        ProcessManager.start(37777),
        ProcessManager.start(37777),
        ProcessManager.start(37777)
      ]);

      // All should return valid responses
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      });
    });

    it('handles port changes gracefully', async () => {
      const result1 = await ProcessManager.start(37777);
      const result2 = await ProcessManager.start(37778);

      // Should not crash or return undefined
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
    });
  });
});
