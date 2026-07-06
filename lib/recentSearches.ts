/**
 * Pure helper functions for the Chat Recent Searches feature.
 * All localStorage interactions are wrapped in try/catch for graceful degradation.
 */

// ─── 1.1 Interface and constants ────────────────────────────────────────────

/** A single entry in the Recent Searches Store */
export interface RecentSearchEntry {
  query: string;      // non-empty, max 200 chars
  timestamp: string;  // ISO 8601
}

export const RECENT_SEARCHES_KEY = 'chat_recent_searches';
export const MAX_RECENT_SEARCHES = 5;
export const MAX_QUERY_LENGTH = 200;
export const ENABLE_AUTO_LOAD = false;

// ─── 1.2 isValidIso8601 ─────────────────────────────────────────────────────

/**
 * Returns true if `value` parses to a valid Date (not NaN) AND matches the
 * ISO 8601 prefix regex `^\d{4}-\d{2}-\d{2}T`.
 */
export function isValidIso8601(value: string): boolean {
  if (typeof value !== 'string') return false;
  const ISO_PREFIX = /^\d{4}-\d{2}-\d{2}T/;
  if (!ISO_PREFIX.test(value)) return false;
  const d = new Date(value);
  return !isNaN(d.getTime());
}

// ─── 1.3 isValidEntry ───────────────────────────────────────────────────────

/**
 * Type guard. Returns true iff:
 * - entry is a non-null plain object
 * - entry.query is a string, non-empty after trim, length ≤ 200
 * - entry.timestamp passes isValidIso8601
 */
export function isValidEntry(entry: unknown): entry is RecentSearchEntry {
  if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
    return false;
  }
  const obj = entry as Record<string, unknown>;

  // Validate query
  if (typeof obj.query !== 'string') return false;
  const trimmedQuery = obj.query.trim();
  if (trimmedQuery.length === 0 || trimmedQuery.length > MAX_QUERY_LENGTH) return false;

  // Validate timestamp
  if (typeof obj.timestamp !== 'string') return false;
  if (!isValidIso8601(obj.timestamp)) return false;

  return true;
}

// ─── 1.4 loadRecentSearches ─────────────────────────────────────────────────

/**
 * Reads localStorage, JSON-parses the stored value, filters with isValidEntry,
 * and returns the cleaned array. Returns [] on any exception or missing key.
 */
export function loadRecentSearches(): RecentSearchEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (raw === null) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidEntry);
  } catch {
    return [];
  }
}

// ─── 1.5 saveRecentSearch ───────────────────────────────────────────────────

/**
 * Pure function — takes the current entries array, returns the updated array
 * without touching localStorage.
 *
 * Algorithm:
 * 1. Trim query; if empty or length > MAX_QUERY_LENGTH, return existing unchanged.
 * 2. Remove any entry where entry.query (lower) === trimmed query (lower).
 * 3. Prepend { query: trimmed, timestamp: new Date().toISOString() }.
 * 4. Slice to MAX_RECENT_SEARCHES.
 * 5. Return the new array.
 */
export function saveRecentSearch(
  query: string,
  existing: RecentSearchEntry[]
): RecentSearchEntry[] {
  const trimmed = query.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_QUERY_LENGTH) {
    return existing;
  }

  const lowerTrimmed = trimmed.toLowerCase();
  const deduplicated = existing.filter(
    (entry) => entry.query.toLowerCase() !== lowerTrimmed
  );

  const newEntry: RecentSearchEntry = {
    query: trimmed,
    timestamp: new Date().toISOString(),
  };

  return [newEntry, ...deduplicated].slice(0, MAX_RECENT_SEARCHES);
}

// ─── 1.6 persistRecentSearches ──────────────────────────────────────────────

/**
 * Writes the entries array as JSON to localStorage.
 * Catches and suppresses any exception (quota exceeded, private browsing, etc.).
 */
export function persistRecentSearches(entries: RecentSearchEntry[]): void {
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(entries));
  } catch {
    // Silently degrade — UI state already updated in memory
  }
}

// ─── 1.7 clearRecentSearchesStorage ─────────────────────────────────────────

/**
 * Removes the RECENT_SEARCHES_KEY from localStorage.
 * Catches and suppresses any exception.
 */
export function clearRecentSearchesStorage(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Silently degrade
  }
}

// ─── 1.8 truncateQuery ──────────────────────────────────────────────────────

/**
 * Returns query unchanged if query.length <= maxLen,
 * otherwise returns query.slice(0, maxLen) + '…' (Unicode ellipsis U+2026).
 */
export function truncateQuery(query: string, maxLen = 80): string {
  if (query.length <= maxLen) return query;
  return query.slice(0, maxLen) + '\u2026';
}
