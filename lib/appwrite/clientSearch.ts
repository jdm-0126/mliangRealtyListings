export function matchesLocationSearch(row: Record<string, unknown>, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  const searchableFields = [
    row.Location,
    row.Village,
    row.Title,
    row.Address,
    row['Location'],
    row['Village'],
    row['Title'],
    row['Address'],
  ]

  return searchableFields.some(value => {
    if (typeof value !== 'string') return false
    return value.toLowerCase().includes(normalizedQuery)
  })
}
