// lib/social.ts

export type SocialPlatform = 'facebook' | 'messenger' | 'instagram' | 'tiktok' | 'youtube' | 'x' | 'linkedin' | 'whatsapp' | 'viber'

export interface SocialLinkConfig {
  platform: SocialPlatform
  url: string
  label: string
}

const ALL_PLATFORMS: SocialPlatform[] = ['facebook', 'messenger', 'instagram', 'tiktok', 'youtube', 'x', 'linkedin', 'whatsapp', 'viber']

const PLATFORM_ENV_KEY: Record<SocialPlatform, string> = {
  facebook:  'NEXT_PUBLIC_SOCIAL_FACEBOOK',
  messenger: 'NEXT_PUBLIC_SOCIAL_MESSENGER',
  instagram: 'NEXT_PUBLIC_SOCIAL_INSTAGRAM',
  tiktok:    'NEXT_PUBLIC_SOCIAL_TIKTOK',
  youtube:   'NEXT_PUBLIC_SOCIAL_YOUTUBE',
  x:         'NEXT_PUBLIC_SOCIAL_X',
  linkedin:  'NEXT_PUBLIC_SOCIAL_LINKEDIN',
  whatsapp:  'NEXT_PUBLIC_SOCIAL_WHATSAPP',
  viber:     'NEXT_PUBLIC_SOCIAL_VIBER',
}

// Key inside the tenantSettings localStorage object where social links are stored
export const SOCIAL_SETTINGS_KEY = 'tenantSettings'

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook:  'Facebook',
  messenger: 'Messenger',
  instagram: 'Instagram',
  tiktok:    'TikTok',
  youtube:   'YouTube',
  x:         'X (Twitter)',
  linkedin:  'LinkedIn',
  whatsapp:  'WhatsApp',
  viber:     'Viber',
}

/** The field name used inside tenantSettings for each platform */
export const PLATFORM_SETTINGS_FIELD: Record<SocialPlatform, string> = {
  facebook:  'socialFacebook',
  messenger: 'socialMessenger',
  instagram: 'socialInstagram',
  tiktok:    'socialTiktok',
  youtube:   'socialYoutube',
  x:         'socialX',
  linkedin:  'socialLinkedin',
  whatsapp:  'socialWhatsapp',
  viber:     'socialViber',
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
      label: PLATFORM_LABELS[platform],
    }))
}

/**
 * Returns only platforms whose env var is configured (non-empty string).
 * Pure function — safe to call from Server Components and unit tests.
 */
export function getConfiguredSocialLinks(): SocialLinkConfig[] {
  return getConfiguredSocialLinksFromEnv(process.env as Record<string, string | undefined>)
}

/**
 * Normalises a raw phone number string to E.164 format without the leading +.
 * Handles Philippine numbers starting with 09 or 639.
 */
function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  // 09XXXXXXXXX → 639XXXXXXXXX
  if (digits.startsWith('0')) return '63' + digits.slice(1)
  return digits
}

/**
 * Returns social links from localStorage tenantSettings (client-side only).
 * Falls back to an empty array on server or when localStorage is unavailable.
 * WhatsApp and Viber values are stored as phone numbers and converted to deep links here.
 */
export function getSocialLinksFromStorage(): SocialLinkConfig[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SOCIAL_SETTINGS_KEY)
    if (!raw) return []
    const settings = JSON.parse(raw)
    return ALL_PLATFORMS
      .map((platform): [SocialPlatform, string | undefined] => {
        const stored = settings[PLATFORM_SETTINGS_FIELD[platform]]
        if (!stored || typeof stored !== 'string' || !stored.trim()) return [platform, undefined]
        const val = stored.trim()

        // Build proper deep links for messaging platforms
        if (platform === 'whatsapp') {
          const phone = normalisePhone(val)
          return [platform, `https://wa.me/${phone}`]
        }
        if (platform === 'viber') {
          const phone = normalisePhone(val)
          return [platform, `viber://contact?number=%2B${phone}`]
        }

        return [platform, val]
      })
      .filter(([, url]) => typeof url === 'string' && url!.trim().length > 0)
      .map(([platform, url]) => ({
        platform,
        url: url!.trim(),
        label: PLATFORM_LABELS[platform],
      }))
  } catch {
    return []
  }
}
