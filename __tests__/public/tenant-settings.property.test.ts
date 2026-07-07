/**
 * Property 11: About/Contact pages display tenantSettings values with correct fallback
 *
 * For any partial or complete TenantSettings stored in localStorage:
 *   - Present fields SHALL show the stored value (not the default)
 *   - Absent fields SHALL show the TENANT_DEFAULTS value
 *   - No field SHALL be undefined or null after merging
 *
 * **Validates: Requirements 5.2, 6.8**
 */

import * as fc from 'fast-check'
import { renderHook, act } from '@testing-library/react'
import { useTenantSettings } from '../../lib/tenant'
import { TENANT_DEFAULTS, TenantSettings } from '../../lib/types/public'

// All keys of TenantSettings
const SETTINGS_KEYS: (keyof TenantSettings)[] = [
  'businessName',
  'brokerName',
  'brokerTitle',
  'prcNumber',
  'officeAddress',
  'contactNumber',
  'emailAddress',
]

// Generator for a single non-empty string value (avoids empty-string ambiguity with defaults)
const nonEmptyString = fc.string({ minLength: 1, maxLength: 80 })

// Generator for a partial TenantSettings — random subset of keys with arbitrary values
const arbitraryPartialSettings: fc.Arbitrary<Partial<TenantSettings>> = fc
  .subarray(SETTINGS_KEYS, { minLength: 0, maxLength: SETTINGS_KEYS.length })
  .chain((presentKeys) => {
    if (presentKeys.length === 0) return fc.constant({})
    const fieldArbitraries: Record<string, fc.Arbitrary<string>> = {}
    for (const key of presentKeys) {
      fieldArbitraries[key] = nonEmptyString
    }
    return fc.record(fieldArbitraries) as fc.Arbitrary<Partial<TenantSettings>>
  })

// Generator for a complete TenantSettings
const arbitraryCompleteSettings: fc.Arbitrary<TenantSettings> = fc.record({
  businessName:  nonEmptyString,
  brokerName:    nonEmptyString,
  brokerTitle:   nonEmptyString,
  prcNumber:     nonEmptyString,
  officeAddress: nonEmptyString,
  contactNumber: nonEmptyString,
  emailAddress:  nonEmptyString,
})

/** Stubs localStorage.getItem to return the JSON of the given partial object */
function stubLocalStorage(partial: Partial<TenantSettings>): jest.SpyInstance {
  return jest
    .spyOn(Storage.prototype, 'getItem')
    .mockImplementation((key: string) => {
      if (key === 'tenantSettings') return JSON.stringify(partial)
      return null
    })
}

// ─────────────────────────────────────────────────────────────────────────────

describe('Property 11: useTenantSettings merges localStorage with TENANT_DEFAULTS', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  // ── Sub-property A: present fields use stored values ──────────────────────
  it('present fields always show the stored value (not the default)', () => {
    fc.assert(
      fc.property(arbitraryPartialSettings, (partial) => {
        const presentKeys = Object.keys(partial) as (keyof TenantSettings)[]
        if (presentKeys.length === 0) return true // vacuously true — nothing is present

        stubLocalStorage(partial)

        const { result } = renderHook(() => useTenantSettings())

        // Flush the useEffect that reads localStorage
        act(() => {})

        for (const key of presentKeys) {
          if ((partial as Record<string, string>)[key] !== result.current[key]) {
            return false
          }
        }
        return true
      }),
      { numRuns: 200 }
    )
  })

  // ── Sub-property B: absent fields fall back to TENANT_DEFAULTS ────────────
  it('absent fields always show the TENANT_DEFAULTS value', () => {
    fc.assert(
      fc.property(arbitraryPartialSettings, (partial) => {
        const presentKeys = new Set(Object.keys(partial))
        const absentKeys = SETTINGS_KEYS.filter((k) => !presentKeys.has(k))
        if (absentKeys.length === 0) return true // all keys present — nothing is absent

        stubLocalStorage(partial)

        const { result } = renderHook(() => useTenantSettings())
        act(() => {})

        for (const key of absentKeys) {
          if (result.current[key] !== TENANT_DEFAULTS[key]) {
            return false
          }
        }
        return true
      }),
      { numRuns: 200 }
    )
  })

  // ── Sub-property C: no field is undefined or null ──────────────────────────
  it('no field is ever undefined or null after merge', () => {
    fc.assert(
      fc.property(arbitraryPartialSettings, (partial) => {
        stubLocalStorage(partial)

        const { result } = renderHook(() => useTenantSettings())
        act(() => {})

        return SETTINGS_KEYS.every(
          (key) => result.current[key] !== undefined && result.current[key] !== null
        )
      }),
      { numRuns: 200 }
    )
  })

  // ── Sub-property D: complete settings override all defaults ───────────────
  it('complete settings replace all TENANT_DEFAULTS with stored values', () => {
    fc.assert(
      fc.property(arbitraryCompleteSettings, (complete) => {
        stubLocalStorage(complete)

        const { result } = renderHook(() => useTenantSettings())
        act(() => {})

        return SETTINGS_KEYS.every((key) => result.current[key] === complete[key])
      }),
      { numRuns: 200 }
    )
  })

  // ── Sub-property E: empty object → pure TENANT_DEFAULTS ───────────────────
  it('empty localStorage object returns exact TENANT_DEFAULTS', () => {
    stubLocalStorage({})

    const { result } = renderHook(() => useTenantSettings())
    act(() => {})

    for (const key of SETTINGS_KEYS) {
      expect(result.current[key]).toBe(TENANT_DEFAULTS[key])
    }
  })

  // ── Sub-property F: localStorage unavailable → pure TENANT_DEFAULTS ───────
  it('when localStorage.getItem throws, returns exact TENANT_DEFAULTS', () => {
    jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation(() => {
        throw new Error('localStorage blocked')
      })

    const { result } = renderHook(() => useTenantSettings())
    act(() => {})

    for (const key of SETTINGS_KEYS) {
      expect(result.current[key]).toBe(TENANT_DEFAULTS[key])
    }
  })

  // ── Sub-property G: invalid JSON → pure TENANT_DEFAULTS ───────────────────
  it('when localStorage contains invalid JSON, returns exact TENANT_DEFAULTS', () => {
    jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation((key: string) => {
        if (key === 'tenantSettings') return '{ this is: not valid json'
        return null
      })

    const { result } = renderHook(() => useTenantSettings())
    act(() => {})

    for (const key of SETTINGS_KEYS) {
      expect(result.current[key]).toBe(TENANT_DEFAULTS[key])
    }
  })

  // ── Sub-property H: null localStorage value → pure TENANT_DEFAULTS ──────
  // (localStorage.getItem returns null when key is not set)
  it('when localStorage returns null (key not set), returns exact TENANT_DEFAULTS', () => {
    jest
      .spyOn(Storage.prototype, 'getItem')
      .mockReturnValue(null)

    const { result } = renderHook(() => useTenantSettings())
    act(() => {})

    for (const key of SETTINGS_KEYS) {
      expect(result.current[key]).toBe(TENANT_DEFAULTS[key])
    }
  })
})
