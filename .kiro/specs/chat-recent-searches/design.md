# Design Document: Chat Recent Searches

## Overview

The Chat Recent Searches feature adds a persistent search history to the ChatWidget's "Looking for Property" conversation flow. When a user submits a natural-language property query, that query is saved to `localStorage` and surfaced as a clickable button the next time the user opens the "Looking for Property" flow. Up to five entries are kept, deduplicated by case-insensitive match, and ordered newest-first.

The feature is entirely client-side. It introduces no new API routes, no Supabase schema changes, and no additional npm packages. All new logic lives within `components/ChatWidget.tsx`, extracted into pure helper functions to make them independently testable.

### Design Goals

- Zero regression risk to existing conversation flows (buying, selling, renting, etc.)
- All new business logic in pure, side-effect-free functions that can be unit-tested without mounting the component
- Graceful degradation when `localStorage` is unavailable (private browsing, storage quota exceeded)
- Auto-load is controlled by a single compile-time constant (`ENABLE_AUTO_LOAD`) so it can be toggled without touching component logic

---

## Architecture

### Component Boundary

The feature is scoped entirely to `components/ChatWidget.tsx`. No new files are required, although the pure helper functions (`recentSearchesStore`) may optionally be extracted to `lib/recentSearches.ts` to simplify unit testing (the tasks phase will decide based on test runner ergonomics).

```
┌─────────────────────────────────────────────────────┐
│                  ChatWidget.tsx                      │
│                                                      │
│  ┌──────────────────────────────────────────────┐   │
│  │          recentSearches state (in-memory)    │   │
│  │  RecentSearchEntry[]  ←→  localStorage       │   │
│  └──────────────────────────────────────────────┘   │
│                                                      │
│  selectConversationType('looking')                   │
│    └─ loadRecentSearches()   → populate state        │
│                                                      │
│  handleSend() / handleReplay()                       │
│    └─ saveRecentSearch(query) → update state + LS   │
│                                                      │
│  RecentSearchesPanel (inline JSX or sub-component)  │
│    ├─ entry buttons → handleReplay(entry)           │
│    └─ Clear button  → clearRecentSearches()         │
│                                                      │
│  useEffect([isOpen]) [optional auto-load]           │
│    └─ handleReplay(recentSearches[0])               │
└─────────────────────────────────────────────────────┘
```

### Data Flow

```
User submits query
       │
       ▼
  handleSend()
       │
       ├─ runPropertySearch(text)   [existing]
       │
       └─ saveRecentSearch(text)    [new]
              │
              ├─ loadFromStorage()
              ├─ deduplicate (case-insensitive)
              ├─ prepend new entry
              ├─ cap at MAX_RECENT_SEARCHES (5)
              └─ persistToStorage()

User clicks Recent Search button
       │
       ▼
  handleReplay(entry)
       ├─ append user message
       ├─ setIsTyping(true)
       ├─ saveRecentSearch(entry.query)   [refresh timestamp]
       ├─ runPropertySearch(entry.query)  [existing]
       ├─ append bot message
       ├─ setIsTyping(false)
       └─ setWaitingForYesNo(true) + append follow-up prompt
```

---

## Components and Interfaces

### New TypeScript Interfaces

```typescript
/** A single entry in the Recent Searches Store */
interface RecentSearchEntry {
  query: string;      // non-empty, max 200 chars
  timestamp: string;  // ISO 8601
}
```

### New Constants

```typescript
const RECENT_SEARCHES_KEY = 'chat_recent_searches';
const MAX_RECENT_SEARCHES = 5;
const MAX_QUERY_LENGTH = 200;
const ENABLE_AUTO_LOAD = false; // toggle to enable auto-load on widget open
```

### New Pure Helper Functions

These are pure (or near-pure, with `localStorage` injection) functions extracted outside the component for easy unit testing.

#### `isValidIso8601(value: string): boolean`

Returns `true` if `value` is a string that parses to a valid `Date` via `new Date(value)` and `isNaN` check, and conforms to ISO 8601 format (tested via regex `^\d{4}-\d{2}-\d{2}T`).

#### `isValidEntry(entry: unknown): entry is RecentSearchEntry`

Type guard. Returns `true` iff:
- `entry` is a plain object
- `entry.query` is a non-empty string (after trim) with length ≤ 200
- `entry.timestamp` is a valid ISO 8601 string

Invalid entries are silently excluded during reads.

#### `loadRecentSearches(): RecentSearchEntry[]`

Reads `localStorage.getItem(RECENT_SEARCHES_KEY)`, JSON-parses it, filters through `isValidEntry`, and returns the cleaned array. Returns `[]` on any exception or if the key is absent.

