# Implementation Plan: Public Website

## Overview

This plan converts the M. Liang Realty internal-only Next.js app into a dual-section application: a public-facing website for visitors and a protected admin panel for internal users. The implementation follows the Next.js 14 App Router route group architecture defined in the design document.

Work is organized in layers: shared foundation first (types, utilities, SEO helpers), then layout scaffolding (route groups, Public_Layout, Admin_Layout + AuthGuard), then individual public pages, and finally SEO infrastructure and property-based tests.

## Tasks

- [x] 1. Install dependencies and create shared type definitions
  - [x] 1.1 Install fast-check for property-based testing
    - Run `npm install --save-dev fast-check@3.22.0`
    - Verify it appears in `devDependencies` in `package.json`
    - _Requirements: Testing strategy (design)_

  - [x] 1.2 Create shared TypeScript interfaces and constants
    - Create `lib/types/public.ts` with `PublicListing`, `TenantSettings`, `TENANT_DEFAULTS`, `LeadInsert`, and `SocialConfig` interfaces exactly as specified in the design
    - _Requirements: 2.1, 3.2, 5.1, 6.1, 10.1_

  - [x] 1.3 Create tenant settings helpers
    - Create `lib/tenant.ts` with `getTenantSettingsServer()` (returns `TENANT_DEFAULTS`) and `useTenantSettings()` (client hook that reads `localStorage` with `TENANT_DEFAULTS` merge fallback)
    - _Requirements: 5.2, 6.8_

  - [x] 1.4 Create social media configuration utility
    - Create `lib/social.ts` with `getConfiguredSocialLinks()` that reads the six `NEXT_PUBLIC_SOCIAL_*` env vars and returns only non-empty entries
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 1.5 Write property test for social links configuration (Property 4)
    - **Property 4: Social media icons appear if and only if their env var is configured**
    - **Validates: Requirements 10.1, 10.2, 2.6**
    - Create `__tests__/public/social-links.property.test.ts`; use `fast-check` to generate arbitrary subsets of env vars set/unset and assert `getConfiguredSocialLinks()` returns exactly the configured platforms; `numRuns: 200`

- [ ] 2. Create SEO utilities and JSON-LD helpers
  - [ ] 2.1 Create JSON-LD builder functions
    - Create `lib/seo/jsonld.ts` with `buildLocalBusinessJsonLd(settings)` returning `RealEstateAgent` schema and `buildRealEstateListingJsonLd(listing)` returning `RealEstateListing` schema
    - _Requirements: 7.4, 4.5_

  - [ ] 2.2 Create canonical URL builder utility
    - Add `buildCanonicalUrl(host, path)` to `lib/seo/jsonld.ts` (or a dedicated `lib/seo/utils.ts`) that produces a valid absolute URL with no double-slashes
    - _Requirements: 7.3_

  - [ ] 2.3 Write property tests for SEO utilities (Properties 10, 16, 17)
    - **Property 10: Detail page title format is always "{Type} in {Location} – M. Liang Realty"**
    - **Property 16: Canonical URL builder always produces a valid absolute URL**
    - **Property 17: LocalBusiness JSON-LD always contains all required schema fields**
    - **Validates: Requirements 4.5, 7.3, 7.4**
    - Create `__tests__/public/seo-utils.property.test.ts`; use `fast-check` arbitrary strings for type/location/host/path; assert title format, URL pattern, and JSON-LD required fields; `numRuns: 200`

