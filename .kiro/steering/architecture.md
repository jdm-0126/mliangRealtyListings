---
inclusion: always
---

# Project Architecture

## Folder Map

```
nextMliang/
├── app/
│   ├── (admin)/               ← All admin UI (route group, requires auth)
│   │   ├── admin/             ← Admin pages: properties, rentals, agents, etc.
│   │   ├── components/        ← Admin-only UI components (AuthGuard, ThemeToggle…)
│   │   └── layout.tsx         ← Admin shell: Navigation + ChatWidget
│   ├── (public)/              ← All public-facing UI (route group, no auth)
│   │   ├── components/        ← Public-only UI components (Header, Footer, ListingCard…)
│   │   ├── listings/          ← /listings and /listings/[id]
│   │   ├── about/
│   │   ├── contact/
│   │   ├── gallery/
│   │   └── book/
│   ├── admin/login/           ← Login page (outside auth guard)
│   ├── api/                   ← API route handlers
│   ├── lib/
│   │   └── supabaseClient.js  ← THE single Supabase client — import from here everywhere
│   ├── globals.css            ← Global CSS / CSS variables
│   ├── layout.tsx             ← Root layout (fonts, analytics)
│   ├── robots.ts
│   └── sitemap.ts
│
├── components/                ← Shared admin components (used across multiple admin pages)
│   ├── ui/                    ← Primitive UI: Button, Card, Input, Badge…
│   ├── PropertyCard.tsx       ← Admin property card (edit/delete/feature)
│   ├── PropertyDialog.tsx     ← Add/edit property modal
│   ├── AgentManagement.tsx    ← Agent CRUD table
│   ├── AgentDialog.tsx        ← Add/edit agent modal
│   ├── AdminFAQPanel.tsx
│   ├── ChatWidget.tsx         ← AI assistant sidebar (admin layout)
│   ├── FeaturedToggle.tsx
│   ├── Navigation.tsx         ← Admin sidebar nav
│   └── QuickAddProperty.tsx
│
├── lib/                       ← Pure logic, no JSX, no 'use client'
│   ├── listings/
│   │   └── publicListings.ts  ← Supabase fetch + mapping for public listing pages
│   ├── seo/                   ← JSON-LD, metadata helpers
│   ├── supabase/
│   │   └── browserTenantClient.ts  ← Tenant-scoped client for admin writes
│   ├── theme/                 ← Brand colour helpers
│   ├── types/
│   │   └── public.ts          ← Shared TypeScript interfaces (PublicListing, TenantSettings…)
│   ├── utils/
│   │   └── listings.ts        ← Pure listing selection helpers (used in tests)
│   ├── tenant.ts              ← 'use client' — useTenantSettings() hook only
│   ├── tenantServer.ts        ← Server-only — getTenantSettingsServer()
│   ├── validation.ts
│   ├── social.ts
│   ├── maintenanceMode.ts
│   ├── websiteContent.ts
│   └── websiteContentSections.ts
│
├── supabase/migrations/       ← Ordered SQL migrations (run via Supabase CLI)
├── __tests__/                 ← Jest tests mirroring src structure
├── public/                    ← Static assets (manifest, icons, OG image)
└── next.config.ts             ← Redirects, headers, ISR, image domains
```

## Rules

### State management
- **No Redux.** Server components fetch data and pass via props. Client components use
  `useState`/`useReducer` for local UI state. `useMemo` only where filtering/sorting is
  computationally significant (e.g. `ListingsClientWrapper`).
- Cross-component state that truly needs sharing: React Context scoped to the smallest
  subtree that needs it. There is currently none required.

### Supabase client
- **One client:** `app/lib/supabaseClient.js` — import as `import { supabase } from '@/app/lib/supabaseClient'`.
- `lib/supabase/browserTenantClient.ts` wraps the same client with tenant scoping for
  admin write operations.
- `utils/supabase/` was legacy — deleted.

### Server vs Client split
- `lib/tenantServer.ts` → Server Components only (`getTenantSettingsServer`)
- `lib/tenant.ts` → Client Components only (`useTenantSettings` hook)
- Never import the client hook in a Server Component; never import tenantServer in a
  'use client' file.

### Where components live
| Type | Location |
|---|---|
| Public UI (header, listing card, gallery) | `app/(public)/components/` |
| Admin UI shared across pages | `components/` |
| Primitive UI atoms (Button, Input, Card) | `components/ui/` |
| Admin page-specific components | `app/(admin)/admin/<page>/` |

### ISR / caching
- Public listing pages: `revalidate = 60` (rebuild at most once per minute)
- Static content pages (about, contact, book): `revalidate = 3600`
- Admin pages: `force-dynamic` (always fresh, auth-gated anyway)

### Dead code policy
Files that are exported but imported nowhere should be deleted, not kept "just in case".
Git history is the backup.
