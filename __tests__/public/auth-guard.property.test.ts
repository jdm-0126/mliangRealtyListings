/**
 * Property 1: Auth_Guard always redirects unauthenticated users from admin routes
 *
 * For any /admin/** path and any sessionStorage state that is NOT
 * `brokerAdminAuth === 'authenticated'` (including missing key, wrong value,
 * or exception), rendering AuthGuard SHALL:
 *   - call `router.push('/')`, AND
 *   - NOT render the protected page content.
 *
 * **Validates: Requirements 1.3, 9.2, 9.3**
 */

import React from 'react'
import * as fc from 'fast-check'
import { render, screen, act } from '@testing-library/react'

// ─── Mock next/navigation ──────────────────────────────────────────────────
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// ─── Import after mocks are hoisted ────────────────────────────────────────
import AuthGuard from '../../app/(admin)/components/AuthGuard'

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Stub sessionStorage.getItem to return a fixed value */
function stubSessionStorage(returnValue: string | null): void {
  jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(returnValue)
}

/** Stub sessionStorage.getItem to throw an error */
function stubSessionStorageThrows(): void {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('sessionStorage unavailable')
  })
}

/** Render AuthGuard and wait for effects to settle */
async function renderAndSettle(children: React.ReactNode = React.createElement('div', { 'data-testid': 'protected-content' }, 'Secret')) {
  let result: ReturnType<typeof render>
  await act(async () => {
    result = render(React.createElement(AuthGuard, null, children))
  })
  return result!
}

// ─── Tests ─────────────────────────────────────────────────────────────────

describe('Property 1: AuthGuard always redirects unauthenticated users', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  // ── Sub-property A: any non-"authenticated" string → redirect, no content ──
  it('redirects and hides protected content for any non-"authenticated" string value', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => s !== 'authenticated'),
        (wrongValue) => {
          jest.clearAllMocks()
          jest.restoreAllMocks()
          stubSessionStorage(wrongValue)

          const { unmount } = render(
            React.createElement(
              AuthGuard,
              null,
              React.createElement('div', { 'data-testid': 'protected-content' }, 'Secret')
            )
          )

          // After mount effects run synchronously in jsdom with act() batching,
          // we need to flush effects. We use a synchronous check after the fact.
          // useEffect runs after paint; in jsdom with jest fake timers they are
          // flushed. We trigger them via act wrapper at the assertion step.
          act(() => {})

          const protectedElement = document.querySelector('[data-testid="protected-content"]')
          const redirectCalled = mockPush.mock.calls.some(call => call[0] === '/')

          unmount()

          // Both conditions must hold
          return redirectCalled && protectedElement === null
        }
      ),
      { numRuns: 20 }
    )
  })

  // ── Sub-property B: null (key absent) → redirect, no content ──────────────
  it('redirects and hides protected content when sessionStorage returns null (key absent)', async () => {
    stubSessionStorage(null)

    await renderAndSettle()

    expect(mockPush).toHaveBeenCalledWith('/')
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  // ── Sub-property C: sessionStorage throws → redirect, no content ──────────
  it('redirects and hides protected content when sessionStorage.getItem throws', async () => {
    stubSessionStorageThrows()

    await renderAndSettle()

    expect(mockPush).toHaveBeenCalledWith('/')
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  // ── Sub-property D: fc-generated mix of null + non-"authenticated" strings ─
  it('redirects for any combination of null or non-"authenticated" string (mixed arbitrary)', async () => {
    const nonAuthArbitrary = fc.oneof(
      fc.constant(null),
      fc.string().filter(s => s !== 'authenticated')
    )

    await fc.assert(
      fc.asyncProperty(nonAuthArbitrary, async (value) => {
        jest.clearAllMocks()
        jest.restoreAllMocks()

        if (value === null) {
          stubSessionStorage(null)
        } else {
          stubSessionStorage(value)
        }

        await act(async () => {
          render(
            React.createElement(
              AuthGuard,
              null,
              React.createElement('div', { 'data-testid': 'protected-content' }, 'Secret')
            )
          )
        })

        const redirectCalled = mockPush.mock.calls.some(call => call[0] === '/')
        const protectedVisible = document.querySelector('[data-testid="protected-content"]') !== null

        // Clean up rendered output between runs
        document.body.innerHTML = ''

        return redirectCalled && !protectedVisible
      }),
      { numRuns: 20 }
    )
  })
})
