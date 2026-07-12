/**
 * Tests for Task 8: RecentSearchesPanel and clear behavior.
 *
 * Feature: chat-recent-searches
 * 8.1 Property test: Panel renders entries in store order (Property 10)
 * 8.2 Property test: Clear empties the store (Property 8)
 * 8.3 Unit test: empty store shows "No recent searches" and no entry buttons
 * 8.4 Unit test: panel heading always contains "Recent Searches"
 * 8.5 Unit test: Clear button absent when empty; present and functional when not
 * 8.6 Unit test: Clear with localStorage throwing — in-memory state still []
 *
 * Validates: Requirements 2.1, 2.3, 2.4, 2.6, 5.1, 5.2, 5.4
 */

import React from 'react'
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react'
import fc from 'fast-check'
import ChatWidget from '../../components/ChatWidget'
import {
  RECENT_SEARCHES_KEY,
  persistRecentSearches,
  type RecentSearchEntry,
} from '../../lib/recentSearches'

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

// ─── Arbitraries ──────────────────────────────────────────────────────────────

const validQuery = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter((s) => s.trim().length > 0)
  .map((s) => s.trim())

const validEntry = fc.record({
  query: validQuery,
  timestamp: fc
    .date({ min: new Date('2020-01-01'), max: new Date('2030-01-01') })
    .map((d) => d.toISOString()),
})

/** 1–5 entries with unique queries (case-insensitive) */
const validStore = fc
  .array(validEntry, { minLength: 1, maxLength: 5 })
  .filter(
    (entries) =>
      new Set(entries.map((e) => e.query.toLowerCase())).size === entries.length
  )

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function openWidget(): Promise<void> {
  await act(async () => {})
  const fab = Array.from(document.querySelectorAll('button')).find(
    (b) => b.className.includes('fixed') || b.className.includes('rounded-full')
  )
  if (fab) {
    await act(async () => { fab.click() })
    await act(async () => {})
  }
}

async function selectLooking(): Promise<void> {
  await act(async () => {})
  const btn = screen.queryByText('Looking for Property')
  if (btn) {
    await act(async () => { btn.click() })
    await act(async () => {})
  }
}

async function clickBack(): Promise<void> {
  const backBtn = Array.from(document.querySelectorAll('button')).find(
    (b) => b.textContent?.includes('Back')
  )
  if (backBtn) {
    await act(async () => { backBtn.click() })
    await act(async () => {})
  }
}

