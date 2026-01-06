import { describe, it, expect, vi } from 'vitest';
import { MigrationRunner } from '../../src/services/sqlite/MigrationRunner.js';

describe('MigrationRunner', () => {
  describe('migrations registration', () => {
    it('should register 13 migrations', () => {
      const mockDb = {
        prepare: vi.fn().mockReturnValue({
          all: vi.fn().mockReturnValue([]),
          get: vi.fn().mockReturnValue(undefined)
        }),
        run: vi.fn(),
        query: vi.fn()
      };

      const runner = new MigrationRunner(mockDb as any);
      expect((runner as any).migrations.size).toBe(13);
    });

    it('should have migration versions from 5 to 17', () => {
      const mockDb = {
        prepare: vi.fn().mockReturnValue({
          all: vi.fn().mockReturnValue([]),
          get: vi.fn().mockReturnValue(undefined)
        }),
        run: vi.fn(),
        query: vi.fn()
      };

      const runner = new MigrationRunner(mockDb as any);
      const versions = Array.from((runner as any).migrations.keys());

      expect(versions.length).toBe(13);
      expect(versions[0]).toBe(5);
      expect(versions[12]).toBe(17);
    });
  });

  describe('enhancement migrations', () => {
    it('should include conversation_summaries migration (v14)', () => {
      const mockDb = {
        prepare: vi.fn().mockReturnValue({
          all: vi.fn().mockReturnValue([]),
          get: vi.fn().mockReturnValue(undefined)
        }),
        run: vi.fn(),
        query: vi.fn().mockReturnValue({ some: () => true })
      };

      const runner = new MigrationRunner(mockDb as any);
      expect((runner as any).migrations.has(14)).toBe(true);
    });

    it('should include content_tags migration (v15)', () => {
      const mockDb = {
        prepare: vi.fn().mockReturnValue({
          all: vi.fn().mockReturnValue([]),
          get: vi.fn().mockReturnValue(undefined)
        }),
        run: vi.fn(),
        query: vi.fn().mockReturnValue({ some: () => true })
      };

      const runner = new MigrationRunner(mockDb as any);
      expect((runner as any).migrations.has(15)).toBe(true);
    });

    it('should include conversation_tags migration (v16)', () => {
      const mockDb = {
        prepare: vi.fn().mockReturnValue({
          all: vi.fn().mockReturnValue([]),
          get: vi.fn().mockReturnValue(undefined)
        }),
        run: vi.fn(),
        query: vi.fn().mockReturnValue({ some: () => true })
      };

      const runner = new MigrationRunner(mockDb as any);
      expect((runner as any).migrations.has(16)).toBe(true);
    });

    it('should include analysis_tasks migration (v17)', () => {
      const mockDb = {
        prepare: vi.fn().mockReturnValue({
          all: vi.fn().mockReturnValue([]),
          get: vi.fn().mockReturnValue(undefined)
        }),
        run: vi.fn(),
        query: vi.fn().mockReturnValue({ some: () => true })
      };

      const runner = new MigrationRunner(mockDb as any);
      expect((runner as any).migrations.has(17)).toBe(true);
    });
  });
});
