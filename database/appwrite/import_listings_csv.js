/**
 * Import converted listings CSV into Appwrite.
 *
 * Usage:
 *   APPWRITE_ENDPOINT=https://sgp.cloud.appwrite.io/v1 \
 *   APPWRITE_PROJECT_ID=6a531d6800147ceec486 \
 *   APPWRITE_DATABASE_ID=6a5320eb0027f9aa5823 \
 *   APPWRITE_API_KEY=<key> \
 *   node database/appwrite/import_listings_csv.js listings_appwrite.csv
 */

const fs = require('fs')
const path = require('path')
const { Client, Databases, ID, Query } = require('node-appwrite')

const endpoint = process.env.APPWRITE_ENDPOINT || 'https://sgp.cloud.appwrite.io/v1'
const projectId = process.env.APPWRITE_PROJECT_ID || '6a531d6800147ceec486'
const databaseId = process.env.APPWRITE_DATABASE_ID || '6a5320eb0027f9aa5823'
const apiKey = process.env.APPWRITE_API_KEY
const collectionId = process.env.APPWRITE_LISTINGS_COLLECTION_ID || 'listings'
const csvPath = process.argv[2] || path.join(__dirname, '..', '..', 'listings_appwrite.csv')

if (!apiKey) {
  console.error('APPWRITE_API_KEY is required')
  process.exit(1)
}

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey)

const db = new Databases(client)

function parseCsv(content) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }

  const pushRow = () => {
    rows.push(row)
    row = []
  }

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i]
    const next = content[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      pushField()
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1
      pushField()
      pushRow()
      continue
    }

    field += char
  }

  if (field.length > 0 || row.length > 0) {
    pushField()
    pushRow()
  }

  const headers = rows.shift().map(h => h.trim())
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])))
}

function toBoolean(value) {
  const s = String(value ?? '').trim().toLowerCase()
  return ['true', '1', 'yes', 't'].includes(s)
}

function toNumber(value) {
  if (value === null || value === undefined || String(value).trim() === '') return null
  const n = Number(String(value).trim())
  return Number.isFinite(n) ? n : null
}

function cleanString(value) {
  if (value === null || value === undefined) return ''
  const s = String(value).trim()
  return s === 'null' ? '' : s
}

function parsePhotosValue(value) {
  const s = cleanString(value)
  if (!s) return []

  return s
    .split(/\s*(?:\||;|,|\n|\r)\s*/)
    .map(item => cleanString(item))
    .filter(Boolean)
}

function normalizePayload(row) {
  const payload = {
    property_id: toNumber(row.property_id),
    Type: cleanString(row.Type),
    Location: cleanString(row.Location),
    Village: cleanString(row.Village),
    Listing_Price: toNumber(row.Listing_Price),
    Lot_Area_sqm: toNumber(row.Lot_Area_sqm),
    Floor_Area_sqm: toNumber(row.Floor_Area_sqm),
    Bedroom: toNumber(row.Bedroom),
    Bathroom: toNumber(row.Bathroom),
    Preview_Photo: cleanString(row.Preview_Photo),
    Photos: parsePhotosValue(row.Photos),
    Title: cleanString(row.Title),
    Financing_options: cleanString(row.Financing_options),
    CGT: cleanString(row.CGT),
    Transfer_Title: cleanString(row.Transfer_Title),
    Description: cleanString(row.Description),
    Notes: cleanString(row.Notes),
    Status: cleanString(row.Status) || 'active',
    Map_URL: cleanString(row.Map_URL),
    Video_URL: cleanString(row.Video_URL),
    Facebook_Video_URL: cleanString(row.Facebook_Video_URL),
    FB_Link: cleanString(row.FB_Link),
    featured: toBoolean(row.featured),
    Listing_Mode: cleanString(row.Listing_Mode) || 'For Sale',
    tenant_id: cleanString(row.tenant_id),
  }

  return payload
}

async function ensureAttribute(key, type, options = {}) {
  try {
    await db.createAttribute(databaseId, collectionId, key, type, { ...options })
    console.log(`Created attribute ${key}`)
  } catch (error) {
    if (String(error?.message || error).includes('already exists') || String(error?.code) === '409') {
      console.log(`Attribute ${key} already exists`)
    } else {
      console.error(`Unable to ensure ${key}:`, error)
    }
  }
}

async function importListings(csvFile) {
  const content = fs.readFileSync(csvFile, 'utf8')
  const rows = parseCsv(content)
  console.log(`Loaded ${rows.length} rows from ${csvFile}`)

  await ensureAttribute('FB_Link', 'string', { size: 2000 })
  await ensureAttribute('Photos', 'string', { size: 2000, array: true })
  await ensureAttribute('Title', 'string', { size: 255 })
  await ensureAttribute('Financing_options', 'string', { size: 255 })
  await ensureAttribute('CGT', 'string', { size: 100 })
  await ensureAttribute('Transfer_Title', 'string', { size: 100 })
  await ensureAttribute('Description', 'string', { size: 5000 })

  let created = 0
  let updated = 0

  for (const row of rows) {
    const payload = normalizePayload(row)
    const propertyId = payload.property_id
    if (!propertyId) continue

    try {
      const existing = await db.listDocuments(databaseId, collectionId, [Query.equal('property_id', propertyId), Query.limit(1)])
      const doc = existing.documents?.[0]
      if (doc) {
        await db.updateDocument(databaseId, collectionId, doc.$id, payload)
        updated += 1
      } else {
        await db.createDocument(databaseId, collectionId, ID.unique(), payload)
        created += 1
      }
    } catch (error) {
      console.error(`Failed for property_id ${propertyId}:`, error)
    }
  }

  console.log(`Import complete. Created ${created} documents, updated ${updated} documents.`)
}

if (require.main === module) {
  importListings(csvPath).catch(error => {
    console.error(error)
    process.exit(1)
  })
}

module.exports = {
  parseCsv,
  parsePhotosValue,
  normalizePayload,
  importListings,
}
