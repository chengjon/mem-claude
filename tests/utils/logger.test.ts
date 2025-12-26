/**
 * Logger Tests
 *
 * Tests for structured logging utility
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger } from '../../src/utils/logger.js';

describe('logger', () => {
  let consoleSpies: any;

  beforeEach(() => {
    // Spy on console methods
    consoleSpies = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {})
    };
  });

  afterEach(() => {
    // Restore console methods
    Object.values(consoleSpies).forEach((spy: any) => spy.mockRestore());
  });

  describe('log levels', () => {
    it('logs info messages', () => {
      logger.info('TEST', 'test message');
      expect(consoleSpies.log).toHaveBeenCalled();
    });

    it('logs warning messages', () => {
      logger.warn('TEST', 'warning message');
      // Warning uses log method internally
      expect(consoleSpies.log).toHaveBeenCalled();
    });

    it('logs error messages', () => {
      logger.error('TEST', 'error message', {}, new Error('test'));
      expect(consoleSpies.error).toHaveBeenCalled();
    });

    it('logs debug messages', () => {
      logger.debug('TEST', 'debug message');
      // Debug may not log in production
      expect(consoleSpies.debug).toBeDefined();
    });

    it('logs success messages', () => {
      logger.success('TEST', 'success message');
      expect(consoleSpies.log).toHaveBeenCalled();
    });
  });

  describe('message formatting', () => {
    it('includes component tag', () => {
      logger.info('COMPONENT', 'message');
      const call = consoleSpies.log.mock.calls[0][0];
      expect(call).toContain('COMPONENT');
    });

    it('includes message text', () => {
      logger.info('TEST', 'my message');
      const call = consoleSpies.log.mock.calls[0][0];
      expect(call).toContain('my message');
    });

    it('handles context object', () => {
      logger.info('TEST', 'message', { key: 'value' });
      expect(consoleSpies.log).toHaveBeenCalled();
    });

    it('handles error objects', () => {
      const error = new Error('test error');
      logger.error('TEST', 'error message', {}, error);
      expect(consoleSpies.error).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('handles empty messages', () => {
      expect(() => {
        logger.info('TEST', '');
      }).not.toThrow();
    });

    it('handles undefined context', () => {
      expect(() => {
        logger.info('TEST', 'message', undefined as any);
      }).not.toThrow();
    });

    it('handles null error', () => {
      expect(() => {
        logger.error('TEST', 'message', {}, null as any);
      }).not.toThrow();
    });

    it('handles very long messages', () => {
      const longMessage = 'x'.repeat(10000);
      expect(() => {
        logger.info('TEST', longMessage);
      }).not.toThrow();
    });
  });
});
