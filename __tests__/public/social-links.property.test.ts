/**
 * Property 4: Social media icons appear if and only if their env var is configured
 * Validates: Requirements 10.1, 10.2, 2.6
 */
import * as fc from 'fast-check'
import { getConfiguredSocialLinksFromEnv, SocialPlatform } from '../../lib/social'

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
