/**
 * Tests for stripMemoryTags function
 * Verifies tag stripping and type safety for dual-tag system
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { stripMemoryTagsFromJson } from '../dist/utils/tag-stripping.js';

// Alias for clarity in tests (this tests the JSON context version)
const stripMemoryTags = stripMemoryTagsFromJson;

describe('stripMemoryTags', () => {
  // Basic functionality tests - <mem-claude-context>
  it('should strip <mem-claude-context> tags', () => {
    const input = 'before <mem-claude-context>injected content</mem-claude-context> after';
    const expected = 'before  after';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  // Basic functionality tests - <private>
  it('should strip <private> tags', () => {
    const input = 'before <private>sensitive data</private> after';
    const expected = 'before  after';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  it('should strip both tag types in one string', () => {
    const input = '<mem-claude-context>context</mem-claude-context> middle <private>private</private>';
    const expected = 'middle';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  it('should handle nested tags', () => {
    const input = '<mem-claude-context>outer <private>inner</private> outer</mem-claude-context>';
    const expected = '';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  it('should handle multiline content in tags', () => {
    const input = `before
<mem-claude-context>
line 1
line 2
line 3
</mem-claude-context>
after`;
    const expected = 'before\n\nafter';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  it('should handle multiple tags of same type', () => {
    const input = '<private>first</private> middle <private>second</private>';
    const expected = 'middle';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  it('should return empty string for content that is only tags', () => {
    const input = '<mem-claude-context>only this</mem-claude-context>';
    const expected = '';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  it('should handle strings without tags', () => {
    const input = 'no tags here';
    const expected = 'no tags here';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  it('should handle empty string', () => {
    const input = '';
    const expected = '';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  it('should trim whitespace after stripping', () => {
    const input = '   <mem-claude-context>content</mem-claude-context>   ';
    const expected = '';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  it('should handle malformed tags (unclosed)', () => {
    const input = '<mem-claude-context>unclosed tag content';
    const expected = '<mem-claude-context>unclosed tag content';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  it('should handle tag-like strings that are not actual tags', () => {
    const input = 'This is not a <tag> but looks like one';
    const expected = 'This is not a <tag> but looks like one';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  // Type safety tests
  it('should handle non-string input safely (number)', () => {
    const input = 123 as any;
    const expected = '{}';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  it('should handle non-string input safely (null)', () => {
    const input = null as any;
    const expected = '{}';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  it('should handle non-string input safely (undefined)', () => {
    const input = undefined as any;
    const expected = '{}';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  it('should handle non-string input safely (object)', () => {
    const input = { foo: 'bar' } as any;
    const expected = '{}';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  it('should handle non-string input safely (array)', () => {
    const input = ['test'] as any;
    const expected = '{}';
    assert.strictEqual(stripMemoryTags(input), expected);
  });

  // Real-world JSON scenarios
  it('should strip tags from JSON.stringify output', () => {
    const obj = {
      message: 'hello',
      context: '<mem-claude-context>past observation</mem-claude-context>',
      private: '<private>sensitive</private>'
    };
    const jsonStr = JSON.stringify(obj);
    const result = stripMemoryTags(jsonStr);

    // Tags should be stripped from the JSON string
    assert.ok(!result.includes('<mem-claude-context>'));
    assert.ok(!result.includes('</mem-claude-context>'));
    assert.ok(!result.includes('<private>'));
    assert.ok(!result.includes('</private>'));
  });

  it('should handle very large content efficiently', () => {
    const largeContent = 'x'.repeat(10000);
    const input = `<mem-claude-context>${largeContent}</mem-claude-context>`;
    const expected = '';
    assert.strictEqual(stripMemoryTags(input), expected);
  });
});