#### `saveRecentSearch(query: string, existing: RecentSearchEntry[]): RecentSearchEntry[]`

Pure function — takes the current entries array, returns the updated array without touching storage.

Algorithm:
1. Trim `query`; if empty or length > `MAX_QUERY_LENGTH`, return `existing` unchanged.
2. Remove any entry where `entry.query.toLowerCase() === query.toLowerCase()`.
3. Prepend `{ query: query.trim(), timestamp: new Date().toISOString() }`.
4. Slice to `MAX_RECENT_SEARCHES`.
5. Return the new array.

#### `persistRecentSearches(entries: RecentSearchEntry[]): void`

Calls `localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(entries))`. Catches and suppresses any exception.

#### `clearRecentSearchesStorage(): void`

Calls `localStorage.removeItem(RECENT_SEARCHES_KEY)`. Catches and suppresses any exception.

#### `truncateQuery(query: string, maxLen = 80): string`

Returns `query` if `query.length <= maxLen`, otherwise `query.slice(0, maxLen) + '…'`.

### New State

```typescript
const [recentSearches, setRecentSearches] = useState<RecentSearchEntry[]>([])
```

Initialized to `[]`. Populated from `localStorage` when the user selects the "Looking for Property" conversation type (and optionally on widget open for auto-load).

### Modified Functions

#### `selectConversationType(type: ConversationType)`

After the existing `if (type === 'looking')` branch sets up the initial message, additionally:
```typescript
const loaded = loadRecentSearches();
setRecentSearches(loaded);
```

#### `handleSend(overrideText?: string)`

After the existing `runPropertySearch` call (inside the `searchCompleted` branch), call:
```typescript
const updated = saveRecentSearch(text, recentSearches);
setRecentSearches(updated);
persistRecentSearches(updated);
```

#### `resetChat()`

No change — the Recent Searches Store is intentionally not cleared here (Requirement 5.3).

### New Handler: `handleReplay(entry: RecentSearchEntry)`

```typescript
const handleReplay = (entry: RecentSearchEntry) => {
  if (waitingForYesNo) return; // guard: ignore clicks during active yes/no prompt

  // 1. Append user message
  const userMsg: Message = { id: messages.length + 1, text: entry.query, sender: 'user', timestamp: new Date() };
  setMessages(prev => [...prev, userMsg]);

  // 2. Show typing indicator
  setIsTyping(true);

  // 3. Refresh timestamp in store
  const updated = saveRecentSearch(entry.query, recentSearches);
  setRecentSearches(updated);
  persistRecentSearches(updated);

  // 4. Run search + post-search prompt (same timing as handleSend)
  setTimeout(() => {
    const botResponse = runPropertySearch(entry.query);
    setMessages(prev => [...prev, { id: prev.length + 1, text: botResponse, sender: 'bot', timestamp: new Date() }]);
    setIsTyping(false);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: 'Would you like to search for more properties?',
        sender: 'bot',
        timestamp: new Date(),
      }]);
      setWaitingForYesNo(true);
    }, 1000);
  }, 1000);
};
```

### New Handler: `clearRecentSearches()`

```typescript
const clearRecentSearches = () => {
  clearRecentSearchesStorage(); // silently catches errors
  setRecentSearches([]);
};
```

### Auto-load Effect (conditional on `ENABLE_AUTO_LOAD`)

```typescript
// Only fires on widget open, only when no conversation is active, only once per page load
const autoLoadFiredRef = useRef(false);

useEffect(() => {
  if (!ENABLE_AUTO_LOAD) return;
  if (!isOpen) return;
  if (conversationType !== null) return;
  if (autoLoadFiredRef.current) return;

  const entries = loadRecentSearches();
  if (entries.length === 0) return;

  autoLoadFiredRef.current = true;
  const topEntry = entries[0];

  setConversationType('looking');
  setPropertySearch({ step: 'freeform' });
  setRecentSearches(entries);

  // System note first
  const noteMsg: Message = {
    id: 1,
    text: `📂 Showing your last search: *${topEntry.query}*`,
    sender: 'bot',
    timestamp: new Date(),
  };
  setMessages([noteMsg]);
  setIsTyping(true);

  setTimeout(() => {
    const botResponse = runPropertySearch(topEntry.query);
    setMessages(prev => [...prev, { id: prev.length + 1, text: botResponse, sender: 'bot', timestamp: new Date() }]);
    setIsTyping(false);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: 'Would you like to search for more properties?',
        sender: 'bot',
        timestamp: new Date(),
      }]);
      setWaitingForYesNo(true);
    }, 1000);
  }, 1000);
}, [isOpen]);
```

