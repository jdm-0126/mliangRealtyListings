# Requirements Document

## Introduction

MliangRealty currently embeds Facebook and TikTok videos on property pages, which pulls visitors away from the website. This feature introduces a **self-hosted property video and reels system** that keeps visitors on-site by streaming videos via a dedicated hosting platform (Cloudflare Stream, Mux, or Bunny Stream). It covers:

- Per-property hero videos (landscape MP4) and short vertical reels
- A public-facing "Featured Reels" feed with a TikTok-style vertical player
- Admin CMS video upload and management integrated with the existing Supabase-based admin panel
- Enhanced property detail pages with video, map, SEO content, and CTA
- Social media post automation that links back to the property page
- SEO-optimized property pages with Schema.org structured data
- An AI-powered property assistant on each listing page

The system targets foreign investors, OFWs, retirees, and expats searching for properties in Pampanga (Clark, Angeles City, Porac, Batangas).

---

## Glossary

- **Video_Hosting_Provider**: The third-party streaming service (Cloudflare Stream, Mux, or Bunny Stream) used to store and deliver video assets.
- **Hero_Video**: A landscape-oriented MP4 video (16:9 aspect ratio) associated with a property listing, stored as a non-null `videoUrl` in the `mlianglistings` table and served via the Video_Hosting_Provider.
- **Reel**: A short vertical video (9:16 aspect ratio, ≤ 60 seconds) associated with a property listing, stored in the `reel_url` column of `mlianglistings` and served via the Video_Hosting_Provider.
- **Reels_Feed**: A publicly accessible page section that displays all available Reels in a scrollable vertical feed.
- **Video_Player**: The embedded player component used on property pages and in the Reels modal, powered by the Video_Hosting_Provider's embed API.
- **CMS**: The existing admin panel located at `/admin` within the Next.js application, backed by Supabase.
- **Admin**: An authenticated user of the CMS (broker or superadmin role).
- **Property_Detail_Page**: The public page at `/listings/[id]` that displays a single property listing.
- **Property_Card**: The summary card for a listing shown in the `/listings` grid.
- **Automation_Webhook**: An HTTP endpoint (consumed by n8n or equivalent) that triggers social media publishing after a video is attached to a listing.
- **AI_Assistant**: The on-page conversational widget that answers buyer questions without navigating away from the Property_Detail_Page.
- **Schema_Markup**: JSON-LD structured data embedded in property pages following the `RealEstateListing` schema from Schema.org.
- **Nearby_Landmark**: A named point of interest (school, hospital, mall, airport) from a static per-location data set stored in the application.
- **WhatsApp_CTA**: A click-to-chat button that opens a pre-filled WhatsApp conversation with the broker.
- **Supabase**: The existing PostgreSQL-backed backend used for listing data and storage.

---

## Requirements

### Requirement 1: Self-Hosted Video Storage and Delivery

**User Story:** As an Admin, I want property videos to be hosted on a dedicated streaming platform, so that videos load quickly on the website without redirecting visitors to social media platforms.

#### Acceptance Criteria

1. THE Video_Hosting_Provider SHALL accept video uploads in MP4 format with a maximum file size of 2 GB per file.
2. IF an uploaded file is not in MP4 format, THEN THE CMS SHALL reject the file before transmission and display an error message stating "Only MP4 video files are accepted."
3. WHEN a video upload completes, THE Video_Hosting_Provider SHALL return a unique video identifier and a signed embed URL for use by the Video_Player.
4. WHILE a video is being served by the Video_Hosting_Provider, THE Video_Player SHALL play the video without requiring the visitor to manually select a quality level.
5. WHEN the Video_Hosting_Provider returns an embed URL, THE CMS SHALL store the embed URL and video identifier in the `mlianglistings` Supabase table against the corresponding property record.
6. IF the Video_Hosting_Provider upload fails or does not complete within 300 seconds, THEN THE CMS SHALL display an error message describing the failure; for first-time uploads the video fields SHALL remain null, and for replacements the previously saved URL SHALL be retained.

---

### Requirement 2: Per-Property Hero Video and Reel

**User Story:** As an Admin, I want to attach a hero video and a short vertical reel to each property listing, so that buyers see rich media immediately when they visit a property page.

#### Acceptance Criteria

