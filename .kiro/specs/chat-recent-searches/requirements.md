# Requirements Document

## Introduction

The **Chat Recent Searches** feature adds a persistent "Recent Searches" section to the ChatWidget's "Looking for Property" conversation flow. Users can see their past natural-language property search queries (stored in `localStorage`), click one to re-run it instantly, and optionally have the last search result auto-loaded when they reopen the chat. Up to 5 searches are retained across browser sessions.

This feature improves repeat-user experience by reducing friction: returning visitors no longer need to retype their previous queries.

---

## Glossary

- **ChatWidget**: The floating chat panel component at `components/ChatWidget.tsx`.
- **Recent Search Entry**: A stored record of a single past property search, containing the original query text and the timestamp when it was saved.
- **Recent Searches Store**: The `localStorage` key `chat_recent_searches` that persists an ordered array of Recent Search Entries (most recent first), capped at 5 entries.
- **Search Query**: The raw natural-language text the user typed to search for a property (e.g. "110 sqm lot, near Clark, under 5M").
- **Replay**: The action of re-executing a stored Search Query through `parsePropertyQuery()` and `filterProperties()` to produce fresh results.
- **Recent Searches Panel**: The UI section rendered inside the "Looking for Property" flow, below the initial prompt message, listing available Recent Search Entries.
- **Auto-load**: Automatically replaying the most-recent stored Search Query when the user opens the ChatWidget without explicitly selecting an entry.

---

## Requirements

### Requirement 1: Persist Recent Searches to localStorage

**User Story:** As a returning visitor, I want my previous property search queries saved across browser sessions, so that I don't have to retype them each time I open the chat.

#### Acceptance Criteria

1. WHEN a user submits a Search Query in the "Looking for Property" flow, THE ChatWidget SHALL save that Search Query to the Recent Searches Store in `localStorage` under the key `chat_recent_searches` as a JSON array.
2. THE Recent Searches Store SHALL retain a maximum of 5 Recent Search Entries; WHEN a new entry would exceed this limit, THE ChatWidget SHALL discard the entry at index 4 (the oldest) before inserting the new entry at index 0.
3. THE Recent Searches Store SHALL store entries in descending chronological order (most recent first), with the newly saved entry always placed at index 0.
4. WHEN a user submits a Search Query whose text matches an existing entry in the Recent Searches Store using a case-insensitive exact string comparison, THE ChatWidget SHALL remove the existing entry from its current position, create a new entry with the submitted text and a fresh timestamp, and insert it at index 0; no second entry for that query text SHALL exist in the store after this operation.
5. IF `localStorage` is unavailable or any `localStorage` read or write operation throws an exception, THEN THE ChatWidget SHALL silently continue without persisting the entry, without reading existing entries, and without displaying an error to the user.
6. THE Recent Searches Store SHALL persist across page refreshes and new browser sessions, verifiable by reading `localStorage.getItem('chat_recent_searches')` after a hard reload.

---

### Requirement 2: Display Recent Searches Panel

**User Story:** As a user selecting "Looking for Property," I want to see my past search queries listed in the chat, so that I can quickly identify and reuse a previous search.

#### Acceptance Criteria

1. WHEN a user selects the "Looking for Property" conversation type AND the Recent Searches Store contains at least one valid entry, THE ChatWidget SHALL render the Recent Searches Panel below the initial prompt message.
2. THE Recent Searches Panel SHALL display each Recent Search Entry as an interactive button element activatable by both pointer (click) and keyboard (Enter/Space); query text longer than 80 characters SHALL be truncated with a trailing ellipsis ("…") in the button label.
3. THE Recent Searches Panel SHALL display entries in the same order as the Recent Searches Store (most recent first).
4. WHEN the Recent Searches Store is empty, THE ChatWidget SHALL render the Recent Searches Panel with a "No recent searches" text in place of entry buttons.
5. WHILE the list of chat messages overflows the visible chat area, the Recent Searches Panel SHALL remain reachable by scrolling within the chat message container.
6. THE Recent Searches Panel SHALL render under a heading with the fixed text "Recent Searches"; the panel's background color and border SHALL differ from the background color and border of standard user and bot message bubbles.

---

### Requirement 3: Replay a Recent Search on Click

**User Story:** As a user, I want to click a recent search entry to immediately re-run that search and see fresh results, so that I can quickly check current listings without retyping.

#### Acceptance Criteria

