# Performance Analysis - claude-mem

## Summary
Analysis of performance bottlenecks and optimization opportunities identified in the codebase.

## Critical Performance Issues

### 1. JSON Array Queries in SQLite (HIGH PRIORITY)
**Location**: `src/services/sqlite/SessionSearch.ts`

**Issue**: Using `EXISTS (SELECT 1 FROM json_each(...))` for searching JSON arrays is very slow for large datasets.

**Examples**:
- Line 201-208: Concepts filter using `json_each(${tableAlias}.concepts)`
- Line 214-225: Files filter with nested `EXISTS` clauses
- Line 399-403: `findByFile()` using similar pattern

**Impact**: Every search with concepts or files filters scans entire JSON arrays

**Solutions**:
1. **Add virtual columns** with indexes for frequently searched JSON fields
2. **Use generated columns** that extract array contents to searchable text
3. **Add triggers** to maintain separate junction tables for many-to-many relationships
4. **Consider FTS5 external content tables** for JSON fields

**Example Optimization**:
```sql
-- Add virtual columns for concept searching
ALTER TABLE observations ADD COLUMN concepts_search TEXT GENERATED ALWAYS AS (
  json_extract(concepts, '$')
) STORED;

CREATE INDEX idx_observations_concepts_search ON observations(concepts_search);
```

---

### 2. Sequential Search Operations (MEDIUM PRIORITY)
**Location**: `src/services/worker/SearchManager.ts`

**Issue**: Multiple independent searches run sequentially instead of in parallel.

**Examples**:
- Lines 771-794: `changes()` runs 3 searches sequentially
  - `findByType('change')`
  - `findByConcept('change')`
  - `findByConcept('what-changed')`
- Lines 862-878: `howItWorks()` metadata search then Chroma ranking
- Lines 1143-1167: `findByConcept()` metadata-first then Chroma

**Impact**: Searches that could run in parallel add latency

**Solution**: Use `Promise.all()` for independent searches

**Example**:
```typescript
// Instead of:
const typeResults = this.sessionSearch.findByType('change', filters);
const conceptChangeResults = this.sessionSearch.findByConcept('change', filters);
const conceptWhatChangedResults = this.sessionSearch.findByConcept('what-changed', filters);

// Use:
const [typeResults, conceptChangeResults, conceptWhatChangedResults] = await Promise.all([
  Promise.resolve(this.sessionSearch.findByType('change', filters)),
  Promise.resolve(this.sessionSearch.findByConcept('change', filters)),
  Promise.resolve(this.sessionSearch.findByConcept('what-changed', filters))
]);
```

---

### 3. Multiple Array Iterations (MEDIUM PRIORITY)
**Location**: `src/services/worker/SearchManager.ts`

**Issue**: Multiple sequential iterations over result arrays for grouping, sorting, filtering.

**Examples**:
- Lines 276-303: Map → sort → slice → groupByDate → nested grouping
- Lines 514-520: Map → sort → filter
- Lines 1599-1605: Map → sort → filter

**Impact**: O(n) operations repeated multiple times

**Solution**: Combine operations where possible, use single-pass algorithms

**Example**:
```typescript
// Instead of multiple passes:
const allResults: CombinedResult[] = [
  ...observations.map(obs => ({ ... })),
  ...sessions.map(sess => ({ ... })),
  ...prompts.map(prompt => ({ ... }))
];
allResults.sort((a, b) => b.epoch - a.epoch);
const limitedResults = allResults.slice(0, options.limit || 20);
const resultsByDate = groupByDate(limitedResults, ...);

// Use a more efficient approach:
const combined = new Map<string, CombinedResult[]>();
// Single pass to combine, sort, and limit
```

---

### 4. Inefficient ID Array Operations (LOW-MEDIUM PRIORITY)
**Location**: `src/services/worker/SearchManager.ts`

**Issue**: Using `Array.includes()` in loops creates O(n²) complexity.

**Examples**:
- Lines 706-709: `if (ids.includes(chromaId) && !rankedIds.includes(chromaId))`
- Lines 785-789: Similar pattern in `changes()`
- Lines 869-873: Similar pattern in `howItWorks()`

**Impact**: For large result sets (100+ items), this becomes expensive

**Solution**: Use Set for O(1) lookups

**Example**:
```typescript
// Instead of:
const rankedIds: number[] = [];
for (const chromaId of chromaResults.ids) {
  if (ids.includes(chromaId) && !rankedIds.includes(chromaId)) {
    rankedIds.push(chromaId);
  }
}

// Use:
const idsSet = new Set(ids);
const rankedSet = new Set<number>();
for (const chromaId of chromaResults.ids) {
  if (idsSet.has(chromaId)) {
    rankedSet.add(chromaId);
  }
}
const rankedIds = Array.from(rankedSet);
```

---

### 5. Missing Database Indexes (HIGH PRIORITY)
**Location**: `src/services/sqlite/` (various files)

**Issue**: Common query patterns may lack proper indexes.

**Potential Missing Indexes**:
```sql
-- Check if these exist and are being used:
CREATE INDEX IF NOT EXISTS idx_observations_created_at_epoch
  ON observations(created_at_epoch DESC);

CREATE INDEX IF NOT EXISTS idx_observations_project
  ON observations(project);

CREATE INDEX IF NOT EXISTS idx_observations_type
  ON observations(type);

CREATE INDEX IF NOT EXISTS idx_session_summaries_created_at_epoch
  ON session_summaries(created_at_epoch DESC);

CREATE INDEX IF NOT EXISTS idx_user_prompts_session
  ON user_prompts(claude_session_id);
```

**Verification**: Run `EXPLAIN QUERY PLAN` on slow queries

---

## Optimization Priority Matrix

| Priority | Issue | Impact | Effort | ROI |
|----------|-------|--------|--------|-----|
| **HIGH** | JSON array queries | High | Medium | ⭐⭐⭐⭐⭐ |
| **HIGH** | Missing indexes | High | Low | ⭐⭐⭐⭐⭐ |
| **MEDIUM** | Sequential searches | Medium | Low | ⭐⭐⭐⭐ |
| **MEDIUM** | Multiple iterations | Medium | Medium | ⭐⭐⭐ |
| **LOW-MED** | ID array operations | Low-Med | Low | ⭐⭐⭐ |

---

## Recommended Action Plan

### Phase 1: Quick Wins (1-2 hours)
1. Add missing database indexes
2. Use `Promise.all()` for independent searches
3. Convert ID array lookups to Sets

### Phase 2: Medium Effort (4-6 hours)
1. Add generated columns for JSON searching
2. Combine array iterations where possible
3. Add query performance monitoring

### Phase 3: Advanced (8-12 hours)
1. Implement junction tables for many-to-many relationships
2. Add query result caching
3. Optimize Chroma/SQLite hybrid search paths

---

## Performance Monitoring Recommendations

1. **Add timing logs** to all search operations
2. **Track query execution plans** for slow queries
3. **Monitor Chroma vs SQLite fallback rates**
4. **Set up performance regression tests**

### Example Monitoring Code:
```typescript
const startTime = performance.now();
// ... operation ...
const duration = performance.now() - startTime;
if (duration > 100) {
  logger.warn('PERF', `Slow operation`, { operation, duration: `${duration.toFixed(2)}ms` });
}
```

---

## Testing Optimizations

Before deploying optimizations:
1. Benchmark search queries with large datasets (1000+ observations)
2. Test with complex filter combinations
3. Verify Chroma/SQLite hybrid search performance
4. Profile memory usage during large timeline queries