1. THE CMS SHALL allow an Admin to attach at most one Hero_Video and at most one Reel to each property listing.
2. WHEN an Admin selects a file for Hero_Video upload, THE CMS SHALL validate client-side that the video aspect ratio is 16:9 (±5%) before transmitting the file to the Video_Hosting_Provider.
3. WHEN an Admin selects a file for Reel upload, THE CMS SHALL validate client-side that the video aspect ratio is 9:16 (±5%) and that the duration is 60 seconds or less before transmitting the file to the Video_Hosting_Provider.
4. IF a validation check fails, THEN THE CMS SHALL reject the file without transmission and display a message stating the specific validation rule that was not met.
5. THE CMS SHALL allow an Admin to remove an attached Hero_Video or Reel from a property listing without deleting other listing data.
6. WHEN an Admin confirms removal of a Hero_Video or Reel, THE CMS SHALL display a confirmation prompt before executing the deletion.
7. WHEN a Hero_Video or Reel is removed and the Video_Hosting_Provider deletion succeeds, THE CMS SHALL clear the corresponding URL and ID from the Supabase record; IF the Video_Hosting_Provider deletion fails, THEN THE CMS SHALL display an error and retain the existing Supabase record unchanged.

---

### Requirement 3: Property Reels Feed (Public)

**User Story:** As a website visitor, I want to browse a vertical video feed of property reels, so that I can quickly discover properties through short videos without leaving the MliangRealty website.

#### Acceptance Criteria

1. THE Reels_Feed SHALL display all active property listings whose `reel_url` is non-null and non-empty, in reverse chronological order by listing creation date.
2. WHEN a visitor scrolls to within 300px of the bottom of the Reels_Feed, THE Reels_Feed SHALL load the next batch of up to 12 Reels without a full page reload.
3. WHEN a visitor clicks a Reel thumbnail in the Reels_Feed, THE Video_Player SHALL open in a modal overlay and begin muted autoplay of the selected Reel immediately.
4. WHILE the Reels modal is open, THE Video_Player SHALL display the property address, price, and a link to the Property_Detail_Page.
5. WHEN a visitor closes the Reels modal (via close button, Escape key, or backdrop click), THE Reels_Feed SHALL return focus to the previously selected Reel thumbnail.
6. THE Reels_Feed SHALL display a static thumbnail image (the listing preview photo) for any property whose Reel has not yet fired the `canplay` event.
7. IF no active listings have a non-null, non-empty `reel_url`, THEN THE Reels_Feed SHALL display a placeholder message stating "No reels available yet."

---

### Requirement 4: Video Playback on Property Detail Page

**User Story:** As a property buyer, I want to watch a property's hero video and reel directly on the listing page, so that I can evaluate the property without being redirected to Facebook or TikTok.

#### Acceptance Criteria

1. WHEN a Property_Detail_Page loads and the listing has a Hero_Video, THE Video_Player SHALL render the Hero_Video below the photo gallery using the Video_Hosting_Provider's embed API; IF the listing also has a Reel, THE Reel SHALL be accessible via a separate tab or toggle within the same video section.
2. WHEN a Property_Detail_Page loads and the listing has a Reel but no Hero_Video, THE Video_Player SHALL render the Reel below the photo gallery.
3. WHILE a video is playing, THE Video_Player SHALL expose pause, resume, seek (via scrubber), mute/unmute (via button), and fullscreen (via button) controls that are keyboard-accessible.
4. THE Video_Player SHALL NOT auto-play video with audio on page load; autoplay with audio muted is permitted.
5. IF the listing has neither a Hero_Video nor a Reel, THEN THE Property_Detail_Page SHALL display only the photo gallery without a video section.
6. IF the `hero_video_url` or `reel_url` field is null or empty at page render time, THEN THE Property_Detail_Page SHALL not render a video player for that asset.
7. IF the Video_Hosting_Provider iframe fires an error event after load, THEN THE Property_Detail_Page SHALL replace the player with a message stating "Video unavailable."

---

### Requirement 5: CMS Video Upload Interface

**User Story:** As an Admin, I want to upload property videos directly from the admin panel, so that I can manage all property media from one place without needing separate tools.

#### Acceptance Criteria

1. THE CMS SHALL provide a video upload interface within the existing property edit dialog at `/admin/properties`.
2. THE CMS SHALL only accept video files of type `video/mp4` with a maximum size of 2 GB; IF a selected file does not meet these constraints, THEN THE CMS SHALL reject it before upload and display the specific constraint that was violated.
3. WHEN an Admin selects a valid video file for upload, THE CMS SHALL display an upload progress indicator showing percentage completion.
4. WHEN a video upload completes successfully, THE CMS SHALL display a thumbnail preview of the uploaded video within the property edit dialog.
5. WHEN an Admin initiates a replacement upload, THE previous video SHALL be deleted from the Video_Hosting_Provider only after the new upload completes successfully; IF the new upload fails, THEN the previous video SHALL be retained.
6. WHILE a video is uploading, THE CMS SHALL prevent the Admin from navigating away from the property edit dialog without a confirmation prompt.
7. THE CMS SHALL display the current Hero_Video and Reel status (attached/not attached) for each property in the property listing grid.

