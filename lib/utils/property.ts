// PropertyService.ts or utils/property.ts

import { Property } from '@/lib/shared/types/public'

export function getChangedFields(
  original: Property,
  updated: Property
): string[] {
  const changes: string[] = []

  const keys = Object.keys(updated) as (keyof Property)[]

  for (const key of keys) {
    const before = original[key]
    const after = updated[key]

    // compare arrays safely
    if (Array.isArray(before) || Array.isArray(after)) {
      if (JSON.stringify(before) !== JSON.stringify(after)) {
        changes.push(String(key))
      }
      continue
    }

    if (before !== after) {
      changes.push(String(key))
    }
  }

  return changes
}