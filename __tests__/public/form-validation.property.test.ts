import * as fc from 'fast-check'
import { validateContactNumber } from '../../lib/validation'

/**
 * Validates: Requirements 6.1
 *
 * Property 12: `validateContactNumber(S)` returns `true` iff S matches /^09\d{9}$/.
 */
describe('Property 12: Contact number validation accepts exactly /^09\\d{9}$/', () => {
  it('returns true for all valid 09XXXXXXXXX numbers', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\d{9}$/),
        (suffix) => validateContactNumber(`09${suffix}`) === true
      ),
      { numRuns: 50 }
    )
  })

  it('returns false for strings not matching /^09\\d{9}$/', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !/^09\d{9}$/.test(s)),
        (s) => validateContactNumber(s) === false
      ),
      { numRuns: 50 }
    )
  })

  it('returns false for empty string', () => {
    expect(validateContactNumber('')).toBe(false)
  })

  it('returns false for wrong prefix (08)', () => {
    fc.assert(
      fc.property(
        fc.stringMatching(/^\d{9}$/),
        (suffix) => validateContactNumber(`08${suffix}`) === false
      ),
      { numRuns: 20 }
    )
  })

  it('returns false for formatted numbers with spaces/dashes/+', () => {
    expect(validateContactNumber('0939 344 0944')).toBe(false)
    expect(validateContactNumber('0939-344-0944')).toBe(false)
    expect(validateContactNumber('+639393440944')).toBe(false)
  })
})