- [ ] 3. Restructure root layout and create route group scaffolding
  - [ ] 3.1 Strip admin components from root layout
    - Edit `app/layout.tsx` to remove `<Navigation />` and `<ChatWidget />` — keep only fonts, Analytics, `globals.css`, and `<html lang="en">`
    - _Requirements: 1.1, 1.2, 7.5, 8.5_

  - [ ] 3.2 Create the `(public)` route group directory structure
    - Create the directory tree:
      ```
      app/(public)/layout.tsx
      app/(public)/page.tsx
      app/(public)/listings/page.tsx
      app/(public)/listings/[id]/page.tsx
      app/(public)/about/page.tsx
      app/(public)/contact/page.tsx
      ```
    - Each page file should export a minimal placeholder component for now (replaced in later tasks)
    - _Requirements: 1.1, 1.4_

  - [ ] 3.3 Create the `(admin)` route group directory structure and move existing pages
    - Create `app/(admin)/layout.tsx` (placeholder for now)
    - Move all existing admin page files into `app/(admin)/admin/`:
      - `app/dashboard/page.tsx` → `app/(admin)/admin/page.tsx`
      - `app/broker-dashboard/page.tsx` → `app/(admin)/admin/broker-dashboard/page.tsx`
      - `app/properties/page.tsx` and `PropertiesContent.tsx` → `app/(admin)/admin/properties/`
      - `app/rentals/page.tsx` and `RentalsContent.tsx` → `app/(admin)/admin/rentals/`
      - `app/brokers/page.tsx` → `app/(admin)/admin/brokers/page.tsx`
      - `app/agents/page.tsx` → `app/(admin)/admin/agents/page.tsx`
      - `app/agent-profile/page.tsx` → `app/(admin)/admin/agent-profile/page.tsx`
      - `app/settings/page.tsx` → `app/(admin)/admin/settings/page.tsx`
      - `app/facebook-posts/` → `app/(admin)/admin/facebook-posts/`
      - `app/upload/page.tsx` → `app/(admin)/admin/upload/page.tsx`
      - `app/editor/page.tsx` → `app/(admin)/admin/editor/page.tsx`
    - Update all internal `href` references in Navigation.tsx to `/admin/**` prefixed paths
    - _Requirements: 1.2, 9.1, 9.4_

- [ ] 4. Implement AuthGuard and Admin Layout
  - [ ] 4.1 Create the AuthGuard client component
    - Create `app/(admin)/components/AuthGuard.tsx` with the three-state logic (`loading` → spinner, `unauthenticated` → `router.push('/')`, `authenticated` → `{children}`)
    - Wrap `sessionStorage.getItem` in `try/catch` to handle blocked storage
    - _Requirements: 1.3, 9.2, 9.3, 9.6_

  - [ ] 4.2 Create the Admin Layout
    - Create `app/(admin)/layout.tsx` wrapping children with `AuthGuard`, `Navigation` sidebar, and `ChatWidget`
    - Apply `lg:pl-64` offset to main content area
    - _Requirements: 1.2, 9.1, 9.4_

  - [ ] 4.3 Write property test for AuthGuard (Property 1)
    - **Property 1: Auth_Guard always redirects unauthenticated users from admin routes**
    - **Validates: Requirements 1.3, 9.2, 9.3**
    - Create `__tests__/public/auth-guard.property.test.ts`; use `fast-check` to generate arbitrary non-`"authenticated"` sessionStorage values (null, undefined, wrong strings, exception-throwing mock) and assert `router.push('/')` is called and protected content is not in the DOM; `numRuns: 100`

  - [ ] 4.4 Update Settings page logout to redirect to `/`
    - Locate the logout handler in `app/(admin)/admin/settings/page.tsx`; ensure it clears both `brokerAdminAuth` and `userEmail` from `sessionStorage` and calls `router.push('/')`
    - _Requirements: 9.5_

- [ ] 5. Checkpoint — verify route group structure compiles
  - Ensure all moved admin pages import correctly from their new paths, the app builds without TypeScript or import errors, and navigating to `/admin` triggers the AuthGuard loading state (manually or via `npm run build`)

