/**
 * Property-based tests for the Chat Recent Searches pure helper functions.
 * Properties 1, 2, 3, and 9 — using fast-check.
 *
 * The default Jest environment for this project is jsdom (see jest.config.js),
 * so localStorage is available for Properties 2 and 9.
 */

import fc from 'fast-check';
import {
  saveRecentSearch,
  loadRecentSearches,
  persistRecentSearches,
  isValidIso8601,
  RECENT_SEARCHES_KEY,
  MAX_RECENT_SEARCHES,
  type RecentSearchEntry,
} from '../../lib/recentSearches';

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/** Valid query: non-empty after trim, max 200 chars, already trimmed (as saveRecentSearch stores it) */
const validQuery = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter((s) => s.trim().length > 0)
  .map((s) => s.trim());

/**
 * ISO 8601 date strings constrained to years 1000–9999 so they always
 * serialize with a 4-digit year (the regex ^\d{4}-\d{2}-\d{2}T will match).
 */
const validIso8601 = fc
  .date({
    min: new Date('1000-01-01T00:00:00.000Z'),
    max: new Date('9999-12-31T23:59:59.999Z'),
  })
  .map((d) => d.toISOString())
  .filter((s) => /^\d{4}-\d{2}-\d{2}T/.test(s));

/** Valid RecentSearchEntry */
const validEntry = fc.record({
  query: validQuery,
  timestamp: validIso8601,
});

/** Valid store of 1–5 entries with unique queries (case-insensitive) */
const validStore = fc
  .array(validEntry, { minLength: 1, maxLength: 5 })
  .filter(
    (entries) =>
      new Set(entries.map((e) => e.query.toLowerCase())).size === entries.length
  );

// ─── Helpers ─────────────────────────────────────────────────────────────────

function clearStorage() {
  localStorage.removeItem(RECENT_SEARCHES_KEY);
}

// ─── Property 1: Store Invariants After Save ──────────────────────────────────

describe('Property 1: Store Invariants After Save', () => {
  // Feature: chat-recent-searches, Property 1: Store Invariants After Save
  it(
    'after saving any sequence of valid queries one-by-one, the store has ≤5 entries, newest-first order, and no duplicate queries',
    () => {
      fc.assert(
        fc.property(
          fc.array(validQuery, { minLength: 1, maxLength: 12 }),
          (queries) => {
            // Apply saves one-by-one starting from empty store
            let store: RecentSearchEntry[] = [];
            for (const q of queries) {
              store = saveRecentSearch(q, store);
            }

            // ≤ MAX_RECENT_SEARCHES entries
            expect(store.length).toBeLessThanOrEqual(MAX_RECENT_SEARCHES);

            // Each entry has a valid ISO 8601 timestamp
            for (const entry of store) {
              expect(isValidIso8601(entry.timestamp)).toBe(true);
            }

            // No two entries share the same query text (case-insensitive)
            const lowerQueries = store.map((e) => e.query.toLowerCase());
            const uniqueQueries = new Set(lowerQueries);
            expect(uniqueQueries.size).toBe(store.length);

            // Newest-first: the last saved non-duplicate query must be at index 0
            // (find the last query in the sequence that would have ended up stored)
            const lastSavedQuery = [...queries]
              .reverse()
              .find(
                (q) =>
                  q.trim().length > 0 && q.trim().length <= 200
              );
            if (lastSavedQuery) {
              expect(store[0].query.toLowerCase()).toBe(
                lastSavedQuery.trim().toLowerCase()
              );
            }
          }
        ),
        { numRuns: 200 }
      );
    }
  );
});

// ─── Property 2: Save-then-Load Round Trip ────────────────────────────────────

