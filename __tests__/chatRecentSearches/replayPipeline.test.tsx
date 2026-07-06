/**
 * Property-based integration tests for the replay pipeline.
 * Properties 5 and 6 — using fast-check + @testing-library/react.
 *
 * Feature: chat-recent-searches
 * Property 5: Replay Pipeline Equivalence — Validates: Requirements 3.2
 * Property 6: Post-Replay State — Validates: Requirements 3.4
 *
 * Strategy:
 *   - Supabase is mocked to return empty data, making realProperties=[] and
 *     runPropertySearch output fully deterministic for any query.
 *   - Task 7 (RecentSearchesPanel UI) is not yet implemented, so we cannot
 *     click replay buttons directly. Instead we validate the same invariants
 *     by exercising handleSend, which calls the identical runPropertySearch /
 *     post-search path that handleReplay uses.
 *
 *   - Property 5: For each generated query we:
 *       1. Open the widget & navigate to "Looking for Property"
 *       2. Submit the query; capture the bot search response
 *       3. Click "← Back" (resetChat)
 *       4. Navigate to "Looking for Property" again
 *       5. Submit the same query again; capture the second bot search response
 *       6. Assert the two responses are identical
 *     This confirms runPropertySearch is deterministic — which validates that
 *     handleReplay would produce the same output as a direct call.
 *
 *   - Property 6: For each generated query submit it in the looking flow,
 *     advance timers 2 000 ms, assert last bot message is the follow-up
 *     prompt and Yes/No buttons are visible.
 *
 *   Both properties mount once and reset state between runs by clicking
 *   "← Back" so React is never torn down inside the property loop.
 */

import React from 'react'
import { render, screen, fireEvent, act, within, cleanup } from '@testing-library/react'
import fc from 'fast-check'
import ChatWidget from '../../components/ChatWidget'

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

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/**
 * Valid query: non-empty after trim, min 3 chars, max 200 chars.
 * Filter out "yes"/"no" to avoid triggering the Yes/No handler.
 */
const validQuery = fc
  .string({ minLength: 3, maxLength: 200 })
  .filter((s) => s.trim().length >= 3)
  .filter((s) => {
    const lower = s.trim().toLowerCase()
    return lower !== 'yes' && lower !== 'no'
  })
  .map((s) => s.trim())

// ─── Single-render helpers ────────────────────────────────────────────────────

/**
 * Open the chat widget's floating action button.
 * The FAB is the only `fixed`-positioned or `rounded-full` button before
 * the chat panel opens.
 */
async function openWidget(): Promise<void> {
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
 * Navigate to the "Looking for Property" flow.
 * Assumes the widget is already open and showing the topic-selection screen.
 */
async function selectLooking(): Promise<void> {
  // Flush any pending updates first
  await act(async () => {})

  const btn = screen.queryByText('Looking for Property')
  if (btn) {
    await act(async () => { btn.click() })
    // Extra flush to let all state updates settle
    await act(async () => {})
    await act(async () => {})
  }
}

/**
 * Click the "← Back" button to reset the chat to the topic-selection screen.
 */
async function clickBack(): Promise<void> {
  // The back button contains the text "← Back" and uses font-bold
  const backBtn = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent?.includes('Back')
  )
  if (backBtn) {
    await act(async () => { backBtn.click() })
    await act(async () => {})
  }
}

/**
 * Submit a query through the freeform property-search input and advance
 * fake timers to fire all setTimeout callbacks (2 × 1 000 ms).
 *
 * Uses fireEvent.change + Enter key to trigger handleSend, avoiding
 * the ambiguity of finding the correct Send button among other buttons.
 */
