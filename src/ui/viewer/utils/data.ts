/**
 * Data manipulation utility functions
 * Used for merging and deduplicating real-time and paginated data
 * Optimized for performance with O(n) Set-based deduplication
 */

/**
 * Safe limit for array operations to prevent UI freezing
 */
const MAX_ARRAY_SIZE = 1000;

/**
 * Check if array is safe to process
 */
export function isSafeArraySize(arr: unknown[]): boolean {
  return arr.length < MAX_ARRAY_SIZE;
}

/**
 * Truncate array to safe size
 */
export function truncateArray<T>(arr: T[], maxSize: number = MAX_ARRAY_SIZE): T[] {
  if (arr.length <= maxSize) return arr;
  return arr.slice(0, maxSize);
}

/**
 * Optimized O(n) merge and deduplication using Set
 * Preserves order from first occurrence
 *
 * NOTE: This should ONLY be used when no project filter is active.
 * When filtering, use ONLY paginated data (API-filtered).
 *
 * @param liveItems - Items from SSE stream (unfiltered)
 * @param paginatedItems - Items from pagination API
 * @returns Merged and deduplicated array
 */
export function mergeAndDeduplicateByProject<T extends { id: number; project?: string }>(
  liveItems: T[],
  paginatedItems: T[]
): T[] {
  // Safety check for large arrays
  if (!isSafeArraySize(liveItems) || !isSafeArraySize(paginatedItems)) {
    console.warn('[mergeAndDeduplicateByProject] Array size exceeds safe limit, truncating');
    return mergeAndDeduplicateByProject(
      truncateArray(liveItems),
      truncateArray(paginatedItems)
    );
  }

  // O(n) deduplication using Set
  const seen = new Set<number>();
  const result: T[] = [];

  // Process in order to prioritize first occurrence (live items first)
  for (const item of [...liveItems, ...paginatedItems]) {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push(item);
    }
  }

  return result;
}

/**
 * Batch array processing for large arrays
 * Prevents UI freezing by processing in chunks
 */
export function processInBatches<T, R>(
  arr: T[],
  processor: (batch: T[]) => R[],
  batchSize: number = 100
): R[] {
  const results: R[] = [];

  for (let i = 0; i < arr.length; i += batchSize) {
    const batch = arr.slice(i, i + batchSize);
    results.push(...processor(batch));
  }

  return results;
}

/**
 * Remove duplicate items from array by ID
 */
export function deduplicateById<T extends { id: number }>(arr: T[]): T[] {
  const seen = new Set<number>();
  return arr.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/**
 * Merge multiple arrays and deduplicate
 */
export function mergeMultiple<T extends { id: number }>(...arrays: T[][]): T[] {
  return mergeAndDeduplicateByProject(arrays.flat() as any);
}
