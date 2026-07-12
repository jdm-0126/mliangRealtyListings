/**
 * Appwrite Seed — M. Liang Realty
 * Run AFTER migrate.js has completed.
 *
 * Usage:
 *   APPWRITE_API_KEY=<your_api_key> node database/appwrite/seed.js
 */

const { Client, Databases, ID } = require('node-appwrite')

const client = new Client()
  .setEndpoint('https://sgp.cloud.appwrite.io/v1')
  .setProject('6a531d6800147ceec486')
  .setKey(process.env.APPWRITE_API_KEY)

const db = new Databases(client)
const D = '6a5320eb0027f9aa5823'

async function insert(collId, data) {
  try {
    await db.createDocument(D, collId, ID.unique(), data)
    console.log(`  + ${collId}: ${data.name || data.section_key || data.setting_key || data.password_type || data.full_name || data.property_title || data.messenger_name || ''}`)
  } catch (e) {
    console.error(`  ✗ ${collId}: ${e.message}`)
  }
}

async function run() {
  console.log('\n=== Appwrite Seed: M. Liang Realty ===\n')

  // ── BROKERS ──────────────────────────────────────────────────────────────
  console.log('Brokers:')
  const brokers = [
    { name: 'Maria Santos',    email: 'maria.santos@mliangrealty.com',    phone: '09171234567', status: 'Active', role: 'Broker', license_number: 'PRC-0012345' },
    { name: 'Juan dela Cruz',  email: 'juan.delacruz@mliangrealty.com',   phone: '09181234567', status: 'Active', role: 'Broker', license_number: 'PRC-0012346' },
    { name: 'Ana Reyes',       email: 'ana.reyes@mliangrealty.com',       phone: '09191234567', status: 'Active', role: 'Broker', license_number: 'PRC-0012347' },
    { name: 'Pedro Garcia',    email: 'pedro.garcia@mliangrealty.com',    phone: '09201234567', status: 'Active', role: 'Agent',  license_number: 'PRC-0012348' },
    { name: 'Rosa Martinez',   email: 'rosa.martinez@mliangrealty.com',   phone: '09211234567', status: 'Active', role: 'Agent',  license_number: 'PRC-0012349' },
    { name: 'Carlos Ramos',    email: 'carlos.ramos@mliangrealty.com',    phone: '09221234567', status: 'Active', role: 'Agent',  license_number: 'PRC-0012350' },
    { name: 'Sofia Cruz',      email: 'sofia.cruz@mliangrealty.com',      phone: '09231234567', status: 'Inactive', role: 'Agent', license_number: 'PRC-0012351' },
    { name: 'Miguel Torres',   email: 'miguel.torres@mliangrealty.com',   phone: '09241234567', status: 'Active', role: 'Agent',  license_number: 'PRC-0012352' },
    { name: 'Isabel Santos',   email: 'isabel.santos@mliangrealty.com',   phone: '09271234567', status: 'Active', role: 'Agent',  license_number: 'PRC-0012355' },
    { name: 'Antonio Lopez',   email: 'antonio.lopez@mliangrealty.com',   phone: '09281234567', status: 'Active', role: 'Agent',  license_number: 'PRC-0012356' },
    { name: 'Carmen Reyes',    email: 'carmen.reyes@mliangrealty.com',    phone: '09291234567', status: 'Suspended', role: 'Agent', license_number: 'PRC-0012357' },
    { name: 'Diego Morales',   email: 'diego.morales@mliangrealty.com',   phone: '09301234567', status: 'Active', role: 'Agent',  license_number: 'PRC-0012358' },
    { name: 'Elena Castillo',  email: 'elena.castillo@mliangrealty.com',  phone: '09311234567', status: 'Active', role: 'Agent',  license_number: 'PRC-0012359' },
  ]
  for (const b of brokers) await insert('brokers', b)

  // ── LEADS ─────────────────────────────────────────────────────────────────
  console.log('\nLeads:')
  const leads = [
    { full_name: 'Juan Dela Cruz',  contact_number: '09171234567', email: 'juan.delacruz@example.com', property_of_interest: 'House and Lot in San Fernando', message: 'Good day! I am interested in a 3-bedroom house and lot in San Fernando area. Budget is around 3-4M.', status: 'new' },
    { full_name: 'Maria Santos',    contact_number: '09281234567', email: 'maria.santos@example.com',  property_of_interest: 'Lot Only in Angeles City',       message: 'Looking for a 100-150 sqm lot in Angeles City for future construction. Budget: 2M-3M.', status: 'contacted' },
    { full_name: 'Pedro Reyes',     contact_number: '09391234567', email: 'pedro.reyes@example.com',   property_of_interest: 'Commercial Property near Clark',  message: 'Interested in commercial properties near Clark Freeport Zone for a restaurant business.', status: 'new' },
    { full_name: 'Anna Mendoza',    contact_number: '09451234567', email: 'anna.mendoza@example.com',  property_of_interest: null,                              message: 'Hi! Can you help me find a townhouse in Mabalacat? Budget is 2.5M. Thank you!', status: 'new' },
  ]
  for (const l of leads) await insert('leads', l)

  // ── SOLD PROPERTIES ───────────────────────────────────────────────────────
  console.log('\nSold Properties:')
  const sold = [
    { property_id: 10, property_title: 'Modern 3BR House in San Fernando',  property_location: 'San Fernando, Pampanga',  sale_price: 4500000,  commission_amount: 135000, commission_percentage: 3.0, date_sold: '2024-01-15T00:00:00.000Z', date_commission_received: '2024-01-20T00:00:00.000Z', agent_name: 'Maria Santos',   broker_name: 'Juan Broker', status: 'Paid',    notes: 'Full commission received' },
    { property_id: 15, property_title: 'Commercial Lot 500sqm',             property_location: 'Angeles City, Pampanga', sale_price: 8000000,  commission_amount: 240000, commission_percentage: 3.0, date_sold: '2024-01-22T00:00:00.000Z', date_commission_received: '2024-02-01T00:00:00.000Z', agent_name: 'Pedro Garcia',   broker_name: 'Juan Broker', status: 'Paid',    notes: 'Bank transfer completed' },
    { property_id: 35, property_title: 'Townhouse 2-Storey',                property_location: 'Mabalacat, Pampanga',    sale_price: 3200000,  commission_amount: 96000,  commission_percentage: 3.0, date_sold: '2024-02-18T00:00:00.000Z', date_commission_received: '2024-02-25T00:00:00.000Z', agent_name: 'Carlos Ramos',   broker_name: 'Juan Broker', status: 'Paid',    notes: 'Cash payment' },
    { property_id: 22, property_title: 'Residential Lot in Gated Community',property_location: 'Mexico, Pampanga',       sale_price: 2500000,  commission_amount: 75000,  commission_percentage: 3.0, date_sold: '2024-02-10T00:00:00.000Z', date_commission_received: null,                       agent_name: 'Rosa Martinez',  broker_name: 'Juan Broker', status: 'Pending', notes: 'Buyer completing requirements' },
    { property_id: 42, property_title: 'House and Lot 200sqm',              property_location: 'Porac, Pampanga',        sale_price: 5500000,  commission_amount: 165000, commission_percentage: 3.0, date_sold: '2024-03-05T00:00:00.000Z', date_commission_received: null,                       agent_name: 'Miguel Torres',  broker_name: 'Juan Broker', status: 'Pending', notes: 'Awaiting title transfer' },
    { property_id: 73, property_title: 'Foreclosed Property',               property_location: 'San Fernando, Pampanga', sale_price: 3500000, commission_amount: 105000, commission_percentage: 3.0, date_sold: '2024-02-28T00:00:00.000Z', date_commission_received: '2024-03-10T00:00:00.000Z', agent_name: 'Elena Castillo', broker_name: 'Juan Broker', status: 'Partial', notes: 'Received 50% commission' },
    { property_id: 88, property_title: 'Luxury House 300sqm',               property_location: 'Angeles City, Pampanga', sale_price: 9500000, commission_amount: 285000, commission_percentage: 3.0, date_sold: '2024-03-20T00:00:00.000Z', date_commission_received: null,                       agent_name: 'Maria Santos',   broker_name: 'Juan Broker', status: 'Pending', notes: 'High-value sale' },
  ]
  for (const s of sold) await insert('sold_properties', s)

  // ── WEBSITE CONTENT ───────────────────────────────────────────────────────
  console.log('\nWebsite Content:')
  const content = [
    { section_key: 'hero_title',           content_type: 'text', content_value: 'M. Liang Realty',                                              is_active: true, display_order: 1 },
    { section_key: 'hero_tagline',         content_type: 'text', content_value: 'Your trusted partner for properties in Pampanga',              is_active: true, display_order: 2 },
    { section_key: 'services_intro',       content_type: 'text', content_value: 'What we offer to buyers and investors in Pampanga',            is_active: true, display_order: 3 },
    { section_key: 'service_1_title',      content_type: 'text', content_value: 'Property Sales',                                               is_active: true, display_order: 4 },
    { section_key: 'service_1_description',content_type: 'html', content_value: '<p>We specialize in house and lot sales as well as commercial properties across Pampanga.</p>', is_active: true, display_order: 5 },
    { section_key: 'service_2_title',      content_type: 'text', content_value: 'Rental Properties',                                            is_active: true, display_order: 6 },
    { section_key: 'service_2_description',content_type: 'html', content_value: '<p>Looking for a place to rent in Pampanga? We offer residential rental units in San Fernando and surrounding areas.</p>', is_active: true, display_order: 7 },
    { section_key: 'service_3_title',      content_type: 'text', content_value: 'Lot Sales',                                                    is_active: true, display_order: 8 },
    { section_key: 'service_3_description',content_type: 'html', content_value: '<p>Build the home of your dreams. We offer lot-only properties in prime locations across Pampanga.</p>', is_active: true, display_order: 9 },
    { section_key: 'footer_tagline',       content_type: 'text', content_value: 'Your trusted partner for properties in Pampanga',              is_active: true, display_order: 10 },
  ]
  for (const c of content) await insert('website_content', c)

  // ── SYSTEM SETTINGS ───────────────────────────────────────────────────────
  console.log('\nSystem Settings:')
  const settings = [
    {
      setting_key: 'business_info',
      setting_value: JSON.stringify({ businessName: 'M. Liang Realty', brokerName: 'M. Liang', brokerTitle: 'Licensed Real Estate Broker', prcNumber: '0019653', officeAddress: 'S10, 2nd Floor Plaza Cristina Building, Dolores, City of San Fernando, Pampanga', contactNumber: '09393440944', emailAddress: 'contact@realtyprov1.com' }),
      description: 'Primary business information',
      is_public: true,
    },
    {
      setting_key: 'social_media',
      setting_value: JSON.stringify({ facebook: 'https://facebook.com/mliangRealty', instagram: 'https://instagram.com/mliangRealty', tiktok: '', youtube: '', viber: 'viber://contact?number=09393440944', whatsapp: 'https://wa.me/639393440944' }),
      description: 'Social media profile URLs',
      is_public: true,
    },
    {
      setting_key: 'site_meta',
      setting_value: JSON.stringify({ siteTitle: 'M. Liang Realty – Houses, Lots & Condos in Pampanga', siteDescription: 'Browse house and lot, commercial properties, and lot-only listings in Pampanga.', ogImage: '/og-image.svg', canonicalUrl: 'https://realtyprov1.com' }),
      description: 'SEO and site metadata',
      is_public: true,
    },
    {
      setting_key: 'feature_flags',
      setting_value: JSON.stringify({ enableChatWidget: true, enablePropertySearch: true, enableLeadCapture: true, maintenanceMode: false }),
      description: 'Feature toggles',
      is_public: false,
    },
  ]
  for (const s of settings) await insert('system_settings', s)

  // ── SHARED PASSWORDS ──────────────────────────────────────────────────────
  console.log('\nShared Passwords:')
  const passwords = [
    { password_type: 'agent',      password_hash: 'agentMliangRealty2026',  created_by: 'system' },
    { password_type: 'broker',     password_hash: 'brokerMliangAdmin2026',  created_by: 'system' },
    { password_type: 'superadmin', password_hash: 'EuandaiteD_0126',        created_by: 'system' },
  ]
  for (const p of passwords) await insert('shared_passwords', p)

  // ── SAMPLE LISTINGS ───────────────────────────────────────────────────────
  console.log('\nSample Listings:')
  const listings = [
    { property_id: 1, Type: 'House & Lot', Location: 'San Fernando', Village: 'Villa Mercedes Subdivision', Listing_Price: 3500000, Lot_Area_sqm: 120, Floor_Area_sqm: 80, Bedroom: 3, Bathroom: 2, Notes: 'Beautiful 3-bedroom house and lot in a peaceful subdivision. Near schools, malls, and main roads.', Status: 'active', Preview_Photo: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', featured: false, Listing_Mode: 'For Sale', tenant_id: 1 },
    { property_id: 2, Type: 'Lot Only',    Location: 'Angeles City', Village: 'Clark Residential Area',     Listing_Price: 2800000, Lot_Area_sqm: 150, Floor_Area_sqm: null, Bedroom: null, Bathroom: null, Notes: 'Prime 150 sqm residential lot in Clark area. Clean title, ready for construction.', Status: 'active', Preview_Photo: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800', featured: false, Listing_Mode: 'For Sale', tenant_id: 1 },
    { property_id: 3, Type: 'Commercial',  Location: 'Mabalacat',    Village: 'McArthur Highway',           Listing_Price: 8500000, Lot_Area_sqm: 200, Floor_Area_sqm: 180, Bedroom: null, Bathroom: 2, Notes: 'Commercial building along McArthur Highway. High traffic area, suitable for restaurant or retail.', Status: 'active', Preview_Photo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800', featured: true, Listing_Mode: 'For Sale', tenant_id: 1 },
  ]
  for (const l of listings) await insert('listings', l)

  console.log('\n=== Seed complete ===')
}

run().catch(console.error)