- [ ] 6. Build Public Layout components
  - [ ] 6.1 Create the SocialLinks server component
    - Create `app/(public)/components/SocialLinks.tsx`; call `getConfiguredSocialLinks()` and render icon anchors with `target="_blank" rel="noopener noreferrer"`; hide any platform whose env var is unset or empty
    - _Requirements: 2.6, 8.2, 10.1, 10.2, 10.3_

  - [ ] 6.2 Write property test for SocialLinks rendering (Property 5)
    - **Property 5: Social links always open in a new tab with security attributes**
    - **Validates: Requirements 10.3, 2.6, 8.2**
    - Extend `__tests__/public/social-links.property.test.ts`; render `SocialLinks` with arbitrary non-empty URL sets; assert every rendered anchor has `target="_blank"` and `rel` containing both `"noopener"` and `"noreferrer"`; `numRuns: 200`

  - [ ] 6.3 Create the PublicHeader client component
    - Create `app/(public)/components/PublicHeader.tsx` with sticky header, desktop nav links (Home, Listings, About, Contact), Contact Us button, and mobile hamburger toggle with drawer
    - Use `usePathname()` for active link styling
    - Collapse drawer on link click or second hamburger press
    - _Requirements: 8.1, 8.4_

  - [ ] 6.4 Create the PublicFooter server component
    - Create `app/(public)/components/PublicFooter.tsx` with brand block, `SocialLinks`, contact block (address, phone, email, PRC), Admin Login link (→ `/admin`), and copyright with `new Date().getFullYear()`
    - Accept `settings: TenantSettings` prop from server layout
    - _Requirements: 8.2, 8.3_

  - [ ] 6.5 Create the Public Layout
    - Create `app/(public)/layout.tsx` as a server component that calls `getTenantSettingsServer()`, renders `<PublicHeader>` and `<PublicFooter>` wrapping `{children}`
    - Confirm no `Navigation` or `ChatWidget` is included
    - _Requirements: 1.1, 8.1, 8.2, 8.5_

  - [ ] 6.6 Write property test for public pages containing no admin components (Property 18)
    - **Property 18: Public pages never render the admin Navigation sidebar or ChatWidget**
    - **Validates: Requirements 1.1, 8.5**
    - Create `__tests__/public/public-layout.property.test.ts`; render the Public Layout with arbitrary page content and assert the DOM contains no elements from Navigation or ChatWidget; `numRuns: 100`

- [ ] 7. Build the JsonLd component and create the `og-image.jpg` static asset
  - [ ] 7.1 Create the JsonLd server component
    - Create `app/(public)/components/JsonLd.tsx` that renders `<script type="application/ld+json" dangerouslySetInnerHTML=...>`
    - _Requirements: 7.4, 4.5_

  - [ ] 7.2 Add a static OG image placeholder
    - Place an `og-image.jpg` (1200×630) in the `public/` directory for use as the default Open Graph image
    - _Requirements: 2.7_

- [ ] 8. Implement the Public Homepage (`/`)
  - [ ] 8.1 Create the homepage server component with Hero section
    - Implement `app/(public)/page.tsx` as a server component
    - Render Hero section with brokerage name, tagline, CTA buttons linking to `/listings` and `/contact`
    - Export `metadata` object with title (50–70 chars), description (150–160 chars), Open Graph, Twitter Card, and canonical tags
    - Include `<JsonLd>` with `buildLocalBusinessJsonLd(settings)` output
    - _Requirements: 2.1, 2.7, 7.4_

  - [ ] 8.2 Add Featured Listings section to homepage
    - In `app/(public)/page.tsx`, call Supabase with `.ilike('Status', 'active').order('Property ID', { ascending: false }).limit(6)`
    - Pass results to `<ListingCard>` components in a grid
    - Render "No listings available at the moment" placeholder when data is empty
    - Render "Unable to load listings at this time" when the query returns an error
    - _Requirements: 2.2, 2.3, 2.4_

  - [ ] 8.3 Write property test for featured listings invariant (Property 3)
    - **Property 3: Featured listings obey the "up to 6, newest first" invariant**
    - **Validates: Requirements 2.2, 2.3**
    - Create `__tests__/public/home-listings.property.test.ts`; use `fast-check` to generate arbitrary arrays of active listing objects; assert exactly `Math.min(N, 6)` cards are displayed with the highest-ID listings; when N=0 assert placeholder renders; `numRuns: 200`

  - [ ] 8.4 Add Services section to homepage
    - Render three service content blocks (property sales, rental properties, lot sales) each with heading and paragraph
    - _Requirements: 2.5_

  - [ ] 8.5 Add social media icons row to homepage
    - Embed `<SocialLinks>` component in the homepage
    - _Requirements: 2.6_

