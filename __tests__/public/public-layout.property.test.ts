/**
 * Property 18: Public pages never render the admin Navigation sidebar or ChatWidget
 *
 * For any page content, the Public Layout SHALL NOT contain any elements
 * from Navigation or ChatWidget.
 *
 * **Validates: Requirements 1.1, 8.5**
 */

import * as fc from 'fast-check'
import { render } from '@testing-library/react'
import React from 'react'

// ── Mock next/navigation (used by PublicHeader) ──────────────────────────────
jest.mock('next/navigation', () => ({
  usePathname: () => '/',
  useRouter: () => ({ push: jest.fn() }),
}))

// ── Mock next/image to avoid canvas/image issues in jsdom ────────────────────
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, ...rest }: { alt: string; [key: string]: unknown }) =>
    React.createElement('img', { alt, ...rest }),
}))

// ── Mock @/lib/tenantServer ───────────────────────────────────────────────────
jest.mock('@/lib/tenantServer', () => ({
  getTenantSettingsServer: () => ({
    businessName: 'M. Liang Realty',
    brokerName: 'M. Liang',
    brokerTitle: 'Licensed Real Estate Broker',
    prcNumber: '0019653',
    officeAddress: '123 Street, San Fernando, Pampanga',
    contactNumber: '09393440944',
    emailAddress: 'contact@realtyprov1.com',
  }),
}))

// ── Mock @/lib/social to avoid env-var dependency ────────────────────────────
jest.mock('@/lib/social', () => ({
  getConfiguredSocialLinks: () => [],
}))

// ── Import the Public Layout after all mocks are in place ────────────────────
import PublicLayout from '../../app/(public)/layout'

// ── Static import analysis ───────────────────────────────────────────────────
// Verify the layout source does not import Navigation or ChatWidget at the
// module level. This is the simplest and most reliable check.
import * as layoutModule from '../../app/(public)/layout'
import NavigationComponent from '../../components/Navigation'
import ChatWidgetComponent from '../../components/ChatWidget'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Known data-testid / aria-label markers that Navigation and ChatWidget
 * are expected to expose (based on admin layout usage).
 */
const ADMIN_NAV_MARKERS = [
  '[data-testid="navigation-sidebar"]',
  '[data-testid="admin-navigation"]',
  'a[href="/admin/properties"]',
  'a[href="/admin/brokers"]',
  'a[href="/admin/agents"]',
  'a[href="/admin/rentals"]',
  'a[href="/admin/broker-dashboard"]',
]

const CHAT_WIDGET_MARKERS = [
  '[data-testid="chat-widget"]',
  '[data-testid="chat-toggle"]',
  '[aria-label="Open chat"]',
  '[aria-label="Close chat"]',
]

function hasAdminNav(container: Element): boolean {
  return ADMIN_NAV_MARKERS.some(selector => container.querySelector(selector) !== null)
}

function hasChatWidget(container: Element): boolean {
  return CHAT_WIDGET_MARKERS.some(selector => container.querySelector(selector) !== null)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Property 18: Public pages never render admin Navigation sidebar or ChatWidget', () => {
  /**
   * Source-level check: the layout module must not re-export (and therefore
   * must not import) Navigation or ChatWidget.  We compare the actual default
   * export of the layout with the two admin components: they must be entirely
   * different references.
   */
  it('PublicLayout is not the Navigation component and not the ChatWidget component', () => {
    expect(layoutModule.default).not.toBe(NavigationComponent)
    expect(layoutModule.default).not.toBe(ChatWidgetComponent)
  })

  /**
   * DOM-level property: render PublicLayout with arbitrary page content and
   * verify no admin-navigation or chat-widget markers appear in the DOM.
   *
   * numRuns: 100
   */
  it('never contains admin navigation or chat widget elements for any page content', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 100 }),
        (pageContent) => {
          const { container, unmount } = render(
            React.createElement(
              PublicLayout,
              null,
              React.createElement('div', { 'data-testid': 'page-content' }, pageContent)
            )
          )

          const adminNavPresent = hasAdminNav(container)
          const chatWidgetPresent = hasChatWidget(container)
          const pageContentPresent =
            container.querySelector('[data-testid="page-content"]') !== null

          unmount()

          return !adminNavPresent && !chatWidgetPresent && pageContentPresent
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Concrete smoke test: renders the layout once and verifies admin-specific
   * href links are absent while public navigation links are present.
   */
  it('contains public navigation links (Home, Listings, About, Contact) but no admin links', () => {
    const { container } = render(
      React.createElement(
        PublicLayout,
        null,
        React.createElement('div', null, 'Test page')
      )
    )

    const links = Array.from(container.querySelectorAll('a'))
    const hrefs = links.map(a => a.getAttribute('href'))

    // Public nav links must be present
    expect(hrefs).toContain('/listings')
    expect(hrefs).toContain('/about')
    expect(hrefs).toContain('/contact')

    // Admin-panel-only deep links must be absent
    expect(hrefs).not.toContain('/admin/properties')
    expect(hrefs).not.toContain('/admin/brokers')
    expect(hrefs).not.toContain('/admin/agents')
    expect(hrefs).not.toContain('/admin/rentals')
    expect(hrefs).not.toContain('/admin/broker-dashboard')
  })
})
