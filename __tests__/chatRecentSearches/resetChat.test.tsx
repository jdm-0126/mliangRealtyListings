/**
 * Property-based integration test for Property 7: resetChat Does Not Touch the Store.
 *
 * Feature: chat-recent-searches, Property 7: resetChat Does Not Touch the Store
 *
 * Property 7:
 *   For any store state written to localStorage before calling resetChat(),
 *   after resetChat() returns the localStorage value at key chat_recent_searches
 *   SHALL be identical to its value before the call.
 *
 * Validates: Requirements 5.3
 *
 * Strategy:
 *   - Render ChatWidget in the jsdom environment (default for this project).
 *   - Write an arbitrary valid store JSON to localStorage under
 *     chat_recent_searches BEFORE navigating the widget.
 *   - Open the widget, select a conversation type (any non-looking type
 *     to keep the test fast — no Supabase fetch needed), then click the
 *     "← Back" button to trigger resetChat().
 *   - Assert that localStorage.getItem('chat_recent_searches') is exactly
 *     the same string as it was before the click.
 *   - Also test the 'looking' conversation type to be thorough.
 *
 * Note: Supabase is mocked to avoid network calls. The "looking" flow calls
 * loadRecentSearches() (read-only) inside selectConversationType, which must
 * not alter the stored JSON.
 */

import React from 'react'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import fc from 'fast-check'
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

// ─── Arbitraries (from design doc) ───────────────────────────────────────────

const validQuery = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter((s) => s.trim().length > 0)

const validEntry = fc.record({
  query: validQuery,
  timestamp: fc
    .date({
      min: new Date('1000-01-01T00:00:00.000Z'),
      max: new Date('9999-12-31T23:59:59.999Z'),
    })
    .map((d) => d.toISOString()),
})

/** Valid store: 1–5 entries with unique queries (case-insensitive) */
const validStore = fc
  .array(validEntry, { minLength: 1, maxLength: 5 })
  .filter(
    (entries) =>
      new Set(entries.map((e) => e.query.toLowerCase())).size === entries.length
  )

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Open the chat widget's floating action button. */
async function openWidget(): Promise<void> {
  await act(async () => {})
  const buttons = Array.from(document.querySelectorAll('button'))
  const fab = buttons.find(
    (b) =>
      b.className.includes('fixed') ||
      b.className.includes('rounded-full')
  )
  if (fab) {
    await act(async () => { fab.click() })
    await act(async () => {})
  }
}

/**
 * Select a conversation type by its visible label text.
 * Conversation type buttons are shown when the widget is open and no
 * conversation is active.
 */
async function selectConversationType(label: string): Promise<void> {
  await act(async () => {})
  const btn = screen.queryByText(label)
  if (btn) {
    await act(async () => { btn.click() })
    await act(async () => {})
    await act(async () => {})
  }
}

/** Click the "← Back" button to invoke resetChat(). */
async function clickBack(): Promise<void> {
  await act(async () => {})
  const backBtn = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent?.includes('Back')
  )
  if (backBtn) {
    await act(async () => { backBtn.click() })
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

// ─── Property 7: resetChat Does Not Touch the Store ───────────────────────────

describe('Property 7: resetChat Does Not Touch the Store', () => {
  // Feature: chat-recent-searches, Property 7: resetChat Does Not Touch the Store
  it(
    'for any valid store state in localStorage, clicking ← Back (resetChat) leaves chat_recent_searches identical',
    async () => {
      render(<ChatWidget />)
      await act(async () => {})
      await openWidget()

      await fc.assert(
        fc.asyncProperty(
          validStore,
          // Pick a conversation type (non-looking keeps the test faster; we
          // also test 'looking' in the second property below)
          fc.constantFrom(
            'Home Buying',
            'Home Selling',
            'Rental Properties',
            'Real Estate Investment',
            'General Questions',
          ),
          async (entries, conversationLabel) => {
            try {
              // ── 1. Write arbitrary valid store to localStorage ──────────
              const storedJson = JSON.stringify(entries)
              localStorage.setItem(RECENT_SEARCHES_KEY, storedJson)

              // ── 2. Select a conversation type → "← Back" appears ───────
              await selectConversationType(conversationLabel)

              // Confirm the "← Back" button is visible
              const backBtn = Array.from(document.querySelectorAll('button')).find(
                (b) => b.textContent?.includes('Back')
              )
              expect(backBtn).not.toBeNull()

              // ── 3. Capture the stored value BEFORE resetChat ────────────
              const valueBefore = localStorage.getItem(RECENT_SEARCHES_KEY)

              // ── 4. Invoke resetChat via the "← Back" button ─────────────
              await clickBack()

              // ── 5. Assert localStorage is unchanged ────────────────────
              const valueAfter = localStorage.getItem(RECENT_SEARCHES_KEY)

              // The key must still exist and its value must be bit-for-bit
              // identical to what it was before resetChat() was called.
              expect(valueAfter).toBe(valueBefore)

              // Both must equal the original JSON we wrote (belt-and-suspenders)
              expect(valueAfter).toBe(storedJson)
            } finally {
              // Reset for the next fast-check run: navigate back to topic screen
              // The widget should already be on the topic screen after clickBack(),
              // but guard against the case where selectConversationType failed.
              const backBtn = Array.from(document.querySelectorAll('button')).find(
                (b) => b.textContent?.includes('Back')
              )
              if (backBtn) {
                await act(async () => { backBtn.click() })
                await act(async () => {})
              }
              localStorage.clear()
              sessionStorage.clear()
            }
          }
        ),
        { numRuns: 100 }
      )
    }
  )

  it(
    'for any valid store state, the Looking for Property flow (which reads localStorage) also leaves chat_recent_searches unchanged after ← Back',
    async () => {
      render(<ChatWidget />)
      await act(async () => {})
      await openWidget()

      await fc.assert(
        fc.asyncProperty(
          validStore,
          async (entries) => {
            try {
              // ── 1. Write arbitrary valid store to localStorage ──────────
              const storedJson = JSON.stringify(entries)
              localStorage.setItem(RECENT_SEARCHES_KEY, storedJson)

              // ── 2. Navigate to "Looking for Property" ──────────────────
              // This calls loadRecentSearches() (read-only) internally.
              await selectConversationType('Looking for Property')

              // ── 3. Capture value BEFORE resetChat ──────────────────────
              const valueBefore = localStorage.getItem(RECENT_SEARCHES_KEY)

              // Sanity: loadRecentSearches must not have modified the stored value
              expect(valueBefore).toBe(storedJson)

              // ── 4. Click ← Back to invoke resetChat() ──────────────────
              await clickBack()

              // ── 5. Assert localStorage is unchanged after resetChat ─────
              const valueAfter = localStorage.getItem(RECENT_SEARCHES_KEY)

              expect(valueAfter).toBe(valueBefore)
              expect(valueAfter).toBe(storedJson)
            } finally {
              const backBtn = Array.from(document.querySelectorAll('button')).find(
                (b) => b.textContent?.includes('Back')
              )
              if (backBtn) {
                await act(async () => { backBtn.click() })
                await act(async () => {})
              }
              localStorage.clear()
              sessionStorage.clear()
            }
          }
        ),
        { numRuns: 100 }
      )
    }
  )
})
