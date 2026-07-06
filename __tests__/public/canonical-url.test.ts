// __tests__/public/canonical-url.test.ts
// Unit tests for buildCanonicalUrl (Requirements: 7.3)

import { buildCanonicalUrl } from '../../lib/seo/jsonld'

describe('buildCanonicalUrl', () => {
  it('returns a valid absolute URL when host has no trailing slash', () => {
    expect(buildCanonicalUrl('https://realtyprov1.com', '/listings'))
      .toBe('https://realtyprov1.com/listings')
  })

  it('strips trailing slash from host to avoid double-slash', () => {
    expect(buildCanonicalUrl('https://realtyprov1.com/', '/listings'))
      .toBe('https://realtyprov1.com/listings')
  })

  it('adds leading slash to path when missing', () => {
    expect(buildCanonicalUrl('https://realtyprov1.com', 'listings'))
      .toBe('https://realtyprov1.com/listings')
  })

  it('handles root path correctly', () => {
    expect(buildCanonicalUrl('https://realtyprov1.com', '/'))
      .toBe('https://realtyprov1.com/')
  })

  it('handles host with trailing slash and path without leading slash', () => {
    expect(buildCanonicalUrl('https://realtyprov1.com/', 'about'))
      .toBe('https://realtyprov1.com/about')
  })

  it('handles nested paths', () => {
    expect(buildCanonicalUrl('https://realtyprov1.com', '/listings/42'))
      .toBe('https://realtyprov1.com/listings/42')
  })

  it('handles multiple trailing slashes on host', () => {
    expect(buildCanonicalUrl('https://realtyprov1.com///', '/contact'))
      .toBe('https://realtyprov1.com/contact')
  })
})
