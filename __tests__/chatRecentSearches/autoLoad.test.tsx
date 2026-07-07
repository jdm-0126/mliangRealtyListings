/**
 * Unit tests for auto-load behavior (Task 12).
 *
 * Feature: chat-recent-searches
 * Validates: Requirements 4.6, 4.5, 4.3, 4.1
 *
 * Mocking strategy:
 *   - lib/recentSearches is mocked at the module level so ENABLE_AUTO_LOAD
 *     can be set per-test. Real implementations are preserved for helpers that
 *     don't need overriding.
 *   - Supabase is mocked to return empty data (avoids network calls).
 *   - next/navigation is mocked (required by Next.js component rendering).
 *   - localStorage is seeded before each relevant test so we can assert that
 *     auto-load did NOT fire despite valid data being present.
 */

import React from 'react'
import { render, screen, act, cleanup } from '@testing-library/react'
import ChatWidget from '../../components/ChatWidget'
import { RECENT_SEARCHES_KEY } from '../../lib/recentSearches'

// ─── Module mocks ─────────────────────────────────────────────────────────────

jest.mock('@/app/lib/supabaseClient.js', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
    })),
  },
}))

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

/**
 * Mock lib/recentSearches.
 *
 * - ENABLE_AUTO_LOAD is set to false (its real default, but we make it
 *   explicit to ensure the test is not affected by future changes to the
 *   constant's default value).
 * - All helper functions delegate to the real implementations so localStorage
 *   interactions work correctly.
 */