1. WHEN a user activates a Recent Search Entry button AND `waitingForYesNo` is false, THE ChatWidget SHALL append a user message containing the stored Search Query text to the message list and immediately begin executing a Replay.
2. WHEN a Replay is executed, THE ChatWidget SHALL pass the stored Search Query text to `parsePropertyQuery()`, pass the returned `ParsedQuery` object to `filterProperties()`, and render the resulting bot message using the same `runPropertySearch()` formatting logic used for manual searches.
3. WHEN a Replay is executed, THE ChatWidget SHALL update the Recent Searches Store by removing the replayed entry from its current position and inserting a new entry with the same query text and a refreshed ISO 8601 timestamp at index 0.
4. WHEN a Replay is executed, THE ChatWidget SHALL set `waitingForYesNo` to true and append the "Would you like to search for more properties?" prompt bot message after the results message, identical to the post-search flow for a manual search.
5. WHILE a Replay is in progress (from the moment the user activates the button until the bot results message appears in the chat list), THE ChatWidget SHALL display the typing indicator.

---

### Requirement 4: Auto-load Last Search on Widget Open (Optional Feature)

**User Story:** As a returning user, I want the chat to automatically show my last search results when I reopen the widget on a new session, so that I can immediately continue where I left off.

#### Acceptance Criteria

1. WHERE the Auto-load feature is enabled, WHEN the ChatWidget is opened for the first time in a page load AND no conversation type has been selected in the current widget session AND the Recent Searches Store contains at least one valid entry, THE ChatWidget SHALL automatically set the conversation type to "looking".
2. WHERE the Auto-load feature is enabled, WHEN criterion 1 is met, THE ChatWidget SHALL immediately execute a Replay of the most recent Search Query (index 0 of the Recent Searches Store).
3. WHERE the Auto-load feature is enabled, WHEN an auto-load Replay is triggered, THE ChatWidget SHALL display a system note (e.g. "📂 Showing your last search: *{query}*") as the first bot message, before the Replay results message.
4. WHERE the Auto-load feature is enabled, WHEN an auto-load Replay is triggered, THE ChatWidget SHALL display the typing indicator from the moment the widget is opened until the Replay results message appears.
5. WHERE the Auto-load feature is enabled, IF the Recent Searches Store is empty or contains no valid entries, THEN THE ChatWidget SHALL NOT auto-load and SHALL display the standard conversation type selection screen.
6. WHERE the Auto-load feature is disabled, THE ChatWidget SHALL NOT auto-load on open and SHALL display the standard conversation type selection screen.

---

### Requirement 5: Clear or Manage Recent Searches

**User Story:** As a user, I want to be able to clear my recent searches, so that I can start fresh or keep my search history tidy.

#### Acceptance Criteria

1. WHEN the Recent Searches Store contains at least one entry, THE Recent Searches Panel SHALL display a "Clear" control; WHEN the user activates that control, THE ChatWidget SHALL remove all entries from the Recent Searches Store.
2. WHEN the Recent Searches Store is cleared, THE ChatWidget SHALL update the Recent Searches Panel to display the "No recent searches" empty state within 300 ms, without requiring a page reload.
3. WHEN the `resetChat()` action is invoked (via the "← Back" button), THE ChatWidget SHALL NOT clear the Recent Searches Store, preserving entries for the next session.
4. IF `localStorage` throws an exception during the clear operation, THEN THE ChatWidget SHALL silently continue without displaying an error to the user; the in-memory `recentSearches` state SHALL still be set to an empty array so the UI reflects the cleared state.

---

### Requirement 6: Data Integrity of Recent Search Entries

**User Story:** As a developer, I want each stored search entry to have a well-defined structure, so that the component can reliably read and render it.

#### Acceptance Criteria

1. THE Recent Searches Store SHALL store each entry as a JSON object containing exactly: `query` (non-empty string, maximum 200 characters, the original Search Query text) and `timestamp` (ISO 8601 string representing the date and time the search was saved).
2. WHEN the ChatWidget reads the Recent Searches Store, IF any entry fails to parse as JSON, is not an object, is missing the `query` field, has a `query` value that is not a string, is missing the `timestamp` field, or has a `timestamp` value that is not a valid ISO 8601 string, THEN THE ChatWidget SHALL discard that entry and continue rendering with the remaining valid entries.
3. IF an entry's `query` field is an empty string, or if the entry has an invalid ISO 8601 `timestamp` string, THEN THE ChatWidget SHALL skip rendering that entry without showing a placeholder button.