describe('Property 2: Save-then-Load Round Trip', () => {
  // Feature: chat-recent-searches, Property 2: Save-then-Load Round Trip
  beforeEach(() => clearStorage());
  afterEach(() => clearStorage());

  it(
    'for any valid query saved then loaded, index 0 has the trimmed query and a valid ISO 8601 timestamp',
    () => {
      fc.assert(
        fc.property(validQuery, (query) => {
          // Save to store and persist to localStorage
          const updated = saveRecentSearch(query, []);
          persistRecentSearches(updated);

          // Load back
          const loaded = loadRecentSearches();

          // Must have at least one entry
          expect(loaded.length).toBeGreaterThan(0);

          // Index 0 query equals trimmed input
          expect(loaded[0].query).toBe(query.trim());

          // Index 0 timestamp is a valid ISO 8601 string
          expect(isValidIso8601(loaded[0].timestamp)).toBe(true);
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ─── Property 3: Deduplication Preserves Uniqueness ──────────────────────────

describe('Property 3: Deduplication Preserves Uniqueness', () => {
  // Feature: chat-recent-searches, Property 3: Deduplication Preserves Uniqueness
  it(
    'saving a query that case-insensitively matches an existing entry results in exactly one matching entry at index 0 with no length increase',
    () => {
      fc.assert(
        fc.property(
          validStore,
          fc.nat({ max: 4 }),
          fc.boolean(),
          (existing, indexSeed, useUpperCase) => {
            // Pick an existing entry index (clamped to actual array length)
            const idx = indexSeed % existing.length;
            const originalQuery = existing[idx].query;

            // Create a variant that matches case-insensitively
            const variant = useUpperCase
              ? originalQuery.toUpperCase()
              : originalQuery.toLowerCase();

            const originalLength = existing.length;
            const result = saveRecentSearch(variant, existing);

            // Exactly one entry whose query matches case-insensitively
            const matchingEntries = result.filter(
              (e) => e.query.toLowerCase() === variant.trim().toLowerCase()
            );
            expect(matchingEntries.length).toBe(1);

            // That entry is at index 0
            expect(result[0].query.toLowerCase()).toBe(
              variant.trim().toLowerCase()
            );

            // Array length must not exceed the original length
            expect(result.length).toBeLessThanOrEqual(originalLength);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ─── Property 9: Data Integrity Filtering ────────────────────────────────────

describe('Property 9: Data Integrity Filtering', () => {
  // Feature: chat-recent-searches, Property 9: Data Integrity Filtering
  beforeEach(() => clearStorage());
  afterEach(() => clearStorage());

  /**
   * Arbitrary for invalid entries — entries that should be filtered out.
   * Covers all the cases listed in the spec:
   *   - missing query
   *   - empty query
   *   - non-string query
   *   - missing timestamp
   *   - non-string timestamp
   *   - invalid ISO 8601 timestamp
   *   - non-object shapes (primitives, arrays, null)
   */
  const invalidEntry = fc.oneof(
    // Missing query field
    fc.record({ timestamp: validIso8601 }),
    // Empty query
    fc.record({ query: fc.constant(''), timestamp: validIso8601 }),
    // Whitespace-only query
    fc.record({ query: fc.constant('   '), timestamp: validIso8601 }),
    // Non-string query
    fc.record({ query: fc.integer(), timestamp: validIso8601 }),
    // Missing timestamp field
    fc.record({ query: validQuery }),
    // Non-string timestamp
    fc.record({ query: validQuery, timestamp: fc.integer() }),
    // Invalid ISO 8601 timestamp (plain text that won't parse)
    fc.record({ query: validQuery, timestamp: fc.constant('not-a-date') }),
    // Null
    fc.constant(null),
    // Primitive number
    fc.integer(),
    // Primitive string
    fc.string(),
    // Array instead of object
    fc.array(fc.string(), { maxLength: 3 }),
  );

  it(
    'loadRecentSearches returns only valid entries, discards invalid ones, and never throws',
    () => {
      fc.assert(
        fc.property(
          fc.array(validEntry, { minLength: 0, maxLength: 5 }),
          fc.array(invalidEntry, { minLength: 0, maxLength: 5 }),
          (validEntries, invalidEntries) => {
            // Shuffle valid and invalid entries together
            const mixed: unknown[] = [];
            let vi = 0;
            let ii = 0;
            while (vi < validEntries.length || ii < invalidEntries.length) {
              if (vi < validEntries.length) mixed.push(validEntries[vi++]);
              if (ii < invalidEntries.length) mixed.push(invalidEntries[ii++]);
            }

            // Write the mixed array directly to localStorage
            localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(mixed));

            // loadRecentSearches must not throw
            let result: RecentSearchEntry[];
            expect(() => {
              result = loadRecentSearches();
            }).not.toThrow();

            // Must return exactly the valid entries (same count)
            expect(result!.length).toBe(validEntries.length);

            // Every returned entry must have a non-empty query and valid ISO 8601 timestamp
            for (const entry of result!) {
              expect(typeof entry.query).toBe('string');
              expect(entry.query.trim().length).toBeGreaterThan(0);
              expect(isValidIso8601(entry.timestamp)).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
