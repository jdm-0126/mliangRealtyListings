# Supabase — M. Liang Realty

## Directory Structure

```
supabase/
├── config.toml                       # Supabase CLI local dev config
├── seed.sql                          # Development seed data
├── migrations/
│   └── 20260101000000_initial_schema.sql  # Schema DDL
└── README.md
```

## Tables

| Table | Purpose |
|---|---|
| `roles` | User roles: superadmin, broker, agent |
| `users` | Admin users with role assignments |
| `leads` | Contact/inquiry submissions from public site |
| `website_content` | CMS content blocks for public pages |
| `system_settings` | Business info, social links, feature flags |
| `mlianglistings` | *(existing)* Property listing records |

## Seeded Roles

| Role | Description |
|---|---|
| `superadmin` | Full access to everything |
| `broker` | Manage properties, view agents, manage leads |
| `agent` | View properties and leads |

## Seeded Users (Development Only)

| Email | Password | Role |
|---|---|---|
| `jn16h7@gmail.com` | `EuandaiteD_0126` | superadmin |
| `broker@realtyprov1.com` | `brokerMliangAdmin2026` | broker |
| `agent@realtyprov1.com` | `brokerMliangAdmin2026` | agent |

> ⚠️ **These are development credentials only. Change before production deployment.**

## Running Locally

### Prerequisites
```bash
npm install -g supabase
```

### Start local Supabase
```bash
supabase start
```

### Apply migrations + seed
```bash
supabase db reset
```
This runs all migrations then `seed.sql` automatically.

### Stop local Supabase
```bash
supabase stop
```

## Applying to Remote Supabase Project

### Push migrations
```bash
supabase db push
```

### Run seed manually on remote
```bash
psql "postgresql://postgres:<password>@<host>:5432/postgres" -f supabase/seed.sql
```

## system_settings Keys

| Key | is_public | Description |
|---|---|---|
| `business_info` | ✅ | Name, broker, PRC, address, contact, email |
| `social_media` | ✅ | Facebook, Instagram, TikTok, YouTube, Viber, WhatsApp URLs |
| `site_meta` | ✅ | SEO title, description, OG image, canonical URL |
| `feature_flags` | ❌ | Chat widget, lead capture, maintenance mode toggles |

## website_content Section Keys

| Key | Description |
|---|---|
| `hero_title` | Homepage hero main heading |
| `hero_tagline` | Homepage hero subheading |
| `services_intro` | Services section subtitle |
| `service_1_title` | Property Sales heading |
| `service_1_description` | Property Sales body HTML |
| `service_2_title` | Rental Properties heading |
| `service_2_description` | Rental Properties body HTML |
| `service_3_title` | Lot Sales heading |
| `service_3_description` | Lot Sales body HTML |
| `footer_tagline` | Footer brand tagline |

## RLS Policies Summary

| Table | anon | authenticated |
|---|---|---|
| `leads` | INSERT only | Full CRUD |
| `website_content` | SELECT (is_active=true) | Full CRUD |
| `system_settings` | SELECT (is_public=true) | Full CRUD |
| `roles` | None | Full CRUD |
| `users` | None | Full CRUD |
