# Requirements Document

## Introduction

M. Liang Realty (operating as RealtyProv1) currently has a private property management system built on Next.js 14 (App Router), TypeScript, Tailwind CSS, and Supabase. The system is fully internal: all pages are behind a sessionStorage-based authentication gate.

This feature adds a **public-facing website** — a customer-accessible section of the same Next.js application. Visitors can browse active property listings, submit inquiries, and find contact and social media information for the brokerage, all without logging in. The admin panel is simultaneously restructured so every internal management page is protected under an `/admin` route group, with unauthenticated visitors redirected to the public homepage.

---

## Glossary

- **Public_Site**: The public-facing section of the application, accessible at `/` (homepage), `/listings`, `/listings/[id]`, `/about`, and `/contact` — no authentication required.
- **Admin_Panel**: The internal management section relocated to `/admin/**` routes, accessible only to authenticated users (superadmin, broker, agent).
- **Auth_Guard**: The client-side authentication check that reads `sessionStorage.brokerAdminAuth === 'authenticated'` and redirects unauthenticated users to `/` (Public_Site homepage).
- **Visitor**: Any unauthenticated user accessing the Public_Site.
- **Listing**: A property record stored in the Supabase `mlianglistings` table with status `'active'`.
- **Inquiry_Form**: The lead-capture form on the public Contact page that collects a Visitor's name, contact number, email address, property of interest (optional), and message.
- **Lead_Record**: A row inserted into the Supabase `leads` table upon successful Inquiry_Form submission.
- **SEO_Metadata**: Page-level HTML metadata including `<title>`, `<meta name="description">`, Open Graph tags, Twitter Card tags, and JSON-LD structured data.
- **Sitemap**: An XML file at `/sitemap.xml` listing all public URLs for search engine indexing.
- **Robots_File**: A text file at `/robots.txt` directing search engine crawlers.
- **Public_Layout**: The Next.js layout wrapping all Public_Site pages — includes the public header/navigation and footer; does NOT include the admin Navigation component or ChatWidget.
- **Admin_Layout**: The Next.js layout wrapping all Admin_Panel pages — includes the existing Navigation sidebar and ChatWidget.

---

## Requirements

### Requirement 1: Route Architecture Separation

**User Story:** As a developer, I want public and admin pages to use separate Next.js route groups with distinct layouts, so that public visitors never see the admin navigation and admin users never see public pages as their working environment.

#### Acceptance Criteria

1. THE Public_Site SHALL serve all public pages (`/`, `/listings`, `/listings/[id]`, `/about`, `/contact`) under a `(public)` Next.js route group that uses the Public_Layout (no admin sidebar, no ChatWidget).
2. THE Admin_Panel SHALL serve the existing management pages (Dashboard, Broker Dashboard, Properties, Rentals, Brokers, Agents, Agent Profile, Settings, Facebook Posts, Upload, Editor) under an `(admin)` Next.js route group with `/admin` as the path prefix, using the Admin_Layout (existing Navigation sidebar and ChatWidget).
3. WHEN a Visitor navigates to any `/admin/**` URL and `sessionStorage.getItem('brokerAdminAuth') !== 'authenticated'`, THE Auth_Guard SHALL execute `router.push('/')` before any admin-protected page content becomes interactive, preventing sensitive data from being visible in the DOM.
4. THE Public_Site SHALL be accessible at the root path `/` without any authentication check — no sessionStorage read is performed on public pages.
5. WHEN an authenticated user navigates to `/`, THE Public_Site SHALL display the public homepage without redirecting to `/admin` (the public homepage is intentionally accessible to all users).
6. IF the browser environment does not support `sessionStorage` (e.g., private browsing with storage blocked), THEN THE Auth_Guard SHALL treat the user as unauthenticated and redirect to `/`.

---

### Requirement 2: Public Homepage

**User Story:** As a potential property buyer or renter, I want a visually compelling homepage that introduces M. Liang Realty, so that I can immediately understand what the agency offers and how to explore listings.

#### Acceptance Criteria