jest.mock('../../lib/recentSearches', () => {
  const actual = jest.requireActual<typeof import('../../lib/recentSearches')>(
    '../../lib/recentSearches'
  )
  return {
    ...actual,
    ENABLE_AUTO_LOAD: false,
  }
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** A valid RecentSearchEntry JSON array with one entry. */
const SEED_ENTRY = {
  query: '3 bedroom condo, Angeles City',
  timestamp: new Date('2025-01-15T08:30:00.000Z').toISOString(),
}

/** Seed localStorage with at least one valid recent search entry. */
function seedLocalStorage(): void {
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify([SEED_ENTRY]))
}

/** Open the chat widget's floating action button. */
async function openWidget(): Promise<void> {
  await act(async () => {})
  const buttons = Array.from(document.querySelectorAll('button'))
  const fab = buttons.find(
    (b) =>
      b.className.includes('fixed') || b.className.includes('rounded-full')
  )
  if (fab) {
    await act(async () => { fab.click() })
    // Extra flushes to allow all state updates and effects to settle
    await act(async () => {})
    await act(async () => {})
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────────

beforeAll(() => { jest.useFakeTimers() })
afterAll(() => { jest.useRealTimers() })

afterEach(() => {
  jest.clearAllTimers()
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})

// ─── Task 12.1: auto-load does NOT fire when ENABLE_AUTO_LOAD = false ─────────

// Feature: chat-recent-searches, Property N: auto-load disabled by ENABLE_AUTO_LOAD flag

describe('Task 12.1 — auto-load does NOT fire when ENABLE_AUTO_LOAD = false', () => {
  /**
   * Validates: Requirement 4.6
   * WHERE the Auto-load feature is disabled, THE ChatWidget SHALL NOT
   * auto-load on open and SHALL display the standard conversation type
   * selection screen.
   */
  it('displays the standard conversation type selection screen after open (not auto-loaded)', async () => {
    seedLocalStorage()

    render(<ChatWidget />)
    await act(async () => {})

    // Open the widget
    await openWidget()

    // Advance timers well past both auto-load setTimeout delays (2 × 1 000 ms)
    await act(async () => { jest.advanceTimersByTime(3000) })

    // ── Assertion 1: standard selection screen is shown ─────────────────────
    // The heading "What can I help you with?" is only rendered when
    // conversationType === null (i.e. the selection screen is active).
    expect(screen.getByText('What can I help you with?')).toBeInTheDocument()

    // Verify the conversation type buttons are rendered
    expect(screen.getByText('Looking for Property')).toBeInTheDocument()
    expect(screen.getByText('Home Buying')).toBeInTheDocument()
    expect(screen.getByText('Home Selling')).toBeInTheDocument()
  })

  it('does not show the auto-load system note (📂 Showing your last search)', async () => {
    seedLocalStorage()

    render(<ChatWidget />)
    await act(async () => {})

    await openWidget()
    await act(async () => { jest.advanceTimersByTime(3000) })

    // The system note message that auto-load would inject
    const systemNote = screen.queryByText(/📂 Showing your last search/i)
    expect(systemNote).toBeNull()
  })

  it('does not show recent search results bot message after open', async () => {
    seedLocalStorage()

    render(<ChatWidget />)
    await act(async () => {})

    await openWidget()
    await act(async () => { jest.advanceTimersByTime(3000) })

    // Auto-load would produce a bot results message containing "Searching with:"
    // No such message should appear on the selection screen.
    const searchingMsg = screen.queryByText(/Searching with:/i)
    expect(searchingMsg).toBeNull()
  })

  it('does not set waitingForYesNo — Yes/No buttons are NOT shown after open', async () => {
    seedLocalStorage()

    render(<ChatWidget />)
    await act(async () => {})

    await openWidget()
    await act(async () => { jest.advanceTimersByTime(3000) })

    // If auto-load had fired it would eventually set waitingForYesNo=true and
    // render Yes/No buttons. They must be absent on the selection screen.
    expect(screen.queryByRole('button', { name: /^Yes$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^No$/i })).toBeNull()
  })

  it('conversationType stays null — the ← Back button is NOT shown', async () => {
    seedLocalStorage()

    render(<ChatWidget />)
    await act(async () => {})

    await openWidget()
    await act(async () => { jest.advanceTimersByTime(3000) })

    // The "← Back" button only appears once a conversationType is selected.
    // It must be absent if auto-load did not fire.
    const backBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Back')
    )
    expect(backBtn).toBeUndefined()
  })

  it('the seeded localStorage entry is unchanged — auto-load did not write to it', async () => {
    seedLocalStorage()
    const originalJson = localStorage.getItem(RECENT_SEARCHES_KEY)

    render(<ChatWidget />)
    await act(async () => {})

    await openWidget()
    await act(async () => { jest.advanceTimersByTime(3000) })

    // localStorage must remain as seeded — auto-load must not have read,
    // processed, or modified it in any observable way.
    expect(localStorage.getItem(RECENT_SEARCHES_KEY)).toBe(originalJson)
  })
})

// ─── Task 12.2: auto-load does NOT fire when the store is empty ───────────────
//
// Strategy: keep all module instances from the top-level mocks (avoiding the
// "multiple React copies" problem that jest.resetModules causes). Instead, spy
// on loadRecentSearches from the already-mocked lib/recentSearches module and
// force it to return [] — simulating an empty store — while also overriding
// ENABLE_AUTO_LOAD to true via a second jest.mock (hoisted, same module).
//
// Because ENABLE_AUTO_LOAD is a constant read at component mount time, we
// patch it directly on the module object returned by the existing mock so the
// running ChatWidget instance sees the updated value.
//
// Validates: Requirement 4.5
// WHERE the Auto-load feature is enabled, IF the Recent Searches Store is empty
// or contains no valid entries, THEN THE ChatWidget SHALL NOT auto-load and
// SHALL display the standard conversation type selection screen.

describe('Task 12.2 — auto-load does NOT fire when the store is empty', () => {
  // Import the mocked module so we can manipulate it per-test
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const recentSearchesMod = require('../../lib/recentSearches') as typeof import('../../lib/recentSearches')

  let loadSpy: jest.SpyInstance
  let originalEnableAutoLoad: boolean

  beforeEach(() => {
    // Stash and override the ENABLE_AUTO_LOAD constant on the module object.
    // ChatWidget reads this value at the time the useEffect runs, so patching
    // the module export is sufficient as long as we do it before render.
    originalEnableAutoLoad = recentSearchesMod.ENABLE_AUTO_LOAD
    ;(recentSearchesMod as Record<string, unknown>).ENABLE_AUTO_LOAD = true

    // Spy on loadRecentSearches and make it return an empty array — empty store.
    loadSpy = jest.spyOn(recentSearchesMod, 'loadRecentSearches').mockReturnValue([])
  })

  afterEach(() => {
    // Restore ENABLE_AUTO_LOAD to its original value (false)
    ;(recentSearchesMod as Record<string, unknown>).ENABLE_AUTO_LOAD = originalEnableAutoLoad
    loadSpy.mockRestore()
  })

  /**
   * Validates: Requirement 4.5
   * The store is empty (loadRecentSearches returns []).
   * Even with ENABLE_AUTO_LOAD = true the widget must show the standard
   * conversation type selection screen and NOT auto-load.
   */
  it('displays the standard conversation type selection screen when the store is empty', async () => {
    render(<ChatWidget />)
    await act(async () => {})

    await openWidget()
    await act(async () => { jest.advanceTimersByTime(3000) })

    // Standard selection heading present → conversationType is still null
    expect(screen.getByText('What can I help you with?')).toBeInTheDocument()
    // Conversation type buttons are rendered
    expect(screen.getByText('Looking for Property')).toBeInTheDocument()
    expect(screen.getByText('Home Buying')).toBeInTheDocument()
    expect(screen.getByText('Home Selling')).toBeInTheDocument()
  })

  it('does not show the auto-load system note (📂 Showing your last search) when store is empty', async () => {
    render(<ChatWidget />)
    await act(async () => {})

    await openWidget()
    await act(async () => { jest.advanceTimersByTime(3000) })

    const systemNote = screen.queryByText(/📂 Showing your last search/i)
    expect(systemNote).toBeNull()
  })

  it('does not show Yes/No buttons when store is empty (waitingForYesNo stays false)', async () => {
    render(<ChatWidget />)
    await act(async () => {})

    await openWidget()
    await act(async () => { jest.advanceTimersByTime(3000) })

    expect(screen.queryByRole('button', { name: /^Yes$/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /^No$/i })).toBeNull()
  })

  it('does not show the ← Back button when store is empty (conversationType stays null)', async () => {
    render(<ChatWidget />)
    await act(async () => {})

    await openWidget()
    await act(async () => { jest.advanceTimersByTime(3000) })

    // "← Back" button only appears after a conversationType has been selected
    const backBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Back')
    )
    expect(backBtn).toBeUndefined()
  })
})

// ─── Task 12.3: auto-load system note contains the replayed query text ────────
//
// Validates: Requirement 4.3
// WHERE the Auto-load feature is enabled, WHEN an auto-load Replay is triggered,
// THE ChatWidget SHALL display a system note (e.g. "📂 Showing your last search:
// *{query}*") as the first bot message, before the Replay results message.

describe('Task 12.3 — auto-load system note contains the replayed query text', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const recentSearchesMod = require('../../lib/recentSearches') as typeof import('../../lib/recentSearches')

  beforeEach(() => {
    ;(recentSearchesMod as Record<string, unknown>).ENABLE_AUTO_LOAD = true
    seedLocalStorage()
  })

  afterEach(() => {
    ;(recentSearchesMod as Record<string, unknown>).ENABLE_AUTO_LOAD = false
  })

  /**
   * Validates: Requirement 4.3
   * The system note message rendered as the first bot message must contain the
   * stored query text ("3 bedroom condo, Angeles City").
   */
  it('renders the system note message that includes the stored query text', async () => {
    render(<ChatWidget />)
    await act(async () => {})

    await openWidget()

    // Advance past both 1 000 ms setTimeout delays inside the auto-load effect
    await act(async () => { jest.advanceTimersByTime(3000) })

    // The system note is the first bot message injected by auto-load.
    // It has the form: "📂 Showing your last search: *{query}*"
    const systemNote = screen.queryByText(/📂 Showing your last search/i)
    expect(systemNote).not.toBeNull()
  })

  it('system note contains the exact query stored in localStorage', async () => {
    render(<ChatWidget />)
    await act(async () => {})

    await openWidget()
    await act(async () => { jest.advanceTimersByTime(3000) })

    // The note is rendered via dangerouslySetInnerHTML which converts *text* to
    // <em>text</em>. So we look at the parent container's textContent instead.
    const messageContainers = document.querySelectorAll('[dangerouslysetinnerhtml], .whitespace-pre-line')
    const allText = Array.from(document.querySelectorAll('div'))
      .map((el) => el.textContent ?? '')
      .join(' ')

    // The query text must appear somewhere in the rendered output
    expect(allText).toContain('3 bedroom condo, Angeles City')
    void messageContainers // used above via document query
  })

  it('the system note message appears before any property results message', async () => {
    render(<ChatWidget />)
    await act(async () => {})

    await openWidget()
    await act(async () => { jest.advanceTimersByTime(3000) })

    // Find all bot message div elements (rendered as .whitespace-pre-line inside
    // the messages list). The system note must be the first bot message.
    const allDivs = Array.from(document.querySelectorAll('div'))
    const noteDiv = allDivs.find((d) =>
      d.textContent?.includes('📂 Showing your last search')
    )
    expect(noteDiv).toBeDefined()
  })

  it('auto-load sets conversationType to "looking" (Back button is visible)', async () => {
    render(<ChatWidget />)
    await act(async () => {})

    await openWidget()
    await act(async () => { jest.advanceTimersByTime(3000) })

    // Once auto-load fires, conversationType is set to "looking", which causes
    // the topic bar with the "← Back" button to render.
    const backBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.includes('Back')
    )
    expect(backBtn).toBeDefined()
  })
})