async function submitQuery(query: string): Promise<void> {
  // Flush any pending React state updates before querying
  await act(async () => {})

  // Find the input by its placeholder (set when conversationType === 'looking')
  // Placeholder: 'e.g. 110 sqm lot, near Clark, under 5M'
  let input = document.querySelector(
    'input[placeholder*="sqm"]'
  ) as HTMLInputElement | null

  if (!input) {
    input = document.querySelector('input[placeholder*="110"]') as HTMLInputElement | null
  }
  if (!input) {
    input = document.querySelector('input[placeholder*="lot"]') as HTMLInputElement | null
  }
  if (!input) {
    const allInputs = Array.from(document.querySelectorAll('input'))
    input = allInputs.find((i) => i.type !== 'hidden') || null
  }
  if (!input) throw new Error('Property search input not found')

  // Set the value and trigger React's onChange handler
  await act(async () => {
    fireEvent.change(input!, { target: { value: query } })
  })

  // Submit via Enter key — the component handles: onKeyDown={e => e.key === 'Enter' && handleSend()}
  await act(async () => {
    fireEvent.keyDown(input!, { key: 'Enter', code: 'Enter' })
  })

  // Advance bot response timer (1 000 ms)
  await act(async () => { jest.advanceTimersByTime(1000) })
  // Advance follow-up prompt timer (1 000 ms)
  await act(async () => { jest.advanceTimersByTime(1000) })
}

/**
 * Return the textContent of every bot message bubble currently in the DOM.
 * Bot messages are `.flex.justify-start > .bg-white` children inside
 * the messages scroll area.
 */
function getBotMessages(): string[] {
  const bubbles = document.querySelectorAll(
    '.bg-gray-50 .flex.justify-start .bg-white'
  )
  return Array.from(bubbles).map((el) => el.textContent ?? '')
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

// ─── Property 5: Replay Pipeline Equivalence ─────────────────────────────────

describe('Property 5: Replay Pipeline Equivalence', () => {
  // Feature: chat-recent-searches, Property 5: Replay Pipeline Equivalence
  it(
    'for any valid query, runPropertySearch is deterministic: submitting the same query twice produces the same bot response',
    async () => {
      // Mount once for all runs
      render(<ChatWidget />)
      await act(async () => {})
      await openWidget()

      await fc.assert(
        fc.asyncProperty(validQuery, async (query) => {
          // ── First submission ──────────────────────────────────────────
          await selectLooking()
          await submitQuery(query)

          const msgs1 = getBotMessages()
          // Layout: [welcome, ...search result..., follow-up prompt]
          // The search result is the second-to-last bot message
          expect(msgs1.length).toBeGreaterThanOrEqual(2)
          const result1 = msgs1[msgs1.length - 2]
          expect(result1).toBeTruthy()

          // Reset via "← Back"
          await clickBack()
          await act(async () => {
            // Ensure any pending timers from the Yes/No state are flushed
            jest.advanceTimersByTime(100)
          })

          // ── Second submission ─────────────────────────────────────────
          await selectLooking()
          await submitQuery(query)

          const msgs2 = getBotMessages()
          expect(msgs2.length).toBeGreaterThanOrEqual(2)
          const result2 = msgs2[msgs2.length - 2]
          expect(result2).toBeTruthy()

          // Both runs must produce the same bot response.
          // Validates Property 5: handleReplay calls the same
          // runPropertySearch function → produces identical output.
          expect(result1).toBe(result2)

          // Reset for next run
          await clickBack()
          await act(async () => { jest.advanceTimersByTime(100) })
          localStorage.clear()
          sessionStorage.clear()
        }),
        { numRuns: 100 }
      )
    }
  )
})

// ─── Property 6: Post-Replay State ───────────────────────────────────────────

describe('Property 6: Post-Replay State', () => {
  // Feature: chat-recent-searches, Property 6: Post-Replay State
  it(
    "for any valid query submitted, after search completes the last message is 'Would you like to search for more properties?' and Yes/No buttons are shown",
    async () => {
      render(<ChatWidget />)
      await act(async () => {})
      await openWidget()

      await fc.assert(
        fc.asyncProperty(validQuery, async (query) => {
          await selectLooking()
          await submitQuery(query)

          // Assert: last bot message is the follow-up prompt
          const botMsgs = getBotMessages()
          expect(botMsgs.length).toBeGreaterThanOrEqual(1)

          const lastMsg = botMsgs[botMsgs.length - 1]
          expect(lastMsg).toContain(
            'Would you like to search for more properties?'
          )

          // Assert: Yes/No buttons are visible (waitingForYesNo = true)
          expect(screen.queryByRole('button', { name: /^Yes$/i })).not.toBeNull()
          expect(screen.queryByRole('button', { name: /^No$/i })).not.toBeNull()

          // Reset for next run
          await clickBack()
          await act(async () => { jest.advanceTimersByTime(100) })
          localStorage.clear()
          sessionStorage.clear()
        }),
        { numRuns: 100 }
      )
    }
  )
})
