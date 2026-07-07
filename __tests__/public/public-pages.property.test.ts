/**
 * Property 2: Public pages perform no authentication checks
 *
 * Public client components (PublicHeader, ListingsClientWrapper, InquiryForm)
 * SHALL NEVER call `sessionStorage.getItem` regardless of what authentication
 * state the visitor might have.  Auth checks are exclusively the
 * Auth_Guard's responsibility.
 *
 * **Validates: Requirements 1.4**
 */

import React from 'react'
import * as fc from 'fast-check'
import { render, act } from '@testing-library/react'

// ─── Required mocks ──────────────────────────────────────────────────────────

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement('a', { href, ...rest }, children),
}))

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) =>
    React.createElement('img', { src, alt }),
}))

jest.mock('@/app/lib/supabaseClient', () => ({
  supabase: null,
}))

// ─── Import components after mocks are hoisted ───────────────────────────────

import PublicHeader from '../../app/(public)/components/PublicHeader'
import ListingsClientWrapper from '../../app/(public)/components/ListingsClientWrapper'
import InquiryForm from '../../app/(public)/components/InquiryForm'

// ─── Arbitrary for "auth state" values stored in sessionStorage ──────────────
//
// These are all the plausible values sessionStorage.getItem('brokerAdminAuth')
// could return in the wild: null (key absent), the authenticated sentinel, and
// arbitrary strings.  Public components must not call getItem at all.

const authStateArb = fc.oneof(
  fc.constant(null),                              // key absent
  fc.constant('authenticated'),                   // valid admin token
  fc.string({ minLength: 0, maxLength: 50 }),     // arbitrary strings
)

// ─── Helper: render component and assert sessionStorage.getItem never called ─
//
// We spy on Storage.prototype.getItem (not the sessionStorage instance) because
// jsdom's sessionStorage instance properties are non-configurable. Spying on
// the prototype is the standard approach — see auth-guard.property.test.ts.

function assertNoSessionStorageRead(renderFn: () => void): boolean {
  const spy = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)

  act(() => {
    renderFn()
  })

  const wasCalled = spy.mock.calls.length > 0
  spy.mockRestore()

  // Clean up DOM between runs
  document.body.innerHTML = ''

  return !wasCalled
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Property 2: Public pages perform no authentication checks', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    document.body.innerHTML = ''
  })

  // ── PublicHeader ──────────────────────────────────────────────────────────

  describe('PublicHeader', () => {
    it('never reads sessionStorage.getItem for any auth state (numRuns: 100)', () => {
      fc.assert(
        fc.property(authStateArb, (authState) => {
          return assertNoSessionStorageRead(() => {
            render(
              React.createElement(PublicHeader, {
                businessName: 'Test Brokerage',
              })
            )
          })
        }),
        { numRuns: 100 }
      )
    })
  })

  // ── ListingsClientWrapper ─────────────────────────────────────────────────

  describe('ListingsClientWrapper', () => {
    it('never reads sessionStorage.getItem for any auth state (numRuns: 100)', () => {
      fc.assert(
        fc.property(authStateArb, (_authState) => {
          return assertNoSessionStorageRead(() => {
            render(
              React.createElement(ListingsClientWrapper, {
                allListings: [],
              })
            )
          })
        }),
        { numRuns: 100 }
      )
    })
  })

  // ── InquiryForm ───────────────────────────────────────────────────────────

  describe('InquiryForm', () => {
    it('never reads sessionStorage.getItem for any auth state (numRuns: 100)', () => {
      fc.assert(
        fc.property(authStateArb, (_authState) => {
          return assertNoSessionStorageRead(() => {
            render(
              React.createElement(InquiryForm, {
                contactNumber: '09393440944',
              })
            )
          })
        }),
        { numRuns: 100 }
      )
    })
  })

  // ── All three components together ─────────────────────────────────────────

  it('none of the three public components call sessionStorage.getItem across varied auth states', () => {
    fc.assert(
      fc.property(authStateArb, (_authState) => {
        const spy = jest.spyOn(Storage.prototype, 'getItem').mockReturnValue(null)

        act(() => {
          render(
            React.createElement(
              React.Fragment,
              null,
              React.createElement(PublicHeader, { businessName: 'Test Brokerage' }),
              React.createElement(ListingsClientWrapper, { allListings: [] }),
              React.createElement(InquiryForm, { contactNumber: '09393440944' }),
            )
          )
        })

        const wasCalled = spy.mock.calls.length > 0
        spy.mockRestore()
        document.body.innerHTML = ''

        return !wasCalled
      }),
      { numRuns: 100 }
    )
  })
})