- [ ] 9. Build shared public listing components
  - [ ] 9.1 Create the ListingCard server component
    - Create `app/(public)/components/ListingCard.tsx`
    - Display: preview photo (Next.js `<Image>`) or placeholder SVG, property type badge, location (Village + Location), price formatted as ₱X,XXX,XXX, lot area, "View Details" link to `/listings/${displayId}`
    - Apply `displayId = propertyId > 2 ? propertyId - 1 : propertyId` logic
    - _Requirements: 3.2_

  - [ ] 9.2 Write property test for ListingCard required fields (Property 7)
    - **Property 7: ListingCard renders all required visible fields for any listing**
    - **Validates: Requirements 3.2**
    - Create `__tests__/public/listing-card.property.test.ts`; use `fast-check` to generate arbitrary valid listing objects; assert ₱ price, location, property type, and correct `/listings/${displayId}` href are all present; `numRuns: 200`

  - [ ] 9.3 Create the ImageGallery client component
    - Create `app/(public)/components/ImageGallery.tsx`
    - Display large active photo + thumbnail row; left/right arrow navigation; keyboard `ArrowLeft`/`ArrowRight` support; placeholder graphic when `photos.length === 0`
    - Use Next.js `<Image unoptimized>` for external Supabase URLs
    - _Requirements: 4.3_

- [ ] 10. Implement the Public Listings Page (`/listings`)
  - [ ] 10.1 Create the ListingsClientWrapper client component
    - Create `app/(public)/components/ListingsClientWrapper.tsx` receiving `allListings[]` as prop
    - Implement filter state: type (All/House & Lot/Lot Only/Commercial), location text input (case-insensitive substring), price range (All/Under ₱2M/₱2M–₱5M/₱5M–₱10M/Above ₱10M)
    - Apply all active filters simultaneously using `useMemo`
    - Reset `currentPage` to 1 on any filter change
    - Render "No properties match your search" + "Clear Filters" button when results are empty
    - _Requirements: 3.3, 3.4, 3.5_

  - [ ] 10.2 Write property test for filter intersection correctness (Property 6)
    - **Property 6: Listings page filter intersection is correct**
    - **Validates: Requirements 3.1, 3.4**
    - Create `__tests__/public/listings-filter.property.test.ts`; use `fast-check` to generate arbitrary listing datasets and filter combinations; assert displayed listings are exactly those satisfying all active predicates simultaneously; `numRuns: 300`

  - [ ] 10.3 Add pagination to ListingsClientWrapper
    - Page size: 12 listings per page
    - Render Previous, page number buttons, and Next controls only when total matching listings > 12
    - _Requirements: 3.6_

  - [ ] 10.4 Write property test for pagination threshold (Property 8)
    - **Property 8: Pagination appears iff more than 12 listings match filters**
    - **Validates: Requirements 3.6**
    - Extend `__tests__/public/listings-pagination.property.test.ts`; use `fast-check` to generate arbitrary N values; assert pagination is visible iff N > 12 and page count equals `Math.ceil(N / 12)`; `numRuns: 200`

  - [ ] 10.5 Create the Listings page server component
    - Create `app/(public)/listings/page.tsx` as a server component
    - Fetch all active listings, handle Supabase error (show error message, hide filters and pagination)
    - Pass data to `ListingsClientWrapper`
    - Export static `metadata` with required title and description keywords
    - _Requirements: 3.1, 3.7, 3.8_

- [ ] 11. Implement the Property Detail Page (`/listings/[id]`)
  - [ ] 11.1 Create the Property Detail page server component
    - Create `app/(public)/listings/[id]/page.tsx`
    - Reverse displayId to internalId: `internalId = displayId >= 2 ? displayId + 1 : displayId`
    - Query Supabase by `Property ID`; render "Property not found" + link to `/listings` on null result
    - Display all non-null fields: type, location, price, lot area, floor area, bedrooms, bathrooms, notes
    - Render `<ImageGallery>` with all photo URLs
    - Render "Contact About This Property" button linking to `/contact?property={encodedAddress}`
    - Export `generateMetadata` producing title `"{Type} in {Location} – M. Liang Realty"`, description from notes (truncated to 160 chars), `og:image` from preview photo, canonical URL
    - Include `<JsonLd>` with `buildRealEstateListingJsonLd(listing)`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 11.2 Write property test for detail page non-null fields (Property 9)
    - **Property 9: Property detail page renders all non-null fields for any listing**
    - **Validates: Requirements 4.3**
    - Create `__tests__/public/property-detail.property.test.ts`; use `fast-check` to generate listing objects with arbitrary subsets of optional fields (some null, some present); assert every non-null field appears in the rendered output and no render error occurs for null fields; `numRuns: 200`

