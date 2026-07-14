import { SortKey } from '../lib/shared/sorting'


export function sortItems<T extends {
  title?: string | null
  description?: string | null
  created_at?: string
}>(
  items: T[],
  key: SortKey
) {
  return [...items].sort((a, b) => {
    switch (key) {

      case "oldest":
        return (
          new Date(a.created_at ?? "").getTime() -
          new Date(b.created_at ?? "").getTime()
        )

      case "title_asc":
        return (a.title ?? "").localeCompare(b.title ?? "")

      case "title_desc":
        return (b.title ?? "").localeCompare(a.title ?? "")

      case "description_asc":
        return (a.description ?? "").localeCompare(b.description ?? "")

      case "description_desc":
        return (b.description ?? "").localeCompare(a.description ?? "")

      default:
        return (
          new Date(b.created_at ?? "").getTime() -
          new Date(a.created_at ?? "").getTime()
        )
    }
  })
}