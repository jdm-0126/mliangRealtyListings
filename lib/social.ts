// lib/social.ts

export type SocialPlatform = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'viber' | 'whatsapp'

export interface SocialLinkConfig {
  platform: SocialPlatform
  url: string
  label: string
}

const ALL_PLATFORMS: SocialPlatform[] = ['facebook', 'instagram', 'tiktok', 'youtube', 'viber', 'whatsapp']

const PLATFORM_ENV_KEY: Record<SocialPlatform, string> = {
  facebook:  'NEXT_PUBLIC_SOCIAL_FACEBOOK',
  instagram: 'NEXT_PUBLIC_SOCIAL_INSTAGRAM',
  tiktok:    'NEXT_PUBLIC_SOCIAL_TIKTOK',
  youtube:   'NEXT_PUBLIC_SOCIAL_YOUTUBE',
  viber:     'NEXT_PUBLIC_SOCIAL_VIBER',
  whatsapp:  'NEXT_PUBLIC_SOCIAL_WHATSAPP',
}

/**
 * Pure helper that accepts an env map as a parameter.
 * Enables testing without module re-loading.
 * Returns only platforms whose env var value is a non-empty string.
 */
export function getConfiguredSocialLinksFromEnv(
  envMap: Record<string, string | undefined>
): SocialLinkConfig[] {
  return ALL_PLATFORMS
    .map((platform): [SocialPlatform, string | undefined] => [
      platform,
      envMap[PLATFORM_ENV_KEY[platform]],
    ])
    .filter(([, url]) => typeof url === 'string' && url.trim().length > 0)
    .map(([platform, url]) => ({
      platform,
      url: url!.trim(),
      label: platform.charAt(0).toUpperCase() + platform.slice(1),
    }))
}

/**
 * Returns only platforms whose env var is configured (non-empty string).
 * Pure function — safe to call from Server Components and unit tests.
 */
export function getConfiguredSocialLinks(): SocialLinkConfig[] {
  return getConfiguredSocialLinksFromEnv(process.env as Record<string, string | undefined>)
}
