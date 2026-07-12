/**
 * Appwrite Migration — M. Liang Realty
 * Creates all collections + attributes in database: 6a5320eb0027f9aa5823
 *
 * Usage:
 *   APPWRITE_API_KEY=<your_api_key> node database/appwrite/migrate.js
 *
 * Get your API key from:
 *   https://cloud.appwrite.io/console/project-sgp-6a531d6800147ceec486/settings/keys
 *   Scopes needed: databases.write, collections.write, attributes.write, indexes.write
 */

const { Client, Databases, IndexType } = require('node-appwrite')

const client = new Client()
  .setEndpoint('https://sgp.cloud.appwrite.io/v1')
  .setProject('6a531d6800147ceec486')
  .setKey(process.env.APPWRITE_API_KEY)

const db = new Databases(client)
const DATABASE_ID = '6a5320eb0027f9aa5823'

// Collection IDs — fixed so you can reference them in code
const COLLECTIONS = {
  LISTINGS:         'listings',
  AGENTS:           'agents',
  BROKERS:          'brokers',
  LEADS:            'leads',
  FACEBOOK_POSTS:   'facebook_posts',
  SOLD_PROPERTIES:  'sold_properties',
  GALLERY:          'gallery',
  WEBSITE_CONTENT:  'website_content',
  SYSTEM_SETTINGS:  'system_settings',
  SHARED_PASSWORDS: 'shared_passwords',
}

async function createCollection(id, name) {
  try {
    await db.createCollection(DATABASE_ID, id, name, [
      'read("any")',
      'create("any")',
      'update("any")',
      'delete("any")',
    ])
    console.log(`✓ Collection: ${name}`)
  } catch (e) {
    if (e.code === 409) console.log(`  skip (exists): ${name}`)
    else throw e
  }
}

async function attr(type, collId, key, opts = {}) {
  const { required = false, default: def, size, min, max, elements, array = false } = opts
  try {
    switch (type) {
      case 'string':
        await db.createStringAttribute(DATABASE_ID, collId, key, size ?? 255, required, def ?? null, array)
        break
      case 'integer':
        await db.createIntegerAttribute(DATABASE_ID, collId, key, required, min ?? null, max ?? null, def ?? null, array)
        break
      case 'float':
        await db.createFloatAttribute(DATABASE_ID, collId, key, required, min ?? null, max ?? null, def ?? null, array)
        break
      case 'boolean':
        await db.createBooleanAttribute(DATABASE_ID, collId, key, required, def ?? null, array)
        break
      case 'datetime':
        await db.createDatetimeAttribute(DATABASE_ID, collId, key, required, def ?? null, array)
        break
      case 'enum':
        await db.createEnumAttribute(DATABASE_ID, collId, key, elements, required, def ?? null, array)
        break
      case 'url':
        await db.createUrlAttribute(DATABASE_ID, collId, key, required, def ?? null, array)
        break
      case 'email':
        await db.createEmailAttribute(DATABASE_ID, collId, key, required, def ?? null, array)
        break
    }
    console.log(`    + ${key} (${type})`)
  } catch (e) {
    if (e.code === 409) console.log(`    skip attr: ${key}`)
    else console.error(`    ✗ ${key}: ${e.message}`)
  }
}

// Appwrite requires a short delay between attribute creation calls
const wait = (ms) => new Promise(r => setTimeout(r, ms))

