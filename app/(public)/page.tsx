// app/(public)/page.tsx
// The / → /listings redirect is handled at the edge via next.config.ts `redirects()`.
// This file intentionally left as a no-op fallback — it should never be reached.
export default function HomePage() {
  return null
}