---

## Data Models

### Storage Schema

**Key:** `chat_recent_searches`  
**Storage:** `localStorage`  
**Value:** JSON-serialized array

```json
[
  {
    "query": "110 sqm lot area, near Clark, under 5M",
    "timestamp": "2025-01-15T08:30:00.000Z"
  },
  {
    "query": "3 bedroom condo, Angeles City",
    "timestamp": "2025-01-14T14:22:10.543Z"
  }
]
```

**Constraints:**
- Array length: 0–5
- `query`: non-empty string, max 200 characters, trimmed
- `timestamp`: ISO 8601 (always produced by `new Date().toISOString()`)
- Ordering: index 0 is always the most recently saved or replayed entry

### Validation Rules (applied on read)

| Field | Type check | Value check | On failure |
|---|---|---|---|
| entry | object | not null | discard entry |
| query | string | length >= 1, length <= 200 | discard entry |
| timestamp | string | valid ISO 8601 | discard entry |

### In-memory State

```typescript
recentSearches: RecentSearchEntry[]
```

Always a mirror of the validated, filtered contents of the store. Initialized to `[]`. Updated synchronously on every save, replay, and clear operation.

---

## UI/UX Design for the Recent Searches Panel

The Recent Searches Panel is rendered inside the messages area of the "Looking for Property" flow, immediately after the initial bot prompt message and before any subsequent messages.

### Panel Structure

```
┌────────────────────────────────────────┐
│  Recent Searches              [Clear]  │  ← heading row (bg-gray-100, border)
├────────────────────────────────────────┤
│  [ 110 sqm lot, near Clark, under 5M ] │  ← entry button
│  [ 3 bedroom condo, Angeles City     ] │
│  [ House and lot in San Fernando     ] │
└────────────────────────────────────────┘
```

**Empty state:**
```
┌────────────────────────────────────────┐
│  Recent Searches                       │
├────────────────────────────────────────┤
│  No recent searches                    │
└────────────────────────────────────────┘
```

### Styling Specifications

- Panel wrapper: `bg-gray-100 border border-gray-300 rounded-lg mx-0 my-2 p-3`
- Heading row: `flex justify-between items-center mb-2`
- Heading text: `text-xs font-semibold text-gray-600 uppercase tracking-wide`
- Clear button: `text-xs text-red-500 hover:text-red-700 underline`
- Entry button: `w-full text-left text-sm bg-white hover:bg-blue-50 border border-gray-200 rounded px-3 py-2 mb-1 truncate text-gray-800`
- Empty state text: `text-xs text-gray-400 italic`

These differ clearly from:
- User message bubbles: `bg-blue-600` text white
- Bot message bubbles: `bg-white shadow-md`

### Keyboard Accessibility

Entry buttons and the Clear button are standard `<button>` elements, so they receive Enter/Space activation and Tab focus by default. No additional ARIA attributes are required beyond the visible label text. The panel itself does not need a role annotation as it is embedded in the scrollable message flow.

### Placement in JSX

The panel is rendered as the first child inside the messages `<div>` (after the `messages.map(...)` block), conditionally shown only when `conversationType === 'looking'`:

```tsx
{/* Recent Searches Panel */}
{conversationType === 'looking' && (
  <RecentSearchesPanel
    entries={recentSearches}
    onReplay={handleReplay}
    onClear={clearRecentSearches}
    disabled={waitingForYesNo}
  />
)}
```

`disabled` hides/disables the entry buttons and Clear control while `waitingForYesNo` is active to prevent double-submission.

---

## Integration with Existing Property Search Flow

### Existing Flow (unchanged)

```
handleSend() → runPropertySearch(text) → bot message → waitingForYesNo = true
```

### Modified Flow (additions bolded)

```
handleSend()
  → runPropertySearch(text)        [existing]
  → bot message                    [existing]
  → **saveRecentSearch(text, ...)**   [new]
  → **persistRecentSearches(...)**    [new]
  → **setRecentSearches(updated)**    [new]
  → waitingForYesNo = true         [existing]
  → follow-up prompt               [existing]
```

### Replay Flow

```
handleReplay(entry)
  → user message appended          [new]
  → isTyping = true                [new]
  → saveRecentSearch(entry.query)  [new, refreshes timestamp]
  → persistRecentSearches(...)     [new]
  → runPropertySearch(entry.query) [existing reuse]
  → bot message appended           [new]
  → isTyping = false               [new]
  → waitingForYesNo = true         [new, same as manual]
  → follow-up prompt appended      [new, same as manual]
```

### State Machine Compatibility

