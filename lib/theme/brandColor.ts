import { readWebsiteContentValue, writeWebsiteContent } from '@/lib/websiteContent'

export const BRAND_COLOR_STORAGE_KEY = 'siteAccentColor'
export const BRAND_COLOR_SETTING_KEY = 'public_brand_color'
export const DEFAULT_BRAND_COLOR = '#703BF7'
export const DEFAULT_BRAND_COLOR_HOVER = '#5a2fd0'

export function isValidBrandColor(value: string): boolean {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
}

function normalizeHex(hex: string): string {
  const value = hex.trim().toLowerCase()
  if (value.startsWith('#')) {
    const withoutHash = value.slice(1)
    if (withoutHash.length === 3) {
      return `#${withoutHash.split('').map(ch => ch + ch).join('')}`
    }
    return `#${withoutHash}`
  }
  return value
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex)
  const value = normalized.slice(1)
  const intValue = parseInt(value, 16)
  return [(intValue >> 16) & 255, (intValue >> 8) & 255, intValue & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function shadeHex(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(
    Math.round(r * (1 + amount)),
    Math.round(g * (1 + amount)),
    Math.round(b * (1 + amount))
  )
}

export function applyBrandColor(hex: string) {
  if (typeof document === 'undefined') return

  const normalized = normalizeHex(hex)
  const safeHex = isValidBrandColor(normalized) ? normalized : DEFAULT_BRAND_COLOR
  document.documentElement.style.setProperty('--est-purple', safeHex)
  document.documentElement.style.setProperty('--est-purple-h', shadeHex(safeHex, -0.12))
}

export function readStoredBrandColor(): string | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = window.localStorage.getItem(BRAND_COLOR_STORAGE_KEY)
    return stored && isValidBrandColor(stored) ? stored : null
  } catch {
    return null
  }
}

async function readBrandColorFromDatabase(): Promise<string | null> {
  const value = await readWebsiteContentValue<string>(BRAND_COLOR_SETTING_KEY)
  return value && isValidBrandColor(value) ? value : null
}

export async function hydrateBrandColor(): Promise<string> {
  const stored = readStoredBrandColor()
  const databaseColor = await readBrandColorFromDatabase()
  const resolved = databaseColor ?? stored ?? DEFAULT_BRAND_COLOR

  applyBrandColor(resolved)

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(BRAND_COLOR_STORAGE_KEY, resolved)
    } catch {
      // ignore storage errors
    }
  }

  return resolved
}

export async function persistBrandColor(hex: string): Promise<string> {
  const normalized = normalizeHex(hex)
  const safeHex = isValidBrandColor(normalized) ? normalized : DEFAULT_BRAND_COLOR
  applyBrandColor(safeHex)

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(BRAND_COLOR_STORAGE_KEY, safeHex)
    } catch {
      // ignore storage errors
    }
  }

  if (typeof window !== 'undefined') {
    try {
      await writeWebsiteContent(BRAND_COLOR_SETTING_KEY, safeHex, 'text')
    } catch {
      // Ignore database write issues and keep the local fallback.
    }
  }

  return safeHex
}
