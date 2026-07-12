# Implementation Plan: Chat Recent Searches

## Overview

Tasks to implement the Chat Recent Searches feature. All implementation is scoped to `components/ChatWidget.tsx`, with pure helper functions extracted to `lib/recentSearches.ts` for testability. Tests live in `__tests__/chatRecentSearches/`.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2", "3"] },
    { "wave": 3, "tasks": ["4", "9", "10"] },
    { "wave": 4, "tasks": ["5"] },
    { "wave": 5, "tasks": ["6", "7"] },
    { "wave": 6, "tasks": ["8", "11"] },
    { "wave": 7, "tasks": ["12"] }
  ]
}
```

## Tasks

- [x] 1. Extract and implement pure helper functions in `lib/recentSearches.ts`
  - [x] 1.1 Create `lib/recentSearches.ts` and define the `RecentSearchEntry` interface and constants (`RECENT_SEARCHES_KEY`, `MAX_RECENT_SEARCHES`, `MAX_QUERY_LENGTH`, `ENABLE_AUTO_LOAD`)
  - [x] 1.2 Implement `isValidIso8601(value: string): boolean` — returns true if value parses to a valid Date and matches the `^\d{4}-\d{2}-\d{2}T` regex
  - [x] 1.3 Implement `isValidEntry(entry: unknown): entry is RecentSearchEntry` — type guard checking object shape, non-empty trimmed `query` (≤ 200 chars), valid ISO 8601 `timestamp`
  - [x] 1.4 Implement `loadRecentSearches(): RecentSearchEntry[]` — reads `localStorage`, JSON-parses, filters with `isValidEntry`, returns `[]` on any exception
  - [x] 1.5 Implement `saveRecentSearch(query: string, existing: RecentSearchEntry[]): RecentSearchEntry[]` — pure function: trims, rejects empty/oversized, deduplicates case-insensitively, prepends new entry with fresh ISO 8601 timestamp, caps at `MAX_RECENT_SEARCHES`
  - [x] 1.6 Implement `persistRecentSearches(entries: RecentSearchEntry[]): void` — writes JSON to `localStorage`, silently catches exceptions
  - [x] 1.7 Implement `clearRecentSearchesStorage(): void` — removes `RECENT_SEARCHES_KEY` from `localStorage`, silently catches exceptions
  - [x] 1.8 Implement `truncateQuery(query: string, maxLen?: number): string` — returns query unchanged if ≤ maxLen (default 80), otherwise `query.slice(0, maxLen) + '…'`

- [x] 2. Write property tests for pure helper functions
  - [x] 2.1 Write property test for Property 1 (Store Invariants After Save) — for any sequence of valid queries saved one-by-one, the resulting store has ≤ 5 entries, newest-first order, and no duplicate queries (case-insensitive) **Validates: Requirements 1.2, 1.3, 1.4**
  - [x] 2.2 Write property test for Property 2 (Save-then-Load Round Trip) — for any valid query saved then loaded, the entry at index 0 has the trimmed query and a valid ISO 8601 timestamp **Validates: Requirements 1.1, 6.1**
  - [x] 2.3 Write property test for Property 3 (Deduplication Preserves Uniqueness) — for any existing store state and a query matching an existing entry (case-insensitively), after save the array has exactly one matching entry at index 0 and length does not exceed original **Validates: Requirements 1.4, 3.3**
  - [x] 2.4 Write property test for Property 4 (Query Truncation in Display) — for any query string, `truncateQuery(query, 80)` returns ≤ 81 chars; if original ≤ 80 chars, returns it unchanged **Validates: Requirements 2.2**
  - [x] 2.5 Write property test for Property 9 (Data Integrity Filtering) — for any raw JSON array of mixed valid and invalid entries written to `localStorage`, `loadRecentSearches()` returns only valid entries without throwing **Validates: Requirements 6.2, 6.3**

- [x] 3. Add `recentSearches` state and wire `loadRecentSearches` into `selectConversationType` in `ChatWidget.tsx`
  - [x] 3.1 Import all helpers from `lib/recentSearches.ts` into `ChatWidget.tsx`
  - [x] 3.2 Add `const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>([])` to the component state declarations
  - [x] 3.3 In `selectConversationType`, inside the `type === 'looking'` branch (after the existing `setMessages(...)` call), add: `const loaded = loadRecentSearches(); setRecentSearches(loaded);`

- [x] 4. Integrate `saveRecentSearch` and `persistRecentSearches` into `handleSend`
  - [x] 4.1 In `handleSend`, after the existing `runPropertySearch` call inside the property-search completion branch, call `saveRecentSearch(text, recentSearches)`, then `persistRecentSearches(updated)`, then `setRecentSearches(updated)`

- [x] 5. Implement `handleReplay` handler in `ChatWidget.tsx`
  - [x] 5.1 Implement `handleReplay(entry: RecentSearchEntry)`: guard on `waitingForYesNo`; append user message; `setIsTyping(true)`; call `saveRecentSearch` + `persistRecentSearches` + `setRecentSearches`; after 1 000 ms setTimeout call `runPropertySearch(entry.query)`, append bot message, `setIsTyping(false)`; after another 1 000 ms setTimeout append follow-up prompt and `setWaitingForYesNo(true)`

- [x] 6. Write property tests for replay pipeline
  - [x] 6.1 Write property test for Property 5 (Replay Pipeline Equivalence) — for any valid `RecentSearchEntry`, the bot message produced by `handleReplay` equals the string returned by `runPropertySearch(entry.query)` directly **Validates: Requirements 3.2**
  - [x] 6.2 Write property test for Property 6 (Post-Replay State) — for any valid entry replayed when `waitingForYesNo` is false, after replay the messages array ends with `'Would you like to search for more properties?'` and `waitingForYesNo` is true **Validates: Requirements 3.4**

- [x] 7. Implement `clearRecentSearches` handler and `RecentSearchesPanel` UI in `ChatWidget.tsx`
  - [x] 7.1 Implement `clearRecentSearches()`: call `clearRecentSearchesStorage()` then `setRecentSearches([])`
  - [x] 7.2 Add inline `RecentSearchesPanel` JSX (or a local sub-component) inside the messages area, rendered only when `conversationType === 'looking'`; props: `entries`, `onReplay`, `onClear`, `disabled` (= `waitingForYesNo`)
  - [x] 7.3 Panel heading row: `"Recent Searches"` text + `"Clear"` button (hidden when `entries` is empty); empty state: `"No recent searches"` italic text; entry buttons: `w-full text-left` with `truncateQuery(entry.query, 80)` label; apply styling per design spec (`bg-gray-100 border border-gray-300 rounded-lg`)
  - [x] 7.4 Disable entry buttons and Clear control when `disabled` prop is true (prevent double-submission during active Yes/No prompt)

- [x] 8. Write property and unit tests for `RecentSearchesPanel` and clear behavior
  - [x] 8.1 Write property test for Property 10 (Panel Renders Entries in Store Order) — for any array of 1–5 valid entries, rendered button elements appear in same order as the array and each label equals `truncateQuery(entry.query, 80)` **Validates: Requirements 2.1, 2.3**
  - [x] 8.2 Write property test for Property 8 (Clear Empties the Store) — for any store with 1–5 valid entries, calling `clearRecentSearches()` results in `localStorage` key parsing to `[]` and in-memory `recentSearches` being `[]` **Validates: Requirements 5.1, 5.2**
  - [x] 8.3 Write unit test: empty store shows `"No recent searches"` text and no entry buttons **Validates: Requirement 2.4**
  - [x] 8.4 Write unit test: panel heading always contains fixed text `"Recent Searches"` **Validates: Requirement 2.6**
  - [x] 8.5 Write unit test: Clear button absent when store is empty; present and functional when store has entries **Validates: Requirement 5.1**
  - [x] 8.6 Write unit test: Clear with `localStorage` throwing — in-memory state still set to `[]` **Validates: Requirement 5.4**

- [x] 9. Write property test for `resetChat` not touching the store
  - [x] 9.1 Write property test for Property 7 (resetChat Does Not Touch the Store) — for any store state written to `localStorage` before calling `resetChat()`, the `localStorage` value at `chat_recent_searches` is identical after the call **Validates: Requirements 5.3**

- [x] 10. Write unit tests for error-handling and edge-case paths
  - [x] 10.1 Write unit test: `persistRecentSearches` with `localStorage` unavailable (throws) — no exception propagates to the caller **Validates: Requirement 1.5**
  - [x] 10.2 Write unit test: `loadRecentSearches` with `localStorage` unavailable — returns `[]` without throwing **Validates: Requirement 1.5**
  - [x] 10.3 Write unit test: typing indicator is visible during replay (from button activation until bot results message appears) **Validates: Requirement 3.5**
  - [x] 10.4 Write unit test: full save → reload cycle — after writing an entry and re-reading via `loadRecentSearches()`, the entry is present (simulates hard reload by directly reading `localStorage`) **Validates: Requirement 1.6**

- [x] 11. Implement optional auto-load behavior (controlled by `ENABLE_AUTO_LOAD` constant)
  - [x] 11.1 Add `const autoLoadFiredRef = useRef(false)` to the component
  - [x] 11.2 Add `useEffect([isOpen])` that returns immediately if `!ENABLE_AUTO_LOAD`, `!isOpen`, `conversationType !== null`, or `autoLoadFiredRef.current` is already true; otherwise loads entries, guards on empty store, sets `autoLoadFiredRef.current = true`, sets conversation type + state, appends system note message, shows typing indicator, then after 1 000 ms appends `runPropertySearch` bot message + hides indicator, then after another 1 000 ms appends follow-up prompt + sets `waitingForYesNo(true)`

- [x] 12. Write unit tests for auto-load behavior
  - [x] 12.1 Write unit test: auto-load does NOT fire when `ENABLE_AUTO_LOAD = false` **Validates: Requirement 4.6**
  - [x] 12.2 Write unit test: auto-load does NOT fire when the store is empty **Validates: Requirement 4.5**
  - [x] 12.3 Write unit test: auto-load system note contains the replayed query text **Validates: Requirement 4.3**
  - [x] 12.4 Write unit test: auto-load fires at most once per page load (second widget open does not re-trigger) **Validates: Requirement 4.1**

## Notes

- `fast-check` is already installed in `node_modules/fast-check` — no new packages needed.
- Tests for pure functions (Tasks 2, 9) can run without mounting the React component and do not need `jest-environment-jsdom`.
- Tests for the panel (Task 8) and replay pipeline integration (Task 6) require `@testing-library/react` (already configured in `jest.setup.js`).
- `ENABLE_AUTO_LOAD` defaults to `false`; auto-load tests (Task 12) should override it via module-level mocking (`jest.mock`).
- `localStorage` error-path tests (Tasks 10.1, 10.2) use `jest.spyOn(Storage.prototype, 'setItem')` / `getItem` to simulate throws.
- The `resetChat()` function intentionally leaves `chat_recent_searches` in `localStorage` untouched (Requirement 5.3); do not add any `localStorage.removeItem` call there.
- All property tests should use `{ numRuns: 100 }` (fast-check default) as a minimum; increase to 200 for Property 1 to cover longer sequences.