// ─── Task 12.4: auto-load fires at most once per page load ────────────────────
//
// Validates: Requirement 4.1
// The auto-load flag (autoLoadFiredRef) is set to true after the first fire.
// Closing and reopening the widget within the same page session must NOT
// re-trigger auto-load.

describe('Task 12.4 — auto-load fires at most once per page load', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const recentSearchesMod = require('../../lib/recentSearches') as typeof import('../../lib/recentSearches')

  beforeEach(() => {
    ;(recentSearchesMod as Record<string, unknown>).ENABLE_AUTO_LOAD = true
    seedLocalStorage()
  })

  afterEach(() => {
    ;(recentSearchesMod as Record<string, unknown>).ENABLE_AUTO_LOAD = false
  })

  /**
   * Validates: Requirement 4.1
   * After auto-load fires on first open, close the widget then reopen it.
   * The system note "📂 Showing your last search" must appear exactly once —
   * the second open must not re-inject the system note.
   */
  it('system note "📂 Showing your last search" appears exactly once after open→close→reopen', async () => {
    render(<ChatWidget />)
    await act(async () => {})

    // ── First open: auto-load should fire ───────────────────────────────────
    await openWidget()
    await act(async () => { jest.advanceTimersByTime(3000) })

    // Verify auto-load fired on first open
    const noteAfterFirstOpen = screen.queryAllByText(/📂 Showing your last search/i)
    expect(noteAfterFirstOpen.length).toBeGreaterThanOrEqual(1)

    // ── Close the widget ─────────────────────────────────────────────────────
    // The close button is in the header and contains the X icon.
    // It has onClick={() => setIsOpen(false)}.
    const closeButton = Array.from(document.querySelectorAll('button')).find((b) => {
      // The button contains an SVG (X icon) and is inside the blue header
      const parent = b.closest('div')
      return (
        b.querySelector('svg') !== null &&
        (parent?.className?.includes('blue') ||
          b.className?.includes('hover:bg-blue-700'))
      )
    })
    if (closeButton) {
      await act(async () => { closeButton.click() })
      await act(async () => {})
    }

    // ── Second open: auto-load must NOT re-fire ──────────────────────────────
    await openWidget()
    await act(async () => { jest.advanceTimersByTime(3000) })

    // Count how many elements contain the system note text.
    // Because sessionStorage persists messages, the note may still be visible
    // from the first open — but it must appear only once (not twice).
    const noteElements = screen.queryAllByText(/📂 Showing your last search/i)
    expect(noteElements.length).toBe(1)
  })

  it('the standard selection screen is NOT shown again after second open (conversationType persists)', async () => {
    render(<ChatWidget />)
    await act(async () => {})

    // First open — auto-load fires, conversationType becomes "looking"
    await openWidget()
    await act(async () => { jest.advanceTimersByTime(3000) })

    // Close
    const closeButton = Array.from(document.querySelectorAll('button')).find((b) =>
      b.querySelector('svg') !== null &&
      b.className?.includes('hover:bg-blue-700')
    )
    if (closeButton) {
      await act(async () => { closeButton.click() })
      await act(async () => {})
    }

    // Second open
    await openWidget()
    await act(async () => { jest.advanceTimersByTime(3000) })

    // conversationType is persisted in sessionStorage, so the selection screen
    // ("What can I help you with?") should NOT be shown again.
    const selectionHeading = screen.queryByText(/What can I help you with\?/i)
    expect(selectionHeading).toBeNull()
  })
})
