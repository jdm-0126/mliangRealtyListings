/**
 * Unit tests for error-handling and edge-case paths.
 * Tasks 10.1, 10.2, 10.4
 *
 * Feature: chat-recent-searches
 * Validates: Requirements 1.5 (localStorage unavailability), 1.6 (persistence across reload)
 *
 * Note: Task 10.3 (typing indicator during replay) requires React component mounting
 * and is located in errorHandlingComponent.test.tsx alongside the ChatWidget tests.
 *
 * These pure-function tests do NOT require jsdom's React renderer.
 */

import {
  persistRecentSearches,
  loadRecentSearches,
  saveRecentSearch,
  RECENT_SEARCHES_KEY,
  type RecentSearchEntry,
} from '@/lib/recentSearches'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(query: string): RecentSearchEntry {
  return { query, timestamp: new Date().toISOString() }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
  jest.restoreAllMocks()
})

afterEach(() => {
  jest.restoreAllMocks()
  localStorage.clear()
})

// ─── Task 10.1: persistRecentSearches with localStorage unavailable ───────────

describe('Task 10.1 – persistRecentSearches: no exception propagates when localStorage throws', () => {
  // Validates: Requirement 1.5 — IF localStorage is unavailable or throws THEN
  // the ChatWidget SHALL silently continue without displaying an error.

  it('does not throw when localStorage.setItem throws (quota exceeded)', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })

    const entries = [makeEntry('3BR house San Fernando')]
    expect(() => persistRecentSearches(entries)).not.toThrow()
  })

  it('does not throw when localStorage.setItem throws a generic Error', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('localStorage unavailable')
    })

    expect(() => persistRecentSearches([makeEntry('lot near Clark')])).not.toThrow()
  })

  it('does not throw when localStorage.setItem throws a SecurityError (private browsing)', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('SecurityError: The operation is insecure.')
    })

    const entries = [makeEntry('condo Angeles City')]
    expect(() => persistRecentSearches(entries)).not.toThrow()
  })

  it('does not throw when called with an empty array and localStorage throws', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('unavailable')
    })

    expect(() => persistRecentSearches([])).not.toThrow()
  })

  it('silently swallows the error — no value is written on failure', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('unavailable')
    })

    persistRecentSearches([makeEntry('house and lot in Mabalacat')])

    // localStorage.setItem was called but threw; nothing should be stored
    jest.restoreAllMocks()
    expect(localStorage.getItem(RECENT_SEARCHES_KEY)).toBeNull()
  })
})

// ─── Task 10.2: loadRecentSearches with localStorage unavailable ──────────────

describe('Task 10.2 – loadRecentSearches: returns [] without throwing when localStorage unavailable', () => {
  // Validates: Requirement 1.5 — IF localStorage is unavailable or throws THEN
  // the ChatWidget SHALL silently continue, returning [] for reads.

  it('returns [] when localStorage.getItem throws', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage unavailable')
    })

    const result = loadRecentSearches()
    expect(result).toEqual([])
  })

  it('does not throw when localStorage.getItem throws', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError')
    })

    expect(() => loadRecentSearches()).not.toThrow()
  })

  it('returns [] when localStorage.getItem throws a DOMException', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError')
    })

    expect(loadRecentSearches()).toEqual([])
  })

  it('returns [] when stored value is not valid JSON', () => {
    localStorage.setItem(RECENT_SEARCHES_KEY, '{ invalid json :::')
    expect(loadRecentSearches()).toEqual([])
    expect(() => loadRecentSearches()).not.toThrow()
  })

  it('returns [] when stored value is null (key not present)', () => {
    // localStorage is available but key is absent
    expect(loadRecentSearches()).toEqual([])
  })

  it('returns [] when stored value is a non-array JSON value', () => {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify({ query: 'oops', timestamp: new Date().toISOString() }))
    expect(loadRecentSearches()).toEqual([])
  })
})

// ─── Task 10.4: Full save → reload cycle ─────────────────────────────────────

describe('Task 10.4 – full save → reload cycle: entry persists after re-reading via loadRecentSearches()', () => {
  // Validates: Requirement 1.6 — THE Recent Searches Store SHALL persist across page
  // refreshes and new browser sessions, verifiable by reading localStorage after
  // a hard reload.
  //
  // Simulated "hard reload" = call persistRecentSearches to write, then call
  // loadRecentSearches() in a fresh call (no in-memory state) to read back.

  it('entry is present after save and reload (single entry)', () => {
    const query = '110 sqm lot near Clark under 5M'
    const entries = saveRecentSearch(query, [])
    persistRecentSearches(entries)

    // Simulate hard reload: read directly from localStorage via loadRecentSearches
    const reloaded = loadRecentSearches()

    expect(reloaded).toHaveLength(1)
    expect(reloaded[0].query).toBe(query)
  })

  it('entry is present after save and reload (five entries, newest-first order preserved)', () => {
    const queries = ['query A', 'query B', 'query C', 'query D', 'query E']

    // Build up the store one entry at a time
    let entries: RecentSearchEntry[] = []
    for (const q of queries) {
      entries = saveRecentSearch(q, entries)
    }
    persistRecentSearches(entries)

    const reloaded = loadRecentSearches()
    expect(reloaded).toHaveLength(5)
    // Last saved (query E) should be at index 0
    expect(reloaded[0].query).toBe('query E')
    // First saved (query A) should be at index 4
    expect(reloaded[4].query).toBe('query A')
  })

  it('timestamp is a valid ISO 8601 string after reload', () => {
    const entries = saveRecentSearch('2BR house San Fernando', [])
    persistRecentSearches(entries)

    const reloaded = loadRecentSearches()
    expect(reloaded).toHaveLength(1)
    expect(() => new Date(reloaded[0].timestamp).toISOString()).not.toThrow()
    expect(new Date(reloaded[0].timestamp).toISOString()).toBe(reloaded[0].timestamp)
  })

  it('directly reading localStorage.getItem returns the same data as loadRecentSearches()', () => {
    const query = 'house and lot Mabalacat'
    const entries = saveRecentSearch(query, [])
    persistRecentSearches(entries)

    // Directly simulate what would happen after a hard page reload
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY)
    expect(raw).not.toBeNull()
    const parsed: RecentSearchEntry[] = JSON.parse(raw!)

    const loaded = loadRecentSearches()
    expect(loaded).toEqual(parsed)
    expect(loaded[0].query).toBe(query)
  })

  it('returns only valid entries after reload when store contains mixed valid/invalid data', () => {
    // Simulate corrupted data that could have been written by an older version
    const corrupted = [
      { query: 'valid entry', timestamp: new Date().toISOString() },
      { query: '', timestamp: new Date().toISOString() },          // invalid: empty query
      { query: 123, timestamp: new Date().toISOString() },         // invalid: non-string query
      { query: 'also valid', timestamp: new Date().toISOString() },
      { timestamp: new Date().toISOString() },                     // invalid: missing query
    ]
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(corrupted))

    const reloaded = loadRecentSearches()
    expect(reloaded).toHaveLength(2)
    expect(reloaded.map((e) => e.query)).toEqual(['valid entry', 'also valid'])
  })
})