1. THE Public_Site SHALL render a Hero section on the homepage (`/`) containing the brokerage name, a tagline, a primary call-to-action button linking to `/listings`, and a secondary call-to-action button linking to `/contact`.
2. THE Public_Site SHALL render a Featured Listings section on the homepage displaying up to 6 Listings where the `status` field equals `"active"` (case-insensitive), fetched from the Supabase `mlianglistings` table and ordered by `property_id` descending (newest first).
3. IF the Supabase query for active Listings returns 0 records, THEN THE Public_Site SHALL display a "No listings available at the moment" placeholder in the Featured Listings section instead of an empty grid.
4. IF the Supabase query for active Listings returns an error, THEN THE Public_Site SHALL display an "Unable to load listings at this time" message in the Featured Listings section and SHALL NOT render a broken or empty grid.
5. THE Public_Site SHALL render a Services section on the homepage that includes at minimum three content blocks describing: (1) property sales (house and lot, commercial), (2) rental properties, and (3) lot sales — each with a heading and a short descriptive paragraph.
6. THE Public_Site SHALL render social media link icons on the homepage for Facebook, Instagram, TikTok, YouTube, Viber, and WhatsApp; each icon SHALL link to the configured URL for that platform (from `NEXT_PUBLIC_SOCIAL_*` env vars), open in a new browser tab using `target="_blank" rel="noopener noreferrer"`, and be hidden when the corresponding env var is unset or empty.
7. THE Public_Site SHALL include SEO_Metadata on the homepage with: a page title of 50–70 characters (e.g., "M. Liang Realty – Houses, Lots & Condos in Pampanga"), a meta description of 150–160 characters, Open Graph tags (`og:title`, `og:description`, `og:image` pointing to a publicly accessible static asset, `og:url`), and Twitter Card tags (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`).

---

### Requirement 3: Public Listings Page

**User Story:** As a Visitor, I want to browse all available property listings with filtering options, so that I can find properties that match my budget, location, and type preferences.

#### Acceptance Criteria

1. THE Public_Site SHALL render a Listings page at `/listings` that fetches and displays all Listings where `status = 'active'` (case-insensitive) from the `mlianglistings` table.
2. THE Public_Site SHALL display each Listing as a card showing: preview photo (or a placeholder image if none), property type, location, listing price formatted as Philippine Peso (₱), lot area, and a "View Details" link to `/listings/[id]`.
3. THE Public_Site SHALL provide filter controls on the Listings page for: property type (All, House & Lot, Lot Only, Commercial), location keyword search (text input, case-insensitive substring match against the Location/Address field), and price range (All, Under ₱2M, ₱2M–₱5M, ₱5M–₱10M, Above ₱10M).
4. WHEN a Visitor changes any filter control, THE Public_Site SHALL update the displayed Listing cards without a full page reload, reflecting only Listings that match all active filters simultaneously, and SHALL reset the current page to page 1.
5. WHEN no Listings match the applied filters, THE Public_Site SHALL display a "No properties match your search" message and a "Clear Filters" button that resets all filter controls to their default (All) values and returns to page 1.
6. WHEN the total number of Listings matching the current filters exceeds 12, THE Public_Site SHALL display pagination controls consisting of a Previous button, individual page number buttons, and a Next button; WHEN fewer than or equal to 12 Listings match, no pagination controls SHALL be rendered.
7. THE Public_Site SHALL include SEO_Metadata on the Listings page with the fixed page title "Properties for Sale & Rent – M. Liang Realty" and a meta description that includes the words "house and lot", "lot", "commercial", and "Pampanga".
8. IF the Supabase fetch for active Listings returns an error, THEN THE Public_Site SHALL display an "Unable to load listings. Please try again later." message in place of the listing grid and SHALL NOT render filter controls or pagination.

---

### Requirement 4: Public Property Detail Page

**User Story:** As a Visitor, I want to view full details for a specific property including photos and a contact prompt, so that I can evaluate whether to inquire about it.

#### Acceptance Criteria

1. THE Public_Site SHALL render a Property Detail page at `/listings/[id]` that fetches the single Listing matching the given `id` from the `mlianglistings` table.
2. IF the requested `id` does not match any record in `mlianglistings`, THEN THE Public_Site SHALL display a "Property not found" message and a link back to `/listings`.
3. THE Public_Site SHALL display on the Property Detail page: all available photos (in a scrollable gallery or carousel), property type, location/address, listing price in Philippine Peso, lot area, floor area (if available), number of bedrooms (if available), number of bathrooms (if available), and the full property notes/description.
4. THE Public_Site SHALL render an inquiry call-to-action on the Property Detail page with a "Contact About This Property" button that links to `/contact` with the property address pre-filled as the property of interest query parameter.
5. THE Public_Site SHALL include SEO_Metadata on each Property Detail page with a title formatted as "{Property_Type} in {Location} – M. Liang Realty", a meta description derived from the property notes (truncated to 160 characters), `og:image` set to the property's preview photo URL, and JSON-LD structured data using the `RealEstateListing` schema type.

---

### Requirement 5: Public About / Agent Profile Page

**User Story:** As a Visitor, I want to learn about the broker and brokerage, so that I can build trust before reaching out.

#### Acceptance Criteria

1. THE Public_Site SHALL render an About page at `/about` displaying: the brokerage name (M. Liang Realty / RealtyProv1), the licensed broker's name and title, the PRC license number, the office address, the contact number, and the email address.
2. THE Public_Site SHALL source the About page content from the same `tenantSettings` values stored in `localStorage` by the Settings page, falling back to the hardcoded defaults (broker name: M. Liang Realty, PRC No. 0019653, etc.) when localStorage is unavailable (e.g., server-side render).
3. THE Public_Site SHALL display the six social media platform links (Facebook, Instagram, TikTok, YouTube, Viber, WhatsApp) on the About page, each opening in a new tab.
4. THE Public_Site SHALL include SEO_Metadata on the About page with a descriptive title and meta description referencing the broker's name and license.

---

### Requirement 6: Public Contact / Inquiry Form

**User Story:** As a Visitor, I want to submit my contact details and inquiry, so that the brokerage can follow up with me about properties I am interested in.

#### Acceptance Criteria

1. THE Public_Site SHALL render a Contact page at `/contact` containing the Inquiry_Form with the following required fields: Full Name (text, max 100 characters), Contact Number (text, validated as an 11-digit string starting with "09"), Email Address (RFC 5322 email format, max 150 characters), and Message (textarea, max 1000 characters).
2. WHEN the `/contact` page is accessed with a `property` query parameter, THE Inquiry_Form SHALL pre-fill the optional "Property of Interest" text field (max 200 characters) with the decoded value of that parameter.
3. WHEN a Visitor submits the Inquiry_Form with all required fields valid, THE Public_Site SHALL insert a Lead_Record into the Supabase `leads` table containing: `full_name`, `contact_number`, `email`, `message`, `property_of_interest`, and `created_at` (UTC ISO 8601 timestamp generated at submission time).
4. WHEN the Lead_Record insertion succeeds, THE Public_Site SHALL display a success confirmation message "Thank you! We will contact you shortly." and reset all form fields to empty.
5. IF the Lead_Record insertion fails due to a Supabase error, THEN THE Public_Site SHALL display the error message "Submission failed. Please try again or call us directly at {contact_number}." — where `{contact_number}` is the brokerage contact number stored in `tenantSettings` — and SHALL retain all Visitor-entered form field values so the Visitor does not need to retype them.
6. WHEN a Visitor activates the form submit control and any required field is invalid, THE Public_Site SHALL display an inline validation error message immediately below each invalid field and SHALL NOT call the Supabase insert API.
7. WHEN a Visitor activates the form submit control with all required fields valid, THE Public_Site SHALL disable the submit button and display a loading spinner within the button from the moment of submission until the Supabase response is received, re-enabling the button only after the response is processed.
8. THE Public_Site SHALL display the brokerage's contact number and email address (sourced from `tenantSettings` in `localStorage`, falling back to hardcoded defaults) on the Contact page alongside the Inquiry_Form as an alternative contact method.
9. THE Public_Site SHALL include SEO_Metadata on the Contact page with the fixed page title "Contact M. Liang Realty – Get in Touch" (50–70 characters) and a meta description of 150–160 characters that mentions contacting the brokerage and the Pampanga location.

---

### Requirement 7: SEO Infrastructure

**User Story:** As the broker, I want the public website to be properly indexed by search engines, so that potential clients can discover M. Liang Realty through Google and other search engines.

#### Acceptance Criteria

1. THE Public_Site SHALL generate a Sitemap at `/sitemap.xml` listing the static public URLs (`/`, `/listings`, `/about`, `/contact`) and all individual property detail URLs (`/listings/[id]` for each Listing where `status = 'active'`), with `lastmod` set to the Listing's most recent update timestamp and `changefreq` set to `weekly`.
2. THE Public_Site SHALL serve a Robots_File at `/robots.txt` that allows all crawlers to index public pages (`/`, `/listings`, `/listings/*`, `/about`, `/contact`) and disallows crawling of admin paths (`/admin/*`, `/api/*`).
3. THE Public_Site SHALL include a `<link rel="canonical" href="{absolute_url}">` tag on each of the five public page types (`/`, `/listings`, `/listings/[id]`, `/about`, `/contact`), where `{absolute_url}` is the full canonical URL of that specific page (including scheme and host).
4. THE Public_Site SHALL include JSON-LD structured data of type `LocalBusiness` on the homepage containing: `name` (brokerage name), `@type: RealEstateAgent`, `telephone` (brokerage contact number), and `address` with sub-fields `streetAddress`, `addressLocality` (San Fernando), `addressRegion` (Pampanga), and `addressCountry` (PH).
5. THE Public_Site SHALL serve all public pages with an HTML `lang` attribute of `"en"` on the root `<html>` element.

---

### Requirement 8: Public Navigation and Footer

**User Story:** As a Visitor, I want consistent navigation and footer links across all public pages, so that I can move between sections easily and find key contact information at a glance.

#### Acceptance Criteria

1. THE Public_Layout SHALL render a sticky header on every public page containing: the brokerage name/logo, navigation links to Home (`/`), Listings (`/listings`), About (`/about`), and Contact (`/contact`), and a "Contact Us" button that navigates to `/contact`.
2. THE Public_Layout SHALL render a footer on every public page containing: the brokerage name, a tagline, the six social media links (each hidden when its `NEXT_PUBLIC_SOCIAL_*` env var is unset), office address, contact number, email address, PRC license number, and a copyright notice with the current year.
3. THE Public_Layout SHALL render an "Admin Login" link in the footer that navigates to `/admin`, visible to all Visitors regardless of authentication state.
4. WHEN a Visitor's viewport width is less than 768px, THE Public_Layout SHALL hide the inline navigation links and display a hamburger icon button; WHEN the Visitor activates the hamburger button, THE Public_Layout SHALL expand a dropdown or drawer containing the four navigation links and the "Contact Us" button; WHEN the Visitor activates the hamburger button again or selects a navigation link, THE Public_Layout SHALL collapse the menu.
5. THE Public_Layout SHALL NOT render the admin Navigation sidebar component or the ChatWidget component on any public page.

---

### Requirement 9: Admin Panel Route Protection

**User Story:** As an administrator, I want all internal management pages to be gated behind authentication, so that sensitive property data and management tools are not accessible to unauthenticated visitors.

#### Acceptance Criteria

1. THE Admin_Panel SHALL host the following existing management pages under `/admin/**` routes: Dashboard (`/admin`), Broker Dashboard (`/admin/broker-dashboard`), Properties (`/admin/properties`), Rentals (`/admin/rentals`), Brokers (`/admin/brokers`), Agents (`/admin/agents`), Agent Profile (`/admin/agent-profile`), Settings (`/admin/settings`), Facebook Posts (`/admin/facebook-posts`), Upload (`/admin/upload`), and Editor (`/admin/editor`).
2. WHEN a Visitor navigates to any `/admin/**` route and `sessionStorage.getItem('brokerAdminAuth') !== 'authenticated'`, THE Auth_Guard SHALL call `router.push('/')` before any admin-protected page content is rendered or becomes interactive.
3. IF the browser does not support `sessionStorage` or accessing it throws an exception, THEN THE Auth_Guard SHALL treat the user as unauthenticated and execute `router.push('/')`.
4. THE Admin_Panel SHALL preserve the existing behavior of all management pages — their internal component logic, data-fetching patterns, and UI interactions SHALL remain unmodified; only the URL path prefix (`/admin/`) and layout wrapper change.
5. WHEN an authenticated user logs out via the Settings page, THE application SHALL clear both `sessionStorage` keys (`brokerAdminAuth` and `userEmail`) and SHALL call `router.push('/')` to redirect the user to the public homepage.
6. WHILE the Auth_Guard is evaluating authentication status (before the sessionStorage check completes), THE Admin_Panel page SHALL render a loading state (e.g., spinner or blank screen) rather than briefly displaying protected content.

---

### Requirement 10: Social Media Links Configuration

**User Story:** As the broker, I want to configure social media profile URLs in one place so that all public pages reflect the correct links.

#### Acceptance Criteria

1. THE Public_Site SHALL read social media URLs from a configuration source (environment variables prefixed with `NEXT_PUBLIC_SOCIAL_`) for: `NEXT_PUBLIC_SOCIAL_FACEBOOK`, `NEXT_PUBLIC_SOCIAL_INSTAGRAM`, `NEXT_PUBLIC_SOCIAL_TIKTOK`, `NEXT_PUBLIC_SOCIAL_YOUTUBE`, `NEXT_PUBLIC_SOCIAL_VIBER`, and `NEXT_PUBLIC_SOCIAL_WHATSAPP`.
2. WHEN a social media environment variable is not set or is an empty string, THE Public_Site SHALL hide that platform's icon and link rather than rendering a broken or empty link.
3. THE Public_Site SHALL open all social media links in a new browser tab using `target="_blank"` with `rel="noopener noreferrer"` for security.