The existing `waitingForYesNo` guard in `handleReplay` ensures that clicking a recent search entry while the Yes/No prompt is active is a no-op. This maintains the existing Yes/No flow integrity.

The `propertySearch` state (`{ step: 'freeform' }`) does not need to be set for replays because `handleReplay` calls `runPropertySearch` directly — it bypasses the `handleSend` freeform path entirely.

---

## Auto-load Behavior Design

Auto-load is disabled by default (`ENABLE_AUTO_LOAD = false`). When enabled:

### Trigger Conditions (all must be true)

1. Widget is opened (`isOpen` transitions from `false` to `true`)
2. No conversation type is active in the current session (`conversationType === null`)
3. `autoLoadFiredRef.current === false` (fires at most once per page load)
4. `loadRecentSearches()` returns at least one valid entry

### Sequence

1. Set `conversationType = 'looking'` and `recentSearches = entries`
2. Append a system note message: `📂 Showing your last search: *{query}*`
3. Show typing indicator
4. After 1000 ms: append `runPropertySearch(entry.query)` bot message, hide indicator
5. After another 1000 ms: append follow-up prompt, set `waitingForYesNo = true`

### Edge Cases

- If the store is empty on widget open: no auto-load, standard selection screen shown
- If the user had an active session (conversationType already set from sessionStorage): no auto-load
- If `ENABLE_AUTO_LOAD = false`: the `useEffect` returns immediately; no behavior change

---

## Error Handling

All `localStorage` interactions are wrapped in `try/catch`. The component degrades silently:

| Operation | On failure |
|---|---|
| `loadRecentSearches()` | Returns `[]`; panel shows empty state |
| `persistRecentSearches()` | State updated in memory; next page load won't see the entry |
| `clearRecentSearchesStorage()` | In-memory `recentSearches` still set to `[]`; UI reflects cleared state |
| JSON parse of stored value | Returns `[]` (caught in `loadRecentSearches`) |
| Individual invalid entry | Silently excluded by `isValidEntry` filter |

No error messages are shown to the user for any storage failure. This keeps the chat experience uninterrupted.

### Invalid Query Handling

`saveRecentSearch` silently returns the existing array unchanged if:
- The query is empty or whitespace-only after trim
- The query exceeds 200 characters

This prevents garbage entries from ever reaching storage.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The property-based testing library for this project is **fast-check** (TypeScript-native, Jest-compatible). Each property test runs a minimum of 100 iterations.

#### Redundancy Elimination

Before listing properties, redundancy is eliminated:

- **1.2 (cap at 5) and 1.3 (newest-first ordering)** are both invariants of `saveRecentSearch`. They can be expressed as one comprehensive "store invariants" property.
- **1.4 (deduplication on save) and 3.3 (deduplication on replay)** both test the same `saveRecentSearch` function. They become one property.
- **3.1 (user message on replay) and 3.2 (replay produces same result as manual)** can be combined: the replay pipeline property covers both message appending and content correctness.
- **4.2 (auto-load replays index 0) and 4.3 (note contains query text)** are both about auto-load output. Combine into one auto-load output property.
- **6.2 and 6.3** both test entry validation/filtering. Combined into one data integrity property.

---

### Property 1: Store Invariants After Save

*For any* sequence of valid query strings saved one-by-one to an initially-empty store, the resulting store SHALL contain at most 5 entries, all entries SHALL be ordered newest-first (index 0 is the most recently saved), and no two entries SHALL share the same query text under case-insensitive comparison.

**Validates: Requirements 1.2, 1.3, 1.4**

---

### Property 2: Save-then-Load Round Trip

*For any* valid query string saved to the store and then loaded back via `loadRecentSearches()`, the entry at index 0 of the returned array SHALL have a `query` field equal to the trimmed input query and a `timestamp` that is a valid ISO 8601 string.

**Validates: Requirements 1.1, 6.1**

---

### Property 3: Deduplication Preserves Uniqueness

*For any* existing store state (1–5 entries) and any query string that case-insensitively matches one of the existing entries, after calling `saveRecentSearch(query, existing)` the returned array SHALL contain exactly one entry whose query matches the input (case-insensitively), that entry SHALL be at index 0, and the array length SHALL NOT exceed the original length.

**Validates: Requirements 1.4, 3.3**

---

### Property 4: Query Truncation in Display

*For any* query string, `truncateQuery(query, 80)` SHALL return a string of length at most 81 characters (80 chars + ellipsis); if the original string length is ≤ 80, the return value SHALL equal the original string exactly.

**Validates: Requirements 2.2**

---

### Property 5: Replay Pipeline Equivalence