async function run() {
  console.log('\n=== Appwrite Migration: M. Liang Realty ===\n')

  // ── 1. LISTINGS ──────────────────────────────────────────────────────────
  await createCollection(COLLECTIONS.LISTINGS, 'listings')
  await wait(500)
  await attr('integer',  COLLECTIONS.LISTINGS, 'property_id')
  await attr('string',   COLLECTIONS.LISTINGS, 'Type',           { size: 100 })
  await attr('string',   COLLECTIONS.LISTINGS, 'Location',       { size: 255 })
  await attr('string',   COLLECTIONS.LISTINGS, 'Village',        { size: 255 })
  await attr('float',    COLLECTIONS.LISTINGS, 'Listing_Price')
  await attr('float',    COLLECTIONS.LISTINGS, 'Lot_Area_sqm')
  await attr('float',    COLLECTIONS.LISTINGS, 'Floor_Area_sqm')
  await attr('integer',  COLLECTIONS.LISTINGS, 'Bedroom')
  await attr('integer',  COLLECTIONS.LISTINGS, 'Bathroom')
  await attr('string',   COLLECTIONS.LISTINGS, 'Preview_Photo',  { size: 1000 })
  await attr('string',   COLLECTIONS.LISTINGS, 'Photos',         { size: 1000, array: true })
  await attr('string',   COLLECTIONS.LISTINGS, 'Notes',          { size: 2000 })
  await attr('string',   COLLECTIONS.LISTINGS, 'Status',         { size: 50, default: 'active' })
  await attr('string',   COLLECTIONS.LISTINGS, 'Map_URL',        { size: 1000 })
  await attr('string',   COLLECTIONS.LISTINGS, 'Video_URL',      { size: 1000 })
  await attr('string',   COLLECTIONS.LISTINGS, 'Facebook_Video_URL', { size: 1000 })
  await attr('string',   COLLECTIONS.LISTINGS, 'Tiktok_Video_URL',   { size: 1000 })
  await attr('boolean',  COLLECTIONS.LISTINGS, 'featured',       { default: false })
  await attr('enum',     COLLECTIONS.LISTINGS, 'Listing_Mode',   { elements: ['For Sale', 'For Rent'], default: 'For Sale' })
  await attr('integer',  COLLECTIONS.LISTINGS, 'tenant_id',      { default: 1 })
  await wait(1000)

  // ── 2. BROKERS ───────────────────────────────────────────────────────────
  await createCollection(COLLECTIONS.BROKERS, 'brokers')
  await wait(500)
  await attr('string',   COLLECTIONS.BROKERS, 'name',            { required: true, size: 150 })
  await attr('email',    COLLECTIONS.BROKERS, 'email',           { required: true })
  await attr('string',   COLLECTIONS.BROKERS, 'phone',           { size: 20 })
  await attr('enum',     COLLECTIONS.BROKERS, 'status',          { elements: ['Active', 'Inactive', 'Suspended'], default: 'Active' })
  await attr('enum',     COLLECTIONS.BROKERS, 'role',            { elements: ['Broker', 'Agent', 'Admin'], default: 'Broker' })
  await attr('string',   COLLECTIONS.BROKERS, 'license_number',  { size: 50 })
  await wait(1000)

  // ── 3. AGENTS ────────────────────────────────────────────────────────────
  await createCollection(COLLECTIONS.AGENTS, 'agents')
  await wait(500)
  await attr('string',   COLLECTIONS.AGENTS, 'broker_id',        { size: 36 })
  await attr('string',   COLLECTIONS.AGENTS, 'name',             { required: true, size: 150 })
  await attr('email',    COLLECTIONS.AGENTS, 'email',            { required: true })
  await attr('string',   COLLECTIONS.AGENTS, 'phone',            { size: 20 })
  await attr('enum',     COLLECTIONS.AGENTS, 'status',           { elements: ['Active', 'Inactive', 'Suspended'], default: 'Active' })
  await attr('string',   COLLECTIONS.AGENTS, 'license_number',   { size: 50 })
  await attr('url',      COLLECTIONS.AGENTS, 'profile_photo')
  await attr('string',   COLLECTIONS.AGENTS, 'bio',              { size: 1000 })
  await attr('string',   COLLECTIONS.AGENTS, 'specialization',   { size: 255 })
  await wait(1000)

  // ── 4. LEADS ─────────────────────────────────────────────────────────────
  await createCollection(COLLECTIONS.LEADS, 'leads')
  await wait(500)
  await attr('string',   COLLECTIONS.LEADS, 'full_name',         { required: true, size: 100 })
  await attr('string',   COLLECTIONS.LEADS, 'contact_number',    { required: true, size: 20 })
  await attr('email',    COLLECTIONS.LEADS, 'email',             { required: true })
  await attr('string',   COLLECTIONS.LEADS, 'property_of_interest', { size: 200 })
  await attr('string',   COLLECTIONS.LEADS, 'message',           { required: true, size: 1000 })
  await attr('enum',     COLLECTIONS.LEADS, 'status',            { elements: ['new', 'contacted', 'qualified', 'closed', 'spam'], default: 'new' })
  await attr('string',   COLLECTIONS.LEADS, 'notes',             { size: 1000 })
  await wait(1000)

  // ── 5. FACEBOOK POSTS ────────────────────────────────────────────────────
  await createCollection(COLLECTIONS.FACEBOOK_POSTS, 'facebook_posts')
  await wait(500)
  await attr('integer',  COLLECTIONS.FACEBOOK_POSTS, 'property_id')
  await attr('string',   COLLECTIONS.FACEBOOK_POSTS, 'messenger_name', { required: true, size: 150 })
  await attr('string',   COLLECTIONS.FACEBOOK_POSTS, 'location',       { size: 255 })
  await attr('string',   COLLECTIONS.FACEBOOK_POSTS, 'price',          { size: 100 })
  await attr('string',   COLLECTIONS.FACEBOOK_POSTS, 'size',           { size: 100 })
  await attr('url',      COLLECTIONS.FACEBOOK_POSTS, 'facebook_url')
  await attr('url',      COLLECTIONS.FACEBOOK_POSTS, 'messenger_url')
  await wait(1000)

  // ── 6. SOLD PROPERTIES ───────────────────────────────────────────────────
  await createCollection(COLLECTIONS.SOLD_PROPERTIES, 'sold_properties')
  await wait(500)
  await attr('integer',  COLLECTIONS.SOLD_PROPERTIES, 'property_id')
  await attr('string',   COLLECTIONS.SOLD_PROPERTIES, 'property_title',    { required: true, size: 255 })
  await attr('string',   COLLECTIONS.SOLD_PROPERTIES, 'property_location', { size: 255 })
  await attr('float',    COLLECTIONS.SOLD_PROPERTIES, 'sale_price',        { required: true })
  await attr('float',    COLLECTIONS.SOLD_PROPERTIES, 'commission_amount', { required: true })
  await attr('float',    COLLECTIONS.SOLD_PROPERTIES, 'commission_percentage', { default: 3.0 })
  await attr('datetime', COLLECTIONS.SOLD_PROPERTIES, 'date_sold',         { required: true })
  await attr('datetime', COLLECTIONS.SOLD_PROPERTIES, 'date_commission_received')
  await attr('string',   COLLECTIONS.SOLD_PROPERTIES, 'agent_name',        { size: 150 })
  await attr('string',   COLLECTIONS.SOLD_PROPERTIES, 'broker_name',       { size: 150 })
  await attr('enum',     COLLECTIONS.SOLD_PROPERTIES, 'status',            { elements: ['Pending', 'Paid', 'Partial'], default: 'Pending' })
  await attr('string',   COLLECTIONS.SOLD_PROPERTIES, 'notes',             { size: 1000 })
  await wait(1000)

  // ── 7. GALLERY ───────────────────────────────────────────────────────────
  await createCollection(COLLECTIONS.GALLERY, 'gallery')
  await wait(500)
  await attr('string',   COLLECTIONS.GALLERY, 'tenant_id',             { size: 36 })
  await attr('enum',     COLLECTIONS.GALLERY, 'category',              { elements: ['property', 'event', 'general'], default: 'general' })
  await attr('string',   COLLECTIONS.GALLERY, 'title',                 { size: 255 })
  await attr('string',   COLLECTIONS.GALLERY, 'description',           { size: 1000 })
  await attr('string',   COLLECTIONS.GALLERY, 'cloudinary_public_id',  { required: true, size: 255 })
  await attr('url',      COLLECTIONS.GALLERY, 'cloudinary_url',        { required: true })
  await attr('url',      COLLECTIONS.GALLERY, 'cloudinary_secure_url', { required: true })
  await attr('integer',  COLLECTIONS.GALLERY, 'width')
  await attr('integer',  COLLECTIONS.GALLERY, 'height')
  await attr('string',   COLLECTIONS.GALLERY, 'format',                { size: 20 })
  await attr('integer',  COLLECTIONS.GALLERY, 'bytes')
  await attr('integer',  COLLECTIONS.GALLERY, 'listing_id')
  await attr('boolean',  COLLECTIONS.GALLERY, 'is_featured',           { default: false })
  await attr('integer',  COLLECTIONS.GALLERY, 'display_order',         { default: 0 })
  await wait(1000)

  // ── 8. WEBSITE CONTENT ───────────────────────────────────────────────────
  await createCollection(COLLECTIONS.WEBSITE_CONTENT, 'website_content')
  await wait(500)
  await attr('string',   COLLECTIONS.WEBSITE_CONTENT, 'section_key',    { required: true, size: 100 })
  await attr('enum',     COLLECTIONS.WEBSITE_CONTENT, 'content_type',   { elements: ['text', 'html', 'json'], required: true })
  await attr('string',   COLLECTIONS.WEBSITE_CONTENT, 'content_value',  { required: true, size: 10000 })
  await attr('boolean',  COLLECTIONS.WEBSITE_CONTENT, 'is_active',      { default: true })
  await attr('integer',  COLLECTIONS.WEBSITE_CONTENT, 'display_order',  { default: 0 })
  await wait(1000)

  // ── 9. SYSTEM SETTINGS ───────────────────────────────────────────────────
  await createCollection(COLLECTIONS.SYSTEM_SETTINGS, 'system_settings')
  await wait(500)
  await attr('string',   COLLECTIONS.SYSTEM_SETTINGS, 'setting_key',   { required: true, size: 100 })
  await attr('string',   COLLECTIONS.SYSTEM_SETTINGS, 'setting_value', { required: true, size: 10000 })
  await attr('string',   COLLECTIONS.SYSTEM_SETTINGS, 'description',   { size: 500 })
  await attr('boolean',  COLLECTIONS.SYSTEM_SETTINGS, 'is_public',     { default: false })
  await wait(1000)

  // ── 10. SHARED PASSWORDS ─────────────────────────────────────────────────
  await createCollection(COLLECTIONS.SHARED_PASSWORDS, 'shared_passwords')
  await wait(500)
  await attr('string',   COLLECTIONS.SHARED_PASSWORDS, 'password_type', { required: true, size: 50 })
  await attr('string',   COLLECTIONS.SHARED_PASSWORDS, 'password_hash', { required: true, size: 255 })
  await attr('string',   COLLECTIONS.SHARED_PASSWORDS, 'created_by',    { size: 100 })
  await wait(1000)

  console.log('\n=== Migration complete ===')
  console.log('\nCollection IDs to add to your .env:')
  Object.entries(COLLECTIONS).forEach(([k, v]) => {
    console.log(`NEXT_PUBLIC_APPWRITE_COLLECTION_${k}=${v}`)
  })
}

run().catch(console.error)