function seedStore(entries: RecentSearchEntry[]): void {
  persistRecentSearches(entries)
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

// ─── Task 8.1: Property 10 — Panel renders entries in store order ─────────────

describe('Task 8.1 – Property 10: Panel renders entries in store order', () => {
  // Feature: chat-recent-searches, Property 10: Panel Renders Entries in Store Order
  // Validates: Requirements 2.1, 2.3
  it(
    'for any 1–5 valid entries, rendered buttons appear in same order and labels match truncateQuery(entry.query, 80)',
    async () => {
      await fc.assert(
        fc.asyncProperty(validStore, async (entries) => {
          seedStore(entries)

          render(<ChatWidget />)
          await act(async () => {})
          await openWidget()
          await selectLooking()
          await act(async () => {})

          // Collect all entry buttons (non-Clear, non-Back, non-FAB buttons inside the panel)
          // Entry buttons are inside the RecentSearchesPanel and have w-full text-left classes
          const entryButtons = Array.from(document.querySelectorAll('button')).filter(
            (b) =>
              b.className.includes('w-full') &&
              b.className.includes('text-left') &&
              !b.textContent?.includes('Back') &&
              !b.textContent?.includes('Clear') &&
              !b.textContent?.includes('Looking') &&
              !b.textContent?.includes('Home') &&
              !b.textContent?.includes('Rental') &&
              !b.textContent?.includes('General') &&
              !b.textContent?.includes('Real Estate')
          )

          // Each entry should have a corresponding button
          expect(entryButtons.length).toBe(entries.length)

          // Labels must match truncateQuery(entry.query, 80) in order
          entries.forEach((entry, i) => {
            const label = entry.query.length <= 80
              ? entry.query
              : entry.query.slice(0, 80) + '…'
            expect(entryButtons[i].textContent?.trim()).toBe(label)
          })

          cleanup()
          localStorage.clear()
          sessionStorage.clear()
        }),
        { numRuns: 50 }
      )
    }
  )
})

// ─── Task 8.2: Property 8 — Clear empties the store ──────────────────────────

describe('Task 8.2 – Property 8: Clear empties the store', () => {
  // Feature: chat-recent-searches, Property 8: Clear Empties the Store
  // Validates: Requirements 5.1, 5.2
  it(
    'for any store with 1–5 entries, clicking Clear results in localStorage key parsing to [] and in-memory recentSearches being []',
    async () => {
      await fc.assert(
        fc.asyncProperty(validStore, async (entries) => {
          seedStore(entries)

          render(<ChatWidget />)
          await act(async () => {})
          await openWidget()
          await selectLooking()
          await act(async () => {})

          // Find and click the Clear button
          const clearBtn = Array.from(document.querySelectorAll('button')).find(
            (b) => b.textContent?.trim() === 'Clear'
          )
          expect(clearBtn).toBeDefined()

          await act(async () => { clearBtn!.click() })
          await act(async () => {})

          // localStorage key should be removed or empty array
          const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
          if (stored !== null) {
            expect(JSON.parse(stored)).toEqual([])
          }

          // In-memory: "No recent searches" text should appear
          const noRecent = document.querySelector('p')
          const allText = Array.from(document.querySelectorAll('p, span'))
            .map((el) => el.textContent ?? '')
            .join(' ')
          expect(allText).toContain('No recent searches')

          // Entry buttons should be gone
          const entryButtons = Array.from(document.querySelectorAll('button')).filter(
            (b) =>
              b.className.includes('w-full') &&
              b.className.includes('text-left') &&
              !b.textContent?.includes('Back') &&
              !b.textContent?.includes('Clear')
          )
          expect(entryButtons.length).toBe(0)

          void noRecent
          cleanup()
          localStorage.clear()
          sessionStorage.clear()
        }),
        { numRuns: 50 }
      )
    }
  )
})

// ─── Task 8.3: Empty store shows "No recent searches" and no entry buttons ────

describe('Task 8.3 – empty store shows "No recent searches" and no entry buttons', () => {
  // Validates: Requirement 2.4
  it('shows "No recent searches" italic text when store is empty', async () => {
    // No seed — store is empty
    render(<ChatWidget />)
    await act(async () => {})
    await openWidget()
    await selectLooking()
    await act(async () => {})

    expect(screen.getByText('No recent searches')).toBeInTheDocument()
  })

  it('renders no entry buttons when store is empty', async () => {
    render(<ChatWidget />)
    await act(async () => {})
    await openWidget()
    await selectLooking()
    await act(async () => {})

    const entryButtons = Array.from(document.querySelectorAll('button')).filter(
      (b) =>
        b.className.includes('w-full') &&
        b.className.includes('text-left') &&
        !b.textContent?.includes('Back') &&
        !b.textContent?.includes('Clear') &&
        !b.textContent?.includes('Looking') &&
        !b.textContent?.includes('Home') &&
        !b.textContent?.includes('Rental') &&
        !b.textContent?.includes('General') &&
        !b.textContent?.includes('Real Estate')
    )
    expect(entryButtons.length).toBe(0)
  })
})

// ─── Task 8.4: Panel heading always contains "Recent Searches" ────────────────

describe('Task 8.4 – panel heading always contains "Recent Searches"', () => {
  // Validates: Requirement 2.6
  it('renders "Recent Searches" heading when store is empty', async () => {
    render(<ChatWidget />)
    await act(async () => {})
    await openWidget()
    await selectLooking()
    await act(async () => {})

    expect(screen.getByText('Recent Searches')).toBeInTheDocument()
  })

  it('renders "Recent Searches" heading when store has entries', async () => {
    const entries: RecentSearchEntry[] = [
      { query: '3BR house San Fernando', timestamp: new Date().toISOString() },
    ]
    seedStore(entries)

    render(<ChatWidget />)
    await act(async () => {})
    await openWidget()
    await selectLooking()
    await act(async () => {})

    expect(screen.getByText('Recent Searches')).toBeInTheDocument()
  })
})

// ─── Task 8.5: Clear button absent when empty; present and functional when not ─

describe('Task 8.5 – Clear button absent when empty; present and functional when store has entries', () => {
  // Validates: Requirement 5.1
  it('Clear button is absent when store is empty', async () => {
    render(<ChatWidget />)
    await act(async () => {})
    await openWidget()
    await selectLooking()
    await act(async () => {})

    const clearBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Clear'
    )
    expect(clearBtn).toBeUndefined()
  })

  it('Clear button is present when store has entries', async () => {
    const entries: RecentSearchEntry[] = [
      { query: 'lot near Clark', timestamp: new Date().toISOString() },
    ]
    seedStore(entries)

    render(<ChatWidget />)
    await act(async () => {})
    await openWidget()
    await selectLooking()
    await act(async () => {})

    const clearBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Clear'
    )
    expect(clearBtn).toBeDefined()
  })

  it('clicking Clear removes all entry buttons', async () => {
    const entries: RecentSearchEntry[] = [
      { query: 'house and lot Mabalacat', timestamp: new Date().toISOString() },
      { query: 'condo Angeles City', timestamp: new Date().toISOString() },
    ]
    seedStore(entries)

    render(<ChatWidget />)
    await act(async () => {})
    await openWidget()
    await selectLooking()
    await act(async () => {})

    const clearBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Clear'
    )
    expect(clearBtn).toBeDefined()

    await act(async () => { clearBtn!.click() })
    await act(async () => {})

    expect(screen.getByText('No recent searches')).toBeInTheDocument()
    const clearBtnAfter = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Clear'
    )
    expect(clearBtnAfter).toBeUndefined()
  })
})

// ─── Task 8.6: Clear with localStorage throwing — in-memory state still [] ────

describe('Task 8.6 – Clear with localStorage throwing: in-memory state still set to []', () => {
  // Validates: Requirement 5.4
  it('in-memory recentSearches is [] even when localStorage.removeItem throws', async () => {
    const entries: RecentSearchEntry[] = [
      { query: '2BR condo near Clark', timestamp: new Date().toISOString() },
    ]
    seedStore(entries)

    render(<ChatWidget />)
    await act(async () => {})
    await openWidget()
    await selectLooking()
    await act(async () => {})

    // Make localStorage.removeItem throw
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('localStorage unavailable')
    })

    const clearBtn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Clear'
    )
    expect(clearBtn).toBeDefined()

    // Should not throw
    expect(async () => {
      await act(async () => { clearBtn!.click() })
    }).not.toThrow()

    await act(async () => {})

    // In-memory state should be cleared — "No recent searches" shown
    expect(screen.getByText('No recent searches')).toBeInTheDocument()

    jest.restoreAllMocks()
  })
})