- [ ] 12. Implement the About Page (`/about`)
  - [ ] 12.1 Create the About page component
    - Create `app/(public)/about/page.tsx` as a client component (needs `useTenantSettings` for localStorage)
    - Display: brokerage name, broker name and title, PRC license number, office address, contact number, email
    - Embed `<SocialLinks>` for the six social platforms
    - Export `metadata` with descriptive title and meta description referencing broker name and license
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ] 12.2 Write property test for tenantSettings fallback (Property 11)
    - **Property 11: About/Contact pages display tenantSettings values with correct fallback**
    - **Validates: Requirements 5.2, 6.8**
    - Create `__tests__/public/tenant-settings.property.test.ts`; use `fast-check` to generate partial/complete `tenantSettings` objects; mock `localStorage`; render About page and assert: present fields show stored value, absent fields show `TENANT_DEFAULTS` value, no field renders `undefined` or `null`; `numRuns: 200`

- [ ] 13. Implement the Contact Page and InquiryForm (`/contact`)
  - [ ] 13.1 Create the contact number validator utility
    - Create (or add to `lib/validation.ts`) a `validateContactNumber(s: string): boolean` function that returns `true` iff `s` matches `/^09\d{9}$/`
    - _Requirements: 6.1_

  - [ ] 13.2 Write property test for contact number validation (Property 12)
    - **Property 12: Contact number validation accepts exactly 11-digit strings starting with "09"**
    - **Validates: Requirements 6.1**
    - Create `__tests__/public/form-validation.property.test.ts`; use `fast-check` with `fc.string()` and targeted generators for valid/invalid phone strings; assert validator returns true iff `s` matches `/^09\d{9}$/`; `numRuns: 500`

  - [ ] 13.3 Create the InquiryForm client component
    - Create `app/(public)/components/InquiryForm.tsx` with fields: Full Name (max 100), Contact Number (`/^09\d{9}$/`), Email (RFC 5322 approx., max 150), Property of Interest (optional, max 200, pre-filled from `initialPropertyOfInterest` prop), Message (max 1000)
    - Form state: `values`, `errors`, `status: 'idle'|'loading'|'success'|'error'`, `errorMsg`
    - On submit: validate all fields → show inline errors if any invalid, do NOT call Supabase
    - If valid: set `status='loading'`, disable submit button with spinner, call `supabase.from('leads').insert(...)`
    - On success: show "Thank you! We will contact you shortly.", reset all fields
    - On error: show "Submission failed. Please try again or call us directly at {contactNumber}.", retain field values
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ] 13.4 Write property test: invalid form never calls Supabase (Property 13)
    - **Property 13: Invalid form submissions never call the Supabase insert API**
    - **Validates: Requirements 6.6**
    - Extend `__tests__/public/inquiry-form.property.test.ts`; use `fast-check` to generate form states with at least one invalid field; mock Supabase insert; assert it is never called and inline errors appear; `numRuns: 200`

  - [ ] 13.5 Write property test: valid form inserts correct data (Property 14)
    - **Property 14: Valid form submissions insert correct data into Supabase leads table**
    - **Validates: Requirements 6.3**
    - Extend `__tests__/public/inquiry-form.property.test.ts`; use `fast-check` to generate valid form values; mock Supabase insert; assert it is called exactly once with correct field mapping and a valid ISO 8601 `created_at`; `numRuns: 200`

  - [ ] 13.6 Create the Contact page server component
    - Create `app/(public)/contact/page.tsx` as a server component that reads `property` query param and passes it to `<InquiryForm>`
    - Display brokerage contact number and email alongside the form (from `useTenantSettings`)
    - Export `metadata` with fixed title "Contact M. Liang Realty – Get in Touch" and 150–160 char description
    - _Requirements: 6.2, 6.8, 6.9_

- [ ] 14. Checkpoint — verify all public pages render correctly
  - Ensure all public pages (`/`, `/listings`, `/listings/[id]`, `/about`, `/contact`) build without TypeScript errors, render with the Public Layout (header + footer), and contain no admin Navigation or ChatWidget