---

### Requirement 6: Social Media Automation

**User Story:** As an Admin, I want new property videos to be automatically shared to Facebook, Instagram, and TikTok with a link back to the property page, so that social media followers are driven to the website rather than kept on third-party platforms.

#### Acceptance Criteria

1. WHEN the `videoUrl` or `reel_url` field of a property record transitions from null/empty to a non-null/non-empty value and is persisted to Supabase, THE CMS SHALL trigger the Automation_Webhook.
2. THE Automation_Webhook endpoint SHALL accept HTTP POST requests with a JSON body containing `propertyId` (string), `videoUrl` (string or null), `reelUrl` (string or null), and `propertyPageUrl` (string) fields.
3. THE `propertyPageUrl` field in the webhook payload SHALL be the canonical Property_Detail_Page URL constructed using the `buildCanonicalUrl` utility so that every social post links back to the MliangRealty website.
4. IF the Automation_Webhook call fails (non-2xx response or network error), THEN THE CMS SHALL log the error server-side and display a non-blocking warning banner to the Admin; the video attachment SHALL remain intact.
5. THE Automation_Webhook target URL SHALL be read from the `AUTOMATION_WEBHOOK_URL` environment variable; IF the variable is absent or empty, THEN THE CMS SHALL skip the webhook call and log a warning without throwing an error.

---

### Requirement 7: SEO-Optimized Property Detail Pages

**User Story:** As a property seeker using a search engine, I want to find detailed, descriptive property pages with local context, so that I can evaluate a property from the search results page before visiting the site.

#### Acceptance Criteria

1. THE Property_Detail_Page SHALL render a unique `<title>` tag following the pattern `[Type] in [Location] – M. Liang Realty` using the listing's `propertyType` and `location` fields.
2. THE Property_Detail_Page SHALL render a `<meta name="description">` tag containing between 150 and 160 characters derived from the listing's notes and location; IF the listing's notes field contains fewer than 150 characters, THEN the page title SHALL be used as the meta description value.
3. THE Property_Detail_Page SHALL embed a Schema_Markup JSON-LD block of type `RealEstateListing` containing at minimum: `name`, `description`, `url`, `image`, `address` (as a `PostalAddress` object), `floorSize` (mapped from floor area with `unitCode "MTK"`), `price`, and `offers`.
4. WHEN the listing's `videoUrl` field is non-null and non-empty, THE Schema_Markup SHALL include a `VideoObject` property with `name`, `description`, `thumbnailUrl`, and `contentUrl` fields.
5. THE Property_Detail_Page SHALL include a section listing up to 5 Nearby_Landmarks grouped by category (schools, hospitals, malls, airports) sourced from the application's static per-location landmark data; IF no landmarks exist for the listing's location, THEN the landmarks section SHALL be omitted.
6. THE Property_Detail_Page SHALL include a FAQ section with at least 3 questions and answers drawn from a static template keyed to the listing's `propertyType`; each answer SHALL NOT exceed 300 characters.
7. IF the listing's `mapUrl` field is non-null and non-empty, THEN THE Property_Detail_Page SHALL render an embedded Google Maps iframe using that URL; otherwise the map section SHALL be omitted.
8. THE Property_Detail_Page SHALL contain exactly one `<h1>` element per page, containing the property type and location.

---

### Requirement 8: WhatsApp and Schedule Viewing CTA

**User Story:** As a property buyer, I want a prominent WhatsApp button and a schedule-viewing link on each listing page, so that I can contact the broker instantly without searching for contact details.

#### Acceptance Criteria