*For any* valid `RecentSearchEntry`, the bot message produced by `handleReplay` SHALL be identical to the string returned by calling `runPropertySearch(entry.query)` directly, confirming the replay pipeline passes the query through the same formatting logic as a manual search.

**Validates: Requirements 3.2**

---

### Property 6: Post-Replay State

*For any* valid `RecentSearchEntry` replayed when `waitingForYesNo` is false, after the replay completes the messages array SHALL end with a bot message whose text is `'Would you like to search for more properties?'` and `waitingForYesNo` SHALL be `true`.

**Validates: Requirements 3.4**

---

### Property 7: resetChat Does Not Touch the Store

*For any* store state written to `localStorage` before calling `resetChat()`, after `resetChat()` returns the `localStorage` value at key `chat_recent_searches` SHALL be identical to its value before the call.

**Validates: Requirements 5.3**

---

### Property 8: Clear Empties the Store

*For any* store with 1–5 valid entries, calling `clearRecentSearches()` SHALL result in `localStorage.getItem('chat_recent_searches')` parsing to an empty array (`[]`) and the in-memory `recentSearches` state being `[]`.

**Validates: Requirements 5.1, 5.2**

---

### Property 9: Data Integrity Filtering

*For any* raw JSON array written to `localStorage` containing a mixture of valid and invalid entries (entries with missing `query`, empty `query`, non-string `query`, missing `timestamp`, non-string `timestamp`, invalid ISO 8601 `timestamp`, or non-object shapes), `loadRecentSearches()` SHALL return only the valid entries and SHALL discard all invalid ones without throwing.

**Validates: Requirements 6.2, 6.3**

---

### Property 10: Panel Renders Entries in Store Order

*For any* array of 1–5 valid `RecentSearchEntry` values passed as `entries` to the `RecentSearchesPanel`, the rendered button elements SHALL appear in the same order as the array (index 0 button first), and each button label SHALL equal `truncateQuery(entry.query, 80)`.

**Validates: Requirements 2.1, 2.3**

---

## Testing Strategy

### Dual Testing Approach

Unit tests cover specific examples, edge cases, and error conditions. Property tests (via **fast-check**) verify universal invariants across hundreds of generated inputs. Together they provide comprehensive coverage without over-specifying implementation details.

### Property-Based Testing Setup

Install fast-check:
```bash
npm install --save-dev fast-check
```

Each property test runs minimum 100 iterations (fast-check default is 100). Tag format for each test:

```typescript
// Feature: chat-recent-searches, Property N: <property_text>
```

### Test File Structure

```
__tests__/
  chatRecentSearches/
    recentSearchStore.test.ts    // Properties 1–3, 7–9 (pure storage logic)
    truncateQuery.test.ts        // Property 4
    replayPipeline.test.ts       // Properties 5–6 (component integration)
    panel.test.tsx               // Property 10 (React rendering)
    errorHandling.test.ts        // Examples: localStorage unavailable, clear error
    autoLoad.test.tsx            // Examples: auto-load trigger conditions
```

### Unit Tests (Example-Based)

| Test | Requirement |
|---|---|
| Empty store shows "No recent searches" | 2.4 |
| Panel shows "Recent Searches" heading | 2.6 |
| Typing indicator visible during replay | 3.5 |
| Auto-load does not fire when ENABLE_AUTO_LOAD = false | 4.6 |
| Auto-load does not fire when store is empty | 4.5 |
| Auto-load note contains query text | 4.3 |
| Clear with localStorage error: in-memory state still cleared | 5.4 |
| Save with localStorage unavailable: no error thrown | 1.5 |

### Integration Tests (Example-Based)

| Test | Requirement |
|---|---|
| Full save → reload → entries present after hard reload simulation | 1.6 |

### Property Test Configuration

```typescript
import fc from 'fast-check';

// Arbitrary for valid query strings
const validQuery = fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0);

// Arbitrary for valid RecentSearchEntry
const validEntry = fc.record({
  query: validQuery,
  timestamp: fc.date().map(d => d.toISOString()),
});

// Arbitrary for stores of 1–5 valid entries with unique queries
const validStore = fc.array(validEntry, { minLength: 1, maxLength: 5 })
  .filter(entries => new Set(entries.map(e => e.query.toLowerCase())).size === entries.length);
```

### Coverage Targets

- Pure functions (`isValidEntry`, `saveRecentSearch`, `loadRecentSearches`, `truncateQuery`): 100% branch coverage via property tests
- `handleReplay`, `clearRecentSearches`: covered by component integration tests
- Error paths (catch blocks): covered by example tests with mocked `localStorage`