- [ ] 15. Implement SEO infrastructure
  - [ ] 15.1 Create the sitemap generator
    - Create `app/sitemap.ts` using the Next.js `MetadataRoute.Sitemap` convention
    - Include 4 static URLs (`/`, `/listings`, `/about`, `/contact`) and one URL per active listing
    - Set `lastModified` from listing's `updated_at`, `changeFrequency: 'weekly'`
    - Apply `displayId` transform
    - _Requirements: 7.1_

  - [ ] 15.2 Write property test for sitemap active listings only (Property 15)
    - **Property 15: Sitemap contains exactly the static pages plus one URL per active listing**
    - **Validates: Requirements 7.1**
    - Create `__tests__/public/sitemap.property.test.ts`; use `fast-check` to generate arbitrary listing datasets with mixed statuses; mock Supabase; assert sitemap has exactly 4 static URLs + one entry per active listing, no duplicates, no inactive listings; `numRuns: 200`

  - [ ] 15.3 Create the robots.txt generator
    - Create `app/robots.ts` using the Next.js `MetadataRoute.Robots` convention
    - Allow `/`, `/listings`, `/listings/`, `/about`, `/contact`; disallow `/admin/`, `/api/`
    - Include `sitemap` pointing to `https://realtyprov1.com/sitemap.xml`
    - _Requirements: 7.2_

- [ ] 16. Create the Supabase `leads` table migration
  - [ ] 16.1 Write the leads table SQL migration script
    - Create `database/create_leads_table.sql` with the `CREATE TABLE leads (...)` DDL, `CHECK` constraints, RLS enable, and anon insert policy exactly as specified in the design
    - _Requirements: 6.3_

- [ ] 17. Write property test for public pages performing no sessionStorage reads (Property 2)
  - [ ] 17.1 Property test: public pages perform no authentication checks
    - **Property 2: Public pages perform no authentication checks**
    - **Validates: Requirements 1.4**
    - Create `__tests__/public/public-pages.property.test.ts`; spy on `sessionStorage.getItem`; render each public page component; use `fast-check` to vary visitor authentication state; assert `sessionStorage.getItem` is never called from any public page component; `numRuns: 100`

- [ ] 18. Final checkpoint — run full test suite
  - Ensure all tests pass (`npm test -- --testPathPattern=__tests__/public`), the app builds successfully (`npm run build`), all admin routes redirect unauthenticated users, and all public routes are accessible without authentication

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- The `displayId` transform (`propertyId > 2 ? propertyId - 1 : propertyId`) is used in both admin and public code — keep it consistent
- The `leads` table migration (task 16.1) must be run against the Supabase project before the contact form can insert records
- The `og-image.jpg` (task 7.2) should be placed in `public/` and can be replaced with a real branded image later
- Property-based tests use `fast-check@3.22.0`; example-based and smoke tests use the existing Jest + React Testing Library setup
- `tenantSettings` is only available client-side (localStorage); server components always use `TENANT_DEFAULTS` — this is intentional and by design
- All social platform links use `target="_blank" rel="noopener noreferrer"` without exception

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["1.3", "1.4", "2.1"] },
    { "id": 2, "tasks": ["1.5", "2.2", "3.1"] },
    { "id": 3, "tasks": ["2.3", "3.2", "3.3"] },
    { "id": 4, "tasks": ["4.1", "6.1", "7.1", "7.2"] },
    { "id": 5, "tasks": ["4.2", "4.3", "4.4", "6.2", "6.3", "6.4"] },
    { "id": 6, "tasks": ["6.5", "9.1", "9.3", "13.1"] },
    { "id": 7, "tasks": ["6.6", "9.2", "13.2", "13.3"] },
    { "id": 8, "tasks": ["8.1", "8.4", "8.5", "10.1", "11.1", "12.1", "13.4", "13.5"] },
    { "id": 9, "tasks": ["8.2", "8.3", "10.2", "10.3", "11.2", "12.2", "13.6", "17.1"] },
    { "id": 10, "tasks": ["10.4", "10.5"] },
    { "id": 11, "tasks": ["15.1", "15.3", "16.1"] },
    { "id": 12, "tasks": ["15.2"] }
  ]
}
```
