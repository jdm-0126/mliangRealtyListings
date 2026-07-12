describe('client-side location search helper', () => {
  it('matches against location, village, title, and address fields', () => {
    const { matchesLocationSearch } = require('../../lib/appwrite/clientSearch')

    const row = {
      Location: 'San Fernando',
      Village: 'Dolores',
      Title: 'Luxury House',
      Address: 'Pampanga',
    }

    expect(matchesLocationSearch(row, 'dolores')).toBe(true)
    expect(matchesLocationSearch(row, 'pampanga')).toBe(true)
    expect(matchesLocationSearch(row, 'luxury')).toBe(true)
    expect(matchesLocationSearch(row, 'clark')).toBe(false)
  })
})
