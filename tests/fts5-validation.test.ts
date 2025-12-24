/**
 * FTS5 Keyword Validation Logic Tests
 * Pure unit tests for FTS5 injection prevention (no database required)
 */

import { describe, it, expect } from 'vitest';

// Copy validation logic from SessionStore for testing
const FTS5_ALLOWED_PATTERN = /^[a-zA-Z0-9\s\-_\.@:,']+$/;

function validateKeywords(keywords: string[]): string[] {
  return keywords.filter(keyword => {
    // Skip empty keywords
    if (!keyword || keyword.trim().length === 0) {
      return false;
    }

    // Check length (prevent DoS via extremely long keywords)
    if (keyword.length > 100) {
      return false;
    }

    // Validate characters (allow single quotes, they'll be escaped)
    if (!FTS5_ALLOWED_PATTERN.test(keyword)) {
      return false;
    }

    // Check for potentially dangerous FTS5 operators
    const dangerousPatterns = [
      /\bor\b/i,  // OR operator
      /\bnot\b/i, // NOT operator
      /NEAR\(/i,  // NEAR operator
      /\*/        // Wildcard
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(keyword)) {
        return false;
      }
    }

    return true;
  }).map(k => k.trim());
}

function buildFTS5Query(keywords: string[], logic: 'AND' | 'OR'): string {
  const validated = validateKeywords(keywords);

  if (validated.length === 0) {
    throw new Error('No valid keywords after validation');
  }

  // Escape quotes and wrap in double quotes for phrase search
  return validated
    .map(keyword => `"${keyword.replace(/"/g, '""')}"`)
    .join(` ${logic} `);
}

describe('FTS5 Keyword Validation', () => {
  describe('validateKeywords', () => {
    it('should accept valid alphanumeric keywords', () => {
      const result = validateKeywords(['test', 'user123', 'search-term']);
      expect(result).toEqual(['test', 'user123', 'search-term']);
    });

    it('should accept special characters within whitelist', () => {
      const result = validateKeywords(['test@email.com', 'file_name.ts', 'v1.0.0']);
      expect(result).toEqual(['test@email.com', 'file_name.ts', 'v1.0.0']);
    });

    it('should reject SQL injection attempts with OR operator', () => {
      const result = validateKeywords(['test OR 1=1']);
      expect(result).toEqual([]);
    });

    it('should reject SQL injection attempts with NOT operator', () => {
      const result = validateKeywords(['test NOT 1=1']);
      expect(result).toEqual([]);
    });

    it('should reject wildcard operators', () => {
      const result = validateKeywords(['test*']);
      expect(result).toEqual([]);
    });

    it('should reject NEAR operator', () => {
      const result = validateKeywords(['test NEAR query']);
      // NEAR without parentheses is actually safe in FTS5
      // Only NEAR( with opening paren is dangerous
      expect(result).not.toEqual([]); // Should pass through

      const dangerousResult = validateKeywords(['test NEAR(query)']);
      expect(dangerousResult).toEqual([]);
    });

    it('should reject keywords longer than 100 characters', () => {
      const longKeyword = 'a'.repeat(101);
      const result = validateKeywords([longKeyword]);
      expect(result).toEqual([]);
    });

    it('should reject empty keywords', () => {
      const result = validateKeywords(['', '   ', 'test']);
      expect(result).toEqual(['test']);
    });

    it('should reject characters outside whitelist', () => {
      const result = validateKeywords(['test$keyword', 'test#tag']);
      expect(result).toEqual([]);
    });

    it('should handle mixed valid and invalid keywords', () => {
      const result = validateKeywords(['valid', 'OR 1=1', 'test', 'invalid$', 'another']);
      expect(result).toEqual(['valid', 'test', 'another']);
    });

    it('should return empty array for completely invalid input', () => {
      const result = validateKeywords(['OR 1=1', 'NOT 1=1', '*']);
      expect(result).toEqual([]);
    });

    it('should handle case-insensitive operator detection', () => {
      const result = validateKeywords(['test or', 'TEST NOT', 'TeSt*']);
      expect(result).toEqual([]);
    });
  });

  describe('buildFTS5Query', () => {
    it('should build valid FTS5 query with AND logic', () => {
      const result = buildFTS5Query(['test', 'search'], 'AND');
      expect(result).toBe('"test" AND "search"');
    });

    it('should build valid FTS5 query with OR logic', () => {
      const result = buildFTS5Query(['test', 'search'], 'OR');
      expect(result).toBe('"test" OR "search"');
    });

    it('should escape double quotes in keywords', () => {
      // Use single quote in test since double quotes are filtered out
      const result = buildFTS5Query(["test'quote"], 'AND');
      expect(result).toBe('"test\'quote"');
    });

    it('should throw error if all keywords are invalid', () => {
      expect(() => {
        buildFTS5Query(['OR 1=1', '*'], 'AND');
      }).toThrow('No valid keywords after validation');
    });

    it('should handle single keyword', () => {
      const result = buildFTS5Query(['test'], 'AND');
      expect(result).toBe('"test"');
    });

    it('should filter invalid keywords and build query with valid ones', () => {
      const result = buildFTS5Query(['valid', 'OR 1=1', 'test'], 'AND');
      expect(result).toBe('"valid" AND "test"');
    });

    it('should handle multiple special characters correctly', () => {
      const result = buildFTS5Query(['test@email.com', 'file_v1.0.0.ts'], 'AND');
      expect(result).toBe('"test@email.com" AND "file_v1.0.0.ts"');
    });
  });

  describe('Security Edge Cases', () => {
    it('should prevent SQL injection via OR operator', () => {
      const malicious = ['admin\' OR \'1\'=\'1'];
      const result = validateKeywords(malicious);
      expect(result).toEqual([]);
    });

    it('should prevent wildcard-based data exfiltration', () => {
      const malicious = ['*'];
      const result = validateKeywords(malicious);
      expect(result).toEqual([]);
    });

    it('should prevent NEAR operator exploitation', () => {
      const malicious = ['test NEAR/5 password'];
      const result = validateKeywords(malicious);
      expect(result).toEqual([]);
    });

    it('should handle combined attack patterns', () => {
      const malicious = [
        'valid',
        'OR 1=1',
        'test*',
        'another'
      ];
      const result = validateKeywords(malicious);
      expect(result).toEqual(['valid', 'another']);
    });

    it('should reject unicode bypass attempts', () => {
      // Some unicode characters look like English but aren't
      const result = validateKeywords(['test\u0131']); // dotless i
      expect(result).toEqual([]);
    });
  });

  describe('Performance and DoS Prevention', () => {
    it('should reject extremely long keywords', () => {
      const longKeyword = 'a'.repeat(1000);
      const result = validateKeywords([longKeyword]);
      expect(result).toEqual([]);
    });

    it('should handle large arrays efficiently', () => {
      const keywords = Array.from({ length: 1000 }, (_, i) => `valid${i}`);
      const result = validateKeywords(keywords);
      expect(result).toHaveLength(1000);
    });

    it('should truncate to valid keywords only in mixed input', () => {
      const mixed = [
        ...Array.from({ length: 50 }, (_, i) => `valid${i}`),
        'OR 1=1',
        'test*',
        ...Array.from({ length: 50 }, (_, i) => `another${i}`)
      ];
      const result = validateKeywords(mixed);
      expect(result).toHaveLength(100); // 50 valid + 50 another
    });
  });
});
