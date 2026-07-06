/**
 * Property 4: Social media icons appear if and only if their env var is configured
 * Validates: Requirements 10.1, 10.2, 2.6
 *
 * Property 5: Social links always open in a new tab with security attributes
 * Validates: Requirements 10.3, 2.6, 8.2
 */
import * as fc from 'fast-check'
import { getConfiguredSocialLinksFromEnv, SocialPlatform } from '../../lib/social'

// ---------------------------------------------------------------------------
// Property 5 imports – render SocialLinks component via jsdom
// ---------------------------------------------------------------------------
import React from 'react'
import { render } from '@testing-library/react'

jest.mock('@/lib/social', () => ({
  getConfiguredSocialLinks: jest.fn(),
  getConfiguredSocialLinksFromEnv: jest.requireActual('@/lib/social').getConfiguredSocialLinksFromEnv,
}))
// eslint-disable-next-line import/first
import { getConfiguredSocialLinks } from '@/lib/social'
// eslint-disable-next-line import/first
import SocialLinks from '../../app/(public)/components/SocialLinks'

const ALL_PLATFORMS: SocialPlatform[] = [
  'facebook',
  'instagram',
  'tiktok',
  'youtube',
  'viber',
  'whatsapp',
]

describe('Property 4: Social media icons appear iff env var is configured', () => {
  it('returns exactly the configured platforms for any subset of env vars', () => {
    fc.assert(
      fc.property(
        // Generate a record where each platform is either a non-empty URL or undefined/empty
        fc.record(
          Object.fromEntries(
            ALL_PLATFORMS.map(p => [
              p,
              fc.oneof(
                fc.constant(undefined),
                fc.constant(''),
                fc.webUrl()
              )
            ])
          )
        ) as fc.Arbitrary<Record<SocialPlatform, string | undefined>>,
        (platformValues) => {
          // Build env map using NEXT_PUBLIC_SOCIAL_ prefix keys
          const envMap: Record<string, string | undefined> = {}
          for (const [platform, value] of Object.entries(platformValues)) {
            envMap[`NEXT_PUBLIC_SOCIAL_${platform.toUpperCase()}`] = value as string | undefined
          }

          const result = getConfiguredSocialLinksFromEnv(envMap)
          const resultPlatforms = new Set(result.map(l => l.platform))

          // Assert: result contains exactly the platforms with non-empty URLs
          for (const platform of ALL_PLATFORMS) {
            const url = platformValues[platform]
            const shouldBePresent = typeof url === 'string' && url.trim().length > 0

            if (shouldBePresent) {
              // Platform with non-empty URL must appear
              if (!resultPlatforms.has(platform)) return false
              // The URL stored must be the trimmed version
              const link = result.find(l => l.platform === platform)!
              if (link.url !== url!.trim()) return false
              // The label must be the platform name with first letter capitalised
              if (link.label !== platform.charAt(0).toUpperCase() + platform.slice(1)) return false
            } else {
              // Platform with unset/empty URL must NOT appear
              if (resultPlatforms.has(platform)) return false
            }
          }
          return true
        }
      ),
      { numRuns: 200 }
    )
  })
})

// ---------------------------------------------------------------------------
// Property 5: Social links always open in a new tab with security attributes
// ---------------------------------------------------------------------------

const platforms = ['facebook', 'instagram', 'tiktok', 'youtube', 'viber', 'whatsapp'] as const
type Platform = typeof platforms[number]

const safeUrls = fc.constantFrom(
  'https://facebook.com',
  'https://instagram.com',
  'https://tiktok.com',
  'https://youtube.com',
  'https://viber.com',
  'https://whatsapp.com'
)

describe('Property 5: Social links always open in a new tab with security attributes', () => {
  /**
   * Validates: Requirements 10.3, 2.6, 8.2
   *
   * For any non-empty subset of social platform links returned by
   * getConfiguredSocialLinks(), every rendered <a> element MUST have:
   *   - target="_blank"
   *   - rel containing "noopener"
   *   - rel containing "noreferrer"
   */
  it('every rendered anchor has target="_blank" and rel with noopener and noreferrer', () => {
    fc.assert(
      fc.property(
        fc.uniqueArray(
          fc.record({
            platform: fc.constantFrom(...platforms) as fc.Arbitrary<Platform>,
            url: safeUrls,
            label: fc.string({ minLength: 1 }),
          }),
          { minLength: 1, maxLength: 6, selector: (item) => item.platform }
        ),
        (links) => {
          ;(getConfiguredSocialLinks as jest.Mock).mockReturnValue(links)
          const { container } = render(React.createElement(SocialLinks))
          const anchors = container.querySelectorAll('a')
          expect(anchors.length).toBe(links.length)
          anchors.forEach((anchor) => {
            expect(anchor.getAttribute('target')).toBe('_blank')
            const rel = anchor.getAttribute('rel') ?? ''
            expect(rel).toContain('noopener')
            expect(rel).toContain('noreferrer')
          })
        }
      ),
      { numRuns: 200 }
    )
  })

  it('renders nothing when no platforms are configured', () => {
    ;(getConfiguredSocialLinks as jest.Mock).mockReturnValue([])
    const { container } = render(React.createElement(SocialLinks))
    expect(container.querySelectorAll('a').length).toBe(0)
  })
})
