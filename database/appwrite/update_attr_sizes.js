const { Client, Databases } = require('node-appwrite')

const client = new Client()
  .setEndpoint('https://sgp.cloud.appwrite.io/v1')
  .setProject('6a531d6800147ceec486')
  .setKey(process.env.APPWRITE_API_KEY)

const db = new Databases(client)
const D = '6a5320eb0027f9aa5823'
const wait = ms => new Promise(r => setTimeout(r, ms))

// v26 SDK signature: (databaseId, collectionId, key, required, xdefault, size)
async function updateStr(key, size) {
  try {
    await db.updateStringAttribute(D, 'listings', key, false, null, size)
    console.log(`✓ ${key} → ${size} chars`)
  } catch (e) {
    console.log(`✗ ${key}: ${e.message}`)
  }
  await wait(600)
}

async function run() {
  await updateStr('Preview_Photo', 2000)
  await updateStr('Map_URL', 2000)
  await updateStr('Video_URL', 2000)
  await updateStr('Facebook_Video_URL', 2000)
  await updateStr('Tiktok_Video_URL', 2000)
  await updateStr('Photos', 2000)
  await updateStr('Notes', 5000)
  await updateStr('Type', 100)
  await updateStr('Location', 500)
  await updateStr('Village', 500)
  await updateStr('Status', 50)
  await updateStr('Listing_Mode', 20)
}

run().catch(console.error)
