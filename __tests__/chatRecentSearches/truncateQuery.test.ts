/**
 * Property-based tests for truncateQuery.
 * Property 4 — using fast-check.
 *
 * Feature: chat-recent-searches, Property 4: Query Truncation in Display
 */

import fc from 'fast-check';
import { truncateQuery } from '../../lib/recentSearches';

describe('Property 4: Query Truncation in Display', () => {
  // Feature: chat-recent-searches, Property 4: Query Truncation in Display
  it(
    'truncateQuery(query, 80) always returns a string of length ≤ 81 characters',
    () => {
      fc.assert(
        fc.property(fc.string({ minLength: 0, maxLength: 300 }), (query) => {
          const result = truncateQuery(query, 80);
          // Result length is at most maxLen (80) + 1 for the ellipsis character
          expect(result.length).toBeLessThanOrEqual(81);
        }),
        { numRuns: 100 }
      );
    }
  );

  it(
    'if original string length ≤ 80, truncateQuery returns it unchanged exactly',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 80 }),
          (query) => {
            const result = truncateQuery(query, 80);
            expect(result).toBe(query);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it(
    'if original string length > 80, the result ends with the ellipsis character and is exactly 81 chars',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 81, maxLength: 300 }),
          (query) => {
            const result = truncateQuery(query, 80);
            expect(result.length).toBe(81);
            expect(result.endsWith('\u2026')).toBe(true);
            expect(result.slice(0, 80)).toBe(query.slice(0, 80));
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