1. WHEN a visitor clicks the WhatsApp_CTA button, THE browser SHALL open `https://wa.me/[normalizedNumber]?text=[urlEncodedMessage]` in a new tab, where `normalizedNumber` is the broker's phone number with leading `0` replaced by `63` and all non-digit characters removed.
2. THE WhatsApp_CTA pre-filled message SHALL contain the property address on the first line and the canonical Property_Detail_Page URL on the second line, URL-encoded as a single `text` query parameter.
3. THE Property_Detail_Page SHALL render a "Schedule a Viewing" button that navigates to `/contact?property=[encodeURIComponent(address)]`.
4. WHILE the page is rendered on a viewport width of 768px or less, THE WhatsApp_CTA and "Schedule a Viewing" buttons SHALL be displayed in a sticky bottom bar fixed to the bottom of the viewport.
5. THE broker phone number used in the WhatsApp_CTA SHALL be sourced from the `contactNumber` field of `TenantSettings` stored in Supabase; IF `contactNumber` is absent or empty, THEN THE WhatsApp_CTA button SHALL not be rendered.

---

### Requirement 9: AI-Powered Property Assistant

**User Story:** As a property buyer, I want to ask questions about a listing and receive instant, contextual answers, so that I can make an informed decision without leaving the property page.

#### Acceptance Criteria

1. THE AI_Assistant SHALL be present on every Property_Detail_Page as a chat widget that can be dismissed by the visitor; dismissal SHALL persist for the duration of the browser session only, so that the widget reappears on the next session.
2. WHEN a visitor submits a question, THE AI_Assistant SHALL begin streaming or display a complete response within 5 seconds on a connection with at least 10 Mbps download speed; IF the response is not initiated within 5 seconds, THEN THE AI_Assistant SHALL display an error message and offer a retry.
3. WHEN generating a response, THE AI_Assistant SHALL include the listing's `propertyType`, `location`, `price`, `lotArea`, `floorArea`, `notes`, and any available Nearby_Landmarks in the system prompt sent to the AI model.
4. THE AI_Assistant SHALL be capable of recommending similar listings by querying active inventory filtered by the same `propertyType` and `location`, returning up to 3 results.
5. THE AI_Assistant SHALL be capable of answering questions about bank loan eligibility and Pag-IBIG financing using a static knowledge base of general Philippine financing rules embedded in the system prompt.
6. THE AI_Assistant SHALL be capable of comparing the listing's `location` to at least 3 other named neighborhoods or cities in Pampanga using static descriptive data embedded in the system prompt.
7. IF the AI model returns a response indicating it does not have enough information to answer, or if the response confidence score (where available) is below threshold, THEN THE AI_Assistant SHALL append a suggestion to contact the broker via the WhatsApp_CTA or "Schedule a Viewing" button.
8. THE AI_Assistant SHALL NOT transmit visitor message content to any third-party analytics or tracking service; visitor messages SHALL only be sent to the configured AI model API endpoint; consent is required before any data collection beyond the AI model call.
9. THE AI_Assistant SHALL enforce a maximum input length of 500 characters per message; IF a visitor's message exceeds this limit, THEN THE AI_Assistant SHALL display an inline validation message and prevent submission.

---

### Requirement 10: Database Schema for Video Metadata

**User Story:** As a developer, I want a structured database schema for video metadata, so that the application can reliably store and retrieve self-hosted video information alongside existing listing data.

#### Acceptance Criteria

1. THE Supabase `mlianglistings` table SHALL contain a column `hero_video_url` of type TEXT (nullable) that stores the Video_Hosting_Provider embed URL for the Hero_Video.
2. THE Supabase `mlianglistings` table SHALL contain a column `reel_url` of type TEXT (nullable) that stores the Video_Hosting_Provider embed URL for the Reel.
3. THE Supabase `mlianglistings` table SHALL contain a column `hero_video_id` of type TEXT (nullable) that stores the Video_Hosting_Provider's unique asset identifier for the Hero_Video.
4. THE Supabase `mlianglistings` table SHALL contain a column `reel_id` of type TEXT (nullable) that stores the Video_Hosting_Provider's unique asset identifier for the Reel.
5. THE Supabase `mlianglistings` table SHALL contain a column `reel_thumbnail_url` of type TEXT (nullable) that stores a static image URL for use as the Reel preview in the Reels_Feed.
6. IF the `mlianglistings` table does not already have an `updated_at` column, THEN THE migration SHALL add it as `TIMESTAMPTZ NOT NULL DEFAULT now()`.
7. WHEN any of the five video columns (`hero_video_url`, `reel_url`, `hero_video_id`, `reel_id`, `reel_thumbnail_url`) are updated via an SQL UPDATE statement, a Supabase database trigger SHALL set the `updated_at` column to the current UTC timestamp.
8. THE database migration adding these columns SHALL use `ADD COLUMN IF NOT EXISTS` for all new columns so that it is idempotent and can be re-run safely in any environment.
